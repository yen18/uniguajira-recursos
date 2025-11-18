import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  TextField,
  IconButton,
  Button,
  Stack,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { adminService, equiposService, handleApiError, API_BASE_URL } from '../services/api';

const Servicios = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newItem, setNewItem] = useState({ nombre: '' });
  const [usageMap, setUsageMap] = useState({}); // { clave: count }
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getEquipos();
      const catalog = res.data.data || [];
      setItems(catalog);
      try {
        const eqRes = await equiposService.getAll();
        const eqs = eqRes.data?.data || [];
        const counts = {};
        for (const c of catalog) counts[c.clave] = 0;
        for (const e of eqs) {
          const k = e.tipo; if (k) counts[k] = (counts[k] || 0) + 1;
        }
        setUsageMap(counts);
      } catch (e2) {
        // Silenciar error de carga de equipos
        setUsageMap({});
      }
    } catch (e) {
      setError(handleApiError(e).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const es = new EventSource(`${API_BASE_URL}/solicitudes/stream`);
    const onUpdate = async () => { await load(); };
    try { es.addEventListener('catalogo_equipos:update', onUpdate); } catch {}
    return () => {
      try { es.removeEventListener('catalogo_equipos:update', onUpdate); } catch {}
      try { es.close(); } catch {}
    };
  }, []);
      const es = new EventSource(`${API_BASE_URL}/solicitudes/stream`);
  const handleToggleActivo = async (row) => {
    try {
      await adminService.updateEquipo(row.id_equipo, { activo: row.activo ? 0 : 1 });
      await load();
    } catch (e) {
      setError(handleApiError(e).message);
    }
  };

  const handleUpdateCampo = async (row, campo, valor) => {
    try {
      await adminService.updateEquipo(row.id_equipo, { [campo]: valor });
      await load();
    } catch (e) {
      setError(handleApiError(e).message);
    }
  };

  const handleCreate = async () => {
    if (!newItem.nombre.trim()) return;
    setCreating(true);
    try {
      await adminService.createEquipo({ nombre: newItem.nombre.trim() });
      setNewItem({ nombre: '' });
      await load();
    } catch (e) {
      setError(handleApiError(e).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (row) => {
    const uso = usageMap[row.clave] || 0;
    if (uso > 0) {
      const ok = window.confirm(`Hay ${uso} equipo(s) usando este tipo. ¿Eliminar igualmente? Los equipos conservarán la clave huérfana.`);
      if (!ok) return;
    }
    try {
      await adminService.deleteEquipo(row.id_equipo);
      await load();
    } catch (e) {
      const info = handleApiError(e);
      if (info.status === 404) {
        // Idempotente: ya eliminado
        await load();
      } else if (row.clave) {
        try {
          await adminService.deleteEquipoPorClave(row.clave);
          await load();
        } catch (e2) {
          setError(handleApiError(e2).message);
        }
      } else {
        setError(info.message);
      }
    }
  };

  if (user?.tipo_de_usuario !== 'administrador') {
    return (
      <Box p={3}>
        <Typography variant="h6">Acceso restringido</Typography>
        <Typography variant="body2">Esta sección es solo para administradores.</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Servicios (Catálogo de Equipos)
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Activa/desactiva opciones del selector "Equipos adicionales" y ajusta su nombre u orden.
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            label="Nombre"
            value={newItem.nombre}
            onChange={(e) => setNewItem({ ...newItem, nombre: e.target.value })}
            size="small"
            sx={{ minWidth: 220 }}
          />
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate} disabled={creating || !newItem.nombre.trim()}>
            Agregar
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Paper sx={{ p:1, mb:2 }}>
          <Typography variant="caption" color="error">{error}</Typography>
        </Paper>
      )}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 80 }}>Activo</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell style={{ width: 120 }}>Orden</TableCell>
              <TableCell style={{ width: 80 }} align="center">Uso</TableCell>
              <TableCell style={{ width: 90 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id_equipo} hover>
                <TableCell>
                  <Switch checked={!!row.activo} onChange={() => handleToggleActivo(row)} />
                </TableCell>
                <TableCell>
                  <TextField
                    value={row.nombre}
                    onChange={(e) => handleUpdateCampo(row, 'nombre', e.target.value)}
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={row.orden}
                    onChange={(e) => handleUpdateCampo(row, 'orden', Number(e.target.value))}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {usageMap[row.clave] || 0}
                </TableCell>
                <TableCell align="right">
                  <IconButton color="error" size="small" onClick={() => handleDelete(row)} title={ (usageMap[row.clave]||0) > 0 ? 'Eliminar (confirmará uso)' : 'Eliminar' }>
                    {/* Using simple X icon via unicode if Delete not imported */}
                    ✕
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">Sin elementos</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Servicios;
