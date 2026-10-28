import { getGalleryAssets } from "../lib/gallery";
import GalleryClient from "../components/GalleryClient";
import Footer from "../components/Footer";

export default function GaleriePage() {
  const assets = getGalleryAssets();
  return <><GalleryClient allAssets={assets} /><Footer /></>;
}
