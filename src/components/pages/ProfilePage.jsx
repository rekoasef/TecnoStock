// src/components/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
// Importar funciones de Firebase necesarias
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js"; // Añadido serverTimestamp
import { updateProfile } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const ProfilePage = ({ currentUser, auth, db }) => { 
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState(''); 
    const [photoURL, setPhotoURL] = useState('');
    const [company, setCompany] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState('');
    const [phone, setPhone] = useState('');
    // Añade aquí más estados para los campos de tu lista: birthDate, etc.
    // Ejemplo: const [birthDate, setBirthDate] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [initialProfileData, setInitialProfileData] = useState({}); // Para resetear al cancelar

    useEffect(() => {
        if (currentUser) {
            const initialData = {
                displayName: currentUser.displayName || '',
                email: currentUser.email || '',
                photoURL: currentUser.photoURL || '',
                company: '',
                address: '',
                location: '',
                phone: '',
                // birthDate: '', // Inicializar otros campos
            };
            
            setDisplayName(initialData.displayName);
            setEmail(initialData.email);
            setPhotoURL(initialData.photoURL);

            const fetchProfileData = async () => {
                if (!db || !currentUser.uid) return;
                setIsLoading(true);
                try {
                    const profileDocRef = doc(db, `users/${currentUser.uid}/profile`, 'data');
                    const docSnap = await getDoc(profileDocRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setCompany(data.company || '');
                        setAddress(data.address || '');
                        setLocation(data.location || '');
                        setPhone(data.phone || '');
                        // setBirthDate(data.birthDate || ''); // Cargar otros campos
                        
                        // Guardar los datos iniciales para poder cancelar la edición
                        setInitialProfileData({
                            ...initialData, // Datos de auth
                            company: data.company || '', // Datos de Firestore
                            address: data.address || '',
                            location: data.location || '',
                            phone: data.phone || '',
                            // birthDate: data.birthDate || '',
                        });
                        console.log("Datos adicionales del perfil cargados:", data);
                    } else {
                        console.log("No existen datos adicionales de perfil para este usuario.");
                        setInitialProfileData(initialData); // Guardar datos iniciales de auth si no hay de Firestore
                    }
                } catch (error) {
                    console.error("Error al cargar datos adicionales del perfil:", error);
                    // Aquí podrías usar tu modal genérico si lo pasaras como prop
                    alert("Error al cargar datos del perfil: " + error.message);
                    setInitialProfileData(initialData); // En caso de error, resetear a datos de auth
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProfileData();
        }
    }, [currentUser, db]);

    const handleEditToggle = () => {
        if (isEditing) { 
            // Si se cancela la edición, restaurar los valores iniciales
            setDisplayName(initialProfileData.displayName || '');
            setPhotoURL(initialProfileData.photoURL || '');
            setCompany(initialProfileData.company || '');
            setAddress(initialProfileData.address || '');
            setLocation(initialProfileData.location || '');
            setPhone(initialProfileData.phone || '');
            setBirthDate(initialProfileData.birthDate || '');
        }
        setIsEditing(!isEditing);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!currentUser || !auth || !db) {
            alert("Error: Usuario no autenticado o configuración de base de datos no disponible.");
            return;
        }
        setIsLoading(true);
        try {
            // 1. Actualizar perfil de Firebase Authentication (displayName, photoURL)
            if (auth.currentUser) { // Siempre verifica que auth.currentUser exista
                await updateProfile(auth.currentUser, { 
                    displayName: displayName.trim(), 
                    photoURL: photoURL.trim() 
                });
                console.log("Perfil de Firebase Auth actualizado.");
                // Opcional: Actualizar el estado currentUser en App.jsx si es necesario, 
                // aunque onAuthStateChanged debería eventualmente reflejar estos cambios.
            }

            // 2. Guardar/Actualizar datos personalizados en Firestore
            const profileDataToSave = {
                // No guardamos email aquí, ya que es parte de Auth y no se edita usualmente.
                // displayName y photoURL ya se guardan en Auth, pero puedes guardarlos también en Firestore
                // si quieres tener una única fuente de verdad para todos los datos del perfil.
                // Por ahora, solo guardaremos los campos personalizados.
                company: company.trim(),
                address: address.trim(),
                location: location.trim(),
                phone: phone.trim(),
                // birthDate: birthDate, // Guardar otros campos
                lastUpdated: serverTimestamp() // Usar serverTimestamp de Firestore
            };
            const profileDocRef = doc(db, `users/${currentUser.uid}/profile`, 'data'); // Ruta sugerida
            await setDoc(profileDocRef, profileDataToSave, { merge: true }); 
            
            // Actualizar initialProfileData con los nuevos datos guardados
            setInitialProfileData({
                displayName: displayName.trim(),
                email: email, // El email no cambia
                photoURL: photoURL.trim(),
                company: company.trim(),
                address: address.trim(),
                location: location.trim(),
                phone: phone.trim(),
                // birthDate: birthDate,
            });

            alert('Perfil actualizado con éxito.'); // Reemplazar con tu modal genérico
            setIsEditing(false);

        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
            alert('Error al actualizar el perfil: ' + error.message); // Reemplazar con tu modal
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !isEditing && !company && !address) { // Muestra cargando solo la primera vez
        return <div className="content-section"><p>Cargando perfil...</p></div>;
    }

    if (!currentUser) {
        return <div className="content-section"><p>Por favor, inicia sesión para ver tu perfil.</p></div>;
    }

    return (
        <section id="profile-page" className="content-section">
            <h2>Mi Perfil</h2>
            <div className="profile-container card-style">
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="displayName">Nombre a Mostrar:</label>
                            <input type="text" id="displayName" className="form-control" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isLoading} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Correo Electrónico (no editable):</label>
                            <input type="email" id="email" className="form-control" value={email} readOnly />
                        </div>
                        <div className="form-group">
                            <label htmlFor="photoURL">URL de Foto de Perfil:</label>
                            <input type="text" id="photoURL" className="form-control" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" disabled={isLoading} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="company">Empresa:</label>
                            <input type="text" id="company" className="form-control" value={company} onChange={(e) => setCompany(e.target.value)} disabled={isLoading} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="address">Dirección:</label>
                            <input type="text" id="address" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} disabled={isLoading} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="location">Localidad:</label>
                            <input type="text" id="location" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} disabled={isLoading} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Teléfono:</label>
                            <input type="tel" id="phone" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading} />
                        </div>
                        {/* <div className="form-group">
                            <label htmlFor="birthDate">Fecha de Nacimiento:</label>
                            <input type="date" id="birthDate" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={isLoading} />
                        </div>
                        */}
                        <div className="profile-actions">
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={handleEditToggle} disabled={isLoading}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-view">
                        {photoURL ? (
                            <img src={photoURL} onError={(e) => e.target.style.display='none'} alt="Foto de perfil" style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem', border: '3px solid var(--border-color)'}}/>
                        ) : (
                            <div style={{width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--secondary-card-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '3rem', color: 'var(--text-muted)'}}>
                                👤
                            </div>
                        )}
                        <p><strong>Nombre a Mostrar:</strong> {displayName || 'No especificado'}</p>
                        <p><strong>Correo Electrónico:</strong> {email}</p>
                        <p><strong>UID:</strong> {currentUser.uid}</p>
                        <p><strong>Empresa:</strong> {company || 'No especificado'}</p>
                        <p><strong>Dirección:</strong> {address || 'No especificado'}</p>
                        <p><strong>Localidad:</strong> {location || 'No especificado'}</p>
                        <p><strong>Teléfono:</strong> {phone || 'No especificado'}</p>
                        {/* <p><strong>Fecha de Nacimiento:</strong> {birthDate || 'No especificado'}</p> */}
                        
                        <div className="profile-actions">
                            <button onClick={handleEditToggle} className="btn btn-primary">
                                Editar Perfil
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProfilePage;
