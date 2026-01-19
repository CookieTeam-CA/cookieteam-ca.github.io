import { getGalleryAssets } from "../lib/gallery";
import GalleryClient from "../components/GalleryClient";

export default function GaleriePage() {
  const assets = getGalleryAssets();
  return <GalleryClient allAssets={assets} />;
}
