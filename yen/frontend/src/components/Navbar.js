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
  School
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Usuarios', icon: <People />, path: '/usuarios', adminOnly: true },
    { text: 'Salas', icon: <MeetingRoom />, path: '/salas' },
    { text: 'Videoproyectores', icon: <Videocam />, path: '/videoproyectores' },
    { text: 'Solicitudes', icon: <Assignment />, path: '/solicitudes' },
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
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center" mb={1}>
          <School sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap>
            UniGuajira
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Recursos Audiovisuales
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Sede Maicao
        </Typography>
      </Box>

      <Divider />

      {/* Usuario info */}
      <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
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
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
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
                  Sistema de Recursos Audiovisuales - Sede Maicao
                </Typography>
              )}
            </Box>
          </Box>

          <Box display="flex" alignItems="center">
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