import type { SortOption } from "./collections";
type Query = Record<string, string | string[] | undefined>;
const pair = (field: string) => [`${field}_asc`, `${field}_desc`];
export const sorts = {
  points: [...pair("name"), ...pair("rank"), ...pair("points"), ...pair("value")],
  stats: [...pair("name"), ...pair("participants"), ...pair("value"), "category_asc"],
  advancements: [...pair("name"), ...pair("participants"), "category_asc"],
  statBoard: [...pair("name"), ...pair("rank"), ...pair("points"), ...pair("value")],
  advancementBoard: [...pair("name"), ...pair("rank"), ...pair("points"), ...pair("time")],
  directory: [...pair("name"), ...pair("rank"), ...pair("points"), ...pair("value")],
  profileStats: [...pair("name"), ...pair("rank"), ...pair("value"), "category_asc"],
  profileAdvancements: [...pair("name"), ...pair("rank"), ...pair("time"), ...pair("completed"), "category_asc"],
};
export function collectionQuery(query: Query, allowed: string[] | SortOption[], defaultSort: string, prefix = "", apiPrefix = "", limit = 15) {
  const text = (key: string) => typeof query[prefix + key] === "string" ? query[prefix + key] as string : "";
  const sort = text("sort");
  const page = Number(text("page"));
  const params = new URLSearchParams();
  params.set(apiPrefix + "q", text("search").trim().toLowerCase());
  params.set(apiPrefix + "category", text("category"));
  const exclude = query[prefix + "exclude"];
  for (const item of (Array.isArray(exclude) ? exclude : typeof exclude === "string" ? [exclude] : []).filter(Boolean)) params.append(apiPrefix + "exclude", item);
  params.set(apiPrefix + "sort", allowed.some(option => (typeof option === "string" ? option : option.value) === sort) ? sort : defaultSort);
  params.set(apiPrefix + "page", String(Number.isSafeInteger(page) && page > 0 ? page : 1));
  // The website has fixed page sizes; arbitrary URL limit parameters were ignored.
  params.set(apiPrefix + "limit", String(limit));
  return params;
}
export function profileQuery(query: Query) {
  const params = collectionQuery(query, sorts.profileStats, "value_desc", "", "stats_", 8);
  collectionQuery(query, sorts.profileAdvancements, "time_desc", "achievements_", "advancements_", 8).forEach((value, key) => params.append(key, value));
  return params;
}
