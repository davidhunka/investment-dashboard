import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { loadData, filterData, getAggregates, formatCZK, getPivotData, getIndexedData, getInitialData } from './dataProcessor';
import './index.css';

const DEFAULT_HIDDEN = ["bonster", "coinbase", "zonky", "staveb"];

function App() {
  const [rawData, setRawData] = useState(() => getInitialData());
  const [allInvestments, setAllInvestments] = useState(() => {
    const init = getInitialData();
    return [...new Set(init.map(d => d.TYP_INVESTICE))].sort();
  });
  
  const [selectedInvestments, setSelectedInvestments] = useState(() => {
    const init = getInitialData();
    const uniqueTypes = [...new Set(init.map(d => d.TYP_INVESTICE))].sort();
    return uniqueTypes.filter(inv => !DEFAULT_HIDDEN.some(h => inv.toLowerCase().includes(h)));
  });
  const [monthsBack, setMonthsBack] = useState(36);

  useEffect(() => {
    loadData().then(data => {
      if (data && data.length > 0) {
        setRawData(data);
        const uniqueTypes = [...new Set(data.map(d => d.TYP_INVESTICE))].sort();
        setAllInvestments(uniqueTypes);
      }
    }).catch(err => {
      console.warn('Background data sync failed, keeping initial data:', err);
    });
  }, []);

  const filteredData = useMemo(() => {
    if (rawData.length === 0) return [];
    return filterData(rawData, selectedInvestments, monthsBack);
  }, [rawData, selectedInvestments, monthsBack]);

  const agg = useMemo(() => getAggregates(filteredData), [filteredData]);
  const pivot = useMemo(() => getPivotData(filteredData), [filteredData]);
  const indexedSeries = useMemo(() => getIndexedData(filteredData), [filteredData]);

  // Vypocet celkovych sum pro tabulku
  
  const maxAbsProfit = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return 0;
    return Math.max(...filteredData.map(d => Math.abs(d.PRIRUSTEK_M)));
  }, [filteredData]);

  const tableTotals = useMemo(() => {
    const t = { total: 0, profitAllTime: 0, months: {} };
    if (pivot && pivot.rows) {
      t.total = pivot.rows.reduce((sum, r) => sum + r.total, 0);
      t.profitAllTime = pivot.rows.reduce((sum, r) => sum + r.profitAllTime, 0);
      pivot.months.forEach(m => {
        t.months[m] = pivot.rows.reduce((sum, r) => sum + (r.months[m] || 0), 0);
      });
    }
    return t;
  }, [pivot]);


  const handleToggleInvestment = (inv) => {
    if (selectedInvestments.includes(inv)) {
      setSelectedInvestments(selectedInvestments.filter(i => i !== inv));
    } else {
      setSelectedInvestments([...selectedInvestments, inv]);
    }
  };

  if (!rawData || rawData.length === 0) return <div style={{ color: '#f8fafc', padding: '2rem' }}>Načítám data...</div>;
  if (!agg) return <div style={{ color: '#f8fafc', padding: '2rem' }}>Žádná data pro vybrané filtry.</div>;

  // Chart configs
  const mainChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc' },
      formatter: (params) => {
        if (!params || !params.length) return '';
        let rel = `<div style="font-weight:bold;margin-bottom:4px;color:#94a3b8">${params[0].axisValueLabel}</div>`;
        params.forEach(p => {
          const val = typeof p.value === 'object' ? p.value.value : p.value;
          rel += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <span>${p.marker} ${p.seriesName}:</span>
            <strong style="color:${p.color}">${formatCZK(val)}</strong>
          </div>`;
        });
        return rel;
      }
    },
    legend: {
      data: ['Celková hodnota', 'Celkový zisk'],
      textStyle: { color: '#94a3b8' },
      top: 0,
      right: '2%'
    },
    grid: { left: '1%', right: '12%', bottom: '3%', top: '14%', containLabel: true },
    xAxis: { type: 'category', data: agg.ts.map(d => d.date), boundaryGap: false, splitLine: { show: false } },
    yAxis: [
      {
        type: 'value',
        name: 'Hodnota',
        nameTextStyle: { color: '#38bdf8' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { formatter: (val) => formatCZK(val), color: '#94a3b8' }
      },
      {
        type: 'value',
        name: 'Zisk',
        nameTextStyle: { color: '#34d399' },
        splitLine: { show: false },
        axisLabel: { formatter: (val) => formatCZK(val), color: '#34d399' }
      }
    ],
    series: [
      {
        name: 'Celková hodnota',
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        itemStyle: { color: '#38bdf8' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(56, 189, 248, 0.35)' }, { offset: 1, color: 'rgba(56, 189, 248, 0.01)' }]
          }
        },
        data: agg.ts.map((d, i) => {
          if (i === agg.ts.length - 1) {
            return {
              value: d.value,
              label: {
                show: true,
                position: 'top',
                distance: 8,
                color: '#38bdf8',
                fontSize: 12,
                fontWeight: 'bold',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                padding: [3, 6],
                borderRadius: 4,
                formatter: () => formatCZK(d.value)
              }
            };
          }
          return d.value;
        })
      },
      {
        name: 'Celkový zisk',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        itemStyle: { color: '#34d399' },
        lineStyle: { width: 2, type: 'dashed' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(52, 211, 153, 0.25)' }, { offset: 1, color: 'rgba(52, 211, 153, 0.01)' }]
          }
        },
        data: agg.ts.map((d, i) => {
          if (i === agg.ts.length - 1) {
            return {
              value: d.profit,
              label: {
                show: true,
                position: 'bottom',
                distance: 8,
                color: '#34d399',
                fontSize: 12,
                fontWeight: 'bold',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                padding: [3, 6],
                borderRadius: 4,
                formatter: () => formatCZK(d.profit)
              }
            };
          }
          return d.profit;
        })
      }
    ]
  };

  
  
  // Area Graf Slozeni Portfolia
  const compositionOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { show: true, bottom: 0, textStyle: { color: '#f8fafc' }, type: 'scroll' },
    grid: { left: '1%', right: '1%', bottom: '10%', containLabel: true },
    xAxis: [{ type: 'category', boundaryGap: false, data: agg.ts.map(d => d.date), splitLine: { show: false } }],
    yAxis: [{ type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { formatter: (val) => formatCZK(val) } }],
    series: pivot.rows.map(r => {
      const tData = filteredData.filter(d => d.TYP_INVESTICE === r.type);
      return {
        name: r.type,
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: { focus: 'series' },
        showSymbol: false,
        data: agg.ts.map(tsDate => {
          const point = tData.find(d => d.YEAR_MONTH === tsDate.date);
          return point ? point.HODNOTA : 0;
        })
      };
    })
  };

  const indexedOption = {
    tooltip: { trigger: 'axis', valueFormatter: (val) => val.toFixed(1) + ' %' },
    grid: { left: '1%', right: '1%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false },
    yAxis: { type: 'value', axisLabel: { formatter: '{value} %' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    series: indexedSeries
  };


return (
    <div>
      <h1 className="header-title">✨ Investiční Portfolio</h1>
      
      <div className="glass-card controls-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <strong style={{ color: '#94a3b8' }}>Investice:</strong>
          {allInvestments.map(inv => (
            <button 
              key={inv} 
              onClick={() => handleToggleInvestment(inv)}
              style={{
                background: selectedInvestments.includes(inv) ? '#38bdf8' : 'transparent',
                color: selectedInvestments.includes(inv) ? '#0f172a' : '#94a3b8',
                border: `1px solid ${selectedInvestments.includes(inv) ? '#38bdf8' : '#334155'}`,
                padding: '4px 8px', borderRadius: '15px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem',
                transition: 'all 0.2s'
              }}
            >
              {inv}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Historie (M): <b>{monthsBack}</b></label>
          <input 
            type="range" min="3" max="120" value={monthsBack} 
            onChange={(e) => setMonthsBack(parseInt(e.target.value))}
            style={{ width: '150px' }}
          />
        </div>
      </div>

      <div className="main-layout-grid">
        <div className="kpi-grid">
          <div className="glass-card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ color: '#94a3b8', marginBottom: '0.2rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Celková Hodnota</div>
            <div className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 600 }}>{formatCZK(agg.totalNow)}</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ color: '#94a3b8', marginBottom: '0.2rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Zisk M/M</div>
            <div style={{ color: agg.m2m >= 0 ? '#4ade80' : '#f87171', fontSize: '1.8rem', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div>{agg.m2m > 0 ? '+' : ''}{formatCZK(agg.m2m)}</div>
              <div style={{ fontSize: '1.1rem', opacity: 0.8 }}>({agg.m2mPerc > 0 ? '+' : ''}{agg.m2mPerc.toFixed(1)} %)</div>
            </div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ color: '#94a3b8', marginBottom: '0.2rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Zisk Y/Y</div>
            <div style={{ color: agg.yoy >= 0 ? '#4ade80' : '#f87171', fontSize: '1.8rem', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div>{agg.yoy > 0 ? '+' : ''}{formatCZK(agg.yoy)}</div>
              <div style={{ fontSize: '1.1rem', opacity: 0.8 }}>({agg.yoyPerc > 0 ? '+' : ''}{agg.yoyPerc.toFixed(1)} %)</div>
            </div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ color: '#94a3b8', marginBottom: '0.2rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Celkový Zisk</div>
            <div style={{ color: agg.totalProfit >= 0 ? '#4ade80' : '#f87171', fontSize: '1.8rem', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div>{agg.totalProfit > 0 ? '+' : ''}{formatCZK(agg.totalProfit)}</div>
              <div style={{ fontSize: '1.1rem', opacity: 0.8 }}>({agg.totalRoi > 0 ? '+' : ''}{agg.totalRoi.toFixed(1)} %)</div>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>📈 Vývoj hodnoty ({monthsBack}M)</h2>
          <ReactECharts option={mainChartOption} style={{ height: '400px' }} theme="dark" />
        </div>
      </div>
      
      <div className="glass-card" style={{ marginBottom: '3rem', overflowX: 'auto' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>📊 Zisk M/M po měsících a Analýza Návratnosti</h2>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
              <th style={{ textAlign: 'left', padding: '12px' }}>Typ Investice</th>
              <th style={{ padding: '12px', color: '#f8fafc', whiteSpace: 'nowrap' }}>Celkem Hodnota</th>
              <th style={{ padding: '12px', color: '#38bdf8', whiteSpace: 'nowrap' }}>Zisk All-Time</th>
              <th style={{ padding: '12px', color: '#f472b6', whiteSpace: 'nowrap' }}>ROI %</th>
              <th style={{ padding: '12px', color: '#fbbf24', whiteSpace: 'nowrap' }}>Zisk 1 ROK %</th>
              {pivot.months.map(m => <th key={m} style={{ padding: '12px', whiteSpace: 'nowrap' }}>{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {pivot.rows.map(row => (
              <tr key={row.type} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ textAlign: 'left', padding: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>{row.type}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{formatCZK(row.total)}</td>
                <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{formatCZK(row.profitAllTime)}</td>
                <td style={{ padding: '12px', color: '#f472b6', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{row.roi.toFixed(1)} %</td>
                <td style={{ padding: '12px', color: '#fbbf24', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{row.yoyPerc.toFixed(1)} %</td>
                {pivot.months.map(m => (
                  <td key={m} style={{ 
                    padding: '12px', 
                    whiteSpace: 'nowrap', 
                    color: row.months[m] !== 0 ? '#fff' : '#94a3b8',
                    textAlign: 'center',
                    background: row.months[m] > 0 
                      ? `rgba(74, 222, 128, ${Math.min(Math.abs(row.months[m]) / (maxAbsProfit || 1) + 0.1, 1)})` 
                      : row.months[m] < 0 
                      ? `rgba(248, 113, 113, ${Math.min(Math.abs(row.months[m]) / (maxAbsProfit || 1) + 0.1, 1)})` 
                      : 'transparent',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.02)'
                  }}>
                    {row.months[m] ? formatCZK(row.months[m]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
            <tr style={{ background: 'rgba(255,255,255,0.05)', borderTop: '2px solid rgba(255,255,255,0.2)' }}>
              <td style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', color: '#f8fafc' }}>CELKEM</td>
              <td style={{ padding: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', color: '#f8fafc' }}>{formatCZK(tableTotals.total)}</td>
              <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{formatCZK(tableTotals.profitAllTime)}</td>
              <td style={{ padding: '12px', color: '#f472b6', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{agg.totalRoi.toFixed(1)} %</td>
              <td style={{ padding: '12px', color: '#fbbf24', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{agg.yoyPerc.toFixed(1)} %</td>
              {pivot.months.map(m => (
                <td key={m} style={{ padding: '12px', whiteSpace: 'nowrap', fontWeight: 'bold', color: tableTotals.months[m] > 0 ? '#4ade80' : tableTotals.months[m] < 0 ? '#f87171' : '#94a3b8' }}>
                  {tableTotals.months[m] ? formatCZK(tableTotals.months[m]) : '-'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="glass-card" style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>🍰 Složení portfolia v čase</h2>
        <ReactECharts option={compositionOption} style={{ height: '350px' }} theme="dark" />
      </div>


      <div className="kpi-row-grid">
        {pivot.rows.map(row => {
          const typeData = filteredData.filter(d => d.TYP_INVESTICE === row.type).sort((a,b) => a.YEAR_MONTH.localeCompare(b.YEAR_MONTH));
          const opt = {
            title: { text: row.type, textStyle: { color: '#f8fafc', fontSize: 16 } },
            tooltip: { trigger: 'axis' },
            legend: { show: true, bottom: 0, textStyle: { color: '#94a3b8' } },
            grid: { left: '2%', right: '2%', bottom: '15%', containLabel: true },
            xAxis: { type: 'category', data: typeData.map(d => d.YEAR_MONTH), splitLine: {show: false} },
            yAxis: [
              { type: 'value', name: 'Hodnota', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
              { type: 'value', name: 'Zisk M/M', splitLine: {show: false} }
            ],
            series: [
              { name: 'Hodnota', type: 'line', data: typeData.map(d => d.HODNOTA), smooth: true, itemStyle: {color: '#f8fafc'}, areaStyle: {color: 'rgba(255,255,255,0.1)'} },
              { name: 'Zisk M/M', type: 'bar', yAxisIndex: 1, data: typeData.map(d => d.PRIRUSTEK_M), itemStyle: {color: '#38bdf8'} }
            ]
          };
          return (
            <div key={row.type} className="glass-card">
              <ReactECharts option={opt} style={{ height: '250px' }} theme="dark" />
            </div>
          );
        })}
      </div>

      <div className="glass-card" style={{ marginBottom: '3rem', marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', textAlign: 'center' }}>🏎️ Indexované srovnání výkonnosti (Start na 0 %)</h2>
        <ReactECharts option={indexedOption} style={{ height: '500px' }} theme="dark" />
      </div>
    </div>
  );
}

export default App;
