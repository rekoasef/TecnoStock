// src/components/pages/FinancesPage.jsx
import React, { useMemo } from 'react'; // Asegúrate de importar useMemo

const FinancesPage = ({ financialMetrics, products, stockMovements, currentUser }) => {
    // Métricas globales del inventario (directas de props)
    const totalStockValueAtCost = financialMetrics?.totalStockValueAtCost || 0;
    const totalInvestment = financialMetrics?.totalInvestment || 0; // Basado en compras globales

    // Cálculo de métricas de ventas personales para el currentUser
    const userSalesMetrics = useMemo(() => {
        if (!currentUser || !stockMovements || !products) {
            return { revenue: 0, cogs: 0, netProfit: 0 };
        }

        let currentUserRevenue = 0;
        let currentUserCOGS = 0;

        stockMovements.forEach(movement => {
            // Considerar solo las ventas ('venta') realizadas por el usuario actual
            if (movement.type === 'venta' && movement.userId === currentUser.uid && movement.quantityChange < 0) {
                const product = products.find(p => p.id === movement.productId);
                if (product) {
                    const quantitySold = Math.abs(movement.quantityChange);
                    const salePrice = Number(product.salePrice) || 0;
                    const costPrice = Number(product.costPrice) || 0;

                    currentUserRevenue += quantitySold * salePrice;
                    currentUserCOGS += quantitySold * costPrice;
                }
            }
        });

        const currentUserNetProfit = currentUserRevenue - currentUserCOGS;

        return {
            revenue: currentUserRevenue,
            cogs: currentUserCOGS,
            netProfit: currentUserNetProfit
        };
    }, [currentUser, stockMovements, products]); // Dependencias del cálculo

    return (
        <section id="finances-section" className="content-section">
            <h2>Módulo Financiero</h2>

            <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Finanzas Generales del Inventario</h3>
            <div className="kpi-grid">
                <div className="kpi-card">
                    <h4>Valor Total del Inventario (Costo)</h4>
                    <p className="kpi-value">${totalStockValueAtCost.toFixed(2)}</p>
                </div>
                <div className="kpi-card">
                    <h4>Total Invertido en Compras (Global)</h4>
                    <p className="kpi-value">${totalInvestment.toFixed(2)}</p>
                </div>
            </div>

            <hr style={{ margin: '30px 0' }} />

            {currentUser && (
                <>
                    <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>
                        Mis Finanzas (Rendimiento de Ventas de {currentUser.displayName || currentUser.email})
                    </h3>
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <h4>Mis Ingresos Brutos (Ventas)</h4>
                            <p className="kpi-value">${userSalesMetrics.revenue.toFixed(2)}</p>
                        </div>
                        <div className="kpi-card">
                            <h4>Mi Costo de Bienes Vendidos (por mis ventas)</h4>
                            <p className="kpi-value">${userSalesMetrics.cogs.toFixed(2)}</p>
                        </div>
                        <div className="kpi-card">
                            <h4>Mi Ganancia Neta (por mis ventas)</h4>
                            <p className={`kpi-value ${userSalesMetrics.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                ${userSalesMetrics.netProfit.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </>
            )}
            {!currentUser && (
                 <div className="placeholder-text">Inicia sesión para ver tus finanzas personales.</div>
            )}

            <hr style={{ margin: '30px 0' }} />
            <div className="placeholder-text">
                Próximamente: Más detalles y gráficos financieros personales y globales.
            </div>
        </section>
    );
};

export default FinancesPage;