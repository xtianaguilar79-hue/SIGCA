import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AffiliateForm, EmployerData, PersonData } from "@/components/affiliate-form";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

function value(data: unknown) {
  return String(data || "");
}

export default async function EditarSolicitudPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ accion?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const { data: profile } = await supabase
    .from("usuarios")
    .select("nombre,apellido,rol,estado,activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.activo === false || String(profile.estado).toLowerCase() !== "aprobado") redirect("/acceso");

  const { id } = await params;
  const autoDownload = (await searchParams).accion === "descargar";
  const { data: application } = await supabase.from("afiliaciones").select("*").eq("id", id).maybeSingle();
  if (!application) notFound();
  if (application.estado !== "pendiente_firma") redirect("/gestion/sindical/afiliaciones/solicitudes");

  const { data: companies } = await supabase
    .from("empresas")
    .select("id,nombre,rama,domicilio,localidad,provincia,codigo_postal,cuit,correo_electronico,telefono")
    .order("nombre");

  const cuilDigits = value(application.cuil).replace(/\D/g, "");
  const initialEmployer: EmployerData = {
    razonSocial: value(application.razon_social),
    rama: value(application.rama),
    domicilio: value(application.empresa_domicilio),
    localidad: value(application.empresa_localidad),
    provincia: value(application.empresa_provincia),
    codigoPostal: value(application.empresa_codigo_postal),
    cuit: value(application.empresa_cuit),
    correo: value(application.empresa_correo),
    telefono: value(application.empresa_telefono),
  };

  const initialPerson: PersonData = {
    apellidoNombres: value(application.apellido_nombres),
    domicilio: value(application.domicilio),
    provincia: value(application.provincia),
    localidad: value(application.localidad),
    codigoPostal: value(application.codigo_postal),
    fechaNacimiento: value(application.fecha_nacimiento),
    tipoDocumento: value(application.tipo_documento),
    numeroDocumento: value(application.numero_documento),
    cuil: value(application.cuil),
    cuilPrefijo: cuilDigits.length === 11 ? cuilDigits.slice(0, 2) : "",
    cuilDigito: cuilDigits.length === 11 ? cuilDigits.slice(-1) : "",
    nacionalidad: value(application.nacionalidad),
    estadoCivil: value(application.estado_civil),
    telefono: value(application.telefono),
    correo: value(application.correo),
    areaTrabajo: value(application.area_trabajo),
    oficio: value(application.oficio),
    fechaIngreso: value(application.fecha_ingreso),
    afiliadoAoma: value(application.afiliado_aoma),
    numeroAfiliado: value(application.numero_afiliado),
    afiliadoOtroGremio: value(application.afiliado_otro_gremio),
    otroGremio: value(application.otro_gremio),
    observaciones: value(application.observaciones),
  };

  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");
  const isAdmin = String(profile.rol).toLowerCase() === "administrador";

  return <main className="management">
    <aside className="side">
      <Link className="side-brand" href="/gestion"><Image src="/logo-aoma.png" width={39} height={39} alt="AOMA"/><div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div></Link>
      <nav><Link href="/gestion">Inicio institucional</Link><Link className="active" href="/gestion/sindical">Gestión sindical</Link><Link href="/gestion/formacion">Formación Sindical</Link><Link href="/gestion/biblioteca">Biblioteca</Link><Link href="/gestion/perfil">Mi perfil</Link>{isAdmin && <Link href="/gestion/usuarios">Administración de usuarios</Link>}</nav>
      <div className="session"><strong>{name}</strong><span>{String(profile.rol || "Usuario autorizado")}</span><SignOutButton/></div>
    </aside>
    <section className="main-area">
      <Link className="library-back" href="/gestion/sindical/afiliaciones/solicitudes">← Volver a solicitudes</Link>
      <header className="main-head"><div><p className="kicker">AFILIACIONES</p><h1>Modificar solicitud</h1><p>Corregí los datos pendientes y volvé a guardar o descargar la ficha.</p></div></header>
      <AffiliateForm companies={companies || []} applicationId={id} initialCompanyId={value(application.empresa_id)} initialEmployer={initialEmployer} initialPerson={initialPerson} autoDownload={autoDownload}/>
    </section>
  </main>;
}
