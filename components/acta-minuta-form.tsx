"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SpeechTextarea } from "@/components/speech-textarea";

export type ActaMinutaInitialData = {
  tipo: string; titulo: string; fecha: string; participantes: string; desarrollo: string; acuerdos: string;
};

export function ActaMinutaForm({ documentId, initialData }: { documentId?: string; initialData?: ActaMinutaInitialData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null);
    const form = event.currentTarget; const data = new FormData(form);
    const optional = (name: string) => String(data.get(name) || "").trim() || null;
    const date = String(data.get("fecha") || ""); const supabase = createClient();
    const documentData = {
      tipo: String(data.get("tipo") || "acta"), titulo: String(data.get("titulo") || "").trim(),
      fecha: new Date(date).toISOString(), participantes: optional("participantes"),
      desarrollo: optional("desarrollo"), acuerdos: optional("acuerdos"), estado: "borrador",
      // Se limpian los campos anteriores para que documentos editados no sigan mostrando información obsoleta.
      lugar: null, empresa_nombre: null, asunto: null, asuntos_pendientes: null, observaciones: null,
    };
    const { error } = documentId
      ? await supabase.from("actas_minutas").update(documentData).eq("id", documentId).eq("estado", "borrador")
      : await supabase.from("actas_minutas").insert(documentData);
    setSaving(false);
    if (error) { setMessage({ type: "error", text: `No se pudo guardar: ${error.message}` }); return; }
    if (!documentId) form.reset();
    setMessage({ type: "success", text: documentId ? "Los cambios fueron guardados correctamente." : "Documento guardado correctamente como borrador." });
    router.refresh();
  }

  return <form className="minutes-form" onSubmit={save}>
    <div className="minutes-grid compact">
      <label>Tipo<select name="tipo" defaultValue={initialData?.tipo || "acta"}><option value="acta">Acta</option><option value="minuta">Minuta</option></select></label>
      <label>Fecha y hora<input name="fecha" type="datetime-local" required defaultValue={initialData?.fecha || ""}/></label>
    </div>
    <label>Título<input name="titulo" required maxLength={180} defaultValue={initialData?.titulo || ""} placeholder="Ej.: Reunión de delegados"/></label>
    <SpeechTextarea label="Participantes" name="participantes" rows={3} placeholder="Una persona por línea o separadas por comas" initialValue={initialData?.participantes}/>
    <SpeechTextarea label="Desarrollo" name="desarrollo" rows={8} placeholder="Detallá aquí lo tratado. Podés identificar dentro del texto quién intervino y qué temas quedaron pendientes." initialValue={initialData?.desarrollo}/>
    <SpeechTextarea label="Acuerdos alcanzados" name="acuerdos" rows={4} initialValue={initialData?.acuerdos}/>
    <button className="minutes-save" type="submit" disabled={saving}>{saving ? "Guardando..." : documentId ? "Guardar cambios" : "Guardar borrador"}</button>
    {message && <p className={`minutes-message ${message.type}`} role="status">{message.text}</p>}
    <style jsx>{`.minutes-form{display:grid;gap:17px;padding:24px;border:1px solid var(--linea);border-radius:14px;background:white}.minutes-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.minutes-grid.compact{grid-template-columns:180px minmax(220px,360px)}label{display:grid;gap:7px;color:#173b49;font-size:14px;font-weight:900}input,select,textarea{width:100%;padding:12px;border:1px solid #aebfc4;border-radius:8px;background:white;color:#173b49;font:16px/1.45 inherit}textarea{resize:vertical}.minutes-save{width:fit-content;min-height:46px;padding:12px 20px;border:0;border-radius:8px;background:#0b5264;color:white;font-weight:900;cursor:pointer}.minutes-save:disabled{opacity:.65}.minutes-message{margin:0;padding:12px 14px;border-radius:8px;font-size:14px;font-weight:800}.minutes-message.success{background:#e6f5ef;color:#124f3e}.minutes-message.error{background:#fff0ed;color:#812f24}:global(:root[data-theme="dark"]) .minutes-form{background:#18343e;border-color:#49636c}:global(:root[data-theme="dark"]) label{color:#f2f7f8}:global(:root[data-theme="dark"]) input,:global(:root[data-theme="dark"]) select,:global(:root[data-theme="dark"]) textarea{background:#0b222a;border-color:#5f7b84;color:#f5f8f9}@media(max-width:700px){.minutes-form{padding:18px}.minutes-grid,.minutes-grid.compact{grid-template-columns:1fr}.minutes-save{width:100%}}`}</style>
  </form>;
}
