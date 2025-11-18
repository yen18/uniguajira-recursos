import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  LinearProgress,
} from '@mui/material';
import { Print, BarChart as BarChartIcon, PieChart as PieChartIcon, Timeline, Refresh, Download } from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { solicitudesService, handleApiError } from '../services/api';

const COLORS = ['#1976d2', '#2e7d32', '#ef6c00', '#d32f2f', '#6a1b9a', '#00838f'];

function groupBy(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const ranges = [
  { key: '7', label: 'Últimos 7 días', days: 7 },
  { key: '30', label: 'Últimos 30 días', days: 30 },
  { key: '90', label: 'Últimos 90 días', days: 90 },
  { key: '365', label: 'Último año', days: 365 },
];

export default function Reportes({ user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [range, setRange] = useState(ranges[1]);
  const printRef = useRef(null);
  const [filtroServicio, setFiltroServicio] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroDocente, setFiltroDocente] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const resp = await solicitudesService.getAll();
        const data = resp.data?.data || [];
        if (!mounted) return;
        setSolicitudes(data);
        setError(null);
      } catch (e) {
        setError(handleApiError(e)?.message || 'Error cargando reportes');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const filteredRange = useMemo(() => {
    if (!solicitudes?.length) return [];
    const now = new Date();
    const minDate = new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000);
    return solicitudes.filter(s => {
      const d = new Date(s.fecha);
      return !isNaN(d) && d >= minDate && d <= now;
    });
  }, [solicitudes, range]);

  const docentesOptions = useMemo(() => {
    const set = new Set();
    for (const s of filteredRange) if (s.docente) set.add(s.docente);
    return Array.from(set).sort();
  }, [filteredRange]);

  const filtered = useMemo(() => {
    let data = filteredRange;
    if (filtroServicio !== 'todos') {
      data = data.filter(s => (s.servicio || (s.id_sala ? 'sala' : 'videoproyector')) === filtroServicio);
    }
    if (filtroEstado !== 'todos') {
      data = data.filter(s => (s.estado || '') === filtroEstado);
    }
    if (filtroDocente && filtroDocente.trim().length > 0) {
      const term = filtroDocente.toLowerCase();
      data = data.filter(s => (s.docente || '').toLowerCase().includes(term));
    }
    return data;
  }, [filteredRange, filtroServicio, filtroEstado, filtroDocente]);

  const byEstado = useMemo(() => {
    // Considerar solo 'aprobada' y 'rechazada'
    return groupBy(filtered, s => s.estado || '')
      .filter(e => e.name === 'aprobada' || e.name === 'rechazada')
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const byServicio = useMemo(() => {
    return groupBy(filtered, s => s.servicio || (s.id_sala ? 'sala' : 'videoproyector'))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const byUsuario = useMemo(() => {
    return groupBy(filtered, s => (s.tipo_de_usuario || s.tipo_usuario || 'desconocido'))
      .map(x => ({ name: x.name.charAt(0).toUpperCase() + x.name.slice(1), value: x.value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const byDia = useMemo(() => {
    // Serie temporal por día (totales)
    const counts = new Map();
    for (const s of filtered) {
      const key = formatDate(s.fecha);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const now = new Date();
    const out = [];
    for (let i = range.days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setDate(d.getDate() - i);
      const key = formatDate(d);
      out.push({ name: key.slice(5), Total: counts.get(key) || 0 });
    }
    return out;
  }, [filtered, range]);

  const topDocentes = useMemo(() => {
    const entries = groupBy(
      filtered.filter(s => {
        const docente = s.docente;
        const tipo = (s.tipo_de_usuario || s.tipo_usuario || '').toLowerCase();
        // Contar solo solicitudes hechas por PROFESORES; ignorar formularios de estudiantes
        return docente && tipo === 'profesor';
      }),
      s => s.docente
    )
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
  }, [filtered]);

  const topEstudiantes = useMemo(() => {
    const entries = groupBy(
      filtered.filter(s => {
        const tipo = (s.tipo_de_usuario || s.tipo_usuario || '').toLowerCase();
        return tipo === 'estudiante';
      }),
      s => {
        const nombre = (s.nombre_usuario && s.apellido_usuario)
          ? `${s.nombre_usuario} ${s.apellido_usuario}`
          : (s.estudiante || 'Estudiante');
        return nombre;
      }
    )
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
  }, [filtered]);

  // Estado por Servicio (barras apiladas)
  const byServicioEstado = useMemo(() => {
    const servicios = ['sala', 'videoproyector'];
    return servicios.map(srv => {
      const name = srv === 'sala' ? 'Sala' : 'Videoproyector';
      const subset = filtered.filter(s => (s.servicio || (s.id_sala ? 'sala' : 'videoproyector')) === srv);
      return {
        name,
        Aprobadas: subset.filter(s => s.estado === 'aprobada').length,
        Rechazadas: subset.filter(s => s.estado === 'rechazada').length,
      };
    });
  }, [filtered]);

  // Distribución por horas (hora de inicio)
  const byHora = useMemo(() => {
    const counts = new Array(24).fill(0);
    for (const s of filtered) {
      const hi = (s.hora_inicio || '').slice(0, 2);
      const h = Number(hi);
      if (!isNaN(h) && h >= 0 && h < 24) counts[h]++;
    }
    return counts.map((v, h) => ({ name: String(h).padStart(2, '0'), Total: v }));
  }, [filtered]);

  const handlePrint = () => {
    // Imprime solo el contenedor de reportes
    window.print();
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const resp = await solicitudesService.getAll();
      setSolicitudes(resp.data?.data || []);
      setError(null);
    } catch (e) {
      setError(handleApiError(e)?.message || 'Error actualizando');
    } finally {
      setLoading(false);
    }
  };

  const toCSV = (rows) => {
    if (!rows || rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val).replace(/"/g, '""');
      if (/[",\n]/.test(s)) return '"' + s + '"';
      return s;
    };
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => escape(r[h])).join(',')))
      .join('\n');
    return csv;
  };

  const downloadCSV = (filename, rows) => {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  const handleExportDetalle = () => {
    const rows = filtered.map(s => ({
      id: s.id_solicitud,
      fecha: formatDate(s.fecha),
      hora_inicio: s.hora_inicio,
      hora_fin: s.hora_fin,
      servicio: s.servicio || (s.id_sala ? 'sala' : 'videoproyector'),
      estado: s.estado,
      docente: s.docente || '',
      estudiante: s.estudiante || '',
      usuario_tipo: s.tipo_de_usuario || s.tipo_usuario || '',
    }));
    downloadCSV(`reporte_detalle_${range.key}dias.csv`, rows);
  };

  const handleExportResumen = () => {
    const resumen = [
      { metric: 'Total', value: filtered.length },
      { metric: 'Aprobadas', value: filtered.filter(s => s.estado === 'aprobada').length },
      { metric: 'Rechazadas', value: filtered.filter(s => s.estado === 'rechazada').length },
    ];
    // Agregar por servicio
    for (const e of byServicio) resumen.push({ metric: `Servicio: ${e.name}`, value: e.value });
    // Agregar por tipo usuario
    for (const e of byUsuario) resumen.push({ metric: `Usuario: ${e.name}`, value: e.value });
    downloadCSV(`reporte_resumen_${range.key}dias.csv`, resumen);
  };

  const handleExportExcel = () => {
    // Hoja Resumen
    const resumen = [
      { metric: 'Total', value: filtered.length },
      { metric: 'Aprobadas', value: filtered.filter(s => s.estado === 'aprobada').length },
      { metric: 'Rechazadas', value: filtered.filter(s => s.estado === 'rechazada').length },
      ...byServicio.map(e => ({ metric: `Servicio: ${e.name}`, value: e.value })),
      ...byUsuario.map(e => ({ metric: `Usuario: ${e.name}`, value: e.value })),
    ];
    const wsResumen = XLSX.utils.json_to_sheet(resumen);

    // Hoja Detalle
    const detalle = filtered.map(s => ({
      id: s.id_solicitud,
      fecha: formatDate(s.fecha),
      hora_inicio: s.hora_inicio,
      hora_fin: s.hora_fin,
      servicio: s.servicio || (s.id_sala ? 'sala' : 'videoproyector'),
      estado: s.estado,
      docente: s.docente || '',
      estudiante: s.estudiante || '',
      usuario_tipo: s.tipo_de_usuario || s.tipo_usuario || '',
    }));
    const wsDetalle = XLSX.utils.json_to_sheet(detalle);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');

    XLSX.writeFile(wb, `reporte_${range.key}dias.xlsx`);
  };

  const handleExportPDF = async () => {
    const el = document.getElementById('report-print');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth; // ajustamos a ancho de página
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight; // desplazar hacia arriba
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`reporte_${range.key}dias.pdf`);
  };

  // Métricas derivadas para KPIs
  const total = filtered.length;
  const totalAprobadas = filtered.filter(s => s.estado === 'aprobada').length;
  const totalRechazadas = filtered.filter(s => s.estado === 'rechazada').length;
  
  const approvalRate = total ? Math.round((totalAprobadas / total) * 100) : 0;
  const daysInRange = ranges.find(r => r.key === range.key)?.days || 1;
  const avgPerDay = total ? Math.round((total / daysInRange) * 10) / 10 : 0;
  const peakDay = byDia.reduce((m, d) => Math.max(m, d.Total), 0);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <style>
        {`
          @media print {
            body { background: white; }
            header, nav, .MuiAppBar-root, .MuiDrawer-root, .no-print { display: none !important; }
            #report-print { padding: 0 !important; margin: 0 !important; }
            #report-print * { box-shadow: none !important; }
          }
        `}
      </style>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }} className="no-print">
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          📊 Reportes y Analítica
        </Typography>
        <Chip label={range.label} color="primary" variant="outlined" />
        <Stack direction="row" spacing={1}>
          {ranges.map(r => (
            <Chip
              key={r.key}
              label={r.label}
              color={range.key === r.key ? 'primary' : 'default'}
              variant={range.key === r.key ? 'filled' : 'outlined'}
              onClick={() => setRange(r)}
            />
          ))}
        </Stack>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Servicio</InputLabel>
          <Select label="Servicio" value={filtroServicio} onChange={(e) => setFiltroServicio(e.target.value)}>
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="sala">Sala</MenuItem>
            <MenuItem value="videoproyector">Videoproyector</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Estado</InputLabel>
          <Select label="Estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="aprobada">Aprobadas</MenuItem>
            <MenuItem value="rechazada">Rechazadas</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Docente"
          placeholder="Buscar docente"
          value={filtroDocente}
          onChange={(e) => setFiltroDocente(e.target.value)}
          sx={{ minWidth: 220 }}
          list="docentes-list"
        />
        <datalist id="docentes-list">
          {docentesOptions.map((d, i) => (
            <option key={i} value={d} />
          ))}
        </datalist>
        <Box sx={{ flexGrow: 1 }} />
        <Button startIcon={<Refresh />} onClick={refresh} className="no-print">
          Actualizar
        </Button>
        <Button startIcon={<Download />} onClick={handleExportResumen} className="no-print">
          Exportar CSV (Resumen)
        </Button>
        <Button startIcon={<Download />} onClick={handleExportDetalle} className="no-print">
          Exportar CSV (Detalle)
        </Button>
        <Button startIcon={<Download />} onClick={handleExportExcel} className="no-print">
          Exportar Excel (Resumen+Detalle)
        </Button>
        <Button startIcon={<Download />} onClick={handleExportPDF} className="no-print">
          Descargar PDF
        </Button>
        <Button variant="contained" startIcon={<Print />} onClick={handlePrint} className="no-print">
          Imprimir
        </Button>
      </Box>

      <Box id="report-print" ref={printRef}>
        {/* Encabezado para impresión */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Universidad de La Guajira</Typography>
            <Typography variant="subtitle2" color="text.secondary">Sistema de Recursos Audiovisuales — Sede Maicao</Typography>
            <Typography variant="subtitle2" color="text.secondary">Reporte: {range.label}</Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">Generado: {new Date().toLocaleString()}</Typography>
            <Typography variant="caption" display="block" color="text.secondary">Usuario: {user?.nombre} {user?.apellido} ({user?.tipo_de_usuario})</Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* KPIs principales */}
          <Grid item xs={12} md={2} lg={2}>
            <Card>
              <CardHeader title="Total Solicitudes" />
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>{total}</Typography>
                <Typography variant="body2" color="text.secondary">en {range.label.toLowerCase()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2} lg={2}>
            <Card>
              <CardHeader title="Aprobadas" />
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>{totalAprobadas}</Typography>
                <Typography variant="body2" color="text.secondary">reservas</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2} lg={2}>
            <Card>
              <CardHeader title="Rechazadas" />
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>{totalRechazadas}</Typography>
                <Typography variant="body2" color="text.secondary">solicitudes</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={2} lg={2}>
            <Card>
              <CardHeader title="Tasa de Aprobación" />
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{approvalRate}%</Typography>
                <LinearProgress variant="determinate" value={approvalRate} sx={{ mt: 1, height: 8, borderRadius: 5 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2} lg={2}>
            <Card>
              <CardHeader title="Promedio / día" />
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{avgPerDay}</Typography>
                <Typography variant="body2" color="text.secondary">en el período</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Distribución por estado (Pie) */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader avatar={<PieChartIcon color="primary" />} title="Distribución por Estado" />
              <CardContent>
                <Box sx={{ height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={byEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {byEstado.map((entry, index) => (
                          <Cell key={`cell-estado-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Por Servicio (Pie) */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader avatar={<PieChartIcon color="secondary" />} title="Por Servicio" />
              <CardContent>
                <Box sx={{ height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={byServicio} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {byServicio.map((entry, index) => (
                          <Cell key={`cell-servicio-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Por Tipo de Usuario (Bar) */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader avatar={<BarChartIcon color="info" />} title="Por Tipo de Usuario" />
              <CardContent>
                <Box sx={{ height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={byUsuario}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1976d2" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Serie por Día (Line) */}
          <Grid item xs={12}>
            <Card>
              <CardHeader avatar={<Timeline color="action" />} title={`Tendencia diaria (${range.label})`} />
              <CardContent>
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer>
                    <LineChart data={byDia}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Total" stroke="#2e7d32" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
                <Typography variant="caption" color="text.secondary">Pico diario: {peakDay}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Estado por Servicio (Barras apiladas) */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader avatar={<BarChartIcon color="primary" />} title="Estado por Servicio" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={byServicioEstado}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Aprobadas" stackId="a" fill="#2e7d32" />
                      <Bar dataKey="Rechazadas" stackId="a" fill="#d32f2f" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Distribución por horas */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader avatar={<BarChartIcon color="secondary" />} title="Distribución por horas (inicio)" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={byHora}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="Total" fill="#1976d2" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Docentes */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Top Docentes por Reservas" />
              <CardContent>
                <Stack spacing={1}>
                  {topDocentes.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No hay datos.</Typography>
                  )}
                  {topDocentes.map((d, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={`#${d.rank}`} />
                        <Typography>{d.name}</Typography>
                      </Stack>
                      <Typography sx={{ fontWeight: 600 }}>{d.value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Resumen */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Resumen" />
              <CardContent>
                <Typography variant="body2" gutterBottom>
                  Este informe resume la actividad del sistema de reservas en el período seleccionado. Puede utilizar el botón "Imprimir" para generar una versión en papel o PDF con formato optimizado.
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={0.5}>
                  <Typography variant="body2">Periodo: {range.label}</Typography>
                  <Typography variant="body2">Total de solicitudes: {filtered.length}</Typography>
                  <Typography variant="body2">Aprobadas: {filtered.filter(s => s.estado === 'aprobada').length}</Typography>
                  <Typography variant="body2">Rechazadas: {filtered.filter(s => s.estado === 'rechazada').length}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Estudiantes */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Top Estudiantes por Reservas" />
              <CardContent>
                <Stack spacing={1}>
                  {topEstudiantes.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No hay datos.</Typography>
                  )}
                  {topEstudiantes.map((d, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={`#${d.rank}`} />
                        <Typography>{d.name}</Typography>
                      </Stack>
                      <Typography sx={{ fontWeight: 600 }}>{d.value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Fin de paneles */}
        </Grid>
      </Box>
    </Container>
  );
}
