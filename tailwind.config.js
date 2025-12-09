/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				serif: ['Playfair Display', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
				sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
			},
			colors: {
				primary: {
					50: '#faf5f0',
					100: '#f0e6d8',
					200: '#e1ccb0',
					300: '#d1ad83',
					400: '#c4935d',
					500: '#b67d42',
					600: '#9a6536',
					700: '#7d4f2d',
					800: '#664029',
					900: '#543626',
					950: '#2f1b12'
				},
				neutral: {
					50: '#fafafa',
					100: '#f5f5f5',
					200: '#e5e5e5',
					300: '#d4d4d4',
					400: '#a3a3a3',
					500: '#737373',
					600: '#525252',
					700: '#404040',
					800: '#262626',
					900: '#171717',
					950: '#0a0a0a'
				}
			}
		}
	},
	plugins: []
};
