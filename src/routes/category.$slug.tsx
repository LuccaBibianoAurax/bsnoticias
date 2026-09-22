import { createFileRoute } from "@tanstack/react-router";
import { NewsPage } from "@/components/news-page";
import { getCategoryPage } from "@/lib/news.functions";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => getCategoryPage({ data: { slug: params.slug, page: 1 } }),
  head: ({ params }) => ({ meta: [
    { title: `${params.slug} — BS Notícias` },
    { name: "description", content: `Últimas notícias de ${params.slug} no BS Notícias.` },
    { property: "og:title", content: `${params.slug} — BS Notícias` },
    { property: "og:description", content: `Acompanhe as notícias de ${params.slug}.` },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  errorComponent: () => <div className="p-8">Não foi possível carregar esta editoria.</div>,
  component: () => { const data = Route.useLoaderData(); return <NewsPage items={data.items} page={1} totalPages={data.totalPages} />; },
});