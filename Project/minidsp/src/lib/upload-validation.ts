export const MAX_UPLOAD_BYTES = 1_048_576;

export interface UploadFileLike {
  name: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type UploadValidation =
  | { ok: true; fileName: string; text: string }
  | { ok: false; status: 400 | 413 | 415; error: string };

const binaryControlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export async function validateUpload(file: UploadFileLike): Promise<UploadValidation> {
  const fileName = file.name.split(/[\\/]/).pop()?.slice(0, 255) ?? "";
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

  if (extension !== ".csv" && extension !== ".txt") {
    return { ok: false, status: 415, error: "Upload a CSV or TXT file." };
  }

  if (file.size === 0) {
    return { ok: false, status: 400, error: "The uploaded file is empty." };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, status: 413, error: "The file must be 1 MiB or smaller." };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength === 0) {
      return { ok: false, status: 400, error: "The uploaded file is empty." };
    }
    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      return { ok: false, status: 413, error: "The file must be 1 MiB or smaller." };
    }

    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (binaryControlCharacters.test(text)) {
      return { ok: false, status: 400, error: "The file must be valid UTF-8 text." };
    }

    return { ok: true, fileName, text };
  } catch {
    return { ok: false, status: 400, error: "The file must be valid UTF-8 text." };
  }
}