"use client";

import { useEffect, useRef } from "react";
import { SkinViewer, WalkingAnimation, IdleAnimation } from "skinview3d";

interface Cape3DViewerProps {
    skinUrl?: string;
    capeUrl: string;
    minecraftName?: string;
}

export default function Cape3DViewer({ skinUrl, capeUrl, minecraftName }: Cape3DViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewerRef = useRef<SkinViewer | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const viewer = new SkinViewer({
            canvas: canvasRef.current,
            width: 300, 
            height: 400,
            skin: skinUrl || (minecraftName ? `https://minotar.net/skin/${minecraftName}` : "https://minotar.net/skin/MHF_Steve"),
            cape: capeUrl,
            zoom: 0.7,
        });

        viewer.camera.position.set(0, 0, 60);
        viewer.controls.enableZoom = true;
        viewer.controls.enableRotate = true;
        
        const animation = new IdleAnimation();
        viewer.animation = animation;
        
        viewer.playerObject.rotation.y = Math.PI;

        viewer.autoRotate = true;
        viewer.autoRotateSpeed = 0.5;

        viewerRef.current = viewer;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect) {
                    viewer.width = entry.contentRect.width;
                    viewer.height = entry.contentRect.height;
                    viewer.render();
                }
            }
        });

        if (canvasRef.current.parentElement) {
            resizeObserver.observe(canvasRef.current.parentElement);
        }

        return () => {
            resizeObserver.disconnect();
            viewer.dispose();
        };
    }, [skinUrl, capeUrl, minecraftName]);

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} className="outline-none" />
        </div>
    );
}
