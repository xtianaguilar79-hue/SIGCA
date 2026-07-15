# SIGCA · Academia AOMA v1.1

Primera base visual en Next.js y TypeScript alineada con el Documento Maestro SIGCA v1.0. Esta entrega convierte la referencia gráfica de Academia AOMA en una interfaz responsive y navegable, preparada para evolucionar por módulos.

## Qué incluye

- Dashboard de Academia AOMA inspirado en la referencia aprobada.
- Menú lateral adaptable a celular.
- Buscador de cursos en pantalla.
- Cursos, rutas, progreso, agenda y logros.
- Fotografías y logo guardados localmente.
- Documento Maestro original en `docs/`.
- Base Next.js App Router lista para Vercel.

## Estado funcional

Esta versión es la **base visual del producto**. Los cursos y estadísticas son demostrativos. Autenticación, PostgreSQL, permisos granulares, afiliaciones, auditoría y generación PDF deben implementarse en las siguientes fases del Documento Maestro; no se presentan como terminados.

## Iniciar localmente

Requiere Node.js 20.9 o posterior.

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Publicar en Vercel

1. Subir el contenido a un repositorio nuevo de GitHub.
2. Importar el repositorio desde Vercel.
3. Vercel detectará Next.js automáticamente.
4. Publicar sin modificar los comandos predeterminados.

## Próxima fase recomendada

Implementar el núcleo: PostgreSQL, autenticación, perfiles, roles, permisos por empresa/módulo/acción/vigencia y auditoría básica. Luego avanzar con Afiliaciones y la plantilla PDF de Randstad.
