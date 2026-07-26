import Image from "next/image";
import Link from "next/link";
import {redirect} from "next/navigation";
import {SignOutButton} from "@/components/sign-out-button";
import {createClient} from "@/lib/supabase/server";
import {actualizarLocalidad,crearLocalidad} from "./actions";

export default async function LocalidadesPage({searchParams}:{searchParams:Promise<{creada?:string;actualizada?:string;error?:string}>}){
 const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/acceso");
 const{data:profile}=await supabase.from("usuarios").select("nombre,apellido,rol,estado,activo").eq("id",user.id).maybeSingle();
 if(!profile||profile.activo===false||String(profile.estado).toLowerCase()!=="aprobado"||String(profile.rol).toLowerCase()!=="administrador")redirect("/gestion");
 const[{data:departamentos},{data:localidades}]=await Promise.all([
  supabase.from("departamentos").select("id,nombre,provincias(nombre)").eq("habilitado",true).order("nombre"),
  supabase.from("localidades").select("id,nombre,codigo_postal,orden,habilitada,departamentos(nombre,provincias(nombre))").order("orden").order("nombre")
 ]);
 const params=await searchParams,name=[profile.nombre,profile.apellido].filter(Boolean).join(" ");
 const activas=(localidades||[]).filter(x=>x.habilitada).length;
 return <main className="management"><aside className="side">
  <Link className="side-brand" href="/gestion"><Image src="/logo-aoma.png" width={39} height={39} alt="AOMA"/><div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div></Link>
  <nav><Link href="/gestion">Inicio institucional</Link><Link href="/gestion/sindical">Gestión sindical</Link><Link href="/gestion/formacion">Formación Sindical</Link><Link href="/gestion/biblioteca">Biblioteca</Link><Link href="/gestion/perfil">Mi perfil</Link><Link className="active" href="/gestion/sistema">Sistema</Link><Link href="/gestion/usuarios">Administración de usuarios</Link></nav>
  <div className="session"><strong>{name}</strong><span>Administrador</span><SignOutButton/></div>
 </aside><section className="main-area affiliate-states-page">
  <Link className="library-back" href="/gestion/sistema/configuracion">← Volver a Configuración</Link>
  <header className="main-head"><div><p className="kicker">CONFIGURACIÓN · TERRITORIO</p><h1>Localidades</h1><p>Administrá las localidades y sus códigos postales.</p></div><span className="secure">● CATÁLOGO INSTITUCIONAL</span></header>
  {params.creada==="1"&&<div className="form-message success">Localidad creada correctamente.</div>}
  {params.actualizada==="1"&&<div className="form-message success">Localidad actualizada correctamente.</div>}
  {params.error&&<div className="form-message error">No fue posible guardar el cambio.</div>}
  <div className="affiliate-states-summary"><article><strong>{(localidades||[]).length}</strong><span>Localidades registradas</span></article><article><strong>{activas}</strong><span>Localidades habilitadas</span></article><article><strong>{(localidades||[]).length-activas}</strong><span>Localidades deshabilitadas</span></article></div>
  <details className="affiliate-state-create"><summary>＋ Agregar localidad</summary><form action={crearLocalidad}>
   <label><span>Departamento</span><select name="departamento_id" required defaultValue=""><option value="" disabled>Seleccionar departamento</option>{(departamentos||[]).map(d=><option key={d.id} value={d.id}>{(d.provincias as unknown as {nombre:string}|null)?.nombre} · {d.nombre}</option>)}</select></label>
   <label><span>Localidad</span><input name="nombre" required minLength={2}/></label>
   <label><span>Código postal</span><input name="codigo_postal"/></label>
   <label><span>Orden</span><input name="orden" type="number" min={0} required/></label>
   <button type="submit">Guardar localidad</button>
  </form></details>
  <section className="affiliate-state-list"><div className="section-heading"><div><p className="kicker">TERRITORIO</p><h2>Configuración actual</h2></div></div>
   {(localidades||[]).map(l=>{const d=l.departamentos as unknown as {nombre:string;provincias:{nombre:string}|null}|null;return <article key={l.id}>
    <header><div><h3>{l.nombre}</h3><p>{d?.provincias?.nombre} · {d?.nombre}</p><span className={l.habilitada?"active":"inactive"}>{l.habilitada?"HABILITADA":"DESHABILITADA"}</span></div></header>
    <form action={actualizarLocalidad}><input type="hidden" name="id" value={l.id}/><label><span>Código postal</span><input name="codigo_postal" defaultValue={l.codigo_postal||""}/></label><label><span>Orden</span><input name="orden" type="number" min={0} defaultValue={l.orden} required/></label><label><span>Disponibilidad</span><select name="habilitada" defaultValue={String(l.habilitada)}><option value="true">Habilitada</option><option value="false">Deshabilitada</option></select></label><button type="submit">Guardar cambios</button></form>
   </article>})}
  </section><p className="affiliate-states-note">Las localidades no se eliminan para proteger la información histórica; pueden deshabilitarse.</p>
 </section></main>;
}
