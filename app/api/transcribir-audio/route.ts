import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "La transcripción de audios todavía no fue configurada." },
      { status: 503 },
    );
  }

  const input = await request.formData();
  const file = input.get("audio");

  if (!(file instanceof File) || !file.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Seleccioná un archivo de audio válido." }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "El audio debe pesar menos de 25 MB." }, { status: 400 });
  }

  const body = new FormData();
  body.set("file", file, file.name || "audio-whatsapp.ogg");
  body.set("model", process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe");
  body.set("language", "es");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
  });
  const result = (await response.json()) as { text?: string; error?: { message?: string } };

  if (!response.ok || !result.text?.trim()) {
    console.error("No se pudo transcribir el audio:", result.error?.message || response.statusText);
    return NextResponse.json({ error: "No se pudo transcribir el audio." }, { status: 502 });
  }

  return NextResponse.json({ text: result.text.trim() });
}

