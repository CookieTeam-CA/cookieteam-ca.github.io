import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] text-white p-6 text-center">
      <h1 className="font-nexa text-[8rem] md:text-[12rem] leading-none mb-4">
        <span className="text-orange-500">4</span>
        <span className="text-white">0</span>
        <span className="text-orange-500">4</span>
      </h1>
      
      <h2 className="font-nexa text-2xl md:text-4xl mb-6">
        Wo ist der Keks hin?
      </h2>
      
      <p className="text-zinc-400 max-w-lg mb-10 text-lg">
        Die Seite, die du suchst, wurde entweder gegessen oder existiert nicht.
      </p>
      
      <Link 
        href="/"
        className="group relative overflow-hidden rounded-full bg-white px-8 py-3.5 font-bold text-black transition-all hover:scale-105 active:scale-95 cursor-pointer inline-block"
      >
        <span className="relative z-10">Zurück zur Startseite</span>
        <div className="absolute inset-0 -z-10 translate-y-full bg-orange-500 transition-transform duration-300 group-hover:translate-y-0"></div>
      </Link>
    </div>
  );
}
