export function clampZoom(value: number) {
    return Math.min(5, Math.max(0.25, value));
}
