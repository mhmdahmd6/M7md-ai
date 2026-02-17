/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // الأزرق النيوني (لمولد الصور)
        blue: {
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        },
        // البنفسجي النيوني (لمولد البرومبت)
        indigo: {
          500: '#6366f1',
          600: '#4f46e5',
          900: '#312e81',
        },
        darkBg: '#020617',   // الخلفية العميقة
        cardBg: '#0f172a',   // لون البطاقات الزجاجية
      },
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
      },
      boxShadow: {
        // ظلال متوهجة للونين
        'blue-glow': '0 0 20px rgba(59, 130, 246, 0.4)',
        'purple-glow': '0 0 20px rgba(99, 102, 241, 0.4)',
      }
    },
  },
  plugins: [],
}