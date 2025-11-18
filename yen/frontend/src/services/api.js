import axios from 'axios';

// Configuración base de Axios
const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 segundos
});

// Interceptor para logs de requests
api.interceptors.request.use(
    (config) => {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Interceptor para manejo de respuestas
api.interceptors.response.use(
    (response) => {
        console.log(`✅ Response ${response.status}:`, response.config.url);
        return response;
    },
    (error) => {
        console.error('❌ Response Error:', error.response?.data || error.message);
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
    // Obtener todos los videoproyectores
    getAll: () => api.get('/videoproyectores'),
    
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

// Servicios para Solicitudes
// Función helper para mapear datos de solicitudes
const mapSolicitudData = (solicitud) => {
    let estado = solicitud.estado_reserva || solicitud.estado || 'pendiente';
    
    // Mapear valores de estado para consistencia
    if (estado === 'aprobado') estado = 'aprobada';
    if (estado === 'rechazado') estado = 'rechazada';
    
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
        }
        return response;
    },
    
    // Obtener solicitudes por usuario
    getByUsuario: async (userId) => {
        const response = await api.get(`/solicitudes/usuario/${userId}`);
        if (response.data.success && response.data.data) {
            response.data.data = response.data.data.map(mapSolicitudData);
        }
        return response;
    },
    
    // Obtener solicitudes por estado
    getByEstado: async (estado) => {
        const response = await api.get(`/solicitudes/estado/${estado}`);
        if (response.data.success && response.data.data) {
            response.data.data = response.data.data.map(mapSolicitudData);
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
    delete: (id) => api.delete(`/solicitudes/${id}`)
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