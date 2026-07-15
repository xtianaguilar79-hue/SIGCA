"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const menu = ["Inicio", "Mis cursos", "Rutas de aprendizaje", "Certificados", "Logros", "Biblioteca", "Calendario", "Foros", "Noticias", "Recursos", "Contacto"];
const icons = ["⌂", "▤", "⇄", "◎", "✪", "□", "▣", "♧", "▧", "◇", "✉"];
const courses = [
  { title: "Negociación Colectiva y Estrategia Sindical", tag: "Formación sindical", image: "/images/negociacion.jpg", modules: 6, duration: "4h 30m", progress: 75, color: "#e4a91b" },
  { title: "Higiene y Seguridad en la Actividad Minera", tag: "Seguridad y salud", image: "/images/seguridad.jpg", modules: 8, duration: "5h 20m", progress: 60, color: "#6ca33a" },
  { title: "Convenios Colectivos de Trabajo Minero", tag: "Marco legal", image: "/images/legal.jpg", modules: 5, duration: "3h 10m", progress: 40, color: "#8e5aa7" },
  { title: "Liderazgo, Comunicación y Conducción Gremial", tag: "Liderazgo sindical", image: "/images/liderazgo.jpg", modules: 6, duration: "4h 15m", progress: 80, color: "#e96925" },
];
const routes = [
  { title: "Minería Extractiva", copy: "Formación integral para la actividad minera metalífera a cielo abierto y subterránea.", image: "/images/extractiva.jpg", count: 12 },
  { title: "Cal y Piedra", copy: "Para dirigentes y delegados de canteras, plantas de cal y empresas afines.", image: "/images/cal.jpg", count: 8 },
  { title: "Molienda de Minerales", copy: "Procesamiento, plantas y control de calidad en la industria minera.", image: "/images/molienda.jpg", count: 7 },
  { title: "Cemento", copy: "Formación para la industria cementera y sus procesos productivos.", image: "/images/cemento.jpg", count: 6 },
];

export default function Home() {
  const [active, setActive] = useState("Inicio");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const filtered = useMemo(() => courses.filter((c) => c.title.toLowerCase().includes(query.toLowerCase())), [query]);
  return <main className="app-shell">
    <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">☰</button>
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <button className="close-menu" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">×</button>
      <div className="brand"><Image src="/images/logo-aoma.png" alt="AOMA" width={132} height={132} priority /><h1>ACADEMIA<br/>AOMA</h1><strong>FORMACIÓN SINDICAL</strong><span>PARA DIRIGENTES Y DELEGADOS</span></div>
      <nav>{menu.map((item, i) => <button key={item} className={active === item ? "active" : ""} onClick={() => {setActive(item);setMobileOpen(false)}}><i>{icons[i]}</i>{item}</button>)}</nav>
      <blockquote><b>“</b>La organización<br/>nos fortalece.<br/>El conocimiento<br/>nos hace libres.<strong>AOMA PRESENTE</strong></blockquote>
    </aside>
    {mobileOpen && <button className="backdrop" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"/>}

    <section className="workspace">
      <header className="topbar"><label><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar cursos, documentos, temas..." aria-label="Buscar"/></label><div className="top-actions"><button aria-label="Notificaciones">♧<b>3</b></button><button aria-label="Mensajes">✉<b>2</b></button><div className="avatar">CA</div><div><strong>Cristian Aguilar</strong><small>Secretario de Higiene y Seguridad</small></div><span>⌄</span></div></header>
      <section className="hero"><Image src="/images/hero.jpg" alt="Dirigentes reunidos frente a un proyecto minero" fill priority sizes="(max-width: 800px) 100vw, 70vw"/><div className="hero-shade"/><div className="hero-copy"><strong>ACADEMIA AOMA</strong><h2>LIDERAZGO SINDICAL<br/>PARA TRANSFORMAR<br/>EL PRESENTE</h2><p>Herramientas, conocimientos y espacios de formación para una representación sindical sólida, moderna y comprometida con los trabajadores.</p><button>Explorar cursos <span>›</span></button></div><div className="hero-values"><span>♙ <b>Formación especializada</b><small>para dirigentes y delegados</small></span><span>⚖ <b>Conocimiento</b><small>para defender derechos</small></span><span>♧ <b>Intercambio</b><small>y construcción colectiva</small></span><span>⬡ <b>Fortalecimiento sindical</b><small>para el futuro</small></span></div></section>
      <section className="content"><div className="section-title"><h3>{query ? "RESULTADOS" : "CURSOS DESTACADOS"}</h3><button>Ver todos los cursos →</button></div><div className="course-grid">{filtered.map(c => <article className="course-card" key={c.title}><div className="course-photo"><Image src={c.image} alt="" fill sizes="300px"/><span style={{background:c.color}}>{c.tag}</span></div><div className="course-body"><h4>{c.title}</h4><p>Herramientas concretas y contenidos aplicados al trabajo sindical cotidiano.</p><small>▣ {c.modules} módulos　◷ {c.duration}</small><div className="progress"><i><b style={{width:`${c.progress}%`,background:c.color}}/></i><span>{c.progress}%</span></div></div></article>)}</div>
      <div className="section-title routes-title"><h3>RUTAS DE APRENDIZAJE</h3><button>Ver todas las rutas →</button></div><div className="route-grid">{routes.map(r => <article key={r.title}><Image src={r.image} alt="" fill sizes="300px"/><div/><h4>{r.title}</h4><p>{r.copy}</p><span>{r.count} cursos</span></article>)}</div></section>
    </section>

    <aside className="rightbar"><section className="profile-mobile"><div className="avatar">CA</div><div><b>Cristian Aguilar</b><small>Secretario de Higiene y Seguridad</small></div></section><section className="progress-panel"><h3>MI PROGRESO</h3><div className="progress-layout"><div className="ring"><b>68%</b><span>Completado</span></div><dl><dt>12</dt><dd>Cursos en progreso</dd><dt>28</dt><dd>Cursos completados</dd><dt>156</dt><dd>Horas de formación</dd></dl></div><button>⌁　Ir a mi panel</button></section><section><div className="panel-title"><h3>PRÓXIMOS EVENTOS</h3><button>Ver calendario →</button></div><div className="event"><b>22<small>MAY</small></b><p><strong>Webinar en vivo</strong>Reforma Laboral y su impacto en el movimiento sindical<small>◷ 18:00 hs</small></p></div><div className="event"><b>29<small>MAY</small></b><p><strong>Encuentro Regional de Delegados – San Juan</strong><small>◷ 09:00 hs</small></p></div></section><section><div className="panel-title"><h3>LOGROS RECIENTES</h3><button>Ver todos →</button></div>{["Negociador Estratégico","Compromiso Sindical","Liderazgo en Acción","Formación Continua"].map((x,i)=><div className="achievement" key={x}><i>{["♞","✪","♙","♜"][i]}</i><p><b>{x}</b><small>{["Completaste Negociación Colectiva","Finalizaste 5 cursos","Participaste en tu primer foro","Completaste 10 horas de formación"][i]}</small></p></div>)}<button className="outline-button">♕　Ver todos mis logros</button></section></aside>
  </main>;
}
