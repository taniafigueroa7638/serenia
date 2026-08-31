const { body, param, validationResult } = require('express-validator');
const { passwordMeetsPolicy } = require('../utils/passwordPolicy');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }
    next();
  };
};

const registerValidation = [
  body('nombre').trim().isLength({ min: 2, max: 50 }).withMessage('Nombre inválido'),
  body('apellido').trim().isLength({ min: 2, max: 50 }).withMessage('Apellido inválido'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener mayúscula')
    .matches(/[a-z]/).withMessage('Debe contener minúscula')
    .matches(/[0-9]/).withMessage('Debe contener número'),
  body('fechaNacimiento').isISO8601().withMessage('Fecha inválida'),
  body('telefono').optional().isMobilePhone().withMessage('Teléfono inválido'),
  body('sexo').optional().isIn(['masculino', 'femenino', 'otro', 'prefiero_no_decir']),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token de recuperación requerido'),
  body('newPassword')
    .custom(passwordMeetsPolicy)
    .withMessage('La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número'),
];

const questionnaireValidation = [
  body('tipo')
    .isIn(['serenia', 'instrumentos'])
    .withMessage('Tipo de cuestionario inválido'),
  body('respuestas')
    .isArray()
    .withMessage('Las respuestas deben enviarse en una lista')
    .custom((respuestas, { req }) => {
      if (!Array.isArray(respuestas)) return false;

      const tipo = req.body.tipo;
      const totalEsperado = tipo === 'serenia' ? 10 : 17;
      if (respuestas.length !== totalEsperado) {
        throw new Error(`Debe responder las ${totalEsperado} preguntas`);
      }

      const numeros = new Set();
      for (const respuesta of respuestas) {
        if (!Number.isInteger(respuesta?.pregunta) || !Number.isInteger(respuesta?.valor)) {
          throw new Error('Cada respuesta debe incluir pregunta y valor numéricos');
        }
        if (respuesta.pregunta < 1 || respuesta.pregunta > totalEsperado) {
          throw new Error('Número de pregunta fuera de rango');
        }
        if (numeros.has(respuesta.pregunta)) {
          throw new Error('No se permiten preguntas duplicadas');
        }
        numeros.add(respuesta.pregunta);

        const maximo = tipo === 'serenia'
          ? (respuesta.pregunta === 10 ? 7 : 4)
          : (respuesta.pregunta <= 10 ? 4 : 3);
        if (respuesta.valor < 0 || respuesta.valor > maximo) {
          throw new Error('Valor de respuesta fuera de rango');
        }
      }

      return true;
    }),
];

const DIARY_EMOTIONS = [
  'tranquilo', 'feliz', 'neutral', 'preocupado',
  'ansioso', 'molesto', 'triste', 'cansado'
];

const diaryEntryValidation = [
  body('titulo')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El título debe tener entre 1 y 100 caracteres'),
  body('contenido')
    .trim()
    .isLength({ min: 1, max: 8000 })
    .withMessage('La entrada debe tener entre 1 y 8000 caracteres'),
  body('fecha')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .isISO8601({ strict: true })
    .withMessage('Fecha inválida'),
  body('emocion')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(DIARY_EMOTIONS)
    .withMessage('Emoción inválida'),
  body('permitirChatbot')
    .isBoolean()
    .withMessage('El permiso del chatbot debe ser verdadero o falso')
    .toBoolean(),
];

const diaryIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Identificador de entrada inválido').toInt(),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  resetPasswordValidation,
  questionnaireValidation,
  diaryEntryValidation,
  diaryIdValidation
};
