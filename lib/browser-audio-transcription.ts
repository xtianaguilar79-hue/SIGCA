"use client";

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error?: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: (audioTrack?: MediaStreamTrack) => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

let transcriptionQueue: Promise<void> = Promise.resolve();

function recognitionClass() {
  const browserWindow = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
}

function chromiumDesktopVersion() {
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return 0;
  const match = navigator.userAgent.match(/(?:Chrome|Chromium|Edg)\/(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function supportsSavedAudioRecognition() {
  // Siempre true porque hay fallback al servidor disponible
  return true;
}

function recognitionErrorMessage(code?: string) {
  if (code === "network") return "El servicio gratuito de reconocimiento no respondió. Revisá la conexión e intentá nuevamente.";
  if (code === "language-not-supported") return "El reconocimiento en español no está disponible en este navegador.";
  if (code === "not-allowed" || code === "service-not-allowed") return "El navegador bloqueó el reconocimiento de voz para este sitio.";
  if (code === "no-speech") return "No se detectó una voz clara en el audio.";
  return "El navegador no pudo transcribir este audio.";
}

async function transcribeViaServer(blob: Blob, onStatus: (message: string) => void): Promise<string> {
  onStatus("Enviando audio al servicio de transcripción…");

  const file = new File([blob], "audio.webm", { type: blob.type || "audio/webm" });
  const formData = new FormData();
  formData.append("audio", file);

  let response: Response;
  try {
    response = await fetch("/api/transcribir-audio", {
      method: "POST",
      body: formData,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Error de red";
    throw new Error(`No se pudo conectar con el servidor: ${message}`);
  }

  const data = await response.json().catch(() => null);

  if (response.status === 503) {
    const retryAfter = data?.retryAfter || 20;
    throw new Error(`El modelo está cargando. Esperá ${retryAfter} segundos e intentá nuevamente.`);
  }

  if (response.status === 429) {
    throw new Error("Se alcanzó el límite gratuito. Esperá un minuto e intentá nuevamente.");
  }

  if (response.status === 401) {
    throw new Error("Tu sesión expiró. Recargá la página e iniciá sesión nuevamente.");
  }

  if (!response.ok) {
    const message = data?.error || "El servicio de transcripción respondió con un error.";
    throw new Error(message);
  }

  if (!data || typeof data.text !== "string" || !data.text.trim()) {
    throw new Error("La transcripción no devolvió texto válido.");
  }

  onStatus("Transcripción completada.");
  return data.text.trim();
}

async function transcribeViaBrowser(blob: Blob, onStatus: (message: string) => void): Promise<string> {
  const RecognitionClass = recognitionClass();
  if (!RecognitionClass) {
    throw new Error("Este navegador no soporta reconocimiento de voz.");
  }

  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) throw new Error("Este navegador no puede preparar el audio guardado.");

  const context = new AudioContextClass();
  const sourceUrl = URL.createObjectURL(blob);
  const media = new Audio(sourceUrl);
  media.preload = "auto";
  const destination = context.createMediaStreamDestination();
  const source = context.createMediaElementSource(media);
  const track = destination.stream.getAudioTracks()[0];
  let service: Recognition | null = null;
  source.connect(destination);

  try {
    onStatus("Preparando el audio guardado…");
    await context.resume();
    await new Promise<void>((resolve, reject) => {
      if (media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return resolve();
      media.onloadeddata = () => resolve();
      media.onerror = () => reject(new Error("El navegador no pudo leer el formato de este audio."));
      media.load();
    });

    const activeService = new RecognitionClass();
    service = activeService;
    activeService.lang = "es-AR";
    activeService.continuous = true;
    activeService.interimResults = false;
    let transcript = "";
    let recognitionFailure: Error | null = null;

    const result = new Promise<string>((resolve, reject) => {
      activeService.onresult = (event) => {
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          if (event.results[index].isFinal) transcript += `${event.results[index][0].transcript} `;
        }
      };
      activeService.onerror = (event) => {
        recognitionFailure = new Error(recognitionErrorMessage(event.error));
      };
      activeService.onend = () => {
        if (recognitionFailure) reject(recognitionFailure);
        else if (transcript.trim()) resolve(transcript.trim());
        else reject(new Error("La transcripción terminó sin detectar palabras. El audio sigue guardado."));
      };
    });

    media.onended = () => activeService.stop();
    onStatus("Transcribiendo con el reconocimiento del navegador…");
    activeService.start(track);
    await media.play();
    return await result;
  } finally {
    try { service?.abort(); } catch { /* La sesión ya había terminado. */ }
    media.pause();
    source.disconnect();
    track.stop();
    await context.close().catch(() => undefined);
    URL.revokeObjectURL(sourceUrl);
  }
}

async function runTranscription(blob: Blob, onStatus: (message: string) => void): Promise<string> {
  const canUseBrowser = chromiumDesktopVersion() >= 135 && Boolean(recognitionClass());

  if (canUseBrowser) {
    try {
      return await transcribeViaBrowser(blob, onStatus);
    } catch (browserError) {
      console.warn("[transcribe] Método nativo falló, usando fallback del servidor:", browserError);
      onStatus("El método nativo falló. Intentando con el servidor…");
      return transcribeViaServer(blob, onStatus);
    }
  }

  return transcribeViaServer(blob, onStatus);
}

export function transcribeSavedAudio(blob: Blob, onStatus: (message: string) => void) {
  let resolveTask!: (text: string) => void;
  let rejectTask!: (error: unknown) => void;
  const result = new Promise<string>((resolve, reject) => {
    resolveTask = resolve;
    rejectTask = reject;
  });
  transcriptionQueue = transcriptionQueue
    .then(async () => resolveTask(await runTranscription(blob, onStatus)))
    .catch(rejectTask)
    .then(() => undefined, () => undefined);
  return result;
}
