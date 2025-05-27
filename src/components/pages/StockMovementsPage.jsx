// src/components/pages/StockMovementsPage.jsx
import React, { useState } from 'react';

const StockMovementsPage = ({ 
    products, 
    onRegisterStockMovement, 
    stockMovements, 
    isLoadingMovements, 
    formatTimestamp 
}) => {
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    // Tipos de movimiento: el valor será lo que se guarde en Firestore.
    // El texto es lo que ve el usuario.
    const [movementType, setMovementType] = useState('venta'); 
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedProductId || quantity === '' || !movementType) {
            alert("Por favor, selecciona un producto, ingresa una cantidad y un tipo de movimiento."); // Reemplazar con showGenericMessageModal desde App.jsx si se pasa como prop
            return;
        }
        const product = products.find(p => p.id === selectedProductId);
        if (!product) {
            alert("Producto seleccionado no válido.");
            return;
        }

        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) { // La cantidad siempre debe ser positiva aquí
            alert("La cantidad debe ser un número positivo. El tipo de movimiento determinará si es ingreso o egreso.");
            return;
        }

        const movementData = {
            productId: selectedProductId,
            productName: product.name, 
            quantity: parsedQuantity, // Siempre positivo, la lógica de signo va en App.jsx
            type: movementType,
            notes: notes.trim(),
        };
        
        // Llamar a la función pasada por props para registrar el movimiento
        onRegisterStockMovement(movementData, () => {
            // Callback para limpiar el formulario después de un registro exitoso
            setSelectedProductId('');
            setQuantity('');
            setMovementType('venta'); // Resetear al tipo por defecto
            setNotes('');
        });
    };

    const getMovementTypeDisplay = (type) => {
        switch (type) {
            case 'venta': return 'Venta (Egreso)';
            case 'compra': return 'Compra/Ingreso (Ingreso)';
            case 'devolucion_cliente': return 'Devolución Cliente (Ingreso)';
            case 'devolucion_proveedor': return 'Devolución Proveedor (Egreso)';
            case 'ajuste_entrada': return 'Ajuste (Ingreso)';
            case 'ajuste_salida': return 'Ajuste (Egreso)';
            case 'merma': return 'Merma/Pérdida (Egreso)';
            default: return type;
        }
    };


    return (
        <section id="stock-movements-section" className="content-section">
            <h2>Registro y Historial de Movimientos de Stock</h2>

            {/* Formulario para Registrar Nuevo Movimiento */}
            <div className="form-container" style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                backgroundColor: 'var(--secondary-card-background)', 
                borderRadius: 'var(--border-radius)', 
                boxShadow: 'var(--box-shadow)' 
            }}>
                <h3>Registrar Nuevo Movimiento</h3>
                <form id="stock-movement-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="product-select-stock">Producto:</label>
                        <select 
                            id="product-select-stock" 
                            className="form-control" 
                            value={selectedProductId} 
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            required
                        >
                            <option value="">Seleccione un producto...</option>
                            {products && products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name} (Stock actual: {product.currentStock !== undefined ? product.currentStock : 'N/A'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="movement-type-stock">Tipo de Movimiento:</label>
                        <select 
                            id="movement-type-stock" 
                            className="form-control" 
                            value={movementType} 
                            onChange={(e) => setMovementType(e.target.value)}
                            required
                        >
                            <option value="venta">Venta (Egreso)</option>
                            <option value="compra">Compra/Ingreso Producción (Ingreso)</option>
                            <option value="devolucion_cliente">Devolución de Cliente (Ingreso)</option>
                            <option value="devolucion_proveedor">Devolución a Proveedor (Egreso)</option>
                            <option value="ajuste_entrada">Ajuste de Inventario (Ingreso)</option>
                            <option value="ajuste_salida">Ajuste de Inventario (Egreso)</option>
                            <option value="merma">Merma/Pérdida (Egreso)</option>
                            {/* Considerar si "Otro" necesita una lógica especial */}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="quantity-stock">Cantidad (Unidades):</label>
                        <input 
                            type="number" 
                            id="quantity-stock" 
                            className="form-control" 
                            value={quantity} 
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Ej: 5"
                            required 
                            min="1" 
                        />
                        <small>Ingrese siempre una cantidad positiva. El "Tipo de Movimiento" determina si es un ingreso o un egreso.</small>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="notes-stock">Notas (Opcional):</label>
                        <textarea 
                            id="notes-stock" 
                            className="form-control" 
                            rows="2"
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)}
                        ></textarea>
                    </div>
                    <button type="submit" className="btn btn-success">Registrar Movimiento</button>
                </form>
            </div>

            {/* Historial de Movimientos de Stock */}
            <h3>Historial de Movimientos</h3>
            <div className="table-responsive">
                <table id="stock-movements-table" className="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Producto</th>
                            <th>Tipo</th>
                            <th>Cantidad Modificada</th>
                            <th>Stock Resultante</th>
                            <th>Notas</th>
                            {/* <th>Usuario</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingMovements && (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Cargando movimientos...</td></tr>
                        )}
                        {!isLoadingMovements && stockMovements && stockMovements.length > 0 && stockMovements.map(move => (
                            <tr key={move.id}>
                                <td>{move.timestamp ? formatTimestamp(move.timestamp) : 'N/A'}</td>
                                <td>{move.productName || 'N/A'}</td>
                                <td>{getMovementTypeDisplay(move.type)}</td>
                                <td style={{ color: move.quantityChange > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                    {move.quantityChange > 0 ? `+${move.quantityChange}` : move.quantityChange}
                                </td>
                                <td>{move.stockAfter !== undefined ? move.stockAfter : 'N/A'}</td>
                                <td title={move.notes}>{move.notes ? move.notes.substring(0, 30) + (move.notes.length > 30 ? '...' : '') : '-'}</td>
                            </tr>
                        ))}
                        {!isLoadingMovements && (!stockMovements || stockMovements.length === 0) && (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No hay movimientos de stock registrados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default StockMovementsPage;