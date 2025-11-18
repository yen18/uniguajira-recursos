import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material';
import tokens from './design/tokens';

// Construir palette desde tokens
const palette = {
  primary: { main: tokens.colors.brand.primary, light: tokens.colors.brand.primaryAccent, dark: '#003D7A', contrastText: '#FFFFFF' },
  secondary: { main: tokens.colors.brand.secondary, light: tokens.colors.brand.secondaryAccent, dark: '#C78400', contrastText: tokens.colors.neutral[800] },
  error: { main: tokens.colors.semantic.error },
  warning: { main: tokens.colors.semantic.warning },
  success: { main: tokens.colors.semantic.success },
  info: { main: tokens.colors.semantic.info },
  background: { default: tokens.colors.neutral[50], paper: '#FFFFFF' },
  text: { primary: tokens.colors.neutral[800], secondary: tokens.colors.neutral[500], disabled: tokens.colors.neutral[400] },
  divider: alpha(tokens.colors.neutral[800], 0.12),
  neutral: tokens.colors.neutral
};

const typography = {
  fontFamily: tokens.typographyScale.fontFamily,
  h1: { fontSize: `${tokens.typographyScale.sizes.h1 / 16}rem`, fontWeight: tokens.typographyScale.weights.semibold },
  h2: { fontSize: `${tokens.typographyScale.sizes.h2 / 16}rem`, fontWeight: tokens.typographyScale.weights.semibold },
  h3: { fontSize: `${tokens.typographyScale.sizes.h3 / 16}rem`, fontWeight: tokens.typographyScale.weights.semibold },
  h4: { fontSize: `${tokens.typographyScale.sizes.h4 / 16}rem`, fontWeight: tokens.typographyScale.weights.semibold },
  body1: { fontSize: `${tokens.typographyScale.sizes.body / 16}rem`, fontWeight: tokens.typographyScale.weights.regular },
  body2: { fontSize: `${tokens.typographyScale.sizes.body2 / 16}rem`, fontWeight: tokens.typographyScale.weights.regular },
  caption: { fontSize: `${tokens.typographyScale.sizes.caption / 16}rem`, fontWeight: tokens.typographyScale.weights.regular },
  button: { textTransform: 'none', fontWeight: tokens.typographyScale.weights.medium }
};

const spacingScale = tokens.spacing.base;

const theme = createTheme({
  palette,
  spacing: spacingScale,
  shape: { borderRadius: tokens.radii.md },
  typography,
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          borderRadius: theme.shape.borderRadius,
          transition: `background-color ${tokens.motion.duration.base}ms ${tokens.motion.easing.inOut}, box-shadow ${tokens.motion.duration.base}ms ${tokens.motion.easing.inOut}, transform ${tokens.motion.duration.base}ms ${tokens.motion.easing.inOut}`,
          boxShadow: ownerState.variant === 'contained' ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
          '&:hover': {
            boxShadow: ownerState.variant === 'contained' ? '0 4px 12px rgba(0,0,0,0.18)' : 'none',
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(0)'
          },
          '&:focus-visible': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.35)}`
          }
        }),
        outlined: ({ theme }) => ({
          borderWidth: 2,
          borderColor: alpha(theme.palette.primary.main, 0.5),
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.06)
          }
        })
      }
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          boxShadow: tokens.shadows.level1,
          transition: `box-shadow ${tokens.motion.duration.base}ms ${tokens.motion.easing.inOut}, transform ${tokens.motion.duration.base}ms ${tokens.motion.easing.inOut}`,
          '&:hover': {
            boxShadow: tokens.shadows.levelHover,
            transform: 'translateY(-2px)'
          }
        })
      }
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 500,
          letterSpacing: '.25px'
        }),
        filled: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
          color: theme.palette.primary.main,
          '&.MuiChip-colorSuccess': {
            backgroundColor: alpha(theme.palette.success.main, 0.12),
            color: theme.palette.success.main
          },
            '&.MuiChip-colorError': {
            backgroundColor: alpha(theme.palette.error.main, 0.12),
            color: theme.palette.error.main
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: alpha(theme.palette.warning.main, 0.12),
            color: theme.palette.warning.main
          }
        })
      }
    },
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.primary.main, 0.08)
        })
      }
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          '& fieldset': { borderColor: alpha(theme.palette.text.primary, 0.25) },
          '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.6) },
          '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.25)}`
          }
        })
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          borderRadius: theme.shape.borderRadius,
          padding: theme.spacing(1.5),
          ...(ownerState.severity === 'error' && { backgroundColor: alpha(theme.palette.error.main, 0.08) }),
          ...(ownerState.severity === 'warning' && { backgroundColor: alpha(theme.palette.warning.main, 0.08) }),
          ...(ownerState.severity === 'success' && { backgroundColor: alpha(theme.palette.success.main, 0.08) }),
          ...(ownerState.severity === 'info' && { backgroundColor: alpha(theme.palette.primary.main, 0.08) })
        })
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          transition: `box-shadow ${tokens.motion.duration.base}ms ${tokens.motion.easing.inOut}`,
          '&:hover': { boxShadow: tokens.shadows.levelHover }
        })
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
        '*:focus-visible': {
          outline: '2px solid ' + palette.primary.main,
          outlineOffset: '2px'
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.001ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.001ms !important'
          }
        }
      }
    }
  }
});

export default theme;
