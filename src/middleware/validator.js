const { body, validationResult } = require('express-validator');

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

const questionnaireValidation = [
  body('respuestas').isArray({ min: 10, max: 10 }).withMessage('Debe responder las 10 preguntas'),
  body('respuestas.*.pregunta').isInt({ min: 1, max: 10 }),
  body('respuestas.*.valor').isInt({ min: 0, max: 4 }),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  questionnaireValidation
};
