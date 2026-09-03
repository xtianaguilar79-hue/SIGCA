import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { updateMyProfile } from "./actions";

export default async function ProfilePage({ searchParams }:{ searchParams:Promise<{estado?:string}> }) {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const { data:profile } = await supabase.from("usuarios").select("nombre,apellido,dni,telefono,fecha_nacimiento,compartir_cumpleanos,mail,rol,empresa,convenio,estado,activo").eq("id",user.id).maybeSingle();
  if (!profile || profile.activo===false || String(profile.estado).toLowerCase()!=="aprobado") redirect("/acceso");
  const { estado } = await searchParams;
  const name=[profile.nombre,profile.apellido].filter(Boolean).join(" ");
  const isAdmin=String(profile.rol).toLowerCase()==="administrador";
  return <main className="management"><aside className="side"><div className="side-brand"><Image src="/logo-aoma.png" width={39} height={39} alt="AOMA"/><div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div></div><nav><Link href="/gestion">Inicio institucional</Link><Link href="/gestion/formacion">Formación Sindical</Link><Link className="active" href="/gestion/perfil">Mi perfil</Link>{isAdmin&&<Link href="/gestion/usuarios">Administración de usuarios</Link>}</nav><div className="session"><strong>{name}</strong><span>{String(profile.rol)}</span><SignOutButton/></div></aside><section className="main-area profile-page"><header className="main-head"><div><p className="kicker">CUENTA PERSONAL</p><h1>Mi perfil</h1><p>Consultá tu información y mantené actualizados tus datos de contacto.</p></div><span className="secure">● PERFIL PROTEGIDO</span></header>
    {estado==="guardado"&&<div className="profile-message success">Tus datos se actualizaron correctamente.</div>}
    {estado&&estado!=="guardado"&&<div className="profile-message error">No pudimos guardar los cambios. Revisá los datos e intentá nuevamente.</div>}
    <div className="profile-grid"><form action={updateMyProfile} className="profile-card"><div className="profile-card-head"><h2>Datos personales</h2><p>Estos son los datos que podés modificar.</p></div><div className="profile-fields"><label><span>Nombre</span><input name="nombre" defaultValue={profile.nombre||""} required minLength={2} maxLength={80}/></label><label><span>Apellido</span><input name="apellido" defaultValue={profile.apellido||""} required minLength={2} maxLength={80}/></label><label><span>Teléfono</span><input name="telefono" defaultValue={profile.telefono||""} required minLength={6} maxLength={30} inputMode="tel"/></label><label><span>Fecha de nacimiento</span><input name="fecha_nacimiento" type="date" min="1900-01-01" defaultValue={profile.fecha_nacimiento||""} required/></label><label className="full consent-field"><input name="compartir_cumpleanos" type="checkbox" defaultChecked={profile.compartir_cumpleanos===true}/><span>Autorizo el recordatorio institucional de mi cumpleaños. No se mostrará mi año de nacimiento.</span></label></div><button className="profile-save" type="submit">Guardar cambios</button></form>
      <section className="profile-card institutional-data"><div className="profile-card-head"><h2>Información institucional</h2><p>Para modificar estos datos, comunicate con la administración.</p></div><dl><div><dt>DNI</dt><dd>{profile.dni||"Sin registrar"}</dd></div><div><dt>Correo electrónico</dt><dd>{profile.mail||user.email}</dd></div><div><dt>Función sindical</dt><dd>{profile.rol||"Sin asignar"}</dd></div><div><dt>Empresa</dt><dd>{profile.empresa||"Sin asignar"}</dd></div><div><dt>Convenio</dt><dd>{profile.convenio||"Sin asignar"}</dd></div><div><dt>Estado de la cuenta</dt><dd><span className="account-approved">Aprobada</span></dd></div></dl></section></div>
  </section></main>;
}
