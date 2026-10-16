import { useSyncExternalStore } from "react";
import type { FormControl } from "../core/types";
import type { FieldPath, FieldPathValue } from "../types/path";

export function useWatch<
  TValues extends object,
  TName extends FieldPath<TValues>
>(options: {
  control: FormControl<TValues>;
  name: TName;
}): FieldPathValue<TValues, TName> | undefined {
  return useSyncExternalStore(
    (callback) => options.control.subscribeValue(options.name, callback),
    () => options.control.getValue(options.name),
    () => options.control.getValue(options.name)
  );
}
