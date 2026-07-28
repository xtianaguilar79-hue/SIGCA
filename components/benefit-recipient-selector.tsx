"use client";

import { useState } from "react";

export type BenefitAffiliate = {
  id: string;
  numero_aoma: string | number | null;
  apellido_nombres: string | null;
  documento_numero: string | null;
  cuil: string | null;
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

function mostrarNumeroAoma(valor: string | number | null) {
  const numero = String(valor ?? "").trim();
  return numero && numero !== "0" ? numero : "0";
}

function mostrarFecha(valor: string | null) {
  if (!valor) return "Sin informar";

  const partes = valor.slice(0, 10).split("-");
  if (partes.length !== 3) return valor;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function iniciales(nombre: string | null) {
  const partes = String(nombre || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return "A";

  return partes
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toUpperCase();
}

export function BenefitRecipientSelector({
  afiliado,
  familiares,
}: {
  afiliado: BenefitAffiliate;
  familiares: BenefitRelative[];
}) {
  const [destinatario, setDestinatario] = useState("");
  const titularValue = `${afiliado.id}|`;

  function alternarDestinatario(valor: string) {
    setDestinatario((actual) => (actual === valor ? "" : valor));
  }

  return (
    <article className="benefit-recipient-selector-shell">
      <header className="delivery-selected-affiliate">
        <div className="delivery-selected-avatar" aria-hidden="true">
          {iniciales(afiliado.apellido_nombres)}
        </div>

        <div className="delivery-selected-information">
          <span className="delivery-selected-label">
            AFILIADO SELECCIONADO
          </span>

          <strong>
            {afiliado.apellido_nombres || "Afiliado sin nombre"}
          </strong>

          <div className="delivery-selected-metadata">
            <span>
              DNI {afiliado.documento_numero || "sin informar"}
            </span>
            <span>
              AOMA {mostrarNumeroAoma(afiliado.numero_aoma)}
            </span>
            <span>{afiliado.empresa_original || "Sin empresa"}</span>
          </div>

          <span className="delivery-selected-status">
            {afiliado.estado || "Sin estado"}
          </span>
        </div>
      </header>

      <div className="delivery-recipient-introduction">
        <div>
          <span className="delivery-recipient-kicker">DESTINATARIO</span>
          <h3>¿Quién recibirá el beneficio?</h3>
          <p>
            Seleccioná al titular o a una persona de su grupo familiar.
          </p>
        </div>

        <span className="delivery-recipient-count">
          {familiares.length}{" "}
          {familiares.length === 1 ? "familiar" : "familiares"}
        </span>
      </div>

      <div
        className="delivery-recipient-options"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setDestinatario("");
          }
        }}
      >
        <label
          className={`delivery-recipient-card delivery-recipient-owner ${
            destinatario === titularValue ? "selected" : ""
          }`}
          onClick={(event) => {
            event.preventDefault();
            alternarDestinatario(titularValue);
          }}
        >
          <input
            type="radio"
            name="destinatario"
            value={titularValue}
            checked={destinatario === titularValue}
            readOnly
            required
          />

          <span className="delivery-recipient-avatar" aria-hidden="true">
            {iniciales(afiliado.apellido_nombres)}
          </span>

          <span className="delivery-recipient-copy">
            <span className="delivery-recipient-type">TITULAR AFILIADO</span>
            <strong>
              {afiliado.apellido_nombres || "Sin informar"}
            </strong>
            <small>
              DNI {afiliado.documento_numero || "sin informar"} · AOMA{" "}
              {mostrarNumeroAoma(afiliado.numero_aoma)}
            </small>
          </span>

          <span className="delivery-recipient-check" aria-hidden="true">
            ✓
          </span>
        </label>

        {familiares.map((familiar) => {
          const familiarValue = `${afiliado.id}|${familiar.id}`;
          const seleccionado = destinatario === familiarValue;

          return (
            <label
              className={`delivery-recipient-card ${
                seleccionado ? "selected" : ""
              }`}
              key={familiar.id}
              onClick={(event) => {
                event.preventDefault();
                alternarDestinatario(familiarValue);
              }}
            >
              <input
                type="radio"
                name="destinatario"
                value={familiarValue}
                checked={seleccionado}
                readOnly
                required
              />

              <span className="delivery-recipient-avatar" aria-hidden="true">
                {iniciales(familiar.apellido_nombres)}
              </span>

              <span className="delivery-recipient-copy">
                <span className="delivery-recipient-type">
                  {familiar.vinculo}
                </span>
                <strong>{familiar.apellido_nombres}</strong>
                <span className="delivery-recipient-details">
                  <small>
                    DNI {familiar.documento_numero || "sin informar"}
                  </small>
                  <small>
                    Nacimiento {mostrarFecha(familiar.fecha_nacimiento)}
                  </small>
                </span>
              </span>

              <span className="delivery-recipient-check" aria-hidden="true">
                ✓
              </span>
            </label>
          );
        })}

        {familiares.length === 0 && (
          <p className="delivery-family-empty">
            Este afiliado no tiene familiares registrados.
          </p>
        )}
      </div>

      {destinatario ? (
        <div className="delivery-recipient-confirmation">
          <span>✓ Destinatario seleccionado</span>

          <button type="button" onClick={() => setDestinatario("")}>
            Quitar selección
          </button>
        </div>
      ) : (
        <p className="delivery-recipient-required">
          Seleccioná al titular o a uno de sus familiares para continuar.
        </p>
      )}
    </article>
  );
}
