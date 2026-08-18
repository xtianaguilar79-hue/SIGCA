import { NextResponse } from "next/server";
import { transcribe } from "ai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  }

  const input = await request.formData();
  const file = input.get("audio");

  if (!(file instanceof File) || !file.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Seleccioná un archivo de audio válido." }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "El audio debe pesar menos de 25 MB." }, { status: 400 });
  }

  try {
    const result = await transcribe({
      model: "openai/gpt-4o-mini-transcribe",
      audio: new Uint8Array(await file.arrayBuffer()),
      providerOptions: {
        openai: { language: "es" },
      },
    });

    if (!result.text.trim()) {
      throw new Error("La transcripción llegó vacía.");
    }

    return NextResponse.json({ text: result.text.trim() });
  } catch (error) {
    console.error("No se pudo transcribir el audio mediante AI Gateway:", error);
    return NextResponse.json({ error: "No se pudo transcribir el audio." }, { status: 502 });
  }
}

