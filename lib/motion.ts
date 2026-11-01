// Portfolio motion level. Owner-facing setting (later); "still" is the default everywhere.
//   still      no motion beyond hover states: today's behaviour
//   subtle     intro choreography, headline wipe, colour-from-work glow, tighter hero
//   expressive subtle + moodboard wall of covers in the hero margins (wide screens)
// Styles: "Motion" section of app/themes.css, keyed on .pxp[data-motion].

export const MOTION_LEVELS = ['still', 'subtle', 'expressive'] as const
export type MotionLevel = (typeof MOTION_LEVELS)[number]
export const DEFAULT_MOTION: MotionLevel = 'still'

export function resolveMotion(value: unknown): MotionLevel {
  return typeof value === 'string' && (MOTION_LEVELS as readonly string[]).includes(value) ? (value as MotionLevel) : DEFAULT_MOTION
}
