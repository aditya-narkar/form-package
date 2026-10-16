import { cloneValue, deletePath, getPath, setPath } from "./path";
import { validateRule } from "./validateRule";
import type {
  FieldError,
  FieldState,
  FormControl,
  FormMode,
  FormState,
  RegisterOptions,
  Resolver,
  UseFormOptions
} from "./types";
import type { FieldPath, FieldPathValue } from "../types/path";

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface FieldRecord<TValues extends object> {
  debounce?: ReturnType<typeof setTimeout>;
  element?: FieldElement;
  options?: RegisterOptions<TValues>;
}

function readElementValue(element: FieldElement): unknown {
  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    return element.checked;
  }
  if (element instanceof HTMLInputElement && element.type === "number") {
    return element.value === "" ? undefined : element.valueAsNumber;
  }
  return element.value;
}

function writeElementValue(element: FieldElement, value: unknown): void {
  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    element.checked = Boolean(value);
    return;
  }
  element.value = value == null ? "" : String(value);
}

function emptyState<TValues>(): FormState<TValues> {
  return {
    dirtyFields: {},
    errors: {},
    isSubmitting: false,
    isValidating: false,
    touchedFields: {}
  };
}

function cloneFormState<TValues>(formState: FormState<TValues>): FormState<TValues> {
  return {
    dirtyFields: { ...formState.dirtyFields },
    errors: { ...formState.errors },
    isSubmitting: formState.isSubmitting,
    isValidating: formState.isValidating,
    touchedFields: { ...formState.touchedFields }
  };
}

export function createFormControl<TValues extends object>(
  options: UseFormOptions<TValues> = {}
): FormControl<TValues> {
  const mode: FormMode = options.mode ?? "onSubmit";
  const resolver: Resolver<TValues> | undefined = options.resolver;
  const values = cloneValue((options.defaultValues ?? {}) as TValues);
  const fields = new Map<string, FieldRecord<TValues>>();
  const valueSubscribers = new Map<string, Set<() => void>>();
  const fieldSubscribers = new Map<string, Set<() => void>>();
  const formSubscribers = new Set<() => void>();
  const formState = emptyState<TValues>();
  let formSnapshot = cloneFormState(formState);
  const fieldSnapshots = new Map<string, FieldState>();
  const validationTokens = new Map<string, number>();

  function notify(map: Map<string, Set<() => void>>, name: string): void {
    map.get(name)?.forEach((callback) => callback());
  }

  function notifyForm(): void {
    formSnapshot = cloneFormState(formState);
    formSubscribers.forEach((callback) => callback());
  }

  function notifyField(name: string, includeForm = true): void {
    fieldSnapshots.set(name, buildFieldState(name as FieldPath<TValues>));
    notify(fieldSubscribers, name);
    if (includeForm) notifyForm();
  }

  function syncFieldValue(name: string): void {
    const field = fields.get(name);
    if (!field?.element) return;
    setPath(values as Record<string, unknown>, name, readElementValue(field.element));
  }

  function syncAllFields(): void {
    fields.forEach((_, name) => syncFieldValue(name));
  }

  function setFieldValidating(name: string, isValidating: boolean): void {
    const key = name as FieldPath<TValues>;
    const current = getFieldState(key);
    const nextState = { ...current, isValidating };
    if (isValidating) {
      validatingFields.add(name);
    } else {
      validatingFields.delete(name);
    }
    formState.isValidating = validatingFields.size > 0;
    fieldStateOverrides.set(name, nextState);
    notifyField(name);
  }

  const fieldStateOverrides = new Map<string, FieldState>();
  const validatingFields = new Set<string>();

  function setError(name: FieldPath<TValues>, error: FieldError): void {
    formState.errors[name] = error;
    notifyField(name);
  }

  function clearErrors(name?: FieldPath<TValues>): void {
    if (name) {
      delete formState.errors[name];
      notifyField(name);
      return;
    }
    const cleared = Object.keys(formState.errors);
    formState.errors = {};
    cleared.forEach((fieldName) => notifyField(fieldName));
    notifyForm();
  }

  function buildFieldState(name: FieldPath<TValues>): FieldState {
    const override = fieldStateOverrides.get(name);
    return {
      dirty: Boolean(formState.dirtyFields[name]),
      error: formState.errors[name],
      isValidating: override?.isValidating ?? false,
      touched: Boolean(formState.touchedFields[name])
    };
  }

  function getFieldState(name: FieldPath<TValues>): FieldState {
    const snapshot = fieldSnapshots.get(name);
    if (snapshot) return snapshot;
    const next = buildFieldState(name);
    fieldSnapshots.set(name, next);
    return next;
  }

  async function validateField(name: FieldPath<TValues>): Promise<boolean> {
    syncFieldValue(name);
    const token = (validationTokens.get(name) ?? 0) + 1;
    validationTokens.set(name, token);

    if (resolver) {
      setFieldValidating(name, true);
      const result = await resolver(getValues());
      if (validationTokens.get(name) !== token) return !formState.errors[name];
      const changed = new Set([...Object.keys(formState.errors), ...Object.keys(result.errors)]);
      formState.errors = result.errors;
      setFieldValidating(name, false);
      changed.forEach((fieldName) => notifyField(fieldName, false));
      notifyForm();
      return !result.errors[name];
    }

    const error = await validateRules(name, token);
    if (error) {
      setError(name, error);
      return false;
    }
    delete formState.errors[name];
    notifyField(name);
    return true;
  }

  async function validateRules(name: FieldPath<TValues>, token: number): Promise<FieldError | undefined> {
    const rules = fields.get(name)?.options;
    if (!rules) return undefined;

    // Only async custom validators need the isValidating state and race guard.
    if (!rules.validate) return validateRule(getValues(), name, rules);

    setFieldValidating(name, true);
    const error = await validateRule(getValues(), name, rules);
    if (validationTokens.get(name) !== token) return formState.errors[name];
    setFieldValidating(name, false);
    return error;
  }

  async function validate(name?: FieldPath<TValues>): Promise<boolean> {
    syncAllFields();

    if (name) return validateField(name);

    if (resolver) {
      formState.isValidating = true;
      notifyForm();
      const result = await resolver(getValues());
      const changed = new Set([...Object.keys(formState.errors), ...Object.keys(result.errors)]);
      formState.errors = result.errors;
      formState.isValidating = false;
      changed.forEach((fieldName) => notifyField(fieldName, false));
      notifyForm();
      return Object.keys(result.errors).length === 0;
    }

    const results = await Promise.all(
      Array.from(fields.keys()).map((fieldName) => validateField(fieldName as FieldPath<TValues>))
    );
    return results.every(Boolean);
  }

  function scheduleValidation(name: FieldPath<TValues>): void {
    const field = fields.get(name);
    const debounceMs = field?.options?.debounceMs ?? 0;
    if (field?.debounce) clearTimeout(field.debounce);
    if (!debounceMs) {
      void validateField(name);
      return;
    }
    if (field) {
      field.debounce = setTimeout(() => {
        void validateField(name);
      }, debounceMs);
    }
  }

  function register<TName extends FieldPath<TValues>>(
    name: TName,
    registerOptions?: RegisterOptions<TValues, TName>
  ) {
    const existing = fields.get(name);
    fields.set(name, {
      ...existing,
      options: registerOptions as RegisterOptions<TValues>
    });

    return {
      name,
      onBlur: () => {
        syncFieldValue(name);
        formState.touchedFields[name] = true;
        notifyField(name, false);
        if (mode === "onBlur") scheduleValidation(name);
      },
      onChange: () => {
        syncFieldValue(name);
        formState.dirtyFields[name] = true;
        notify(valueSubscribers, name);
        notifyField(name, false);
        if (mode === "onChange") scheduleValidation(name);
      },
      ref: (element: FieldElement | null) => {
        const field = fields.get(name);
        if (!field) return;
        if (!element) {
          field.element = undefined;
          return;
        }
        field.element = element;
        const currentValue = getPath(values, name);
        if (currentValue !== undefined) {
          writeElementValue(element, currentValue);
        } else {
          syncFieldValue(name);
        }
      }
    };
  }

  function setValue<TName extends FieldPath<TValues>>(
    name: TName,
    value: FieldPathValue<TValues, TName>,
    setOptions: { shouldDirty?: boolean; shouldValidate?: boolean } = {}
  ): void {
    setPath(values as Record<string, unknown>, name, value);
    const element = fields.get(name)?.element;
    if (element) writeElementValue(element, value);
    if (setOptions.shouldDirty) formState.dirtyFields[name] = true;
    notify(valueSubscribers, name);
    notifyField(name);
    if (setOptions.shouldValidate) scheduleValidation(name);
  }

  function getValues(): TValues {
    syncAllFields();
    return cloneValue(values);
  }

  function getValuesSnapshot(): TValues {
    return cloneValue(values);
  }

  function getValue<TName extends FieldPath<TValues>>(name: TName): FieldPathValue<TValues, TName> | undefined {
    syncFieldValue(name);
    return getPath<FieldPathValue<TValues, TName>>(values, name);
  }

  function subscribe(map: Map<string, Set<() => void>>, name: FieldPath<TValues>, callback: () => void): () => void {
    const listeners = map.get(name) ?? new Set<() => void>();
    listeners.add(callback);
    map.set(name, listeners);
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) map.delete(name);
    };
  }

  function unregister(name: FieldPath<TValues>): void {
    fields.delete(name);
    deletePath(values as Record<string, unknown>, name);
    delete formState.errors[name];
    delete formState.dirtyFields[name];
    delete formState.touchedFields[name];
    fieldStateOverrides.delete(name);
    notify(valueSubscribers, name);
    notifyField(name);
  }

  function handleSubmit(onValid: (values: TValues) => void | Promise<void>) {
    return async (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
      formState.isSubmitting = true;
      notifyForm();
      try {
        const valid = await validate();
        if (valid) await onValid(getValues());
      } finally {
        formState.isSubmitting = false;
        notifyForm();
      }
    };
  }

  return {
    clearErrors,
    getFieldState,
    getFormState: () => formSnapshot,
    getValue,
    getValues,
    getValuesSnapshot,
    handleSubmit,
    register,
    setError,
    setValue,
    subscribeField: (name, callback) => subscribe(fieldSubscribers, name, callback),
    subscribeForm: (callback) => {
      formSubscribers.add(callback);
      return () => formSubscribers.delete(callback);
    },
    subscribeValue: (name, callback) => subscribe(valueSubscribers, name, callback),
    unregister,
    validate
  };
}
