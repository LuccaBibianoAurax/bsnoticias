import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

function matches(left: string, right: string) {
  const a = createHash("sha256").update(left, "utf8").digest();
  const b = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(a, b);
}

function sessionClient() {
  const url = process.env["SUPABASE_URL"]!;
  const publicKey = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (publicKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${publicKey}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", publicKey);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const adminSignIn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({ username: z.string().min(1).max(80), password: z.string().min(1).max(200) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const expectedUser = (process.env["ADMIN_USERNAME"] ?? "adminbsnoticias").toLowerCase();
    const expectedPassword = process.env["ADMIN_PASSWORD"] ?? "";
    const adminEmail = process.env["ADMIN_EMAIL"] ?? "portalbsnoticias@gmail.com";
    const invalid = { ok: false as const, message: "Usuário ou senha inválidos." };

    const informed = data.username.trim().toLowerCase();
    const isEmailLogin = informed.includes("@") && matches(informed, adminEmail.toLowerCase());
    if (!isEmailLogin && !matches(informed, expectedUser)) return invalid;
    if (!expectedPassword || !matches(data.password, expectedPassword)) return invalid;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Garante que a conta do administrador existe, está confirmada e com a senha atual.
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let userId = users?.users.find((user) => user.email === adminEmail)?.id;

    if (!userId) {
      const created = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: expectedPassword,
        email_confirm: true,
        user_metadata: { username: expectedUser, display_name: "Administrador BS Notícias" },
      });
      if (created.error || !created.data.user) {
        return { ok: false as const, message: "Não foi possível preparar o acesso administrativo." };
      }
      userId = created.data.user.id;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: expectedPassword,
        email_confirm: true,
      });
    }

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          username: expectedUser,
          display_name: "Administrador BS Notícias",
          recovery_email: adminEmail,
        },
        { onConflict: "id" },
      );

    const result = await sessionClient().auth.signInWithPassword({
      email: adminEmail,
      password: expectedPassword,
    });
    if (result.error || !result.data.session) return invalid;

    return {
      ok: true as const,
      accessToken: result.data.session.access_token,
      refreshToken: result.data.session.refresh_token,
    };
  });
