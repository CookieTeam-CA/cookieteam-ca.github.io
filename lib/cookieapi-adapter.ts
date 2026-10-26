import "server-only";
import type { Adapter, AdapterSession, AdapterUser } from "next-auth/adapters";

export const websiteSessionCookie = process.env.NODE_ENV === "production"
  ? "__Secure-cookiecapes.session-token" : "cookiecapes.session-token";

export function serviceHeaders(): Headers {
  const token = process.env.WEBSITE_SERVICE_TOKEN;
  if (!token) throw new Error("WEBSITE_SERVICE_TOKEN is not configured");
  return new Headers({ Authorization: `Bearer ${token}` });
}

export const cookieApiUrl = () => (process.env.COOKIECAPES_API_URL || "https://api.cookieattack.de").replace(/\/+$/, "");

export function hydrateUser(user: AdapterUser): AdapterUser {
  return { ...user, emailVerified: user.emailVerified ? new Date(user.emailVerified) : null };
}
export function hydrateSession(session: AdapterSession): AdapterSession {
  return { ...session, expires: new Date(session.expires) };
}

export function CookieApiAdapter(): Adapter {
  async function call<T>(operation: string, data: unknown): Promise<T> {
    const headers = serviceHeaders();
    headers.set("Content-Type", "application/json");
    const response = await fetch(`${cookieApiUrl()}/internal/auth/${operation}`, {
      method: "POST", headers, body: JSON.stringify({ data }), redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Account persistence failed (${response.status})`);
    return response.json();
  }
  const user = async (operation: string, data: unknown) => {
    const value = await call<AdapterUser | null>(operation, data);
    return value ? hydrateUser(value) : null;
  };
  return {
    createUser: async data => hydrateUser(await call("createUser", data)),
    getUser: id => user("getUser", { id }),
    getUserByEmail: email => user("getUserByEmail", { email }),
    getUserByAccount: account => user("getUserByAccount", account),
    updateUser: async data => hydrateUser(await call("updateUser", data)),
    linkAccount: async data => { await call("linkAccount", data); },
    createSession: async data => hydrateSession(await call("createSession", data)),
    getSessionAndUser: async sessionToken => {
      const value = await call<{ user: AdapterUser; session: AdapterSession } | null>("getSessionAndUser", { sessionToken });
      return value ? { user: hydrateUser(value.user), session: hydrateSession(value.session) } : null;
    },
    updateSession: async data => {
      const value = await call<AdapterSession | null>("updateSession", data);
      return value ? hydrateSession(value) : null;
    },
    deleteSession: async sessionToken => { await call("deleteSession", { sessionToken }); },
  };
}
