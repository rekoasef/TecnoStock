// src/components/pages/ProductsPage.jsx
import React from 'react';
import ProductRow from './ProductRow'; 

const ProductsPage = ({ 
    onOpenAddProductModal, 
    categories, 
    products, 
    isLoading, 
    formatTimestamp,
    onEditProduct,    
    onDeleteProduct,  
    onViewDetails,
    // Props para filtros
    searchTerm,
    setSearchTerm,
    selectedCategoryFilter,
    setSelectedCategoryFilter
}) => { 

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleCategoryFilterChange = (event) => {
        setSelectedCategoryFilter(event.target.value);
    };

    return (
        <section id="products-section" className="content-section">
            <h2>Gestión de Productos</h2>
            <div className="product-actions">
                <button 
                    id="open-add-product-modal-btn" 
                    className="btn btn-success" 
                    // --- CORRECCIÓN AQUÍ ---
                    // Envolvemos la llamada en una función de flecha para asegurar
                    // que onOpenAddProductModal se llama sin argumentos (o con null por defecto en App.jsx)
                    onClick={() => onOpenAddProductModal()} 
                >
                    ⊕ Nuevo Producto
                </button>
            </div>
            <div className="toolbar">
                <input 
                    type="text" 
                    id="product-search-input" 
                    className="form-control" 
                    placeholder="Buscar por nombre..." 
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <select 
                    id="product-category-filter" 
                    className="form-control"
                    value={selectedCategoryFilter}
                    onChange={handleCategoryFilterChange}
                >
                    <option value="">Todas las categorías</option>
                    {categories && categories.map(cat => (
                        <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                </select>
            </div>
            <hr style={{ margin: '20px 0', borderColor: 'var(--border-color)' }} />
            <h3>Listado de Productos</h3>
            <div className="table-responsive">
                <table id="products-table" className="table">
                    <thead>
                        <tr>
                            <th>Imagen</th><th>Nombre</th><th>Categoría</th>
                            <th>P. Costo</th><th>P. Venta</th><th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="products-table-body">
                        {isLoading && (
                            <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Cargando productos...</td></tr>
                        )}
                        {!isLoading && products && products.length > 0 && products.map(product => (
                            <ProductRow 
                                key={product.id} 
                                product={product} 
                                formatTimestamp={formatTimestamp}
                                onEditProduct={onEditProduct}      
                                onDeleteProduct={onDeleteProduct}  
                                onViewDetails={onViewDetails}      
                            />
                        ))}
                        {!isLoading && (!products || products.length === 0) && (
                            <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>
                                {searchTerm || selectedCategoryFilter ? "No hay productos que coincidan con los filtros." : "No hay productos para mostrar. Agrega uno nuevo."}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};
export default ProductsPage;
