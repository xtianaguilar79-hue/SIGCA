// Shared contracts only: no credentials, database access or document corpus here.
export const MODULES = {
  biblioteca: "Biblioteca",
  actas: "Actas y minutas",
  reclamos: "Reclamos",
  visitas: "Visitas e inspecciones",
} as const;
export type Module = keyof typeof MODULES;
export type Scope = "all" | "module" | "record";
export type PageContext = { label: string; module?: Module; recordId?: string };
export type Evidence = { id: string; module: Module; title: string; excerpt: string; href: string };
export type Answer = {
  message: string;
  sources: Evidence[];
  mode: "extractive";
  incomplete: boolean;
};
export const NO_EVIDENCE = "SIGCA no contiene información suficiente para responder esta consulta con las fuentes disponibles para tu usuario.";

export function pageContext(path: string): PageContext {
  // A route is a search hint, NEVER an authorization claim.
  const match = /^\/gestion\/(?:sindical\/)*(biblioteca|actas|reclamos|visitas)(?:\/([a-zA-Z0-9_-]+))?(?:\/editar)?\/?$/.exec(path);
  if (match) {
    const moduleKey = match[1] as Module;
    return { label: MODULES[moduleKey], module: moduleKey, recordId: match[2] };
  }
  const labels: Record<string, string> = {
    "/gestion": "Inicio institucional",
    "/gestion/sindical": "Gestión sindical",
    "/gestion/perfil": "Mi perfil",
    "/gestion/formacion": "Formación sindical",
    "/gestion/sistema": "Sistema",
    "/gestion/usuarios": "Administración de usuarios",
  };
  return { label: labels[path] || "Gestión SIGCA" };
}

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
const STOP = new Set(("a al algo ante bajo con contra cual cuales cuando de del desde donde el ella ellos en entre es esa ese esta estas este esto estos hay hasta la las lo los me mi no o para pero por que quien se segun si sin sobre su sus un una unas unos y yo " +
  "buscar busca busco consulta consultar decime dice dicen dame mostrar muestra ver quiero necesito saber informacion sigca favor podes puede responder pregunta resumir resumi resumen documento documentos registro registros").split(" "));
export function searchTerms(question: string): string[] {
  return [...new Set((normalize(question).match(/[a-z0-9]+/g) || []).filter(word => word.length > 1 && !STOP.has(word)))].slice(0, 12);
}

export function plainText(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(nbsp|amp|lt|gt|quot|apos);/g, (_, entity: string) => ({ nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[entity] || " ")
    .replace(/\s+/g, " ").trim();
}

export function excerpt(text: string, terms: string[], max = 700): string {
  const clean = plainText(text);
  const normalized = normalize(clean);
  const positions = terms.map(term => normalized.indexOf(term)).filter(position => position >= 0);
  const start = positions.length ? Math.max(0, Math.min(...positions) - 100) : 0;
  return `${start ? "…" : ""}${clean.slice(start, start + max)}${start + max < clean.length ? "…" : ""}`;
}

// Replaceable answer stage. It deliberately cannot invent facts: only source excerpts
// are returned. A future generator must receive authorized evidence, never arbitrary tools.
export function composeAnswer(sources: Evidence[], incomplete = false): Answer {
  return {
    mode: "extractive", incomplete, sources,
    message: sources.length
      ? "Encontré estos fragmentos internos relacionados con tu consulta. Son citas de las fuentes, no una respuesta elaborada ni un listado completo. Abrí cada registro para verificar el contexto."
      : NO_EVIDENCE,
  };
}

export function parseRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.question !== "string" || !body.question.trim() || body.question.length > 1200) return null;
  if (typeof body.path !== "string" || body.path.length > 300 || !/^\/gestion(?:\/|$)/.test(body.path)) return null;
  if (!["all", "module", "record"].includes(String(body.scope))) return null;
  const context = pageContext(body.path);
  if (body.scope === "module" && !context.module) return null;
  if (body.scope === "record" && (!context.module || !context.recordId)) return null;
  return { question: body.question.trim(), context, scope: body.scope as Scope };
}
