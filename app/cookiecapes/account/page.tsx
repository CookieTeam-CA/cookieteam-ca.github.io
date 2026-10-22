import { auth, signIn, signOut } from "@/auth";
import { loadAccount } from "@/app/actions/account-actions";
import AccountPanel from "./AccountPanel";

export const dynamic = "force-dynamic";
export default async function AccountPage() {
  let session;
  try { session = await auth(); }
  catch { return <main className="min-h-screen px-6 pt-32 text-white"><h1>Account vorübergehend nicht verfügbar</h1><p>Die Anmeldung konnte nicht überprüft werden. Bitte versuche es später erneut. Deine Capes wurden nicht verändert.</p></main>; }
  if (!session?.user) return <main className="min-h-screen px-6 pt-32 text-white max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold mb-6">Dein CookieCapes Account</h1>
    <p className="text-zinc-400 mb-6">Melde dich an und bestätige deinen Minecraft Account, um Capes hochzuladen.</p>
    <form action={async () => { "use server"; await signIn("discord", { redirectTo: "/cookiecapes/account" }); }}>
      <button className="rounded-lg bg-orange-600 px-6 py-3">Mit Discord anmelden</button>
    </form>
  </main>;
  let account;
  try { account = await loadAccount(); }
  catch { return <main className="min-h-screen px-6 pt-32 text-white"><h1>Account vorübergehend nicht verfügbar</h1><p>Bitte lade die Seite später erneut. Deine Capes wurden nicht verändert.</p></main>; }
  return <main className="min-h-screen px-6 pt-32 pb-20 text-white max-w-5xl mx-auto">
    <div className="flex justify-between gap-4 mb-8"><h1 className="text-3xl font-bold">Dein CookieCapes Account</h1>
      <form action={async () => { "use server"; await signOut({ redirectTo: "/cookiecapes/account" }); }}><button className="text-zinc-400 underline">Abmelden</button></form>
    </div>
    <AccountPanel account={account} />
  </main>;
}
