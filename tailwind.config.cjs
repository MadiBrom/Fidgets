/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  safelist: [
    // legacy tokens for back compat
    'bg-surface','bg-layer','bg-card',
    'text-primary','text-secondary','text-accent',
    'border','input-bg','input-text','input-placeholder',
    'button-bg','button-hover','link','nav-bg','footer-bg',
    'modal-bg','tag-bg','badge-bg',
    'dark:bg-surface-dark','dark:text-primary-dark','dark:bg-layer-dark',
    'dark:text-secondary-dark','dark:border-dark','dark:bg-card-dark',
    'dark:text-accent-dark','dark:bg-modal-dark','dark:text-input-text-dark',
    'dark:placeholder-input-placeholder-dark','dark:hover:bg-button-hover-dark',

    // fidget layout tokens
    'bg-cabinet','bg-panel','bg-module',
    'text-ink','text-chrome','text-glow',
    'border-wire','bg-slot','text-slot-text','placeholder-slot-placeholder',
    'bg-button','hover:bg-button-hover','text-link',
    'bg-marquee','bg-footer','bg-modal','bg-tag','bg-badge',
    'dark:bg-cabinet-dark','dark:text-ink-dark','dark:bg-panel-dark',
    'dark:text-chrome-dark','dark:border-wire-dark','dark:bg-module-dark',
    'dark:text-glow-dark','dark:bg-modal-dark','dark:text-slot-text-dark',
    'dark:placeholder-slot-placeholder-dark','dark:hover:bg-button-hover-dark',

    // extras
    'shadow-neon-cyan','shadow-neon-magenta','shadow-neon-lime',
    'text-glow-cyan','text-glow-magenta','text-glow-lime',
    'bg-scanlines','bg-grid-neon'
  ],

  theme: {
    extend: {
      colors: {
        // terminal base plus neon pops
        neon: {
          cyan: '#00F5FF',
          magenta: '#FF00F7',
          blue: '#3AA0FF',
          lime: '#00FF85'
        },

        // layout tokens
        cabinet: '#030907',       // app bg deep CRT
        panel:   '#07110B',       // surface layer
        module:  '#0B1912',       // card/module
        wire:    '#102318',       // borders
        ink:     '#E3FFF3',       // primary text
        chrome:  '#9AB3A1',       // secondary text
        glow:    '#00F5FF',       // accent
        link:    '#00F5FF',
        button:  '#00FF85',
        'button-hover': '#38FFC1',
        slot:    '#07110B',       // input bg
        'slot-text': '#E3FFF3',
        'slot-placeholder': '#9AB3A1',
        marquee: '#07110B',       // nav
        footer:  '#030907',
        modal:   '#0B1912',
        tag:     '#07110B',
        badge:   '#FF00F7',

        // explicit dark aliases for class toggles
        'cabinet-dark': '#030907',
        'panel-dark':   '#07110B',
        'module-dark':  '#0B1912',
        'wire-dark':    '#102318',
        'ink-dark':     '#E3FFF3',
        'chrome-dark':  '#9AB3A1',
        'glow-dark':    '#00F5FF',
        'link-dark':    '#00F5FF',
        'button-dark':  '#00FF85',
        'button-hover-dark': '#38FFC1',
        'slot-dark': '#07110B',
        'slot-text-dark': '#E3FFF3',
        'slot-placeholder-dark': '#9AB3A1',
        'marquee-dark': '#07110B',
        'footer-dark': '#030907',
        'modal-dark': '#0B1912',
        'tag-dark': '#07110B',
        'badge-dark': '#FF00F7',

        // back compat aliases you already use
        surface: '#030907',
        layer:   '#07110B',
        card:    '#0B1912',
        primary: '#E3FFF3',
        secondary: '#9AB3A1',
        accent:  '#00F5FF',
        border:  '#102318',
        input:   '#07110B',
        'input-text': '#E3FFF3',
        'input-placeholder': '#9AB3A1',
        'button-bg': '#00FF85',
        nav: '#07110B',
        modal: '#0B1912',
        tag: '#07110B',
        badge: '#FF00F7',
        footer: '#030907',

        'surface-dark': '#030907',
        'layer-dark':   '#07110B',
        'card-dark':    '#0B1912',
        'primary-dark': '#E3FFF3',
        'secondary-dark':'#9AB3A1',
        'accent-dark':  '#00F5FF',
        'border-dark':  '#102318',
        'input-dark':   '#07110B',
        'input-text-dark': '#E3FFF3',
        'input-placeholder-dark': '#9AB3A1',
        'link-dark': '#00F5FF',
        'nav-dark':  '#07110B',
        'modal-dark':  '#0B1912',
        'tag-dark':    '#07110B',
        'badge-dark':  '#FF00F7',
        'footer-dark': '#030907'
      },

      boxShadow: {
        'neon-cyan': '0 0 8px rgba(0,245,255,0.7), 0 0 18px rgba(0,245,255,0.45)',
        'neon-magenta': '0 0 8px rgba(255,0,247,0.7), 0 0 18px rgba(255,0,247,0.45)',
        'neon-lime': '0 0 8px rgba(0,255,133,0.7), 0 0 18px rgba(0,255,133,0.45)'
      },

      backgroundImage: {
        'scanlines':
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'grid-neon':
          'radial-gradient(circle at 50% 50%, rgba(0,245,255,0.15), transparent 60%)'
      }
    }
  },

  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.text-glow-cyan': { textShadow: '0 0 0.5rem #00F5FF, 0 0 1rem rgba(0,245,255,.8)' },
        '.text-glow-magenta': { textShadow: '0 0 0.5rem #FF00F7, 0 0 1rem rgba(255,0,247,.8)' },
        '.text-glow-lime': { textShadow: '0 0 0.5rem #00FF85, 0 0 1rem rgba(0,255,133,.8)' },
        '.bg-scanlines': { backgroundSize: '100% 3px, 3px 100%' },
        '.bg-grid-neon': { backgroundSize: '100% 100%' }
      })
    })
  ]
}
