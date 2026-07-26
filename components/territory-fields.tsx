"use client";

import { useMemo, useState } from "react";

type Provincia={id:number;nombre:string};
type Departamento={id:number;nombre:string;provincia_id:number};
type Localidad={id:number;nombre:string;codigo_postal:string|null;departamento_id:number};

export function TerritoryFields({
 provincias,departamentos,localidades,inicial,
}:{
 provincias:Provincia[];
 departamentos:Departamento[];
 localidades:Localidad[];
 inicial?:{
  provincia_id?:number|null;departamento_id?:number|null;localidad_id?:number|null;
  provincia?:string|null;localidad?:string|null;codigo_postal?:string|null;
 };
}){
 const provinciaInicial=inicial?.provincia_id||provincias.find(p=>p.nombre==="SAN JUAN")?.id||0;
 const[provinciaId,setProvinciaId]=useState(provinciaInicial);
 const[departamentoId,setDepartamentoId]=useState(inicial?.departamento_id||0);
 const[localidadId,setLocalidadId]=useState(inicial?.localidad_id||0);
 const[codigoPostal,setCodigoPostal]=useState(inicial?.codigo_postal||"");
 const departamentosVisibles=useMemo(()=>departamentos.filter(d=>d.provincia_id===provinciaId),[departamentos,provinciaId]);
 const localidadesVisibles=useMemo(()=>localidades.filter(l=>l.departamento_id===departamentoId),[localidades,departamentoId]);
 const provincia=provincias.find(p=>p.id===provinciaId);
 const localidad=localidades.find(l=>l.id===localidadId);

 return <>
  <input type="hidden" name="provincia" value={provincia?.nombre||inicial?.provincia||""}/>
  <input type="hidden" name="localidad" value={localidad?.nombre||inicial?.localidad||""}/>
  <label><span>Provincia</span><select name="provincia_id" value={provinciaId||""} onChange={e=>{setProvinciaId(Number(e.target.value));setDepartamentoId(0);setLocalidadId(0);setCodigoPostal("");}} required>
   <option value="">Seleccionar provincia</option>{provincias.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
  </select></label>
  <label><span>Departamento</span><select name="departamento_id" value={departamentoId||""} onChange={e=>{setDepartamentoId(Number(e.target.value));setLocalidadId(0);setCodigoPostal("");}}>
   <option value="">Seleccionar departamento</option>{departamentosVisibles.map(d=><option key={d.id} value={d.id}>{d.nombre}</option>)}
  </select></label>
  <label><span>Localidad</span><select name="localidad_id" value={localidadId||""} onChange={e=>{const id=Number(e.target.value);setLocalidadId(id);setCodigoPostal(localidades.find(l=>l.id===id)?.codigo_postal||"");}}>
   <option value="">Seleccionar localidad</option>{localidadesVisibles.map(l=><option key={l.id} value={l.id}>{l.nombre}</option>)}
  </select></label>
  <label><span>Código postal</span><input name="codigo_postal" value={codigoPostal} onChange={e=>setCodigoPostal(e.target.value.toLocaleUpperCase("es-AR"))}/></label>
 </>;
}
