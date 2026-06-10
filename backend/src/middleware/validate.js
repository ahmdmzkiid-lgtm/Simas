function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.validated = parsed;
      next();
    } catch (err) {
      return res.status(422).json({
        message: 'Validasi gagal',
        errors: err.errors?.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })) || [],
      });
    }
  };
}

module.exports = { validate };
