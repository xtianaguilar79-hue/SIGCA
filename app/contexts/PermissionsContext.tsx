"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// Definimos un tipo simple para los módulos y acciones
// Lo ajustaremos según las claves reales de la tabla usuarios_permisos_sistema
type ModuloPermitido =
  | 'afiliados'
  | 'beneficios'
  | 'empresas'
  | 'configuracion'
  | 'reportes'
  | 'actas_minutas'
  | 'reclamos'
  | 'visitas_inspecciones'
  | 'formacion'
  | 'biblioteca';
  // Agrega otros módulos según aparezcan en usuarios_permisos_sistema

type AccionPermitida = 'ver' | 'modificar';

type PermissionsContextType = {
  hasPermission: (modulo: ModuloPermitido, accion: AccionPermitida) => boolean;
  // Añadiremos refreshPermissions y otros estados cuando conectemos con Supabase
};

// Creamos el contexto con un valor por defecto vacío (esto no debería usarse directamente)
const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Proveedor del contexto
export function PermissionsProvider({ children, permissions = [] }: { children: ReactNode; permissions?: Array<{ modulo: ModuloPermitido; accion: AccionPermitida }> }) {
  const hasPermission = (modulo: ModuloPermitido, accion: AccionPermitida): boolean => {
    return permissions.some((permission) => permission.modulo === modulo && permission.accion === accion);
  };

  const value = {
    hasPermission,
    // refreshPermissions: () => {}, // Lo añadiremos después
    // loading: false, // Lo añadiremos después
    // error: null, // Lo añadiremos después
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Hook para usar el contexto
export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
