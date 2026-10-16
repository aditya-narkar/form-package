// src/resolvers/zod.ts
function zodResolver(schema) {
  return (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data ?? values, errors: {} };
    }
    const errors = {};
    const issues = result.error?.issues ?? result.error?.errors ?? [];
    issues.forEach((issue) => {
      const name = issue.path.join(".");
      if (!name || errors[name]) return;
      errors[name] = { message: issue.message, type: issue.code };
    });
    return { values, errors };
  };
}
export {
  zodResolver
};
