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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  useTheme
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  AdminPanelSettings,
  School,
  Group,
  Refresh
} from '@mui/icons-material';
import { usuariosService, handleApiError } from '../services/api';

const Usuarios = ({ user }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo_electronico: '',
    pass: '',
    tipo_de_usuario: 'estudiante'
  });
  const [submitting, setSubmitting] = useState(false);

  const theme = useTheme();

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await usuariosService.getAll();
      setUsuarios(response.data.data);
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (usuario = null) => {
    if (usuario) {
      setEditingUser(usuario);
      setFormData({
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo_electronico: usuario.correo_electronico,
        pass: '', // No mostrar contraseña
        tipo_de_usuario: usuario.tipo_de_usuario
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        apellido: '',
        correo_electronico: '',
        pass: '',
        tipo_de_usuario: 'estudiante'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      nombre: '',
      apellido: '',
      correo_electronico: '',
      pass: '',
      tipo_de_usuario: 'estudiante'
    });
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
      if (editingUser) {
        // Actualizar usuario (sin contraseña si está vacía)
        const updateData = { ...formData };
        if (!updateData.pass) {
          delete updateData.pass; // No enviar contraseña vacía
        }
        
        await usuariosService.update(editingUser.id_usuario, updateData);
      } else {
        // Crear usuario
        await usuariosService.create(formData);
      }
      
      handleCloseDialog();
      loadUsuarios();
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await usuariosService.delete(id);
        loadUsuarios();
      } catch (error) {
        const apiError = handleApiError(error);
        setError(apiError.message);
      }
    }
  };

  const getUserIcon = (tipoUsuario) => {
    switch (tipoUsuario) {
      case 'administrador':
        return <AdminPanelSettings />;
      case 'profesor':
        return <School />;
      case 'estudiante':
        return <Person />;
      default:
        return <Group />;
    }
  };

  const getUserColor = (tipoUsuario) => {
    switch (tipoUsuario) {
      case 'administrador':
        return theme.palette.error.main;
      case 'profesor':
        return theme.palette.warning.main;
      case 'estudiante':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Verificar permisos
  if (user.tipo_de_usuario !== 'administrador') {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">
          No tienes permisos para acceder a esta sección.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 'bold' }}>
            <Group color="primary" /> Usuarios
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Gestionar usuarios del sistema
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Lista de usuarios */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Lista de Usuarios ({usuarios.length})
            </Typography>
            <IconButton onClick={loadUsuarios}>
              <Refresh />
            </IconButton>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : usuarios.length === 0 ? (
            <Alert severity="info">
              No hay usuarios registrados
            </Alert>
          ) : (
            <List>
              {usuarios.map((usuario, index) => (
                <React.Fragment key={usuario.id_usuario}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getUserColor(usuario.tipo_de_usuario) }}>
                        {getUserIcon(usuario.tipo_de_usuario)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="subtitle1">
                            {usuario.nombre} {usuario.apellido}
                          </Typography>
                          <Chip
                            size="small"
                            label={usuario.tipo_de_usuario}
                            color={
                              usuario.tipo_de_usuario === 'administrador' ? 'error' :
                              usuario.tipo_de_usuario === 'profesor' ? 'warning' : 'success'
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            📧 {usuario.correo_electronico}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {usuario.id_usuario}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleOpenDialog(usuario)}
                        sx={{ mr: 1 }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDelete(usuario.id_usuario)}
                        color="error"
                        disabled={usuario.id_usuario === user.id_usuario} // No puede eliminarse a sí mismo
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < usuarios.length - 1 && <Box sx={{ borderBottom: 1, borderColor: 'divider', mx: 2 }} />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* FAB para móvil */}
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

      {/* Dialog para crear/editar usuario */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingUser ? <><Edit color="primary" /> Editar Usuario</> : <><Add color="primary" /> Nuevo Usuario</>}
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              autoFocus
              margin="dense"
              name="nombre"
              label="Nombre"
              type="text"
              fullWidth
              required
              value={formData.nombre}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="apellido"
              label="Apellido"
              type="text"
              fullWidth
              required
              value={formData.apellido}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="correo_electronico"
              label="Correo Electrónico"
              type="email"
              fullWidth
              required
              value={formData.correo_electronico}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="pass"
              label={editingUser ? "Nueva Contraseña (dejar vacío para mantener)" : "Contraseña"}
              type="password"
              fullWidth
              required={!editingUser}
              value={formData.pass}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo de Usuario</InputLabel>
              <Select
                name="tipo_de_usuario"
                value={formData.tipo_de_usuario}
                onChange={handleChange}
                label="Tipo de Usuario"
              >
                <MenuItem value="estudiante">Estudiante</MenuItem>
                <MenuItem value="profesor">Profesor</MenuItem>
                <MenuItem value="administrador">Administrador</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
            >
              {submitting ? (
                <CircularProgress size={20} />
              ) : (
                editingUser ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Usuarios;