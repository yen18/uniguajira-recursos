import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  People,
  MeetingRoom,
  Videocam,
  Assignment,
  Logout,
  School,
  BarChart,
  LightMode,
  DarkMode,
  ChromeReaderMode
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import HandymanIcon from '@mui/icons-material/Handyman';
import { Build } from '@mui/icons-material';
import { Warning } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
// Ajuste de ruta: el provider está dentro de src/providers, por lo que desde src/components basta un solo nivel ..
import { useThemeMode } from '../providers/ThemeModeProvider';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleMode, toggleReading, isReading } = useThemeMode();
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: t('menu.dashboard'), icon: <Dashboard />, path: '/dashboard' },
    { text: t('menu.usuarios'), icon: <People />, path: '/usuarios', adminOnly: true },
    { text: t('menu.salas'), icon: <MeetingRoom />, path: '/salas' },
    { text: t('menu.videoproyectores'), icon: <Videocam />, path: '/videoproyectores' },
    // Equipos visible para todos los roles; acciones se controlan dentro del componente
    { text: t('menu.equipos'), icon: <HandymanIcon />, path: '/equipos' },
    { text: t('menu.solicitudes'), icon: <Assignment />, path: '/solicitudes' },
    { text: t('menu.casosEspeciales'), icon: <Warning />, path: '/casos-especiales', adminOnly: true },
    { text: t('menu.reportes'), icon: <BarChart />, path: '/reportes', adminOnly: true },
  ];

  const filteredMenuItems = menuItems
    .filter(item => !item.adminOnly || user?.tipo_de_usuario === 'administrador')
    .filter(item => !(user?.tipo_de_usuario === 'estudiante' && item.path === '/salas'));

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  const getUserTypeColor = () => {
    switch (user?.tipo_de_usuario) {
      case 'administrador': return '#f44336'; // Rojo
      case 'profesor': return '#ff9800'; // Naranja
      case 'estudiante': return '#4caf50'; // Verde
      default: return '#757575'; // Gris
    }
  };

  const getUserTypeText = () => {
    switch (user?.tipo_de_usuario) {
      case 'administrador': return 'Admin';
      case 'profesor': return 'Profesor';
      case 'estudiante': return 'Estudiante';
      default: return 'Usuario';
    }
  };

  const drawer = (
    <div>
      {/* Header del drawer */}
      <Box sx={{
        p: 2,
        color: 'white',
        background: (theme) => `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.primary.dark, 0.95)} 100%)`,
        boxShadow: (theme) => `inset 0 -1px 0 ${alpha(theme.palette.common.black, 0.15)}`
      }}>
        <Box display="flex" alignItems="center" mb={1}>
          <School sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap>
            UniGuajira
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Recursos Audiovisuales
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.85 }}>
          Sede Maicao
        </Typography>
      </Box>

      <Divider />

      {/* Usuario info */}
      <Box sx={{
        p: 2,
        bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.03) : alpha('#000000', 0.03),
        borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}`
      }}>
        <Typography variant="subtitle2" noWrap>
          {user?.nombre} {user?.apellido}
        </Typography>
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            px: 1,
            py: 0.25,
            borderRadius: 1,
            bgcolor: getUserTypeColor(),
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'uppercase'
          }}
        >
          {getUserTypeText()}
        </Box>
      </Box>

      <Divider />

      {/* Menu items */}
      <List sx={{ px: 1 }}>
        {filteredMenuItems.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ my: 0.25 }}>
              <ListItemButton
                selected={selected}
                onClick={() => handleNavigation(item.path)}
                sx={(theme) => ({
                  mx: 0.5,
                  borderRadius: 2,
                  py: 1,
                  color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
                  bgcolor: selected ? alpha(theme.palette.primary.main, 0.22) : 'transparent',
                  transition: 'background-color .2s ease, transform .2s ease',
                  '&:hover': {
                    bgcolor: selected
                      ? alpha(theme.palette.primary.main, 0.30)
                      : alpha(theme.palette.primary.main, 0.10),
                    transform: 'translateY(-1px)'
                  },
                  '& .MuiListItemIcon-root': {
                    minWidth: 40,
                    color: selected ? theme.palette.primary.contrastText : theme.palette.text.secondary,
                  },
                  '& .MuiListItemIcon-root svg': {
                    padding: 0.5,
                    borderRadius: 1.5,
                    backgroundColor: selected
                      ? alpha(theme.palette.primary.main, 0.35)
                      : alpha(theme.palette.primary.main, 0.12),
                  },
                })}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: selected ? 700 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box display="flex" alignItems="center" flexGrow={1}>
            <School sx={{ mr: 1 }} />
            <Box>
              <Typography variant="h6" noWrap>
                {isMobile ? 'UniGuajira' : 'Universidad de La Guajira'}
              </Typography>
              {!isMobile && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {t('misc.sistemaRecursos')}
                </Typography>
              )}
            </Box>
          </Box>
            <IconButton
              color="inherit"
              aria-label="toggle language"
              onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')}
              sx={{ mr: 1 }}
            >
              <Box sx={{ fontSize: 12, fontWeight: 700 }}>{i18n.language === 'es' ? 'EN' : 'ES'}</Box>
            </IconButton>

          <Box display="flex" alignItems="center">
            <IconButton
              color="inherit"
              aria-label={mode === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              onClick={toggleMode}
              sx={{ mr: 1 }}
            >
              {mode === 'light' ? <DarkMode /> : <LightMode />}
            </IconButton>
            <IconButton
              color={isReading ? 'secondary' : 'inherit'}
              aria-label={isReading ? 'Desactivar modo lectura' : 'Activar modo lectura'}
              onClick={toggleReading}
              sx={{ mr: 1, border: isReading ? '2px solid currentColor' : 'none' }}
            >
              <ChromeReaderMode sx={{ fontSize: 22 }} />
            </IconButton>
            <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              {user?.nombre}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer para móvil */}
      {/* Drawer temporal en todos los tamaños para permitir ocultar/mostrar con el botón */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#111827' : '#ffffff',
            backgroundImage: (theme) => theme.palette.mode === 'dark'
              ? `linear-gradient(180deg, ${alpha('#111827', 1)} 0%, ${alpha('#0b1220', 1)} 100%)`
              : 'none',
            borderRight: (theme) => `1px solid ${alpha(theme.palette.divider, 0.9)}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Menu de perfil */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem disabled>
          <Box>
            <Typography variant="subtitle2">
              {user?.nombre} {user?.apellido}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.correo_electronico}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Cerrar Sesión
        </MenuItem>
      </Menu>
    </>
  );
};

export default Navbar;