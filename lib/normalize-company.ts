/**
 * Normalize company name for duplicate detection only.
 * Used so "Apple Inc", "Apple Inc.", "APPLE", "Apple" match as the same company.
 *
 * Pipeline:
 *   1. Trim and lowercase
 *   2. Strip punctuation and newlines (replace with nothing), collapse whitespace
 *   3. Trim again
 *   4. Remove legal suffix only when it appears at the end (avoids corrupting "Incision", "Company")
 *
 * Note: [^\w\s] is ASCII word chars only; non-ASCII letters (e.g. é in "Café") are stripped.
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

/** Precompiled regexes for trailing legal suffixes (end of string only). */
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

/** Remove legal suffixes from the end of the string only (repeated until none match). */
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

/**
 * Returns a string suitable for use as the company part of a duplicate key.
 * Same input always gives same output; order of operations avoids stripping
 * substrings that look like suffixes but aren't (e.g. "Inc" in "Incision").
 */
export function normalizeCompanyForDuplicateKey(companyName: string): string {
  if (typeof companyName !== "string" || !companyName.trim()) return "";
  const step1 = companyName.trim().toLowerCase();
  const step2 = stripPunctuationAndCollapse(step1);
  const step3 = stripLegalSuffixFromEnd(step2);
  return step3.trim() || step2.trim();
}
