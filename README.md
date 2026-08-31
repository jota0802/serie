<div align="center">

<img src="assets/brand/serie-banner.png" width="760" alt="Série. — Ele não te dá treino. Ele te diz o que bater hoje.">

**Caderno de treino que sabe o que você fez da última vez e já chega com o campo preenchido.**

![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-0E0E0E?style=flat-square&labelColor=0E0E0E&color=F8F8F8) ![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-0E0E0E?style=flat-square&labelColor=0E0E0E&color=F8F8F8) ![TypeScript 6.0](https://img.shields.io/badge/TypeScript-6.0-0E0E0E?style=flat-square&labelColor=0E0E0E&color=F8F8F8) ![Jest — 22 testes verdes](https://img.shields.io/badge/Jest-22%20testes%20verdes-0E0E0E?style=flat-square&labelColor=0E0E0E&color=FFE657)

[O problema](#o-problema) · [O app rodando](#o-app-rodando) · [As 21 telas](#as-21-telas) · [Integrantes](#integrantes-e-papéis) · [Como rodar](#como-rodar) · [Testes](#ambiente-de-teste) · [Stack](#stack) · [Entregas](#estado-das-entregas)

</div>

---

> **Checkpoints 4, 5 e 6 — Mobile Development & IoT**
> Engenharia de Software · 3º ano · FIAP · Prof. Hercules Ramos

## O problema

Quem treina sem personal anota no bloco de notas ou num papel amassado dentro do armário. Os apps
que existem hoje são de dois tipos, e nenhum resolve:

| Categoria | Exemplos | Por que falha |
|---|---|---|
| Catálogo de exercícios | biblioteca com GIF, "escolha seu treino" | te dá conteúdo e some na hora que importa: entre as séries |
| Planilha com skin | log de séries, tabelão | te faz digitar tudo do zero toda vez. Morre na 2ª semana |

O terceiro caminho é o único que interessa: **o app já chega com o campo preenchido**. Você confirma
com um toque ou corrige o número. É a diferença entre *registrar* e *ser guiado*.

📄 Escopo completo em [`docs/escopo.md`](docs/escopo.md) · 💰 Modelo de negócio em [`docs/pitch.md`](docs/pitch.md)

## O app rodando

O caminho crítico do produto, ponta a ponta, capturado do app de verdade rodando em
`npm run web` (Expo + React Native Web) num viewport de celular:

![As cinco telas do caminho crítico da Série](docs/evidencias/fluxo-critico.png)

| | Tela | O que ela prova |
|---|---|---|
| <img src="docs/evidencias/10-hoje.png" width="150"> | **10 · Hoje** | Nada aqui é número cravado. *"Supino reto sobe para 42,5 kg"* sai da regra `CAR-1` cruzando o plano (40 kg) com o histórico (12 reps nas quatro séries) |
| <img src="docs/evidencias/11-treino-ativo.png" width="150"> | **11 · Treino ativo** | A carga alvo é o número dominante. O aviso em ouro — *"subiu de 40 kg, você fechou a faixa"* — é a dupla progressão explicando a si mesma |
| <img src="docs/evidencias/12-execucao.png" width="150"> | **12 · Execução** | `CAR-11`: a série é cronometrada e a tela inteira é o alvo de toque. **Durante a série ninguém toca no celular** — por isso não há campo nenhum aqui |
| <img src="docs/evidencias/13-descanso.png" width="150"> | **13 · Descanso** | É aqui que o registro acontece: 90 s de mãos livres. E os campos já chegam preenchidos com o alvo (`CAR-2`) — confirmar é um toque |
| <img src="docs/evidencias/14-resumo.png" width="150"> | **14 · Resumo** | `CAR-7`: fecha o ciclo com um número que subiu, comparado com a **mesma letra** da vez anterior. Ouro só aparece quando há recorde |

<details>
<summary>Mais um print: a lista de séries durante o treino</summary>

<img src="docs/evidencias/11b-series-fechadas.png" width="260">

Série feita vira tinta cheia, a ativa fica em relevo, a que ainda vem fica apagada. Os três estados
saem dos mesmos tokens de [`src/theme/tokens.ts`](src/theme/tokens.ts) — nenhuma cor foi inventada
na tela.

</details>

> Evidências de execução e como reproduzi-las: [`docs/evidencias/`](docs/evidencias/).

## As 21 telas

A identidade visual do CP4 vive num arquivo do Figma com **21 telas conceituais, 83 Variables e 8
componentes** — protótipo navegável com 64 ligações e 2 pontos de partida. As imagens abaixo foram
exportadas do arquivo **como ele está agora**, tela por tela, e ficam em
[`docs/telas/`](docs/telas/).

**🔗 Figma:** https://www.figma.com/design/j9TqnMGzyjEpdjw18cLPBp

### Entrada e conta — telas 01 a 09

[![Telas 01 a 09](docs/telas/grupo-1-entrada.png)](docs/telas/grupo-1-entrada.png)

A montagem do plano são **três perguntas**, não um formulário: objetivo, frequência e experiência.
Delas sai a divisão A/B/C já preenchida — o app nunca mostra uma tela vazia pedindo que você
invente um treino.

### O treino — telas 10 a 14

[![Telas 10 a 14](docs/telas/grupo-2-treino.png)](docs/telas/grupo-2-treino.png)

O **caminho crítico**, e as cinco telas que já estão em código — são exatamente as capturas da seção
anterior. Comparar as duas fileiras é o teste de fidelidade que o CP6 cobra ("fidelidade ao conceito
e identidade visual definidos no CP4").

### Apoio — telas 15 a 21

[![Telas 15 a 21](docs/telas/grupo-3-apoio.png)](docs/telas/grupo-3-apoio.png)

A **15 · Exercício** funde histórico e prescrição de propósito: são duas faces do mesmo substantivo,
e a progressão é o que justifica a prescrição. A **16 · Trocar exercício** é a `CAR-9` — aparelho
ocupado é o problema nº 1 da academia, e o histórico segue o *padrão de movimento*, não o aparelho.

<details>
<summary>As 21 telas, uma a uma (arquivos individuais)</summary>

| | | |
|---|---|---|
| [01 · Abertura](docs/telas/01-abertura.png) | [02 · Entrar](docs/telas/02-entrar.png) | [03 · Criar conta](docs/telas/03-criar-conta.png) |
| [04 · Recuperar senha](docs/telas/04-recuperar-senha.png) | [05 · Link enviado](docs/telas/05-link-enviado.png) | [06 · Montagem 1/3](docs/telas/06-montagem-1-de-3.png) |
| [07 · Montagem 2/3](docs/telas/07-montagem-2-de-3.png) | [08 · Montagem 3/3](docs/telas/08-montagem-3-de-3.png) | [09 · Seu plano](docs/telas/09-seu-plano.png) |
| [10 · Hoje](docs/telas/10-hoje.png) | [11 · Treino ativo](docs/telas/11-treino-ativo.png) | [12 · Execução](docs/telas/12-execucao.png) |
| [13 · Descanso](docs/telas/13-descanso.png) | [14 · Resumo da sessão](docs/telas/14-resumo-da-sessao.png) | [15 · Exercício](docs/telas/15-exercicio.png) |
| [16 · Trocar exercício](docs/telas/16-trocar-exercicio.png) | [17 · Meus treinos](docs/telas/17-meus-treinos.png) | [18 · Montar treino](docs/telas/18-montar-treino.png) |
| [19 · Escolher exercício](docs/telas/19-escolher-exercicio.png) | [20 · Progresso](docs/telas/20-progresso.png) | [21 · Perfil](docs/telas/21-perfil.png) |

</details>

## Integrantes e papéis

> O enunciado marca este item como **obrigatório**: *"deve estar presente na documentação o papel
> desempenhado por cada membro do grupo"*. Grupo de 4 a 6 alunos, o mesmo nos três checkpoints.

| Nome | RM | Papel | Responsável por |
|---|---|---|---|
| João Victor Franco | 556790 | **Product Owner · Design System** | regras `CAR-*`, tokens, arquivo do Figma, protótipo |
| Lucca Borges | 554608 | **Dev Front** | telas em React Native, navegação |
| Ruan Melo | 557599 | **Dev Mock / Dados** | camada de dados, persistência local, mocks do CP5 |
| Rodrigo Jimenez | 558148 | **Design** | identidade visual, ícone, splash, assets |
| Bruno Leão | 555563 | **QA · Documentação · Dev** | roteiro de testes, README, evidências de entrega, apoio em desenvolvimento |

## Como rodar

Pré-requisitos: **Node 20+** e o app **Expo Go** no celular (ou o emulador do Android Studio).

```bash
git clone https://github.com/jota0802/serie.git
cd serie
npm install
npm start
```

Depois de `npm start`, leia o QR Code com o Expo Go, ou pressione:

| Tecla | O que faz |
|---|---|
| `a` | abre no emulador do Android Studio |
| `i` | abre no simulador do iOS (só macOS) |
| `w` | abre no navegador |

## Ambiente de teste

As regras do app são funções puras, sem React e sem tela — dá para testá-las sem montar componente
nenhum. São **22 asserções** em [`src/domain/__tests__/regras.test.ts`](src/domain/__tests__/regras.test.ts):

```bash
npm test
```

```
PASS src/domain/__tests__/regras.test.ts
  CAR-1 · dupla progressão
    ✓ fecha o topo da faixa em todas as séries → a carga sobe um incremento e as reps voltam ao piso
    ✓ não fechou a faixa → mesma carga, e cada série mira uma repetição a mais
    ✓ nunca passa do topo da faixa
    ✓ série faltando não conta como faixa fechada — senão a carga subiria por um treino incompleto
    ✓ CAR-2 · sem histórico o campo ainda vem preenchido: carga do plano, piso da faixa
    ✓ a carga sempre cai num múltiplo de anilha — academia não tem meia anilha
  CAR-3 · deload
    ✓ duas sessões seguidas falhando o piso na mesma carga → sugere −10%
    ✓ uma sessão ruim só não dispara nada — um dia ruim não é tendência
    ✓ some depois de duas recusas — sugere, não impõe
  …
Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
```

O caso que mais importa é **"série faltando não conta como faixa fechada"**: sem ele a carga sobe
por causa de um treino incompleto, e o usuário chega na academia com um número que não conquistou.

## Estrutura de pastas

```
serie/
├── src/
│   ├── app/            # rotas — Expo Router (file-based routing)
│   │   ├── index.tsx       # 01 · Abertura
│   │   ├── entrar.tsx      # 02 · Entrar
│   │   ├── criar-conta.tsx     # 03 · Criar conta
│   │   ├── recuperar-senha.tsx # 04 · Recuperar senha
│   │   ├── link-enviado.tsx    # 05 · Link enviado
│   │   ├── hoje.tsx        # 10 · Hoje — a porta do caminho crítico
│   │   └── treino/         # 11 ativo · 12 execução · 13 descanso · 14 resumo
│   ├── components/     # os componentes do design system
│   ├── domain/         # as regras CAR-* como funções puras. O "cérebro" do app
│   │   └── __tests__/  # suíte Jest das regras — 22 testes
│   ├── data/           # catálogo de 45 exercícios, treinos A/B/C e histórico mockado
│   ├── estado/         # a sessão de treino em andamento (Context)
│   ├── theme/          # tokens (cor, tipografia, espaço, raio) — espelha o Figma
│   └── lib/            # utilitários (formatação em pt-BR)
├── docs/
│   ├── escopo.md            # problema, público-alvo, proposta de valor
│   ├── pitch.md             # modelo de negócio e diferencial competitivo
│   ├── marca.md             # nome, logo, paleta, tipografia
│   ├── regras.md            # as 11 regras CAR-* — a lógica do produto
│   ├── decisoes-tecnicas.md # stack e o porquê de cada escolha
│   └── evidencias/          # prints do app rodando
└── assets/             # marca, ícone, splash
```

**Por que `domain/` é uma pasta separada:** as regras (dupla progressão, 1RM estimado, volume
semanal) não sabem que existe tela. Isso as torna testáveis com Jest sem montar componente — são as
22 asserções de `npm test`, e é o que paga o item *"ambiente de teste configurado"* do CP5.
Detalhes em [`docs/decisoes-tecnicas.md`](docs/decisoes-tecnicas.md).

## A marca

<img src="assets/images/icon.png" width="96" align="left" alt="Ícone do app Série" hspace="16">

Três barras crescentes: as séries do exercício. A maior é ouro porque, no app inteiro, **ouro
significa uma coisa só — recorde**. A mesma geometria vira ícone do app, ícone adaptativo do
Android, splash e favicon — todos gerados do vetor em
[`assets/brand/serie-mark.svg`](assets/brand/serie-mark.svg).

<br clear="left">


| | Token | Hex | Papel |
|---|---|---|---|
| ⬛ | `n1000` | `#0E0E0E` | base da tela |
| ⬜ | `n100` | `#F8F8F8` | texto primário · série feita · o alvo de hoje |
| 🟨 | `signal` | `#FFE657` | **recorde / alvo superado.** Só isso — 15,4:1 |
| 🟦 | `rest` | `#3B80FF` | **tempo correndo.** Só o cronômetro — 5,3:1 |

**Duas** cores no app inteiro, não cinco: cor rara é cor que significa. Tipografia: **Space Grotesk**
nos números e títulos, **Manrope** no texto. Tudo em [`docs/marca.md`](docs/marca.md).

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| App | **React Native + Expo (SDK 57)** | exigência do enunciado; roda no celular de todo o grupo e gera APK via EAS Build |
| Navegação | **Expo Router** | rotas por arquivo, e o *deep link* sai de graça |
| Linguagem | **TypeScript** | o modelo de domínio (Série, Sessão, Treino) é o coração do app; tipo errado aqui vira bug de carga |
| Testes | **Jest** (preset `jest-expo`) | as regras são funções puras: dá para testá-las sem montar tela |
| Dados (CP5) | **JSON local + AsyncStorage** | o enunciado do CP5 pede dados mockados, sem backend |
| Dados (CP6) | **Supabase** *(a confirmar)* | só para backup e login. O app é **offline-first**: academia é subsolo |

## Documentação

| Documento | O que tem dentro |
|---|---|
| [`docs/escopo.md`](docs/escopo.md) | problema, público-alvo, proposta de valor, o que está **fora** do MVP |
| [`docs/pitch.md`](docs/pitch.md) | modelo de negócio (freemium) e diferencial competitivo |
| [`docs/marca.md`](docs/marca.md) | nome, marca gráfica, paleta de 14 neutros + 2 acentos, tipografia |
| [`docs/regras.md`](docs/regras.md) | as 11 regras `CAR-*` — a lógica que separa a Série de uma planilha |
| [`docs/decisoes-tecnicas.md`](docs/decisoes-tecnicas.md) | bibliotecas, arquitetura e o porquê de cada escolha |
| [`docs/telas/`](docs/telas/) | as 21 telas exportadas do Figma, uma a uma |
| [`docs/evidencias/`](docs/evidencias/) | prints do app rodando + o que ainda falta capturar |

**Figma — Design System:** https://www.figma.com/design/j9TqnMGzyjEpdjw18cLPBp
21 telas conceituais · 83 Variables · 8 componentes · protótipo navegável com 64 ligações e 2 pontos
de partida. A pasta [`docs/telas/`](docs/telas/) é o espelho desse arquivo em PNG, para quem não tem
acesso ao Figma.

## Estado das entregas

| | Foco | Status |
|---|---|---|
| **CP4** — Idealização | conceito, marca, documentação inicial, setup | ✅ repositório, README, escopo, pitch, marca e projeto Expo prontos |
| **CP5** — Protótipo | protótipo funcional com dados mockados | 🟡 caminho crítico navegável (5 telas), dados mockados e Jest de pé — falta rodar no emulador do Android Studio e gravar a evidência |
| **CP6** — Entrega final | app final e APK instalável | ⬜ não iniciado |

## Licença

Projeto acadêmico. Ver [`LICENSE`](LICENSE).
