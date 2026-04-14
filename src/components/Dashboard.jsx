import React, { useState } from 'react';
import { Activity, LayoutDashboard, Settings2, RefreshCw } from 'lucide-react';
import MainPlot from './MainPlot';
import PnLPlot from './PnLPlot';

const Dashboard = ({ data, onReset }) => {
  const products = data.products;
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  
  // Custom indicator selections (from lambdaLogs)
  const productIndicators = data.data[selectedProduct]?.indicators || [];
  const [activeIndicators, setActiveIndicators] = useState({});

  // Filters
  const [tradeFilters, setTradeFilters] = useState({
    own: true,
    market: false,
    levels: true,
    showQuantity: false
  });

  const toggleIndicator = (ind) => {
    setActiveIndicators(prev => ({
      ...prev,
      [ind]: !prev[ind]
    }));
  };

  const toggleFilter = (filter) => {
    setTradeFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const currentData = data.data[selectedProduct];

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header className="glass-panel" style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div className="logo-container">
          <Activity className="logo-icon" size={24} />
          <h1 className="heading-md">Prosperity Visualizer</h1>
        </div>

        <div className="header-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="heading-sm" style={{ paddingRight: '8px' }}>Product</span>
            <select 
              className="product-selector"
              value={selectedProduct} 
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setActiveIndicators({}); // clear indicators on product change
              }}
            >
              {products.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          
          <button onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} /> New File
          </button>
        </div>
      </header>

      <main>
        <div className="control-bar">
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
            
            <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="heading-sm"><Settings2 size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> Filters</span>
              <div className="indicator-toggles">
                <label>
                  <input type="checkbox" checked={tradeFilters.levels} onChange={() => toggleFilter('levels')} />
                  Book Levels
                </label>
                <label>
                  <input type="checkbox" checked={tradeFilters.own} onChange={() => toggleFilter('own')} />
                  My Trades
                </label>
                <label>
                  <input type="checkbox" checked={tradeFilters.market} onChange={() => toggleFilter('market')} />
                  Market Trades
                </label>
                <label>
                  <input type="checkbox" checked={tradeFilters.showQuantity} onChange={() => toggleFilter('showQuantity')} />
                  Trade Qty
                </label>
              </div>
            </div>

            {productIndicators.length > 0 && (
              <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="heading-sm">Custom Lambda Indicators</span>
                <div className="indicator-toggles">
                  {productIndicators.map(ind => (
                    <label key={ind}>
                      <input 
                        type="checkbox" 
                        checked={activeIndicators[ind] || false} 
                        onChange={() => toggleIndicator(ind)}
                      />
                      {ind}
                    </label>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

        <div className="dashboard-grid">
          
          <div className="glass-panel plot-container">
            <MainPlot 
              key={`main_${selectedProduct}`}
              timeline={currentData.timeline} 
              trades={currentData.trades}
              filters={tradeFilters}
              activeIndicators={activeIndicators}
            />
          </div>

          <div className="glass-panel pnl-container">
            <PnLPlot 
              key={`pnl_${selectedProduct}`}
              timeline={currentData.timeline} 
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
