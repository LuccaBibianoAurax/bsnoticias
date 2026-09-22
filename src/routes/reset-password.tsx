import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Redefinir senha — BS Notícias" },
    { name: "description", content: "Redefinição da senha administrativa do BS Notícias." },
    { property: "og:title", content: "Redefinir senha — BS Notícias" },
    { property: "og:description", content: "Área reservada do BS Notícias." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [valid, setValid] = useState(false);
  const [message, setMessage] = useState("Validando o acesso…");
  useEffect(() => {
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    supabase.auth.getSession().then(({ data }) => { const ok = recovery || Boolean(data.session); setValid(ok); setMessage(ok ? "" : "Este link de recuperação não é válido ou expirou."); });
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) { setMessage("Use pelo menos 8 caracteres."); return; }
    if (password !== confirm) { setMessage("As senhas não coincidem."); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMessage("Não foi possível alterar a senha."); return; }
    await navigate({ to: "/admin" });
  }
  return <main className="grid min-h-screen place-items-center bg-background px-5"><div className="w-full max-w-md"><h1 className="font-display text-4xl font-bold">Crie uma nova senha</h1>{message && <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p>}{valid && <form onSubmit={submit} className="mt-8 space-y-5"><div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">Repita a senha</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} /></div><Button className="w-full">Salvar nova senha</Button></form>}</div></main>;
}