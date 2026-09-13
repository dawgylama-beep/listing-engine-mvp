# Recovered private beta repair

Recovered September 13 from the recorded edits after the original temporary download and local commit became unavailable. This is a regenerated patch, not a claim that original commit 228554f is available remotely.
Base: 254c17e590b433f65eacf7a7be95f87485429fed, version 1.12.52.

Includes top-of-page Sign in/Create account and direct input focus, password-reset limitation disclosure, truthful analysis-failure messages, preserved photo selection, and a safe local request reference.

Earlier execution verified 18 desktop/mobile browser tests and 12 Node tests. This recovered checkout reran the full 34-case Playwright matrix: 33 passed and the intentionally desktop-only aesthetic matrix was skipped once in the mobile project. Both desktop and mobile completed the real account service plus controlled-provider photo, analysis, save, sign-out, sign-in, and history flow. No live analysis success is claimed. Offline execution of the real Preview handler reproduced a 502 before provider work because the installed SCC subprocess required owner-local learning/package/Git state that does not exist in Vercel. Hosted analysis now uses the deployable server-only provider transport, while explicit non-hosted local-beta cognition retains the authenticated SCC path. Reading the retained deployed request/response and Vercel logs remains a separately authenticated external action.

Apply in a separate product repair checkout, not the authenticated execution checkout. Preserve existing work. Use git apply --check before applying the enclosed patch. Do not replay completed controller operations or sequence 14/15. No push or deployment is performed by this package.

Before external beta: prove real provider photo analysis/save/reopen, verify invited non-team access using supported Preview protection, provide one canonical Preview URL across devices, test session expiry and error recovery, retain account deletion and image-retention disclosure. Do not share owner sessions or bypass tokens.
