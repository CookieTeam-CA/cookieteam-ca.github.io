export type Query = Record<string, string | string[] | undefined>;

export const queryText = (query: Query, key: string) => typeof query[key] === "string" ? query[key] as string : "";

export function queryValues(query: Query, key: string): string[] {
  const value = query[key];
  return (Array.isArray(value) ? value : typeof value === "string" ? [value] : []).filter(Boolean);
}

export function queryParams(query: Query): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) for (const item of value) params.append(key, item);
  }
  return params;
}

export function excludedCategories(query: Query, prefix = ""): string[] {
  return [...new Set(queryValues(query, `${prefix}exclude`))];
}
