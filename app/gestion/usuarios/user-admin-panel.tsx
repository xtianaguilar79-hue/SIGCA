"use client";

import { useMemo, useState } from "react";
import {
  approveUser,
  deleteUserPermanently,
  rejectUser,
  updateInstitutionalUser,
} from "./actions";

type UserRow = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  dni: string | null;
  telefono: string | null;
  mail: string | null;
  rol: string | null;
  empresa: string | null;
  convenio: string | null;
  estado: string | null;
  activo: boolean | null;
};

type CatalogItem = { id: string; nombre: string };

export function UserAdminPanel({
  users,
  companies,
  agreements,
  currentUserId,
}: {
  users: UserRow[];
  companies: CatalogItem[];
  agreements: CatalogItem[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");

  const visibleUsers = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("es");

    return users.filter((user) => {
      const text = [
        user.nombre,
        user.apellido,
        user.dni,
        user.mail,
        user.empresa,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es");

      return (
        (filter === "Todos" || user.estado === filter) &&
        (!search || text.includes(search))
      );
    });
  }, [filter, query, users]);

  const pending = users.filter((user) => user.estado === "Pendiente").length;

  return (
    <>
      <div className="admin-summary">
        <article>
          <strong>{users.length}</strong>
          <span>Usuarios registrados</span>
        </article>
        <article>
          <strong>{pending}</strong>
          <span>Solicitudes pendientes</span>
        </article>
        <article>
          <strong>{users.filter((user) => user.activo).length}</strong>
          <span>Cuentas activas</span>
        </article>
      </div>

      <div className="admin-toolbar">
        <label>
          <span>Buscar personas</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, DNI, empresa o correo"
          />
        </label>

        <div className="status-filters" aria-label="Filtrar por estado">
          {["Todos", "Pendiente", "Aprobado", "Rechazado"].map((state) => (
            <button
              type="button"
              className={filter === state ? "active" : ""}
              onClick={() => setFilter(state)}
              key={state}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      <div className="user-list">
        {visibleUsers.map((user) => {
          const fullName = [user.nombre, user.apellido]
            .filter(Boolean)
            .join(" ")
            .trim();
          const roleValue =
            user.rol === "Personal autorizado"
              ? "Persona autorizada"
              : user.rol || "Persona autorizada";

          return (
            <article className="user-card" key={user.id}>
              <header className="user-card-header">
                <div className="user-identity">
                  <h2>{fullName || "Nombre pendiente de completar"}</h2>
                  <p className="user-email">{user.mail || "Sin correo informado"}</p>
                  <p className="user-document">
                    DNI: {user.dni || "sin informar"}
                  </p>
                </div>
                <span
                  className={`user-state ${String(user.estado).toLowerCase()}`}
                >
                  {user.estado || "Pendiente"}
                </span>
              </header>

              <form action={updateInstitutionalUser} className="user-edit-form">
                <input type="hidden" name="id" value={user.id} />

                <label>
                  <span>Función</span>
                  <select
                    name="rol"
                    defaultValue={roleValue}
                  >
                    <option>Administrador</option>
                    <option>Dirigente</option>
                    <option>Delegado</option>
                    <option>Persona autorizada</option>
                  </select>
                </label>

                <label>
                  <span>Empresa</span>
                  <select name="empresa" defaultValue={user.empresa || ""}>
                    <option value="">Sin asignar</option>
                    {companies.map((item) => (
                      <option key={item.id} value={item.nombre}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Convenio</span>
                  <select name="convenio" defaultValue={user.convenio || ""}>
                    <option value="">Sin asignar</option>
                    {agreements.map((item) => (
                      <option key={item.id} value={item.nombre}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Estado</span>
                  <select name="estado" defaultValue={user.estado || "Pendiente"}>
                    <option>Pendiente</option>
                    <option>Aprobado</option>
                    <option>Rechazado</option>
                  </select>
                </label>

                <label>
                  <span>Acceso</span>
                  <select
                    name="activo"
                    defaultValue={String(user.activo !== false)}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Suspendido</option>
                  </select>
                </label>

                <button className="save-user" type="submit">
                  Guardar cambios
                </button>
              </form>

              <div className="quick-actions">
                {user.estado === "Pendiente" && (
                  <>
                    <form action={approveUser}>
                      <input type="hidden" name="id" value={user.id} />
                      <button className="approve-user">Aprobar solicitud</button>
                    </form>
                    <form action={rejectUser}>
                      <input type="hidden" name="id" value={user.id} />
                      <button className="reject-user">Rechazar</button>
                    </form>
                  </>
                )}

                {user.id !== currentUserId && (
                  <form
                    action={deleteUserPermanently}
                    onSubmit={(event) => {
                      if (
                        !window.confirm(
                          `¿Eliminar definitivamente la cuenta de ${
                            fullName || user.mail || "este usuario"
                          }? Esta acción no se puede deshacer.`,
                        )
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={user.id} />
                    <button className="delete-user">
                      Eliminar definitivamente
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}

        {visibleUsers.length === 0 && (
          <div className="empty-users">
            No hay personas que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </>
  );
}
