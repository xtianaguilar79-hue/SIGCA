"use client";

import { useMemo, useState } from "react";

const nav = [
  ["Inicio", "⌂"], ["Afiliaciones", "▤"], ["Gestión institucional", "◇"],
  ["Organización", "▦"], ["Academia AOMA", "◫"], ["Documentación", "▱"],
  ["Informes", "◒"], ["Administración", "⚙"],
];

const tasks = [
  { title: "Revisar solicitud de acceso", meta: "Minera Andina · Solicitado hoy", tag: "Acceso", tone: "gold" },
  { title: "Aprobar ficha de afiliación", meta: "Randstad Argentina · Hace 2 h", tag: "Afiliación", tone: "blue" },
  { title: "Completar acta de reunión", meta: "Proyecto Josemaría · Vence mañana", tag: "Acta", tone: "orange" },
];

const commitments = [
  ["Entrega de elementos de protección", "Veladero", "18 jul", "En curso"],
  ["Respuesta sobre turnos rotativos", "Gualcamayo", "20 jul", "Pendiente"],
  ["Revisión del protocolo de ingreso", "Josemaría", "22 jul", "En curso"],
];

export default function Home() {
  const [active, setActive] = useState("Inicio");
  const [role, setRole] = useState("Administrador general");
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const visibleTasks = useMemo(() => tasks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())), [query]);

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src="/images/logo-aoma.png" alt="Logo de AOMA" />
          <div><strong>AOMA</strong><span>Seccional San Juan</span></div>
        </div>
        <nav aria-label="Navegación principal">
          {nav.map(([label, icon]) => (
            <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => { setActive(label); announce(`${label}: módulo preparado para la próxima etapa`); }}>
              <span aria-hidden="true">{icon}</span>{label}
              {label === "Afiliaciones" && <b>7</b>}
            </button>
          ))}
        </nav>
        <div className="security-card">
          <span>● CONEXIÓN SEGURA</span>
          <p>Los accesos y acciones sensibles quedan registrados.</p>
        </div>
        <div className="profile">
          <div className="avatar">MS</div>
          <div><strong>María S. Rojas</strong><span>{role}</span></div>
          <button aria-label="Opciones de perfil">⋯</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar en SIGCA" placeholder="Buscar en SIGCA..." /><kbd>⌘ K</kbd></div>
          <div className="top-actions">
            <label className="role-select">Vista <select value={role} onChange={(e) => setRole(e.target.value)}><option>Administrador general</option><option>Delegado</option><option>Revisor</option></select></label>
            <button aria-label="Ayuda">?</button><button className="bell" aria-label="Notificaciones">♢<i>3</i></button>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div><p className="eyebrow">MIÉRCOLES, 15 DE JULIO</p><h1>Buenos días, María</h1><p>Este es el estado institucional de AOMA Seccional San Juan.</p></div>
            <button className="primary" onClick={() => announce("Se creó un nuevo borrador institucional")}>＋ Crear nuevo</button>
          </div>

          <section className="metrics" aria-label="Indicadores principales">
            <article><div className="metric-icon blue">▤</div><div><span>Solicitudes pendientes</span><strong>12</strong><small><b>+3</b> desde ayer</small></div></article>
            <article><div className="metric-icon orange">◷</div><div><span>Compromisos próximos</span><strong>8</strong><small>3 vencen esta semana</small></div></article>
            <article><div className="metric-icon teal">◫</div><div><span>Cursos en progreso</span><strong>24</strong><small>68% avance promedio</small></div></article>
            <article><div className="metric-icon gold">⌁</div><div><span>Biblioteca institucional</span><strong>12</strong><small>Leyes y convenios recuperados</small></div></article>
          </section>

          <div className="main-grid">
            <section className="panel tasks-panel">
              <div className="panel-head"><div><h2>Tareas que requieren atención</h2><p>Priorizadas por vencimiento y nivel de acceso.</p></div><button onClick={() => announce("Mostrando todas las tareas")}>Ver todas →</button></div>
              <div className="task-list">
                {visibleTasks.map((task) => <button className="task" key={task.title} onClick={() => announce(`Abriendo: ${task.title}`)}><span className={`dot ${task.tone}`}></span><div><strong>{task.title}</strong><small>{task.meta}</small></div><em className={task.tone}>{task.tag}</em><span>›</span></button>)}
                {visibleTasks.length === 0 && <p className="empty">No hay tareas que coincidan con la búsqueda.</p>}
              </div>
            </section>

            <section className="panel calendar-panel">
              <div className="panel-head"><div><h2>Agenda próxima</h2><p>Julio de 2026</p></div><button aria-label="Abrir calendario">▦</button></div>
              <div className="agenda-item"><time><b>16</b>JUL</time><div><strong>Reunión Comisión Directiva</strong><span>09:30 · Sede central</span></div></div>
              <div className="agenda-item"><time><b>18</b>JUL</time><div><strong>Inspección de seguridad</strong><span>11:00 · Proyecto Veladero</span></div></div>
              <div className="agenda-item"><time><b>21</b>JUL</time><div><strong>Capacitación delegados</strong><span>17:00 · Aula virtual</span></div></div>
              <button className="calendar-link" onClick={() => announce("Calendario institucional abierto")}>Abrir calendario completo</button>
            </section>
          </div>

          <section className="panel commitments-panel">
            <div className="panel-head"><div><h2>Compromisos activos</h2><p>Seguimiento de acuerdos institucionales.</p></div><button onClick={() => announce("Mostrando todos los compromisos")}>Ver todos →</button></div>
            <div className="commit-table" role="table">
              <div className="tr th" role="row"><span>COMPROMISO</span><span>EMPRESA / PROYECTO</span><span>VENCIMIENTO</span><span>ESTADO</span><span></span></div>
              {commitments.map((row) => <button className="tr" role="row" key={row[0]} onClick={() => announce(`Abriendo compromiso: ${row[0]}`)}>{row.map((cell, i) => <span key={cell} className={i === 3 ? "status" : ""}>{cell}</span>)}<span>›</span></button>)}
            </div>
          </section>
        </div>
      </section>
      {notice && <div className="toast" role="status">✓ {notice}</div>}
    </main>
  );
}
