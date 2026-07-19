"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string | number; nombre: string };

export default function RegistrationPage() {
  const [companies, setCompanies] = useState<Item[]>([]);
  const [agreements, setAgreements] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase
        .from("empresas")
        .select("id,nombre")
        .eq("activa", true)
        .order("nombre"),
      supabase
        .from("convenios")
        .select("id,nombre")
        .eq("activo", true)
        .order("nombre"),
    ]).then(([companiesResult, agreementsResult]) => {
      setCompanies(companiesResult.data || []);
      setAgreements(agreementsResult.data || []);
    });
  }, []);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") || "");

    if (password !== String(data.get("confirmation") || "")) {
      setMessage({
        text: "Las contraseñas no coinciden.",
        type: "error",
      });
      setLoading(false);
      return;
    }

    const email = String(data.get("email") || "")
      .trim()
      .toLowerCase();
    const supabase = createClient();

    const { data: auth, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/acceso`,
        data: {
          nombre: String(data.get("nombre") || "").trim(),
          apellido: String(data.get("apellido") || "").trim(),
          dni: String(data.get("dni") || "").trim(),
          telefono: String(data.get("telefono") || "").trim(),
          fecha_nacimiento: String(data.get("fecha_nacimiento") || ""),
          compartir_cumpleanos:
            data.get("compartir_cumpleanos") === "on",
          rol: String(data.get("rol") || ""),
          empresa: String(data.get("empresa") || ""),
          convenio: String(data.get("convenio") || ""),
        },
      },
    });

    if (error || !auth.user) {
      setMessage({
        text: error?.message || "No fue posible crear la cuenta.",
        type: "error",
      });
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    form.reset();
    setMessage({
      text: "Solicitud enviada. Revisá tu correo electrónico y confirmá la cuenta. La administración de AOMA deberá aprobarla antes del primer ingreso.",
      type: "success",
    });
    setLoading(false);
  }

  return (
    <main className="form-page">
      <section className="form-shell wide">
        <div className="form-brand">
          <Image
            src="/logo-aoma.png"
            width={45}
            height={45}
            alt="AOMA"
          />
          <div>
            <strong>SIGCA</strong>
            <span>AOMA SECCIONAL SAN JUAN</span>
          </div>
        </div>

        <p className="kicker">REGISTRO INSTITUCIONAL</p>
        <h1>Registro</h1>
        <p className="form-intro">
          Completá tus datos. La cuenta quedará pendiente hasta que sea
          revisada por la administración.
        </p>

        <form className="registration-grid" onSubmit={register}>
          <div className="field">
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" name="nombre" required />
          </div>
          <div className="field">
            <label htmlFor="apellido">Apellido</label>
            <input id="apellido" name="apellido" required />
          </div>
          <div className="field">
            <label htmlFor="dni">DNI</label>
            <input id="dni" name="dni" inputMode="numeric" required />
          </div>
          <div className="field">
            <label htmlFor="telefono">Teléfono</label>
            <input id="telefono" name="telefono" inputMode="tel" required />
          </div>
          <div className="field">
            <label htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
            <input
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              type="date"
              min="1900-01-01"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="rol">Función sindical</label>
            <select id="rol" name="rol" required>
              <option value="">Seleccionar</option>
              <option>Dirigente</option>
              <option>Delegado</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="empresa">Empresa</label>
            <select id="empresa" name="empresa" required>
              <option value="">Seleccionar</option>
              {companies.map((company) => (
                <option key={company.id} value={company.nombre}>
                  {company.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="convenio">Convenio</label>
            <select id="convenio" name="convenio" required>
              <option value="">Seleccionar</option>
              {agreements.map((agreement) => (
                <option key={agreement.id} value={agreement.nombre}>
                  {agreement.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirmation">Repetir contraseña</label>
            <input
              id="confirmation"
              name="confirmation"
              type="password"
              minLength={8}
              required
            />
          </div>

          <label className="full consent-field">
            <input name="compartir_cumpleanos" type="checkbox" />
            <span>
              Autorizo a SIGCA a informar mi cumpleaños a integrantes
              autorizados del sindicato. No se mostrará mi año de nacimiento.
            </span>
          </label>

          {message && (
            <div className={`form-message ${message.type} full`} role="alert">
              {message.text}
            </div>
          )}

          <button className="submit full" disabled={loading}>
            {loading ? "Enviando..." : "Solicitar cuenta"}
          </button>
        </form>

        <Link className="back-link" href="/acceso">
          ← Volver al ingreso
        </Link>
      </section>
    </main>
  );
}
