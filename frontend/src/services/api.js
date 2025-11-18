import axios from 'axios';
import { getAccessTokenSync } from './authToken';
import { setupQueueProcessor, cacheList } from './offlineQueue';

// Configuración base de Axios
// Permite configurar la URL de la API vía variables de entorno para entornos Android/Producción
// Ejemplos:
// - Desarrollo web: REACT_APP_API_URL=http://localhost:3001/api
// - Emulador Android: REACT_APP_API_URL=http://10.0.2.2:3001/api
// - Dispositivo físico: REACT_APP_API_URL=http://<IP_LAN_PC>:3001/api
// Normalizar BASE_URL: garantizar sufijo /api aunque la variable venga sin él
const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
export const API_BASE_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : RAW_API_URL.replace(/\/$/, '') + '/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/?api$/, '');
if (process.env.NODE_ENV !== 'production') {
    console.log('[API] Base URL:', API_BASE_URL);
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 segundos
});

// Inicializar procesador de cola offline
setupQueueProcessor(api);

// Interceptor para logs de requests (silenciado en producción para mejorar rendimiento)
api.interceptors.request.use(
    (config) => {
        const token = getAccessTokenSync();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (process.env.NODE_ENV !== 'production' && process.env.REACT_APP_DEBUG !== 'false') {
            console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
    },
    (error) => {
        if (process.env.NODE_ENV !== 'production' && process.env.REACT_APP_DEBUG !== 'false') {
            console.error('❌ Request Error:', error);
        }
        return Promise.reject(error);
    }
);

// Interceptor para manejo de respuestas
api.interceptors.response.use(
    (response) => {
        if (process.env.NODE_ENV !== 'production' && process.env.REACT_APP_DEBUG !== 'false') {
            console.log(`✅ Response ${response.status}:`, response.config.url);
        }
        return response;
    },
    (error) => {
        if (process.env.NODE_ENV !== 'production' && process.env.REACT_APP_DEBUG !== 'false') {
            console.error('❌ Response Error:', error.response?.data || error.message);
        }
        return Promise.reject(error);
    }
);

// Servicios para Usuarios
export const usuariosService = {
    // Obtener todos los usuarios
    getAll: () => api.get('/usuarios'),
    
    // Obtener usuario por ID
    getById: (id) => api.get(`/usuarios/${id}`),
    
    // Crear usuario
    create: (userData) => api.post('/usuarios', userData),
    
    // Actualizar usuario
    update: (id, userData) => api.put(`/usuarios/${id}`, userData),
    
    // Eliminar usuario
    delete: (id) => api.delete(`/usuarios/${id}`),
    
    // Login
    login: (credentials) => api.post('/usuarios/login', credentials),
};

// Servicios para Salas
export const salasService = {
    // Obtener todas las salas
    getAll: () => api.get('/salas'),
    
    // Obtener salas disponibles
    getDisponibles: () => api.get('/salas/disponibles'),
    
    // Obtener sala por ID
    getById: (id) => api.get(`/salas/${id}`),
    
    // Crear sala
    create: (salaData) => api.post('/salas', salaData),
    
    // Actualizar sala
    update: (id, salaData) => api.put(`/salas/${id}`, salaData),
    
    // Eliminar sala
    delete: (id) => api.delete(`/salas/${id}`),
    
    // Cambiar estado
    cambiarEstado: (id, estado) => api.patch(`/salas/${id}/estado`, { estado }),
};

// Servicios para Videoproyectores
export const videoproyectoresService = {
    // Obtener todos los videoproyectores (acepta params opcionales: { fecha, hi, hf })
    getAll: (params) => api.get('/videoproyectores', { params }),
    
    // Obtener videoproyectores disponibles
    getDisponibles: () => api.get('/videoproyectores/disponibles'),
    
    // Obtener videoproyector por ID
    getById: (id) => api.get(`/videoproyectores/${id}`),
    
    // Crear videoproyector
    create: (proyectorData) => api.post('/videoproyectores', proyectorData),
    
    // Actualizar videoproyector
    update: (id, proyectorData) => api.put(`/videoproyectores/${id}`, proyectorData),
    
    // Eliminar videoproyector
    delete: (id) => api.delete(`/videoproyectores/${id}`),
    
    // Cambiar estado
    cambiarEstado: (id, estado) => api.patch(`/videoproyectores/${id}/estado`, { estado }),
};

// Servicios para Equipos (nuevos recursos)
export const equiposService = {
    // Obtener todos los equipos (opcional { tipo })
    getAll: (params) => api.get('/equipos', { params }),

    // Obtener equipos disponibles (opcional { tipo })
    getDisponibles: (params) => api.get('/equipos/disponibles', { params }),

    // Obtener por ID
    getById: (id) => api.get(`/equipos/${id}`),

    // Crear
    create: (data) => api.post('/equipos', data),

    // Actualizar
    update: (id, data) => api.put(`/equipos/${id}`, data),

    // Eliminar
    delete: (id) => api.delete(`/equipos/${id}`),

    // Cambiar estado
    cambiarEstado: (id, estado) => api.patch(`/equipos/${id}/estado`, { estado }),
};

// Servicios para Solicitudes
// Función helper para mapear datos de solicitudes
const mapSolicitudData = (solicitud) => {
    let estado = solicitud.estado_reserva || solicitud.estado || 'pendiente';
    
    // Mapear valores de estado para consistencia
    if (estado === 'aprobado') estado = 'aprobada';
    if (estado === 'rechazado') estado = 'rechazada';
    if (estado === 'anulado') estado = 'anulada';
    
    return {
        ...solicitud,
        estado: estado
    };
};

export const solicitudesService = {
    // Obtener todas las solicitudes
    getAll: async () => {
        const response = await api.get('/solicitudes');
        if (response.data.success && response.data.data) {
            response.data.data = response.data.data.map(mapSolicitudData);
            // Cachear lista para acceso offline
            cacheList('/solicitudes', response.data.data);
        }
        return response;
    },
    
    // Obtener solicitudes por usuario
    getByUsuario: async (userId) => {
        const response = await api.get(`/solicitudes/usuario/${userId}`);
        if (response.data.success && response.data.data) {
            response.data.data = response.data.data.map(mapSolicitudData);
            cacheList(`/solicitudes/usuario/${userId}`, response.data.data);
        }
        return response;
    },
    
    // Obtener solicitudes por estado
    getByEstado: async (estado) => {
        const response = await api.get(`/solicitudes/estado/${estado}`);
        if (response.data.success && response.data.data) {
            response.data.data = response.data.data.map(mapSolicitudData);
            cacheList(`/solicitudes/estado/${estado}`, response.data.data);
        }
        return response;
    },
    
    // Obtener solicitud por ID
    getById: async (id) => {
        const response = await api.get(`/solicitudes/${id}`);
        if (response.data.success && response.data.data) {
            response.data.data = mapSolicitudData(response.data.data);
        }
        return response;
    },
    
    // Crear solicitud
    create: (solicitudData) => api.post('/solicitudes', solicitudData),
    
    // Actualizar solicitud
    update: (id, solicitudData) => api.put(`/solicitudes/${id}`, solicitudData),
    
    // Cambiar estado (aprobar/rechazar)
    cambiarEstado: (id, estado, comentarios = null) => 
        api.patch(`/solicitudes/${id}/estado`, { estado_reserva: estado, comentarios }),
    
    // Actualizar estado de solicitud (para admin)
    updateStatus: (id, estado) => api.patch(`/solicitudes/${id}/estado`, { estado }),
    
    // Eliminar solicitud
    delete: (id) => api.delete(`/solicitudes/${id}`),
};

// Servicios Admin - Ocupaciones especiales
export const adminService = {
    getOcupaciones: () => api.get('/admin/ocupaciones'),
    ocupar: ({ tipo_servicio, ids, nota, creado_por }) => 
        api.post('/admin/ocupaciones/ocupar', { tipo_servicio, ids, nota, creado_por }),
    liberar: ({ tipo_servicio, ids }) => 
        api.post('/admin/ocupaciones/liberar', { tipo_servicio, ids }),
    override: ({ tipo_servicio, id_recurso, motivo, creado_por }) =>
        api.post('/admin/override', { tipo_servicio, id_recurso, motivo, creado_por }),
    // Catálogo de equipos (Servicios)
    getEquipos: () => api.get('/admin/equipos'),
    createEquipo: ({ clave, nombre, activo, orden }) => api.post('/admin/equipos', { clave, nombre, activo, orden }),
    updateEquipo: (id, payload) => api.put(`/admin/equipos/${id}`, payload),
    deleteEquipo: (id, force=false) => api.delete(`/admin/equipos/${id}`, { params: force ? { force: 1 } : {} })
    ,deleteEquipoPorClave: (clave, force=false) => api.delete(`/admin/equipos/clave/${clave}`, { params: force ? { force: 1 } : {} })
};

// Función helper para manejo de errores
export const handleApiError = (error) => {
    if (error.response) {
        // Error de respuesta del servidor
        const { status, data } = error.response;
        return {
            message: data?.message || `Error ${status}`,
            status,
            details: data?.error || 'Error desconocido'
        };
    } else if (error.request) {
        // Error de red
        return {
            message: 'Error de conexión - Verifique que el servidor esté ejecutándose',
            status: 0,
            details: 'Sin respuesta del servidor'
        };
    } else {
        // Error de configuración
        return {
            message: 'Error de configuración',
            status: -1,
            details: error.message
        };
    }
};

// Test de conexión
export const testConnection = async () => {
    try {
        const response = await api.get('/');
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            error: handleApiError(error)
        };
    }
};

export default api;