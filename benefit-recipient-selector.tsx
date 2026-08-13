"use client";

import { KeyboardEvent, useState } from "react";

export type BenefitAffiliate = {
  id: string;
  apellido_nombres: string;
  documento_numero: string | null;
  numero_aoma: string | number | null;
  empresa_original: string | null;
  estado: string | null;
};

export type BenefitRelative = {
  id: string;
  afiliado_id: string;
  apellido_nombres: string;
  vinculo: string;
  documento_numero: string | null;
  fecha_nacimiento: string | null;
};

function texto(valor: unknown, reemplazo = "Sin informar") {
  const resultado = String(valor ?? "").trim();
  return resultado || reemplazo;
}

function numeroAoma(valor: unknown) {
  const numero = String(valor ?? "").trim();
  return numero && numero.toLowerCase() !== "null" ? numero : "0";
}

function mostrarFecha(valor: string | null) {
  if (!valor) return "Sin informar";

  const partes = valor.slice(0, 10).split("-");

  if (partes.length !== 3) return valor;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function calcularEdad(valor: string | null) {
  if (!valor) return null;

  const nacimiento = new Date(`${valor.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();

  if (
    diferenciaMes < 0 ||
    (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())
  ) {
    edad -= 1;
  }

  return edad >= 0 ? edad : null;
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);

  return partes
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toUpperCase();
}

function tonoEstado(estado: string | null) {
  const valor = String(estado ?? "").toLocaleUpperCase("es");

  if (valor.includes("RENUNCIA") || valor.includes("DESAFILIADO")) {
    return "danger-strong";
  }

  if (valor.includes("BAJA")) return "danger";

  if (valor.includes("AVERIGUACION") || valor.includes("AVERIGUACIÓN")) {
    return "warning";
  }

  if (valor.includes("DIRIGENTE") || valor.includes("DELEGADO")) {
    return "information";
  }

  if (
    valor.includes("AFILIADO OK") ||
    valor.includes("EN TRAMITE") ||
    valor.includes("EN TRÁMITE") ||
    valor.includes("BECARIA")
  ) {
    return "success";
  }

  return "neutral";
}

export function BenefitRecipientSelector({
  afiliado,
  familiares,
}: {
  afiliado: BenefitAffiliate;
  familiares: BenefitRelative[];
}) {
  const [seleccionado, setSeleccionado] = useState("");

  const valorTitular = `${afiliado.id}|`;
  const estado = texto(afiliado.estado);

  function alternar(valor: string) {
    setSeleccionado((actual) => (actual === valor ? "" : valor));
  }

  function manejarTeclado(
    event: KeyboardEvent<HTMLLabelElement>,
    valor: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      alternar(valor);
    }
  }

  return (
    <div className="recipient-selector">
      <section className="selected-affiliate-card">
        <div className="selected-affiliate-avatar" aria-hidden="true">
          {iniciales(afiliado.apellido_nombres)}
        </div>

        <div className="selected-affiliate-identity">
          <span className="selected-affiliate-kicker">
            Afiliado seleccionado
          </span>

          <h3>{afiliado.apellido_nombres}</h3>

          <div className="selected-affiliate-data">
            <span>DNI {texto(afiliado.documento_numero)}</span>
            <span>{texto(afiliado.empresa_original)}</span>
          </div>
        </div>

        <div className="selected-affiliate-number">
          <span>Número de afiliado</span>
          <strong>{numeroAoma(afiliado.numero_aoma)}</strong>
        </div>

        <span
          className={`selected-affiliate-status status-${tonoEstado(
            afiliado.estado,
          )}`}
        >
          {estado}
        </span>
      </section>

      <header className="recipient-heading">
        <div>
          <span className="recipient-kicker">Destinatario</span>
          <h3>¿Quién recibirá el beneficio?</h3>
          <p>
            Seleccioná al titular o a una persona de su grupo familiar.
            Volvé a tocar la opción elegida para destildarla.
          </p>
        </div>

        <strong className="recipient-total">
          {familiares.length}{" "}
          {familiares.length === 1 ? "familiar" : "familiares"}
        </strong>
      </header>

      <div className="recipient-grid">
        <label
          className={`recipient-card recipient-card-titular ${
            seleccionado === valorTitular ? "is-selected" : ""
          }`}
          tabIndex={0}
          onClick={(event) => {
            event.preventDefault();
            alternar(valorTitular);
          }}
          onKeyDown={(event) => manejarTeclado(event, valorTitular)}
        >
          <input
            type="radio"
            name="destinatario"
            value={valorTitular}
            checked={seleccionado === valorTitular}
            readOnly
          />

          <span className="recipient-avatar" aria-hidden="true">
            {iniciales(afiliado.apellido_nombres)}
          </span>

          <span className="recipient-card-copy">
            <small>Titular afiliado</small>
            <strong>{afiliado.apellido_nombres}</strong>
            <span>
              DNI {texto(afiliado.documento_numero)} · AOMA{" "}
              {numeroAoma(afiliado.numero_aoma)}
            </span>
          </span>

          <span className="recipient-check" aria-hidden="true">
            {seleccionado === valorTitular ? "✓" : ""}
          </span>
        </label>

        {familiares.map((familiar) => {
          const valor = `${afiliado.id}|${familiar.id}`;
          const edad = calcularEdad(familiar.fecha_nacimiento);

          return (
            <label
              className={`recipient-card ${
                seleccionado === valor ? "is-selected" : ""
              }`}
              key={familiar.id}
              tabIndex={0}
              onClick={(event) => {
                event.preventDefault();
                alternar(valor);
              }}
              onKeyDown={(event) => manejarTeclado(event, valor)}
            >
              <input
                type="radio"
                name="destinatario"
                value={valor}
                checked={seleccionado === valor}
                readOnly
              />

              <span className="recipient-avatar" aria-hidden="true">
                {iniciales(familiar.apellido_nombres)}
              </span>

              <span className="recipient-card-copy">
                <small>{texto(familiar.vinculo)}</small>
                <strong>{familiar.apellido_nombres}</strong>
                <span>
                  DNI {texto(familiar.documento_numero)} · Nacimiento{" "}
                  {mostrarFecha(familiar.fecha_nacimiento)}
                  {edad !== null ? ` · ${edad} años` : ""}
                </span>
              </span>

              <span className="recipient-check" aria-hidden="true">
                {seleccionado === valor ? "✓" : ""}
              </span>
            </label>
          );
        })}
      </div>

      {!seleccionado && (
        <p className="recipient-help">
          Seleccioná al titular o a uno de sus familiares para continuar.
        </p>
      )}

      <style jsx>{`
        .recipient-selector {
          display: grid;
          gap: 30px;
        }

        .selected-affiliate-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 22px;
          padding: 24px 26px;
          border: 1px solid #bad0d6;
          border-radius: 22px;
          background:
            linear-gradient(135deg, #e7f4f6 0%, #ffffff 78%);
          box-shadow: 0 15px 34px rgba(6, 63, 80, 0.1);
        }

        .selected-affiliate-avatar,
        .recipient-avatar {
          display: grid;
          place-items: center;
          flex: none;
          color: #ffffff;
          background: #064d60;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .selected-affiliate-avatar {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          font-size: 25px;
          box-shadow: 0 10px 24px rgba(6, 63, 80, 0.18);
        }

        .selected-affiliate-identity {
          min-width: 0;
        }

        .selected-affiliate-kicker,
        .recipient-kicker,
        .recipient-card-copy small,
        .selected-affiliate-number span {
          display: block;
          color: #9d6700;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .selected-affiliate-identity h3 {
          margin: 6px 0 10px;
          color: #063f50;
          font-size: clamp(24px, 2vw, 33px);
          line-height: 1.08;
        }

        .selected-affiliate-data {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .selected-affiliate-data span {
          padding: 7px 12px;
          border: 1px solid #cedde1;
          border-radius: 999px;
          background: #ffffff;
          color: #425e67;
          font-size: 14px;
          font-weight: 800;
        }

        .selected-affiliate-number {
          min-width: 190px;
          padding: 14px 18px;
          border: 2px solid #d6a33e;
          border-radius: 17px;
          background: #fff8df;
          text-align: center;
        }

        .selected-affiliate-number strong {
          display: block;
          margin-top: 2px;
          color: #063f50;
          font-size: clamp(30px, 3vw, 42px);
          line-height: 1;
        }

        .selected-affiliate-status {
          max-width: 310px;
          padding: 10px 15px;
          border: 1px solid transparent;
          border-radius: 999px;
          text-align: center;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.25;
          text-transform: uppercase;
        }

        .status-success {
          border-color: #a8d8bf;
          background: #e2f5e9;
          color: #086c50;
        }

        .status-information {
          border-color: #a9cfe4;
          background: #e4f3fb;
          color: #155f83;
        }

        .status-warning {
          border-color: #eac56c;
          background: #fff2c9;
          color: #855800;
        }

        .status-danger {
          border-color: #edb6aa;
          background: #fde5df;
          color: #934333;
        }

        .status-danger-strong {
          border-color: #e69696;
          background: #fbd5d5;
          color: #8c2020;
        }

        .status-neutral {
          border-color: #cbd9dc;
          background: #eef4f5;
          color: #4f6870;
        }

        .recipient-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 18px;
        }

        .recipient-heading h3 {
          margin: 6px 0 4px;
          color: #063f50;
          font-size: clamp(27px, 3vw, 40px);
          line-height: 1.08;
        }

        .recipient-heading p {
          margin: 0;
          color: #647985;
          font-size: 17px;
          line-height: 1.5;
        }

        .recipient-total {
          flex: none;
          padding: 11px 18px;
          border-radius: 999px;
          background: #e4f2f4;
          color: #063f50;
          font-size: 15px;
        }

        .recipient-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .recipient-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 16px;
          min-height: 128px;
          padding: 20px 22px;
          overflow: hidden;
          border: 1px solid #bfd2d7;
          border-radius: 19px;
          background: #ffffff;
          color: #063f50;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(6, 63, 80, 0.06);
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .recipient-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 7px;
          background: #c2e0e5;
        }

        .recipient-card:hover,
        .recipient-card:focus-visible {
          border-color: #68aabb;
          outline: none;
          box-shadow: 0 13px 28px rgba(6, 63, 80, 0.12);
          transform: translateY(-2px);
        }

        .recipient-card.is-selected {
          border-color: #d6a33e;
          background: #fffaf0;
          box-shadow: 0 14px 30px rgba(170, 116, 10, 0.16);
        }

        .recipient-card.is-selected::before {
          background: #d6a33e;
        }

        .recipient-card-titular {
          grid-column: 1 / -1;
          background: #eef8fa;
        }

        .recipient-card input {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
        }

        .recipient-avatar {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          font-size: 18px;
        }

        .recipient-card-copy {
          display: grid;
          min-width: 0;
          gap: 4px;
        }

        .recipient-card-copy strong {
          overflow-wrap: anywhere;
          font-size: 20px;
          line-height: 1.2;
        }

        .recipient-card-copy > span {
          color: #58717b;
          font-size: 15px;
          line-height: 1.45;
        }

        .recipient-check {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          margin-left: auto;
          flex: none;
          border: 2px solid #b2c7cd;
          border-radius: 50%;
          color: #ffffff;
          font-size: 19px;
          font-weight: 900;
        }

        .is-selected .recipient-check {
          border-color: #0b7359;
          background: #0b7359;
        }

        .recipient-help {
          margin: -8px 0 0;
          padding: 13px 16px;
          border-left: 4px solid #d6a33e;
          border-radius: 8px;
          background: #fff7de;
          color: #735112;
          font-size: 15px;
        }

        @media (max-width: 1000px) {
          .selected-affiliate-card {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .selected-affiliate-number,
          .selected-affiliate-status {
            width: 100%;
            max-width: none;
          }
        }

        @media (max-width: 760px) {
          .selected-affiliate-card {
            grid-template-columns: 1fr;
            justify-items: center;
            padding: 22px 18px;
            text-align: center;
          }

          .selected-affiliate-data {
            justify-content: center;
          }

          .recipient-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .recipient-grid {
            grid-template-columns: 1fr;
          }

          .recipient-card-titular {
            grid-column: auto;
          }

          .recipient-card {
            min-height: 118px;
            padding: 18px;
          }

          .recipient-avatar {
            width: 50px;
            height: 50px;
          }

          .recipient-card-copy strong {
            font-size: 18px;
          }

          .recipient-card-copy > span {
            font-size: 14px;
          }
        }

        :global(:root[data-theme="dark"]) .selected-affiliate-card,
        :global(:root[data-theme="dark"]) .recipient-card {
          border-color: #49636c;
          background: #18343e;
          color: #f2f7f8;
        }

        :global(:root[data-theme="dark"])
          .selected-affiliate-identity
          h3,
        :global(:root[data-theme="dark"]) .recipient-heading h3,
        :global(:root[data-theme="dark"]) .recipient-card-copy strong {
          color: #f2f7f8;
        }

        :global(:root[data-theme="dark"]) .selected-affiliate-data span {
          border-color: #49636c;
          background: #10272f;
          color: #dce9ec;
        }

        :global(:root[data-theme="dark"]) .selected-affiliate-number {
          background: #3d3523;
        }

        :global(:root[data-theme="dark"]) .recipient-heading p,
        :global(:root[data-theme="dark"]) .recipient-card-copy > span {
          color: #c4d5d9;
        }

        :global(:root[data-theme="dark"]) .recipient-total {
          background: #244752;
          color: #eef6f7;
        }

        :global(:root[data-theme="dark"]) .recipient-card.is-selected {
          border-color: #d6a33e;
          background: #3d3523;
        }

        :global(:root[data-theme="dark"]) .recipient-help {
          background: #3d3523;
          color: #f4d995;
        }
      `}</style>
    </div>
  );
}
