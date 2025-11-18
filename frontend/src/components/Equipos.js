import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, CardActions, Button, IconButton, Chip, Stack, TextField, MenuItem, Tooltip, Divider, Container, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Select, FormControl, InputLabel, Fab, List, ListItem, ListItemText, FormControlLabel, Checkbox, Table, TableHead, TableRow, TableCell, TableBody, Switch } from '@mui/material';
import { Add, Delete, Refresh, Edit, DragIndicator, Save } from '@mui/icons-material';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import api, { equiposService, handleApiError, adminService, API_BASE_URL } from '../services/api';

const estadoColor = (estado) => {
  switch (estado) {
    case 'disponible': return 'success';
    case 'ocupada': return 'warning';
    case 'mantenimiento': return 'default';
    case 'inactivo': return 'default';
    default: return 'default';
  }
};

const Equipos = ({ user }) => {
  const [items, setItems] = useState([]);
  const [tiposCatalog, setTiposCatalog] = useState([]); // [{clave,nombre}]
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ tipo: 'videocamara', nombre: '', descripcion: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ tipo: 'videocamara', nombre: '', descripcion: '', estado: 'disponible' });
  const [submitting, setSubmitting] = useState(false);

  const TIPO_OPTIONS = React.useMemo(() => {
    if (tiposCatalog.length > 0) {
      return tiposCatalog.map(t => ({ value: t.clave, label: t.nombre }));
    }
    // Fallback si aún no hay catálogo (sin 'Otros')
    return [
      { value: 'videocamara', label: 'Videocámara' },
      { value: 'dvd', label: 'DVD' },
      { value: 'extension', label: 'Extensión (cable)' },
      { value: 'audio', label: 'Audio' },
      { value: 'vhs', label: 'VHS' }
    ];
  }, [tiposCatalog]);

  const tipoLabel = (t) => (TIPO_OPTIONS.find(o => o.value === t)?.label || t);
  const statsByTipo = React.useMemo(() => {
    const res = {};
    for (const it of items) {
      const t = it.tipo || 'otros';
      if (!res[t]) res[t] = { total: 0, disponibles: 0 };
      res[t].total += 1;
      if (String(it.estado).toLowerCase() === 'disponible') res[t].disponibles += 1;
    }
    return res;
  }, [items, TIPO_OPTIONS]);

  const load = async () => {
    setRefreshing(true);
    setError('');
    try {
      const params = tipoFiltro ? { tipo: tipoFiltro } : undefined;
      const res = await equiposService.getAll(params);
      setItems(res.data?.data || []);
      // cargar catálogo activo para tipos visibles/creación
      const cat = await adminService.getEquipos();
      const all = (cat.data?.data || []);
      // Auto-borrado removido: se mantiene cualquier tipo incluso si uso=0 para decisión manual
      let catalogFinal = all;
      // Admin ve todos (posiblemente sin 'otros'); otros roles: sólo activos y nunca 'otros'
      const filtered = (user?.tipo_de_usuario === 'administrador') ? catalogFinal : catalogFinal.filter(x => x.activo && x.clave !== 'otros');
      setTiposCatalog(filtered);
    } catch (e) {
      const apiErr = handleApiError(e);
      setError(apiErr.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const es = new EventSource(`${API_BASE_URL}/solicitudes/stream`);
    const onUpdate = async () => { await load(); };
    try { es.addEventListener('equipos:update', onUpdate); } catch {}
    try { es.addEventListener('catalogo_equipos:update', onUpdate); } catch {}
    try { es.addEventListener('solicitudes:update', onUpdate); } catch {}
    return () => { try { es.close(); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFiltro]);

  // Ajustar tipo por defecto cuando cambie el catálogo
  useEffect(() => {
    if (TIPO_OPTIONS.length > 0 && !TIPO_OPTIONS.find(o => o.value === form.tipo)) {
      setForm((f) => ({ ...f, tipo: TIPO_OPTIONS[0].value }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TIPO_OPTIONS]);

  const handleCreate = async () => {
    if (!form.nombre.trim()) return;
    try {
      await equiposService.create({ ...form, nombre: form.nombre.trim(), descripcion: form.descripcion?.trim() || null });
      setForm({ ...form, nombre: '', descripcion: '' });
      setOpenAdd(false);
      await load();
    } catch (e) {
      const apiErr = handleApiError(e);
      setError(apiErr.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await equiposService.delete(id);
      await load();
    } catch (e) {
      console.error('Error eliminando equipo:', handleApiError(e));
    }
  };

  const handleToggleEstado = async (item) => {
    const next = item.estado === 'disponible' ? 'inactivo' : 'disponible';
    try {
      await equiposService.cambiarEstado(item.id_equipo, next);
      await load();
    } catch (e) {
      console.error('Error cambiando estado:', handleApiError(e));
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      tipo: item.tipo || 'videocamara',
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      estado: item.estado || 'disponible'
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      setSubmitting(true);
      const payload = {
        tipo: editForm.tipo,
        nombre: editForm.nombre?.trim(),
        descripcion: editForm.descripcion?.trim() || null,
        estado: editForm.estado
      };
      await equiposService.update(editingItem.id_equipo, payload);
      setOpenEdit(false);
      setSubmitting(false);
      await load();
    } catch (e) {
      setSubmitting(false);
      const apiErr = handleApiError(e);
      setError(apiErr.message);
    }
  };

  const isAdmin = user?.tipo_de_usuario === 'administrador';
  // Gestión de catálogo de tipos (solo admin)
  const [openCatalogNew, setOpenCatalogNew] = useState(false);
  const [catalogForm, setCatalogForm] = useState({ nombre: '', clave: '', activo: true });
  const [openCatalogEdit, setOpenCatalogEdit] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState(null);
  const [editCatalogForm, setEditCatalogForm] = useState({ nombre: '', activo: true, orden: '' });
  const [catalogSubmitting, setCatalogSubmitting] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [openCatalogDelete, setOpenCatalogDelete] = useState(false);
  const [deletingCatalogItem, setDeletingCatalogItem] = useState(null);
  const [deletingCatalogUsage, setDeletingCatalogUsage] = useState(null); // null=cargando, number=conteo
  const [reorderMode, setReorderMode] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [catalogSuccess, setCatalogSuccess] = useState('');

  const handleCreateCatalogItem = async () => {
    if (!catalogForm.nombre.trim()) return;
    try {
      setCatalogSubmitting(true);
      await adminService.createEquipo({
        nombre: catalogForm.nombre.trim(),
        clave: catalogForm.clave?.trim() || undefined,
        activo: catalogForm.activo ? 1 : 0,
        orden: undefined
      });
      setOpenCatalogNew(false);
      setCatalogForm({ nombre: '', clave: '', activo: true });
      setCatalogError('');
      await load();
    } catch (e) {
      const apiErr = handleApiError(e);
      if (apiErr.status === 409) {
        setCatalogError('La clave ya existe. Usa otro nombre o especifica una clave distinta.');
      } else {
        setCatalogError(apiErr.message);
      }
    } finally {
      setCatalogSubmitting(false);
    }
  };

  const openEditCatalog = (item) => {
    setEditingCatalogItem(item);
    setEditCatalogForm({ nombre: item.nombre, activo: !!item.activo, orden: item.orden || '' });
    setOpenCatalogEdit(true);
  };

  const handleUpdateCatalogItem = async () => {
    if (!editingCatalogItem) return;
    try {
      setCatalogSubmitting(true);
      const payload = { nombre: editCatalogForm.nombre.trim(), activo: editCatalogForm.activo ? 1 : 0 };
      if (editCatalogForm.orden !== '' && !isNaN(Number(editCatalogForm.orden))) {
        payload.orden = Number(editCatalogForm.orden);
      }
      await adminService.updateEquipo(editingCatalogItem.id_equipo, payload);
      setOpenCatalogEdit(false);
      setEditingCatalogItem(null);
      await load();
    } catch (e) {
      setError(handleApiError(e).message);
    } finally {
      setCatalogSubmitting(false);
    }
  };

  const handleToggleCatalogActivo = async (item) => {
    try {
      await adminService.updateEquipo(item.id_equipo, { activo: item.activo ? 0 : 1 });
      await load();
    } catch (e) {
      setError(handleApiError(e).message);
    }
  };

  const openDeleteCatalog = (item) => {
    setDeletingCatalogItem(item);
    setDeletingCatalogUsage(null);
    setOpenCatalogDelete(true);
  };

  // Eliminación rápida: si uso=0 se elimina directo; si uso>0 se pide confirmación
  const handleDeleteCatalogQuick = async (item) => {
    const usage = statsByTipo[item.clave]?.total || 0;
    if (usage === 0) {
      try {
        await adminService.deleteEquipo(item.id_equipo);
        setCatalogSuccess('Tipo eliminado');
        await load();
      } catch (e) {
        setCatalogError(handleApiError(e).message);
      }
    } else {
      openDeleteCatalog(item);
    }
  };

  const handleDeleteCatalogItem = async () => {
    if (!deletingCatalogItem) return;
    try {
      setCatalogSubmitting(true);
      await adminService.deleteEquipo(deletingCatalogItem.id_equipo);
      setOpenCatalogDelete(false);
      setDeletingCatalogItem(null);
      setDeletingCatalogUsage(null);
      setCatalogSuccess('Tipo eliminado');
      await load();
    } catch (e) {
      setCatalogError(handleApiError(e).message);
    } finally {
      setCatalogSubmitting(false);
    }
  };

  // Cargar conteo de uso cuando se abra el diálogo de eliminación
  useEffect(() => {
    if (openCatalogDelete && deletingCatalogItem?.clave) {
      setDeletingCatalogUsage(null);
      equiposService.getAll({ tipo: deletingCatalogItem.clave })
        .then(res => {
          const count = Array.isArray(res.data?.data) ? res.data.data.length : 0;
          setDeletingCatalogUsage(count);
        })
        .catch(() => setDeletingCatalogUsage(0));
    }
  }, [openCatalogDelete, deletingCatalogItem]);

  // Eliminación por clave deshabilitada: se fuerza borrado por id con ?force=1

  // Drag & Drop helpers
  const handleDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e) => {
    if (!reorderMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!reorderMode || draggingId === null || draggingId === targetId) return;
    const current = [...tiposCatalog];
    const fromIdx = current.findIndex(c => c.id_equipo === draggingId);
    const toIdx = current.findIndex(c => c.id_equipo === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = current.splice(fromIdx, 1);
    current.splice(toIdx, 0, moved);
    // Reasignar orden (1..n)
    const updated = current.map((c, i) => ({ ...c, orden: i + 1 }));
    setTiposCatalog(updated);
    setDraggingId(null);
  };

  const persistNewOrder = async () => {
    try {
      setCatalogSubmitting(true);
      await Promise.all(
        tiposCatalog.map(t => adminService.updateEquipo(t.id_equipo, { orden: t.orden }))
      );
      setCatalogSuccess('Orden actualizado');
      setReorderMode(false);
      await load();
    } catch (e) {
      setCatalogError(handleApiError(e).message);
    } finally {
      setCatalogSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DevicesOtherIcon color="primary" />
            Equipos
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Gestionar equipos disponibles
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {refreshing && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" color="text.secondary">Actualizando…</Typography>
            </Box>
          )}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={load}
            sx={{ borderRadius: 2 }}
          >
            Actualizar
          </Button>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenAdd(true)}
              sx={{ borderRadius: 2 }}
            >
              Nuevo Equipo
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        {isAdmin && (
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Catálogo de Tipos de Servicio</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant={reorderMode ? 'outlined' : 'contained'} startIcon={<DragIndicator />} onClick={() => setReorderMode(r => !r)}>
                  {reorderMode ? 'Cancelar' : 'Reordenar'}
                </Button>
                {reorderMode && (
                  <Button size="small" color="success" variant="contained" startIcon={<Save />} disabled={catalogSubmitting} onClick={persistNewOrder}>
                    Guardar Orden
                  </Button>
                )}
                <Button size="small" variant="contained" startIcon={<Add />} onClick={() => setOpenCatalogNew(true)}>Nuevo Tipo</Button>
              </Box>
            </Box>
            <Paper variant="outlined" sx={{ overflowX: 'auto', mb: 2 }}>
              <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{reorderMode ? 'Arrastrar' : 'Nombre'}</TableCell>
                    {/* Columna clave ocultada */}
                    <TableCell sx={{ fontWeight: 600 }} align="center">Orden</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Uso</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Estado</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tiposCatalog.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">No hay tipos registrados.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : tiposCatalog.map(t => (
                    <TableRow key={t.id_equipo} hover draggable={reorderMode} onDragStart={(e)=>handleDragStart(e,t.id_equipo)} onDragOver={handleDragOver} onDrop={(e)=>handleDrop(e,t.id_equipo)} sx={reorderMode ? { cursor:'move', opacity: draggingId===t.id_equipo ? 0.5 : 1 } : {}}>
                      <TableCell>
                        {reorderMode ? (
                          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                            <DragIndicator fontSize="small" sx={{ color:'text.disabled' }} />
                            <Typography variant="body2" sx={{ fontWeight:500 }}>{t.nombre}</Typography>
                          </Box>
                        ) : t.nombre}
                      </TableCell>
                      {/* Celda clave ocultada */}
                      <TableCell align="center">{t.orden}</TableCell>
                      <TableCell align="center">
                        <Chip size="small" color="info" variant="outlined" label={statsByTipo[t.clave]?.total || 0} />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={!!t.activo}
                          onChange={() => handleToggleCatalogActivo(t)}
                          color="success"
                          inputProps={{ 'aria-label': `Cambiar estado ${t.nombre}` }}
                        />
                        <Chip size="small" color={t.activo ? 'success' : 'default'} label={t.activo ? 'Activo' : 'Inactivo'} sx={{ ml: 1 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEditCatalog(t)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={statsByTipo[t.clave]?.total > 0 ? 'Eliminar (confirmará uso)' : 'Eliminar'}>
                          <IconButton size="small" color="error" onClick={() => handleDeleteCatalogQuick(t)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            {catalogError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCatalogError('')}>
                {catalogError}
              </Alert>
            )}
            <Divider sx={{ mb: 2 }} />
            {catalogSuccess && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCatalogSuccess('')}>
                {catalogSuccess}
              </Alert>
            )}
          </Box>
        )}
        {/* Resumen por tipo */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1, flexWrap: 'wrap' }}>
          {Object.keys(statsByTipo).length === 0 ? (
            <Typography variant="body2" color="text.secondary">No hay equipos registrados.</Typography>
          ) : (
            Object.entries(statsByTipo).map(([t, st]) => (
              <Chip key={t} size="small" color={st.disponibles > 0 ? 'success' : 'warning'}
                label={`${tipoLabel(t)}: ${st.disponibles}/${st.total} disponibles`} />
            ))
          )}
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField select label="Filtrar por tipo" size="small" value={tipoFiltro} onChange={(e)=>setTipoFiltro(e.target.value)} sx={{ minWidth: 260 }}>
            <MenuItem value="">Todos</MenuItem>
            {TIPO_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {items.map(item => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id_equipo}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box display="flex" alignItems="center">
                      <DevicesOtherIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2">{item.nombre}</Typography>
                    </Box>
                    <Chip size="small" color={estadoColor(item.estado)} label={item.estado} />
                  </Box>

                  <Typography variant="body2" color="text.secondary">Tipo: {TIPO_OPTIONS.find(t=>t.value===item.tipo)?.label || item.tipo}</Typography>
                  {item.descripcion && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{item.descripcion}</Typography>
                  )}

                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">ID: {item.id_equipo}</Typography>
                  </Box>
                </CardContent>
                <Divider />
                {isAdmin ? (
                  <CardActions sx={{ justifyContent: 'space-between' }}>
                    <Tooltip title="Editar">
                      <Button size="small" startIcon={<Edit />} onClick={() => handleOpenEdit(item)}>
                        Editar
                      </Button>
                    </Tooltip>
                    <Tooltip title={item.estado === 'disponible' ? 'Desactivar' : 'Activar'}>
                      <Button size="small" onClick={() => handleToggleEstado(item)}>
                        {item.estado === 'disponible' ? 'Desactivar' : 'Activar'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton color="error" onClick={() => handleDelete(item.id_equipo)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                ) : (
                  <CardActions sx={{ justifyContent: 'flex-end' }}>
                    <Chip size="small" variant="outlined" color={estadoColor(item.estado)} label={item.estado === 'disponible' ? 'Se puede solicitar' : 'No disponible'} />
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* FAB para móvil */}
      {isAdmin && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16, display: { xs: 'flex', md: 'none' } }}
          onClick={() => setOpenAdd(true)}
        >
          <Add />
        </Fab>
      )}

      {/* Dialog crear equipo */}
      {isAdmin && (
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Add color="primary" /> Nuevo Equipo
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select label="Tipo" value={form.tipo} onChange={(e)=>setForm({ ...form, tipo: e.target.value })}>
                {TIPO_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Nombre" fullWidth size="small" value={form.nombre} onChange={(e)=>setForm({ ...form, nombre: e.target.value })} />
            <TextField label="Descripción" fullWidth size="small" value={form.descripcion} onChange={(e)=>setForm({ ...form, descripcion: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.nombre.trim()}>Crear</Button>
        </DialogActions>
      </Dialog>
      )}

      {/* Dialog editar equipo */}
      {isAdmin && (
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit color="primary" /> Editar Equipo
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select label="Tipo" value={editForm.tipo} onChange={(e)=>setEditForm({ ...editForm, tipo: e.target.value })}>
                {TIPO_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Nombre" fullWidth size="small" value={editForm.nombre} onChange={(e)=>setEditForm({ ...editForm, nombre: e.target.value })} />
            <TextField label="Descripción" fullWidth size="small" value={editForm.descripcion} onChange={(e)=>setEditForm({ ...editForm, descripcion: e.target.value })} />
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select label="Estado" value={editForm.estado} onChange={(e)=>setEditForm({ ...editForm, estado: e.target.value })}>
                <MenuItem value="disponible">Disponible</MenuItem>
                <MenuItem value="ocupada">Ocupada</MenuItem>
                <MenuItem value="mantenimiento">Mantenimiento</MenuItem>
                <MenuItem value="inactivo">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={submitting || !editForm.nombre.trim()}>
            {submitting ? <CircularProgress size={20} /> : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>
      )}

      {/* Dialog nuevo tipo catálogo */}
      {isAdmin && (
        <Dialog open={openCatalogNew} onClose={() => setOpenCatalogNew(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle>Nuevo Tipo de Servicio</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField label="Nombre" fullWidth size="small" value={catalogForm.nombre} onChange={(e)=>setCatalogForm({ ...catalogForm, nombre: e.target.value })} />
              <TextField label="Clave (opcional)" fullWidth size="small" value={catalogForm.clave} onChange={(e)=>setCatalogForm({ ...catalogForm, clave: e.target.value.toLowerCase() })} helperText="Si se deja vacío se genera automáticamente." />
              <FormControlLabel control={<Checkbox checked={catalogForm.activo} onChange={(e)=>setCatalogForm({ ...catalogForm, activo: e.target.checked })} />} label="Activo (visible para usuarios)" />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCatalogNew(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleCreateCatalogItem} disabled={!catalogForm.nombre.trim() || catalogSubmitting}>
              {catalogSubmitting ? <CircularProgress size={20} /> : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Dialog editar tipo catálogo */}
      {isAdmin && (
        <Dialog open={openCatalogEdit} onClose={() => setOpenCatalogEdit(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle>Editar Tipo de Servicio</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField label="Nombre" fullWidth size="small" value={editCatalogForm.nombre} onChange={(e)=>setEditCatalogForm({ ...editCatalogForm, nombre: e.target.value })} />
              <TextField label="Orden" fullWidth size="small" value={editCatalogForm.orden} onChange={(e)=>setEditCatalogForm({ ...editCatalogForm, orden: e.target.value })} helperText="Entero para ordenar (menor se muestra primero)." />
              <FormControlLabel control={<Checkbox checked={editCatalogForm.activo} onChange={(e)=>setEditCatalogForm({ ...editCatalogForm, activo: e.target.checked })} />} label="Activo" />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCatalogEdit(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleUpdateCatalogItem} disabled={catalogSubmitting || !editCatalogForm.nombre.trim()}>
              {catalogSubmitting ? <CircularProgress size={20} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Dialog eliminar tipo catálogo */}
      {isAdmin && (
        <Dialog open={openCatalogDelete} onClose={() => setOpenCatalogDelete(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle>Eliminar Tipo</DialogTitle>
          <DialogContent dividers>
            {deletingCatalogItem && (
              <Stack spacing={1}>
                <Typography variant="body2">
                  Tipo: <strong>{deletingCatalogItem.nombre}</strong> (clave: <code>{deletingCatalogItem.clave}</code>)
                </Typography>
                {deletingCatalogUsage === null ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">Calculando uso…</Typography>
                  </Box>
                ) : deletingCatalogUsage > 0 ? (
                  <Alert severity="warning" variant="outlined">
                    Hay {deletingCatalogUsage} equipo(s) usando este tipo. ¿Seguro que desea eliminarlo? Los equipos quedarán con una clave huérfana.
                  </Alert>
                ) : (
                  <Alert severity="info" variant="outlined">
                    Sin equipos asociados. Se puede eliminar de forma segura.
                  </Alert>
                )}
                <Typography variant="caption" color="text.secondary">
                  Eliminar el tipo no borra equipos existentes; si hubiese, conservarán su clave.
                </Typography>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCatalogDelete(false)}>Cancelar</Button>
            <Button color="error" variant="contained" onClick={handleDeleteCatalogItem} disabled={catalogSubmitting || deletingCatalogUsage === null}>
              {catalogSubmitting ? <CircularProgress size={20} /> : deletingCatalogUsage > 0 ? 'Eliminar igualmente' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default Equipos;
