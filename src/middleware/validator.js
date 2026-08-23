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

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  questionnaireValidation
};
