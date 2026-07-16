"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UpdatePasswordForm } from "./form";

type RecoveryStatus = "checking" | "ready" | "invalid";

export default function UpdatePasswordPage() {
  const [status, setStatus] = useState<RecoveryStatus>("checking");

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let finalCheck: ReturnType<typeof setTimeout> | undefined;

    const markReady = () => {
      if (active) setStatus("ready");
    };

    const establishRecoverySession = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          window.history.replaceState({}, "", url.pathname);
          markReady();
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        markReady();
        return;
      }

      finalCheck = setTimeout(async () => {
        const { data: latest } = await supabase.auth.getSession();
        if (!active) return;
        setStatus(latest.session ? "ready" : "invalid");
      }, 1500);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION")
      ) {
        markReady();
      }
    });

    void establishRecoverySession();

    return () => {
      active = false;
      if (finalCheck) clearTimeout(finalCheck);
      listener.subscription.unsubscribe();
    };
  }, []);

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
        <p className="kicker">NUEVA CONTRASEÑA</p>
        <h1>Protegé tu cuenta</h1>

        {status === "checking" && (
          <p className="form-intro">Validando el enlace de recuperación...</p>
        )}

        {status === "ready" && (
          <>
            <p className="form-intro">
              Elegí una contraseña de al menos ocho caracteres.
            </p>
            <UpdatePasswordForm />
          </>
        )}

        {status === "invalid" && (
          <>
            <div className="form-message error">
              El enlace venció o ya fue utilizado. Solicitá uno nuevo para
              continuar.
            </div>
            <Link className="back-link" href="/recuperar-contrasena">
              Solicitar un nuevo enlace
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
