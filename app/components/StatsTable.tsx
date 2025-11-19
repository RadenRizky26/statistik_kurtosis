"use client";
import React from 'react';

interface StatsTableProps { stats: any; rawDataArray: number[]; }

const StatsTable: React.FC<StatsTableProps> = ({ stats }) => {
  const fmt = (num: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(num || 0);
  const displayMode = Array.isArray(stats.mode) ? (stats.mode.length > 0 ? stats.mode.join(', ') : 'N/A') : (stats.mode || 0).toFixed(2);

  const isInterval = stats.detailedTable?.[0]?.interval.includes('-');
  const codingLabel = isInterval ? "c" : "d"; 
  const codingDesc = isInterval ? `c=0 pada ${stats.detailedTable?.find((r:any)=>r.u===0)?.interval}` : `d = x - Mean`;

  const Row = ({ label, value, bg }: any) => (
    <div className={`flex justify-between items-center py-1.5 px-3 border-b border-slate-100 text-xs ${bg ? 'bg-slate-50' : 'bg-white'}`}>
      <span className="text-slate-600 font-medium">{label}</span>
      <span className="text-slate-800 font-bold font-mono">{value}</span>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* RINGKASAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase text-center">Pusat & Sebaran</div>
          <Row label="Rata-rata" value={fmt(stats.mean)} />
          <Row label="Median" value={fmt(stats.median)} bg />
          <Row label="Modus" value={displayMode} />
          <Row label="Simpangan Baku" value={fmt(stats.stdDev)} bg />
          <Row label="Varians" value={fmt(stats.variance)} />
          {/* TAMBAHAN BARU */}
          <Row label="Simpangan Rata-rata (SR)" value={fmt(stats.meanDeviation)} bg />
          <Row label="Koef. Variasi (KV)" value={fmt(stats.coeffVariation) + "%"} />
        </div>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
           <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase text-center">Momen & Kemiringan</div>
           <Row label="Koef. Skewness (α3)" value={fmt(stats.alpha3)} />
           <Row label="Koef. Kurtosis (α4)" value={fmt(stats.alpha4)} bg />
           <Row label="Kurtosis Persentil (K)" value={fmt(stats.percentileKurtosis)} />
           <Row label="Momen ke-3 (m3)" value={fmt(stats.moments?.m3)} bg />
           <Row label="Momen ke-4 (m4)" value={fmt(stats.moments?.m4)} />
        </div>
      </div>
      {stats.detailedTable && stats.detailedTable.length > 0 && (
        <>
        {/* 2. TABEL DISTRIBUSI FREKUENSI */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
           <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-700 text-xs">Tabel Distribusi (Coding)</span>
              <span className="text-[10px] font-mono text-slate-500">u=0 di {stats.detailedTable.find((r:any)=>r.u===0)?.interval}</span>
           </div>
           <div className="overflow-auto max-h-[300px] custom-scrollbar">
             <table className="w-full text-xs text-right relative">
               <thead className="bg-white text-slate-500 font-bold sticky top-0 z-10 shadow-sm text-[10px]">
                 <tr>
                   <th className="py-2 px-2 text-left bg-white w-24">Interval</th>
                   <th className="py-2 px-2 bg-white text-center">X</th>
                   <th className="py-2 px-2 bg-white text-center text-indigo-600">f</th>
                   <th className="py-2 px-2 bg-indigo-50 text-center text-indigo-700">u</th>
                   <th className="py-2 px-2 bg-white text-center text-slate-400">u²</th>
                   <th className="py-2 px-2 bg-indigo-50 text-center text-indigo-700">fu</th>
                   <th className="py-2 px-2 bg-white text-center">fu²</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-[11px]">
                 {stats.detailedTable.map((row: any, idx: number) => (
                   <tr key={idx} className={row.u === 0 ? "bg-yellow-50" : "hover:bg-slate-50"}>
                     <td className="py-1 px-2 text-left font-mono text-slate-600">{row.interval}</td>
                     <td className="py-1 px-2 text-center">{row.mid}</td>
                     <td className="py-1 px-2 text-center font-bold">{row.freq}</td>
                     <td className="py-1 px-2 text-center font-mono text-indigo-800 bg-indigo-50/20">{row.u}</td>
                     <td className="py-1 px-2 text-center text-slate-400">{row.u2}</td>
                     <td className="py-1 px-2 text-center font-mono text-indigo-800 bg-indigo-50/20">{row.fu}</td>
                     <td className="py-1 px-2 text-center text-slate-700">{row.fu2}</td>
                   </tr>
                 ))}
               </tbody>
               <tfoot className="bg-slate-50 font-bold text-slate-800 sticky bottom-0 text-[10px]">
                 <tr>
                   <td className="py-2 px-2 text-left">TOTAL</td><td></td>
                   <td className="py-2 px-2 text-center text-indigo-700">{stats.tableTotals.freq}</td>
                   <td></td><td></td>
                   <td className="py-2 px-2 text-center text-indigo-700">{stats.tableTotals.fu}</td>
                   <td className="py-2 px-2 text-center">{stats.tableTotals.fu2}</td>
                 </tr>
               </tfoot>
             </table>
           </div>
        </div>

        {/* 3. TABEL PERHITUNGAN MOMEN */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
           <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between">
              <span className="font-bold text-slate-700 text-xs">2. Tabel Perhitungan Momen ({codingLabel})</span>
              <span className="text-[10px] font-mono text-slate-500">{codingDesc}</span>
           </div>
           <div className="overflow-auto max-h-[400px] custom-scrollbar">
             <table className="w-full text-xs text-right relative">
               <thead className="bg-white text-slate-500 font-bold sticky top-0 z-10 shadow-sm text-[10px]">
                 <tr>
                   <th className="py-2 px-2 text-left bg-white min-w-[70px]">DATA</th>
                   <th className="py-2 px-2 bg-white text-center">f</th>
                   <th className="py-2 px-2 bg-indigo-50 text-center text-indigo-700">{codingLabel}</th>
                   <th className="py-2 px-2 bg-indigo-50 text-center text-indigo-700">f{codingLabel}</th>
                   <th className="py-2 px-2 bg-white text-center">f{codingLabel}²</th>
                   <th className="py-2 px-2 bg-white text-center">f{codingLabel}³</th>
                   <th className="py-2 px-2 bg-white text-center">f{codingLabel}⁴</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-[11px]">
                 {stats.detailedTable.map((row: any, idx: number) => (
                   <tr key={idx} className={row.u === 0 && isInterval ? "bg-yellow-50" : "hover:bg-slate-50"}>
                     <td className="py-1.5 px-2 text-left font-mono text-slate-600 whitespace-nowrap">{row.interval}</td>
                     <td className="py-1.5 px-2 text-center font-bold text-slate-700">{row.freq}</td>
                     <td className="py-1.5 px-2 text-center font-mono bg-indigo-50/20">{fmt(row.u)}</td>
                     <td className="py-1.5 px-2 text-center font-mono bg-indigo-50/20 font-bold text-indigo-700">{fmt(row.fu)}</td>
                     <td className="py-1.5 px-2 text-center text-slate-500">{fmt(row.fu2)}</td>
                     <td className="py-1.5 px-2 text-center text-slate-500">{fmt(row.fu3)}</td>
                     <td className="py-1.5 px-2 text-center text-slate-500">{fmt(row.fu4)}</td>
                   </tr>
                 ))}
               </tbody>
               <tfoot className="bg-slate-50 font-bold text-slate-800 sticky bottom-0 text-[10px]">
                 <tr>
                   <td className="py-2 px-2 text-left">JUMLAH</td>
                   <td className="py-2 px-2 text-center">{stats.tableTotals?.freq || 0}</td>
                   <td className="py-2 px-2 text-center">-</td>
                   <td className="py-2 px-2 text-center text-indigo-700">{fmt(stats.tableTotals?.fu || 0)}</td>
                   <td className="py-2 px-2 text-center">{fmt(stats.tableTotals?.fu2 || 0)}</td>
                   <td className="py-2 px-2 text-center">{fmt(stats.tableTotals?.fu3 || 0)}</td>
                   <td className="py-2 px-2 text-center">{fmt(stats.tableTotals?.fu4 || 0)}</td>
                 </tr>
               </tfoot>
             </table>
           </div>
        </div>
        </>
      )}
    </div>
  );
};
export default StatsTable;