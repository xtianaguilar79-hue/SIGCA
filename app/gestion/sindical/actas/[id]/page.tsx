import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { PrintDocumentButton } from "@/components/print-document-button";
import { ActaOriginalUpload } from "@/components/acta-original-upload";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

function Section({ title, content }: { title: string; content: string | null }) {
  if (!content) return null;
  return <section className="minute-section"><h2>{title}</h2><p>{content}</p></section>;
}

async function finalizeDocument(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) redirect("/gestion/sindical/actas");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const { error } = await supabase.from("actas_minutas").update({ estado: "finalizada" }).eq("id", id).eq("estado", "borrador");
  if (error) redirect(`/gestion/sindical/actas/${id}?resultado=error`);
  revalidatePath("/gestion/sindical/actas");
  revalidatePath(`/gestion/sindical/actas/${id}`);
  redirect(`/gestion/sindical/actas/${id}?resultado=finalizada`);
}

export default async function ActaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const { data: profile } = await supabase.from("usuarios").select("nombre,apellido,rol,estado,activo").eq("id", user.id).maybeSingle();
  if (!profile || profile.activo === false || String(profile.estado).toLowerCase() !== "aprobado") redirect("/acceso");
  const { id } = await params;
  const { data: document } = await supabase.from("actas_minutas").select("*").eq("id", id).maybeSingle();
  if (!document) notFound();
  const { data: creator } = await supabase.from("usuarios").select("nombre,apellido").eq("id", document.creado_por).maybeSingle();
  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");
  const creatorName = creator ? [creator.nombre, creator.apellido].filter(Boolean).join(" ") : "Usuario autorizado";
  const isAdmin = String(profile.rol).toLowerCase() === "administrador";
  const canEdit = document.estado === "borrador" && (document.creado_por === user.id || isAdmin);

  return <main className="management minute-detail-shell">
    <aside className="side"><Link className="side-brand" href="/gestion"><Image src="/logo-aoma.png" width={39} height={39} alt="AOMA"/><div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div></Link><nav><Link href="/gestion">Inicio institucional</Link><Link className="active" href="/gestion/sindical">Gestión sindical</Link><Link href="/gestion/formacion">Formación Sindical</Link><Link href="/gestion/biblioteca">Biblioteca</Link><Link href="/gestion/perfil">Mi perfil</Link>{isAdmin && <Link href="/gestion/usuarios">Administración de usuarios</Link>}</nav><div className="session"><strong>{name}</strong><span>{String(profile.rol || "Usuario autorizado")}</span><SignOutButton/></div></aside>
    <section className="main-area minute-detail-page">
      <div className="minute-actions"><Link className="library-back" href="/gestion/sindical/actas">← Volver a Actas y minutas</Link><div>{canEdit && <Link className="edit-minute" href={`/gestion/sindical/actas/${id}/editar`}>Editar borrador</Link>}<PrintDocumentButton/></div></div>
      <article className="minute-document">
        <header><Image src="/logo-aoma.png" width={58} height={58} alt="AOMA"/><div><span>{String(document.tipo).toUpperCase()}</span><h1>{document.titulo}</h1><p>AOMA Seccional San Juan · SIGCA</p></div><b>{String(document.estado).toUpperCase()}</b></header>
        <dl className="minute-metadata"><div><dt>Fecha</dt><dd>{new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" }).format(new Date(document.fecha))}</dd></div><div><dt>Lugar</dt><dd>{document.lugar || "No indicado"}</dd></div><div><dt>Empresa</dt><dd>{document.empresa_nombre || "No indicada"}</dd></div><div><dt>Responsable de carga</dt><dd>{creatorName}</dd></div></dl>
        <Section title="Asunto" content={document.asunto}/><Section title="Participantes" content={document.participantes}/><Section title="Desarrollo" content={document.desarrollo}/><Section title="Acuerdos alcanzados" content={document.acuerdos}/><Section title="Asuntos pendientes" content={document.asuntos_pendientes}/><Section title="Observaciones" content={document.observaciones}/>
        <ActaOriginalUpload documentId={id} initialPath={document.archivo_original_path} initialName={document.archivo_original_nombre} canUpload={canEdit}/>
        {canEdit && <details className="finalize-document"><summary>Finalizar documento</summary><p>Al finalizarlo, el contenido quedará bloqueado para evitar modificaciones accidentales. Revisá toda la información antes de continuar.</p><form action={finalizeDocument}><input type="hidden" name="id" value={id}/><button type="submit">Confirmar finalización</button></form></details>}
        <footer><div>Firma y aclaración</div><div>Firma y aclaración</div></footer>
      </article>
    </section>
    <style>{`.minute-detail-page{width:100%;max-width:1200px}.minute-actions{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:20px}.minute-document{padding:40px;border:1px solid var(--linea);border-radius:14px;background:white}.minute-document>header{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:18px;padding-bottom:22px;border-bottom:3px solid #0b5264}.minute-document header span{color:#9a6900;font-size:12px;font-weight:900;letter-spacing:.12em}.minute-document h1{margin:5px 0;color:#083d4b;font:700 34px Georgia,serif}.minute-document header p{margin:0;color:#587078}.minute-document header>b{padding:8px 11px;border-radius:999px;background:#fff0c9;color:#6e4c00;font-size:11px}.minute-metadata{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin:25px 0;padding:18px;border-radius:10px;background:#eef5f6}.minute-metadata div{display:grid;gap:4px}.minute-metadata dt{color:#587078;font-size:11px;font-weight:900;text-transform:uppercase}.minute-metadata dd{margin:0;color:#173b49;font-size:15px}.minute-section{margin-top:25px}.minute-section h2{margin:0 0 9px;color:#0b5264;font:700 20px Georgia,serif}.minute-section p{margin:0;color:#263f48;font-size:16px;line-height:1.7;white-space:pre-wrap}.minute-document footer{display:grid;grid-template-columns:1fr 1fr;gap:70px;margin-top:85px}.minute-document footer div{padding-top:9px;border-top:1px solid #263f48;text-align:center;font-size:12px}:root[data-theme="dark"] .minute-document{background:#18343e;border-color:#49636c}:root[data-theme="dark"] .minute-document h1,:root[data-theme="dark"] .minute-section h2{color:#f2f7f8}:root[data-theme="dark"] .minute-document header p,:root[data-theme="dark"] .minute-section p{color:#d9e6e9}:root[data-theme="dark"] .minute-metadata{background:#10272f}:root[data-theme="dark"] .minute-metadata dd{color:#e4eef0}:root[data-theme="dark"] .minute-document footer div{border-color:#9db2b8;color:#d9e6e9}@media(max-width:700px){.minute-actions{display:grid}.minute-document{padding:22px}.minute-document>header{grid-template-columns:auto 1fr}.minute-document header>b{grid-column:1/-1;width:fit-content}.minute-document h1{font-size:27px}.minute-metadata{grid-template-columns:1fr}.minute-document footer{grid-template-columns:1fr;gap:55px}}@media print{@page{size:A4;margin:15mm}body{background:white!important}.side,.theme-toggle,.notification-shell,.mobile-menu-button,.mobile-menu-backdrop,.minute-actions{display:none!important}.management,.main-area,.minute-detail-page{display:block!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;background:white!important}.minute-document{padding:0!important;border:0!important;box-shadow:none!important;color:black!important}.minute-document h1,.minute-section h2,.minute-section p,.minute-metadata dd,.minute-document header p,.minute-document footer div{color:black!important}.minute-metadata{background:#f1f1f1!important}.minute-section{break-inside:avoid}}`}</style>
    <style>{`.minute-actions>div{display:flex;align-items:center;gap:10px}.edit-minute{display:inline-flex;align-items:center;min-height:44px;padding:10px 16px;border:1px solid #0b5264;border-radius:8px;color:#0b5264;font-size:14px;font-weight:900;text-decoration:none}:root[data-theme="dark"] .edit-minute{border-color:#9ed9e5;color:#b8e6ef}@media(max-width:700px){.minute-actions>div{display:grid}.edit-minute{justify-content:center}}@media print{.edit-minute{display:none!important}}`}</style>
    <style>{`.finalize-document{margin-top:36px;padding:18px;border:1px solid #d7b65f;border-radius:10px;background:#fff8e5}.finalize-document summary{color:#664800;font-weight:900;cursor:pointer}.finalize-document p{color:#594d2c;line-height:1.55}.finalize-document button{min-height:44px;padding:11px 17px;border:0;border-radius:8px;background:#8b3026;color:white;font-family:inherit;font-weight:900;cursor:pointer}:root[data-theme="dark"] .finalize-document{border-color:#765f31;background:#3b3321}:root[data-theme="dark"] .finalize-document summary,:root[data-theme="dark"] .finalize-document p{color:#f1dfb7}@media print{.finalize-document{display:none!important}}`}</style>
  </main>;
}
