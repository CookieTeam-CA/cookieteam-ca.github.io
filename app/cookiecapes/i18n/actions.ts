"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { localeCookie } from "./locale";

export async function setLocale(locale: "en" | "de") {
  if (locale !== "en" && locale !== "de") throw new Error("Invalid language");
  (await cookies()).set(localeCookie, locale, {
    path: "/cookiecapes", maxAge: 31536000, sameSite: "lax", secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/cookiecapes", "layout");
}
