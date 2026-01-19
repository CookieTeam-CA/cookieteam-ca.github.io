import { getGalleryAssets } from "./lib/gallery";
import HomeClient from "./components/HomeClient";

export default function Home() {
  const assets = getGalleryAssets();
  return <HomeClient initialAssets={assets} />;
}
