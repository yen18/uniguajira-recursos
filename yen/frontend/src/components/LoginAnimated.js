import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  keyframes
} from '@mui/material';
import {
  School,
  Email,
  Lock,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { usuariosService, handleApiError } from '../services/api';

// Animaciones CSS-in-JS
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
  100% { transform: translateY(0px) rotate(360deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    correo_electronico: '',
    pass: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await usuariosService.login(formData);
      
      if (response.data.success) {
        onLogin(response.data.data);
      } else {
        setError(response.data.message || 'Error en el login');
      }
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 20% 30%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(255, 193, 7, 0.2) 0%, transparent 50%),
          linear-gradient(135deg, #667eea 0%, #764ba2 100%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Círculos animados de fondo */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2))',
          animation: `${float} 6s ease-in-out infinite`,
          border: '2px solid rgba(255,255,255,0.1)'
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2))',
          animation: `${pulse} 4s ease-in-out infinite`,
          border: '2px solid rgba(255,255,255,0.2)'
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2))',
          animation: `${rotate} 8s linear infinite`,
          border: '2px solid rgba(255,255,255,0.15)'
        }}
      />

      {/* Círculo principal del formulario */}
      <Box
        sx={{
          position: 'relative',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: `${fadeIn} 1s ease-out, ${pulse} 8s ease-in-out infinite`,
          boxShadow: `
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 0 0 1px rgba(255, 255, 255, 0.1)
          `
        }}
      >
        {/* Anillo exterior giratorio */}
        <Box
          sx={{
            position: 'absolute',
            width: '470px',
            height: '470px',
            borderRadius: '50%',
            border: '3px solid transparent',
            background: `
              linear-gradient(45deg, transparent, rgba(255,255,255,0.4), transparent),
              linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1))
            `,
            backgroundClip: 'padding-box, border-box',
            animation: `${rotate} 10s linear infinite`,
            zIndex: -1
          }}
        />

        {/* Anillo medio */}
        <Box
          sx={{
            position: 'absolute',
            width: '490px',
            height: '490px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.1)',
            animation: `${rotate} 15s linear infinite reverse`,
            zIndex: -2
          }}
        />

        {/* Contenedor del formulario */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: '320px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            animation: `${fadeIn} 1.2s ease-out`
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                mb: 2,
                animation: `${pulse} 3s ease-in-out infinite`
              }}
            >
              <School sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Login
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Sistema de Recursos Audiovisuales
            </Typography>
          </Box>

          {/* Formulario */}
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  borderRadius: '12px',
                  background: 'rgba(244, 67, 54, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Username"
              name="correo_electronico"
              value={formData.correo_electronico}
              onChange={handleChange}
              required
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '15px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="pass"
              type={showPassword ? 'text' : 'password'}
              value={formData.pass}
              onChange={handleChange}
              required
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '15px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.6)',
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                },
                '&:disabled': {
                  background: 'rgba(102, 126, 234, 0.5)',
                  transform: 'none'
                }
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                  Iniciando sesión...
                </Box>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Enlaces adicionales */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: '#667eea'
                  }
                }}
              >
                Forget Password
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;