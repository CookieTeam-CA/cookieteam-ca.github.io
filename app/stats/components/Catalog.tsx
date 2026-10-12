import { advancementHref, getSnapshot, statHref } from "../lib/api";
import type { Query } from "./UI";
import Collection from "./Collection";
import { nameSort, valueSort } from "../lib/collections";

export default async function Catalog({ query, achievement = false }: { query: Query; achievement?: boolean }) {
  const data = await getSnapshot();
  const items = achievement ? data.advancements.map(item => ({ ...item, category: item.tab })) : data.stats;
  const rows = items.map(item => {
    const entries = (achievement ? data.advancementBoards : data.statBoards).get(item.id) ?? [];
    return { id: item.id, name: item.display_name, href: achievement ? advancementHref(item.id) : statHref(item.id),
      category: item.category, iconKey: item.id, achievement,
      description: "description" in item ? String(item.description) : undefined,
      heads: entries.slice(0, 5), participants: entries.length, value: entries[0]?.value ?? 0, statKey: achievement ? undefined : item.id,
    };
  });
  const sortOptions = [...nameSort, { value: "category_asc", label: "Kategorie: A–Z" }, { value: "participants_desc", label: "Meiste Spieler" }, { value: "participants_asc", label: "Wenigste Spieler" }, ...(!achievement ? valueSort.map(option => ({ ...option, label: option.label.replace("Wert", "Spitzenwert") })) : [])];
  return <Collection rows={rows} query={query} categories categoryLabel={achievement ? "Tab" : "Kategorie"}
    label={achievement ? "Achievements" : "Statistiken"} placeholder={achievement ? "Achievement suchen …" : "Statistik oder Schlüssel suchen …"}
    sortOptions={sortOptions} columns={[{ key: "category", label: achievement ? "Tab" : "Kategorie" }, { key: "participants", label: "Spieler" }, ...(!achievement ? [{ key: "value" as const, label: "Spitzenwert" }] : [])]} />;
}
