import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL parameters", { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch (e) {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  const allowedDomains = ["api.cookieattack.de", "minotar.net", "crafatar.com", "mc-heads.net", "visage.surgeplay.com"];
  if (!allowedDomains.includes(targetUrl.hostname)) {
    return new NextResponse("Forbidden proxy domain", { status: 403 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
        return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
