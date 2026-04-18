import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  addDomain,
  createProject,
  deleteProject,
  getDeploymentStatus,
  getProjectDomain,
  setEnvVars,
  triggerDeployment,
  verifyProjectDomain,
  VercelApiError,
  type DomainVerificationChallenge,
  type EnvVarInput,
} from "@/lib/integrations/vercel";
import {
  createDnsRecord,
  deleteDnsRecord,
  findDnsRecordByName,
  CloudflareApiError,
} from "@/lib/integrations/cloudflare";
import {
  seedTemplatePreviewData,
  unseedTemplatePreviewData,
} from "@/lib/template-seeder";
import { uploadTemplateScreenshot } from "@/lib/integrations/screenshot";

/**
 * End-to-end orchestrator for template preview deployment lifecycle.
 *
 * Flow (deployTemplate):
 *  1. Seed dummy data → stores.id (UUID) untuk STORE_ID env
 *  2. Vercel: create project linked to storoengine repo
 *  3. Vercel: set env vars (STORE_ID + Supabase keys)
 *  4. Cloudflare: create CNAME {slug}.preview.storo.id → cname.vercel-dns.com
 *  5. Vercel: add domain to project
 *  6. Vercel: trigger deployment
 *  7. Mark deploy_status='deploying'; UI polls status separately.
 */

const PREVIEW_DOMAIN_SUFFIX =
  process.env.PREVIEW_DOMAIN_SUFFIX || "preview.storo.id";
const STOROENGINE_REPO =
  process.env.STOROENGINE_REPO || "PTVENTERA-AI/storoengine";

interface TemplateRow {
  id: string;
  slug: string;
  name: string;
  source_repo: string;
  source_branch: string;
  vercel_project_id: string | null;
  vercel_deployment_id: string | null;
  cloudflare_dns_record_id: string | null;
  cloudflare_txt_record_id: string | null;
  preview_store_id: string | null;
  deploy_status: string;
}

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function logStep(
  supabase: SupabaseClient,
  templateId: string,
  action: string,
  status: "started" | "success" | "failed" | "skipped",
  step?: string,
  data?: { vercel?: unknown; cloudflare?: unknown; error?: string },
) {
  await supabase.from("template_deployment_logs").insert({
    template_id: templateId,
    action,
    status,
    step,
    vercel_response: data?.vercel ?? null,
    cloudflare_response: data?.cloudflare ?? null,
    error_message: data?.error ?? null,
  });
}

function buildPreviewDomain(slug: string): string {
  return `${slug}.${PREVIEW_DOMAIN_SUFFIX}`;
}

function buildVercelProjectName(slug: string): string {
  // Vercel project name: lowercase alphanumeric + dashes, max 100 chars
  return `storo-preview-${slug}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 100);
}

function getStoroengineEnvVars(storeId: string): EnvVarInput[] {
  return [
    { key: "STORE_ID", value: storeId },
    { key: "NEXT_PUBLIC_STORE_ID", value: storeId },
    {
      key: "NEXT_PUBLIC_STORE_NAME",
      value: "Preview Demo",
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      value: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      value: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    { key: "PAYMENT_PROVIDER", value: "midtrans" },
  ];
}

/**
 * Update template row, ignoring concurrent updates (best effort).
 */
async function updateTemplate(
  supabase: SupabaseClient,
  templateId: string,
  patch: Partial<TemplateRow> & {
    deploy_status?: string;
    deploy_error?: string | null;
    demo_url?: string;
    deployed_at?: string;
    preview_image_url?: string;
  },
): Promise<void> {
  await supabase.from("templates").update(patch).eq("id", templateId);
}

async function getTemplate(
  supabase: SupabaseClient,
  templateId: string,
): Promise<TemplateRow | null> {
  const { data } = await supabase
    .from("templates")
    .select(
      "id, slug, name, source_repo, source_branch, vercel_project_id, vercel_deployment_id, cloudflare_dns_record_id, cloudflare_txt_record_id, preview_store_id, deploy_status",
    )
    .eq("id", templateId)
    .maybeSingle();
  return data as TemplateRow | null;
}

/**
 * Trigger full deployment for a template. Idempotent: if Vercel project / DNS
 * already exist (from a previous failed attempt), reuse them.
 *
 * Designed to be called fire-and-forget. Errors are caught and persisted to
 * the template row + log table so the UI polling can surface them.
 */
export async function deployTemplate(templateId: string): Promise<void> {
  const supabase = getServiceClient();

  const template = await getTemplate(supabase, templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  await updateTemplate(supabase, templateId, {
    deploy_status: "deploying",
    deploy_error: null,
  });
  // Clear previous deployment logs for a fresh timeline
  await supabase.from("template_deployment_logs").delete().eq("template_id", templateId);
  await logStep(supabase, templateId, "deploy", "started");

  const slug = template.slug;
  const projectName = buildVercelProjectName(slug);
  const previewDomain = buildPreviewDomain(slug);
  const repo = template.source_repo || STOROENGINE_REPO;
  const branch = template.source_branch || "main";

  try {
    // STEP 1 — Seed dummy data
    let previewStoreId = template.preview_store_id;
    if (!previewStoreId) {
      const seed = await seedTemplatePreviewData(slug);
      previewStoreId = seed.storeId;
      await updateTemplate(supabase, templateId, { preview_store_id: previewStoreId });
      await logStep(supabase, templateId, "seed", "success", "seed", {
        vercel: { storeId: previewStoreId, ...seed },
      });
    } else {
      await logStep(supabase, templateId, "seed", "skipped", "seed");
    }

    // STEP 2 — Vercel create project (idempotent)
    let vercelProjectId = template.vercel_project_id;
    if (!vercelProjectId) {
      const project = await createProject({
        name: projectName,
        gitRepo: repo,
        gitBranch: branch,
      });
      vercelProjectId = project.id;
      await updateTemplate(supabase, templateId, { vercel_project_id: vercelProjectId });
      await logStep(supabase, templateId, "deploy", "success", "vercel_create_project", {
        vercel: project,
      });
    } else {
      await logStep(supabase, templateId, "deploy", "skipped", "vercel_create_project");
    }

    // STEP 3 — Vercel set env vars
    await setEnvVars(vercelProjectId, getStoroengineEnvVars(previewStoreId));
    await logStep(supabase, templateId, "deploy", "success", "vercel_set_env");

    // STEP 4 — Cloudflare DNS (idempotent)
    let dnsRecordId = template.cloudflare_dns_record_id;
    if (!dnsRecordId) {
      const existing = await findDnsRecordByName(previewDomain);
      if (existing) {
        dnsRecordId = existing.id;
      } else {
        const record = await createDnsRecord({
          name: previewDomain,
          content: "cname.vercel-dns.com",
          type: "CNAME",
          proxied: false,
        });
        dnsRecordId = record.id;
        await logStep(supabase, templateId, "deploy", "success", "cloudflare_dns", {
          cloudflare: record,
        });
      }
      await updateTemplate(supabase, templateId, { cloudflare_dns_record_id: dnsRecordId });
    } else {
      await logStep(supabase, templateId, "deploy", "skipped", "cloudflare_dns");
    }

    // STEP 5 — Vercel add domain + handle verification challenges automatically
    let verificationChallenges: DomainVerificationChallenge[] = [];
    try {
      const domainResult = await addDomain(vercelProjectId, previewDomain);
      verificationChallenges = domainResult.verification ?? [];
      await logStep(supabase, templateId, "deploy", "success", "vercel_add_domain", {
        vercel: {
          verified: domainResult.verified,
          challengeCount: verificationChallenges.length,
        },
      });
    } catch (err) {
      // Domain already added → fetch current state to get verification info
      if (err instanceof VercelApiError && err.status === 409) {
        try {
          const existing = await getProjectDomain(vercelProjectId, previewDomain);
          verificationChallenges = existing.verification ?? [];
          await logStep(
            supabase,
            templateId,
            "deploy",
            "skipped",
            "vercel_add_domain",
            {
              vercel: {
                verified: existing.verified,
                challengeCount: verificationChallenges.length,
              },
            },
          );
        } catch (fetchErr) {
          await logStep(supabase, templateId, "deploy", "skipped", "vercel_add_domain", {
            error: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
          });
        }
      } else {
        throw err;
      }
    }

    // STEP 5b — Fulfill verification challenges (TXT records in Cloudflare)
    if (verificationChallenges.length > 0) {
      let txtRecordId = template.cloudflare_txt_record_id;
      for (const challenge of verificationChallenges) {
        if (challenge.type !== "TXT") continue;
        // Idempotency: check if record already exists
        const existing = await findDnsRecordByName(challenge.domain);
        if (!existing) {
          const txtRecord = await createDnsRecord({
            name: challenge.domain,
            content: challenge.value,
            type: "TXT",
            proxied: false,
          });
          txtRecordId = txtRecord.id;
          await logStep(supabase, templateId, "deploy", "success", "cloudflare_txt", {
            cloudflare: txtRecord,
          });
        } else {
          txtRecordId = existing.id;
          await logStep(supabase, templateId, "deploy", "skipped", "cloudflare_txt");
        }
      }
      if (txtRecordId) {
        await updateTemplate(supabase, templateId, {
          cloudflare_txt_record_id: txtRecordId,
        });
      }

      // Verify with retry — DNS needs ~5-15s to propagate before Vercel can see the TXT
      const VERIFY_RETRIES = 5;
      const VERIFY_DELAY_MS = 5000;
      let verified = false;
      let lastError: string | null = null;

      for (let attempt = 1; attempt <= VERIFY_RETRIES; attempt++) {
        await new Promise((r) => setTimeout(r, VERIFY_DELAY_MS));
        try {
          const result = await verifyProjectDomain(vercelProjectId, previewDomain);
          if (result.verified) {
            verified = true;
            await logStep(
              supabase,
              templateId,
              "deploy",
              "success",
              "vercel_verify_domain",
              { vercel: { verified: true, attempts: attempt } },
            );
            break;
          }
          lastError = `Still pending after attempt ${attempt}/${VERIFY_RETRIES}`;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }

      if (!verified) {
        // Non-fatal: Vercel will auto-verify in the background; deployment can still proceed
        await logStep(
          supabase,
          templateId,
          "deploy",
          "skipped",
          "vercel_verify_domain",
          { error: lastError || "Verification still pending; Vercel will auto-retry" },
        );
      }
    }

    // STEP 6 — Trigger deployment
    const deployment = await triggerDeployment(vercelProjectId, projectName, branch, repo);
    await updateTemplate(supabase, templateId, {
      vercel_deployment_id: deployment.id,
    });
    await logStep(supabase, templateId, "deploy", "success", "vercel_trigger_deployment", {
      vercel: deployment,
    });

    // Status remains 'deploying' — UI polls /status to flip to 'live' when READY
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await updateTemplate(supabase, templateId, {
      deploy_status: "failed",
      deploy_error: message,
    });
    await logStep(supabase, templateId, "deploy", "failed", undefined, { error: message });
  }
}

/**
 * Poll Vercel for current deployment state, update DB, return latest status.
 * Called from /api/superadmin/templates/[id]/status by client polling.
 */
export async function pollDeploymentStatus(templateId: string): Promise<TemplateRow | null> {
  const supabase = getServiceClient();
  const template = await getTemplate(supabase, templateId);
  if (!template) return null;

  // Only poll if currently deploying
  if (template.deploy_status !== "deploying" || !template.vercel_deployment_id) {
    return template;
  }

  try {
    const status = await getDeploymentStatus(template.vercel_deployment_id);
    // Vercel returns readyState as the authoritative status field.
    // Some older endpoints use `state`, fall back for safety.
    const vercelState = status.readyState || status.state;

    if (vercelState === "READY") {
      const demoUrl = `https://${buildPreviewDomain(template.slug)}`;

      let previewImageUrl: string | null = null;
      try {
        previewImageUrl = await uploadTemplateScreenshot(supabase, template.slug, demoUrl);
        await logStep(supabase, templateId, "status_check", "success", "screenshot", {
          vercel: { preview_image_url: previewImageUrl },
        });
      } catch (err) {
        await logStep(supabase, templateId, "status_check", "failed", "screenshot", {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      await updateTemplate(supabase, templateId, {
        deploy_status: "live",
        demo_url: demoUrl,
        deployed_at: new Date().toISOString(),
        ...(previewImageUrl ? { preview_image_url: previewImageUrl } : {}),
      });
      await logStep(supabase, templateId, "status_check", "success", "vercel_ready", {
        vercel: { id: status.id, state: vercelState, url: status.url },
      });
      return await getTemplate(supabase, templateId);
    }

    if (vercelState === "ERROR" || vercelState === "CANCELED") {
      await updateTemplate(supabase, templateId, {
        deploy_status: "failed",
        deploy_error: status.errorMessage || `Deployment ${vercelState.toLowerCase()}`,
      });
      await logStep(supabase, templateId, "status_check", "failed", "vercel_error", {
        vercel: { id: status.id, state: vercelState },
        error: status.errorMessage,
      });
      return await getTemplate(supabase, templateId);
    }

    // Still building — no DB change
    return template;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logStep(supabase, templateId, "status_check", "failed", undefined, { error: message });
    return template;
  }
}

/**
 * Trigger a new deployment for an existing project (no project create / DNS change).
 */
export async function redeployTemplate(
  templateId: string,
  newBranch?: string,
): Promise<void> {
  const supabase = getServiceClient();
  const template = await getTemplate(supabase, templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);
  if (!template.vercel_project_id) {
    throw new Error("Template has no Vercel project — run initial deploy first");
  }

  const branch = newBranch || template.source_branch || "main";

  await updateTemplate(supabase, templateId, {
    deploy_status: "deploying",
    deploy_error: null,
    source_branch: branch,
  });
  // Clear previous deployment logs for a fresh timeline
  await supabase.from("template_deployment_logs").delete().eq("template_id", templateId);
  await logStep(supabase, templateId, "redeploy", "started", undefined, {
    vercel: { branch },
  });

  try {
    const projectName = buildVercelProjectName(template.slug);
    const repo = template.source_repo || STOROENGINE_REPO;
    const previewDomain = buildPreviewDomain(template.slug);

    // STEP A — Upsert Cloudflare CNAME (recreate if missing)
    let dnsRecordId = template.cloudflare_dns_record_id;
    const existingCname = await findDnsRecordByName(previewDomain);
    if (existingCname) {
      dnsRecordId = existingCname.id;
      if (template.cloudflare_dns_record_id !== existingCname.id) {
        await updateTemplate(supabase, templateId, {
          cloudflare_dns_record_id: existingCname.id,
        });
      }
      await logStep(supabase, templateId, "redeploy", "skipped", "cloudflare_dns");
    } else {
      const record = await createDnsRecord({
        name: previewDomain,
        content: "cname.vercel-dns.com",
        type: "CNAME",
        proxied: false,
      });
      dnsRecordId = record.id;
      await updateTemplate(supabase, templateId, {
        cloudflare_dns_record_id: dnsRecordId,
      });
      await logStep(supabase, templateId, "redeploy", "success", "cloudflare_dns", {
        cloudflare: record,
      });
    }

    // STEP B — Ensure domain is added to Vercel project + handle verification
    let verificationChallenges: DomainVerificationChallenge[] = [];
    try {
      const domainResult = await addDomain(template.vercel_project_id, previewDomain);
      verificationChallenges = domainResult.verification ?? [];
      await logStep(supabase, templateId, "redeploy", "success", "vercel_add_domain", {
        vercel: {
          verified: domainResult.verified,
          challengeCount: verificationChallenges.length,
        },
      });
    } catch (err) {
      if (err instanceof VercelApiError && err.status === 409) {
        // Already added — fetch state
        try {
          const existing = await getProjectDomain(template.vercel_project_id, previewDomain);
          verificationChallenges = existing.verification ?? [];
          await logStep(supabase, templateId, "redeploy", "skipped", "vercel_add_domain", {
            vercel: { verified: existing.verified, challengeCount: verificationChallenges.length },
          });
        } catch {
          await logStep(supabase, templateId, "redeploy", "skipped", "vercel_add_domain");
        }
      } else {
        throw err;
      }
    }

    // STEP C — Upsert TXT record + retry verify if needed
    if (verificationChallenges.length > 0) {
      let txtRecordId = template.cloudflare_txt_record_id;
      for (const challenge of verificationChallenges) {
        if (challenge.type !== "TXT") continue;
        const existingTxt = await findDnsRecordByName(challenge.domain);
        if (existingTxt && existingTxt.content === challenge.value) {
          txtRecordId = existingTxt.id;
          await logStep(supabase, templateId, "redeploy", "skipped", "cloudflare_txt");
        } else {
          if (existingTxt) {
            // Stale value — delete first
            await deleteDnsRecord(existingTxt.id).catch(() => null);
          }
          const txtRecord = await createDnsRecord({
            name: challenge.domain,
            content: challenge.value,
            type: "TXT",
            proxied: false,
          });
          txtRecordId = txtRecord.id;
          await logStep(supabase, templateId, "redeploy", "success", "cloudflare_txt", {
            cloudflare: txtRecord,
          });
        }
      }
      if (txtRecordId) {
        await updateTemplate(supabase, templateId, {
          cloudflare_txt_record_id: txtRecordId,
        });
      }

      // Retry verify with delay (DNS propagation)
      const VERIFY_RETRIES = 5;
      const VERIFY_DELAY_MS = 5000;
      let verified = false;
      let lastError: string | null = null;
      for (let attempt = 1; attempt <= VERIFY_RETRIES; attempt++) {
        await new Promise((r) => setTimeout(r, VERIFY_DELAY_MS));
        try {
          const result = await verifyProjectDomain(template.vercel_project_id, previewDomain);
          if (result.verified) {
            verified = true;
            await logStep(
              supabase,
              templateId,
              "redeploy",
              "success",
              "vercel_verify_domain",
              { vercel: { verified: true, attempts: attempt } },
            );
            break;
          }
          lastError = `Still pending after attempt ${attempt}/${VERIFY_RETRIES}`;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
      if (!verified) {
        await logStep(supabase, templateId, "redeploy", "skipped", "vercel_verify_domain", {
          error: lastError || "Vercel will auto-retry verification",
        });
      }
    }

    // STEP D — Trigger new deployment
    const deployment = await triggerDeployment(
      template.vercel_project_id,
      projectName,
      branch,
      repo,
    );
    await updateTemplate(supabase, templateId, {
      vercel_deployment_id: deployment.id,
    });
    await logStep(supabase, templateId, "redeploy", "success", "vercel_trigger", {
      vercel: deployment,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await updateTemplate(supabase, templateId, {
      deploy_status: "failed",
      deploy_error: message,
    });
    await logStep(supabase, templateId, "redeploy", "failed", undefined, { error: message });
  }
}

/**
 * Tear down everything: Vercel project, DNS record, dummy data, soft-mark template archived.
 */
export async function takedownTemplate(templateId: string): Promise<void> {
  const supabase = getServiceClient();
  const template = await getTemplate(supabase, templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  await updateTemplate(supabase, templateId, {
    deploy_status: "taking_down",
    deploy_error: null,
  });
  await logStep(supabase, templateId, "takedown", "started");

  const errors: string[] = [];

  // 1. Vercel delete
  if (template.vercel_project_id) {
    try {
      await deleteProject(template.vercel_project_id);
      await logStep(supabase, templateId, "takedown", "success", "vercel_delete_project");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Vercel delete failed";
      errors.push(`Vercel: ${message}`);
      await logStep(supabase, templateId, "takedown", "failed", "vercel_delete_project", {
        error: message,
      });
    }
  }

  // 2. Cloudflare DNS delete (CNAME)
  if (template.cloudflare_dns_record_id) {
    try {
      await deleteDnsRecord(template.cloudflare_dns_record_id);
      await logStep(supabase, templateId, "takedown", "success", "cloudflare_delete_dns");
    } catch (err) {
      const message =
        err instanceof CloudflareApiError ? err.message : "Cloudflare delete failed";
      errors.push(`Cloudflare: ${message}`);
      await logStep(supabase, templateId, "takedown", "failed", "cloudflare_delete_dns", {
        error: message,
      });
    }
  }

  // 2b. Cloudflare TXT record delete (Vercel verification)
  if (template.cloudflare_txt_record_id) {
    try {
      await deleteDnsRecord(template.cloudflare_txt_record_id);
      await logStep(supabase, templateId, "takedown", "success", "cloudflare_delete_txt");
    } catch (err) {
      const message =
        err instanceof CloudflareApiError ? err.message : "Cloudflare TXT delete failed";
      errors.push(`Cloudflare TXT: ${message}`);
      await logStep(supabase, templateId, "takedown", "failed", "cloudflare_delete_txt", {
        error: message,
      });
    }
  }

  // 3. Unseed dummy data
  try {
    await unseedTemplatePreviewData(template.slug);
    await logStep(supabase, templateId, "unseed", "success");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unseed failed";
    errors.push(`Unseed: ${message}`);
    await logStep(supabase, templateId, "unseed", "failed", undefined, { error: message });
  }

  // 4. Delete template row
  await supabase.from("templates").delete().eq("id", templateId);

  if (errors.length > 0) {
    throw new Error(`Takedown completed with errors: ${errors.join("; ")}`);
  }
}
