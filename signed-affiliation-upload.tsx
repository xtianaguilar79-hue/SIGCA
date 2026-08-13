"use client";

import { ChangeEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignedAffiliationUpload({
  applicationId,
  initialPath,
  initialName,
}: {
  applicationId: string;
  initialPath?: string | null;
  initialName?: string | null;
}) {
  const [path, setPath] = useState(initialPath || "");
  const [name, setName] = useState(initialName || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setMessage("El archivo debe ser PDF, JPG, PNG o WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("El archivo no puede superar los 10 MB.");
      return;
    }

    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setMessage("La sesión finalizó. Volvé a ingresar.");
      return;
    }

    const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
    const newPath = `${user.id}/${applicationId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("afiliaciones-firmadas").upload(newPath, file, { upsert: false });

    if (uploadError) {
      setLoading(false);
      setMessage(`No se pudo cargar el archivo: ${uploadError.message}`);
      return;
    }

    const { error: updateError } = await supabase.from("afiliaciones").update({
      archivo_firmado_path: newPath,
      archivo_firmado_nombre: file.name,
      archivo_firmado_en: new Date().toISOString(),
    }).eq("id", applicationId);

    if (updateError) {
      await supabase.storage.from("afiliaciones-firmadas").remove([newPath]);
      setLoading(false);
      setMessage(`El archivo se cargó, pero no pudo asociarse: ${updateError.message}`);
      return;
    }

    if (path) await supabase.storage.from("afiliaciones-firmadas").remove([path]);
    setPath(newPath);
    setName(file.name);
    setLoading(false);
    setMessage("Ficha firmada guardada correctamente.");
  }

  async function openFile() {
    if (!path) return;
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("afiliaciones-firmadas").createSignedUrl(path, 120);
    setLoading(false);
    if (error || !data?.signedUrl) {
      setMessage("No se pudo abrir el archivo firmado.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return <div className="signed-upload">
    <strong>{path ? "Ficha firmada adjunta" : "Adjuntar ficha firmada"}</strong>
    {name && <span>{name}</span>}
    <div>
      <label className="signed-upload-button">
        {loading ? "Procesando..." : path ? "Reemplazar archivo" : "Subir PDF o foto"}
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={loading} onChange={uploadFile}/>
      </label>
      <label className="signed-upload-button camera">
  Escanear con cámara
  <input
    type="file"
    accept="image/*"
    capture="environment"
    disabled={loading}
    onChange={uploadFile}
  />
</label>
      {path && <button type="button" disabled={loading} onClick={openFile}>Ver archivo</button>}
    </div>
    {message && <p role="status">{message}</p>}
    <style jsx>{`
      .signed-upload{margin-top:17px;padding-top:15px;border-top:1px solid var(--linea)}
      strong,span{display:block}span{margin-top:4px;color:var(--gris);font-size:13px;overflow-wrap:anywhere}
      div{display:flex;flex-wrap:wrap;gap:10px;margin-top:11px}.signed-upload-button,button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:9px 13px;border:1px solid #0b5264;border-radius:8px;background:white;color:#0b5264;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer}.signed-upload-button{background:#0b5264;color:white}input{display:none}button:disabled,.signed-upload-button:has(input:disabled){opacity:.6;cursor:wait}p{margin:10px 0 0;font-size:14px;font-weight:700;color:#315f50}
      :global(:root[data-theme="dark"]) .signed-upload{border-color:#49636c}:global(:root[data-theme="dark"]) strong{color:#f2f7f8}:global(:root[data-theme="dark"]) button{background:#18343e;border-color:#8fd0de;color:#b8e6ef}:global(:root[data-theme="dark"]) .signed-upload-button{background:#8fd0de;color:#092a33}:global(:root[data-theme="dark"]) p{color:#a8dfc8}
      @media(max-width:700px){div{display:grid}.signed-upload-button,button{width:100%;min-height:46px}}
    `}</style>
  </div>;
}
