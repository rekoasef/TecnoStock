// src/components/pages/DashboardPage.jsx
import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const DashboardPage = ({ financialMetrics, products, stockMovements, categories, currentUser }) => {
    // --- MÉTRICAS GLOBALES (del prop financialMetrics) ---
    const totalStockValueAtCost = financialMetrics?.totalStockValueAtCost || 0;
    const totalInvestmentGlobal = financialMetrics?.totalInvestment || 0; // Renombrado para claridad
    const totalRevenueGlobal = financialMetrics?.totalRevenue || 0;       // Renombrado para claridad
    const netProfitGlobal = financialMetrics?.netProfit || 0;             // Renombrado para claridad

    // --- KPIs GLOBALES DE STOCK ---
    const totalUniqueProducts = products?.length || 0;
    const LOW_STOCK_THRESHOLD = 10;
    const lowStockProductsCount = products?.filter(p => p.currentStock < LOW_STOCK_THRESHOLD).length || 0;

    // --- CÁLCULO DE MÉTRICAS DE VENTAS PERSONALES PARA currentUser ---
    const userSalesMetrics = useMemo(() => {
        if (!currentUser || !stockMovements || !products) {
            return { unitsSold: 0, revenue: 0, cogs: 0, netProfit: 0, topSoldProducts: [] };
        }

        let currentUserUnitsSold = 0;
        let currentUserRevenue = 0;
        let currentUserCOGS = 0;
        const salesByProductForUser = {};

        stockMovements.forEach(movement => {
            if (movement.type === 'venta' && movement.userId === currentUser.uid && movement.quantityChange < 0) {
                const product = products.find(p => p.id === movement.productId);
                if (product) {
                    const quantitySold = Math.abs(movement.quantityChange);
                    const salePrice = Number(product.salePrice) || 0;
                    const costPrice = Number(product.costPrice) || 0;

                    currentUserUnitsSold += quantitySold;
                    currentUserRevenue += quantitySold * salePrice;
                    currentUserCOGS += quantitySold * costPrice;

                    // Para el top de productos vendidos por el usuario
                    salesByProductForUser[movement.productId] = (salesByProductForUser[movement.productId] || 0) + quantitySold;
                }
            }
        });

        const currentUserNetProfit = currentUserRevenue - currentUserCOGS;

        const topSoldProductsDetails = Object.keys(salesByProductForUser).map(productId => {
            const productInfo = products.find(p => p.id === productId);
            return {
                id: productId,
                name: productInfo?.name || 'Producto Desconocido',
                unitsSold: salesByProductForUser[productId]
            };
        }).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);

        return {
            unitsSold: currentUserUnitsSold,
            revenue: currentUserRevenue,
            cogs: currentUserCOGS,
            netProfit: currentUserNetProfit,
            topSoldProducts: topSoldProductsDetails
        };
    }, [currentUser, stockMovements, products]);

    // --- DATOS PARA GRÁFICOS GLOBALES (sin cambios en su lógica de cálculo) ---
    const topSellingProductsGlobal = useMemo(() => { // Renombrado para claridad
        if (!stockMovements || !products || stockMovements.length === 0 || products.length === 0) return [];
        const salesByProduct = {};
        stockMovements.forEach(movement => {
            if (movement.type === 'venta' && movement.quantityChange < 0) {
                const quantitySold = Math.abs(movement.quantityChange);
                salesByProduct[movement.productId] = (salesByProduct[movement.productId] || 0) + quantitySold;
            }
        });
        const details = Object.keys(salesByProduct).map(productId => {
            const productInfo = products.find(p => p.id === productId);
            return { id: productId, name: productInfo?.name || 'Producto Desconocido', unitsSold: salesByProduct[productId] };
        });
        return details.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
    }, [stockMovements, products]);

    const topProfitableProductsGlobal = useMemo(() => { // Renombrado para claridad
        if (!stockMovements || !products || stockMovements.length === 0 || products.length === 0) return [];
        const profitByProduct = {};
        stockMovements.forEach(movement => {
            if (movement.type === 'venta' && movement.quantityChange < 0) {
                const productInfo = products.find(p => p.id === movement.productId);
                if (productInfo) {
                    const quantitySold = Math.abs(movement.quantityChange);
                    const profitPerUnit = (Number(productInfo.salePrice) || 0) - (Number(productInfo.costPrice) || 0);
                    profitByProduct[movement.productId] = (profitByProduct[movement.productId] || 0) + (profitPerUnit * quantitySold);
                }
            }
        });
        const details = Object.keys(profitByProduct).map(productId => {
            const productInfo = products.find(p => p.id === productId);
            return {
                id: productId,
                name: productInfo?.name || 'Producto Desconocido',
                totalProfit: profitByProduct[productId]
            };
        });
        return details.filter(p => p.totalProfit > 0)
                      .sort((a, b) => b.totalProfit - a.totalProfit)
                      .slice(0, 5);
    }, [stockMovements, products]);

    const salesByCategoryChartData = useMemo(() => {
        // ... (lógica sin cambios)
        if (!stockMovements || !products || !categories || !products.length || !categories.length) return [];
        const unitsSoldPerCategory = {};
        categories.forEach(cat => { unitsSoldPerCategory[cat.name] = 0; });
        stockMovements.forEach(movement => {
            if (movement.type === 'venta' && movement.quantityChange < 0) {
                const productInfo = products.find(p => p.id === movement.productId);
                if (productInfo && productInfo.category) {
                    unitsSoldPerCategory[productInfo.category] = (unitsSoldPerCategory[productInfo.category] || 0) + Math.abs(movement.quantityChange);
                }
            }
        });
        return Object.keys(unitsSoldPerCategory).map(categoryName => ({ name: categoryName, value: unitsSoldPerCategory[categoryName] })).filter(data => data.value > 0);
    }, [stockMovements, products, categories]);

    const stockValueByCategoryChartData = useMemo(() => {
        // ... (lógica sin cambios)
        if (!products || !categories || products.length === 0 || categories.length === 0) {
            return [];
        }
        const valuePerCategory = {};
        categories.forEach(cat => {
            valuePerCategory[cat.name] = 0;
        });
        products.forEach(product => {
            if (product.category && valuePerCategory.hasOwnProperty(product.category)) {
                const stock = Number(product.currentStock) || 0;
                const cost = Number(product.costPrice) || 0;
                valuePerCategory[product.category] += (stock * cost);
            }
        });
        return Object.keys(valuePerCategory)
            .map(categoryName => ({
                name: categoryName,
                value: valuePerCategory[categoryName]
            }))
            .filter(data => data.value > 0)
            .sort((a,b) => b.value - a.value);
    }, [products, categories]);


    const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF4560', '#775DD0'];
    const BAR_CHART_FILL_COLOR_VENTAS = "#0ea5e9";
    const BAR_CHART_FILL_COLOR_GANANCIA = "#22c55e";
    const BAR_CHART_FILL_COLOR_STOCK_VALUE = "#f59e0b";
    const BAR_CHART_FILL_COLOR_USER_SALES = "#8884d8"; // Nuevo color para ventas de usuario

    return (
        <section id="dashboard-section" className="content-section">
            <h2>Dashboard Principal</h2>

            {/* --- KPIs GLOBALES FINANCIEROS --- */}
            <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Resumen Financiero Global</h3>
            <div className="kpi-grid">
                <div className="kpi-card"><h4>Valor Inventario (Costo)</h4><p className="kpi-value">${totalStockValueAtCost.toFixed(2)}</p></div>
                <div className="kpi-card"><h4>Total Invertido (Global)</h4><p className="kpi-value">${totalInvestmentGlobal.toFixed(2)}</p></div>
                <div className="kpi-card"><h4>Ingresos Brutos (Global)</h4><p className="kpi-value">${totalRevenueGlobal.toFixed(2)}</p></div>
                <div className="kpi-card"><h4>Ganancia Neta (Global)</h4><p className={`kpi-value ${netProfitGlobal >= 0 ? 'text-success' : 'text-danger'}`}>${netProfitGlobal.toFixed(2)}</p></div>
            </div>

            {/* --- KPIs PERSONALES DEL USUARIO --- */}
            {currentUser && (
                <>
                    <h3 style={{ marginTop: '30px', marginBottom: '10px' }}>Mi Rendimiento de Ventas ({currentUser.displayName || currentUser.email})</h3>
                    <div className="kpi-grid">
                        <div className="kpi-card"><h4>Mis Unidades Vendidas</h4><p className="kpi-value">{userSalesMetrics.unitsSold}</p></div>
                        <div className="kpi-card"><h4>Mis Ingresos por Ventas</h4><p className="kpi-value">${userSalesMetrics.revenue.toFixed(2)}</p></div>
                        <div className="kpi-card"><h4>Mi Ganancia Neta por Ventas</h4><p className={`kpi-value ${userSalesMetrics.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>${userSalesMetrics.netProfit.toFixed(2)}</p></div>
                        <div className="kpi-card kpi-card-large">
                            <h4>Mis Top 5 Productos Vendidos (Unidades)</h4>
                            {userSalesMetrics.topSoldProducts.length > 0 ? (
                                <ol style={{ paddingLeft: '20px', textAlign: 'left', fontSize: '0.9em' }}>
                                    {userSalesMetrics.topSoldProducts.map(product => (
                                        <li key={product.id} style={{ marginBottom: '3px' }}>{product.name}: <strong>{product.unitsSold}</strong></li>
                                    ))}
                                </ol>
                            ) : (<p>Aún no has registrado ventas.</p>)}
                        </div>
                    </div>
                </>
            )}

            {/* --- RESUMEN DE STOCK GLOBAL Y PRODUCTOS DESTACADOS GLOBALES --- */}
            <h3 style={{ marginTop: '30px', marginBottom: '10px' }}>Resumen de Stock y Productos Destacados (Global)</h3>
            <div className="kpi-grid">
                 <div className="kpi-card"><h4>Productos Diferentes (Global)</h4><p className="kpi-value">{totalUniqueProducts}</p></div>
                <div className="kpi-card"><h4>Productos Bajo Stock (&lt;{LOW_STOCK_THRESHOLD})</h4><p className="kpi-value">{lowStockProductsCount}</p></div>
                 <div className="kpi-card kpi-card-large">
                    <h4>Top 5 Productos Más Vendidos (Global - Unidades)</h4>
                    {topSellingProductsGlobal.length > 0 ? (<ol style={{ paddingLeft: '20px', textAlign: 'left', fontSize: '0.9em' }}>{topSellingProductsGlobal.map(product => (<li key={product.id} style={{ marginBottom: '3px' }}>{product.name}: <strong>{product.unitsSold}</strong></li>))}</ol>) : (<p>No hay datos de ventas globales.</p>)}
                </div>
                <div className="kpi-card kpi-card-large">
                    <h4>Top 5 Productos Más Rentables (Global - Ganancia)</h4>
                    {topProfitableProductsGlobal.length > 0 ? (<ol style={{ paddingLeft: '20px', textAlign: 'left', fontSize: '0.9em' }}>{topProfitableProductsGlobal.map(product => (<li key={product.id} style={{ marginBottom: '3px' }}>{product.name}: <strong>${product.totalProfit.toFixed(2)}</strong></li>))}</ol>) : (<p>No hay datos de rentabilidad global.</p>)}
                </div>
            </div>

            {/* --- GRÁFICOS GLOBALES --- */}
            <h3 style={{ marginTop: '30px', marginBottom: '10px' }}>Visualizaciones Globales</h3>
            <div className="charts-grid">
                <div className="chart-card">
                    <h4>Distribución de Ventas por Categoría (Global - Unidades)</h4>
                    {salesByCategoryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={salesByCategoryChartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                    {salesByCategoryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value} unidades`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : ( <p>No hay datos de ventas por categoría.</p> )}
                </div>

                <div className="chart-card">
                    <h4>Top 5 Productos Más Vendidos (Global - Unidades)</h4>
                    {topSellingProductsGlobal.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topSellingProductsGlobal} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }} >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `${value} unidades`} />
                                <Legend />
                                <Bar dataKey="unitsSold" name="Unidades Vendidas" fill={BAR_CHART_FILL_COLOR_VENTAS} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : ( <p>No hay datos de ventas globales.</p> )}
                </div>

                <div className="chart-card">
                    <h4>Top 5 Productos Más Rentables (Global - Ganancia)</h4>
                    {topProfitableProductsGlobal.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topProfitableProductsGlobal} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="totalProfit" name="Ganancia Total" fill={BAR_CHART_FILL_COLOR_GANANCIA} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : ( <p>No hay datos de rentabilidad global.</p> )}
                </div>

                <div className="chart-card">
                    <h4>Valor de Stock por Categoría (Global - Costo)</h4>
                    {stockValueByCategoryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stockValueByCategoryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="value" name="Valor de Stock" fill={BAR_CHART_FILL_COLOR_STOCK_VALUE} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : ( <p>No hay datos de stock por categoría.</p> )}
                </div>

                {/* --- GRÁFICO PERSONAL DEL USUARIO --- */}
                {currentUser && userSalesMetrics.topSoldProducts.length > 0 && (
                     <div className="chart-card">
                        <h4>Mis Top 5 Productos Vendidos (Unidades)</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={userSalesMetrics.topSoldProducts} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }} >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `${value} unidades`} />
                                <Legend />
                                <Bar dataKey="unitsSold" name="Unidades Vendidas por Mí" fill={BAR_CHART_FILL_COLOR_USER_SALES} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

            </div>

            <hr style={{ margin: '30px 0' }}/>
            <div className="placeholder-text" style={{marginTop: '20px'}}>
                Próximamente: Más gráficos y análisis detallados.
            </div>
        </section>
    );
};

export default DashboardPage;
