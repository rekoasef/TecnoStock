// src/components/pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterPage = ({ onRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            // Idealmente, esta alerta se manejaría con tu modal genérico `showGenericMessageModal`
            // que está en App.jsx. Para eso, necesitarías pasar esa función como prop
            // o usar un contexto. Por ahora, un alert simple funciona.
            alert("Las contraseñas no coinciden.");
            return;
        }
        if (password.length < 6) {
             alert("La contraseña debe tener al menos 6 caracteres.");
             return;
        }

        setIsLoading(true);
        const success = await onRegister(email, password);
        setIsLoading(false);
        if (success) {
            // App.jsx mostrará un mensaje de "Registro Exitoso"
            // y luego el usuario puede ir a la página de login.
            navigate('/login'); 
        }
        // Si no fue exitoso, App.jsx ya habrá mostrado un modal de error.
    };

    return (
        <section id="register-section" className="content-section auth-page">
            <div className="auth-container">
                <h2>Crear Cuenta</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="register-email">Correo Electrónico</label>
                        <input
                            type="email"
                            id="register-email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="register-password">Contraseña</label>
                        <input
                            type="password"
                            id="register-password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6" // Firebase requiere al menos 6 caracteres
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="register-confirm-password">Confirmar Contraseña</label>
                        <input
                            type="password"
                            id="register-confirm-password"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength="6"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                        {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                    </button>
                </form>
                 <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    ¿Ya tienes una cuenta? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Inicia sesión aquí</a>
                </p>
            </div>
        </section>
    );
};

export default RegisterPage;