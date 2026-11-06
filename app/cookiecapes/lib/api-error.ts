import { translations, type MessageKey } from "../i18n/messages";
import type { Locale } from "../i18n/locale";

export class CapeApiError extends Error {
  constructor(readonly status: number, message: string, readonly retryAfter: string | null = null, readonly code?: string, readonly existingCapeId?: number) { super(message); }
}

export async function capeApiError(response: Response, locale: Locale = "en"): Promise<CapeApiError> {
  const { t } = translations(locale);
  const messages: Record<number, MessageKey> = {
    401: "Sign-in is missing, expired, or invalid.",
    403: "This action is not allowed.",
    400: "Please check your input.",
    422: "Please check your input.",
    413: "The request is too large.",
    429: "Too many requests. Please try again later.",
    469: "The cape was rejected by moderation.",
    503: "An external service is temporarily unavailable.",
  };
  let code: string | undefined, existingCapeId: number | undefined;
  let detail = await response.text();
  try {
    const data = JSON.parse(detail);
    if (response.status === 409 && data?.code === "duplicate_cape" && Number.isSafeInteger(data.existing_cape_id) && data.existing_cape_id > 0) { code = data.code; existingCapeId = data.existing_cape_id; }
    detail = typeof data?.detail === "string" ? data.detail : "";
  } catch { /* The API may also return plain text. */ }
  const retryAfter = response.headers.get("Retry-After");
  let message = messages[response.status] ? t(messages[response.status]) : t("The API request failed (HTTP {status}).", { status: response.status });
  if (detail && !detail.trimStart().startsWith("<")) message += ` ${detail.slice(0, 400)}`;
  if (response.status === 429 && retryAfter) {
    const seconds = /^\d+$/.test(retryAfter) ? Number(retryAfter) : Math.ceil((Date.parse(retryAfter) - Date.now()) / 1000);
    if (Number.isFinite(seconds) && seconds > 0) message += ` ${t("Please wait at least {seconds} seconds before trying again.", { seconds })}`;
  }
  return new CapeApiError(response.status, message, retryAfter, code, existingCapeId);
}

