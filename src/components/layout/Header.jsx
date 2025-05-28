// src/components/layout/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ currentUser, onLogout, onToggleTheme, currentTheme }) => {
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null); 

    const handleLogoutClick = async () => {
        setIsProfileMenuOpen(false); 
        await onLogout();
    };

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };
        if (isProfileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    const profileDisplay = currentUser?.photoURL ? (
        <img src={currentUser.photoURL} alt="Perfil" className="profile-image-display" />
    ) : (
        <span className="profile-icon-display" role="img" aria-label="profile">👤</span>
    );

    return (
        <header id="app-header">
            <div className="header-title">
                <h1>Tecno Gestor</h1>
            </div>
            <div className="header-controls">
                {currentUser && (
                    <div className="profile-section" ref={profileMenuRef}>
                        <button 
                            onClick={toggleProfileMenu} 
                            className="profile-button" 
                            title="Menú de perfil"
                            aria-expanded={isProfileMenuOpen}
                            aria-haspopup="true"
                        >
                            {profileDisplay}
                        </button>
                        {isProfileMenuOpen && (
                            <div className="profile-menu">
                                <div className="profile-menu-header">
                                    <p>Conectado como:</p>
                                    <p><strong>{currentUser.displayName || currentUser.email}</strong></p>
                                </div>
                                <button 
                                    onClick={() => { 
                                        navigate('/profile'); // --- MODIFICADO AQUÍ ---
                                        setIsProfileMenuOpen(false); 
                                    }}
                                    className="profile-menu-item"
                                >
                                    Mi Perfil
                                </button>
                                <button 
                                    onClick={handleLogoutClick} 
                                    className="profile-menu-item logout"
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                )}
                <button 
                    id="theme-toggle-button" 
                    title="Cambiar tema" 
                    onClick={onToggleTheme}
                >
                    {currentTheme === 'dark' ? '☀️' : '🌙'}
                </button>
            </div>
        </header>
    );
};

export default Header;
