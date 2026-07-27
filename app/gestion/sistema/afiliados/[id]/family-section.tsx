import { agregarFamiliar } from "./family-actions";

type Familiar = {
  id: string;
  apellido_nombres: string;
  vinculo: string;
  documento_tipo: string | null;
  documento_numero: string | null;
  fecha_nacimiento: string | null;
  cuil: string | null;
  telefono: string | null;
  correo_electronico: string | null;
  posee_discapacidad: boolean;
  observaciones: string | null;
  activo: boolean;
};

function mostrar(valor: string | null) {
  return String(valor || "").trim() || "Sin informar";
}

function mostrarFecha(valor: string | null) {
  if (!valor) return "Sin informar";

  const partes = valor.slice(0, 10).split("-");

  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : valor;
}

export function AffiliateFamilySection({
  afiliadoId,
  familiares,
  puedeCrear,
  guardado,
  error,
}: {
  afiliadoId: string;
  familiares: Familiar[];
  puedeCrear: boolean;
  guardado: boolean;
  error: string;
}) {
  const familiaresActivos = familiares.filter(
    (familiar) => familiar.activo,
  );

  return (
    <section className="affiliate-family">
      <header className="affiliate-family-header">
        <div>
          <p className="kicker">INFORMACIÓN VINCULADA</p>
          <h2>Grupo familiar</h2>
          <p>
            Familiares registrados institucionalmente para
            este afiliado.
          </p>
        </div>

        <span className="affiliate-family-total">
          {familiaresActivos.length}{" "}
          {familiaresActivos.length === 1
            ? "FAMILIAR"
            : "FAMILIARES"}
        </span>
      </header>

      {guardado && (
        <div className="form-message success" role="status">
          El familiar fue registrado correctamente.
        </div>
      )}

      {error && (
        <div className="form-message error" role="alert">
          {error === "datos"
            ? "Revisá el nombre y el vínculo del familiar."
            : "No se pudo guardar el familiar. Verificá los datos e intentá nuevamente."}
        </div>
      )}

      {familiaresActivos.length === 0 ? (
        <div className="affiliate-family-empty">
          Todavía no hay familiares registrados para esta
          persona.
        </div>
      ) : (
        <div className="affiliate-family-list">
          {familiaresActivos.map((familiar) => (
            <article
              className="affiliate-family-card"
              key={familiar.id}
            >
              <header>
                <div>
                  <span>{familiar.vinculo}</span>
                  <h3>{familiar.apellido_nombres}</h3>
                </div>

                {familiar.posee_discapacidad && (
                  <strong>DISCAPACIDAD INFORMADA</strong>
                )}
              </header>

              <dl>
                <div>
                  <dt>Documento</dt>
                  <dd>
                    {mostrar(familiar.documento_tipo)}{" "}
                    {mostrar(familiar.documento_numero)}
                  </dd>
                </div>

                <div>
                  <dt>CUIL</dt>
                  <dd>{mostrar(familiar.cuil)}</dd>
                </div>

                <div>
                  <dt>Fecha de nacimiento</dt>
                  <dd>
                    {mostrarFecha(
                      familiar.fecha_nacimiento,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Teléfono</dt>
                  <dd>{mostrar(familiar.telefono)}</dd>
                </div>

                <div>
                  <dt>Correo electrónico</dt>
                  <dd>
                    {mostrar(
                      familiar.correo_electronico,
                    )}
                  </dd>
                </div>
              </dl>

              {familiar.observaciones && (
                <p className="affiliate-family-observation">
                  <strong>Observaciones:</strong>{" "}
                  {familiar.observaciones}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {puedeCrear && (
        <details className="affiliate-family-create">
          <summary>＋ Agregar familiar</summary>

          <form action={agregarFamiliar}>
            <input
              type="hidden"
              name="afiliado_id"
              value={afiliadoId}
            />

            <div className="affiliate-family-form-grid">
              <label className="wide">
                <span>Apellido y nombres *</span>
                <input
                  name="apellido_nombres"
                  required
                  minLength={3}
                  placeholder="APELLIDO Y NOMBRES"
                />
              </label>

              <label>
                <span>Vínculo *</span>
                <select name="vinculo" required defaultValue="">
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  <option>CÓNYUGE</option>
                  <option>CONVIVIENTE</option>
                  <option>HIJO/A</option>
                  <option>PADRE</option>
                  <option>MADRE</option>
                  <option>HERMANO/A</option>
                  <option>OTRO</option>
                </select>
              </label>

              <label>
                <span>Tipo de documento</span>
                <select
                  name="documento_tipo"
                  defaultValue="DNI"
                >
                  <option>DNI</option>
                  <option>CI</option>
                  <option>LE</option>
                  <option>LC</option>
                  <option>PASAPORTE</option>
                </select>
              </label>

              <label>
                <span>Número de documento</span>
                <input
                  name="documento_numero"
                  inputMode="numeric"
                />
              </label>

              <label>
                <span>CUIL</span>
                <input
                  name="cuil"
                  inputMode="numeric"
                  placeholder="00-00000000-0"
                />
              </label>

              <label>
                <span>Fecha de nacimiento</span>
                <input
                  name="fecha_nacimiento"
                  type="date"
                />
              </label>

              <label>
                <span>Teléfono</span>
                <input
                  name="telefono"
                  type="tel"
                  inputMode="tel"
                />
              </label>

              <label>
                <span>Correo electrónico</span>
                <input
                  name="correo_electronico"
                  type="email"
                />
              </label>

              <label>
                <span>Discapacidad informada</span>
                <select
                  name="posee_discapacidad"
                  defaultValue="false"
                >
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </label>

              <label className="wide">
                <span>Observaciones</span>
                <textarea
                  name="observaciones"
                  rows={3}
                  placeholder="Información institucional relevante"
                />
              </label>
            </div>

            <button
              className="save-user"
              type="submit"
            >
              Guardar familiar
            </button>
          </form>
        </details>
      )}
    </section>
  );
}
