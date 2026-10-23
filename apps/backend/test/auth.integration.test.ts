// Integration: auth/session boundaries. Pure Node — no DB, no network.
// Covers the two trust boundaries every request passes: the JWT cookie
// middleware and the GitHub webhook HMAC middleware.
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { authMiddlewareJWT } from "../src/middleware/auth.middleware.js";
import { validateWebhook } from "../src/modules/githubApp/githubApp.controller.js";
import { AppError } from "../src/middleware/error.middleware.js";
import { env } from "../src/lib/env.js";
import { fakeRes } from "./integration.helpers.js";

test("auth middleware passes a valid JWT through with the user id", () => {
  const token = jwt.sign({ userId: 42 }, env.JWT_SECRET, { expiresIn: "1m" });
  const req: any = { method: "GET", cookies: { token } };
  const res = fakeRes();
  const nextCalls: unknown[][] = [];

  authMiddlewareJWT(req, res, (...args: unknown[]) => nextCalls.push(args));

  assert.equal(nextCalls.length, 1);
  assert.deepEqual(nextCalls[0], []); // no error argument
  assert.equal(req.user.id, 42);
  assert.equal(res.statusCode, 0); // never responded directly
});

test("auth middleware rejects an invalid token with 403", () => {
  const token = jwt.sign({ userId: 42 }, "wrong-secret");
  const req: any = { method: "GET", cookies: { token } };
  const res = fakeRes();

  authMiddlewareJWT(req, res, () => {
    assert.fail("next must not run for an invalid token");
  });

  assert.equal(res.statusCode, 403);
});

test("auth middleware rejects an expired token with 401", () => {
  const token = jwt.sign({ userId: 42 }, env.JWT_SECRET, { expiresIn: "-10s" });
  const req: any = { method: "GET", cookies: { token } };
  const res = fakeRes();

  authMiddlewareJWT(req, res, () => {
    assert.fail("next must not run for an expired token");
  });

  assert.equal(res.statusCode, 401);
});

test("auth middleware throws 401 when no cookie is present", () => {
  const req: any = { method: "GET", cookies: {} };
  const res = fakeRes();

  assert.throws(() => authMiddlewareJWT(req, res, () => {}), (err: unknown) => {
    assert.ok(err instanceof AppError);
    assert.equal(err.statusCode, 401);
    return true;
  });
});

function signedWebhookRequest(
  payload: Record<string, unknown>,
  overrides: Record<string, string> = {},
) {
  const rawBody = Buffer.from(JSON.stringify(payload));
  const req: any = {
    headers: {
      "x-hub-signature-256":
        overrides["x-hub-signature-256"] ??
        "sha256=" +
          crypto.createHmac("sha256", env.GITHUB_APP_SECRET).update(rawBody).digest("hex"),
      "x-github-event": overrides["x-github-event"] ?? "push",
    },
    body: payload,
    rawBody,
  };
  return req;
}

test("webhook middleware accepts a correctly signed push request", async () => {
  const req = signedWebhookRequest({ after: "a".repeat(40), repository: { id: 1 } });
  const res = fakeRes();
  let nextCalled = 0;

  await validateWebhook(req, res, () => nextCalled++);

  assert.equal(nextCalled, 1);
  assert.equal(res.statusCode, 0);
});

test("webhook middleware rejects a tampered signature with 401", async () => {
  const req = signedWebhookRequest({ after: "a".repeat(40), repository: { id: 1 } }, {
    "x-hub-signature-256": "sha256=" + "0".repeat(64),
  });
  const res = fakeRes();

  await validateWebhook(req, res, () => {
    assert.fail("next must not run for a bad signature");
  });

  assert.equal(res.statusCode, 401);
});

test("webhook middleware rejects a missing signature with 401", async () => {
  const req = signedWebhookRequest({}, { "x-hub-signature-256": "" });
  const res = fakeRes();

  await validateWebhook(req, res, () => {
    assert.fail("next must not run without a signature");
  });

  assert.equal(res.statusCode, 401);
});

test("webhook middleware rejects non-push events with a 400 AppError", async () => {
  const req = signedWebhookRequest({}, { "x-github-event": "issues" });
  const res = fakeRes();

  await assert.rejects(
    () => validateWebhook(req, res, () => {}),
    (err: unknown) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});
