import React, { useState } from 'react';
import { Box, TextField, Button, Alert, CircularProgress, InputAdornment, IconButton, Typography, Paper } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { usuariosService, handleApiError } from '../services/api';

/*
  LoginOndas: adaptación React del diseño "login_ondas_real.html".
  Mantiene cuatro anillos con conic-gradient rotando en distintos tiempos.
  Se procura mantener rendimiento evitando sombras excesivas en móviles.
*/

const ringBase = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transformOrigin: 'center',
  borderRadius: '50%',
  pointerEvents: 'none'
};

const LoginOndas = ({ onLogin }) => {
  const [formData, setFormData] = useState({ correo_electronico: '', pass: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        setError(response.data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      fontFamily: 'Poppins, sans-serif'
    }}>
      {/* Contenedor de ondas */}
      <Box sx={{ position: 'absolute', width: 600, height: 600, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }}>
        <Box sx={{ ...ringBase, width: 500, height: 500, margin: '-250px 0 0 -250px', background: 'conic-gradient(from 0deg,#F7931E 0deg 60deg, transparent 60deg 120deg,#F7931E 120deg 180deg, transparent 180deg 240deg,#F7931E 240deg 300deg, transparent 300deg 360deg)', animation: 'rotateWave1 8s linear infinite', filter: 'blur(1px) drop-shadow(0 0 16px #F7931E)' }} />
        <Box sx={{ ...ringBase, width: 400, height: 400, margin: '-200px 0 0 -200px', background: 'conic-gradient(from 45deg, transparent 0deg 80deg,#00AEEF 80deg 140deg, transparent 140deg 200deg,#00AEEF 200deg 260deg, transparent 260deg 320deg,#00AEEF 320deg 360deg)', animation: 'rotateWave2 6s linear infinite reverse', filter: 'blur(1px) drop-shadow(0 0 14px #00AEEF)' }} />
        <Box sx={{ ...ringBase, width: 300, height: 300, margin: '-150px 0 0 -150px', background: 'conic-gradient(from 90deg,#FFC20E 0deg 50deg, transparent 50deg 100deg,#FFC20E 100deg 150deg, transparent 150deg 200deg,#FFC20E 200deg 250deg, transparent 250deg 300deg,#FFC20E 300deg 360deg)', animation: 'rotateWave3 10s linear infinite', filter: 'blur(1px) drop-shadow(0 0 12px #FFC20E)' }} />
        <Box sx={{ ...ringBase, width: 200, height: 200, margin: '-100px 0 0 -100px', background: 'conic-gradient(from 180deg, transparent 0deg 60deg,#EF4136 60deg 120deg, transparent 120deg 180deg,#EF4136 180deg 240deg, transparent 240deg 300deg,#EF4136 300deg 360deg)', animation: 'rotateWave4 4s linear infinite reverse', filter: 'blur(1px) drop-shadow(0 0 10px #EF4136)' }} />
      </Box>

      {/* Keyframes globales en un estilo inline */}
      <style>{`
        @keyframes rotateWave1 { 0% {transform:rotate(0deg);} 100% {transform:rotate(360deg);} }
        @keyframes rotateWave2 { 0% {transform:rotate(0deg);} 100% {transform:rotate(360deg);} }
        @keyframes rotateWave3 { 0% {transform:rotate(0deg);} 100% {transform:rotate(360deg);} }
        @keyframes rotateWave4 { 0% {transform:rotate(0deg);} 100% {transform:rotate(360deg);} }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(30px);} to { opacity:1; transform:translateY(0);} }
      `}</style>

      {/* Formulario */}
      <Paper elevation={6} sx={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(25,25,40,0.92)',
        backdropFilter: 'blur(18px)',
        p: 5,
        borderRadius: 5,
        width: 400,
        border: '2px solid rgba(247,147,30,0.3)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.55), 0 0 50px rgba(247,147,30,0.15)',
        animation: 'fadeInUp 0.9s ease-out'
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ width: 80, height: 80, mb: 2, mx: 'auto', background: 'linear-gradient(135deg,#F7931E,#FFC20E)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 700, color: '#1a1a2e', border: '3px solid rgba(247,147,30,0.4)', boxShadow: '0 0 25px rgba(247,147,30,0.45)' }}>
            U
          </Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>Bienvenido</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>Sistema de Recursos Audiovisuales</Typography>
        </Box>
        <Box component="form" onSubmit={handleSubmit}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Correo electrónico o usuario"
            name="correo_electronico"
            value={formData.correo_electronico}
            onChange={handleChange}
            required
            sx={{ mb: 3 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: '#F7931E' }} /></InputAdornment> }}
          />
          <TextField
            fullWidth
            label="Contraseña"
            name="pass"
            type={showPassword ? 'text' : 'password'}
            value={formData.pass}
            onChange={handleChange}
            required
            sx={{ mb: 4 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#F7931E' }} /></InputAdornment>,
              endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff/> : <Visibility/>}</IconButton></InputAdornment>
            }}
          />
          <Button type="submit" fullWidth disabled={loading} sx={{
            py: 1.9,
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 3,
            background: 'linear-gradient(135deg,#F7931E 0%, #00AEEF 50%, #FFC20E 100%)',
            color: '#fff',
            textTransform: 'none',
            boxShadow: '0 6px 22px rgba(0,0,0,0.35)',
            '&:hover': { background: 'linear-gradient(135deg,#F7931E 0%, #00AEEF 40%, #FFC20E 100%)' }
          }}>
            {loading ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={20} sx={{ color: '#fff' }} /> Iniciando...</Box> : 'Iniciar Sesión'}
          </Button>
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>Universidad de La Guajira • Sede Maicao</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginOndas;
