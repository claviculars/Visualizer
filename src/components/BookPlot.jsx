import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const BookPlot = ({ timeline }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  // ─── Depth snapshot chart ───
  const depthOption = useMemo(() => {
    if (!timeline?.length) return {};
    const row = timeline[selectedIdx] || timeline[0];

    // Build bid side: cumulative from best (level 1) outward
    const bidPoints = [];
    let bidCum = 0;
    for (let i = 1; i <= 3; i++) {
      const p = row[`bid_price_${i}`];
      const v = row[`bid_volume_${i}`];
      if (p != null && v != null && v > 0) {
        bidCum += v;
        bidPoints.push([p, bidCum]);
      }
    }
    // Reverse so chart reads left-to-right: worst bid → best bid (descending cum vol)
    bidPoints.reverse();

    // Build ask side: cumulative from best (level 1) outward
    const askPoints = [];
    let askCum = 0;
    for (let i = 1; i <= 3; i++) {
      const p = row[`ask_price_${i}`];
      const v = row[`ask_volume_${i}`];
      if (p != null && v != null && v > 0) {
        askCum += v;
        askPoints.push([p, askCum]);
      }
    }

    const spread = (row.ask_price_1 != null && row.bid_price_1 != null)
      ? (row.ask_price_1 - row.bid_price_1).toFixed(2)
      : 'N/A';
    const imbalance = (bidCum + askCum > 0)
      ? ((bidCum - askCum) / (bidCum + askCum) * 100).toFixed(1)
      : '0.0';

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 100,
      title: {
        text: `T = ${row.timestamp}   |   Spread: ${spread}   |   Bid Vol: ${bidCum}   |   Ask Vol: ${askCum}   |   Imbalance: ${imbalance}%`,
        left: 'center',
        top: 8,
        textStyle: { color: '#a1a1aa', fontSize: 11, fontWeight: 'normal' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 15, 20, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#f8f9fa' },
        formatter: (params) => {
          return params.map(p =>
            `<span style="color:${p.color};font-weight:600">${p.seriesName}</span>: Price ${p.value[0]}, Cum. Vol ${p.value[1]}`
          ).join('<br/>');
        }
      },
      grid: { left: '5%', right: '5%', bottom: '10%', top: '18%', containLabel: true },
      xAxis: {
        type: 'value',
        scale: true,
        name: 'Price',
        nameLocation: 'center',
        nameGap: 25,
        nameTextStyle: { color: '#6b7280', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } },
        axisLabel: { color: '#a1a1aa' }
      },
      yAxis: {
        type: 'value',
        name: 'Cumulative Volume',
        nameTextStyle: { color: '#6b7280', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } },
        axisLabel: { color: '#a1a1aa' }
      },
      series: [
        {
          name: 'Bids',
          type: 'line',
          step: 'end',
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#3b82f6' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
              ]
            }
          },
          itemStyle: { color: '#3b82f6' },
          data: bidPoints
        },
        {
          name: 'Asks',
          type: 'line',
          step: 'start',
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#ef4444' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.4)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
              ]
            }
          },
          itemStyle: { color: '#ef4444' },
          data: askPoints
        }
      ]
    };
  }, [timeline, selectedIdx]);

  // ─── Spread & volume over time chart ───
  const spreadOption = useMemo(() => {
    if (!timeline?.length) return {};

    const spreadData = [];
    const bidVolData = [];
    const askVolData = [];

    timeline.forEach(row => {
      const ts = row.timestamp;
      const sp = (row.ask_price_1 != null && row.bid_price_1 != null)
        ? row.ask_price_1 - row.bid_price_1
        : null;
      spreadData.push([ts, sp]);

      let bv = 0, av = 0;
      for (let i = 1; i <= 3; i++) {
        bv += (row[`bid_volume_${i}`] || 0);
        av += (row[`ask_volume_${i}`] || 0);
      }
      bidVolData.push([ts, bv]);
      askVolData.push([ts, av]);
    });

    return {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#333' } },
        backgroundColor: 'rgba(15, 15, 20, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#f8f9fa' }
      },
      legend: {
        data: ['Spread', 'Total Bid Vol', 'Total Ask Vol'],
        textStyle: { color: '#a1a1aa', fontSize: 11 },
        top: 5,
        left: 'center',
        itemGap: 20
      },
      grid: { left: '5%', right: '8%', bottom: '15%', top: '16%', containLabel: true },
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
          name: 'Spread',
          nameTextStyle: { color: '#6b7280', fontSize: 11 },
          splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } },
          axisLabel: { color: '#a1a1aa' }
        },
        {
          type: 'value',
          scale: true,
          name: 'Volume',
          nameTextStyle: { color: '#6b7280', fontSize: 11 },
          splitLine: { show: false },
          axisLabel: { color: '#a1a1aa' },
          position: 'right'
        }
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, filterMode: 'filter' },
        {
          type: 'slider', xAxisIndex: 0, bottom: 0,
          textStyle: { color: '#a1a1aa' },
          borderColor: 'rgba(255,255,255,0.05)',
          fillerColor: 'rgba(59, 130, 246, 0.2)',
          handleStyle: { color: '#fff' }
        }
      ],
      series: [
        {
          name: 'Spread',
          type: 'line',
          symbol: 'none',
          lineStyle: { width: 1.5, color: '#eab308' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(234, 179, 8, 0.15)' },
                { offset: 1, color: 'rgba(234, 179, 8, 0)' }
              ]
            }
          },
          markArea: undefined,
          data: spreadData
        },
        {
          name: 'Total Bid Vol',
          type: 'line',
          symbol: 'none',
          yAxisIndex: 1,
          lineStyle: { width: 1, color: 'rgba(59, 130, 246, 0.6)' },
          data: bidVolData
        },
        {
          name: 'Total Ask Vol',
          type: 'line',
          symbol: 'none',
          yAxisIndex: 1,
          lineStyle: { width: 1, color: 'rgba(239, 68, 68, 0.6)' },
          data: askVolData
        }
      ]
    };
  }, [timeline]);

  if (!timeline?.length) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">No book data available</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Time Slider */}
      <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="heading-sm" style={{ whiteSpace: 'nowrap' }}>Order Book Depth</span>
        <input
          type="range"
          min={0}
          max={timeline.length - 1}
          value={selectedIdx}
          onChange={(e) => setSelectedIdx(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#3b82f6', cursor: 'pointer' }}
        />
      </div>

      {/* Depth Snapshot */}
      <div style={{ flex: '1 1 50%', minHeight: 0 }}>
        <ReactECharts
          option={depthOption}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* Spread & Volume Over Time */}
      <div style={{ flex: '1 1 50%', minHeight: 0 }}>
        <ReactECharts
          option={spreadOption}
          style={{ height: '100%', width: '100%' }}
          notMerge={true}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  );
};

export default BookPlot;
