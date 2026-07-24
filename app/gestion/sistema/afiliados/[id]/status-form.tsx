import { cambiarEstadoAfiliado } from "./actions";

export function AffiliateStatusForm({
  afiliadoId,
  estadoActual,
  estados,
  resultado,
}: {
  afiliadoId: string;
  estadoActual: string | null;
  estados: { nombre: string }[];
  resultado: {
    estado_actualizado?: string;
    estado_error?: string;
  };
}) {
  return (
    <section className="affiliate-status-panel">
      <h2>Cambiar estado</h2>

      <p>
        El cambio quedará registrado en el historial
        institucional con el usuario responsable.
      </p>

      {resultado.estado_actualizado === "1" && (
        <div className="form-message success">
          El estado fue actualizado correctamente.
        </div>
      )}

      {resultado.estado_error && (
        <div className="form-message error">
          No se pudo cambiar el estado. Seleccioná un estado
          diferente y escribí una observación de al menos cinco
          caracteres.
        </div>
      )}

      <form action={cambiarEstadoAfiliado}>
        <input
          type="hidden"
          name="id"
          value={afiliadoId}
        />

        <label>
          <span>Nuevo estado</span>

          <select
            name="estado"
            defaultValue={estadoActual || ""}
            required
          >
            <option value="" disabled>
              Seleccionar estado
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
          <span>Motivo u observación</span>

          <textarea
            name="observacion"
            rows={3}
            minLength={5}
            placeholder="Explicá brevemente el motivo del cambio"
            required
          />
        </label>

        <button type="submit">
          Guardar cambio de estado
        </button>
      </form>
    </section>
  );
}
