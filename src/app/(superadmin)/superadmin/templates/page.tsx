"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import TemplateCard, {
  type TemplateCardData,
} from "@/components/superadmin/TemplateCard";
import TemplateDeployModal from "@/components/superadmin/TemplateDeployModal";
import TemplateEditModal from "@/components/superadmin/TemplateEditModal";

// Poll Vercel status endpoint for any deploying template every N ms.
// Separate from Supabase Realtime (which only reflects DB changes).
const VERCEL_POLL_INTERVAL = 4000;

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [trackingTemplateId, setTrackingTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateCardData | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const pollingActiveRef = useRef(false);

  const fetchTemplates = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("templates")
      .select(
        "id, slug, name, display_name, description, category, preview_image_url, demo_url, is_active, deploy_status, deploy_error, price_setup_override, price_monthly_override",
      )
      .order("created_at", { ascending: false });

    if (error) {
      setFeedback({ type: "error", text: error.message });
    } else {
      setTemplates((data ?? []) as TemplateCardData[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Supabase Realtime: subscribe to all DB changes on `templates`
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("templates-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "templates" },
        () => {
          fetchTemplates();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTemplates]);

  // Poll Vercel-side status for any deploying template (forces DB update).
  // Realtime only reflects DB changes; we still need to nudge Vercel to sync.
  useEffect(() => {
    const deployingIds = templates
      .filter(
        (t) => t.deploy_status === "deploying" || t.deploy_status === "taking_down",
      )
      .map((t) => t.id);

    if (deployingIds.length === 0 || pollingActiveRef.current) return;

    pollingActiveRef.current = true;
    const interval = setInterval(async () => {
      await Promise.all(
        deployingIds.map((id) =>
          fetch(`/api/superadmin/templates/${id}/status`).catch(() => null),
        ),
      );
      // Realtime subscription will pick up the DB changes.
    }, VERCEL_POLL_INTERVAL);

    return () => {
      clearInterval(interval);
      pollingActiveRef.current = false;
    };
  }, [templates]);

  const handleToggleActive = async (template: TemplateCardData) => {
    setBusyId(template.id);
    try {
      const res = await fetch(`/api/superadmin/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !template.is_active }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal update" }));
        throw new Error(err.error);
      }
      await fetchTemplates();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal update";
      setFeedback({ type: "error", text: msg });
    } finally {
      setBusyId(null);
    }
  };

  const handleRedeploy = async (template: TemplateCardData) => {
    // First-time deploy OR retry after failure → call /deploy (full idempotent flow)
    if (template.deploy_status === "draft" || template.deploy_status === "failed") {
      setBusyId(template.id);
      try {
        const res = await fetch(`/api/superadmin/templates/${template.id}/deploy`, {
          method: "POST",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Gagal deploy" }));
          throw new Error(err.error);
        }
        // Open modal to track progress
        setTrackingTemplateId(template.id);
        await fetchTemplates();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal deploy";
        setFeedback({ type: "error", text: msg });
      } finally {
        setBusyId(null);
      }
      return;
    }

    const branch = window.prompt(
      "Branch atau tag yang mau di-deploy?",
      "main",
    );
    if (!branch) return;

    setBusyId(template.id);
    try {
      const res = await fetch(`/api/superadmin/templates/${template.id}/redeploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal redeploy" }));
        throw new Error(err.error);
      }
      // Open modal to track redeploy progress
      setTrackingTemplateId(template.id);
      await fetchTemplates();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal redeploy";
      setFeedback({ type: "error", text: msg });
    } finally {
      setBusyId(null);
    }
  };

  const handleTakedown = async (template: TemplateCardData) => {
    if (
      !window.confirm(
        `Hapus template "${template.display_name}"? Vercel project + DNS record + data dummy akan dihapus permanen.`,
      )
    )
      return;
    if (
      !window.confirm(
        "Konfirmasi sekali lagi: tindakan ini TIDAK bisa di-undo. Lanjutkan?",
      )
    )
      return;

    setBusyId(template.id);
    try {
      const res = await fetch(`/api/superadmin/templates/${template.id}/takedown`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal takedown" }));
        throw new Error(err.error);
      }
      setFeedback({ type: "success", text: "Template dihapus." });
      await fetchTemplates();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal takedown";
      setFeedback({ type: "error", text: msg });
    } finally {
      setBusyId(null);
    }
  };

  const handleEdit = (template: TemplateCardData) => {
    setEditingTemplate(template);
  };

  const handleViewLogs = (template: TemplateCardData) => {
    setTrackingTemplateId(template.id);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Gallery</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Kelola template storoengine yang tersedia. Tambah baru = otomatis deploy ke
            Vercel + DNS Cloudflare.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTemplates}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-[#4169df] hover:bg-[#3458c8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Template
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`text-sm px-3 py-2 rounded-lg border ${
            feedback.type === "success"
              ? "bg-green-50 border-green-100 text-green-700"
              : "bg-red-50 border-red-100 text-red-700"
          }`}
        >
          {feedback.text}
          <button
            onClick={() => setFeedback(null)}
            className="ml-2 underline cursor-pointer"
          >
            tutup
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Memuat template...</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500 mb-4">Belum ada template.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-[#4169df] hover:bg-[#3458c8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Template Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t) => (
            <div key={t.id} className={busyId === t.id ? "opacity-60 pointer-events-none" : ""}>
              <TemplateCard
                template={t}
                onEdit={handleEdit}
                onRedeploy={handleRedeploy}
                onTakedown={handleTakedown}
                onToggleActive={handleToggleActive}
                onViewLogs={handleViewLogs}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <TemplateDeployModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          fetchTemplates();
        }}
        onSuccess={fetchTemplates}
      />

      {/* Track redeploy/retry progress modal */}
      <TemplateDeployModal
        open={trackingTemplateId !== null}
        trackTemplateId={trackingTemplateId}
        onClose={() => {
          setTrackingTemplateId(null);
          fetchTemplates();
        }}
        onSuccess={fetchTemplates}
      />

      {/* Edit detail modal */}
      <TemplateEditModal
        open={editingTemplate !== null}
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSaved={fetchTemplates}
      />
    </div>
  );
}
