# Katherine’s Eye controlled beta Preview checklist

This checklist is an operator gate. It does not deploy Katherine’s Eye or declare Preview ready by itself.

## Completed local threat-model findings

| Severity | Concrete finding at the accepted foundation checkpoint | Local disposition |
| --- | --- | --- |
| High | Any absolute account-store file path enabled accounts even in an ephemeral Vercel runtime, risking loss of account/session/history state. | Repaired: the default online handler rejects file persistence and stays Preview-blocked until a reviewed durable adapter is connected. |
| Medium | Cookie-authenticated mutations relied on `SameSite=Strict` without an exact Origin/Fetch-Metadata check or session-bound CSRF proof. | Repaired with fail-closed same-origin and CSRF verification. |
| Medium | Login and duplicate registration had no bounded abuse ceiling and differed materially in work/response behavior. | Repaired with persisted per-identity/per-source ceilings, dummy scrypt verification, equalized duplicate-registration hashing, and generic sensitive failures. |
| Medium | Password records did not bind scrypt parameters or support authenticated migration, and no password-change path revoked prior sessions. | Repaired with parameter-bound `scrypt-v2`, bounded legacy upgrade, and all-session revocation plus one rotated replacement. |
| Medium | The local adapter could remain blocked on a stale lock and had no last-known-good recovery after corrupt or interrupted persistence. | Repaired with bounded lock ownership/staleness, synchronized atomic writes, schema validation, a last-known-good file, and fail-closed dual corruption. |
| Medium | The local listener admitted the 30 MiB product body ceiling for account requests, and the account handler accepted non-JSON mutation media types. | Repaired with a 256 KiB route ceiling before bridge launch and strict JSON parsing. |

The review found no medium/high ownership bypass in history read, rename, delete, export, retention, or account deletion. Those operations already derive ownership from the authenticated server session. The saved-history allowlist already excludes uploaded images and private product fields; adversarial coverage now locks that behavior.

## Automated readiness

Call `GET /api/beta-readiness` in the candidate environment. Continue only when it returns `preview_ready`. The response contains booleans and blocker codes only; it never returns paths, credentials, connection strings, or secret values.

`local_ready` means the persistent Windows development server is ready for local account testing. It is not a Preview-readiness result. `preview_blocked` is fail-closed and must not be overridden by client code.

## Required configuration names

- `KATHERINES_EYE_PUBLIC_ORIGIN` — exact HTTPS origin for the controlled Preview.
- `VERCEL_ENV` — supplied by Vercel and used to distinguish Preview/Production from the persistent local server.
- `KATHERINES_EYE_ACCOUNT_STORE_PATH` — local Windows testing only. Never configure this as Preview or Production persistence.

No production database credential names are documented yet because no durable provider has been selected or connected. Select and review that service before adding its server-only environment keys. Do not invent a file path, temporary filesystem, or browser storage substitute.

## Durable persistence gate

The selected adapter must implement the repository’s compare-and-swap store contract:

- Read one versioned schema `2.0` snapshot and its nonnegative revision.
- Atomically commit only when the expected revision still matches.
- Retry bounded conflicts and fail closed after the ceiling.
- Preserve normalized username uniqueness and per-account history ownership inside the same atomic mutation.
- Retain the shared authentication-throttle state, absolute session expirations, and deterministic history-expiry cleanup.
- Encrypt transport and storage using the selected service’s reviewed facilities; Katherine must not implement custom encryption.
- Provide backup, restore, and corruption-recovery procedures tested outside Production.

The application factory accepts a durable store only through this contract. The default Vercel handler intentionally remains unavailable until the reviewed adapter is connected in source and tested.

## Security verification

- Confirm every account mutation rejects a missing or foreign `Origin`, cross-site Fetch Metadata, non-JSON bodies, missing/invalid CSRF tokens, and oversized bodies.
- Confirm cookies are opaque, `HttpOnly`, `SameSite=Strict`, `Path=/`, and `Secure` in Preview.
- Confirm successful authentication rotates the current session. Confirm password change revokes every prior session and issues one replacement.
- Confirm login and duplicate registration use generic responses and that per-identity and per-source throttle ceilings persist through the durable adapter.
- Confirm cross-account listing read, rename, delete, and export attempts fail without revealing ownership.
- Confirm exported records contain no passwords, password hashes, salts, session tokens, CSRF tokens, uploaded image bytes, provider data, authority material, or private paths.
- Confirm retention shortening deletes expired reports in the same atomic mutation, and run the adapter’s scheduled cleanup entry point.
- Confirm the frontend secret scan and dependency scan are clean using the exact candidate bytes.

## Controlled smoke transaction

In a non-Production Preview account created for the test: register, refresh the session, save one deterministic non-live customer fixture, list/open/rename/export/delete it, change the password, prove the old session is revoked, sign out, and delete the account. Confirm the durable record and all sessions are absent afterward.

Do not invoke the product provider merely to test accounts. Do not use customer images or historical benchmark material in this smoke transaction.

## Release stop conditions

Stop before Preview when the readiness endpoint is blocked, the public origin is not exact HTTPS, durable atomicity or cleanup is unproven, any security/adversarial test fails, the candidate contains secrets, or the repository differs from the approved checkpoint plus the single hardening commit.
