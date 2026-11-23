export type CosmeticSlot = "head" | "face" | "back" | "shoulder" | "aura";
export const COSMETIC_SLOTS: CosmeticSlot[] = ["head", "face", "back", "shoulder", "aura"];
export const MAX_EQUIPPED_COSMETICS = 3;

export interface CosmeticTextureInfo {
    width: number;
    height: number;
    uv_width: number;
    uv_height: number;
    frames: number;
    frame_times_ms: number[];
}

export interface CosmeticSummary {
    cosmetic_id: number;
    name: string;
    slot: CosmeticSlot;
    owner_uuid: string;
    owner_name: string;
    shareable: boolean;
    status: "pending" | "approved" | "rejected";
    revision: string;
    performance: { score: number; rating: number };
    texture: CosmeticTextureInfo;
    animated: boolean;
    model_url: string;
    texture_url: string;
    preview_url: string;
    created_at: string;
    wearers?: number;
    hidden?: boolean;
    reports?: number | { reporter_uuid: string; reason: string; created_at: string }[];
    reviewed_by?: string | null;
}

export interface Keyframe { t: number; v: number[]; interp: "linear" | "catmullrom" | "step" }

export interface CosmeticModel {
    format: 1;
    slot: CosmeticSlot;
    texture: CosmeticTextureInfo;
    bones: {
        name: string;
        parent: number;
        pivot: number[];
        rotation: number[];
        cubes: {
            from: number[];
            to: number[];
            inflate: number;
            pivot: number[];
            rotation: number[];
            faces: Record<string, { uv: [number, number, number, number]; rotation: number }>;
        }[];
    }[];
    animations: {
        name: string;
        loop: "loop" | "once" | "hold";
        length: number;
        channels: { bone: number; channel: "rotation" | "position" | "scale"; keyframes: Keyframe[] }[];
    }[];
    particles?: {
        emitter: "feet" | "body" | "head";
        rate: number;
        lifetime: number;
        size: number;
        spread: number;
        gravity: number;
        velocity: [number, number, number];
        fade: boolean;
    };
    performance: { score: number; rating: number };
}

export interface AccountCosmetics {
    owned: CosmeticSummary[];
    equipped: CosmeticSummary[];
    hidden_players: string[];
    moderator: boolean;
    limit: number;
}
