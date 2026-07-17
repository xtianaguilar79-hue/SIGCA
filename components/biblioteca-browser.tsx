"use client";
import Link from "next/link";
import {useMemo,useState} from "react";

type DocumentoResumen={id:string;tipo:"ley"|"convenio";numero:string;titulo:string;categoria:string;resumen:string;palabrasClave:string[]};
const normalizar=(valor:string)=>valor.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();

export function BibliotecaBrowser({documentos}:{documentos:DocumentoResumen[]}){
 const[consulta,setConsulta]=useState("");const[tipo,setTipo]=useState<"todos"|"ley"|"convenio">("todos");
 const visibles=useMemo(()=>{const termino=normalizar(consulta.trim());return documentos.filter(documento=>{const coincideTipo=tipo==="todos"||documento.tipo===tipo;const texto=normalizar([documento.numero,documento.titulo,documento.categoria,documento.resumen,...documento.palabrasClave].join(" "));return coincideTipo&&(!termino||texto.includes(termino))})},[consulta,documentos,tipo]);
 return <><section className="library-tools" aria-label="Buscar y filtrar documentos"><label><span>Buscar en la Biblioteca</span><input value={consulta} onChange={event=>setConsulta(event.target.value)} placeholder="Ejemplo: higiene, riesgos, CCT 38..." type="search"/></label><div className="library-filters" role="group" aria-label="Filtrar por tipo"><button className={tipo==="todos"?"selected":""} onClick={()=>setTipo("todos")} type="button">Todos</button><button className={tipo==="ley"?"selected":""} onClick={()=>setTipo("ley")} type="button">Leyes</button><button className={tipo==="convenio"?"selected":""} onClick={()=>setTipo("convenio")} type="button">Convenios</button></div></section><div className="library-result-count" aria-live="polite">{visibles.length} {visibles.length===1?"documento encontrado":"documentos encontrados"}</div>{visibles.length?<section className="library-grid">{visibles.map(documento=><Link className="library-card" href={`/gestion/biblioteca/${documento.id}`} key={documento.id}><div className={`library-cover ${documento.tipo}`}><span>{documento.tipo==="ley"?"LEY":"CCT"}</span><strong>{documento.numero}</strong></div><div className="library-card-copy"><small>{documento.categoria}</small><h2>{documento.titulo}</h2><p>{documento.resumen}</p><b>Consultar documento →</b></div></Link>)}</section>:<div className="library-empty"><h2>No encontramos coincidencias</h2><p>Probá con otra palabra o elegí otro tipo de documento.</p></div>}</>;
}
