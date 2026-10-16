// src/core/path.ts
function getPath(source, path) {
  if (!path) return source;
  return path.split(".").reduce((current, key) => {
    if (current == null) return void 0;
    return current[key];
  }, source);
}
function setPath(source, path, value) {
  const keys = path.split(".");
  let cursor = source;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }
    const nextKey = keys[index + 1];
    const current = cursor[key];
    if (typeof current !== "object" || current == null) {
      cursor[key] = Number.isInteger(Number(nextKey)) ? [] : {};
    }
    cursor = cursor[key];
  });
  return source;
}
function deletePath(source, path) {
  const keys = path.split(".");
  const last = keys.pop();
  if (!last) return;
  const parent = getPath(source, keys.join("."));
  if (parent && typeof parent === "object") {
    delete parent[last];
  }
}
function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

// src/core/createFormControl.ts
function readElementValue(element) {
  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    return element.checked;
  }
  if (element instanceof HTMLInputElement && element.type === "number") {
    return element.value === "" ? void 0 : element.valueAsNumber;
  }
  return element.value;
}
function writeElementValue(element, value) {
  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    element.checked = Boolean(value);
    return;
  }
  element.value = value == null ? "" : String(value);
}
function emptyState() {
  return {
    dirtyFields: {},
    errors: {},
    isSubmitting: false,
    isValidating: false,
    touchedFields: {}
  };
}
function cloneFormState(formState) {
  return {
    dirtyFields: { ...formState.dirtyFields },
    errors: { ...formState.errors },
    isSubmitting: formState.isSubmitting,
    isValidating: formState.isValidating,
    touchedFields: { ...formState.touchedFields }
  };
}
function ruleConfig(rule) {
  if (typeof rule === "object" && rule != null && "value" in rule) {
    return rule;
  }
  return { value: rule };
}
function createFormControl(options = {}) {
  const mode = options.mode ?? "onSubmit";
  const resolver = options.resolver;
  const values = cloneValue(options.defaultValues ?? {});
  const fields = /* @__PURE__ */ new Map();
  const valueSubscribers = /* @__PURE__ */ new Map();
  const fieldSubscribers = /* @__PURE__ */ new Map();
  const formSubscribers = /* @__PURE__ */ new Set();
  const formState = emptyState();
  let formSnapshot = cloneFormState(formState);
  const fieldSnapshots = /* @__PURE__ */ new Map();
  const validationTokens = /* @__PURE__ */ new Map();
  function notify(map, name) {
    map.get(name)?.forEach((callback) => callback());
  }
  function notifyForm() {
    formSnapshot = cloneFormState(formState);
    formSubscribers.forEach((callback) => callback());
  }
  function notifyField(name, includeForm = true) {
    fieldSnapshots.set(name, buildFieldState(name));
    notify(fieldSubscribers, name);
    if (includeForm) notifyForm();
  }
  function syncFieldValue(name) {
    const field = fields.get(name);
    if (!field?.element) return;
    setPath(values, name, readElementValue(field.element));
  }
  function syncAllFields() {
    fields.forEach((_, name) => syncFieldValue(name));
  }
  function setFieldValidating(name, isValidating) {
    const key = name;
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
  const fieldStateOverrides = /* @__PURE__ */ new Map();
  const validatingFields = /* @__PURE__ */ new Set();
  function setError(name, error) {
    formState.errors[name] = error;
    notifyField(name);
  }
  function clearErrors(name) {
    if (name) {
      delete formState.errors[name];
      notifyField(name);
      return;
    }
    Object.keys(formState.errors).forEach((fieldName) => notifyField(fieldName));
    formState.errors = {};
    notifyForm();
  }
  function buildFieldState(name) {
    const override = fieldStateOverrides.get(name);
    return {
      dirty: Boolean(formState.dirtyFields[name]),
      error: formState.errors[name],
      isValidating: override?.isValidating ?? false,
      touched: Boolean(formState.touchedFields[name])
    };
  }
  function getFieldState(name) {
    const snapshot = fieldSnapshots.get(name);
    if (snapshot) return snapshot;
    const next = buildFieldState(name);
    fieldSnapshots.set(name, next);
    return next;
  }
  async function validateField(name) {
    syncFieldValue(name);
    const token = (validationTokens.get(name) ?? 0) + 1;
    validationTokens.set(name, token);
    const value = getPath(values, name);
    if (resolver) {
      setFieldValidating(name, true);
      const result = await resolver(getValues());
      if (validationTokens.get(name) !== token) return !formState.errors[name];
      formState.errors = result.errors;
      setFieldValidating(name, false);
      notifyField(name);
      return !result.errors[name];
    }
    const error = await validateRules(name, value, token);
    if (error) {
      setError(name, error);
      return false;
    }
    delete formState.errors[name];
    notifyField(name);
    return true;
  }
  async function validateRules(name, value, token) {
    const field = fields.get(name);
    const rules = field?.options;
    if (!rules) return void 0;
    if (rules.required) {
      const empty = value == null || value === "";
      if (empty) {
        return { message: typeof rules.required === "string" ? rules.required : "This field is required", type: "required" };
      }
    }
    if (rules.minLength && typeof value === "string") {
      const config = ruleConfig(rules.minLength);
      if (value.length < config.value) {
        return { message: config.message ?? `Must be at least ${config.value} characters`, type: "minLength" };
      }
    }
    if (rules.pattern && typeof value === "string") {
      const config = ruleConfig(rules.pattern);
      if (!config.value.test(value)) {
        return { message: config.message ?? "Invalid format", type: "pattern" };
      }
    }
    if (rules.validate) {
      setFieldValidating(name, true);
      const result = await rules.validate(value, getValues());
      if (validationTokens.get(name) !== token) return formState.errors[name];
      setFieldValidating(name, false);
      if (typeof result === "string") return { message: result, type: "validate" };
      if (result === false) return { message: "Invalid value", type: "validate" };
    }
    return void 0;
  }
  async function validate(name) {
    syncAllFields();
    if (name) return validateField(name);
    if (resolver) {
      formState.isValidating = true;
      notifyForm();
      const result = await resolver(getValues());
      formState.errors = result.errors;
      formState.isValidating = false;
      Object.keys(result.errors).forEach((fieldName) => notifyField(fieldName));
      notifyForm();
      return Object.keys(result.errors).length === 0;
    }
    const results = await Promise.all(
      Array.from(fields.keys()).map((fieldName) => validateField(fieldName))
    );
    return results.every(Boolean);
  }
  function scheduleValidation(name) {
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
  function register(name, registerOptions) {
    const existing = fields.get(name);
    fields.set(name, {
      ...existing,
      options: registerOptions
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
      ref: (element) => {
        const field = fields.get(name);
        if (!field) return;
        if (!element) {
          field.element = void 0;
          return;
        }
        field.element = element;
        const currentValue = getPath(values, name);
        if (currentValue !== void 0) {
          writeElementValue(element, currentValue);
        } else {
          syncFieldValue(name);
        }
      }
    };
  }
  function setValue(name, value, setOptions = {}) {
    setPath(values, name, value);
    const element = fields.get(name)?.element;
    if (element) writeElementValue(element, value);
    if (setOptions.shouldDirty) formState.dirtyFields[name] = true;
    notify(valueSubscribers, name);
    notifyField(name);
    if (setOptions.shouldValidate) scheduleValidation(name);
  }
  function getValues() {
    syncAllFields();
    return cloneValue(values);
  }
  function getValuesSnapshot() {
    return cloneValue(values);
  }
  function getValue(name) {
    syncFieldValue(name);
    return getPath(values, name);
  }
  function subscribe(map, name, callback) {
    const listeners = map.get(name) ?? /* @__PURE__ */ new Set();
    listeners.add(callback);
    map.set(name, listeners);
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) map.delete(name);
    };
  }
  function unregister(name) {
    fields.delete(name);
    deletePath(values, name);
    delete formState.errors[name];
    delete formState.dirtyFields[name];
    delete formState.touchedFields[name];
    fieldStateOverrides.delete(name);
    notify(valueSubscribers, name);
    notifyField(name);
  }
  function handleSubmit(onValid) {
    return async (event) => {
      event?.preventDefault?.();
      formState.isSubmitting = true;
      notifyForm();
      const valid = await validate();
      if (valid) await onValid(getValues());
      formState.isSubmitting = false;
      notifyForm();
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

// src/hooks/useField.ts
import { useSyncExternalStore } from "react";
function useField(control, name) {
  return useSyncExternalStore(
    (callback) => control.subscribeField(name, callback),
    () => control.getFieldState(name),
    () => control.getFieldState(name)
  );
}

// src/hooks/useFieldArray.ts
import { useCallback, useMemo, useRef, useState } from "react";
var nextId = 0;
var createId = () => `field-array-${++nextId}`;
function useFieldArray(options) {
  const initial = useRef(
    (options.control.getValue(options.name) ?? []).map((value) => ({
      id: createId(),
      value
    }))
  );
  const [fields, setFields] = useState(initial.current);
  const commit = useCallback(
    (nextFields) => {
      setFields(nextFields);
      options.control.setValue(options.name, nextFields.map((field) => field.value), {
        shouldDirty: true
      });
    },
    [options.control, options.name]
  );
  const liveValues = useCallback(() => {
    const values = getPath(options.control.getValues(), options.name) ?? [];
    return values.map((value, index) => ({
      id: fields[index]?.id ?? createId(),
      value
    }));
  }, [fields, options.control, options.name]);
  return useMemo(
    () => ({
      append: (value) => commit([...liveValues(), { id: createId(), value }]),
      fields,
      insert: (index, value) => commit([...liveValues().slice(0, index), { id: createId(), value }, ...liveValues().slice(index)]),
      move: (from, to) => {
        const next = liveValues();
        const [item] = next.splice(from, 1);
        if (!item) return;
        next.splice(to, 0, item);
        commit(next);
      },
      remove: (index) => commit(liveValues().filter((_, fieldIndex) => fieldIndex !== index))
    }),
    [commit, fields, liveValues]
  );
}

// src/hooks/useForm.ts
import { useMemo as useMemo2, useRef as useRef2, useSyncExternalStore as useSyncExternalStore2 } from "react";
function useForm(options = {}) {
  const optionsRef = useRef2(options);
  const controlRef = useRef2();
  if (!controlRef.current) {
    controlRef.current = createFormControl(optionsRef.current);
  }
  const control = controlRef.current;
  const formState = useSyncExternalStore2(control.subscribeForm, control.getFormState, control.getFormState);
  return useMemo2(
    () => ({
      clearErrors: control.clearErrors,
      control,
      errors: formState.errors,
      formState,
      getValues: control.getValues,
      handleSubmit: control.handleSubmit,
      register: control.register,
      setError: control.setError,
      setValue: control.setValue,
      validate: control.validate,
      values: control.getValuesSnapshot()
    }),
    [control, formState]
  );
}

// src/hooks/useWatch.ts
import { useSyncExternalStore as useSyncExternalStore3 } from "react";
function useWatch(options) {
  return useSyncExternalStore3(
    (callback) => options.control.subscribeValue(options.name, callback),
    () => options.control.getValue(options.name),
    () => options.control.getValue(options.name)
  );
}

// src/resolvers/builtin.ts
function ruleConfig2(rule) {
  if (typeof rule === "object" && rule != null && "value" in rule) {
    return rule;
  }
  return { value: rule };
}
async function validateRule(values, name, rule) {
  const value = getPath(values, name);
  if (rule.required && (value == null || value === "")) {
    return { message: typeof rule.required === "string" ? rule.required : "This field is required", type: "required" };
  }
  if (rule.minLength && typeof value === "string") {
    const config = ruleConfig2(rule.minLength);
    if (value.length < config.value) {
      return { message: config.message ?? `Must be at least ${config.value} characters`, type: "minLength" };
    }
  }
  if (rule.pattern && typeof value === "string") {
    const config = ruleConfig2(rule.pattern);
    if (!config.value.test(value)) {
      return { message: config.message ?? "Invalid format", type: "pattern" };
    }
  }
  if (rule.validate) {
    const result = await rule.validate(value, values);
    if (typeof result === "string") return { message: result, type: "validate" };
    if (result === false) return { message: "Invalid value", type: "validate" };
  }
  return void 0;
}
function builtinResolver(schema) {
  return async (values) => {
    const errors = {};
    await Promise.all(
      Object.entries(schema).map(async ([name, rule]) => {
        if (!rule) return;
        const error = await validateRule(values, name, rule);
        if (error) errors[name] = error;
      })
    );
    return { values, errors };
  };
}
export {
  builtinResolver,
  createFormControl,
  useField,
  useFieldArray,
  useForm,
  useWatch
};
