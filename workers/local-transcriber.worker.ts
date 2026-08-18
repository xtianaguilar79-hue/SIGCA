/// <reference lib="webworker" />

import { env, pipeline } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

type Transcriber = Awaited<ReturnType<typeof pipeline<"automatic-speech-recognition">>>;
let transcriberPromise: Promise<Transcriber> | null = null;

function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny", {
      progress_callback: (progress) => {
        const item = progress as { status?: string; progress?: number; file?: string };
        if (item.status === "progress" && typeof item.progress === "number") {
          self.postMessage({ type: "progress", message: `Descargando el modelo local… ${Math.round(item.progress)}%` });
        } else if (item.status === "ready") {
          self.postMessage({ type: "progress", message: "Modelo listo. Analizando el audio…" });
        }
      },
    });
  }
  return transcriberPromise;
}

self.onmessage = async (event: MessageEvent<{ audio: Float32Array }>) => {
  try {
    self.postMessage({ type: "progress", message: "Preparando el transcriptor local…" });
    const transcriber = await getTranscriber();
    self.postMessage({ type: "progress", message: "Transcribiendo en este dispositivo…" });
    const output = await transcriber(event.data.audio, { language: "spanish", task: "transcribe" });
    const result = Array.isArray(output) ? output[0] : output;
    const text = result?.text?.trim() || "";
    if (!text) throw new Error("El modelo no pudo reconocer texto en el audio.");
    self.postMessage({ type: "complete", text });
  } catch (error) {
    self.postMessage({ type: "error", error: error instanceof Error ? error.message : "No se pudo ejecutar la transcripción local." });
  }
};

export {};

