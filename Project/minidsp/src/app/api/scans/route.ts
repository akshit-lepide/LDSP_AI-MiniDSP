import { createAuthenticatedSupabaseClient } from "../../../lib/supabase/api.ts";

export async function GET(request: Request): Promise<Response> {
  const auth = await createAuthenticatedSupabaseClient(request);
  if (auth.response) return auth.response;
  const { client: supabase } = auth;

  const { data, error } = await supabase
    .from("scans")
    .select("id, file_name, file_size, risk, created_at, findings(id, finding_type, risk, occurrence_count, masked_example)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return Response.json({ error: "Scan history could not be loaded." }, { status: 500 });
  }

  return Response.json({ scans: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}