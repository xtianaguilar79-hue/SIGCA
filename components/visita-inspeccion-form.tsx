"use client";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SpeechTextarea } from "@/components/speech-textarea";

export function VisitaInspeccionForm(){
  const router=useRouter(); const[saving,setSaving]=useState(false); const[files,setFiles]=useState<File[]>([]); const[message,setMessage]=useState("");
  function chooseFiles(e:ChangeEvent<HTMLInputElement>){const selected=Array.from(e.target.files||[]).slice(0,8);setFiles(selected);}
  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); setSaving(true); setMessage(""); const form=e.currentTarget; const fd=new FormData(form); const supabase=createClient();
    const{data:{user}}=await supabase.auth.getUser(); if(!user){setSaving(false);setMessage("La sesión finalizó. Volvé a ingresar.");return}
    const payload={tipo:String(fd.get("tipo")||"visita"),fecha:new Date(String(fd.get("fecha"))).toISOString(),titulo:String(fd.get("titulo")||"").trim(),participantes:String(fd.get("participantes")||"").trim()||null,desarrollo:String(fd.get("desarrollo")||"").trim()||null,acciones:String(fd.get("acciones")||"").trim()||null,creado_por:user.id};
    const{data:visit,error}=await supabase.from("visitas_inspecciones").insert(payload).select("id").single();
    if(error||!visit){setSaving(false);setMessage(`No se pudo guardar: ${error?.message||"error desconocido"}`);return}
    const paths:string[]=[];
    for(const file of files){if(file.size>15*1024*1024)continue; const safe=file.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]/g,"-"); const path=`${user.id}/${visit.id}/${Date.now()}-${safe}`; const{error:up}=await supabase.storage.from("visitas-inspecciones").upload(path,file); if(!up)paths.push(path);}
    if(paths.length)await supabase.from("visitas_inspecciones").update({fotos:paths}).eq("id",visit.id);
    form.reset();setFiles([]);setSaving(false);setMessage("Visita o inspección registrada correctamente.");router.refresh();
  }
  return <form className="visit-form" onSubmit={save}>
    <div className="grid"><label>Tipo<select name="tipo" defaultValue="visita"><option value="visita">Visita</option><option value="inspeccion">Inspección</option></select></label><label>Fecha y hora<input name="fecha" type="datetime-local" required/></label></div>
    <label>Título<input name="titulo" required maxLength={180} placeholder="Ej.: Recorrida por taller de mantenimiento"/></label>
    <SpeechTextarea label="Participantes" name="participantes" rows={3} placeholder="Quiénes participaron y quién recibió la visita"/>
    <SpeechTextarea label="Desarrollo, observaciones y hallazgos" name="desarrollo" rows={8} placeholder="Describí la recorrida, lo observado y los temas tratados."/>
    <SpeechTextarea label="Acciones acordadas o seguimiento" name="acciones" rows={4} placeholder="Compromisos, responsables o acciones que deban verificarse luego."/>
    <label>Fotos (hasta 8)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseFiles}/><small>{files.length?`${files.length} foto(s) seleccionada(s)`:"Opcional. Máximo 15 MB por imagen."}</small></label>
    <button type="submit" disabled={saving}>{saving?"Guardando...":"Registrar visita o inspección"}</button>{message&&<p role="status">{message}</p>}
    <style jsx>{`.visit-form{display:grid;gap:17px;padding:24px;border:1px solid var(--linea);border-radius:14px;background:white}.grid{display:grid;grid-template-columns:220px minmax(240px,380px);gap:15px}label{display:grid;gap:7px;color:#173b49;font-size:14px;font-weight:900}input,select{width:100%;padding:12px;border:1px solid #aebfc4;border-radius:8px;background:white;color:#173b49;font:16px/1.45 inherit}small{color:#667d84;font-weight:600}.visit-form>button{width:fit-content;min-height:46px;padding:12px 20px;border:0;border-radius:8px;background:#0b5264;color:white;font-weight:900;cursor:pointer}.visit-form>p{margin:0;padding:12px;border-radius:8px;background:#e6f5ef;color:#124f3e;font-weight:800}:global(:root[data-theme="dark"]) .visit-form{background:#18343e;border-color:#49636c}:global(:root[data-theme="dark"]) label{color:#f2f7f8}:global(:root[data-theme="dark"]) input,:global(:root[data-theme="dark"]) select{background:#0b222a;border-color:#5f7b84;color:#f5f8f9}@media(max-width:700px){.visit-form{padding:18px}.grid{grid-template-columns:1fr}.visit-form>button{width:100%}}`}</style>
  </form>
}
