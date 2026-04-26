/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: '#faf8f3',
        'cream-card': '#ffffff',
        border: '#e8e3d8',
        text: '#2b2b2b',
        muted: '#8a8475',
        green: {
          DEFAULT: '#3a5a40',
          dark:    '#2d4733',
          light:   '#d8e2d4',
        },
        cat: {
          produce:  '#7ba05b',
          dairy:    '#6b9bc4',
          meat:     '#c47b6b',
          seafood:  '#c47b6b',
          pantry:   '#c49b5e',
          bakery:   '#d4a373',
          frozen:   '#88b8d4',
          drinks:   '#a584c4',
          snacks:   '#d4a373',
          hygiene:  '#a8a29e',
          cleaning: '#a8a29e',
          pets:     '#a8a29e',
          baby:     '#a8a29e',
          pharmacy: '#a8a29e',
          other:    '#a8a29e',
        },
      },
      fontFamily: {
        serif: ['CormorantGaramond_500Medium'],
      },
    },
  },
  plugins: [],
};
