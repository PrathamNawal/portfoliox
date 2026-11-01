// Published-portfolio themes.
//
// Single source of truth for theme ids, used by:
//   - the editor picker          (components/builder/ThemePicker.tsx)
//   - the profile API validation (app/api/profile/route.ts)
//   - the published pages        (components/published/ThemeScope.tsx)
//   - the DB check constraint    (supabase/migrations/*_profile_theme.sql — keep in sync)
//
// The look of each theme lives in app/themes.css under .pxp[data-pxtheme="<id>"].
// To add a theme: add an entry here, add a token block in themes.css, add the id to the
// DB constraint, then run `npm run audit:themes`.

export const THEME_IDS = [
  'light',
  'skeuomorphism',
  'neumorphism',
  'glass',
  'papercut',
  'chrome',
  'inflated',
  'steampunk',
  'isometric',
  'brutalism',
  'minimal',
  'clay',
  'neon',
  'holo',
  'vector',
  'handwritten',
] as const

export type ThemeId = (typeof THEME_IDS)[number]

export const DEFAULT_THEME: ThemeId = 'light'

export interface ThemeMeta {
  id: ThemeId
  label: string
  blurb: string
  /** Mini preview colours for the picker: page, surface, ink, accent. */
  swatch: { bg: string; surface: string; ink: string; accent: string }
  /** Overall tone, shown in the picker. */
  tone: 'light' | 'dark'
}

export const THEMES: ThemeMeta[] = [
  { id: 'light',         label: 'Light',          blurb: 'Clean warm-white default',            tone: 'light', swatch: { bg: '#f8f7f4', surface: '#ffffff', ink: '#1c1b18', accent: '#e53416' } },
  { id: 'minimal',       label: 'Minimalism',     blurb: 'White space, hairlines, no ornament', tone: 'light', swatch: { bg: '#ffffff', surface: '#ffffff', ink: '#111111', accent: '#111111' } },
  { id: 'skeuomorphism', label: 'Skeuomorphism',  blurb: 'Linen, paper, glossy buttons',        tone: 'light', swatch: { bg: '#d8d0bd', surface: '#fbf8f1', ink: '#2b2218', accent: '#c8321a' } },
  { id: 'neumorphism',   label: 'Neumorphism',    blurb: 'Soft raised and pressed surfaces',    tone: 'light', swatch: { bg: '#e0e5ec', surface: '#e0e5ec', ink: '#2d3748', accent: '#c42a10' } },
  { id: 'glass',         label: 'Liquid Glass',   blurb: 'Translucent blurred panels',          tone: 'light', swatch: { bg: '#cfd8ff', surface: '#ffffff', ink: '#0f172a', accent: '#c42a10' } },
  { id: 'papercut',      label: 'Paper Cut',      blurb: 'Layered craft paper',                 tone: 'light', swatch: { bg: '#f1e6d0', surface: '#fffaf0', ink: '#2a2233', accent: '#d63a1c' } },
  { id: 'inflated',      label: '3D Inflated',    blurb: 'Puffy, candy-coloured volumes',       tone: 'light', swatch: { bg: '#ffd8ec', surface: '#fff4fa', ink: '#3a1a52', accent: '#d92f14' } },
  { id: 'clay',          label: 'Clay',           blurb: 'Matte plasticine pastels',            tone: 'light', swatch: { bg: '#f3e6d6', surface: '#fbf1e4', ink: '#3b2f2a', accent: '#cf4a22' } },
  { id: 'isometric',     label: 'Isometric',      blurb: 'Extruded blocks on a grid',           tone: 'light', swatch: { bg: '#eaf2ff', surface: '#ffffff', ink: '#14233f', accent: '#e23a1d' } },
  { id: 'brutalism',     label: 'Brutalism',      blurb: 'Thick borders, loud flat colour',     tone: 'light', swatch: { bg: '#f3efe3', surface: '#ffffff', ink: '#000000', accent: '#ff4d2e' } },
  { id: 'vector',        label: 'Vector Art',     blurb: 'Flat illustration with outlines',     tone: 'light', swatch: { bg: '#f4f1ff', surface: '#ffffff', ink: '#1d2150', accent: '#ff6b4a' } },
  { id: 'handwritten',   label: 'Handwritten',    blurb: 'Ruled notebook, pen strokes',         tone: 'light', swatch: { bg: '#fdfbf4', surface: '#fffef8', ink: '#23233a', accent: '#c0392b' } },
  { id: 'holo',          label: 'Holo Light',     blurb: 'Futuristic pearl and iridescence',    tone: 'light', swatch: { bg: '#f6f8ff', surface: '#ffffff', ink: '#14122b', accent: '#5b3cff' } },
  { id: 'chrome',        label: 'Liquid Chrome',  blurb: 'Mirror metal on a dark void',         tone: 'dark',  swatch: { bg: '#07080c', surface: '#dfe3ea', ink: '#f2f5fb', accent: '#e23a1d' } },
  { id: 'steampunk',     label: 'Steampunk',      blurb: 'Brass, parchment and gears',          tone: 'dark',  swatch: { bg: '#241509', surface: '#efdfb8', ink: '#f3e3bf', accent: '#b4471d' } },
  { id: 'neon',          label: 'Neon HUD',       blurb: 'Futuristic cyan and magenta glow',    tone: 'dark',  swatch: { bg: '#05060f', surface: '#0a122c', ink: '#eaf7ff', accent: '#00e5ff' } },
]

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}

/** Unknown, missing or stale values fall back to the default theme. */
export function resolveTheme(value: unknown): ThemeId {
  return isThemeId(value) ? value : DEFAULT_THEME
}
