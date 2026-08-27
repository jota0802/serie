/**
 * Série — camada de tokens.
 *
 * Fonte de verdade do estilo, espelhando `serie-tokens.css` e as 83 Variables do
 * arquivo do Figma. Quem mudar cor mexe AQUI, não na tela.
 *
 * A tese visual em uma linha:
 *   A TELA É MONOCROMÁTICA. COR SÓ APARECE QUANDO VOCÊ SUPEROU ALGO.
 */

/** Rampa de 14 neutros. Resolve borda, divisor, desabilitado e superfície elevada. */
export const neutral = {
  n1000: '#0E0E0E', // base da tela
  n950: '#111111',
  n900: '#171717',
  n850: '#1D1D1D', // superfície de card
  n800: '#232323', // card elevado
  n700: '#2B2B2B',
  n600: '#3A3A3A', // borda forte
  n500: '#4F4F4F',
  n400: '#6E6E6E', // 3,79:1 — só desabilitado e texto grande
  n300: '#909090', // 6,05:1 — texto secundário
  n200: '#B4B4B4', // 9,32:1
  n150: '#D4D4D4',
  n100: '#F8F8F8', // texto primário
  n0: '#FFFFFF',
} as const;

/**
 * DUAS cores no app inteiro. Cor rara é cor que significa: o ouro aparece
 * de 0 a 3 vezes por treino, e quando aparece você olha.
 * Contraste sobre n1000: ouro 15,4:1 · azul 5,3:1 · n300 6,1:1 — todos passam AA.
 */
export const accent = {
  signal: '#FFE657', // RECORDE / alvo superado. Só isso.
  signalDim: '#3E391D',
  rest: '#3B80FF', // tempo correndo. Só o cronômetro.
  restDim: '#17253E',
  danger: '#B0261A', // SÓ ação destrutiva: apagar treino, sair.
} as const;

/**
 * Papéis semânticos.
 * ⚠️ VERMELHO NUNCA MARCA SÉRIE FALHADA. Falhar a faixa é informação, não vergonha:
 * falha é NEUTRA e o app responde com deload (CAR-3), não com cor de alarme.
 */
export const role = {
  done: neutral.n100, // série feita = tinta cheia
  target: neutral.n100, // o alvo de hoje
  pending: neutral.n500, // série que ainda vem
  record: accent.signal,
  timer: accent.rest,
  failed: neutral.n400, // CAR-3.1 — falha é neutra
} as const;

export const surface = {
  base: neutral.n1000,
  raised: neutral.n850,
  overlay: neutral.n800,
  line: 'rgba(255,255,255,0.07)',
  line2: 'rgba(255,255,255,0.13)',
  rowActive: 'rgba(255,255,255,0.035)',
  scrim: 'rgba(0,0,0,0.60)',
  recordLine: 'rgba(255,230,87,0.34)',
} as const;

/**
 * DOIS materiais de vidro, não um.
 * fino    = a nav, que só flutua sobre conteúdo que rola
 * espesso = a folha modal, que é superfície que se lê e se toca
 */
export const glass = {
  thin: 'rgba(255,255,255,0.05)',
  thick: 'rgba(26,26,26,0.90)',
  line: 'rgba(255,255,255,0.10)',
  blur: 22,
} as const;

/** Duas famílias. Nomes iguais aos do expo-font carregado em src/app/_layout.tsx. */
export const font = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  text: 'Manrope_400Regular',
  textMedium: 'Manrope_500Medium',
  textBold: 'Manrope_700Bold',
} as const;

/**
 * A escala SOBE em relação ao app irmão: a Série é lida a um braço de distância,
 * com o celular apoiado no banco, entre séries. Piso de corpo 15 (não 14),
 * número dominante 64 (não 44).
 */
export const size = {
  colossal: 120, // SÓ a tela de execução. O maior número do app
  mega: 64, // o cronômetro e a tonelagem
  hero: 44, // o número dominante da tela
  h1: 30,
  h2: 20,
  body: 16,
  desc: 15, // piso de corpo
  micro: 12, // SÓ rótulo em caixa alta, nunca frase
} as const;

export const lineHeight = { tight: 1.08, body: 1.5 } as const;
export const letterSpacing = { display: -0.025, eyebrow: 0.1 } as const;

/** Escala de 4. */
export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32, s7: 48 } as const;

/** Mais fechado que o app irmão: lê como equipamento, não como brinquedo. */
export const radius = { sm: 8, md: 12, lg: 18, xl: 24, full: 999 } as const;

/**
 * Alvo de toque. Não é gosto: mão suada, e o gesto mais repetido do app
 * ("concluir série") acontece cansado. 44 é o piso absoluto (CAR-11.3).
 */
export const hit = { min: 44, row: 56, cta: 60 } as const;

export const motion = { tap: 90, ui: 180, sheet: 280 } as const;

/**
 * Relevo RACIONADO: no máximo UM elemento em relevo por tela, e ele é sempre a
 * ação primária. Na academia você procura uma coisa só, e o relevo diz qual é.
 */
export const elevation = {
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const theme = {
  neutral, accent, role, surface, glass,
  font, size, lineHeight, letterSpacing,
  space, radius, hit, motion, elevation,
} as const;

export type Theme = typeof theme;
