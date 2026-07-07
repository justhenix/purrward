// Ptero docs file: theme presets for the developer documentation UI.
export interface ThemePreset {
	name: string;
	cssVars: Record<string, string>;
}

export const themePresets: Record<string, ThemePreset> = {
	default: {
		name: 'Default',
		cssVars: {
			'--color-bg': '#fdf8ef',
			'--color-bg-secondary': '#fffdf8',
			'--color-bg-tertiary': '#f6eedb',
			'--color-text': '#171a19',
			'--color-text-secondary': '#7a746b',
			'--color-text-tertiary': '#a59e92',
			'--color-border': '#e8decb',
			'--color-border-hover': '#d0c4ae',
			'--color-primary': '#242626',
			'--color-code-bg': '#1e1e1e',
			'--color-code-header-bg': '#2d2d2d',
			'--color-code-text': '#d4d4d4',
			'--color-code-highlight': 'rgba(255, 255, 255, 0.08)'
		}
	},
	dark: {
		name: 'Dark Charcoal',
		cssVars: {
			'--color-bg': '#1f2322',
			'--color-bg-secondary': '#2a2f2e',
			'--color-bg-tertiary': '#333938',
			'--color-text': '#f8f1e6',
			'--color-text-secondary': '#c7bfb2',
			'--color-text-tertiary': '#9c9589',
			'--color-border': '#444b49',
			'--color-border-hover': '#5d6764',
			'--color-primary': '#f8f1e6',
			'--color-code-bg': '#151817',
			'--color-code-header-bg': '#202423',
			'--color-code-text': '#e3dcd1',
			'--color-code-highlight': 'rgba(255, 255, 255, 0.05)'
		}
	},
	warm: {
		name: 'Warm Sunset',
		cssVars: {
			'--color-bg': '#faf5f0',
			'--color-bg-secondary': '#fffaf5',
			'--color-bg-tertiary': '#f5eae0',
			'--color-text': '#452b1f',
			'--color-text-secondary': '#9c7969',
			'--color-text-tertiary': '#bd9d8f',
			'--color-border': '#ebd2c4',
			'--color-border-hover': '#dbbaa8',
			'--color-primary': '#f0a688',
			'--color-code-bg': '#2b1a13',
			'--color-code-header-bg': '#3b251b',
			'--color-code-text': '#f5eae0',
			'--color-code-highlight': 'rgba(240, 166, 136, 0.12)'
		}
	},
	cyber: {
		name: 'Retro Terminal',
		cssVars: {
			'--color-bg': '#0f172a',
			'--color-bg-secondary': '#1e293b',
			'--color-bg-tertiary': '#334155',
			'--color-text': '#38bdf8',
			'--color-text-secondary': '#94a3b8',
			'--color-text-tertiary': '#64748b',
			'--color-border': '#334155',
			'--color-border-hover': '#475569',
			'--color-primary': '#38bdf8',
			'--color-code-bg': '#020617',
			'--color-code-header-bg': '#0f172a',
			'--color-code-text': '#38bdf8',
			'--color-code-highlight': 'rgba(56, 189, 248, 0.1)'
		}
	}
};
