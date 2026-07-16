"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function MobileSideMenu(){
  const[open,setOpen]=useState(false);

  useEffect(()=>{
    document.documentElement.classList.toggle("mobile-menu-open",open);
    return()=>document.documentElement.classList.remove("mobile-menu-open");
  },[open]);

  useEffect(()=>{
    function closeAfterSelection(event:MouseEvent){
      const target=event.target as Element|null;
      if(target?.closest(".side nav a")||target?.closest(".side .sign-out")||target?.closest(".home-brand-link")) setOpen(false);
    }
    document.addEventListener("click",closeAfterSelection);
    return()=>document.removeEventListener("click",closeAfterSelection);
  },[]);

  return <>
    <Link className="home-brand-link" href="/gestion" aria-label="Ir al inicio de SIGCA"><span>Ir al inicio</span></Link>
    <button className="mobile-menu-button" type="button" aria-label={open?"Cerrar menú":"Abrir menú"} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?"×":"☰"}</button>
    {open&&<button className="mobile-menu-backdrop" type="button" aria-label="Cerrar menú" onClick={()=>setOpen(false)}/>} 
  </>;
}
