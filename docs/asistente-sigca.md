# Asistente SIGCA — primera versión

Chat flotante desde `app/gestion/layout.tsx`, compartido por todas las rutas de gestión, con diseño móvil, modo oscuro, teclado, contexto de página, selector de alcance y fuentes enlazadas. No se modifican las páginas existentes.

## Habilitación

1. Aplicar `supabase/migrations/202609040001_sigca_asistente.sql` en el proyecto Supabase correspondiente. La migración es transaccional y no cambia las políticas de los módulos existentes.
2. Mantener `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` existentes. No agregar claves de administrador ni claves de IA.
3. Desplegar el código. Sin la migración, el endpoint devuelve 503 explícito; no simula respuestas.
4. Probar con dos usuarios de distintos permisos y un administrador antes de habilitarlo en producción.

No se incluye acceso a la base productiva ni se afirma haber aplicado esta migración automáticamente.

## Fuentes y permisos

- Biblioteca: los doce documentos de `lib/biblioteca.ts`/`data/biblioteca`, igual que la pantalla actual. No existe una tabla Biblioteca en el repositorio revisado. Se exige usuario activo y aprobado antes de consultar el corpus.
- Actas/Minutas: `actas_minutas` (título, fecha, asunto, desarrollo, acuerdos, pendientes y observaciones).
- Reclamos: `reclamos_sindicales` (título, descripción, estado y respuesta). Se mantienen las políticas de creador, responsable, destinatario, empresa y administrador ya existentes.
- Visitas/Inspecciones: `visitas_inspecciones` (título, fecha, desarrollo y acciones).

Estos módulos actualmente exigen usuario aprobado y aplican RLS para los registros; los permisos de `usuarios_permisos_sistema` corresponden a otros módulos administrativos. El asistente no inventa nuevas reglas ni usa el rol enviado por el navegador. Las funciones de consulta son `SECURITY INVOKER` y rechazan tablas sin RLS activa, incluso si el rol conectado pudiera omitirla. Una tabla sin políticas SELECT devuelve cero registros. Revisar las políticas de Actas y Visitas en Supabase: su definición original no está versionada en este repositorio. No se amplían automáticamente.

El contexto de ruta es solo un filtro; nunca otorga acceso. Las búsquedas se hacen nuevamente con la sesión actual. No se almacenan mensajes en base, localStorage ni caché. Se conserva un máximo de veinte mensajes en memoria, limpiados al cerrar sesión/cambiar usuario o con «Limpiar chat»; cerrar el panel lo minimiza. Las citas ya entregadas pueden permanecer en la conversación hasta limpiarla, aunque luego cambien los permisos.

## Endpoint

`POST /api/asistente` acepta JSON `{ question, path, scope }`, donde scope es `all`, `module` o `record`. Requiere cookies válidas, `Origin` de la aplicación, perfil aprobado/activo, pregunta de hasta 1200 caracteres y cuerpo de hasta 8192 bytes. Límite distribuido: veinte consultas por minuto por usuario; 429 incluye Retry-After. El contador no almacena consultas y está cerrado a acceso directo.

Respuestas: 200 con `{message,sources,mode:"extractive",incomplete}`, 400 entrada inválida, 401 sin sesión, 403 acceso denegado, 415 formato incorrecto, 429 cuota, 503 servicio/configuración no disponible. Las respuestas no se cachean. Los errores de consulta no se confunden con ausencia de evidencia ni se exponen mensajes internos de la base.

## Alcance real de esta versión

Es un recuperador extractivo, no una IA generativa: busca texto interno y entrega fragmentos literales con enlace. No interpreta imágenes, PDFs adjuntos, audios o archivos originales ni accede a las URLs incluidas en documentos. Biblioteca usa coincidencia literal normalizada; Supabase usa búsqueda textual española. Las consultas muy complejas pueden necesitar reformularse con palabras clave. «Reclamos pendientes» recupera estados borrador/abierto/en_gestion/pendiente_empresa, como búsqueda inicial no exhaustiva. Máximo cinco fuentes por respuesta; no realiza conteos globales, resúmenes inferidos ni comparaciones temporales.

`core.ts` separa contratos y composición de respuesta de `retrieve.ts`. Una futura IA debe recibir exclusivamente evidencia autorizada, tratarla como datos no confiables, mantener citas verificadas y abstenerse cuando no pueda respaldar una afirmación. No habilitar navegación ni herramientas externas. Ningún historial del navegador se acepta como evidencia.

## Verificación

- `node --test tests/asistente*.test.mjs` (Node 24): contratos, abstención, guardas estáticas y ejecución del endpoint con límites externos simulados.
- `npx tsc --noEmit` y `npm run lint -- components/asistente-sigca.tsx lib/asistente app/api/asistente/route.ts app/gestion/layout.tsx`.
- `npm run build` para comprobar integración con Next.
- En entorno de pruebas Supabase: comprobar consulta anónima, perfil inactivo/pendiente, reclamo privado ajeno, destinatario autorizado y mismo ID consultado por dos usuarios. Confirmar que una ruta manipulada no permite leer un registro oculto; retirar permisos y repetir la consulta.
- Deshabilitar RLS solo en una base de prueba: la búsqueda debe fallar sin devolver registros. Sin migración debe haber 503. Probar cuota, fuente sin coincidencias y fallo de un módulo (advertencia parcial).
- Escritorio/móvil: abrir/cerrar, Escape, Tab, Enter/Shift+Enter, navegar conservando chat, abrir fuente, limpiar mientras carga, errores de red y cerrar sesión. Confirmar que no aparece en acceso ni impresión.

Las pruebas estáticas no sustituyen pruebas de aislamiento con las políticas reales. La revisión de RLS en producción y la aplicación de la migración son requisitos de puesta en servicio.
