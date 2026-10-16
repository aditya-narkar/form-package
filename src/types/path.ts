type Primitive = bigint | boolean | Date | Function | null | number | string | symbol | undefined;
type ArrayKey = number;
type PreviousDepth = [never, 0, 1, 2, 3, 4, 5, 6];

type Join<Key, Previous> = Key extends string | number
  ? Previous extends string | number
    ? `${Key}.${Previous}`
    : never
  : never;

type PathImpl<T, Depth extends number = 6> = [Depth] extends [never]
  ? never
  : T extends Primitive
  ? never
  : T extends readonly (infer Item)[]
    ? `${ArrayKey}` | Join<ArrayKey, PathImpl<Item, PreviousDepth[Depth]>>
    : {
        [Key in keyof T & (string | number)]: T[Key] extends Primitive
          ? `${Key}`
          : `${Key}` | Join<Key, PathImpl<T[Key], PreviousDepth[Depth]>>;
      }[keyof T & (string | number)];

export type FieldPath<T> = T extends object ? PathImpl<T> : never;

type PathValue<T, Path extends string> = Path extends `${infer Head}.${infer Tail}`
  ? Head extends keyof T
    ? PathValue<T[Head], Tail>
    : T extends readonly (infer Item)[]
      ? Head extends `${number}`
        ? PathValue<Item, Tail>
        : never
      : never
  : Path extends keyof T
    ? T[Path]
    : T extends readonly (infer Item)[]
      ? Path extends `${number}`
        ? Item
        : never
      : never;

export type FieldPathValue<T, Path extends string> = PathValue<T, Path>;
