import type { SkinViewer } from "skinview3d";

export function disposeSkinViewer(viewer: SkinViewer | null) {
  if (!viewer || viewer.disposed) return;
  viewer.dispose();
  // skinview3d disposes its renderer, but not the postprocessing render targets
  // or the WebGL context itself. Release both when a React view is removed.
  viewer.composer.dispose();
  viewer.renderer.forceContextLoss();
}
