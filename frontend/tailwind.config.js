/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 👈 PASTIKAN BARIS INI ADA
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter'],
      },
      colors: {
        primary: '#2563eb',
      },
      height: {
        dvh: '100dvh',
      },
      minHeight: {
        dvh: '100dvh',
      },
      padding: {
        'safe-top': 'var(--sat, env(safe-area-inset-top, 0px))',
        'safe-bottom': 'var(--sab, env(safe-area-inset-bottom, 0px))',
        'nav-mobile': 'calc(var(--bottom-nav-h, 4rem) + var(--sab, env(safe-area-inset-bottom, 0px)))',
      },
      top: {
        'header-safe': 'calc(3.75rem + var(--sat, env(safe-area-inset-top, 0px)))',
      },
    },
  },
  plugins: [],
};
