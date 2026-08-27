# Documento de escopo — Série.

> Checkpoint 4 · Idealização do App
> Versão 1.0 — agosto de 2026

---

## 1. O problema

Existe um público que treina sozinho, com constância, e **não tem personal**. Esse público precisa
responder uma pergunta única, toda vez que chega no aparelho:

> *Quanto eu botei da última vez, e o que eu boto hoje?*

Hoje ele responde isso de três jeitos, todos ruins:

| Como resolve hoje | Por que falha |
|---|---|
| **Bloco de notas / papel no armário** | é o concorrente real. Zero atrito para escrever, mas nenhuma inteligência: você mesmo tem que lembrar da progressão, e ninguém lembra |
| **App de catálogo** (biblioteca com GIF) | te ensina o movimento e some no momento que importa — entre uma série e outra |
| **App de log / planilha com skin** | registra tudo, mas **te faz digitar do zero toda vez**. É o motivo de a maioria morrer na segunda semana |

A raiz é uma só: **os apps tratam o treino como algo a registrar, quando ele é algo a ser
prescrito.** Registrar é trabalho para o usuário. Prescrever é trabalho para o app.

### O problema secundário que ninguém resolve

**O aparelho está ocupado.** É a interrupção número um de qualquer academia cheia, e em todos os
apps existentes trocar de aparelho significa **perder o histórico daquele movimento** — porque o
histórico está preso ao *exercício*, não ao *movimento*. Você fez supino reto na semana passada, o
banco está ocupado, você vai para o supino na máquina, e o app te trata como iniciante.

## 2. Público-alvo

**Quem é:** pessoa que já treina há pelo menos alguns meses, frequência de 3 a 5 vezes por semana,
sem acompanhamento profissional, entre 18 e 35 anos. Já sabe executar os movimentos; o que falta é
memória e método.

**Quem NÃO é**, e isso é decisão, não esquecimento:

| Fora | Por quê |
|---|---|
| **Iniciante absoluto** | precisa de professor corrigindo postura, não de app. Um app que finge suprir isso é irresponsável |
| **Atleta / competidor** | já tem planilha própria, periodização e treinador. Não vamos ganhar dele |
| **Quem busca emagrecer com cardio** | o modelo de dados é `série × carga`. Cardio não cabe sem torcer tudo |

**Como a gente valida:** *alguém do grupo usa por seis semanas seguidas sem que a gente peça.*
Antes disso é preparação; depois é otimização. Seis semanas é o mínimo para a dupla progressão
(`CAR-1`) fechar pelo menos dois ciclos de carga e o valor ficar visível.

## 3. Proposta de valor

**Uma frase:** *ele não te dá treino, ele te diz o que bater.*

O app abre já sabendo três coisas: qual treino é hoje, quais exercícios, e **qual carga e quantas
repetições você tem que fazer em cada série** — calculadas a partir do que você fez da última vez.
O gesto mais repetido do app é "concluir série", e ele é **um toque**.

### As três coisas que sustentam isso

| | Regra | O que faz |
|---|---|---|
| 1 | **Dupla progressão** (`CAR-1`) | você sobe repetições dentro de uma faixa (ex. 8–12); ao fechar o topo da faixa em todas as séries, **a carga sobe sozinha** na próxima sessão. É o método real da musculação, e cabe numa função pura de 15 linhas |
| 2 | **Nunca campo vazio** (`CAR-2`) | o alvo já vem preenchido. Você confirma ou corrige. Digitar do zero é o que mata app de treino |
| 3 | **Troca por padrão de movimento** (`CAR-9`) | cada exercício pertence a um *padrão* (empurrar horizontal, agachar, articular quadril...). Aparelho ocupado? O app oferece as variações do mesmo padrão, e **o histórico segue o padrão, não o aparelho** |

A regra completa, com as 11 regras `CAR-*`, está em [`regras.md`](regras.md).

### O que o produto deliberadamente não promete

O app **não tem sensor**. Tudo é auto-declarado, e a consequência é aceita de propósito: sem ranking
global, sem selo de "verificado", sem comparação com estranhos. **A competição da Série é contra a
sua última sessão** — e essa não dá para fraudar sem se fraudar.

## 4. Escopo do MVP

### Dentro

- Onboarding de 3 perguntas que **gera** o plano (dias por semana + objetivo → divisão e faixa de reps)
- Montar e editar treinos (A, B, C) e o catálogo de ~40 exercícios cobrindo os 7 padrões de movimento
- Executar a sessão: série cronometrada → descanso automático → registro no descanso
- Dupla progressão automática, deload sugerido, recorde de 1RM estimado (Epley)
- Resumo da sessão com tonelagem comparada à mesma letra da vez anterior
- Volume semanal por grupo muscular
- Histórico por exercício e exportação em CSV
- **Offline-first** — não é opção, é requisito: academia é subsolo

### Fora, e o motivo de cada um

| Fora do escopo | Por quê |
|---|---|
| Social, ranking, feed | a competição é contra a sua última sessão (`CAR-10`) |
| Vídeo / GIF de execução | custo de asset altíssimo, valor baixo para quem já treina. Descrição em texto resolve |
| IA gerando treino | um gerador por tabela de templates é **auditável**; um LLM não é. Em trabalho acadêmico isso importa |
| Nutrição, calorias, dieta | é outro produto inteiro |
| Apple Watch / HealthKit | corta o Android, e o CP6 pede APK |
| Tema claro | academia é ambiente escuro com o brilho da tela no máximo. Escuro é o caso real, não a preferência |
| Cardio / corrida | não cabe no modelo `série × carga` |

## 5. Riscos

| Risco | Tamanho | Mitigação |
|---|---|---|
| Ninguém do grupo usa de verdade → sem dado, sem projeto | **alto** | os três primeiros usuários somos nós. Semana 1 já com o `CAR-1` funcionando |
| Cadastrar exercícios vira trabalho braçal infinito | médio | lista fechada de ~40 exercícios cobrindo os 7 padrões, com "outro" como escape |
| A sugestão do `CAR-1` fica agressiva e a pessoa falha sempre | médio | `CAR-3` (deload) existe para isso, e o campo `foi alvo?` mede se está calibrado |
| Escopo cresce ("põe cardio", "põe dieta") | **alto** | a seção 4 é a defesa. Está escrita para ser citada |
| O grupo não fecha os papéis e a documentação fica sem dono | médio | tabela de papéis no [`README`](../README.md), preenchida antes da entrega |
