import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import logoAsset from "@/assets/bs-noticias-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminSignIn } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Acesso administrativo — BS Notícias" },
    { name: "description", content: "Acesso reservado à administração do BS Notícias." },
    { property: "og:title", content: "Acesso administrativo — BS Notícias" },
    { property: "og:description", content: "Área reservada do BS Notícias." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const result = await adminSignIn({ data: { username, password } });
      if (!result.ok) { setMessage(result.message); return; }
      const session = await supabase.auth.setSession({ access_token: result.accessToken, refresh_token: result.refreshToken });
      if (session.error) throw session.error;
      sessionStorage.setItem("bs-admin-login", "1");
      await navigate({ to: "/admin" });
    } catch { setMessage("Não foi possível entrar agora. Tente novamente."); }
    finally { setBusy(false); }
  }


  return <main className="grid min-h-screen bg-primary lg:grid-cols-[1.1fr_.9fr]">
    <section className="hidden items-end border-r border-primary-foreground/15 p-12 text-primary-foreground lg:flex"><div><img src={logoAsset.url} alt="BS Notícias" className="w-full max-w-xl bg-background p-3" /><p className="mt-8 max-w-md font-display text-3xl font-bold">Publicação e gestão editorial em um só lugar.</p></div></section>
    <section className="flex items-center justify-center bg-background px-5 py-12"><div className="w-full max-w-md">
      <Link to="/" className="font-mono text-[10px] uppercase text-muted-foreground">← Voltar ao jornal</Link>
      <LockKeyhole className="mt-12 size-8 text-destructive" />
      <h1 className="mt-5 font-display text-4xl font-bold">Acesso administrativo</h1>
      <p className="mt-2 text-sm text-muted-foreground">Área reservada à equipe BS Notícias.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div className="space-y-2"><Label htmlFor="username">Usuário</Label><Input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
        {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
      </form>
      <Button type="button" variant="link" className="mt-3 h-auto px-0 text-muted-foreground" onClick={() => setMessage("Acesso somente para a conta administrativa cadastrada.")} disabled={busy}>Precisa de ajuda?</Button>
    </div></section>

  </main>;
}