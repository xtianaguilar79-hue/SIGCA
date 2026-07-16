"use client";

import { useMemo, useState } from "react";
import { approveUser, rejectUser, updateInstitutionalUser } from "./actions";

type UserRow = { id:string; nombre:string|null; apellido:string|null; dni:string|null; telefono:string|null; mail:string|null; rol:string|null; empresa:string|null; convenio:string|null; estado:string|null; activo:boolean|null };
type CatalogItem = { id:string; nombre:string };

export function UserAdminPanel({ users, companies, agreements }: { users:UserRow[]; companies:CatalogItem[]; agreements:CatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const visibleUsers = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("es");
    return users.filter((user) => {
      const text = [user.nombre,user.apellido,user.dni,user.mail,user.empresa].filter(Boolean).join(" ").toLocaleLowerCase("es");
      return (filter === "Todos" || user.estado === filter) && (!search || text.includes(search));
    });
  }, [filter, query, users]);
  const pending = users.filter((user) => user.estado === "Pendiente").length;

  return <>
    <div className="admin-summary">
      <article><strong>{users.length}</strong><span>Usuarios registrados</span></article>
      <article><strong>{pending}</strong><span>Solicitudes pendientes</span></article>
      <article><strong>{users.filter((user) => user.activo).length}</strong><span>Cuentas activas</span></article>
    </div>
    <div className="admin-toolbar">
      <label><span>Buscar personas</span><input type="search" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Nombre, DNI, empresa o correo" /></label>
      <div className="status-filters" aria-label="Filtrar por estado">
        {["Todos","Pendiente","Aprobado","Rechazado"].map((state)=><button type="button" className={filter===state?"active":""} onClick={()=>setFilter(state)} key={state}>{state}</button>)}
      </div>
    </div>
    <div className="user-list">
      {visibleUsers.map((user)=><article className="user-card" key={user.id}>
        <header><div><h2>{[user.nombre,user.apellido].filter(Boolean).join(" ")}</h2><p>{user.mail} · DNI {user.dni||"sin informar"}</p></div><span className={`user-state ${String(user.estado).toLowerCase()}`}>{user.estado}</span></header>
        <form action={updateInstitutionalUser} className="user-edit-form">
          <input type="hidden" name="id" value={user.id}/>
          <label><span>Función</span><select name="rol" defaultValue={user.rol||"Personal autorizado"}><option>Administrador</option><option>Dirigente</option><option>Delegado</option><option>Personal autorizado</option></select></label>
          <label><span>Empresa</span><select name="empresa" defaultValue={user.empresa||""}><option value="">Sin asignar</option>{companies.map((item)=><option key={item.id} value={item.nombre}>{item.nombre}</option>)}</select></label>
          <label><span>Convenio</span><select name="convenio" defaultValue={user.convenio||""}><option value="">Sin asignar</option>{agreements.map((item)=><option key={item.id} value={item.nombre}>{item.nombre}</option>)}</select></label>
          <label><span>Estado</span><select name="estado" defaultValue={user.estado||"Pendiente"}><option>Pendiente</option><option>Aprobado</option><option>Rechazado</option></select></label>
          <label><span>Acceso</span><select name="activo" defaultValue={String(user.activo!==false)}><option value="true">Activo</option><option value="false">Suspendido</option></select></label>
          <button className="save-user" type="submit">Guardar cambios</button>
        </form>
        {user.estado==="Pendiente"&&<div className="quick-actions"><form action={approveUser}><input type="hidden" name="id" value={user.id}/><button className="approve-user">Aprobar solicitud</button></form><form action={rejectUser}><input type="hidden" name="id" value={user.id}/><button className="reject-user">Rechazar</button></form></div>}
      </article>)}
      {visibleUsers.length===0&&<div className="empty-users">No hay personas que coincidan con la búsqueda.</div>}
    </div>
  </>;
}
