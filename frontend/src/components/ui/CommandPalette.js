import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
  Chip,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../../providers/ThemeModeProvider';

// Simple command palette (Ctrl+K) for navigation & quick actions
// Can be extended later with dynamic registration.
export default function CommandPalette({ open, onClose, user }) {
  const [query, setQuery] = useState('');
  const theme = useTheme();
  const navigate = useNavigate();
  const { toggleMode, toggleReading, isReading, mode } = useThemeMode();

  const baseCommands = useMemo(() => {
    const cmds = [
      { id: 'dashboard', title: 'Ir al Dashboard', action: () => navigate('/') },
      { id: 'toggle-theme', title: mode === 'light' ? 'Activar modo oscuro' : 'Activar modo claro', action: () => toggleMode() },
      { id: 'toggle-reading', title: isReading ? 'Desactivar modo lectura' : 'Activar modo lectura', action: () => toggleReading() },
      { id: 'solicitudes', title: 'Ver Mis Solicitudes', action: () => navigate('/solicitudes') },
      { id: 'salas', title: 'Ver Salas', action: () => navigate('/salas') },
      { id: 'videoproyectores', title: 'Ver Videoproyectores', action: () => navigate('/videoproyectores') },
    ];
    if (user?.tipo_de_usuario === 'administrador') {
      cmds.push(
        { id: 'usuarios', title: 'Gestionar Usuarios', action: () => navigate('/usuarios') },
        { id: 'equipos', title: 'Ver Equipos', action: () => navigate('/equipos') }
      );
    }
    return cmds;
  }, [navigate, toggleMode, user]);

  const filtered = baseCommands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!open) {
          onClose(false); // ensure parent toggles state
        }
      } else if (e.key === 'Escape' && open) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleExecute = (cmd) => {
    cmd.action();
    onClose(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm" aria-label="Paleta de comandos">
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Comandos rápidos <Chip size="small" label="Ctrl+K" />
          </Typography>
        </Box>
        <TextField
          autoFocus
          fullWidth
          placeholder="Buscar comando..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          variant="outlined"
          InputProps={{ sx: { borderRadius: 2 } }}
        />
        <List dense sx={{ mt: 2, maxHeight: 360, overflowY: 'auto' }}>
          {filtered.map(cmd => (
            <ListItemButton
              key={cmd.id}
              onClick={() => handleExecute(cmd)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemText primary={cmd.title} />
            </ListItemButton>
          ))}
          {filtered.length === 0 && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No se encontraron comandos</Typography>
            </Box>
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
}
