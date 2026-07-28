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

function mostrarNumeroAoma(
  valor: string | number | null,
) {
  const numero = String(valor ?? "").trim();

  return numero && numero !== "0" ? numero : "0";
}

function mostrarFecha(valor: string | null) {
  if (!valor) return "Sin informar";

  const partes = valor.slice(0, 10).split("-");

  if (partes.length !== 3) return valor;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function BenefitRecipientSelector({
  afiliado,
  familiares,
}: {
  afiliado: BenefitAffiliate;
  familiares: BenefitRelative[];
}) {
  const [destinatario, setDestinatario] =
    useState("");

  function alternarDestinatario(valor: string) {
    setDestinatario((actual) =>
      actual === valor ? "" : valor,
    );
  }

  const titularValue = `${afiliado.id}|`;

  return (
    <article className="delivery-affiliate-card selected">
      <header className="delivery-selected-affiliate">
        <div>
          <span className="delivery-selected-label">
            AFILIADO SELECCIONADO
          </span>

          <strong>
            {afiliado.apellido_nombres ||
              "Afiliado sin nombre"}
          </strong>

          <span>
            DNI{" "}
            {afiliado.documento_numero ||
              "sin informar"}
            {" · "}
            AOMA{" "}
            {mostrarNumeroAoma(
              afiliado.numero_aoma,
            )}
          </span>

          <span>
            {afiliado.empresa_original ||
              "Sin empresa"}
            {" · "}
            {afiliado.estado || "Sin estado"}
          </span>
        </div>
      </header>

      <div
        className="delivery-recipient-options"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setDestinatario("");
          }
        }}
      >
        <label
          className={
            destinatario === titularValue
              ? "selected"
              : ""
          }
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

          <span>
            <strong>Titular afiliado</strong>

            <small>
              {afiliado.apellido_nombres ||
                "Sin informar"}
            </small>
          </span>
        </label>

        {familiares.map((familiar) => {
          const familiarValue =
            `${afiliado.id}|${familiar.id}`;

          return (
            <label
              className={
                destinatario === familiarValue
                  ? "selected"
                  : ""
              }
              key={familiar.id}
              onClick={(event) => {
                event.preventDefault();

                alternarDestinatario(
                  familiarValue,
                );
              }}
            >
              <input
                type="radio"
                name="destinatario"
                value={familiarValue}
                checked={
                  destinatario === familiarValue
                }
                readOnly
                required
              />

              <span>
                <strong>{familiar.vinculo}</strong>

                <small>
                  {familiar.apellido_nombres}
                  {" · DNI "}
                  {familiar.documento_numero ||
                    "sin informar"}
                  {" · Nacimiento "}
                  {mostrarFecha(
                    familiar.fecha_nacimiento,
                  )}
                </small>
              </span>
            </label>
          );
        })}

        {familiares.length === 0 && (
          <p className="delivery-family-empty">
            Este afiliado no tiene familiares
            registrados.
          </p>
        )}
      </div>

      {destinatario ? (
        <div className="delivery-recipient-confirmation">
          <span>✓ Destinatario seleccionado</span>

          <button
            type="button"
            onClick={() => setDestinatario("")}
          >
            Quitar selección
          </button>
        </div>
      ) : (
        <p className="delivery-recipient-required">
          Seleccioná al titular o a uno de sus
          familiares para continuar.
        </p>
      )}
    </article>
  );
}
