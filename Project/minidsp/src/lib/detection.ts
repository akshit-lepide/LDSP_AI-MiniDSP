export type Risk = "None" | "Low" | "Medium" | "High" | "Critical";

export type FindingType = "Email" | "UK phone" | "UK NINO" | "Payment card";

export interface Finding {
  type: FindingType;
  risk: Exclude<Risk, "None">;
  count: number;
  maskedExample: string;
}

export interface DetectionResult {
  risk: Risk;
  findings: Finding[];
}

interface Candidate {
  type: FindingType;
  risk: Exclude<Risk, "None">;
  start: number;
  end: number;
  value: string;
}

const riskRank: Record<Exclude<Risk, "None">, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

function luhnIsValid(value: string): boolean {
  let sum = 0;
  let doubleDigit = false;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}

function mask(type: FindingType, value: string): string {
  if (type === "Email") {
    const [localPart, domain] = value.split("@");
    return `${localPart[0]}***@${domain}`;
  }

  if (type === "UK NINO") {
    const normalized = value.replace(/\s/g, "").toUpperCase();
    const suffix = normalized.slice(-1).match(/[A-D]/) ? normalized.slice(-1) : "";
    return `${normalized.slice(0, 2)}******${suffix}`;
  }

  const digits = value.replace(/\D/g, "");
  const visiblePrefix = digits.slice(0, 2);
  const visibleSuffix = digits.slice(-3);
  const hiddenLength = Math.max(1, digits.length - visiblePrefix.length - visibleSuffix.length);
  const internationalPrefix = value.trimStart().startsWith("+") ? "+" : "";

  if (type === "UK phone") {
    return `${internationalPrefix}${visiblePrefix}${"*".repeat(hiddenLength)}${visibleSuffix}`;
  }

  return `${"*".repeat(Math.max(1, digits.length - 4))}${digits.slice(-4)}`;
}

export function detectSensitiveData(text: string): DetectionResult {
  const candidates: Candidate[] = [];
  const patterns: Array<{ type: FindingType; risk: Candidate["risk"]; regex: RegExp }> = [
    {
      type: "Email",
      risk: "Low",
      regex: /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+/gi,
    },
    {
      type: "UK phone",
      risk: "Medium",
      regex: /(?<!\d)(?:0(?:7(?:[ -]?\d){9}|[12](?:[ -]?\d){8,9})|\+44[ -]?(?:7(?:[ -]?\d){9}|[12](?:[ -]?\d){8,9}))(?!\d)/g,
    },
    {
      type: "UK NINO",
      risk: "High",
      regex: /(?<![A-Z0-9])([A-CEGHJ-NPR-TW-Z])([A-CEGHJ-NPR-TW-Z])\s?(\d{2})\s?(\d{2})\s?(\d{2})\s?([A-D])?(?![A-Z0-9])/gi,
    },
    {
      type: "Payment card",
      risk: "Critical",
      regex: /(?<!\d)\d(?:[ -]?\d){12,18}(?!\d)/g,
    },
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern.regex)) {
      const value = match[0];

      if (pattern.type === "Payment card") {
        const digits = value.replace(/\D/g, "");
        if (digits.length < 13 || digits.length > 19 || !luhnIsValid(digits)) continue;
      }

      if (pattern.type === "UK NINO") {
        const prefix = value.replace(/\s/g, "").slice(0, 2).toUpperCase();
        if (["BG", "GB", "KN", "NK", "NT", "TN", "ZZ"].includes(prefix)) continue;
      }

      candidates.push({
        type: pattern.type,
        risk: pattern.risk,
        start: match.index,
        end: match.index + value.length,
        value,
      });
    }
  }

  candidates.sort(
    (left, right) =>
      left.start - right.start ||
      right.end - left.end ||
      riskRank[right.risk] - riskRank[left.risk],
  );

  const accepted: Candidate[] = [];
  let lastEnd = -1;
  for (const candidate of candidates) {
    if (candidate.start < lastEnd) continue;
    accepted.push(candidate);
    lastEnd = candidate.end;
  }

  const findingByType = new Map<FindingType, Finding>();
  for (const candidate of accepted) {
    const existing = findingByType.get(candidate.type);
    if (existing) {
      existing.count += 1;
    } else {
      findingByType.set(candidate.type, {
        type: candidate.type,
        risk: candidate.risk,
        count: 1,
        maskedExample: mask(candidate.type, candidate.value),
      });
    }
  }

  const findings = [...findingByType.values()];
  const risk = findings.reduce<Risk>(
    (highest, finding) =>
      riskRank[finding.risk] > (highest === "None" ? 0 : riskRank[highest])
        ? finding.risk
        : highest,
    "None",
  );

  return { risk, findings };
}