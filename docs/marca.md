# Marca e identidade visual — Série.

> Checkpoint 4 · desenvolvimento de marca
> Fonte de verdade do estilo: [`src/theme/tokens.ts`](../src/theme/tokens.ts) e as 83 Variables do Figma

---

## 1. O nome

**Série.** — com ponto final.

*Série* é a unidade do produto: uma entrada de `reps × carga`. O app inteiro é feito de séries, e
por isso o nome não é uma metáfora de academia (Iron, Beast, Titan) — é o substantivo que o usuário
já usa quando conta o que fez. O ponto final é afirmação: a série acabou, está registrada, próxima.

Alternativas consideradas e descartadas: *Carga.* (só metade do dado), *Ficha.* (remete a papel de
academia, que é o que estamos substituindo), *Base.* (genérico demais).

## 2. A marca gráfica

<img src="../assets/brand/serie-mark.svg" width="120" alt="Marca da Série">

Três barras horizontais de largura crescente. **A maior é ouro.**

Ela conta a tese do produto sem uma palavra:

- **três barras** = as séries de um exercício
- **crescentes** = a progressão, que é a única coisa que o app promete
- **a maior em ouro** = no app inteiro, ouro significa uma coisa só: **recorde**

Geometria (idêntica ao frame `mark` do Figma, e reproduzida em código em
[`src/components/marca.tsx`](../src/components/marca.tsx)):

| Barra | x | y | largura | altura | raio | cor |
|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 34 | 13 | 4 | `#F8F8F8` |
| 2 | 0 | 19 | 56 | 13 | 4 | `#F8F8F8` |
| 3 | 0 | 38 | 78 | 13 | 4 | **`#FFE657`** |

Caixa da marca: **78 × 51**. Alinhamento à esquerda — as barras crescem para a direita a partir de
uma margem comum, que é o que dá a leitura de progressão.

**Usos gerados a partir dela:** ícone do app (1024 × 1024 sobre `#0E0E0E`), ícone adaptativo do
Android (primeiro plano transparente dentro da zona segura de 66%), versão monocromática, splash e
favicon. Todos em [`assets/images/`](../assets/images/).

## 3. Paleta

### Os neutros — a rampa de 14

A tela é monocromática. Praticamente tudo que se vê é um dos catorze neutros.

| Token | Hex | Papel |
|---|---|---|
| `n1000` | `#0E0E0E` | base da tela |
| `n850` | `#1D1D1D` | superfície de card |
| `n800` | `#232323` | card elevado |
| `n600` | `#3A3A3A` | borda forte |
| `n500` | `#4F4F4F` | série que ainda vem |
| `n400` | `#6E6E6E` | desabilitado · **e a série falhada** |
| `n300` | `#909090` | texto secundário — 6,05:1 |
| `n100` | `#F8F8F8` | texto primário · série feita · o alvo de hoje |

### As duas cores

**Duas.** Não cinco. Cor rara é cor que significa: o ouro aparece de 0 a 3 vezes por treino, e
quando aparece você olha.

| Token | Hex | Significa | Contraste sobre `n1000` |
|---|---|---|---|
| `signal` | **`#FFE657`** | **recorde / alvo superado.** Só isso | 15,4:1 |
| `rest` | **`#3B80FF`** | **tempo correndo.** Só o cronômetro | 5,3:1 |
| `danger` | `#B0261A` | só ação destrutiva: apagar treino, sair | — |

Todos passam **WCAG AA** para texto.

> ⚠️ **Vermelho nunca marca série falhada.** Falhar a faixa de repetições é informação, não
> vergonha: a falha é **neutra** (`n400`) e o app responde com deload (`CAR-3`), não com cor de
> alarme. Um app que te pune por um dia ruim é desinstalado num dia ruim.

### O fundo

Dois gradientes radiais empilhados sobre o `n1000`: **grafite frio** no canto superior esquerdo
(`#1B2428`) e **brasa quente** no direito (`#241D14`). Ferro e esforço.

Na tela de execução a brasa intensifica — **a tela esquenta enquanto você levanta**, sem inventar
nenhuma cor nova.

## 4. Tipografia

Duas famílias, as duas do Google Fonts:

| Papel | Família | Onde |
|---|---|---|
| Display | **Space Grotesk** | números dominantes, letras de treino, títulos |
| Texto | **Manrope** | corpo, rótulos, descrições |

### A escala

Ela **sobe** em relação ao normal, e o motivo é físico: o app é lido a um braço de distância, com o
celular apoiado no banco, entre séries, com a mão suada.

| Token | px | Uso |
|---|---|---|
| `colossal` | **120** | **só** a tela de execução. O maior número do app |
| `mega` | 64 | o cronômetro e a tonelagem |
| `hero` | 44 | o número dominante da tela |
| `h1` / `h2` | 30 / 20 | títulos |
| `body` | 16 | corpo |
| `desc` | **15** | piso de corpo — nunca 14 |
| `micro` | 12 | **só** rótulo em caixa alta, nunca frase |

**Regra:** um número dominante por tela. Se dois números competem, um dos dois não devia estar ali.

## 5. As três leis do visual

> **Esqueuomorfismo no que se toca. Vidro no que flutua. Minimalismo no que se lê.**

E os três racionamentos que fazem a Série ser a Série:

| | Regra | Motivo |
|---|---|---|
| **Relevo** | **um elemento por tela**, sempre a ação primária | na academia você procura uma coisa só, e o relevo diz qual é |
| **Vidro** | **dois lugares no app inteiro**, em dois materiais: fino na nav (que só flutua), espesso na folha modal (que se lê) | blur derruba frame rate, e a lista de séries rola |
| **Raio** | 8 / 12 / 18 / 24 | mais fechado lê como equipamento, não como brinquedo |

## 6. Alvo de toque

| Token | px | Onde |
|---|---|---|
| `hit.min` | **44** | piso absoluto de qualquer coisa clicável (`CAR-11.3`) |
| `hit.row` | **56** | linha de série |
| `hit.cta` | **60** | botão primário |

Não é gosto. Mão suada, e o gesto mais repetido do app ("concluir série") acontece cansado. Alvo
pequeno aqui custa erro de registro.

## 7. Tema claro

**Fora do MVP**, e a decisão está medida: academia é ambiente escuro com a tela no brilho máximo.
Escuro é o caso real, não a preferência. Quando entrar, os acentos precisam ser recalibrados contra
fundo claro — os valores de partida são `#A87400` (ouro) e `#1953C4` (azul).
