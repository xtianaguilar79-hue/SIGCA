"use client";

import { FormEvent, useState } from "react";
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

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

function fitText(value: string, font: PDFFont, size: number, width: number) {
  let result = value.trim();
  while (result && font.widthOfTextAtSize(result, size) > width) {
    result = result.slice(0, -1);
  }
  return result === value.trim() ? result : `${result.slice(0, -3)}...`;
}

function drawField(
  page: PDFPage,
  font: PDFFont,
  value: string,
  x: number,
  y: number,
  width: number,
  size = 9
) {
  page.drawRectangle({
    x: x - 1,
    y: y - 3,
    width: width + 2,
    height: 14,
    color: rgb(1, 1, 1),
  });

  if (value.trim()) {
    page.drawText(fitText(value, font, size, width), {
      x,
      y,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  } else {
    page.drawLine({
      start: { x, y: y - 1 },
      end: { x: x + width, y: y - 1 },
      thickness: 0.55,
      color: rgb(0, 0, 0),
    });
  }
}

function markBox(page: PDFPage, x: number, y: number) {
  page.drawLine({
    start: { x: x + 2, y: y + 2 },
    end: { x: x + 13, y: y + 13 },
    thickness: 1.2,
    color: rgb(0, 0, 0),
  });
  page.drawLine({
    start: { x: x + 13, y: y + 2 },
    end: { x: x + 2, y: y + 13 },
    thickness: 1.2,
    color: rgb(0, 0, 0),
  });
}

async function createOfficialPdf(employer: EmployerData, person: PersonData) {
  const template = await fetch("/plantilla_ficha_afiliacion_AOMA.pdf");
  if (!template.ok) throw new Error("No se encontró la plantilla PDF en public.");

  const pdf = await PDFDocument.load(await template.arrayBuffer());
  const page = pdf.getPage(0);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  // Datos del empleador.
  drawField(page, font, employer.razonSocial, 95, 518, 452);
  drawField(page, font, employer.rama, 61, 499, 486);
  drawField(page, font, employer.domicilio, 78, 480, 267);
  drawField(page, font, employer.localidad, 430, 480, 117);
  drawField(page, font, employer.provincia, 76, 461, 128);
  drawField(page, font, employer.codigoPostal, 285, 461, 64);
  drawField(page, font, employer.cuit, 407, 461, 140);
  drawField(page, font, employer.correo, 125, 442, 222);
  drawField(page, font, employer.telefono, 418, 442, 129);

  // Datos personales. La plantilla se limpia antes de escribir cada campo.
  drawField(page, font, person.apellidoNombres, 134, 395, 413);
  drawField(page, font, person.domicilio, 126, 371, 421);
  drawField(page, font, person.provincia, 73, 346, 139);
  drawField(page, font, person.localidad, 274, 346, 124);
  drawField(page, font, person.codigoPostal, 472, 346, 75);
  drawField(page, font, formatDate(person.fechaNacimiento), 97, 322, 94);
  drawField(page, font, person.tipoDocumento, 294, 322, 59, 8.5);
  drawField(page, font, person.numeroDocumento, 414, 322, 133);
  drawField(page, font, person.cuil, 66, 299, 123);
  drawField(page, font, person.nacionalidad, 259, 299, 99);
  drawField(page, font, person.estadoCivil, 424, 299, 123);
  drawField(page, font, person.telefono, 73, 276, 171);
  drawField(page, font, person.correo, 337, 276, 210);
  drawField(page, font, person.areaTrabajo, 84, 253, 104);
  drawField(page, font, person.oficio, 219, 253, 85);
  drawField(page, font, formatDate(person.fechaIngreso), 458, 253, 89);

  drawField(page, font, person.numeroAfiliado, 319, 189, 195);
  drawField(page, font, person.otroGremio, 296, 162, 220);

  if (person.afiliadoAoma === "Sí") markBox(page, 170, 181);
  if (person.afiliadoAoma === "No") markBox(page, 223, 181);
  if (person.afiliadoOtroGremio === "Sí") markBox(page, 180, 154);
  if (person.afiliadoOtroGremio === "No") markBox(page, 233, 154);

  if (person.observaciones.trim()) {
    page.drawRectangle({
      x: 117,
      y: 32,
      width: 430,
      height: 14,
      color: rgb(1, 1, 1),
    });
    page.drawText(fitText(person.observaciones, font, 8.5, 428), {
      x: 117,
      y: 35,
      size: 8.5,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawLine({
      start: { x: 117, y: 33 },
      end: { x: 547, y: 33 },
      thickness: 0.55,
      color: rgb(0, 0, 0),
    });
  }

  return pdf.save();
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

  async function printForm(event: FormEvent) {
    event.preventDefault();

    const pdfWindow = window.open("", "_blank");

    try {
      const bytes = await createOfficialPdf(employer, person);
      const safeBytes = new Uint8Array(bytes);
      const blob = new Blob([safeBytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      if (pdfWindow) {
        pdfWindow.location.href = url;
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = "ficha-afiliacion-AOMA.pdf";
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      pdfWindow?.close();
      alert(
        error instanceof Error
          ? error.message
          : "No fue posible generar la ficha."
      );
    }
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
            size: A4 portrait;
            margin: 7mm 9mm;
          }

          html,
          body {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
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
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }

          .official-affiliation-print {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            display: block !important;
            box-sizing: border-box !important;
            width: 108.7% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            zoom: 0.92 !important;
            break-before: avoid-page !important;
            break-after: avoid-page !important;
            break-inside: avoid-page !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            background: white !important;
            color: black !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 11.3pt !important;
            line-height: 1.25 !important;
          }

          .official-title {
            margin: 2mm 0 4mm !important;
            text-align: center !important;
            font-size: 20pt !important;
            font-weight: 900 !important;
          }

          .official-contact {
            display: flex !important;
            justify-content: space-between !important;
            padding-bottom: 1mm !important;
            border-bottom: 1px solid black !important;
            font-size: 10.5pt !important;
          }

          .official-opening {
            display: grid !important;
            grid-template-columns: 37% 63% !important;
            min-height: 37mm !important;
          }

          .official-exclusive {
            padding: 2mm 3mm !important;
            border: 1px solid black !important;
          }

          .official-exclusive p {
            margin: 1.5mm 0 !important;
          }

          .official-request {
            padding: 5mm 3mm !important;
            text-align: center !important;
          }

          .official-request h1 {
            margin: 0 0 10mm !important;
            font-size: 16pt !important;
          }

          .official-request p {
            margin: 0 !important;
          }

          .official-recipient {
            margin-top: 1.5mm !important;
          }

          .official-recipient p {
            margin: 0.8mm 0 !important;
          }

          .official-recipient strong {
            display: block !important;
            margin-top: 5mm !important;
            text-decoration: underline !important;
          }

          .official-letter {
            margin: 7mm 0 3mm !important;
            line-height: 1.28 !important;
            text-align: justify !important;
          }

          .official-section {
            margin-top: 2.5mm !important;
            padding-top: 2mm !important;
            border-top: 4px double black !important;
            break-inside: avoid !important;
          }

          .official-section h2 {
            margin: 0 0 2.5mm !important;
            font-size: 12.5pt !important;
            text-decoration: underline !important;
          }

          .official-section p {
            display: flex !important;
            min-height: 6mm !important;
            margin: 1.3mm 0 !important;
            align-items: flex-end !important;
            white-space: nowrap !important;
          }

          .official-section p span,
          .official-observations span {
            min-height: 5mm !important;
            flex: 1 !important;
            margin-left: 1.5mm !important;
            border-bottom: 1px solid black !important;
          }

          .official-row {
            display: flex !important;
            gap: 3mm !important;
          }

          .official-row p {
            flex: 1 !important;
            min-width: 0 !important;
          }

          .official-closing {
            margin: 6mm 0 9mm !important;
            text-align: center !important;
          }

          .official-signatures {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 42mm !important;
            margin: 0 12mm 5mm !important;
            break-inside: avoid !important;
          }

          .official-signatures p {
            margin: 0 !important;
            padding-top: 2mm !important;
            border-top: 1px solid black !important;
            text-align: center !important;
            font-size: 8.5pt !important;
          }

          .official-observations {
            display: flex !important;
            min-height: 8mm !important;
            margin: 0 !important;
            align-items: flex-end !important;
          }

          :root[data-theme="dark"] .official-affiliation-print {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </>
  );
}
