import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nexaHeavy = localFont({
  src: "../public/fonts/Nexa-Heavy.ttf",
  variable: "--font-nexa",
});

export const metadata: Metadata = {
  title: "CookieAttack",
  description: "CookieAttack Landing Page",
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
        {children}
      </body>
    </html>
  );
}
