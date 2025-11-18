// Script de prueba para verificar las fechas válidas
const getCurrentWeekDates = () => {
  const now = new Date();
  const monday = new Date(now);
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }
  return dates;
};

const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  // Crear fecha correctamente evitando problemas de zona horaria
  const [year, month, day] = dateString.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, day);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentWeekDates = getCurrentWeekDates();
  
  console.log('🔍 Validando fecha:', {
    dateString,
    selectedDate: selectedDate.toDateString(),
    today: today.toDateString(),
    dayOfWeek: selectedDate.getDay(),
    currentWeekDates: currentWeekDates.map(d => d.toDateString())
  });
  
  // Verificar que sea día de semana
  const dayOfWeek = selectedDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log('❌ Rechazado: Es fin de semana');
    return false;
  }
  
  // Verificar que no sea fecha pasada
  if (selectedDate < today) {
    console.log('❌ Rechazado: Fecha pasada');
    return false;
  }
  
  // Verificar que esté en la semana actual
  const isInCurrentWeek = currentWeekDates.some(date => {
    return date.toDateString() === selectedDate.toDateString();
  });
  
  console.log('✅ Resultado final:', isInCurrentWeek);
  return isInCurrentWeek;
};

// Pruebas
console.log('=== FECHA ACTUAL ===');
const today = new Date();
console.log('Hoy es:', today.toDateString());
console.log('Día de la semana:', today.getDay(), '(0=Domingo, 1=Lunes, ..., 6=Sábado)');

console.log('\n=== FECHAS DE LA SEMANA ACTUAL ===');
const weekDates = getCurrentWeekDates();
weekDates.forEach((date, index) => {
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  console.log(`${dayNames[index]}: ${date.toDateString()}`);
});

console.log('\n=== PRUEBA CON 24/10/2025 ===');
const result = isValidDate('2025-10-24');
console.log('¿Es válida 24/10/2025?', result);

console.log('\n=== PRUEBA CON FECHA DE HOY ===');
const todayString = today.toISOString().split('T')[0];
console.log('Fecha de hoy como string:', todayString);
const resultToday = isValidDate(todayString);
console.log('¿Es válida la fecha de hoy?', resultToday);