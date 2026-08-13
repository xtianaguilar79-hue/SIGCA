"use client";
import { useEffect, useState } from "react";

type Theme = "light"|"dark";
export function ThemeToggle(){
  const[theme,setTheme]=useState<Theme>("light");
  useEffect(()=>{const saved=localStorage.getItem("sigca-theme") as Theme|null;const initial=saved||(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");setTheme(initial);document.documentElement.dataset.theme=initial},[]);
  function toggle(){const next=theme==="light"?"dark":"light";setTheme(next);document.documentElement.dataset.theme=next;localStorage.setItem("sigca-theme",next)}
  return <button type="button" className="theme-toggle" onClick={toggle} aria-label={theme==="light"?"Activar modo oscuro":"Activar modo claro"}><span aria-hidden="true">{theme==="light"?"☾":"☀"}</span><b>{theme==="light"?"Modo oscuro":"Modo claro"}</b></button>;
}
