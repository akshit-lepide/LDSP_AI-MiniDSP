export type Risk = "None" | "Low" | "Medium" | "High" | "Critical";

export type FindingType = "Email" | "UK phone" | "UK NINO" | "Payment card";

export interface RawFinding {
  id?: string;
  type?: string;
  finding_type?: string;
  risk: Exclude<Risk, "None">;
  count?: number;
  occurrence_count?: number;
  maskedExample?: string;
  masked_example?: string;
}

export interface Scan {
  id: string;
  fileName?: string;
  file_name?: string;
  fileSize?: number;
  file_size?: number;
  risk: Risk;
  created_at?: string;
  findings: RawFinding[];
}

export const riskOrder: Risk[] = ["Critical", "High", "Medium", "Low", "None"];

export const riskBadgeVariant: Record<Risk, string> = {
  Critical: "error",
  High: "error",
  Medium: "warning",
  Low: "default",
  None: "success",
};

export const findingTypeLabels: Record<string, string> = {
  Email: "Email address",
  "UK phone": "UK phone number",
  "UK NINO": "UK National Insurance number",
  "Payment card": "Payment card number",
};

export function scanName(scan: Scan): string {
  return scan.fileName ?? scan.file_name ?? "Unnamed file";
}

export function scanSize(scan: Scan): number {
  return scan.fileSize ?? scan.file_size ?? 0;
}

export function findingType(finding: RawFinding): string {
  return finding.type ?? finding.finding_type ?? "Finding";
}

export function findingCount(finding: RawFinding): number {
  return finding.count ?? finding.occurrence_count ?? 0;
}

export function findingMask(finding: RawFinding): string {
  return finding.maskedExample ?? finding.masked_example ?? "";
}

export function formatScanDate(value?: string): string {
  if (!value) return "Just now";
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(new Date(value))} UTC`;
}
