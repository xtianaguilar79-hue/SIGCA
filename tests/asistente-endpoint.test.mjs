import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as core from "../lib/asistente/core.ts";

// Execute the actual endpoint, replacing only external boundaries.
function endpoint(options = {}) {
  const calls = [];
  const source = readFileSync(new URL("../app/api/asistente/route.ts", import.meta.url), "utf8");
  const profile = options.profile === undefined ? { activo: true, estado: "Aprobado" } : options.profile;
  const supabase = {
    auth: { getUser: async () => { calls.push("auth"); return { data: { user: options.anonymous ? null : { id: "user-1" } } }; } },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile, error: options.profileError }) }) }) }),
    rpc: () => ({ abortSignal: async () => { calls.push("quota"); return { data: options.quota ?? true, error: options.quotaError }; } }),
  };
  const compiledModule = { exports: {} };
  const require = name => {
    if (name === "next/server") return { NextResponse: { json: (data, init) => Response.json(data, init) } };
    if (name.endsWith("supabase/server")) return { createClient: async () => supabase };
    if (name.endsWith("asistente/core")) return core;
    if (name.endsWith("asistente/retrieve")) return { retrieveEvidence: async () => { calls.push("retrieve"); if (options.throw) throw Error("private DB error"); return { sources: options.sources || [], incomplete: Boolean(options.incomplete) }; } };
    throw Error(name);
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: compiledModule.exports, require, Request, Response, URL, TextDecoder, AbortSignal });
  return { post: compiledModule.exports.POST, calls };
}
function request(change = {}, headers = {}) {
  return new Request("https://sigca.example/api/asistente", { method: "POST", headers: { origin: "https://sigca.example", "content-type": "application/json", ...headers }, body: JSON.stringify({ question: "jornada", path: "/gestion", scope: "all", ...change }) });
}
test("unauthenticated requests never reach evidence retrieval", async () => {
  const api = endpoint({ anonymous: true });
  assert.equal((await api.post(request())).status, 401);
  assert.deepEqual(api.calls, ["auth"]);
});
test("inactive, absent and unapproved profiles cannot retrieve evidence", async () => {
  for (const profile of [null, { activo: false, estado: "Aprobado" }, { activo: null, estado: "Aprobado" }, { activo: true, estado: "Pendiente" }]) {
    const api = endpoint({ profile });
    assert.equal((await api.post(request())).status, 403);
    assert.ok(!api.calls.includes("retrieve"));
  }
});
test("origin and request bounds rejected before authentication", async () => {
  for (const req of [request({}, { origin: "https://evil.example" }), request({ question: "x".repeat(1201) }), request({ unused: "x".repeat(9000) }), request({ scope: "record" }), request({}, { "sec-fetch-site": "cross-site" })]) {
    const api = endpoint();
    assert.ok([400, 403].includes((await api.post(req)).status));
    assert.deepEqual(api.calls, []);
  }
});
test("invalid JSON and content type fail safely", async () => {
  const api = endpoint();
  assert.equal((await api.post(request({}, { "content-type": "text/plain" }))).status, 415);
  const req = new Request("https://sigca.example/api/asistente", { method: "POST", headers: { origin: "https://sigca.example", "content-type": "application/json" }, body: "{" });
  assert.equal((await api.post(req)).status, 400);
});
test("quota is enforced and not confused with missing evidence", async () => {
  const api = endpoint({ quota: false });
  const response = await api.post(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.ok(!api.calls.includes("retrieve"));
});
test("missing migration fails closed before retrieval", async () => {
  const api = endpoint({ quotaError: { message: "missing function" } });
  assert.equal((await api.post(request())).status, 503);
  assert.ok(!api.calls.includes("retrieve"));
});
test("valid empty search abstains without caching", async () => {
  const response = await endpoint().post(request());
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal((await response.json()).message, core.NO_EVIDENCE);
});
test("failed retrieval is not reported as no evidence and exposes no DB errors", async () => {
  for (const options of [{ incomplete: true }, { throw: true }]) {
    const response = await endpoint(options).post(request());
    assert.equal(response.status, 503);
    const text = await response.text();
    assert.ok(!text.includes(core.NO_EVIDENCE));
    assert.ok(!text.includes("private DB error"));
  }
});
test("partial search with evidence remains explicitly partial", async () => {
  const source = { id: "a", module: "actas", title: "Acta", excerpt: "Real", href: "/gestion/sindical/actas/a" };
  const response = await endpoint({ sources: [source], incomplete: true }).post(request());
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.incomplete, true);
  assert.deepEqual(data.sources, [source]);
});
