"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MODULES, pageContext, type Answer, type Scope } from "@/lib/asistente/core";

type Message = { id: number; role: "user" | "assistant"; text: string; answer?: Answer };

export function AsistenteSigca() {
  const path = usePathname();
  const context = pageContext(path);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    let currentUser: string | null = null;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user.id || null;
      if (nextUser !== currentUser || !nextUser) {
        currentUser = nextUser;
        sequence.current++;
        controller.current?.abort();
        setMessages([]); setQuestion(""); setError(""); setLoading(false); setOpen(false);
      }
      setReady(Boolean(nextUser));
    });
    return () => { subscription.unsubscribe(); controller.current?.abort(); };
  }, []);

  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "instant" }); }, [messages, loading, open]);

  // Keep the conversation across navigation; never submit a now-invalid scope.
  const effectiveScope = scope === "record" && !context.recordId ? "all" : scope === "module" && !context.module ? "all" : scope;

  function close() { setOpen(false); launcher.current?.focus(); }
  function clear() {
    sequence.current++;
    controller.current?.abort();
    setMessages([]); setQuestion(""); setError(""); setLoading(false);
    input.current?.focus();
  }

  async function send(text = question, selectedScope = effectiveScope) {
    if (loading || !text.trim()) return;
    const id = ++sequence.current;
    controller.current = new AbortController();
    const abort = controller.current;
    const timeout = setTimeout(() => abort.abort(), 25000);
    setLoading(true); setError(""); setQuestion("");
    setMessages(previous => [...previous, { id, role: "user" as const, text: text.trim() }].slice(-20));
    try {
      const response = await fetch("/api/asistente", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json" }, signal: abort.signal,
        body: JSON.stringify({ question: text.trim(), path, scope: selectedScope }),
      });
      const data = await response.json();
      if (id !== sequence.current) return;
      if (response.status === 401 || response.status === 403) setMessages([]);
      if (!response.ok) throw new Error(data.error || "No se pudo completar la consulta.");
      setMessages(previous => [...previous, { id: id + 0.5, role: "assistant" as const, text: data.message, answer: data as Answer }].slice(-20));
    } catch (cause) {
      if (id !== sequence.current) return;
      setError(abort.signal.aborted ? "La consulta tardó demasiado. Podés volver a intentarlo." : cause instanceof Error ? cause.message : "No hay conexión. Intentá nuevamente.");
      setQuestion(text);
    } finally {
      clearTimeout(timeout);
      if (id === sequence.current) { setLoading(false); input.current?.focus(); }
    }
  }

  if (!ready) return null;
  return <div className="sigca-assistant">
    <button ref={launcher} className="sigca-assistant-launcher" type="button" aria-label={open ? "Cerrar Asistente SIGCA" : "Abrir Asistente SIGCA"} aria-expanded={open} aria-controls="sigca-assistant-panel" onClick={() => open ? close() : setOpen(true)}>
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z"/><path d="M7 10h9M7 14h6"/></svg>
      <span>Asistente SIGCA</span>
    </button>
    {open && <section id="sigca-assistant-panel" role="dialog" aria-modal="false" aria-labelledby="sigca-assistant-title" className="sigca-assistant-panel" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
      <header className="sigca-assistant-header"><div><strong id="sigca-assistant-title">Asistente SIGCA</strong><small>Solo información interna · Sin web</small></div><button type="button" onClick={close} aria-label="Cerrar chat">×</button></header>
      <div className="sigca-assistant-context"><span>Estás en <strong>{context.label}</strong>{context.recordId ? " · Registro abierto" : ""}</span><button type="button" onClick={clear}>Limpiar chat</button></div>
      <div className="sigca-assistant-log" ref={log} role="log" aria-label="Conversación con el asistente" aria-live="polite" aria-relevant="additions" aria-busy={loading}>
        {!messages.length && <div className="sigca-assistant-welcome"><h2>¿Qué querés consultar?</h2><p>Busco fragmentos en Biblioteca, Actas y Minutas, Reclamos, Visitas e Inspecciones que tu usuario puede consultar.</p><p>Primera versión: búsqueda con fuentes, sin respuestas generadas por IA. No interpreta fotos, audios ni adjuntos.</p><div className="sigca-assistant-suggestions">
          <button type="button" onClick={() => void send("jornada", "all")}>Buscar jornada</button>
          <button type="button" onClick={() => void send("reclamos pendientes", "all")}>Reclamos pendientes</button>
          {context.recordId && <button type="button" onClick={() => void send("Ver este registro", "record")}>Consultar este registro</button>}
        </div></div>}
        {messages.map(message => <article key={message.id} className={`sigca-assistant-message sigca-assistant-${message.role}`}>
          <strong>{message.role === "user" ? "Vos" : "SIGCA"}</strong><p>{message.text}</p>
          {message.answer?.sources.map((source, index) => <div className="sigca-assistant-source" key={`${source.module}-${source.id}`}><span>Fuente {index + 1} · {MODULES[source.module]}</span><h3>{source.title}</h3><blockquote>{source.excerpt}</blockquote><Link href={source.href} onClick={close}>Abrir fuente →</Link></div>)}
          {message.answer?.incomplete && <p className="sigca-assistant-warning">La búsqueda fue parcial: algunas fuentes no estuvieron disponibles.</p>}
        </article>)}
        {loading && <p role="status">Consultando fuentes autorizadas…</p>}
      </div>
      {error && <p className="sigca-assistant-error" role="alert">{error}</p>}
      <form className="sigca-assistant-form" onSubmit={event => { event.preventDefault(); void send(); }}>
        <label htmlFor="sigca-assistant-scope">Buscar en</label>
        <select id="sigca-assistant-scope" value={effectiveScope} onChange={event => setScope(event.target.value as Scope)} disabled={loading}>
          <option value="all">Todos los módulos disponibles</option>
          {context.module && <option value="module">{context.label}</option>}
          {context.recordId && <option value="record">Solo este registro</option>}
        </select>
        <label htmlFor="sigca-assistant-question">Tu consulta</label>
        <div className="sigca-assistant-compose"><textarea id="sigca-assistant-question" ref={input} value={question} onChange={event => setQuestion(event.target.value)} maxLength={1200} rows={2} placeholder="Escribí palabras o una pregunta…" onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} /><button type="submit" disabled={loading || !question.trim()} aria-label="Enviar consulta">Enviar</button></div>
        <small>No se guarda el chat. Cada consulta vuelve a verificar tu acceso.</small>
      </form>
    </section>}
  </div>;
}
