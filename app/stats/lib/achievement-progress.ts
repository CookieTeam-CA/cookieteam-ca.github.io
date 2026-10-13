// CA6 ran Minecraft 1.21.11. Its total must not depend on which
// achievements have already been recorded in the API's catalog.
export const CA6_ACHIEVEMENT_TOTAL = 126;

export function achievementPercentage(completed: number): number {
  return completed / CA6_ACHIEVEMENT_TOTAL * 100;
}
