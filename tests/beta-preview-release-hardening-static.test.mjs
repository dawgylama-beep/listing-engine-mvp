import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("beta Preview security and release boundaries remain wired without browser secrets", () => {
  const handler = read("api/customer-account.js");
  const readiness = read("lib/customer-account/readiness.js");
  const service = read("lib/customer-account/service.js");
  const browser = read("public/customer-account.js");
  const browserSurface = `${read("public/index.html")}\n${read("public/app.js")}\n${browser}`;
  const vercel = read("vercel.json");
  const server = read("server.ps1");
  const checklist = read("BETA_PREVIEW_CHECKLIST.md");
  const checks = [
    [handler, 'runtimeProfile(environment) !== "local"', "Preview rejects local file persistence"],
    [handler, "KATHERINES_EYE_PUBLIC_ORIGIN", "Exact public origin required"],
    [handler, 'fetchSite !== "same-origin"', "Cross-site Fetch Metadata rejected"],
    [handler, "activeService.verifyCsrf", "CSRF synchronizer verified"],
    [handler, "MAX_ACCOUNT_REQUEST_BODY_BYTES", "Account bodies bounded before parsing"],
    [server, "$AccountMaxBodyBytes = 256 * 1024", "Local account bodies use smaller ceiling"],
    [service, 'algorithm: "scrypt-v2"', "Versioned scrypt parameters"],
    [service, "authenticationThrottle", "Authentication throttle is durable state"],
    [service, "SESSION_LIFETIME_MILLISECONDS", "Absolute session lifetime"],
    [service, "revokeAccountSessions(state, account.id)", "Password changes revoke account sessions"],
    [service, "compareAndSwap", "Durable adapter uses compare and swap"],
    [service, "await handle.sync()", "Atomic local writes synchronize contents"],
    [service, "backupPath", "Last known good recovery exists"],
    [browser, 'credentials: "same-origin"', "Browser uses same-origin credentials"],
    [browser, '"X-CSRF-Token": csrfToken', "Browser forwards CSRF token"],
    [readiness, 'PREVIEW_BLOCKED: "preview_blocked"', "Preview-blocked state is explicit"],
    [readiness, "atomicOwnershipMutations", "Readiness requires durable atomicity"],
    [vercel, "frame-ancestors 'none'", "Vercel CSP blocks framing"],
    [vercel, "X-Content-Type-Options", "Vercel response sniffing disabled"],
    [checklist, "`local_ready` means", "Operator gate distinguishes local readiness"],
    [checklist, "temporary filesystem", "Checklist forbids ephemeral persistence"]
  ];
  for (const [source, pattern, label] of checks) assert.ok(source.includes(pattern), label);
  assert.doesNotMatch(
    browserSurface,
    /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|OPENAI_API_KEY|SERPER_API_KEY|KATHERINES_EYE_ACCOUNT_STORE_PATH|ke_beta_session=/
  );
  assert.doesNotMatch(checklist, /(?:password|token|secret|key)\s*=\s*[^`\s]+/i);
});
