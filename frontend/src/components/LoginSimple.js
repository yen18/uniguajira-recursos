import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  School,
  Email,
  Lock,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { usuariosService, handleApiError } from '../services/api';
import { useToast } from './ui/ToastProvider';
import DemoCredentialsModal from './DemoCredentialsModal';
import FormTextField from './ui/FormTextField';
import LoadingButton from './ui/LoadingButton';

// Componente Login versión respaldo (simple)
const LoginSimple = ({ onLogin }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    correo_electronico: '',
    pass: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ correo_electronico: '', pass: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const validate = () => {
    const nextErrors = { correo_electronico: '', pass: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.correo_electronico) {
      nextErrors.correo_electronico = 'Correo requerido';
    } else if (!emailRegex.test(formData.correo_electronico)) {
      nextErrors.correo_electronico = 'Formato de correo inválido';
    }
    if (!formData.pass) {
      nextErrors.pass = 'Contraseña requerida';
    } else if (formData.pass.length < 4) {
      nextErrors.pass = 'Mínimo 4 caracteres';
    }
    setFieldErrors(nextErrors);
    return !nextErrors.correo_electronico && !nextErrors.pass;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const response = await usuariosService.login(formData);
      if (response.data.success) {
        onLogin(response.data.data);
        setAttempts(0);
        showSuccess('Inicio de sesión exitoso');
      } else {
        const msg = response.data.message || 'Error en el login';
        setError(msg);
        setAttempts((a) => a + 1);
        showError(msg);
      }
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
      showError(apiError.message);
      setAttempts((a) => a + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{ bgcolor: 'primary.main', borderRadius: '50%', p: 2, mb: 2 }}>
            <School sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            UniGuajira
          </Typography>
          <Typography variant="h6" color="text.secondary" align="center" gutterBottom>
            Recursos Audiovisuales
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Sede Maicao
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormTextField
            margin="normal"
            required
            fullWidth
            id="correo_electronico"
            label="Correo Electrónico"
            name="correo_electronico"
            autoComplete="email"
            autoFocus
            value={formData.correo_electronico}
            onChange={handleChange}
            disabled={loading}
            error={Boolean(fieldErrors.correo_electronico)}
            helperText={fieldErrors.correo_electronico}
            aria-invalid={Boolean(fieldErrors.correo_electronico)}
            aria-describedby={fieldErrors.correo_electronico ? 'correo-error' : undefined}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
            FormHelperTextProps={{ id: 'correo-error' }}
            sx={{ mb: 2 }}
            icon={Email}
          />

          <FormTextField
            margin="normal"
            required
            fullWidth
            name="pass"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            id="pass"
            autoComplete="current-password"
            value={formData.pass}
            onChange={handleChange}
            disabled={loading}
            error={Boolean(fieldErrors.pass)}
            helperText={fieldErrors.pass}
            aria-invalid={Boolean(fieldErrors.pass)}
            aria-describedby={fieldErrors.pass ? 'pass-error' : undefined}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            FormHelperTextProps={{ id: 'pass-error' }}
            sx={{ mb: 3 }}
            icon={Lock}
          />

          <LoadingButton
            type="submit"
            fullWidth
            loading={loading}
            sx={{ py: 1.5, fontSize: '1.05rem', fontWeight: 600 }}
          >
            Iniciar Sesión
          </LoadingButton>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              ¿Necesitas usuarios demo?{' '}
              <Button size="small" variant="text" onClick={() => setShowDemo(true)}>
                Ver credenciales demo
              </Button>
            </Typography>
          </Box>
          {attempts > 0 && (
            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
              Intentos fallidos: {attempts}
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Sistema de gestión para recursos audiovisuales
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Universidad de La Guajira - Sede Maicao
          </Typography>
        </Box>

        <DemoCredentialsModal open={showDemo} onClose={() => setShowDemo(false)} />
      </Paper>
    </Container>
  );
};

export default LoginSimple;
