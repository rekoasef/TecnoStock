// src/App.jsx
// Script Version: v1.0.15 (Movimiento de Stock Completo)
import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORTACIONES DE FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, where, getDocs, 
    onSnapshot, orderBy, serverTimestamp, doc, updateDoc, deleteDoc,
    runTransaction 
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
// import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js"; // Para cuando implementemos login


// --- IMPORTACIONES DE COMPONENTES ---
import Header from './components/layout/Header';
import Nav from './components/layout/Nav';
import Footer from './components/layout/Footer';
import DashboardPage from './components/pages/DashboardPage';
import ProductsPage from './components/pages/ProductsPage';
import FinancesPage from './components/pages/FinancesPage';
import StockMovementsPage from './components/pages/StockMovementsPage';
import AddProductModal from './components/modals/AddProductModal';
import AddCategoryModal from './components/modals/AddCategoryModal';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyA3h18FkkRo6V4i6bsHDof2s5NOeiQJUiE",
    authDomain: "tecnostorage-8342a.firebaseapp.com",
    projectId: "tecnostorage-8342a",
    storageBucket: "tecnostorage-8342a.firebasestorage.app",
    messagingSenderId: "231093419794",
    appId: "1:231093419794:web:cb6af0ac205083be433dcb",
    measurementId: "G-FQNFW01KTF" 
};
const canvasAppId = 'default-app-id'; 

const CLOUDINARY_CLOUD_NAME = 'dgqbwrgot';
const CLOUDINARY_UPLOAD_PRESET = 'gestor_productos_unsigned';

// --- INICIALIZACIÓN DE FIREBASE ---
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp); 
// const auth = getAuth(fbApp); 
console.log("Firebase App and Firestore DB initialized in App.jsx");

function AppContent() {
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', text: '', isOpen: false, actions: [] });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]); 
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [stockMovements, setStockMovements] = useState([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(true);

  // Efecto para ocultar el loader HTML inicial
  useEffect(() => {
    const loaderElement = document.getElementById('loader');
    if (loaderElement) {
      loaderElement.classList.add('loader-hidden');
      console.log("Loader HTML ocultado desde AppContent useEffect");
    }
  }, []);

  // Efecto para aplicar el tema al body
  useEffect(() => { 
    document.body.className = ''; 
    if (currentTheme === 'light') {
      document.body.classList.add('light-mode');
    }
    localStorage.setItem('theme', currentTheme);
    console.log("AppContent useEffect: Tema aplicado al body:", currentTheme);
  }, [currentTheme]);

  // Efecto para cargar categorías desde Firestore en tiempo real
  useEffect(() => { 
    console.log("AppContent useEffect: Configurando listener para categorías...");
    const categoriesCollectionRef = collection(db, `artifacts/${canvasAppId}/categories`);
    const q = query(categoriesCollectionRef, orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(fetchedCategories);
        console.log("Categorías cargadas/actualizadas desde Firestore:", fetchedCategories);
    }, (error) => {
        console.error("Error al cargar categorías desde Firestore:", error);
        showGenericMessageModal("Error de Carga", "No se pudieron cargar las categorías: " + error.message);
    });
    return () => {
      console.log("AppContent useEffect: Desuscribiendo listener de categorías.");
      unsubscribe();
    };
  }, []); // Dependencia vacía, se ejecuta solo al montar

  // Efecto para cargar productos desde Firestore en tiempo real
  useEffect(() => {
    console.log("AppContent useEffect: Configurando listener para productos...");
    setIsLoadingProducts(true);
    const productsCollectionRef = collection(db, `artifacts/${canvasAppId}/products`);
    const q = query(productsCollectionRef, orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetchedProducts);
        setIsLoadingProducts(false);
        console.log("Productos cargados/actualizados desde Firestore:", fetchedProducts);
    }, (error) => {
        console.error("Error al cargar productos desde Firestore:", error);
        showGenericMessageModal("Error de Carga", "No se pudieron cargar los productos: " + error.message);
        setIsLoadingProducts(false);
    });
    return () => {
      console.log("AppContent useEffect: Desuscribiendo listener de productos.");
      unsubscribe();
    };
  }, []); // Dependencia vacía, se ejecuta solo al montar

  // Efecto para cargar movimientos de stock
  useEffect(() => {
    console.log("AppContent useEffect: Configurando listener para stockMovements...");
    setIsLoadingMovements(true);
    const movementsCollectionRef = collection(db, `artifacts/${canvasAppId}/stockMovements`);
    const q = query(movementsCollectionRef, orderBy("timestamp", "desc")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMovements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStockMovements(fetchedMovements);
        setIsLoadingMovements(false);
        console.log("Movimientos de stock cargados/actualizados:", fetchedMovements);
    }, (error) => {
        console.error("Error al cargar movimientos de stock:", error);
        showGenericMessageModal("Error de Carga", "No se pudieron cargar los movimientos de stock: " + error.message);
        setIsLoadingMovements(false);
    });
    return () => {
        console.log("AppContent useEffect: Desuscribiendo listener de stockMovements.");
        unsubscribe();
    };
  }, []); // Dependencia vacía, se ejecuta solo al montar


  const filteredProducts = useMemo(() => {
    let tempProducts = products;
    if (searchTerm) {
      tempProducts = tempProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategoryFilter) {
      tempProducts = tempProducts.filter(product =>
        product.category === selectedCategoryFilter
      );
    }
    return tempProducts;
  }, [products, searchTerm, selectedCategoryFilter]);

  const toggleTheme = () => setCurrentTheme(prev => prev === 'dark' ? 'light' : 'dark');
  
  const openAddProductModal = (product = null) => {
    setProductToEdit(product); 
    setIsAddProductModalOpen(true);
  };
  const closeAddProductModal = () => {
    setIsAddProductModalOpen(false);
    setProductToEdit(null); 
  };
  
  const openAddCategoryModal = () => setIsAddCategoryModalOpen(true);
  const closeAddCategoryModal = () => setIsAddCategoryModalOpen(false);

  const showGenericMessageModal = (title, text, actions = []) => {
    setModalMessage({ title, text, isOpen: true, actions });
  };
  const closeGenericMessageModal = () => {
    setModalMessage({ title: '', text: '', isOpen: false, actions: [] });
  };

  const handleSaveCategory = async (categoryName, onSuccessCallback) => {
    console.log("handleSaveCategory CALLED con:", categoryName);
    try {
        const categoriesCollectionRef = collection(db, `artifacts/${canvasAppId}/categories`);
        const lowerCaseCategoryName = categoryName.toLowerCase();
        const categoryExists = categories.some(cat => cat.name.toLowerCase() === lowerCaseCategoryName);

        if (categoryExists) {
            showGenericMessageModal("Advertencia", `La categoría "${categoryName}" ya existe.`);
        } else {
            await addDoc(categoriesCollectionRef, { name: categoryName });
            showGenericMessageModal("Éxito", `Categoría "${categoryName}" agregada correctamente.`);
            if (onSuccessCallback) onSuccessCallback(); 
        }
    } catch (error) {
        console.error("Error adding category to Firestore:", error);
        showGenericMessageModal("Error", "No se pudo agregar la categoría: " + error.message);
    }
  };

  const handleSaveProduct = async (productDataFromForm, onSuccessCallback) => {
    console.log("handleSaveProduct CALLED con:", productDataFromForm, "Editando producto:", productToEdit);
    try {
        const finalProductData = {
            ...productDataFromForm,
            lastUpdate: serverTimestamp(),
        };

        if (productToEdit && productToEdit.id) { 
            console.log("Actualizando producto ID:", productToEdit.id);
            const productDocRef = doc(db, `artifacts/${canvasAppId}/products`, productToEdit.id);
            await updateDoc(productDocRef, finalProductData);
            showGenericMessageModal("Éxito", `Producto "${finalProductData.name}" actualizado correctamente.`);
        } else { 
            finalProductData.creationDate = serverTimestamp();
            if (finalProductData.currentStock !== undefined && finalProductData.initialStock === undefined) {
                finalProductData.initialStock = finalProductData.currentStock;
            }
            if (!finalProductData.idCode) {
                delete finalProductData.idCode; 
            }
            const productsCollectionRef = collection(db, `artifacts/${canvasAppId}/products`);
            const docRef = await addDoc(productsCollectionRef, finalProductData);
            console.log("Producto nuevo guardado con ID: ", docRef.id);
            showGenericMessageModal("Éxito", `Producto "${finalProductData.name}" agregado correctamente.`);
        }
        if (onSuccessCallback) onSuccessCallback(); 
    } catch (error) {
        console.error("Error saving/updating product to Firestore:", error);
        showGenericMessageModal("Error", "No se pudo guardar el producto: " + error.message);
    }
  };
  
  const handleDeleteProduct = async (productId, productName) => { /* ... como antes ... */ };
  const handleViewDetails = (product) => { /* ... como antes ... */ };
  const formatFirestoreTimestamp = (timestamp) => { /* ... como antes ... */ };

  const handleRegisterStockMovement = async (movementData, onSuccessCallback) => {
    console.log("handleRegisterStockMovement CALLED con:", movementData);
    if (!movementData.productId || movementData.quantity === undefined || !movementData.type) {
        showGenericMessageModal("Error de Validación", "Faltan datos (producto, cantidad o tipo).");
        return;
    }

    const productDocRef = doc(db, `artifacts/${canvasAppId}/products`, movementData.productId);
    const stockMovementsCollectionRef = collection(db, `artifacts/${canvasAppId}/stockMovements`);
    
    let quantityChange = parseInt(movementData.quantity);
    const egresoTypes = ['venta', 'devolucion_proveedor', 'ajuste_salida', 'merma'];
    if (egresoTypes.includes(movementData.type)) {
        quantityChange = -Math.abs(quantityChange); 
    } else {
        quantityChange = Math.abs(quantityChange); 
    }

    if (quantityChange === 0) {
        showGenericMessageModal("Advertencia", "La cantidad del movimiento no puede ser cero.");
        return;
    }

    try {
        await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productDocRef);
            if (!productDoc.exists()) {
                throw new Error("El producto seleccionado ya no existe.");
            }
            const currentStock = productDoc.data().currentStock || 0;
            if (quantityChange < 0 && (currentStock + quantityChange < 0)) { 
                throw new Error(`Stock insuficiente para "${productDoc.data().name}". Actual: ${currentStock}, Egreso: ${Math.abs(quantityChange)}`);
            }
            const newStock = currentStock + quantityChange;
            transaction.update(productDocRef, { currentStock: newStock, lastUpdate: serverTimestamp() });
            transaction.set(doc(stockMovementsCollectionRef), { 
                productId: movementData.productId,
                productName: movementData.productName,
                type: movementData.type,
                quantityChange: quantityChange, 
                stockBefore: currentStock,
                stockAfter: newStock, 
                notes: movementData.notes || '',
                timestamp: serverTimestamp(),
            });
        });
        showGenericMessageModal("Éxito", `Movimiento de stock para "${movementData.productName}" registrado.`);
        if(onSuccessCallback) onSuccessCallback();
    } catch (error) {
        console.error("Error registrando movimiento de stock:", error);
        showGenericMessageModal("Error", `No se pudo registrar el movimiento: ${error.message}`);
    }
  };

  return (
    <>
      <div id="app-container">
        <Header onToggleTheme={toggleTheme} currentTheme={currentTheme} />
        <Nav />
        <main id="main-content">
          <Routes>
            <Route path="/" element={<Navigate replace to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route 
              path="/products" 
              element={<ProductsPage 
                            onOpenAddProductModal={openAddProductModal} 
                            categories={categories} 
                            products={filteredProducts} 
                            isLoading={isLoadingProducts} 
                            formatTimestamp={formatFirestoreTimestamp}
                            onEditProduct={openAddProductModal} 
                            onDeleteProduct={handleDeleteProduct}
                            onViewDetails={handleViewDetails}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            selectedCategoryFilter={selectedCategoryFilter}
                            setSelectedCategoryFilter={setSelectedCategoryFilter}
                        />} 
            />
            <Route 
              path="/stock-movements" 
              element={<StockMovementsPage 
                            products={products} 
                            onRegisterStockMovement={handleRegisterStockMovement}
                            stockMovements={stockMovements}
                            isLoadingMovements={isLoadingMovements}
                            formatTimestamp={formatFirestoreTimestamp}
                        />} 
            />
            <Route path="/finances" element={<FinancesPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <AddProductModal 
        isOpen={isAddProductModalOpen} 
        onClose={closeAddProductModal}
        onOpenAddCategoryModal={openAddCategoryModal}
        categories={categories} 
        onSaveProduct={handleSaveProduct}
        productToEdit={productToEdit} 
        CLOUDINARY_UPLOAD_URL={`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`}
        CLOUDINARY_UPLOAD_PRESET={CLOUDINARY_UPLOAD_PRESET}
      />
      <AddCategoryModal 
        isOpen={isAddCategoryModalOpen} 
        onClose={closeAddCategoryModal}
        onSaveCategory={handleSaveCategory} 
      />
     {modalMessage.isOpen && (
         <div id="modal" className="modal" style={{display: 'block'}}> 
             <div className="modal-content modal-sm">
                 <span className="close-button" onClick={closeGenericMessageModal}>&times;</span>
                 <h3 id="modal-title" style={{textAlign: 'center', marginBottom: '20px'}}>{modalMessage.title}</h3>
                 <div id="modal-message-content" dangerouslySetInnerHTML={{ __html: modalMessage.text }}></div>
                 <div id="modal-actions" style={{ marginTop: '20px', textAlign: 'right' }}>
                     {modalMessage.actions && modalMessage.actions.length > 0 ? (
                         modalMessage.actions.map((action, index) => (
                             <button 
                                 key={index} 
                                 className={action.className || 'btn'} 
                                 onClick={() => {
                                     if (action.callback) action.callback();
                                     closeGenericMessageModal();
                                 }}
                                 style={index > 0 ? { marginLeft: '10px' } : {}}
                             >
                                 {action.text}
                             </button>
                         ))
                     ) : (
                         <button className="btn btn-success" onClick={closeGenericMessageModal}>OK</button>
                     )}
                 </div>
             </div>
         </div>
     )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
export default App;
