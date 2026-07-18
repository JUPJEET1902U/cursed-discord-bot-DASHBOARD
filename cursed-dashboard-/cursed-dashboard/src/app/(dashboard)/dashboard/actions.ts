"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SELECTED_GUILD_COOKIE } from "@/lib/guild";

const SNOWFLAKE = /^\d{17,20}$/;

export async function selectServer(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const guildId = formData.get("guildId");
  if (typeof guildId !== "string" || !SNOWFLAKE.test(guildId)) {
    redirect("/dashboard?error=invalid_selection");
  }

  // The selected-guild cookie is only a navigation hint. Guild pages and every
  // write API independently re-verify Discord access, so repeating the full
  // Discord + Railway server-list request here only made switching slower.
  const cookieStore = await cookies();
  cookieStore.set(SELECTED_GUILD_COOKIE, guildId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard/overview");
}

export async function clearSelectedServer() {
  const cookieStore = await cookies();
  cookieStore.delete(SELECTED_GUILD_COOKIE);
  redirect("/dashboard");
}
