# SESSION_HANDOFF.md · UpSkill Way platform

| | |
|---|---|
| Purpose | Carry the working context of the planning/review chat into a fresh chat. Only what the repository docs don't already say. |
| Written | 27 Oct 2026, replacing the handoff of 24 Oct 2026 |
| Written by | The planning chat, **without access to the repository or Git**. Every "done" below is based on Shubham's reports ("approved, merged, pulled") and on Claude Code summaries pasted into the chat, not on inspection. The new chat must verify (§10). |
| Read with | `CLAUDE.md`, `AUDIT.md`, `docs/00`–`09`, `docs/DECISIONS.md`, `docs/licences.md`. This file never overrides them. If they disagree, the repository wins and the difference is reported. |

---

## 1. Who does what

- **Dinesh Somayya Chilaka** (Director, business owner): approves every PR that touches permissions, login security, money, legal text, email, brand, `AUDIT.md` registry rows or `DECISIONS.md` rows. Called "Dinesh sir" in messages Shubham sends.
- **Shubham Pawar** (builder): runs Claude Code on Windows (PowerShell, VS Code), project at `C:\projects\upskillway-platform`, repo `ShubhamPDev7/upskillway-platform`. Pushes, opens PRs, merges.
- **Planning chat (this role):** writes Claude Code prompts, reviews plans and diffs, answers Claude Code's multiple-choice questions, explains permission prompts, gives Shubham simple numbered PowerShell/GitHub steps, writes plain-language updates for Dinesh sir. **Does not write project code.**
- **Claude Code:** plans, implements, tests, commits on a branch; never pushes.

Shubham asks for explanations **step by step and slowly**; when a reply is long or rushed he says so. Keep answers short, numbered, with exact commands.

---

## 2. Checkpoint (27 Oct 2026)

- **Last merged task:** P1.16 Database pool error listener (Shubham: approved, merged, pulled, branch deleted).
- **Next task:** **P1.16b**, error listener for pool clients checked out by Payload's own transactions (§9). Not started, no prompt written yet.
- **Expected Git state** (unverified): on `main`, up to date, clean, all P1.10–P1.16 branches deleted.
- **Last test numbers reported** (P1.16 branch, by Claude Code): `pnpm test` 46 files / **902 tests** passing, domain coverage 100% (statements, branches, functions, lines); lint and typecheck pass. Not re-run on `main` after merge.
- **Approvals:** Shubham reports Dinesh approved every row from P1.10 to P1.16 (D-118..D-126 and their AUDIT rows), the C-60 exception in alert emails, the forgot-password "same success reply" deviation, and the logo. **The files still say "Pending Dinesh (P1.x PR)"**: a small docs PR should flip them to approved with the date (§6).
- **No company accounts yet** (Vercel, Supabase, Cloudflare, Brevo, Sentry, GA4, domain/DNS). Dinesh: "continue development locally". So P0.1 and P0.8–P0.10 still wait.

---

## 3. Work completed since the 24 Oct handoff (all reported merged)

Commit hashes are the ones Claude Code reported before merge (GitHub merge commits keep them).

| Task | Branch | Commits | What it delivered | Decisions / registry |
|---|---|---|---|---|
| **P1.10** Email service and webhook | `p1.10-email-service` | 9 (incl. a proxy-test stub fix) | nodemailer **10.0.16** (exact pin); Mailpit in `docker-compose.yml` (127.0.0.1:1025 SMTP, :8025 UI) and as a CI service; `EMAIL_SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM`, `EMAIL_WEBHOOK_SECRET` in `env.ts` (local catcher host refused when `VERCEL_ENV` set); `src/domain/email-delivery.ts` (status table, provider-event mapping, CR/LF check, error sanitiser); `queueEmail()` → `email-log` row + Payload Job `send-email` (queue `email`, 5 tries, exponential from 60 s); light email layout + footer from `PublicSiteSettingsDTO`; password-reset email wired through `forgotPassword.generateEmailHTML`; Payload email adapter refuses direct sends; `POST /hooks/email` (Bearer secret, SHA-256 + `timingSafeEqual`, 256 KB cap, idempotent); bounce/complaint suppression from `email-log` only; `client.ts` loads the config lazily (import-loop fix, proven by `tests/unit/import-order.test.ts`) | D-118, D-119, D-120; O-1 and O-7 wording; §4.2 rows for SMTP secrets, webhook secret, `payload-jobs`, `email-log` |
| **P1.11** Login audit events | `p1.11-login-audit-events` | 4 | `user.login.succeeded` (in the login transaction, fail closed), `user.login.failed` (Users `afterError`, after rollback, standalone, never changes the reply), `user.locked` (once per lock via an atomic claim key `user.locked:<userId>` in `rate_limits`); in-memory `WeakMap` mark after the rate limiter (429s write no row); outcomes `unknown_email`, `wrong_password`, `inactive`, `locked`, `invalid_request`, `lookup_failed`, `error`; email stored only as HMAC; `rest()` test helper gained `setCookie` | D-121; O-9, O-11, T-1 wording; §4.2 audit-log row |
| **P1.12** Admin alert emails + TOTP-reset email | `p1.12-alert-emails` | 5 | `src/server/services/adminAlerts.ts`; alerts to all active Admins (adapter lookup, max 50, no `overrideAccess`) for account locked, TOTP reset (+ notice to the affected user), and 5 blocked staff logins from one IP hash in an IST hour (cap 10 alerts/hour, 12-char IP-hash reference); best effort (`{ event: 'alert.failed', errorId }`); TOTP emails sent from a Users `afterOperation` hook; templates in `src/emails/AdminAlerts.tsx`, `TotpReset.tsx` | D-122 (C-60 exception: alerts show another staff member's stored name/email); O-9 counter keys; §4.2 rows |
| **P1.13** Forgot-password limits + equal timing | `p1.13-forgot-password-limits` | 4 | Limits 3/h per email hash, 10/h per IP hash, counted before lookup (unknown emails included); blocked = **same 200 success**, no lookup/token/email/audit/alert (Dinesh's choice, deliberately not 05 §5.3 "RATE_LIMITED"); custom Users endpoint `POST /forgot-password` replaces Payload's handler (catches only `ForgotPasswordLimited`); every reply waits ≥ 1,000 ms (`src/server/services/minimumDuration.ts`, monotonic clock); narrow type cast because Payload's generated type wrongly requires a password; `rest()` helper gained `headers` | D-123; O-9, T-1 wording |
| **P1.14** MFA lock Admin alert | `p1.14-mfa-lock-alert` | 4 | Alert to all active Admins on `user.mfa.locked`; fires on the **6th** attempt in the 5-minute window (first over the limit, as 05 §2.4 "exceeding"); claim = the atomic TOTP attempt counter (`isMfaLockAlertAttempt` in `src/domain/admin-alerts.ts`), so one alert per lock while the audit event still repeats; enrolment lockouts alert too; `endSession()` returns its local request | D-124; §4.2 rows |
| **P1.15** Official logo and brand colours | `p1.15-logo-brand-tokens` | 3 | Tokens: `--brand-red #fe5641`, `--brand-orange` and `--accent #ff7f1a`, `--brand-yellow #fcc921`, glow `rgb(255 127 26 / 0.18)`; contrast thresholds unchanged, no token adjusted; `public/brand/upskillway-logo.svg` (c2pa metadata and namespace removed, accessible name "UpSkill Way"), `upskillway-logo-on-dark.svg` (9 wordmark fills → white), `favicon.svg` (mark only); drawing hash pinned in `tests/unit/design/brand-assets.test.ts`; `docs/08-design.md` §1.2–§1.4 updated; `docs/licences.md` "Brand assets" section | D-125 (closes Q-45, A-159; supersedes D-103's ratios) |
| **P1.16** Database pool error listener | `p1.16-db-pool-error-listener` | 3 | `src/server/services/dbPool.ts` `watchDatabasePool()` via Payload `onInit`: one `'error'` listener on `payload.db.pool`, logs only `{ event: 'db.pool.connectionError', errorId }`, no parameters, never throws, attached once (`Symbol.for` marker); runtime + type guards; real-drop integration test via new T-1 helper `terminateIdleBackend(pid)` (guarded, idle only, `_test` DB only) | D-126; T-1 wording |

**Not done:** P0.1 (accounts), P0.8a/b, P0.9, P0.10, P1.16b, P1.9b, P1.9c, P1.4b, all of Phase 2–4, M2, M3.

---

## 4. Technical discoveries (not all in the docs)

### 4.1 Payload 3.91 / pg
- No hook runs inside a **failed** login; only collection `afterError` (via `routeError`, REST only) sees it. Local API `payload.login()` failures are not audited.
- `beforeOperation` cannot skip an operation, only throw; that's why P1.13 replaced the forgot-password endpoint (custom collection endpoints win over Payload's own).
- Payload's forgot-password handler always returns 200 `{ message: 'Success' }`; `minRequestInterval` (15 s) already silently skips repeats.
- `afterOperation` is the last step before commit on update/updateByID; there is **no after-commit hook**. A failed COMMIT is swallowed by the adapter, so emails sent from `afterOperation` could go out for a change that failed to commit (accepted VERIFY).
- Payload Jobs: `jobs.queue` bypasses access by default (so it goes through `systemPayload`); `jobs.autoRun` only when `getPayload({ cron: true })` (dev only); jobs API routes refused; job inputs are deleted on completion; runs are `silent`.
- `react-dom/server` throws under the `react-server` condition (Payload CLI), so email templates import it dynamically.
- Payload hides `lockUntil` on reads even with `overrideAccess`; tests read it through `payload.db.findOne`.
- Payload writes its own `logger.error` line for every failed/blocked login (no email/IP/password in it; log-volume follow-up).
- `payload.db.pool` is created lazily in `connect()`, lives for the whole process (not recreated on reload), has **no `'error'` listener** from Payload. pg-pool emits one pool error per dropped idle backend. Clients **checked out** by Payload's own transactions (Drizzle `pool.connect()` held until commit) have **no listener** → P1.16b.
- Payload's `connectWithReconnect` checks out a client per ECONNRESET and never releases it (Payload's behaviour, noted only).

### 4.2 Tooling and process
- Running the integration project alone exits 1 because of the 100% domain coverage gate; use `--coverage.enabled=false` for solo/repeat runs. The full `pnpm test` is the real check.
- Full `pnpm test` now takes ~4 minutes; Claude Code runs repeat suites in the background.
- `JSON.stringify` turns `Error` into `{}`; leak scans of logs must use an `errorsAsText` replacer.
- Mailpit returns `\r\n` line endings; tests normalise.
- Frozen-clock rows share a timestamp, so order is random: compare as sorted sets.
- Mailpit is never emptied by tests (unique fake addresses per test).
- Claude Code once ran `pnpm add` before approval (reverted). Auto mode appeared on its own twice ("Allowed by auto mode classifier"); Shubham switches it off with Shift+Tab.
- VS Code shows "Save file to continue…" on edit prompts; pressing 1 in the terminal (or Ctrl+S in VS Code) continues.
- Long Windows paths break when pasted: copying the PR description works best by first `Test-Path` on the original, then `Copy-Item` to `C:\projects\pr-p1.N.md`, then `Test-Path` on the copy; fallback is File Explorer (`%LOCALAPPDATA%\Temp\claude\…\scratchpad`).
- Local login rate limit (10 per 15 min per IP) can block Shubham during manual tests; wait 15 minutes.

---

## 5. Conventions agreed

- New registry rows (`AUDIT.md` §2/§3/§4.2) and `DECISIONS.md` rows go into the **same PR**, marked "Pending Dinesh (P1.x PR)"; the last commit of each task is "P1.x: AUDIT and DECISIONS rows (Pending Dinesh)" (or similar).
- Never edit `docs/07-roadmap.md` in a task PR. Other spec docs only when agreed and limited (P1.15 edited `08` §1.2–§1.4 only, by agreement).
- Deviations and unconfirmed behaviour go in the PR description as **VERIFY items**; the PR description's first line is "Needs Dinesh's approval: …".
- No migrations before P0.8 (dev schema push only); every new table/enum value goes on the P0.8 list.
- Raw parameterised SQL only in registered single-purpose stores (`totpStore` O-8, `rateLimitStore` O-9, `auditStore` O-11, `idempotencyStore` O-12). `overrideAccess` only via `systemPayload` (O-7).
- Test constants named `*_VECTOR` (gitleaks); IPs from RFC 5737 ranges; fake data only; freeze `Date` only; run the new file 3× and the full suite 3×.
- Best-effort side effects (alerts, audit after rollback) log only `{ event, errorId }`, never error text.
- One task = one branch = one PR; one commit per logical step; diff + lint/typecheck/full test results shown **before** every commit; manual approve mode always.

---

## 6. Outstanding items

| Item | Status | Before |
|---|---|---|
| **P1.16b** listener for clients checked out by Payload's own transactions | Next task | **Go-live blocker** |
| Docs PR: flip "Pending Dinesh" → approved (date) for O-1, O-7, O-9, O-11, T-1, §4.2 rows, D-118..D-126; licences.md + D-125 ownership "confirmed by Dinesh, 26 Oct 2026"; stale lines: `08` line 14 ("Q-42 to Q-45 remain open"), `08` §14 Q-45 row, `08` §15 A-159 row, D-103 old ratios, `contrast.test.ts` comment, `07` P0.6 "Needs"; `05` §5.3 vs D-123 wording; `05` §6.2 `'strict-dynamic'`; `middleware.ts` → `proxy.ts` mentions | Not started | Any time (small) |
| P1.9c self-host Monaco (or read-only JSON view) | Not started | CSP enforced on staging/prod |
| P1.9b first-party `/hooks/csp-report` | Not started | 7-day report-only window on staging |
| P1.4b Turnstile widget on login (and forgot-password) | Not started | Go-live |
| `/hooks` and `/cron` into the strict CSP class | With P0.10 | Staging |
| New-country Admin login alert (A-115) | Needs Vercel geo | Go-live |
| FORBIDDEN-spike and link-failure alerts; Admin alerts for blocked forgot-password | Not started | Go-live review |
| Brevo webhook may report its own message id (suppression would silently fail) | **Staging blocker** | Brevo account |
| Staging/production send no email until P0.10 `/cron/[job]` | Known | Phase 1 exit |
| Redacting logger module; Payload per-failed-login log volume | Follow-up | P4.2 |
| Un-suppress an address (email-log is SYS-only); mute settings; last-login fields; "locked until" in MFA alert | Follow-up | M2 / later |
| `users.lastTotpStep` unused column | Drop in a contract PR | — |
| Production-build check of logout/login hang (from 24 Oct) | Not done | — |
| Site Settings logo/favicon/OG fields; header/footer logo; favicon wiring; hosted PNG for emails | P2.1 / Phase 3 | — |
| `--brand-red` kept "large text only" though it now passes 4.5; `--warning #FFC233` no longer a brand colour | VERIFY for Dinesh | — |
| P0.8 migration list: `payload_jobs`, `payload_jobs_log`, 3 job enums, `email_log_to_idx`, `enum_email_log_template` values `admin_alert_account_locked`, `admin_alert_totp_reset`, `admin_alert_login_rate_limited`, `admin_alert_mfa_locked` (plus earlier tables) | Record | P0.8 |

Agreed order: **P1.16b → docs PR (approvals + stale lines) → P1.9c → P1.9b → P1.4b → Phase 2**. P0.1 and P0.8–P0.10 jump the queue as soon as accounts exist.

---

## 7. Waiting on Dinesh

- Company accounts and domain/DNS (Q-19, Q-20); Sentry region (Q-37); log drain (Q-36).
- Grievance officer details (Q-3; seeded `info@upskillway.com`, `+919309153277`, to confirm).
- M3 answers Q-46..Q-59 (especially Q-46 start, Q-51 B2C GST invoices).
- Lawyer/CA items (`DECISIONS.md` §2.3–§2.5).
- Optional: trademark registration details for the logo/name (for `docs/licences.md`).
- Confirmed 26 Oct: official colours `#FE5641 #FF7F1A #FDB117 #FCC921 #0A0A0A`; white-wordmark variant; name "UpSkill Way"; UpSkill Way owns the logo.

---

## 8. How the work runs

1. `/clear` in Claude Code; `git checkout main`, `git pull origin main`, `git checkout -b p1.x-name`.
2. Planning chat writes the prompt: Task + sources → Read → Problem/Goal → decisions already made → Out of scope → **Start by telling me** (verify in `node_modules`, list what exists, propose exact file list) → Do → Rules → Done when → Process (plan mode first, wait for approval, one commit per step, no push, PR description to scratchpad with "Needs Dinesh's approval: …" first).
3. Standard rules in every prompt: follow CLAUDE.md; no new dependency without asking; `overrideAccess` only via `systemPayload`; rows "Pending Dinesh" in the same PR; don't edit `07-roadmap.md`; VERIFY items; freeze the clock; integration 3×; no migrations before P0.8; no `git stash`, no push, no install; no command that changes files/packages/git before approval; manual approve mode; lint/typecheck/full test before each commit; next free decision number stated (**D-127** now).
4. Shubham pastes Claude Code's questions, plans and permission prompts; the planning chat answers each one (press 1 / 2 / 3, with reason) and recommends one option with a ready-to-paste note when needed.
5. Plan approval: **"Yes, manually approve edits"**; never auto mode; never "don't ask again" for git, `node`, `pnpm exec`, `pnpm payload`, `Get-Content`; reading outside the project: "Yes, but ask again next time".
6. After the last commit: copy PR description (Test-Path → Copy-Item → Test-Path), check branch, `git push -u origin <branch>`, open PR with the given title, wait for `verify` + `secret-scan`, send Dinesh sir the plain-language message.
7. After merge: `git checkout main`, `git pull origin main`, `git branch -d <branch>`, then a manual test with numbered steps (docker up, lint/typecheck/test, `pnpm dev`, Mailpit at `http://127.0.0.1:8025`, use a **test Sales account**, never lock the own Admin).
8. At the end of a day: a simple, non-technical progress update for Dinesh sir.

---

## 9. Next task: P1.16b (planning notes, not yet decided)

- **Problem:** clients checked out by Payload's own transactions (admin and REST writes; Drizzle `pool.connect()` held until commit/rollback) have no `'error'` listener; pg-pool removes its idle listener on checkout, Payload adds none, so a connection dropped mid-request can crash the process. D-093 already covers our action transactions; `pool.query()` is covered by pg-pool's per-query listener; idle clients by P1.16.
- **Likely approach for Claude Code to verify:** listen to the pool's `'connect'` and/or `'acquire'` events (pg-pool emits them with the client) and attach a no-parameter, never-throwing, once-only `'error'` listener per client, logging `{ event, errorId }`; or wrap the adapter's transaction start. Must not leak listeners (attach once per client, e.g. marker), must not change query behaviour, must not log error text/host.
- **Tests to ask for:** a real mid-transaction drop through Payload's own transaction path (REST write held open while the backend is terminated, using an existing guarded T-1 helper such as `terminateOpenTransactionBackend` or a new one) proving no uncaught exception, one log line, the request fails with Payload's normal error, and the pool is healthy afterwards; listener count does not grow with repeated checkouts; leak scan of logs.
- Rows: D-127 (Pending Dinesh), AUDIT T-1 note if the helper changes. PR first line: "Needs Dinesh's approval: touches database connection handling."

---

## 10. What the new chat must check before acting

1. `git status`, `git branch --show-current`, `git --no-pager log --oneline -20` on `main`: P1.10–P1.16 merged, clean tree.
2. `AUDIT.md` §2 rows O-1..O-12, T-1 and §4.2; `DECISIONS.md` D-087..D-126: wording and "Pending" status.
3. Files exist: `src/server/services/{email,adminAlerts,loginAudit,forgotPassword,minimumDuration,dbPool}.ts`, `src/server/jobs/send-email.ts`, `src/app/hooks/email/route.ts`, `src/domain/{email-delivery,login-audit,admin-alerts}.ts`, `src/emails/*`, `public/brand/*.svg`.
4. `.env.example` variable names (never `.env` values).
5. `docker compose up -d --wait`, `pnpm lint`, `pnpm typecheck`, `pnpm test` on `main` (expect ~902 tests, domain 100%).
6. Whether any §6 item was done outside this chat.

---

## 11. Limits of this handoff

- Written without repository access; nothing inspected on disk.
- Commit hashes, test counts and file contents are as reported by Claude Code in the chat.
- Approvals are as reported by Shubham; the files may still say "Pending".
- The 24 Oct handoff's history (P0.2–P1.9) is summarised there and in the repo, not repeated here.

---

## CONTINUATION RULES

1. The planning chat writes prompts and reviews; it never writes project code and never lets work start before Shubham has seen and approved the plan.
2. Keep the prompt format in §8 and the standard rules every time.
3. Make Claude Code verify library behaviour in the installed packages (Payload 3.91, Next 16.3, pg 8.20, pg-pool 3.14, drizzle 0.45) before designing.
4. Security first: fail closed, allowlists, no secrets/raw IPs/emails/error text in logs or audit rows, no new third-party hosts without the `06` §6 process, no `'unsafe-eval'`, no `overrideAccess` outside `systemPayload` and registered stores.
5. Answer every Claude Code prompt Shubham pastes: which option, why, and what to look for next. Press 1 for planned files and read-only commands; 3 (No) for anything off-plan or any edit before approval.
6. Give Shubham simple, numbered, copy-paste steps; slow down when asked; one plain message to Dinesh sir per PR.
7. Never approve auto mode, "don't ask again" for broad commands, `git stash`, history rewrites or force-pushes.
8. Check the repository first (§10); report differences between this file and the repo.
9. Business, legal, pricing, brand and content decisions belong to Dinesh; recommend, never decide.
10. Be honest about uncertainty; don't promise dates.
