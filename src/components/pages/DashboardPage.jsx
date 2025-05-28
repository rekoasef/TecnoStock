    // src/components/pages/DashboardPage.jsx
    import React, { useMemo } from 'react';
    // --- NUEVO: Importar Recharts como módulo ---
    import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

    const DashboardPage = ({ financialMetrics, products, stockMovements, categories }) => {
        // Ya NO necesitamos el estado rechartsLoaded ni el useEffect para cargar Recharts
        // const [rechartsLoaded, setRechartsLoaded] = useState(false);
        // useEffect(() => { /* ... código para window.Recharts ... */ }, []);

        // ... (tus cálculos useMemo para KPIs se mantienen igual) ...
        const totalStockValueAtCost = financialMetrics?.totalStockValueAtCost || 0;
        const totalInvestment = financialMetrics?.totalInvestment || 0;
        const totalRevenue = financialMetrics?.totalRevenue || 0;
        const netProfit = financialMetrics?.netProfit || 0;
        const totalUniqueProducts = products?.length || 0;
        const LOW_STOCK_THRESHOLD = 10; 
        const lowStockProductsCount = products?.filter(p => p.currentStock < LOW_STOCK_THRESHOLD).length || 0;

        const topSellingProducts = useMemo(() => {
            if (!stockMovements || !products || stockMovements.length === 0 || products.length === 0) return [];
            const salesByProduct = {};
            stockMovements.forEach(movement => {
                if (movement.type === 'venta' && movement.quantityChange < 0) {
                    salesByProduct[movement.productId] = (salesByProduct[movement.productId] || 0) + Math.abs(movement.quantityChange);
                }
            });
            const details = Object.keys(salesByProduct).map(productId => {
                const productInfo = products.find(p => p.id === productId);
                return { id: productId, name: productInfo?.name || 'Producto Desconocido', unitsSold: salesByProduct[productId] };
            });
            return details.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
        }, [stockMovements, products]);

        const topProfitableProducts = useMemo(() => {
            if (!stockMovements || !products || stockMovements.length === 0 || products.length === 0) return [];
            const profitByProduct = {};
            stockMovements.forEach(movement => {
                if (movement.type === 'venta' && movement.quantityChange < 0) {
                    const productInfo = products.find(p => p.id === movement.productId);
                    if (productInfo) {
                        const profitPerUnit = (Number(productInfo.salePrice) || 0) - (Number(productInfo.costPrice) || 0);
                        profitByProduct[movement.productId] = (profitByProduct[movement.productId] || 0) + (profitPerUnit * Math.abs(movement.quantityChange));
                    }
                }
            });
            const details = Object.keys(profitByProduct).map(productId => {
                const productInfo = products.find(p => p.id === productId);
                return { id: productId, name: productInfo?.name || 'Producto Desconocido', totalProfit: profitByProduct[productId] };
            });
            return details.sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 5);
        }, [stockMovements, products]);

        const salesByCategoryChartData = useMemo(() => {
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

        const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF4560', '#775DD0'];

        return (
            <section id="dashboard-section" className="content-section">
                <h2>Dashboard Principal</h2>
                
                {/* Sección de KPIs Financieros (sin cambios) */}
                <div className="kpi-grid" style={{ marginBottom: '30px' }}>
                    {/* ... tus kpi-cards ... */}
                </div>

                {/* Sección de Resumen de Stock y KPIs de Productos (sin cambios) */}
                <div className="kpi-grid" style={{ marginBottom: '30px' }}>
                    {/* ... tus kpi-cards ... */}
                </div>
                
                <h3>Visualizaciones</h3>
                <div className="charts-grid" style={{ marginBottom: '30px' }}>
                    <div className="chart-card"> 
                        <h4>Distribución de Ventas por Categoría (Unidades)</h4>
                        {salesByCategoryChartData.length > 0 ? (
                            // --- USAR COMPONENTES DE RECHARTS IMPORTADOS DIRECTAMENTE ---
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={salesByCategoryChartData}
                                        cx="50%" cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value" nameKey="name"
                                    >
                                        {salesByCategoryChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} unidades`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p>No hay suficientes datos de ventas para mostrar el gráfico por categoría.</p>
                        )}
                    </div>
                </div>
                
                <hr style={{ margin: '30px 0' }}/>
                <div className="placeholder-text" style={{marginTop: '20px'}}>
                    Próximamente: Más gráficos y análisis detallados.
                </div>
            </section>
        );
    };

    export default DashboardPage;
    