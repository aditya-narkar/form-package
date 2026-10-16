import { U as UseFormOptions, F as FormControl, a as FieldPath, b as FieldState, c as UseFormReturn, d as FieldPathValue, R as RegisterOptions, e as Resolver } from './types-CZnFTbdo.js';
export { f as FieldError, g as FieldErrors, h as FormMode, i as FormState, j as ResolverResult } from './types-CZnFTbdo.js';

declare function createFormControl<TValues extends object>(options?: UseFormOptions<TValues>): FormControl<TValues>;

declare function useField<TValues extends object, TName extends FieldPath<TValues>>(control: FormControl<TValues>, name: TName): FieldState;

interface FieldArrayItem<TItem> {
    id: string;
    value: TItem;
}
interface UseFieldArrayReturn<TItem> {
    append: (value: TItem) => void;
    fields: Array<FieldArrayItem<TItem>>;
    insert: (index: number, value: TItem) => void;
    move: (from: number, to: number) => void;
    remove: (index: number) => void;
}
declare function useFieldArray<TValues extends object, TItem = unknown>(options: {
    control: FormControl<TValues>;
    name: FieldPath<TValues>;
}): UseFieldArrayReturn<TItem>;

declare function useForm<TValues extends object = Record<string, unknown>>(options?: UseFormOptions<TValues>): UseFormReturn<TValues>;

declare function useWatch<TValues extends object, TName extends FieldPath<TValues>>(options: {
    control: FormControl<TValues>;
    name: TName;
}): FieldPathValue<TValues, TName> | undefined;

type BuiltinRule<TValues, TName extends FieldPath<TValues> = FieldPath<TValues>> = RegisterOptions<TValues, TName>;
type BuiltinSchema<TValues> = Partial<Record<FieldPath<TValues>, BuiltinRule<TValues>>>;
declare function builtinResolver<TValues extends object>(schema: BuiltinSchema<TValues>): Resolver<TValues>;

export { type BuiltinRule, type BuiltinSchema, FieldPath, FieldPathValue, FieldState, FormControl, RegisterOptions, Resolver, UseFormOptions, UseFormReturn, builtinResolver, createFormControl, useField, useFieldArray, useForm, useWatch };
