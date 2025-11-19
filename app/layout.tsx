import type { Metadata } from "next";
// Asumsi 'Geist' dan 'Geist_Mono' adalah font kustom yang Anda gunakan
// Ganti dengan import font Anda yang sebenarnya jika berbeda
import { Geist, Geist_Mono } from "next/font/google"; 
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StatistikPro", // Ganti dengan judul yang relevan
  description: "Aplikasi statistik Skewness dan Kurtosis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Menambahkan suppressHydrationWarning pada tag <html>
    // Ini menekan peringatan hidrasi untuk atribut non-kritis yang ditambahkan oleh browser atau ekstensi.
    <html lang="en" suppressHydrationWarning> 
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}