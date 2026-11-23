import type { SkinViewer } from "skinview3d";
import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    CanvasTexture,
    Euler,
    Float32BufferAttribute,
    FrontSide,
    Group,
    Mesh,
    MeshStandardMaterial,
    NearestFilter,
    Object3D,
    Points,
    PointsMaterial,
    SRGBColorSpace,
    Vector3,
} from "three";
import { loadTextureImage } from "./texture-cache";
import type { CosmeticModel, CosmeticSummary, Keyframe } from "./cosmetic-types";

// Corner indices (bit0 = x, bit1 = y, bit2 = z high) for TL, TR, BR, BL seen from outside.
// Shared with the API preview renderer (services/cosmetic_render.py).
const FACE_CORNERS: Record<string, [number, number, number, number]> = {
    north: [3, 2, 0, 1],
    south: [6, 7, 5, 4],
    east: [7, 3, 1, 5],
    west: [2, 6, 4, 0],
    up: [2, 3, 7, 6],
    down: [4, 5, 1, 0],
};
const DEG = Math.PI / 180;
const MAX_MODEL_BYTES = 2 * 1024 * 1024;

// Blockbench player space has the feet at y = 0 and the face towards -Z; skinview3d
// faces +Z, so each cosmetic is turned 180° and moved onto its body part's pivot.
const ANCHORS = {
    head: { part: "head", y: 24 },
    face: { part: "head", y: 24 },
    back: { part: "body", y: 18 },
    shoulder: { part: "body", y: 18 },
    aura: { part: "player", y: 24 },
} as const;

function rotatePoint(point: number[], rotation: number[], pivot: number[]) {
    const vector = new Vector3(point[0] - pivot[0], point[1] - pivot[1], point[2] - pivot[2]);
    vector.applyEuler(new Euler(rotation[0] * DEG, rotation[1] * DEG, rotation[2] * DEG, "ZYX"));
    return [vector.x + pivot[0], vector.y + pivot[1], vector.z + pivot[2]];
}

function cubeGeometry(cube: CosmeticModel["bones"][number]["cubes"][number], model: CosmeticModel) {
    const low = cube.from.map((value, axis) => Math.min(value, cube.to[axis]) - cube.inflate);
    const high = cube.to.map((value, axis) => Math.max(value, cube.from[axis]) + cube.inflate);
    const corners = Array.from({ length: 8 }, (_, mask) =>
        rotatePoint([0, 1, 2].map(axis => (mask >> axis & 1 ? high[axis] : low[axis])), cube.rotation, cube.pivot));
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const { uv_width: width, uv_height: height } = model.texture;
    for (const [name, face] of Object.entries(cube.faces)) {
        const order = FACE_CORNERS[name];
        if (!order) continue;
        const [u1, v1, u2, v2] = face.uv;
        let source = [[u1, v1], [u2, v1], [u2, v2], [u1, v2]];
        const turns = (face.rotation / 90) % 4;
        if (turns) source = [...source.slice(-turns), ...source.slice(0, -turns)];
        const base = positions.length / 3;
        order.forEach((corner, index) => {
            positions.push(...corners[corner]);
            uvs.push(source[index][0] / width, 1 - source[index][1] / height);
        });
        // TL→TR→BR and TL→BR→BL are counter-clockwise from outside.
        indices.push(base, base + 3, base + 2, base, base + 2, base + 1);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}

function sample(keyframes: Keyframe[], time: number): number[] {
    if (time <= keyframes[0].t) return keyframes[0].v;
    for (let index = 1; index < keyframes.length; index++) {
        const next = keyframes[index];
        if (time > next.t) continue;
        const previous = keyframes[index - 1];
        if (previous.interp === "step") return previous.v;
        const span = next.t - previous.t || 1;
        let amount = (time - previous.t) / span;
        if (previous.interp === "catmullrom") amount = amount * amount * (3 - 2 * amount);
        return previous.v.map((value, axis) => value + (next.v[axis] - value) * amount);
    }
    return keyframes[keyframes.length - 1].v;
}

interface BoneNode { object: Group; rest: number[]; pivot: number[]; parentPivot: number[] }

interface Built { root: Object3D; dispose(): void; tick(seconds: number): boolean }

function buildModel(model: CosmeticModel, map: CanvasTexture): Built {
    const material = new MeshStandardMaterial({ map, side: FrontSide, transparent: true, alphaTest: 0.1 });
    const geometries: BufferGeometry[] = [];
    const nodes: BoneNode[] = [];
    const root = new Group();
    model.bones.forEach((bone, index) => {
        const parent = bone.parent >= 0 ? nodes[bone.parent] : null;
        const group = new Group();
        const parentPivot = parent ? parent.pivot : [0, 0, 0];
        group.position.set(bone.pivot[0] - parentPivot[0], bone.pivot[1] - parentPivot[1], bone.pivot[2] - parentPivot[2]);
        group.rotation.set(bone.rotation[0] * DEG, bone.rotation[1] * DEG, bone.rotation[2] * DEG, "ZYX");
        (parent ? parent.object : root).add(group);
        nodes[index] = { object: group, rest: bone.rotation, pivot: bone.pivot, parentPivot };
        for (const cube of bone.cubes) {
            const geometry = cubeGeometry(cube, model);
            geometries.push(geometry);
            const mesh = new Mesh(geometry, material);
            // Cube corners are absolute; shift them into the bone's pivot space.
            mesh.position.set(-bone.pivot[0], -bone.pivot[1], -bone.pivot[2]);
            group.add(mesh);
        }
    });
    const animation = model.animations[0];
    return {
        root,
        tick(seconds) {
            if (!animation) return false;
            let time = seconds;
            if (animation.loop === "loop") time %= animation.length;
            else time = Math.min(time, animation.length);
            for (const channel of animation.channels) {
                const node = nodes[channel.bone];
                if (!node) continue;
                const value = sample(channel.keyframes, time);
                if (channel.channel === "rotation") {
                    node.object.rotation.set((node.rest[0] + value[0]) * DEG, (node.rest[1] + value[1]) * DEG, (node.rest[2] + value[2]) * DEG, "ZYX");
                } else if (channel.channel === "position") {
                    node.object.position.set(
                        node.pivot[0] - node.parentPivot[0] + value[0],
                        node.pivot[1] - node.parentPivot[1] + value[1],
                        node.pivot[2] - node.parentPivot[2] + value[2]);
                } else {
                    node.object.scale.set(value[0], value[1], value[2]);
                }
            }
            return true;
        },
        dispose() {
            geometries.forEach(geometry => geometry.dispose());
            material.dispose();
        },
    };
}

function buildParticles(model: CosmeticModel, map: CanvasTexture): Built {
    const settings = model.particles!;
    const count = Math.ceil(settings.rate * settings.lifetime);
    const geometry = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    const material = new PointsMaterial({ map, size: settings.size, transparent: true, alphaTest: 0.05, depthWrite: false, blending: AdditiveBlending });
    const points = new Points(geometry, material);
    const anchor = { feet: 1, body: 18, head: 30 }[settings.emitter];
    const seeds = Array.from({ length: count }, (_, index) => [Math.sin(index * 12.9898) * 43758.5453 % 1, Math.sin(index * 78.233) * 12345.678 % 1, (index / count) * settings.lifetime]);
    const spread = settings.spread * 16 + 6;
    return {
        root: points,
        tick(seconds) {
            seeds.forEach(([a, b, offset], index) => {
                const age = (seconds + offset) % settings.lifetime;
                const cycle = Math.floor((seconds + offset) / settings.lifetime);
                const jitter = (value: number) => Math.sin((value + cycle) * 91.7) * spread;
                positions[index * 3] = jitter(a) + settings.velocity[0] * age * 16;
                positions[index * 3 + 1] = anchor + jitter(b) / 4 + (settings.velocity[1] * age - settings.gravity * age * age / 2) * 16;
                positions[index * 3 + 2] = jitter(a + b) + settings.velocity[2] * age * 16;
            });
            geometry.attributes.position.needsUpdate = true;
            return true;
        },
        dispose() { geometry.dispose(); material.dispose(); },
    };
}

export interface CosmeticPlayer { setPlaying(value: boolean): void; dispose(): void }

/** Attach cosmetics to a skinview3d player; resources are released by ``dispose``. */
export function attachCosmetics(viewer: SkinViewer, cosmetics: CosmeticSummary[], render: () => void, onError: () => void = () => {}): CosmeticPlayer {
    const controller = new AbortController();
    const parts: { object: Object3D; parent: Object3D; built: Built; texture: CanvasTexture; frame: (seconds: number) => boolean }[] = [];
    let playing = false;
    let frame: number | undefined;
    let started = performance.now();
    let disposed = false;

    const step = () => {
        frame = undefined;
        if (disposed || !playing) return;
        const seconds = (performance.now() - started) / 1000;
        let moving = false;
        for (const part of parts) moving = part.built.tick(seconds) || part.frame(seconds) || moving;
        render();
        if (moving) frame = requestAnimationFrame(step);
    };

    const load = async (cosmetic: CosmeticSummary) => {
        const response = await fetch(cosmetic.model_url, { signal: controller.signal, credentials: "omit" });
        if (!response.ok || Number(response.headers.get("content-length")) > MAX_MODEL_BYTES) throw new Error("Cosmetic model unavailable");
        const model = await response.json() as CosmeticModel;
        const strip = await loadTextureImage(cosmetic.texture_url);
        if (disposed) return;
        const { width, height, frames, frame_times_ms: times } = model.texture;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d")!;
        context.imageSmoothingEnabled = false;
        let shown = -1;
        const total = times.reduce((sum, value) => sum + value, 0);
        const draw = (index: number) => {
            if (index === shown) return false;
            shown = index;
            context.clearRect(0, 0, width, height);
            context.drawImage(strip, 0, index * height, width, height, 0, 0, width, height);
            texture.needsUpdate = true;
            return true;
        };
        const texture = new CanvasTexture(canvas);
        texture.magFilter = NearestFilter;
        texture.minFilter = NearestFilter;
        texture.colorSpace = SRGBColorSpace;
        draw(0);
        const built = model.particles ? buildParticles(model, texture) : buildModel(model, texture);
        const anchor = ANCHORS[model.slot];
        const holder = new Group();
        holder.rotation.y = Math.PI;
        holder.position.y = -anchor.y;
        holder.add(built.root);
        const skin = viewer.playerObject.skin;
        const parent = anchor.part === "player" ? viewer.playerObject : anchor.part === "head" ? skin.head : skin.body;
        // The player object places the skin 8 px up; aura particles use player-space feet.
        if (anchor.part === "player") holder.position.y = -anchor.y + 8;
        parent.add(holder);
        built.tick(0);
        parts.push({
            object: holder,
            parent,
            built,
            texture,
            frame: seconds => {
                if (frames < 2 || !total) return false;
                let time = (seconds * 1000) % total;
                let index = 0;
                while (time >= times[index]) time -= times[index++];
                draw(index);
                return true;
            },
        });
        render();
        if (playing && frame === undefined) frame = requestAnimationFrame(step);
    };

    for (const cosmetic of cosmetics) {
        load(cosmetic).catch(error => {
            if (!disposed && (error as Error).name !== "AbortError") onError();
        });
    }

    return {
        setPlaying(value) {
            if (value === playing) return;
            playing = value;
            if (value) {
                started = performance.now();
                if (frame === undefined) frame = requestAnimationFrame(step);
            } else if (frame !== undefined) {
                cancelAnimationFrame(frame);
                frame = undefined;
            }
        },
        dispose() {
            disposed = true;
            controller.abort();
            if (frame !== undefined) cancelAnimationFrame(frame);
            for (const part of parts) {
                part.parent.remove(part.object);
                part.built.dispose();
                part.texture.dispose();
            }
            parts.length = 0;
        },
    };
}
