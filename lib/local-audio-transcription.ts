"use client";

type ActiveRequest = {
  resolve: (text: string) => void;
  reject: (error: Error) => void;
  onStatus: (message: string) => void;
};

let worker: Worker | null = null;
let activeRequest: ActiveRequest | null = null;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("../workers/local-transcriber.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ type: string; message?: string; text?: string; error?: string }>) => {
      const request = activeRequest;
      if (!request) return;
      if (event.data.type === "progress") request.onStatus(event.data.message || "Preparando…");
      if (event.data.type === "complete") {
        request.resolve(event.data.text || "");
        activeRequest = null;
      }
      if (event.data.type === "error") {
        request.reject(new Error(event.data.error || "No se pudo transcribir localmente."));
        activeRequest = null;
      }
    };
    worker.onerror = () => {
      activeRequest?.reject(new Error("El transcriptor local no pudo iniciarse en este navegador."));
      activeRequest = null;
      worker?.terminate();
      worker = null;
    };
  }
  return worker;
}

async function decodeAt16Khz(blob: Blob) {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) throw new Error("Este navegador no puede procesar el formato de audio.");
  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const frameCount = Math.max(1, Math.ceil(decoded.duration * 16000));
    const offline = new OfflineAudioContext(1, frameCount, 16000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return new Float32Array(rendered.getChannelData(0));
  } finally {
    await context.close();
  }
}

export async function transcribeLocally(blob: Blob, onStatus: (message: string) => void) {
  if (activeRequest) throw new Error("Ya hay otro audio transcribiéndose. Esperá a que termine.");
  onStatus("Preparando el audio…");
  const audio = await decodeAt16Khz(blob);
  return new Promise<string>((resolve, reject) => {
    activeRequest = { resolve, reject, onStatus };
    getWorker().postMessage({ audio }, [audio.buffer]);
  });
}

