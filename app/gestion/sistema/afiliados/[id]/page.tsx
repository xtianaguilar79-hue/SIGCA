import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

function mostrar(valor: unknown) {
  const texto = String(valor ?? "").trim();
  return texto || "Sin informar";
}

function mostrarFecha(valor: string | null) {
  if (!valor) return "Sin informar";

  const fecha = new Date(`${valor.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat("es-AR").format(fecha);
}

export default async function FichaAfiliadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/acceso");
  }

  const { data: profile } = await supabase
    .from("usuarios")
    .select("nombre,apellido,rol,estado,activo")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.activo === false ||
    String(profile.estado).toLowerCase() !== "aprobado"
  ) {
    redirect("/acceso");
  }

  const isAdmin =
    String(profile.rol).toLowerCase() === "administrador";

  if (!isAdmin) {
    redirect("/gestion/sistema");
  }

  const { id } = await params;

  const { data: afiliado, error } = await supabase
    .from("afiliados")
    .select(
      `
        id,
        numero_aoma,
        apellido_nombres,
        empresas_original,
        empresa_original,
        fecha_ingreso,
        edad_original,
        fecha_nacimiento,
        direccion,
        codigo_postal,
        cuil,
        antiguedad_original,
        provincia,
        departamento,
        documento_numero,
        telefono_fijo,
        telefono_movil,
        email,
        estado,
        baja_original,
        etiquetas,
        fecha_ultimo_cambio_estado,
        origen,
        created_at,
        updated_at
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !afiliado) {
    notFound();
  }

  const nombreUsuario = [
    profile.nombre,
    profile.apellido,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="management">
      <aside className="side">
        <Link className="side-brand" href="/gestion">
          <Image
            src="/logo-aoma.png"
            width={39}
            height={39}
            alt="AOMA"
          />

          <div>
            <strong>SIGCA</strong>
            <span>SECCIONAL SAN JUAN</span>
          </div>
        </Link>

        <nav>
          <Link href="/gestion">Inicio institucional</Link>
          <Link href="/gestion/sindical">Gestión sindical</Link>
          <Link href="/gestion/formacion">Formación Sindical</Link>
          <Link href="/gestion/biblioteca">Biblioteca</Link>
          <Link href="/gestion/perfil">Mi perfil</Link>
          <Link className="active" href="/gestion/sistema">
            Sistema
          </Link>
          <Link href="/gestion/usuarios">
            Administración de usuarios
          </Link>
        </nav>

        <div className="session">
          <strong>{nombreUsuario}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area affiliate-detail-page">
        <Link
          className="library-back"
          href="/gestion/sistema/afiliados"
        >
          ← Volver al padrón
        </Link>

        <header className="affiliate-detail-header">
          <div>
            <p className="kicker">FICHA DEL PADRÓN</p>
            <h1>{afiliado.apellido_nombres}</h1>
            <p>DNI {mostrar(afiliado.documento_numero)}</p>
          </div>

          <div className="affiliate-detail-number">
            <span>NÚMERO DE AFILIADO</span>
            <strong>{mostrar(afiliado.numero_aoma)}</strong>
          </div>

          <span className="affiliate-state">
            {mostrar(afiliado.estado)}
          </span>
        </header>

        <section className="affiliate-detail-section">
          <h2>Datos personales</h2>

          <dl className="affiliate-detail-grid">
            <div>
              <dt>Apellido y nombres</dt>
              <dd>{mostrar(afiliado.apellido_nombres)}</dd>
            </div>
            <div>
              <dt>Documento</dt>
              <dd>{mostrar(afiliado.documento_numero)}</dd>
            </div>
            <div>
              <dt>CUIL</dt>
              <dd>{mostrar(afiliado.cuil)}</dd>
            </div>
            <div>
              <dt>Fecha de nacimiento</dt>
              <dd>{mostrarFecha(afiliado.fecha_nacimiento)}</dd>
            </div>
            <div>
              <dt>Edad registrada</dt>
              <dd>{mostrar(afiliado.edad_original)}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{mostrar(afiliado.direccion)}</dd>
            </div>
            <div>
              <dt>Provincia</dt>
              <dd>{mostrar(afiliado.provincia)}</dd>
            </div>
            <div>
              <dt>Departamento</dt>
              <dd>{mostrar(afiliado.departamento)}</dd>
            </div>
            <div>
              <dt>Código postal</dt>
              <dd>{mostrar(afiliado.codigo_postal)}</dd>
            </div>
          </dl>
        </section>

        <section className="affiliate-detail-section">
          <h2>Datos laborales y sindicales</h2>

          <dl className="affiliate-detail-grid">
            <div>
              <dt>Empresa</dt>
              <dd>{mostrar(afiliado.empresa_original)}</dd>
            </div>
            <div>
              <dt>Empresa consignada originalmente</dt>
              <dd>{mostrar(afiliado.empresas_original)}</dd>
            </div>
            <div>
              <dt>Fecha de ingreso</dt>
              <dd>{mostrarFecha(afiliado.fecha_ingreso)}</dd>
            </div>
            <div>
              <dt>Antigüedad registrada</dt>
              <dd>{mostrar(afiliado.antiguedad_original)}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{mostrar(afiliado.estado)}</dd>
            </div>
            <div>
              <dt>Último cambio de estado</dt>
              <dd>
                {mostrarFecha(
                  afiliado.fecha_ultimo_cambio_estado,
                )}
              </dd>
            </div>
            <div>
              <dt>Información original de baja</dt>
              <dd>{mostrar(afiliado.baja_original)}</dd>
            </div>
            <div>
              <dt>Etiquetas</dt>
              <dd>{mostrar(afiliado.etiquetas)}</dd>
            </div>
          </dl>
        </section>

        <section className="affiliate-detail-section">
          <h2>Contacto</h2>

          <dl className="affiliate-detail-grid">
            <div>
              <dt>Teléfono móvil</dt>
              <dd>{mostrar(afiliado.telefono_movil)}</dd>
            </div>
            <div>
              <dt>Teléfono fijo</dt>
              <dd>{mostrar(afiliado.telefono_fijo)}</dd>
            </div>
            <div>
              <dt>Correo electrónico</dt>
              <dd>{mostrar(afiliado.email)}</dd>
            </div>
          </dl>
        </section>

        <div className="affiliate-card-actions">
  <Link
    href={`/gestion/sistema/afiliados/${afiliado.id}/editar`}
  >
    Editar datos personales
  </Link>
</div>
        <p className="affiliate-readonly-note">
          Esta ficha se encuentra en modo de consulta. Los datos
          originales del padrón no fueron modificados.
        </p>
      </section>
    </main>
  );
}
