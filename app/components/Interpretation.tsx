"use client";
import React from 'react';

interface InterpretationProps { skewness: number; kurtosis: number; }

const Interpretation: React.FC<InterpretationProps> = ({ skewness, kurtosis }) => {
  
  // Logic Skewness (Alpha 3) - Normal ≈ 0
  let skewData = { title: "Simetris", color: "bg-green-50 border-green-200 text-green-800", desc: "Kurva setimbang (Normal)." };
  if (skewness > 0.05) skewData = { title: "Positif (Miring Kanan)", color: "bg-amber-50 border-amber-200 text-amber-800", desc: "Ekor kurva memanjang ke kanan." };
  else if (skewness < -0.05) skewData = { title: "Negatif (Miring Kiri)", color: "bg-amber-50 border-amber-200 text-amber-800", desc: "Ekor kurva memanjang ke kiri." };

  // Logic Kurtosis (Alpha 4) - Normal ≈ 3
  let kurtData = { title: "Mesokurtik (Normal)", color: "bg-blue-50 border-blue-200 text-blue-800", desc: "Keruncingan normal (α4 ≈ 3)." };
  if (kurtosis > 3.05) {
    kurtData = { title: "Leptokurtik (Runcing)", color: "bg-red-50 border-red-200 text-red-800", desc: "Puncak kurva tinggi dan tajam (α4 > 3)." };
  } else if (kurtosis < 2.95) {
    kurtData = { title: "Platikurtik (Datar)", color: "bg-indigo-50 border-indigo-200 text-indigo-800", desc: "Puncak kurva datar/lebar (α4 < 3)." };
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className={`p-4 rounded-lg border ${skewData.color}`}>
         <h4 className="font-bold text-xs uppercase tracking-wider opacity-70 mb-1">Kemiringan (Skewness)</h4>
         <div className="text-lg font-bold mb-1">{skewData.title}</div>
         <p className="text-xs opacity-90">{skewData.desc}</p>
      </div>
      <div className={`p-4 rounded-lg border ${kurtData.color}`}>
         <h4 className="font-bold text-xs uppercase tracking-wider opacity-70 mb-1">Keruncingan (Kurtosis)</h4>
         <div className="text-lg font-bold mb-1">{kurtData.title}</div>
         <p className="text-xs opacity-90">{kurtData.desc}</p>
      </div>
    </div>
  );
};

export default Interpretation;