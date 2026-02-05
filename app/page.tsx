import { getGalleryAssets } from "./lib/gallery";
import HomeClient from "./components/HomeClient";
import Footer from "./components/Footer";

export default function Home() {
  const assets = getGalleryAssets();
  return (
    <main>
      <HomeClient initialAssets={assets} />
      <Footer />
    </main>
  );
}
