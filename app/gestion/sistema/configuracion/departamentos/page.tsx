import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { actualizarDepartamento, crearDepartamento } from "./actions";

export default async function DepartamentosPage({searchParams}:{searchParams:Promise<{creado?:string;actualizado?:string;error?:string}>}){
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/acceso");
  const{data:profile}=await supabase.from("usuarios").select("nombre,apellido,rol,estado,activo").eq("id",user.id).maybeSingle();
  if(!profile||profile.activo===false||String(profile.estado).toLowerCase()!=="aprobado"||String(profile.rol).toLowerCase()!=="administrador")redirect("/gestion");
  const[{data:provincias},{data:departamentos}]=await Promise.all([
    supabase.from("provincias").select("id,nombre").eq("habilitada",true).order("orden"),
    supabase.from("departamentos").select("id,nombre,orden,habilitado,provincias(nombre)").order("orden").order("nombre"),
  ]);
  const params=await searchParams;
  const name=[profile.nombre,profile.apellido].filter(Boolean).join(" ");
  const habilitados=(departamentos||[]).filter(d=>d.habilitado).length;
  return <main className="management">
    <aside className="side">
      <Link className="side-brand" href="/gestion"><Image src="/logo-aoma.png" width={39} height={39} alt="AOMA"/><div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div></Link>
      <nav><Link href="/gestion">Inicio institucional</Link><Link href="/gestion/sindical">Gestión sindical</Link><Link href="/gestion/formacion">Formación Sindical</Link><Link href="/gestion/biblioteca">Biblioteca</Link><Link href="/gestion/perfil">Mi perfil</Link><Link className="active" href="/gestion/sistema">Sistema</Link><Link href="/gestion/usuarios">Administración de usuarios</Link></nav>
      <div className="session"><strong>{name}</strong><span>Administrador</span><SignOutButton/></div>
    </aside>
    <section className="main-area affiliate-states-page">
      <Link className="library-back" href="/gestion/sistema/configuracion">← Volver a Configuración</Link>
      <header className="main-head"><div><p className="kicker">CONFIGURACIÓN · TERRITORIO</p><h1>Departamentos</h1><p>Administrá los departamentos relacionados con cada provincia.</p></div><span className="secure">● CATÁLOGO INSTITUCIONAL</span></header>
      {params.creado==="1"&&<div className="form-message success">Departamento creado correctamente.</div>}
      {params.actualizado==="1"&&<div className="form-message success">Departamento actualizado correctamente.</div>}
      {params.error&&<div className="form-message error">No fue posible guardar el cambio.</div>}
      <div className="affiliate-states-summary">
        <article><strong>{(departamentos||[]).length}</strong><span>Departamentos registrados</span></article>
        <article><strong>{habilitados}</strong><span>Departamentos habilitados</span></article>
        <article><strong>{(departamentos||[]).length-habilitados}</strong><span>Departamentos deshabilitados</span></article>
      </div>
      <details className="affiliate-state-create">
        <summary>＋ Agregar departamento</summary>
        <form action={crearDepartamento}>
          <label><span>Provincia</span><select name="provincia_id" required defaultValue=""><option value="" disabled>Seleccionar provincia</option>{(provincias||[]).map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
          <label><span>Nombre</span><input name="nombre" required minLength={2}/></label>
          <label><span>Orden</span><input name="orden" type="number" min={0} required/></label>
          <button type="submit">Guardar departamento</button>
        </form>
      </details>
      <section className="affiliate-state-list">
        <div className="section-heading"><div><p className="kicker">TERRITORIO</p><h2>Configuración actual</h2></div></div>
        {(departamentos||[]).map(d=><article key={d.id}>
          <header><div><h3>{d.nombre}</h3><p>{(d.provincias as unknown as {nombre:string}|null)?.nombre||"Sin provincia"}</p><span className={d.habilitado?"active":"inactive"}>{d.habilitado?"HABILITADO":"DESHABILITADO"}</span></div></header>
          <form action={actualizarDepartamento}>
            <input type="hidden" name="id" value={d.id}/>
            <label><span>Orden</span><input name="orden" type="number" min={0} defaultValue={d.orden} required/></label>
            <label><span>Disponibilidad</span><select name="habilitado" defaultValue={String(d.habilitado)}><option value="true">Habilitado</option><option value="false">Deshabilitado</option></select></label>
            <button type="submit">Guardar cambios</button>
          </form>
        </article>)}
      </section>
      <p className="affiliate-states-note">Los departamentos no se eliminan para conservar la información histórica. Si dejan de utilizarse, se deshabilitan.</p>
    </section>
  </main>;
}
