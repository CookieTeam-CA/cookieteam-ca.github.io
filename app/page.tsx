import { getGalleryAssets } from "./lib/gallery";
import HomeClient from "./components/HomeClient";
import Footer from "./components/Footer";
import { auth } from "../auth";

export default async function Home() {
  const assets = getGalleryAssets();
  const session = await auth();
  return (
    <main>
      <HomeClient initialAssets={assets} session={session} />
      <Footer />
    </main>
  );
}
