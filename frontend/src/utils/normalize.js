// Utilidad para normalizar estructuras de datos potencialmente variables
// Convierte varios formatos comunes a siempre un array seguro
// Reglas:
// - null/undefined => []
// - Array => tal cual
// - Objeto con propiedad array: data, rows, items, list => la primera que exista y sea array
// - Si el objeto tiene claves numéricas (estilo objeto-indexado) => Object.values filtrando solo objetos no undefined
// - Cualquier otro caso => []
export const asArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  const candidateKeys = ['data', 'rows', 'items', 'list'];
  for (const k of candidateKeys) {
    if (Array.isArray(value[k])) return value[k];
  }
  // Caso objeto indexado tipo {0: {...}, 1: {...}}
  const numericKeys = Object.keys(value).filter(k => /^\d+$/.test(k));
  if (numericKeys.length > 0) {
    return numericKeys
      .sort((a,b) => parseInt(a,10) - parseInt(b,10))
      .map(k => value[k])
      .filter(v => v !== undefined && v !== null);
  }
  return [];
};

// Helper para asegurar que una variable usada en render siempre sea array
export const ensureArray = (value) => asArray(value);

export default asArray;
