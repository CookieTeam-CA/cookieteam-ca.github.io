"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft, Download, Eraser, Image as ImageIcon,
    Pencil, RotateCcw, RotateCw, Move, Hand, ZoomIn, ZoomOut, Maximize,
    Trash2, Eye, EyeOff, Plus, PaintBucket, SlidersHorizontal, X
} from "lucide-react";
import { Stage, Layer, Image as KonvaImage, Line, Transformer } from "react-konva/lib/ReactKonvaCore";
import "konva/lib/shapes/Image";
import "konva/lib/shapes/Line";
import "konva/lib/shapes/Transformer";
import useImage from "use-image";
import type Konva from "konva";
import { useTranslations } from "../i18n/client";
import type { MessageKey } from "../i18n/messages";
import { clampZoom } from "./viewport";

type Tool = "brush" | "eraser" | "move" | "fill" | "hand";
import { readEditorDraft, EDITOR_DRAFT_KEY, type EditorLayer, type LineData } from "./draft";

interface HistoryState {
    layers: EditorLayer[];
}

const TEMPLATES = {
    standard: "/template/cape_template.png",
    elytra: "/template/cape_template_elytra.png"
};

const COMMON_COLORS = [
    "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff",
    "#ffff00", "#00ffff", "#ff00ff", "#ffa500", "#808080"
];

function floodFill(
    imageData: ImageData,
    startX: number,
    startY: number,
    fillColor: [number, number, number, number]
): ImageData {
    const { width, height, data } = imageData;
    const getPixel = (x: number, y: number): [number, number, number, number] => {
        const i = (y * width + x) * 4;
        return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    };
    const setPixelAt = (x: number, y: number, c: [number, number, number, number]) => {
        const i = (y * width + x) * 4;
        data[i] = c[0];
        data[i + 1] = c[1];
        data[i + 2] = c[2];
        data[i + 3] = c[3];
    };
    const match = (a: [number, number, number, number], b: [number, number, number, number]) =>
        a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return imageData;

    const targetColor = getPixel(startX, startY);
    if (match(targetColor, fillColor)) return imageData;

    const stack: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(width * height);

    while (stack.length > 0) {
        const [cx, cy] = stack.pop()!;
        const idx = cy * width + cx;

        if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
        if (visited[idx]) continue;

        const currentColor = getPixel(cx, cy);
        if (!match(currentColor, targetColor)) continue;

        visited[idx] = 1;
        setPixelAt(cx, cy, fillColor);

        stack.push([cx + 1, cy]);
        stack.push([cx - 1, cy]);
        stack.push([cx, cy + 1]);
        stack.push([cx, cy - 1]);
    }

    return imageData;
}

const URLImage = ({ src, layerProps, isSelected, onSelect, onChange }: {
    src: string; layerProps: Partial<EditorLayer>; isSelected: boolean;
    onSelect?: () => void; onChange?: (attributes: Partial<EditorLayer>) => void;
}) => {
    const [image] = useImage(src, "anonymous");
    const shapeRef = useRef<Konva.Image>(null);
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (isSelected) {
            trRef.current?.nodes([shapeRef.current!]);
            trRef.current?.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <KonvaImage
                image={image}
                ref={shapeRef}
                {...layerProps}
                draggable={isSelected}
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    onChange?.({
                        ...layerProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={() => {
                    const node = shapeRef.current;
                    if (!node) return;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange?.({
                        ...layerProps,
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY),
                        rotation: node.rotation()
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    keepRatio
                    flipEnabled={false}
                    enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

export default function CapeEditorPage() {
    const { t } = useTranslations();
    const layerName = (layer: EditorLayer) => layer.type === "template" ? t("Template") : layer.type === "drawing" ? t("Drawing {number}", { number: layer.name.match(/\d+$/)?.[0] ?? 1 }) : layer.name;
    const [layers, setLayers] = useState<EditorLayer[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [activeTemplate, setActiveTemplate] = useState<"standard" | "elytra">("standard");

    const [tool, setTool] = useState<Tool>("brush");
    const [uploadError, setUploadError] = useState<MessageKey | "">("");
    const [color, setColor] = useState("#ffffff");
    const [brushSize, setBrushSize] = useState(1);
    const [zoom, setZoom] = useState(1);
    const panMode = tool === "hand";
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const panGesture = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
    const changeZoom = (value: number) => setZoom(clampZoom(value));

    const [{ states: history, step: historyStep }, setHistory] = useState<{ states: HistoryState[]; step: number }>({ states: [], step: -1 });
    const initialized = useRef(false);
    const [draftReady, setDraftReady] = useState(false);
    const [draftError, setDraftError] = useState<MessageKey | "">("");
    const [draftLoadError, setDraftLoadError] = useState<MessageKey | "">("");
    const [templateError, setTemplateError] = useState<MessageKey | "">("");

    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const isDrawing = useRef(false);
    const propertiesDialog = useRef<HTMLDialogElement>(null);

    /* eslint-disable react-hooks/set-state-in-effect -- Restore external tab storage after hydration and report storage I/O failures. */
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(EDITOR_DRAFT_KEY);
            if (raw) {
                const draft = readEditorDraft(raw);
                setLayers(draft.layers);
                setActiveTemplate(draft.activeTemplate);
                setActiveLayerId(draft.activeLayerId);
                const activeLayer = draft.layers.find(layer => layer.id === draft.activeLayerId);
                setTool(activeLayer?.type === "image" ? "move" : "brush");
                setSelectedId(activeLayer?.type === "image" ? activeLayer.id : null);
                setHistory({ states: [{ layers: draft.layers }], step: 0 });
                initialized.current = true;
            }
        } catch {
            setDraftLoadError("The saved draft could not be restored.");
        }
        setDraftReady(true);
    }, []);

    useEffect(() => {
        const current = history[historyStep];
        if (!draftReady || !current) return;
        try {
            sessionStorage.setItem(EDITOR_DRAFT_KEY, JSON.stringify({
                activeTemplate, activeLayerId, layers: current.layers.filter(layer => layer.type !== "template"),
            }));
            setDraftError("");
        } catch {
            setDraftError("The draft could not be saved. Export your cape as PNG before leaving.");
        }
    }, [draftReady, history, historyStep, activeTemplate, activeLayerId]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (draftError || isDrawing.current) { event.preventDefault(); event.returnValue = ""; }
        };
        const desktop = matchMedia("(min-width: 640px)");
        const closeProperties = () => { if (desktop.matches) propertiesDialog.current?.close(); };
        window.addEventListener("beforeunload", warn);
        desktop.addEventListener("change", closeProperties);
        return () => { window.removeEventListener("beforeunload", warn); desktop.removeEventListener("change", closeProperties); };
    }, [draftError]);

    useEffect(() => {
        if (!draftReady) return;
        let cancelled = false;
        const init = async () => {
            const templateSrc = TEMPLATES[activeTemplate];
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("The template could not be loaded."));
                img.src = templateSrc;
            });
            if (cancelled) return;
            setTemplateError("");

            const templateId = "layer-template";
            const newLayer: EditorLayer = {
                id: templateId,
                type: "template",
                name: "Template",
                visible: true,
                locked: true,
                opacity: 1,
                imageSrc: templateSrc,
                width: img.width,
                height: img.height,
                x: 0,
                y: 0
            };

            const drawId = "layer-drawing-1";
            const drawLayer: EditorLayer = {
                id: drawId,
                type: "drawing",
                name: "Zeichnung 1",
                visible: true,
                locked: false,
                opacity: 1,
                lines: []
            };

            const initialLayers = [templateId, drawId]
                .map(id => id === templateId ? newLayer : drawLayer);

            const alreadyInitialized = initialized.current;
            setLayers(current => alreadyInitialized ? [{ ...newLayer, visible: current.find(layer => layer.type === "template")?.visible ?? true }, ...current.filter(layer => layer.type !== "template")] : initialLayers);
            if (!initialized.current) {
                initialized.current = true;
                setActiveLayerId(drawId);
                setHistory({ states: [{ layers: initialLayers }], step: 0 });
            }
        };

        void init().catch(() => { if (!cancelled) setTemplateError("The template could not be loaded."); });
        return () => { cancelled = true; };
    }, [activeTemplate, draftReady]);

    const addToHistory = (newLayers: EditorLayer[]) => {
        const newState = { layers: structuredClone(newLayers) };
        setHistory(prev => {
            const sliced = prev.states.slice(0, prev.step + 1);
            sliced.push(newState);
            if (sliced.length > 20) sliced.shift();
            return { states: sliced, step: sliced.length - 1 };
        });
    };

    const undo = () => {
        if (historyStep <= 0) return;
        const prevStep = historyStep - 1;
        setLayers(current => [...current.filter(layer => layer.type === "template"), ...history[prevStep].layers.filter(layer => layer.type !== "template")]);
        setHistory(prev => ({ ...prev, step: prevStep }));
    };

    const redo = () => {
        if (historyStep >= history.length - 1) return;
        const nextStep = historyStep + 1;
        setLayers(current => [...current.filter(layer => layer.type === "template"), ...history[nextStep].layers.filter(layer => layer.type !== "template")]);
        setHistory(prev => ({ ...prev, step: nextStep }));
    };

    const updateLayers = (newLayers: EditorLayer[], saveToHistory = true) => {
        setLayers(newLayers);
        if (saveToHistory) addToHistory(newLayers);
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    };



    const handlePointerDown = async (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedId(null);
        }

        if (!activeLayerId) return;
        const layer = layers.find(l => l.id === activeLayerId);
        if (!layer || layer.locked || !layer.visible) return;

        if (tool === "fill" && layer.type === "drawing") {
            const stage = e.target.getStage();
            const pos = stage?.getRelativePointerPosition();
            if (!pos) return;

            const x = Math.floor(pos.x);
            const y = Math.floor(pos.y);

            const canvasW = stageWidth;
            const canvasH = stageHeight;

            if (x < 0 || x >= canvasW || y < 0 || y >= canvasH) return;

            const offscreen = document.createElement("canvas");
            offscreen.width = canvasW;
            offscreen.height = canvasH;
            const ctx = offscreen.getContext("2d")!;

            if (layer.fillCanvasDataURL) {
                const existingImg = new window.Image();
                existingImg.src = layer.fillCanvasDataURL;
                await new Promise<void>((resolve) => {
                    if (existingImg.complete) { resolve(); return; }
                    existingImg.onload = () => resolve();
                });
                ctx.drawImage(existingImg, 0, 0);
            }

            if (layer.lines) {
                for (const line of layer.lines) {
                    ctx.beginPath();
                    ctx.lineWidth = line.strokeWidth;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    if (line.tool === "eraser") {
                        ctx.globalCompositeOperation = "destination-out";
                    } else {
                        ctx.globalCompositeOperation = "source-over";
                        ctx.strokeStyle = line.color;
                    }
                    const pts = line.points;
                    if (pts.length >= 2) {
                        ctx.moveTo(pts[0], pts[1]);
                        for (let i = 2; i < pts.length; i += 2) {
                            ctx.lineTo(pts[i], pts[i + 1]);
                        }
                        ctx.stroke();
                    }
                }
                ctx.globalCompositeOperation = "source-over";
            }

            const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
            const rgb = hexToRgb(color);
            if (!rgb) return;
            const fillColor: [number, number, number, number] = [rgb[0], rgb[1], rgb[2], 255];

            floodFill(imageData, x, y, fillColor);
            ctx.putImageData(imageData, 0, 0);

            const dataURL = offscreen.toDataURL();
            const newLayers = layers.map(l => {
                if (l.id === activeLayerId) {
                    return { ...l, fillCanvasDataURL: dataURL, lines: [] };
                }
                return l;
            });
            updateLayers(newLayers);
            return;
        }

        if ((tool === "brush" || tool === "eraser") && layer.type === "drawing") {
            isDrawing.current = true;
            const pos = e.target.getStage()?.getRelativePointerPosition();
            if (!pos) return;

            const newLine: LineData = {
                tool: tool === "brush" ? "brush" : "eraser",
                points: [pos.x, pos.y, pos.x, pos.y],
                color: tool === "brush" ? color : "#000000",
                strokeWidth: brushSize
            };

            const newLayers = layers.map(l => {
                if (l.id === activeLayerId) {
                    return { ...l, lines: [...(l.lines || []), newLine] };
                }
                return l;
            });
            setLayers(newLayers);
        }
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (!isDrawing.current || !activeLayerId) return;

        const stage = e.target.getStage();
        const point = stage?.getRelativePointerPosition();
        if (!point) return;

        setLayers(prev => prev.map(l => {
            if (l.id === activeLayerId && l.lines) {
                const lastLine = { ...l.lines[l.lines.length - 1] };
                lastLine.points = lastLine.points.concat([point.x, point.y]);
                const newLines = [...l.lines.slice(0, -1), lastLine];
                return { ...l, lines: newLines };
            }
            return l;
        }));
    };

    const handleMouseUp = () => {
        if (isDrawing.current) {
            isDrawing.current = false;
            addToHistory(layers);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploadError("");
        if (!file.type.startsWith("image/")) {
            setUploadError("Please choose an image file.");
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => setUploadError("The image could not be read.");
        reader.onload = (event) => {
            const src = event.target?.result as string;
            const img = new Image();
            img.onerror = () => setUploadError("This image format could not be opened.");
            img.onload = () => {
                const id = `layer-img-${Date.now()}`;

                let newW = img.width;
                let newH = img.height;

                const logicW = layers.find(l => l.type === "template")?.width || 64;
                const logicH = layers.find(l => l.type === "template")?.height || 32;

                if (newW > logicW || newH > logicH) {
                    const ratio = Math.min((logicW * 0.8) / newW, (logicH * 0.8) / newH);
                    newW *= ratio;
                    newH *= ratio;
                }

                const newLayer: EditorLayer = {
                    id,
                    type: "image",
                    name: file.name,
                    visible: true,
                    locked: false,
                    opacity: 1,
                    imageSrc: src,
                    width: newW,
                    height: newH,
                    x: (logicW - newW) / 2,
                    y: (logicH - newH) / 2,
                    rotation: 0
                };

                const newLayers = [...layers, newLayer];
                updateLayers(newLayers);
                setActiveLayerId(id);
                setSelectedId(id);
                setTool("move");
            };
            img.src = src;
        };
        reader.readAsDataURL(file);
    };

    const downloadCape = async () => {
        const stage = stageRef.current;
        if (!stage) return;

        const templateLayer = layers.find(l => l.type === "template");
        const templateNode = stage.findOne(`#${templateLayer?.id}`);
        if (templateNode) templateNode.hide();

        const transformers = stage.find("Transformer");
        transformers.forEach(t => t.hide());

        const dataURL = stage.toDataURL({ pixelRatio: 1 / zoom });

        if (templateNode && templateLayer?.visible) templateNode.show();
        transformers.forEach(t => t.show());

        const link = document.createElement("a");
        link.download = `my-cookiecape-${activeTemplate}.png`;
        link.href = dataURL;
        link.click();
    };

    const stageWidth = layers.find(l => l.type === "template")?.width || 64;
    const stageHeight = layers.find(l => l.type === "template")?.height || 32;

    const selectedLayer = layers.find(layer => layer.id === selectedId && layer.type === "image");
    const selectTool = (next: Tool) => {
        setTool(next);
        const type = next === "move" ? "image" : "drawing";
        if (next === "hand") return;
        const active = layers.find(layer => layer.id === activeLayerId && layer.type === type && layer.visible);
        const target = active ?? layers.findLast(layer => layer.type === type && layer.visible);
        setActiveLayerId(target?.id ?? null);
        if (next === "move") setSelectedId(target?.id ?? null);
    };
    const changeImage = (changes: Partial<EditorLayer>) => {
        if (selectedLayer) updateLayers(layers.map(layer => layer.id === selectedLayer.id ? { ...layer, ...changes } : layer));
    };

    useEffect(() => {
        const viewport = containerRef.current;
        if (!viewport) return;
        const fit = () => {
            setPan({ x: 0, y: 0 });
            setZoom(clampZoom(Math.min((viewport.clientWidth - 32) / stageWidth, (viewport.clientHeight - 32) / stageHeight)));
        };
        const observer = new ResizeObserver(fit);
        observer.observe(viewport);
        return () => observer.disconnect();
    }, [stageWidth, stageHeight]);

    useEffect(() => {
        const viewport = containerRef.current;
        if (!viewport) return;
        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            setZoom(current => clampZoom(current * Math.exp(-event.deltaY * 0.002)));
        };
        viewport.addEventListener("wheel", onWheel, { passive: false });
        return () => viewport.removeEventListener("wheel", onWheel);
    }, []);

    const properties = <>
                        <section className="flex flex-col gap-3 rounded-xl border border-white/10 p-3" aria-label={t("View")}>
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" size="icon" aria-label={t("Zoom out")} title={t("Zoom out")} onClick={() => changeZoom(zoom / 1.25)}><ZoomOut /></Button>
                                <Button type="button" variant="outline" size="icon" aria-label={t("Zoom in")} title={t("Zoom in")} onClick={() => changeZoom(zoom * 1.25)}><ZoomIn /></Button>
                            </div>
                            <label className="flex flex-col gap-2 text-xs text-zinc-400">Zoom: {Math.round(zoom * 100)} %<input aria-label="Zoom" type="range" min="0.25" max="5" step="0.01" value={zoom} onChange={e => changeZoom(Number(e.target.value))} className="w-full accent-orange-500" /></label>
                            <Button type="button" variant="outline" onClick={() => { setPan({ x: 0, y: 0 }); const viewport = containerRef.current; if (viewport) changeZoom(Math.min((viewport.clientWidth - 48) / stageWidth, (viewport.clientHeight - 48) / stageHeight)); }}><Maximize /> {t("Fit to view")}</Button>
                        </section>
                        <section className="rounded-2xl border border-white/10 bg-[#111] p-4">
                            <h2 className="mb-4 text-sm font-semibold">{tool === "move" ? t("Image position") : t("Drawing tool")}</h2>
                            {tool !== "move" ? <div className="flex flex-col gap-4">
                                <div><span className="mb-2 block text-xs text-zinc-400">{t("Color")}</span><div className="grid grid-cols-4 gap-2">{COMMON_COLORS.map(c => <Button type="button" variant="outline" size="icon-sm" key={c} onClick={() => setColor(c)} aria-label={t("Color {color}", { color: c })} aria-pressed={color === c} className={`h-12 w-full ${color === c ? "ring-2 ring-white" : ""}`} style={{ backgroundColor: c }} />)}</div></div>
                                <label className="flex items-center justify-between gap-3 text-sm text-zinc-400">{t("Custom color")} <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-16 cursor-pointer rounded" /></label>
                                <label className="flex flex-col gap-2 text-sm text-zinc-400">{t("Size")}: {brushSize} px<input type="range" min="1" max="10" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="accent-orange-500" /></label>
                                {!layers.some(l => l.id === activeLayerId && l.type === "drawing" && l.visible) && <p className="text-xs text-amber-300">{t("Select a visible drawing layer to paint.")}</p>}
                            </div> : selectedLayer ? <div className="flex flex-col gap-3">
                                <p className="truncate text-sm text-zinc-400">{layerName(selectedLayer)}</p>
                                <div className="grid grid-cols-2 gap-3">{([['x', 'X'], ['y', 'Y'], ['width', t("Width")], ['rotation', t("Rotation")]] as const).map(([key, label]) => <label key={key} className="flex min-w-0 flex-col gap-1 text-xs text-zinc-400">{label}<input type="number" value={Math.round((selectedLayer[key] ?? 0) * 100) / 100} onChange={e => { const value = e.target.valueAsNumber; if (!Number.isFinite(value) || (key === 'width' && value <= 0)) return; changeImage(key === 'width' ? { width: value, height: value * (selectedLayer.height ?? 1) / (selectedLayer.width ?? 1) } : { [key]: value }); }} className="w-full rounded-md border border-white/10 bg-black px-2 py-2 text-sm text-white" /></label>)}</div>
                                <p className="text-xs text-zinc-400">{t("Width preserves the aspect ratio. Drag the corners to resize.")}</p>
                            </div> : <p className="text-sm text-zinc-400">{t("Upload an image or select an image layer.")}</p>}
                        </section>
                        <section className="rounded-2xl border border-white/10 bg-[#111] p-4">
                            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{t("Layers")}</h2><Button type="button" variant="outline" size="icon-sm" aria-label={t("Add drawing layer")} title={t("Add drawing layer")} onClick={() => { const id = `layer-drawing-${Date.now()}`; updateLayers([...layers, { id, type: "drawing", name: `Zeichnung ${layers.filter(l => l.type === "drawing").length + 1}`, visible: true, locked: false, opacity: 1, lines: [] }]); setTool("brush"); setSelectedId(null); setActiveLayerId(id); }}><Plus /></Button></div>
                            <div className="flex max-h-64 flex-col gap-1 overflow-auto">{[...layers].reverse().map(layer => <div key={layer.id} className={`flex items-center gap-1 rounded-lg border p-1 ${activeLayerId === layer.id ? "border-orange-500/50 bg-zinc-800" : "border-transparent"}`}>
                                <Button type="button" variant="ghost" size="icon-sm" aria-label={t(layer.visible ? "Hide layer {name}" : "Show layer {name}", { name: layerName(layer) })} aria-pressed={layer.visible} onClick={() => { updateLayers(layers.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l)); if (layer.visible && selectedId === layer.id) setSelectedId(null); }}>{layer.visible ? <Eye /> : <EyeOff />}</Button>
                                <Button type="button" variant="ghost" size="sm" aria-pressed={activeLayerId === layer.id} onClick={() => { setActiveLayerId(layer.id); if (layer.type === "image") { setTool("move"); setSelectedId(layer.visible ? layer.id : null); } else if (layer.type === "drawing") { setTool("brush"); setSelectedId(null); } }} className="min-w-0 flex-1 justify-start"><span className="truncate">{layerName(layer)}</span></Button>
                                {!layer.locked && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Ebene ${layerName(layer)} löschen`} onClick={() => { updateLayers(layers.filter(l => l.id !== layer.id)); if (selectedId === layer.id) setSelectedId(null); if (activeLayerId === layer.id) setActiveLayerId(null); }}><Trash2 /></Button>}
                            </div>)}</div>
                        </section>
                        <section className="rounded-2xl border border-white/10 bg-[#111] p-4"><h2 className="mb-3 text-sm font-semibold">{t("Template")}</h2><div role="group" aria-label={t("Template")} className="grid grid-cols-2 gap-2"><Button type="button" variant={activeTemplate === "standard" ? "default" : "outline"} aria-pressed={activeTemplate === "standard"} onClick={() => setActiveTemplate("standard")}>Standard</Button><Button type="button" variant={activeTemplate === "elytra" ? "default" : "outline"} aria-pressed={activeTemplate === "elytra"} onClick={() => setActiveTemplate("elytra")}>Elytra</Button></div><p className="mt-3 text-xs text-zinc-400">{t("The template is a guide and is not exported.")}</p></section>
    </>;

    return (
        <main className="fixed inset-0 z-100 overflow-hidden bg-[#090909] text-white">
            <div className="flex h-full min-h-0 flex-col">
                <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="icon" aria-label={t("Back to tutorial")}><Link href="/cookiecapes/tutorial" onClick={event => { if (draftError && !window.confirm(t("The draft is not saved. Continue to the tutorial?"))) event.preventDefault(); }}><ArrowLeft /></Link></Button>
                        <h1 className="text-2xl font-bold tracking-tight">Cape Editor</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="outline" className="min-h-12 sm:hidden" onClick={() => propertiesDialog.current?.showModal()}><SlidersHorizontal data-icon="inline-start" /> {t("Properties")}</Button>
                        <Button type="button" variant="outline" size="icon" onClick={undo} disabled={historyStep <= 0} aria-label={t("Undo")}><RotateCcw /></Button>
                        <Button type="button" variant="outline" size="icon" onClick={redo} disabled={historyStep >= history.length - 1} aria-label={t("Redo")}><RotateCw /></Button>
                        <Button type="button" onClick={downloadCape} disabled={!!templateError || !layers.length}><Download data-icon="inline-start" /> {t("Export PNG")}</Button>
                    </div>
                </header>
                {(draftLoadError || draftError) && <p role="alert" className="bg-amber-950 p-3 text-sm text-amber-200">{t((draftError || draftLoadError) as MessageKey)}</p>}
                {(templateError || uploadError) && <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-950 p-3 text-sm text-red-200">{t((templateError || uploadError) as MessageKey)}</p>}
                <div className="flex min-h-0 flex-1">
                    <section className="order-2 flex min-h-0 min-w-0 flex-1 flex-col bg-[#111]" aria-label={t("Canvas")}>
                        <div ref={containerRef} className="pattern-grid relative min-h-0 flex-1 overflow-hidden"
                            onPointerDownCapture={e => {
                                if (!panMode && e.button !== 1) return;
                                e.preventDefault(); e.stopPropagation();
                                handleMouseUp();
                                panGesture.current = { x: e.clientX, y: e.clientY, originX: pan.x, originY: pan.y };
                                e.currentTarget.setPointerCapture(e.pointerId);
                            }}
                            onPointerMove={e => { const gesture = panGesture.current; if (gesture) { e.stopPropagation(); setPan({ x: gesture.originX + e.clientX - gesture.x, y: gesture.originY + e.clientY - gesture.y }); } }}
                            onPointerUp={e => { if (panGesture.current) { e.stopPropagation(); panGesture.current = null; e.currentTarget.releasePointerCapture(e.pointerId); } }}
                            onPointerCancel={() => { panGesture.current = null; }}
                            style={{ touchAction: "none", cursor: panMode ? "grab" : undefined }}>
                            <div className="absolute left-1/2 top-1/2 bg-white shadow-2xl" style={{ width: stageWidth * zoom, height: stageHeight * zoom, transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`, pointerEvents: panMode ? "none" : undefined }}>
                                <Stage width={stageWidth * zoom} height={stageHeight * zoom} scale={{ x: zoom, y: zoom }} ref={stageRef}
                                    onMouseDown={handlePointerDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                                    onTouchStart={handlePointerDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
                                    style={{ cursor: tool === "move" ? "default" : "crosshair", touchAction: "none" }}>
                                    {layers.map(layer => !layer.visible ? null : <Layer key={layer.id} id={layer.id} opacity={layer.opacity}>
                                        {layer.type === "template" && layer.imageSrc && <URLImage src={layer.imageSrc} layerProps={layer} isSelected={false} />}
                                        {layer.type === "drawing" && layer.fillCanvasDataURL && <URLImage src={layer.fillCanvasDataURL} layerProps={{ x: 0, y: 0 }} isSelected={false} />}
                                        {layer.type === "drawing" && layer.lines?.map((line, i) => <Line key={i} points={line.points} stroke={line.color} globalCompositeOperation={line.tool === "eraser" ? "destination-out" : "source-over"} strokeWidth={line.strokeWidth} tension={0} lineCap="round" lineJoin="round" listening={false} />)}
                                        {layer.type === "image" && layer.imageSrc && <URLImage src={layer.imageSrc} layerProps={layer} isSelected={tool === "move" && selectedId === layer.id} onSelect={() => { if (tool === "move") { setSelectedId(layer.id); setActiveLayerId(layer.id); } }} onChange={attrs => updateLayers(layers.map(l => l.id === layer.id ? { ...l, ...attrs } : l))} />}
                                    </Layer>)}
                                </Stage>
                            </div>
                        </div>
                        <p className="shrink-0 border-t border-white/10 px-4 py-2 text-xs text-zinc-400">{t("Mouse wheel: zoom · Hand / middle mouse button: pan canvas")}</p>
                    </section>
                    <aside aria-label={t("Tools")} className="order-1 flex w-16 shrink-0 flex-col gap-3 overflow-y-auto border-r border-white/10 bg-[#0c0c0c] p-2 ">
                        <div role="toolbar" aria-label={t("Tools")} className="flex flex-col gap-2">
                            <Button type="button" variant={tool === "hand" ? "default" : "ghost"} aria-pressed={tool === "hand"} aria-label="Hand" title="Hand" onClick={() => selectTool("hand")} size="icon" className="size-12"><Hand /></Button>
                            <Button type="button" variant={tool === "brush" ? "default" : "ghost"} aria-pressed={tool === "brush"} aria-label={t("Brush")} title={t("Brush")} onClick={() => selectTool("brush")} size="icon" className="size-12"><Pencil /></Button>
                            <Button type="button" variant={tool === "eraser" ? "default" : "ghost"} aria-pressed={tool === "eraser"} aria-label={t("Eraser")} title={t("Eraser")} onClick={() => selectTool("eraser")} size="icon" className="size-12"><Eraser /></Button>
                            <Button type="button" variant={tool === "fill" ? "default" : "ghost"} aria-pressed={tool === "fill"} aria-label={t("Fill")} title={t("Fill")} onClick={() => selectTool("fill")} size="icon" className="size-12"><PaintBucket /></Button>
                            <Button type="button" variant={tool === "move" ? "default" : "ghost"} aria-pressed={tool === "move"} aria-label={t("Move image")} title={t("Move image")} onClick={() => selectTool("move")} size="icon" className="size-12"><Move /></Button>
                            <Button type="button" variant="ghost" aria-label={t("Upload image")} title={t("Upload image")} onClick={() => { setTool("move"); imageInputRef.current?.click(); }} size="icon" className="size-12"><ImageIcon /></Button>
                            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </div>
                    </aside>
                    <aside aria-label={t("Properties and layers")} className="order-3 hidden w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-white/10 bg-[#0c0c0c] p-3 sm:flex">{properties}</aside>
                    <dialog ref={propertiesDialog} aria-labelledby="editor-properties-title" className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-sm overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-zinc-950 p-4 text-white backdrop:bg-black/70 sm:hidden">
                        <div className="mb-4 flex items-center justify-between gap-3"><h2 id="editor-properties-title" className="font-semibold">{t("Properties and layers")}</h2><Button type="button" variant="ghost" size="icon" className="size-12" aria-label={t("Close properties")} onClick={() => propertiesDialog.current?.close()}><X /></Button></div>
                        <div className="flex flex-col gap-3">{properties}</div>
                    </dialog>
                </div>
            </div>
        </main>
    );
}
