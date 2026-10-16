export function getPath<T = unknown>(source: unknown, path: string): T | undefined {
  if (!path) return source as T;
  return path.split(".").reduce<unknown>((current, key) => {
    if (current == null) return undefined;
    return (current as Record<string, unknown>)[key];
  }, source) as T | undefined;
}

export function setPath<T extends Record<string, unknown>>(source: T, path: string, value: unknown): T {
  const keys = path.split(".");
  let cursor: Record<string, unknown> = source;

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
    cursor = cursor[key] as Record<string, unknown>;
  });

  return source;
}

export function deletePath(source: Record<string, unknown>, path: string): void {
  const keys = path.split(".");
  const last = keys.pop();
  if (!last) return;
  const parent = getPath<Record<string, unknown>>(source, keys.join("."));
  if (parent && typeof parent === "object") {
    delete parent[last];
  }
}

export function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}
