// src/components/layout/Nav.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const Nav = () => {
    return (
        <nav id="main-nav">
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>Dashboard</NavLink>
            <NavLink to="/products" className={({ isActive }) => isActive ? "active" : ""}>Productos</NavLink>
            <NavLink to="/stock-movements" className={({ isActive }) => isActive ? "active" : ""}>Mov. Stock</NavLink> {/* NUEVO */}
            <NavLink to="/finances" className={({ isActive }) => isActive ? "active" : ""}>Finanzas</NavLink>
        </nav>
    );
};
export default Nav;