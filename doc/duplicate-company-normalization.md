# Duplicate detection: company name normalization

## Critical issue with the original approach

The earlier normalization (e.g. in a Google Sheets formula) removed legal-suffix substrings **anywhere** in the company name:

- **"Incision Medical"** → "ision Medical" (incorrect: "Inc" removed from the middle)
- **"Company Name Inc"** → "mpany Name" (incorrect: "Co" removed from "Company")
- **"AT&T Co"** → correct only if "Co" is at the end; if the regex matched globally, similar corruption.

So the **critical issue** was: stripping "Inc", "Co", "Company", etc. **without requiring they appear at the end** of the string, which corrupts names that contain those substrings as part of the name.

## Best solution implemented

1. **Strip legal suffixes only at the end**  
   After trimming and collapsing whitespace, remove a legal suffix only when it appears at the **end** of the string (with optional comma/period). So "Apple Inc" → "apple", but "Incision" stays "incision", "Company" stays "company".

2. **Order of operations**  
   - Trim and lowercase  
   - Strip punctuation and newlines, collapse whitespace  
   - Trim again  
   - Remove legal suffixes from the end only (repeated until none match)

3. **Single implementation, used in two places**  
   - **Server:** `lib/normalize-company.ts` — used by `getDuplicateJobApplicationKeys()` in `lib/db.ts` to build duplicate keys.  
   - **Desktop UI:** `desktop/src/lib/normalize-company.ts` — same logic so the key built in the UI (`profile_id::normalizeCompanyForDuplicateKey(company_name)`) matches the keys returned by the API.

## Files

- `lib/normalize-company.ts` — `normalizeCompanyForDuplicateKey(companyName)` (used by API).
- `desktop/src/lib/normalize-company.ts` — same function for desktop bundle (must stay in sync).
- `lib/db.ts` — `getDuplicateJobApplicationKeys()` now uses the normalizer instead of raw `LOWER(TRIM(company_name))`.
- `desktop/src/components/job-applications-view.tsx` — duplicate key for each row now uses `normalizeCompanyForDuplicateKey(appCompanyName)`.

## Result

- **Correctness:** "Apple Inc", "Apple Inc.", "APPLE", "Apple" all map to the same key and are correctly flagged as duplicates; "Incision" and "Company" are no longer corrupted.
- **Performance:** Normalization runs in Node (API) and in the client (desktop); no heavy Sheets formulas. Duplicate keys are computed once per request on the server and once per row on the client.
