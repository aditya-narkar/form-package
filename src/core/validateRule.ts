import { getPath } from "./path";
import type { FieldError, RegisterOptions } from "./types";
import type { FieldPath, FieldPathValue } from "../types/path";

export function ruleConfig<T>(rule: T | { message?: string; value: T }): { message?: string; value: T } {
  if (typeof rule === "object" && rule != null && "value" in rule) {
    return rule as { message?: string; value: T };
  }
  return { value: rule as T };
}

export async function validateRule<TValues extends object>(
  values: TValues,
  name: FieldPath<TValues>,
  rule: RegisterOptions<TValues>
): Promise<FieldError | undefined> {
  const value = getPath(values, name) as FieldPathValue<TValues, typeof name>;

  if (rule.required && (value == null || value === "")) {
    return { message: typeof rule.required === "string" ? rule.required : "This field is required", type: "required" };
  }

  if (rule.minLength && typeof value === "string") {
    const config = ruleConfig(rule.minLength);
    if (value.length < config.value) {
      return { message: config.message ?? `Must be at least ${config.value} characters`, type: "minLength" };
    }
  }

  if (rule.pattern && typeof value === "string") {
    const config = ruleConfig(rule.pattern);
    if (!config.value.test(value)) {
      return { message: config.message ?? "Invalid format", type: "pattern" };
    }
  }

  if (rule.validate) {
    const result = await rule.validate(value, values);
    if (typeof result === "string") return { message: result, type: "validate" };
    if (result === false) return { message: "Invalid value", type: "validate" };
  }

  return undefined;
}
