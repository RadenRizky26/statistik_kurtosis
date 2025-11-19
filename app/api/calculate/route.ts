import { NextResponse } from 'next/server';

// --- RUMUS STATISTIK (Sama seperti backend sebelumnya, tapi versi TypeScript) ---

const getMean = (data: number[]) => data.reduce((a, b) => a + b, 0) / data.length;

const getMedian = (data: number[]) => {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const getMode = (data: number[]) => {
    const freq: Record<number, number> = {};
    data.forEach(x => freq[x] = (freq[x] || 0) + 1);
    const maxFreq = Math.max(...Object.values(freq));
    if (maxFreq === 1) return []; 
    return Object.keys(freq).filter(k => freq[parseFloat(k)] === maxFreq).map(Number);
};

const getStdDev = (data: number[], mean: number) => {
    if (data.length < 2) return 0;
    const sqDiff = data.map(x => Math.pow(x - mean, 2));
    const avgSqDiff = sqDiff.reduce((a, b) => a + b, 0) / (data.length - 1); // Sample Std Dev (n-1)
    return Math.sqrt(avgSqDiff);
};

const getQuartiles = (data: number[]) => {
    const sorted = [...data].sort((a, b) => a - b);
    const q1Pos = (sorted.length + 1) / 4;
    const q3Pos = 3 * (sorted.length + 1) / 4;
    
    const interpolate = (pos: number) => {
        const base = Math.floor(pos) - 1;
        const rest = pos - Math.floor(pos);
        if (base < 0) return sorted[0];
        if (base >= sorted.length - 1) return sorted[sorted.length - 1];
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    };
    
    return { q1: interpolate(q1Pos), q3: interpolate(q3Pos) };
};

const getShapeStats = (data: number[], mean: number, stdDev: number) => {
    const n = data.length;
    if (n < 3 || stdDev === 0) return { skewness: 0, kurtosis: 0 };

    let m3 = 0, m4 = 0;
    data.forEach(x => {
        m3 += Math.pow((x - mean) / stdDev, 3);
        m4 += Math.pow((x - mean) / stdDev, 4);
    });

    const skewness = (n / ((n - 1) * (n - 2))) * m3;
    const kurtosis = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * m4 - (3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3)));
    
    return { skewness, kurtosis };
};

const generateHistogram = (data: number[], numBins: number) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = (max - min) + 0.00001; 
    const binWidth = range / numBins;
    
    const bins = [];
    for (let i = 0; i < numBins; i++) {
        const binStart = min + (i * binWidth);
        bins.push({ label: binStart.toFixed(2), count: 0 });
    }

    data.forEach(val => {
        let binIdx = Math.floor((val - min) / binWidth);
        if (binIdx >= numBins) binIdx = numBins - 1;
        if (binIdx < 0) binIdx = 0;
        bins[binIdx].count++;
    });

    return { bins, min, max, binWidth };
};

// --- HANDLER POST Request ---
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { rawData, numBins = 10 } = body;

        if (!rawData) {
            return NextResponse.json({ error: 'Data kosong' }, { status: 400 });
        }

        // Parsing data
        const dataArray = rawData.split(',')
            .map((x: string) => parseFloat(x.trim()))
            .filter((x: number) => !isNaN(x));

        if (dataArray.length === 0) {
            return NextResponse.json({ error: 'Tidak ada data valid' }, { status: 400 });
        }

        // Kalkulasi
        const mean = getMean(dataArray);
        const stdDev = getStdDev(dataArray, mean);
        const variance = Math.pow(stdDev, 2);
        const median = getMedian(dataArray);
        const mode = getMode(dataArray);
        const min = Math.min(...dataArray);
        const max = Math.max(...dataArray);
        const { q1, q3 } = getQuartiles(dataArray);
        const iqr = q3 - q1;
        
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const outliers = dataArray.filter(x => x < lowerBound || x > upperBound);

        const { skewness, kurtosis } = getShapeStats(dataArray, mean, stdDev);
        const histogram = generateHistogram(dataArray, numBins);

        return NextResponse.json({
            mean, median, mode, stdDev, variance,
            min, max, range: max - min,
            q1, q3, iqr,
            lowerBound, upperBound, outliers,
            skewness, kurtosis,
            histogram,
            rawDataArray: dataArray
        });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}