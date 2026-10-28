// Match skinview3d's elytra UVs on its normalized 64 x 32 cape texture.
export function hasElytraPixels({ data, width, height }: { data: Uint8ClampedArray; width: number; height: number }): boolean {
    for (let y = 0; y < height * 22 / 32; y++) {
        const start = Math.ceil(width * (y < height * 2 / 32 ? 24 : 22) / 64);
        const end = width * (y < height * 2 / 32 ? 44 : 46) / 64;
        for (let x = start; x < end; x++) {
            if (data[(y * width + x) * 4 + 3] > 0) return true;
        }
    }
    return false;
}
