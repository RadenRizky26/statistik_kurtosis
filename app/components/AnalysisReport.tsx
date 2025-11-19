"use client";
import React from 'react';

interface AnalysisReportProps { stats: any; }

const AnalysisReport: React.FC<AnalysisReportProps> = ({ stats }) => {
  if (!stats || !stats.detailedTable || stats.detailedTable.length === 0) return null;

  // 1. Ambil Variabel untuk Rumus Mean (Coding)
  const rowZero = stats.detailedTable.find((r: any) => r.u === 0) || stats.detailedTable[Math.floor(stats.detailedTable.length / 2)];
  const xs = rowZero.mid; // Rata-rata sementara (x0)
  const p = stats.histogram.binWidth; // Panjang kelas
  const sigmaFu = stats.tableTotals.fu;
  const n = stats.tableTotals.freq;
  const meanCalc = xs + (p * (sigmaFu / n));

  // 2. Ambil Variabel untuk Rumus Kurtosis (Momen)
  const m4 = stats.moments?.m4 ?? 0;
  const m2 = stats.moments?.m2 ?? 1;
  const s4 = Math.pow(Math.sqrt(m2), 4); // s^4 = (s^2)^2 = m2^2

  return (
    <div className="grid grid-cols-1 gap-6">
      
      {/* HEADER */}
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
        <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
          <span>🧮</span> Langkah Pengerjaan (Step-by-Step)
        </h3>
        <p className="text-xs text-indigo-700 mt-1">Berikut adalah detail perhitungan matematis berdasarkan data di atas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: PERHITUNGAN MEAN (METODE CODING) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
           <h4 className="font-bold text-slate-700 text-sm mb-4 border-b pb-2">1. Menghitung Rata-rata (Metode Coding)</h4>
           
           {/* Diketahui */}
           <div className="mb-4 bg-slate-50 p-3 rounded text-xs font-mono text-slate-600 space-y-1">
              <p><span className="font-bold">Diketahui:</span></p>
              <p>• Rata-rata sementara (x₀ pada u=0) = <span className="font-bold text-indigo-600">{xs}</span></p>
              <p>• Panjang Kelas (p) = <span className="font-bold text-indigo-600">{p}</span></p>
              <p>• Σf·u = <span className="font-bold text-indigo-600">{sigmaFu}</span></p>
              <p>• Σf (n) = <span className="font-bold text-indigo-600">{n}</span></p>
           </div>

           {/* Rumus & Substitusi */}
           <div className="space-y-3 text-sm text-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold italic">Rumus:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">x̄ = x₀ + p (Σfu / Σf)</code>
              </div>
              
              <div>
                <p className="font-bold italic mb-1">Substitusi:</p>
                <div className="font-mono bg-indigo-50/50 p-3 rounded border border-indigo-100">
                  <p>x̄ = {xs} + {p} ({sigmaFu} / {n})</p>
                  <p>x̄ = {xs} + {p} ({ (sigmaFu/n).toFixed(4) })</p>
                  <p>x̄ = {xs} + { (p * (sigmaFu/n)).toFixed(4) }</p>
                  <p className="font-bold text-indigo-700 mt-1">x̄ = {meanCalc.toFixed(4)}</p>
                </div>
              </div>
           </div>
        </div>

        {/* CARD 2: PERHITUNGAN KURTOSIS (MOMEN) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
           <h4 className="font-bold text-slate-700 text-sm mb-4 border-b pb-2">2. Menghitung Koef. Kurtosis (α₄)</h4>
           
           {/* Diketahui */}
           <div className="mb-4 bg-slate-50 p-3 rounded text-xs font-mono text-slate-600 space-y-1">
              <p><span className="font-bold">Diketahui (dari tabel momen):</span></p>
              <p>• Momen ke-4 (m₄) = <span className="font-bold text-pink-600">{m4.toFixed(4)}</span></p>
              <p>• Momen ke-2 (m₂ / Varians) = <span className="font-bold text-pink-600">{m2.toFixed(4)}</span></p>
           </div>

           {/* Rumus & Substitusi */}
           <div className="space-y-3 text-sm text-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold italic">Rumus:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">α₄ = m₄ / s⁴</code>
              </div>
              
              <div>
                <p className="font-bold italic mb-1">Substitusi:</p>
                <div className="font-mono bg-pink-50/50 p-3 rounded border border-pink-100">
                  <p className="text-xs text-slate-500 mb-1">*Catatan: s⁴ = (√m₂)⁴ = (m₂)²</p>
                  <p>α₄ = {m4.toFixed(2)} / ({m2.toFixed(2)})²</p>
                  <p>α₄ = {m4.toFixed(2)} / { (m2*m2).toFixed(2) }</p>
                  <p className="font-bold text-pink-700 mt-1">α₄ = {stats.alpha4.toFixed(4)}</p>
                </div>
              </div>

              {/* Kesimpulan Kecil */}
              <div className="text-xs text-slate-500 mt-2">
                {stats.alpha4 > 3 
                  ? "Karena α₄ > 3, kurva bersifat Leptokurtik (Runcing)." 
                  : stats.alpha4 < 3 
                    ? "Karena α₄ < 3, kurva bersifat Platikurtik (Datar)." 
                    : "Karena α₄ ≈ 3, kurva bersifat Mesokurtik (Normal)."}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisReport;