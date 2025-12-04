import React from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

const AnalysisReport = ({ stats }: { stats: any }) => {
  const fmt = (n: number) => n ? n.toLocaleString('id-ID', { maximumFractionDigits: 4 }) : '0';

  const { 
     codingP, assumedMean, tableTotals, 
     mean, stdDev, variance,
     mu1_u, mu2_u, mu3_u, mu4_u,
     m2_x, m3_x, m4_x,
     gamma1, gamma2, sk1, sk2, sk4, sk5,
     median, q1, q3, p10, p90, mode,
     medL, medFk, medF,
     q1L, q1Fk, q1F,
     q3L, q3Fk, q3F,
     modeL, modeD1, modeD2
  } = stats;
  
  const n = tableTotals.freq;

  return (
    <div className="mt-2 space-y-8 text-sm text-slate-700">
       <div className="border-b pb-2 mb-4">
          <h3 className="font-bold text-lg text-indigo-900">📝 PROCESS (Langkah Pengerjaan)</h3>
          <p className="text-xs text-slate-500">Urutan langkah sesuai standar pengerjaan statistik.</p>
       </div>

       {/* 1. TOTAL FREKUENSI */}
       <div className="border-b pb-4">
          <h4 className="font-bold text-indigo-700 mb-2">1. Menghitung Total Frekuensi (N)</h4>
          <p className="font-bold text-lg"><Latex>{`$N = \\sum f_i = ${n}$`}</Latex></p>
       </div>

       {/* 2. MOMEN ASAL */}
       <div className="border-b pb-4">
          <h4 className="font-bold text-indigo-700 mb-2">2. Menghitung Momen Asal (Menggunakan Coding $u$)</h4>
          <p className="text-xs text-slate-500 mb-2 italic">Kita gunakan metode Coding untuk menyederhanakan hitungan. <Latex>{`$m'_r = \\frac{\\sum f_i u^r}{N}$`}</Latex></p>
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-100">
             <p><Latex>{`$m'_1 = \\frac{${tableTotals.fu}}{${n}} = ${fmt(mu1_u)}$`}</Latex></p>
             <p><Latex>{`$m'_2 = \\frac{${tableTotals.fu2}}{${n}} = ${fmt(mu2_u)}$`}</Latex></p>
             <p><Latex>{`$m'_3 = \\frac{${tableTotals.fu3}}{${n}} = ${fmt(mu3_u)}$`}</Latex></p>
             <p><Latex>{`$m'_4 = \\frac{${tableTotals.fu4}}{${n}} = ${fmt(mu4_u)}$`}</Latex></p>
          </div>
       </div>

       {/* 3. RATA-RATA */}
       <div className="border-b pb-4">
          <h4 className="font-bold text-indigo-700 mb-2">3. Menghitung Rata-rata (<Latex>{`$\\bar{x}$`}</Latex>)</h4>
          <p className="mb-1"><Latex>{`$\\bar{x} = M + p(m'_1)$`}</Latex></p>
          <p className="mb-1"><Latex>{`$\\bar{x} = ${assumedMean} + ${codingP}(${fmt(mu1_u)})$`}</Latex></p>
          <p className="font-bold text-lg text-slate-800"><Latex>{`$\\bar{x} = ${fmt(mean)}$`}</Latex></p>
       </div>

       {/* 4. MOMEN SENTRAL */}
       <div className="border-b pb-4">
          <h4 className="font-bold text-indigo-700 mb-2">4. Menghitung Momen Sentral ($m_2, m_3, m_4$)</h4>
          <p className="text-xs text-slate-500 mb-2 italic">Menggunakan rumus transformasi Sheppard (Coding ke Data Asli).</p>
          <div className="space-y-2">
             <div className="bg-slate-50 p-2 rounded">
                <p className="text-xs font-semibold">Momen ke-2 (Varians):</p>
                <p><Latex>{`$m_2 = p^2 [m'_2 - (m'_1)^2] = ${fmt(m2_x)}$`}</Latex></p>
             </div>
             <div className="bg-slate-50 p-2 rounded">
                <p className="text-xs font-semibold">Momen ke-3:</p>
                <p><Latex>{`$m_3 = p^3 [m'_3 - 3m'_1 m'_2 + 2(m'_1)^3] = ${fmt(m3_x)}$`}</Latex></p>
             </div>
             <div className="bg-slate-50 p-2 rounded">
                <p className="text-xs font-semibold">Momen ke-4:</p>
                <p><Latex>{`$m_4 = p^4 [m'_4 - 4m'_1 m'_3 + 6(m'_1)^2 m'_2 - 3(m'_1)^4] = ${fmt(m4_x)}$`}</Latex></p>
             </div>
          </div>
       </div>

       {/* 5. VARIANS & SIMPANGAN BAKU */}
       <div className="border-b pb-4">
          <h4 className="font-bold text-indigo-700 mb-2">5. Varians dan Simpangan Baku</h4>
          <div className="flex gap-8">
             <div>
                {/* Perbaikan: m_2 di sini adalah string LaTeX, bukan variabel */}
                <p className="mb-1 text-xs text-slate-500">Varians (<Latex>{`$s^2 = m_2$`}</Latex>)</p>
                <p className="font-bold text-lg"><Latex>{`$s^2 = ${fmt(variance)}$`}</Latex></p>
             </div>
             <div>
                {/* Perbaikan: m_2 di sini adalah string LaTeX */}
                <p className="mb-1 text-xs text-slate-500">Simpangan Baku (<Latex>{`$s = \\sqrt{m_2}$`}</Latex>)</p>
                <p className="font-bold text-lg"><Latex>{`$s = ${fmt(stdDev)}$`}</Latex></p>
             </div>
          </div>
       </div>

       {/* 6. SKEWNESS (MOMEN) */}
       <div className="border-b pb-4">
          <h4 className="font-bold text-indigo-700 mb-2">6. Koefisien Kemiringan (Skewness <Latex>{`$\\gamma_1$`}</Latex>)</h4>
          <p className="mb-1"><Latex>{`$\\gamma_1 = \\frac{m_3}{s^3} = \\frac{${fmt(m3_x)}}{(${fmt(stdDev)})^3}$`}</Latex></p>
          <p className="font-bold text-lg text-amber-600"><Latex>{`$\\gamma_1 = ${fmt(gamma1)}$`}</Latex></p>
       </div>

       {/* 7. KURTOSIS (MOMEN) */}
       <div className="border-b pb-4">
          <h4 className="font-bold text-indigo-700 mb-2">7. Koefisien Keruncingan (Kurtosis <Latex>{`$\\gamma_2$`}</Latex>)</h4>
          <p className="mb-1"><Latex>{`$\\gamma_2 = \\frac{m_4}{s^4} = \\frac{${fmt(m4_x)}}{(${fmt(stdDev)})^4}$`}</Latex></p>
          <p className="font-bold text-lg text-blue-600"><Latex>{`$\\gamma_2 = ${fmt(gamma2)}$`}</Latex></p>
          <p className="text-xs mt-1">Excess Kurtosis = <Latex>{`$\\gamma_2 - 3 = ${fmt(gamma2 - 3)}$`}</Latex></p>
       </div>

       {/* 8. UKURAN POSISI */}
       <div className="border-b pb-4">
          <h4 className="font-bold text-indigo-700 mb-2">8. Ukuran Posisi (Median, Kuartil, Modus)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
             <div className="bg-slate-50 p-3 rounded">
                <p className="font-bold">Median (Me)</p>
                <p className="mb-1"><Latex>{`$Me = L + \\left( \\frac{N/2 - F_k}{f} \\right)p$`}</Latex></p>
                <p><Latex>{`$Me = ${medL} + \\left( \\frac{${n/2} - ${medFk}}{${medF}} \\right)${codingP} = ${fmt(median)}$`}</Latex></p>
             </div>
             <div className="bg-slate-50 p-3 rounded">
                <p className="font-bold">Modus (Mo)</p>
                <p className="mb-1"><Latex>{`$Mo = L + \\left( \\frac{d_1}{d_1 + d_2} \\right)p$`}</Latex></p>
                <p><Latex>{`$Mo = ${modeL} + \\left( \\frac{${modeD1}}{${modeD1} + ${modeD2}} \\right)${codingP} = ${fmt(mode)}$`}</Latex></p>
             </div>
             <div className="bg-slate-50 p-3 rounded">
                <p className="font-bold">Kuartil 1 (Q1) & 3 (Q3)</p>
                <p>Q1 = <Latex>{`$${q1L} + (\\frac{${n/4} - ${q1Fk}}{${q1F}})${codingP} = ${fmt(q1)}$`}</Latex></p>
                <p>Q3 = <Latex>{`$${q3L} + (\\frac{${3*n/4} - ${q3Fk}}{${q3F}})${codingP} = ${fmt(q3)}$`}</Latex></p>
             </div>
             <div className="bg-slate-50 p-3 rounded">
                <p className="font-bold">Persentil P10 & P90</p>
                <p>P10 = {fmt(p10)}</p>
                <p>P90 = {fmt(p90)}</p>
             </div>
          </div>
       </div>

       {/* 9. UKURAN KEMIRINGAN LAIN */}
       <div className="border-b pb-4">
          <h4 className="font-bold text-indigo-700 mb-2">9. Ukuran Kemiringan (Pearson, Bowley, Kelly)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
             <div className="border p-2 rounded">
                 <p className="font-bold">Pearson I ($Sk_1$)</p>
                 <p><Latex>{`$Sk_1 = \\frac{\\bar{x} - Mo}{s} = ${fmt(sk1)}$`}</Latex></p>
             </div>
             <div className="border p-2 rounded">
                 <p className="font-bold">Pearson II ($Sk_2$)</p>
                 <p><Latex>{`$Sk_2 = \\frac{3(\\bar{x} - Me)}{s} = ${fmt(sk2)}$`}</Latex></p>
             </div>
             <div className="border p-2 rounded">
                 <p className="font-bold">Moment Skewness ($Sk_3 = \gamma_1$)</p>
                 <p><Latex>{`$Sk_3 = ${fmt(gamma1)}$`}</Latex></p>
             </div>
             <div className="border p-2 rounded">
                 <p className="font-bold">Bowley ($Sk_4$)</p>
                 <p><Latex>{`$Sk_4 = \\frac{Q_3 + Q_1 - 2Me}{Q_3 - Q_1} = ${fmt(sk4)}$`}</Latex></p>
             </div>
             <div className="border p-2 rounded">
                 <p className="font-bold">Kelly ($Sk_5$)</p>
                 <p><Latex>{`$Sk_5 = \\frac{P_{90} + P_{10} - 2Me}{P_{90} - P_{10}} = ${fmt(sk5)}$`}</Latex></p>
             </div>
          </div>
       </div>

       {/* 10. CHART */}
       <div>
          <h4 className="font-bold text-indigo-700 mb-2">10. Membuat Chart (Grafik)</h4>
          <p className="text-sm text-slate-500">Lihat grafik Histogram dan Ogive pada bagian "Laporan Statistik" di atas.</p>
       </div>

    </div>
  );
};

export default AnalysisReport;