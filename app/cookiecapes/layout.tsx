import { auth } from "@/auth";
import { loadAccount } from "@/app/actions/account-actions";
import CookieNavbar from "./components/CookieNavbar";
import { Toaster } from "@/components/ui/toast";

export default async function CookieCapesLayout({ children }: { children: React.ReactNode }) {
  let identity: { name: string; image?: string | null; minecraftUuid?: string } | null = null;
  try {
    const session = await auth();
    if (session?.user) {
      identity = { name: session.user.name ?? "Dein Account", image: session.user.image };
      try {
        const account = await loadAccount();
        const minecraft = account.links[0];
        if (minecraft) identity = { name: minecraft.minecraft_name, minecraftUuid: minecraft.minecraft_uuid };
      } catch { /* Discord identity remains available while Minecraft links cannot be loaded. */ }
    }
  } catch { /* Public pages remain accessible if the session service is unavailable. */ }

  return <Toaster><CookieNavbar identity={identity} />{children}</Toaster>;
}
