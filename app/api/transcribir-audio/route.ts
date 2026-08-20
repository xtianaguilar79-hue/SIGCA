import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const HUGGING_FACE_MODEL = "openai/whisper-large-v3-turbo";
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const AUDIO_EXTENSIONS = new Set(["flac", "m4a", "mp3", "mp4", "mpeg", "mpga", "oga", "ogg", "opus", "wav", "webm"]);

function isSupportedAudio(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return file.type.startsWith("audio/") || AUDIO_EXTENSIONS.has(extension);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  }

  const token = process.env.HUGGING_FACE_TOKEN;
  if (!token) {
    console.error("[transcribir-audio] Falta la variable HUGGING_FACE_TOKEN en Vercel");
    return NextResponse.json(
      { error: "El servicio de transcripción no está configurado." },
      { status: 500 }
    );
  }

  const input = await request.formData();
  const file = input.get("audio");

  if (!(file instanceof File) || !isSupportedAudio(file)) {
    return NextResponse.json({ error: "Seleccioná un archivo de audio válido." }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "El audio debe pesar menos de 25 MB." }, { status: 400 });
  }

  try {
    const audioBuffer = await file.arrayBuffer();
    const mimeType = file.type || "audio/webm";
    const blob = new Blob([audioBuffer], { type: mimeType });

    const hfFormData = new FormData();
    hfFormData.append("file", blob, file.name || "audio.webm");

    const hfResponse = await fetch(
      `https://api-inference.huggingface.co/models/${HUGGING_FACE_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: hfFormData,
      }
    );

    // Modelo cargando (503) - informar al cliente para reintentar
    if (hfResponse.status === 503) {
      const retryData = await hfResponse.json().catch(() => null);
      const estimatedTime = retryData?.estimated_time || 20;
      return NextResponse.json(
        {
          error: `El modelo de transcripción está cargando. Reintentá en ${Math.ceil(estimatedTime)} segundos.`,
          code: "MODEL_LOADING",
          retryAfter: Math.ceil(estimatedTime),
        },
        { status: 503 }
      );
    }

    // Rate limit (429)
    if (hfResponse.status === 429) {
      return NextResponse.json(
        {
          error: "Se alcanzó el límite de requests gratuitos. Esperá un minuto e intentá nuevamente.",
          code: "RATE_LIMIT",
        },
        { status: 429 }
      );
    }

    // Otros errores HTTP
    if (!hfResponse.ok) {
      const errorText = await hfResponse.text().catch(() => "");
      console.error("[transcribir-audio] Hugging Face error:", hfResponse.status, errorText);
      return NextResponse.json(
        { error: "El servicio de transcripción respondió con un error." },
        { status: 502 }
      );
    }

    const result = await hfResponse.json().catch(() => null);

    if (!result || typeof result.text !== "string" || !result.text.trim()) {
      return NextResponse.json(
        { error: "No se detectó voz en el audio. Verificá que el micrófono haya captado sonido." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: result.text.trim() });
  } catch (error) {
    console.error("[transcribir-audio] Error al transcribir:", error);
    return NextResponse.json(
      { error: "No se pudo transcribir el audio." },
      { status: 502 }
    );
  }
}
