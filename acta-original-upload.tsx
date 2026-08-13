"use client";
import { ChangeEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ActaOriginalUpload({ documentId, initialPath, initialName, canUpload }: { documentId:string; initialPath?:string|null; initialName?:string|null; canUpload:boolean }) {
  const [path,setPath]=useState(initialPath||""); const [name,setName]=useState(initialName||""); const [loading,setLoading]=useState(false); const [message,setMessage]=useState("");
  async function upload(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0]; event.target.value=""; if(!file)return;
    const allowed=["application/pdf","image/jpeg","image/png","image/webp"];
    if(!allowed.includes(file.type)){setMessage("El archivo debe ser PDF, JPG, PNG o WEBP.");return}
    if(file.size>20*1024*1024){setMessage("El archivo no puede superar los 20 MB.");return}
    setLoading(true);setMessage("");const supabase=createClient();const{data:{user}}=await supabase.auth.getUser();
    if(!user){setLoading(false);setMessage("La sesión finalizó. Volvé a ingresar.");return}
    const safeName=file.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]/g,"-");
    const newPath=`${user.id}/${documentId}/${Date.now()}-${safeName}`;
    const{error:uploadError}=await supabase.storage.from("actas-originales").upload(newPath,file);
    if(uploadError){setLoading(false);setMessage(`No se pudo cargar: ${uploadError.message}`);return}
    const{error:updateError}=await supabase.from("actas_minutas").update({archivo_original_path:newPath,archivo_original_nombre:file.name,archivo_original_en:new Date().toISOString(),extraccion_estado:"pendiente",texto_extraido:null}).eq("id",documentId).eq("estado","borrador");
    if(updateError){await supabase.storage.from("actas-originales").remove([newPath]);setLoading(false);setMessage(`No se pudo asociar el archivo: ${updateError.message}`);return}
    if(path)await supabase.storage.from("actas-originales").remove([path]);setPath(newPath);setName(file.name);setLoading(false);setMessage("Documento original guardado. Extracción de texto pendiente.");
  }
  async function viewFile(){if(!path)return;setLoading(true);const supabase=createClient();const{data,error}=await supabase.storage.from("actas-originales").createSignedUrl(path,120);setLoading(false);if(error||!data?.signedUrl){setMessage("No se pudo abrir el documento original.");return}window.open(data.signedUrl,"_blank","noopener,noreferrer")}
  if(!canUpload&&!path)return null;
  return <section className="original-upload"><header><div><span>DOCUMENTO ORIGINAL</span><h2>{path?"Archivo escaneado o adjunto":"Incorporar acta existente"}</h2></div>{path&&<b>PENDIENTE DE EXTRACCIÓN</b>}</header>{name&&<p className="file-name">{name}</p>}<div className="original-actions">{canUpload&&<label>{loading?"Procesando...":path?"Reemplazar archivo":"Subir PDF o imagen"}<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={loading} onChange={upload}/></label>}{canUpload&&<label className="camera">Escanear con cámara<input type="file" accept="image/*" capture="environment" disabled={loading} onChange={upload}/></label>}{path&&<button type="button" disabled={loading} onClick={viewFile}>Ver documento original</button>}</div>{message&&<p className="upload-message" role="status">{message}</p>}<style jsx>{`
    .original-upload{margin-top:32px;padding:20px;border:1px solid #9eb7bd;border-radius:11px;background:#f2f8f9}.original-upload header{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}.original-upload header span{color:#8a650d;font-size:11px;font-weight:900;letter-spacing:.1em}.original-upload h2{margin:5px 0 0;color:#0b5264;font:700 20px Georgia,serif}.original-upload header b{padding:7px 9px;border-radius:999px;background:#fff0c9;color:#6e4c00;font-size:10px}.file-name{overflow-wrap:anywhere;color:#587078;font-size:13px}.original-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.original-actions label,.original-actions button{display:inline-flex;align-items:center;justify-content:center;min-height:43px;padding:10px 14px;border:1px solid #0b5264;border-radius:8px;background:#0b5264;color:white;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer}.original-actions label.camera,.original-actions button{background:white;color:#0b5264}.original-actions input{display:none}.upload-message{margin:12px 0 0;color:#315f50;font-size:14px;font-weight:800}:global(:root[data-theme="dark"]) .original-upload{border-color:#49636c;background:#17343e}:global(:root[data-theme="dark"]) .original-upload h2{color:#f2f7f8}:global(:root[data-theme="dark"]) .file-name{color:#c2d3d7}:global(:root[data-theme="dark"]) .original-actions label.camera,:global(:root[data-theme="dark"]) .original-actions button{background:#244752;border-color:#8fd0de;color:#c8edf4}:global(:root[data-theme="dark"]) .upload-message{color:#a8dfc8}@media(max-width:700px){.original-upload header{display:grid}.original-upload header b{width:fit-content}.original-actions{display:grid}.original-actions label,.original-actions button{width:100%}}@media print{.original-upload{display:none}}
  `}</style></section>;
}
