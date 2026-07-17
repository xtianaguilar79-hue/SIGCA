import lct20744 from "@/data/biblioteca/leyes/lct-20744.json";
import ley19587 from "@/data/biblioteca/leyes/ley-19587.json";
import ley23551 from "@/data/biblioteca/leyes/ley-23551.json";
import ley24013 from "@/data/biblioteca/leyes/ley-24013.json";
import ley24557 from "@/data/biblioteca/leyes/ley-24557.json";
import cct3689 from "@/data/biblioteca/convenios/cct-36-89.json";
import cct3789 from "@/data/biblioteca/convenios/cct-37-89.json";
import cct3889 from "@/data/biblioteca/convenios/cct-38-89.json";
import cct5489 from "@/data/biblioteca/convenios/cct-54-89.json";
import cctGualcamayo from "@/data/biblioteca/convenios/cct-gualcamayo.json";
import cctVeladero from "@/data/biblioteca/convenios/cct-veladero.json";
import cctVicuna from "@/data/biblioteca/convenios/cct-vicuna.json";

export type DocumentoBiblioteca = { id:string; tipo:"ley"|"convenio"; numero:string; titulo:string; categoria:string; resumen:string; palabrasClave:string[]; contenidoHtml:string; ambito?:unknown; partes?:unknown };

export const documentosBiblioteca = [lct20744,ley19587,ley23551,ley24013,ley24557,cct3689,cct3789,cct3889,cct5489,cctGualcamayo,cctVeladero,cctVicuna] as DocumentoBiblioteca[];

export function buscarDocumento(id:string){return documentosBiblioteca.find(documento=>documento.id===id)}
