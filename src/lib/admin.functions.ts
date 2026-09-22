import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const ADMIN_USERNAME = "adminbsnoticias";
const ADMIN_EMAIL = "programadosapia@gmail.com";

function matches(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export const adminSignIn = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ username: z.string().min(1).max(80), password: z.string().min(8).max(200) }).parse(data))
  .handler(async ({ data }) => {
    if (!matches(data.username.toLowerCase(), ADMIN_USERNAME)) return { ok: false as const, message: "Usuário ou senha inválidos." };
    const url = process.env['SUPABASE_URL']!;
    const publicKey = process.env['SUPABASE_PUBLISHABLE_KEY']!;
    const initialPassword = process.env['ADMIN_INITIAL_PASSWORD'];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId: string | undefined;
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
    userId = users.users.find((user) => user.email === ADMIN_EMAIL)?.id;
    if (!userId) {
      if (!initialPassword || !matches(data.password, initialPassword)) return { ok: false as const, message: "Usuário ou senha inválidos." };
      const created = await supabaseAdmin.auth.admin.createUser({ email: ADMIN_EMAIL, password: data.password, email_confirm: true, user_metadata: { username: ADMIN_USERNAME, display_name: "Administrador BS Notícias" } });
      if (created.error || !created.data.user) throw new Error("Não foi possível preparar o acesso administrativo.");
      userId = created.data.user.id;
      await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
      await supabaseAdmin.from("profiles").update({ username: ADMIN_USERNAME, recovery_email: ADMIN_EMAIL }).eq("id", userId);
    }

    const client = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (publicKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${publicKey}`) headers.delete("Authorization");
      headers.set("apikey", publicKey);
      return fetch(input, { ...init, headers });
    } } });
    const result = await client.auth.signInWithPassword({ email: ADMIN_EMAIL, password: data.password });
    if (result.error || !result.data.session) return { ok: false as const, message: "Usuário ou senha inválidos." };
    return { ok: true as const, accessToken: result.data.session.access_token, refreshToken: result.data.session.refresh_token };
  });

export const requestAdminPasswordReset = createServerFn({ method: "POST" }).handler(async () => {
  const url = process.env['SUPABASE_URL']!;
  const publicKey = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  const client = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (publicKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${publicKey}`) headers.delete("Authorization");
    headers.set("apikey", publicKey);
    return fetch(input, { ...init, headers });
  } } });
  const error = (await client.auth.resetPasswordForEmail(ADMIN_EMAIL, { redirectTo: "https://id-preview--b3875dfc-5053-43c1-a6bb-bbbdc9eb823f.lovable.app/reset-password" })).error;
  if (error) throw new Error("Não foi possível enviar a recuperação agora.");
  return { ok: true as const };
});