/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'xai-dark': '#0d1117',
        'xai-darker': '#010409',
        'xai-accent': '#4f98a3',
        'xai-accent-hover': '#6bb3bc',
        'xai-text': '#e6edf3',
        'xai-text-muted': '#8b949e',
        'xai-border': '#30363d',
        'xai-success': '#3fb950',
        'xai-warning': '#d29922',
        'xai-error': '#f85149',
      },
    },
  },
  plugins: [],
}