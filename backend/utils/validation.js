const { z } = require('zod');

// Schemas
const strongPass = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .max(100, 'Máximo 100 caracteres')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 'Debe incluir mayúscula, minúscula y número');

const usuarioCreate = z.object({
  nombre: z.string().min(2).max(50),
  apellido: z.string().min(2).max(50),
  correo_electronico: z.string().email().max(120),
  pass: strongPass,
  tipo_de_usuario: z.enum(['administrador','docente','estudiante','invitado']).optional().default('estudiante')
});

const usuarioLogin = z.object({
  correo_electronico: z.string().email().max(120),
  pass: z.string().min(1).max(100) // Permite cualquier entrada; validación fuerte sólo al crear/resetear
});

const equipoCreate = z.object({
  tipo: z.enum(['videocamara','dvd','extension','audio','vhs','otros']),
  nombre: z.string().min(2).max(120),
  descripcion: z.string().max(500).optional().nullable(),
  estado: z.string().min(2).max(30).optional().default('disponible')
});

const equipoEstadoPatch = z.object({
  estado: z.string().min(2).max(30)
});

// Basic time/fecha regexes
const fechaRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
// Aceptar HH:MM o HH:MM:SS para mayor flexibilidad en formularios
const horaRegex = /^\d{2}:\d{2}(?::\d{2})?$/; // HH:MM opcional :SS

const solicitudCreate = z.object({
  id_usuario: z.number().int().positive(),
  fecha: z.string().regex(fechaRegex),
  hora_inicio: z.string().regex(horaRegex),
  hora_fin: z.string().regex(horaRegex),
  estudiante: z.string().min(2).max(50).optional().nullable(),
  programa: z.string().max(120).optional().nullable(),
  tipo_actividad: z.string().max(100).optional().nullable(),
  numero_asistentes: z.string().max(50).optional().nullable(),
  asignatura: z.string().min(2).max(50),
  docente: z.string().min(2).max(50),
  // Permitir que llegue como string "2" y convertir a número
  semestre: z.coerce.number().int().min(1).max(10).optional().nullable(),
  celular: z.string().regex(/^\d{10}$/),
  servicio: z.enum(['videoproyector','sala','videocamara','dvd','extension','audio','vhs','otros']),
  salon: z.string().min(1).max(10),
  equip_videocamara: z.boolean().optional(),
  equip_dvd: z.boolean().optional(),
  equip_extension: z.boolean().optional(),
  equip_audio: z.boolean().optional(),
  equip_vhs: z.boolean().optional(),
  equip_otros: z.boolean().optional(),
  equip_cual: z.string().max(100).optional().nullable()
});

// Generic validator middleware factory
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      return res.status(400).json({ success: false, error: 'validation_error', issues: result.error.issues });
    }
    req.validated = { ...(req.validated || {}), [source]: result.data };
    next();
  };
}

module.exports = {
  validate,
  schemas: {
    usuarioCreate,
    usuarioLogin,
    equipoCreate,
    equipoEstadoPatch,
    solicitudCreate
    , passwordForgot: z.object({ correo_electronico: z.string().email().max(120) })
    , passwordReset: z.object({ token: z.string().min(16).max(512), pass: strongPass })
  }
};
