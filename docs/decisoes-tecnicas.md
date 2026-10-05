# Decisões técnicas — Série.

> Registro das escolhas de arquitetura e do porquê de cada uma. Documento vivo: o CP5 pede
> "decisões técnicas registradas (bibliotecas usadas, arquitetura)" e o CP6 pede a versão final.

---

## 1. Stack

| Camada | Escolha | Alternativa descartada | Motivo |
|---|---|---|---|
| App | **React Native + Expo (SDK 57)** | SwiftUI | exigência do enunciado. E é o que permite todo o grupo rodar no próprio celular: SwiftUI só um integrante conseguiria testar, e o CP6 pede **APK** |
| Navegação | **Expo Router** | React Navigation na mão | rotas por arquivo; o deep link sai de graça. É o padrão do template oficial do Expo |
| Linguagem | **TypeScript** | JavaScript | o modelo de domínio (Série, Sessão, Treino) é o coração do app. Tipo errado aqui vira bug de carga, que é o pior bug possível neste produto |
| Dados no CP5 | **JSON local + AsyncStorage** | `json-server` | o enunciado aceita os dois; o local casa com o requisito de offline-first e não precisa de um segundo processo rodando na apresentação |
| Dados no CP6 | **Supabase** *(a confirmar)* | Firebase | Postgres de verdade, e o plano grátis cobre o projeto inteiro. Só entra para login e backup — o app funciona sem ele |
| Build do APK | **EAS Build** | Android Studio local | é o caminho que o próprio enunciado cita, e não depende da máquina de ninguém |

## 2. Offline-first não é otimização, é requisito

**Academia é subsolo.** Se o app precisar de rede para registrar uma série, ele morre no primeiro
treino. Isso força três coisas:

1. **Toda a inteligência roda no dispositivo.** `CAR-1`, `CAR-5`, `CAR-4` são funções puras sobre
   dados locais. Nenhuma chamada de rede no caminho crítico.
2. **A fonte de verdade é o armazenamento local.** A nuvem é cópia, não origem. Sincronizar é uma
   operação em segundo plano que pode falhar sem quebrar nada.
3. **Nada de spinner no caminho crítico** (`10 Hoje → 11 Treino ativo → 12 Execução → 13 Descanso →
   14 Resumo`). Se aparecer um, é bug de arquitetura.

Efeito colateral bem-vindo, detalhado em [`pitch.md`](pitch.md): o usuário gratuito custa perto de
zero, o que é o que permite manter o plano grátis generoso.

## 3. Por que `src/domain/` é uma pasta separada e sem React

As regras `CAR-*` são **funções puras**: entram dados, saem dados. Sem `useState`, sem componente,
sem navegação. Isso dá três coisas de graça:

- **Testáveis com Jest sem montar tela** — que é exatamente o "ambiente de teste configurado" que o
  CP5 cobra, e o tipo de teste que não quebra quando o layout muda. São **113 testes verdes** em
  cinco suítes de [`src/domain/__tests__/`](../src/domain/__tests__/): rode `npm test`.
- **Portáveis** — se um dia o app virar web ou watch, a lógica vem junto sem tocar em nada.
- **Auditáveis** — dá para conferir a dupla progressão lendo 40 linhas. É o argumento contra usar um
  LLM para gerar treino: um gerador por tabela é auditável, um modelo não é.

```
src/
├── app/          rotas (Expo Router). Só composição e navegação
├── components/   design system: Texto, BotaoPrimario, Nav, Marca…
├── domain/       as regras CAR-*. ZERO import de react ou react-native
├── data/         os mocks: catálogo de exercícios, plano A/B/C, histórico de fábrica
├── estado/       Context API: o histórico persistido e a sessão em andamento
├── hooks/        cronômetro, guarda da sessão, treino com a troca aplicada
├── lib/          utilitários (formatação pt-BR, exportar CSV)
└── theme/        tokens: cor, tipografia, espaço, raio, alvo de toque
```

## 4. Tokens em TypeScript, não em CSS-in-JS

[`src/theme/tokens.ts`](../src/theme/tokens.ts) espelha o `serie-tokens.css` e as 83 Variables do
Figma, como objetos `as const`. Sem biblioteca de tema, sem `styled-components`.

Motivo: a Série tem **um tema só** (escuro — ver [`marca.md`](marca.md) §7). Uma camada de troca de
tema seria abstração para um caso que não existe. Constante tipada dá autocomplete, custa zero em
runtime, e `StyleSheet.create` do próprio React Native já resolve o resto.

## 5. Formatação em português feita à mão

[`src/lib/formato.ts`](../src/lib/formato.ts) não usa `Intl`. O resultado precisa ser **idêntico** no
Hermes (Android), no iOS e no navegador, e precisa ser testável sem depender do locale da máquina
que roda o teste. `62,5 kg`, não `62.5 kg`.

## 6. Decisões de produto que viraram decisão técnica

| Decisão | Consequência no código |
|---|---|
| Incremento **fixo** (2,5 kg), não percentual | `arredondarParaAnilha()` — academia tem anilha, não tem 3,7% |
| Faixa de reps **por exercício**, não por treino | `faixa` mora em `ItemDeTreino`, não em `Treino` |
| Catálogo **fechado** de ~45 exercícios | `EXERCICIOS` é um array `as const`, não uma tabela editável |
| Tema claro fora do MVP | `userInterfaceStyle: "dark"` no `app.json`; nenhum código de troca de tema |
| Histórico segue o **padrão de movimento** | `Exercicio.padrao` é campo de primeira classe, não etiqueta |

## 7. Estado: Context API + AsyncStorage, e o que NÃO se guarda (CP5)

Dois provedores em [`src/estado/`](../src/estado/), sem Redux nem Zustand: o estado do app é
pequeno e tem dois donos claros.

| Provedor | O que guarda | Onde persiste |
|---|---|---|
| `ProvedorDeHistorico` | as sessões fechadas: só as séries (reps × carga × duração) | AsyncStorage, `serie:historico:v1`. Na primeira abertura nasce das sessões de fábrica de [`src/data/historico.ts`](../src/data/historico.ts) |
| `ProvedorDeSessao` | o treino em andamento: onde você está, o que já registrou, as trocas de aparelho | AsyncStorage, `serie:sessao:v1`. Vence em 6 h (`CAR-8`) |

**Recorde, tonelagem anterior, "a última vez" e a próxima letra não são guardados.** Saem das séries
pelas funções puras de [`src/domain/historico.ts`](../src/domain/historico.ts). O mock do CP4
guardava os três separados e se contradizia: a tonelagem anterior do treino A não batia com a soma
das séries, e o recorde do tríceps era menor que o 1RM da própria última sessão. Com uma fonte só,
não há como discordar.

É isso que faz o app **aprender**: terminar o treino A grava a sessão, o Hoje passa a propor o B, e
o próximo A já parte das cargas que você acabou de fazer — mesmo depois de fechar o app.

## 8. Navegação: o treino é um ciclo, não uma pilha

O caminho crítico volta para a mesma tela a cada série (`11 → 12 → 13 → 11`). O Descanso voltava
para a 11 com `replace`, que criava um Treino ativo **novo** por cima do que já estava na pilha: na
15ª série havia 16 "Treino ativo" montadas e o voltar precisava de 16 toques. A regra agora:

- **Execução → Descanso** é `replace` (uma substitui a outra);
- **Descanso → Treino ativo** é `dismissTo`, que volta à tela que já está na pilha;
- **troca de aba** é `replace`: aba é lugar, não passo;
- **sair do treino** é `dismissTo('/hoje')`, que volta ao Hoje da base em vez de criar outro.

Medido com o app rodando: o tamanho do histórico do navegador fica **constante nas 16 séries**.
E uma tela do treino aberta sem sessão (recarregou a página, a sessão venceu) não renderiza mais
tela preta: a guarda ([`use-guarda-da-sessao.ts`](../src/hooks/use-guarda-da-sessao.ts)) mostra o
fundo enquanto o AsyncStorage responde e, se não houver sessão, leva ao Hoje.

## 9. A troca de exercício (`CAR-9` e `CAR-9.1`)

O padrão de movimento sozinho não basta: o padrão `isolado` reúne 16 exercícios de 8 grupos, e
trocar tríceps oferecia prancha. A alternativa é do **mesmo padrão e do mesmo grupo**,
composto só troca por composto, e nunca é um exercício que já está em outro item do treino do dia.

Na variação nova a carga é **estimada e declarada como tal**. Para isso o exercício ganhou dois
campos, ambos só para a `CAR-9.1`: `equipamento` (40 kg na barra não são 40 kg por mão no halter) e
`fatorDeCarga` (o leg press carrega ~2,5× a barra). Tudo em
[`src/domain/troca.ts`](../src/domain/troca.ts), com testes próprios.

## 10. Testes

| Suíte | O que prova |
|---|---|
| [`regras.test.ts`](../src/domain/__tests__/regras.test.ts) | as regras do CP4: dupla progressão, deload, 1RM, volume semanal |
| [`historico.test.ts`](../src/domain/__tests__/historico.test.ts) | os mocks são coerentes entre si; recorde, tonelagem anterior e a próxima letra saem das séries |
| [`sessao.test.ts`](../src/domain/__tests__/sessao.test.ts) | o caminho crítico de ponta a ponta, a sessão retomável (6 h), o `foiAlvo`, o texto do resumo |
| [`troca.test.ts`](../src/domain/__tests__/troca.test.ts) | a `CAR-9`: alternativas por padrão + grupo, a estimativa de carga por equipamento |
| [`progresso.test.ts`](../src/domain/__tests__/progresso.test.ts) | a `CAR-4` na tela de Progresso e o CSV exportado no Perfil |

Testes de tela (React Native Testing Library) ficaram de fora de propósito: as telas só compõem o
que as funções puras calculam, e o fluxo inteiro foi conferido rodando o app no navegador — é de lá
que saem os prints de [`evidencias/`](evidencias/).

## 11. Em aberto

| # | Questão | Situação |
|---|---|---|
| 1 | Supabase ou só local também no CP6? | antes de começar o CP6 |
| 2 | ~~Onboarding gera o plano ou o usuário monta do zero?~~ | **decidido para o CP5**: o plano A/B/C vem dos mocks; as telas 06–09 (montagem) e 18–19 (montar treino) ficam para o CP6 |
| 3 | ~~`expo-linear-gradient` ou imagem estática?~~ | **resolvido**: `expo-linear-gradient` no botão primário; o fundo ([`fundo.tsx`](../src/components/fundo.tsx)) são gradientes radiais do `react-native-svg` |
| 4 | ~~Jest nas funções puras~~ | **resolvido**: `jest-expo`, 113 testes em 5 suítes |
| 5 | React Native Testing Library para as telas? | **não no CP5** — ver §10 |
| 6 | A mesa flexora não tem alternativa (é o único isolado de posterior do catálogo) | CP6: entrar com a cadeira flexora no catálogo |
