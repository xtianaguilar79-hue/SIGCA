import type { SupabaseClient } from "@supabase/supabase-js";
import { documentosBiblioteca } from "@/lib/biblioteca";
import { excerpt, MODULES, normalize, plainText, searchTerms, type Evidence, type Module, type PageContext, type Scope } from "./core";

type Row = { id: string; titulo: string; contenido: string; relevancia: number };
const MODULE_WORDS: Record<Module, string[]> = {
  biblioteca: ["biblioteca", "ley", "leyes", "convenio", "convenios"],
  actas: ["acta", "actas", "minuta", "minutas"],
  reclamos: ["reclamo", "reclamos"],
  visitas: ["visita", "visitas", "inspeccion", "inspecciones"],
};

export async function retrieveEvidence(supabase: SupabaseClient, question: string, context: PageContext, scope: Scope) {
  const terms = searchTerms(question).filter(term => term.length <= 60);
  const modules: Module[] = scope !== "all" && context.module ? [context.module] : Object.keys(MODULES) as Module[];
  let incomplete = false;
  const groups = await Promise.all(modules.map(async module => {
    const recordId = scope === "record" ? context.recordId : undefined;
    const moduleTerms = terms.filter(term => !MODULE_WORDS[module].includes(term));
    if (module === "biblioteca") {
      // Same corpus and access rule as /gestion/biblioteca: approved active users.
      // Nothing is downloaded from source links or external websites.
      return documentosBiblioteca.filter(doc => !recordId || doc.id === recordId).flatMap(doc => {
        const content = plainText(doc.contenidoHtml);
        const searchable = normalize(`${doc.titulo} ${doc.numero} ${content}`);
        if ((!moduleTerms.length && !recordId) || !moduleTerms.every(term => searchable.includes(term))) return [];
        return [{ id: doc.id, module, title: doc.titulo, excerpt: excerpt(content, moduleTerms), href: `/gestion/biblioteca/${encodeURIComponent(doc.id)}` } satisfies Evidence];
      }).slice(0, 5);
    }
    const pending = module === "reclamos" && /\bpendientes?\b/.test(normalize(question));
    const keywords = pending ? moduleTerms.filter(term => !/^pendientes?$/.test(term)) : moduleTerms;
    const { data, error } = await supabase.rpc("sigca_asistente_buscar", {
      p_modulo: module, p_terminos: keywords, p_registro: recordId || null, p_pendientes: pending,
    }).abortSignal(AbortSignal.timeout(7000));
    if (error) { incomplete = true; return []; }
    return ((data || []) as Row[]).map(row => ({
      id: row.id, module, title: row.titulo,
      excerpt: excerpt(row.contenido, keywords),
      href: `/gestion/sindical/${module}/${encodeURIComponent(row.id)}`,
    } satisfies Evidence));
  }));
  // Round-robin avoids letting the static library hide operational results.
  const sources: Evidence[] = [];
  for (let i = 0; i < 5 && sources.length < 5; i++) {
    for (const group of groups) if (group[i] && sources.length < 5) sources.push(group[i]);
  }
  return { sources, incomplete };
}
