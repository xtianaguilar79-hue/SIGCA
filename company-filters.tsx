"use client";

import { useRef } from "react";
import Link from "next/link";

export function CompanyFilters({
  buscar,
  estado,
}: {
  buscar: string;
  estado: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="company-search"
      method="get"
    >
      <label>
        <span>Buscar empresa</span>

        <div>
          <input
            name="buscar"
            type="search"
            defaultValue={buscar}
            placeholder="Nombre, razón social o CUIT"
          />

          <button type="submit">
            🔍 Buscar
          </button>
        </div>
      </label>

      <label>
        <span>Estado</span>

        <select
          name="estado"
          defaultValue={estado}
          onChange={() => formRef.current?.requestSubmit()}
        >
          <option value="activas">
            Empresas activas
          </option>
          <option value="inactivas">
            Empresas inactivas
          </option>
          <option value="todas">
            Todas las empresas
          </option>
        </select>
      </label>

      {(buscar || estado !== "activas") && (
        <Link href="/gestion/sistema/empresas">
          Limpiar
        </Link>
      )}
    </form>
  );
}
