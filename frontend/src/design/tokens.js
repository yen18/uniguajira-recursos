// Central design tokens
// Escalas y valores base para unificar estilos
export const colors = {
  brand: {
    primary: '#0056B3',
    primaryAccent: '#4D88D9',
    secondary: '#FFB300',
    secondaryAccent: '#FFCA4D'
  },
  semantic: {
    error: '#D32F2F',
    warning: '#ED6C02',
    success: '#2E7D32',
    info: '#0288D1'
  },
  neutral: {
    50: '#F7F9FC',
    100: '#EFF3F7',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1F2A37',
    900: '#111827'
  }
};

export const spacing = {
  base: 4,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48
};

export const radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999
};

export const shadows = {
  level0: 'none',
  level1: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
  level2: '0 3px 6px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
  level3: '0 6px 12px rgba(0,0,0,0.14)',
  level4: '0 8px 18px rgba(0,0,0,0.16)',
  levelHover: '0 4px 16px rgba(0,0,0,0.08)'
};

export const typographyScale = {
  fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
  sizes: {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    body: 16,
    body2: 14,
    caption: 12
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};

export const motion = {
  duration: {
    fast: 120,
    base: 180,
    slow: 260
  },
  easing: {
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    out: 'cubic-bezier(0.0, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)'
  }
};

export const tokens = {
  colors,
  spacing,
  radii,
  shadows,
  typographyScale,
  motion
};

export default tokens;
