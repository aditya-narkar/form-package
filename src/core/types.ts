import type { FieldPath, FieldPathValue } from "../types/path";

export type FormMode = "onBlur" | "onChange" | "onSubmit";

export interface FieldError {
  message: string;
  type?: string;
}

export type FieldErrors<TValues> = Partial<Record<FieldPath<TValues>, FieldError>>;

export interface ResolverResult<TValues> {
  values: TValues;
  errors: FieldErrors<TValues>;
}

export type MaybePromise<T> = Promise<T> | T;

export type Resolver<TValues> = (values: TValues) => MaybePromise<ResolverResult<TValues>>;

export type RuleValue<T> = T | { message?: string; value: T };

export interface RegisterOptions<TValues, TName extends FieldPath<TValues> = FieldPath<TValues>> {
  debounceMs?: number;
  minLength?: RuleValue<number>;
  pattern?: RuleValue<RegExp>;
  required?: boolean | string;
  validate?: (
    value: FieldPathValue<TValues, TName>,
    values: TValues
  ) => MaybePromise<boolean | string | undefined>;
}

export interface FieldState {
  dirty: boolean;
  error?: FieldError;
  isValidating: boolean;
  touched: boolean;
}

export interface FormState<TValues> {
  dirtyFields: Partial<Record<FieldPath<TValues>, boolean>>;
  errors: FieldErrors<TValues>;
  isSubmitting: boolean;
  isValidating: boolean;
  touchedFields: Partial<Record<FieldPath<TValues>, boolean>>;
}

export interface UseFormOptions<TValues> {
  defaultValues?: Partial<TValues>;
  mode?: FormMode;
  resolver?: Resolver<TValues>;
}

export interface RegisterReturn {
  name: string;
  onBlur: () => void;
  onChange: () => void;
  ref: (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => void;
}

export interface FormControl<TValues extends object> {
  clearErrors: (name?: FieldPath<TValues>) => void;
  getFieldState: (name: FieldPath<TValues>) => FieldState;
  getFormState: () => FormState<TValues>;
  getValue: <TName extends FieldPath<TValues>>(name: TName) => FieldPathValue<TValues, TName> | undefined;
  getValues: () => TValues;
  getValuesSnapshot: () => TValues;
  handleSubmit: (onValid: (values: TValues) => MaybePromise<void>) => (event?: { preventDefault?: () => void }) => Promise<void>;
  register: <TName extends FieldPath<TValues>>(name: TName, options?: RegisterOptions<TValues, TName>) => RegisterReturn;
  setError: (name: FieldPath<TValues>, error: FieldError) => void;
  setValue: <TName extends FieldPath<TValues>>(
    name: TName,
    value: FieldPathValue<TValues, TName>,
    options?: { shouldDirty?: boolean; shouldValidate?: boolean }
  ) => void;
  subscribeField: (name: FieldPath<TValues>, callback: () => void) => () => void;
  subscribeForm: (callback: () => void) => () => void;
  subscribeValue: (name: FieldPath<TValues>, callback: () => void) => () => void;
  unregister: (name: FieldPath<TValues>) => void;
  validate: (name?: FieldPath<TValues>) => Promise<boolean>;
}

export interface UseFormReturn<TValues extends object> {
  clearErrors: FormControl<TValues>["clearErrors"];
  control: FormControl<TValues>;
  errors: FieldErrors<TValues>;
  formState: FormState<TValues>;
  getValues: FormControl<TValues>["getValues"];
  handleSubmit: FormControl<TValues>["handleSubmit"];
  register: FormControl<TValues>["register"];
  setError: FormControl<TValues>["setError"];
  setValue: FormControl<TValues>["setValue"];
  values: TValues;
  validate: FormControl<TValues>["validate"];
}
