import type { CSSProperties } from "react";
import atlas from "../lib/sprites.json";

const categoryItems: Record<string, string> = {
  broken: "anvil", crafted: "crafting_table", mined: "diamond_pickaxe", used: "iron_pickaxe",
  picked_up: "chest", dropped: "hopper", killed: "diamond_sword", killed_by: "skeleton_skull",
  custom: "recovery_compass", story: "crafting_table", adventure: "diamond_sword", nether: "netherrack",
  end: "end_stone", husbandry: "wheat", mining: "diamond_pickaxe", crafting: "crafting_table",
};
const customItems: Record<string, string> = {
  jump: "slime_block", play_time: "clock", total_world_time: "clock", walk_one_cm: "leather_boots",
  sprint_one_cm: "leather_boots", fly_one_cm: "elytra", swim_one_cm: "water_bucket",
  deaths: "skeleton_skull", damage_dealt: "diamond_sword", damage_taken: "shield",
  mob_kills: "diamond_sword", player_kills: "iron_sword", fish_caught: "fishing_rod",
};
const achievementItems: Record<string, string> = {
  mine_stone: "stone_pickaxe", mine_diamond: "diamond", diamond: "diamond", elytra: "elytra",
  enter_the_nether: "flint_and_steel", obtain_ancient_debris: "ancient_debris",
  netherite_armor: "netherite_chestplate", shiny_gear: "diamond_chestplate", fishy_business: "fishing_rod",
};
export function MinecraftIcon({ statKey, category, achievement = false, size = 40 }: { statKey?: string; category?: string; achievement?: boolean; size?: number }) {
  const segments = statKey?.replaceAll("minecraft:", "").split("/") ?? [];
  const group = segments[0] ?? category?.toLowerCase() ?? "custom";
  const item = segments.at(-1) ?? "";
  const sprites = atlas.sprites as Record<string, number[]>;
  const name = achievement ? achievementItems[item] ?? categoryItems[group] : group === "custom" ? customItems[item] : item;
  const position = sprites[name ?? ""] ?? sprites[categoryItems[group] ?? "recovery_compass"] ?? sprites.stone;
  const style: CSSProperties = {
    width: size, height: size,
    backgroundImage: "url('/minecraft/sprites.png')",
    backgroundSize: `${atlas.columns * size}px ${atlas.rows * size}px`,
    backgroundPosition: `-${position[0] * size}px -${position[1] * size}px`,
  };
  return <span className="stats-minecraft-icon" aria-hidden="true" style={style} />;
}
