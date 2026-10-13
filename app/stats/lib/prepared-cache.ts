export class StatsApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly requestId?: string) { super(message); }
}
type Representation = { value: unknown; expires: number; etag: string | null; version: string };

// This module is imported only by the server adapter (and independent tests).
export function createPreparedClient(baseUrl: string, ttl = 300000, fetcher = fetch, now = Date.now) {
  const cached = new Map<string, Representation>();
  const pending = new Map<string, Promise<unknown>>();
  function pathFor(resource: string, query: URLSearchParams) {
    const normalized = new URLSearchParams(query);
    normalized.sort();
    return resource + (normalized.size ? `?${normalized}` : "");
  }
  async function get<T>(resource: string, query = new URLSearchParams(), force = false): Promise<T> {
    const path = pathFor(resource, query); // Includes effective query and version pin.
    const previous = cached.get(path);
    if (!force && previous && previous.expires > now()) return previous.value as T;
    let task = pending.get(path);
    if (!task) {
      task = (async () => {
        const response = await fetcher(`${baseUrl}${path}`, { cache: "no-store", signal: AbortSignal.timeout(20000),
          headers: previous?.etag ? { "If-None-Match": previous.etag } : undefined });
        let value: unknown;
        // Conditional responses have no body and response.ok is false.
        if (response.status === 304) {
          if (!previous || !previous.etag || response.headers.get("etag") !== previous.etag || response.headers.get("X-Snapshot-Version") !== previous.version) throw new Error("Unmatched stats API 304");
          value = previous.value;
        } else {
          if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new StatsApiError(response.status, body?.error?.code ?? "upstream_error", body?.error?.message ?? `Stats API returned ${response.status}`, body?.error?.request_id);
          }
          value = await response.json();
        }
        const observed = Date.parse(response.headers.get("X-Snapshot-Validated-At") ?? "");
        const version = (value as { snapshot_version?: string })?.snapshot_version;
        if (!Number.isFinite(observed) || observed + ttl <= now() || !version) throw new Error("Stats API response has no fresh source validation");
        if (query.has("snapshot_version") && query.get("snapshot_version") !== version) throw new Error("Stats API returned a different pinned version");
        if (cached.size >= 256) cached.delete(cached.keys().next().value!);
        cached.set(path, { value, expires: observed + ttl, etag: response.headers.get("etag"), version });
        return value;
      })().finally(() => pending.delete(path));
      pending.set(path, task);
    }
    return await task as T;
  }
  return { get };
}

// Retry the entire related-read sequence, never only the conflicting request.
export async function versionedSequence<T>(run: (force: boolean) => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try { return await run(attempt > 0); }
    catch (error) { if (!(error instanceof StatsApiError) || error.status !== 409 || attempt === attempts - 1) throw error; }
  }
  throw new Error("Stats API version retry exhausted");
}
