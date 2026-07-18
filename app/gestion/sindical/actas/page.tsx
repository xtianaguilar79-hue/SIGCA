import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActaMinutaForm } from "@/components/acta-minuta-form";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function ActasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const { data: profile } = await supabase.from("usuarios").select("nombre,apellido,rol,estado,activo").eq("id", user.id).maybeSingle();
  if (!profile || profile.activo === false || String(profile.estado).toLowerCase() !== "aprobado") redirect("/acceso");

  const { data: documents } = await supabase.from("actas_minutas").select("id,tipo,titulo,fecha,lugar,empresa_nombre,estado,creado_por").order("fecha", { ascending: false }).limit(100);
  const creatorIds = [...new Set((documents || []).map((document) => document.creado_por).filter(Boolean))];
  const { data: creators } = creatorIds.length ? await supabase.from("usuarios").select("id,nombre,apellido").in("id", creatorIds) : { data: [] };
  const creatorNames = new Map((creators || []).map((creator) => [creator.id, [creator.nombre, creator.apellido].filter(Boolean).join(" ")]));
  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");
  const isAdmin = String(profile.rol).toLowerCase() === "administrador";

  return <main className="management">
    <aside className="side"><Link className="side-brand" href="/gestion"><Image src="/logo-aoma.png" width={39} height={39} alt="AOMA"/><div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div></Link><nav><Link href="/gestion">Inicio institucional</Link><Link className="active" href="/gestion/sindical">Gestión sindical</Link><Link href="/gestion/formacion">Formación Sindical</Link><Link href="/gestion/biblioteca">Biblioteca</Link><Link href="/gestion/perfil">Mi perfil</Link>{isAdmin && <Link href="/gestion/usuarios">Administración de usuarios</Link>}</nav><div className="session"><strong>{name}</strong><span>{String(profile.rol || "Usuario autorizado")}</span><SignOutButton/></div></aside>
    <section className="main-area minutes-page"><Link className="library-back" href="/gestion/sindical">← Volver a Gestión Sindical</Link><header className="main-head"><div><p className="kicker">MEMORIA INSTITUCIONAL</p><h1>Actas y minutas</h1><p>Registrá reuniones, participantes, acuerdos y asuntos pendientes.</p></div></header>
      <details className="new-minutes" open><summary>Nueva acta o minuta</summary><ActaMinutaForm/></details>
      <section className="minutes-list"><h2>Documentos guardados</h2>{(documents || []).map((document) => <article key={document.id}><div><span>{String(document.tipo).toUpperCase()}</span><h3>{document.titulo}</h3><p>{[document.empresa_nombre, document.lugar].filter(Boolean).join(" · ") || "Sin empresa o lugar indicado"}</p></div><dl><div><dt>Fecha</dt><dd>{new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(document.fecha))}</dd></div><div><dt>Responsable</dt><dd>{creatorNames.get(document.creado_por) || "Usuario autorizado"}</dd></div><div><dt>Estado</dt><dd>{document.estado}</dd></div></dl></article>)}{!documents?.length && <p className="minutes-empty">Todavía no hay actas ni minutas guardadas.</p>}</section>
    </section>
    <style>{`.minutes-page{width:100%;max-width:1450px}.new-minutes{margin-top:20px}.new-minutes>summary{margin-bottom:14px;padding:15px 18px;border-radius:10px;background:#0b5264;color:white;font-size:18px;font-weight:900;cursor:pointer}.minutes-list{margin-top:30px}.minutes-list>h2{color:var(--petroleo);font:700 27px Georgia,serif}.minutes-list article{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(320px,1fr);gap:18px;margin-top:13px;padding:20px;border:1px solid var(--linea);border-radius:12px;background:white}.minutes-list article span{color:#9a6900;font-size:12px;font-weight:900}.minutes-list h3{margin:7px 0;color:var(--petroleo);font:700 20px Georgia,serif}.minutes-list p{margin:0;color:var(--gris)}.minutes-list dl{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0}.minutes-list dl div{display:grid;align-content:start;gap:4px}.minutes-list dt{color:var(--gris);font-size:11px;font-weight:900;text-transform:uppercase}.minutes-list dd{margin:0;font-size:14px;text-transform:capitalize}.minutes-empty{padding:22px;border:1px solid var(--linea);border-radius:12px;background:white}:root[data-theme="dark"] .minutes-list>h2,:root[data-theme="dark"] .minutes-list h3{color:#f2f7f8}:root[data-theme="dark"] .minutes-list article,:root[data-theme="dark"] .minutes-empty{background:#18343e;border-color:#49636c}:root[data-theme="dark"] .minutes-list article span{color:#f2c14e}:root[data-theme="dark"] .minutes-list dd{color:#e4eef0}@media(max-width:850px){.minutes-list article{grid-template-columns:1fr}.minutes-list dl{grid-template-columns:1fr 1fr}}@media(max-width:520px){.minutes-list dl{grid-template-columns:1fr}}`}</style>
  </main>;
}
