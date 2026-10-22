import { accountFetch } from "@/lib/cookieapi-account";
import { CapeApiError } from "@/app/cookiecapes/lib/api";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
  if (!/^\d+$/.test(id)) return new Response(null, { status: 400, headers });
  try {
    const response = await accountFetch(`/account/capes/${id}/image`);
    return new Response(response.body, { headers: { ...headers, "Content-Type": "image/png" } });
  } catch (error) { return new Response(null, { status: error instanceof CapeApiError ? error.status || 503 : 401, headers }); }
}
