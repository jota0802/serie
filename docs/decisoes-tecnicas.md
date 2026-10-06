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
| Dados no CP6 | **Supabase** (Auth + Postgres com RLS) | Firebase | Postgres de verdade, SQL versionado em migração, e o plano grátis cobre o projeto inteiro. É a conta e a cópia na nuvem — o treino continua funcionando sem rede (§12) |
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
  CP5 cobra, e o tipo de teste que não quebra quando o layout muda. Dez das 16 suítes (§10) são
  de [`src/domain/__tests__/`](../src/domain/__tests__/): rode `npm test`.
- **Portáveis** — se um dia o app virar web ou watch, a lógica vem junto sem tocar em nada.
- **Auditáveis** — dá para conferir a dupla progressão lendo 40 linhas. É o argumento contra usar um
  LLM para gerar treino: um gerador por tabela é auditável, um modelo não é.

```
src/
├── app/          rotas (Expo Router). Só composição e navegação
├── components/   design system: Texto, BotaoPrimario, Nav, Heatmap, Surgir…
├── domain/       as regras CAR-* e RN-*. ZERO import de react ou react-native
├── data/         o catálogo de exercícios; e a massa de teste do CP5 (plano A/B/C, histórico)
├── estado/       Context API: conta, perfil e plano, histórico, sessão em andamento
├── hooks/        cronômetro, guarda da sessão, troca aplicada, tentar de novo ao reconectar
├── lib/          cliente Supabase, sincronização, formatação pt-BR, exportar CSV
└── theme/        tokens: cor, tipografia, espaço, raio, alvo de toque, movimento
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

> **No CP6** os provedores passaram a ser quatro (conta, perfil e plano, histórico, sessão), as
> chaves ganharam o id do usuário (`serie:historico:v2:<id>`) e o histórico de fábrica saiu do app:
> conta nova começa vazia. A sincronização com a nuvem está em §12 e §13. O que esta seção diz
> sobre **o que não se guarda** continua valendo.

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

**No CP6 vieram mais onze**, e são 248 testes em 16 suítes:

| Suíte | O que prova |
|---|---|
| [`progressao-carga.test.ts`](../src/domain/__tests__/progressao-carga.test.ts) | a `CAR-1` parte da carga da **última vez**, não da do plano (o bug em que o alvo voltava à carga do plano depois de subir); e a `RN-19` |
| [`plano.test.ts`](../src/domain/__tests__/plano.test.ts) | a montagem (06–09) e a carga de partida de todo exercício com carga (`RN-18`) |
| [`edicao.test.ts`](../src/domain/__tests__/edicao.test.ts) | editar o plano (`RN-10` a `RN-19`, `RN-12a`), corrigir o histórico (`RN-40` a `RN-43`), terminar antes (`RN-30`) |
| [`calendario.test.ts`](../src/domain/__tests__/calendario.test.ts) | o heatmap do Início (`RN-50` a `RN-53`) |
| [`resumo-detalhe.test.ts`](../src/domain/__tests__/resumo-detalhe.test.ts) | o resumo exercício por exercício e o destaque "você evoluiu em X de Y" (`CAR-7`) |
| [`sincronizacao.test.ts`](../src/lib/__tests__/sincronizacao.test.ts) | ida e volta entre o aparelho e as tabelas, e a mescla por id (§12) |
| [`auth.test.ts`](../src/lib/__tests__/auth.test.ts) | as mensagens de erro do Supabase Auth em português e o link de redefinir senha |
| [`formato-do-historico.test.ts`](../src/components/__tests__/formato-do-historico.test.ts) | as datas do histórico sem `Intl`, a lista por mês, o selo de recorde |
| [`inicio.test.tsx`](../src/components/__tests__/inicio.test.tsx), [`telas-de-editar-o-plano.test.tsx`](../src/components/__tests__/telas-de-editar-o-plano.test.tsx), [`telas-do-historico.test.tsx`](../src/components/__tests__/telas-do-historico.test.tsx) | as telas mais tocadas, montadas de verdade |

**Testes de tela** ficaram de fora no CP5 de propósito: as telas só compunham o que as funções
puras calculam. No CP6 as telas passaram a ter decisão própria (qual letra o Início oferece, o que
o X do treino faz, o que a correção grava), e as mais tocadas ganharam teste montado com
`react-test-renderer`, com o roteador e os provedores simulados: o Início, as três de editar o
plano (17–19), o Histórico e o X do Treino ativo. No Jest, o `Surgir` (a entrada
animada das telas) é trocado por uma `View` em [`jest.setup.ts`](../jest.setup.ts): o timer da
animação disparava depois que o Jest desmontava o ambiente e derrubava a suíte. O resto do fluxo
foi conferido rodando o app no navegador.

## 11. CP6: Supabase — conta, banco e segurança

| Peça | Escolha | Por quê |
|---|---|---|
| Conta | **Supabase Auth**, e-mail e senha | as telas 02–05 do Figma já eram e-mail e senha; sem rede social, sem SMS |
| Confirmação de e-mail | **desligada** | o SMTP padrão do Supabase só entrega para o time do projeto e ~2 e-mails por hora: com ela ligada, ninguém de fora conseguiria criar conta na demonstração |
| Banco | 3 tabelas: `perfis` (respostas da montagem + o plano em `jsonb`), `sessoes` e `series` | o plano é editado **como documento** (montagem, "Montar treino"), então é salvo de uma vez; as séries são **fatos** imutáveis, então são linhas |
| Esquema | migração SQL versionada em [`supabase/migrations/`](../supabase/migrations/), aplicada com `supabase db push` | o banco nasce de um arquivo revisável, não de cliques no painel |
| Segurança | **RLS em todas as tabelas** + chave **publicável** no app | a chave vai dentro do APK de qualquer jeito; quem protege é a política `auth.uid() = dono` — testado: anônimo lê lista vazia e não grava |
| Perfil | criado por **gatilho** junto com a conta (`criar_perfil_da_conta`) | o nome da tela 03 chega no banco sem uma segunda chamada, e não existe conta sem perfil |
| Configuração do Auth | em [`supabase/config.toml`](../supabase/config.toml), aplicada com `supabase config push` | senha mínima de 8 (a tela 03 diz isso), URLs do link de "esqueci a senha" (`serie://`, Expo Go e navegador) |
| Tipos | gerados do banco: `supabase gen types` → [`database.types.ts`](../src/lib/database.types.ts) | a coluna errada vira erro de compilação, não bug em produção |

## 12. Sincronização offline-first

O aparelho é a **fonte da verdade**; o Supabase é a cópia. Toda gravação acontece primeiro no
AsyncStorage (por usuário: `serie:<coisa>:<id do usuário>`) e sobe quando der.

- **Histórico** ([`estado/historico.tsx`](../src/estado/historico.tsx)): o id do treino nasce no
  aparelho (`sessao-<início em ms>`), então reenviar é idempotente (upsert). Duas filas: treinos a
  subir (novos ou **corrigidos** — a correção substitui as séries na nuvem) e treinos **apagados**
  a apagar lá (e que não podem voltar da nuvem enquanto isso). Ao entrar num aparelho novo, o que
  está na nuvem desce e é **mesclado** por id ([`lib/sincronizacao.ts`](../src/lib/sincronizacao.ts),
  com testes de ida e volta).
- **Perfil e plano** ([`estado/perfil.tsx`](../src/estado/perfil.tsx)): um documento; vence o
  mais recente (`atualizado_em`). O plano que chega do banco é validado (`planoValido`) antes de ser
  usado.
- **Quando tenta de novo** ([`hooks/use-ao-reconectar.ts`](../src/hooks/use-ao-reconectar.ts)):
  depois de cada gravação, quando o app volta para a frente, quando o navegador volta a ter rede, e
  a cada 30 s enquanto houver pendência. Sem biblioteca de rede: com envio idempotente, tentar de
  tempos em tempos é tão eficaz quanto escutar a rede, e mais simples.
- **À vista do usuário:** o Perfil diz "N treinos aguardando conexão" ou "Tudo salvo na nuvem".

## 13. Rotas protegidas e dados por usuário

[`app/_layout.tsx`](../src/app/_layout.tsx) usa o `Stack.Protected` do Expo Router em três áreas:
deslogado (01–05), logado (06–09, a montagem) e logado **com plano** (o app). Quem não pode estar
numa tela nem chega a ela; quem entra, sai ou monta o plano é levado sozinho para a primeira tela
que vale. Os provedores de perfil, histórico e sessão são remontados quando a conta troca (`key`
pelo id do usuário), então dois logins no mesmo aparelho nunca se misturam.

A versão web passou de `static` para `single` (SPA): com login, o HTML gerado no servidor não tem
como saber quem está logado, e criaria o cliente de auth sem `window`.

## 14. As regras do app

As regras de **produto** que não são de treino — conta, plano, rodízio, sessão, histórico, Início —
estão numeradas em [`regras-do-app.md`](regras-do-app.md) (RN-01 a RN-54), ao lado das regras de
treino (`CAR-*`, [`regras.md`](regras.md)). Cada regra aparece no comentário da função que a cumpre,
e as que são lógica pura têm teste: editar o plano ([`edicao-plano.ts`](../src/domain/edicao-plano.ts)),
o calendário do Início ([`calendario.ts`](../src/domain/calendario.ts)), corrigir o histórico e
terminar o treino antes.

## 15. Em aberto

| # | Questão | Situação |
|---|---|---|
| 1 | ~~Supabase ou só local também no CP6?~~ | **decidido**: Supabase para conta e cópia na nuvem; o treino segue offline-first (§11, §12) |
| 2 | ~~Onboarding gera o plano ou o usuário monta do zero?~~ | **os dois**: as três perguntas geram o plano (06–09), e ele é editável (17–19) |
| 3 | ~~`expo-linear-gradient` ou imagem estática?~~ | **resolvido**: `expo-linear-gradient` no botão primário; o fundo ([`fundo.tsx`](../src/components/fundo.tsx)) são gradientes radiais do `react-native-svg` |
| 4 | ~~Jest nas funções puras~~ | **resolvido**: `jest-expo`, 248 testes em 16 suítes |
| 5 | ~~Testes das telas?~~ | **em parte**: as mais tocadas são montadas com `react-test-renderer` (§10); o resto foi conferido no app rodando |
| 6 | A mesa flexora não tem alternativa (é o único isolado de posterior do catálogo) | entrar com a cadeira flexora no catálogo |
| 7 | Excluir a conta pelo app | precisa de uma função no servidor (a chave publicável não apaga usuário); hoje é pelo painel do Supabase |

## 16. O APK: EAS Build

| Peça | Escolha | Por quê |
|---|---|---|
| Perfil | `preview` no [`eas.json`](../eas.json): `buildType: "apk"`, distribuição interna | o enunciado pede **APK instalável**; o `.aab` do perfil `production` só serve para a Play Store |
| Assinatura | keystore gerada e guardada pelo EAS | ninguém do grupo guarda arquivo de chave, e a assinatura é sempre a mesma: é ela que deixa o Android aceitar um APK novo como atualização do instalado |
| Versão | `appVersionSource: "remote"` + `autoIncrement` | o `versionCode` mora no EAS e sobe sozinho a cada build (`preview` e `production`): o APK novo instala por cima do antigo como atualização, sem perder o login, e dois integrantes gerando build não colidem no número |
| `eas-cli` | pelo `npx`, **fora** das dependências | o EAS instala as dependências com `npm ci` no **npm 10** (Node 22). Com o `eas-cli` nas devDependencies, o lock gerado no npm 11 não servia para o npm 10 (um peer opcional dele pedia o TypeScript 5) e o primeiro build quebrou na instalação. Conferido com o mesmo `npm ci` do npm 10.9.8 antes de mandar de novo. A Expo também recomenda não pôr o CLI no projeto |
| Variáveis | o `.env` vai junto no build | as duas `EXPO_PUBLIC_*` são públicas por natureza (a URL e a chave publicável); nada secreto entra no APK |
