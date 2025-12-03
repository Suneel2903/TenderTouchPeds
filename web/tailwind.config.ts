import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          tealDark: '#024A59',
          teal: '#1E899B',
          tealSoft: '#5BADAC',
          pinkSoft: '#FBDBED',
          pink: '#FF748F'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;


