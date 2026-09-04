import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { composeAnswer, parseRequest } from "@/lib/asistente/core";
import { retrieveEvidence } from "@/lib/asistente/retrieve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie, Origin", ...(status === 429 ? { "Retry-After": "60" } : {}) } });
}

async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > 8192) throw new Error("body");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  const decoder = new TextDecoder();
  let bytes = 0, text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) { await reader.cancel(); throw new Error("body"); }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { reader.releaseLock(); }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return json({ error: "Origen no autorizado." }, 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Formato no admitido." }, 415);
  let input;
  try { input = parseRequest(await readBody(request)); } catch { return json({ error: "Consulta inválida o demasiado extensa." }, 400); }
  if (!input) return json({ error: "Revisá la pregunta y el alcance de búsqueda." }, 400);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Iniciá sesión para consultar el asistente." }, 401);
    const { data: profile, error: profileError } = await supabase.from("usuarios").select("activo,estado").eq("id", user.id).maybeSingle();
    if (profileError) return json({ error: "No se pudo verificar tu acceso. Intentá nuevamente." }, 503);
    if (!profile || profile.activo !== true || String(profile.estado).toLowerCase() !== "aprobado") return json({ error: "Tu usuario no está habilitado." }, 403);

    // Distributed quota; fail closed if the migration has not been installed.
    const { data: allowed, error: quotaError } = await supabase.rpc("sigca_asistente_consumir_cupo").abortSignal(AbortSignal.timeout(7000));
    if (quotaError) return json({ error: "El asistente no está disponible. Falta habilitar su configuración interna o hay un problema de conexión." }, 503);
    if (allowed !== true) return json({ error: "Llegaste al límite de consultas. Esperá un minuto." }, 429);

    const { sources, incomplete } = await retrieveEvidence(supabase, input.question, input.context, input.scope);
    if (incomplete && !sources.length) return json({ error: "No pude consultar todas las fuentes internas. Intentá nuevamente; esto no significa que no haya información." }, 503);
    return json(composeAnswer(sources, incomplete));
  } catch {
    // No raw database errors, prompts, cookies or institutional content in logs.
    return json({ error: "No pude completar la consulta. Intentá nuevamente." }, 503);
  }
}
