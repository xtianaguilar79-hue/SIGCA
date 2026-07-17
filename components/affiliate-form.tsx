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
  apellido: string;
  nombres: string;
  dni: string;
  cuil: string;
  fechaNacimiento: string;
  nacionalidad: string;
  estadoCivil: string;
  domicilio: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  telefono: string;
  correo: string;
  fechaIngreso: string;
  categoria: string;
  legajo: string;
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
  apellido: "",
  nombres: "",
  dni: "",
  cuil: "",
  fechaNacimiento: "",
  nacionalidad: "",
  estadoCivil: "",
  domicilio: "",
  localidad: "",
  provincia: "",
  codigoPostal: "",
  telefono: "",
  correo: "",
  fechaIngreso: "",
  categoria: "",
  legajo: "",
};

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

  function changeEmployer(
    field: keyof EmployerData,
    value: string
  ) {
    setEmployer((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function changePerson(
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
        className="form-shell wide affiliation-form"
        onSubmit={printForm}
      >
        <div className="print-only affiliation-print-title">
          <h1>Ficha de afiliación</h1>
          <p>AOMA Seccional San Juan</p>
        </div>

        <section className="affiliation-options no-print">
          <div className="field">
            <label htmlFor="modo-persona">
              Datos de la persona
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
                Completar antes de imprimir
              </option>

              <option value="blanco">
                Imprimir en blanco para completar a mano
              </option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="empresa-selector">
              Empresa
            </label>

            <select
              id="empresa-selector"
              value={companyId}
              onChange={(event) =>
                selectCompany(event.target.value)
              }
            >
              <option value="">
                Ninguna / completar empleador a mano
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

        <section className="affiliation-section">
          <header>
            <span>01</span>

            <div>
              <h2>Datos del empleador</h2>

              <p>
                Los datos pueden modificarse antes de
                imprimir la ficha.
              </p>
            </div>
          </header>

          <div className="registration-grid">
            <div className="field full">
              <label htmlFor="razon-social">
                Razón social
              </label>

              <input
                id="razon-social"
                value={employer.razonSocial}
                onChange={(event) =>
                  changeEmployer(
                    "razonSocial",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="rama">Rama</label>

              <input
                id="rama"
                value={employer.rama}
                onChange={(event) =>
                  changeEmployer(
                    "rama",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="cuit">CUIT</label>

              <input
                id="cuit"
                value={employer.cuit}
                onChange={(event) =>
                  changeEmployer(
                    "cuit",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field full">
              <label htmlFor="domicilio-empleador">
                Domicilio
              </label>

              <input
                id="domicilio-empleador"
                value={employer.domicilio}
                onChange={(event) =>
                  changeEmployer(
                    "domicilio",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="localidad-empleador">
                Localidad
              </label>

              <input
                id="localidad-empleador"
                value={employer.localidad}
                onChange={(event) =>
                  changeEmployer(
                    "localidad",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="provincia-empleador">
                Provincia
              </label>

              <input
                id="provincia-empleador"
                value={employer.provincia}
                onChange={(event) =>
                  changeEmployer(
                    "provincia",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="cp-empleador">
                Código postal
              </label>

              <input
                id="cp-empleador"
                value={employer.codigoPostal}
                onChange={(event) =>
                  changeEmployer(
                    "codigoPostal",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="telefono-empleador">
                Teléfono
              </label>

              <input
                id="telefono-empleador"
                value={employer.telefono}
                onChange={(event) =>
                  changeEmployer(
                    "telefono",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field full">
              <label htmlFor="correo-empleador">
                Correo electrónico
              </label>

              <input
                id="correo-empleador"
                type="email"
                value={employer.correo}
                onChange={(event) =>
                  changeEmployer(
                    "correo",
                    event.target.value
                  )
                }
              />
            </div>
          </div>
        </section>

        <section className="affiliation-section">
          <header>
            <span>02</span>

            <div>
              <h2>Datos de la persona a afiliar</h2>

              <p>
                Pueden completarse ahora o dejarse
                vacíos para escribirlos con lapicera.
              </p>
            </div>
          </header>

          <div className="registration-grid">
            <div className="field">
              <label htmlFor="apellido">
                Apellido
              </label>

              <input
                id="apellido"
                value={person.apellido}
                onChange={(event) =>
                  changePerson(
                    "apellido",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="nombres">
                Nombres
              </label>

              <input
                id="nombres"
                value={person.nombres}
                onChange={(event) =>
                  changePerson(
                    "nombres",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="dni">DNI</label>

              <input
                id="dni"
                value={person.dni}
                onChange={(event) =>
                  changePerson("dni", event.target.value)
                }
              />
            </div>

            <div className="field">
              <label htmlFor="cuil">CUIL</label>

              <input
                id="cuil"
                value={person.cuil}
                onChange={(event) =>
                  changePerson(
                    "cuil",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="fecha-nacimiento">
                Fecha de nacimiento
              </label>

              <input
                id="fecha-nacimiento"
                type="date"
                value={person.fechaNacimiento}
                onChange={(event) =>
                  changePerson(
                    "fechaNacimiento",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="nacionalidad">
                Nacionalidad
              </label>

              <input
                id="nacionalidad"
                value={person.nacionalidad}
                onChange={(event) =>
                  changePerson(
                    "nacionalidad",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="estado-civil">
                Estado civil
              </label>

              <input
                id="estado-civil"
                value={person.estadoCivil}
                onChange={(event) =>
                  changePerson(
                    "estadoCivil",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="telefono-persona">
                Teléfono
              </label>

              <input
                id="telefono-persona"
                value={person.telefono}
                onChange={(event) =>
                  changePerson(
                    "telefono",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field full">
              <label htmlFor="domicilio-persona">
                Domicilio
              </label>

              <input
                id="domicilio-persona"
                value={person.domicilio}
                onChange={(event) =>
                  changePerson(
                    "domicilio",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="localidad-persona">
                Localidad
              </label>

              <input
                id="localidad-persona"
                value={person.localidad}
                onChange={(event) =>
                  changePerson(
                    "localidad",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="provincia-persona">
                Provincia
              </label>

              <input
                id="provincia-persona"
                value={person.provincia}
                onChange={(event) =>
                  changePerson(
                    "provincia",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="cp-persona">
                Código postal
              </label>

              <input
                id="cp-persona"
                value={person.codigoPostal}
                onChange={(event) =>
                  changePerson(
                    "codigoPostal",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="correo-persona">
                Correo electrónico
              </label>

              <input
                id="correo-persona"
                type="email"
                value={person.correo}
                onChange={(event) =>
                  changePerson(
                    "correo",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="fecha-ingreso">
                Fecha de ingreso
              </label>

              <input
                id="fecha-ingreso"
                type="date"
                value={person.fechaIngreso}
                onChange={(event) =>
                  changePerson(
                    "fechaIngreso",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="categoria">
                Categoría
              </label>

              <input
                id="categoria"
                value={person.categoria}
                onChange={(event) =>
                  changePerson(
                    "categoria",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="legajo">
                Número de legajo
              </label>

              <input
                id="legajo"
                value={person.legajo}
                onChange={(event) =>
                  changePerson(
                    "legajo",
                    event.target.value
                  )
                }
              />
            </div>
          </div>
        </section>

        <div className="affiliation-actions no-print">
          <button className="submit" type="submit">
            Imprimir ficha
          </button>
        </div>

        <section className="affiliation-signatures">
          <div>
            <span />
            <p>Firma de la persona afiliada</p>
          </div>

          <div>
            <span />
            <p>Aclaración</p>
          </div>

          <div>
            <span />
            <p>Fecha</p>
          </div>
        </section>
      </form>

      <style jsx global>{`
        .print-only {
          display: none;
        }

        .affiliation-form {
          display: grid;
          gap: 22px;
        }

        .affiliation-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          padding: 18px;
          border: 1px solid var(--linea);
          border-radius: 10px;
          background: var(--fondo);
        }

        .affiliation-options select {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #cddade;
          border-radius: 8px;
          background: white;
          color: var(--tinta);
          font-size: 16px;
        }

        .affiliation-section {
          overflow: hidden;
          border: 1px solid var(--linea);
          border-radius: 11px;
        }

        .affiliation-section > header {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--linea);
          background: #edf5f6;
        }

        .affiliation-section > header span {
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 8px;
          background: var(--petroleo);
          color: white;
          font-weight: 900;
        }

        .affiliation-section h2 {
          margin: 0;
          color: var(--petroleo);
          font: 700 20px Georgia, serif;
        }

        .affiliation-section header p {
          margin: 4px 0 0;
          color: var(--gris);
          font-size: 14px;
        }

        .affiliation-section .registration-grid {
          padding: 20px;
        }

        .affiliation-actions {
          display: flex;
          justify-content: flex-end;
        }

        .affiliation-actions .submit {
          min-width: 190px;
        }

        .affiliation-signatures {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr;
          gap: 22px;
          margin-top: 35px;
        }

        .affiliation-signatures span {
          display: block;
          height: 42px;
          border-bottom: 1px solid #263f48;
        }

        .affiliation-signatures p {
          margin: 6px 0 0;
          font-size: 12px;
          text-align: center;
        }

        :root[data-theme="dark"]
          .affiliation-options,
        :root[data-theme="dark"]
          .affiliation-section {
          border-color: #49636c;
          background: #18343e;
        }

        :root[data-theme="dark"]
          .affiliation-section
          > header {
          border-color: #49636c;
          background: #21434e;
        }

        :root[data-theme="dark"]
          .affiliation-options
          select {
          border-color: #59747d;
          background: #10272f;
          color: white;
        }

        @media (max-width: 700px) {
          .affiliation-options {
            grid-template-columns: 1fr;
          }

          .affiliation-signatures {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm;
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
          .no-print {
            display: none !important;
          }

          .management,
          .main-area {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .form-shell.affiliation-form {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }

          .print-only {
            display: block !important;
          }

          .affiliation-print-title {
            margin-bottom: 12px;
            text-align: center;
          }

          .affiliation-print-title h1 {
            margin: 0;
            font: 700 22px Georgia, serif;
          }

          .affiliation-print-title p {
            margin: 3px 0 0;
            font-size: 12px;
          }

          .affiliation-section {
            break-inside: avoid;
            margin-bottom: 12px;
            border: 1px solid #777 !important;
            background: white !important;
          }

          .affiliation-section > header {
            padding: 8px 10px;
            border-color: #999 !important;
            background: #ededed !important;
          }

          .affiliation-section > header span {
            width: 27px;
            height: 27px;
            background: #333 !important;
            font-size: 11px;
          }

          .affiliation-section h2 {
            color: black !important;
            font-size: 15px;
          }

          .affiliation-section header p {
            display: none;
          }

          .affiliation-section
            .registration-grid {
            gap: 7px 12px;
            padding: 10px;
          }

          .field label {
            color: black !important;
            font-size: 10px;
          }

          .field input,
          .registration-grid select {
            min-height: 26px;
            padding: 3px 2px;
            border: 0 !important;
            border-bottom: 1px solid #555 !important;
            border-radius: 0 !important;
            background: white !important;
            color: black !important;
            font-size: 11px;
          }

          .affiliation-signatures {
            break-inside: avoid;
            margin-top: 22px;
          }
        }
      `}</style>
    </>
  );
}
