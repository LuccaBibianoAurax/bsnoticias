import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NewsItem, SponsorItem } from "@/lib/news.functions";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

function StoryImage({ story, eager = false }: { story: NewsItem; eager?: boolean }) {
  return story.imageUrl ? (
    <img
      src={story.imageUrl}
      alt=""
      loading={eager ? "eager" : "lazy"}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="grid h-full w-full place-items-center bg-muted font-mono text-xs uppercase text-muted-foreground">
      BS Notícias
    </div>
  );
}

export function SponsorSlot({ sponsor }: { sponsor: SponsorItem }) {
  return (
    <a
      href={sponsor.targetUrl}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="block border border-border bg-muted/40 p-3 transition-colors hover:border-destructive"
    >
      <span className="font-mono text-[9px] uppercase text-muted-foreground">Publicidade</span>
      {sponsor.imageUrl ? (
        <img
          src={sponsor.imageUrl}
          alt={sponsor.altText}
          loading="lazy"
          className="mt-3 w-full object-cover"
        />
      ) : (
        <span className="mt-3 grid aspect-square place-items-center border border-border bg-background text-center">
          <span>
            <strong className="font-display text-2xl">{sponsor.name}</strong>
            <small className="mt-2 block text-muted-foreground">{sponsor.altText}</small>
          </span>
        </span>
      )}
    </a>
  );
}

export function NewsPage({
  items,
  page,
  totalPages,
  sponsors = [],
  title,
}: {
  items: NewsItem[];
  page: number;
  totalPages: number;
  sponsors?: SponsorItem[];
  title?: string;
}) {
  const lead = items[0];
  const secondary = items.slice(1, 3);
  const feed = items.slice(3);
  const sidebarAds = sponsors.filter((item) => item.placement !== "banner");
  const bannerAds = sponsors.filter((item) => item.placement === "banner");

  if (!lead) {
    return (
      <SiteShell>
        <main className="mx-auto min-h-[50vh] max-w-7xl px-4 py-16 md:px-8">
          <h1 className="font-display text-4xl font-bold">Página sem novas matérias</h1>
          <p className="mt-3 text-muted-foreground">
            O acervo histórico continua disponível nas páginas anteriores.
          </p>
        </main>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <main className="editorial-reveal mx-auto max-w-7xl px-4 py-8 md:px-8">
        {title && (
          <h1 className="mb-8 border-l-4 border-destructive pl-4 font-display text-3xl font-bold uppercase">
            {title}
          </h1>
        )}
        {bannerAds[0] && (
          <div className="mb-8">
            <SponsorSlot sponsor={bannerAds[0]} />
          </div>
        )}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="space-y-8 lg:col-span-8">
            <Link to="/$slug" params={{ slug: lead.slug }} className="group block">
              <div className="mb-6 aspect-video overflow-hidden bg-muted">
                <StoryImage story={lead} eager />
              </div>
              <span className="font-mono text-xs font-semibold uppercase text-destructive">
                Em destaque
              </span>
              <h2 className="mt-2 text-balance font-display text-4xl font-bold leading-[1.02] group-hover:underline md:text-5xl lg:text-6xl">
                {lead.title}
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {lead.excerpt}
              </p>
              <p className="mt-5 font-mono text-[10px] uppercase text-muted-foreground">
                {new Date(lead.date).toLocaleDateString("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" })}
              </p>
            </Link>
            <div className="grid gap-8 border-t border-border pt-8 md:grid-cols-2">
              {secondary.map((story) => (
                <Link key={story.id} to="/$slug" params={{ slug: story.slug }} className="group">
                  <div className="aspect-[3/2] overflow-hidden">
                    <StoryImage story={story} />
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-bold leading-tight group-hover:text-destructive">
                    {story.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{story.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
          <aside className="space-y-8 lg:col-span-4">
            {sidebarAds.map((sponsor) => (
              <SponsorSlot key={sponsor.id} sponsor={sponsor} />
            ))}
            <div>
              <h2 className="border-l-4 border-destructive pl-3 font-mono text-xs font-semibold uppercase">
                Mais recentes
              </h2>
              <div className="mt-4 divide-y divide-border">
                {feed.slice(0, 7).map((story) => (
                  <Link key={story.id} to="/$slug" params={{ slug: story.slug }} className="block py-4">
                    <time className="font-mono text-[10px] text-destructive">
                      {new Date(story.date).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Sao_Paulo",
                      })}
                    </time>
                    <h3 className="mt-1 text-sm font-semibold leading-snug hover:text-destructive">
                      {story.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
        {feed.length > 7 && (
          <section className="mt-14 border-t border-border pt-8">
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {feed.slice(7).map((story) => (
                <Link key={story.id} to="/$slug" params={{ slug: story.slug }} className="group">
                  <div className="aspect-[3/2] overflow-hidden">
                    <StoryImage story={story} />
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold leading-tight group-hover:text-destructive">
                    {story.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
        <nav
          className="mt-16 flex items-center justify-center gap-3 border-t border-border pt-8"
          aria-label="Paginação"
        >
          <Button asChild variant="outline" size="icon" disabled={page <= 1}>
            <Link
              to="/page/$page"
              params={{ page: String(Math.max(1, page - 1)) }}
              aria-label="Página anterior"
            >
              <ChevronLeft />
            </Link>
          </Button>
          <span className="font-mono text-xs">
            Página {page} de {totalPages}
          </span>
          <Button asChild variant="outline" size="icon" disabled={page >= totalPages}>
            <Link
              to="/page/$page"
              params={{ page: String(Math.min(totalPages, page + 1)) }}
              aria-label="Próxima página"
            >
              <ChevronRight />
            </Link>
          </Button>
        </nav>
      </main>
    </SiteShell>
  );
}
