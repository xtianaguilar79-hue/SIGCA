import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

type Module = {
  id: string;
  orden: number;
  titulo: string;
  descripcion: string | null;
  duracion_minutos: number | null;
};

type Lesson = {
  id: string;
  modulo_id: string;
  orden: number;
  titulo: string;
  proposito: string | null;
  duracion_minutos: number | null;
};

export default async function FormationPage() {
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

  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  const { data: courses, error } = await supabase
    .from("fs_cursos")
    .select(
      "id,titulo,subtitulo,descripcion_corta,nivel,modalidad,duracion_minutos,estado,version,imagen_portada"
    )
    .order("creado_en", { ascending: false });

  const course = courses?.[0] ?? null;

  let modules: Module[] = [];
  let lessons: Lesson[] = [];
  let completedLessonIds = new Set<string>();

  if (course) {
    const result = await supabase
      .from("fs_modulos")
      .select(
        "id,orden,titulo,descripcion,duracion_minutos"
      )
      .eq("curso_id", course.id)
      .order("orden");

    modules = (result.data ?? []) as Module[];

    if (modules.length) {
      const lessonResult = await supabase
        .from("fs_lecciones")
        .select(
          "id,modulo_id,orden,titulo,proposito,duracion_minutos"
        )
        .in(
          "modulo_id",
          modules.map((module) => module.id)
        )
        .order("orden");

      lessons = (lessonResult.data ?? []) as Lesson[];

      if (lessons.length) {
        const { data: progressRows } = await supabase
          .from("fs_progreso_lecciones")
          .select("leccion_id")
          .eq("usuario_id", user.id)
          .eq("estado", "completada")
          .in(
            "leccion_id",
            lessons.map((lesson) => lesson.id)
          );

        completedLessonIds = new Set(
          (progressRows ?? []).map(
            (row) => row.leccion_id
          )
        );
      }
    }
  }

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
          <Link href="/gestion">
            Inicio institucional
          </Link>

          <Link href="/gestion/sindical">
            Gestión sindical
          </Link>

          <Link
            className="active"
            href="/gestion/formacion"
          >
            Formación Sindical
          </Link>

          <Link href="/gestion/biblioteca">
            Biblioteca
          </Link>

          <Link href="/gestion/perfil">
            Mi perfil
          </Link>

          {isAdmin && (
            <Link href="/gestion/usuarios">
              Administración de usuarios
            </Link>
          )}
        </nav>

        <div className="session">
          <strong>{name}</strong>

          <span>
            {String(
              profile.rol || "Usuario autorizado"
            )}
          </span>

          <SignOutButton />
        </div>
      </aside>

      <section className="main-area formation-page">
        <header className="main-head">
          <div>
            <p className="kicker">
              FORMACIÓN SINDICAL
            </p>

            <h1>Capacitaciones</h1>

            <p>
              Conocimiento para fortalecer la organización
              y la representación sindical.
            </p>
          </div>

          {isAdmin && (
            <span className="review-badge">
              VISTA DE REVISIÓN
            </span>
          )}
        </header>

        {error ? (
          <div className="formation-empty">
            <h2>
              No pudimos consultar las capacitaciones
            </h2>

            <p>
              Revisaremos la conexión con Formación Sindical.
            </p>
          </div>
        ) : !course ? (
          <div className="formation-empty">
            <h2>Próximamente</h2>

            <p>
              Las primeras capacitaciones se encuentran
              en preparación.
            </p>
          </div>
        ) : (
          <>
            <article className="course-hero">
              {course.imagen_portada ? (
                <div className="course-cover">
                  <Image
                    src={course.imagen_portada}
                    width={1600}
                    height={1000}
                    alt={`Portada de ${course.titulo}`}
                  />
                </div>
              ) : (
                <div className="course-mark">
                  FS
                </div>
              )}

              <div className="course-copy">
                <div className="course-meta">
                  <span>
                    {course.nivel || "Nivel inicial"}
                  </span>

                  <span>
                    {course.modalidad ||
                      "Autogestionada"}
                  </span>

                  <span>
                    Avanzá a tu propio ritmo
                  </span>
                </div>

                <h2>{course.titulo}</h2>

                {course.subtitulo && (
                  <h3>{course.subtitulo}</h3>
                )}

                <p>{course.descripcion_corta}</p>

                <div className="course-status">
                  <strong>{course.estado}</strong>
                  <span>
                    Versión {course.version}
                  </span>
                </div>
              </div>
            </article>

            <section className="course-content">
              <div className="section-heading">
                <div>
                  <p className="kicker">
                    CONTENIDO DISPONIBLE
                  </p>

                  <h2>Recorrido formativo</h2>
                </div>

                <span>
                  {completedLessonIds.size} de{" "}
                  {lessons.length} completadas
                </span>
              </div>

              {modules.map((module) => (
                <article
                  className="formation-module"
                  key={module.id}
                >
                  <header>
                    <span className="module-number">
                      {String(module.orden).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <div>
                      <h3>{module.titulo}</h3>
                      <p>{module.descripcion}</p>
                    </div>
                  </header>

                  <div className="lesson-list">
                    {lessons
                      .filter(
                        (lesson) =>
                          lesson.modulo_id === module.id
                      )
                      .map((lesson) => {
                        const completed =
                          completedLessonIds.has(
                            lesson.id
                          );

                        return (
                          <Link
                            className={`lesson-row ${
                              completed
                                ? "lesson-completed"
                                : ""
                            }`}
                            href={`/gestion/formacion/lecciones/${lesson.id}`}
                            key={lesson.id}
                          >
                            <span>
                              {completed
                                ? "✓"
                                : lesson.orden}
                            </span>

                            <div>
                              <strong>
                                {lesson.titulo}
                              </strong>

                              <p>
                                {lesson.proposito}
                              </p>
                            </div>

                            <b>
                              {completed
                                ? "Completada"
                                : "Abrir →"}
                            </b>
                          </Link>
                        );
                      })}
                  </div>
                </article>
              ))}

              {isAdmin && (
                <div className="review-note">
                  <strong>
                    Contenido en revisión
                  </strong>

                  <p>
                    Este curso todavía no está publicado.
                    Solo los administradores pueden verlo
                    mientras completamos recursos,
                    actividades y control de calidad.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
