// src/components/pages/DashboardPage.jsx
import React, { useMemo } from 'react';
import { 
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const DashboardPage = ({ financialMetrics, products, stockMovements, categories }) => {
    // Extraer métricas financieras
    const totalStockValueAtCost = financialMetrics?.totalStockValueAtCost || 0;
    const totalInvestment = financialMetrics?.totalInvestment || 0;
    const totalRevenue = financialMetrics?.totalRevenue || 0;
    const netProfit = financialMetrics?.netProfit || 0;

    // Calcular KPIs de texto
    const totalUniqueProducts = products?.length || 0;
    const LOW_STOCK_THRESHOLD = 10; 
    const lowStockProductsCount = products?.filter(p => p.currentStock < LOW_STOCK_THRESHOLD).length || 0;

    const topSellingProducts = useMemo(() => {
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

    const topProfitableProducts = useMemo(() => {
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

    // --- NUEVO: Datos para Gráfico de Valor de Stock por Categoría ---
    const stockValueByCategoryChartData = useMemo(() => {
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
                value: valuePerCategory[categoryName] // 'value' para el gráfico de barras
            }))
            .filter(data => data.value > 0) // Mostrar solo categorías con valor de stock
            .sort((a,b) => b.value - a.value); // Opcional: ordenar por valor
    }, [products, categories]);


    const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF4560', '#775DD0'];
    const BAR_CHART_FILL_COLOR_VENTAS = "#0ea5e9"; // Tu --primary-color
    const BAR_CHART_FILL_COLOR_GANANCIA = "#22c55e"; // Tu --success-color
    const BAR_CHART_FILL_COLOR_STOCK_VALUE = "#f59e0b"; // Tu --warning-color

    return (
        <section id="dashboard-section" className="content-section">
            <h2>Dashboard Principal</h2>

            {/* Sección de KPIs Financieros */}
            <div className="kpi-grid" style={{ marginBottom: '30px' }}>
                <div className="kpi-card"><h3>Valor Inventario (Costo)</h3><p className="kpi-value">${totalStockValueAtCost.toFixed(2)}</p></div>
                <div className="kpi-card"><h3>Total Invertido</h3><p className="kpi-value">${totalInvestment.toFixed(2)}</p></div>
                <div className="kpi-card"><h3>Total Vendido (Ingresos)</h3><p className="kpi-value">${totalRevenue.toFixed(2)}</p></div>
                <div className="kpi-card"><h3>Ganancia Neta</h3><p className={`kpi-value ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>${netProfit.toFixed(2)}</p></div>
            </div>

            {/* Sección de Resumen de Stock y KPIs de Productos */}
            <h3>Resumen de Stock y Productos Destacados</h3>
            <div className="kpi-grid" style={{ marginBottom: '30px' }}>
                 <div className="kpi-card"><h4>Productos Diferentes</h4><p className="kpi-value">{totalUniqueProducts}</p></div>
                <div className="kpi-card"><h4>Productos Bajo Stock (&lt;{LOW_STOCK_THRESHOLD})</h4><p className="kpi-value">{lowStockProductsCount}</p></div>
                 <div className="kpi-card kpi-card-large"> 
                    <h4>Top 5 Productos Más Vendidos (Unidades)</h4>
                    {topSellingProducts.length > 0 ? (<ol style={{ paddingLeft: '20px', textAlign: 'left', fontSize: '0.9em' }}>{topSellingProducts.map(product => (<li key={product.id} style={{ marginBottom: '3px' }}>{product.name}: <strong>{product.unitsSold}</strong></li>))}</ol>) : (<p>No hay datos de ventas.</p>)}
                </div>
                <div className="kpi-card kpi-card-large">
                    <h4>Top 5 Productos Más Rentables (Ganancia)</h4>
                    {topProfitableProducts.length > 0 ? (<ol style={{ paddingLeft: '20px', textAlign: 'left', fontSize: '0.9em' }}>{topProfitableProducts.map(product => (<li key={product.id} style={{ marginBottom: '3px' }}>{product.name}: <strong>${product.totalProfit.toFixed(2)}</strong></li>))}</ol>) : (<p>No hay datos de rentabilidad.</p>)}
                </div>
            </div>
            
            <h3>Visualizaciones</h3>
            <div className="charts-grid" style={{ marginBottom: '30px' }}>
                <div className="chart-card"> 
                    <h4>Distribución de Ventas por Categoría (Unidades)</h4>
                    {salesByCategoryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={salesByCategoryChartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name">
                                    {salesByCategoryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value} unidades`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : ( <p>No hay suficientes datos de ventas para mostrar el gráfico por categoría.</p> )}
                </div>

                <div className="chart-card">
                    <h4>Top 5 Productos Más Vendidos (Unidades) - Gráfico</h4>
                    {topSellingProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topSellingProducts} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }} >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `${value} unidades`} />
                                <Legend />
                                <Bar dataKey="unitsSold" name="Unidades Vendidas" fill={BAR_CHART_FILL_COLOR_VENTAS} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : ( <p>No hay suficientes datos de ventas para mostrar este gráfico.</p> )}
                </div>

                <div className="chart-card">
                    <h4>Top 5 Productos Más Rentables (Ganancia Total) - Gráfico</h4>
                    {topProfitableProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topProfitableProducts} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="totalProfit" name="Ganancia Total" fill={BAR_CHART_FILL_COLOR_GANANCIA} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : ( <p>No hay suficientes datos para mostrar los productos más rentables.</p> )}
                </div>

                {/* --- NUEVO GRÁFICO DE BARRAS: VALOR DE STOCK POR CATEGORÍA --- */}
                <div className="chart-card">
                    <h4>Valor de Stock por Categoría (Costo)</h4>
                    {stockValueByCategoryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={stockValueByCategoryChartData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="value" name="Valor de Stock" fill={BAR_CHART_FILL_COLOR_STOCK_VALUE} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p>No hay datos de stock para mostrar el valor por categoría.</p>
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
