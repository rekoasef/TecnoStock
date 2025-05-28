// src/components/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        const success = await onLogin(email, password);
        setIsLoading(false);
        if (success) {
            // App.jsx se encargará de la redirección a través de onAuthStateChanged y las rutas
            // El estado currentUser en App.jsx cambiará y las rutas condicionales harán la redirección.
            console.log('Login exitoso, esperando redirección centralizada...');
            // No es necesario navigate('/dashboard') aquí si App.jsx maneja la redirección globalmente.
        }
    };

    return (
        <section id="login-section" className="content-section auth-page">
            <div className="auth-container">
                <h2>Iniciar Sesión</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="login-email">Correo Electrónico</label>
                        <input
                            type="email"
                            id="login-email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="login-password">Contraseña</label>
                        <input
                            type="password"
                            id="login-password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                        {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    ¿No tienes una cuenta? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Regístrate aquí</a>
                </p>
            </div>
        </section>
    );
};

export default LoginPage;