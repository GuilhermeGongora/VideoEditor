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

export type Sound = {
  /** Caminho dentro de public/, ex.: "soundeffects/impacts/punch 01.wav". */
  src: string;
  /** Segundo (a partir do início DESTE clipe, depois do "start") em que o som COMEÇA. */
  at: number;
  /** 0 a 1. Padrão 0.8. */
  volume?: number;
  /** Cortar o som depois de N segundos (com fade curto). */
  maxSeconds?: number;
  /**
   * Abaixa o áudio original do clipe enquanto este som toca (0 a 1).
   * 0.4 = clipe cai para 60%. Use em memes/vozes/risadas para o som "aparecer". Padrão 0.
   */
  duck?: number;
  /** Por quanto tempo abaixar (s). Padrão: maxSeconds ou 0.8s. */
  duckSeconds?: number;
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
  /** Efeitos sonoros extras dentro do clipe (queda, impacto, risada…), sem texto na tela. */
  sounds?: Sound[];
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
  list?: { top?: number; spacing?: number; x?: number; fontSize?: number; labelMaxWidth?: number };
  /** Fade-out de todo o áudio no fim do vídeo (s). Padrão 0.4. */
  endFadeSeconds?: number;
  sfx?: {
    reveal?: string | null;
    transition?: string | null;
    final?: string | null;
    volume?: number;
  };
  music?: { src: string; volume?: number } | null;
  /** Fade de entrada a partir do preto, em segundos. Padrão 0.4. */
  fadeInSeconds?: number;
  /** Itens NA ORDEM EM QUE APARECEM (normalmente do último lugar até o #1). */
  items: Item[];
};
