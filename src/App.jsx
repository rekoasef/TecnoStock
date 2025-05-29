// src/App.jsx
// Script Version: v1.0.32 (Dashboard con props para datos de usuario)
import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORTACIONES DE FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
    getFirestore, collection, addDoc, query, where, getDocs,
    onSnapshot, orderBy, serverTimestamp, doc, updateDoc, deleteDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";


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
import LoginPage from './components/pages/auth/LoginPage';
import RegisterPage from './components/pages/auth/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProfilePage from './components/pages/ProfilePage';


// --- CONFIGURACIÓN DE FIREBASE Y CLOUDINARY ---
const firebaseConfig = {
    apiKey: "AIzaSyA3h18FkkRo6V4i6bsHDof2s5NOeiQJUiE", // Recuerda reemplazar esto con tu API key real o manejarla de forma segura
    authDomain: "tecnostorage-8342a.firebaseapp.com",
    projectId: "tecnostorage-8342a",
    storageBucket: "tecnostorage-8342a.firebasestorage.app",
    messagingSenderId: "231093419794",
    appId: "1:231093419794:web:cb6af0ac205083be433dcb",
    measurementId: "G-FQNFW01KTF"
};
const canvasAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // Usado para la ruta en Firestore
const CLOUDINARY_CLOUD_NAME = 'dgqbwrgot';
const CLOUDINARY_UPLOAD_PRESET = 'gestor_productos_unsigned';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


// --- INICIALIZACIÓN DE FIREBASE ---
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);
// console.log("Firebase App, Firestore DB, and Auth initialized in App.jsx");

function AppContent() {
  // Estados de la aplicación
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
  const [currentUser, setCurrentUser] = useState(null); // Estado para el usuario autenticado
  const [authLoading, setAuthLoading] = useState(true); // Estado para la carga de autenticación

  // Función para mostrar un modal de mensaje genérico
  const showGenericMessageModal = (title, text, actions = []) => setModalMessage({ title, text, isOpen: true, actions });
  // Función para cerrar el modal de mensaje genérico
  const closeGenericMessageModal = () => setModalMessage({ title: '', text: '', isOpen: false, actions: [] });

  // Efecto para ocultar el loader HTML inicial
  useEffect(() => {
    const loaderElement = document.getElementById('loader');
    if (loaderElement) loaderElement.classList.add('loader-hidden');
  }, []);

  // Efecto para manejar el cambio de tema (dark/light mode)
  useEffect(() => {
    document.body.className = ''; // Limpia clases previas
    if (currentTheme === 'light') document.body.classList.add('light-mode');
    localStorage.setItem('theme', currentTheme); // Guarda el tema en localStorage
  }, [currentTheme]);

  // Efecto para cargar categorías desde Firestore
  useEffect(() => {
    const ref = collection(db, `artifacts/${canvasAppId}/categories`);
    const q = query(ref, orderBy("name")); // Ordena las categorías por nombre
    const unsub = onSnapshot(q, (snap) => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => { console.error("Error al cargar categorías:", err); showGenericMessageModal("Error de Carga", "No se pudieron cargar las categorías."); });
    return unsub; // Se desuscribe al desmontar el componente
  }, [canvasAppId]); // Dependencia: canvasAppId

  // Efecto para cargar productos desde Firestore
  useEffect(() => {
    setIsLoadingProducts(true);
    const ref = collection(db, `artifacts/${canvasAppId}/products`);
    const q = query(ref, orderBy("name")); // Ordena los productos por nombre
    const unsub = onSnapshot(q, (snap) => { setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setIsLoadingProducts(false); },
      (err) => { console.error("Error al cargar productos:", err); showGenericMessageModal("Error de Carga", "No se pudieron cargar los productos."); setIsLoadingProducts(false); });
    return unsub; // Se desuscribe al desmontar
  }, [canvasAppId]); // Dependencia: canvasAppId

  // Efecto para cargar movimientos de stock desde Firestore
  useEffect(() => {
    setIsLoadingMovements(true);
    const ref = collection(db, `artifacts/${canvasAppId}/stockMovements`);
    const q = query(ref, orderBy("timestamp", "desc")); // Ordena los movimientos por fecha descendente
    const unsub = onSnapshot(q, (snap) => { setStockMovements(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setIsLoadingMovements(false); },
      (err) => { console.error("Error al cargar movimientos de stock:", err); showGenericMessageModal("Error de Carga", "No se pudieron cargar los movimientos de stock."); setIsLoadingMovements(false); });
    return unsub; // Se desuscribe al desmontar
  }, [canvasAppId]); // Dependencia: canvasAppId

  // Efecto para escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // Actualiza currentUser con la información del usuario o null si no está autenticado
      setCurrentUser(user ? { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL } : null);
      setAuthLoading(false); // Indica que la verificación de autenticación ha terminado
    });
    return unsub; // Se desuscribe al desmontar
  }, []); // Se ejecuta solo una vez al montar

  // Calcula métricas financieras globales usando useMemo para optimización
  const financialMetrics = useMemo(() => {
    let totalStockValueAtCost = 0, totalInvestment = 0, totalRevenue = 0, totalCOGS = 0, netProfit = 0;
    if (products?.length) {
      totalStockValueAtCost = products.reduce((s, p) => s + (Number(p.currentStock || 0) * Number(p.costPrice || 0)), 0);
    }
    if (stockMovements?.length && products?.length) {
      stockMovements.forEach(m => {
        const product = products.find(p => p.id === m.productId);
        if (!product) return;
        const cost = Number(product.costPrice || 0);
        const salePrice = Number(product.salePrice || 0);
        const quantity = Number(m.quantityChange || 0);
        // Calcula inversión total basada en movimientos de 'compra'
        if (m.type === 'compra' && quantity > 0) totalInvestment += quantity * cost;
        // Calcula ingresos y costo de bienes vendidos (COGS) para 'venta'
        if (m.type === 'venta' && quantity < 0) {
          totalRevenue += Math.abs(quantity) * salePrice;
          totalCOGS += Math.abs(quantity) * cost;
        }
      });
    }
    netProfit = totalRevenue - totalCOGS; // Calcula ganancia neta
    return { totalStockValueAtCost, totalInvestment, totalRevenue, totalCOGS, netProfit };
  }, [products, stockMovements]); // Dependencias: products, stockMovements

  // Filtra productos basados en término de búsqueda y categoría seleccionada
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p =>
        (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!selectedCategoryFilter || p.category === selectedCategoryFilter)
    );
  }, [products, searchTerm, selectedCategoryFilter]); // Dependencias: products, searchTerm, selectedCategoryFilter

  // Manejador para el registro de nuevos usuarios
  const handleRegister = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      showGenericMessageModal("Registro Exitoso", `¡Bienvenido ${userCredential.user.email}! Por favor, inicia sesión.`);
      return true;
    } catch (error) {
      console.error("Error en handleRegister:", error);
      let errorMessage = "No se pudo registrar: ";
      if (error.code === 'auth/email-already-in-use') errorMessage += "El correo electrónico ya está en uso.";
      else if (error.code === 'auth/weak-password') errorMessage += "La contraseña es demasiado débil (mínimo 6 caracteres).";
      else errorMessage += error.message;
      showGenericMessageModal("Error de Registro", errorMessage);
      return false;
    }
  };

  // Manejador para el inicio de sesión de usuarios
  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Error en handleLogin:", error);
      let errorMessage = "No se pudo iniciar sesión: ";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage += "Correo electrónico o contraseña incorrectos.";
      } else {
        errorMessage += error.message;
      }
      showGenericMessageModal("Error de Inicio de Sesión", errorMessage);
      return false;
    }
  };

  // Manejador para cerrar sesión
  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error en handleLogout:", error);
      showGenericMessageModal("Error al Cerrar Sesión", `No se pudo cerrar sesión: ${error.message}`);
    }
  };

  // Cambia el tema actual
  const toggleTheme = () => setCurrentTheme(prev => prev === 'dark' ? 'light' : 'dark');
  // Abre el modal para agregar/editar producto
  const openAddProductModal = (product = null) => { setProductToEdit(product); setIsAddProductModalOpen(true); };
  // Cierra el modal de producto
  const closeAddProductModal = () => { setIsAddProductModalOpen(false); setProductToEdit(null); };
  // Abre el modal para agregar categoría
  const openAddCategoryModal = () => setIsAddCategoryModalOpen(true);
  // Cierra el modal de categoría
  const closeAddCategoryModal = () => setIsAddCategoryModalOpen(false);

  // Devuelve el nombre legible del tipo de movimiento de stock
  const getMovementTypeDisplay = (type) => {
      switch (type) {
          case 'venta': return 'Venta';
          case 'compra': return 'Compra/Ingreso';
          case 'devolucion_cliente': return 'Devolución Cliente';
          case 'devolucion_proveedor': return 'Devolución Proveedor';
          case 'ajuste_entrada': return 'Ajuste Entrada';
          case 'ajuste_salida': return 'Ajuste Salida';
          case 'merma': return 'Merma/Pérdida';
          default: return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Desconocido';
      }
  };

  // Guarda una nueva categoría en Firestore
  const handleSaveCategory = async (categoryName, onSuccessCallback) => {
    if (!categoryName || categoryName.trim() === "") {
        showGenericMessageModal("Error", "El nombre de la categoría no puede estar vacío.");
        return;
    }
    try {
        const categoriesCollectionRef = collection(db, `artifacts/${canvasAppId}/categories`);
        const categoryNameTrimmed = categoryName.trim();
        // Verifica si la categoría ya existe
        const categoryExistsQuery = query(categoriesCollectionRef, where("name", "==", categoryNameTrimmed));
        const querySnapshot = await getDocs(categoryExistsQuery);
        if (!querySnapshot.empty) {
            showGenericMessageModal("Advertencia", `La categoría "${categoryNameTrimmed}" ya existe.`);
        } else {
            await addDoc(categoriesCollectionRef, { name: categoryNameTrimmed, creationDate: serverTimestamp() });
            showGenericMessageModal("Éxito", `Categoría "${categoryNameTrimmed}" agregada correctamente.`);
            if (onSuccessCallback) onSuccessCallback();
        }
    } catch (error) {
        console.error("Error adding category to Firestore:", error);
        showGenericMessageModal("Error", "No se pudo agregar la categoría: " + error.message);
    }
  };

  // Guarda o actualiza un producto en Firestore
  const handleSaveProduct = async (productDataFromForm, onSuccessCallback) => {
    if (!currentUser) { // Verifica si hay un usuario logueado
        showGenericMessageModal("Error", "Debes iniciar sesión para guardar productos.");
        return;
    }
    try {
        const finalProductData = {
            ...productDataFromForm,
            lastUpdate: serverTimestamp(),
            updatedByUserId: currentUser.uid, // ID del usuario que actualiza
            updatedByUserEmail: currentUser.email, // Email del usuario que actualiza
            updatedByDisplayName: currentUser.displayName || currentUser.email // Nombre visible del usuario que actualiza
        };

        if (productToEdit && productToEdit.id) { // Si es edición
            const productDocRef = doc(db, `artifacts/${canvasAppId}/products`, productToEdit.id);
            delete finalProductData.initialStockType; // No se necesita para edición
            await updateDoc(productDocRef, finalProductData);
            showGenericMessageModal("Éxito", `Producto "${finalProductData.name}" actualizado correctamente.`);
        } else { // Si es creación
            finalProductData.creationDate = serverTimestamp();
            finalProductData.createdByUserId = currentUser.uid; // ID del usuario que crea
            finalProductData.createdByUserEmail = currentUser.email; // Email del usuario que crea
            finalProductData.createdByDisplayName = currentUser.displayName || currentUser.email; // Nombre visible del usuario que crea

            if (!finalProductData.idCode) delete finalProductData.idCode; // Elimina si está vacío

            const productsCollectionRef = collection(db, `artifacts/${canvasAppId}/products`);
            const newProductDocRef = await addDoc(productsCollectionRef, finalProductData);
            showGenericMessageModal("Éxito", `Producto "${finalProductData.name}" agregado correctamente.`);

            // Si hay stock inicial, registra un movimiento de stock
            if (finalProductData.initialStock > 0 && finalProductData.initialStockType) {
                const movementDataForInitialStock = {
                    productId: newProductDocRef.id,
                    productName: finalProductData.name,
                    type: finalProductData.initialStockType,
                    quantity: finalProductData.initialStock,
                    notes: `Stock inicial (${getMovementTypeDisplay(finalProductData.initialStockType)}).`,
                    userId: currentUser.uid, // Trazabilidad del usuario
                    userEmail: currentUser.email,
                    userDisplayName: currentUser.displayName || currentUser.email
                };
                await handleRegisterStockMovement(movementDataForInitialStock, () => {
                     console.log(`Mov. stock inicial tipo "${finalProductData.initialStockType}" para "${finalProductData.name}" registrado.`);
                });
            }
        }
        if (onSuccessCallback) onSuccessCallback();
    } catch (error) {
        console.error("Error saving/updating product to Firestore:", error);
        showGenericMessageModal("Error", "No se pudo guardar el producto: " + error.message);
    }
  };

  // Elimina un producto de Firestore
  const handleDeleteProduct = async (productId, productName) => {
    showGenericMessageModal( "Confirmar Eliminación", `¿Eliminar "${productName}"? Los movimientos de stock asociados no se eliminarán.`,
        [
            { text: "Cancelar" },
            { text: "Eliminar", className: "btn btn-danger",
                callback: async () => {
                    try {
                        await deleteDoc(doc(db, `artifacts/${canvasAppId}/products`, productId));
                        showGenericMessageModal("Éxito", `Producto "${productName}" eliminado.`);
                    } catch (error) {
                        showGenericMessageModal("Error", `No se pudo eliminar: ${error.message}`);
                    }
                }
            }
        ]
    );
  };

  // Muestra los detalles de un producto en un modal
  const handleViewDetails = (product) => {
    // Construye el HTML para los detalles del producto, incluyendo quién lo creó y actualizó
    const detailsHtml = `
        <p><strong>Nombre:</strong> ${product.name || 'N/A'}</p>
        <p><strong>Categoría:</strong> ${product.category || 'N/A'}</p>
        <p><strong>Detalle:</strong> ${product.productDetail || 'N/A'}</p>
        <p><strong>Precio Costo:</strong> ${product.costPrice !== undefined ? `${product.costPrice} ${product.costCurrency || ''}` : 'N/A'}</p>
        <p><strong>Precio Venta:</strong> ${product.salePrice !== undefined ? `${product.salePrice} ${product.saleCurrency || ''}` : 'N/A'}</p>
        <p><strong>Stock Actual:</strong> ${product.currentStock !== undefined ? product.currentStock : 'N/A'}</p>
        <p><strong>Stock Inicial:</strong> ${product.initialStock !== undefined ? product.initialStock : 'N/A'}</p>
        <p><strong>Código ID:</strong> ${product.idCode || 'N/A'}</p>
        <p><strong>Última Actualización:</strong> ${product.lastUpdate ? formatFirestoreTimestamp(product.lastUpdate) : 'N/A'} ${product.updatedByDisplayName ? `por ${product.updatedByDisplayName}` : (product.updatedByUserEmail ? `por ${product.updatedByUserEmail}`: '')}</p>
        <p><strong>Fecha Creación:</strong> ${product.creationDate ? formatFirestoreTimestamp(product.creationDate) : 'N/A'} ${product.createdByDisplayName ? `por ${product.createdByDisplayName}` : (product.createdByUserEmail ? `por ${product.createdByUserEmail}` : '')}</p>
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}" style="max-width: 100%; height: auto; margin-top: 10px; border-radius: var(--border-radius);"/>` : ''}
    `;
    showGenericMessageModal(`Detalles de ${product.name}`, detailsHtml);
  };

  // Formatea un timestamp de Firestore a un string legible
  const formatFirestoreTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    if (timestamp instanceof Date) { // Si ya es un objeto Date
        return timestamp.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    }
    // Si es un objeto Timestamp de Firestore
    if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
        return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    }
    return "Fecha inválida";
  };

  // Registra un movimiento de stock en Firestore
  const handleRegisterStockMovement = async (movementData, onSuccessCallback) => {
    if (!currentUser) { // Verifica si hay un usuario logueado
        showGenericMessageModal("Error", "Debes iniciar sesión para registrar movimientos.");
        return;
    }
    if (!movementData.productId || movementData.quantity === undefined || !movementData.type) {
        showGenericMessageModal("Error de Validación", "Faltan datos para registrar el movimiento."); return;
    }
    const productDocRef = doc(db, `artifacts/${canvasAppId}/products`, movementData.productId);
    const stockMovementsCollectionRef = collection(db, `artifacts/${canvasAppId}/stockMovements`);
    let quantityChange = parseInt(movementData.quantity);
    const egresoTypes = ['venta', 'devolucion_proveedor', 'ajuste_salida', 'merma'];
    if (egresoTypes.includes(movementData.type)) quantityChange = -Math.abs(quantityChange); // Cantidad negativa para egresos
    else quantityChange = Math.abs(quantityChange); // Cantidad positiva para ingresos
    if (quantityChange === 0) { showGenericMessageModal("Advertencia", "La cantidad del movimiento no puede ser cero."); return; }

    try {
        await runTransaction(db, async (transaction) => {
            const productDocSnap = await transaction.get(productDocRef);
            if (!productDocSnap.exists()) throw new Error("El producto para este movimiento ya no existe.");
            const currentProductData = productDocSnap.data();
            const currentStock = currentProductData.currentStock || 0;
            // Verifica si hay stock suficiente para egresos
            if (quantityChange < 0 && (currentStock + quantityChange < 0)) {
                throw new Error(`Stock insuficiente para "${currentProductData.name}". Actual: ${currentStock}, se intentarían restar: ${Math.abs(quantityChange)}`);
            }
            const newStock = currentStock + quantityChange;
            // Actualiza el stock del producto y la fecha de última actualización
            transaction.update(productDocRef, { currentStock: newStock, lastUpdate: serverTimestamp() });

            const movementToSave = {
                productId: movementData.productId,
                productName: movementData.productName,
                type: movementData.type,
                quantityChange: quantityChange,
                stockBefore: currentStock,
                stockAfter: newStock,
                notes: movementData.notes || '',
                timestamp: serverTimestamp(),
                userId: currentUser.uid, // Trazabilidad del usuario
                userEmail: currentUser.email,
                userDisplayName: currentUser.displayName || currentUser.email // Nombre visible del usuario
            };
            transaction.set(doc(stockMovementsCollectionRef), movementToSave); // Guarda el movimiento
        });
        showGenericMessageModal("Éxito", `Movimiento de stock para "${movementData.productName}" registrado.`);
        if(onSuccessCallback) onSuccessCallback();
    } catch (error) {
        console.error("Error registrando movimiento de stock:", error);
        showGenericMessageModal("Error", `No se pudo registrar el movimiento: ${error.message}`);
    }
  };

  // Muestra un loader mientras se verifica la autenticación
  if (authLoading) {
    return ( <div id="loader" className="loader-container" style={{ display: 'flex', opacity: 1 }}><div className="loader"></div><p>Verificando autenticación...</p></div> );
  }

  // Renderizado principal del contenido de la aplicación
  return (
    <>
      <div id="app-container">
        <Header currentUser={currentUser} onLogout={handleLogout} onToggleTheme={toggleTheme} currentTheme={currentTheme} />
        <Nav currentUser={currentUser} />
        <main id="main-content">
          <Routes>
            {/* Ruta raíz: redirige a dashboard si está logueado, sino a login */}
            <Route path="/" element={currentUser ? <Navigate replace to="/dashboard" /> : <Navigate replace to="/login" />} />
            {/* Rutas de autenticación (login/register) */}
            <Route path="/login" element={!currentUser ? <LoginPage onLogin={handleLogin} showMessageModal={showGenericMessageModal} /> : <Navigate replace to="/dashboard" />} />
            <Route path="/register" element={!currentUser ? <RegisterPage onRegister={handleRegister} showMessageModal={showGenericMessageModal} /> : <Navigate replace to="/dashboard" />} />

            {/* Rutas protegidas (requieren autenticación) */}
            <Route element={<ProtectedRoute currentUser={currentUser} />}>
                <Route path="/dashboard" element={
                    <DashboardPage
                        financialMetrics={financialMetrics}
                        products={products}
                        stockMovements={stockMovements}
                        categories={categories}
                        currentUser={currentUser} /* <-- Añadido currentUser */
                    />}
                />
                <Route path="/products" element={<ProductsPage onOpenAddProductModal={openAddProductModal} categories={categories} products={filteredProducts} isLoading={isLoadingProducts} formatTimestamp={formatFirestoreTimestamp} onEditProduct={openAddProductModal} onDeleteProduct={handleDeleteProduct} onViewDetails={handleViewDetails} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategoryFilter={selectedCategoryFilter} setSelectedCategoryFilter={setSelectedCategoryFilter}/>} />
                <Route path="/stock-movements" element={<StockMovementsPage products={products} onRegisterStockMovement={handleRegisterStockMovement} stockMovements={stockMovements} isLoadingMovements={isLoadingMovements} formatTimestamp={formatFirestoreTimestamp}/>} />
                {/* Pasa currentUser a FinancesPage para que pueda calcular finanzas personales */}
                <Route
                    path="/finances"
                    element={<FinancesPage
                                financialMetrics={financialMetrics} // Métricas globales
                                products={products}
                                stockMovements={stockMovements}
                                currentUser={currentUser} // Usuario actual para filtrar sus finanzas
                            />}
                />
                <Route
                    path="/profile"
                    element={<ProfilePage
                                currentUser={currentUser}
                                auth={auth}
                                db={db}
                                canvasAppId={canvasAppId}
                                showMessageModal={showGenericMessageModal}
                                cloudinaryUploadUrl={CLOUDINARY_UPLOAD_URL}
                                cloudinaryUploadPreset={CLOUDINARY_UPLOAD_PRESET}
                            />}
                />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
      {/* Modales */}
      <AddProductModal isOpen={isAddProductModalOpen} onClose={closeAddProductModal} onOpenAddCategoryModal={openAddCategoryModal} categories={categories} onSaveProduct={handleSaveProduct} productToEdit={productToEdit} CLOUDINARY_UPLOAD_URL={CLOUDINARY_UPLOAD_URL} CLOUDINARY_UPLOAD_PRESET={CLOUDINARY_UPLOAD_PRESET}/>
      <AddCategoryModal isOpen={isAddCategoryModalOpen} onClose={closeAddCategoryModal} onSaveCategory={handleSaveCategory} />
      {/* Modal genérico para mensajes */}
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
                                 onClick={() => { if (action.callback) action.callback(); closeGenericMessageModal(); }}
                                 style={index > 0 ? { marginLeft: '10px' } : {}}
                             >{action.text}</button>
                         ))
                     ) : ( <button className="btn btn-success" onClick={closeGenericMessageModal}>OK</button> )}
                 </div>
             </div>
         </div>
     )}
    </>
  );
}
// Componente principal App que envuelve AppContent con el Router
function App() { return (<Router><AppContent /></Router>); }
export default App;
