// src/components/modals/AddCategoryModal.jsx
import React, { useState } from 'react';

const AddCategoryModal = ({ isOpen, onClose, onSaveCategory }) => { // Recibe onSaveCategory
    const [categoryName, setCategoryName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (categoryName.trim() === "") {
            alert("El nombre de la categoría no puede estar vacío."); // Podrías usar tu modal genérico aquí también
            return;
        }
        // Llama a la función onSaveCategory pasada por props
        await onSaveCategory(categoryName.trim(), () => {
            setCategoryName(''); // Limpiar input
            onClose(); // Cierra el modal después de enviar
        });
    };

    return (
        <div id="add-category-modal" className="modal" style={{ display: 'block' }}>
            <div className="modal-content modal-sm">
                <div className="modal-header">
                    <h3>Agregar Nueva Categoría</h3>
                    <span className="close-button" onClick={onClose}>&times;</span>
                </div>
                <form id="add-category-form" style={{ marginTop: '20px' }} onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="new-category-name">Nombre de la Categoría</label>
                        <input 
                            type="text" 
                            id="new-category-name" 
                            required 
                            className="form-control" 
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                        />
                    </div>
                    <div id="modal-actions" style={{ marginTop: '20px' }}> 
                        <button type="button" id="cancel-add-category-btn" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-success">Guardar Categoría</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default AddCategoryModal;