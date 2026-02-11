"use client";

import { useEffect, useRef } from "react";
import { Cape } from "../lib/api";
import CapeViewer from "./CapeViewer";

interface RandomCapesProps {
  capes: Cape[];
}

export default function RandomCapes({ capes }: RandomCapesProps) {
  if (capes.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-20">
      <h2 className="font-nexa text-3xl md:text-5xl text-white text-center mb-12">
        Entdecke <span className="text-orange-500">Community</span> Capes
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {capes.map((cape) => (
          <div key={cape.cape_id} className="cape-card flex flex-col items-center bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm gap-4 transition-transform hover:-translate-y-2 hover:border-orange-500/50">
            <div className="w-full h-[300px] relative flex items-center justify-center">
              <CapeViewer 
                capeUrl={cape.cape_image_url} 
                skinUrl={`https://mineskin.eu/skin/${cape.minecraft_uuid}`}
                animation="walk"
              />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xl text-white">{cape.cape_name}</h3>
              <p className="text-zinc-500 text-sm">von {cape.minecraft_name}</p>
              <div className="mt-2 text-xs text-orange-400 font-mono bg-orange-500/10 px-2 py-1 rounded">
                ID: {cape.cape_id}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
