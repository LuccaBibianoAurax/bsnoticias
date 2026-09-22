import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { getNewsArticle } from "@/lib/news.functions";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => { const article = await getNewsArticle({ data: { slug: params.slug } }); if (!article) throw notFound(); return article; },
  head: ({ loaderData }) => ({ meta: loaderData ? [
    { title: `${loaderData.title} — BS Notícias` },
    { name: "description", content: loaderData.excerpt.slice(0, 160) },
    { property: "og:title", content: loaderData.title },
    { property: "og:description", content: loaderData.excerpt.slice(0, 200) },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
    ...(loaderData.imageUrl?.startsWith("https://") ? [{ property: "og:image", content: loaderData.imageUrl }, { name: "twitter:image", content: loaderData.imageUrl }] : []),
  ] : [{ title: "Notícia não encontrada — BS Notícias" }, { name: "robots", content: "noindex" }] }),
  notFoundComponent: () => <SiteShell><main className="mx-auto min-h-[50vh] max-w-4xl px-4 py-16 md:px-8"><h1 className="font-display text-4xl font-bold">Notícia não encontrada</h1></main></SiteShell>,
  errorComponent: () => <SiteShell><main className="mx-auto min-h-[50vh] max-w-4xl px-4 py-16 md:px-8"><h1 className="font-display text-4xl font-bold">A notícia não carregou</h1></main></SiteShell>,
  component: ArticlePage,
});

function ArticlePage() {
  const article = Route.useLoaderData();
  return <SiteShell><main className="editorial-reveal mx-auto max-w-7xl px-4 py-8 md:px-8"><article className="mx-auto max-w-4xl">
    <span className="font-mono text-xs font-semibold uppercase text-destructive">Notícias</span>
    <h1 className="mt-3 text-balance font-display text-4xl font-bold leading-[1.04] md:text-6xl">{article.title}</h1>
    <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{article.excerpt}</p>
    <div className="mt-6 flex flex-wrap gap-3 font-mono text-[10px] uppercase text-muted-foreground"><span>Por {article.author}</span><span>•</span><time>{new Date(article.date).toLocaleDateString("pt-BR", { dateStyle: "long" })}</time></div>
    {article.imageUrl && <img src={article.imageUrl} alt={article.title} className="mt-8 aspect-video w-full object-cover" />}
    <div className="article-body mx-auto mt-8 max-w-3xl" dangerouslySetInnerHTML={{ __html: article.content }} />
  </article></main></SiteShell>;
}