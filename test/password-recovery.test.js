import { test } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { handleRequest } from "../src/handler.js";

function makeRequest(body, authorization) {
  const request = Readable.from([Buffer.from(JSON.stringify(body))]);
  request.method = "POST";
  request.url = "/api/auth/recovery/password";
  request.headers = authorization ? { authorization } : {};
  request.socket = { remoteAddress: "127.0.0.1" };
  return request;
}

function makeResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body) {
      this.body = body || "";
    }
  };
}

test("password recovery requires a user bearer token", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("fetch must not be called without a user token");
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = makeResponse();
  await handleRequest(makeRequest({ password: "NewStrongPassword123!" }), response);

  assert.equal(response.statusCode, 401);
  assert.equal(JSON.parse(response.body).error.code, "invalid_recovery_session");
});

test("password recovery forwards the user session to Supabase Auth without exposing server key", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalSecret = process.env.SUPABASE_SECRET_KEY;
  const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.SUPABASE_URL = "https://project-ref.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "server-only-secret";
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  let capturedUrl = "";
  let capturedOptions;
  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return new Response(JSON.stringify({ id: "user-id" }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = originalSecret;
    if (originalServiceRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
  });

  const accessToken = "header.payload.signature";
  const response = makeResponse();
  await handleRequest(makeRequest(
    { password: "NewStrongPassword123!" },
    `Bearer ${accessToken}`
  ), response);

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).ok, true);
  assert.equal(capturedUrl, "https://project-ref.supabase.co/auth/v1/user");
  assert.equal(capturedOptions.method, "PUT");
  assert.equal(capturedOptions.headers.apikey, "server-only-secret");
  assert.equal(capturedOptions.headers.authorization, `Bearer ${accessToken}`);
  assert.deepEqual(JSON.parse(capturedOptions.body), { password: "NewStrongPassword123!" });
});

test("password recovery rejects passwords below the application minimum", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("fetch must not be called for an invalid password");
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = makeResponse();
  await handleRequest(makeRequest(
    { password: "too-short" },
    "Bearer header.payload.signature"
  ), response);

  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).error.code, "invalid_password");
});
