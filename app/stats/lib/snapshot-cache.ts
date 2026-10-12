// One complete snapshot per server instance. Expired data is never served while
// refreshing, and concurrent readers share the same refresh (including errors).
export function createSnapshotCache<T>(load: () => Promise<T>, ttl = 300000, now = Date.now) {
  let cached: { value: T; expires: number } | undefined;
  let pending: Promise<T> | undefined;
  return async function getSnapshot(): Promise<T> {
    if (cached && cached.expires > now()) return cached.value;
    if (!pending) pending = load().then(value => {
      cached = { value, expires: now() + ttl };
      return value;
    }).finally(() => { pending = undefined; });
    return pending;
  };
}
