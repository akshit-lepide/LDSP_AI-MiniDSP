import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env.ts";

type AuthenticatedClientResult =
  | { client: SupabaseClient; response?: never }
  | { client?: never; response: Response };

export async function createAuthenticatedSupabaseClient(
  request: Request,
): Promise<AuthenticatedClientResult> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if (!token) {
    return {
      response: Response.json(
        { error: "Sign in to continue." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      ),
    };
  }

  const env = getSupabaseEnv();
  if (!env) {
    return {
      response: Response.json(
        { error: "Scanning is not configured." },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      ),
    };
  }

  const client = createSupabaseClient(env.url, env.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  const { data, error } = await client.auth.getClaims(token);
  if (error || typeof data?.claims.sub !== "string") {
    return {
      response: Response.json(
        {
          error: "Your sign-in session could not be verified. Sign in again.",
          authCode: error?.code ?? null,
          authStatus: error?.status ?? null,
        },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      ),
    };
  }

  return { client };
}