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
import logoUni from '../assets/logouni.png';
import { usuariosService, handleApiError } from '../services/api';

// Animaciones de círculos que se cruzan en ondas - Efecto BrasilCode
const orbitLine1 = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const orbitLine2 = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const orbitLine3 = keyframes`
  0% {
    transform: rotate(360deg);
  }
  100% {
    transform: rotate(0deg);
  }
`;

const fadeInScale = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(247, 147, 30, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(247, 147, 30, 0.8);
  }
`;

const pulseCircle = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(247, 147, 30, 0.6);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 35px rgba(247, 147, 30, 1);
  }
`;

// Nuevas animaciones para círculos luminosos con cambio de colores
const colorCycle1 = keyframes`
  0% {
    border-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.3);
  }
  25% {
    border-color: #F7931E;
    box-shadow: 0 0 40px rgba(247, 147, 30, 0.9), inset 0 0 25px rgba(247, 147, 30, 0.4);
  }
  50% {
    border-color: #00AEEF;
    box-shadow: 0 0 35px rgba(0, 174, 239, 0.8), inset 0 0 20px rgba(0, 174, 239, 0.3);
  }
  75% {
    border-color: #FFC20E;
    box-shadow: 0 0 45px rgba(255, 194, 14, 1), inset 0 0 30px rgba(255, 194, 14, 0.5);
  }
  100% {
    border-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.3);
  }
`;

const colorCycle2 = keyframes`
  0% {
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 25px rgba(255, 255, 255, 0.7), inset 0 0 15px rgba(255, 255, 255, 0.2);
  }
  25% {
    border-color: #EF4136;
    box-shadow: 0 0 35px rgba(239, 65, 54, 0.8), inset 0 0 20px rgba(239, 65, 54, 0.3);
  }
  50% {
    border-color: #FFC20E;
    box-shadow: 0 0 40px rgba(255, 194, 14, 0.9), inset 0 0 25px rgba(255, 194, 14, 0.4);
  }
  75% {
    border-color: #00AEEF;
    box-shadow: 0 0 30px rgba(0, 174, 239, 0.7), inset 0 0 18px rgba(0, 174, 239, 0.2);
  }
  100% {
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 25px rgba(255, 255, 255, 0.7), inset 0 0 15px rgba(255, 255, 255, 0.2);
  }
`;

const colorCycle3 = keyframes`
  0% {
    border-color: rgba(255, 255, 255, 0.7);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), inset 0 0 12px rgba(255, 255, 255, 0.15);
  }
  33% {
    border-color: #F7931E;
    box-shadow: 0 0 30px rgba(247, 147, 30, 0.8), inset 0 0 18px rgba(247, 147, 30, 0.3);
  }
  66% {
    border-color: #EF4136;
    box-shadow: 0 0 25px rgba(239, 65, 54, 0.7), inset 0 0 15px rgba(239, 65, 54, 0.2);
  }
  100% {
    border-color: rgba(255, 255, 255, 0.7);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), inset 0 0 12px rgba(255, 255, 255, 0.15);
  }
`;

const colorCycle4 = keyframes`
  0% {
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 18px rgba(255, 255, 255, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.1);
  }
  40% {
    border-color: #00AEEF;
    box-shadow: 0 0 28px rgba(0, 174, 239, 0.7), inset 0 0 16px rgba(0, 174, 239, 0.25);
  }
  80% {
    border-color: #FFC20E;
    box-shadow: 0 0 32px rgba(255, 194, 14, 0.8), inset 0 0 20px rgba(255, 194, 14, 0.3);
  }
  100% {
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 18px rgba(255, 255, 255, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.1);
  }
`;

// Animaciones para el efecto cometa espectacular
const cometSpectacularFlight = keyframes`
  0% {
    transform: translate(-300px, -200px) scale(0.5);
    opacity: 0;
  }
  3% {
    opacity: 1;
    transform: translate(-200px, -150px) scale(1);
  }
  
  /* Vuelo espectacular súper rápido por toda la pantalla */
  8% { transform: translate(200px, -180px) scale(1.2); }
  12% { transform: translate(400px, -100px) scale(1.5); }
  16% { transform: translate(350px, 50px) scale(1.3); }
  20% { transform: translate(100px, 120px) scale(1.1); }
  24% { transform: translate(-150px, 80px) scale(1.4); }
  28% { transform: translate(-300px, -50px) scale(1.2); }
  32% { transform: translate(-200px, -150px) scale(1.3); }
  36% { transform: translate(150px, -200px) scale(1.6); }
  40% { transform: translate(300px, -100px) scale(1.2); }
  44% { transform: translate(250px, 100px) scale(1.1); }
  48% { transform: translate(-50px, 150px) scale(1.3); }
  52% { transform: translate(-250px, 50px) scale(1.4); }
  
  /* Transición a escritura elegante */
  56% { transform: translate(-180px, -80px) scale(1); }
  60% { transform: translate(-160px, -60px) scale(1); }
  
  /* Escribiendo "Bienvenido" de forma elegante y natural */
  /* B */
  62% { transform: translate(-140px, -60px) scale(1); }
  64% { transform: translate(-140px, -20px) scale(1); }
  66% { transform: translate(-140px, 20px) scale(1); }
  67% { transform: translate(-125px, 0px) scale(1); }
  68% { transform: translate(-125px, 20px) scale(1); }
  
  /* i */
  69% { transform: translate(-115px, -60px) scale(1); }
  70% { transform: translate(-115px, 20px) scale(1); }
  
  /* e */
  71% { transform: translate(-105px, 0px) scale(1); }
  72% { transform: translate(-95px, -10px) scale(1); }
  73% { transform: translate(-95px, 10px) scale(1); }
  74% { transform: translate(-105px, 20px) scale(1); }
  
  /* n */
  75% { transform: translate(-85px, 20px) scale(1); }
  76% { transform: translate(-85px, -20px) scale(1); }
  77% { transform: translate(-75px, 0px) scale(1); }
  78% { transform: translate(-65px, 20px) scale(1); }
  
  /* v */
  79% { transform: translate(-55px, -20px) scale(1); }
  80% { transform: translate(-45px, 10px) scale(1); }
  81% { transform: translate(-35px, -20px) scale(1); }
  
  /* e */
  82% { transform: translate(-25px, 0px) scale(1); }
  83% { transform: translate(-15px, -10px) scale(1); }
  84% { transform: translate(-15px, 10px) scale(1); }
  85% { transform: translate(-25px, 20px) scale(1); }
  
  /* n */
  86% { transform: translate(-5px, 20px) scale(1); }
  87% { transform: translate(-5px, -20px) scale(1); }
  88% { transform: translate(5px, 0px) scale(1); }
  89% { transform: translate(15px, 20px) scale(1); }
  
  /* i */
  90% { transform: translate(25px, -60px) scale(1); }
  91% { transform: translate(25px, 20px) scale(1); }
  
  /* d */
  92% { transform: translate(35px, 0px) scale(1); }
  93% { transform: translate(45px, -10px) scale(1); }
  94% { transform: translate(45px, 10px) scale(1); }
  95% { transform: translate(35px, 20px) scale(1); }
  96% { transform: translate(45px, -60px) scale(1); }
  97% { transform: translate(45px, 20px) scale(1); }
  
  /* o */
  98% { transform: translate(55px, 0px) scale(1); }
  99% { transform: translate(65px, -10px) scale(1); }
  100% { 
    transform: translate(75px, 0px) scale(1);
    opacity: 0;
  }
`;

const letterAppearElegant = keyframes`
  0% { 
    opacity: 0; 
    transform: scale(0.8) translateY(10px);
    filter: blur(2px);
  }
  100% { 
    opacity: 1; 
    transform: scale(1) translateY(0);
    filter: blur(0px);
    text-shadow: 0 0 15px rgba(247, 147, 30, 0.5);
  }
`;

const finalGlow = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const sparkleTrail = keyframes`
  0% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
  100% {
    opacity: 0;
    transform: scale(0) rotate(360deg);
  }
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
        background: 'linear-gradient(135deg, #F7931E 0%, #FFC20E 50%, #FF8C00 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* 3 Círculos ondulados giratorios - Efecto exacto BrasilCode */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      >
        {/* Anillos animados más grandes */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '650px',
            height: '650px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 20,
            pointerEvents: 'none'
          }}
        >
          {/* Anillo 1 - Efecto luminoso con cambio de colores */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              border: '4px solid rgba(255, 255, 255, 0.9)',
              borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%',
              animation: `${orbitLine1} 6s linear infinite, ${colorCycle1} 8s ease-in-out infinite`,
              transition: '0.3s',
              opacity: 0.9,
              filter: 'blur(0.5px)',
              '&:hover': {
                transform: 'scale(1.02)',
                filter: 'blur(0px)'
              }
            }}
          />
          
          {/* Anillo 2 - Efecto luminoso con cambio de colores */}
          <Box
            sx={{
              position: 'absolute',
              inset: '25px',
              border: '4px solid rgba(255, 255, 255, 0.8)',
              borderRadius: '41% 44% 56% 59% / 38% 62% 63% 37%',
              animation: `${orbitLine2} 4s linear infinite, ${colorCycle2} 6s ease-in-out infinite 1s`,
              transition: '0.3s',
              opacity: 0.8,
              filter: 'blur(0.5px)',
              '&:hover': {
                transform: 'scale(1.03)',
                filter: 'blur(0px)'
              }
            }}
          />
          
          {/* Anillo 3 - Efecto luminoso con cambio de colores */}
          <Box
            sx={{
              position: 'absolute',
              inset: '55px',
              border: '3px solid rgba(255, 255, 255, 0.7)',
              borderRadius: '41% 44% 56% 59% / 38% 62% 63% 37%',
              animation: `${orbitLine3} 10s linear infinite reverse, ${colorCycle3} 7s ease-in-out infinite 2s`,
              transition: '0.3s',
              opacity: 0.7,
              filter: 'blur(0.3px)',
              '&:hover': {
                transform: 'scale(1.04)',
                filter: 'blur(0px)'
              }
            }}
          />
          
          {/* Anillo 4 - Efecto luminoso con cambio de colores */}
          <Box
            sx={{
              position: 'absolute',
              inset: '85px',
              border: '3px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '63% 37% 41% 44% / 56% 59% 38% 62%',
              animation: `${orbitLine2} 8s linear infinite, ${colorCycle4} 9s ease-in-out infinite 3s`,
              transition: '0.3s',
              opacity: 0.6,
              filter: 'blur(0.3px)',
              '&:hover': {
                transform: 'scale(1.05)',
                filter: 'blur(0px)'
              }
            }}
          />
        </Box>
      </Box>

      {/* Partículas flotantes de fondo */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent)',
          animation: `${fadeInScale} 8s ease-in-out infinite`,
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          top: '70%',
          right: '15%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15), transparent)',
          animation: `${fadeInScale} 8s ease-in-out infinite 3s`,
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: '30%',
          left: '20%',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent)',
          animation: `${fadeInScale} 8s ease-in-out infinite 6s`,
        }}
      />

      {/* Contenedor principal del formulario */}
      <Paper
        elevation={3}
        sx={{
          p: 6,
          width: '420px',
          background: 'rgba(255, 255, 255, 1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '2px solid rgba(247, 147, 30, 0.3)',
          boxShadow: `
            0 25px 50px rgba(0, 0, 0, 0.1),
            0 0 50px rgba(247, 147, 30, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.8)
          `,
          animation: `${fadeInScale} 0.8s ease-out, ${glowPulse} 4s ease-in-out infinite`,
          position: 'relative',
          zIndex: 5,
          fontFamily: 'inherit'
        }}
      >
        {/* Header minimalista */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '140px',
              height: '140px',
              borderRadius: '20px',
              background: 'white',
              mb: 3,
              animation: `${pulseCircle} 3s ease-in-out infinite`,
              position: 'relative',
              border: '3px solid rgba(247, 147, 30, 0.3)',
              boxShadow: '0 15px 35px rgba(247, 147, 30, 0.2)',
              overflow: 'hidden'
            }}
          >
            {/* Logo Universidad de La Guajira - Imagen oficial */}
            <img 
              src={logoUni}
              alt="Universidad de La Guajira"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}
              onError={(e) => {
                console.log('Error cargando logo:', e);
                e.target.style.display = 'none';
              }}
            />
          </Box>
          
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              fontFamily: '"Poppins", sans-serif',
              color: '#1a202c',
              mb: 1,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}
          >
            Bienvenido
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{
              color: '#4a5568',
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 500
            }}
          >
            Universidad de La Guajira - Recursos Audiovisuales
          </Typography>
        </Box>

        {/* Formulario */}
        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: '16px',
                background: 'rgba(239, 65, 54, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(239, 65, 54, 0.3)',
                color: '#2d3748',
                fontFamily: '"Poppins", sans-serif',
                '& .MuiAlert-icon': {
                  color: '#EF4136'
                }
              }}
            >
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Correo Electrónico o Usuario"
            name="correo_electronico"
            value={formData.correo_electronico}
            onChange={handleChange}
            required
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                background: 'rgba(248, 250, 252, 1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                border: '2px solid rgba(247, 147, 30, 0.2)',
                fontFamily: '"Poppins", sans-serif',
                '&:hover': {
                  background: 'rgba(245, 247, 250, 1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 25px rgba(247, 147, 30, 0.15)',
                  border: '2px solid rgba(247, 147, 30, 0.4)'
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 25px rgba(247, 147, 30, 0.25)',
                  border: '2px solid #F7931E'
                },
                '& fieldset': {
                  border: 'none'
                },
                '& input': {
                  color: '#1a202c'
                }
              },
              '& .MuiInputLabel-root': {
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 500,
                color: '#4a5568',
                '&.Mui-focused': {
                  color: '#F7931E'
                }
              },
              '& .MuiInputBase-input': {
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 500,
                padding: '16px 14px',
                color: '#1a202c'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: '#F7931E', fontSize: '20px' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Contraseña"
            name="pass"
            type={showPassword ? 'text' : 'password'}
            value={formData.pass}
            onChange={handleChange}
            required
            sx={{
              mb: 4,
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                background: 'rgba(248, 250, 252, 1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                border: '2px solid rgba(247, 147, 30, 0.2)',
                fontFamily: '"Poppins", sans-serif',
                '&:hover': {
                  background: 'rgba(245, 247, 250, 1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 25px rgba(247, 147, 30, 0.15)',
                  border: '2px solid rgba(247, 147, 30, 0.4)'
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 25px rgba(247, 147, 30, 0.25)',
                  border: '2px solid #F7931E'
                },
                '& fieldset': {
                  border: 'none'
                },
                '& input': {
                  color: '#1a202c'
                }
              },
              '& .MuiInputLabel-root': {
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 500,
                color: '#4a5568',
                '&.Mui-focused': {
                  color: '#F7931E'
                }
              },
              '& .MuiInputBase-input': {
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 500,
                padding: '16px 14px',
                color: '#1a202c'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#F7931E', fontSize: '20px' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: '#4a5568' }}
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
              py: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #F7931E 0%, #FFC20E 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'none',
              fontFamily: '"Poppins", sans-serif',
              letterSpacing: '0.02em',
              boxShadow: '0 15px 35px rgba(247, 147, 30, 0.4)',
              transition: 'all 0.3s ease',
              border: '2px solid rgba(247, 147, 30, 0.3)',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 20px 40px rgba(247, 147, 30, 0.6)',
                background: 'linear-gradient(135deg, #E8831B 0%, #E6B800 100%)',
                border: '2px solid rgba(247, 147, 30, 0.5)'
              },
              '&:active': {
                transform: 'translateY(-1px)',
                boxShadow: '0 12px 25px rgba(247, 147, 30, 0.5)'
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, rgba(247, 147, 30, 0.3) 0%, rgba(255, 194, 14, 0.3) 100%)',
                transform: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                border: '2px solid rgba(247, 147, 30, 0.2)'
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} sx={{ color: 'white' }} />
                <Typography sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, color: 'white' }}>
                  Iniciando sesión...
                </Typography>
              </Box>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>

          {/* Forgot Password */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#4a5568',
                cursor: 'pointer',
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 500,
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#F7931E'
                }
              }}
            >
              ¿Olvidaste tu contraseña?
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;