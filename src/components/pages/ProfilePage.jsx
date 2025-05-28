// src/components/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js"; 
import { updateProfile } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const ProfilePage = ({ 
    currentUser, 
    auth, 
    db, 
    canvasAppId, 
    showMessageModal,
    cloudinaryUploadUrl,      // Prop para la URL de subida de Cloudinary
    cloudinaryUploadPreset    // Prop para el preset de subida de Cloudinary
}) => {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState(''); 
    const [currentPhotoURL, setCurrentPhotoURL] = useState(''); // URL de la foto actual (de Auth o Cloudinary)
    
    const [company, setCompany] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState('');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');

    // Estados para la nueva imagen de perfil
    const [profileImageFile, setProfileImageFile] = useState(null); // El archivo de imagen seleccionado
    const [profileImagePreview, setProfileImagePreview] = useState(''); // URL para la vista previa local

    const [isLoading, setIsLoading] = useState(true); 
    const [isEditing, setIsEditing] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false); // Estado para la subida de imagen
    const [initialProfileData, setInitialProfileData] = useState({});

    useEffect(() => {
        if (currentUser) {
            const authData = {
                displayName: currentUser.displayName || '',
                email: currentUser.email || '',
                photoURL: currentUser.photoURL || '',
            };
            
            setDisplayName(authData.displayName);
            setEmail(authData.email);
            setCurrentPhotoURL(authData.photoURL); 
            setProfileImagePreview(authData.photoURL); // Vista previa inicial es la foto actual

            const fetchProfileData = async () => {
                if (!db || !currentUser.uid || !canvasAppId) { 
                    setIsLoading(false); 
                    setInitialProfileData(authData); // Establecer datos iniciales solo con Auth si falta algo
                    return; 
                }
                // No es necesario setIsLoading(true) aquí si ya está en true por defecto al inicio del componente
                try {
                    const profileDocRef = doc(db, `artifacts/${canvasAppId}/users/${currentUser.uid}/profile`, 'data');
                    const docSnap = await getDoc(profileDocRef);
                    let firestoreData = {};
                    if (docSnap.exists()) {
                        firestoreData = docSnap.data();
                        setCompany(firestoreData.company || ''); setAddress(firestoreData.address || '');
                        setLocation(firestoreData.location || ''); setPhone(firestoreData.phone || '');
                        setBirthDate(firestoreData.birthDate || ''); 
                    } else {
                        setCompany(''); setAddress(''); setLocation(''); setPhone(''); setBirthDate('');
                    }
                    setInitialProfileData({ ...authData, ...firestoreData });
                } catch (error) {
                    console.error("Error al cargar datos adicionales del perfil:", error);
                    if (showMessageModal) showMessageModal("Error", `Error al cargar datos del perfil: ${error.message}`);
                    else alert(`Error al cargar datos del perfil: ${error.message}`);
                    setInitialProfileData(authData); 
                } finally { 
                    setIsLoading(false); 
                }
            };
            fetchProfileData();
        } else {
            setIsLoading(false);
        }
    }, [currentUser, db, canvasAppId, showMessageModal]);

    const handleProfileImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setProfileImageFile(file);
            setProfileImagePreview(URL.createObjectURL(file)); 
        } else { // Si el usuario cancela la selección de archivo
            setProfileImageFile(null);
            setProfileImagePreview(currentPhotoURL); // Volver a la imagen actual si la hay
        }
    };
    
    const handleRemoveProfileImage = () => {
        setProfileImageFile(null);    
        setProfileImagePreview('');   // Limpiar la vista previa indica que se quiere borrar
    };

    const handleEditToggle = () => {
        if (isEditing) { 
            setDisplayName(initialProfileData.displayName || '');
            setCurrentPhotoURL(initialProfileData.photoURL || ''); 
            setProfileImagePreview(initialProfileData.photoURL || ''); 
            setProfileImageFile(null); 
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
        if (!currentUser || !auth || !db || !canvasAppId) { 
            if (showMessageModal) showMessageModal("Error", "Usuario no autenticado o configuración no disponible.");
            else alert("Error: Usuario no autenticado o configuración no disponible.");
            return; 
        }
        
        setIsLoading(true);
        setIsUploadingImage(profileImageFile ? true : false); // Indicar subida de imagen si hay archivo

        let finalPhotoURL = currentPhotoURL; // Empezar con la URL actual

        try {
            // 1. Si hay un nuevo archivo de imagen, subirlo a Cloudinary
            if (profileImageFile) {
                console.log("Subiendo nueva imagen de perfil a Cloudinary...");
                const formData = new FormData();
                formData.append('file', profileImageFile);
                formData.append('upload_preset', cloudinaryUploadPreset);

                const response = await fetch(cloudinaryUploadUrl, { method: 'POST', body: formData });
                const data = await response.json();
                setIsUploadingImage(false); // Terminar estado de subida de imagen

                if (response.ok && data.secure_url) {
                    finalPhotoURL = data.secure_url;
                    console.log("Nueva imagen de perfil subida:", finalPhotoURL);
                } else {
                    throw new Error(data.error?.message || 'Error al subir la imagen de perfil a Cloudinary');
                }
            } else if (profileImagePreview === '' && currentPhotoURL !== '') {
                // Si no hay archivo nuevo, la vista previa está vacía, pero había una URL antes,
                // significa que el usuario quiere eliminar la foto.
                finalPhotoURL = ''; 
                console.log("Imagen de perfil marcada para eliminación.");
            }

            // 2. Actualizar perfil de Firebase Authentication (displayName, photoURL)
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { 
                    displayName: displayName.trim(), 
                    photoURL: finalPhotoURL 
                });
                console.log("Perfil de Firebase Auth actualizado con photoURL:", finalPhotoURL);
                setCurrentPhotoURL(finalPhotoURL); 
            }

            // 3. Guardar/Actualizar datos personalizados en Firestore
            const profileDataToSave = {
                company: company.trim(), address: address.trim(), location: location.trim(),
                phone: phone.trim(), birthDate: birthDate, 
                // Opcional: puedes guardar finalPhotoURL también en Firestore
                // photoURL: finalPhotoURL, 
                lastUpdated: serverTimestamp()
            };
            const profileDocRef = doc(db, `artifacts/${canvasAppId}/users/${currentUser.uid}/profile`, 'data');
            await setDoc(profileDocRef, profileDataToSave, { merge: true }); 
            
            setInitialProfileData({ 
                displayName: displayName.trim(), email: email, photoURL: finalPhotoURL,
                company: company.trim(), address: address.trim(), location: location.trim(),
                phone: phone.trim(), birthDate: birthDate,
            });

            if (showMessageModal) showMessageModal('Éxito', 'Perfil actualizado con éxito.');
            else alert('Perfil actualizado con éxito.');
            setIsEditing(false);
            setProfileImageFile(null); // Limpiar el archivo después de subir/procesar

        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
            setIsUploadingImage(false);
            if (showMessageModal) showMessageModal('Error', `Error al actualizar el perfil: ${error.message}`);
            else alert(`Error al actualizar el perfil: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && Object.keys(initialProfileData).length === 0 && !isEditing) { 
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
                            <label htmlFor="profileImageFile">Foto de Perfil:</label>
                            {profileImagePreview && (
                                <div style={{ marginBottom: '10px', textAlign:'center' }}>
                                    <img src={profileImagePreview} alt="Vista previa de perfil" style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)'}}/>
                                </div>
                            )}
                            <input 
                                type="file" 
                                id="profileImageFile" 
                                className="form-control" 
                                accept="image/*" 
                                onChange={handleProfileImageChange} 
                                disabled={isLoading || isUploadingImage} 
                            />
                            {currentPhotoURL && profileImagePreview && ( // Mostrar solo si hay una imagen actual y una vista previa (que podría ser la misma o una nueva)
                                <button 
                                    type="button" 
                                    className="btn btn-sm btn-danger" 
                                    style={{marginTop: '10px', width: 'auto'}} 
                                    onClick={handleRemoveProfileImage} 
                                    disabled={isLoading || isUploadingImage}
                                >
                                    Eliminar foto actual
                                </button>
                            )}
                        </div>
                        
                        <div className="form-group"><label htmlFor="displayName">Nombre a Mostrar:</label><input type="text" id="displayName" className="form-control" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isLoading || isUploadingImage} /></div>
                        <div className="form-group"><label htmlFor="email">Correo (no editable):</label><input type="email" id="email" className="form-control" value={email} readOnly /></div>
                        
                        <div className="form-group"><label htmlFor="company">Empresa:</label><input type="text" id="company" className="form-control" value={company} onChange={(e) => setCompany(e.target.value)} disabled={isLoading || isUploadingImage} /></div>
                        <div className="form-group"><label htmlFor="address">Dirección:</label><input type="text" id="address" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} disabled={isLoading || isUploadingImage} /></div>
                        <div className="form-group"><label htmlFor="location">Localidad:</label><input type="text" id="location" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} disabled={isLoading || isUploadingImage} /></div>
                        <div className="form-group"><label htmlFor="phone">Teléfono:</label><input type="tel" id="phone" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading || isUploadingImage} /></div>
                        <div className="form-group">
                            <label htmlFor="birthDate">Fecha de Nacimiento:</label>
                            <input type="date" id="birthDate" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={isLoading || isUploadingImage} />
                        </div>
                        <div className="profile-actions">
                            <button type="submit" className="btn btn-primary" disabled={isLoading || isUploadingImage}>
                                {isUploadingImage ? 'Subiendo imagen...' : (isLoading ? 'Guardando...' : 'Guardar Cambios')}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={handleEditToggle} disabled={isLoading || isUploadingImage}>Cancelar</button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-view" style={{textAlign: 'center'}}> {/* Centrar contenido en modo vista */}
                        {currentPhotoURL ? (
                            <img src={currentPhotoURL} onError={(e) => { e.target.onerror = null; e.target.style.display='none';}} alt="Foto de perfil" style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem', border: '3px solid var(--border-color)'}}/>
                        ) : (
                            <div style={{width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--secondary-card-background)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '3rem', color: 'var(--text-muted)'}}>👤</div>
                        )}
                        <p><strong>Nombre a Mostrar:</strong> {displayName || 'No especificado'}</p>
                        <p><strong>Correo Electrónico:</strong> {email}</p>
                        <p><strong>UID:</strong> {currentUser.uid}</p>
                        <p><strong>Empresa:</strong> {company || 'No especificado'}</p>
                        <p><strong>Dirección:</strong> {address || 'No especificado'}</p>
                        <p><strong>Localidad:</strong> {location || 'No especificado'}</p>
                        <p><strong>Teléfono:</strong> {phone || 'No especificado'}</p>
                        <p><strong>Fecha de Nacimiento:</strong> {birthDate || 'No especificado'}</p>
                        <div className="profile-actions" style={{justifyContent: 'center'}}> {/* Centrar botón de editar */}
                            <button onClick={handleEditToggle} className="btn btn-primary">Editar Perfil</button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProfilePage;
