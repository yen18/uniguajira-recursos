import React, { useState } from 'react';
import { Box, TextField, Button, Alert, CircularProgress, InputAdornment, IconButton, Typography, useMediaQuery } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { usuariosService, handleApiError } from '../services/api';
import logoUni from '../assets/logouni.png';

/* LoginBlobs: versión compacta basada en el snippet con body negro y tres formas orgánicas (border-radius %) girando.
   Ajustes: tamaño reducido (400px contenedor anillos, 260px formulario), hover glow opcional. */

const LoginBlobs = ({ onLogin }) => {
  const [formData, setFormData] = useState({ correo_electronico: '', pass: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const isSmall = useMediaQuery('(max-width:600px)');

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
    <>
    <Box sx={{
      minHeight:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      background:'linear-gradient(180deg,#ffffff 0%, #fdfaf5 50%, #f6f9ff 100%)',
      fontFamily:'Poppins, sans-serif',
      position:'relative',
      overflow:'hidden'
    }}>
      <style>{`\n        @keyframes blobRotateA {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}\n        @keyframes blobRotateB {0%{transform:rotate(360deg);}100%{transform:rotate(0deg);}}\n        @keyframes formFade {from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}\n        /* Ciclos de color independientes para cada aro (más intensidad) */\n        @keyframes colorCycle1 {0%{border-color:#F7931E;}20%{border-color:#FF7A00;}40%{border-color:#FFC20E;}60%{border-color:#FF9E2C;}80%{border-color:#F7931E;}100%{border-color:#F7931E;}}\n        @keyframes colorCycle2 {0%{border-color:#00AEEF;}25%{border-color:#0088D6;}50%{border-color:#00C8FF;}75%{border-color:#40D4FF;}100%{border-color:#00AEEF;}}\n        @keyframes colorCycle3 {0%{border-color:#EF4136;}25%{border-color:#FF5548;}50%{border-color:#FF7A6E;}75%{border-color:#EF4136;}100%{border-color:#EF4136;}}\n        @keyframes colorCycle4 {0%{border-color:#FFC20E;}25%{border-color:#FFD645;}50%{border-color:#FFE066;}75%{border-color:#FFC20E;}100%{border-color:#FFC20E;}}\n        /* Glow pulsante sincronizado suave */\n        @keyframes softGlow {0%,100%{box-shadow:0 0 18px rgba(255,194,14,0.35);}50%{box-shadow:0 0 32px rgba(255,194,14,0.55);}}\n      `}</style>

      {/* Grupo de anillos multicolor detrás del panel */}
      <Box sx={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:isSmall?360:760, height:isSmall?360:760, pointerEvents:'none' }}>
        <Box sx={{ position:'absolute', inset:0, border:'5px solid #F7931E', borderRadius:'38% 62% 63% 37% / 41% 44% 56% 59%', animation:'blobRotateA 16s linear infinite, colorCycle1 12s linear infinite', opacity:0.55, mixBlendMode:'multiply', filter:'drop-shadow(0 0 8px rgba(247,147,30,0.45)) blur(0.4px)' }} />
        <Box sx={{ position:'absolute', inset:isSmall?22:44, border:'5px solid #00AEEF', borderRadius:'41% 44% 56% 59% / 38% 62% 63% 37%', animation:'blobRotateA 12s linear infinite reverse, colorCycle2 14s linear infinite 2s', opacity:0.50, mixBlendMode:'multiply', filter:'drop-shadow(0 0 10px rgba(0,174,239,0.45)) blur(0.5px)' }} />
        <Box sx={{ position:'absolute', inset:isSmall?50:78, border:'4px solid #EF4136', borderRadius:'41% 44% 56% 59% / 38% 62% 63% 37%', animation:'blobRotateB 20s linear infinite, colorCycle3 13s linear infinite 4s', opacity:0.48, mixBlendMode:'multiply', filter:'drop-shadow(0 0 9px rgba(239,65,54,0.40)) blur(0.4px)' }} />
        <Box sx={{ position:'absolute', inset:isSmall?80:118, border:'3px solid #FFC20E', borderRadius:'63% 37% 41% 44% / 56% 59% 38% 62%', animation:'blobRotateA 26s linear infinite reverse, colorCycle4 15s linear infinite 6s', opacity:0.45, mixBlendMode:'multiply', filter:'drop-shadow(0 0 6px rgba(255,194,14,0.38)) blur(0.4px)' }} />
      </Box>

    </Box>
    {/* Formulario / Panel */}
    <Box component='form' onSubmit={handleSubmit} sx={{
        position:'relative',
        width:isSmall?320:440,
        p:isSmall?4:5,
        display:'flex',
        flexDirection:'column',
        gap:isSmall?2.2:2.6,
        animation:'formFade .6s ease-out',
        zIndex:5,
        borderRadius:isSmall?6:14,
        background:'#ffffff',
        boxShadow:'0 12px 40px rgba(0,0,0,0.12), 0 0 60px rgba(255,194,14,0.35)',
        border:'1px solid rgba(0,0,0,0.06)'
      }}>
        <Box sx={{ textAlign:'center', mb:1 }}>
          <Box sx={{ width:isSmall?96:130, height:isSmall?96:130, mx:'auto', mb:isSmall?2.4:3.2, borderRadius:'50%', position:'relative', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 6px rgba(255,255,255,0.7), 0 10px 35px rgba(0,0,0,0.12), 0 0 55px rgba(255,194,14,0.35)', animation:'softGlow 6s ease-in-out infinite' }}>
            <img src={logoUni} alt='Universidad de La Guajira' style={{ width:'82%', height:'82%', objectFit:'contain', filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.25))' }} onError={(e)=>{e.target.style.display='none';}} />
          </Box>
          <Typography variant='h4' sx={{ fontWeight:800, letterSpacing:'-.7px', color:'#111827', mb:0.6 }}>Bienvenido</Typography>
          <Typography variant='body2' sx={{ color:'#374151', fontWeight:500 }}>Universidad de La Guajira • Recursos Audiovisuales</Typography>
        </Box>
        {error && <Alert severity='error'>{error}</Alert>}
        <TextField
          label='Correo Electrónico o Usuario'
          name='correo_electronico'
          value={formData.correo_electronico}
          onChange={handleChange}
          required
          fullWidth
          InputProps={{ startAdornment:<InputAdornment position='start'><Email sx={{ color:'#F7931E' }} /></InputAdornment> }}
        />
        <TextField
          label='Contraseña'
          name='pass'
          type={showPassword?'text':'password'}
          value={formData.pass}
          onChange={handleChange}
          required
          fullWidth
          InputProps={{ startAdornment:<InputAdornment position='start'><Lock sx={{ color:'#F7931E' }} /></InputAdornment>, endAdornment:<InputAdornment position='end'><IconButton onClick={()=>setShowPassword(!showPassword)} edge='end'>{showPassword?<VisibilityOff/>:<Visibility/>}</IconButton></InputAdornment> }}
        />
        <Button type='submit' disabled={loading} sx={{
          py:1.6,
          fontSize:16,
          fontWeight:700,
          borderRadius:10,
          background:'linear-gradient(135deg,#F7931E 0%, #FFC20E 100%)',
          color:'#fff',
          textTransform:'none',
          boxShadow:'0 6px 18px rgba(247,147,30,0.35)',
          '&:hover':{ background:'linear-gradient(135deg,#F7931E 0%, #FFC20E 85%)' }
        }}>
          {loading ? <Box sx={{ display:'flex', alignItems:'center', gap:1 }}><CircularProgress size={20} sx={{ color:'#fff' }} /> Iniciando...</Box> : 'Iniciar Sesión'}
        </Button>
        <Typography variant='caption' sx={{ textAlign:'center', color:'#555', mt:1, cursor:'pointer', '&:hover':{ color:'#F7931E' } }}>¿Olvidaste tu contraseña?</Typography>
      </Box>
    </>
  );
};

export default LoginBlobs;
