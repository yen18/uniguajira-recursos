import React, { useState } from 'react';
import { Box, TextField, Button, Alert, CircularProgress, InputAdornment, IconButton, Typography } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { usuariosService, handleApiError } from '../services/api';

/* LoginRings: adaptación React del diseño con 4 anillos (ondas) rotando y variando dashoffset.
   Basado en login_brasilcode.html y login_animated.html conceptos (SVG circles). */

const LoginRings = ({ onLogin }) => {
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
      const resp = await usuariosService.login(formData);
      if (resp.data.success) {
        onLogin(resp.data.data);
      } else {
        setError(resp.data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      position:'relative',
      overflow:'hidden',
      background:'linear-gradient(135deg,#231F20 0%, #2d3748 50%, #1a202c 100%)',
      fontFamily:'Poppins, sans-serif'
    }}>
      <style>{`
        @keyframes ringRotate1 {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
        @keyframes ringRotate2 {0%{transform:rotate(0deg);}100%{transform:rotate(-360deg);}}
        @keyframes ringRotate3 {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
        @keyframes ringRotate4 {0%{transform:rotate(0deg);}100%{transform:rotate(-360deg);}}
        @keyframes breathe {0%,100%{transform:scale(1);opacity:.9;}50%{transform:scale(1.04);opacity:1;}}
        @keyframes glowPulse {0%,100%{box-shadow:0 0 18px rgba(247,147,30,.4);}50%{box-shadow:0 0 28px rgba(247,147,30,.85);}}
      `}</style>

      {/* Contenedor anillos */}
      <Box sx={{ position:'absolute', width:500, height:500, top:'50%', left:'50%', transform:'translate(-50%, -50%)', zIndex:3, animation:'breathe 7s ease-in-out infinite' }}>
        {/* Ring 1 */}
        <Box sx={{ position:'absolute', inset:0, animation:'ringRotate1 8s linear infinite' }}>
          <svg viewBox='0 0 100 100'>
            <circle cx='50' cy='50' r='48' stroke='#F7931E' strokeWidth='3' strokeDasharray='80 120' strokeDashoffset='0' fill='none' />
          </svg>
        </Box>
        {/* Ring 2 */}
        <Box sx={{ position:'absolute', inset:0, animation:'ringRotate2 12s linear infinite' }}>
          <svg viewBox='0 0 100 100'>
            <circle cx='50' cy='50' r='38' stroke='#00AEEF' strokeWidth='3' strokeDasharray='60 90' strokeDashoffset='0' fill='none' />
          </svg>
        </Box>
        {/* Ring 3 */}
        <Box sx={{ position:'absolute', inset:0, animation:'ringRotate3 15s linear infinite' }}>
          <svg viewBox='0 0 100 100'>
            <circle cx='50' cy='50' r='28' stroke='#FFC20E' strokeWidth='3' strokeDasharray='40 60' strokeDashoffset='0' fill='none' />
          </svg>
        </Box>
        {/* Ring 4 */}
        <Box sx={{ position:'absolute', inset:0, animation:'ringRotate4 5s linear infinite' }}>
          <svg viewBox='0 0 100 100'>
            <circle cx='50' cy='50' r='18' stroke='#EF4136' strokeWidth='3' strokeDasharray='20 30' strokeDashoffset='0' fill='none' />
          </svg>
        </Box>
      </Box>

      {/* Tarjeta login */}
      <Box sx={{
        width:400,
        p:5,
        borderRadius:5,
        backdropFilter:'blur(18px)',
        background:'rgba(35,31,32,0.92)',
        border:'2px solid rgba(247,147,30,0.35)',
        boxShadow:'0 25px 50px rgba(0,0,0,0.6), 0 0 40px rgba(247,147,30,0.18)',
        position:'relative',
        zIndex:10,
        animation:'glowPulse 4s ease-in-out infinite'
      }}>
        <Box sx={{ textAlign:'center', mb:4 }}>
          <Box sx={{ width:80, height:80, mx:'auto', mb:2, background:'linear-gradient(135deg,#F7931E,#FFC20E)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, fontWeight:700, color:'#1a1a2e', border:'3px solid rgba(247,147,30,0.55)', boxShadow:'0 0 25px rgba(247,147,30,0.55)' }}>U</Box>
          <Typography variant='h5' sx={{ color:'#fff', fontWeight:700, mb:.5 }}>Bienvenido</Typography>
          <Typography variant='body2' sx={{ color:'rgba(255,255,255,0.65)' }}>Sistema de Recursos Audiovisuales</Typography>
        </Box>
        <Box component='form' onSubmit={handleSubmit}>
          {error && <Alert severity='error' sx={{ mb:3 }}>{error}</Alert>}
          <TextField
            fullWidth
            label='Correo electrónico o usuario'
            name='correo_electronico'
            value={formData.correo_electronico}
            onChange={handleChange}
            required
            sx={{ mb:3 }}
            InputProps={{ startAdornment:<InputAdornment position='start'><Email sx={{ color:'#F7931E' }} /></InputAdornment> }}
          />
          <TextField
            fullWidth
            label='Contraseña'
            name='pass'
            type={showPassword?'text':'password'}
            value={formData.pass}
            onChange={handleChange}
            required
            sx={{ mb:4 }}
            InputProps={{
              startAdornment:<InputAdornment position='start'><Lock sx={{ color:'#F7931E' }} /></InputAdornment>,
              endAdornment:<InputAdornment position='end'><IconButton onClick={()=>setShowPassword(!showPassword)} edge='end'>{showPassword?<VisibilityOff/>:<Visibility/>}</IconButton></InputAdornment>
            }}
          />
          <Button type='submit' fullWidth disabled={loading} sx={{
            py:1.9,
            fontSize:16,
            fontWeight:700,
            borderRadius:3,
            background:'linear-gradient(135deg,#F7931E 0%, #00AEEF 50%, #FFC20E 100%)',
            color:'#fff',
            textTransform:'none',
            boxShadow:'0 6px 22px rgba(0,0,0,0.45)',
            '&:hover':{ background:'linear-gradient(135deg,#F7931E 0%, #00AEEF 40%, #FFC20E 100%)' }
          }}>{loading? <Box sx={{ display:'flex', alignItems:'center', gap:1 }}><CircularProgress size={20} sx={{ color:'#fff' }} /> Iniciando...</Box> : 'Iniciar Sesión'}</Button>
          <Box sx={{ textAlign:'center', mt:3 }}>
            <Typography variant='caption' sx={{ color:'rgba(255,255,255,0.55)' }}>Universidad de La Guajira • Sede Maicao</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginRings;
