"use client";
import React from 'react';

interface StatsTableProps { stats: any; rawDataArray: number[]; }

const StatsTable: React.FC<StatsTableProps> = ({ stats }) => {
  const fmt = (num: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(num);
  const displayMode = Array.isArray(stats.mode) ? (stats.mode.length > 0 ? stats.mode.join(', ') : 'N/A') : stats.mode.toFixed(2);

  const Row = ({ label, value, bg }: any) => (
    <div className={`flex justify-between items-center py-1.5 px-3 border-b border-slate-100 text-xs ${bg ? 'bg-slate-50' : 'bg-white'}`}>
      <span className="text-slate-600 font-medium">{label}</span>
      <span className="text-slate-800 font-bold font-mono">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase text-center">Pusat & Sebaran</div>
          <Row label="Rata-rata" value={fmt(stats.mean)} />
          <Row label="Median" value={fmt(stats.median)} bg />
          <Row label="Modus" value={displayMode} />
          <Row label="Simpangan Baku" value={fmt(stats.stdDev)} bg />
          <Row label="Varians" value={fmt(stats.variance)} />
        </div>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
           <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase text-center">Posisi & Bentuk</div>
           <Row label="Kurtosis (K)" value={fmt(stats.percentileKurtosis)} />
           <Row label="Skewness" value={fmt(stats.skewness)} bg />
           <Row label="Kuartil 1 (Q1)" value={fmt(stats.q1)} />
           <Row label="Kuartil 3 (Q3)" value={fmt(stats.q3)} bg />
           <Row label="P10 / P90" value={`${fmt(stats.p10)} / ${fmt(stats.p90)}`} />
        </div>
      </div>

      {stats.detailedTable && stats.detailedTable.length > 0 && (
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
                     <td className="py-1 px-2 text-center font-bold text-indigo-600">{row.freq}</td>
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
      )}
    </div>
  );
};
export default StatsTable;