import { createFileRoute } from "@tanstack/react-router";
import { NewsPage } from "@/components/news-page";
import { MAX_PAGES, getNewsPage, getSponsors } from "@/lib/news.functions";

export const Route = createFileRoute("/page/$page")({
  loader: async ({ params }) => {
    const page = Math.max(1, Math.min(MAX_PAGES, Number(params.page) || 1));
    const [news, sponsors] = await Promise.all([
      getNewsPage({ data: { page } }),
      getSponsors(),
    ]);
    return { ...news, sponsors };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Página ${params.page} — BS Notícias` },
      {
        name: "description",
        content: `Arquivo de notícias do BS Notícias, página ${params.page} de ${MAX_PAGES}.`,
      },
      { property: "og:title", content: `Página ${params.page} — BS Notícias` },
      { property: "og:description", content: "Arquivo completo de notícias do BS Notícias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => <div className="p-8">Não foi possível carregar esta página.</div>,
  component: () => {
    const data = Route.useLoaderData();
    const { page } = Route.useParams();
    return (
      <NewsPage
        items={data.items}
        page={Math.max(1, Math.min(MAX_PAGES, Number(page) || 1))}
        totalPages={data.totalPages}
        sponsors={data.sponsors}
      />
    );
  },
});
