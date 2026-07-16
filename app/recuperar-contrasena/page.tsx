"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RecoverPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const email = String(
      new FormData(event.currentTarget).get("email") || "",
    )
      .trim()
      .toLowerCase();

    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-contrasena`,
    });

    setMessage(
      error
        ? { text: "No pudimos enviar el mensaje. Intentá nuevamente.", type: "error" }
        : {
            text: "Si la cuenta existe, recibirás un correo con el enlace para elegir una nueva contraseña.",
            type: "success",
          },
    );
    setLoading(false);
  }

  return (
    <main className="form-page">
      <section className="form-shell">
        <div className="form-brand">
          <Image src="/logo-aoma.png" width={45} height={45} alt="AOMA" />
          <div>
            <strong>SIGCA</strong>
            <span>AOMA SECCIONAL SAN JUAN</span>
          </div>
        </div>
        <p className="kicker">RECUPERAR ACCESO</p>
        <h1>Restablecer contraseña</h1>
        <p className="form-intro">
          Ingresá el correo asociado a tu cuenta institucional.
        </p>
        <form className="access-form" onSubmit={recover}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" required />
          </div>
          {message && (
            <div className={`form-message ${message.type}`}>{message.text}</div>
          )}
          <button className="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
        <Link className="back-link" href="/acceso">
          ← Volver al ingreso
        </Link>
      </section>
    </main>
  );
}
