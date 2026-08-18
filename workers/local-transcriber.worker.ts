/// <reference lib="webworker" />

import { env, pipeline } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

type Transcriber = Awaited<ReturnType<typeof pipeline<"automatic-speech-recognition">>>;
let transcriberPromise: Promise<Transcriber> | null = null;
let useStandardModel = false;

function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", {
      dtype: useStandardModel ? "fp32" : "q8",
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

async function runTranscription(audio: Float32Array) {
  const transcriber = await getTranscriber();
  self.postMessage({ type: "progress", message: "Transcribiendo en este dispositivo…" });
  const output = await transcriber(audio, { language: "spanish", task: "transcribe" });
  const result = Array.isArray(output) ? output[0] : output;
  const text = result?.text?.trim() || "";
  if (!text) throw new Error("El modelo no pudo reconocer texto en el audio.");
  return text;
}

self.onmessage = async (event: MessageEvent<{ audio: Float32Array }>) => {
  try {
    self.postMessage({ type: "progress", message: "Preparando el transcriptor local…" });
    let text: string;
    try {
      text = await runTranscription(event.data.audio);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const incompatibleQuantization = /create a session|Missing required scale|TransposeDQWeightsForMatMulNBits/i.test(message);
      if (!incompatibleQuantization || useStandardModel) throw error;
      useStandardModel = true;
      transcriberPromise = null;
      self.postMessage({ type: "progress", message: "El dispositivo necesita el modelo compatible. Descargando una sola vez…" });
      text = await runTranscription(event.data.audio);
    }
    self.postMessage({ type: "complete", text });
  } catch (error) {
    transcriberPromise = null;
    self.postMessage({ type: "error", error: error instanceof Error ? error.message : "No se pudo ejecutar la transcripción local." });
  }
};

export {};

