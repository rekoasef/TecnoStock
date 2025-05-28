// src/App.jsx
// Script Version: v1.0.28 (Funciones completas, modal y props para ProfilePage)
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
    apiKey: "AIzaSyA3h18FkkRo6V4i6bsHDof2s5NOeiQJUiE",
    authDomain: "tecnostorage-8342a.firebaseapp.com",
    projectId: "tecnostorage-8342a",
    storageBucket: "tecnostorage-8342a.firebasestorage.app",
    messagingSenderId: "231093419794",
    appId: "1:231093419794:web:cb6af0ac205083be433dcb",
    measurementId: "G-FQNFW01KTF" 
};
const canvasAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const CLOUDINARY_CLOUD_NAME = 'dgqbwrgot'; 
const CLOUDINARY_UPLOAD_PRESET = 'gestor_productos_unsigned';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


// --- INICIALIZACIÓN DE FIREBASE ---
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp); 
const auth = getAuth(fbApp); 
console.log("Firebase App, Firestore DB, and Auth initialized in App.jsx");

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
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); 

  const showGenericMessageModal = (title, text, actions = []) => setModalMessage({ title, text, isOpen: true, actions });
  const closeGenericMessageModal = () => setModalMessage({ title: '', text: '', isOpen: false, actions: [] });

  useEffect(() => { 
    const loaderElement = document.getElementById('loader');
    if (loaderElement) loaderElement.classList.add('loader-hidden');
  }, []);

  useEffect(() => { 
    document.body.className = ''; 
    if (currentTheme === 'light') document.body.classList.add('light-mode');
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => { 
    const ref = collection(db, `artifacts/${canvasAppId}/categories`);
    const q = query(ref, orderBy("name"));
    const unsub = onSnapshot(q, (snap) => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))), 
      (err) => { console.error("Error al cargar categorías:", err); showGenericMessageModal("Error de Carga", "No se pudieron cargar las categorías."); });
    return unsub;
  }, [canvasAppId]); 

  useEffect(() => { 
    setIsLoadingProducts(true);
    const ref = collection(db, `artifacts/${canvasAppId}/products`);
    const q = query(ref, orderBy("name"));
    const unsub = onSnapshot(q, (snap) => { setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setIsLoadingProducts(false); },
      (err) => { console.error("Error al cargar productos:", err); showGenericMessageModal("Error de Carga", "No se pudieron cargar los productos."); setIsLoadingProducts(false); });
    return unsub;
  }, [canvasAppId]); 

  useEffect(() => { 
    setIsLoadingMovements(true);
    const ref = collection(db, `artifacts/${canvasAppId}/stockMovements`);
    const q = query(ref, orderBy("timestamp", "desc")); 
    const unsub = onSnapshot(q, (snap) => { setStockMovements(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setIsLoadingMovements(false); },
      (err) => { console.error("Error al cargar movimientos de stock:", err); showGenericMessageModal("Error de Carga", "No se pudieron cargar los movimientos de stock."); setIsLoadingMovements(false); });
    return unsub;
  }, [canvasAppId]);

  useEffect(() => { 
    console.log("AppContent: Configurando listener onAuthStateChanged...");
    const unsub = onAuthStateChanged(auth, (user) => {
      console.log("AppContent onAuthStateChanged: user ->", user ? user.uid : null);
      setCurrentUser(user ? { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL } : null);
      setAuthLoading(false); 
    });
    return unsub; 
  }, []); 

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
        if (m.type === 'compra' && quantity > 0) totalInvestment += quantity * cost;
        if (m.type === 'venta' && quantity < 0) {
          totalRevenue += Math.abs(quantity) * salePrice;
          totalCOGS += Math.abs(quantity) * cost;
        }
      });
    }
    netProfit = totalRevenue - totalCOGS;
    return { totalStockValueAtCost, totalInvestment, totalRevenue, totalCOGS, netProfit };
  }, [products, stockMovements]);

  const filteredProducts = useMemo(() => { 
    if (!products) return [];
    return products.filter(p => 
        (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!selectedCategoryFilter || p.category === selectedCategoryFilter)
    );
  }, [products, searchTerm, selectedCategoryFilter]);
  
  const handleRegister = async (email, password) => {
    console.log("handleRegister CALLED con email:", email);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuario registrado exitosamente:", userCredential.user);
      showGenericMessageModal("Registro Exitoso", `¡Bienvenido ${userCredential.user.email}! Por favor, inicia sesión.`);
      return true; 
    } catch (error) {
      console.error("Error en handleRegister:", error);
      let errorMessage = "No se pudo registrar: ";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage += "El correo electrónico ya está en uso.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage += "La contraseña es demasiado débil (mínimo 6 caracteres).";
      } else {
        errorMessage += error.message;
      }
      showGenericMessageModal("Error de Registro", errorMessage);
      return false; 
    }
  };

  const handleLogin = async (email, password) => {
    console.log("handleLogin CALLED con email:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Usuario logueado exitosamente:", userCredential.user);
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

  const handleLogout = async () => {
    console.log("handleLogout CALLED");
    try {
      await firebaseSignOut(auth);
      console.log("Usuario deslogueado exitosamente.");
    } catch (error) {
      console.error("Error en handleLogout:", error);
      showGenericMessageModal("Error al Cerrar Sesión", `No se pudo cerrar sesión: ${error.message}`);
    }
  };

  const toggleTheme = () => setCurrentTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const openAddProductModal = (product = null) => { setProductToEdit(product); setIsAddProductModalOpen(true); };
  const closeAddProductModal = () => { setIsAddProductModalOpen(false); setProductToEdit(null); };
  const openAddCategoryModal = () => setIsAddCategoryModalOpen(true);
  const closeAddCategoryModal = () => setIsAddCategoryModalOpen(false);
  
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

  const handleSaveCategory = async (categoryName, onSuccessCallback) => {
    if (!categoryName || categoryName.trim() === "") {
        showGenericMessageModal("Error", "El nombre de la categoría no puede estar vacío.");
        return;
    }
    try {
        const categoriesCollectionRef = collection(db, `artifacts/${canvasAppId}/categories`);
        const categoryNameTrimmed = categoryName.trim();
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

  const handleSaveProduct = async (productDataFromForm, onSuccessCallback) => {
    try {
        const finalProductData = {
            ...productDataFromForm,
            lastUpdate: serverTimestamp(),
            ...(currentUser && { updatedByUserId: currentUser.uid, updatedByUserEmail: currentUser.email })
        };
        if (productToEdit && productToEdit.id) { 
            const productDocRef = doc(db, `artifacts/${canvasAppId}/products`, productToEdit.id);
            delete finalProductData.initialStockType; 
            await updateDoc(productDocRef, finalProductData);
            showGenericMessageModal("Éxito", `Producto "${finalProductData.name}" actualizado correctamente.`);
        } else { 
            finalProductData.creationDate = serverTimestamp();
            if (currentUser) {
                finalProductData.createdByUserId = currentUser.uid;
                finalProductData.createdByUserEmail = currentUser.email;
            }
            if (!finalProductData.idCode) delete finalProductData.idCode; 
            const productsCollectionRef = collection(db, `artifacts/${canvasAppId}/products`);
            const newProductDocRef = await addDoc(productsCollectionRef, finalProductData);
            showGenericMessageModal("Éxito", `Producto "${finalProductData.name}" agregado correctamente.`);
            if (finalProductData.initialStock > 0 && finalProductData.initialStockType) {
                const movementDataForInitialStock = {
                    productId: newProductDocRef.id,
                    productName: finalProductData.name,
                    type: finalProductData.initialStockType, 
                    quantity: finalProductData.initialStock, 
                    notes: `Stock inicial (${getMovementTypeDisplay(finalProductData.initialStockType)}).`,
                    ...(currentUser && { userId: currentUser.uid, userEmail: currentUser.email })
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

  const handleViewDetails = (product) => {
    const detailsHtml = `
        <p><strong>Nombre:</strong> ${product.name || 'N/A'}</p>
        <p><strong>Categoría:</strong> ${product.category || 'N/A'}</p>
        <p><strong>Detalle:</strong> ${product.productDetail || 'N/A'}</p>
        <p><strong>Precio Costo:</strong> ${product.costPrice !== undefined ? `${product.costPrice} ${product.costCurrency || ''}` : 'N/A'}</p>
        <p><strong>Precio Venta:</strong> ${product.salePrice !== undefined ? `${product.salePrice} ${product.saleCurrency || ''}` : 'N/A'}</p>
        <p><strong>Stock Actual:</strong> ${product.currentStock !== undefined ? product.currentStock : 'N/A'}</p>
        <p><strong>Stock Inicial:</strong> ${product.initialStock !== undefined ? product.initialStock : 'N/A'}</p>
        <p><strong>Código ID:</strong> ${product.idCode || 'N/A'}</p>
        <p><strong>Última Actualización:</strong> ${product.lastUpdate ? formatFirestoreTimestamp(product.lastUpdate) : 'N/A'}</p>
        <p><strong>Fecha Creación:</strong> ${product.creationDate ? formatFirestoreTimestamp(product.creationDate) : 'N/A'}</p>
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}" style="max-width: 100%; height: auto; margin-top: 10px; border-radius: var(--border-radius);"/>` : ''}
    `;
    showGenericMessageModal(`Detalles de ${product.name}`, detailsHtml);
  };

  const formatFirestoreTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    if (timestamp instanceof Date) { 
        return timestamp.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }); 
    }
    if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) { 
        return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    }
    return "Fecha inválida";
  };

  const handleRegisterStockMovement = async (movementData, onSuccessCallback) => {
    if (!movementData.productId || movementData.quantity === undefined || !movementData.type) {
        showGenericMessageModal("Error de Validación", "Faltan datos para registrar el movimiento."); return;
    }
    const productDocRef = doc(db, `artifacts/${canvasAppId}/products`, movementData.productId);
    const stockMovementsCollectionRef = collection(db, `artifacts/${canvasAppId}/stockMovements`);
    let quantityChange = parseInt(movementData.quantity); 
    const egresoTypes = ['venta', 'devolucion_proveedor', 'ajuste_salida', 'merma'];
    if (egresoTypes.includes(movementData.type)) quantityChange = -Math.abs(quantityChange); 
    else quantityChange = Math.abs(quantityChange); 
    if (quantityChange === 0) { showGenericMessageModal("Advertencia", "La cantidad del movimiento no puede ser cero."); return; }

    try {
        await runTransaction(db, async (transaction) => {
            const productDocSnap = await transaction.get(productDocRef); 
            if (!productDocSnap.exists()) throw new Error("El producto para este movimiento ya no existe.");
            const currentProductData = productDocSnap.data(); 
            const currentStock = currentProductData.currentStock || 0;
            if (quantityChange < 0 && (currentStock + quantityChange < 0)) { 
                throw new Error(`Stock insuficiente para "${currentProductData.name}". Actual: ${currentStock}, se intentarían restar: ${Math.abs(quantityChange)}`);
            }
            const newStock = currentStock + quantityChange;
            transaction.update(productDocRef, { currentStock: newStock, lastUpdate: serverTimestamp() });
            const movementToSave = { 
                productId: movementData.productId, productName: movementData.productName, 
                type: movementData.type, quantityChange: quantityChange, 
                stockBefore: currentStock, stockAfter: newStock, 
                notes: movementData.notes || '', timestamp: serverTimestamp(),
                ...(currentUser && { userId: currentUser.uid, userEmail: currentUser.email })
            };
            transaction.set(doc(stockMovementsCollectionRef), movementToSave);
        });
        showGenericMessageModal("Éxito", `Movimiento de stock para "${movementData.productName}" registrado.`);
        if(onSuccessCallback) onSuccessCallback();
    } catch (error) {
        console.error("Error registrando movimiento de stock:", error);
        showGenericMessageModal("Error", `No se pudo registrar el movimiento: ${error.message}`);
    }
  };

  if (authLoading) {
    return ( <div id="loader" className="loader-container" style={{ display: 'flex', opacity: 1 }}><div className="loader"></div><p>Verificando autenticación...</p></div> );
  }

  return (
    <>
      <div id="app-container">
        <Header currentUser={currentUser} onLogout={handleLogout} onToggleTheme={toggleTheme} currentTheme={currentTheme} />
        <Nav currentUser={currentUser} />
        <main id="main-content">
          <Routes>
            <Route path="/" element={currentUser ? <Navigate replace to="/dashboard" /> : <Navigate replace to="/login" />} />
            <Route path="/login" element={!currentUser ? <LoginPage onLogin={handleLogin} showMessageModal={showGenericMessageModal} /> : <Navigate replace to="/dashboard" />} />
            <Route path="/register" element={!currentUser ? <RegisterPage onRegister={handleRegister} showMessageModal={showGenericMessageModal} /> : <Navigate replace to="/dashboard" />} />
            
            <Route element={<ProtectedRoute currentUser={currentUser} />}>
                <Route path="/dashboard" element={<DashboardPage financialMetrics={financialMetrics} products={products} stockMovements={stockMovements} categories={categories}/>} />
                <Route path="/products" element={<ProductsPage onOpenAddProductModal={openAddProductModal} categories={categories} products={filteredProducts} isLoading={isLoadingProducts} formatTimestamp={formatFirestoreTimestamp} onEditProduct={openAddProductModal} onDeleteProduct={handleDeleteProduct} onViewDetails={handleViewDetails} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategoryFilter={selectedCategoryFilter} setSelectedCategoryFilter={setSelectedCategoryFilter}/>} />
                <Route path="/stock-movements" element={<StockMovementsPage products={products} onRegisterStockMovement={handleRegisterStockMovement} stockMovements={stockMovements} isLoadingMovements={isLoadingMovements} formatTimestamp={formatFirestoreTimestamp}/>} />
                <Route path="/finances" element={<FinancesPage financialMetrics={financialMetrics} products={products} stockMovements={stockMovements}/>} />
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
      <AddProductModal isOpen={isAddProductModalOpen} onClose={closeAddProductModal} onOpenAddCategoryModal={openAddCategoryModal} categories={categories} onSaveProduct={handleSaveProduct} productToEdit={productToEdit} CLOUDINARY_UPLOAD_URL={CLOUDINARY_UPLOAD_URL} CLOUDINARY_UPLOAD_PRESET={CLOUDINARY_UPLOAD_PRESET}/>
      <AddCategoryModal isOpen={isAddCategoryModalOpen} onClose={closeAddCategoryModal} onSaveCategory={handleSaveCategory} />
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
function App() { return (<Router><AppContent /></Router>); }
export default App;
