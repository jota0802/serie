<div align="center">

# Série.

**Ele não te dá treino. Ele te diz o que bater hoje.**

Caderno de treino que sabe o que você fez da última vez e já chega com o campo preenchido.

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

## Integrantes e papéis

| Nome | RM | Papel | Responsável por |
|---|---|---|---|
| João Victor Franco | 556790 | Product Owner · Design System | regras `CAR-*`, tokens, arquivo do Figma, protótipo |
| Lucca Borges | 554608 | Dev Front | telas em React Native, navegação |
| Ruan Melo | 557599 | Dev Mock / Dados | camada de dados, persistência local, mocks do CP5 |
| Rodrigo Jimenez | 558148 | Design | identidade visual, ícone, splash, assets |
| Bruno Leão | 555563 | QA · Documentação · Dev | roteiro de testes, README, evidências de entrega, apoio em desenvolvimento |

## Links do projeto

| | |
|---|---|
| **Figma — Design System** | https://www.figma.com/design/j9TqnMGzyjEpdjw18cLPBp |
| **Protótipo navegável** | 21 telas · 64 ligações · 2 pontos de partida |
| **Documentação** | [`docs/`](docs/) |

## Como rodar

Pré-requisitos: **Node 20+** e o app **Expo Go** no celular (ou Android Studio para o emulador).

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

Testes das regras do app:

```bash
npm test
```

## Estrutura de pastas

```
serie/
├── src/
│   ├── app/            # rotas — Expo Router (file-based routing)
│   ├── components/     # os 8 componentes do design system
│   ├── domain/         # as regras CAR-* como funções puras. O "cérebro" do app
│   │   └── __tests__/  # suíte Jest das regras — 22 testes
│   ├── data/           # catálogo de exercícios e persistência local
│   ├── theme/          # tokens (cor, tipografia, espaço, raio) — espelha serie-tokens.css
│   └── lib/            # utilitários (formatação em pt-BR)
├── docs/
│   ├── escopo.md            # problema, público-alvo, proposta de valor
│   ├── pitch.md             # modelo de negócio e diferencial competitivo
│   ├── marca.md             # nome, logo, paleta, tipografia
│   ├── regras.md            # as 11 regras CAR-* — a lógica do produto
│   └── decisoes-tecnicas.md # stack e o porquê de cada escolha
└── assets/
```

**Por que `domain/` é uma pasta separada:** as regras do app (dupla progressão, 1RM estimado, volume
semanal) são funções puras, sem React e sem tela. Isso as torna testáveis com Jest no CP5 sem
precisar montar componente nenhum — são as 22 asserções de `npm test`. Detalhes em
[`docs/decisoes-tecnicas.md`](docs/decisoes-tecnicas.md).

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| App | **React Native + Expo (SDK 57)** | exigência do enunciado; roda no celular de todo o grupo e gera APK via EAS Build |
| Navegação | **Expo Router** | rotas por arquivo, e o *deep link* sai de graça |
| Linguagem | **TypeScript** | o modelo de domínio (Série, Sessão, Treino) é o coração do app; tipo errado aqui vira bug de carga |
| Testes | **Jest** (preset `jest-expo`) | as regras são funções puras: dá para testá-las sem montar tela |
| Dados (CP5) | **JSON local + AsyncStorage** | o enunciado do CP5 pede dados mockados, sem backend |
| Dados (CP6) | **Supabase** *(a confirmar)* | só para backup e login. O app é **offline-first**: academia é subsolo |

## Estado das entregas

| | Foco | Status |
|---|---|---|
| **CP4** — Idealização | conceito, marca, documentação inicial | 🟡 em andamento |
| **CP5** — Protótipo | protótipo funcional com dados mockados | ⬜ não iniciado — o ambiente de teste já está de pé |
| **CP6** — Entrega final | app final e APK instalável | ⬜ não iniciado |

## Licença

Projeto acadêmico. Ver [`LICENSE`](LICENSE).
