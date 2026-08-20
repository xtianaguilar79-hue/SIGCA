import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const AUDIO_EXTENSIONS = new Set(["flac", "m4a", "mp3", "mp4", "mpeg", "mpga", "oga", "ogg", "opus", "wav", "webm"]);

function isSupportedAudio(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return file.type.startsWith("audio/") || AUDIO_EXTENSIONS.has(extension);
}

export async function POST(request: Request) {
  console.log("[transcribir-audio] === INICIO TRANSCRIPCIÓN ===");
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("[transcribir-audio] Error: Sesión no válida");
    return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[transcribir-audio] Error: Falta GROQ_API_KEY en Vercel");
    return NextResponse.json(
      { error: "El servicio de transcripción no está configurado en el servidor." },
      { status: 500 }
    );
  }

  const input = await request.formData();
  const file = input.get("audio");

  if (!(file instanceof File) || !isSupportedAudio(file)) {
    console.error("[transcribir-audio] Error: Archivo no válido");
    return NextResponse.json({ error: "Seleccioná un archivo de audio válido." }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_AUDIO_BYTES) {
    console.error("[transcribir-audio] Error: Tamaño inválido", file.size);
    return NextResponse.json({ error: "El audio debe pesar menos de 25 MB." }, { status: 400 });
  }

  console.log("[transcribir-audio] Archivo recibido:", {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  try {
    // Groq requiere que el archivo se envíe como FormData con el nombre "file"
    const formData = new FormData();
    formData.append("file", file, file.name || "audio.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("language", "es"); // Forzar español para mejor precisión

    console.log("[transcribir-audio] Enviando a Groq (Whisper v3)...");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    console.log("[transcribir-audio] Respuesta de Groq:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[transcribir-audio] Error de Groq:", response.status, errorText);
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Se alcanzó el límite de requests gratuitos. Esperá un momento e intentá nuevamente." },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: `Error del servicio de transcripción: ${errorText}` },
        { status: 502 }
      );
    }

    const result = await response.json();
    console.log("[transcribir-audio] Transcripción exitosa. Texto:", result.text?.substring(0, 50) + "...");

    if (!result.text || !result.text.trim()) {
      return NextResponse.json(
        { error: "No se detectó voz en el audio. Verificá que el micrófono haya captado sonido." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: result.text.trim() });
  } catch (error) {
    console.error("[transcribir-audio] Error inesperado:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Error al transcribir: ${errorMessage}` },
      { status: 502 }
    );
  }
}
