"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string | number; nombre: string };

export default function RegistrationPage() {
  const [companies,setCompanies]=useState<Item[]>([]);
  const [agreements,setAgreements]=useState<Item[]>([]);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState<{text:string;type:"error"|"success"}|null>(null);

  useEffect(()=>{const s=createClient();Promise.all([s.from("empresas").select("id,nombre").eq("activa",true).order("nombre"),s.from("convenios").select("id,nombre").eq("activo",true).order("nombre")]).then(([a,b])=>{setCompanies(a.data||[]);setAgreements(b.data||[]);});},[]);

  async function register(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setLoading(true); setMessage(null);
    const form=event.currentTarget; const d=new FormData(form); const password=String(d.get("password")||"");
    if(password!==String(d.get("confirmation")||"")){setMessage({text:"Las contraseñas no coinciden.",type:"error"});setLoading(false);return;}
    const email=String(d.get("email")||"").trim().toLowerCase(); const s=createClient();
    const {data:auth,error}=await s.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/auth/callback?next=/acceso`}});
    if(error||!auth.user){setMessage({text:error?.message||"No fue posible crear la cuenta.",type:"error"});setLoading(false);return;}
    const {error:profileError}=await s.from("usuarios").insert({
      id:auth.user.id,nombre:String(d.get("nombre")||"").trim(),apellido:String(d.get("apellido")||"").trim(),
      dni:String(d.get("dni")||"").trim(),telefono:String(d.get("telefono")||"").trim(),fecha_nacimiento:String(d.get("fecha_nacimiento")||""),
      compartir_cumpleanos:d.get("compartir_cumpleanos")==="on",mail:email,rol:String(d.get("rol")||""),empresa:String(d.get("empresa")||""),
      convenio:String(d.get("convenio")||""),estado:"Pendiente",activo:true
    });
    if(profileError){setMessage({text:"La cuenta fue creada, pero no pudimos registrar el perfil. Contactá a la administración.",type:"error"});setLoading(false);return;}
    await s.auth.signOut(); form.reset(); setMessage({text:"Solicitud enviada. La administración de AOMA debe aprobar tu cuenta antes del primer ingreso.",type:"success"}); setLoading(false);
  }

  return <main className="form-page"><section className="form-shell wide"><div className="form-brand"><Image src="/logo-aoma.png" width={45} height={45} alt="AOMA"/><div><strong>SIGCA</strong><span>AOMA SECCIONAL SAN JUAN</span></div></div><p className="kicker">REGISTRO INSTITUCIONAL</p><h1>Registro</h1><p className="form-intro">Completá tus datos. La cuenta quedará pendiente hasta que sea revisada por la administración.</p><form className="registration-grid" onSubmit={register}>
    <div className="field"><label htmlFor="nombre">Nombre</label><input id="nombre" name="nombre" required/></div>
    <div className="field"><label htmlFor="apellido">Apellido</label><input id="apellido" name="apellido" required/></div>
    <div className="field"><label htmlFor="dni">DNI</label><input id="dni" name="dni" inputMode="numeric" required/></div>
    <div className="field"><label htmlFor="telefono">Teléfono</label><input id="telefono" name="telefono" inputMode="tel" required/></div>
    <div className="field"><label htmlFor="fecha_nacimiento">Fecha de nacimiento</label><input id="fecha_nacimiento" name="fecha_nacimiento" type="date" min="1900-01-01" required/></div>
    <div className="field"><label htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" required/></div>
    <div className="field"><label htmlFor="rol">Función sindical</label><select id="rol" name="rol" required><option value="">Seleccionar</option><option>Dirigente</option><option>Delegado</option></select></div>
    <div className="field"><label htmlFor="empresa">Empresa</label><select id="empresa" name="empresa" required><option value="">Seleccionar</option>{companies.map(x=><option key={x.id} value={x.nombre}>{x.nombre}</option>)}</select></div>
    <div className="field"><label htmlFor="convenio">Convenio</label><select id="convenio" name="convenio" required><option value="">Seleccionar</option>{agreements.map(x=><option key={x.id} value={x.nombre}>{x.nombre}</option>)}</select></div>
    <div className="field"><label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" minLength={8} required/></div>
    <div className="field"><label htmlFor="confirmation">Repetir contraseña</label><input id="confirmation" name="confirmation" type="password" minLength={8} required/></div>
    <label className="full consent-field"><input name="compartir_cumpleanos" type="checkbox"/><span>Autorizo a SIGCA a informar mi cumpleaños a integrantes autorizados del sindicato. No se mostrará mi año de nacimiento.</span></label>
    {message&&<div className={`form-message ${message.type} full`}>{message.text}</div>}<button className="submit full" disabled={loading}>{loading?"Enviando...":"Solicitar cuenta"}</button>
  </form><Link className="back-link" href="/acceso">← Volver al ingreso</Link></section></main>;
}
