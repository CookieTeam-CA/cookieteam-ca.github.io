import { getHomeGalleryAssets } from "./lib/gallery";
import HomeClient from "./components/HomeClient";
import Footer from "./components/Footer";
import { auth } from "../auth";

export default async function Home() {
  const assets = getHomeGalleryAssets();
  const session = await auth().catch(() => null);
  return (
    <main>
      <HomeClient initialAssets={assets} session={session} />
      <Footer />
    </main>
  );
}
