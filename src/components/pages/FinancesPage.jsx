// src/components/pages/FinancesPage.jsx
import React from 'react';

const FinancesPage = ({ financialMetrics, products, stockMovements }) => {
    const totalStockValueAtCost = financialMetrics?.totalStockValueAtCost || 0;
    const totalInvestment = financialMetrics?.totalInvestment || 0;
    const totalRevenue = financialMetrics?.totalRevenue || 0;
    const totalCOGS = financialMetrics?.totalCOGS || 0;         // Nueva métrica
    const netProfit = financialMetrics?.netProfit || 0;         // Nueva métrica

    return (
        <section id="finances-section" className="content-section">
            <h2>Módulo Financiero</h2>
            
            <div className="kpi-grid">
                <div className="kpi-card">
                    <h3>Valor Total del Inventario (Costo)</h3>
                    <p className="kpi-value">${totalStockValueAtCost.toFixed(2)}</p> 
                </div>

                <div className="kpi-card">
                    <h3>Total Invertido (Compras)</h3>
                    <p className="kpi-value">${totalInvestment.toFixed(2)}</p>
                </div>

                <div className="kpi-card">
                    <h3>Total Vendido (Ingresos Brutos)</h3>
                    <p className="kpi-value">${totalRevenue.toFixed(2)}</p>
                </div>

                {/* --- NUEVA TARJETA PARA COGS --- */}
                <div className="kpi-card">
                    <h3>Costo de Bienes Vendidos (COGS)</h3>
                    <p className="kpi-value">${totalCOGS.toFixed(2)}</p>
                </div>

                {/* --- NUEVA TARJETA PARA GANANCIA NETA --- */}
                <div className="kpi-card">
                    <h3>Ganancia Neta (Utilidad Bruta)</h3>
                    <p className={`kpi-value ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                        ${netProfit.toFixed(2)}
                    </p>
                </div>
            </div>

            <hr style={{ margin: '30px 0' }} />

            <div className="placeholder-text">
                Más detalles financieros, tablas de ingresos, egresos y rentabilidad irán aquí.
            </div>
        </section>
    );
};

export default FinancesPage;