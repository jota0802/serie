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
  CP5 cobra, e o tipo de teste que não quebra quando o layout muda.
- **Portáveis** — se um dia o app virar web ou watch, a lógica vem junto sem tocar em nada.
- **Auditáveis** — dá para conferir a dupla progressão lendo 40 linhas. É o argumento contra usar um
  LLM para gerar treino: um gerador por tabela é auditável, um modelo não é.

```
src/
├── app/          rotas (Expo Router). Só composição e navegação
├── components/   design system: Texto, BotaoPrimario, Marca…
├── domain/       as regras CAR-*. ZERO import de react ou react-native
├── data/         catálogo de exercícios e persistência
├── lib/          utilitários (formatação pt-BR)
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

## 7. Em aberto

| # | Questão | Quando decidir |
|---|---|---|
| 1 | Supabase ou só local também no CP6? | antes de começar o CP6 |
| 2 | Onboarding gera o plano ou o usuário monta do zero? | **CP5** — muda 4 telas |
| 3 | `expo-linear-gradient` para o fundo de dois gradientes, ou imagem estática? | CP5, quando as telas entrarem |
| 4 | Jest + React Native Testing Library, ou só Jest nas funções puras? | CP5 — o enunciado cobra ambiente de teste |
