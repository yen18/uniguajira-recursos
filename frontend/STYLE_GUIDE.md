# Guía de Estilos (Design System Base)

## Paleta de Colores
- `primary`: #0056B3 (Acción principal, foco, enlaces destacados)
- `primaryDark`: #003D7A (Hover intenso / encabezados oscuros)
- `secondary`: #FFB300 (Accentos, indicadores secundarios neutrales)
- `background`: #F7F9FC (Fondo global)
- `surface`: #FFFFFF (Tarjetas, paneles, modales)
- `error`: #D32F2F (Errores críticos)
- `warning`: #ED6C02 (Estados preventivos / advertencias)
- `success`: #2E7D32 (Confirmaciones / finalización correcta)
- `textPrimary`: #1F2A37
- `textSecondary`: #5B6B7C

Contrastes AA revisados para texto principal (>4.5 ratio sobre fondo #F7F9FC).

## Tipografía
Fuente base: `Inter, Roboto, Helvetica, Arial, sans-serif`

Escalas (px): 12 / 14 / 16 / 20 / 24 / 32
- `h1`: 32, weight 600
- `h2`: 24, weight 600
- `h3`: 20, weight 600
- `body1`: 16, weight 400
- `body2`: 14, weight 400
- `caption`: 12, weight 400
- Botones: weight 500, sin transformación de texto.

## Spacing (Escala)
Base: 4px. Usar múltiplos: 4, 8, 12, 16, 24, 32. Evitar valores arbitrarios; mantener consistencia vertical y horizontal.

## Shape
Border radius global: 10px. Mantener consistencia en botones, inputs, tarjetas y modales.

## Component Overrides Clave
- `Button`: transiciones 200ms `ease-out`, sombra suave en `contained`, elevación al hover (lift sutil). `outlined` con borde de 2px y color atenuado que intensifica en hover.
- `OutlinedInput`: borde neutro (25% opacidad), hover intensifica y focus resalta con `primary.main` + glow moderado (no exagerar).
- `Alert`: fondos con tinte 8% del color de severidad para reducir saturación y mejorar legibilidad.
- `Paper`: sin background-image, elevación suave y hover sutil.

## Estados UX
- Loading: usar `LoadingButton` o `CircularProgress` embebido evitando jumps de layout.
- Error: mensaje claro + código (si aplica) + acción de reintento. Evitar saturación (usar tinte en fondo Alert).
- Empty: componente `EmptyState` con título y descripción amigable.
- Success: toast neutro o alerta de fondo claro (no verde saturado completo).

## Accesibilidad
- Inputs con `aria-invalid` y `aria-describedby` cuando existe error.
- Estados de foco visibles: sombra/outline (`0 0 0 3px rgba(0,86,179,0.35)`).
- Contraste mínimo AA para texto normal; revisar cambios de paleta antes de producción.
- Iconos: no depender solo de color para transmitir estado crítico.

## Modal Credenciales Demo
Extraído a componente para no contaminar flujo de autenticación principal. Solo visible bajo acción explícita del usuario.

## Buenas Prácticas de Copia (Microcopy)
- Botones: verbos claros ("Guardar", "Iniciar Sesión"), evitar jergas.
- Errores: breves y accionables ("Formato de correo inválido" > "Correo incorrecto").
- Mensajes informativos: tono profesional y sobrio.

## Futuras Extensiones
- Tokens de elevación (elevation 1..5) centralizados.
- Sistema de densidad (compact / regular) para listas y tablas.
- Estados adicionales: offline, rate-limit, role-change.

## Uso Rápido
Importar `theme` en `index.js` y envolver con `ThemeProvider`. Usar componentes reutilizables de `src/components/ui/` para formularios y estados.

---
Mantener este documento actualizado ante cambios de diseño. Última actualización automática.

---

## Tokens Centralizados
Archivo: `src/design/tokens.js`

```js
export const tokens = {
	colors: { brand, semantic, neutral },
	spacing: { base, xs, sm, md, lg, xl, '2xl' },
	radii: { xs, sm, md, lg, pill },
	shadows: { level0, level1, level2, level3, level4, levelHover },
	typographyScale: { fontFamily, sizes, weights },
	motion: { duration, easing }
};
```

### Uso en Componentes
Preferir tokens sobre valores hardcodeados:
```jsx
import tokens from '../design/tokens';
const BoxStyled = styled('div')(({ theme }) => ({
	padding: tokens.spacing.md,
	borderRadius: tokens.radii.md,
	boxShadow: tokens.shadows.level1,
}));
```

## Tipografía Extendida
| Nivel | px | rem | Weight |
|-------|----|-----|--------|
| h1 | 32 | 2.0 | 600 |
| h2 | 24 | 1.5 | 600 |
| h3 | 20 | 1.25 | 600 |
| h4 | 18 | 1.125 | 600 |
| body1 | 16 | 1.0 | 400 |
| body2 | 14 | 0.875 | 400 |
| caption | 12 | 0.75 | 400 |

## Espaciado Estándar
| Token | Valor |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |

Aplicar vertical rhythm usando múltiplos de `md` (16px) para bloques principales.

## Motion Guidelines
- Duraciones: fast 120ms, base 180ms, slow 260ms.
- Curva principal: `cubic-bezier(0.4,0,0.2,1)`.
- Evitar animaciones >300ms en interacciones simples.

## Sombras (Elevación)
| Nivel | Shadow |
|-------|--------|
| level0 | none |
| level1 | base card/list |
| level2 | hover leve |
| level3 | popover/dialog ligero |
| level4 | modal destacado |
| levelHover | interacción hover estándar |

Usar sólo una sombra por elemento; evitar combinaciones excesivas.

## Patrones de Componentes
### Botones
- Primario: acciones principales (guardar, confirmar).
- Secundario (outlined): acciones de soporte.
- Destructivo: usar `color="error"` + confirmación modal.

### Chips
- Estados / roles / filtros activos.
- Colores semánticos con baja saturación (fondo alpha 0.12).

### Skeletons
Reemplazan spinners para mejorar continuidad visual.
Ejemplo lista:
```jsx
{isLoading && (
	<List>
		{Array.from({length:6}).map((_,i)=>(
			<ListItem key={i}>
				<ListItemAvatar><Skeleton variant="circular" width={40} height={40}/></ListItemAvatar>
				<ListItemText primary={<Skeleton width="40%"/>} secondary={<Skeleton width="60%"/>}/>
			</ListItem>
		))}
	</List>
)}
```

### Focus Accesible
Global: outline de 2px con color primario y offset 2px (`MuiCssBaseline`). Evitar remover outline sin reemplazo.

## Estados (Empty / Error / Offline)
| Estado | Recomendación |
|--------|---------------|
| Empty | Icono ligero + CTA (ej. “Crear usuario”). |
| Error | Mensaje + botón reintentar; no sólo color rojo. |
| Offline | Badge discreto “Offline - datos en caché”. |

## Buenas Prácticas de Layout
- Máximo ancho contenedores: `lg` (≈1280px). Mantener padding horizontal = 24px en desktop, 16px en mobile.
- Evitar más de 4 colores saturados en una sola vista.

## Dark Mode (Futuro)
Definir neutral invertido (50↔900) + ajustar alpha de sombras y contrastes. Paleta semántica se mantiene.

## Checklist de Revisión Visual
1. Contraste AA verificado.
2. Consistencia de spacing (múltiplos base).
3. Skeleton antes de datos cargados.
4. Focus visible en todos los controles.
5. No hay texto en mayúsculas forzada salvo acrónimos.
6. Botones principales no compiten (uno por sección).

## Ejemplo Componente Integrado
```jsx
import { Card, Typography, Button } from '@mui/material';
import tokens from '../design/tokens';

export function ResourceCard({ title, onAction }) {
	return (
		<Card sx={{ p: tokens.spacing.md, display:'flex', flexDirection:'column', gap: tokens.spacing.sm }}>
			<Typography variant="h3">{title}</Typography>
			<Button variant="contained" onClick={onAction}>Gestionar</Button>
		</Card>
	);
}
```

## Convenciones de Nomenclatura
- Archivos: `PascalCase` para componentes, `kebab-case` para assets.
- Hooks internos: prefijo `use`. Servicios API: sufijo `Service`.

## Mantenimiento
Al introducir nuevo color/espaciado, primero agregar al token y luego reutilizarlo. Nunca hardcodear en más de un componente.

---
Fin de extensión documentada.
