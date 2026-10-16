import type { Resolver } from "../core/types";
import type { FieldPath } from "../types/path";

interface ZodIssueLike {
  code?: string;
  message: string;
  path: Array<number | string>;
}

interface ZodErrorLike {
  issues?: ZodIssueLike[];
  errors?: ZodIssueLike[];
}

interface ZodSchemaLike<TValues> {
  safeParse: (values: unknown) => { data?: TValues; error?: ZodErrorLike; success: boolean };
}

export function zodResolver<TValues extends object>(
  schema: ZodSchemaLike<TValues>
): Resolver<TValues> {
  return (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data ?? values, errors: {} };
    }

    const errors = {} as Record<FieldPath<TValues>, { message: string; type?: string }>;
    const issues = result.error?.issues ?? result.error?.errors ?? [];

    issues.forEach((issue) => {
      const name = issue.path.join(".") as FieldPath<TValues>;
      if (!name || errors[name]) return;
      errors[name] = { message: issue.message, type: issue.code };
    });

    return { values, errors };
  };
}
