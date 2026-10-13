import { advancementHref, getStats, getAdvancements, statHref } from "../lib/api";
import type { Query } from "./UI";
import Collection from "./Collection";
import { nameSort, valueSort } from "../lib/collections";

export default async function Catalog({ query, achievement = false }: { query: Query; achievement?: boolean }) {
  const data = achievement ? await getAdvancements(query) : await getStats(query);
  const rows = data.items.map(item => ({
    id: item.id, name: item.display_name, href: achievement ? advancementHref(item.id) : statHref(item.id),
    category: "tab" in item ? item.tab : item.category, iconKey: item.id, achievement,
    description: "description" in item ? item.description : undefined,
    heads: item.top5, participants: item.participants, value: "highest_value" in item ? item.highest_value : undefined, statKey: achievement ? undefined : item.id,
  }));
  const sortOptions = [...nameSort, { value: "category_asc", label: "Kategorie: A–Z" }, { value: "participants_desc", label: "Meiste Spieler" }, { value: "participants_asc", label: "Wenigste Spieler" }, ...(!achievement ? valueSort.map(option => ({ ...option, label: option.label.replace("Wert", "Highscore") })) : [])];
  return <Collection rows={rows} data={data} query={query} categories categoryLabel={achievement ? "Tab" : "Kategorie"}
    label={achievement ? "Achievements" : "Statistiken"} placeholder={achievement ? "Achievement suchen …" : "Statistik oder Schlüssel suchen …"}
    sortOptions={sortOptions} columns={[{ key: "category", label: achievement ? "Tab" : "Kategorie" }, { key: "participants", label: "Spieler" }, ...(!achievement ? [{ key: "value" as const, label: "Highscore" }] : [])]} />;
}
