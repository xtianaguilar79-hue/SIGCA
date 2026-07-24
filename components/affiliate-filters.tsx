"use client";

import { useRef } from "react";
import Link from "next/link";
import { CompanyCombobox } from "@/components/company-combobox";

type Estado = {
  nombre: string;
};

type Empresa = {
  id: number;
  nombre: string;
  activa?: boolean | null;
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

        <CompanyCombobox
          empresas={empresas}
          defaultValue={empresaSeleccionada}
          autoSubmit
        />
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
