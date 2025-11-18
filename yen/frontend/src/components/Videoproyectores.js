import React, { useState, useEffect } from 'react';
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
  Videocam,
  LocationOn,
  Refresh,
  CheckCircle,
  Cancel,
  Warning
} from '@mui/icons-material';
import { videoproyectoresService, handleApiError } from '../services/api';

const Videoproyectores = ({ user }) => {
  const [videoproyectores, setVideoproyectores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProjector, setEditingProjector] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    estado: 'disponible'
  });
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    loadVideoproyectores();
    // Suscribirse a SSE para actualizaciones en vivo
    const es = new EventSource('http://localhost:3001/api/solicitudes/stream');
    const onSolicitudes = async () => { setRefreshing(true); await loadVideoproyectores(); setRefreshing(false); };
    const onVP = async () => { setRefreshing(true); await loadVideoproyectores(); setRefreshing(false); };
    es.addEventListener('solicitudes:update', onSolicitudes);
    es.addEventListener('videoproyectores:update', onVP);
    es.onerror = () => {
      // Fallback: polling cada 25s
      const interval = setInterval(async () => { setRefreshing(true); await loadVideoproyectores(); setRefreshing(false); }, 25000);
      return () => clearInterval(interval);
    };
    return () => { try { es.close(); } catch {} };
  }, []);

  // Tick para actualizar contadores (cada 30s)
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const loadVideoproyectores = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await videoproyectoresService.getAll();
      setVideoproyectores(response.data.data);
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (projector = null) => {
    if (projector) {
      setEditingProjector(projector);
      setFormData({
        nombre: projector.nombre,
        ubicacion: projector.ubicacion,
        estado: projector.estado
      });
    } else {
      setEditingProjector(null);
      setFormData({
        nombre: '',
        ubicacion: '',
        estado: 'disponible'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProjector(null);
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
      if (editingProjector) {
        await videoproyectoresService.update(editingProjector.id_videoproyector, formData);
      } else {
        await videoproyectoresService.create(formData);
      }
      
      handleCloseDialog();
      loadVideoproyectores();
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    // Encontrar el videoproyector para mostrar información detallada
    const videoproyector = videoproyectores.find(v => v.id_videoproyector === id);
    const nombreVP = videoproyector ? videoproyector.nombre : `ID ${id}`;
    const estadoVP = videoproyector ? videoproyector.estado : 'desconocido';
    
    if (estadoVP === 'ocupado') {
      setError(`No se puede eliminar "${nombreVP}" porque está actualmente ocupado. Espera a que termine la reserva.`);
      return;
    }
    
    if (window.confirm(`¿Estás seguro de eliminar el videoproyector "${nombreVP}"?`)) {
      setLoading(true);
      try {
        const response = await videoproyectoresService.delete(id);
        setError(''); // Limpiar errores previos
        
        // Mostrar mensaje de éxito temporal
        const successMessage = `Videoproyector "${nombreVP}" eliminado exitosamente`;
        setError(successMessage);
        setTimeout(() => setError(''), 3000); // Quitar mensaje después de 3 segundos
        
        await loadVideoproyectores();
      } catch (error) {
        console.error('Error al eliminar videoproyector:', error);
        
        // Manejar diferentes tipos de errores
        let errorMessage = `Error al eliminar "${nombreVP}"`;
        
        if (error.response?.status === 400) {
          if (error.response.data.tipo === 'reservas_activas') {
            errorMessage = error.response.data.message;
          } else {
            errorMessage = `No se puede eliminar "${nombreVP}" porque tiene reservas asociadas`;
          }
        } else if (error.response?.status === 404) {
          errorMessage = `Videoproyector "${nombreVP}" no encontrado`;
        } else if (error.response?.data?.message) {
          errorMessage = `${error.response.data.message}`;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleEstado = async (projector) => {
    try {
      const nuevoEstado = projector.estado === 'disponible' ? 'ocupada' : 'disponible';
      await videoproyectoresService.cambiarEstado(projector.id_videoproyector, nuevoEstado);
      loadVideoproyectores();
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    }
  };

  const getCountdownLabel = (horarioOcupado) => {
    if (!horarioOcupado) return null;
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
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Videocam color="primary" />
            Videoproyectores
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Gestionar videoproyectores disponibles
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {refreshing && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" color="text.secondary">Actualizando…</Typography>
            </Box>
          )}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadVideoproyectores}
            sx={{ borderRadius: 2 }}
          >
            Actualizar
          </Button>
          {(user.tipo_de_usuario === 'administrador') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ borderRadius: 2 }}
            >
              Nuevo Videoproyector
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert 
          severity={error.includes('exitosamente') ? "success" : "error"} 
          sx={{ mb: 3 }} 
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Grid de videoproyectores */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {videoproyectores.map((projector) => (
            <Grid item xs={12} sm={6} md={4} key={projector.id_videoproyector}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Videocam sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2">
                        {projector.nombre}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      icon={projector.estado === 'disponible' ? <CheckCircle /> : <Warning />}
                      label={projector.estado === 'disponible' ? 'Disponible' : 'Ocupado'}
                      color={projector.estado === 'disponible' ? 'success' : 'warning'}
                      onClick={() => handleToggleEstado(projector)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                  
                  <Box mb={2}>
                    <Box display="flex" alignItems="center">
                      <LocationOn sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {projector.ubicacion}
                      </Typography>
                    </Box>
                    {projector.estado === 'ocupado' && projector.horario_ocupado && (
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          {`Horario: ${projector.horario_ocupado}`}
                        </Typography>
                        <Typography variant="caption" color="primary" sx={{ ml: 1, fontWeight: 600 }}>
                          {getCountdownLabel(projector.horario_ocupado)}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box mt="auto" pt={2}>
                    <Typography variant="caption" color="text.secondary">
                      ID: {projector.id_videoproyector}
                    </Typography>
                  </Box>

                  {(user.tipo_de_usuario === 'administrador') && (
                    <Box display="flex" justifyContent="space-between" mt={2}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleOpenDialog(projector)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Delete />}
                        onClick={() => handleDelete(projector.id_videoproyector)}
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
            {editingProjector ? <><Edit color="primary" /> Editar Videoproyector</> : <><Add color="primary" /> Nuevo Videoproyector</>}
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              autoFocus
              margin="dense"
              name="nombre"
              label="Nombre del Videoproyector"
              fullWidth
              required
              value={formData.nombre}
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
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={20} /> : (editingProjector ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Videoproyectores;