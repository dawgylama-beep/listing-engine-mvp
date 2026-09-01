import { expect, test } from "@playwright/test";

test("account, private save, history, rename, retention, and delete controls work without provider activity", async ({ page }) => {
  const state = {
    account: null,
    listings: []
  };

  await page.route("**/api/customer-account**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let body = {};
    try {
      body = request.postDataJSON() || {};
    } catch {
    }
    const action = body.action || url.searchParams.get("action") || "session";
    const respond = (status, payload) => route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(payload)
    });

    if (action === "session") return respond(state.account ? 200 : 401, state.account ? { account: state.account } : { code: "authentication_required", error: "Sign in to continue." });
    if (action === "register") {
      state.account = {
        id: "account-browser",
        username: String(body.username).toLowerCase(),
        createdAt: "2026-08-30T12:00:00.000Z",
        preferences: { historyRetentionDays: 30, imageRetention: "none" }
      };
      return respond(200, { account: state.account, session: { expiresAt: "2026-08-31T00:00:00.000Z" } });
    }
    if (action === "save_listing") {
      state.listings.push({
        id: "listing-browser",
        name: body.snapshot.title,
        createdAt: "2026-08-30T12:00:00.000Z",
        updatedAt: "2026-08-30T12:00:00.000Z",
        expiresAt: "2026-09-29T12:00:00.000Z",
        workflow: body.snapshot.workflow,
        imageRetention: "none",
        snapshot: body.snapshot
      });
      return respond(200, { listing: state.listings[0] });
    }
    if (action === "history") return respond(200, { listings: state.listings.map(({ snapshot, ...listing }) => listing) });
    if (action === "listing") return respond(200, { listing: state.listings.find((listing) => listing.id === url.searchParams.get("listingId")) });
    if (action === "rename_listing") {
      state.listings[0].name = body.name;
      return respond(200, { listing: state.listings[0] });
    }
    if (action === "delete_listing") {
      state.listings = [];
      return respond(200, { deleted: true });
    }
    if (action === "preferences") {
      state.account.preferences.historyRetentionDays = body.historyRetentionDays;
      return respond(200, { account: state.account });
    }
    if (action === "delete_account") {
      state.account = null;
      state.listings = [];
      return respond(200, { deleted: true });
    }
    if (action === "logout") {
      state.account = null;
      return respond(200, { signedOut: true });
    }
    return respond(405, { code: "method_not_allowed", error: "Method not allowed." });
  });

  await page.goto("/");
  await page.locator("#account-menu-button").click();
  await expect(page.locator("#account-panel")).toBeVisible();
  await page.locator("#register-username").fill("Beta_User");
  await page.locator("#register-password").fill("a private beta password");
  await page.locator("#account-consent").check();
  await page.locator("#account-register-form button[type='submit']").click();
  await expect(page.locator("#account-username")).toHaveText("@beta_user");
  await expect(page.locator("#account-service-status")).toContainText("Account created");

  await page.locator("#account-close-button").click();
  await page.evaluate(() => {
    const report = {
      subjectIdentity: "Walnut valet tray",
      exactProductConfidence: "Moderate",
      identitySummary: "A divided wooden tray with an unverified maker mark.",
      valuationEvidenceLabel: "Pricing not established",
      fairValueNotEstablished: "No retained price-bearing evidence establishes a range.",
      recommendation: "Inspect beneath the divider before buying.",
      whatIsStillUnknown: ["Maker", "Condition beneath divider"],
      requestedAdditionalPhotos: ["Underside", "Maker mark"],
      recommendedResearchSteps: ["Search the visible mark after photographing it clearly."]
    };
    setReportActionsVisible(true);
    KatherinesEyeCustomerAccount.setCurrentReport(report, [], "personal_use");
  });
  await expect(page.locator("#save-listing-button")).toBeVisible();
  await page.locator("#save-listing-button").click();
  await expect(page.locator("#status")).toContainText("Uploaded image files were not retained");

  await page.locator("#open-history-button").click();
  await expect(page.locator("#history-panel")).toBeVisible();
  await expect(page.locator(".history-item")).toHaveCount(1);
  await page.locator(".history-item").getByRole("button", { name: "View" }).click();
  await expect(page.locator("#history-detail")).toContainText("Pricing not established");
  await expect(page.locator("#history-detail")).toContainText("Uploaded images not retained");

  await page.locator(".history-item input").fill("Entryway organizer");
  await page.locator(".history-item").getByRole("button", { name: "Rename" }).click();
  await expect(page.locator(".history-item h3")).toHaveText("Entryway organizer");

  await page.locator("#account-menu-button").click();
  await page.locator("#history-retention-days").selectOption("7");
  await page.locator("#retention-form button[type='submit']").click();
  await expect(page.locator("#account-service-status")).toContainText("7 days");
  await page.locator("#account-close-button").click();

  await page.locator(".history-item").getByRole("button", { name: "Delete", exact: true }).click();
  await page.locator(".history-item").getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.locator(".history-empty-state")).toBeVisible();
});

test("photo drop zone and privacy controls are keyboard reachable on mobile and desktop", async ({ page }) => {
  await page.route("**/api/customer-account**", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ code: "account_service_unavailable", error: "Private beta accounts are not configured in this environment." })
  }));
  await page.goto("/");
  const dropzone = page.locator("#photo-dropzone");
  await expect(dropzone).toHaveAttribute("tabindex", "0");
  await dropzone.focus();
  await expect(dropzone).toBeFocused();
  await expect(page.locator(".privacy-promise")).toContainText("does not add uploaded image files to saved history");
  await page.locator("#privacy-details-button").click();
  await expect(page.locator("#account-panel")).toBeVisible();
  await expect(page.locator("#account-service-status")).toContainText("configured secure account store");
});
