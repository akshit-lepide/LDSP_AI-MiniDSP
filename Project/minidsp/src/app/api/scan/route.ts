import { createAuthenticatedSupabaseClient } from "../../../lib/supabase/api.ts";
import { processUpload } from "../../../lib/process-upload.ts";
import { MAX_UPLOAD_BYTES } from "../../../lib/upload-validation.ts";

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES + 65_536) {
    return Response.json({ error: "The file must be 1 MiB or smaller." }, { status: 413 });
  }

  const auth = await createAuthenticatedSupabaseClient(request);
  if (auth.response) return auth.response;
  const { client: supabase } = auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Upload a CSV or TXT file." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose a file to scan." }, { status: 400 });
  }

  const scan = await processUpload(file);
  if (!scan.ok) {
    return Response.json({ error: scan.error }, { status: scan.status });
  }

  const { data: scanId, error: saveError } = await supabase.rpc("create_scan_with_findings", {
    p_file_name: scan.fileName,
    p_file_size: scan.fileSize,
    p_risk: scan.risk,
    p_findings: scan.findings.map((finding) => ({
      finding_type: finding.type,
      risk: finding.risk,
      occurrence_count: finding.count,
      masked_example: finding.maskedExample,
    })),
  });

  if (saveError || !scanId) {
    return Response.json({ error: "The scan could not be saved." }, { status: 500 });
  }

  return Response.json({ id: scanId, ...scan }, { headers: { "Cache-Control": "private, no-store" } });
}