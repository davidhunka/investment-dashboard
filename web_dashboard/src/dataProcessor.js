import Papa from 'papaparse';

export const loadData = async () => {
  return new Promise((resolve, reject) => {
    Papa.parse('/PORTFOLIO.csv', {
      download: true,
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const raw = results.data;
        const parsed = raw.map(row => ({
          DATUM_SNAPSHOTU: new Date(row[0]),
          TYP_INVESTICE: row[2],
          HODNOTA: parseFloat(row[5]) || 0,
          PRIRUSTEK_M: parseFloat(row[8]) || 0,
          PRIRUSTEK_Y: parseFloat(row[9]) || 0,
          CELKOVY_ZISK: parseFloat(row[12]) || 0
        })).filter(row => !isNaN(row.DATUM_SNAPSHOTU.getTime()));

        // Normalizace datumu na YYYY-MM
        parsed.forEach(row => {
          row.YEAR_MONTH = `${row.DATUM_SNAPSHOTU.getFullYear()}-${String(row.DATUM_SNAPSHOTU.getMonth() + 1).padStart(2, '0')}`;
        });

        resolve(parsed);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const filterData = (data, selectedInvestments, monthsBack) => {
  const filteredTypes = data.filter(d => selectedInvestments.includes(d.TYP_INVESTICE));
  
  if (filteredTypes.length === 0) return [];

  // Zjisti nejnovější měsíc
  const sortedDates = [...new Set(filteredTypes.map(d => d.YEAR_MONTH))].sort();
  const latestDateStr = sortedDates[sortedDates.length - 1];
  if (!latestDateStr) return [];
  
  const latestDateObj = new Date(`${latestDateStr}-01`);
  const startDateObj = new Date(latestDateObj);
  startDateObj.setMonth(startDateObj.getMonth() - (monthsBack - 1));
  const startStr = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}`;

  return filteredTypes.filter(d => d.YEAR_MONTH >= startStr);
};

export const getAggregates = (data) => {
  if (data.length === 0) return null;

  const sortedDates = [...new Set(data.map(d => d.YEAR_MONTH))].sort();
  const latestDate = sortedDates[sortedDates.length - 1];
  
  const latestVals = data.filter(d => d.YEAR_MONTH === latestDate);
  const totalNow = latestVals.reduce((sum, d) => sum + d.HODNOTA, 0);
  const m2m = latestVals.reduce((sum, d) => sum + d.PRIRUSTEK_M, 0);
  const yoy = latestVals.reduce((sum, d) => sum + d.PRIRUSTEK_Y, 0);
  
  const totalProfit = latestVals.reduce((sum, d) => sum + d.CELKOVY_ZISK, 0);
  
  let totalMaxVklad = 0;
  const types = [...new Set(data.map(d => d.TYP_INVESTICE))];
  types.forEach(type => {
      const typeData = data.filter(d => d.TYP_INVESTICE === type);
      let maxVklad = 0;
      typeData.forEach(d => {
          const v = d.HODNOTA - d.CELKOVY_ZISK;
          if (v > maxVklad) maxVklad = v;
      });
      totalMaxVklad += maxVklad;
  });
  const totalRoi = totalMaxVklad > 0 ? (totalProfit / totalMaxVklad) * 100 : 0;

  // Time series for total
  const tsMap = {};
  data.forEach(d => {
    if (!tsMap[d.YEAR_MONTH]) tsMap[d.YEAR_MONTH] = 0;
    tsMap[d.YEAR_MONTH] += d.HODNOTA;
  });
  const ts = sortedDates.map(date => ({
    date,
    value: tsMap[date] || 0
  }));

  // Max Drawdown
  let maxDrawdown = 0;
  let rollingMax = 0;
  ts.forEach(point => {
    if (point.value > rollingMax) rollingMax = point.value;
    if (rollingMax > 0) {
      const dd = (point.value / rollingMax) - 1.0;
      if (dd < maxDrawdown) maxDrawdown = dd;
    }
  });

  const prevMonthTotal = ts.length > 1 ? ts[ts.length - 2].value : 0;
  const m2mPerc = prevMonthTotal > 0 ? (m2m / prevMonthTotal) * 100 : 0;
  
  const prevYearTotal = ts.length > 12 ? ts[ts.length - 13].value : 0;
  const yoyPerc = prevYearTotal > 0 ? (yoy / prevYearTotal) * 100 : 0;

  return {
    totalNow,
    m2m,
    m2mPerc,
    yoy,
    yoyPerc,
    totalProfit,
    totalRoi,
    ts,
    latestVals
  };
};

export const formatCZK = (val) => {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(val);
};

export const getPivotData = (data) => {
  if (data.length === 0) return { months: [], rows: [] };
  
  const sortedDates = [...new Set(data.map(d => d.YEAR_MONTH))].sort((a, b) => b.localeCompare(a));
  const types = [...new Set(data.map(d => d.TYP_INVESTICE))].sort();

  const rows = types.map(type => {
    const typeData = data.filter(d => d.TYP_INVESTICE === type);
    const latest = typeData.find(d => d.YEAR_MONTH === sortedDates[0]) || { HODNOTA: 0, CELKOVY_ZISK: 0, PRIRUSTEK_M: 0 };
    
    // Najdeme maximální historický vklad pro danou investici,
    // abychom zabránili explozi ROI při výběru peněz.
    let maxVklad = 0;
    typeData.forEach(d => {
      const vklad = d.HODNOTA - d.CELKOVY_ZISK;
      if (vklad > maxVklad) maxVklad = vklad;
    });
    
    const roi = maxVklad > 0 ? (latest.CELKOVY_ZISK / maxVklad) * 100 : 0;

    const prevYearDate = sortedDates[12];
    const prevYearVal = prevYearDate ? typeData.find(d => d.YEAR_MONTH === prevYearDate)?.HODNOTA || 0 : 0;
    const yoyProfit = latest.PRIRUSTEK_Y || 0;
    const yoyPerc = prevYearVal > 0 ? (yoyProfit / prevYearVal) * 100 : 0;

    const row = {
      type,
      total: latest.HODNOTA,
      profitAllTime: latest.CELKOVY_ZISK,
      roi,
      yoyPerc,
      months: {}
    };

    sortedDates.forEach(date => {
      const point = typeData.find(d => d.YEAR_MONTH === date);
      row.months[date] = point ? point.PRIRUSTEK_M : 0;
    });

    return row;
  });

  return { months: sortedDates, rows: rows.sort((a, b) => b.total - a.total) };
};

export const getIndexedData = (data) => {
  const types = [...new Set(data.map(d => d.TYP_INVESTICE))];
  const seriesData = types.map(type => {
    let typeData = data.filter(d => d.TYP_INVESTICE === type).sort((a, b) => a.YEAR_MONTH.localeCompare(b.YEAR_MONTH));
    if (typeData.length === 0) return null;
    
    let maxVklad = 0;
    // Zisk / Historicky nejvyšší Vklad = stabilní ROI
    let rois = typeData.map(d => {
      const vklad = d.HODNOTA - d.CELKOVY_ZISK;
      if (vklad > maxVklad) maxVklad = vklad;
      return maxVklad > 0 ? (d.CELKOVY_ZISK / maxVklad) * 100 : 0;
    });
    
    const roiStart = rois[0] || 0;
    const indexedVals = rois.map(r => r - roiStart);
    
    return {
      name: type,
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: typeData.map((d, i) => [d.YEAR_MONTH, indexedVals[i]])
    };
  }).filter(Boolean);

  return seriesData;
};
