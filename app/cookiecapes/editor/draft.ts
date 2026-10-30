type LayerType = "template" | "drawing" | "image";

export interface EditorLayer {
    id: string;
    type: LayerType;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;

    imageSrc?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;

    lines?: LineData[];
    fillCanvasDataURL?: string | null;
}

export interface LineData {
    tool: "brush" | "eraser";
    points: number[];
    color: string;
    strokeWidth: number;
}

export const EDITOR_DRAFT_KEY = "cookiecapes-editor-draft-v1";
export interface EditorDraft {
    activeTemplate: "standard" | "elytra";
    activeLayerId: string | null;
    layers: EditorLayer[];
}

export function readEditorDraft(raw: string): EditorDraft {
    const draft = JSON.parse(raw) as EditorDraft;
    const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
    if (!draft || !["standard", "elytra"].includes(draft.activeTemplate) ||
        !(draft.activeLayerId === null || typeof draft.activeLayerId === "string") ||
        !Array.isArray(draft.layers) || !draft.layers.every(layer =>
            layer && typeof layer.id === "string" && typeof layer.name === "string" &&
            ["drawing", "image"].includes(layer.type) && typeof layer.visible === "boolean" &&
            typeof layer.locked === "boolean" && finite(layer.opacity) &&
            ["x", "y", "width", "height", "rotation", "scaleX", "scaleY"].every(key =>
                layer[key as keyof EditorLayer] === undefined || finite(layer[key as keyof EditorLayer])) &&
            (layer.type !== "image" || typeof layer.imageSrc === "string" && layer.imageSrc.startsWith("data:image/")) &&
            (layer.fillCanvasDataURL == null || typeof layer.fillCanvasDataURL === "string" && layer.fillCanvasDataURL.startsWith("data:image/")) &&
            (layer.lines === undefined || Array.isArray(layer.lines) && layer.lines.every(line =>
                line && ["brush", "eraser"].includes(line.tool) && typeof line.color === "string" &&
                finite(line.strokeWidth) && Array.isArray(line.points) && line.points.every(finite))))) {
        throw new Error("Invalid editor draft");
    }
    return draft;
}

