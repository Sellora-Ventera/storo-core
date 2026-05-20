import * as client from "openid-client";

let _config: client.Configuration | undefined;
let _configPromise: Promise<client.Configuration> | undefined;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export const SSO_ISSUER = process.env.SSO_ISSUER ?? "https://sso.ventera.ai";
export const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID ?? "";
export const SSO_CLIENT_SECRET = process.env.SSO_CLIENT_SECRET ?? "";
export const SSO_REDIRECT_URI =
  process.env.SSO_REDIRECT_URI ?? "http://localhost:3000/auth/sso/callback";
export const SSO_POST_LOGOUT_URI =
  process.env.SSO_POST_LOGOUT_URI ?? "http://localhost:3000/";
export const SSO_SCOPES =
  process.env.SSO_SCOPES ?? "openid profile email phone offline_access realm";

export function isSsoConfigured(): boolean {
  return Boolean(
    process.env.SSO_ISSUER &&
      process.env.SSO_CLIENT_ID &&
      process.env.SSO_REDIRECT_URI &&
      process.env.SSO_STATE_SECRET,
  );
}

export async function getOidcConfig(): Promise<client.Configuration> {
  if (_config) return _config;
  if (_configPromise) return _configPromise;

  const issuer = requireEnv("SSO_ISSUER");
  const clientId = requireEnv("SSO_CLIENT_ID");

  _configPromise = client
    .discovery(new URL(issuer), clientId, SSO_CLIENT_SECRET, undefined, {
      execute: issuer.startsWith("http://") ? [client.allowInsecureRequests] : [],
    })
    .then((cfg) => {
      _config = cfg;
      return cfg;
    })
    .catch((err) => {
      _configPromise = undefined;
      throw err;
    });

  return _configPromise;
}
