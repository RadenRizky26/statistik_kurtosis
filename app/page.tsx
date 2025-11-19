"use client";

import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { useReactToPrint } from 'react-to-print';
import StatsChart from './components/StatsChart';
import StatsTable from './components/StatsTable';
import Interpretation from './components/Interpretation';
import AnalysisReport from './components/AnalysisReport';

// ==========================================
// 1. INTERFACE & TIPE DATA
// ==========================================
interface DetailedRow { 
  interval: string; mid: number; freq: number; 
  u: number; u2: number; u3: number; u4: number; 
  fu: number; fu2: number; fu3: number; fu4: number; 
  fx: number; fk: number;
}

interface HistogramResult { bins: { label: string; count: number; }[]; min: number; max: number; binWidth: number; }

interface StatsResult { 
  mean: number; median: number; mode: number[] | string[] | number; stdDev: number; variance: number; min: number; max: number; range: number; 
  
  q1: number; q3: number; iqr: number; p10: number; p90: number; 
  percentileKurtosis: number; // K
  
  // Momen & Alpha (Sesuai Gambar)
  alpha3: number; alpha4: number; 
  moments: { m1: number; m2: number; m3: number; m4: number }; 
  
  lowerBound: number; upperBound: number; outliers: number[]; 
  skewness: number; kurtosis: number; // Alias untuk Chart
  
  histogram: HistogramResult; rawDataArray: number[]; 
  detailedTable: DetailedRow[]; 
  tableTotals: { freq: number; fx: number; fu: number; fu2: number; fu3: number; fu4: number; };
  
  // Data tambahan untuk Step-by-Step Solver
  inputMode: 'single' | 'interval';
  codingP?: number; // Panjang kelas (p)
  assumedMean?: number; // Rata-rata sementara (xs)
}

interface DataRow { id: number; x: string; f: string; }
type InputMode = 'single' | 'interval';

const round = (num: number) => parseFloat((num || 0).toFixed(4));

// ==========================================
// 2. LOGIKA MATEMATIKA
// ==========================================

// --- A. DATA BERKELOMPOK (METODE CODING u / c) ---
const calculateGroupedStats = (rows: DataRow[]): StatsResult => {
  const data = rows.map(r => {
    const f = parseInt(r.f); const cleanX = r.x.replace(/\s/g, '');
    let lower = 0, upper = 0, mid = 0;
    if (cleanX.includes('-')) { const parts = cleanX.split('-'); lower = parseFloat(parts[0]); upper = parseFloat(parts[1]); mid = (lower + upper) / 2; } 
    else { lower = parseFloat(cleanX); upper = parseFloat(cleanX); mid = lower; }
    return { lower, upper, mid, f, intervalString: cleanX };
  }).filter(d => !isNaN(d.mid) && d.f > 0);

  const totalN = data.reduce((acc, cur) => acc + cur.f, 0);
  const p = data.length > 0 ? (data[0].upper - data[0].lower + 1) : 1; // Panjang Kelas

  // 1. Coding (u)
  let maxFreq = -1; let modeIdx = -1;
  data.forEach((d, i) => { if (d.f > maxFreq) { maxFreq = d.f; modeIdx = i; } });
  const assumedMean = data[modeIdx]?.mid || 0;

  let currentFk = 0;
  const detailedTable: DetailedRow[] = data.map((d, i) => {
    const u = i - modeIdx; 
    currentFk += d.f;
    const u2 = u*u; const u3 = u2*u; const u4 = u3*u;
    return { 
      interval: d.intervalString, mid: d.mid, freq: d.f, fx: d.f * d.mid, fk: currentFk,
      u, u2, u3, u4, 
      fu: d.f * u, fu2: d.f * u2, fu3: d.f * u3, fu4: d.f * u4 
    };
  });

  const T = detailedTable.reduce((acc, cur) => ({
    freq: acc.freq + cur.freq, fx: acc.fx + cur.fx,
    fu: acc.fu + cur.fu, fu2: acc.fu2 + cur.fu2, fu3: acc.fu3 + cur.fu3, fu4: acc.fu4 + cur.fu4
  }), { freq: 0, fx: 0, fu: 0, fu2: 0, fu3: 0, fu4: 0 });

  // 2. Momen Asal (m') & Momen Sentral (m)
  const m1_tick = p * (T.fu / totalN);
  const m2_tick = Math.pow(p, 2) * (T.fu2 / totalN);
  const m3_tick = Math.pow(p, 3) * (T.fu3 / totalN);
  const m4_tick = Math.pow(p, 4) * (T.fu4 / totalN);

  const m1 = 0; 
  const m2 = m2_tick - Math.pow(m1_tick, 2);
  const m3 = m3_tick - 3 * m1_tick * m2_tick + 2 * Math.pow(m1_tick, 3);
  const m4 = m4_tick - 4 * m1_tick * m3_tick + 6 * Math.pow(m1_tick, 2) * m2_tick - 3 * Math.pow(m1_tick, 4);

  const stdDevPop = Math.sqrt(m2);
  const alpha3 = m3 / Math.pow(stdDevPop, 3); 
  const alpha4 = m4 / Math.pow(stdDevPop, 4); // Kurtosis Momen

  // 3. Statistik Dasar
  const mean = T.fx / totalN;
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
  const median = getInterpolatedValue(totalN / 2); 
  const q1 = getInterpolatedValue(totalN / 4); const q3 = getInterpolatedValue((3 * totalN) / 4);
  const p10 = getInterpolatedValue(10 * totalN / 100); const p90 = getInterpolatedValue(90 * totalN / 100);
  const percentileKurtosis = (0.5 * (q3 - q1)) / (p90 - p10);

  let mode = 0;
  if (modeIdx !== -1) {
    const d1 = data[modeIdx].f - (modeIdx > 0 ? data[modeIdx - 1].f : 0); 
    const d2 = data[modeIdx].f - (modeIdx < data.length - 1 ? data[modeIdx + 1].f : 0);
    const lowerBoundary = data[modeIdx].lower - 0.5;
    mode = lowerBoundary + p * (d1 / (d1 + d2));
  }
  
  const rawDataArray: number[] = []; data.forEach(d => { for(let i=0; i<d.f; i++) rawDataArray.push(d.mid); });
  const min = Math.min(...rawDataArray); const max = Math.max(...rawDataArray); const iqr = q3 - q1;
  
  // Histogram Logic
  const generateHistogram = () => { 
    const bins = data.map(d => ({ label: d.mid.toString(), count: d.f }));
    return { bins, min: data[0]?.lower || 0, max: data[data.length-1]?.upper || 0, binWidth: p }; 
  };
  const histogram = generateHistogram(); 
  
  return { 
    mean, median, mode, stdDev: stdDevPop, variance: m2, min, max, range: max - min, 
    q1, q3, iqr, p10, p90, percentileKurtosis: isNaN(percentileKurtosis) ? 0 : percentileKurtosis, 
    alpha3: isNaN(alpha3) ? 0 : alpha3, alpha4: isNaN(alpha4) ? 0 : alpha4,
    moments: { m1, m2, m3, m4 }, 
    lowerBound: q1 - 1.5*iqr, upperBound: q3 + 1.5*iqr, outliers: [], 
    skewness: alpha3, kurtosis: alpha4, 
    histogram, rawDataArray, detailedTable, tableTotals: T,
    inputMode: 'interval', codingP: p, assumedMean
  };
};

// --- B. DATA TUNGGAL (SIMPANGAN LANGSUNG) ---
const calculateSingleStats = (dataArray: number[], numBins: number): StatsResult => {
  const totalN = dataArray.length;
  const sumX = dataArray.reduce((a, b) => a + b, 0);
  const mean = sumX / totalN;

  // 1. Momen Langsung
  let sumDiff2 = 0, sumDiff3 = 0, sumDiff4 = 0;
  dataArray.forEach(val => {
      const diff = val - mean;
      sumDiff2 += Math.pow(diff, 2);
      sumDiff3 += Math.pow(diff, 3);
      sumDiff4 += Math.pow(diff, 4);
  });

  const m2 = sumDiff2 / totalN; 
  const m3 = sumDiff3 / totalN; 
  const m4 = sumDiff4 / totalN;
  
  const s_pop = Math.sqrt(m2);
  const alpha3 = m3 / Math.pow(s_pop, 3);
  const alpha4 = m4 / Math.pow(s_pop, 4);

  // 2. Tabel Rincian
  const freqMap: Record<number, number> = {};
  dataArray.forEach(val => { freqMap[val] = (freqMap[val] || 0) + 1; });
  const uniqueValues = Object.keys(freqMap).map(Number).sort((a, b) => a - b);

  let currentFk = 0;
  const detailedTable: DetailedRow[] = uniqueValues.map((val) => {
    const f = freqMap[val];
    currentFk += f;
    const d = val - mean; 
    const u = round(d); const u2 = round(d*d); const u3 = round(d*d*d); const u4 = round(d*d*d*d);
    return {
      interval: val.toString(), mid: val, freq: f, fx: val * f, fk: currentFk,
      u, u2, u3, u4,
      fu: round(f*d), fu2: round(f*u2), fu3: round(f*u3), fu4: round(f*u4)
    };
  });

  const T = detailedTable.reduce((acc, cur) => ({
    freq: acc.freq + cur.freq, fx: acc.fx + cur.fx,
    fu: round(acc.fu + cur.fu), fu2: round(acc.fu2 + cur.fu2), fu3: round(acc.fu3 + cur.fu3), fu4: round(acc.fu4 + cur.fu4)
  }), { freq: 0, fx: 0, fu: 0, fu2: 0, fu3: 0, fu4: 0 });

  // Stats Lain
  const getMedian = (d: number[]) => { const s = [...d].sort((a,b)=>a-b); const mid=Math.floor(s.length/2); return s.length%2!==0 ? s[mid] : (s[mid-1]+s[mid])/2; };
  const getPercentile = (d: number[], p: number) => { const s = [...d].sort((a,b)=>a-b); const pos = (p/100)*(s.length+1); const base=Math.floor(pos)-1; const rest=pos-Math.floor(pos); if(base<0) return s[0]; if(base>=s.length-1) return s[s.length-1]; return s[base] + rest*(s[base+1]-s[base]); };
  
  const median = getMedian(dataArray); 
  const min = Math.min(...dataArray); const max = Math.max(...dataArray);
  const q1 = getPercentile(dataArray, 25); const q3 = getPercentile(dataArray, 75); 
  const p10 = getPercentile(dataArray, 10); const p90 = getPercentile(dataArray, 90); 
  const iqr = q3 - q1; 
  const percentileKurtosis = (0.5 * (q3 - q1)) / (p90 - p10);
  
  const generateHistogram = () => {
      const bins = uniqueValues.map(val => ({ label: val.toString(), count: freqMap[val] }));
      let totalGap = 1;
      if (uniqueValues.length > 1) { for(let i=0; i<uniqueValues.length-1; i++) totalGap += (uniqueValues[i+1] - uniqueValues[i]); totalGap /= (uniqueValues.length - 1); }
      return { bins, min, max, binWidth: totalGap };
  };
  const histogram = generateHistogram();
  const modeArr = Object.keys(freqMap).filter(k => freqMap[parseFloat(k)] === Math.max(...Object.values(freqMap))).map(Number);

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = dataArray.filter(val => val < lowerBound || val > upperBound);

  return { 
    mean, median, mode: modeArr, stdDev: s_pop, variance: m2, min, max, range: max - min, 
    q1, q3, iqr, p10, p90, percentileKurtosis: isNaN(percentileKurtosis) ? 0 : percentileKurtosis, 
    alpha3: isNaN(alpha3) ? 0 : alpha3, alpha4: isNaN(alpha4) ? 0 : alpha4,
    moments: { m1: 0, m2, m3, m4 }, 
    lowerBound: 0, upperBound: 0, outliers: [...new Set(outliers)], 
    skewness: alpha3, kurtosis: alpha4, 
    histogram, rawDataArray: dataArray, detailedTable, tableTotals: T,
    inputMode: 'single'
  };
};

// ==========================================
// 3. UI REACT
// ==========================================

const Home: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>('interval'); 
  const [rows, setRows] = useState<DataRow[]>([{ id: 1, x: '10-19', f: '4' }]);
  const [results, setResults] = useState<StatsResult | null>(null);
  const [error, setError] = useState<string>('');
  const [numBins, setNumBins] = useState<number>(10);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Laporan_Statistik` });

  useEffect(() => { if(inputMode === 'single') loadExample('normal'); else loadExample('normal'); }, [inputMode]);

  const loadExample = (type: 'normal' | 'skewed') => {
    if (inputMode === 'single') setRows([{ id: 1, x: '60', f: '3' }, { id: 2, x: '70', f: '8' }, { id: 3, x: '80', f: '12' }, { id: 4, x: '90', f: '6' }, { id: 5, x: '100', f: '2' }]);
    else setRows([ { id: 1, x: '60-62', f: '5' }, { id: 2, x: '63-65', f: '18' }, { id: 3, x: '66-68', f: '42' }, { id: 4, x: '69-71', f: '27' }, { id: 5, x: '72-74', f: '8' } ]);
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
  const handleDownloadTemplate = () => { /*...*/ };
  const handleFileUpload = (e: any) => { /*...*/ };

  const SummaryCard = ({ title, value, icon, color, sub }: any) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
      <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{title}</p>
          <p className="text-xl font-bold text-slate-800">{value}</p>
          {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-lg`}>{icon}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans text-sm">
      <header className="bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between shadow-sm sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-2"><div className="bg-indigo-600 text-white p-1 rounded text-sm">📊</div><h1 className="font-bold text-lg">Statistik<span className="text-indigo-600">Pro</span></h1></div>
        <div className="flex bg-slate-100 p-1 rounded-md">
           <button onClick={() => setInputMode('single')} className={`px-3 py-1 text-xs font-bold rounded ${inputMode==='single'?'bg-white shadow text-indigo-600':'text-slate-500'}`}>Tunggal</button>
           <button onClick={() => setInputMode('interval')} className={`px-3 py-1 text-xs font-bold rounded ${inputMode==='interval'?'bg-white shadow text-indigo-600':'text-slate-500'}`}>Interval</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* INPUT SIDEBAR */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4 print:hidden">
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

          {/* RESULTS CONTENT */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4 print:col-span-12 print:w-full">
             {results ? (
                <div className="animate-fade-in space-y-4">
                   <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:hidden">
                      <h2 className="font-bold text-slate-700 text-base flex items-center gap-2"><span>📊</span> Hasil Analisis</h2>
                      <button onClick={() => handlePrint()} className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"><span>📄</span> Download PDF</button>
                   </div>

                   <div ref={printRef} className="space-y-4 p-2 print:p-6 print:bg-white">
                      <div className="hidden print:block mb-6 border-b pb-4"><h1 className="text-2xl font-bold text-slate-800">Laporan Statistik</h1><p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <SummaryCard title="Mean" value={(results.mean ?? 0).toFixed(2)} icon="🎯" color="text-blue-600" />
                          <SummaryCard title="Median" value={(results.median ?? 0).toFixed(2)} icon="⚖️" color="text-purple-600" />
                          <SummaryCard 
                            title="Koef. Kurtosis (α4)" 
                            value={(results.alpha4 ?? 0).toFixed(4)} 
                            sub={`K (Persentil): ${(results.percentileKurtosis ?? 0).toFixed(4)}`} 
                            icon="🏔️" color="text-pink-600" 
                          />
                      </div>

                      {/* CHART VISUALISASI */}
                      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden print:break-inside-avoid">
                          <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100"><h3 className="font-bold text-xs text-slate-700">VISUALISASI</h3></div>
                          <div className="p-4 h-[500px] relative"><StatsChart stats={results} histogram={results.histogram} rawData={results.rawDataArray} /></div>
                      </div>

                      {/* TABEL STATISTIK */}
                      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden print:break-inside-avoid">
                          <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100"><h3 className="font-bold text-xs text-slate-700">TABEL STATISTIK</h3></div>
                          <div className="p-4"><StatsTable stats={results} rawDataArray={results.rawDataArray} /></div>
                      </div>

                      {/* STEP BY STEP REPORT (BARU) */}
                      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden print:break-inside-avoid">
                          <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100"><h3 className="font-bold text-xs text-slate-700">LANGKAH PENGERJAAN</h3></div>
                          <div className="p-4"><AnalysisReport stats={results} /></div>
                      </div>

                      {/* INTERPRETASI */}
                      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden print:break-inside-avoid">
                          <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100"><h3 className="font-bold text-xs text-slate-700">ANALISIS BENTUK</h3></div>
                          <div className="p-4"><Interpretation skewness={results.alpha3} kurtosis={results.alpha4} /></div>
                      </div>
                      
                      <div className="hidden print:block mt-8 text-center text-[10px] text-slate-400 border-t pt-4">Dicetak dari Aplikasi StatistikPro</div>
                   </div>
                </div>
             ) : (
                <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 text-slate-400"><span className="text-3xl mb-2">👋</span><p className="text-xs font-medium">Siap menganalisis data.</p></div>
             )}
          </div>
      </main>
    </div>
  );
}
export default Home;