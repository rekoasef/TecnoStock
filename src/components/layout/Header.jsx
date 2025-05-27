// src/components/layout/Header.jsx
import React from 'react';

const Header = ({ onToggleTheme, currentTheme }) => {
    return (
        <header>
            <h1>Tecno Gestor</h1>
            <div className="user-info">
                <button id="theme-toggle-button" title="Cambiar tema" onClick={onToggleTheme}>
                    {currentTheme === 'dark' ? '☀️' : '🌙'}
                </button>
            </div>
        </header>
    );
};
export default Header;