/**
 * Joi validation middleware factory
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
  if (!error) return next();

  const details = error.details.map(d => ({
    field: d.path.join('.'),
    message: d.message,
  }));
  res.status(422).json({ error: 'Validation failed', details });
};

module.exports = validate;
