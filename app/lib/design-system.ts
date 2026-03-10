/**
 * Parker Design System
 * Modern-minimalist design language with precision and clarity
 * Based on 8pt grid system for perfect alignment
 */

// ═══════════════════════════════════════════════════════════════
// SPACING - Strict 8pt Grid System
// ═══════════════════════════════════════════════════════════════
export const spacing = {
  xs: 4,    // 0.5 units - Micro spacing
  sm: 8,    // 1 unit - Tight spacing
  md: 16,   // 2 units - Standard spacing
  lg: 24,   // 3 units - Comfortable spacing
  xl: 32,   // 4 units - Generous spacing
  xxl: 40,  // 5 units - Section spacing
  xxxl: 48, // 6 units - Large section spacing
  huge: 64, // 8 units - Hero spacing
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY - Clear Hierarchy with Bold Distinction
// ═══════════════════════════════════════════════════════════════
export const typography = {
  // Display sizes for hero moments
  display: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  
  // Headings
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  
  // Body text
  body: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  
  // Secondary text
  caption: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  captionBold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  
  // Smallest text
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as const,
  },
  
  // UI elements
  button: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// COLORS - Refined Palette with Semantic Meaning
// ═══════════════════════════════════════════════════════════════
export const colors = {
  // Brand - Primary interaction color
  brand: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    500: '#6366F1',  // Primary brand color
    600: '#4F46E5',  // Hover/pressed state
    700: '#4338CA',
  },
  
  // Neutrals - Foundation colors
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  
  // Semantic colors
  success: {
    light: '#E8F5E9',
    default: '#34C759',
    dark: '#2DA44E',
  },
  warning: {
    light: '#FEF3C7',
    default: '#F59E0B',
    dark: '#D97706',
    text: '#92400E',
  },
  error: {
    light: '#FEE2E2',
    default: '#EF4444',
    dark: '#DC2626',
  },
  info: {
    light: '#DBEAFE',
    default: '#3B82F6',
    dark: '#2563EB',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// ELEVATION - Subtle Depth System
// ═══════════════════════════════════════════════════════════════
export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  // Subtle lift - for cards
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // Standard elevation - for buttons and interactive elements
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Prominent elevation - for floating elements
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Brand shadow - for primary actions
  brand: {
    shadowColor: colors.brand[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// BORDER RADIUS - Consistent Rounding Scale
// ═══════════════════════════════════════════════════════════════
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999, // Fully rounded
} as const;

// ═══════════════════════════════════════════════════════════════
// ANIMATION - Timing and Easing
// ═══════════════════════════════════════════════════════════════
export const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    // These are CSS easing functions - map to native driver curves
    default: 'ease-out',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// LAYOUT - Common Layout Values
// ═══════════════════════════════════════════════════════════════
export const layout = {
  borderWidth: {
    thin: 1,
    medium: 2,
    thick: 3,
  },
  maxWidth: {
    content: 400,
    reading: 680,
  },
  hitSlop: {
    interactive: {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get multiple spacing values at once
 * @example spacingValues('md', 'lg', 'xl') // [16, 24, 32]
 */
export const spacingValues = (...keys: (keyof typeof spacing)[]) => 
  keys.map(key => spacing[key]);

/**
 * Create consistent opacity for disabled states
 */
export const opacity = {
  disabled: 0.4,
  subtle: 0.6,
  medium: 0.8,
} as const;
