import type { FieldErrors, RegisterOptions, Resolver } from "../core/types";
import { validateRule } from "../core/validateRule";
import type { FieldPath } from "../types/path";

export type BuiltinRule<TValues, TName extends FieldPath<TValues> = FieldPath<TValues>> = RegisterOptions<TValues, TName>;
export type BuiltinSchema<TValues> = Partial<Record<FieldPath<TValues>, BuiltinRule<TValues>>>;

export function builtinResolver<TValues extends object>(
  schema: BuiltinSchema<TValues>
): Resolver<TValues> {
  return async (values) => {
    const errors: FieldErrors<TValues> = {};
    await Promise.all(
      Object.entries(schema).map(async ([name, rule]) => {
        if (!rule) return;
        const error = await validateRule(values, name as FieldPath<TValues>, rule as BuiltinRule<TValues>);
        if (error) errors[name as FieldPath<TValues>] = error;
      })
    );
    return { values, errors };
  };
}
