// src/components/pages/StockMovementsPage.jsx
import React, { useState, useEffect } from 'react';

const StockMovementsPage = ({
    products,
    onRegisterStockMovement,
    stockMovements,
    isLoadingMovements,
    formatTimestamp
}) => {
    // Estados para el formulario de registro de egresos
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [movementType, setMovementType] = useState('venta'); // Tipo de movimiento por defecto: venta
    const [notes, setNotes] = useState('');

    // Efecto para asegurar que el tipo de movimiento sea válido (aunque aquí siempre empieza como 'venta')
    useEffect(() => {
        const egresoTypes = ['venta', 'devolucion_proveedor', 'ajuste_salida', 'merma'];
        if (!egresoTypes.includes(movementType)) {
            setMovementType('venta'); // Resetea a 'venta' si no es un tipo de egreso válido
        }
    }, []); // Se ejecuta solo una vez al montar

    // Manejador para enviar el formulario de registro de egreso
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

        // Prepara los datos del movimiento para enviar a App.jsx
        const movementData = {
            productId: selectedProductId,
            productName: product.name,
            quantity: parsedQuantity, // Cantidad siempre positiva, App.jsx maneja el signo
            type: movementType, // Tipo de egreso
            notes: notes.trim(),
        };
        
        // Llama a la función de App.jsx para registrar el movimiento
        onRegisterStockMovement(movementData, () => {
            // Limpia el formulario después de un registro exitoso
            setSelectedProductId('');
            setQuantity('');
            setMovementType('venta'); // Resetea al tipo por defecto
            setNotes('');
        });
    };

    // Devuelve el nombre legible del tipo de movimiento de stock
    const getMovementTypeDisplay = (type) => {
        switch (type) {
            case 'venta': return 'Venta (Egreso)';
            case 'compra': return 'Compra/Ingreso (Ingreso)';
            case 'devolucion_cliente': return 'Devolución Cliente (Ingreso)';
            case 'devolucion_proveedor': return 'Devolución Proveedor (Egreso)';
            case 'ajuste_entrada': return 'Ajuste (Ingreso)';
            case 'ajuste_salida': return 'Ajuste (Egreso)';
            case 'merma': return 'Merma/Pérdida (Egreso)';
            default: return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Desconocido';
        }
    };


    return (
        <section id="stock-movements-section" className="content-section">
            <h2>Registro de Egresos de Stock y Historial</h2>

            {/* Contenedor del formulario de registro de egresos */}
            <div className="form-container" style={{
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: 'var(--secondary-card-background)',
                borderRadius: 'var(--border-radius)',
                boxShadow: 'var(--box-shadow)'
            }}>
                <h3>Registrar Nuevo Egreso de Stock</h3>
                <form id="stock-movement-form" onSubmit={handleSubmit}>
                    {/* Selección de producto */}
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

                    {/* Selección de tipo de egreso */}
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

                    {/* Campo de cantidad */}
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

                    {/* Campo de notas */}
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

            {/* Tabla del historial de movimientos */}
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
                            <th>Usuario</th> {/* Nueva columna para el usuario */}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Muestra mensaje de carga */}
                        {isLoadingMovements && (
                            <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Cargando movimientos...</td></tr>
                        )}
                        {/* Mapea y muestra los movimientos de stock */}
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
                                {/* Muestra el nombre visible del usuario o su email como fallback */}
                                <td>{move.userDisplayName || move.userEmail || 'N/A'}</td>
                            </tr>
                        ))}
                        {/* Muestra mensaje si no hay movimientos */}
                        {!isLoadingMovements && (!stockMovements || stockMovements.length === 0) && (
                            <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No hay movimientos de stock registrados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default StockMovementsPage;
