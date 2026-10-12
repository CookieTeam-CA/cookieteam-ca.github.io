// Vanilla statistic formatter assignments:
// https://github.com/mahtomedi/minecraft/blob/main/src/main/java/net/minecraft/stats/Stats.java
const times = new Set(["play_time", "total_world_time", "time_since_death", "time_since_rest", "sneak_time"]);
const damage = new Set(["damage_dealt", "damage_dealt_absorbed", "damage_dealt_resisted", "damage_taken", "damage_blocked_by_shield", "damage_absorbed", "damage_resisted"]);
const counts = new Set(["animals_bred", "bell_ring", "clean_armor", "clean_banner", "clean_shulker_box", "deaths", "drop", "eat_cake_slice", "enchant_item", "fill_cauldron", "fish_caught", "inspect_dispenser", "inspect_dropper", "inspect_hopper", "jump", "leave_game", "mob_kills", "player_kills", "pot_flower", "raid_trigger", "raid_win", "sleep_in_bed", "talked_to_villager", "target_hit", "traded_with_villager", "use_cauldron", "play_noteblock", "play_record", "tune_noteblock", "trigger_trapped_chest"]);
const units: Record<string, string> = { mined: "Blöcke", crafted: "Items", used: "Nutzungen", broken: "Items", picked_up: "Items", dropped: "Items", killed: "Kills", killed_by: "Tode" };
const formatter = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });
const number = (value: number) => formatter.format(value);

export function formatStatValue(key: string, value: number): string {
  const [category, stat] = key.split("/").map(part => part.replace(/^minecraft:/, ""));
  if (!key.startsWith("minecraft:") || !stat || !key.includes("/minecraft:")) return number(value);
  if (category !== "custom") return units[category] ? `${number(value)} ${units[category]}` : number(value);
  if (stat.endsWith("_one_cm")) {
    if (value >= 100000) return `${number(value / 100000)} km`;
    if (value >= 100) return `${number(value / 100)} m`;
    return `${number(value)} cm`;
  }
  if (times.has(stat)) {
    const seconds = value / 20;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    if (hours) return `${number(hours)} h ${minutes} min`;
    if (minutes) return `${minutes} min ${Math.floor(seconds % 60)} s`;
    return `${number(seconds)} s`;
  }
  if (damage.has(stat)) return `${number(value / 10)} Herzen`;
  if (counts.has(stat) || stat.startsWith("interact_with_") || stat.startsWith("open_")) return `${number(value)} mal`;
  return number(value);
}
