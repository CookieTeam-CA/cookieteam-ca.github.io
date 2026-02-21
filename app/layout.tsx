import "./globals.css";
import localFont from "next/font/local";
import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import JsonLd from "./components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nexaHeavy = localFont({
  src: "../public/fonts/Nexa-Heavy.woff2",
  variable: "--font-nexa",
});

export const metadata: Metadata = {
  title: {
    default: "CookieAttack",
    template: "%s | CookieAttack"
  },
  description: "Minecraft SMP Server mit spannenden Events, Roleplay und starker Community. Sei dabei wenn CookieAttack 6 startet!",
  keywords: ["Minecraft", "Server", "CookieAttack", "Events", "Roleplay", "Gaming", "Community", "Deutsch"],
  authors: [{ name: "CookieTeam" }],
  creator: "CookieTeam",
  publisher: "CookieTeam",
  metadataBase: new URL("https://cookieattack.de"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CookieAttack - Dein Minecraft Server",
    description: "Das ultimative Minecraft Erlebnis. Tritt unserem Minecraft Server bei und erlebe spannende Events und Projekte.",
    url: "https://cookieattack.de",
    siteName: "CookieAttack",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "CookieAttack Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CookieAttack",
    description: "Das ultimative Minecraft Erlebnis.",
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nexaHeavy.variable} antialiased bg-black text-white`}
      >
        <JsonLd />
        {children}
      </body>
    </html>
  );
}
