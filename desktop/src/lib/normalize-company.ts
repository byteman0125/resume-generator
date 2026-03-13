/**
 * Normalize company name for duplicate detection only.
 * Must match server (lib/normalize-company.ts) so duplicate keys align.
 * Pipeline: trim/lowercase → strip punctuation & collapse whitespace → strip legal suffix from end only.
 */

const LEGAL_SUFFIXES = [
  "incorporated",
  "corporation",
  "company",
  "llp",
  "llc",
  "inc",
  "corp",
  "ltd",
  "gmbh",
  "co",
] as const;

const SUFFIX_END_REGEXES = LEGAL_SUFFIXES.map(
  (s) => new RegExp(`[\\s,]*${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.?\\s*$`, "i")
);

function stripPunctuationAndCollapse(s: string): string {
  return s
    .replace(/[^\w\s]/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripLegalSuffixFromEnd(s: string): string {
  let t = s.trim();
  let prev = "";
  while (prev !== t) {
    prev = t;
    for (const re of SUFFIX_END_REGEXES) {
      t = t.replace(re, "").trim();
    }
  }
  return t;
}

export function normalizeCompanyForDuplicateKey(companyName: string): string {
  if (typeof companyName !== "string" || !companyName.trim()) return "";
  const step1 = companyName.trim().toLowerCase();
  const step2 = stripPunctuationAndCollapse(step1);
  const step3 = stripLegalSuffixFromEnd(step2);
  return step3.trim() || step2.trim();
}
