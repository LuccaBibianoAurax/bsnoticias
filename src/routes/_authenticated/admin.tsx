import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, LogOut, Megaphone, Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import logoAsset from "@/assets/bs-noticias-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Painel editorial — BS Notícias" },
    { name: "description", content: "Gestão de notícias e patrocínios do BS Notícias." },
    { property: "og:title", content: "Painel editorial — BS Notícias" },
    { property: "og:description", content: "Gestão reservada do BS Notícias." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AdminPanel,
});

type Article = Tables<"articles">;
type Sponsor = Tables<"sponsors">;

function AdminPanel() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [message, setMessage] = useState("");
  const [article, setArticle] = useState({ title: "", slug: "", excerpt: "", content_html: "", image_url: "", category: "Notícias", status: "published" });
  const [sponsor, setSponsor] = useState({ name: "", image_url: "", target_url: "", alt_text: "Publicidade", placement: "sidebar", active: true });

  async function refresh() {
    const [articleRows, sponsorRows] = await Promise.all([
      supabase.from("articles").select("*").order("updated_at", { ascending: false }).limit(100),
      supabase.from("sponsors").select("*").order("sort_order", { ascending: true }),
    ]);
    setArticles(articleRows.data ?? []); setSponsors(sponsorRows.data ?? []);
  }
  useEffect(() => { void refresh(); }, []);
  async function currentUser() { const result = await supabase.auth.getUser(); return result.data.user?.id; }
  async function addArticle(event: FormEvent) {
    event.preventDefault(); const userId = await currentUser(); if (!userId) return;
    const slug = (article.slug || article.title).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const result = await supabase.from("articles").insert({ ...article, slug, image_url: article.image_url || null, excerpt: article.excerpt || null, published_at: article.status === "published" ? new Date().toISOString() : null, created_by: userId });
    setMessage(result.error ? "Não foi possível salvar a notícia." : "Notícia salva."); if (!result.error) { setArticle({ title: "", slug: "", excerpt: "", content_html: "", image_url: "", category: "Notícias", status: "published" }); await refresh(); }
  }
  async function addSponsor(event: FormEvent) {
    event.preventDefault(); const userId = await currentUser(); if (!userId) return;
    const result = await supabase.from("sponsors").insert({ ...sponsor, created_by: userId });
    setMessage(result.error ? "Não foi possível salvar o patrocínio." : "Patrocínio salvo."); if (!result.error) { setSponsor({ name: "", image_url: "", target_url: "", alt_text: "Publicidade", placement: "sidebar", active: true }); await refresh(); }
  }
  async function remove(table: "articles" | "sponsors", id: string) { await supabase.from(table).delete().eq("id", id); await refresh(); }
  async function signOut() { await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }

  return <div className="min-h-screen bg-background"><header className="border-b border-border px-4 py-4 md:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-5"><img src={logoAsset.url} alt="BS Notícias" className="w-56" /><Button variant="outline" onClick={signOut}><LogOut /> Sair</Button></div></header><main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
    <div className="border-l-4 border-destructive pl-4"><span className="font-mono text-[10px] uppercase text-muted-foreground">Área reservada</span><h1 className="font-display text-4xl font-bold">Painel editorial</h1></div>
    {message && <p role="status" className="mt-5 border border-border bg-muted p-3 text-sm">{message}</p>}
    <Tabs defaultValue="articles" className="mt-8"><TabsList><TabsTrigger value="articles"><FileText /> Notícias</TabsTrigger><TabsTrigger value="sponsors"><Megaphone /> Patrocínios</TabsTrigger></TabsList>
      <TabsContent value="articles" className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"><form onSubmit={addArticle} className="space-y-5"><h2 className="font-display text-2xl font-bold"><Plus className="mr-2 inline size-5" />Adicionar notícia</h2><Field label="Título"><Input value={article.title} onChange={(e) => setArticle({ ...article, title: e.target.value })} required /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Endereço amigável"><Input value={article.slug} onChange={(e) => setArticle({ ...article, slug: e.target.value })} placeholder="Gerado pelo título" /></Field><Field label="Categoria"><Input value={article.category} onChange={(e) => setArticle({ ...article, category: e.target.value })} /></Field></div><Field label="Resumo"><Textarea value={article.excerpt} onChange={(e) => setArticle({ ...article, excerpt: e.target.value })} /></Field><Field label="Imagem (URL)"><Input type="url" value={article.image_url} onChange={(e) => setArticle({ ...article, image_url: e.target.value })} /></Field><Field label="Conteúdo"><Textarea className="min-h-72" value={article.content_html} onChange={(e) => setArticle({ ...article, content_html: e.target.value })} required /></Field><div className="flex items-center gap-3"><Switch checked={article.status === "published"} onCheckedChange={(checked) => setArticle({ ...article, status: checked ? "published" : "draft" })} /><Label>Publicar imediatamente</Label></div><Button>Salvar notícia</Button></form><List title="Notícias salvas" empty="Nenhuma notícia nova salva nesta área.">{articles.map((item) => <Row key={item.id} title={item.title} detail={`${item.category} · ${item.status}`} onDelete={() => remove("articles", item.id)} />)}</List></TabsContent>
      <TabsContent value="sponsors" className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"><form onSubmit={addSponsor} className="space-y-5"><h2 className="font-display text-2xl font-bold"><Plus className="mr-2 inline size-5" />Adicionar patrocínio</h2><Field label="Nome"><Input value={sponsor.name} onChange={(e) => setSponsor({ ...sponsor, name: e.target.value })} required /></Field><Field label="Imagem do anúncio (URL)"><Input type="url" value={sponsor.image_url} onChange={(e) => setSponsor({ ...sponsor, image_url: e.target.value })} required /></Field><Field label="Link de redirecionamento"><Input type="url" value={sponsor.target_url} onChange={(e) => setSponsor({ ...sponsor, target_url: e.target.value })} required /></Field><Field label="Descrição da imagem"><Input value={sponsor.alt_text} onChange={(e) => setSponsor({ ...sponsor, alt_text: e.target.value })} /></Field><div className="flex items-center gap-3"><Switch checked={sponsor.active} onCheckedChange={(active) => setSponsor({ ...sponsor, active })} /><Label>Anúncio ativo</Label></div><Button>Salvar patrocínio</Button></form><List title="Patrocínios salvos" empty="Nenhum patrocínio cadastrado.">{sponsors.map((item) => <Row key={item.id} title={item.name} detail={item.target_url} onDelete={() => remove("sponsors", item.id)} />)}</List></TabsContent>
    </Tabs>
  </main></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function List({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) { return <aside><h2 className="font-mono text-xs font-semibold uppercase">{title}</h2><div className="mt-4 divide-y divide-border border-y border-border">{Array.isArray(children) && children.length ? children : <p className="py-5 text-sm text-muted-foreground">{empty}</p>}</div></aside>; }
function Row({ title, detail, onDelete }: { title: string; detail: string; onDelete: () => void }) { return <div className="flex items-start justify-between gap-3 py-4"><div className="min-w-0"><strong className="block text-sm">{title}</strong><span className="mt-1 block truncate text-xs text-muted-foreground">{detail}</span></div><Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Excluir ${title}`}><Trash2 /></Button></div>; }