"use client";

import Link from "next/link";
import { useSession } from "@/app/providers";
import { AppShell } from "@/components/app-shell";
import {
  findingCount,
  formatScanDate,
  riskBadgeVariant,
  riskOrder,
  scanName,
} from "@/lib/types";

export default function DashboardPage() {
  const { scans, scansError } = useSession();

  const totalFindings = scans.reduce(
    (sum, scan) => sum + scan.findings.reduce((inner, finding) => inner + findingCount(finding), 0),
    0,
  );

  const metrics = [
    { label: "Files scanned", value: scans.length, foot: "Completed scans" },
    { label: "Total findings", value: totalFindings, foot: "Aggregated occurrences" },
    { label: "High-risk files", value: scans.filter((scan) => scan.risk === "High").length, foot: "Classified High" },
    { label: "Critical-risk files", value: scans.filter((scan) => scan.risk === "Critical").length, foot: "Classified Critical" },
  ];

  const distribution = riskOrder.map((risk) => {
    const files = scans.filter((scan) => scan.risk === risk).length;
    return { risk, files, share: scans.length === 0 ? 0 : Math.round((files / scans.length) * 100) };
  });

  return (
    <AppShell
      page="dashboard"
      title="Dashboard"
      description="Your scanned files and masked findings. Synthetic training data only."
      actions={
        <Link className="lp-button lp-button--primary lp-button--md" href="/upload">
          Upload and scan
        </Link>
      }
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

      <section className="metric-grid" aria-label="Scan summary">
        {metrics.map((metric) => (
          <article className="lp-card metric-card" key={metric.label}>
            <div className="lp-card__header">
              <div className="lp-card__title">{metric.label}</div>
            </div>
            <div className="lp-card__body">
              <span className="metric-value">{metric.value}</span>
              <span className="metric-foot">{metric.foot}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="lp-card" aria-labelledby="risk-distribution-title">
        <div className="lp-card__header">
          <div className="lp-card__title" id="risk-distribution-title">
            Risk distribution
          </div>
        </div>
        <div className="lp-card__body">
          <div className="lp-table">
            <table className="lp-table__table">
              <caption className="visually-hidden">Share of scanned files by risk level</caption>
              <thead>
                <tr>
                  {["Risk level", "Files", "Share of files"].map((header) => (
                    <th className="lp-table__th" scope="col" key={header}>
                      <div className="lp-table__header-inner">
                        <span className="lp-table__header-label">{header}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distribution.map((row) => (
                  <tr key={row.risk}>
                    <td className="lp-table__td">
                      <div className="lp-table__cell-inner">
                        <span className={`lp-badge lp-badge--${riskBadgeVariant[row.risk]}`}>{row.risk}</span>
                      </div>
                    </td>
                    <td className="lp-table__td">
                      <div className="lp-table__cell-inner">
                        <span className="lp-table__cell-text">{row.files}</span>
                      </div>
                    </td>
                    <td className="lp-table__td">
                      <div className="lp-table__cell-inner">
                        <div className="lp-progress lp-progress--full-width">
                          <div className="lp-progress__row">
                            <div
                              className="lp-progress__track"
                              role="progressbar"
                              aria-valuenow={row.share}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${row.risk} share of files`}
                            >
                              <div className="lp-progress__fill" style={{ width: `${row.share}%` }} />
                            </div>
                            <span className="lp-progress__value">{row.share}%</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="lp-card" aria-labelledby="recent-scans-title">
        <div className="lp-card__header">
          <div className="lp-card__title" id="recent-scans-title">
            Recent scans
          </div>
          <div className="lp-card__actions">
            <Link className="lp-button lp-button--secondary lp-button--sm" href="/findings">
              View findings
            </Link>
          </div>
        </div>
        <div className="lp-card__body">
          {scans.length === 0 ? (
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
                No scans yet. Upload a synthetic CSV or TXT file to see results here.
              </p>
              <div className="lp-empty-state__action">
                <Link className="lp-button lp-button--primary lp-button--md" href="/upload">
                  Upload and scan
                </Link>
              </div>
            </div>
          ) : (
            <div className="lp-table">
              <table className="lp-table__table">
                <caption className="visually-hidden">Most recent scans</caption>
                <thead>
                  <tr>
                    {["File", "Scanned", "Risk", "Findings"].map((header) => (
                      <th className="lp-table__th" scope="col" key={header}>
                        <div className="lp-table__header-inner">
                          <span className="lp-table__header-label">{header}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scans.slice(0, 8).map((scan) => (
                    <tr key={scan.id}>
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
                          <span className={`lp-badge lp-badge--${riskBadgeVariant[scan.risk]}`}>{scan.risk}</span>
                        </div>
                      </td>
                      <td className="lp-table__td">
                        <div className="lp-table__cell-inner">
                          <span className="lp-table__cell-text">
                            {scan.findings.reduce((sum, finding) => sum + findingCount(finding), 0)}
                          </span>
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
