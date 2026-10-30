import type { SkinViewer } from "skinview3d";
import type { BufferGeometry, Material, Mesh } from "three";

export function disposeSkinViewer(viewer: SkinViewer | null) {
  if (!viewer || viewer.disposed) return;
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  viewer.scene.traverse(object => {
    const mesh = object as Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) {
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  viewer.fxaaPass.material.dispose();
  viewer.dispose();
  // skinview3d disposes its renderer, but not the postprocessing render targets
  // or the WebGL context itself. Release both when a React view is removed.
  viewer.composer.dispose();
  viewer.renderer.forceContextLoss();
}
