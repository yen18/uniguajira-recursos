import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
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
  useTheme,
  CardActionArea
} from '@mui/material';
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
  solicitudesService,
  handleApiError,
  API_BASE_URL
} from '../services/api';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    usuarios: { total: 0, loading: true },
    salas: { total: 0, disponibles: 0, loading: true },
    videoproyectores: { total: 0, disponibles: 0, loading: true },
    solicitudes: { total: 0, pendientes: 0, aprobadas: 0, loading: true }
  });
  const [recentSolicitudes, setRecentSolicitudes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const theme = useTheme();

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Cargar estadísticas en paralelo
      await Promise.all([
        loadUsuarios(),
        loadSalas(),
        loadVideoproyectores(),
        loadSolicitudes()
      ]);
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
    const es = new EventSource(`${API_BASE_URL}/solicitudes/stream`);
    es.addEventListener('solicitudes:update', async () => {
      setRefreshing(true);
      await loadDashboardData();
      setRefreshing(false);
    });
    es.onerror = () => {
      const interval = setInterval(async () => {
        try { setRefreshing(true); await loadDashboardData(); } finally { setRefreshing(false); }
      }, 25000);
      return () => clearInterval(interval);
    };
    return () => { try { es.close(); } catch {} };
  }, []);

  const loadUsuarios = async () => {
    try {
      if (user.tipo_de_usuario === 'administrador') {
        const response = await usuariosService.getAll();
        setStats(prev => ({
          ...prev,
          usuarios: { total: response.data.count, loading: false }
        }));
      } else {
        setStats(prev => ({
          ...prev,
          usuarios: { total: 0, loading: false }
        }));
      }
    } catch (error) {
      setStats(prev => ({
        ...prev,
        usuarios: { total: 0, loading: false }
      }));
    }
  };

  const loadSalas = async () => {
    try {
      const [allSalas, disponibles] = await Promise.all([
        salasService.getAll(),
        salasService.getDisponibles()
      ]);
      
      setStats(prev => ({
        ...prev,
        salas: { 
          total: allSalas.data.count, 
          disponibles: disponibles.data.count, 
          loading: false 
        }
      }));
    } catch (error) {
      setStats(prev => ({
        ...prev,
        salas: { total: 0, disponibles: 0, loading: false }
      }));
    }
  };

  const loadVideoproyectores = async () => {
    try {
      const [allProjectors, disponibles] = await Promise.all([
        videoproyectoresService.getAll(),
        videoproyectoresService.getDisponibles()
      ]);
      
      setStats(prev => ({
        ...prev,
        videoproyectores: { 
          total: allProjectors.data.count, 
          disponibles: disponibles.data.count, 
          loading: false 
        }
      }));
    } catch (error) {
      setStats(prev => ({
        ...prev,
        videoproyectores: { total: 0, disponibles: 0, loading: false }
      }));
    }
  };

  const loadSolicitudes = async () => {
    try {
      let solicitudesResponse;
      
      if (user.tipo_de_usuario === 'administrador') {
        solicitudesResponse = await solicitudesService.getAll();
      } else {
        solicitudesResponse = await solicitudesService.getByUsuario(user.id_usuario);
      }
      
      const solicitudes = solicitudesResponse.data.data;
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
      
      // Tomar las 5 más recientes para mostrar
      setRecentSolicitudes(solicitudes.slice(0, 5));
    } catch (error) {
      setStats(prev => ({
        ...prev,
        solicitudes: { total: 0, pendientes: 0, aprobadas: 0, loading: false }
      }));
      setRecentSolicitudes([]);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Buenos días';
    if (hour < 18) return '☀️ Buenas tardes';
    return '🌙 Buenas noches';
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

  const handleNavigateToSolicitudes = () => {
    navigate('/solicitudes');
  };

  const formatDate = (dateString) => {
    // Parseo LOCAL para evitar desfase por UTC cuando dateString es 'YYYY-MM-DD'
    const parseFecha = (str) => {
      if (!str) return null;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        const [d, m, y] = str.split('/');
        return new Date(Number(y), Number(m) - 1, Number(d));
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      return new Date(str);
    };
    const d = parseFecha(dateString);
    if (!d || isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const StatCard = ({ title, value, subtitle, icon, color, loading, onClick, clickable = true }) => (
    <Card sx={{ 
      height: '100%', 
      borderLeft: `4px solid ${theme.palette[color].main}`,
      cursor: clickable ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'visible',
      '&:hover': clickable ? {
        transform: 'translateY(-8px) scale(1.02)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
        borderLeft: `6px solid ${theme.palette[color].main}`,
      } : {},
      '&:active': clickable ? {
        transform: 'translateY(-4px) scale(0.98)',
      } : {}
    }}>
      <CardActionArea 
        onClick={clickable ? onClick : undefined}
        disabled={!clickable}
        sx={{ 
          height: '100%',
          borderRadius: 3,
          '&:hover .card-button-indicator': {
            opacity: 1,
            transform: 'scale(1)'
          }
        }}
      >
        <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
          {/* Botón de Actualizar en header del dashboard */}
          <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={async (e) => { e.stopPropagation(); setRefreshing(true); await loadDashboardData(); setRefreshing(false); }}>
              <Refresh fontSize="small" />
            </IconButton>
            {refreshing && <CircularProgress size={16} />}
          </Box>
          {/* Indicador visual de que es clickeable */}
          {clickable && (
            <Box
              className="card-button-indicator"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: theme.palette[color].main,
                color: 'white',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                opacity: 0.7,
                transform: 'scale(0.8)',
                transition: 'all 0.3s ease',
                zIndex: 1
              }}
            >
              →
            </Box>
          )}
          
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography 
                color="textSecondary" 
                gutterBottom 
                variant="h6"
                sx={{ fontWeight: 'bold' }}
              >
                {title}
              </Typography>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography variant="h3" component="div" color={color} sx={{ fontWeight: 'bold' }}>
                  {value}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {subtitle}
                </Typography>
              )}
              {clickable && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette[color].main,
                    fontWeight: 'bold',
                    mt: 1,
                    display: 'block'
                  }}
                >
                  Haz clic para acceder
                </Typography>
              )}
            </Box>
            <Avatar sx={{ 
              bgcolor: theme.palette[color].main,
              width: 56,
              height: 56,
              boxShadow: `0 4px 12px ${theme.palette[color].main}30`
            }}>
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={48} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Saludo */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {getGreeting()}, {user.nombre}!
        </Typography>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Bienvenido al panel de control
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
        <Typography variant="h6" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          📊 Panel de Control
        </Typography>
        <Alert 
          severity="info" 
          sx={{ 
            backgroundColor: theme.palette.primary.light + '20',
            border: `1px solid ${theme.palette.primary.light}`,
          }}
          icon={<Box>🖱️</Box>}
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
              }}
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
            📋 Solicitudes Recientes
          </Typography>
          <IconButton size="small" onClick={loadDashboardData}>
            <Refresh />
          </IconButton>
        </Box>
        
        {recentSolicitudes.length === 0 ? (
          <Alert severity="info">
            No hay solicitudes para mostrar
          </Alert>
        ) : (
          <List>
            {recentSolicitudes.map((solicitud, index) => (
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
                          {solicitud.servicio === 'sala' ? 'Sala' : 'Videoproyector'}
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