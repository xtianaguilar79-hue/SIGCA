"use client";

import { useMemo, useRef, useState } from "react";

type Empresa = {
  id: string | number;
  nombre: string;
  activa?: boolean | null;
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

export function CompanyCombobox({
  empresas,
  defaultValue = "",
  name = "empresa",
  label = "Empresa",
  placeholder = "Escribí para buscar una empresa",
  autoSubmit = false,
  onCompanySelect,
}: {
  empresas: Empresa[];
  defaultValue?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  autoSubmit?: boolean;
  onCompanySelect?: (empresa: Empresa | null) => void;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState(defaultValue);
  const [valor, setValor] = useState(defaultValue);
  const [abierto, setAbierto] = useState(false);

  const coincidencias = useMemo(() => {
    const busqueda = normalizar(texto);
    const busquedaCompacta = busqueda.replaceAll(" ", "");

    const resultado = busqueda
      ? empresas.filter((empresa) => {
          const nombre = normalizar(empresa.nombre);
          const nombreCompacto = nombre.replaceAll(" ", "");

          return (
            nombre.includes(busqueda) ||
            nombreCompacto.includes(busquedaCompacta)
          );
        })
      : empresas;

    return resultado.slice(0, 60);
  }, [empresas, texto]);

  function seleccionar(empresa: Empresa) {
    setTexto(empresa.nombre);
    setValor(empresa.nombre);
    setAbierto(false);
    onCompanySelect?.(empresa);

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
      onCompanySelect?.(null);

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
              aria-selected={String(empresa.id) === valor}
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
