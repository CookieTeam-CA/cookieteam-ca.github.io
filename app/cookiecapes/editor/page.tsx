"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { 
    ArrowLeft, Download, Eraser, Image as ImageIcon, Layers, 
    Pencil, RotateCcw, RotateCw, Save, Upload, Move, 
    Trash2, Eye, EyeOff, Plus, Lock, Unlock, MousePointer2, PaintBucket 
} from "lucide-react";
import { Stage, Layer, Image as KonvaImage, Line, Transformer, Rect } from "react-konva";
import useImage from "use-image";
import Konva from "konva";

type Tool = "brush" | "eraser" | "move" | "picker" | "fill";
type LayerType = "template" | "drawing" | "image";

interface EditorLayer {
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
    drawingData?: ImageData | null;
    fillCanvasDataURL?: string | null;
}

interface LineData {
    tool: "brush" | "eraser";
    points: number[];
    color: string;
    strokeWidth: number;
}

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

const URLImage = ({ src, layerProps, isSelected, onSelect, onChange }: any) => {
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
                    onChange({
                        ...layerProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = shapeRef.current;
                    if (!node) return;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
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
    const [layers, setLayers] = useState<EditorLayer[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [activeTemplate, setActiveTemplate] = useState<"standard" | "elytra">("standard");

    const [tool, setTool] = useState<Tool>("brush");
    const [color, setColor] = useState("#ffffff");
    const [brushSize, setBrushSize] = useState(1);
    const [zoom, setZoom] = useState(1);
    
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);

    useEffect(() => {
        const init = async () => {
            const templateSrc = TEMPLATES[activeTemplate];
            const img = new Image();
            img.src = templateSrc;
            img.crossOrigin = "anonymous";
            await new Promise((resolve) => { img.onload = resolve; });

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

            setLayers(initialLayers);
            setActiveLayerId(drawId);
            addToHistory(initialLayers);
        };
        
        setHistory([]);
        setHistoryStep(-1);
        init();
    }, [activeTemplate]);

    const addToHistory = useCallback((newLayers: EditorLayer[]) => {
        const newState = { layers: JSON.parse(JSON.stringify(newLayers)) };
        setHistory(prev => {
            const sliced = prev.slice(0, historyStep + 1);
            sliced.push(newState);
            if (sliced.length > 20) sliced.shift();
            setHistoryStep(sliced.length - 1);
            return sliced;
        });
    }, [historyStep]);

    const undo = () => {
        if (historyStep <= 0) return;
        const prevStep = historyStep - 1;
        setLayers(history[prevStep].layers);
        setHistoryStep(prevStep);
    };

    const redo = () => {
        if (historyStep >= history.length - 1) return;
        const nextStep = historyStep + 1;
        setLayers(history[nextStep].layers);
        setHistoryStep(nextStep);
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
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const src = event.target?.result as string;
            const img = new Image();
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
                     name: "Bild",
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

    return (
        <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden">
             <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]">
                <div className="flex items-center gap-4">
                    <Link href="/cookiecapes/tutorial" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-zinc-400" />
                    </Link>
                    <h1 className="font-bold text-lg bg-clip-text text-orange-400">
                        Cape Editor <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded ml-2">BETA</span>
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                     <button onClick={undo} disabled={historyStep <= 0} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30">
                        <RotateCcw size={20} />
                     </button>
                     <button onClick={redo} disabled={historyStep >= history.length - 1} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30">
                        <RotateCw size={20} />
                     </button>
                </div>

                <button 
                    onClick={downloadCape}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-bold shadow-lg shadow-orange-500/20"
                >
                    <Download className="w-4 h-4" />
                    Export
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-16 border-r border-white/10 bg-[#0c0c0c] flex flex-col items-center py-4 gap-4 z-10">
                    <button onClick={() => { setTool("move"); setSelectedId(null); }} className={`p-3 rounded-xl ${tool === 'move' ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:bg-white/5'}`} title="Auswählen / Bewegen"><Move size={20} /></button>
                    <button onClick={() => { setTool("brush"); setSelectedId(null); }} className={`p-3 rounded-xl ${tool === 'brush' ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:bg-white/5'}`} title="Stift"><Pencil size={20} /></button>
                    <button onClick={() => { setTool("eraser"); setSelectedId(null); }} className={`p-3 rounded-xl ${tool === 'eraser' ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:bg-white/5'}`} title="Radierer"><Eraser size={20} /></button>
                    <button onClick={() => { setTool("fill"); setSelectedId(null); }} className={`p-3 rounded-xl ${tool === 'fill' ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:bg-white/5'}`} title="Fülleimer"><PaintBucket size={20} /></button>
                    <button onClick={() => { setTool("picker"); setSelectedId(null); }} className={`p-3 rounded-xl ${tool === 'picker' ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:bg-white/5'}`} title="Farbe"><MousePointer2 size={20} /></button>
                    <div className="h-px w-8 bg-white/10 my-2" />
                    <label className="p-3 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/5 cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /><ImageIcon size={20} /></label>
                </div>

                <div className="flex-1 bg-[#111] relative overflow-auto flex items-center justify-center pattern-grid p-8" ref={containerRef}>
                    <div className="shadow-2xl shadow-black bg-white" style={{ width: stageWidth * zoom, height: stageHeight * zoom }}>
                        <Stage
                            width={stageWidth * zoom}
                            height={stageHeight * zoom}
                            scale={{ x: zoom, y: zoom }}
                            ref={stageRef}
                            onMouseDown={handlePointerDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onTouchStart={handlePointerDown}
                            onTouchMove={handleMouseMove}
                            onTouchEnd={handleMouseUp}
                            style={{ cursor: tool === "move" ? "default" : "crosshair" }}
                        >
                            {layers.map((layer) => {
                                if (!layer.visible) return null;
                                return (
                                    <Layer key={layer.id} id={layer.id} opacity={layer.opacity}>    
                                        {layer.type === "template" && layer.imageSrc && (
                                           <URLImage src={layer.imageSrc} layerProps={layer} isSelected={false} />
                                        )}
                                        
                                        {layer.type === "drawing" && layer.fillCanvasDataURL && (
                                            <URLImage
                                                src={layer.fillCanvasDataURL}
                                                layerProps={{ x: 0, y: 0, width: stageWidth, height: stageHeight }}
                                                isSelected={false}
                                            />
                                        )}
                                        {layer.type === "drawing" && layer.lines?.map((line, i) => (
                                            <Line
                                                key={i}
                                                points={line.points}
                                                stroke={line.color}
                                                globalCompositeOperation={
                                                    line.tool === "eraser" ? 'destination-out' : 'source-over'
                                                }
                                                strokeWidth={line.strokeWidth}
                                                tension={0}
                                                lineCap="round"
                                                lineJoin="round"
                                                listening={false}
                                            />
                                        ))}

                                        {layer.type === "image" && layer.imageSrc && (
                                            <URLImage 
                                                src={layer.imageSrc} 
                                                layerProps={layer}
                                                isSelected={selectedId === layer.id}
                                                onSelect={() => {
                                                    if (tool === "move") {
                                                        setSelectedId(layer.id);
                                                        setActiveLayerId(layer.id);
                                                    }
                                                }}
                                                onChange={(newAttrs: any) => {
                                                    updateLayers(layers.map(l => l.id === layer.id ? { ...l, ...newAttrs } : l));
                                                }}
                                            />
                                        )}
                                    </Layer>
                                );
                            })}
                        </Stage>
                    </div>
                </div>

                <div className="w-80 border-l border-white/10 bg-[#0a0a0a] flex flex-col z-10">
                     <div className="p-5 border-b border-white/10 space-y-4">
                         <div className="flex items-center justify-between">
                             <span className="text-xs font-bold text-zinc-500 uppercase">Eigenschaften</span>
                             <span className="text-xs text-orange-400">{tool.toUpperCase()}</span>
                         </div>
                         
                         <div>
                             <div className="flex justify-between text-xs text-zinc-400 mb-1">
                                <span>Zoom</span>
                                <span>{zoom}x</span>
                             </div>
                             <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                step="0.5"
                                value={zoom} 
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                             />
                         </div>

                         {(tool === "brush" || tool === "picker" || tool === "fill") && (
                             <>
                                <div className="grid grid-cols-5 gap-1">
                                    {COMMON_COLORS.map(c => (
                                        <button key={c} onClick={() => setColor(c)} className={`w-full h-8 rounded border ${color === c ? 'border-white' : 'border-white/10'}`} style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                                {tool !== "fill" && (
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">Größe: {brushSize}px</label>
                                        <input type="range" min="1" max="10" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full accent-orange-500" />
                                    </div>
                                )}
                             </>
                         )}
                         
                         {tool === "move" && selectedId && (
                             <div className="text-sm text-zinc-400">
                                 Objekt ausgewählt.<br/>Ziehe an den Ecken zum Skalieren.
                             </div>
                         )}

                         {!activeLayerId?.includes("drawing") && (tool === "brush" || tool === "eraser" || tool === "fill") && (
                             <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
                                 Wähle eine <strong>Zeichnungsebene</strong> um zu {tool === "fill" ? "füllen" : "malen"}!
                             </div>
                         )}
                     </div>

                     <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                            <span className="text-xs font-bold text-zinc-500 uppercase">Ebenen</span>
                            <div className="flex gap-1">
                                <button onClick={() => {
                                    const id = `layer-drawing-${Date.now()}`;
                                    const newLayer: EditorLayer = { id, type: "drawing", name: `Zeichnung ${layers.length}`, visible: true, locked: false, opacity: 1, lines: [] };
                                    updateLayers([...layers, newLayer]);
                                    setActiveLayerId(id);
                                }} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><Plus size={16}/></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {[...layers].reverse().map((layer) => (
                                <div 
                                    key={layer.id}
                                    onClick={() => { setActiveLayerId(layer.id); if (layer.type === "image") setSelectedId(layer.id); else setSelectedId(null); }}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border ${activeLayerId === layer.id ? 'bg-zinc-800 border-orange-500/50' : 'border-transparent hover:bg-zinc-900'}`}
                                >
                                    <button onClick={(e) => { e.stopPropagation(); updateLayers(layers.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l)); }}>
                                        {layer.visible ? <Eye size={14} className="text-zinc-400"/> : <EyeOff size={14} className="text-zinc-600"/>}
                                    </button>
                                    <span className="flex-1 text-sm truncate">{layer.name}</span>
                                    {!layer.locked && (
                                        <button onClick={(e) => { e.stopPropagation(); updateLayers(layers.filter(l => l.id !== layer.id)); }} className="text-zinc-600 hover:text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                     </div>
                     
                     <div className="p-4 border-t border-white/10 bg-zinc-900 grid grid-cols-2 gap-2">
                        <button onClick={() => setActiveTemplate("standard")} className={`text-xs p-2 rounded border ${activeTemplate === 'standard' ? 'bg-orange-500 text-black border-orange-400' : 'border-zinc-700 text-zinc-400'}`}>Standard</button>
                        <button onClick={() => setActiveTemplate("elytra")} className={`text-xs p-2 rounded border ${activeTemplate === 'elytra' ? 'bg-orange-500 text-black border-orange-400' : 'border-zinc-700 text-zinc-400'}`}>Elytra</button>
                     </div>
                </div>
            </div>

            <style jsx global>{`
                .pattern-grid {
                    background-image: radial-gradient(#333 1px, transparent 1px);
                    background-size: 20px 20px;
                }
            `}</style>
        </div>
    );
}
