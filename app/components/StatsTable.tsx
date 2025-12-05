"use client";
import React from 'react';

interface StatsTableProps { stats: any; }

const StatsTable: React.FC<StatsTableProps> = ({ stats }) => {
  const fmt = (num: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(num || 0);
  
  const displayMode = Array.isArray(stats.mode) 
    ? (stats.mode.length > 0 ? stats.mode.join(', ') : 'N/A') 
    : (stats.mode || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });

  const zeroRow = stats.detailedTable?.find((r:any)=>r.u===0);
  const zeroLabel = zeroRow ? (zeroRow.intervalString || zeroRow.interval || 'N/A') : 'N/A';

  return (
    <div className="space-y-8">
      {/* 1. KARTU RINGKASAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* ... (Kode kartu ringkasan sama seperti sebelumnya) ... */}
      </div>

      {/* 2. TABEL PERHITUNGAN CODING */}
      {stats.detailedTable && stats.detailedTable.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
           <div className="bg-slate-50 px-3 py-2 border-b"><span className="font-bold text-xs">Tabel Perhitungan (Coding)</span></div>
           <div className="overflow-x-auto">
             <table className="w-full text-xs text-right whitespace-nowrap">
               <thead className="bg-white font-bold border-b text-[10px]">
                 <tr>
                   <th className="py-2 px-3 text-left">Interval</th>
                   <th className="px-2">X</th>
                   <th className="px-2">f</th>
                   <th className="px-2 bg-indigo-50">u</th>
                   <th className="px-2 bg-indigo-50">u²</th>
                   <th className="px-2">fu</th>
                   <th className="px-2">fu²</th>
                   <th className="px-2">fu³</th>
                   <th className="px-2">fu⁴</th>
                 </tr>
               </thead>
               <tbody className="divide-y text-[11px]">
                 {stats.detailedTable.map((row: any, idx: number) => (
                   <tr key={idx} className={row.u === 0 ? "bg-yellow-50" : ""}>
                     <td className="py-2 px-3 text-left font-mono">{row.intervalString || row.interval}</td>
                     <td className="px-2">{row.mid}</td>
                     <td className="px-2 font-bold">{row.f}</td>
                     <td className="px-2 font-mono text-indigo-700 bg-indigo-50/50">{row.u}</td>
                     <td className="px-2 text-indigo-700 bg-indigo-50/50">{row.u2}</td>
                     <td className="px-2">{row.fu}</td>
                     <td className="px-2">{row.fu2}</td>
                     <td className="px-2 text-slate-500">{row.fu3}</td>
                     <td className="px-2 text-slate-500">{row.fu4}</td>
                   </tr>
                 ))}
               </tbody>
               <tfoot className="bg-slate-50 font-bold border-t text-[10px]">
                 <tr>
                   <td className="py-2 px-3 text-left">TOTAL (Σ)</td>
                   <td>-</td>
                   <td className="px-2 text-indigo-700">{stats.tableTotals.freq}</td>
                   <td>-</td>
                   <td>-</td>
                   <td className="px-2 text-indigo-700">{stats.tableTotals.fu}</td>
                   <td className="px-2">{stats.tableTotals.fu2}</td>
                   <td className="px-2">{stats.tableTotals.fu3}</td>
                   <td className="px-2">{stats.tableTotals.fu4}</td>
                 </tr>
               </tfoot>
             </table>
           </div>
        </div>
      )}

      {/* 3. TABEL PERHITUNGAN MANUAL (BIASA) - FITUR BARU */}
      {stats.detailedTable && stats.detailedTable.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm mt-6">
           <div className="bg-emerald-50 px-3 py-2 border-b border-emerald-100"><span className="font-bold text-xs text-emerald-800">Tabel Perhitungan (Metode Biasa / Simpangan)</span></div>
           <div className="overflow-x-auto">
             <table className="w-full text-xs text-right whitespace-nowrap">
               <thead className="bg-white font-bold border-b text-[10px]">
                 <tr>
                   <th className="py-2 px-3 text-left">Interval</th>
                   <th className="px-2">f</th>
                   <th className="px-2">X</th>
                   <th className="px-2 text-emerald-600">fX</th>
                   <th className="px-2 text-slate-500">X - X̄</th>
                   <th className="px-2 text-slate-500">(X - X̄)²</th>
                   <th className="px-2 text-emerald-600">f(X - X̄)²</th>
                 </tr>
               </thead>
               <tbody className="divide-y text-[11px]">
                 {stats.detailedTable.map((row: any, idx: number) => (
                   <tr key={idx} className="hover:bg-slate-50">
                     <td className="py-2 px-3 text-left font-mono">{row.intervalString || row.interval}</td>
                     <td className="px-2 font-bold">{row.f}</td>
                     <td className="px-2">{row.mid}</td>
                     <td className="px-2 font-bold text-emerald-700">{fmt(row.fx)}</td>
                     <td className="px-2 text-slate-500">{fmt(row.diff)}</td>
                     <td className="px-2 text-slate-500">{fmt(row.diffSq)}</td>
                     <td className="px-2 font-bold text-emerald-700">{fmt(row.fDiffSq)}</td>
                   </tr>
                 ))}
               </tbody>
               <tfoot className="bg-emerald-50 font-bold border-t border-emerald-100 text-[10px]">
                 <tr>
                   <td className="py-2 px-3 text-left">TOTAL (Σ)</td>
                   <td className="px-2">{stats.tableTotals.freq}</td>
                   <td>-</td>
                   <td className="px-2 text-emerald-800">{fmt(stats.tableTotals.fx)}</td>
                   <td>-</td>
                   <td>-</td>
                   <td className="px-2 text-emerald-800">{fmt(stats.tableTotals.fDiffSq)}</td>
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