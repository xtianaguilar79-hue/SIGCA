import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ActaMinutaForm, ActaMinutaInitialData } from "@/components/acta-minuta-form";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

function value(data: unknown) { return String(data || ""); }
function localDateTime(data: string) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(data)).replace(" ", "T");
}

export default async function EditarActaPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const { data: profile } = await supabase.from("usuarios").select("nombre,apellido,rol,estado,activo").eq("id", user.id).maybeSingle();
  if (!profile || profile.activo === false || String(profile.estado).toLowerCase() !== "aprobado") redirect("/acceso");
  const { id } = await params;
  const { data: document } = await supabase.from("actas_minutas").select("*").eq("id", id).maybeSingle();
  if (!document) notFound();
  const isAdmin = String(profile.rol).toLowerCase() === "administrador";
  if (document.estado !== "borrador" || (document.creado_por !== user.id && !isAdmin)) redirect(`/gestion/sindical/actas/${id}`);
  const initialData: ActaMinutaInitialData = {
    tipo: value(document.tipo), titulo: value(document.titulo), fecha: localDateTime(document.fecha), lugar: value(document.lugar),
    empresaNombre: value(document.empresa_nombre), asunto: value(document.asunto), participantes: value(document.participantes),
    desarrollo: value(document.desarrollo), acuerdos: value(document.acuerdos), asuntosPendientes: value(document.asuntos_pendientes), observaciones: value(document.observaciones),
  };
  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");
  return <main className="management"><aside className="side"><Link className="side-brand" href="/gestion"><Image src="/logo-aoma.png" width={39} height={39} alt="AOMA"/><div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div></Link><nav><Link href="/gestion">Inicio institucional</Link><Link className="active" href="/gestion/sindical">Gestión sindical</Link><Link href="/gestion/formacion">Formación Sindical</Link><Link href="/gestion/biblioteca">Biblioteca</Link><Link href="/gestion/perfil">Mi perfil</Link>{isAdmin && <Link href="/gestion/usuarios">Administración de usuarios</Link>}</nav><div className="session"><strong>{name}</strong><span>{String(profile.rol || "Usuario autorizado")}</span><SignOutButton/></div></aside><section className="main-area"><Link className="library-back" href={`/gestion/sindical/actas/${id}`}>← Volver al documento</Link><header className="main-head"><div><p className="kicker">BORRADOR</p><h1>Editar acta o minuta</h1><p>Revisá y corregí el contenido antes de finalizarlo.</p></div></header><ActaMinutaForm documentId={id} initialData={initialData}/></section></main>;
}
