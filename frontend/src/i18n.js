import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      menu: {
        dashboard: 'Dashboard',
        usuarios: 'Usuarios',
        salas: 'Salas',
        videoproyectores: 'Videoproyectores',
        equipos: 'Equipos',
        solicitudes: 'Solicitudes',
        servicios: 'Servicios',
        casosEspeciales: 'Casos Especiales',
        reportes: 'Reportes'
      },
      greeting: {
        morning: 'Buenos días',
        afternoon: 'Buenas tardes',
        evening: 'Buenas noches'
      },
      panel: { welcome: 'Bienvenido al panel de control' },
      roles: { administrador: 'Administrador', profesor: 'Profesor', estudiante: 'Estudiante' },
      actions: {
        gestionar: 'GESTIONAR',
        verSalas: 'VER SALAS',
        verProyectores: 'VER PROYECTORES',
        verEquipos: 'VER EQUIPOS',
        solicitar: 'SOLICITAR'
      },
      misc: {
        recursosAudiovisuales: 'Recursos Audiovisuales',
        sedeMaicao: 'Sede Maicao',
        sistemaRecursos: 'Sistema de Recursos Audiovisuales - Sede Maicao'
      }
    }
  },
  en: {
    translation: {
      menu: {
        dashboard: 'Dashboard',
        usuarios: 'Users',
        salas: 'Rooms',
        videoproyectores: 'Projectors',
        equipos: 'Equipment',
        solicitudes: 'Requests',
        servicios: 'Services',
        casosEspeciales: 'Special Cases',
        reportes: 'Reports'
      },
      greeting: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening'
      },
      panel: { welcome: 'Welcome to the control panel' },
      roles: { administrador: 'Admin', profesor: 'Teacher', estudiante: 'Student' },
      actions: {
        gestionar: 'MANAGE',
        verSalas: 'VIEW ROOMS',
        verProyectores: 'VIEW PROJECTORS',
        verEquipos: 'VIEW EQUIPMENT',
        solicitar: 'REQUEST'
      },
      misc: {
        recursosAudiovisuales: 'Audiovisual Resources',
        sedeMaicao: 'Maicao Campus',
        sistemaRecursos: 'Audiovisual Resources System - Maicao Campus'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es',
    fallbackLng: 'es',
    interpolation: { escapeValue: false }
  });

export default i18n;
