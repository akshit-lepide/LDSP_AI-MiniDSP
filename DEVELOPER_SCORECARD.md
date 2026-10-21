# MiniDSP — Developer Scorecard

Generated at the developer's request after the final milestone, from the application, Git history,
`WORK_LOG.md`, `LEARNINGS.md` and executed test output. Times are Git commit timestamps or recorded
UTC timestamps, never estimates. Unverified items receive no objective credit and are listed at the end.

| Category | Score | Max |
|---|---:|---:|
| Functionality | 27 | 30 |
| Testing and reliability | 19 | 25 |
| AI orchestration | 11 | 20 |
| Lepide design compliance | 8 | 10 |
| Git and deployment | 8 | 10 |
| Learning and demonstration | 3 | 5 |
| **Total** | **76** | **100** |

> **Revision, 2026-10-21T11:40Z** — the first version of this scorecard recorded 68/100 with deployment
> marked "not done", because no Vercel evidence existed locally or in the repository. The developer then
> supplied the live URL, which was verified end to end (see Functionality and Git and deployment below).
> Deployment moved from unverified to verified and the total rose from 68 to 76.

---

## Functionality — 27 / 30

**Evidence**

- **F-01 Auth:** email/password sign-in, sign-up, sign-out and password recovery implemented
  (`src/app/providers.tsx`, `src/components/sign-in-panel.tsx`, `src/app/auth/callback/route.ts`,
  `src/app/reset-password/page.tsx`). Both API routes reject unauthenticated calls — verified by test
  and by live `401` responses.
- **F-02 Upload:** server-side validation of extension, emptiness, the 1–1,048,576 byte range, UTF-8
  decoding and binary control bytes (`src/lib/upload-validation.ts`). File bytes are processed in
  memory and never persisted or returned.
- **F-03…F-06 Detectors:** email → Low, UK phone → Medium, UK NINO → High, Luhn-valid card → Critical
  (`src/lib/detection.ts`), including disallowed NINO prefixes and a Luhn check.
- **F-07 Classification:** highest-risk-wins, non-overlapping occurrence aggregation, per-type counts
  and a single masked example. All 27 non-reject synthetic fixtures classify to their documented
  expected risk.
- **F-08 Persistence:** masked aggregates only, written through one atomic `SECURITY DEFINER` RPC with
  owner-scoped RLS, a composite `(user_id, scan_id)` foreign key, revoked direct `INSERT` grants and
  database-side mask/risk validation
  (`supabase/migrations/20261021010000_enforce_masked_findings.sql`).
- **F-09 Dashboard / F-10 Findings:** metrics, risk distribution, recent scans, type and risk filters,
  masked examples, empty and error states (`src/app/page.tsx`, `src/app/findings/page.tsx`).
- **F-11 CSV export:** quoted fields, doubled quotes and formula-trigger neutralisation (`src/lib/csv.ts`).
- **Live end-to-end run, 2026-10-21T10:08:04Z (local):** signed-in scan of `tests/fixtures/sample-mixed.txt`
  returned *"Scan complete. Classification: Critical"*, produced 4 masked findings
  (`a***@example.test`, `07******123`, `AB******C`, `************1111`), ignored the Luhn-invalid card,
  persisted to Recent scans, and the rendered page contained no raw email or card value.
- **F-12 Deployment verified on production, 2026-10-21T11:37Z** at
  `https://ldsp-ai-mini-dsp.vercel.app/` — this satisfies acceptance check 10:
  - Site loads with the Lepide-branded sign-in; Supabase environment variables are correctly configured
    in Vercel (the sign-in control is enabled rather than showing the not-configured state).
  - Sign-in succeeded and rendered the authenticated dashboard.
  - `sample-mixed.txt` uploaded and scanned live → *"sample-mixed.txt was classified **Critical**. Only
    masked examples were saved."*
  - `/findings` listed **12 masked findings across 4 scans**; `document.body.innerText` contained neither
    `alex@example.test` nor `4111 1111 1111 1111`.
  - Dashboard aggregates were correct: 4 files scanned, 12 findings, 3 Critical, risk distribution
    75% Critical / 25% None.
  - A developer-run scan of `sample-safe.txt` at 11:17Z is stored as **None**, which also evidences the
    "clean file → None" half of acceptance check 5 on production.
  - CSV export control is enabled on the live site.

**Deductions**

- Acceptance check 7 (User B cannot read/write User A's data) was never exercised with two users.
- Acceptance check 8 (failed finding write leaves no partial scan) was never exercised.
- The exported CSV file was validated by unit test, not by opening a downloaded file.
- **Defect observed on production:** immediately after sign-in the dashboard rendered 0 scans even though
  4 existed; a navigation or reload then showed the correct data. The first post-sign-in history load is
  unreliable. No data was lost and no error was surfaced to the user, but the first screen a user sees
  can be wrong.

## Testing and reliability — 19 / 25

**Evidence**

- `npm test` — **17 passed, 0 failed** (re-run at scorecard time). Six test files:
  `detection`, `upload`, `api-auth`, `database-security`, `csv`, `auth-urls`.
- Coverage includes the full 30-case synthetic fixture matrix, exact masked output for all four
  detector types, repeat counting, risk precedence, malformed-input rejection, upload boundaries
  (empty, unsupported extension, exactly 1 MiB, over 1 MiB, invalid UTF-8, NUL bytes), bearer-token
  rejection on both APIs, migration guarantees, and CSV formula neutralisation.
- `npm run lint` — PASS, 0 problems. `npm run build` — PASS, all routes compiled.
- `WORK_LOG.md` records genuine failures and retests rather than only successes: the Node ESM
  resolution failures, a test fixture that was itself wrong (NUL bytes at the 1 MiB boundary), a
  nullable `getClaims()` type error, and several incorrect auth hypotheses that were disproved.
- Root-cause discipline: the repeated `401` was traced with a one-off diagnostic to
  `SELF_SIGNED_CERT_IN_CHAIN` and fixed with `--use-system-ca` rather than by disabling TLS verification.

**Deductions**

- No automated integration or end-to-end suite (no Vitest/RTL/Playwright); end-to-end proof is manual
  browser verification, performed once locally and once against production.
- No automated test for RLS isolation or atomic-write rollback — the two highest-value safety claims.
- No coverage measurement.
- The post-sign-in dashboard defect reached production, which indicates the authenticated first-load path
  is not covered by any test.

## AI orchestration — 11 / 20

**Evidence**

- The developer directed the work throughout, approved each significant action (project scaffold,
  Supabase dependency install, repository scope) and supplied real diagnostic input, including the
  Supabase Auth log containing `email_address_invalid` and the `/recover` referrer.
- The developer rejected superficial answers and repeatedly pushed for a real fix ("you cannot find the
  solution please fix this"), which directly led to the TLS root-cause investigation.
- Security boundaries were held during the collaboration: credentials were kept out of the repository,
  a temporary credential-using diagnostic script was deleted after use, and exposure of the test
  password in chat was flagged for rotation.

**Deductions**

- **No evidence of the prescribed two-chat workflow.** The workspace contains no Instructor-chat
  prompts, no pasted developer handoffs, and no challenge/response cycles. `START_HERE_INSTRUCTOR.md`
  appears never to have been used in a separate Ask-mode chat.
- Without that loop, the structured "Instructor challenges, Developer builds, human decides" process
  that this category measures cannot be credited. Flagged for facilitator review.

## Lepide design compliance — 8 / 10

**Evidence**

- UI rebuilt against the real 15 October screenshots in
  `MiniDSP_Developer_Quick_Start_All_Real_Screenshots.docx` and the live Lepidus foundations and brand
  pages.
- **Official brand asset:** the Lepide monogram SVG taken from `/v1/brand/`, kept at its fixed
  `#2498D4`, rendered white at 40 px in the rail per the brand rules, and reused as the favicon.
- Documented components only: `lp-sidebar`, `lp-breadcrumb`, `lp-card`, `lp-table`, `lp-badge`,
  `lp-progress`, `lp-message`, `lp-input`, `lp-button`, `lp-empty-state`, `lp-link`, `lp-spinner`.
- `lp-dropdown` filters are driven by `lepidus.js` via `lp-dropdown-change` and left uncontrolled,
  rather than hand-rolled — matching the design contract's explicit anti-drift guidance. `aria-selected`
  is kept in sync so the listbox semantics stay correct.
- An earlier set of custom filter buttons was removed in favour of documented Lepidus radio/dropdown
  components once the contract was read properly.
- Page CSS is layout-only and token-only; no raw hex outside the sanctioned brand colour.

**Deductions**

- Dark and high-contrast themes were never visually verified, and the keyboard path was not walked.
- The design system's `validate-lp-html.mjs` gate was not run (it ships in the design-system repo, which
  is not available locally).

## Git and deployment — 8 / 10

**Evidence**

- Repository initialised at the workspace root so the app, `WORK_LOG.md`, `LEARNINGS.md`, the brief and
  `tests/fixtures` live together. 98 files tracked.
- Commits (real Git timestamps):
  - `9c060a2` — 2026-10-21T16:15:51+05:30 — *MiniDSP: Lepide-branded data discovery app with masked findings and RLS persistence*
  - `0cf4234` — 2026-10-21T16:17:33+05:30 — *Record UI rebuild and GitHub push evidence in WORK_LOG*
- Pushed to `https://github.com/akshit-lepide/LDSP_AI-MiniDSP.git`; `git ls-remote` confirms
  `refs/heads/main = 0cf4234`, and the working tree is in sync.
- Secret hygiene: `.env.local`, `node_modules` and `.next` excluded; staged content scanned for
  `sb_publishable_`, `sb_secret_`, `service_role`, the project ref and the test password — no matches.
- **Deployment verified live** at `https://ldsp-ai-mini-dsp.vercel.app/` on 2026-10-21T11:37Z. The
  developer deployed manually, which leaves no `.vercel` directory or committed config, so it was
  confirmed by exercising the running site rather than by inspecting the repository. Supabase
  environment variables are correctly configured in the hosting project, and the full
  login → upload → scan → findings path works against the same Supabase instance used locally
  (the 10:03Z local scan is visible in production history).

**Deductions**

- Only three commits, all created at the end of the session, so the history shows no incremental
  progress and cannot evidence how the work developed.
- Repository visibility is unconfirmed; the challenge requires a private repository.
- Deployment is not reproducible from the repository: no `vercel.json`, no documented build settings,
  and the app lives in `Project/minidsp` rather than the repository root.

## Learning and demonstration — 3 / 5

**Evidence**

- `LEARNINGS.md` captures four substantive lessons: detector purity and fixture-first testing, making
  the database enforce masking rather than trusting application code, copying real Lepidus anatomy, and
  the Node-versus-browser TLS trust distinction.
- `WORK_LOG.md` is a detailed, honest record with failures, retests, exact commands and explicit
  unverified labels.
- A concrete defect discovered and fixed is available to demonstrate: the browser reported a successful
  sign-in while every server call returned `401`, traced to Node rejecting a TLS-intercepting proxy CA.

**Deductions**

- The **Planning** and **What I'd do differently** sections of `LEARNINGS.md` are still empty.
- No 2-minute demo was performed.

---

## Three strengths

1. **Safety was enforced in depth, not just in the UI.** Masking happens before persistence, the
   database revokes direct inserts and validates each detector's masked format, RLS is owner-scoped with
   a composite foreign key, and tests assert that raw emails and card numbers never appear in API
   output. The live run confirmed no raw value reached the page.
2. **A hard, misleading bug was traced to its real root cause.** "Signed in successfully" followed by
   `401` looked like an auth defect; it was Node rejecting a locally trusted proxy CA. It was fixed with
   `--use-system-ca` rather than by disabling certificate verification, which would have been the easy
   and insecure shortcut.
3. **Evidence was kept honest.** Test counts, lint and build results, Git SHAs and timestamps are all
   real, and every unverified claim — two-user RLS, rollback — is explicitly marked as unverified instead
   of being implied as done. The deployment claim was likewise only credited after the live site was
   exercised end to end.

## Three improvements

1. **Automate the safety claims.** RLS isolation with two users and atomic-write rollback are the most
   important guarantees in the brief and are currently asserted only by migration text, not by an
   executed test.
2. **Fix the first-load defect and cover it.** The production dashboard showed 0 scans immediately after
   sign-in; the authenticated first-load path has no test.
3. **Commit incrementally and use the Instructor chat.** Three end-of-session commits hide the actual
   progression, and the prescribed Instructor/Developer challenge loop — the thing the orchestration
   category measures — was never used.

---

## Unverified items — facilitator review required

These earned no objective credit in the scores above.

| Item | Status |
|---|---|
| Two-user RLS isolation (acceptance check 7) | **Not tested.** No second account was created. |
| Atomic-write rollback on a failed finding insert (check 8) | **Not tested.** |
| Hosted application of both SQL migrations | **Indirectly verified.** Production scans insert through the atomic RPC and RLS-protected reads succeed, which requires both migrations; the SQL runs themselves were not observed. |
| Vercel deployment / live URL (check 10) | **VERIFIED 2026-10-21T11:37Z** at `https://ldsp-ai-mini-dsp.vercel.app/` — sign-in, scan, masked findings and dashboard aggregates all exercised live. |
| GitHub repository visibility (private required) | **Unconfirmed.** Cannot be determined from a push. |
| Password recovery email delivery | **Fails at Supabase.** `email_address_invalid` returned by Auth before sending; UI flow is implemented but unproven end to end. |
| Dark theme, high-contrast theme, keyboard navigation | **Not verified.** |
| Downloaded CSV opened in a spreadsheet | **Not verified.** Protection is unit-tested only. |
| 2-minute demo | **Not performed.** A live URL now exists, so the demo is possible. |
| Post-sign-in dashboard first load | **Defect observed on production:** shows 0 scans until reload or navigation. |
| Dev-only npm audit findings (5 high, `braces` via `eslint-config-next`) | **Accepted, not fixed.** Production-only audit is clean; the offered fix is a breaking downgrade to v14. |

## Outstanding security actions

1. **Rotate the test account password** — it was pasted into chat and must be treated as compromised.
2. **Confirm the repository is private** before submission.
