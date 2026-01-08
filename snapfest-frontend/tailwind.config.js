/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Red-Pink-Pearl White Professional Theme
        primary: {
          50: '#fef7f7',   // Light pearl white with pink tint
          100: '#fdeaea',  // Soft pearl white
          200: '#fbd5d5',  // Pearl white with subtle pink
          300: '#f8b5b5',  // Light pink pearl
          400: '#f48fb1',  // Soft pink
          500: '#e91e63',  // Main pink
          600: '#c2185b',  // Deep pink
          700: '#ad1457',  // Rich pink
          800: '#880e4f',  // Dark pink
          900: '#4a148c',  // Deep magenta
        },
        secondary: {
          50: '#fff5f5',   // Pearl white
          100: '#fed7d7',  // Light red pearl
          200: '#feb2b2',  // Soft red pearl
          300: '#fc8181',  // Light red
          400: '#f56565',  // Medium red
          500: '#e53e3e',  // Main red
          600: '#c53030',  // Deep red
          700: '#9b2c2c',  // Rich red
          800: '#742a2a',  // Dark red
          900: '#4a1a1a',  // Deep red
        },
        accent: {
          50: '#fdf2f8',   // Pearl white with pink
          100: '#fce7f3',  // Soft pearl
          200: '#fbcfe8',  // Light pearl pink
          300: '#f9a8d4',  // Pearl pink
          400: '#f472b6',  // Medium pearl pink
          500: '#ec4899',  // Main pearl pink
          600: '#db2777',  // Deep pearl pink
          700: '#be185d',  // Rich pearl pink
          800: '#9d174d',  // Dark pearl pink
          900: '#831843',  // Deep pearl pink
        },
        pearl: {
          50: '#fefefe',   // Pure pearl white
          100: '#fdfdfd',  // Soft pearl
          200: '#fafafa',  // Light pearl
          300: '#f7f7f7',  // Pearl white
          400: '#f4f4f4',  // Soft pearl
          500: '#f1f1f1',  // Main pearl
          600: '#eeeeee',  // Pearl gray
          700: '#e5e5e5',  // Light pearl gray
          800: '#d4d4d4',  // Medium pearl gray
          900: '#a3a3a3',  // Pearl gray
        },
        neutral: {
          50: '#fafafa',   // Pearl white
          100: '#f5f5f5',  // Light pearl
          200: '#e5e5e5',  // Soft pearl gray
          300: '#d4d4d4',  // Pearl gray
          400: '#a3a3a3',  // Medium pearl gray
          500: '#737373',  // Pearl gray
          600: '#525252',  // Dark pearl gray
          700: '#404040',  // Rich pearl gray
          800: '#262626',  // Dark pearl
          900: '#171717',  // Deep pearl
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-elegant': 'pulseElegant 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseElegant: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(233, 30, 99, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(233, 30, 99, 0.4)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
