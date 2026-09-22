import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { PATROCINADORES_FIXOS } from "@/content/site-content";

const WP_API = "https://bsnoticias.com.br/wp-json/wp/v2";
const PER_PAGE = 11;
export const MAX_PAGES = 483;

export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
  date: string;
  link: string;
  author: string;
  category: string;
  local: boolean;
};

export type SponsorItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  targetUrl: string;
  altText: string;
  placement: string;
};

function text(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "");
}

function mapPost(post: Record<string, any>): NewsItem {
  const embedded = post["_embedded"] ?? {};
  return {
    id: `wp-${post["id"]}`,
    slug: String(post["slug"]),
    title: text(post["title"]?.rendered ?? "Sem título"),
    excerpt: text(post["excerpt"]?.rendered ?? ""),
    content: cleanHtml(post["content"]?.rendered ?? ""),
    imageUrl: embedded["wp:featuredmedia"]?.[0]?.source_url ?? null,
    date: String(post["date"]),
    link: String(post["link"]),
    author: text(embedded["author"]?.[0]?.name ?? "Redação BS Notícias"),
    category: text(embedded["wp:term"]?.[0]?.[0]?.name ?? "Notícias"),
    local: false,
  };
}

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

function mapLocal(row: Record<string, any>): NewsItem {
  const html = String(row["content_html"] ?? "");
  return {
    id: `db-${row["id"]}`,
    slug: String(row["slug"]),
    title: String(row["title"]),
    excerpt: String(row["excerpt"] ?? text(html).slice(0, 220)),
    content: cleanHtml(html),
    imageUrl: (row["image_url"] as string | null) ?? null,
    date: String(row["published_at"] ?? row["created_at"]),
    link: `/${row["slug"]}`,
    author: String(row["author_name"] ?? "Redação BS Notícias"),
    category: String(row["category"] ?? "Notícias"),
    local: true,
  };
}

async function localPublished(category?: string) {
  try {
    let query = publicClient()
      .from("articles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(60);
    if (category) query = query.ilike("category", category);
    const { data } = await query;
    return (data ?? []).map((row) => mapLocal(row as Record<string, any>));
  } catch {
    return [] as NewsItem[];
  }
}

async function wpPosts(page: number, extra?: Record<string, string>) {
  const params = new URLSearchParams({
    per_page: String(PER_PAGE),
    page: String(page),
    _embed: "1",
    ...extra,
  });
  const response = await fetch(`${WP_API}/posts?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return { items: [] as NewsItem[], totalPages: MAX_PAGES };
  const posts = (await response.json()) as Record<string, any>[];
  return {
    items: posts.map(mapPost),
    totalPages: Math.min(
      MAX_PAGES,
      Math.max(1, Number(response.headers.get("x-wp-totalpages") ?? MAX_PAGES)),
    ),
  };
}

export const getNewsPage = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({ page: z.number().int().min(1).max(MAX_PAGES) }).parse(data),
  )
  .handler(async ({ data }) => {
    const [remote, local] = await Promise.all([
      wpPosts(data.page),
      data.page === 1 ? localPublished() : Promise.resolve([] as NewsItem[]),
    ]);
    return {
      items: [...local, ...remote.items],
      totalPages: Math.max(remote.totalPages, MAX_PAGES),
    };
  });

export const getNewsArticle = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(1).max(240) }).parse(data))
  .handler(async ({ data }) => {
    try {
      const { data: rows } = await publicClient()
        .from("articles")
        .select("*")
        .eq("slug", data.slug)
        .eq("status", "published")
        .limit(1);
      if (rows && rows[0]) return mapLocal(rows[0] as Record<string, any>);
    } catch {
      /* segue para o acervo do site */
    }
    const response = await fetch(
      `${WP_API}/posts?slug=${encodeURIComponent(data.slug)}&_embed=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) return null;
    const posts = (await response.json()) as Record<string, any>[];
    return posts[0] ? mapPost(posts[0]) : null;
  });

export const getCategoryPage = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({ slug: z.string().min(1).max(120), page: z.number().int().min(1).max(MAX_PAGES) }).parse(data),
  )
  .handler(async ({ data }) => {
    const categoryResponse = await fetch(
      `${WP_API}/categories?slug=${encodeURIComponent(data.slug)}`,
      { headers: { Accept: "application/json" } },
    );
    const categories = categoryResponse.ok
      ? ((await categoryResponse.json()) as Record<string, any>[])
      : [];
    const category = categories[0];
    const local = data.page === 1 ? await localPublished(data.slug) : [];
    if (!category) {
      return {
        category: { name: data.slug, slug: data.slug },
        items: local,
        totalPages: 1,
      };
    }
    const remote = await wpPosts(data.page, { categories: String(category["id"]) });
    return {
      category: { name: text(String(category["name"])), slug: String(category["slug"]) },
      items: [...local, ...remote.items],
      totalPages: remote.totalPages,
    };
  });

export const getSponsors = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicClient()
      .from("sponsors")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    const rows = (data ?? []) as Record<string, any>[];
    if (rows.length) {
      return rows.map<SponsorItem>((row) => ({
        id: String(row["id"]),
        name: String(row["name"]),
        imageUrl: (row["image_url"] as string | null) ?? null,
        targetUrl: String(row["target_url"]),
        altText: String(row["alt_text"] ?? "Publicidade"),
        placement: String(row["placement"] ?? "sidebar"),
      }));
    }
  } catch {
    /* usa os anúncios fixos do arquivo src/content/site-content.ts */
  }
  return PATROCINADORES_FIXOS.map<SponsorItem>((item, index) => ({
    id: `fixo-${index}`,
    name: item.nome,
    imageUrl: item.imagem,
    targetUrl: item.link,
    altText: item.descricao,
    placement: item.posicao,
  }));
});
