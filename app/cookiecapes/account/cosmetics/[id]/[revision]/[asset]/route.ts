import { accountFetch } from "@/lib/cookieapi-account";
import { CapeApiError } from "@/app/cookiecapes/lib/api-error";

export const dynamic = "force-dynamic";
const TYPES: Record<string, string> = { "model.json": "application/json", "texture.png": "image/png", "preview.png": "image/png" };

// Owners and moderators see unapproved cosmetics through the signed-in website session.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; revision: string; asset: string }> }) {
  const { id, revision, asset } = await params;
  const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
  if (!/^\d+$/.test(id) || !/^[a-f0-9]{32}$/.test(revision) || !TYPES[asset]) return new Response(null, { status: 400, headers });
  try {
    const response = await accountFetch(`/account/cosmetics/${id}/${revision}/${asset}`);
    return new Response(response.body, { headers: { ...headers, "Content-Type": TYPES[asset] } });
  } catch (error) { return new Response(null, { status: error instanceof CapeApiError ? error.status || 503 : 401, headers }); }
}
