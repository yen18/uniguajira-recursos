import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import OfflineBanner from '../ui/OfflineBanner';
import ConnectionStatus from '../ConnectionStatus';
import CommandPalette from '../ui/CommandPalette';
import { Box } from '@mui/material';

// AppShell: contenedor de estructura global (barra superior + contenido + banners)
// Props: user, onLogout, connectionStatus, onRetry
export default function AppShell({ user, onLogout, connectionStatus, onRetry, children }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Escucha global Ctrl+K para abrir paleta
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handlePaletteToggle = (open) => setPaletteOpen(open);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {user && <Navbar user={user} onLogout={onLogout} />}
      <ConnectionStatus status={connectionStatus} onRetry={onRetry} />
      <OfflineBanner />
      <Box component="main" sx={{ flex: 1, pt: user ? 8 : 0 }}> {/* 64px AppBar height */}
        {children}
      </Box>
      <CommandPalette open={paletteOpen} onClose={handlePaletteToggle} user={user} />
    </Box>
  );
}
