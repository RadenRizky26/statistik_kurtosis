"use client";

import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import StatsChart from './components/StatsChart';
import StatsTable from './components/StatsTable';
import Interpretation from './components/Interpretation';

// ==========================================
// 1. LOGIKA MATEMATIKA
// ==========================================
interface DetailedRow { 
  interval: string; mid: number; freq: number; 
  u: number; u2: number; u3: number; u4: number; 
  fu: number; fu2: number; fu3: number; fu4: number; 
}
interface HistogramResult { bins: { label: string; count: number; }[]; min: number; max: number; binWidth: number; }
interface StatsResult { 
  mean: number; median: number; mode: number[] | string[] | number; stdDev: number; variance: number; min: number; max: number; range: number; 
  q1: number; q3: number; iqr: number; p10: number; p90: number; percentileKurtosis: number; 
  lowerBound: number; upperBound: number; outliers: number[]; skewness: number; kurtosis: number; histogram: HistogramResult; rawDataArray: number[]; 
  detailedTable: DetailedRow[]; 
  tableTotals: { freq: number; fu: number; fu2: number; fu3: number; fu4: number; };
}
interface DataRow { id: number; x: string; f: string; }
type InputMode = 'single' | 'interval';

const calculateGroupedStats = (rows: DataRow[]): StatsResult => {
  const data = rows.map(r => {
    const f = parseInt(r.f); const cleanX = r.x.replace(/\s/g, '');
    let lower = 0, upper = 0, mid = 0;
    if (cleanX.includes('-')) { const parts = cleanX.split('-'); lower = parseFloat(parts[0]); upper = parseFloat(parts[1]); mid = (lower + upper) / 2; } 
    else { lower = parseFloat(cleanX); upper = parseFloat(cleanX); mid = lower; }
    return { lower, upper, mid, f, intervalString: cleanX };
  }).filter(d => !isNaN(d.mid) && d.f > 0);

  const totalN = data.reduce((acc, cur) => acc + cur.f, 0);

  // --- TABEL MOMEN (u, u^2, u^3, u^4) ---
  let maxFreq = -1; let modeIdx = -1;
  data.forEach((d, i) => { if (d.f > maxFreq) { maxFreq = d.f; modeIdx = i; } });

  const detailedTable: DetailedRow[] = data.map((d, i) => {
    const u = i - modeIdx; 
    const u2 = u * u;
    const u3 = u * u * u;
    const u4 = u * u * u * u;
    return { 
      interval: d.intervalString, mid: d.mid, freq: d.f, 
      u, u2, u3, u4, 
      fu: d.f * u, fu2: d.f * u2, fu3: d.f * u3, fu4: d.f * u4 
    };
  });

  const tableTotals = detailedTable.reduce((acc, cur) => ({
    freq: acc.freq + cur.freq, 
    fu: acc.fu + cur.fu, 
    fu2: acc.fu2 + cur.fu2,
    fu3: acc.fu3 + cur.fu3,
    fu4: acc.fu4 + cur.fu4
  }), { freq: 0, fu: 0, fu2: 0, fu3: 0, fu4: 0 });

  // --- STATISTIK DASAR ---
  const sumFX = data.reduce((acc, cur) => acc + (cur.f * cur.mid), 0); const mean = sumFX / totalN;
  const getInterpolatedValue = (targetN: number) => {
    let currentN = 0;
    for (let i = 0; i < data.length; i++) {
      const prevN = currentN; currentN += data[i].f;
      if (currentN >= targetN) {
        const intervalLength = (data[i].upper - data[i].lower) + 1; const lowerBoundary = data[i].lower - 0.5; 
        return lowerBoundary + intervalLength * ((targetN - prevN) / data[i].f);
      }
    } return 0;
  };
  const median = getInterpolatedValue(totalN / 2); const q1 = getInterpolatedValue(totalN / 4); const q3 = getInterpolatedValue((3 * totalN) / 4);
  const p10 = getInterpolatedValue(10 * totalN / 100); const p90 = getInterpolatedValue(90 * totalN / 100);
  const percentileKurtosis = (0.5 * (q3 - q1)) / (p90 - p10);

  let mode = 0;
  if (modeIdx !== -1) {
    const d1 = data[modeIdx].f - (modeIdx > 0 ? data[modeIdx - 1].f : 0); const d2 = data[modeIdx].f - (modeIdx < data.length - 1 ? data[modeIdx + 1].f : 0);
    const intervalLength = (data[modeIdx].upper - data[modeIdx].lower) + 1; const lowerBoundary = data[modeIdx].lower - 0.5;
    mode = lowerBoundary + intervalLength * (d1 / (d1 + d2));
  }
  const sumSqDiff = data.reduce((acc, cur) => acc + (cur.f * Math.pow(cur.mid - mean, 2)), 0); const variance = sumSqDiff / (totalN - 1); const stdDev = Math.sqrt(variance);
  const rawDataArray: number[] = []; data.forEach(d => { for(let i=0; i<d.f; i++) rawDataArray.push(d.mid); });
  const min = Math.min(...rawDataArray); const max = Math.max(...rawDataArray); const iqr = q3 - q1;
  const getShapeStats = (d: number[], m: number, s: number) => { let m3=0, m4=0; const n=d.length; d.forEach(x=>{ m3+=Math.pow((x-m)/s,3); m4+=Math.pow((x-m)/s,4); }); return { skewness: (n/((n-1)*(n-2)))*m3, kurtosis: ((n*(n+1))/((n-1)*(n-2)*(n-3)))*m4 - (3*Math.pow(n-1,2)/((n-2)*(n-3))) }; };
  const { skewness, kurtosis } = getShapeStats(rawDataArray, mean, stdDev);
  
  const generateHistogram = (data: number[], numBins: number) => { 
    const minVal = Math.min(...data); const maxVal = Math.max(...data); 
    const range = (maxVal - minVal) + 0.0001; const binWidth = range / numBins; 
    const bins = []; 
    for (let i = 0; i < numBins; i++) { 
        const binStart = minVal + (i * binWidth);
        bins.push({ label: binStart.toFixed(1), count: 0 }); 
    } 
    data.forEach(val => { let binIdx = Math.floor((val - minVal) / binWidth); if (binIdx >= numBins) binIdx = numBins - 1; bins[binIdx].count++; }); 
    return { bins, min: minVal, max: maxVal, binWidth }; 
  };
  const histogram = generateHistogram(rawDataArray, 10); 
  
  return { mean, median, mode, stdDev, variance, min, max, range: max - min, q1, q3, iqr, p10, p90, percentileKurtosis, lowerBound: q1 - 1.5*iqr, upperBound: q3 + 1.5*iqr, outliers: [], skewness, kurtosis, histogram, rawDataArray, detailedTable, tableTotals };
};

const calculateSingleStats = (dataArray: number[], numBins: number): StatsResult => {
  const getMean = (d: number[]) => d.reduce((a,b)=>a+b,0)/d.length;
  const getMedian = (d: number[]) => { const s = [...d].sort((a,b)=>a-b); const mid=Math.floor(s.length/2); return s.length%2!==0 ? s[mid] : (s[mid-1]+s[mid])/2; };
  const getPercentile = (d: number[], p: number) => { const s = [...d].sort((a,b)=>a-b); const pos = (p/100)*(s.length+1); const base=Math.floor(pos)-1; const rest=pos-Math.floor(pos); if(base<0) return s[0]; if(base>=s.length-1) return s[s.length-1]; return s[base] + rest*(s[base+1]-s[base]); };
  const getStdDev = (d: number[], m: number) => { if(d.length<2) return 0; return Math.sqrt(d.map(x=>Math.pow(x-m,2)).reduce((a,b)=>a+b,0)/(d.length-1)); };
  const mean = getMean(dataArray); const median = getMedian(dataArray); const mode = 0; const stdDev = getStdDev(dataArray, mean); const variance = Math.pow(stdDev, 2);
  const min = Math.min(...dataArray); const max = Math.max(...dataArray);
  const q1 = getPercentile(dataArray, 25); const q3 = getPercentile(dataArray, 75); const p10 = getPercentile(dataArray, 10); const p90 = getPercentile(dataArray, 90); const iqr = q3 - q1; const percentileKurtosis = (0.5 * (q3 - q1)) / (p90 - p10);
  const generateHistogram = (data: number[], numBins: number) => { 
      const minVal = Math.min(...data); const maxVal = Math.max(...data); 
      const range = (maxVal - minVal) + 0.0001; const binWidth = range / numBins; 
      const bins = []; 
      for (let i = 0; i < numBins; i++) { 
          const binStart = minVal + (i * binWidth);
          bins.push({ label: binStart.toFixed(1), count: 0 }); 
      } 
      data.forEach(val => { let binIdx = Math.floor((val - minVal) / binWidth); if (binIdx >= numBins) binIdx = numBins - 1; bins[binIdx].count++; }); 
      return { bins, min: minVal, max: maxVal, binWidth }; 
  };
  const skewness = 0; const kurtosis = 0; const histogram = generateHistogram(dataArray, numBins);
  return { mean, median, mode, stdDev, variance, min, max, range: max - min, q1, q3, iqr, p10, p90, percentileKurtosis, lowerBound: 0, upperBound: 0, outliers: [], skewness, kurtosis, histogram, rawDataArray: dataArray, detailedTable: [], tableTotals: { freq: 0, fu: 0, fu2: 0, fu3: 0, fu4: 0 } };
};

// ==========================================
// 2. UI REACT
// ==========================================

const Home: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>('interval'); 
  const [rows, setRows] = useState<DataRow[]>([{ id: 1, x: '10-19', f: '4' }]);
  const [results, setResults] = useState<StatsResult | null>(null);
  const [error, setError] = useState<string>('');
  const [numBins, setNumBins] = useState<number>(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if(inputMode === 'single') loadExample('normal'); else loadExample('normal'); }, [inputMode]);

  const loadExample = (type: 'normal' | 'skewed') => {
    if (inputMode === 'single') setRows([{ id: 1, x: '60', f: '3' }, { id: 2, x: '70', f: '8' }, { id: 3, x: '80', f: '12' }, { id: 4, x: '90', f: '6' }, { id: 5, x: '100', f: '2' }]);
    else setRows([
        { id: 1, x: '60-62', f: '5' },
        { id: 2, x: '63-65', f: '18' },
        { id: 3, x: '66-68', f: '42' },
        { id: 4, x: '69-71', f: '27' },
        { id: 5, x: '72-74', f: '8' }
    ]);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setResults(null);
    try {
      if (inputMode === 'interval') setResults(calculateGroupedStats(rows));
      else {
        const expandedData: number[] = [];
        rows.forEach(row => { const val = parseFloat(row.x.replace(/,/g, '.')); const freq = parseInt(row.f); if (!isNaN(val) && !isNaN(freq) && freq > 0) for (let i = 0; i < freq; i++) expandedData.push(val); });
        if (expandedData.length === 0) throw new Error("Data kosong");
        setResults(calculateSingleStats(expandedData, numBins));
      }
    } catch (err: any) { console.error(err); setError('Cek input data Anda.'); }
  };

  const addRow = () => setRows([...rows, { id: Date.now(), x: '', f: '1' }]);
  const removeRow = (id: number) => { if (rows.length > 1) setRows(rows.filter(r => r.id !== id)); };
  const updateRow = (id: number, field: 'x' | 'f', value: string) => setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  
  const handleDownloadTemplate = () => {
    let csvContent = inputMode === 'interval' ? "Interval,Frekuensi\n31-40,4\n41-50,3" : "Nilai,Frekuensi\n60,5\n70,8";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `template_${inputMode}.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0]; if (!file) return;
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: (results: any) => {
        const parsedRows: DataRow[] = [];
        results.data.forEach((row: any, index: number) => {
          const keys = Object.keys(row); const xVal = row['Nilai'] || row['Interval'] || row['Xi'] || row[keys[0]]; const fVal = row['Frekuensi'] || row['Fi'] || row[keys[1]];
          if (xVal !== undefined && fVal !== undefined) parsedRows.push({ id: index + 1, x: String(xVal).trim(), f: String(fVal).trim() });
        });
        if (parsedRows.length > 0) { setRows(parsedRows); setError(''); } else { setError('Format CSV salah.'); }
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, error: (err: any) => setError(err.message) });
  };

  const SummaryCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
      <div><p className="text-[10px] font-bold text-slate-400 uppercase">{title}</p><p className="text-xl font-bold text-slate-800">{value}</p></div>
      <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-lg`}>{icon}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans text-sm">
      <header className="bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2"><div className="bg-indigo-600 text-white p-1 rounded text-sm">📊</div><h1 className="font-bold text-lg">Statistik<span className="text-indigo-600">Pro</span></h1></div>
        <div className="flex bg-slate-100 p-1 rounded-md">
           <button onClick={() => setInputMode('single')} className={`px-3 py-1 text-xs font-bold rounded ${inputMode==='single'?'bg-white shadow text-indigo-600':'text-slate-500'}`}>Tunggal</button>
           <button onClick={() => setInputMode('interval')} className={`px-3 py-1 text-xs font-bold rounded ${inputMode==='interval'?'bg-white shadow text-indigo-600':'text-slate-500'}`}>Interval</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* INPUT SIDEBAR */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden sticky top-20">
              <div className="p-3 border-b bg-slate-50 flex justify-between items-center"><h2 className="font-bold text-xs text-slate-700">INPUT DATA</h2><button onClick={()=>setRows([{id:Date.now(),x:'',f:'1'}])} className="text-[10px] text-red-500 font-bold">RESET</button></div>
              <div className="grid grid-cols-2 gap-2 px-3 pt-3">
                 <button onClick={handleDownloadTemplate} className="py-1.5 border rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50">TEMPLATE</button>
                 <div className="relative"><input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer"/><button className="w-full py-1.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">UPLOAD CSV</button></div>
              </div>
              <div className="grid grid-cols-12 gap-2 px-3 mt-3 mb-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest"><div className="col-span-7">Nilai / Interval</div><div className="col-span-3 text-center">Freq</div><div className="col-span-2 text-center">Del</div></div>
              <div className="px-3 pb-2 space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                {rows.map((r) => (
                   <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7"><input value={r.x} onChange={e=>updateRow(r.id,'x',e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all" placeholder={inputMode==='single'?'75':'60-62'} /></div>
                      <div className="col-span-3"><input type="number" value={r.f} onChange={e=>updateRow(r.id,'f',e.target.value)} className="w-full px-1 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-center outline-none focus:bg-white focus:border-indigo-500 transition-all" /></div>
                      <div className="col-span-2 flex justify-center"><button onClick={()=>removeRow(r.id)} className="text-slate-300 hover:text-red-500 text-xs">✖</button></div>
                   </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-100 space-y-2">
                 <button onClick={addRow} className="w-full py-2 border-2 border-dashed rounded text-[10px] font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-300">+ TAMBAH BARIS</button>
                 {error && <div className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100 text-center">⚠️ {error}</div>}
                 <button onClick={handleCalculate} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition-all">HITUNG STATISTIK</button>
                 <button onClick={()=>loadExample('normal')} className="w-full text-center text-[9px] font-bold text-indigo-400 hover:text-indigo-600 uppercase tracking-wide">Muat Contoh Data</button>
              </div>
            </div>
          </div>

          {/* RESULTS */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
             {results ? (
                <div className="animate-fade-in space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SummaryCard title="Mean" value={results.mean.toFixed(2)} icon="🎯" color="text-blue-600" />
                      <SummaryCard title="Median" value={results.median.toFixed(2)} icon="⚖️" color="text-purple-600" />
                      <SummaryCard title="Kurtosis (K)" value={results.percentileKurtosis.toFixed(4)} icon="🏔️" color="text-pink-600" />
                   </div>
                   <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100"><h3 className="font-bold text-xs text-slate-700">VISUALISASI</h3></div>
                      <div className="p-4 h-64 relative"><StatsChart stats={results} histogram={results.histogram} rawData={results.rawDataArray} /></div>
                   </div>
                   <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100"><h3 className="font-bold text-xs text-slate-700">TABEL STATISTIK</h3></div>
                      <div className="p-4"><StatsTable stats={results} rawDataArray={results.rawDataArray} /></div>
                   </div>
                   <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100"><h3 className="font-bold text-xs text-slate-700">ANALISIS BENTUK</h3></div>
                      <div className="p-4"><Interpretation skewness={results.skewness} kurtosis={results.percentileKurtosis} /></div>
                   </div>
                </div>
             ) : (
                <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 text-slate-400">
                   <span className="text-3xl mb-2">👋</span><p className="text-xs font-medium">Siap menganalisis data.</p>
                </div>
             )}
          </div>
      </main>
    </div>
  );
}
export default Home;