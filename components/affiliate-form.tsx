"use client";

import { FormEvent, useState } from "react";

export type EmpresaAfiliacion = {
  id: string | number;
  nombre: string;
  rama: string | null;
  domicilio: string | null;
  localidad: string | null;
  provincia: string | null;
  codigo_postal: string | null;
  cuit: string | null;
  correo_electronico: string | null;
  telefono: string | null;
};

type EmployerData = {
  razonSocial: string;
  rama: string;
  domicilio: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  cuit: string;
  correo: string;
  telefono: string;
};

type PersonData = {
  apellidoNombres: string;
  domicilio: string;
  provincia: string;
  localidad: string;
  codigoPostal: string;
  fechaNacimiento: string;
  tipoDocumento: string;
  numeroDocumento: string;
  cuil: string;
  nacionalidad: string;
  estadoCivil: string;
  telefono: string;
  correo: string;
  areaTrabajo: string;
  oficio: string;
  fechaIngreso: string;
  afiliadoAoma: string;
  numeroAfiliado: string;
  afiliadoOtroGremio: string;
  otroGremio: string;
  observaciones: string;
};

const emptyEmployer: EmployerData = {
  razonSocial: "",
  rama: "",
  domicilio: "",
  localidad: "",
  provincia: "",
  codigoPostal: "",
  cuit: "",
  correo: "",
  telefono: "",
};

const emptyPerson: PersonData = {
  apellidoNombres: "",
  domicilio: "",
  provincia: "",
  localidad: "",
  codigoPostal: "",
  fechaNacimiento: "",
  tipoDocumento: "",
  numeroDocumento: "",
  cuil: "",
  nacionalidad: "",
  estadoCivil: "",
  telefono: "",
  correo: "",
  areaTrabajo: "",
  oficio: "",
  fechaIngreso: "",
  afiliadoAoma: "",
  numeroAfiliado: "",
  afiliadoOtroGremio: "",
  otroGremio: "",
  observaciones: "",
};

function formatDate(value: string) {
  if (!value) return "";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

export function AffiliateForm({
  companies,
}: {
  companies: EmpresaAfiliacion[];
}) {
  const [companyId, setCompanyId] = useState("");
  const [blankPerson, setBlankPerson] =
    useState(false);

  const [employer, setEmployer] =
    useState<EmployerData>(emptyEmployer);

  const [person, setPerson] =
    useState<PersonData>(emptyPerson);

  function selectCompany(value: string) {
    setCompanyId(value);

    const selected = companies.find(
      (company) => String(company.id) === value
    );

    if (!selected) {
      setEmployer(emptyEmployer);
      return;
    }

    setEmployer({
      razonSocial: selected.nombre || "",
      rama: selected.rama || "",
      domicilio: selected.domicilio || "",
      localidad: selected.localidad || "",
      provincia: selected.provincia || "",
      codigoPostal: selected.codigo_postal || "",
      cuit: selected.cuit || "",
      correo: selected.correo_electronico || "",
      telefono: selected.telefono || "",
    });
  }

  function updateEmployer(
    field: keyof EmployerData,
    value: string
  ) {
    setEmployer((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updatePerson(
    field: keyof PersonData,
    value: string
  ) {
    setPerson((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function changePersonMode(blank: boolean) {
    setBlankPerson(blank);

    if (blank) {
      setPerson(emptyPerson);
    }
  }

  function printForm(event: FormEvent) {
    event.preventDefault();
    window.print();
  }

  return (
    <>
      <form
        className="form-shell wide affiliation-editor"
        onSubmit={printForm}
      >
        <section className="affiliation-options">
          <div className="field">
            <label htmlFor="modo-persona">
              Modalidad
            </label>

            <select
              id="modo-persona"
              value={
                blankPerson ? "blanco" : "completar"
              }
              onChange={(event) =>
                changePersonMode(
                  event.target.value === "blanco"
                )
              }
            >
              <option value="completar">
                Completar datos antes de imprimir
              </option>

              <option value="blanco">
                Datos personales en blanco
              </option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="empresa">
              Empresa
            </label>

            <select
              id="empresa"
              value={companyId}
              onChange={(event) =>
                selectCompany(event.target.value)
              }
            >
              <option value="">
                Ninguna / completar a mano
              </option>

              {companies.map((company) => (
                <option
                  key={company.id}
                  value={String(company.id)}
                >
                  {company.nombre}
                </option>
              ))}
            </select>
          </div>
        </section>

        <fieldset className="affiliation-fieldset">
          <legend>Datos de la empresa</legend>

          <div className="registration-grid">
            <div className="field full">
              <label>Razón social</label>
              <input
                value={employer.razonSocial}
                onChange={(event) =>
                  updateEmployer(
                    "razonSocial",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field full">
              <label>Rama</label>
              <input
                value={employer.rama}
                onChange={(event) =>
                  updateEmployer(
                    "rama",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field full">
              <label>Domicilio</label>
              <input
                value={employer.domicilio}
                onChange={(event) =>
                  updateEmployer(
                    "domicilio",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Localidad</label>
              <input
                value={employer.localidad}
                onChange={(event) =>
                  updateEmployer(
                    "localidad",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Provincia</label>
              <input
                value={employer.provincia}
                onChange={(event) =>
                  updateEmployer(
                    "provincia",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Código postal</label>
              <input
                value={employer.codigoPostal}
                onChange={(event) =>
                  updateEmployer(
                    "codigoPostal",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>CUIT</label>
              <input
                value={employer.cuit}
                onChange={(event) =>
                  updateEmployer(
                    "cuit",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={employer.correo}
                onChange={(event) =>
                  updateEmployer(
                    "correo",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Teléfono</label>
              <input
                value={employer.telefono}
                onChange={(event) =>
                  updateEmployer(
                    "telefono",
                    event.target.value
                  )
                }
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="affiliation-fieldset">
          <legend>
            Datos personales y de la actividad
          </legend>

          <div className="registration-grid">
            <div className="field full">
              <label>Apellido/s y nombre/s</label>
              <input
                value={person.apellidoNombres}
                onChange={(event) =>
                  updatePerson(
                    "apellidoNombres",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field full">
              <label>Domicilio: calle y número</label>
              <input
                value={person.domicilio}
                onChange={(event) =>
                  updatePerson(
                    "domicilio",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Provincia</label>
              <input
                value={person.provincia}
                onChange={(event) =>
                  updatePerson(
                    "provincia",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Localidad</label>
              <input
                value={person.localidad}
                onChange={(event) =>
                  updatePerson(
                    "localidad",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Código postal</label>
              <input
                value={person.codigoPostal}
                onChange={(event) =>
                  updatePerson(
                    "codigoPostal",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Fecha de nacimiento</label>
              <input
                type="date"
                value={person.fechaNacimiento}
                onChange={(event) =>
                  updatePerson(
                    "fechaNacimiento",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Tipo de documento</label>
              <input
                value={person.tipoDocumento}
                onChange={(event) =>
                  updatePerson(
                    "tipoDocumento",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Número de documento</label>
              <input
                value={person.numeroDocumento}
                onChange={(event) =>
                  updatePerson(
                    "numeroDocumento",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>CUIL</label>
              <input
                value={person.cuil}
                onChange={(event) =>
                  updatePerson(
                    "cuil",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Nacionalidad</label>
              <input
                value={person.nacionalidad}
                onChange={(event) =>
                  updatePerson(
                    "nacionalidad",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Estado civil</label>
              <input
                value={person.estadoCivil}
                onChange={(event) =>
                  updatePerson(
                    "estadoCivil",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Teléfono</label>
              <input
                value={person.telefono}
                onChange={(event) =>
                  updatePerson(
                    "telefono",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={person.correo}
                onChange={(event) =>
                  updatePerson(
                    "correo",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Área de trabajo</label>
              <input
                value={person.areaTrabajo}
                onChange={(event) =>
                  updatePerson(
                    "areaTrabajo",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Oficio</label>
              <input
                value={person.oficio}
                onChange={(event) =>
                  updatePerson(
                    "oficio",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Fecha de ingreso</label>
              <input
                type="date"
                value={person.fechaIngreso}
                onChange={(event) =>
                  updatePerson(
                    "fechaIngreso",
                    event.target.value
                  )
                }
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="affiliation-fieldset">
          <legend>Otros datos</legend>

          <div className="registration-grid">
            <div className="field">
              <label>
                ¿Fue afiliado a AOMA?
              </label>

              <select
                value={person.afiliadoAoma}
                onChange={(event) =>
                  updatePerson(
                    "afiliadoAoma",
                    event.target.value
                  )
                }
              >
                <option value="">Sin completar</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="field">
              <label>Número de afiliado</label>
              <input
                value={person.numeroAfiliado}
                onChange={(event) =>
                  updatePerson(
                    "numeroAfiliado",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                ¿Fue afiliado a otro gremio?
              </label>

              <select
                value={person.afiliadoOtroGremio}
                onChange={(event) =>
                  updatePerson(
                    "afiliadoOtroGremio",
                    event.target.value
                  )
                }
              >
                <option value="">Sin completar</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="field">
              <label>¿Cuál?</label>
              <input
                value={person.otroGremio}
                onChange={(event) =>
                  updatePerson(
                    "otroGremio",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field full">
              <label>Observaciones</label>
              <input
                value={person.observaciones}
                onChange={(event) =>
                  updatePerson(
                    "observaciones",
                    event.target.value
                  )
                }
              />
            </div>
          </div>
        </fieldset>

        <button className="submit" type="submit">
          Imprimir ficha oficial
        </button>
      </form>

      <article className="official-affiliation-print">
        <header className="official-title">
          ASOCIACIÓN OBRERA MINERA ARGENTINA
        </header>

        <div className="official-contact">
          <b>ROSARIO 436</b>
          <b>1424 - CAPITAL FEDERAL</b>
          <b>Tel. 4901-3277 / 4902-5983 Rot.</b>
        </div>

        <section className="official-opening">
          <div className="official-exclusive">
            <p>USO EXCLUSIVO DE A.O.M.A.</p>
            <p>Afiliado N.º __________________</p>
            <p>Seccional: ____________________</p>
          </div>

          <div className="official-request">
            <h1>SOLICITUD DE AFILIACIÓN</h1>
            <p>
              ______ de __________________ de 20____
            </p>
          </div>
        </section>

        <div className="official-recipient">
          <p>Compañero</p>
          <p>Secretario General</p>
          <p>Dn. Iván Malla</p>

          <strong>PRESENTE</strong>
        </div>

        <p className="official-letter">
          De mi mayor consideración: Tengo el agrado de
          dirigirme a Ud. solicitando mi filiación a esa
          Organización Gremial, para ello declaro conocer
          mis derechos y obligaciones que la ley y los
          Estatutos me confieren, detallando a
          continuación lo siguiente:
        </p>

        <section className="official-section">
          <h2>DATOS DE LA EMPRESA DONDE TRABAJO</h2>

          <p>
            Razón Social:{" "}
            <span>{employer.razonSocial}</span>
          </p>

          <p>
            Rama: <span>{employer.rama}</span>
          </p>

          <div className="official-row">
            <p>
              Domicilio:{" "}
              <span>{employer.domicilio}</span>
            </p>

            <p>
              Localidad:{" "}
              <span>{employer.localidad}</span>
            </p>
          </div>

          <div className="official-row">
            <p>
              Provincia:{" "}
              <span>{employer.provincia}</span>
            </p>

            <p>
              Código Postal:{" "}
              <span>{employer.codigoPostal}</span>
            </p>

            <p>
              C.U.I.T.: <span>{employer.cuit}</span>
            </p>
          </div>

          <div className="official-row">
            <p>
              Correo Electrónico:{" "}
              <span>{employer.correo}</span>
            </p>

            <p>
              Teléfono:{" "}
              <span>{employer.telefono}</span>
            </p>
          </div>
        </section>

        <section className="official-section">
          <h2>DATOS PERSONALES Y DE MI ACTIVIDAD</h2>

          <p>
            Apellido/s y Nombre/s:{" "}
            <span>{person.apellidoNombres}</span>
          </p>

          <p>
            Domicilio: Calle y N.º{" "}
            <span>{person.domicilio}</span>
          </p>

          <div className="official-row">
            <p>
              Provincia: <span>{person.provincia}</span>
            </p>

            <p>
              Localidad: <span>{person.localidad}</span>
            </p>

            <p>
              Código Postal:{" "}
              <span>{person.codigoPostal}</span>
            </p>
          </div>

          <div className="official-row">
            <p>
              Fecha de Nac.:{" "}
              <span>
                {formatDate(person.fechaNacimiento)}
              </span>
            </p>

            <p>
              Tipo de Documento:{" "}
              <span>{person.tipoDocumento}</span>
            </p>

            <p>
              N.º de Doc.:{" "}
              <span>{person.numeroDocumento}</span>
            </p>
          </div>

          <div className="official-row">
            <p>
              CUIL N.º: <span>{person.cuil}</span>
            </p>

            <p>
              Nacionalidad:{" "}
              <span>{person.nacionalidad}</span>
            </p>

            <p>
              Estado Civil:{" "}
              <span>{person.estadoCivil}</span>
            </p>
          </div>

          <div className="official-row">
            <p>
              Teléfono: <span>{person.telefono}</span>
            </p>

            <p>
              Correo Electrónico:{" "}
              <span>{person.correo}</span>
            </p>
          </div>

          <div className="official-row">
            <p>
              Área de trabajo:{" "}
              <span>{person.areaTrabajo}</span>
            </p>

            <p>
              Oficio: <span>{person.oficio}</span>
            </p>

            <p>
              Fecha de ingreso a la empresa:{" "}
              <span>
                {formatDate(person.fechaIngreso)}
              </span>
            </p>
          </div>
        </section>

        <section className="official-section">
          <h2>OTROS DATOS</h2>

          <p>
            ¿Fue afiliado a A.O.M.A.?{" "}
            SI {person.afiliadoAoma === "Sí" ? "☒" : "☐"}{" "}
            NO {person.afiliadoAoma === "No" ? "☒" : "☐"}{" "}
            N.º de Afiliado:{" "}
            <span>{person.numeroAfiliado}</span>
          </p>

          <p>
            ¿Fue afiliado a otro gremio?{" "}
            SI{" "}
            {person.afiliadoOtroGremio === "Sí"
              ? "☒"
              : "☐"}{" "}
            NO{" "}
            {person.afiliadoOtroGremio === "No"
              ? "☒"
              : "☐"}{" "}
            ¿Cuál? <span>{person.otroGremio}</span>
          </p>
        </section>

        <p className="official-closing">
          Sin otro particular, saludo a Ud. muy
          atentamente.
        </p>

        <div className="official-signatures">
          <p>Firma de Recepción de A.O.M.A. Central.</p>
          <p>Firma del Solicitante.</p>
        </div>

        <p className="official-observations">
          <b>OBSERVACIONES:</b>{" "}
          <span>{person.observaciones}</span>
        </p>
      </article>

      <style jsx global>{`
        .affiliation-editor {
          display: grid;
          gap: 20px;
        }

        .affiliation-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .affiliation-options select,
        .affiliation-fieldset select {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #cddade;
          border-radius: 8px;
          background: white;
          color: var(--tinta);
          font-size: 16px;
        }

        .affiliation-fieldset {
          margin: 0;
          padding: 20px;
          border: 1px solid var(--linea);
          border-radius: 11px;
        }

        .affiliation-fieldset legend {
          padding: 0 8px;
          color: var(--petroleo);
          font: 700 20px Georgia, serif;
        }

        .official-affiliation-print {
          display: none;
        }

        @media (max-width: 700px) {
          .affiliation-options {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            background: white !important;
            color: black !important;
          }

          .side,
          .theme-toggle,
          .mobile-menu-button,
          .mobile-menu-backdrop,
          .home-brand-link,
          .library-back,
          .main-head,
          .affiliation-editor {
            display: none !important;
          }

          .management,
          .main-area {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .official-affiliation-print {
            display: block !important;
            width: 100%;
            color: black;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10.5pt;
            line-height: 1.18;
          }

          .official-title {
            margin-bottom: 12px;
            text-align: center;
            font-size: 19pt;
            font-weight: 900;
          }

          .official-contact {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid black;
            font-size: 10pt;
          }

          .official-opening {
            display: grid;
            grid-template-columns: 37% 63%;
          }

          .official-exclusive {
            padding: 5px 8px;
            border: 1px solid black;
          }

          .official-exclusive p {
            margin: 3px 0;
          }

          .official-request {
            padding: 12px;
            text-align: center;
          }

          .official-request h1 {
            margin: 0 0 25px;
            font-size: 15pt;
          }

          .official-recipient p {
            margin: 2px 0;
          }

          .official-recipient strong {
            display: block;
            margin-top: 14px;
            text-decoration: underline;
          }

          .official-letter {
            margin: 18px 0 8px;
            text-align: justify;
          }

          .official-section {
            margin-top: 8px;
            padding-top: 5px;
            border-top: 4px double black;
          }

          .official-section h2 {
            margin: 0 0 6px;
            font-size: 11.5pt;
            text-decoration: underline;
          }

          .official-section p {
            display: flex;
            margin: 4px 0;
            white-space: nowrap;
          }

          .official-section p span,
          .official-observations span {
            min-height: 14px;
            flex: 1;
            margin-left: 4px;
            border-bottom: 1px solid black;
          }

          .official-row {
            display: flex;
            gap: 10px;
          }

          .official-row p {
            flex: 1;
          }

          .official-closing {
            margin: 26px 0 35px;
            text-align: center;
          }

          .official-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 150px;
            margin: 0 35px 24px;
          }

          .official-signatures p {
            padding-top: 6px;
            border-top: 1px solid black;
            text-align: center;
            font-size: 8pt;
          }

          .official-observations {
            display: flex;
            margin-top: 14px;
          }

          :root[data-theme="dark"]
            .official-affiliation-print {
            color: black !important;
          }
        }
      `}</style>
    </>
  );
}
