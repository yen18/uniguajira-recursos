// LoginWaves: versión limpia con ondas institucionales
import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress, InputAdornment, IconButton, keyframes } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import logoUni from '../assets/logouni.png';
import { usuariosService, handleApiError } from '../services/api';

const waveSlide = keyframes`
  0% { transform: translateX(0); }
  50% { transform: translateX(-50px); }
  100% { transform: translateX(0); }
`;
const waveRise = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-35px); }
  100% { transform: translateY(0); }
`;
const fadeIn = keyframes`0%{opacity:0;transform:scale(.95);}100%{opacity:1;transform:scale(1);}`;

const LoginWaves = ({ onLogin }) => {
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
      minHeight:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      position:'relative',
      overflow:'hidden',
      background:'linear-gradient(160deg,#ffffff 0%, #e8f3ff 40%, #d6ecff 100%)',
      fontFamily:'"Poppins", sans-serif'
    }}>
      <Box sx={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none' }}>
        <Box sx={{ position:'absolute', bottom:-120, left:-80, width:700, height:700, background:'radial-gradient(circle at 30% 30%, rgba(247,147,30,0.35), transparent 70%)', filter:'blur(40px)', animation:`${waveRise} 14s ease-in-out infinite` }} />
        <Box sx={{ position:'absolute', top:-160, right:-120, width:760, height:760, background:'radial-gradient(circle at 70% 40%, rgba(0,174,239,0.35), transparent 70%)', filter:'blur(42px)', animation:`${waveSlide} 16s ease-in-out infinite` }} />
        <Box sx={{ position:'absolute', top:'35%', left:'50%', width:800, height:800, transform:'translateX(-50%)', background:'radial-gradient(circle at 50% 50%, rgba(255,194,14,0.25), transparent 65%)', filter:'blur(50px)', animation:`${waveSlide} 18s linear infinite reverse` }} />
      </Box>

      <Paper elevation={0} sx={{
        position:'relative',
        zIndex:5,
        width:{ xs:'90%', sm:420 },
        p:{ xs:4, sm:6 },
        borderRadius:'24px',
        backdropFilter:'blur(8px)',
        background:'rgba(255,255,255,0.92)',
        boxShadow:'0 24px 60px rgba(16,24,40,0.12), 0 8px 24px rgba(16,24,40,0.06)',
        border:'1px solid rgba(16,24,40,0.06)',
        transition:'box-shadow .25s ease, transform .25s ease',
        animation:`${fadeIn} 0.6s ease`,
        '&:hover': { boxShadow:'0 28px 70px rgba(16,24,40,0.14), 0 10px 28px rgba(16,24,40,0.08)' }
      }}>
        <Box sx={{ textAlign:'center', mb:{ xs:3, sm:4 } }}>
          <Box sx={{
            width:{ xs:104, sm:116 },
            height:{ xs:104, sm:116 },
            mx:'auto', mb:{ xs:2.5, sm:3 },
            borderRadius:'20px',
            background:'linear-gradient(180deg,#ffffff,#f7f7f7)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 10px 30px rgba(2, 8, 20, 0.06), inset 0 0 0 1px rgba(16,24,40,0.06), 0 0 0 10px rgba(255,255,255,0.8)',
            border:'1px solid rgba(16,24,40,0.06)'
          }}>
            <img src={logoUni} alt='Universidad de La Guajira' style={{ width:'80%', height:'80%', objectFit:'contain', filter:'drop-shadow(0 2px 6px rgba(16,24,40,0.12))' }} onError={(e)=>{e.target.style.display='none';}} />
          </Box>
          <Typography variant='h4' sx={{ fontWeight:800, letterSpacing:'-0.6px', color:'#0F172A', mb:0.5, textShadow:'0 1px 0 rgba(255,255,255,0.3)' }}>Bienvenido</Typography>
          <Typography variant='body1' sx={{ color:'#667085', fontWeight:500 }}>Universidad de La Guajira · Recursos Audiovisuales</Typography>
          <Box sx={{
            mt:2.5, mb:0.5,
            width:'100%', height:1,
            background:'linear-gradient(90deg, rgba(16,24,40,0) 0%, rgba(247,147,30,0.4) 15%, rgba(255,194,14,0.5) 50%, rgba(0,0,0,0.06) 85%, rgba(16,24,40,0) 100%)'
          }} />
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
            placeholder='usuario@correo.com'
            sx={{
              mb:3,
              '& .MuiOutlinedInput-root':{
                borderRadius:'16px',
                background:'#F9FAFB',
                '& .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(16,24,40,0.12)' },
                '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(16,24,40,0.18)' },
                '&.Mui-focused':{ boxShadow:'0 0 0 4px rgba(247,147,30,0.16)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline':{ borderColor:'#F7931E' },
              },
              '& .MuiInputBase-input':{ padding:'16px 14px' },
              '& .MuiInputLabel-root':{ color:'#667085', fontWeight:600 },
              '& input::placeholder':{ color:'#98A2B3', opacity:1 }
            }}
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
            placeholder='••••••••'
            sx={{
              mb:4,
              '& .MuiOutlinedInput-root':{
                borderRadius:'16px',
                background:'#F9FAFB',
                '& .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(16,24,40,0.12)' },
                '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(16,24,40,0.18)' },
                '&.Mui-focused':{ boxShadow:'0 0 0 4px rgba(247,147,30,0.16)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline':{ borderColor:'#F7931E' },
              },
              '& .MuiInputBase-input':{ padding:'16px 14px' }
            }}
            InputProps={{
              startAdornment:<InputAdornment position='start'><Lock sx={{ color:'#F7931E' }} /></InputAdornment>,
              endAdornment:<InputAdornment position='end' sx={{ alignItems:'center' }}>
                <IconButton onClick={()=>setShowPassword(!showPassword)} edge='end' sx={{ alignSelf:'center' }}>
                  {showPassword ? <VisibilityOff/> : <Visibility/>}
                </IconButton>
              </InputAdornment>
            }}
          />
          <Button
            type='submit'
            fullWidth
            disabled={loading}
            sx={{
              py:2.2,
              borderRadius:'16px',
              fontSize:16,
              fontWeight:700,
              background:'linear-gradient(135deg, #F7931E 0%, #FFC20E 100%)',
              color:'#fff',
              textTransform:'none',
              boxShadow:'0 12px 28px rgba(247,147,30,0.30)',
              transition:'transform .2s ease, box-shadow .2s ease, filter .2s ease',
              '&:hover':{ transform:'translateY(-2px)', boxShadow:'0 16px 36px rgba(247,147,30,0.38)', filter:'saturate(1.05)' },
              '&:active':{ transform:'translateY(0)', boxShadow:'0 10px 24px rgba(247,147,30,0.28)' }
            }}>
            {loading ? <Box sx={{ display:'flex', alignItems:'center', gap:1 }}><CircularProgress size={20} sx={{ color:'#fff' }} /> Iniciando...</Box> : 'Iniciar Sesión'}
          </Button>
          <Box sx={{ display:'flex', justifyContent:'space-between', mt:2.5 }}>
            <Typography variant='body2' sx={{ cursor:'pointer', color:'#667085', fontWeight:500, '&:hover':{ color:'#F7931E' } }}>¿Olvidaste?</Typography>
            <Typography variant='body2' sx={{ cursor:'pointer', color:'#667085', fontWeight:500, '&:hover':{ color:'#F7931E' } }}>Soporte</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginWaves;
