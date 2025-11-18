import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import themeBase from '../theme';

const ThemeModeContext = createContext({ mode: 'light', toggleMode: () => {}, toggleReading: () => {}, isReading: false });

const getDarkPalette = () => ({
  ...themeBase.palette,
  mode: 'dark',
  background: { default: '#12181f', paper: '#1f2731' },
  text: { primary: '#F1F5F9', secondary: '#94A3B8', disabled: '#64748B' },
  divider: 'rgba(255,255,255,0.12)',
  surface: {
    lightLow: '#FFFFFF',
    lightAlt: '#F7F9FC',
    lightMuted: '#f8f9fa',
    darkLow: '#1f2731',
    darkAlt: '#263240',
    darkMuted: '#2d3946'
  }
});

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState('light'); // 'light' | 'dark' | 'contrast'

  useEffect(() => {
    const saved = localStorage.getItem('app-mode');
    if (saved === 'dark' || saved === 'light') setMode(saved);
  }, []);

  const toggleMode = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('app-mode', next);
      return next;
    });
  };

  const toggleReading = () => {
    setMode(prev => {
      const next = prev === 'reading' ? 'light' : 'reading';
      localStorage.setItem('app-mode', next);
      return next;
    });
  };

  const theme = useMemo(() => {
    if (mode === 'reading') {
      return createTheme({
        ...themeBase,
        palette: {
          ...themeBase.palette,
          mode: 'light',
          background: { default: '#f5f7fa', paper: '#ffffff' },
          text: { primary: '#1e293b', secondary: '#475569' },
          divider: '#e2e8f0',
          primary: { ...themeBase.palette.primary, main: '#2563eb', contrastText: '#ffffff' },
          secondary: { ...themeBase.palette.secondary, main: '#0d9488', contrastText: '#ffffff' }
        },
        typography: {
          ...themeBase.typography,
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial, sans-serif',
          body1: { fontSize: '1rem', lineHeight: 1.65 },
          body2: { fontSize: '0.9rem', lineHeight: 1.55 }
        },
        components: {
          ...themeBase.components,
          MuiCssBaseline: {
            styleOverrides: {
              ...themeBase.components?.MuiCssBaseline?.styleOverrides,
              body: { backgroundColor: '#f5f7fa' },
                /* Eliminamos centrar todo el árbol para evitar recorte bajo AppBar.
                  El ancho máximo se controla con Container en cada vista. */
              'a': { textDecorationThickness: '2px', textUnderlineOffset: '4px' }
            }
          },
          MuiPaper: {
            styleOverrides: {
              root: { backgroundColor: '#ffffff', backgroundImage: 'none', borderRadius: 12 }
            }
          },
          MuiButton: {
            styleOverrides: {
              root: { textTransform: 'none', fontWeight: 600, letterSpacing: 0.3 }
            }
          }
        }
      });
    }
    if (mode === 'light') return themeBase;
    return createTheme({
      ...themeBase,
      palette: getDarkPalette(),
      components: {
        ...themeBase.components,
        MuiPaper: { ...themeBase.components?.MuiPaper,
          styleOverrides: { root: ({ theme }) => ({ backgroundImage: 'none', backgroundColor: '#1f2731' }) }
        }
      }
    });
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode, toggleReading, isReading: mode === 'reading' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeModeContext);
