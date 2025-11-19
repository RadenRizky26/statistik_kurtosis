"use client";

import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, Filler } from 'chart.js';
import { Bar, Chart } from 'react-chartjs-2';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot'; 

// Register komponen Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, Filler, BoxPlotController, BoxAndWiskers);

interface HistogramResult { bins: { label: string; count: number; }[]; min: number; max: number; binWidth: number; }
interface StatsResult { mean: number; stdDev: number; skewness: number; kurtosis: number; }
interface StatsChartProps {
  stats: StatsResult;
  histogram: HistogramResult;
  rawData: number[];
}

const normalPdf = (x: number, mean: number, stdDev: number): number => {
  if (stdDev === 0) return 0;
  const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  return coefficient * Math.exp(exponent);
};

const StatsChart: React.FC<StatsChartProps> = ({ stats, histogram, rawData }) => {
  const { mean, stdDev } = stats;
  
  // Setup data Histogram & Kurva Normal
  const binLabels = histogram.bins.map((bin) => {
    const start = parseFloat(bin.label);
    const end = start + histogram.binWidth;
    return `${start.toFixed(1)}-${end.toFixed(1)}`;
  });
  
  const binCounts = histogram.bins.map(bin => bin.count);

  const normalCurvePoints = histogram.bins.map((bin) => {
     const x_val = parseFloat(bin.label) + histogram.binWidth / 2;
     const pdf = normalPdf(x_val, mean, stdDev);
     return pdf * rawData.length * histogram.binWidth;
  });

  const histogramData = {
    labels: binLabels,
    datasets: [
      {
        type: 'line' as const,
        label: 'Kurva Normal Teoretis',
        data: normalCurvePoints,
        borderColor: '#4f46e5', 
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: false,
        order: 1,
      },
      {
        type: 'bar' as const,
        label: 'Frekuensi Data',
        data: binCounts,
        backgroundColor: 'rgba(199, 210, 254, 0.5)', 
        borderColor: 'rgba(99, 102, 241, 1)', 
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(99, 102, 241, 0.7)',
        order: 2,
      },
    ],
  };

  // Setup data Box Plot
  const boxPlotData = {
    labels: ['Distribusi Data'],
    datasets: [{
      label: 'Box Plot',
      data: [rawData],
      backgroundColor: 'rgba(165, 180, 252, 0.5)',
      borderColor: '#4338ca',
      borderWidth: 1.5,
      outlierColor: '#ef4444',
      outlierRadius: 4,
      itemRadius: 3,
      padding: 20
    }]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Chart 1: Histogram */}
      <div className="flex flex-col bg-white rounded-lg">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-800">Histogram & Kurva Normal</h3>
          <p className="text-xs text-gray-500">Visualisasi bentuk distribusi data dibandingkan kurva lonceng ideal.</p>
        </div>
        <div className="relative h-64 w-full border border-dashed border-gray-200 rounded-lg p-2">
          <Bar 
            data={histogramData} 
            options={{
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
                tooltip: { backgroundColor: '#1e1b4b', padding: 10, cornerRadius: 4 }
              },
              scales: {
                y: { grid: { display: true, color: '#f3f4f6' }, beginAtZero: true },
                x: { grid: { display: false } }
              }
            }} 
          />
        </div>
      </div>

      {/* Chart 2: Box Plot */}
      <div className="flex flex-col bg-white rounded-lg">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-800">Box Plot (Diagram Kotak)</h3>
          <p className="text-xs text-gray-500">Deteksi visual untuk outlier dan penyebaran kuartil.</p>
        </div>
        <div className="relative h-64 w-full border border-dashed border-gray-200 rounded-lg p-2 flex items-center justify-center">
           <Chart 
              type='boxplot' 
              data={boxPlotData} 
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { backgroundColor: '#1e1b4b' }
                },
                scales: {
                   y: { title: { display: true, text: 'Nilai' } }
                }
              } as any} 
            />
        </div>
      </div>

    </div>
  );
};

export default StatsChart;