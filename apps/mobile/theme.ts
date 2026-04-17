/**
 * Exotic Nursery ΓÇö Design System: "The Verdant Archive"
 *
 * Material You inspired, premium botanical aesthetic.
 * Based on Stitch-generated designs.
 */

export const colors = {
  // Primary
  primary: "#2E7D32",
  primaryDark: "#0D631B",
  primaryLight: "#81C784",
  primaryContainer: "#E8F5E9",

  // Surface & Background
  background: "#FAFDF7",
  surface: "#FFFFFF",
  surfaceContainer: "#F1F5EB",
  surfaceContainerHigh: "#E5EADF",

  // Text
  onBackground: "#181D17",
  onSurface: "#181D17",
  onSurfaceVariant: "#40493D",
  textSecondary: "#707A6C",
  textTertiary: "#8A9484",

  // Accent
  tertiary: "#9C6D37",
  tertiaryContainer: "#FFDCBB",
  orange: "#FFA726",
  orangeLight: "#FFF3E0",

  // Status
  error: "#D32F2F",
  errorContainer: "#FFDAD6",
  success: "#2E7D32",
  successContainer: "#E8F5E9",

  // Outline
  outline: "#BFC9BA",
  outlineVariant: "#E0E4DA",

  // Misc
  white: "#FFFFFF",
  badge: "#C62828",
  whatsapp: "#25D366",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#181D17",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: "#181D17",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: "#181D17",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

export const typography = {
  displayLg: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.5, color: colors.onBackground },
  displayMd: { fontSize: 24, fontWeight: "700" as const, letterSpacing: -0.3, color: colors.onBackground },
  titleLg: { fontSize: 20, fontWeight: "600" as const, color: colors.onBackground },
  titleMd: { fontSize: 17, fontWeight: "600" as const, color: colors.onBackground },
  titleSm: { fontSize: 15, fontWeight: "600" as const, color: colors.onBackground },
  bodyLg: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24, color: colors.onSurface },
  bodyMd: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20, color: colors.onSurfaceVariant },
  bodySm: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18, color: colors.textSecondary },
  label: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.5, textTransform: "uppercase" as const, color: colors.textSecondary },
  caption: { fontSize: 11, fontWeight: "500" as const, color: colors.textTertiary },
} as const;
