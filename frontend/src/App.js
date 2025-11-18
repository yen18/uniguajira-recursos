import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { loadAccessToken, removeAccessToken } from './services/authToken';
import { testConnection } from './services/api';
// Componentes base
import AppShell from './components/layout/AppShell';
import { ToastProvider } from './components/ui/ToastProvider';
// Lazy loaded pages (después de todos los imports para cumplir import/first)
const Login = React.lazy(() => import('./components/LoginClassic'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Usuarios = React.lazy(() => import('./components/Usuarios'));
const Salas = React.lazy(() => import('./components/Salas'));
const Videoproyectores = React.lazy(() => import('./components/Videoproyectores'));
const Equipos = React.lazy(() => import('./components/Equipos'));
const Solicitudes = React.lazy(() => import('./components/Solicitudes'));
const Reportes = React.lazy(() => import('./components/Reportes'));
const CasosEspeciales = React.lazy(() => import('./components/CasosEspeciales'));

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

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    await removeAccessToken();
  };

  // Verificar si hay usuario en localStorage al cargar
  useEffect(() => {
    (async () => {
      await loadAccessToken(); // precarga token en memoria si existe
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('user');
        }
      }
    })();
  }, []);

  return (
    <Router>
      <ToastProvider>
        <AppShell user={user} onLogout={handleLogout} connectionStatus={connectionStatus} onRetry={checkConnection}>
          <Suspense fallback={<div style={{padding:'2rem', textAlign:'center'}}>Cargando…</div>}>
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
                  {/* Equipos disponible para todos los roles (vista de solo lectura para no-administradores) */}
                  <Route path="/equipos" element={<Equipos user={user} />} />
                  <Route path="/solicitudes" element={<Solicitudes user={user} />} />
                  {user?.tipo_de_usuario === 'administrador' && (
                    <Route path="/casos-especiales" element={<CasosEspeciales user={user} />} />
                  )}
                  {user?.tipo_de_usuario === 'administrador' && (
                    <Route path="/reportes" element={<Reportes user={user} />} />
                  )}
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
          </Suspense>
        </AppShell>
      </ToastProvider>
    </Router>
  );
}

export default App;
