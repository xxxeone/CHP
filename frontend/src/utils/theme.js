export const COLORS = {
  primary:    '#1A3A5C',   // Deep navy blue (CHP brand)
  secondary:  '#E8A020',   // Amber gold (accent)
  success:    '#27AE60',
  danger:     '#E74C3C',
  warning:    '#F39C12',
  info:       '#2980B9',
  white:      '#FFFFFF',
  black:      '#1A1A1A',
  gray:       '#9E9E9E',
  lightGray:  '#F5F5F5',
  border:     '#E0E0E0',
  background: '#F8F9FA',

  // Tier colors
  bronze:   '#CD7F32',
  silver:   '#A0A0A0',
  gold:     '#FFD700',
  platinum: '#B0C4DE',

  // Gradient
  primaryGradient: ['#1A3A5C', '#2E6DA4'],
  goldGradient:    ['#F6D365', '#FDA085'],
};

export const FONTS = {
  regular: 'System',
  medium:  'System',
  bold:    'System',
  sizes: {
    xs:  10,
    sm:  12,
    md:  14,
    lg:  16,
    xl:  18,
    xxl: 22,
    h1:  28,
    h2:  24,
    h3:  20,
  },
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const RADIUS = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};
