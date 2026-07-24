"use client";

import { useMemo, useRef, useState } from "react";

type Estado = {
  nombre: string;
};

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function StatusCombobox({
  estados,
  defaultValue = "",
  autoSubmit = false,
}: {
  estados: Estado[];
  defaultValue?: string;
  autoSubmit?: boolean;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState(defaultValue);
  const [valor, setValor] = useState(defaultValue);
  const [abierto, setAbierto] = useState(false);

  const coincidencias = useMemo(() => {
    const busqueda = normalizar(texto);

    return estados.filter((estado) =>
      normalizar(estado.nombre).includes(busqueda),
    );
  }, [estados, texto]);

  function enviarFormulario() {
    if (!autoSubmit) return;

    window.setTimeout(() => {
      contenedorRef.current
        ?.closest("form")
        ?.requestSubmit();
    }, 0);
  }

  function seleccionar(estado: Estado | null) {
    const nombre = estado?.nombre || "";
    setTexto(nombre);
    setValor(nombre);
    setAbierto(false);
    enviarFormulario();
  }

  return (
    <div
      className="company-combobox status-combobox"
      ref={contenedorRef}
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget as Node | null,
          )
        ) {
          setAbierto(false);
          if (!valor) setTexto("");
        }
      }}
    >
      <label htmlFor="estado-affiliate-search">
        Estado afiliatorio
      </label>

      <input type="hidden" name="estado" value={valor} />

      <input
        id="estado-affiliate-search"
        type="search"
        value={texto}
        placeholder="Todos los estados"
        autoComplete="off"
        aria-expanded={abierto}
        aria-controls="estado-affiliate-options"
        onFocus={() => setAbierto(true)}
        onChange={(event) => {
          const nuevoTexto = event.target.value;
          setTexto(nuevoTexto);
          setAbierto(true);

          if (!nuevoTexto.trim()) {
            setValor("");
            enviarFormulario();
          } else {
            setValor("");
          }
        }}
      />

      {abierto && (
        <div
          className="company-combobox-options"
          id="estado-affiliate-options"
          role="listbox"
        >
          <button
            type="button"
            role="option"
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() => seleccionar(null)}
          >
            <strong>Todos los estados</strong>
          </button>

          {coincidencias.map((estado) => (
            <button
              type="button"
              role="option"
              key={estado.nombre}
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() => seleccionar(estado)}
            >
              <strong>{estado.nombre}</strong>
            </button>
          ))}

          {coincidencias.length === 0 && (
            <p>No se encontraron estados.</p>
          )}
        </div>
      )}
    </div>
  );
}
