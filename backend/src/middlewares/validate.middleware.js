export function validate(schema) {
  return async (req, res, next) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        const parsed = await schema.query.parseAsync(req.query);
        try {
          Object.assign(req.query, parsed);
        } catch {
          // In case req.query is frozen or strictly getter-only
        }
        req.validatedQuery = parsed;
      }
      if (schema.params) {
        const parsed = await schema.params.parseAsync(req.params);
        try {
          Object.assign(req.params, parsed);
        } catch {
          req.params = parsed;
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
