"use client";

import { useMemo, useRef, useState } from "react";

type Empresa = {
  id: number;
  nombre: string;
  activa?: boolean | null;
};

export function CompanyCombobox({
  empresas,
  defaultValue = "",
  name = "empresa",
  label = "Empresa",
  placeholder = "Escribí para buscar una empresa",
  autoSubmit = false,
}: {
  empresas: Empresa[];
  defaultValue?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  autoSubmit?: boolean;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState(defaultValue);
  const [valor, setValor] = useState(defaultValue);
  const [abierto, setAbierto] = useState(false);

  const coincidencias = useMemo(() => {
    const busqueda = texto
      .trim()
      .toLocaleLowerCase("es-AR");

    const resultado = busqueda
      ? empresas.filter((empresa) =>
          empresa.nombre
            .toLocaleLowerCase("es-AR")
            .includes(busqueda),
        )
      : empresas;

    return resultado.slice(0, 60);
  }, [empresas, texto]);

  function seleccionar(empresa: Empresa) {
    setTexto(empresa.nombre);
    setValor(empresa.nombre);
    setAbierto(false);

    if (autoSubmit) {
      window.setTimeout(() => {
        contenedorRef.current
          ?.closest("form")
          ?.requestSubmit();
      }, 0);
    }
  }

  function cambiarTexto(nuevoTexto: string) {
    setTexto(nuevoTexto);
    setAbierto(true);

    if (!nuevoTexto.trim()) {
      setValor("");

      if (autoSubmit) {
        window.setTimeout(() => {
          contenedorRef.current
            ?.closest("form")
            ?.requestSubmit();
        }, 0);
      }
    } else {
      setValor("");
    }
  }

  return (
    <div
      className="company-combobox"
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
      <label htmlFor={`${name}-company-search`}>
        {label}
      </label>

      <input type="hidden" name={name} value={valor} />

      <input
        id={`${name}-company-search`}
        type="search"
        value={texto}
        placeholder={placeholder}
        autoComplete="off"
        aria-expanded={abierto}
        aria-controls={`${name}-company-options`}
        onFocus={() => setAbierto(true)}
        onChange={(event) =>
          cambiarTexto(event.target.value)
        }
      />

      {abierto && (
        <div
          className="company-combobox-options"
          id={`${name}-company-options`}
          role="listbox"
        >
          {coincidencias.map((empresa) => (
            <button
              type="button"
              role="option"
              key={empresa.id}
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() => seleccionar(empresa)}
            >
              <strong>{empresa.nombre}</strong>

              {typeof empresa.activa === "boolean" && (
                <span>
                  {empresa.activa
                    ? "ACTIVA"
                    : "INACTIVA"}
                </span>
              )}
            </button>
          ))}

          {coincidencias.length === 0 && (
            <p>No se encontraron empresas.</p>
          )}
        </div>
      )}
    </div>
  );
}
