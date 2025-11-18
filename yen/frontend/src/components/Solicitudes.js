import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Fab,
  Grid,
  Divider,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel
} from '@mui/material';
import { Tooltip } from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Visibility,
  Schedule,
  Event,
  Warning,
  Info
} from '@mui/icons-material';
import { ReceiptLong, ContentCopy, Search, Clear, Refresh, Phone, Email, ListAlt, Palette, AccessTime } from '@mui/icons-material';
import QRCode from 'qrcode';
import { 
  solicitudesService, 
  salasService,
  videoproyectoresService,
  handleApiError 
} from '../services/api';

const Solicitudes = ({ user }) => {
  // BLOQUES DE HORARIO DISPONIBLES
  const HORARIOS_DISPONIBLES = [
    { id: 1, inicio: "06:30:00", fin: "08:00:00", label: "6:30 AM - 8:00 AM" },
    { id: 2, inicio: "08:00:00", fin: "09:30:00", label: "8:00 AM - 9:30 AM" },
    { id: 3, inicio: "09:30:00", fin: "11:00:00", label: "9:30 AM - 11:00 AM" },
    { id: 4, inicio: "11:00:00", fin: "12:30:00", label: "11:00 AM - 12:30 PM" },
    { id: 5, inicio: "12:30:00", fin: "14:15:00", label: "12:30 PM - 2:15 PM" },
    { id: 6, inicio: "14:15:00", fin: "15:45:00", label: "2:15 PM - 3:45 PM" },
    { id: 7, inicio: "15:45:00", fin: "17:15:00", label: "3:45 PM - 5:15 PM" },
    { id: 8, inicio: "17:15:00", fin: "18:45:00", label: "5:15 PM - 6:45 PM" },
    { id: 9, inicio: "18:45:00", fin: "20:15:00", label: "6:45 PM - 8:15 PM" },
    { id: 10, inicio: "20:15:00", fin: "21:45:00", label: "8:15 PM - 9:45 PM" },
    // Horarios de tarde alternativos
    { id: 11, inicio: "15:00:00", fin: "16:30:00", label: "3:00 PM - 4:30 PM" },
    { id: 12, inicio: "16:30:00", fin: "18:00:00", label: "4:30 PM - 6:00 PM" },
    { id: 13, inicio: "18:00:00", fin: "19:30:00", label: "6:00 PM - 7:30 PM" },
    { id: 14, inicio: "19:30:00", fin: "21:00:00", label: "7:30 PM - 9:00 PM" }
  ];

  // Opciones de programa académicos (menú desplegable)
  const PROGRAM_OPTIONS = [
    'Ingeniería de Sistemas',
    'Administración de Empresas',
    'Contaduría Pública',
    'Negocios Internacionales',
    'Tecnología en Gestión de Comercio Internacional',
    'Trabajo Social',
    'Licenciatura en Educación Infantil'
  ];

  const [solicitudes, setSolicitudes] = useState([]);
  // Rol y servicios permitidos
  const isProfesor = user?.tipo_de_usuario === 'profesor';
  const isAdmin = user?.tipo_de_usuario === 'administrador';
  const allowedServicios = (isProfesor || isAdmin) ? ['sala', 'videoproyector'] : ['videoproyector'];
  const [salas, setSalas] = useState([]);
  const [videoproyectores, setVideoproyectores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editingSolicitud, setEditingSolicitud] = useState(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedHorarios, setSelectedHorarios] = useState([]);
  const [formValidationError, setFormValidationError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    estudiante: '',
    programa: PROGRAM_OPTIONS[0],
    tipo_actividad: '',
    numero_asistentes: '',
    asignatura: '',
    docente: '',
    semestre: '',
    celular: '',
    servicio: allowedServicios[0],
    salon: '',
    id_sala: '',
    id_videoproyector: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ celular: '', semestre: '', salon: '' });
  const [receipt, setReceipt] = useState(null);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  const [idFilter, setIdFilter] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [compactView, setCompactView] = useState(true);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text));
    } catch (e) {
      console.error('No se pudo copiar al portapapeles', e);
    }
  };

  const openReceiptFromSolicitud = (s) => {
    const recurso = s.nombre_sala
      ? { tipo: 'sala', nombre: s.nombre_sala, ubicacion: s.ubicacion || '' }
      : (s.nombre_videoproyector ? { tipo: 'videoproyector', nombre: s.nombre_videoproyector, ubicacion: s.ubicacion || '' } : null);
    setReceipt({
      id_solicitud: s.id_solicitud,
      fecha: s.fecha,
      hora_inicio: s.hora_inicio,
      hora_fin: s.hora_fin,
      servicio: s.servicio || (recurso ? recurso.tipo : 'por definir'),
      estado: s.estado || s.estado_reserva || 'pendiente',
      recurso,
      asignatura: s.asignatura || '',
      docente: s.docente || '',
      salon: s.salon || '',
      solicitante: {
        nombre: s.estudiante || '',
        programa: s.programa || '',
        semestre: s.semestre || '',
        celular: s.celular || ''
      }
    });
    setOpenReceiptDialog(true);
  };

  // Generar QR cuando cambie el recibo
  useEffect(() => {
    const gen = async () => {
      if (!receipt) { setQrDataUrl(''); return; }
      try {
        // Construir un texto legible y ordenado para el QR
        const prettyServicio = (receipt.servicio || '').toString();
        const prettyFecha = formatDate(receipt.fecha);
        const showDocente = user?.tipo_de_usuario !== 'profesor';
        const lineAsignDoc = (receipt.asignatura || (showDocente && receipt.docente))
          ? `Asignatura: ${receipt.asignatura || ''}${(showDocente && receipt.docente) ? ` — Docente: ${receipt.docente}` : ''}`
          : null;
        const lineSalon = receipt.salon ? `Salón: ${receipt.salon}` : null;
        const s = receipt.solicitante || {};
        const lineSolicitante = (s.nombre || s.programa || s.semestre || s.celular)
          ? `Solicitante: ${s.nombre || ''}${s.programa ? ` — ${s.programa}` : ''}${s.semestre ? ` (Sem ${s.semestre})` : ''}${s.celular ? ` — ${s.celular}` : ''}`
          : null;
        const r = receipt.recurso || {};
        const lineRecurso = (r.tipo || r.nombre || r.ubicacion)
          ? `Recurso: ${r.tipo || ''}${r.nombre ? ` — ${r.nombre}` : ''}${r.ubicacion ? ` — ${r.ubicacion}` : ''}`
          : null;

        // Usar el origen actual del navegador para que el enlace funcione en el puerto que esté corriendo (3000/3002/3003)
        const origin = (typeof window !== 'undefined' && window.location && window.location.origin)
          ? window.location.origin
          : 'http://localhost:3000';
        const deepLink = `Enlace: ${origin}/solicitudes?id=${receipt.id_solicitud}`;
        const humanReadable = [
          'Comprobante de Solicitud',
          `ID: ${receipt.id_solicitud}`,
          `Servicio: ${prettyServicio} — Estado: ${receipt.estado}`,
          `Fecha: ${prettyFecha}`,
          `Horario: ${receipt.hora_inicio} - ${receipt.hora_fin}`,
          lineAsignDoc,
          lineSalon,
          lineSolicitante,
          lineRecurso,
          deepLink
        ].filter(Boolean).join('\n');

        const url = await QRCode.toDataURL(humanReadable, { errorCorrectionLevel: 'M', margin: 1, scale: 6 });
        setQrDataUrl(url);
      } catch (e) { setQrDataUrl(''); }
    };
    gen();
  }, [receipt, user]);

  // Abrir automáticamente el comprobante si viene un id por query string (?id=123)
  useEffect(() => {
    if (deepLinkHandled) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const idParam = params.get('id');
      if (!idParam) return;
      const s = solicitudes.find(x => String(x.id_solicitud) === String(idParam));
      if (s) {
        openReceiptFromSolicitud(s);
        setDeepLinkHandled(true);
      }
    } catch (_) {}
  }, [solicitudes, deepLinkHandled]);
  
  // Estados para la tabla
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('fecha');
  const [order, setOrder] = useState('desc');

  // Filtro de fecha (null, 'hoy', 'manana', 'futuro', 'pasado')
  const [fechaFiltro, setFechaFiltro] = useState(null);

  // Función para clasificar la fecha de la solicitud
  const getFechaCategoria = (fecha) => {
    if (!fecha) return null;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const normalizeDate = (date) => {
      const d = (date instanceof Date) ? new Date(date) : parseFecha(date);
      if (!d || isNaN(d.getTime())) return null;
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const solicitudDate = normalizeDate(fecha);
    const todayNormalized = normalizeDate(today);
    const tomorrowNormalized = normalizeDate(tomorrow);
    if (solicitudDate.getTime() === todayNormalized.getTime()) return 'hoy';
    if (solicitudDate.getTime() === tomorrowNormalized.getTime()) return 'manana';
    if (solicitudDate > tomorrowNormalized) return 'futuro';
    if (solicitudDate < todayNormalized) return 'pasado';
    return null;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSolicitudes(),
        loadSalas(),
        loadVideoproyectores()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tick de 30s para temporizadores
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Auto-actualización suave (sin parpadeo): refresca solo la lista
  useEffect(() => {
    // SUSCRIPCIÓN EN VIVO por SSE
    const es = new EventSource('http://localhost:3001/api/solicitudes/stream');
    es.addEventListener('solicitudes:update', async () => {
      setRefreshing(true);
      await loadSolicitudes();
      setRefreshing(false);
    });
    es.onerror = () => {
      // fallback: si falla SSE, usar polling cada 20s
      const interval = setInterval(async () => {
        try {
          setRefreshing(true);
          await loadSolicitudes();
        } finally {
          setRefreshing(false);
        }
      }, 20000);
      return () => clearInterval(interval);
    };
    return () => {
      try { es.close(); } catch {}
    };
  }, []);

  const loadSolicitudes = async () => {
    try {
      let response;
      if (user.tipo_de_usuario === 'administrador') {
        response = await solicitudesService.getAll();
      } else {
        response = await solicitudesService.getByUsuario(user.id_usuario);
      }
      setSolicitudes(response.data.data);
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    }
  };

  // (sin acciones masivas de revisión)

  const loadSalas = async () => {
    try {
      const response = await salasService.getDisponibles();
      setSalas(response.data.data);
    } catch (error) {
      console.error('Error cargando salas:', error);
    }
  };

  const loadVideoproyectores = async () => {
    try {
      const response = await videoproyectoresService.getDisponibles();
      setVideoproyectores(response.data.data);
    } catch (error) {
      console.error('Error cargando videoproyectores:', error);
    }
  };

  // FUNCIONES DE VALIDACIÓN DE FECHAS Y HORARIOS
  const getCurrentWeekDates = () => {
    const now = new Date();
    const monday = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    monday.setDate(diff);
    
    const dates = [];
    for (let i = 0; i < 5; i++) { // Solo lunes a viernes
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Helper para parsear fechas en formato dd/MM/yyyy o yyyy-MM-dd (sin problemas de zona horaria)
  const parseFecha = (str) => {
    if (!str) return null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      // dd/MM/yyyy
      const [d, m, y] = str.split('/');
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      // yyyy-MM-dd -> crear fecha LOCAL para evitar desfase UTC
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    // Cualquier otro formato compatible con Date
    return new Date(str);
  };

  const isValidDate = (dateString) => {
    if (!dateString) return false;
    const selectedDate = parseFecha(dateString);
    if (!selectedDate || isNaN(selectedDate.getTime())) return false;
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentWeekDates = getCurrentWeekDates();
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false; // Domingo o sábado
    }
    // Permitir hoy
    if (selectedDate.getTime() === today.getTime()) {
      return true;
    }
    // Permitir lunes siguiente si hoy es viernes
    const todayDayOfWeek = today.getDay();
    if (todayDayOfWeek === 5) { // Hoy es viernes
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + 3); // viernes + 3 = lunes
      nextMonday.setHours(0, 0, 0, 0);
      if (selectedDate.getTime() === nextMonday.getTime()) {
        return true;
      }
    }
    // No permitir fechas pasadas
    if (selectedDate < today) {
      return false;
    }
    // Verificar que esté en la semana actual
    return currentWeekDates.some(date => 
      date.toDateString() === selectedDate.toDateString()
    );
  };

  const areConsecutiveHorarios = (horarios) => {
    if (horarios.length <= 1) return true;
    if (horarios.length > 2) return false;
    
    const sorted = horarios.sort((a, b) => a - b);
    return sorted[1] === sorted[0] + 1;
  };

  const handleHorarioChange = (horarioId) => {
    setFormValidationError('');
    
    let newSelectedHorarios;
    
    if (selectedHorarios.includes(horarioId)) {
      // Deseleccionar
      newSelectedHorarios = selectedHorarios.filter(id => id !== horarioId);
    } else {
      // Seleccionar
      if (selectedHorarios.length >= 2) {
        setFormValidationError('⚠️ Máximo 2 bloques de horario permitidos');
        return;
      }
      
      const newSelection = [...selectedHorarios, horarioId];
      
      if (!areConsecutiveHorarios(newSelection)) {
        setFormValidationError('⚠️ Los horarios deben ser consecutivos');
        return;
      }
      
      newSelectedHorarios = newSelection;
    }
    
    setSelectedHorarios(newSelectedHorarios);
    
    // Actualizar hora inicio y fin automáticamente
    if (newSelectedHorarios.length > 0) {
      const sortedHorarios = newSelectedHorarios.sort((a, b) => a - b);
      const primerHorario = HORARIOS_DISPONIBLES.find(h => h.id === sortedHorarios[0]);
      const ultimoHorario = HORARIOS_DISPONIBLES.find(h => h.id === sortedHorarios[sortedHorarios.length - 1]);
      
      setFormData(prev => ({
        ...prev,
        hora_inicio: primerHorario.inicio,
        hora_fin: ultimoHorario.fin
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        hora_inicio: '',
        hora_fin: ''
      }));
    }
  };

  const getMinDate = () => {
    // Formateo LOCAL YYYY-MM-DD para evitar que toISOString (UTC) salte al día siguiente por zona horaria
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getMaxDate = () => {
    const currentWeekDates = getCurrentWeekDates();
    const lastDay = currentWeekDates[currentWeekDates.length - 1];
    // Formateo LOCAL YYYY-MM-DD para que el límite superior no se corra por UTC
    const yyyy = lastDay.getFullYear();
    const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
    const dd = String(lastDay.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleOpenDialog = (solicitud = null) => {
    setFormValidationError('');
    setActiveStep(0);
    
    if (solicitud) {
      const mapLegacyPrograma = (p) => {
        if (!p) return PROGRAM_OPTIONS[0];
        const simple = String(p).toLowerCase();
        if (simple.includes('ingenier') && simple.includes('sistema')) return 'Ingeniería de Sistemas';
        return PROGRAM_OPTIONS.includes(p) ? p : p;
      };
      setEditingSolicitud(solicitud);
      setFormData({
        fecha: solicitud.fecha.split('T')[0],
        hora_inicio: solicitud.hora_inicio,
        hora_fin: solicitud.hora_fin,
        estudiante: solicitud.estudiante || '',
        programa: mapLegacyPrograma(solicitud.programa),
        tipo_actividad: solicitud.tipo_actividad || '',
        numero_asistentes: solicitud.numero_asistentes || '',
        asignatura: solicitud.asignatura || '',
        docente: solicitud.docente || '',
        semestre: solicitud.semestre || '',
        celular: solicitud.celular || '',
        // Si el servicio guardado no es permitido para el rol actual, forzar el permitido
        servicio: allowedServicios.includes(solicitud.servicio) ? solicitud.servicio : allowedServicios[0],
        salon: solicitud.salon,
        id_sala: solicitud.id_sala || '',
        id_videoproyector: solicitud.id_videoproyector || ''
      });
      
      // Encontrar horarios correspondientes para edición
      const horarioEncontrado = HORARIOS_DISPONIBLES.filter(h => 
        h.inicio === solicitud.hora_inicio || h.fin === solicitud.hora_fin
      );
      setSelectedHorarios(horarioEncontrado.map(h => h.id));
    } else {
      setEditingSolicitud(null);
      setSelectedHorarios([]);
      setFormData({
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        estudiante: user.nombre || '',
        programa: PROGRAM_OPTIONS[0],
        tipo_actividad: '',
        numero_asistentes: '',
        asignatura: '',
        docente: (user?.tipo_de_usuario === 'profesor') ? `${user?.nombre || ''} ${user?.apellido || ''}`.trim() : '',
        semestre: '',
        celular: '',
        servicio: allowedServicios[0],
        salon: '',
        id_sala: '',
        id_videoproyector: ''
      });
      setAcceptTerms(false);
      setAcceptTerms(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSolicitud(null);
    setSelectedHorarios([]);
    setFormValidationError('');
    setActiveStep(0);
    setAcceptTerms(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // En estudiantes, solo se permite 'videoproyector'
    if (name === 'servicio') {
      const next = allowedServicios.includes(value) ? value : allowedServicios[0];
      setFormData({
        ...formData,
        [name]: next
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Validar fecha en tiempo real
    if (name === 'fecha') {
      setFormValidationError('');
      if (value && !isValidDate(value)) {
        const selectedDate = parseFecha(value);
        if (!selectedDate || isNaN(selectedDate.getTime())) {
          setFormValidationError('❌ Fecha inválida');
          return;
        }
        selectedDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = selectedDate.getDay();
        const todayDayOfWeek = today.getDay();
        // Excepción viernes->lunes
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          setFormValidationError('❌ No se permiten sábados ni domingos');
        } else if (selectedDate < today) {
          setFormValidationError('❌ No se permiten fechas anteriores al día actual');
        } else if (selectedDate.getTime() === today.getTime()) {
          setFormValidationError('');
        } else if (todayDayOfWeek === 5) { // Hoy es viernes
          const nextMonday = new Date(today);
          nextMonday.setDate(today.getDate() + 3);
          nextMonday.setHours(0, 0, 0, 0);
          if (selectedDate.getTime() === nextMonday.getTime()) {
            setFormValidationError('');
            return;
          } else {
            setFormValidationError('❌ Solo se permiten fechas de la semana actual (lunes a viernes) y, si hoy es viernes, el lunes siguiente.');
          }
        } else {
          setFormValidationError('❌ Solo se permiten fechas de la semana actual (lunes a viernes)');
        }
      }

      // Si la fecha es HOY, limpiar horarios que ya pasaron (bloques cuyo INICIO ya ocurrió)
  const selected = parseFecha(value);
  const today = new Date();
  const selectedNorm = selected ? new Date(selected) : null;
  if (selectedNorm) selectedNorm.setHours(0,0,0,0);
  const todayNorm = new Date(today);
  todayNorm.setHours(0,0,0,0);
  const isSameDay = !!selectedNorm && selectedNorm.getTime() === todayNorm.getTime();
      if (isSameDay && selectedHorarios.length) {
        const nowTime = new Date();
        const toSeconds = (t) => {
          const [hh, mm, ss] = t.split(':').map(Number);
          return hh * 3600 + mm * 60 + (ss || 0);
        };
        const nowSec = nowTime.getHours() * 3600 + nowTime.getMinutes() * 60 + nowTime.getSeconds();
        const filtered = selectedHorarios.filter((id) => {
          const h = HORARIOS_DISPONIBLES.find(x => x.id === id);
          // Mantener solo bloques cuyo INICIO aún no ha pasado
          return h ? toSeconds(h.inicio) > nowSec : false;
        });
        if (filtered.length !== selectedHorarios.length) {
          setSelectedHorarios(filtered);
          if (filtered.length === 0) {
            setFormData(prev => ({ ...prev, hora_inicio: '', hora_fin: '' }));
          } else {
            const sorted = [...filtered].sort((a, b) => a - b);
            const h1 = HORARIOS_DISPONIBLES.find(h => h.id === sorted[0]);
            const h2 = HORARIOS_DISPONIBLES.find(h => h.id === sorted[sorted.length - 1]);
            setFormData(prev => ({ ...prev, hora_inicio: h1?.inicio || '', hora_fin: h2?.fin || '' }));
          }
        }
      }
    }
  };

  // Deshabilitar horarios que ya pasaron cuando la fecha seleccionada es HOY
  const isHorarioBloqueado = (horario) => {
    if (!formData.fecha) return true;
  const selected = parseFecha(formData.fecha);
  if (!selected || isNaN(selected.getTime())) return true;
  const today = new Date();
  const sNorm = new Date(selected); sNorm.setHours(0,0,0,0);
  const tNorm = new Date(today); tNorm.setHours(0,0,0,0);
  const sameDay = sNorm.getTime() === tNorm.getTime();
    if (!sameDay) return false; // Solo bloquear por hora si es el mismo día
    // Bloquear si el INICIO del bloque ya pasó o está en el pasado
    const [hh, mm, ss] = horario.inicio.split(':').map(Number);
    const startSeconds = hh * 3600 + mm * 60 + (ss || 0);
    const nowSeconds = (new Date()).getHours() * 3600 + (new Date()).getMinutes() * 60 + (new Date()).getSeconds();
    return startSeconds <= nowSeconds;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setFieldErrors({ celular: '', semestre: '', salon: '' });
    // Validaciones de frontend
    const salonRegex = /^[a-zA-Z0-9]{1,10}$/;
    const celularRegex = /^\d{10}$/;
    if (!salonRegex.test(formData.salon || '')) {
      setFieldErrors(prev => ({ ...prev, salon: 'Solo letras y números, máximo 10 caracteres, sin espacios' }));
      setSubmitting(false);
      return;
    }
    if (!celularRegex.test((formData.celular || '').trim())) {
      setFieldErrors(prev => ({ ...prev, celular: 'Debe contener exactamente 10 dígitos' }));
      setSubmitting(false);
      return;
    }
    if (formData.semestre && (Number(formData.semestre) < 1 || Number(formData.semestre) > 10)) {
      setFieldErrors(prev => ({ ...prev, semestre: 'Selecciona un semestre entre 1 y 10' }));
      setSubmitting(false);
      return;
    }
    
    try {
      const dataToSubmit = {
        ...formData,
        id_usuario: user.id_usuario,
        // Asignación automática en el backend: no enviamos selección manual
        id_sala: null,
        id_videoproyector: null
      };

      // Garantizar la política de rol: estudiantes solo videoproyector
      if (!isProfesor && !isAdmin) {
        dataToSubmit.servicio = 'videoproyector';
      }

      if (editingSolicitud) {
        await solicitudesService.update(editingSolicitud.id_solicitud, dataToSubmit);
      } else {
        const response = await solicitudesService.create(dataToSubmit);
        const info = response?.data?.data || {};
        // Preparar comprobante
        setReceipt({
          id_solicitud: info.id_solicitud,
          fecha: formData.fecha,
          hora_inicio: formData.hora_inicio,
          hora_fin: formData.hora_fin,
          servicio: formData.servicio,
          estado: info.estado_reserva || 'pendiente',
          recurso: info.recurso_asignado || null,
          asignatura: formData.asignatura || '',
          docente: formData.docente || '',
          salon: formData.salon || '',
          solicitante: {
            nombre: formData.estudiante || '',
            programa: formData.programa || '',
            semestre: formData.semestre || '',
            celular: formData.celular || ''
          }
        });
        setOpenReceiptDialog(true);
      }
      
      handleCloseDialog();
      loadSolicitudes();
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const d = parseFecha(dateString);
      if (!d || isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString) => {
    try {
      const d = parseFecha(dateString);
      if (!d || isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('es-ES', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return dateString; }
  };

  const toHHMM = (t) => {
    if (!t) return '--';
    const parts = t.split(':');
    return `${parts[0] || '--'}:${parts[1] || '00'}`;
  };

  const formatTimeRange = (hi, hf) => `${toHHMM(hi)} - ${toHHMM(hf)}`;

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'aprobada': return 'success';
      case 'rechazada': return 'error';
      case 'pendiente': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'aprobada': return <CheckCircle />;
      case 'rechazada': return <Cancel />;
      case 'pendiente': return <Schedule />;
      default: return null;
    }
  };

  // Función para obtener el color de fondo basado en la fecha
  const getRowBackgroundColor = (fecha) => {
    if (!fecha) return '#fafafa'; // Color por defecto para filas alternas
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Normalizar fechas para comparar solo año, mes y día
    const normalizeDate = (date) => {
      const normalized = (date instanceof Date) ? new Date(date) : parseFecha(date);
      if (!normalized || isNaN(normalized.getTime())) return new Date(NaN);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };
    
    const solicitudDate = normalizeDate(fecha);
    const todayNormalized = normalizeDate(today);
    const tomorrowNormalized = normalizeDate(tomorrow);
    
    if (solicitudDate.getTime() === todayNormalized.getTime()) {
      return '#e8f5e8'; // Verde claro para hoy
    } else if (solicitudDate.getTime() === tomorrowNormalized.getTime()) {
      return '#fff8e1'; // Amarillo claro para mañana
    } else if (solicitudDate > tomorrowNormalized) {
      return '#f3e5f5'; // Morado muy claro para fechas futuras
    } else if (solicitudDate < todayNormalized) {
      return '#f5f5f5'; // Gris claro para fechas pasadas
    }
    
    return '#fafafa'; // Color por defecto
  };

  // Funciones para el manejo de la tabla
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const sortSolicitudes = (solicitudes) => {
    return solicitudes.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];
      
      // Manejar casos especiales
      if (orderBy === 'fecha') {
        const toDateTime = (fecha, hora) => {
          const d = parseFecha(fecha);
          if (!d || isNaN(d.getTime())) return new Date(NaN);
          const [hh, mm, ss] = (hora && typeof hora === 'string' ? hora : '00:00:00').split(':').map(Number);
          d.setHours(hh || 0, mm || 0, ss || 0, 0);
          return d;
        };
        aValue = toDateTime(a.fecha, a.hora_inicio).getTime();
        bValue = toDateTime(b.fecha, b.hora_inicio).getTime();
      } else if (orderBy === 'estado') {
        aValue = a.estado || 'pendiente';
        bValue = b.estado || 'pendiente';
      }
      
      if (order === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });
  };

  // Helper: temporizador por solicitud
  const getCountdownInfo = (fecha, hora_inicio, hora_fin) => {
    try {
      const today = new Date();
      const start = new Date(fecha + 'T' + (hora_inicio?.length === 5 ? hora_inicio + ':00' : hora_inicio));
      const end = new Date(fecha + 'T' + (hora_fin?.length === 5 ? hora_fin + ':00' : hora_fin));
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
      const now = new Date();
      if (now < start) {
        const diffMin = Math.max(0, Math.ceil((start.getTime() - now.getTime()) / 60000));
        return { label: `Inicia en ${diffMin} min`, color: 'info' };
      } else if (now >= start && now < end) {
        const diffMin = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 60000));
        return { label: `Termina en ${diffMin} min`, color: 'warning' };
      } else {
        const diffMin = Math.max(0, Math.ceil((now.getTime() - end.getTime()) / 60000));
        return { label: `Finalizada hace ${diffMin} min`, color: 'default' };
      }
    } catch { return null; }
  };

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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          📋 Gestión de Solicitudes
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Sistema avanzado de reservas de recursos audiovisuales
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          📋 RESUMEN DE REGLAS DEL SISTEMA
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>📅 FECHAS:</Typography>
              <Typography variant="body2">✅ Solo días de semana (lunes a viernes)</Typography>
              <Typography variant="body2">❌ NO sábados ni domingos</Typography>
              <Typography variant="body2">❌ NO fechas pasadas</Typography>
              <Typography variant="body2">❌ NO fechas futuras (solo semana actual)</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>⏰ HORARIOS:</Typography>
              <Typography variant="body2">✅ Máximo 2 bloques de horario</Typography>
              <Typography variant="body2">✅ Solo horarios consecutivos permitidos</Typography>
              <Typography variant="body2">✅ 14 bloques de horario disponibles</Typography>
              <Typography variant="body2">✅ Rangos de 1.5 horas cada bloque</Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="📋 Todas" />
          <Tab label="✅ Aprobadas" />
          <Tab label="❌ Rechazadas" />
        </Tabs>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
          }}
        >
          Nueva Solicitud
        </Button>
      </Box>

      {/* Panel de Estadísticas */}
      {user.tipo_de_usuario === 'administrador' && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              border: '1px solid #dee2e6',
              borderLeft: '4px solid #007bff'
            }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#007bff', mb: 1 }}>
                {solicitudes.length}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Total Solicitudes
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              border: '1px solid #dee2e6',
              borderLeft: '4px solid #28a745'
            }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#28a745', mb: 1 }}>
                {solicitudes.filter(s => s.estado === 'aprobada').length}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Aprobadas
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              border: '1px solid #dee2e6',
              borderLeft: '4px solid #dc3545'
            }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#dc3545', mb: 1 }}>
                {solicitudes.filter(s => s.estado === 'rechazada').length}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Rechazadas
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      

      {/* Tabla de Solicitudes */}
      <Paper sx={{ 
        mt: 2, 
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        borderRadius: 2
      }}>
        <Box sx={{ 
          p: 2, 
          backgroundColor: 'primary.main', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ListAlt />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Gestión de Solicitudes
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              label="Filtrar por ID"
              value={idFilter}
              onChange={(e) => setIdFilter(e.target.value.replace(/\D+/g, ''))}
              InputProps={{
                startAdornment: <Search fontSize="small" />, 
                endAdornment: (
                  <IconButton size="small" onClick={() => setIdFilter('')} sx={{ color: 'inherit' }}>
                    <Clear fontSize="small" />
                  </IconButton>
                )
              }}
              sx={{ minWidth: 180, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}
            />
            {/* Leyenda compacta dentro del encabezado (chips clicables) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1, pr: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.10)' }}>
              <Palette fontSize="small" />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Código:</Typography>
              <Chip
                size="small"
                label="Hoy"
                clickable
                onClick={() => setFechaFiltro(fechaFiltro === 'hoy' ? null : 'hoy')}
                sx={{
                  bgcolor: '#e8f5e8',
                  border: `2px solid ${fechaFiltro === 'hoy' ? '#2e7d32' : '#4caf50'}`,
                  color: '#2e7d32',
                  height: 24
                }}
              />
              <Chip
                size="small"
                label="Mañana"
                clickable
                onClick={() => setFechaFiltro(fechaFiltro === 'manana' ? null : 'manana')}
                sx={{
                  bgcolor: '#fff8e1',
                  border: `2px solid ${fechaFiltro === 'manana' ? '#ef6c00' : '#ff9800'}`,
                  color: '#ef6c00',
                  height: 24
                }}
              />
              <Chip
                size="small"
                label="Futuro"
                clickable
                onClick={() => setFechaFiltro(fechaFiltro === 'futuro' ? null : 'futuro')}
                sx={{
                  bgcolor: '#f3e5f5',
                  border: `2px solid ${fechaFiltro === 'futuro' ? '#7b1fa2' : '#9c27b0'}`,
                  color: '#7b1fa2',
                  height: 24
                }}
              />
              <Chip
                size="small"
                label="Pasado"
                clickable
                onClick={() => setFechaFiltro(fechaFiltro === 'pasado' ? null : 'pasado')}
                sx={{
                  bgcolor: '#f5f5f5',
                  border: `2px solid ${fechaFiltro === 'pasado' ? '#424242' : '#757575'}`,
                  color: '#424242',
                  height: 24
                }}
              />
            </Box>
            {/* Vista compacta fija: se mantiene activada por defecto y ocultamos el botón de densidad */}
            <Chip
              size="small"
              icon={<ListAlt />}
              label={`${solicitudes.filter(s => (tabValue===0) ? true : (tabValue===1 ? s.estado==='aprobada' : s.estado==='rechazada')).length} registros`}
              sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white' }}
            />
            
            <IconButton
              size="small"
              onClick={async () => { setRefreshing(true); await loadSolicitudes(); setRefreshing(false); }}
              sx={{ color: 'inherit' }}
              title="Actualizar"
            >
              <Refresh fontSize="small" />
            </IconButton>
            {refreshing && <CircularProgress size={16} sx={{ color: 'white' }} />}
          </Box>
        </Box>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table sx={{ minWidth: 650 }} stickyHeader size={compactView ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '0.9rem', minWidth: 80 }}>
                  <TableSortLabel
                    active={orderBy === 'id_solicitud'}
                    direction={orderBy === 'id_solicitud' ? order : 'asc'}
                    onClick={() => handleRequestSort('id_solicitud')}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '0.9rem', minWidth: 240 }}>
                  <TableSortLabel
                    active={orderBy === 'fecha'}
                    direction={orderBy === 'fecha' ? order : 'asc'}
                    onClick={() => handleRequestSort('fecha')}
                  >
                    Fecha y Hora
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '0.9rem', minWidth: 220 }}>
                  Estudiante
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '0.9rem', minWidth: 200 }}>
                  Asignatura
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '0.9rem', minWidth: 160 }}>
                  Docente
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '0.9rem', minWidth: 120 }}>
                  Salón
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '0.9rem', minWidth: 160 }}>
                  Servicio
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '0.9rem', minWidth: 120 }}>
                  <TableSortLabel
                    active={orderBy === 'estado'}
                    direction={orderBy === 'estado' ? order : 'asc'}
                    onClick={() => handleRequestSort('estado')}
                  >
                    Estado
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '0.9rem', minWidth: 140, position: 'sticky', right: 0, zIndex: 3 }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortSolicitudes(
                solicitudes.filter(solicitud => {
                  // Filtro por pestaña de estado (sin 'pendientes')
                  if (tabValue === 1 && solicitud.estado !== 'aprobada') return false;
                  if (tabValue === 2 && solicitud.estado !== 'rechazada') return false;
                  // Filtro por fecha
                  if (fechaFiltro) {
                    return getFechaCategoria(solicitud.fecha) === fechaFiltro;
                  }
                  // Filtro por ID
                  if (idFilter) {
                    return String(solicitud.id_solicitud) === idFilter;
                  }
                  return true;
                })
              )
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((solicitud, idx) => (
                <TableRow 
                  key={solicitud.id_solicitud}
                  sx={{ 
                    backgroundColor: (() => { const rowBg = getRowBackgroundColor(solicitud.fecha); return rowBg === '#fafafa' ? (idx % 2 === 0 ? '#fcfcfc' : '#f9f9f9') : rowBg; })(),
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 26px, rgba(0,0,0,0.02) 26px, rgba(0,0,0,0.02) 52px)',
                      '&:hover': { backgroundColor: '#e3f2fd !important' },
                    cursor: 'pointer',
                    height: compactView ? 56 : 80,
                    transition: 'background-color 0.2s ease',
                    borderBottom: '1px solid #eee'
                  }}
                  onClick={() => {
                    setSelectedSolicitud(solicitud);
                    setOpenDetailDialog(true);
                  }}
                >
                  <TableCell sx={{ borderLeft: '3px solid', borderLeftColor: getStatusColor(solicitud.estado) === 'success' ? '#28a745' : getStatusColor(solicitud.estado) === 'error' ? '#dc3545' : '#ffc107' }}>
                    <Chip 
                      label={`#${solicitud.id_solicitud}`} 
                      size="small" 
                      variant="outlined" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: '#495057', 
                        borderColor: '#6c757d',
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {compactView ? formatDateShort(solicitud.fecha) : formatDate(solicitud.fecha)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {formatTimeRange(solicitud.hora_inicio, solicitud.hora_fin)}
                      </Typography>
                      {(() => {
                        const cd = getCountdownInfo(solicitud.fecha, solicitud.hora_inicio, solicitud.hora_fin);
                        return cd ? (
                          <Chip
                            size="small"
                            label={cd.label}
                            color={cd.color}
                            icon={<Schedule fontSize="small" />}
                            sx={{ alignSelf: 'flex-start' }}
                          />
                        ) : null;
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#212529' }}>
                        {solicitud.estudiante || 'Sin estudiante'}
                      </Typography>
                      {compactView ? (
                        solicitud.celular ? (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Phone fontSize="inherit" /> {solicitud.celular}
                          </Typography>
                        ) : null
                      ) : (
                        <>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Email fontSize="inherit" /> {solicitud.correo_electronico || 'Sin correo'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Tel: {solicitud.celular || 'No disponible'}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#212529' }}>
                        {solicitud.asignatura || 'Sin asignatura'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {solicitud.programa || 'Sin programa'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 160 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#212529' }}>
                        {solicitud.docente || 'Sin docente'}
                      </Typography>
                      {!compactView && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Semestre: {solicitud.semestre || '--'}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 140 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#212529' }}>
                        {solicitud.salon || 'Sin salón'}
                      </Typography>
                      {!compactView && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Capacidad: {solicitud.capacidad || '--'} personas
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 180 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      <Chip
                        variant="outlined"
                        size="small"
                        color="primary"
                        label={solicitud.nombre_sala ? 'Sala' : solicitud.nombre_videoproyector ? 'Videoproyector' : 'Por asignar'}
                        sx={{ alignSelf: 'flex-start' }}
                      />
                      {(solicitud.nombre_sala || solicitud.nombre_videoproyector) && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {solicitud.nombre_sala || solicitud.nombre_videoproyector}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(solicitud.estado)}
                      label={solicitud.estado ? solicitud.estado.toUpperCase() : 'PENDIENTE'}
                      color={getStatusColor(solicitud.estado)}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        minWidth: 90,
                        textTransform: 'capitalize'
                      }}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} sx={{ position: 'sticky', right: 0, backgroundColor: '#ffffff', zIndex: 2, borderLeft: '1px solid #eee' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Copiar ID">
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(solicitud.id_solicitud)}
                          sx={{ color: 'success.main' }}
                        >
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Comprobante">
                        <IconButton
                          size="small"
                          onClick={() => openReceiptFromSolicitud(solicitud)}
                          sx={{ color: 'secondary.main' }}
                        >
                          <ReceiptLong />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedSolicitud(solicitud);
                            setOpenDetailDialog(true);
                          }}
                          sx={{ color: 'primary.main' }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      {(user.tipo_de_usuario === 'administrador' || 
                        solicitud.id_usuario === user.id_usuario) && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(solicitud)}
                            sx={{ color: 'warning.main' }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Paginación */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={solicitudes
            .filter(solicitud => {
              if (tabValue === 0) return true;
              if (tabValue === 1) return solicitud.estado === 'aprobada';
              if (tabValue === 2) return solicitud.estado === 'rechazada';
              return true;
            }).length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <Add />
      </Fab>

      {/* Dialog principal mejorado */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, minHeight: '70vh' } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Event />
            {editingSolicitud ? '✏️ Editar Solicitud' : '➕ Nueva Solicitud'}
          </DialogTitle>
          
          <DialogContent dividers sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {/* PASO 1: FECHA */}
              <Step>
                <StepLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Event color="primary" />
                    <Typography variant="h6">Seleccionar Fecha</Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      📅 <strong>FECHAS VÁLIDAS:</strong> Solo días de semana (lunes a viernes) de la semana actual
                    </Alert>
                    
                    <TextField
                      name="fecha"
                      label="Fecha de la Solicitud"
                      type="date"
                      fullWidth
                      required
                      value={formData.fecha}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: getMinDate(),
                        max: getMaxDate()
                      }}
                      sx={{ mb: 2 }}
                      helperText="Solo se permiten fechas de lunes a viernes de la semana actual"
                    />
                    
                    {formValidationError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {formValidationError}
                      </Alert>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button 
                        variant="contained" 
                        onClick={() => setActiveStep(1)}
                        disabled={!formData.fecha || !isValidDate(formData.fecha)}
                      >
                        Siguiente: Horarios
                      </Button>
                    </Box>
                  </Box>
                </StepContent>
              </Step>

              {/* PASO 2: HORARIOS */}
              <Step>
                <StepLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule color="primary" />
                    <Typography variant="h6">Seleccionar Horarios</Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      ⏰ <strong>REGLAS:</strong> Máximo 2 bloques consecutivos • Cada bloque = 1.5 horas
                    </Alert>

                    {/* Mañana */}
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      🌅 Horarios de Mañana
                    </Typography>
                    <Paper elevation={2} sx={{ p: 2, mb: 2, background: 'linear-gradient(180deg,#f8fbff 0%, #f3f6fa 100%)', borderRadius: 3, border: '1px solid #e9ecef' }}>
                      <FormGroup>
                        {HORARIOS_DISPONIBLES.slice(0, 5).map((horario) => {
                          const disabled = isHorarioBloqueado(horario) || !isValidDate(formData.fecha);
                          const selected = selectedHorarios.includes(horario.id);
                          return (
                            <FormControlLabel
                              key={horario.id}
                              control={
                                <Checkbox
                                  checked={selected}
                                  onChange={() => handleHorarioChange(horario.id)}
                                  disabled={disabled}
                                  color="primary"
                                  sx={{
                                    '&.Mui-disabled': { color: 'rgba(0,0,0,0.26)' }
                                  }}
                                />
                              }
                              label={
                                <Box sx={{
                                  display: 'flex', alignItems: 'center', gap: 1,
                                  px: 1.2, py: 0.6,
                                  borderRadius: 2,
                                  bgcolor: selected ? 'primary.light' : 'transparent',
                                  color: selected ? 'primary.contrastText' : 'inherit',
                                  transition: 'all .15s ease',
                                  border: '1px solid',
                                  borderColor: selected ? 'primary.main' : 'rgba(0,0,0,0.08)'
                                }}>
                                  <AccessTime fontSize="small" />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{horario.label}</Typography>
                                </Box>
                              }
                              sx={{ width: '100%', mb: 1, mx: 0 }}
                            />
                          );
                        })}
                      </FormGroup>
                    </Paper>

                    {/* Tarde Opción A */}
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      🌆 Horarios de Tarde - Opción A
                    </Typography>
                    <Paper elevation={2} sx={{ p: 2, mb: 2, background: 'linear-gradient(180deg,#fff7ed 0%, #fff2df 100%)', borderRadius: 3, border: '1px solid #ffe8c2' }}>
                      <FormGroup>
                        {HORARIOS_DISPONIBLES.slice(5, 10).map((horario) => {
                          const disabled = isHorarioBloqueado(horario) || !isValidDate(formData.fecha);
                          const selected = selectedHorarios.includes(horario.id);
                          return (
                            <FormControlLabel
                              key={horario.id}
                              control={
                                <Checkbox
                                  checked={selected}
                                  onChange={() => handleHorarioChange(horario.id)}
                                  disabled={disabled}
                                  color="warning"
                                  sx={{ '&.Mui-disabled': { color: 'rgba(0,0,0,0.26)' } }}
                                />
                              }
                              label={
                                <Box sx={{
                                  display: 'flex', alignItems: 'center', gap: 1,
                                  px: 1.2, py: 0.6,
                                  borderRadius: 2,
                                  bgcolor: selected ? 'warning.light' : 'transparent',
                                  color: selected ? '#000' : 'inherit',
                                  transition: 'all .15s ease',
                                  border: '1px solid',
                                  borderColor: selected ? 'warning.main' : 'rgba(0,0,0,0.08)'
                                }}>
                                  <AccessTime fontSize="small" />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{horario.label}</Typography>
                                </Box>
                              }
                              sx={{ width: '100%', mb: 1, mx: 0 }}
                            />
                          );
                        })}
                      </FormGroup>
                    </Paper>

                    {/* Tarde Opción B */}
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                      🌙 Horarios de Tarde - Opción B
                    </Typography>
                    <Paper elevation={2} sx={{ p: 2, mb: 2, background: 'linear-gradient(180deg,#faf5ff 0%, #f4e8ff 100%)', borderRadius: 3, border: '1px solid #ead7ff' }}>
                      <FormGroup>
                        {HORARIOS_DISPONIBLES.slice(10, 14).map((horario) => {
                          const disabled = isHorarioBloqueado(horario) || !isValidDate(formData.fecha);
                          const selected = selectedHorarios.includes(horario.id);
                          return (
                            <FormControlLabel
                              key={horario.id}
                              control={
                                <Checkbox
                                  checked={selected}
                                  onChange={() => handleHorarioChange(horario.id)}
                                  disabled={disabled}
                                  color="secondary"
                                  sx={{ '&.Mui-disabled': { color: 'rgba(0,0,0,0.26)' } }}
                                />
                              }
                              label={
                                <Box sx={{
                                  display: 'flex', alignItems: 'center', gap: 1,
                                  px: 1.2, py: 0.6,
                                  borderRadius: 2,
                                  bgcolor: selected ? 'secondary.light' : 'transparent',
                                  color: selected ? 'secondary.contrastText' : 'inherit',
                                  transition: 'all .15s ease',
                                  border: '1px solid',
                                  borderColor: selected ? 'secondary.main' : 'rgba(0,0,0,0.08)'
                                }}>
                                  <AccessTime fontSize="small" />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{horario.label}</Typography>
                                </Box>
                              }
                              sx={{ width: '100%', mb: 1, mx: 0 }}
                            />
                          );
                        })}
                      </FormGroup>
                    </Paper>

                    {selectedHorarios.length > 0 && (
                      <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                        ✅ <strong>Horario seleccionado:</strong> {formData.hora_inicio} - {formData.hora_fin}
                        <br />
                        📊 <strong>Bloques:</strong> {selectedHorarios.length}/2
                      </Alert>
                    )}

                    {formValidationError && (
                      <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {formValidationError}
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button onClick={() => setActiveStep(0)}>
                        Volver
                      </Button>
                      <Button 
                        variant="contained" 
                        onClick={() => setActiveStep(2)}
                        disabled={selectedHorarios.length === 0}
                      >
                        Siguiente: Detalles
                      </Button>
                    </Box>
                  </Box>
                </StepContent>
              </Step>

              {/* PASO 3: DETALLES */}
              <Step>
                <StepLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info color="primary" />
                    <Typography variant="h6">Información Adicional</Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth sx={{ mb: 1 }}>
                        <InputLabel>Tipo de Servicio</InputLabel>
                        <Select
                          name="servicio"
                          value={formData.servicio}
                          onChange={handleChange}
                          label="Tipo de Servicio"
                          disabled={allowedServicios.length === 1}
                        >
                          {allowedServicios.includes('sala') && (
                            <MenuItem value="sala">🏢 Sala</MenuItem>
                          )}
                          {allowedServicios.includes('videoproyector') && (
                            <MenuItem value="videoproyector">📽️ Videoproyector</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      {!isProfesor && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          Por tu rol (estudiante), solo puedes solicitar Videoproyector.
                        </Typography>
                      )}
                    </Grid>

                    {/* Asignación automática: mostramos aviso en lugar de selección manual */}
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        La asignación del recurso será automática al enviar la solicitud. 
                        Elegiste: <strong>{formData.servicio === 'sala' ? 'Sala' : 'Videoproyector'}</strong>. 
                        El sistema buscará disponibilidad en el horario seleccionado y aprobará automáticamente si hay cupo.
                      </Alert>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="asignatura"
                        label="Asignatura"
                        fullWidth
                        required
                        value={formData.asignatura}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Programa</InputLabel>
                        <Select
                          name="programa"
                          label="Programa"
                          value={PROGRAM_OPTIONS.includes(formData.programa) ? formData.programa : PROGRAM_OPTIONS[0]}
                          onChange={handleChange}
                        >
                          {PROGRAM_OPTIONS.map(opt => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="salon"
                        label="Salón (sin espacios)"
                        fullWidth
                        required
                        value={formData.salon}
                        onChange={(e) => {
                          // Eliminar espacios, limitar a 10 chars alfanuméricos
                          const v = e.target.value.replace(/\s+/g, '').slice(0, 10);
                          setFormData(prev => ({ ...prev, salon: v }));
                          const ok = /^[a-zA-Z0-9]{1,10}$/.test(v);
                          setFieldErrors(prev => ({ ...prev, salon: ok ? '' : 'Solo letras y números, máx 10, sin espacios' }));
                        }}
                        error={Boolean(fieldErrors.salon)}
                        helperText={fieldErrors.salon || 'Ej: 4A, 3B, LAB1'}
                        inputProps={{ maxLength: 10 }}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    {user?.tipo_de_usuario !== 'profesor' && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="docente"
                          label="Docente"
                          fullWidth
                          value={formData.docente}
                          onChange={handleChange}
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="tipo_actividad"
                        label="Tipo de actividad"
                        fullWidth
                        value={formData.tipo_actividad}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth sx={{ mb: 2 }} error={Boolean(fieldErrors.semestre)}>
                        <InputLabel>Semestre</InputLabel>
                        <Select
                          name="semestre"
                          label="Semestre"
                          value={String(formData.semestre || '')}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFormData(prev => ({ ...prev, semestre: v }));
                            const n = Number(v);
                            setFieldErrors(prev => ({ ...prev, semestre: (!v || (n >= 1 && n <= 10)) ? '' : 'Selecciona entre 1 y 10' }));
                          }}
                        >
                          {[...Array(10)].map((_, i) => (
                            <MenuItem key={i+1} value={String(i+1)}>{i+1}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="celular"
                        label="Número de Celular (10 dígitos)"
                        fullWidth
                        value={formData.celular}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D+/g, '').slice(0, 10);
                          setFormData(prev => ({ ...prev, celular: digits }));
                          setFieldErrors(prev => ({ ...prev, celular: /^\d{10}$/.test(digits) ? '' : 'Debe contener exactamente 10 dígitos' }));
                        }}
                        error={Boolean(fieldErrors.celular)}
                        helperText={fieldErrors.celular || ''}
                        inputProps={{ inputMode: 'numeric', pattern: '\\d*', maxLength: 10 }}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="numero_asistentes"
                        label="Número de asistentes"
                        fullWidth
                        value={formData.numero_asistentes}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f9f9f9', border: '1px solid #eee' }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                          Declaro que acepto las condiciones de préstamo de los recursos solicitados y me comprometo a devolverlos en las mismas condiciones en que fueron entregados. Cualquier anomalía o daño ocurrido durante el tiempo de uso será reportado y asumiré la responsabilidad correspondiente, sin causar perjuicio a la institución.
                        </Typography>
                        <FormControlLabel
                          control={<Checkbox checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />}
                          label="He leído y acepto las condiciones de préstamo"
                          sx={{ mt: 1 }}
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button onClick={() => setActiveStep(1)}>
                      Volver
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={submitting || selectedHorarios.length === 0 || !formData.fecha || !acceptTerms}
              startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              {submitting ? 'Guardando...' : (editingSolicitud ? 'Actualizar' : 'Crear Solicitud')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Comprobante de la solicitud */}
      <Dialog
        open={openReceiptDialog && Boolean(receipt)}
        onClose={() => setOpenReceiptDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>🧾 Comprobante de Solicitud</DialogTitle>
        <DialogContent>
          {receipt && (
            <Box sx={{ p: 1 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>ID de Solicitud: <strong>{receipt.id_solicitud}</strong></Typography>
              <Divider sx={{ my: 1 }} />
              <Typography>Fecha: <strong>{formatDate(receipt.fecha)}</strong></Typography>
              <Typography>Horario: <strong>{receipt.hora_inicio} - {receipt.hora_fin}</strong></Typography>
              {(() => {
                const cd = getCountdownInfo(receipt.fecha, receipt.hora_inicio, receipt.hora_fin);
                return cd ? (
                  <Chip
                    size="small"
                    label={cd.label}
                    color={cd.color}
                    icon={<Schedule fontSize="small" />}
                    sx={{ mt: 0.5 }}
                  />
                ) : null;
              })()}
              <Typography>Servicio: <strong>{receipt.servicio}</strong></Typography>
              <Typography>Estado: <strong>{receipt.estado}</strong></Typography>
              {(receipt.asignatura || (user?.tipo_de_usuario !== 'profesor' && receipt.docente)) && (
                <Typography>
                  Asignatura: <strong>{receipt.asignatura}</strong>
                  {(user?.tipo_de_usuario !== 'profesor' && receipt.docente) ? (
                    <>
                      {` — Docente: `}
                      <strong>{receipt.docente}</strong>
                    </>
                  ) : null}
                </Typography>
              )}
              {receipt.salon && (
                <Typography>Salón: <strong>{receipt.salon}</strong></Typography>
              )}
              {receipt.solicitante && (
                <Typography>Solicitante: <strong>{receipt.solicitante.nombre}</strong>{receipt.solicitante.programa ? ` — ${receipt.solicitante.programa}` : ''}{receipt.solicitante.semestre ? ` (Sem ${receipt.solicitante.semestre})` : ''}{receipt.solicitante.celular ? ` — ${receipt.solicitante.celular}` : ''}</Typography>
              )}
              {receipt.recurso && (
                <Box sx={{ mt: 1 }}>
                  <Typography>Recurso asignado: <strong>{receipt.recurso.tipo}</strong></Typography>
                  <Typography>Nombre: <strong>{receipt.recurso.nombre}</strong></Typography>
                  <Typography>Ubicación: <strong>{receipt.recurso.ubicacion}</strong></Typography>
                </Box>
              )}
              {qrDataUrl && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img src={qrDataUrl} alt="QR" width={128} height={128} />
                  <Typography variant="body2" color="text.secondary">
                    Este código incluye el ID y detalles clave del servicio (fecha, hora, solicitante y recurso) para validar rápidamente.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            if (!receipt) return;
            const text = `ID: ${receipt.id_solicitud} | ${receipt.servicio} | ${receipt.fecha} ${receipt.hora_inicio}-${receipt.hora_fin}`;
            navigator.clipboard?.writeText(text);
          }}>Copiar ID</Button>
          <Button variant="contained" onClick={() => {
            if (!receipt) return;
            const w = window.open('', '_blank');
            if (!w) return;
            const imgUrl = qrDataUrl || '';
            const showDocente = user?.tipo_de_usuario !== 'profesor';
            w.document.write(`<html><head><title>Comprobante</title></head><body>` +
              `<h2>Comprobante de Solicitud</h2>` +
              `<p><strong>ID:</strong> ${receipt.id_solicitud}</p>` +
              `<p><strong>Servicio:</strong> ${receipt.servicio}</p>` +
              `<p><strong>Fecha:</strong> ${formatDate(receipt.fecha)}</p>` +
              `<p><strong>Horario:</strong> ${receipt.hora_inicio} - ${receipt.hora_fin}</p>` +
              (receipt.asignatura || (showDocente && receipt.docente) ? `<p><strong>Asignatura:</strong> ${receipt.asignatura || ''}${(showDocente && receipt.docente) ? ` — <strong>Docente:</strong> ${receipt.docente}` : ''}</p>` : '') +
              (receipt.salon ? `<p><strong>Salón:</strong> ${receipt.salon}</p>` : '') +
              (receipt.solicitante ? `<p><strong>Solicitante:</strong> ${receipt.solicitante.nombre || ''}${receipt.solicitante.programa ? ` — ${receipt.solicitante.programa}` : ''}${receipt.solicitante.semestre ? ` (Sem ${receipt.solicitante.semestre})` : ''}${receipt.solicitante.celular ? ` — ${receipt.solicitante.celular}` : ''}</p>` : '') +
              (receipt.recurso ? `<p><strong>Recurso:</strong> ${receipt.recurso.tipo} - ${receipt.recurso.nombre} (${receipt.recurso.ubicacion||''})</p>` : '') +
              (imgUrl ? `<img src="${imgUrl}" alt="QR" style="margin-top:10px;"/>` : '') +
              `</body></html>`);
            w.document.close();
            w.print();
          }}>Imprimir</Button>
          <Button onClick={() => {
            try {
              const url = qrDataUrl;
              if (!url) return;
              const a = document.createElement('a');
              a.href = url;
              a.download = `QR-Solicitud-${receipt?.id_solicitud}.png`;
              a.click();
            } catch {}
          }}>Descargar QR</Button>
          <Button onClick={() => setOpenReceiptDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de detalles */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📋 Detalles de la Solicitud</DialogTitle>
        <DialogContent>
          {selectedSolicitud && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">ID de Solicitud:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>#{selectedSolicitud.id_solicitud}</Typography>
                  <IconButton size="small" onClick={() => copyToClipboard(selectedSolicitud.id_solicitud)}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Fecha:</Typography>
                <Typography>{formatDate(selectedSolicitud.fecha)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Horario:</Typography>
                <Typography>{selectedSolicitud.hora_inicio} - {selectedSolicitud.hora_fin}</Typography>
                {(() => {
                  const cd = getCountdownInfo(selectedSolicitud.fecha, selectedSolicitud.hora_inicio, selectedSolicitud.hora_fin);
                  return cd ? (
                    <Chip
                      size="small"
                      label={cd.label}
                      color={cd.color}
                      icon={<Schedule fontSize="small" />}
                      sx={{ mt: 0.5 }}
                    />
                  ) : null;
                })()}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Estado:</Typography>
                <Chip
                  icon={getStatusIcon(selectedSolicitud.estado)}
                  label={selectedSolicitud.estado ? selectedSolicitud.estado.toUpperCase() : 'PENDIENTE'}
                  color={getStatusColor(selectedSolicitud.estado)}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Solicitudes;