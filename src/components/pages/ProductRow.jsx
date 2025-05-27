// src/components/pages/ProductRow.jsx
import React from 'react';

// Asegúrate de que 'product' tenga un 'id'
const ProductRow = ({ product, formatTimestamp, onEditProduct, onDeleteProduct, onViewDetails }) => {
    const handleEdit = () => {
        console.log("Editando producto:", product);
        if (onEditProduct) {
            onEditProduct(product); // Llama a la función pasada por props con el producto completo
        }
    };

    const handleDelete = () => {
        console.log("Eliminando producto:", product.name);
        if (onDeleteProduct) {
            onDeleteProduct(product.id, product.name);
        }
    };
    
    const handleViewDetails = () => {
        console.log("Viendo detalles de:", product.name);
        if (onViewDetails) {
            onViewDetails(product);
        }
    };


    return (
        <tr>
            <td>
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="product-image-thumbnail" />
                ) : (
                    <div className="product-image-thumbnail placeholder-image" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        backgroundColor: '#ccc', color: '#fff', fontSize: '10px', textAlign: 'center',
                        width: '50px', height: '50px' 
                    }}>
                        Sin Imagen
                    </div>
                )}
            </td>
            <td>
                <a href="#" onClick={(e) => { e.preventDefault(); handleViewDetails(); }} className="product-name-link">
                    {product.name || 'N/A'}
                </a>
            </td>
            <td>{product.category || 'N/A'}</td>
            <td>{product.costPrice ? `${product.costPrice} ${product.costCurrency || ''}` : 'N/A'}</td>
            <td>{product.salePrice ? `${product.salePrice} ${product.saleCurrency || ''}` : 'N/A'}</td>
            <td>{product.currentStock !== undefined ? product.currentStock : 'N/A'}</td>
            <td>
                <button onClick={handleEdit} className="btn btn-sm btn-warning" style={{marginRight: '5px'}}>Editar</button>
                <button onClick={handleDelete} className="btn btn-sm btn-danger">Eliminar</button>
            </td>
        </tr>
    );
};

export default ProductRow;