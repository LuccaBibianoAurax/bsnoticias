import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const WP_API = "https://bsnoticias.com.br/wp-json/wp/v2";

export type NewsItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
  date: string;
  link: string;
  author: string;
};

function text(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&#8211;/g, "–").replace(/&#8217;/g, "’").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function cleanHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "");
}

function mapPost(post: any): NewsItem {
  return {
    id: Number(post.id),
    slug: String(post.slug),
    title: text(post.title?.rendered ?? "Sem título"),
    excerpt: text(post.excerpt?.rendered ?? ""),
    content: cleanHtml(post.content?.rendered ?? ""),
    imageUrl: post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
    date: String(post.date),
    link: String(post.link),
    author: text(post._embedded?.author?.[0]?.name ?? "Redação BS Notícias"),
  };
}

export const getNewsPage = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ page: z.number().int().min(1).max(483), category: z.number().int().positive().optional() }).parse(data))
  .handler(async ({ data }) => {
    const params = new URLSearchParams({ per_page: "20", page: String(data.page), _embed: "1" });
    if (data.category) params.set("categories", String(data.category));
    const response = await fetch(`${WP_API}/posts?${params}`, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      if (response.status === 400) return { items: [] as NewsItem[], totalPages: 483, total: 5310 };
      throw new Error("Não foi possível carregar as notícias agora.");
    }
    const posts = (await response.json()) as any[];
    return {
      items: posts.map(mapPost),
      totalPages: Math.min(483, Number(response.headers.get("x-wp-totalpages") ?? 483)),
      total: Number(response.headers.get("x-wp-total") ?? 5310),
    };
  });

export const getNewsArticle = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(1).max(240) }).parse(data))
  .handler(async ({ data }) => {
    const response = await fetch(`${WP_API}/posts?slug=${encodeURIComponent(data.slug)}&_embed=1`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Não foi possível carregar esta notícia.");
    const posts = (await response.json()) as any[];
    return posts[0] ? mapPost(posts[0]) : null;
  });

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const response = await fetch(`${WP_API}/categories?per_page=100&orderby=count&order=desc`, { headers: { Accept: "application/json" } });
  if (!response.ok) return [] as { id: number; name: string; slug: string }[];
  const rows = (await response.json()) as any[];
  return rows.map((row) => ({ id: Number(row.id), name: text(row.name), slug: String(row.slug) }));
});

export const getCategoryPage = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(1).max(120), page: z.number().int().min(1).max(483) }).parse(data))
  .handler(async ({ data }) => {
    const categoryResponse = await fetch(`${WP_API}/categories?slug=${encodeURIComponent(data.slug)}`, { headers: { Accept: "application/json" } });
    if (!categoryResponse.ok) throw new Error("Não foi possível carregar esta editoria.");
    const categories = (await categoryResponse.json()) as any[];
    const category = categories[0];
    if (!category) return { category: null, items: [] as NewsItem[], totalPages: 1 };
    const response = await fetch(`${WP_API}/posts?per_page=20&page=${data.page}&categories=${category.id}&_embed=1`, { headers: { Accept: "application/json" } });
    if (!response.ok) return { category: { id: Number(category.id), name: text(category.name), slug: String(category.slug) }, items: [] as NewsItem[], totalPages: 1 };
    const posts = (await response.json()) as any[];
    return { category: { id: Number(category.id), name: text(category.name), slug: String(category.slug) }, items: posts.map(mapPost), totalPages: Number(response.headers.get("x-wp-totalpages") ?? 1) };
  });