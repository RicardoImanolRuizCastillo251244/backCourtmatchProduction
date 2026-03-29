const Joi = require('joi');

/**
 * Esquemas de validación para la aplicación
 */

// Validación de registro de jugador
const registroJugadorSchema = Joi.object({
  nombreUsuario: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'El nombre debe contener solo letras y números',
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no debe exceder 30 caracteres',
      'any.required': 'El nombre de usuario es obligatorio',
    }),

  correo: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Debes proporcionar un correo válido',
      'any.required': 'El correo es obligatorio',
    }),

  contrasena: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'La contraseña debe contener mayúscula, minúscula, número y carácter especial',
      'any.required': 'La contraseña es obligatoria',
    }),

  idUbicacion: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID de ubicación debe ser un número',
      'any.required': 'La ubicación es obligatoria',
    }),

  idDeporteFavorito: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID de deporte debe ser un número',
      'any.required': 'El deporte favorito es obligatorio',
    }),
});

// Validación de login
const loginSchema = Joi.object({
  correo: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debes proporcionar un correo válido',
      'any.required': 'El correo es obligatorio',
    }),

  contrasena: Joi.string()
    .required()
    .messages({
      'any.required': 'La contraseña es obligatoria',
    }),
});

// Validación de crear partido
const crearPartidoSchema = Joi.object({
  idDeporte: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID de deporte debe ser un número',
      'any.required': 'El deporte es obligatorio',
    }),

  fecha: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'La fecha debe ser válida (formato ISO)',
      'date.min': 'La fecha no puede ser en el pasado',
      'any.required': 'La fecha es obligatoria',
    }),

  hora: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'La hora debe estar en formato HH:mm',
      'any.required': 'La hora es obligatoria',
    }),

  idLugar: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID de lugar debe ser un número',
      'number.integer': 'El ID de lugar debe ser un entero',
      'number.positive': 'El ID de lugar debe ser positivo',
      'any.required': 'El lugar es obligatorio',
    }),

  maxJugadores: Joi.number()
    .integer()
    .min(2)
    .max(100)
    .required()
    .messages({
      'number.base': 'Max jugadores debe ser un número',
      'number.min': 'Mínimo 2 jugadores',
      'number.max': 'Máximo 100 jugadores',
      'any.required': 'Max jugadores es obligatorio',
    }),
});

// Validación de inscripción a partido
const inscripcionPartidoSchema = Joi.object({
  idUser: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID de usuario debe ser un número',
      'any.required': 'El ID de usuario es obligatorio',
    }),

  idMatch: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID de partido debe ser un número',
      'any.required': 'El ID de partido es obligatorio',
    }),

  nombreEquipo: Joi.string()
    .max(50)
    .allow(null, '')
    .messages({
      'string.max': 'El nombre del equipo no debe exceder 50 caracteres',
    }),
});

// Función auxiliar para validar
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({
        ok: false,
        statusCode: 400,
        message: 'Errores de validación',
        errors,
      });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = {
  registroJugadorSchema,
  loginSchema,
  crearPartidoSchema,
  inscripcionPartidoSchema,
  validate,
};
