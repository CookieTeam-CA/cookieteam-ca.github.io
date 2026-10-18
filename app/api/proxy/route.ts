import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL parameters", { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  // Minotar redirects hyphenated UUIDs; use its canonical path without allowing redirects.
  if (targetUrl.hostname === "minotar.net") {
    targetUrl.pathname = targetUrl.pathname.replace(
      /^\/(skin|avatar|helm)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\/\d+)?\/?$/i,
      (_path, type, uuid, size = "") => `/${type}/${uuid.replaceAll("-", "")}${size}`,
    );
  }

  const imagePaths: Record<string, RegExp> = {
    "https://minotar.net": /^\/(skin|avatar|helm)\/[A-Za-z0-9_-]+(?:\/\d+)?\/?$/,
    "https://crafthead.net": /^\/(skin|avatar)\/[A-Za-z0-9_-]+(?:\/\d+)?\/?$/,
  };
  if (targetUrl.username || targetUrl.password || targetUrl.search || !imagePaths[targetUrl.origin]?.test(targetUrl.pathname)) {
    return new NextResponse("Forbidden image URL", { status: 403 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(targetUrl, { redirect: "error", signal: controller.signal });
    if (!response.ok) {
        return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(contentType ?? "")) {
      await response.body?.cancel();
      return new NextResponse("Unsupported image type", { status: 415 });
    }
    const maxBytes = 2 * 1024 * 1024;
    if (Number(response.headers.get("content-length")) > maxBytes) {
      await response.body?.cancel();
      return new NextResponse("Image too large", { status: 413 });
    }
    const reader = response.body?.getReader();
    if (!reader) return new NextResponse("Missing image body", { status: 502 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return new NextResponse("Image too large", { status: 413 });
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks, size);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType!,
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
