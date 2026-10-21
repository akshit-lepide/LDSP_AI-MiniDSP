"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useSession } from "@/app/providers";
import { AppShell } from "@/components/app-shell";
import { FilterDropdown, type DropdownOption } from "@/components/filter-dropdown";
import { toCsv } from "@/lib/csv";
import {
  findingCount,
  findingMask,
  findingType,
  findingTypeLabels,
  formatScanDate,
  riskBadgeVariant,
  scanName,
  type Risk,
} from "@/lib/types";

const typeOptions: readonly DropdownOption[] = [
  { value: "All", label: "All types" },
  { value: "Email", label: "Email address" },
  { value: "UK phone", label: "UK phone number" },
  { value: "UK NINO", label: "UK National Insurance number" },
  { value: "Payment card", label: "Payment card number" },
];

const riskOptions: readonly DropdownOption[] = [
  { value: "All", label: "All risk levels" },
  { value: "Critical", label: "Critical" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export default function FindingsPage() {
  const { scans, scansError } = useSession();
  const [typeFilter, setTypeFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");

  const onTypeChange = useCallback((value: string) => setTypeFilter(value), []);
  const onRiskChange = useCallback((value: string) => setRiskFilter(value), []);

  const rows = scans
    .flatMap((scan) => scan.findings.map((finding) => ({ scan, finding, type: findingType(finding) })))
    .filter(({ finding, type }) => (typeFilter === "All" || type === typeFilter) && (riskFilter === "All" || finding.risk === riskFilter));

  function exportCsv() {
    const content = toCsv([
      ["File name", "Scanned (UTC)", "Finding type", "Risk", "Occurrences", "Masked example"],
      ...rows.map(({ scan, finding, type }) => [
        scanName(scan),
        formatScanDate(scan.created_at),
        findingTypeLabels[type] ?? type,
        finding.risk,
        String(findingCount(finding)),
        findingMask(finding),
      ]),
    ]);

    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "minidsp-findings.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      page="findings"
      title="Findings"
      description="Masked examples from your scans. Original file contents are never stored."
    >
      {scansError && (
        <div className="lp-message lp-message--error" role="alert">
          <div className="lp-message__content">
            <div className="lp-message__text">
              <div className="lp-message__body">{scansError}</div>
            </div>
          </div>
        </div>
      )}

      <section className="lp-card" aria-labelledby="all-findings-title">
        <div className="lp-card__header">
          <div className="lp-card__title" id="all-findings-title">
            All findings
          </div>
          <div className="lp-card__actions findings-toolbar">
            <FilterDropdown label="Finding type" options={typeOptions} onChange={onTypeChange} />
            <FilterDropdown label="Risk level" options={riskOptions} onChange={onRiskChange} />
            <button type="button" className="lp-button lp-button--secondary lp-button--sm" onClick={exportCsv} disabled={rows.length === 0}>
              Export CSV
            </button>
          </div>
        </div>
        <div className="lp-card__body">
          <p className="findings-count" aria-live="polite">
            {rows.length} finding{rows.length === 1 ? "" : "s"}.
          </p>

          {rows.length === 0 ? (
            <div className="lp-empty-state">
              <span className="lp-empty-state__illustration" aria-hidden="true">
                <svg width="120" height="70" viewBox="0 0 120 70" fill="none" stroke="var(--color-border-strong)" strokeWidth="2">
                  <rect x="20" y="10" width="80" height="22" rx="4" />
                  <rect x="20" y="38" width="80" height="22" rx="4" />
                  <circle cx="32" cy="21" r="3" />
                  <circle cx="32" cy="49" r="3" />
                  <path d="M44 21h32M44 49h20" />
                </svg>
              </span>
              <p className="lp-empty-state__message">
                {scans.length === 0
                  ? "No scans yet. Upload a synthetic file to generate findings."
                  : "No findings match these filters. Choose a different type or risk level."}
              </p>
              {scans.length === 0 && (
                <div className="lp-empty-state__action">
                  <Link className="lp-button lp-button--primary lp-button--md" href="/upload">
                    Upload and scan
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="lp-table">
              <table className="lp-table__table">
                <caption className="visually-hidden">Masked findings from your scans</caption>
                <thead>
                  <tr>
                    {["File", "Scanned", "Type", "Risk", "Occurrences", "Masked example"].map((header) => (
                      <th className="lp-table__th" scope="col" key={header}>
                        <div className="lp-table__header-inner">
                          <span className="lp-table__header-label">{header}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ scan, finding, type }, index) => (
                    <tr key={finding.id ?? `${scan.id}-${type}-${index}`}>
                      <td className="lp-table__td">
                        <div className="lp-table__cell-inner">
                          <span className="lp-table__cell-text">{scanName(scan)}</span>
                        </div>
                      </td>
                      <td className="lp-table__td">
                        <div className="lp-table__cell-inner">
                          <span className="lp-table__cell-text">{formatScanDate(scan.created_at)}</span>
                        </div>
                      </td>
                      <td className="lp-table__td">
                        <div className="lp-table__cell-inner">
                          <span className="lp-table__cell-text">{findingTypeLabels[type] ?? type}</span>
                        </div>
                      </td>
                      <td className="lp-table__td">
                        <div className="lp-table__cell-inner">
                          <span className={`lp-badge lp-badge--${riskBadgeVariant[finding.risk as Risk]}`}>{finding.risk}</span>
                        </div>
                      </td>
                      <td className="lp-table__td">
                        <div className="lp-table__cell-inner">
                          <span className="lp-table__cell-text">{findingCount(finding)}</span>
                        </div>
                      </td>
                      <td className="lp-table__td">
                        <div className="lp-table__cell-inner">
                          <span className="lp-table__cell-text masked-cell">{findingMask(finding)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
