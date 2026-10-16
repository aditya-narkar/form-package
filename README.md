# React Form Engine From First Principles

A small TypeScript form library that follows the same learning path as React Hook Form: start with the public API shape, then move validation, uncontrolled refs, pub-sub subscriptions, async race handling, field arrays, and typed field paths into separate pieces.

## What Is Implemented

- `useForm()` with `register`, `handleSubmit`, `values`, `errors`, `formState`, `setValue`, and `getValues`
- Uncontrolled inputs backed by DOM refs instead of controlled `value` props
- Field-level pub-sub via `useWatch()` and `useField()`
- Built-in validation rules: `required`, `minLength`, `pattern`, and custom `validate`
- Resolver interface plus `builtinResolver()` and `zodResolver()`
- Validation modes: `onChange`, `onBlur`, and `onSubmit`
- Async field validation with per-field validation tokens to prevent stale responses
- Debounced field validation through `debounceMs`
- `useFieldArray()` with stable internal ids for append, insert, remove, and move
- Recursive TypeScript dot-path types through `FieldPath<T>` and `FieldPathValue<T, Path>`

## Basic Example

```tsx
import { useForm } from "@aditya/rhf-from-first-principles";

interface SignupValues {
  email: string;
  name: string;
  password: string;
}

export function SignupForm() {
  const form = useForm<SignupValues>({ mode: "onSubmit" });

  return (
    <form onSubmit={form.handleSubmit((values) => console.log(values))}>
      <input {...form.register("name", { required: "Name is required" })} />
      <span>{form.errors.name?.message}</span>

      <input {...form.register("email", { required: "Email is required" })} />
      <span>{form.errors.email?.message}</span>

      <input {...form.register("password", { required: "Password is required" })} type="password" />
      <span>{form.errors.password?.message}</span>

      <button type="submit">Create account</button>
    </form>
  );
}
```

## Verification

```bash
npm run typecheck
npm test
npm run build
```

The test suite covers render isolation, async validation race conditions, and stable field-array keys.
