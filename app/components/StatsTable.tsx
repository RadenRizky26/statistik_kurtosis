"use client";
import React from 'react';

interface StatsTableProps { stats: any; }

const StatsTable: React.FC<StatsTableProps> = ({ stats }) => {
  const fmt = (num: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(num || 0);
  
  // Handle tampilan Modus
  const displayMode = Array.isArray(stats.mode) 
    ? (stats.mode.length > 0 ? stats.mode.join(', ') : 'N/A') 
    : (stats.mode || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });

  // Helper Row
  const Row = ({ label, value, bg, boldValue, highlight }: any) => (
    <div className={`flex justify-between items-center py-2 px-3 border-b border-slate-100 text-xs ${bg ? 'bg-slate-50' : 'bg-white'}`}>
      <span className={`font-medium ${highlight ? 'text-indigo-700' : 'text-slate-600'}`}>{label}</span>
      <span className={`font-mono ${boldValue ? 'font-bold text-indigo-700' : 'font-bold text-slate-800'}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* 1. KARTU RINGKASAN (Grid 2 Kolom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* KARTU KIRI: PUSAT & SEBARAN */}
        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase text-center tracking-wider">
            PUSAT & SEBARAN DATA
          </div>
          <div>
            <Row label="Rata-rata (Mean)" value={fmt(stats.mean)} />
            <Row label="Median (Me)" value={fmt(stats.median)} bg />
            <Row label="Modus (Mo)" value={displayMode} />
            <Row label="Simpangan Baku (S)" value={fmt(stats.stdDev)} bg />
            <Row label="Varians (S²)" value={fmt(stats.variance)} />
            <Row label="Simpangan Rata-rata (SR)" value={fmt(stats.meanDeviation)} bg />
            <Row label="Koef. Variasi (KV)" value={fmt(stats.coeffVariation) + "%"} />
          </div>
        </div>

        {/* KARTU KANAN: KEMIRINGAN & KERUNCINGAN */}
        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-indigo-50 px-3 py-2 text-[10px] font-bold text-indigo-600 uppercase text-center tracking-wider">
            UKURAN KEMIRINGAN & KERUNCINGAN
          </div>
          <div>
            <Row label="Skewness Pearson 1 (SK1)" value={fmt(stats.sk1)} boldValue />
            <Row label="Skewness Pearson 2 (SK2)" value={fmt(stats.sk2)} bg boldValue />
            <Row label="Skewness Momen (α3 / γ1)" value={fmt(stats.gamma1)} />
            <Row label="Kurtosis Momen (α4 / γ2)" value={fmt(stats.gamma2)} bg highlight boldValue />
            <Row label="Skewness Bowley (SK4)" value={fmt(stats.sk4)} />
            <Row label="Skewness Kelly (SK5)" value={fmt(stats.sk5)} bg />
            
            <div className="p-3 text-[10px] text-slate-400 bg-slate-50 border-t italic leading-relaxed text-center">
              *SK1 (Modus), SK2 (Median).<br/>
              *Kurtosis Normal = 3.
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABEL DISTRIBUSI */}
      {stats.detailedTable && stats.detailedTable.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
           <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-700 text-xs">Tabel Perhitungan (Coding)</span>
              <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border">
                u=0 pada {stats.detailedTable.find((r:any)=>r.u===0)?.intervalString || stats.detailedTable.find((r:any)=>r.u===0)?.interval}
              </span>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-xs text-right whitespace-nowrap">
               <thead className="bg-white text-slate-500 font-bold border-b border-slate-200 text-[10px]">
                 <tr>
                   <th className="py-2 px-3 text-left w-20">Interval</th>
                   <th className="py-2 px-2 text-center">X</th>
                   <th className="py-2 px-2 text-center text-indigo-600 border-l border-slate-100">f</th>
                   <th className="py-2 px-2 text-center bg-indigo-50/50 text-indigo-700 border-l border-indigo-100">u</th>
                   <th className="py-2 px-2 text-center bg-indigo-50/50 text-indigo-700">u²</th>
                   <th className="py-2 px-2 text-center border-l border-slate-100">fu</th>
                   <th className="py-2 px-2 text-center">fu²</th>
                   <th className="py-2 px-2 text-center">fu³</th>
                   <th className="py-2 px-2 text-center">fu⁴</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 text-[11px]">
                 {stats.detailedTable.map((row: any, idx: number) => (
                   <tr key={idx} className={row.u === 0 ? "bg-yellow-50/60" : "hover:bg-slate-50"}>
                     <td className="py-2 px-3 text-left font-mono text-slate-600">{row.intervalString || row.interval}</td>
                     <td className="py-2 px-2 text-center">{row.mid}</td>
                     
                     {/* PERBAIKAN DI SINI: MENGGUNAKAN row.f BUKAN row.freq */}
                     <td className="py-2 px-2 text-center font-bold border-l border-slate-100">{row.f}</td>
                     
                     <td className="py-2 px-2 text-center font-mono text-indigo-800 bg-indigo-50/20 border-l border-indigo-50">{row.u}</td>
                     <td className="py-2 px-2 text-center text-indigo-800 bg-indigo-50/20">{row.u2}</td>
                     <td className="py-2 px-2 text-center font-medium border-l border-slate-100">{row.fu}</td>
                     <td className="py-2 px-2 text-center font-medium">{row.fu2}</td>
                     <td className="py-2 px-2 text-center text-slate-500">{row.fu3}</td>
                     <td className="py-2 px-2 text-center text-slate-500">{row.fu4}</td>
                   </tr>
                 ))}
               </tbody>
               <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200 text-[10px]">
                 <tr>
                   <td className="py-2 px-3 text-left">TOTAL (Σ)</td>
                   <td className="py-2 px-2 text-center">-</td>
                   <td className="py-2 px-2 text-center text-indigo-700 border-l border-slate-200">{stats.tableTotals.freq}</td>
                   <td className="py-2 px-2 text-center border-l border-slate-200">-</td>
                   <td className="py-2 px-2 text-center">-</td>
                   <td className="py-2 px-2 text-center text-indigo-700 border-l border-slate-200">{stats.tableTotals.fu}</td>
                   <td className="py-2 px-2 text-center text-indigo-700">{stats.tableTotals.fu2}</td>
                   <td className="py-2 px-2 text-center text-slate-600">{stats.tableTotals.fu3}</td>
                   <td className="py-2 px-2 text-center text-slate-600">{stats.tableTotals.fu4}</td>
                 </tr>
               </tfoot>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default StatsTable;