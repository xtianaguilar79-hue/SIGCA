import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { composeAnswer, excerpt, NO_EVIDENCE, pageContext, parseRequest, plainText, searchTerms } from "../lib/asistente/core.ts";

test("context is an allowlisted route, not an arbitrary URL", () => {
  assert.deepEqual(pageContext("/gestion/sindical/actas/abc-123/editar"), { module: "actas", recordId: "abc-123", label: "Actas y minutas" });
  assert.equal(pageContext("/gestion/sindical/sindical/visitas/123").module, "visitas");
  for (const route of ["https://evil.test/gestion/biblioteca", "/gestion/biblioteca/../../usuarios", "/gestion/reclamos/%2fsecreto"]) assert.equal(pageContext(route).module, undefined);
});
test("input limits and context scopes are validated on the server", () => {
  const valid = { question: " jornada ", path: "/gestion", scope: "all" };
  assert.equal(parseRequest(valid)?.question, "jornada");
  for (const change of [{ question: " " }, { question: "x".repeat(1201) }, { question: [] }, { path: "/gestion-falsa" }, { scope: "record" }, { scope: "module" }, { scope: "admin" }]) assert.equal(parseRequest({ ...valid, ...change }), null);
  assert.equal(parseRequest({ ...valid, path: "/gestion/biblioteca/ley-1", scope: "record" })?.scope, "record");
  assert.equal(parseRequest(null), null);
});
test("Spanish normalization and bounded search tokens", () => {
  assert.deepEqual(searchTerms("¿Qué dice sobre la jornada?"), ["jornada"]);
  assert.deepEqual(searchTerms("inspección INSPECCION"), ["inspeccion"]);
  assert.equal(searchTerms(Array.from({ length: 40 }, (_, i) => `palabra${i}`).join(" ")).length, 12);
  assert.ok(searchTerms("'); drop table usuarios; --").every(term => /^[a-z0-9]+$/.test(term)));
});
test("evidence text is rendered as text and stays bounded", () => {
  assert.equal(plainText("<p>Jornada &amp; descanso</p><script>evil()</script>"), "Jornada & descanso");
  assert.ok(excerpt("Inicio ".repeat(200) + "jornada establecida", ["jornada"]).includes("jornada"));
  assert.ok(excerpt("x".repeat(5000), []).length <= 701);
});
test("no evidence means explicit abstention, never generated facts", () => {
  const answer = composeAnswer([]);
  assert.equal(answer.message, NO_EVIDENCE);
  assert.deepEqual(answer.sources, []);
  assert.equal(answer.mode, "extractive");
});
test("answer retains source provenance and partial-search state", () => {
  const source = { id: "1", module: "actas", title: "Acta", excerpt: "Texto real", href: "/gestion/sindical/actas/1" };
  assert.deepEqual(composeAnswer([source], true).sources, [source]);
  assert.equal(composeAnswer([source], true).incomplete, true);
  assert.match(composeAnswer([source]).message, /no una respuesta elaborada/);
});
test("retrieval SQL stays invoker-only, guarded by RLS and fixed table allowlist", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202609040001_sigca_asistente.sql", import.meta.url), "utf8");
  const search = sql.slice(sql.indexOf("create or replace function public.sigca_asistente_buscar"));
  assert.match(search, /security invoker/i);
  assert.doesNotMatch(search, /security definer/i);
  assert.match(search, /row_security_active/);
  assert.match(search, /limit 5/i);
  assert.match(search, /from public, anon/);
  assert.doesNotMatch(sql, /create policy|disable row level security/i);
});
test("endpoint verifies session, profile and quota and forbids caching", () => {
  const route = readFileSync(new URL("../app/api/asistente/route.ts", import.meta.url), "utf8");
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /profile\.activo !== true/);
  assert.match(route, /sigca_asistente_consumir_cupo/);
  assert.match(route, /private, no-store/);
  assert.match(route, /bytes > 8192/);
  assert.doesNotMatch(route, /SERVICE_ROLE|console\.log|console\.error/);
});
