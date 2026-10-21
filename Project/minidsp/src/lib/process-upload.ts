import { detectSensitiveData } from "./detection.ts";
import { validateUpload, type UploadFileLike } from "./upload-validation.ts";

export async function processUpload(file: UploadFileLike) {
  const validation = await validateUpload(file);
  if (!validation.ok) return validation;

  const result = detectSensitiveData(validation.text);
  return {
    ok: true as const,
    fileName: validation.fileName,
    fileSize: file.size,
    ...result,
  };
}