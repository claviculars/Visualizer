import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const MainPlot = ({ timeline, trades, filters, activeIndicators }) => {
  const option = useMemo(() => {
    if (!timeline || timeline.length === 0) return {};

    const series = [];
    
    // Extractor helper to map data into [x, y] tuples for ECharts
    const extractLineData = (key) => timeline.map(row => [row.timestamp, row[key]]);

    // Depth Lines (Bids and Asks)
    // Always push the series object to maintain strict index order for proper notMerge={false} 
    // If the filter is disabled, pass an empty dataset `[]` so Echarts smoothly removes the line.
    
    // Asks
    series.push({
      name: 'Ask 3', type: 'line', step: 'end', symbol: 'none',
      lineStyle: { width: 1, color: 'rgba(239, 68, 68, 0.08)' },
      data: filters.levels ? extractLineData('ask_price_3') : []
    });
    series.push({
      name: 'Ask 2', type: 'line', step: 'end', symbol: 'none',
      lineStyle: { width: 1, color: 'rgba(239, 68, 68, 0.15)' },
      data: filters.levels ? extractLineData('ask_price_2') : []
    });
    series.push({
      name: 'Ask 1', type: 'line', step: 'end', symbol: 'none',
      lineStyle: { width: 1, color: 'rgba(239, 68, 68, 0.35)' }, 
      data: filters.levels ? extractLineData('ask_price_1') : []
    });
    
    // Bids
    series.push({
      name: 'Bid 1', type: 'line', step: 'end', symbol: 'none',
      lineStyle: { width: 1, color: 'rgba(59, 130, 246, 0.35)' }, 
      data: filters.levels ? extractLineData('bid_price_1') : []
    });
    series.push({
      name: 'Bid 2', type: 'line', step: 'end', symbol: 'none',
      lineStyle: { width: 1, color: 'rgba(59, 130, 246, 0.15)' },
      data: filters.levels ? extractLineData('bid_price_2') : []
    });
    series.push({
      name: 'Bid 3', type: 'line', step: 'end', symbol: 'none',
      lineStyle: { width: 1, color: 'rgba(59, 130, 246, 0.08)' },
      data: filters.levels ? extractLineData('bid_price_3') : []
    });

    // Mid Price (always visible)
    const midPriceData = timeline.map(row => [row.timestamp, row.mid_price, row.position || 0]);
    const firstMid = timeline[0]?.mid_price || 0;
    
    series.push({
      name: 'Mid Price', type: 'line', step: 'end', symbol: 'none',
      lineStyle: { width: 1, type: 'dashed', color: 'rgba(255, 255, 255, 0.25)' }, 
      data: midPriceData
    });

    // Find all custom indicators statically present in this timeline to ensure identical array mappings.
    // This prevents series from silently sticking on the graph due to variable element counts!
    const availableIndicators = [];
    Object.keys(timeline[0] || {}).forEach(key => {
      if (key.startsWith('ind_')) availableIndicators.push(key.replace('ind_', ''));
    });
    // Sort to keep it rigidly deterministic
    availableIndicators.sort();

    const indColors = ['#eab308', '#a855f7', '#ec4899', '#06b6d4', '#f97316'];
    
    availableIndicators.forEach((ind, indIdx) => {
      const isActive = activeIndicators[ind];
      const indData = extractLineData(`ind_${ind}`);
      
      let yIdx = 0;
      // Smart routing: if indicator value is radically different from price, route to secondary Y axis
      const firstValIndex = indData.findIndex(d => d[1] != null);
      if (firstValIndex !== -1 && firstMid > 0) {
          const val = indData[firstValIndex][1];
          if (val < firstMid * 0.5 || val > firstMid * 1.5) {
              yIdx = 1;
          }
      }
      
      series.push({
        name: ind, type: 'line', symbol: 'none', smooth: true,
        yAxisIndex: yIdx,
        lineStyle: { width: 2, color: indColors[indIdx % indColors.length] },
        data: isActive ? indData : []
      });
    });

    // Trades Scatter Overlays
    const myBuys = [];
    const mySells = [];
    const marketTradesData = [];

    // Triage trades out.
    trades.forEach(t => {
      const dataPoint = {
        value: [t.timestamp, t.price],
        tradeInfo: t
      };
      if (t.type === 'own') {
        if (t.buyer === "SUBMISSION") myBuys.push(dataPoint);
        else mySells.push(dataPoint);
      } else {
        marketTradesData.push(dataPoint);
      }
    });

    // We ALWAYS push these to the series. If disabled, we push an empty array `[]`.
    series.push({
      name: 'My Buys',
      type: 'scatter',
      symbol: 'arrow', 
      symbolSize: 14,
      itemStyle: { color: '#10b981' }, // Green Buy
      zlevel: 10,
      label: {
        show: filters.showQuantity || false,
        position: 'top',
        formatter: (params) => params.data?.tradeInfo?.quantity || '',
        color: '#ffffff',
        textBorderColor: '#10b981',
        textBorderWidth: 2,
        fontWeight: 'bold',
        distance: 5
      },
      data: filters.own ? myBuys : []
    });
    
    series.push({
      name: 'My Sells',
      type: 'scatter',
      symbol: 'arrow', 
      symbolRotate: 180, // Arrow DOWN
      symbolSize: 14,
      itemStyle: { color: '#ef4444' }, // Red Sell
      zlevel: 10,
      label: {
        show: filters.showQuantity || false,
        position: 'bottom',
        formatter: (params) => params.data?.tradeInfo?.quantity || '',
        color: '#ffffff',
        textBorderColor: '#ef4444',
        textBorderWidth: 2,
        fontWeight: 'bold',
        distance: 5
      },
      data: filters.own ? mySells : []
    });

    series.push({
      name: 'Market Trades',
      type: 'scatter',
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: 'rgba(255,255,255,0.4)' },
      zlevel: 9,
      data: filters.market ? marketTradesData : []
    });

    return {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#333' } },
        backgroundColor: 'rgba(15, 15, 20, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#f8f9fa' },
        formatter: (params) => {
          let ts = params[0]?.axisValue;
          let tooltipHtml = `<div style="font-weight: 600; margin-bottom: 4px;">Timestamp: ${ts}</div>`;
          
          params.forEach(p => {
            // Because we pass empty datasets for disabled things, params will only contain actual non-empty series!
            if (p.seriesType === 'scatter') {
              const tr = p.data.tradeInfo;
              tooltipHtml += `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #333;">`;
              tooltipHtml += `<div style="color:${p.color}; font-weight:bold;">${p.seriesName} @ ${tr.price}</div>`;
              tooltipHtml += `<div>Qty: ${tr.quantity} | Buyer: ${tr.buyer || '-'} | Seller: ${tr.seller || '-'}</div>`;
              tooltipHtml += `</div>`;
            } else {
              if (p.value[1] != null) {
                tooltipHtml += `<div><span style="display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:${p.color}"></span>`;
                tooltipHtml += `<span style="color:#a1a1aa;">${p.seriesName}:</span> <span style="font-weight:600;">${p.value[1].toFixed(2)}</span></div>`;
                if (p.seriesName === 'Mid Price' && p.value[2] !== undefined) {
                  tooltipHtml += `<div><span style="display:inline-block;margin-right:5px;width:9px;height:9px;"></span>`;
                  tooltipHtml += `<span style="color:#3b82f6;">Open Position:</span> <span style="font-weight:600; color:#fff;">${p.value[2]}</span></div>`;
                }
              }
            }
          });
          return tooltipHtml;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        scale: true,
        splitLine: { show: false },
        axisLabel: { color: '#a1a1aa' }
      },
      yAxis: [
        {
          type: 'value',
          scale: true,
          splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } },
          axisLabel: { color: '#a1a1aa' }
        },
        {
          type: 'value',
          scale: true,
          splitLine: { show: false },
          axisLabel: { color: '#a1a1aa' },
          position: 'right'
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'filter'
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          bottom: 10,
          textStyle: { color: '#a1a1aa' },
          borderColor: 'rgba(255,255,255,0.05)',
          fillerColor: 'rgba(59, 130, 246, 0.2)',
          handleStyle: { color: '#fff' }
        }
      ],
      series: series
    };
  }, [timeline, trades, filters, activeIndicators]);

  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">No data available for this product</p>
      </div>
    );
  }

  return (
    <ReactECharts 
      option={option} 
      style={{ height: '100%', width: '100%' }} 
      notMerge={false} 
      opts={{ renderer: 'canvas' }} 
    />
  );
};

export default MainPlot;
