/**
 * The only place raw colour, spacing and type values live (TEC-006).
 * Screens and components read tokens; they never write a literal.
 * Palette must stay colourblind-safe (UI-042) and colour must never be the
 * sole carrier of meaning (UI-043).
 */

export const Colors = {
  bg: "#0E0B14",
  bgRaised: "#171223",
  surface: "#211A33",
  surfaceHigh: "#2D2445",
  ink: "#F4EFE6",
  inkDim: "#A79BBF",
  inkFaint: "#6E6487",
  accent: "#E8B44A",
  accentDim: "#B88A2E",
  border: "#2D2445",
  success: "#5BC98C",
  warning: "#E8B44A",
  danger: "#E06C75",
} as const;

/** Four steps, per UI-041. Every layout must survive the largest. */
export const TextScale = [0.9, 1, 1.15, 1.35] as const;
export type TextScaleStep = 0 | 1 | 2 | 3;

export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** UI-040: nothing interactive may be smaller than this. */
export const MIN_TOUCH_TARGET = 48;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const FontFamily = {
  /** TEC-081: Cairo, one variable family covering Arabic and Latin. */
  base: "Cairo",
} as const;
