import "server-only";

export const websiteSessionCookie = process.env.NODE_ENV === "production"
  ? "__Secure-cookiecapes.session-token" : "cookiecapes.session-token";

export function serviceHeaders(): Headers {
  const token = process.env.WEBSITE_SERVICE_TOKEN;
  if (!token) throw new Error("WEBSITE_SERVICE_TOKEN is not configured");
  return new Headers({ Authorization: `Bearer ${token}` });
}

export const cookieApiUrl = () => (process.env.COOKIECAPES_API_URL || "https://api.cookieattack.de").replace(/\/+$/, "");

