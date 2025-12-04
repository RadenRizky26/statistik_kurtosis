"use client";

import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions // Pastikan ini terimport
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- DEFINISI TIPE DATA ---
interface HistogramBin { label: string; count: number; }
interface HistogramResult { bins: HistogramBin[]; min: number; max: number; binWidth: number; }
interface StatsResult { mean: number; stdDev: number; skewness: number; kurtosis: number; detailedTable: any[]; }
interface StatsChartProps { stats: StatsResult; histogram: HistogramResult; rawData: number[]; }

const StatsChart: React.FC<StatsChartProps> = ({ stats, histogram, rawData }) => {
  const [activeTab, setActiveTab] = useState<'histogram' | 'ogive'>('histogram');

  // 1. SAFETY CHECK
  if (!histogram || !histogram.bins || !stats || !rawData) {
    return <div className="p-4 text-center text-gray-400 text-sm">Memuat grafik...</div>;
  }

  const { mean, stdDev } = stats;
  const totalData = rawData.length;

  const binLabels = histogram.bins.map(bin => bin.label);
  const binCounts = histogram.bins.map(bin => bin.count);

  // --- 2. DATA KURVA NORMAL ---
  const normalCurvePoints = histogram.bins.map((bin) => {
      const x_val = parseFloat(bin.label); 
      const effectiveStd = stdDev || 1;
      const exponent = -0.5 * Math.pow((x_val - mean) / effectiveStd, 2);
      const pdf = (1 / (effectiveStd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
      return pdf * totalData * histogram.binWidth;
  });

  // --- 3. DATA OGIVE ---
  let cumPos = 0;
  const ogivePositive = binCounts.map(count => { cumPos += count; return cumPos; });

  let cumNeg = totalData;
  const ogiveNegative = binCounts.map(count => { const val = cumNeg; cumNeg -= count; return val; });

  // --- 4. CONFIG CHART (FIXED TYPE) ---
  // PERBAIKAN DISINI: Gunakan ChartOptions<'bar'>['scales'] agar tidak dianggap Radial/Radar chart
  const commonScales: ChartOptions<'bar'>['scales'] = {
    y: { 
      beginAtZero: true, 
      grid: { color: '#f1f5f9' }, 
      title: { display: true, text: 'Frekuensi' } 
    },
    x: { 
      type: 'category', 
      grid: { display: false }, 
      title: { display: true, text: 'Nilai Tengah (X)' }, 
      ticks: { autoSkip: false } 
    }
  };

  // DATA TAB 1: HISTOGRAM
  const histogramData: ChartData<'bar' | 'line', number[], string> = {
    labels: binLabels,
    datasets: [
      {
        type: 'line' as const,
        label: 'Kurva Normal',
        data: normalCurvePoints,
        borderColor: '#4f46e5', 
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        order: 1,
        fill: false,
      },
      {
        type: 'bar' as const,
        label: 'Frekuensi',
        data: binCounts,
        backgroundColor: 'rgba(199, 210, 254, 0.6)',
        borderColor: '#4f46e5',
        borderWidth: 1,
        order: 2,
        barPercentage: 1.0,
        categoryPercentage: 1.0
      },
    ],
  };

  // DATA TAB 2: OGIVE
  const ogiveData: ChartData<'line', number[], string> = {
    labels: binLabels,
    datasets: [
      {
        label: 'Ogive Positif (≤)',
        data: ogivePositive,
        borderColor: '#059669',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#059669',
        tension: 0.3,
        fill: false
      },
      {
        label: 'Ogive Negatif (≥)',
        data: ogiveNegative,
        borderColor: '#dc2626',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#dc2626',
        tension: 0.3,
        fill: false
      }
    ]
  };

  return (
    <div className="flex flex-col h-full">
       <div className="flex gap-2 mb-4 bg-slate-100 p-1.5 rounded-lg w-fit border border-slate-200">
          <button 
            onClick={() => setActiveTab('histogram')} 
            className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeTab === 'histogram' ? 'bg-white shadow-sm text-indigo-600 border border-slate-100' : 'text-slate-500 hover:text-indigo-500'}`}
          >
            HISTOGRAM
          </button>
          <button 
            onClick={() => setActiveTab('ogive')} 
            className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeTab === 'ogive' ? 'bg-white shadow-sm text-emerald-600 border border-slate-100' : 'text-slate-500 hover:text-emerald-500'}`}
          >
            OGIVE (KUMULATIF)
          </button>
       </div>

       <div className="relative w-full h-full min-h-[300px]">
          {activeTab === 'histogram' ? (
             <Bar 
                data={histogramData as ChartData<'bar', number[], string>} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { 
                    legend: { position: 'bottom', labels: { font: { size: 11 } } },
                    title: { display: true, text: 'Distribusi Frekuensi & Normal', color: '#94a3b8', font: { weight: 'normal' } } 
                  },
                  scales: commonScales 
                }} 
             />
             
          ) : (
             <Line 
                data={ogiveData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { 
                    legend: { position: 'bottom', labels: { font: { size: 11 } } },
                    title: { display: true, text: 'Titik Potong = Letak Median', color: '#94a3b8', font: { weight: 'normal' } } 
                  },
                  // Kita definisikan ulang scales secara manual agar aman dari error spread operator pada tipe union
                  scales: {
                    x: commonScales!.x,
                    y: {
                        ...commonScales!.y, // Spread properti Y dari commonScales
                        title: { display: true, text: 'Frekuensi Kumulatif' } // Override title
                    } as any // 'as any' kecil di sini diperlukan karena properti scales sangat kompleks di ChartJS
                  }
                }} 
             />
          )}
       </div>
    </div>
  );
};

export default StatsChart;