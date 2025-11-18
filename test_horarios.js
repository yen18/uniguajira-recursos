// Script de prueba para validar horarios pasados
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
  { id: 10, inicio: "20:15:00", fin: "21:45:00", label: "8:15 PM - 9:45 PM" }
];

const isHorarioPasado = (horarioId, fechaSeleccionada) => {
  // Solo validar si la fecha seleccionada es hoy
  if (!fechaSeleccionada) return false;
  
  const [year, month, day] = fechaSeleccionada.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Si no es hoy, no aplicar validación de horario pasado
  if (selectedDate.toDateString() !== today.toDateString()) {
    return false;
  }
  
  // Encontrar el horario
  const horario = HORARIOS_DISPONIBLES.find(h => h.id === horarioId);
  if (!horario) return false;
  
  // Crear fecha y hora de INICIO del bloque de horario
  const [horaInicio, minutoInicio] = horario.inicio.split(':').map(Number);
  const horarioInicioDateTime = new Date();
  horarioInicioDateTime.setHours(horaInicio, minutoInicio, 0, 0);
  
  // Comparar con la hora actual
  const ahora = new Date();
  return horarioInicioDateTime <= ahora;
};

// Pruebas
console.log('=== PRUEBA DE VALIDACIÓN DE HORARIOS PASADOS ===');
console.log('Hora actual:', new Date().toLocaleTimeString());
console.log('Fecha actual:', new Date().toDateString());

const fechaHoy = new Date().toISOString().split('T')[0];
console.log(`\nFecha de hoy como string: ${fechaHoy}`);

console.log('\n=== HORARIOS PARA HOY ===');
HORARIOS_DISPONIBLES.forEach(horario => {
  const pasado = isHorarioPasado(horario.id, fechaHoy);
  const status = pasado ? '❌ PASADO' : '✅ DISPONIBLE';
  console.log(`${horario.label}: ${status}`);
});

console.log('\n=== HORARIOS PARA MAÑANA ===');
const mañana = new Date();
mañana.setDate(mañana.getDate() + 1);
const fechaMañana = mañana.toISOString().split('T')[0];
console.log(`Fecha de mañana: ${fechaMañana}`);

HORARIOS_DISPONIBLES.slice(0, 3).forEach(horario => {
  const pasado = isHorarioPasado(horario.id, fechaMañana);
  const status = pasado ? '❌ PASADO' : '✅ DISPONIBLE';
  console.log(`${horario.label}: ${status}`);
});