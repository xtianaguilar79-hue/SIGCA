import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AffiliateStatusForm } from "./status-form";
import { AffiliateStatusHistory } from "./status-history";
import { AffiliateFamilySection } from "./family-section";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import {AffiliateBenefitHistory, type BenefitDelivery, } from "./benefit-history";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
  estado_actualizado?: string;
  estado_error?: string;
  familia_guardada?: string;
  familia_error?: string;
}>;
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

  const { data: affiliatePermission } = isAdmin
    ? { data: null }
    : await supabase
        .from("usuarios_permisos_sistema")
        .select(
          "habilitado,puede_consultar,puede_crear,puede_editar,puede_aprobar,alcance,empresa_id,sede",
        )
        .eq("usuario_id", user.id)
        .eq("modulo_clave", "afiliados")
        .maybeSingle();

  const hasAffiliateAccess =
    isAdmin ||
    Boolean(
      affiliatePermission?.habilitado,
    );

  const canViewAffiliate =
    isAdmin ||
    Boolean(
      hasAffiliateAccess &&
        affiliatePermission?.puede_consultar,
    );

  const canEditAffiliate =
    isAdmin ||
    Boolean(
      hasAffiliateAccess &&
        affiliatePermission?.puede_editar,
    );
  const canCreateFamily =
  isAdmin ||
  Boolean(
    hasAffiliateAccess &&
      affiliatePermission?.puede_crear,
  );

  const canApproveAffiliate =
    isAdmin ||
    Boolean(
      hasAffiliateAccess &&
        affiliatePermission?.puede_aprobar,
    );

  if (!canViewAffiliate) {
    redirect("/gestion/sistema");
  }

  const { id } = await params;
  const resultado = await searchParams;

  const [
  afiliadoResult,
  estadosResult,
  historialResult,
  familiaresResult,
  beneficiosResult,
] = await Promise.all([
  supabase
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
    .maybeSingle(),

  supabase
    .from("estados_afiliado")
    .select("nombre")
    .eq("habilitado", true)
    .order("orden"),

  supabase
    .from("afiliados_historial_estado")
    .select(
      `
        id,
        estado_anterior,
        estado_nuevo,
        observacion,
        cambiado_por,
        cambiado_at
      `,
    )
    .eq("afiliado_id", id)
    .order("cambiado_at", { ascending: false }),

  supabase
    .from("afiliados_familiares")
    .select(
      `
        id,
        apellido_nombres,
        vinculo,
        documento_tipo,
        documento_numero,
        fecha_nacimiento,
        cuil,
        telefono,
        correo_electronico,
        posee_discapacidad,
        observaciones,
        activo
      `,
    )
    .eq("afiliado_id", id)
    .order("apellido_nombres"),

  supabase
    .from("beneficios_entregas")
    .select(
      `
        id,
        cantidad,
        fecha_entrega,
        fecha_entrega_confirmada,
        observaciones,
        destinatario_tipo,
        destinatario_nombre_original,
        origen_registro,
        entregado_por,
        created_at,
        beneficio:beneficios(
          nombre,
          categoria
        ),
        familiar:afiliados_familiares(
          apellido_nombres,
          vinculo
        )
      `,
    )
    .eq("afiliado_id", id)
    .order("created_at", { ascending: false }),
]);
  const afiliado = afiliadoResult.data;
  const error = afiliadoResult.error;
  const estados = estadosResult.data || [];
  const cambiosEstado = historialResult.data || [];
  const familiares = familiaresResult.data || [];
  const entregas =
  (beneficiosResult.data || []) as unknown as BenefitDelivery[];

  const responsablesIds = [
  ...new Set(
    [
      ...cambiosEstado.map(
        (cambio) => cambio.cambiado_por,
      ),
      ...entregas.map(
        (entrega) => entrega.entregado_por,
      ),
    ].filter((valor): valor is string => Boolean(valor)),
  ),
];

  const { data: responsables } =
    responsablesIds.length > 0
      ? await supabase
          .from("usuarios")
          .select("id,nombre,apellido")
          .in("id", responsablesIds)
      : { data: [] };

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
          {isAdmin && (
            <Link href="/gestion/usuarios">
              Administración de usuarios
            </Link>
          )}
        </nav>

        <div className="session">
          <strong>{nombreUsuario}</strong>
          <span>
            {String(profile.rol || "Usuario autorizado")}
          </span>
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
            <strong>{afiliado.numero_aoma || "0"}</strong>
          </div>

          <span
            className="affiliate-state"
            data-state={afiliado.estado || "SIN ESTADO"}
          >
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

        <AffiliateFamilySection
  afiliadoId={afiliado.id}
  familiares={familiares}
  puedeCrear={canCreateFamily}
  guardado={resultado.familia_guardada === "1"}
  error={resultado.familia_error || ""}
/>
        <AffiliateBenefitHistory
  entregas={entregas}
  responsables={responsables || []}
/>
        {canApproveAffiliate && (
          <AffiliateStatusForm
            afiliadoId={afiliado.id}
            estadoActual={afiliado.estado}
            estados={estados}
            resultado={resultado}
          />
        )}

        <AffiliateStatusHistory
          cambios={cambiosEstado}
          responsables={responsables || []}
        />

        {canEditAffiliate && (
          <div className="affiliate-card-actions">
            <Link
              href={`/gestion/sistema/afiliados/${afiliado.id}/editar`}
            >
              Editar datos personales
            </Link>
          </div>
        )}

        <p className="affiliate-readonly-note">
          Esta ficha se encuentra en modo de consulta. Los datos
          originales del padrón no fueron modificados.
        </p>
      </section>
    </main>
  );
}
