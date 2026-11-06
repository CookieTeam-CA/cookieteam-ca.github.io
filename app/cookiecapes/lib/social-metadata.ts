import type { Metadata } from "next";

export function socialMetadata(title: string, description: string, path: string, image?: string): Metadata {
  const images = image ? [{ url: image, width: 384, height: 512, alt: title }] : [];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: "CookieCapes", type: "website", images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
