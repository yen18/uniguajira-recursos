import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { testConnection } from './services/api';

// Componentes
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Usuarios from './components/Usuarios';
import Salas from './components/Salas';
import Videoproyectores from './components/Videoproyectores';
import Solicitudes from './components/Solicitudes';
import ConnectionStatus from './components/ConnectionStatus';

// Tema para móvil con colores de la universidad
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Azul Universidad
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#388e3c', // Verde
      light: '#66bb6a',
      dark: '#2e7d32',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '10px 20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Verificar conexión al backend al iniciar
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('connecting');
    const result = await testConnection();
    
    if (result.success) {
      setConnectionStatus('connected');
      console.log('✅ Conectado al backend:', result.data);
    } else {
      setConnectionStatus('disconnected');
      console.error('❌ Error conectando al backend:', result.error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Verificar si hay usuario en localStorage al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Status de conexión */}
          <ConnectionStatus 
            status={connectionStatus} 
            onRetry={checkConnection}
          />

          {/* Navegación */}
          {user && <Navbar user={user} onLogout={handleLogout} />}

          {/* Contenido principal */}
          <div style={{ flex: 1, paddingTop: user ? 64 : 0 }}>
            <Routes>
              {!user ? (
                <>
                  <Route 
                    path="/login" 
                    element={<Login onLogin={handleLogin} />} 
                  />
                  <Route path="*" element={<Navigate to="/login" />} />
                </>
              ) : (
                <>
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  <Route path="/usuarios" element={<Usuarios user={user} />} />
                  <Route path="/salas" element={<Salas user={user} />} />
                  <Route path="/videoproyectores" element={<Videoproyectores user={user} />} />
                  <Route path="/solicitudes" element={<Solicitudes user={user} />} />
                  {/* Redirigir según el tipo de usuario */}
                  <Route path="/" element={
                    user?.tipo_de_usuario === 'administrador' 
                      ? <Navigate to="/solicitudes" />
                      : <Navigate to="/dashboard" />
                  } />
                  <Route path="*" element={
                    user?.tipo_de_usuario === 'administrador' 
                      ? <Navigate to="/solicitudes" />
                      : <Navigate to="/dashboard" />
                  } />
                </>
              )}
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
