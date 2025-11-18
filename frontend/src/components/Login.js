/* Archivo deshabilitado: contenido legado comentado para evitar errores de parseo.
// Si necesitas los aros multicolor crea LoginAros.js y cámbialo en App.js.
import LoginWaves from './LoginWaves';
export default LoginWaves;
/* eslint-disable */
const __legacy_neutralized = `
/*
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
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
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </Box>

          {/* Información adicional */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Sistema de gestión para recursos audiovisuales
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Universidad de La Guajira - Sede Maicao
            </Typography>
          </Box>

          {/* Usuarios de prueba */}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, width: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>
              👨‍🎓 Usuarios de prueba:
            </Typography>
            <Typography variant="caption" display="block">
              <strong>Estudiante:</strong> yenerf18@gmail.com / 1
            </Typography>
            <Typography variant="caption" display="block">
              <strong>Profesor:</strong> vv / 2
            </Typography>
            <Typography variant="caption" display="block">
              <strong>Admin:</strong> hh / 3
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  };

  export default Login;
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
        background: 'linear-gradient(180deg, #f5f5f5 0%, #e3f2fd 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* 3 Círculos ondulados giratorios - Efecto visual (desactivado en modo minimal) */}
      {MINIMAL_LOGIN ? null : (
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
      )}

      {/* Partículas flotantes de fondo (desactivadas en modo minimal) */}
      {MINIMAL_LOGIN ? null : (
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
      )}
      {MINIMAL_LOGIN ? null : (
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
      )}
      {MINIMAL_LOGIN ? null : (
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
      )}

      {/* Contenedor principal del formulario */}
      <Paper
        elevation={3}
        sx={{
          p: 6,
          width: '420px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          animation: 'none',
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
              animation: 'none',
              position: 'relative',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
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

*/
import LoginWaves from './LoginWaves';
export default LoginWaves;