import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import logoAsset from "@/assets/bs-noticias-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { CHAMADA_PLANTAO, MENU_SECOES } from "@/content/site-content";

const sections = MENU_SECOES;

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-background text-foreground">
    <div className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <span className="flex min-w-0 items-center gap-2"><span className="size-1.5 shrink-0 rounded-full bg-destructive" /> Informação em movimento</span>
        <Link to="/auth" className="text-muted-foreground hover:text-foreground">Admin</Link>
      </div>
    </div>
    <header className="border-b-4 border-primary px-4 py-5 md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <Link to="/" className="min-w-0"><img src={logoAsset.url} alt="BS Notícias — Informação que move o Brasil" className="h-auto w-full max-w-[460px]" /></Link>
        <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Fechar menu" : "Abrir menu"}>{open ? <X /> : <Menu />}</Button>
        <nav className="hidden flex-wrap justify-end gap-x-5 gap-y-2 text-xs font-semibold uppercase lg:flex">
          {sections.map((section) => <Link key={section} to="/category/$slug" params={{ slug: section.toLowerCase() }} className="hover:text-destructive">{section}</Link>)}
          <Search className="size-4" aria-label="Pesquisa" />
        </nav>
      </div>
      {open && <nav className="mx-auto mt-5 grid max-w-7xl grid-cols-2 gap-1 border-t border-border pt-4 sm:grid-cols-3 lg:hidden">{sections.map((section) => <Link key={section} to="/category/$slug" params={{ slug: section.toLowerCase() }} onClick={() => setOpen(false)} className="py-2 text-sm font-semibold uppercase">{section}</Link>)}</nav>}
    </header>
    <div className="bg-primary py-3 text-primary-foreground"><div className="mx-auto flex max-w-7xl min-w-0 items-center gap-3 px-4 md:px-8"><span className="shrink-0 bg-destructive px-2 py-1 font-mono text-[10px] font-semibold uppercase">Plantão</span><p className="truncate text-sm italic">{CHAMADA_PLANTAO}</p></div></div>
    {children}
    <footer className="mt-20 bg-primary px-4 py-12 text-primary-foreground md:px-8"><div className="mx-auto max-w-7xl"><img src={logoAsset.url} alt="BS Notícias" className="w-full max-w-[280px] bg-background p-2" /><p className="mt-5 max-w-md text-sm text-primary-foreground/70">Jornalismo independente e informação que move o Brasil.</p><div className="mt-12 flex flex-wrap justify-between gap-6 border-t border-primary-foreground/15 pt-6 font-mono text-[10px] uppercase text-primary-foreground/60"><span>© 2026 BS Notícias</span><Link to="/auth">Acesso reservado</Link></div></div></footer>
  </div>;
}