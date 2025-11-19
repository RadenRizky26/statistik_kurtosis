"use client";
import React from 'react';

interface InterpretationProps {
  skewness: number;
  kurtosis: number;
}

const Interpretation: React.FC<InterpretationProps> = ({ skewness, kurtosis }) => {
  
  // --- Logika Interpretasi Skewness ---
  let skewTitle: string;
  let skewText: string;
  let skewColorClass: string;
  // FIX: Menggunakan React.ReactNode agar tidak error di TypeScript
  let skewIcon: React.ReactNode; 

  if (skewness > 0.5) {
    skewTitle = "Miring ke Kanan (Positif)";
    skewText = "Ekor distribusi memanjang ke kanan. Ini menunjukkan mayoritas data berkumpul di nilai kecil, namun terdapat beberapa nilai ekstrem yang sangat besar menarik rata-rata.";
    skewColorClass = "border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900";
    skewIcon = <span className="text-2xl mr-3">📉</span>;
  } else if (skewness < -0.5) {
    skewTitle = "Miring ke Kiri (Negatif)";
    skewText = "Ekor distribusi memanjang ke kiri. Mayoritas data berkumpul di nilai besar, namun ada beberapa nilai ekstrem kecil yang menarik rata-rata turun.";
    skewColorClass = "border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900";
    skewIcon = <span className="text-2xl mr-3">📈</span>;
  } else {
    skewTitle = "Simetris (Normal)";
    skewText = "Distribusi data cukup seimbang. Sisi kiri dan kanan kurva hampir merupakan cerminan satu sama lain (seperti lonceng).";
    skewColorClass = "border-l-4 border-green-500 bg-green-50 text-green-900";
    skewIcon = <span className="text-2xl mr-3">🔔</span>;
  }

  // --- Logika Interpretasi Kurtosis ---
  let kurtTitle: string;
  let kurtText: string;
  let kurtColorClass: string;
  // FIX: Menggunakan React.ReactNode
  let kurtIcon: React.ReactNode;

  if (kurtosis > 1) {
    kurtTitle = "Leptokurtic (Tajam)";
    kurtText = "Puncak kurva tinggi dan tajam dengan ekor tebal. Ini mengindikasikan data terpusat kuat di tengah, tetapi memiliki risiko outlier ekstrem yang tinggi.";
    kurtColorClass = "border-l-4 border-red-500 bg-red-50 text-red-900";
    kurtIcon = <span className="text-2xl mr-3">⛰️</span>;
  } else if (kurtosis < -1) {
    kurtTitle = "Platykurtic (Datar)";
    kurtText = "Puncak kurva datar dan melebar dengan ekor tipis. Variasi data tersebar lebih merata dan risiko outlier ekstrem lebih rendah.";
    kurtColorClass = "border-l-4 border-indigo-500 bg-indigo-50 text-indigo-900";
    kurtIcon = <span className="text-2xl mr-3">🐢</span>;
  } else {
    kurtTitle = "Mesokurtic (Normal)";
    kurtText = "Kurva memiliki keruncingan yang wajar, mirip dengan distribusi normal standar.";
    kurtColorClass = "border-l-4 border-green-500 bg-green-50 text-green-900";
    kurtIcon = <span className="text-2xl mr-3">〰️</span>;
  }

  return (
    // FIX: Layout Vertikal (flex-col) agar tidak gepeng
    <div className="flex flex-col gap-4 mt-2">
      
      {/* Kartu Skewness */}
      <div className={`p-4 rounded-r-lg shadow-sm border border-gray-100 ${skewColorClass} flex items-start`}>
        <div className="flex-shrink-0 mt-1">{skewIcon}</div>
        <div>
          <h4 className="font-bold text-base mb-1">{skewTitle}</h4>
          <p className="text-sm opacity-90 leading-relaxed">{skewText}</p>
          <div className="mt-2 text-xs font-mono opacity-75 bg-white/50 inline-block px-2 py-1 rounded">
            Skew: {skewness.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Kartu Kurtosis */}
      <div className={`p-4 rounded-r-lg shadow-sm border border-gray-100 ${kurtColorClass} flex items-start`}>
        <div className="flex-shrink-0 mt-1">{kurtIcon}</div>
        <div>
          <h4 className="font-bold text-base mb-1">{kurtTitle}</h4>
          <p className="text-sm opacity-90 leading-relaxed">{kurtText}</p>
          <div className="mt-2 text-xs font-mono opacity-75 bg-white/50 inline-block px-2 py-1 rounded">
            Kurtosis: {kurtosis.toFixed(4)}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Interpretation;