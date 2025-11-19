/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Next.js App Router Structure: Pindai semua file yang relevan di folder 'app'
    "./app/**/*.{js,ts,jsx,tsx}", 
    "./components/**/*.{js,ts,jsx,tsx}", // Opsi jika Anda memiliki folder komponen di root
  ],
  theme: {
    extend: {
      // Tambahkan konfigurasi kustom di sini
    },
  },
  plugins: [],
}