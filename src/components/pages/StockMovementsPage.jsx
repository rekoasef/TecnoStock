// src/components/pages/StockMovementsPage.jsx
import React, { useState, useEffect } from 'react';

const StockMovementsPage = ({ 
    products, 
    onRegisterStockMovement, 
    stockMovements, 
    isLoadingMovements, 
    formatTimestamp 
}) => {
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    // --- MODIFICADO: Tipo de movimiento por defecto a 'venta' (egreso) ---
    const [movementType, setMovementType] = useState('venta'); 
    const [notes, setNotes] = useState('');

    // Efecto para resetear el tipo de movimiento si las opciones cambian
    // y la actual ya no es válida (aunque en este caso siempre será 'venta' al inicio)
    useEffect(() => {
        // Opciones de egreso
        const egresoTypes = ['venta', 'devolucion_proveedor', 'ajuste_salida', 'merma'];
        if (!egresoTypes.includes(movementType)) {
            setMovementType('venta'); // Si por alguna razón no es un egreso válido, resetear a 'venta'
        }
    }, []); // Se ejecuta una vez al montar

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedProductId || quantity === '' || !movementType) {
            alert("Por favor, selecciona un producto, ingresa una cantidad y un tipo de movimiento de egreso.");
            return;
        }
        const product = products.find(p => p.id === selectedProductId);
        if (!product) {
            alert("Producto seleccionado no válido.");
            return;
        }

        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            alert("La cantidad debe ser un número positivo. El tipo de movimiento determinará el egreso.");
            return;
        }

        const movementData = {
            productId: selectedProductId,
            productName: product.name, 
            quantity: parsedQuantity, // Siempre positivo, la lógica de signo va en App.jsx
            type: movementType, // Será un tipo de egreso
            notes: notes.trim(),
        };
        
        onRegisterStockMovement(movementData, () => {
            setSelectedProductId('');
            setQuantity('');
            setMovementType('venta'); // Resetear al tipo por defecto ('venta')
            setNotes('');
        });
    };

    // Función para mostrar el nombre legible del tipo de movimiento (se mantiene igual)
    const getMovementTypeDisplay = (type) => {
        switch (type) {
            case 'venta': return 'Venta (Egreso)';
            case 'compra': return 'Compra/Ingreso (Ingreso)'; // Se mantiene por si hay datos históricos
            case 'devolucion_cliente': return 'Devolución Cliente (Ingreso)'; // Se mantiene por si hay datos históricos
            case 'devolucion_proveedor': return 'Devolución Proveedor (Egreso)';
            case 'ajuste_entrada': return 'Ajuste (Ingreso)'; // Se mantiene por si hay datos históricos
            case 'ajuste_salida': return 'Ajuste (Egreso)';
            case 'merma': return 'Merma/Pérdida (Egreso)';
            default: return type;
        }
    };


    return (
        <section id="stock-movements-section" className="content-section">
            <h2>Registro de Egresos de Stock y Historial</h2>

            <div className="form-container" style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                backgroundColor: 'var(--secondary-card-background)', 
                borderRadius: 'var(--border-radius)', 
                boxShadow: 'var(--box-shadow)' 
            }}>
                <h3>Registrar Nuevo Egreso de Stock</h3>
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

                    {/* --- MODIFICADO: Select solo con opciones de EGRESO --- */}
                    <div className="form-group">
                        <label htmlFor="movement-type-stock">Tipo de Egreso:</label>
                        <select 
                            id="movement-type-stock" 
                            className="form-control" 
                            value={movementType} 
                            onChange={(e) => setMovementType(e.target.value)}
                            required
                        >
                            <option value="venta">Venta (Egreso)</option>
                            <option value="devolucion_proveedor">Devolución a Proveedor (Egreso)</option>
                            <option value="ajuste_salida">Ajuste de Inventario (Egreso)</option>
                            <option value="merma">Merma/Pérdida (Egreso)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="quantity-stock">Cantidad (Unidades a Egresar):</label>
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
                        <small>Ingrese siempre una cantidad positiva. El tipo de movimiento ya indica que es un egreso.</small>
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
                    <button type="submit" className="btn btn-success">Registrar Egreso</button>
                </form>
            </div>

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
