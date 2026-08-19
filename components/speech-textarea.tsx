"use client";

import { ChangeEvent, ClipboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { deleteAudio, listAudios, saveAudio, StoredAudio } from "@/lib/offline-audio-store";
import { supportsSavedAudioRecognition, transcribeSavedAudio } from "@/lib/browser-audio-transcription";

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void;
};
type RecognitionConstructor = new () => Recognition;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_RECORDING_SECONDS = 30 * 60;
const PROCESSING_AUDIO_IDS = new Set<string>();
const AUDIO_EXTENSIONS = new Set(["flac", "m4a", "mp3", "mp4", "mpeg", "mpga", "oga", "ogg", "opus", "wav", "webm"]);
const MIME_BY_EXTENSION: Record<string, string> = {
  flac: "audio/flac", m4a: "audio/mp4", mp3: "audio/mpeg", mp4: "audio/mp4",
  mpeg: "audio/mpeg", mpga: "audio/mpeg", oga: "audio/ogg", ogg: "audio/ogg",
  opus: "audio/ogg", wav: "audio/wav", webm: "audio/webm",
};

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function isSupportedAudio(file: File) {
  return file.type.startsWith("audio/") || AUDIO_EXTENSIONS.has(extensionOf(file.name));
}

function normalizeAudio(file: File) {
  const type = file.type.startsWith("audio/") ? file.type : MIME_BY_EXTENSION[extensionOf(file.name)] || "audio/webm";
  return new File([file], file.name || `audio-${Date.now()}.webm`, { type, lastModified: file.lastModified });
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function recordingFormat() {
  const formats = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"];
  return formats.find((format) => MediaRecorder.isTypeSupported(format)) || "";
}

function recordingExtension(type: string) {
  if (type.includes("mp4")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  return "webm";
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function PendingAudioItem({ audio, busy, onTranscribe }: {
  audio: StoredAudio; busy: boolean; onTranscribe: () => void;
}) {
  const source = useMemo(() => URL.createObjectURL(audio.blob), [audio.blob]);
  useEffect(() => () => URL.revokeObjectURL(source), [source]);

  function download() {
    const anchor = document.createElement("a");
    anchor.href = source;
    anchor.download = audio.name;
    anchor.click();
  }

  return <li>
    <div><strong>{audio.name}</strong><small>{formatSize(audio.size)} · guardado {new Date(audio.createdAt).toLocaleString("es-AR")}</small></div>
    <audio controls preload="metadata" src={source}/>
    <div className="pending-actions">
      <button type="button" onClick={onTranscribe} disabled={busy}>{busy ? "Transcribiendo…" : "Transcribir en este dispositivo"}</button>
      <button type="button" className="secondary" onClick={download}>Descargar copia</button>
    </div>
    <style jsx>{`
      li{display:grid;gap:7px;padding:10px;border:1px solid #d7e2e5;border-radius:8px;background:white}li>div:first-child{display:flex;gap:4px;flex-direction:column;min-width:0}strong{overflow:hidden;text-overflow:ellipsis}small{color:#617780;font-size:11px}audio{width:100%;height:38px}.pending-actions{display:flex;flex-wrap:wrap;gap:7px}.pending-actions button{padding:7px 10px;border:1px solid #0b5264;border-radius:7px;background:#0b5264;color:white;font:800 12px inherit;cursor:pointer}.pending-actions button:disabled{cursor:not-allowed;opacity:.5}.pending-actions button.secondary{background:white;color:#0b5264}
      :global(:root[data-theme="dark"]) li{background:#0b222a;border-color:#3f5c65}:global(:root[data-theme="dark"]) small{color:#bdd0d5}:global(:root[data-theme="dark"]) .pending-actions button.secondary{background:#173b49;color:#eef6f7}
    `}</style>
  </li>;
}

export function SpeechTextarea({ label, name, rows, placeholder, initialValue = "" }: {
  label: string; name: string; rows: number; placeholder?: string; initialValue?: string;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const textareaId = useId();
  const recognition = useRef<Recognition | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [value, setValue] = useState(initialValue);
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [transcribingId, setTranscribingId] = useState("");
  const [pending, setPending] = useState<StoredAudio[]>([]);
  const [online, setOnline] = useState(true);
  const [fieldKey, setFieldKey] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcriptionStatus, setTranscriptionStatus] = useState("");
  const wasOffline = useRef(false);

  function appendTranscript(text: string) {
    const cleanText = text.trim();
    if (cleanText) setValue((current) => `${current}${current.trim() ? " " : ""}${cleanText}`);
  }

  useEffect(() => {
    const key = `${window.location.pathname}:${name}`;
    setFieldKey(key);
    setOnline(navigator.onLine);
    void navigator.storage?.persist?.();
    void listAudios(key).then((audios) => {
      setPending(audios);
      const oldestAudio = audios.at(-1);
      if (navigator.onLine && oldestAudio) void transcribeStoredAudio(oldestAudio, key, true);
    }).catch(() => setError("No se pudo abrir el depósito local de audios."));
    const updateConnection = () => {
      const connected = navigator.onLine;
      setOnline(connected);
      if (!connected) wasOffline.current = true;
      if (connected && wasOffline.current) {
        wasOffline.current = false;
        void listAudios(key).then((audios) => {
          setPending(audios);
          if (audios.length) setNotice("Volvió la conexión. SIGCA comenzará a transcribir el primer audio pendiente.");
          const oldestAudio = audios.at(-1);
          if (oldestAudio) void transcribeStoredAudio(oldestAudio, key, true);
        });
      }
    };
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, [name]);

  useEffect(() => {
    const form = textarea.current?.form;
    const reset = () => setValue(initialValue);
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [initialValue]);

  useEffect(() => () => {
    recognition.current?.stop();
    if (mediaRecorder.current?.state === "recording") mediaRecorder.current.stop();
    mediaStream.current?.getTracks().forEach((track) => track.stop());
    if (recordingTimer.current) clearInterval(recordingTimer.current);
  }, []);

  function stopOfflineRecording() {
    if (mediaRecorder.current?.state === "recording") mediaRecorder.current.stop();
  }

  async function startOfflineRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar audio. Probá con Chrome, Edge o Safari actualizado.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = recordingFormat();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaStream.current = stream;
      mediaRecorder.current = recorder;
      audioChunks.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) audioChunks.current.push(event.data); };
      recorder.onerror = () => {
        setError("La grabación se interrumpió. Revisá el permiso del micrófono.");
        setCapturing(false);
      };
      recorder.onstop = () => {
        if (recordingTimer.current) clearInterval(recordingTimer.current);
        recordingTimer.current = null;
        stream.getTracks().forEach((track) => track.stop());
        mediaStream.current = null;
        setCapturing(false);
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(audioChunks.current, { type });
        audioChunks.current = [];
        if (!blob.size) {
          setError("La grabación quedó vacía. Volvé a intentar y permití el acceso al micrófono.");
          return;
        }
        const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
        const file = new File([blob], `grabacion-sigca-${timestamp}.${recordingExtension(type)}`, { type });
        void keepAudio(file);
      };
      setError("");
      setNotice("Grabando localmente. No se necesitan datos ni wifi.");
      setRecordingSeconds(0);
      setCapturing(true);
      recorder.start(1000);
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds((seconds) => {
          if (seconds + 1 >= MAX_RECORDING_SECONDS) stopOfflineRecording();
          return seconds + 1;
        });
      }, 1000);
    } catch {
      setError("No se pudo iniciar el grabador. Permití a SIGCA usar el micrófono.");
    }
  }

  function toggleRecording() {
    if (recording) { recognition.current?.stop(); return; }
    const browserWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const RecognitionClass = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!RecognitionClass) {
      setSupported(false);
      setError("El reconocimiento de voz no está disponible en este navegador.");
      return;
    }
    if (!navigator.onLine) {
      setError("El dictado directo necesita conexión. Podés adjuntar un audio: quedará guardado para después.");
      return;
    }
    const service = new RecognitionClass();
    service.lang = "es-AR"; service.continuous = true; service.interimResults = false;
    service.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) transcript += event.results[index][0].transcript;
      }
      appendTranscript(transcript);
    };
    service.onerror = () => { setError("No se pudo reconocer la voz. Revisá la conexión y el permiso del micrófono."); setRecording(false); };
    service.onend = () => setRecording(false);
    recognition.current = service; setError(""); setRecording(true); service.start();
  }

  async function refreshPending(key = fieldKey) {
    if (key) setPending(await listAudios(key));
  }

  async function transcribeStoredAudio(audio: StoredAudio, key = fieldKey, automatic = false) {
    if (PROCESSING_AUDIO_IDS.has(audio.id)) return;
    PROCESSING_AUDIO_IDS.add(audio.id);
    setTranscribingId(audio.id); setError(""); setNotice(""); setTranscriptionStatus("Preparando la transcripción…");
    let nextAudio: StoredAudio | undefined;
    try {
      const text = await transcribeSavedAudio(audio.blob, setTranscriptionStatus);
      appendTranscript(text);
      await deleteAudio(audio.id);
      const remaining = await listAudios(key);
      setPending(remaining);
      nextAudio = automatic ? remaining.at(-1) : undefined;
      setNotice(nextAudio
        ? `Audio transcripto. SIGCA continuará con ${remaining.length} pendiente${remaining.length === 1 ? "" : "s"}.`
        : "Audio transcripto con el reconocimiento del micrófono. La copia pendiente se eliminó del dispositivo.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo transcribir el audio.";
      const automaticHint = automatic ? " Podés volver a intentarlo con el botón Transcribir." : "";
      setError(`${message}${automaticHint} El audio sigue guardado y no se perdió.`);
    } finally {
      PROCESSING_AUDIO_IDS.delete(audio.id);
      setTranscribingId("");
      setTranscriptionStatus("");
    }
    if (nextAudio) await transcribeStoredAudio(nextAudio, key, true);
  }

  async function transcribeStored(audio: StoredAudio) {
    await transcribeStoredAudio(audio);
  }

  async function keepAudio(file: File) {
    if (!isSupportedAudio(file)) { setError("Ese archivo no tiene un formato de audio compatible."); return; }
    if (!file.size || file.size > MAX_AUDIO_BYTES) { setError("El audio debe pesar menos de 25 MB."); return; }
    if (!fieldKey) { setError("Esperá un instante y volvé a seleccionar el audio."); return; }
    setError(""); setNotice("Guardando el audio en este dispositivo…");
    try {
      const estimate = await navigator.storage?.estimate?.();
      const nearingLimit = Boolean(estimate?.quota && ((estimate.usage || 0) + file.size) / estimate.quota >= 0.8);
      await saveAudio(fieldKey, normalizeAudio(file));
      await refreshPending(fieldKey);
      setNotice(nearingLimit
        ? "Audio guardado. El almacenamiento del navegador superó el 80%; descargá copias de los audios importantes."
        : navigator.onLine ? "Audio guardado. Quedó listo para escucharlo o transcribirlo más tarde." : "Sin conexión: audio guardado en este dispositivo para usarlo más tarde.");
    } catch {
      setError("El dispositivo no permitió guardar el audio. Revisá el espacio disponible del navegador.");
      setNotice("");
    }
  }

  function chooseAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (file) void keepAudio(file);
  }

  function pasteAudio(event: ClipboardEvent<HTMLDivElement>) {
    const file = Array.from(event.clipboardData.files).find(isSupportedAudio);
    if (!file) return;
    event.preventDefault(); void keepAudio(file);
  }

  return <div className="speech-field">
    <label htmlFor={textareaId}>{label}</label>
    <div onPaste={pasteAudio}>
      <textarea id={textareaId} ref={textarea} name={name} rows={rows} placeholder={placeholder} value={value} onChange={(event) => setValue(event.target.value)}/>
      <button className={recording ? "recording" : ""} type="button" onClick={toggleRecording} disabled={!supported} aria-label={recording ? `Detener dictado de ${label}` : `Dictar ${label}`} title={recording ? "Detener dictado" : "Dictar con micrófono"}><span aria-hidden="true">🎙️</span></button>
    </div>
    <section className={`offline-recorder ${capturing ? "active" : ""}`} aria-label={`Grabador de audio para ${label}`}>
      <div>
        <strong>Grabador sin conexión</strong>
        <small>{capturing ? `● Grabando ${formatDuration(recordingSeconds)}` : "La grabación se guarda en este dispositivo"}</small>
      </div>
      {!capturing
        ? <button type="button" onClick={() => void startOfflineRecording()}><span aria-hidden="true">●</span> Iniciar grabación</button>
        : <button type="button" className="stop" onClick={stopOfflineRecording}><span aria-hidden="true">■</span> Detener y guardar</button>}
    </section>
    <label className="audio-file">
      Guardar audio de WhatsApp o del grabador
      <input type="file" accept="audio/*,.flac,.ogg,.oga,.opus,.m4a,.mp3,.mp4,.mpeg,.mpga,.wav,.webm" onChange={chooseAudio}/>
    </label>
    <small className={`connection ${online ? "online" : "offline"}`}>{online ? "Con conexión" : "Sin conexión · los audios quedarán guardados"}</small>
    {recording && <small className="recording-message">● Escuchando y transcribiendo…</small>}
    {notice && <small className="speech-notice" role="status">{notice}</small>}
    {transcriptionStatus && <small className="local-status" role="status">{transcriptionStatus}</small>}
    {error && <small className="speech-error" role="alert">{error}</small>}
    {pending.length > 0 && <section className="pending-audios" aria-label={`Audios pendientes de ${label}`}>
      <header><strong>Audios pendientes</strong><span>{pending.length}</span></header>
      <p>{supportsSavedAudioRecognition()
        ? "Están guardados solamente en este dispositivo. Al volver la conexión, SIGCA usa el mismo reconocimiento de voz del micrófono."
        : "Están guardados solamente en este dispositivo. Para transcribirlos usá Chrome o Edge actualizado en una computadora."}</p>
      <ul>{pending.map((audio) => <PendingAudioItem key={audio.id} audio={audio} busy={transcribingId === audio.id} onTranscribe={() => void transcribeStored(audio)}/>)}</ul>
    </section>}
    <style jsx>{`
      .speech-field{display:grid;gap:8px;color:#173b49;font-size:14px;font-weight:900}.speech-field>div{position:relative}.speech-field textarea{width:100%;padding:12px 58px 12px 12px;border:1px solid #aebfc4;border-radius:8px;background:white;color:#173b49;font:16px/1.45 inherit;resize:vertical}.speech-field>div>button{position:absolute;right:8px;top:8px;display:grid;place-items:center;width:42px;height:42px;border:1px solid #9cb0b6;border-radius:50%;background:#edf5f6;cursor:pointer}.speech-field button span{font-size:19px}.speech-field button.recording{border-color:#b6352a;background:#ffe8e4;animation:pulse 1.2s infinite}.offline-recorder{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #b8cbd0;border-radius:10px;background:#f4f8f9}.offline-recorder.active{border-color:#c75b4f;background:#fff3f1}.offline-recorder>div{display:grid;gap:3px}.offline-recorder small{color:#60777f;font-size:12px}.offline-recorder.active small{color:#a62d24}.offline-recorder button{flex:0 0 auto;padding:9px 12px;border:1px solid #0b5264;border-radius:8px;background:#0b5264;color:white;font:800 13px inherit;cursor:pointer}.offline-recorder button span{color:#f2bd42}.offline-recorder button.stop{border-color:#a62d24;background:#a62d24}.offline-recorder button.stop span{color:white}.audio-file{width:fit-content;padding:9px 12px;border:1px solid #9cb0b6;border-radius:7px;background:#edf5f6;color:#0b5264;font-size:13px;cursor:pointer}.audio-file input{display:none}.connection{width:fit-content;padding:4px 8px;border-radius:999px;font-size:12px}.connection.online{background:#e3f3eb;color:#176548}.connection.offline{background:#fff1d6;color:#805413}.recording-message,.speech-error,.speech-notice,.local-status{font-size:13px;font-weight:800}.recording-message{color:#a62d24}.speech-error{color:#812f24}.speech-notice{color:#176548}.local-status{padding:8px 10px;border-radius:7px;background:#e8f1f8;color:#154f70}.pending-audios{display:grid;gap:8px;margin-top:3px;padding:12px;border:1px solid #c8d8dc;border-radius:10px;background:#f7fafb}.pending-audios header{display:flex;align-items:center;justify-content:space-between}.pending-audios header span{display:grid;place-items:center;min-width:24px;height:24px;border-radius:999px;background:#0b5264;color:white}.pending-audios p{margin:0;color:#526c75;font-size:12px;line-height:1.45;font-weight:600}.pending-audios ul{display:grid;gap:9px;margin:0;padding:0;list-style:none}@media(max-width:620px){.offline-recorder{align-items:stretch;flex-direction:column}.offline-recorder button{width:100%}}@keyframes pulse{50%{box-shadow:0 0 0 7px #d4483830}}
      :global(:root[data-theme="dark"]) .speech-field{color:#f2f7f8}:global(:root[data-theme="dark"]) .speech-field textarea{background:#0b222a;border-color:#5f7b84;color:#f5f8f9}:global(:root[data-theme="dark"]) .speech-field>div>button{background:#244752;border-color:#718a92}:global(:root[data-theme="dark"]) .speech-field button.recording{background:#5a2925;border-color:#e77c70}:global(:root[data-theme="dark"]) .offline-recorder{background:#102b34;border-color:#48636c}:global(:root[data-theme="dark"]) .offline-recorder.active{background:#3b2424;border-color:#c76d64}:global(:root[data-theme="dark"]) .offline-recorder small{color:#bdd0d5}:global(:root[data-theme="dark"]) .offline-recorder.active small{color:#ff9a90}:global(:root[data-theme="dark"]) .audio-file{background:#244752;border-color:#718a92;color:#f2f7f8}:global(:root[data-theme="dark"]) .pending-audios{background:#102b34;border-color:#48636c}:global(:root[data-theme="dark"]) .pending-audios p{color:#bdd0d5}:global(:root[data-theme="dark"]) .recording-message{color:#ff9a90}:global(:root[data-theme="dark"]) .speech-error{color:#ffc3aa}:global(:root[data-theme="dark"]) .speech-notice{color:#8ee0bd}
    `}</style>
  </div>;
}
