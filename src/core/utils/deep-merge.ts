
export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as unknown;

  return prototype === Object.prototype || prototype === null;
}

function mergeRecords(target: PlainObject, source: PlainObject): PlainObject {
  const result: PlainObject = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    if (sourceValue === undefined) {
      continue;
    }

    const targetValue = result[key];

    result[key] =
      isPlainObject(targetValue) && isPlainObject(sourceValue)
        ? mergeRecords(targetValue, sourceValue)
        : sourceValue;
  }

  return result;
}

export function deepMerge<T>(target: T, source: Partial<DeepPartial<T>>): T {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return source === undefined ? target : (source as T);
  }

  return mergeRecords(target, source) as T;
}
