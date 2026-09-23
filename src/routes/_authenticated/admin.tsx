import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, LogOut, Megaphone, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
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
  head: () => ({
    meta: [
      { title: "Painel editorial — BS Notícias" },
      { name: "description", content: "Gestão de notícias e patrocínios do BS Notícias." },
      { property: "og:title", content: "Painel editorial — BS Notícias" },
      { property: "og:description", content: "Gestão reservada do BS Notícias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPanel,
});

type Article = Tables<"articles">;
type Sponsor = Tables<"sponsors">;

const ARTIGO_VAZIO = {
  title: "",
  slug: "",
  excerpt: "",
  content_html: "",
  image_url: "",
  category: "Notícias",
  status: "published",
};

const PATROCINIO_VAZIO = {
  name: "",
  image_url: "",
  target_url: "",
  alt_text: "Publicidade",
  placement: "sidebar",
  active: true,
  sort_order: 0,
};

function criarSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function AdminPanel() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [articleForm, setArticleForm] = useState({ ...ARTIGO_VAZIO });
  const [articleId, setArticleId] = useState<string | null>(null);
  const [sponsorForm, setSponsorForm] = useState({ ...PATROCINIO_VAZIO });
  const [sponsorId, setSponsorId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const [articleRows, sponsorRows] = await Promise.all([
      supabase.from("articles").select("*").order("updated_at", { ascending: false }).limit(100),
      supabase.from("sponsors").select("*").order("sort_order", { ascending: true }),
    ]);
    setArticles(articleRows.data ?? []);
    setSponsors(sponsorRows.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function currentUser() {
    const result = await supabase.auth.getUser();
    return result.data.user?.id;
  }

  async function salvarNoticia(event: FormEvent) {
    event.preventDefault();
    const userId = await currentUser();
    if (!userId) {
      setMessage("Sessão expirada. Entre novamente.");
      return;
    }
    const slug = criarSlug(articleForm.slug || articleForm.title);
    const payload = {
      ...articleForm,
      slug,
      image_url: articleForm.image_url || null,
      excerpt: articleForm.excerpt || null,
      published_at: articleForm.status === "published" ? new Date().toISOString() : null,
    };
    const result = articleId
      ? await supabase.from("articles").update(payload).eq("id", articleId)
      : await supabase.from("articles").insert({ ...payload, created_by: userId });
    if (result.error) {
      setMessage(`Não foi possível salvar a notícia: ${result.error.message}`);
      return;
    }
    setMessage(articleId ? "Notícia atualizada e publicada para todos." : "Notícia publicada para todos os visitantes.");
    setArticleForm({ ...ARTIGO_VAZIO });
    setArticleId(null);
    await refresh();
  }

  async function salvarPatrocinio(event: FormEvent) {
    event.preventDefault();
    const userId = await currentUser();
    if (!userId) {
      setMessage("Sessão expirada. Entre novamente.");
      return;
    }
    const result = sponsorId
      ? await supabase.from("sponsors").update(sponsorForm).eq("id", sponsorId)
      : await supabase.from("sponsors").insert({ ...sponsorForm, created_by: userId });
    if (result.error) {
      setMessage(`Não foi possível salvar o anúncio: ${result.error.message}`);
      return;
    }
    setMessage(sponsorId ? "Anúncio atualizado no site." : "Anúncio publicado no site.");
    setSponsorForm({ ...PATROCINIO_VAZIO });
    setSponsorId(null);
    await refresh();
  }

  function editarNoticia(item: Article) {
    setArticleId(item.id);
    setArticleForm({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt ?? "",
      content_html: item.content_html,
      image_url: item.image_url ?? "",
      category: item.category,
      status: item.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editarPatrocinio(item: Sponsor) {
    setSponsorId(item.id);
    setSponsorForm({
      name: item.name,
      image_url: item.image_url,
      target_url: item.target_url,
      alt_text: item.alt_text,
      placement: item.placement,
      active: item.active,
      sort_order: item.sort_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remover(table: "articles" | "sponsors", id: string) {
    const result = await supabase.from(table).delete().eq("id", id);
    setMessage(result.error ? "Não foi possível excluir." : "Item excluído.");
    await refresh();
  }

  async function sair() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5">
          <img src={logoAsset.url} alt="BS Notícias" className="w-56" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw /> Atualizar página
            </Button>
            <Button variant="outline" onClick={sair}>
              <LogOut /> Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="border-l-4 border-destructive pl-4">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Área reservada</span>
          <h1 className="font-display text-4xl font-bold">Painel editorial</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Tudo o que for salvo aqui aparece imediatamente para todos os visitantes do site, sem
            precisar mexer no domínio.
          </p>
        </div>
        {message && (
          <p role="status" className="mt-5 border border-border bg-muted p-3 text-sm">
            {message}
          </p>
        )}
        <Tabs defaultValue="articles" className="mt-8">
          <TabsList>
            <TabsTrigger value="articles">
              <FileText /> Adicionar notícia
            </TabsTrigger>
            <TabsTrigger value="sponsors">
              <Megaphone /> Editar patrocinadores e links
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="articles"
            className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"
          >
            <form onSubmit={salvarNoticia} className="space-y-5">
              <h2 className="font-display text-2xl font-bold">
                <Plus className="mr-2 inline size-5" />
                {articleId ? "Editar notícia" : "Adicionar notícia"}
              </h2>
              <Field label="Título">
                <Input
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  required
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Endereço amigável">
                  <Input
                    value={articleForm.slug}
                    onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                    placeholder="Gerado pelo título"
                  />
                </Field>
                <Field label="Categoria">
                  <Input
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Resumo">
                <Textarea
                  value={articleForm.excerpt}
                  onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                />
              </Field>
              <Field label="Imagem (endereço da foto)">
                <Input
                  type="url"
                  value={articleForm.image_url}
                  onChange={(e) => setArticleForm({ ...articleForm, image_url: e.target.value })}
                />
              </Field>
              <Field label="Conteúdo">
                <Textarea
                  className="min-h-72"
                  value={articleForm.content_html}
                  onChange={(e) => setArticleForm({ ...articleForm, content_html: e.target.value })}
                  required
                />
              </Field>
              <div className="flex items-center gap-3">
                <Switch
                  checked={articleForm.status === "published"}
                  onCheckedChange={(checked) =>
                    setArticleForm({ ...articleForm, status: checked ? "published" : "draft" })
                  }
                />
                <Label>Publicar imediatamente para todos</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{articleId ? "Salvar alterações" : "Publicar notícia"}</Button>
                {articleId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setArticleId(null);
                      setArticleForm({ ...ARTIGO_VAZIO });
                    }}
                  >
                    <X /> Cancelar edição
                  </Button>
                )}
              </div>
            </form>
            <List title="Notícias publicadas pelo painel" empty="Nenhuma notícia cadastrada ainda.">
              {articles.map((item) => (
                <Row
                  key={item.id}
                  title={item.title}
                  detail={`${item.category} · ${item.status === "published" ? "publicada" : "rascunho"}`}
                  onEdit={() => editarNoticia(item)}
                  onDelete={() => void remover("articles", item.id)}
                />
              ))}
            </List>
          </TabsContent>

          <TabsContent
            value="sponsors"
            className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"
          >
            <form onSubmit={salvarPatrocinio} className="space-y-5">
              <h2 className="font-display text-2xl font-bold">
                <Plus className="mr-2 inline size-5" />
                {sponsorId ? "Editar patrocinador" : "Adicionar patrocinador"}
              </h2>
              <Field label="Nome do patrocinador">
                <Input
                  value={sponsorForm.name}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Imagem do anúncio (endereço)">
                <Input
                  type="url"
                  value={sponsorForm.image_url}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, image_url: e.target.value })}
                  required
                />
              </Field>
              <Field label="Link de redirecionamento">
                <Input
                  type="url"
                  value={sponsorForm.target_url}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, target_url: e.target.value })}
                  required
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Descrição da imagem">
                  <Input
                    value={sponsorForm.alt_text}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, alt_text: e.target.value })}
                  />
                </Field>
                <Field label="Ordem de exibição">
                  <Input
                    type="number"
                    value={sponsorForm.sort_order}
                    onChange={(e) =>
                      setSponsorForm({ ...sponsorForm, sort_order: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
              </div>
              <Field label="Posição no site">
                <select
                  className="h-10 w-full border border-input bg-background px-3 text-sm"
                  value={sponsorForm.placement}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, placement: e.target.value })}
                >
                  <option value="sidebar">Lateral das notícias</option>
                  <option value="banner">Faixa no topo da página</option>
                </select>
              </Field>
              <div className="flex items-center gap-3">
                <Switch
                  checked={sponsorForm.active}
                  onCheckedChange={(active) => setSponsorForm({ ...sponsorForm, active })}
                />
                <Label>Anúncio ativo no site</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{sponsorId ? "Salvar alterações" : "Publicar anúncio"}</Button>
                {sponsorId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSponsorId(null);
                      setSponsorForm({ ...PATROCINIO_VAZIO });
                    }}
                  >
                    <X /> Cancelar edição
                  </Button>
                )}
              </div>
            </form>
            <List title="Patrocinadores cadastrados" empty="Nenhum patrocinador cadastrado.">
              {sponsors.map((item) => (
                <Row
                  key={item.id}
                  title={item.name}
                  detail={`${item.active ? "ativo" : "pausado"} · ${item.target_url}`}
                  onEdit={() => editarPatrocinio(item)}
                  onDelete={() => void remover("sponsors", item.id)}
                />
              ))}
            </List>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function List({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children : [];
  return (
    <aside>
      <h2 className="font-mono text-xs font-semibold uppercase">{title}</h2>
      <div className="mt-4 divide-y divide-border border-y border-border">
        {items.length ? items : <p className="py-5 text-sm text-muted-foreground">{empty}</p>}
      </div>
    </aside>
  );
}

function Row({
  title,
  detail,
  onEdit,
  onDelete,
}: {
  title: string;
  detail: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-4">
      <div className="min-w-0">
        <strong className="block text-sm">{title}</strong>
        <span className="mt-1 block truncate text-xs text-muted-foreground">{detail}</span>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Editar ${title}`}>
          <Pencil />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Excluir ${title}`}>
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
