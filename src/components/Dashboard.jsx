import React, { useState } from 'react';
import { Activity, LayoutDashboard, Settings2, RefreshCw, Plus, X, TrendingUp } from 'lucide-react';
import MainPlot from './MainPlot';
import PnLPlot from './PnLPlot';
import BookPlot from './BookPlot';

const MA_COLORS = ['#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];

const MA_METRICS = [
  { value: 'mid_price', label: 'Mid Price' },
  { value: 'bid_volume', label: 'Total Bid Vol' },
  { value: 'ask_volume', label: 'Total Ask Vol' },
  { value: 'spread', label: 'Spread' },
  { value: 'bid_price_1', label: 'Best Bid' },
  { value: 'ask_price_1', label: 'Best Ask' },
];

const Dashboard = ({ data, onReset }) => {
  const products = data.products;
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  
  // Custom indicator selections (from lambdaLogs)
  const productIndicators = data.data[selectedProduct]?.indicators || [];
  const [activeIndicators, setActiveIndicators] = useState({});

  // Moving Averages
  const [movingAverages, setMovingAverages] = useState([]);
  const [maInput, setMaInput] = useState('');
  const [maMetric, setMaMetric] = useState('mid_price');

  const addMA = () => {
    const period = parseInt(maInput, 10);
    if (!period || period < 2 || period > 5000) return;
    // Unique by period+metric combo
    if (movingAverages.find(ma => ma.period === period && ma.metric === maMetric)) return;
    const metricLabel = MA_METRICS.find(m => m.value === maMetric)?.label || maMetric;
    setMovingAverages(prev => [...prev, { period, metric: maMetric, metricLabel, color: MA_COLORS[prev.length % MA_COLORS.length] }]);
    setMaInput('');
  };

  const removeMA = (period, metric) => {
    setMovingAverages(prev => prev.filter(ma => !(ma.period === period && ma.metric === metric)));
  };

  // Filters
  const [tradeFilters, setTradeFilters] = useState({
    own: true,
    market: false,
    levels: true,
    showQuantity: false,
    bidVolume: false,
    askVolume: false
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
                <label>
                  <input type="checkbox" checked={tradeFilters.bidVolume} onChange={() => toggleFilter('bidVolume')} />
                  Bid Vol
                </label>
                <label>
                  <input type="checkbox" checked={tradeFilters.askVolume} onChange={() => toggleFilter('askVolume')} />
                  Ask Vol
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

            <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="heading-sm"><TrendingUp size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> Moving Avg</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={maMetric}
                  onChange={(e) => setMaMetric(e.target.value)}
                  style={{ padding: '4px 8px', minWidth: '120px' }}
                >
                  {MA_METRICS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={2}
                  max={5000}
                  placeholder="Period"
                  value={maInput}
                  onChange={(e) => setMaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMA()}
                  style={{ width: '80px', padding: '4px 8px' }}
                />
                <button onClick={addMA} style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="indicator-toggles">
                {movingAverages.map(ma => (
                  <span key={`${ma.metric}_${ma.period}`} className="ma-tag" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.875rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: ma.color, display: 'inline-block' }} />
                    MA({ma.period}) {ma.metricLabel}
                    <button onClick={() => removeMA(ma.period, ma.metric)} style={{ padding: '0 2px', background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex' }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
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
              movingAverages={movingAverages}
            />
          </div>

          <div className="glass-panel pnl-container">
            <PnLPlot 
              key={`pnl_${selectedProduct}`}
              timeline={currentData.timeline} 
            />
          </div>

          <div className="glass-panel book-container">
            <BookPlot 
              key={`book_${selectedProduct}`}
              timeline={currentData.timeline}
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
