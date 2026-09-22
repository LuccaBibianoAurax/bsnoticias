import { createFileRoute } from "@tanstack/react-router";
import { NewsPage } from "@/components/news-page";
import { getNewsPage } from "@/lib/news.functions";

export const Route = createFileRoute("/page/$page")({
  loader: ({ params }) => getNewsPage({ data: { page: Math.max(1, Math.min(483, Number(params.page) || 1)) } }),
  head: ({ params }) => ({ meta: [
    { title: `Página ${params.page} — BS Notícias` },
    { name: "description", content: `Arquivo de notícias do BS Notícias, página ${params.page}.` },
    { property: "og:title", content: `Página ${params.page} — BS Notícias` },
    { property: "og:description", content: "Arquivo completo de notícias do BS Notícias." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  errorComponent: () => <div className="p-8">Não foi possível carregar esta página.</div>,
  component: () => { const data = Route.useLoaderData(); const { page } = Route.useParams(); return <NewsPage items={data.items} page={Number(page) || 1} totalPages={data.totalPages} />; },
});