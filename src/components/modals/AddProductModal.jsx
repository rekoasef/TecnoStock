// src/components/modals/AddProductModal.jsx
import React, { useState, useEffect } from 'react';

const AddProductModal = ({
    isOpen,
    onClose,
    onOpenAddCategoryModal,
    categories,
    onSaveProduct,
    productToEdit,
    CLOUDINARY_UPLOAD_URL,  // Prop para la URL de subida
    CLOUDINARY_UPLOAD_PRESET // Prop para el preset de subida
}) => {
    const [productName, setProductName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [productDetail, setProductDetail] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [costCurrency, setCostCurrency] = useState('ARS');
    const [salePrice, setSalePrice] = useState('');
    const [saleCurrency, setSaleCurrency] = useState('ARS');
    const [currentStock, setCurrentStock] = useState('');
    const [idCode, setIdCode] = useState('');
    const [imageFile, setImageFile] = useState(null); // Estado para el archivo de imagen
    const [imagePreview, setImagePreview] = useState(''); // Estado para la URL de la vista previa
    const [isUploading, setIsUploading] = useState(false);
    const [initialStockType, setInitialStockType] = useState('compra');

    useEffect(() => {
        if (isOpen) {
            if (productToEdit && typeof productToEdit === 'object' && productToEdit.id) {
                console.log("Modal abierto en modo EDICIÓN con producto:", productToEdit);
                setProductName(productToEdit.name || '');
                setSelectedCategory(productToEdit.category || '');
                setProductDetail(productToEdit.productDetail || '');
                setCostPrice(productToEdit.costPrice || '');
                setCostCurrency(productToEdit.costCurrency || 'ARS');
                setSalePrice(productToEdit.salePrice || '');
                setSaleCurrency(productToEdit.saleCurrency || 'ARS');
                setCurrentStock(productToEdit.currentStock !== undefined ? productToEdit.currentStock.toString() : '');
                setIdCode(productToEdit.idCode || '');
                setImageFile(null); // Resetear archivo al abrir
                setImagePreview(productToEdit.imageUrl || ''); // Mostrar imagen existente si la hay
            } else {
                console.log("Modal abierto en modo AGREGAR");
                setProductName('');
                setSelectedCategory('');
                setProductDetail('');
                setCostPrice('');
                setCostCurrency('ARS');
                setSalePrice('');
                setSaleCurrency('ARS');
                setCurrentStock('');
                setIdCode('');
                setImageFile(null);
                setImagePreview('');
                setInitialStockType('compra');
            }
            setIsUploading(false);
        }
    }, [isOpen, productToEdit]);


    if (!isOpen) return null;

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        console.log('Archivo seleccionado en handleImageChange:', file); // <--- LOG AÑADIDO
        if (file) {
            setImageFile(file); // Guardar el archivo en el estado
            setImagePreview(URL.createObjectURL(file)); // Crear URL para vista previa
            console.log('imageFile establecido, vista previa generada.'); // <--- LOG AÑADIDO
        } else {
            setImageFile(null);
            // Si no se selecciona archivo nuevo y se está editando, mantener la imagen previa si existe
            setImagePreview(productToEdit?.imageUrl || '');
            console.log('No se seleccionó archivo o se canceló. imageFile reseteado.'); // <--- LOG AÑADIDO
        }
    };

    const handleRemoveImage = () => {
        console.log("Eliminando imagen (vista previa y archivo a subir)");
        setImageFile(null); // Eliminar el archivo del estado
        setImagePreview('');  // Limpiar la vista previa
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log("AddProductForm handleSubmit CALLED. Editando:", !!(productToEdit && productToEdit.id));

        if (!productName || !selectedCategory || !costPrice || !salePrice || currentStock === '') {
            alert("Por favor, completa todos los campos obligatorios: Nombre, Categoría, Precios y Stock.");
            return;
        }

        setIsUploading(true);
        let finalImageUrl = productToEdit?.imageUrl || ''; // Mantener imagen existente si no se cambia/elimina

        // Logs de diagnóstico para Cloudinary props y estado de imageFile
        console.log('Estado de imageFile antes de intentar subir:', imageFile); // <--- LOG AÑADIDO
        console.log('Valor de CLOUDINARY_UPLOAD_PRESET en modal:', CLOUDINARY_UPLOAD_PRESET); // <--- LOG AÑADIDO
        console.log('Valor de CLOUDINARY_UPLOAD_URL en modal:', CLOUDINARY_UPLOAD_URL); // <--- LOG AÑADIDO

        if (imageFile) { // Si hay un nuevo archivo para subir
            console.log("Intentando subir nueva imagen a Cloudinary...");
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            try {
                const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
                const data = await response.json();
                if (response.ok && data.secure_url) {
                    finalImageUrl = data.secure_url;
                    console.log("Nueva imagen subida a Cloudinary:", finalImageUrl);
                } else {
                    // Si la respuesta no es OK o no hay secure_url, lanzar un error con el mensaje de Cloudinary si existe
                    throw new Error(data.error?.message || 'Error desconocido al subir la imagen a Cloudinary');
                }
            } catch (error) {
                console.error("Error de Cloudinary:", error);
                alert(`Error al subir la imagen: ${error.message}`);
                setIsUploading(false);
                return; // Detener el guardado si la subida de imagen falla
            }
        } else if (imagePreview === '' && productToEdit?.imageUrl) {
            // Si no hay imageFile nuevo, pero la vista previa se limpió (y había una imagen antes),
            // significa que el usuario quiere eliminar la imagen existente.
            finalImageUrl = '';
            console.log("Imagen marcada para eliminación (URL vacía).");
        }
        // Si no hay imageFile Y imagePreview no está vacía (o sea, se mantiene la imagen original de productToEdit),
        // finalImageUrl ya tiene el valor correcto de productToEdit.imageUrl.

        const productData = {
            name: productName,
            category: selectedCategory,
            productDetail,
            costPrice: parseFloat(costPrice),
            costCurrency,
            salePrice: parseFloat(salePrice),
            saleCurrency,
            currentStock: parseInt(currentStock),
            idCode,
            imageUrl: finalImageUrl, // URL de Cloudinary o vacía si se eliminó
        };
        
        const isEditing = productToEdit && typeof productToEdit === 'object' && productToEdit.id;

        if (!isEditing) { 
            productData.initialStock = parseInt(currentStock);
            // Solo añadir initialStockType si hay stock inicial
            if (parseInt(currentStock) > 0) {
                productData.initialStockType = initialStockType;
            }
        }
        
        await onSaveProduct(productData, () => {
             onClose(); 
        });
        setIsUploading(false);
    };

    const modalTitle = (productToEdit && productToEdit.id) ? "Modificar Producto" : "Agregar Nuevo Producto";
    const saveButtonText = (productToEdit && productToEdit.id) ? "Guardar Cambios" : "Guardar Producto";
    const isNewProductMode = !(productToEdit && productToEdit.id);

    return (
        <div id="add-product-modal" className="modal" style={{ display: 'block' }}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3 id="product-modal-title">{modalTitle}</h3>
                    <span className="close-button" onClick={onClose}>&times;</span>
                </div>
                <form id="add-product-form" style={{ marginTop: '20px' }} onSubmit={handleSubmit}>
                    {/* Nombre del Producto */}
                    <div className="form-group">
                        <label htmlFor="product-name">Nombre del Producto</label>
                        <input type="text" id="product-name" className="form-control" required 
                               value={productName} onChange={(e) => setProductName(e.target.value)} />
                    </div>
                    {/* Categoría */}
                    <div className="form-group form-group-category">
                        <label htmlFor="product-category-select">Categoría</label>
                        <select id="product-category-select" className="form-control" required
                                value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                            <option value="">Seleccione una categoría...</option>
                            {categories && categories.map(cat => (
                                <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <button type="button" className="btn btn-add-category" title="Agregar nueva categoría" onClick={onOpenAddCategoryModal}>+</button>
                    </div>
                    {/* Detalle del Producto */}
                    <div className="form-group">
                        <label htmlFor="product-detail">Detalle del Producto</label>
                        <textarea id="product-detail" className="form-control" rows="3"
                                  value={productDetail} onChange={(e) => setProductDetail(e.target.value)}></textarea>
                    </div>
                    {/* Precio de Costo */}
                    <div className="form-group form-group-inline">
                        <div>
                            <label htmlFor="product-cost-price">Precio de Costo</label>
                            <input type="number" id="product-cost-price" className="form-control" step="0.01" min="0" required
                                   value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
                        </div>
                        <select id="product-cost-currency" className="form-control"
                                value={costCurrency} onChange={(e) => setCostCurrency(e.target.value)}>
                            <option value="ARS">ARS</option><option value="USD">USD</option>
                        </select>
                    </div>
                    {/* Precio de Venta */}
                    <div className="form-group form-group-inline">
                        <div>
                            <label htmlFor="product-sale-price">Precio de Venta</label>
                            <input type="number" id="product-sale-price" className="form-control" step="0.01" min="0" required
                                   value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
                        </div>
                        <select id="product-sale-currency" className="form-control"
                                value={saleCurrency} onChange={(e) => setSaleCurrency(e.target.value)}>
                            <option value="ARS">ARS</option><option value="USD">USD</option>
                        </select>
                    </div>
                    {/* Cantidad en Stock */}
                    <div className="form-group">
                        <label htmlFor="product-current-stock">Cantidad en Stock</label>
                        <input type="number" id="product-current-stock" className="form-control" step="1" min="0" required
                               value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} />
                    </div>
                    {/* Tipo de Ingreso Inicial (solo para nuevos productos con stock) */}
                    {isNewProductMode && parseInt(currentStock) > 0 && (
                        <div className="form-group">
                            <label htmlFor="initial-stock-type">Tipo de Ingreso Inicial:</label>
                            <select 
                                id="initial-stock-type" 
                                className="form-control" 
                                value={initialStockType} 
                                onChange={(e) => setInitialStockType(e.target.value)}
                            >
                                <option value="compra">Compra de Mercadería</option>
                                <option value="devolucion_cliente">Devolución de Cliente</option>
                                <option value="ajuste_entrada">Ingreso Inicial / Ajuste de Inventario</option>
                            </select>
                        </div>
                    )}
                    {/* Código ID Propio */}
                     <div className="form-group">
                        <label htmlFor="product-id-code">Código ID Propio (Opcional)</label>
                        <input type="text" id="product-id-code" className="form-control" 
                               value={idCode} onChange={(e) => setIdCode(e.target.value)} />
                    </div>
                    {/* Imagen del Producto */}
                    <div className="form-group">
                        <label htmlFor="product-image">Imagen del Producto</label>
                        <input type="file" id="product-image" className="form-control" accept="image/*" onChange={handleImageChange} />
                        {imagePreview && (
                            <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                                <img src={imagePreview} alt="Vista previa" style={{maxWidth: '150px', maxHeight: '150px', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)'}}/>
                                <button 
                                    type="button" 
                                    onClick={handleRemoveImage}
                                    title="Eliminar imagen actual"
                                    style={{ 
                                        position: 'absolute', top: '2px', right: '2px', 
                                        background: 'rgba(239, 68, 68, 0.7)', color: 'white', 
                                        border: '1px solid rgba(220, 38, 38, 0.9)', borderRadius: '50%', 
                                        width: '22px', height: '22px', fontSize: '13px', 
                                        lineHeight: '20px', textAlign: 'center',
                                        cursor: 'pointer', padding: '0',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                    </div>
                    {/* Botón de Guardar */}
                    <button type="submit" id="save-product-btn" className="btn btn-success" style={{ marginTop: '20px' }} disabled={isUploading}>
                        {isUploading ? 'Guardando...' : saveButtonText}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default AddProductModal;
