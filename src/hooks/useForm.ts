import { useMemo, useRef, useSyncExternalStore } from "react";
import { createFormControl } from "../core/createFormControl";
import type { FormControl, UseFormOptions, UseFormReturn } from "../core/types";

export function useForm<TValues extends object = Record<string, unknown>>(
  options: UseFormOptions<TValues> = {}
): UseFormReturn<TValues> {
  const optionsRef = useRef(options);
  const controlRef = useRef<FormControl<TValues>>();

  if (!controlRef.current) {
    controlRef.current = createFormControl(optionsRef.current);
  }

  const control = controlRef.current;
  const formState = useSyncExternalStore(control.subscribeForm, control.getFormState, control.getFormState);

  return useMemo(
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
