"use client";
import React from 'react';

interface InterpretationProps { skewness: number; kurtosis: number; }

const Interpretation: React.FC<InterpretationProps> = ({ skewness, kurtosis }) => {
  
  // Logic Skewness (Alpha 3) - Normal ≈ 0
  let skewData = { title: "Simetris", color: "border-green-500 bg-green-50", desc: "Kurva normal (α3 ≈ 0)." };
  if (skewness > 0.1) skewData = { title: "Positif (Miring Kanan)", color: "border-amber-500 bg-amber-50", desc: "Ekor memanjang ke kanan (α3 > 0)." };
  else if (skewness < -0.1) skewData = { title: "Negatif (Miring Kiri)", color: "border-amber-500 bg-amber-50", desc: "Ekor memanjang ke kiri (α3 < 0)." };

  // Logic Kurtosis (Alpha 4) - Normal ≈ 3
  // Nilai > 3 = Runcing (Lepto), Nilai < 3 = Datar (Plati)
  let kurtData = { title: "Mesokurtik (Normal)", color: "border-green-500 bg-green-50", desc: "Puncak kurva normal (α4 ≈ 3)." };
  
  if (kurtosis > 3.05) {
    kurtData = { title: "Leptokurtik (Runcing)", color: "border-red-500 bg-red-50", desc: "Puncak relatif tinggi (α4 > 3)." };
  } else if (kurtosis < 2.95) {
    kurtData = { title: "Platikurtik (Datar)", color: "border-indigo-500 bg-indigo-50", desc: "Puncak relatif datar (α4 < 3)." };
  }

  const Card = ({ label, value, data }: any) => (
    <div className={`flex flex-col p-4 rounded-lg border-l-4 border shadow-sm ${data.color} border-slate-200 h-full`}>
       <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider">{label}</span>
          <span className="font-mono text-[10px] bg-white/80 px-2 py-0.5 rounded shadow-sm opacity-80">
            {value.toFixed(4)}
          </span>
       </div>
       <div className="mt-auto">
         <h3 className="text-sm font-bold text-slate-800 mb-1">{data.title}</h3>
         <p className="text-[11px] text-slate-600 leading-relaxed break-words">
           {data.desc}
         </p>
       </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      <Card label="Kemiringan (α3)" value={skewness} data={skewData} />
      <Card label="Keruncingan (α4)" value={kurtosis} data={kurtData} />
    </div>
  );
};
export default Interpretation;