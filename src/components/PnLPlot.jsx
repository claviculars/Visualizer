import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const PnLPlot = ({ timeline }) => {
  const option = useMemo(() => {
    if (!timeline || timeline.length === 0) return {};

    const pnlData = timeline.map(d => [d.timestamp, d.profit_and_loss]);

    return {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', animation: false },
        backgroundColor: 'rgba(15, 15, 20, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#f8f9fa' }
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        scale: true,
        splitLine: { show: false },
        axisLabel: { color: '#a1a1aa' }
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } },
        axisLabel: { color: '#a1a1aa' }
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'filter'
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          bottom: 0,
          textStyle: { color: '#a1a1aa' },
          borderColor: 'rgba(255,255,255,0.05)',
          fillerColor: 'rgba(59, 130, 246, 0.2)',
          handleStyle: { color: '#fff' }
        }
      ],
      series: [
        {
          name: 'Cumulative PnL',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#3b82f6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0.05, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 0.95, color: 'rgba(59, 130, 246, 0)' }
              ]
            }
          },
          data: pnlData
        }
      ]
    };
  }, [timeline]);

  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">No PnL data</p>
      </div>
    );
  }

  return (
    <ReactECharts 
      option={option} 
      style={{ height: '100%', width: '100%' }} 
      notMerge={true}
      opts={{ renderer: 'canvas' }} 
    />
  );
};

export default PnLPlot;
