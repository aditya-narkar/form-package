import { useCallback, useMemo, useRef, useState } from "react";
import type { FormControl } from "../core/types";
import { getPath } from "../core/path";
import type { FieldPath } from "../types/path";

export interface FieldArrayItem<TItem> {
  id: string;
  value: TItem;
}

export interface UseFieldArrayReturn<TItem> {
  append: (value: TItem) => void;
  fields: Array<FieldArrayItem<TItem>>;
  insert: (index: number, value: TItem) => void;
  move: (from: number, to: number) => void;
  remove: (index: number) => void;
}

let nextId = 0;
const createId = () => `field-array-${++nextId}`;

export function useFieldArray<
  TValues extends object,
  TItem = unknown
>(options: {
  control: FormControl<TValues>;
  name: FieldPath<TValues>;
}): UseFieldArrayReturn<TItem> {
  const initial = useRef(
    ((options.control.getValue(options.name) as TItem[] | undefined) ?? []).map((value) => ({
      id: createId(),
      value
    }))
  );
  const [fields, setFields] = useState<Array<FieldArrayItem<TItem>>>(initial.current);

  const commit = useCallback(
    (nextFields: Array<FieldArrayItem<TItem>>) => {
      setFields(nextFields);
      options.control.setValue(options.name, nextFields.map((field) => field.value) as never, {
        shouldDirty: true
      });
    },
    [options.control, options.name]
  );

  const liveValues = useCallback(() => {
    const values = getPath<TItem[]>(options.control.getValues(), options.name) ?? [];
    return values.map((value, index) => ({
      id: fields[index]?.id ?? createId(),
      value
    }));
  }, [fields, options.control, options.name]);

  return useMemo(
    () => ({
      append: (value: TItem) => commit([...liveValues(), { id: createId(), value }]),
      fields,
      insert: (index: number, value: TItem) =>
        commit([...liveValues().slice(0, index), { id: createId(), value }, ...liveValues().slice(index)]),
      move: (from: number, to: number) => {
        const next = liveValues();
        const [item] = next.splice(from, 1);
        if (!item) return;
        next.splice(to, 0, item);
        commit(next);
      },
      remove: (index: number) => commit(liveValues().filter((_, fieldIndex) => fieldIndex !== index))
    }),
    [commit, fields, liveValues]
  );
}
