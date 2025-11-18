import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  useTheme
} from '@mui/material';
import StatCard from '../components/ui/StatCard';
import {
  People,
  MeetingRoom,
  Videocam,
  Assignment,
  CheckCircle,
  Schedule,
  Cancel,
  Refresh
} from '@mui/icons-material';
import { 
  usuariosService, 
  salasService, 
  videoproyectoresService, 
  equiposService,
  solicitudesService,
  adminService,
  handleApiError 
} from '../services/api';
import { asArray } from '../utils/normalize';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    usuarios: { total: 0, loading: true },
    salas: { total: 0, disponibles: 0, loading: true },
    videoproyectores: { total: 0, disponibles: 0, loading: true },
    equipos: { total: 0, disponibles: 0, loading: true },
    solicitudes: { total: 0, pendientes: 0, aprobadas: 0, loading: true }
  });
  const [recentSolicitudes, setRecentSolicitudes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [specialLocks, setSpecialLocks] = useState({ salas: 0, videoproyectores: 0 });
  const [history, setHistory] = useState({
    usuarios: [],
    salas: [],
    videoproyectores: [],
    equipos: [],
    solicitudes: []
  });
  const [announcement, setAnnouncement] = useState('');
  const prevStatsRef = useRef(stats);
  
  const theme = useTheme();
  const SERVICE_LABELS = {
    sala: 'Sala',
    videoproyector: 'Videoproyector',
    videocamara: 'Videocámara',
    dvd: 'DVD',
    extension: 'Extensión',
    audio: 'Audio',
    vhs: 'VHS',
    otros: 'Otros'
  };

  const queryClient = useQueryClient();

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      queryClient.invalidateQueries({ queryKey: ['salas'] });
      queryClient.invalidateQueries({ queryKey: ['videoproyectores'] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['ocupaciones'] });
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh suave cada 20s para admin y vista general
  useEffect(() => {
    // SSE en vivo: refrescar estadísticas al cambiar solicitudes
    const es = new EventSource('http://localhost:3001/api/solicitudes/stream');
    const refresh = async () => { setRefreshing(true); await loadDashboardData(); setRefreshing(false); };
    es.addEventListener('solicitudes:update', refresh);
    es.addEventListener('salas:update', refresh);
    es.addEventListener('videoproyectores:update', refresh);
    es.addEventListener('equipos:update', refresh);
    es.addEventListener('catalogo_equipos:update', refresh);
    es.onerror = () => {
      const interval = setInterval(async () => {
        try { setRefreshing(true); await loadDashboardData(); } finally { setRefreshing(false); }
      }, 25000);
      return () => clearInterval(interval);
    };
    return () => { try { es.close(); } catch {} };
  }, []);

  // React Query: usuarios (solo admin)
  const usuariosQuery = useQuery({
    queryKey: ['usuarios'],
    enabled: user.tipo_de_usuario === 'administrador',
    queryFn: async () => {
      const response = await usuariosService.getAll();
      return response.data; // { success, data, count }
    }
  });

  const ocupacionesEspecialesQuery = useQuery({
    queryKey: ['ocupaciones', user.tipo_de_usuario],
    enabled: user.tipo_de_usuario === 'administrador',
    queryFn: async () => {
      const resp = await adminService.getOcupaciones();
      const data = resp.data.data || [];
      const salas = data.filter(o => o.tipo_servicio === 'sala' && o.activo === 1).length;
      const vp = data.filter(o => o.tipo_servicio === 'videoproyector' && o.activo === 1).length;
      return { salas, videoproyectores: vp };
    }
  });

  const salasQuery = useQuery({
    queryKey: ['salas'],
    queryFn: async () => {
      const [allSalas, disponibles] = await Promise.all([
        salasService.getAll(),
        salasService.getDisponibles()
      ]);
      return {
        total: allSalas.data.count,
        disponibles: disponibles.data.count
      };
    }
  });

  const videoproyectoresQuery = useQuery({
    queryKey: ['videoproyectores'],
    queryFn: async () => {
      const [allProjectors, disponibles] = await Promise.all([
        videoproyectoresService.getAll(),
        videoproyectoresService.getDisponibles()
      ]);
      return {
        total: allProjectors.data.count,
        disponibles: disponibles.data.count
      };
    }
  });

  const equiposQuery = useQuery({
    queryKey: ['equipos'],
    queryFn: async () => {
      const [allEquipos, disponibles] = await Promise.all([
        equiposService.getAll(),
        equiposService.getDisponibles()
      ]);
      const total = (typeof allEquipos.data?.count === 'number')
        ? allEquipos.data.count
        : Array.isArray(allEquipos.data?.data) ? allEquipos.data.data.length : 0;
      const disponiblesCount = (typeof disponibles.data?.count === 'number')
        ? disponibles.data.count
        : Array.isArray(disponibles.data?.data) ? disponibles.data.data.length : 0;
      return { total, disponibles: disponiblesCount };
    }
  });

  // React Query: solicitudes (por rol)
  const solicitudesQuery = useQuery({
    queryKey: ['solicitudes', user.tipo_de_usuario, user.id_usuario],
    queryFn: async () => {
      if (user.tipo_de_usuario === 'administrador') {
        const resp = await solicitudesService.getAll();
        return resp.data.data;
      }
      const resp = await solicitudesService.getByUsuario(user.id_usuario);
      return resp.data.data;
    }
  });

  // Sync React Query data -> local stats state
  useEffect(() => {
    // Usuarios
    if (usuariosQuery.isLoading) {
      setStats(prev => ({ ...prev, usuarios: { ...prev.usuarios, loading: true } }));
    }
    if (usuariosQuery.isSuccess) {
      const count = usuariosQuery.data.count || (usuariosQuery.data.data ? usuariosQuery.data.data.length : 0);
      setStats(prev => ({ ...prev, usuarios: { total: count, loading: false } }));
      setHistory(prev => ({ ...prev, usuarios: [...prev.usuarios.slice(-11), count] }));
    }
  }, [usuariosQuery.status, usuariosQuery.data]);

  useEffect(() => {
    // Solicitudes
    if (solicitudesQuery.isLoading) {
      setStats(prev => ({ ...prev, solicitudes: { ...prev.solicitudes, loading: true } }));
    }
    if (solicitudesQuery.isSuccess) {
      const solicitudes = asArray(solicitudesQuery.data);
      const pendientes = solicitudes.filter(s => s.estado_reserva === 'pendiente').length;
      const aprobadas = solicitudes.filter(s => s.estado_reserva === 'aprobado').length;
      setStats(prev => ({
        ...prev,
        solicitudes: {
          total: solicitudes.length,
          pendientes,
          aprobadas,
          loading: false
        }
      }));
      setHistory(prev => ({ ...prev, solicitudes: [...prev.solicitudes.slice(-11), pendientes] }));
      setRecentSolicitudes(solicitudes.slice(0, 5));
    }
    if (solicitudesQuery.isError) {
      setStats(prev => ({ ...prev, solicitudes: { total: 0, pendientes: 0, aprobadas: 0, loading: false } }));
      setRecentSolicitudes([]);
    }
  }, [solicitudesQuery.status, solicitudesQuery.data]);

  // Sync Salas
  useEffect(() => {
    if (salasQuery.isLoading) {
      setStats(prev => ({ ...prev, salas: { ...prev.salas, loading: true } }));
    }
    if (salasQuery.isSuccess) {
      setStats(prev => ({ ...prev, salas: { total: salasQuery.data.total, disponibles: salasQuery.data.disponibles, loading: false } }));
      setHistory(prev => ({ ...prev, salas: [...prev.salas.slice(-11), salasQuery.data.disponibles] }));
    }
    if (salasQuery.isError) {
      setStats(prev => ({ ...prev, salas: { total: 0, disponibles: 0, loading: false } }));
    }
  }, [salasQuery.status, salasQuery.data]);

  // Sync Videoproyectores
  useEffect(() => {
    if (videoproyectoresQuery.isLoading) {
      setStats(prev => ({ ...prev, videoproyectores: { ...prev.videoproyectores, loading: true } }));
    }
    if (videoproyectoresQuery.isSuccess) {
      setStats(prev => ({ ...prev, videoproyectores: { total: videoproyectoresQuery.data.total, disponibles: videoproyectoresQuery.data.disponibles, loading: false } }));
      setHistory(prev => ({ ...prev, videoproyectores: [...prev.videoproyectores.slice(-11), videoproyectoresQuery.data.disponibles] }));
    }
    if (videoproyectoresQuery.isError) {
      setStats(prev => ({ ...prev, videoproyectores: { total: 0, disponibles: 0, loading: false } }));
    }
  }, [videoproyectoresQuery.status, videoproyectoresQuery.data]);

  // Sync Equipos
  useEffect(() => {
    if (equiposQuery.isLoading) {
      setStats(prev => ({ ...prev, equipos: { ...prev.equipos, loading: true } }));
    }
    if (equiposQuery.isSuccess) {
      setStats(prev => ({ ...prev, equipos: { total: equiposQuery.data.total, disponibles: equiposQuery.data.disponibles, loading: false } }));
      setHistory(prev => ({ ...prev, equipos: [...prev.equipos.slice(-11), equiposQuery.data.disponibles] }));
    }
    if (equiposQuery.isError) {
      setStats(prev => ({ ...prev, equipos: { total: 0, disponibles: 0, loading: false } }));
    }
  }, [equiposQuery.status, equiposQuery.data]);

  // Aria-live announcements for metric changes
  useEffect(() => {
    const prev = prevStatsRef.current;
    const current = stats;
    const changed = [];
    if (!current.usuarios.loading && prev.usuarios.total !== current.usuarios.total) {
      changed.push(`Usuarios: ${current.usuarios.total}`);
    }
    if (!current.salas.loading && prev.salas.disponibles !== current.salas.disponibles) {
      changed.push(`Salas disponibles: ${current.salas.disponibles} de ${current.salas.total}`);
    }
    if (!current.videoproyectores.loading && prev.videoproyectores.disponibles !== current.videoproyectores.disponibles) {
      changed.push(`Videoproyectores disponibles: ${current.videoproyectores.disponibles}`);
    }
    if (!current.equipos.loading && prev.equipos.disponibles !== current.equipos.disponibles) {
      changed.push(`Equipos disponibles: ${current.equipos.disponibles}`);
    }
    if (!current.solicitudes.loading && prev.solicitudes.pendientes !== current.solicitudes.pendientes) {
      changed.push(`Solicitudes pendientes: ${current.solicitudes.pendientes}`);
    }
    if (changed.length) {
      setAnnouncement(changed.join('. '));
    }
    prevStatsRef.current = current;
  }, [stats]);

  // Sync Ocupaciones Especiales
  useEffect(() => {
    if (ocupacionesEspecialesQuery.isSuccess) {
      setSpecialLocks(ocupacionesEspecialesQuery.data);
    }
    if (ocupacionesEspecialesQuery.isError || user.tipo_de_usuario !== 'administrador') {
      setSpecialLocks({ salas: 0, videoproyectores: 0 });
    }
  }, [ocupacionesEspecialesQuery.status, ocupacionesEspecialesQuery.data, user.tipo_de_usuario]);

  const { t } = useTranslation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 18) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'aprobado': return 'success';
      case 'rechazado': return 'error';
      default: return 'default';
    }
  };

  // Funciones de navegación
  const handleNavigateToUsuarios = () => {
    if (user.tipo_de_usuario === 'administrador') {
      navigate('/usuarios');
    }
  };

  const handleNavigateToSalas = () => {
    navigate('/salas');
  };

  const handleNavigateToVideoproyectores = () => {
    navigate('/videoproyectores');
  };

  const handleNavigateToEquipos = () => {
    navigate('/equipos');
  };

  const handleNavigateToSolicitudes = () => {
    navigate('/solicitudes');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Removido StatCard inline: usamos componente reutilizable con sparkline

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={48} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Aria-live region for announcing metric changes */}
      <Box aria-live="polite" role="status" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }}>
        {announcement}
      </Box>
      {/* Saludo */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {getGreeting()}, {user.nombre}!
        </Typography>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          {t('panel.welcome')}
        </Typography>
        <Chip 
          label={user.tipo_de_usuario.toUpperCase()} 
          color="primary" 
          variant="outlined"
        />
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <IconButton color="inherit" size="small" onClick={loadDashboardData}>
              <Refresh />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      <Box mb={3}>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
            Dashboard
          </Typography>
        <Alert 
          severity="info" 
          sx={{ 
            backgroundColor: theme.palette.primary.light + '20',
            border: `1px solid ${theme.palette.primary.light}`,
          }}
        >
          <Typography variant="body2">
            <strong>¡Haz clic en cualquier tarjeta!</strong> Navega directamente a la sección que necesites.
          </Typography>
        </Alert>
      </Box>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {user.tipo_de_usuario === 'administrador' && (
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ position: 'relative' }}>
              <StatCard
                title="Usuarios"
                value={stats.usuarios.total}
                icon={<People />}
                color="primary"
                loading={stats.usuarios.loading}
                onClick={handleNavigateToUsuarios}
                trendData={history.usuarios}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                GESTIONAR
              </Box>
            </Box>
          </Grid>
        )}
        
        {user.tipo_de_usuario !== 'estudiante' && (
          <Grid item xs={12} sm={6} md={user.tipo_de_usuario === 'administrador' ? 3 : 4}>
            <Box sx={{ position: 'relative' }}>
              <StatCard
                title="Salas"
                value={stats.salas.disponibles}
                subtitle={`${stats.salas.total} totales`}
                icon={<MeetingRoom />}
                color="secondary"
                loading={stats.salas.loading}
                onClick={handleNavigateToSalas}
                trendData={history.salas}
                badge={specialLocks.salas > 0 ? (
                  <Chip size="small" color="warning" label={`Bloqueos: ${specialLocks.salas}`} sx={{ mt: 1 }} />
                ) : null}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: theme.palette.secondary.main,
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                VER SALAS
              </Box>
            </Box>
          </Grid>
        )}
        
        <Grid item xs={12} sm={6} md={user.tipo_de_usuario === 'administrador' ? 3 : 4}>
          <Box sx={{ position: 'relative' }}>
            <StatCard
              title="Videoproyectores"
              value={stats.videoproyectores.disponibles}
              subtitle={`${stats.videoproyectores.total} totales`}
              icon={<Videocam />}
              color="info"
              loading={stats.videoproyectores.loading}
              onClick={handleNavigateToVideoproyectores}
              trendData={history.videoproyectores}
              badge={specialLocks.videoproyectores > 0 ? (
                <Chip size="small" color="warning" label={`Bloqueos: ${specialLocks.videoproyectores}`} sx={{ mt: 1 }} />
              ) : null}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: theme.palette.info.main,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              VER PROYECTORES
            </Box>
          </Box>
        </Grid>

        {/* Equipos visible para todos los roles; admin verá mismos datos */}
        <Grid item xs={12} sm={6} md={user.tipo_de_usuario === 'administrador' ? 3 : 4}>
          <Box sx={{ position: 'relative' }}>
            <StatCard
              title="Equipos"
              value={stats.equipos.disponibles}
              subtitle={`${stats.equipos.total} totales`}
              icon={<Assignment />}
              color={user.tipo_de_usuario === 'administrador' ? 'success' : 'info'}
              loading={stats.equipos.loading}
              onClick={handleNavigateToEquipos}
              trendData={history.equipos}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: user.tipo_de_usuario === 'administrador' ? theme.palette.success.main : theme.palette.info.main,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'transform .15s ease, box-shadow .15s ease',
                '&:hover': { transform: 'translateX(-50%) translateY(-1px)', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }
              }}
              onClick={handleNavigateToEquipos}
            >
              VER EQUIPOS
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={user.tipo_de_usuario === 'administrador' ? 3 : 4}>
          <Box sx={{ position: 'relative' }}>
            <StatCard
              title="Mis Solicitudes"
              value={stats.solicitudes.pendientes}
              subtitle={`${stats.solicitudes.total} totales, ${stats.solicitudes.aprobadas} aprobadas`}
              icon={<Assignment />}
              color="warning"
              loading={stats.solicitudes.loading}
              onClick={handleNavigateToSolicitudes}
              trendData={history.solicitudes}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: theme.palette.warning.main,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'transform .15s ease, box-shadow .15s ease',
                '&:hover': { transform: 'translateX(-50%) translateY(-1px)', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }
              }}
              onClick={handleNavigateToSolicitudes}
            >
              SOLICITAR
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Solicitudes recientes */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Solicitudes Recientes
          </Typography>
          <IconButton size="small" onClick={loadDashboardData}>
            <Refresh />
          </IconButton>
        </Box>
        
        {(!Array.isArray(recentSolicitudes) || recentSolicitudes.length === 0) ? (
          <Alert severity="info">
            No hay solicitudes para mostrar
          </Alert>
        ) : (
          <List>
            {Array.isArray(recentSolicitudes) && recentSolicitudes.map((solicitud, index) => (
              <React.Fragment key={solicitud.id_solicitud}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette[getEstadoColor(solicitud.estado_reserva)].main }}>
                      {solicitud.estado_reserva === 'pendiente' && <Schedule />}
                      {solicitud.estado_reserva === 'aprobado' && <CheckCircle />}
                      {solicitud.estado_reserva === 'rechazado' && <Cancel />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {SERVICE_LABELS[solicitud.servicio] || solicitud.servicio}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          - {formatDate(solicitud.fecha)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {solicitud.asignatura} - {solicitud.salon}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {solicitud.hora_inicio} - {solicitud.hora_fin}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      size="small"
                      label={solicitud.estado_reserva}
                      color={getEstadoColor(solicitud.estado_reserva)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                {index < recentSolicitudes.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default Dashboard;