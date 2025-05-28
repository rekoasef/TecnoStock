// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Componente ProtectedRoute para proteger rutas basadas en el estado de autenticación del usuario.
 * Si no hay un usuario autenticado, redirige a la ruta especificada (por defecto '/login').
 * Si hay un usuario autenticado, renderiza el componente hijo (a través de Outlet).
 *
 * @param {object} props - Las props del componente.
 * @param {object|null} props.currentUser - El objeto del usuario actual o null si no está autenticado.
 * @param {string} [props.redirectPath='/login'] - La ruta a la que redirigir si el usuario no está autenticado.
 * @returns {JSX.Element} El componente Navigate para redirigir o el Outlet para renderizar la ruta protegida.
 */
const ProtectedRoute = ({ currentUser, redirectPath = '/login' }) => {
  // Verifica si el usuario actual no está definido (no autenticado)
  if (!currentUser) {
    // Log para depuración: indica que se está redirigiendo
    console.log('ProtectedRoute: Usuario no autenticado. Redirigiendo a:', redirectPath);
    // Redirige al usuario a la ruta especificada (ej. página de login)
    // 'replace' evita que la ruta actual se guarde en el historial de navegación
    return <Navigate to={redirectPath} replace />;
  }

  // Si hay un usuario autenticado, renderiza el componente hijo correspondiente a la ruta protegida.
  // Outlet es un componente de react-router-dom v6 que renderiza el contenido de la ruta anidada.
  return <Outlet />;
};

export default ProtectedRoute;
