export function formatMinecraftServerCode(value: string): string {
  return value.replace(/[ -]/g, "").replace(/[a-z]/g, char => char.toUpperCase());
}

export function normalizeMinecraftServerCode(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 64 || /[^\x20-\x7e]/.test(value)) return null;
  const code = formatMinecraftServerCode(value);
  return /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{12}$/.test(code) ? code : null;
}
