import assert from "node:assert/strict";
import test from "node:test";
import { createCustomerAccountHandler } from "../api/customer-account.js";
import { createCustomerAccountService, createMemoryCustomerAccountStore } from "../lib/customer-account/service.js";

function responseCapture() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = String(value);
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

async function call(handler, { method = "GET", url = "/api/customer-account", cookie = "", body = null } = {}) {
  const response = responseCapture();
  await handler({ method, url, headers: cookie ? { cookie } : {}, body }, response);
  return response;
}

test("handler issues an HttpOnly strict cookie and never returns its opaque token", async () => {
  const service = createCustomerAccountService({ store: createMemoryCustomerAccountStore() });
  const handler = createCustomerAccountHandler({ service });
  const registered = await call(handler, {
    method: "POST",
    body: JSON.stringify({ action: "register", username: "private_user", password: "private password 123" })
  });
  assert.equal(registered.statusCode, 200);
  assert.match(registered.headers["set-cookie"], /^ke_beta_session=[A-Za-z0-9_-]+; Path=\/; HttpOnly; SameSite=Strict;/);
  assert.equal(registered.payload.session.token, undefined);
  assert.equal(registered.headers["cache-control"], "no-store");

  const cookie = registered.headers["set-cookie"].split(";")[0];
  const session = await call(handler, { cookie });
  assert.equal(session.payload.account.username, "private_user");

  const history = await call(handler, { method: "GET", url: "/api/customer-account?action=history", cookie });
  assert.deepEqual(history.payload.listings, []);

  const signedOut = await call(handler, {
    method: "POST",
    cookie,
    body: JSON.stringify({ action: "logout" })
  });
  assert.match(signedOut.headers["set-cookie"], /Max-Age=0/);
});

test("handler fails honestly when a durable store is not configured", async () => {
  const original = process.env.KATHERINES_EYE_ACCOUNT_STORE_PATH;
  delete process.env.KATHERINES_EYE_ACCOUNT_STORE_PATH;
  try {
    const response = await call(createCustomerAccountHandler());
    assert.equal(response.statusCode, 503);
    assert.equal(response.payload.code, "account_service_unavailable");
  } finally {
    if (original === undefined) delete process.env.KATHERINES_EYE_ACCOUNT_STORE_PATH;
    else process.env.KATHERINES_EYE_ACCOUNT_STORE_PATH = original;
  }
});
