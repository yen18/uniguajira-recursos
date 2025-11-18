import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Fab
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MeetingRoom,
  LocationOn,
  People
} from '@mui/icons-material';
import { salasService, handleApiError } from '../services/api';

const Salas = ({ user }) => {
  // Solo roles habilitados para salas en UI (estudiante oculto)
  const ROLE_OPTIONS = ['administrador', 'profesor'];
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Si es estudiante, redirigir fuera de Salas
  useEffect(() => {
    if ((user?.tipo_de_usuario || '').toLowerCase() === 'estudiante') {
      navigate('/videoproyectores', { replace: true });
    }
  }, [user, navigate]);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSala, setEditingSala] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    capacidad: '',
    ubicacion: '',
    estado: 'disponible',
    roles_permitidos: ['administrador', 'profesor']
  });
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    loadSalas();
    // Suscribirse a SSE para actualizaciones en vivo
    const es = new EventSource('http://localhost:3001/api/solicitudes/stream');
    const onSolicitudes = async () => { setRefreshing(true); await loadSalas(); setRefreshing(false); };
    const onSalas = async () => { setRefreshing(true); await loadSalas(); setRefreshing(false); };
    es.addEventListener('solicitudes:update', onSolicitudes);
    es.addEventListener('salas:update', onSalas);
    es.onerror = () => {
      // Fallback: polling cada 25s si falla SSE
      const interval = setInterval(async () => { setRefreshing(true); await loadSalas(); setRefreshing(false); }, 25000);
      return () => clearInterval(interval);
    };
    return () => { try { es.close(); } catch {} };
  }, []);

  // Tick para actualizar contadores de tiempo (cada 30s)
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const loadSalas = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await salasService.getAll();
      const all = response.data.data || [];
      // Filtrar por rol para paneles no admin
      const role = (user?.tipo_de_usuario || '').toLowerCase();
      if (role && role !== 'administrador') {
        setSalas(all.filter(s => {
          const csv = String(s.roles_permitidos || 'administrador,profesor,estudiante').toLowerCase();
          return csv.split(',').map(x => x.trim()).includes(role);
        }));
      } else {
        setSalas(all);
      }
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (sala = null) => {
    if (sala) {
      setEditingSala(sala);
      setFormData({
        nombre: sala.nombre,
        capacidad: sala.capacidad.toString(),
        ubicacion: sala.ubicacion,
        estado: sala.estado,
        roles_permitidos: String(sala.roles_permitidos || 'administrador,profesor')
          .toLowerCase()
          .split(',')
          .map(s => s.trim())
          .filter(r => ROLE_OPTIONS.includes(r))
      });
    } else {
      setEditingSala(null);
      setFormData({
        nombre: '',
        capacidad: '',
        ubicacion: '',
        estado: 'disponible',
        roles_permitidos: [...ROLE_OPTIONS]
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSala(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const dataToSubmit = {
        ...formData,
        capacidad: parseInt(formData.capacidad),
        roles_permitidos: (Array.isArray(formData.roles_permitidos)
          ? formData.roles_permitidos
          : String(formData.roles_permitidos).split(',').map(x => x.trim()))
          .filter(r => ROLE_OPTIONS.includes(r))
      };

      if (editingSala) {
        await salasService.update(editingSala.id_sala, dataToSubmit);
      } else {
        await salasService.create(dataToSubmit);
      }
      
      handleCloseDialog();
      loadSalas();
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta sala?')) {
      try {
        await salasService.delete(id);
        loadSalas();
      } catch (error) {
        const apiError = handleApiError(error);
        setError(apiError.message);
      }
    }
  };

  const handleToggleEstado = async (sala) => {
    try {
      const nuevoEstado = sala.estado === 'disponible' ? 'ocupada' : 'disponible';
      await salasService.cambiarEstado(sala.id_sala, nuevoEstado);
      loadSalas();
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    }
  };

  const getCountdownLabel = (horarioOcupado) => {
    if (!horarioOcupado) return null;
    // formato "HH:MM:SS - HH:MM:SS" o "HH:MM - HH:MM"
    const parts = String(horarioOcupado).split('-').map(p => p.trim());
    if (parts.length !== 2) return null;
    const fin = parts[1];
    const [hh, mm] = fin.split(':').map(x => parseInt(x, 10));
    const now = new Date();
    const end = new Date();
    if (!isNaN(hh) && !isNaN(mm)) {
      end.setHours(hh, mm, 0, 0);
      const diffMs = end.getTime() - now.getTime();
      const diffMin = Math.max(0, Math.ceil(diffMs / 60000));
      return diffMin > 0 ? `Libre en ${diffMin} min` : 'Libre ahora';
    }
    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 'bold' }}>
            <MeetingRoom color="primary" /> Salas
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Gestionar salas disponibles
          </Typography>
        </Box>
        {refreshing && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <CircularProgress size={18} />
            <Typography variant="caption" color="text.secondary">Actualizando…</Typography>
          </Box>
        )}
        {(user.tipo_de_usuario === 'administrador') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2 }}
          >
            Nueva Sala
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Grid de salas */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {salas.map((sala) => (
            <Grid item xs={12} sm={6} md={4} key={sala.id_sala}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box display="flex" alignItems="center">
                      <MeetingRoom sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2">
                        {sala.nombre}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={sala.estado}
                      color={sala.estado === 'disponible' ? 'success' : 'warning'}
                      onClick={() => handleToggleEstado(sala)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                  
                  <Box mb={2}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <People sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Capacidad: {sala.capacidad} personas
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <LocationOn sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {sala.ubicacion}
                      </Typography>
                    </Box>
                    <Box mt={1} display="flex" gap={0.5} flexWrap="wrap">
                      {String(sala.roles_permitidos || 'administrador,profesor')
                        .split(',')
                        .map(r => r.trim())
                        .filter(r => ROLE_OPTIONS.includes(r))
                        .map(r => (
                          <Chip key={r} size="small" label={r} variant="outlined" />
                        ))}
                    </Box>
                    {sala.estado === 'ocupado' && sala.horario_ocupado && (
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          {`Horario: ${sala.horario_ocupado}`}
                        </Typography>
                        <Typography variant="caption" color="primary" sx={{ ml: 1, fontWeight: 600 }}>
                          {getCountdownLabel(sala.horario_ocupado)}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {(user.tipo_de_usuario === 'administrador') && (
                    <Box display="flex" justifyContent="space-between" mt="auto">
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleOpenDialog(sala)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Delete />}
                        onClick={() => handleDelete(sala.id_sala)}
                        color="error"
                      >
                        Eliminar
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* FAB para móvil */}
      {(user.tipo_de_usuario === 'administrador') && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' }
          }}
          onClick={() => handleOpenDialog()}
        >
          <Add />
        </Fab>
      )}

      {/* Dialog para crear/editar */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingSala ? <><Edit color="primary" /> Editar Sala</> : <><Add color="primary" /> Nueva Sala</>}
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              autoFocus
              margin="dense"
              name="nombre"
              label="Nombre de la Sala"
              fullWidth
              required
              value={formData.nombre}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="capacidad"
              label="Capacidad (personas)"
              type="number"
              fullWidth
              required
              value={formData.capacidad}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="ubicacion"
              label="Ubicación"
              fullWidth
              required
              value={formData.ubicacion}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                label="Estado"
              >
                <MenuItem value="disponible">Disponible</MenuItem>
                <MenuItem value="ocupada">Ocupada</MenuItem>
              </Select>
            </FormControl>
            {/* Roles permitidos */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>¿Quiénes pueden solicitar esta sala?</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {ROLE_OPTIONS.map(role => {
                  const selected = Array.isArray(formData.roles_permitidos)
                    ? formData.roles_permitidos
                    : String(formData.roles_permitidos).split(',').map(x => x.trim());
                  const checked = selected.includes(role);
                  return (
                    <Chip
                      key={role}
                      label={role}
                      color={checked ? 'primary' : 'default'}
                      variant={checked ? 'filled' : 'outlined'}
                      onClick={() => {
                        const set = new Set(selected);
                        if (set.has(role)) set.delete(role); else set.add(role);
                        setFormData(prev => ({ ...prev, roles_permitidos: Array.from(set) }));
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                  );
                })}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Nota: Los estudiantes no pueden solicitar salas. Los videoproyectores están permitidos para todos.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={20} /> : (editingSala ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Salas;