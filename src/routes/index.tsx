import { createFileRoute } from "@tanstack/react-router";
import { NewsPage } from "@/components/news-page";
import { getNewsPage } from "@/lib/news.functions";

export const Route = createFileRoute("/")({
  loader: () => getNewsPage({ data: { page: 1 } }),
  head: () => ({ meta: [
    { title: "BS Notícias — Informação que move o Brasil" },
    { name: "description", content: "As principais notícias do Brasil, política, economia, esportes, saúde, turismo e entretenimento." },
    { property: "og:title", content: "BS Notícias — Informação que move o Brasil" },
    { property: "og:description", content: "As principais notícias do Brasil e do mundo, atualizadas ao longo do dia." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  errorComponent: () => <div className="p-8">Não foi possível carregar as notícias.</div>,
  component: () => { const data = Route.useLoaderData(); return <NewsPage items={data.items} page={1} totalPages={data.totalPages} />; },
});