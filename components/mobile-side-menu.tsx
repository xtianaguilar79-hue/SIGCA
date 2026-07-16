"use client";
import { useEffect, useState } from "react";
export function MobileSideMenu(){const[open,setOpen]=useState(false);useEffect(()=>{document.documentElement.classList.toggle("mobile-menu-open",open);return()=>document.documentElement.classList.remove("mobile-menu-open")},[open]);return <><button className="mobile-menu-button" type="button" aria-label={open?"Cerrar menú":"Abrir menú"} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?"×":"☰"}</button>{open&&<button className="mobile-menu-backdrop" type="button" aria-label="Cerrar menú" onClick={()=>setOpen(false)}/>}</>}
