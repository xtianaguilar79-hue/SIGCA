"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // La aplicación continúa funcionando normalmente si el registro falla.
      });
    }
  }, []);

  return null;
}

