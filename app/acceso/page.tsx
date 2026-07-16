"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "warning" } | null>(null);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(null); setLoading(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const supabase = createClient();
    const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !auth.user) { setMessage({ text: "El correo electrónico o la contraseña son incorrectos.", type: "error" }); setLoading(false); return; }
    const { data: profile, error: profileError } = await supabase.from("usuarios").select("nombre,estado,activo").eq("id", auth.user.id).maybeSingle();
    if (profileError || !profile) { await supabase.auth.signOut(); setMessage({ text: "La cuenta no tiene un perfil institucional asociado.", type: "error" }); setLoading(false); return; }
    if (profile.activo === false || String(profile.estado).toLowerCase() !== "aprobado") { await supabase.auth.signOut(); setMessage({ text: "Tu solicitud todavía no está aprobada por la administración.", type: "warning" }); setLoading(false); return; }
    router.replace("/gestion"); router.refresh();
  }

  return <main className="access-page">
    <section className="access-panel">
      <div className="access-brand"><Image src="/logo-aoma.png" width={50} height={50} alt="AOMA" priority/><div><strong>SIGCA</strong><span>AOMA SECCIONAL SAN JUAN</span></div></div>
      <div className="access-copy"><p className="kicker">ACCESO INSTITUCIONAL</p><h1>Bienvenido a tu espacio de gestión sindical</h1><p>Ingresá con tu cuenta autorizada para acceder a capacitación, documentación y herramientas de trabajo.</p>
        <form className="access-form" onSubmit={signIn}>
          <div className="field"><label htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
          <div className="field"><label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div>
          {message && <div className={`form-message ${message.type}`} role="alert">{message.text}</div>}
          <button className="submit" disabled={loading}>{loading ? "Verificando acceso..." : "Ingresar a SIGCA"}</button>
        </form><div className="access-links"><Link href="/recuperar-contrasena">Recuperar contraseña</Link><Link href="/registro">Registro</Link></div><p className="access-note">El acceso está restringido a dirigentes, delegados y personal autorizado. Las acciones sensibles quedan registradas.</p>
      </div>
    </section>
    <section className="access-visual"><div className="visual-content"><div className="gold-line"/><blockquote>“Que ningún conocimiento, compromiso ni reclamo se pierda con el paso del tiempo.”</blockquote><p>MEMORIA INSTITUCIONAL · FORMACIÓN · GESTIÓN SINDICAL</p></div></section>
  </main>;
}
