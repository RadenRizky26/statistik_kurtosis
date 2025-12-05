"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import Image from 'next/image';
import iconSrc from './icon.png';

import StatsChart from './components/StatsChart';
import StatsTable from './components/StatsTable';
import AnalysisReport from './components/AnalysisReport';
import Interpretation from './components/Interpretation';

// ==========================================
// 1. TIPE DATA & INTERFACE
// ==========================================

export interface DetailedRow { 
  interval: string; 
  mid: number; 
  f: number;    
  freq: number; 
  // Coding
  u: number; u2: number; u3: number; u4: number; 
  fu: number; fu2: number; fu3: number; fu4: number; 
  // Manual / Simpangan
  fx: number;           
  diff: number;         
  diffSq: number;       
  fDiffSq: number;      
  absDev: number; fAbsDev: number;
  fk: number;
}

export interface HistogramResult { 
  bins: { label: string; count: number; }[]; 
  min: number; max: number; binWidth: number; 
}

interface SumsAccumulator {
  fu: number; fu2: number; fu3: number; fu4: number;
}

export interface TableTotals extends SumsAccumulator {
  freq: number;
  f: number;
  fAbsDev: number;
  fx: number;
  fDiffSq: number;
}

export interface StatsResult { 
  mean: number; median: number; mode: number | number[]; 
  stdDev: number; variance: number; 
  meanDeviation: number; coeffVariation: number; 
  sk1: number; sk2: number; gamma1: number; gamma2: number; sk4: number; sk5: number; 
  skewness: number; kurtosis: number;
  q1: number; q3: number; p10: number; p90: number;
  min: number; max: number; range: number; 
  histogram: HistogramResult; 
  rawDataArray: number[]; 
  detailedTable: DetailedRow[]; 
  tableTotals: TableTotals; 
  codingP: number; assumedMean: number;
  mu1_u: number; mu2_u: number; mu3_u: number; mu4_u: number; 
  m2_x: number; m3_x: number; m4_x: number; 
  medL: number; medFk: number; medF: number;
  q1L: number; q1Fk: number; q1F: number;
  q3L: number; q3Fk: number; q3F: number;
  modeL: number; modeD1: number; modeD2: number;
  isSingleMode: boolean;
}

interface DataRow { id: number; x: string; f: string; }
type InputMode = 'single' | 'interval';

// ==========================================
// 2A. LOGIKA DATA KELOMPOK
// ==========================================
const calculateGroupedStats = (rows: DataRow[]): StatsResult => {
  const data = rows.map(r => {
    const f = parseInt(r.f) || 0; 
    const cleanX = r.x.replace(/\s/g, '');
    let lower = 0, upper = 0, mid = 0;
    if (cleanX.includes('-')) { 
      const parts = cleanX.split('-'); 
      lower = parseFloat(parts[0]); upper = parseFloat(parts[1]); 
      mid = (lower + upper) / 2; 
    } else {
      lower = parseFloat(cleanX); upper = parseFloat(cleanX); mid = lower;
    }
    return { lower, upper, mid, f, intervalString: cleanX };
  }).filter(d => !isNaN(d.mid) && d.f > 0);

  const n = data.reduce((acc, cur) => acc + cur.f, 0);
  const p = data.length > 0 ? (data[0].upper - data[0].lower + 1) : 1; 

  let maxFreq = -1; let modeIdx = -1;
  data.forEach((d, i) => { if (d.f > maxFreq) { maxFreq = d.f; modeIdx = i; } });
  const assumedMean = data[modeIdx]?.mid || 0; 

  let currentFk = 0;
  const tempTablePre = data.map((d, i) => {
    const u = i - modeIdx; 
    currentFk += d.f;
    const u2 = u*u; const u3 = u*u*u; const u4 = u*u*u*u;
    return { 
      interval: d.intervalString, mid: d.mid, freq: d.f, f: d.f, 
      u, u2, u3, u4,
      fu: d.f * u, fu2: d.f * u2, fu3: d.f * u3, fu4: d.f * u4,
      fk: currentFk
    };
  });

  const sums = tempTablePre.reduce((acc, cur) => ({
     fu: acc.fu + cur.fu, fu2: acc.fu2 + cur.fu2,
     fu3: acc.fu3 + cur.fu3, fu4: acc.fu4 + cur.fu4
  }), { fu: 0, fu2: 0, fu3: 0, fu4: 0 });

  const mu1_u = sums.fu / n;
  const mu2_u = sums.fu2 / n;
  const mu3_u = sums.fu3 / n;
  const mu4_u = sums.fu4 / n;

  const mean = assumedMean + (p * mu1_u);
  const m2_x = Math.pow(p, 2) * (mu2_u - Math.pow(mu1_u, 2));
  const m3_x = Math.pow(p, 3) * (mu3_u - 3 * mu1_u * mu2_u + 2 * Math.pow(mu1_u, 3));
  const m4_x = Math.pow(p, 4) * (mu4_u - 4 * mu1_u * mu3_u + 6 * Math.pow(mu1_u, 2) * mu2_u - 3 * Math.pow(mu1_u, 4));

  const variance = m2_x;
  const stdDev = Math.sqrt(variance);
  const gamma1 = m3_x / Math.pow(stdDev, 3); 
  const gamma2 = m4_x / Math.pow(stdDev, 4); 

  const getInterpolation = (target: number) => {
     let idx = 0;
     for(let i=0; i<tempTablePre.length; i++) { if (tempTablePre[i].fk >= target) { idx = i; break; } }
     const row = data[idx];
     const L = row ? row.lower - 0.5 : 0;
     const Fk = idx > 0 ? tempTablePre[idx - 1].fk : 0;
     const f = tempTablePre[idx]?.f || 1;
     const res = L + p * ((target - Fk) / f);
     return { res, L, Fk, f };
  };

  const medData = getInterpolation(n / 2);
  const q1Data = getInterpolation(n / 4);
  const q3Data = getInterpolation(3 * n / 4);
  const p10 = getInterpolation(10 * n / 100).res;
  const p90 = getInterpolation(90 * n / 100).res;

  const d1 = data[modeIdx].f - (modeIdx > 0 ? data[modeIdx - 1].f : 0);
  const d2 = data[modeIdx].f - (modeIdx < data.length - 1 ? data[modeIdx + 1].f : 0);
  const modeL = data[modeIdx].lower - 0.5;
  const mode = modeL + p * (d1 / (d1 + d2));

  const sk1 = (mean - mode) / stdDev;
  const sk2 = (3 * (mean - medData.res)) / stdDev;
  const sk4 = (q3Data.res + q1Data.res - 2 * medData.res) / (q3Data.res - q1Data.res); 
  const sk5 = (p90 + p10 - 2 * medData.res) / (p90 - p10); 

  const detailedTable: DetailedRow[] = tempTablePre.map(row => {
    const absDev = Math.abs(row.mid - mean);
    const fAbsDev = row.f * absDev;
    const fx = row.f * row.mid;
    const diff = row.mid - mean;
    const diffSq = Math.pow(diff, 2);
    const fDiffSq = row.f * diffSq;
    return { ...row, absDev, fAbsDev, fx, diff, diffSq, fDiffSq };
  });
  
  const totals = detailedTable.reduce((acc, cur) => ({
    fAbsDev: acc.fAbsDev + cur.fAbsDev,
    fx: acc.fx + cur.fx,
    fDiffSq: acc.fDiffSq + cur.fDiffSq
  }), { fAbsDev: 0, fx: 0, fDiffSq: 0 });

  const meanDeviation = totals.fAbsDev / n;
  const coeffVariation = (stdDev / mean) * 100;

  const rawDataArray: number[] = []; 
  data.forEach(d => { for(let i=0; i<d.f; i++) rawDataArray.push(d.mid); });
  const min = Math.min(...rawDataArray); const max = Math.max(...rawDataArray);
  const bins = data.map(d => ({ label: d.mid.toString(), count: d.f }));

  const finalTotals: TableTotals = { freq: n, f: n, ...sums, ...totals };

  return {
    mean, median: medData.res, mode, stdDev, variance, meanDeviation, coeffVariation,
    sk1, sk2, gamma1, gamma2, sk4, sk5, skewness: gamma1, kurtosis: gamma2,
    q1: q1Data.res, q3: q3Data.res, p10, p90,
    min, max, range: max - min, histogram: { bins, min: data[0]?.lower || 0, max: data[data.length-1]?.upper || 0, binWidth: p },
    rawDataArray, detailedTable, tableTotals: finalTotals, codingP: p, assumedMean,
    mu1_u, mu2_u, mu3_u, mu4_u, m2_x, m3_x, m4_x,
    medL: medData.L, medFk: medData.Fk, medF: medData.f,
    q1L: q1Data.L, q1Fk: q1Data.Fk, q1F: q1Data.f,
    q3L: q3Data.L, q3Fk: q3Data.Fk, q3F: q3Data.f,
    modeL, modeD1: d1, modeD2: d2, isSingleMode: false
  };
};

// ==========================================
// 2B. LOGIKA DATA TUNGGAL
// ==========================================
const calculateSingleStats = (rows: DataRow[]): StatsResult => {
  const data = rows.map(r => {
    const f = parseInt(r.f) || 0; 
    const val = parseFloat(r.x.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
    return { lower: val, upper: val, mid: val, f, intervalString: val.toString() };
  }).filter(d => !isNaN(d.mid) && d.f > 0);

  const n = data.reduce((acc, cur) => acc + cur.f, 0);
  const p = 1;

  let maxFreq = -1; let modeIdx = -1;
  data.forEach((d, i) => { if (d.f > maxFreq) { maxFreq = d.f; modeIdx = i; } });
  const assumedMean = data[modeIdx]?.mid || 0; 

  let currentFk = 0;
  const tempTablePre = data.map((d, i) => {
    const u = i - modeIdx; 
    currentFk += d.f;
    const u2 = u*u; const u3 = u*u*u; const u4 = u*u*u*u;
    return { 
      interval: d.intervalString, mid: d.mid, freq: d.f, f: d.f, 
      u, u2, u3, u4,
      fu: d.f * u, fu2: d.f * u2, fu3: d.f * u3, fu4: d.f * u4,
      fk: currentFk
    };
  });

  const sums = tempTablePre.reduce((acc, cur) => ({
     fu: acc.fu + cur.fu, fu2: acc.fu2 + cur.fu2,
     fu3: acc.fu3 + cur.fu3, fu4: acc.fu4 + cur.fu4
  }), { fu: 0, fu2: 0, fu3: 0, fu4: 0 });

  const mu1_u = sums.fu / n;
  const mu2_u = sums.fu2 / n;
  const mu3_u = sums.fu3 / n;
  const mu4_u = sums.fu4 / n;

  const mean = assumedMean + (p * mu1_u);
  const m2_x = (mu2_u - Math.pow(mu1_u, 2));
  const m3_x = (mu3_u - 3 * mu1_u * mu2_u + 2 * Math.pow(mu1_u, 3));
  const m4_x = (mu4_u - 4 * mu1_u * mu3_u + 6 * Math.pow(mu1_u, 2) * mu2_u - 3 * Math.pow(mu1_u, 4));

  const variance = m2_x;
  const stdDev = Math.sqrt(variance);
  const gamma1 = m3_x / Math.pow(stdDev, 3); 
  const gamma2 = m4_x / Math.pow(stdDev, 4); 

  const getValueAtPos = (pos: number) => {
      for(let r of tempTablePre) { if(r.fk >= pos) return r.mid; }
      return 0;
  };

  let median = 0;
  if (n % 2 === 1) median = getValueAtPos((n + 1) / 2);
  else median = (getValueAtPos(n/2) + getValueAtPos((n/2)+1)) / 2;

  const q1 = getValueAtPos(Math.ceil(n * 0.25));
  const q3 = getValueAtPos(Math.ceil(n * 0.75));
  const p10 = getValueAtPos(Math.ceil(n * 0.10));
  const p90 = getValueAtPos(Math.ceil(n * 0.90));

  const mode = data[modeIdx].mid;
  const sk1 = (mean - mode) / stdDev;
  const sk2 = (3 * (mean - median)) / stdDev;
  const sk4 = (q3 + q1 - 2 * median) / (q3 - q1); 
  const sk5 = (p90 + p10 - 2 * median) / (p90 - p10); 

  const detailedTable: DetailedRow[] = tempTablePre.map(row => {
    const absDev = Math.abs(row.mid - mean);
    const fAbsDev = row.f * absDev;
    const fx = row.f * row.mid;
    const diff = row.mid - mean;
    const diffSq = Math.pow(diff, 2);
    const fDiffSq = row.f * diffSq;
    return { ...row, absDev, fAbsDev, fx, diff, diffSq, fDiffSq };
  });
  
  const totals = detailedTable.reduce((acc, cur) => ({
    fAbsDev: acc.fAbsDev + cur.fAbsDev,
    fx: acc.fx + cur.fx,
    fDiffSq: acc.fDiffSq + cur.fDiffSq
  }), { fAbsDev: 0, fx: 0, fDiffSq: 0 });

  const meanDeviation = totals.fAbsDev / n;
  const coeffVariation = (stdDev / mean) * 100;

  const rawDataArray: number[] = []; 
  data.forEach(d => { for(let i=0; i<d.f; i++) rawDataArray.push(d.mid); });
  const min = Math.min(...rawDataArray); const max = Math.max(...rawDataArray);
  const bins = data.map(d => ({ label: d.mid.toString(), count: d.f }));

  const finalTotals: TableTotals = { freq: n, f: n, ...sums, ...totals };

  return {
    mean, median, mode, stdDev, variance, meanDeviation, coeffVariation,
    sk1, sk2, gamma1, gamma2, sk4, sk5, skewness: gamma1, kurtosis: gamma2,
    q1, q3, p10, p90, min, max, range: max - min, histogram: { bins, min: data[0]?.lower || 0, max: data[data.length-1]?.upper || 0, binWidth: 1 },
    rawDataArray, detailedTable, tableTotals: finalTotals, codingP: 1, assumedMean,
    mu1_u, mu2_u, mu3_u, mu4_u, m2_x, m3_x, m4_x,
    medL: 0, medFk: 0, medF: 0, q1L: 0, q1Fk: 0, q1F: 0, q3L: 0, q3Fk: 0, q3F: 0, modeL: 0, modeD1: 0, modeD2: 0, isSingleMode: true
  };
};

// ==========================================
// 3. UI LAYOUT
// ==========================================

const Home: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>('interval');
  const [rows, setRows] = useState<DataRow[]>([
    { id: 1, x: '31-40', f: '4' }, { id: 2, x: '41-50', f: '3' }, { id: 3, x: '51-60', f: '5' },
    { id: 4, x: '61-70', f: '8' }, { id: 5, x: '71-80', f: '11' }, { id: 6, x: '81-90', f: '7' }, { id: 7, x: '91-100', f: '2' },
  ]);
  const [results, setResults] = useState<StatsResult | null>(null);
  const [error, setError] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Laporan_Statistik` });

  useEffect(() => {
     if (inputMode === 'interval') {
        setRows([
           { id: 1, x: '31-40', f: '4' }, { id: 2, x: '41-50', f: '3' }, { id: 3, x: '51-60', f: '5' },
           { id: 4, x: '61-70', f: '8' }, { id: 5, x: '71-80', f: '11' }, { id: 6, x: '81-90', f: '7' }, { id: 7, x: '91-100', f: '2' },
        ]);
     } else {
        setRows([
           { id: 1, x: '60', f: '2' }, { id: 2, x: '65', f: '5' }, { id: 3, x: '70', f: '10' },
           { id: 4, x: '75', f: '8' }, { id: 5, x: '80', f: '4' },
        ]);
     }
     setResults(null); 
  }, [inputMode]);

  const handleCalculate = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setError(''); setResults(null);
    try { 
        if (inputMode === 'single') {
            setResults(calculateSingleStats(rows)); 
        } else {
            setResults(calculateGroupedStats(rows));
        }
    } catch (err: any) { console.error(err); setError('Cek data input.'); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const newRows: DataRow[] = [];
      let startIndex = 0;
      if (isNaN(parseFloat(lines[0].split(/[;,]/)[0]))) startIndex = 1;

      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(/[;,]/);
        if (cols.length >= 2) {
          newRows.push({
            id: Date.now() + i,
            x: cols[0].trim(),
            f: cols[1].trim()
          });
        }
      }

      if (newRows.length > 0) {
        setRows(newRows);
        if (newRows[0].x.includes('-')) setInputMode('interval');
        else setInputMode('single');
      } else {
        setError("Format CSV salah. Gunakan format: Nilai,Frekuensi");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadTemplate = () => {
    const header = inputMode === 'interval' ? "Interval,Frekuensi\n31-40,5\n41-50,8" : "Nilai,Frekuensi\n60,3\n70,5";
    const blob = new Blob([header], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_statistik_${inputMode}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const addRow = () => setRows([...rows, { id: Date.now(), x: '', f: '1' }]);
  const removeRow = (id: number) => { if (rows.length > 1) setRows(rows.filter(r => r.id !== id)); };
  const updateRow = (id: number, field: 'x' | 'f', value: string) => setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));

  const SummaryCard = ({ title, value, icon, color, sub }: any) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center transition-all hover:shadow-md print:break-inside-avoid print:shadow-none print:border">
      <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
          {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-lg`}>{icon}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans text-sm">
      <style jsx global>{`
        @media print {
          @page { size: auto; margin: 15mm; }
          body { background-color: white; color: black; }
          .print\\:break-inside-avoid { break-inside: avoid !important; page-break-inside: avoid !important; display: block; }
          .print\\:overflow-visible { overflow: visible !important; }
          .print\\:hidden { display: none !important; }
          .print\\:w-full { width: 100% !important; max-width: none !important; }
          .print\\:col-span-12 { grid-column: span 12 / span 12 !important; }
          .print\\:grid-cols-4 { display: grid; grid-template-columns: repeat(4, 1fr) !important; gap: 1rem; }
        }
      `}</style>

      <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between shadow-sm sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex-shrink-0">
             <Image src={iconSrc} alt="StatistikPro Logo" fill className="object-contain drop-shadow-sm" priority />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800">
            Statistik<span className="text-indigo-600">Pro</span>
          </h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
           <button onClick={() => setInputMode('single')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${inputMode === 'single' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Data Tunggal</button>
           <button onClick={() => setInputMode('interval')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${inputMode === 'interval' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Data Kelompok</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 xl:col-span-3 space-y-4 print:hidden">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-sm text-slate-700">INPUT DATA ({inputMode === 'single' ? 'Tunggal' : 'Kelompok'})</h2>
                <button onClick={() => setRows([{id:Date.now(),x:'',f:'1'}])} className="text-[10px] text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded">RESET</button>
              </div>
              <div className="px-4 pt-4 pb-2">
                 <div className="flex gap-2 mb-4">
                    <button onClick={handleDownloadTemplate} className="flex-1 py-2 border rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">📄 TEMPLATE</button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold hover:bg-indigo-100 transition-colors">📂 UPLOAD CSV</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                 </div>
                 <div className="grid grid-cols-12 gap-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-7">{inputMode === 'single' ? 'Nilai (x)' : 'Interval'}</div>
                    <div className="col-span-3 text-center">Freq</div>
                    <div className="col-span-2 text-center">Aksi</div>
                 </div>
                 <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                   {rows.map((r) => (
                      <div key={r.id} className="grid grid-cols-12 gap-2 items-center group">
                         <div className="col-span-7"><input value={r.x} onChange={e=>updateRow(r.id,'x',e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all" placeholder={inputMode === 'single' ? "Contoh: 75" : "Contoh: 31-40"} /></div>
                         <div className="col-span-3"><input type="number" value={r.f} onChange={e=>updateRow(r.id,'f',e.target.value)} className="w-full px-1 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-center focus:bg-white focus:border-indigo-500 outline-none transition-all" /></div>
                         <div className="col-span-2 flex justify-center"><button onClick={()=>removeRow(r.id)} className="text-slate-300 hover:text-red-500 text-lg transition-colors leading-none">&times;</button></div>
                      </div>
                   ))}
                 </div>
              </div>
              <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
                 <button onClick={addRow} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-lg text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-400 transition-all">+ TAMBAH BARIS</button>
                 {error && <div className="text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-100 text-center">⚠️ {error}</div>}
                 <button onClick={handleCalculate} className="w-full py-3 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all transform active:scale-95">HITUNG STATISTIK 🚀</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9 space-y-6 print:col-span-12 print:w-full">
             {results ? (
                <div className="animate-fade-in space-y-6">
                   <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-200 print:hidden">
                      <div><h2 className="font-bold text-slate-800 text-lg">Hasil Analisis Data</h2><p className="text-xs text-slate-500 mt-1">Metode: {results.isSingleMode ? 'Data Tunggal (Exact)' : 'Data Kelompok (Coding & Interpolasi)'}</p></div>
                      <button onClick={() => handlePrint()} className="flex items-center gap-2 bg-slate-800 text-white border border-slate-800 px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-700 hover:shadow-lg transition-all"><span>🖨️</span> Cetak Laporan</button>
                   </div>
                   <div ref={printRef} className="space-y-6 print:p-8 print:bg-white">
                      <div className="hidden print:block mb-8 border-b pb-4"><h1 className="text-3xl font-bold text-slate-800">Laporan Statistik</h1><p className="text-sm text-slate-500 mt-2">Dibuat otomatis oleh StatistikPro</p></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                          <SummaryCard title="Rata-rata (Mean)" value={(results.mean ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} icon="🎯" color="text-blue-600 bg-blue-500" />
                          <SummaryCard title="Modus" value={Array.isArray(results.mode) ? results.mode.join(', ') : (results.mode ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} icon="👑" color="text-purple-600 bg-purple-500" />
                          <SummaryCard title="Simpangan Baku" value={(results.stdDev ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} icon="📉" color="text-emerald-600 bg-emerald-500" />
                          <SummaryCard title="Skewness (Momen)" value={(results.gamma1 ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} sub={`Kurtosis: ${results.gamma2.toFixed(3)}`} icon="📐" color="text-amber-600 bg-amber-500" />
                      </div>
                      
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                          <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Visualisasi</h3></div>
                          <div className="p-5 h-[350px] relative"><StatsChart stats={results} histogram={results.histogram} rawData={results.rawDataArray} /></div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                          <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100"><h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Analisis Bentuk Kurva</h3></div>
                          <div className="p-5"><Interpretation skewness={results.gamma1} kurtosis={results.gamma2} /></div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                          <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100"><h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Tabel Distribusi & Statistik Detail</h3></div>
                          <div className="p-5"><StatsTable stats={results} /></div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                          <div className="bg-indigo-50/80 px-5 py-3 border-b border-indigo-100"><h3 className="font-bold text-xs text-indigo-800 uppercase tracking-wider flex items-center gap-2"><span>📝</span> PROCESS (Langkah Pengerjaan 1-10)</h3></div>
                          <div className="p-5"><AnalysisReport stats={results} /></div>
                      </div>
                      
                      <div className="hidden print:block mt-8 text-center text-[10px] text-slate-400 border-t pt-4">Dicetak dari Aplikasi StatistikPro • {new Date().getFullYear()}</div>
                   </div>
                </div>
             ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400">
                   <div className="bg-white p-4 rounded-full shadow-sm mb-4 text-4xl">👋</div>
                   <h3 className="font-bold text-slate-600 text-lg">Siap Menganalisis</h3>
                   <p className="text-xs font-medium max-w-xs text-center mt-2 leading-relaxed">Pilih Mode Data (Tunggal/Kelompok), masukkan data, lalu klik Hitung.</p>
                </div>
             )}
          </div>
      </main>
    </div>
  );
}
export default Home;