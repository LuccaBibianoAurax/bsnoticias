/**
 * ============================================================
 *  PASTA DE EDIÇÃO MANUAL DO SITE — BS NOTÍCIAS
 * ============================================================
 *
 * Tudo o que está neste arquivo pode ser alterado à mão, caso o
 * painel administrativo apresente algum erro.
 *
 * - MENU_SECOES: os nomes que aparecem no menu do topo.
 * - CHAMADA_PLANTAO: a frase que passa na tarja abaixo do logo.
 * - PATROCINADORES_FIXOS: anúncios que aparecem quando ainda não
 *   existe nenhum patrocinador cadastrado pelo painel.
 *   "imagem" = endereço da imagem do anúncio
 *   "link"   = para onde o anúncio redireciona ao ser clicado
 *
 * Depois de salvar as alterações aqui, o site atualiza sozinho.
 */

export const MENU_SECOES = [
  "Agro",
  "Autos",
  "Brasil",
  "Destaques",
  "Entretenimento",
  "Esportes",
  "Futebol",
  "Política",
  "Saúde",
  "Turismo",
];

export const CHAMADA_PLANTAO =
  "As principais notícias do Brasil e do mundo, atualizadas ao longo do dia.";

export type PatrocinadorFixo = {
  nome: string;
  imagem: string | null;
  link: string;
  descricao: string;
  posicao: "sidebar" | "banner";
};

export const PATROCINADORES_FIXOS: PatrocinadorFixo[] = [
  {
    nome: "Anuncie no BS Notícias",
    imagem: null,
    link: "https://bsnoticias.com.br/contato",
    descricao: "Espaço reservado a patrocinadores",
    posicao: "sidebar",
  },
];
