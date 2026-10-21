"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useSession } from "@/app/providers";
import { AppShell } from "@/components/app-shell";

export default function UploadPage() {
  const { scanFile } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ risk: string; fileName: string } | null>(null);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setError("");
    setResult(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await scanFile(file));
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The file could not be scanned.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      page="upload"
      title="Upload and scan"
      description="Upload one synthetic CSV or TXT file, up to 1 MiB. File contents are never stored."
    >
      <section className="lp-card" aria-labelledby="choose-file-title">
        <div className="lp-card__header">
          <div className="lp-card__title" id="choose-file-title">
            Choose a file
          </div>
          <div className="lp-card__actions">
            <span className="lp-badge lp-badge--default">CSV or TXT · Max 1 MiB</span>
          </div>
        </div>
        <div className="lp-card__body">
          <form className="upload-form" onSubmit={submit}>
            <div className="upload-row">
              <button
                type="button"
                className="lp-button lp-button--secondary lp-button--md"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                Choose file
              </button>
              <span className="upload-filename">{file ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB` : "No file chosen"}</span>
              <input
                ref={inputRef}
                id="scan-file"
                className="visually-hidden"
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={onFileChange}
              />
            </div>

            <button className="lp-button lp-button--primary lp-button--md" disabled={busy || !file}>
              {busy ? "Scanning…" : "Upload and scan"}
            </button>
          </form>
        </div>
      </section>

      {error && (
        <div className="lp-message lp-message--error" role="alert">
          <div className="lp-message__content">
            <div className="lp-message__text">
              <div className="lp-message__title">Scan failed</div>
              <div className="lp-message__body">{error}</div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="lp-message lp-message--success" role="status">
          <div className="lp-message__content">
            <div className="lp-message__text">
              <div className="lp-message__title">Scan complete</div>
              <div className="lp-message__body">
                {result.fileName} was classified <strong>{result.risk}</strong>. Only masked examples were saved.
              </div>
            </div>
            <div className="lp-message__actions">
              <Link className="lp-button lp-button--secondary lp-button--sm" href="/findings">
                View findings
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className="lp-card" aria-labelledby="what-we-detect-title">
        <div className="lp-card__header">
          <div className="lp-card__title" id="what-we-detect-title">
            What MiniDSP detects
          </div>
        </div>
        <div className="lp-card__body">
          <div className="lp-table">
            <table className="lp-table__table">
              <caption className="visually-hidden">Detector types and their risk levels</caption>
              <thead>
                <tr>
                  {["Finding type", "Risk", "Masked example"].map((header) => (
                    <th className="lp-table__th" scope="col" key={header}>
                      <div className="lp-table__header-inner">
                        <span className="lp-table__header-label">{header}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { type: "Email address", risk: "Low", variant: "default", example: "a***@example.test" },
                  { type: "UK phone number", risk: "Medium", variant: "warning", example: "07******123" },
                  { type: "UK National Insurance number", risk: "High", variant: "error", example: "AB******C" },
                  { type: "Payment card number", risk: "Critical", variant: "error", example: "************1111" },
                ].map((row) => (
                  <tr key={row.type}>
                    <td className="lp-table__td">
                      <div className="lp-table__cell-inner">
                        <span className="lp-table__cell-text">{row.type}</span>
                      </div>
                    </td>
                    <td className="lp-table__td">
                      <div className="lp-table__cell-inner">
                        <span className={`lp-badge lp-badge--${row.variant}`}>{row.risk}</span>
                      </div>
                    </td>
                    <td className="lp-table__td">
                      <div className="lp-table__cell-inner">
                        <span className="lp-table__cell-text masked-cell">{row.example}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
