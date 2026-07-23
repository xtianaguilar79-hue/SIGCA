"use client";

import { FormEvent, useRef } from "react";
import Link from "next/link";

type Estado = {
  nombre: string;
};

type Empresa = {
  id: number;
  nombre: string;
};

export function AffiliateFilters({
  buscar,
  estadoSeleccionado,
  empresaSeleccionada,
  estados,
  empresas,
}: {
  buscar: string;
  estadoSeleccionado: string;
  empresaSeleccionada: string;
  estados: Estado[];
  empresas: Empresa[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function aplicarFiltros() {
    formRef.current?.requestSubmit();
  }

  function cambiarEmpresa(
    event: FormEvent<HTMLInputElement>,
  ) {
    const valor = event.currentTarget.value.trim();

    const existe = empresas.some(
      (empresa) => empresa.nombre === valor,
    );

    if (!valor || existe) {
      aplicarFiltros();
    }
  }

  const hayFiltros =
    buscar ||
    estadoSeleccionado ||
    empresaSeleccionada;

  return (
    <form
      ref={formRef}
      className="affiliate-search"
      method="get"
    >
      <label htmlFor="buscar">
        Buscar en el padrón
      </label>

      <div className="affiliate-search-row">
        <input
          id="buscar"
          name="buscar"
          type="search"
          defaultValue={buscar}
          placeholder="Nombre, DNI, CUIL o número AOMA"
        />

        <button type="submit">
          🔍 Buscar
        </button>
      </div>

      <div className="affiliate-filter-row">
        <label>
          <span>Estado</span>

          <select
            name="estado"
            defaultValue={estadoSeleccionado}
            onChange={aplicarFiltros}
          >
            <option value="">
              Todos los estados
            </option>

            {estados.map((estado) => (
              <option
                key={estado.nombre}
                value={estado.nombre}
              >
                {estado.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Empresa</span>

          <input
            name="empresa"
            type="search"
            list="empresas-activas"
            defaultValue={empresaSeleccionada}
            placeholder="Escribí para buscar una empresa"
            autoComplete="off"
            onInput={cambiarEmpresa}
          />

          <datalist id="empresas-activas">
            {empresas.map((empresa) => (
              <option
                key={empresa.id}
                value={empresa.nombre}
              />
            ))}
          </datalist>
        </label>
      </div>

      {hayFiltros && (
        <Link
          className="affiliate-clear"
          href="/gestion/sistema/afiliados"
        >
          Limpiar búsqueda y filtros
        </Link>
      )}
    </form>
  );
}
