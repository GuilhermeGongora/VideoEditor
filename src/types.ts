export type CaptionStyle = "box" | "whitebox" | "pop" | "plain";

export type Caption = {
  /** Texto. Aceita emoji. */
  text: string;
  /** Segundos, contados a partir do início DESTE clipe. */
  from: number;
  /** Segundos (opcional). Sem "to", fica até o fim do clipe. */
  to?: number;
  /** box = caixa preta estilo máquina de escrever ("Wait for it…"), whitebox = caixa branca, pop = texto grande que explode ("-$5,300"), plain = texto com contorno. */
  style?: CaptionStyle;
  /** Centro do texto em px (vídeo 1080x1920). Padrão: x=540, y=1100. */
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  /** Efeito sonoro tocado quando a legenda aparece (ex.: "sfx/ding.wav"). */
  sfx?: string;
};

export type Item = {
  /** Posição no ranking (1 = melhor). */
  rank: number;
  /** Texto que aparece na lista, ex.: "nice grandma" ou "bro 💀". */
  label: string;
  /** Caminho dentro de public/, ex.: "clips/6-nice-grandma.mp4". */
  clip: string;
  /** Cortar o início/fim do clipe (segundos). */
  start?: number;
  end?: number;
  /** Volume do áudio original do clipe (0 a 1). */
  volume?: number;
  /** cover = preenche a tela (corta bordas); contain = mostra inteiro com fundo desfocado. */
  fit?: "cover" | "contain";
  captions?: Caption[];
  /** Som ao revelar este item. null = sem som. Se ausente, usa o padrão. */
  sfx?: string | null;
  /** Preenchido automaticamente pelo "npm run prep". */
  duration?: number;
};

export type RankingData = {
  fps?: number;
  width?: number;
  height?: number;
  /** Cada linha aceita cores no formato [texto](cor), ex.: "Ranking [Funniest](red)". */
  titleLines: string[];
  subtitle?: string;
  handle?: string;
  /** Nomes de cores usados no título/legendas. */
  colors?: Record<string, string>;
  /** Altura da barra preta do topo, em px. */
  headerHeight?: number;
  list?: { top?: number; spacing?: number; x?: number; fontSize?: number };
  sfx?: {
    reveal?: string | null;
    transition?: string | null;
    final?: string | null;
    volume?: number;
  };
  music?: { src: string; volume?: number } | null;
  /** Fade de entrada a partir do preto, em segundos. */
  fadeInSeconds?: number;
  /** Itens NA ORDEM EM QUE APARECEM (normalmente do último lugar até o #1). */
  items: Item[];
};
