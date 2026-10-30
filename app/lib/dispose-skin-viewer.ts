import type { SkinViewer } from "skinview3d";

type DisposableResource = { dispose(): void };
type MeshLike = {
  geometry?: DisposableResource;
  material?: DisposableResource | DisposableResource[];
};

export function disposeSkinViewer(viewer: SkinViewer | null) {
  if (!viewer || viewer.disposed) return;
  const geometries = new Set<DisposableResource>();
  const materials = new Set<DisposableResource>();
  viewer.scene.traverse(object => {
    const mesh = object as typeof object & MeshLike;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) {
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  viewer.fxaaPass.material.dispose();
  viewer.dispose();
  viewer.composer.dispose();
  viewer.renderer.forceContextLoss();
}
