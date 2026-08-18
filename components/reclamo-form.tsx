"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SpeechTextarea } from "@/components/speech-textarea";

type Company = { id: number; nombre: string };
type User = { id: string; nombre: string | null; apellido: string | null; empresa: string | null };

export function ReclamoForm({ companies, users }: { companies: Company[]; users: User[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [audience, setAudience] = useState("privado");
  const [followUp, setFollowUp] = useState("realizar");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const optional = (name: string) => String(data.get(name) || "").trim() || null;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setMessage({ type: "error", text: "La sesión finalizó. Volvé a ingresar." });
      return;
    }

    const selectedUsers = data.getAll("destinatarios").map(String).filter(Boolean);
    const payload = {
      titulo: String(data.get("titulo") || "").trim(),
      empresa_id: optional("empresa_id") ? Number(optional("empresa_id")) : null,
      empresa_nombre: optional("empresa_nombre"),
      lugar: optional("lugar"), fecha_hecho: optional("fecha_hecho"),
      categoria: optional("categoria"), descripcion: String(data.get("descripcion") || "").trim(),
      prioridad: String(data.get("prioridad") || "normal"), estado: "abierto",
      fecha_limite: followUp === "respuesta" ? optional("fecha_limite") : null,
      fecha_recordatorio: followUp === "realizar" ? optional("fecha_recordatorio") : null,
      reclamo_realizado: followUp === "respuesta", audiencia_tipo: audience, creado_por: user.id,
    };
    const { data: claim, error } = await supabase.from("reclamos_sindicales").insert(payload).select("id").single();

    if (!error && claim && audience === "usuarios" && selectedUsers.length) {
      const { error: recipientsError } = await supabase.from("reclamos_destinatarios").insert(
        selectedUsers.map((usuarioId) => ({ reclamo_id: claim.id, usuario_id: usuarioId })),
      );
      if (recipientsError) {
        await supabase.from("reclamos_sindicales").delete().eq("id", claim.id);
        setSaving(false);
        setMessage({ type: "error", text: `No se asignaron los destinatarios: ${recipientsError.message}` });
        return;
      }
    }

    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: `No se pudo guardar: ${error.message}` });
      return;
    }
    form.reset(); setAudience("privado"); setFollowUp("realizar");
    setMessage({ type: "success", text: "Reclamo registrado y seguimiento activado." });
    router.refresh();
  }

  return <form className="claim-form" onSubmit={save}>
    <div className="claim-grid"><label>Título<input name="titulo" required maxLength={180}/></label><label>Empresa<select name="empresa_id" defaultValue="" onChange={(event) => { const option=event.currentTarget.selectedOptions[0]; const hidden=event.currentTarget.form?.elements.namedItem("empresa_nombre") as HTMLInputElement|null; if(hidden) hidden.value=option?.dataset.name||""; }}><option value="">Sin empresa / no corresponde</option>{companies.map((company)=><option key={company.id} value={company.id} data-name={company.nombre}>{company.nombre}</option>)}</select><input type="hidden" name="empresa_nombre"/></label></div>
    <div className="claim-grid three"><label>Categoría<select name="categoria" defaultValue="laboral"><option value="laboral">Laboral</option><option value="salarial">Salarial</option><option value="higiene_seguridad">Higiene y seguridad</option><option value="obra_social">Obra social</option><option value="afiliacion">Afiliación</option><option value="otro">Otro</option></select></label><label>Prioridad<select name="prioridad" defaultValue="normal"><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label><label>Fecha del hecho<input name="fecha_hecho" type="date"/></label></div>
    <label>Lugar<input name="lugar" maxLength={180}/></label>
    <SpeechTextarea label="Descripción o asunto del reclamo" name="descripcion" rows={7} placeholder="Escribí, dictá o pegá un audio de WhatsApp."/>
    <fieldset><legend>Quién puede verlo</legend><label><input type="radio" name="audiencia_tipo" value="privado" checked={audience==="privado"} onChange={()=>setAudience("privado")}/> Solo yo</label><label><input type="radio" name="audiencia_tipo" value="empresa" checked={audience==="empresa"} onChange={()=>setAudience("empresa")}/> Todos los usuarios de la empresa seleccionada</label><label><input type="radio" name="audiencia_tipo" value="usuarios" checked={audience==="usuarios"} onChange={()=>setAudience("usuarios")}/> Personas específicas</label>{audience==="usuarios"&&<div className="recipient-list">{users.map((person)=><label key={person.id}><input type="checkbox" name="destinatarios" value={person.id}/> {[person.apellido,person.nombre].filter(Boolean).join(", ")}{person.empresa?` · ${person.empresa}`:""}</label>)}</div>}</fieldset>
    <fieldset><legend>Seguimiento y recordatorios</legend><label><input type="radio" name="seguimiento" value="realizar" checked={followUp==="realizar"} onChange={()=>setFollowUp("realizar")}/> Debo realizar este reclamo</label><label><input type="radio" name="seguimiento" value="respuesta" checked={followUp==="respuesta"} onChange={()=>setFollowUp("respuesta")}/> Ya lo realicé y espero respuesta</label>{followUp==="realizar"?<label className="date-field">Recordarme realizarlo desde<input name="fecha_recordatorio" type="date" required/></label>:<label className="date-field">Fecha esperada de respuesta<input name="fecha_limite" type="date" required/></label>}</fieldset>
    <button type="submit" disabled={saving}>{saving?"Guardando...":"Registrar reclamo"}</button>{message&&<p className={message.type} role="status">{message.text}</p>}
    <style jsx>{`.claim-form{display:grid;gap:17px;padding:24px;border:1px solid var(--linea);border-radius:14px;background:white}.claim-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.claim-grid.three{grid-template-columns:repeat(3,1fr)}label{display:grid;gap:7px;color:#173b49;font-size:14px;font-weight:900}input,select{width:100%;padding:12px;border:1px solid #aebfc4;border-radius:8px;background:white;color:#173b49;font:16px/1.4 inherit}.claim-form>button{width:fit-content;min-height:46px;padding:12px 20px;border:0;border-radius:8px;background:#0b5264;color:white;font-family:inherit;font-weight:900;cursor:pointer}.claim-form>button:disabled{opacity:.65}.claim-form>p{margin:0;padding:12px 14px;border-radius:8px;font-size:14px;font-weight:800}.claim-form>p.success{background:#e6f5ef;color:#124f3e}.claim-form>p.error{background:#fff0ed;color:#812f24}fieldset{display:grid;gap:11px;padding:16px;border:1px solid #b9c9cd;border-radius:10px}legend{padding:0 7px;color:#0b5264;font-weight:900}fieldset>label,.recipient-list label{display:flex;grid:unset;align-items:center;gap:9px}.recipient-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px;background:#f1f6f7;border-radius:8px}.recipient-list input,fieldset>label>input{width:auto}fieldset .date-field{display:grid;max-width:360px;margin-top:5px}:global(:root[data-theme="dark"]) .claim-form{background:#18343e;border-color:#49636c}:global(:root[data-theme="dark"]) label,:global(:root[data-theme="dark"]) legend{color:#f2f7f8}:global(:root[data-theme="dark"]) input,:global(:root[data-theme="dark"]) select{background:#0b222a;border-color:#5f7b84;color:#f5f8f9}:global(:root[data-theme="dark"]) .recipient-list{background:#10272f}@media(max-width:750px){.claim-form{padding:18px}.claim-grid,.claim-grid.three,.recipient-list{grid-template-columns:1fr}.claim-form>button{width:100%}}`}</style>
  </form>;
}
