type Primitive = bigint | boolean | Date | Function | null | number | string | symbol | undefined;
type ArrayKey = number;
type PreviousDepth = [never, 0, 1, 2, 3, 4, 5, 6];
type Join<Key, Previous> = Key extends string | number ? Previous extends string | number ? `${Key}.${Previous}` : never : never;
type PathImpl<T, Depth extends number = 6> = [Depth] extends [never] ? never : T extends Primitive ? never : T extends readonly (infer Item)[] ? `${ArrayKey}` | Join<ArrayKey, PathImpl<Item, PreviousDepth[Depth]>> : {
    [Key in keyof T & (string | number)]: T[Key] extends Primitive ? `${Key}` : `${Key}` | Join<Key, PathImpl<T[Key], PreviousDepth[Depth]>>;
}[keyof T & (string | number)];
type FieldPath<T> = T extends object ? PathImpl<T> : never;
type PathValue<T, Path extends string> = Path extends `${infer Head}.${infer Tail}` ? Head extends keyof T ? PathValue<T[Head], Tail> : T extends readonly (infer Item)[] ? Head extends `${number}` ? PathValue<Item, Tail> : never : never : Path extends keyof T ? T[Path] : T extends readonly (infer Item)[] ? Path extends `${number}` ? Item : never : never;
type FieldPathValue<T, Path extends string> = PathValue<T, Path>;

type FormMode = "onBlur" | "onChange" | "onSubmit";
interface FieldError {
    message: string;
    type?: string;
}
type FieldErrors<TValues> = Partial<Record<FieldPath<TValues>, FieldError>>;
interface ResolverResult<TValues> {
    values: TValues;
    errors: FieldErrors<TValues>;
}
type MaybePromise<T> = Promise<T> | T;
type Resolver<TValues> = (values: TValues) => MaybePromise<ResolverResult<TValues>>;
type RuleValue<T> = T | {
    message?: string;
    value: T;
};
interface RegisterOptions<TValues, TName extends FieldPath<TValues> = FieldPath<TValues>> {
    debounceMs?: number;
    minLength?: RuleValue<number>;
    pattern?: RuleValue<RegExp>;
    required?: boolean | string;
    validate?: (value: FieldPathValue<TValues, TName>, values: TValues) => MaybePromise<boolean | string | undefined>;
}
interface FieldState {
    dirty: boolean;
    error?: FieldError;
    isValidating: boolean;
    touched: boolean;
}
interface FormState<TValues> {
    dirtyFields: Partial<Record<FieldPath<TValues>, boolean>>;
    errors: FieldErrors<TValues>;
    isSubmitting: boolean;
    isValidating: boolean;
    touchedFields: Partial<Record<FieldPath<TValues>, boolean>>;
}
interface UseFormOptions<TValues> {
    defaultValues?: Partial<TValues>;
    mode?: FormMode;
    resolver?: Resolver<TValues>;
}
interface RegisterReturn {
    name: string;
    onBlur: () => void;
    onChange: () => void;
    ref: (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => void;
}
interface FormControl<TValues extends object> {
    clearErrors: (name?: FieldPath<TValues>) => void;
    getFieldState: (name: FieldPath<TValues>) => FieldState;
    getFormState: () => FormState<TValues>;
    getValue: <TName extends FieldPath<TValues>>(name: TName) => FieldPathValue<TValues, TName> | undefined;
    getValues: () => TValues;
    getValuesSnapshot: () => TValues;
    handleSubmit: (onValid: (values: TValues) => MaybePromise<void>) => (event?: {
        preventDefault?: () => void;
    }) => Promise<void>;
    register: <TName extends FieldPath<TValues>>(name: TName, options?: RegisterOptions<TValues, TName>) => RegisterReturn;
    setError: (name: FieldPath<TValues>, error: FieldError) => void;
    setValue: <TName extends FieldPath<TValues>>(name: TName, value: FieldPathValue<TValues, TName>, options?: {
        shouldDirty?: boolean;
        shouldValidate?: boolean;
    }) => void;
    subscribeField: (name: FieldPath<TValues>, callback: () => void) => () => void;
    subscribeForm: (callback: () => void) => () => void;
    subscribeValue: (name: FieldPath<TValues>, callback: () => void) => () => void;
    unregister: (name: FieldPath<TValues>) => void;
    validate: (name?: FieldPath<TValues>) => Promise<boolean>;
}
interface UseFormReturn<TValues extends object> {
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

export type { FormControl as F, RegisterOptions as R, UseFormOptions as U, FieldPath as a, FieldState as b, UseFormReturn as c, FieldPathValue as d, Resolver as e, FieldError as f, FieldErrors as g, FormMode as h, FormState as i, ResolverResult as j };
