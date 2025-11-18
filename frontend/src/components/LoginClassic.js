import React, { useState } from 'react';
import { Box, Button, Alert, CircularProgress, IconButton, Typography } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { usuariosService, handleApiError } from '../services/api';
import { setAccessToken } from '../services/authToken';
import logoUni from '../assets/logouni.png';

/* LoginClassic: versión oscura minimalista con anillos orgánicos blancos
   Inspirada en snippet original: fondo negro, 3 anillos (border-radius %) rotando.
   Mantiene campos y lógica de login existentes, con inputs custom en vez de TextField MUI para fidelidad visual. */

const LoginClassic = ({ onLogin }) => {
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
        if (resp.data.access_token) {
          await setAccessToken(resp.data.access_token);
        }
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
      justifyContent:'center',
      alignItems:'center',
      background:'linear-gradient(180deg,#ffffff 0%, #f9fbfe 55%, #f4f7fc 100%)',
      fontFamily:'Poppins, sans-serif',
      position:'relative',
      overflow:'hidden'
    }}>
      <style>{`
        @keyframes rotateA {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
        @keyframes rotateB {0%{transform:rotate(360deg);}100%{transform:rotate(0deg);}}
        @keyframes fadeIn {0%{opacity:0;transform:translateY(30px);}100%{opacity:1;transform:translateY(0);}}
        .ringBox {position:relative;width:410px;height:410px;display:flex;justify-content:center;align-items:center;}
        .ringBox i {position:absolute;inset:0;border:3px solid rgba(255,147,30,0.55);transition:0.6s;mix-blend-mode:multiply;}
        .ringBox i:nth-child(1){border-radius:38% 62% 63% 37% / 41% 44% 56% 59%;animation:rotateA 14s linear infinite;border-color:rgba(247,147,30,0.55);}
        .ringBox i:nth-child(2){border-radius:41% 44% 56% 59% / 38% 62% 63% 37%;animation:rotateA 10s linear infinite;border-color:rgba(0,174,239,0.50);}
        .ringBox i:nth-child(3){border-radius:41% 44% 56% 59% / 38% 62% 63% 37%;animation:rotateB 22s linear infinite;border-color:rgba(255,194,14,0.55);}
        .ringBox:hover i {border-width:5px;filter:drop-shadow(0 0 20px rgba(247,147,30,0.35));}
        @media (max-width:500px){.ringBox{width:320px;height:320px;}}
        .field-label {font-size:0.72rem;font-weight:600;color:#475467;letter-spacing:.3px;margin:0 0 6px 6px;display:block;}
        .input-wrapper {position:relative;width:100%;}
        .input-icon {position:absolute;top:50%;left:14px;transform:translateY(-50%);color:#F7931E;}
        .input-base {width:100%;padding:14px 44px;background:#F9FAFB;border:1.5px solid rgba(16,24,40,0.14);border-radius:16px;font-size:0.95rem;font-weight:500;color:#0f172a;outline:none;transition:border-color .2s ease, box-shadow .2s ease, background .2s ease;text-align:left;}
        .input-base:hover{border-color:rgba(16,24,40,0.22);}
        .input-base::placeholder{color:#98A2B3;}
        .input-base:focus {border-color:#F7931E;box-shadow:0 0 0 4px rgba(247,147,30,0.16);background:#fff;}
        .input-base.pass {letter-spacing:2px;}
        .icon-button-pass {position:absolute;top:50%;right:10px;transform:translateY(-50%);color:#475467;}
      `}</style>

      {/* Anillos */}
      <Box className='ringBox'>
        <i></i><i></i><i></i>
        {/* Formulario centrado dentro de los anillos */}
        <Box component='form' onSubmit={handleSubmit} sx={{
          position:'relative',
          width:{ xs:300, sm:340 },
          display:'flex',
          flexDirection:'column',
          alignItems:'stretch',
          gap:1.6,
          px:{ xs:3, sm:3.5 },
          pt:{ xs:4.5, sm:5 },
          pb:{ xs:4, sm:4.75 },
          zIndex:2,
          color:'#0f172a',
          background:'rgba(255,255,255,0.96)',
          borderRadius:'28px',
          border:'1px solid rgba(16,24,40,0.06)',
          boxShadow:'0 24px 60px rgba(16,24,40,0.12), 0 8px 24px rgba(16,24,40,0.06)',
          animation:'fadeIn .7s ease'
        }}>
          <Box sx={{ width:88,height:88, mx:'auto', mt:-9, mb:1, borderRadius:'20px', background:'#ffffff', display:'flex',alignItems:'center',justifyContent:'center', boxShadow:'0 0 0 8px rgba(255,194,14,0.12), 0 10px 24px rgba(16,24,40,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}>
            <img src={logoUni} alt='Logo' style={{ width:'78%',height:'78%',objectFit:'contain', filter:'drop-shadow(0 2px 6px rgba(16,24,40,0.15))' }} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight:900, textAlign:'center', mb:0.3, letterSpacing:'-.6px', color:'#0F172A' }}>Bienvenido</Typography>
          <Typography variant='body2' sx={{ color:'#667085', mb:1.1, textAlign:'center', fontWeight:500, lineHeight:1.25 }}>Universidad de La Guajira - Recursos Audiovisuales</Typography>
          <Box sx={{ height:1, width:'100%', mb:0.5, background:'linear-gradient(90deg, rgba(16,24,40,0) 0%, rgba(247,147,30,0.35) 20%, rgba(255,194,14,0.45) 50%, rgba(16,24,40,0.06) 80%, rgba(16,24,40,0) 100%)' }} />
          {error && <Alert severity='error' sx={{ width:'100%' }}>{error}</Alert>}
          <label className='field-label' htmlFor='correo_electronico' style={{ marginLeft:4, marginTop:2 }}>Correo Electrónico o Usuario *</label>
          <div className='input-wrapper'>
            <Email className='input-icon' />
            <input
              id='correo_electronico'
              name='correo_electronico'
              placeholder='usuario@correo.com'
              value={formData.correo_electronico}
              onChange={handleChange}
              required
              className='input-base'
              autoComplete='username'
            />
          </div>
          <label className='field-label' htmlFor='pass' style={{ marginLeft:4, marginTop:4 }}>Contraseña *</label>
          <div className='input-wrapper'>
            <Lock className='input-icon' />
            <input
              id='pass'
              name='pass'
              type={showPassword?'text':'password'}
              placeholder='•••'
              value={formData.pass}
              onChange={handleChange}
              required
              className='input-base pass'
              autoComplete='current-password'
            />
            <IconButton aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'} title={showPassword?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowPassword(!showPassword)} size='small' className='icon-button-pass'>
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </div>
          <Button type='submit' disabled={loading} sx={{
            width:'100%',
            py:1.35,
            mt:0.8,
            borderRadius:'20px',
            fontSize:'0.95em',
            fontWeight:700,
            letterSpacing:'0.5px',
            background:'linear-gradient(135deg,#F7931E 0%, #FFC20E 100%)',
            color:'#fff',
            boxShadow:'0 12px 28px rgba(247,147,30,0.32)',
            transition:'transform .2s ease, box-shadow .2s ease, filter .2s ease',
            '&:hover':{ transform:'translateY(-2px)', boxShadow:'0 16px 36px rgba(247,147,30,0.40)', filter:'saturate(1.04)' },
            '&:active':{ transform:'translateY(0)', boxShadow:'0 10px 24px rgba(247,147,30,0.30)' }
          }}>
            {loading ? <Box sx={{ display:'flex', alignItems:'center', gap:1 }}><CircularProgress size={18} sx={{ color:'#fff' }} /> Iniciando…</Box> : 'Iniciar Sesión'}
          </Button>
          <Box sx={{ display:'flex', justifyContent:'space-between', width:'100%', px:0.5, mt:1.3 }}>
            <Typography variant='caption' component='a' href='#' sx={{ color:'#667085', textDecoration:'none', cursor:'pointer', fontWeight:600, '&:hover':{ color:'#F7931E' } }}>¿Olvidaste?</Typography>
            <Typography variant='caption' component='a' href='#' sx={{ color:'#667085', textDecoration:'none', cursor:'pointer', fontWeight:600, '&:hover':{ color:'#00AEEF' } }}>Soporte</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginClassic;