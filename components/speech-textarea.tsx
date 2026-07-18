"use client";

import { useEffect, useRef, useState } from "react";

type RecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => Recognition;

export function SpeechTextarea({
  label,
  name,
  rows,
  placeholder,
}: {
  label: string;
  name: string;
  rows: number;
  placeholder?: string;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const recognition = useRef<Recognition | null>(null);
  const [value, setValue] = useState("");
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const form = textarea.current?.form;
    const reset = () => setValue("");
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);

  useEffect(() => () => recognition.current?.stop(), []);

  function toggleRecording() {
    if (recording) {
      recognition.current?.stop();
      return;
    }

    const browserWindow = window as typeof window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    const RecognitionClass = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;

    if (!RecognitionClass) {
      setSupported(false);
      setError("El reconocimiento de voz no está disponible en este navegador.");
      return;
    }

    const service = new RecognitionClass();
    service.lang = "es-AR";
    service.continuous = true;
    service.interimResults = false;
    service.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) transcript += event.results[index][0].transcript;
      }
      if (transcript.trim()) {
        setValue((current) => `${current}${current.trim() ? " " : ""}${transcript.trim()}`);
      }
    };
    service.onerror = () => {
      setError("No se pudo reconocer la voz. Revisá el permiso del micrófono.");
      setRecording(false);
    };
    service.onend = () => setRecording(false);
    recognition.current = service;
    setError("");
    setRecording(true);
    service.start();
  }

  return <label className="speech-field">
    <span>{label}</span>
    <div>
      <textarea ref={textarea} name={name} rows={rows} placeholder={placeholder} value={value} onChange={(event) => setValue(event.target.value)}/>
      <button className={recording ? "recording" : ""} type="button" onClick={toggleRecording} disabled={!supported} aria-label={recording ? `Detener dictado de ${label}` : `Dictar ${label}`} title={recording ? "Detener dictado" : "Dictar con micrófono"}>
        <span aria-hidden="true">🎙️</span>
      </button>
    </div>
    {recording && <small className="recording-message">● Escuchando y transcribiendo…</small>}
    {error && <small className="speech-error">{error}</small>}
    <style jsx>{`
      .speech-field{display:grid;gap:7px;color:#173b49;font-size:14px;font-weight:900}.speech-field>div{position:relative}.speech-field textarea{width:100%;padding:12px 58px 12px 12px;border:1px solid #aebfc4;border-radius:8px;background:white;color:#173b49;font:16px/1.45 inherit;resize:vertical}.speech-field button{position:absolute;right:8px;top:8px;display:grid;place-items:center;width:42px;height:42px;border:1px solid #9cb0b6;border-radius:50%;background:#edf5f6;cursor:pointer}.speech-field button span{font-size:19px}.speech-field button.recording{border-color:#b6352a;background:#ffe8e4;animation:pulse 1.2s infinite}.recording-message,.speech-error{font-size:13px;font-weight:800}.recording-message{color:#a62d24}.speech-error{color:#812f24}@keyframes pulse{50%{box-shadow:0 0 0 7px #d4483830}}
      :global(:root[data-theme="dark"]) .speech-field{color:#f2f7f8}:global(:root[data-theme="dark"]) .speech-field textarea{background:#0b222a;border-color:#5f7b84;color:#f5f8f9}:global(:root[data-theme="dark"]) .speech-field button{background:#244752;border-color:#718a92}:global(:root[data-theme="dark"]) .speech-field button.recording{background:#5a2925;border-color:#e77c70}:global(:root[data-theme="dark"]) .recording-message{color:#ff9a90}:global(:root[data-theme="dark"]) .speech-error{color:#ffc3aa}
    `}</style>
  </label>;
}
