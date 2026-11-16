/**
 * Helpers to access nested object fields with typed paths
 * (gotta trust Claude on this one)
 */

type Join<K extends string, P> = P extends string ? `${K}.${P}` : never;

type Prev = [never, 0, 1, 2, 3, 4, 5];

export type Path<T, D extends number = 5> = [D] extends [never]
  ? never
  : T extends readonly unknown[]
    ? never
    : T extends object
      ? { [K in keyof T & string]: K | Join<K, Path<T[K], Prev[D]>> }[keyof T & string]
      : never;

export type PathValue<T, P extends string> = P extends `${infer K}.${infer R}`
  ? K extends keyof T
    ? PathValue<T[K], R>
    : never
  : P extends keyof T
    ? T[P]
    : never;

function parentOf(root: object, path: string): [Record<string, unknown>, string] {
  const keys = path.split(".");
  const last = keys.pop()!;
  let cur: unknown = root;
  for (const k of keys) {
    if (typeof cur !== "object" || cur === null || !(k in cur)) {
      throw new Error(`Invalid path "${path}"`);
    }
    cur = (cur as Record<string, unknown>)[k];
  }
  if (typeof cur !== "object" || cur === null) throw new Error(`Invalid path "${path}"`);
  return [cur as Record<string, unknown>, last];
}

export function getAt<T extends object, P extends Path<T> & string>(
  root: T,
  path: P,
): PathValue<T, P> {
  const [parent, key] = parentOf(root, path);
  return parent[key] as PathValue<T, P>;
}

export function setAt<T extends object, P extends Path<T> & string>(
  draft: T,
  path: P,
  value: PathValue<T, P>,
): void {
  const [parent, key] = parentOf(draft, path);
  parent[key] = value;
}
