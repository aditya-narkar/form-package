import { useSyncExternalStore } from "react";
import type { FieldState, FormControl } from "../core/types";
import type { FieldPath } from "../types/path";

export function useField<
  TValues extends object,
  TName extends FieldPath<TValues>
>(control: FormControl<TValues>, name: TName): FieldState {
  return useSyncExternalStore(
    (callback) => control.subscribeField(name, callback),
    () => control.getFieldState(name),
    () => control.getFieldState(name)
  );
}
