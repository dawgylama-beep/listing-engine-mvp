import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createCustomerAccountService,
  createFileCustomerAccountStore,
  createMemoryCustomerAccountStore,
  sanitizeHistorySnapshot,
  validateUsername
} from "../lib/customer-account/service.js";

const sampleSnapshot = {
  title: "Walnut valet tray",
  workflow: "personal_use",
  identification: { confidence: "Moderate", summary: "A divided walnut tray with an unverified maker mark." },
  listing: {
    title: "Walnut valet tray with divider",
    description: "Warm walnut organizer with a removable divider.",
    itemDetails: ["Wood construction", "Removable divider"],
    visibleCondition: ["Light surface wear"]
  },
  pricing: { disposition: "Pricing not established", range: "", rationale: "No retained price-bearing evidence." },
  recommendation: "Inspect beneath the divider before buying.",
  uncertainty: ["Maker not verified"],
  alternatives: ["Desk organizer"],
  requestedPhotos: ["Underside"],
  researchSteps: ["Check the maker mark"],
  evidence: [{ source: "Example market", title: "Similar tray", url: "https://example.com/tray", price: "Price unavailable" }],
  controllerDecision: "must not persist",
  privateEvidencePath: "C:\\private\\evidence"
};

test("usernames normalize case, enforce shape, and reject reserved names", () => {
  assert.deepEqual(validateUsername("  Alice_7  "), { ok: true, username: "alice_7", usernameKey: "alice_7" });
  assert.equal(validateUsername("ab").code, "invalid_username");
  assert.equal(validateUsername("7alice").code, "invalid_username");
  assert.equal(validateUsername("Katherine").code, "reserved_username");
});

test("history snapshots are allowlisted and image retention is always disabled", () => {
  const clean = sanitizeHistorySnapshot(sampleSnapshot);
  assert.equal(clean.title, "Walnut valet tray");
  assert.equal(clean.imageRetention, "none");
  assert.equal(clean.controllerDecision, undefined);
  assert.equal(clean.privateEvidencePath, undefined);
  assert.equal(clean.evidence[0].url, "https://example.com/tray");
  assert.equal(sanitizeHistorySnapshot({ evidence: [{ url: "file:///private/path" }] }).evidence.length, 0);
});

test("accounts, sessions, history ownership, rename, delete, retention, export, and deletion are enforced server-side", async () => {
  let nowMilliseconds = Date.parse("2026-08-30T12:00:00.000Z");
  const store = createMemoryCustomerAccountStore();
  const service = createCustomerAccountService({ store, now: () => nowMilliseconds });
  const alice = await service.register({ username: "Alice_7", password: "correct horse battery" });
  const bob = await service.register({ username: "Bob_8", password: "another safe password" });

  assert.equal(alice.account.username, "alice_7");
  await assert.rejects(
    service.register({ username: "ALICE_7", password: "different safe password" }),
    (error) => error.code === "username_unavailable"
  );
  await assert.rejects(
    service.login({ username: "alice_7", password: "wrong password" }),
    (error) => error.code === "invalid_credentials"
  );

  const saved = await service.saveListing(alice.session.token, sampleSnapshot);
  const listingId = saved.listing.id;
  assert.equal(saved.listing.snapshot.imageRetention, "none");
  assert.equal(saved.listing.ownerAccountId, undefined);
  assert.equal(saved.listing.expiresAtMilliseconds, undefined);
  assert.equal((await service.listHistory(alice.session.token)).listings.length, 1);
  assert.equal((await service.getListing(alice.session.token, listingId)).listing.name, "Walnut valet tray");

  for (const operation of [
    () => service.getListing(bob.session.token, listingId),
    () => service.renameListing(bob.session.token, listingId, "Stolen name"),
    () => service.deleteListing(bob.session.token, listingId)
  ]) {
    await assert.rejects(operation, (error) => error.code === "listing_not_found");
  }

  assert.equal((await service.renameListing(alice.session.token, listingId, "Entryway organizer")).listing.name, "Entryway organizer");
  const preferences = await service.updatePreferences(alice.session.token, { historyRetentionDays: 7 });
  assert.equal(preferences.account.preferences.historyRetentionDays, 7);

  const exported = await service.exportAccount(alice.session.token);
  const exportText = JSON.stringify(exported);
  assert.equal(exported.export.boundaries.uploadedImagesStored, false);
  assert.equal(/"(?:password|digest|salt|token)"/i.test(exportText), false);

  nowMilliseconds += 8 * 86400000;
  const refreshedAlice = await service.login({ username: "alice_7", password: "correct horse battery" });
  assert.equal((await service.listHistory(refreshedAlice.session.token)).listings.length, 0);

  await assert.rejects(
    service.deleteAccount(refreshedAlice.session.token, "wrong password"),
    (error) => error.code === "invalid_credentials"
  );
  await service.deleteAccount(refreshedAlice.session.token, "correct horse battery");
  await assert.rejects(service.session(refreshedAlice.session.token), (error) => error.code === "authentication_required");

  const raw = await store.read();
  assert.equal(raw.accounts[alice.account.id], undefined);
  assert.equal(raw.histories[alice.account.id], undefined);
});

test("file-backed adapter preserves opaque sessions across fresh service processes", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ke-account-store-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "accounts.json");
  const first = createCustomerAccountService({ store: createFileCustomerAccountStore(filePath) });
  const registered = await first.register({ username: "fresh_user", password: "a durable local password" });
  await first.saveListing(registered.session.token, sampleSnapshot);

  const second = createCustomerAccountService({ store: createFileCustomerAccountStore(filePath) });
  assert.equal((await second.session(registered.session.token)).account.username, "fresh_user");
  assert.equal((await second.listHistory(registered.session.token)).listings.length, 1);

  const rawText = await fs.readFile(filePath, "utf8");
  assert.equal(rawText.includes(registered.session.token), false);
  assert.equal(rawText.includes("a durable local password"), false);
});
