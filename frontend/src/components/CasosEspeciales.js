import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, Checkbox, FormControlLabel, Button, Divider, Alert, Chip } from '@mui/material';
import { WarningAmber, Videocam, MeetingRoom, LockOpen, Lock } from '@mui/icons-material';
import { salasService, videoproyectoresService, adminService, handleApiError } from '../services/api';

const CasosEspeciales = ({ user }) => {
  const [salas, setSalas] = useState([]);
  const [vp, setVp] = useState([]);
  const [selSalas, setSelSalas] = useState({});
  const [selVp, setSelVp] = useState({});
  const [ocupaciones, setOcupaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [salasRes, vpRes, ocRes] = await Promise.all([
        salasService.getAll(),
        videoproyectoresService.getAll(),
        adminService.getOcupaciones()
      ]);
      setSalas(salasRes.data.data || []);
      setVp(vpRes.data.data || []);
      setOcupaciones(ocRes.data.data || []);
    } catch (e) {
      setError(handleApiError(e).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = (kind, checked) => {
    if (kind === 'sala') {
      const m = {};
      salas.forEach(s => m[s.id_sala] = checked);
      setSelSalas(m);
    } else {
      const m = {};
      vp.forEach(x => m[x.id_videoproyector] = checked);
      setSelVp(m);
    }
  };

  const handleOcupar = async () => {
    setProcessing(true);
    setError('');
    try {
      const salasIds = Object.keys(selSalas).filter(id => selSalas[id]).map(id => parseInt(id, 10));
      const vpIds = Object.keys(selVp).filter(id => selVp[id]).map(id => parseInt(id, 10));
      if (salasIds.length === 0 && vpIds.length === 0) {
        setError('Seleccione al menos un recurso');
        setProcessing(false);
        return;
      }
      if (salasIds.length) await adminService.ocupar({ tipo_servicio: 'sala', ids: salasIds, creado_por: user?.id_usuario, nota: 'caso especial' });
      if (vpIds.length) await adminService.ocupar({ tipo_servicio: 'videoproyector', ids: vpIds, creado_por: user?.id_usuario, nota: 'caso especial' });
      await loadAll();
    } catch (e) {
      setError(handleApiError(e).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleLiberar = async () => {
    setProcessing(true);
    setError('');
    try {
      const salasIds = Object.keys(selSalas).filter(id => selSalas[id]).map(id => parseInt(id, 10));
      const vpIds = Object.keys(selVp).filter(id => selVp[id]).map(id => parseInt(id, 10));
      if (salasIds.length === 0 && vpIds.length === 0) {
        setError('Seleccione al menos un recurso');
        setProcessing(false);
        return;
      }
      if (salasIds.length) await adminService.liberar({ tipo_servicio: 'sala', ids: salasIds });
      if (vpIds.length) await adminService.liberar({ tipo_servicio: 'videoproyector', ids: vpIds });
      await loadAll();
    } catch (e) {
      setError(handleApiError(e).message);
    } finally {
      setProcessing(false);
    }
  };

  const isOcupadoEspecial = (tipo, id) => ocupaciones.some(o => o.tipo_servicio === tipo && o.id_recurso === id && o.activo === 1);

  // Override removido a solicitud: no se muestran botones ni se permite acción directa.

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmber color="warning" /> Casos Especiales
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Ocupar/Liberar recursos sin restricciones de horario (solo Admin)
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={loadAll} disabled={loading}>Actualizar</Button>
          <Button variant="contained" color="warning" startIcon={<Lock />} onClick={handleOcupar} disabled={processing}>Ocupar seleccionados</Button>
          <Button variant="contained" color="success" startIcon={<LockOpen />} onClick={handleLiberar} disabled={processing}>Liberar seleccionados</Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" sx={{ display:'flex', alignItems:'center', gap:1 }}><MeetingRoom color="primary"/> Salas</Typography>
                <Box>
                  <Button size="small" onClick={() => toggleAll('sala', true)}>Seleccionar todo</Button>
                  <Button size="small" onClick={() => toggleAll('sala', false)}>Limpiar</Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                {salas.map(s => (
                  <Box key={s.id_sala} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <FormControlLabel
                      control={<Checkbox checked={!!selSalas[s.id_sala]} onChange={(e)=> setSelSalas(prev=>({ ...prev, [s.id_sala]: e.target.checked }))} />}
                      label={`${s.nombre} — ${s.ubicacion}`}
                    />
                    <Box display="flex" alignItems="center" gap={1}>
                      {isOcupadoEspecial('sala', s.id_sala) && <Chip size="small" color="warning" label="Ocupado (especial)"/>}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" sx={{ display:'flex', alignItems:'center', gap:1 }}><Videocam color="primary"/> Videoproyectores</Typography>
                <Box>
                  <Button size="small" onClick={() => toggleAll('vp', true)}>Seleccionar todo</Button>
                  <Button size="small" onClick={() => toggleAll('vp', false)}>Limpiar</Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                {vp.map(x => (
                  <Box key={x.id_videoproyector} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <FormControlLabel
                      control={<Checkbox checked={!!selVp[x.id_videoproyector]} onChange={(e)=> setSelVp(prev=>({ ...prev, [x.id_videoproyector]: e.target.checked }))} />}
                      label={`${x.nombre} — ${x.ubicacion}`}
                    />
                    <Box display="flex" alignItems="center" gap={1}>
                      {isOcupadoEspecial('videoproyector', x.id_videoproyector) && <Chip size="small" color="warning" label="Ocupado (especial)"/>}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CasosEspeciales;
