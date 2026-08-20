import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Modelo pequeño, garantizado en capa gratuita
const HUGGING_FACE_MODEL = "openai/whisper-small";
const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models";
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const AUDIO_EXTENSIONS = new Set(["flac", "m4a", "mp3", "mp4", "mpeg", "mpga", "oga", "ogg", "opus", "wav", "webm"]);

function isSupportedAudio(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return file.type.startsWith("audio/") || AUDIO_EXTENSIONS.has(extension);
}

async function callHuggingFace(token: string, formData: FormData, attempt: number = 1): Promise<Response> {
  const url = `${HUGGING_FACE_API_URL}/${HUGGING_FACE_MODEL}`;
  
  console.log(`[transcribir-audio] Intento ${attempt} - URL:`, url);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    console.log(`[transcribir-audio] Respuesta intento ${attempt}:`, response.status, response.statusText);
    return response;
  } catch (error) {
    console.error(`[transcribir-audio] Error en intento ${attempt}:`, error);
    
    // Si es error de DNS y es el primer intento, reintentar una vez
    if (attempt === 1 && String(error).includes("ENOTFOUND")) {
      console.log("[transcribir-audio] Error de DNS, reintentando en 2 segundos...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return callHuggingFace(token, formData, attempt + 1);
    }
    
    throw error;
  }
}

export async function POST(request: Request) {
  console.log("[transcribir-audio] === INICIO TRANSCRIPCIÓN ===");
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("[transcribir-audio] Error: Sesión no válida");
    return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  }

  console.log("[transcribir-audio] Usuario autenticado:", user.email);

  const token = process.env.HUGGING_FACE_TOKEN;
  if (!token) {
    console.error("[transcribir-audio] Error: Falta HUGGING_FACE_TOKEN en Vercel");
    return NextResponse.json(
      { error: "El servicio de transcripción no está configurado en el servidor." },
      { status: 500 }
    );
  }

  console.log("[transcribir-audio] Token encontrado (primeros 10 chars):", token.substring(0, 10) + "...");

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
    const audioBuffer = await file.arrayBuffer();
    const mimeType = file.type || "audio/webm";
    const blob = new Blob([audioBuffer], { type: mimeType });

    const hfFormData = new FormData();
    hfFormData.append("file", blob, file.name || "audio.webm");

    console.log("[transcribir-audio] Enviando a Hugging Face...");

    const hfResponse = await callHuggingFace(token, hfFormData);

    // Modelo cargando (503)
    if (hfResponse.status === 503) {
      const retryData = await hfResponse.json().catch(() => null);
      console.warn("[transcribir-audio] Modelo cargando:", retryData);
      const estimatedTime = retryData?.estimated_time || 20;
      return NextResponse.json(
        {
          error: `El modelo está cargando. Esperá ${Math.ceil(estimatedTime)} segundos e intentá nuevamente.`,
          code: "MODEL_LOADING",
          retryAfter: Math.ceil(estimatedTime),
        },
        { status: 503 }
      );
    }

    // Rate limit (429)
    if (hfResponse.status === 429) {
      console.warn("[transcribir-audio] Rate limit alcanzado");
      return NextResponse.json(
        {
          error: "Se alcanzó el límite gratuito. Esperá un minuto e intentá nuevamente.",
          code: "RATE_LIMIT",
        },
        { status: 429 }
      );
    }

    // Token inválido (401)
    if (hfResponse.status === 401) {
      const errorText = await hfResponse.text();
      console.error("[transcribir-audio] Token inválido:", errorText);
      return NextResponse.json(
        { error: "El token de Hugging Face es inválido. Contactá al administrador." },
        { status: 401 }
      );
    }

    // Otros errores HTTP
    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error("[transcribir-audio] Error de Hugging Face:", hfResponse.status, errorText);
      return NextResponse.json(
        { error: `Error del servicio de transcripción: ${errorText}` },
        { status: 502 }
      );
    }

    const result = await hfResponse.json().catch(() => null);
    console.log("[transcribir-audio] Resultado de Hugging Face:", result);

    if (!result || typeof result.text !== "string" || !result.text.trim()) {
      console.error("[transcribir-audio] Respuesta vacía o inválida:", result);
      return NextResponse.json(
        { error: "No se detectó voz en el audio. Verificá que el micrófono haya captado sonido." },
        { status: 422 }
      );
    }

    console.log("[transcribir-audio] Transcripción exitosa, longitud:", result.text.length);
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
