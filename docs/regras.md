# As regras `CAR-*` — o cérebro da Série

> Esta seção é o projeto. Sem ela o app é um formulário.
>
> As regras têm código para o código-fonte poder citá-las. Mudou a regra, muda o número, e dá para
> achar todos os pontos afetados. A implementação está em [`src/domain/`](../src/domain/) — funções
> puras, sem React e sem tela, testáveis com Jest sem montar componente nenhum.

---

## Glossário canônico

Nome trocado no meio do caminho custa refactor e bug de interpretação.

| Termo | Definição |
|---|---|
| **Exercício** | o movimento. "Supino reto" |
| **Padrão** | a família do movimento: empurrar horizontal, puxar vertical, agachar, articular quadril, empurrar vertical, puxar horizontal, isolado |
| **Treino** | a letra: A, B, C. Lista ordenada de exercícios com faixa e séries |
| **Plano** | o conjunto de treinos + quais dias da semana |
| **Sessão** | a execução concreta de um treino num dia |
| **Série** | uma entrada: reps × carga. A unidade do app, e o nome dele |
| **Faixa** | o intervalo de repetições alvo do exercício: 8–12 |
| **Alvo** | o que o app propõe para a série de hoje, vindo da `CAR-1` |
| **Tonelagem** | Σ (carga × reps) da sessão |
| **1RM estimado** | carga máxima teórica para 1 repetição, por Epley |
| **Recorde** | maior 1RM estimado já registrado naquele exercício |
| **Deload** | redução deliberada de carga depois de travar (`CAR-3`) |

---

## `CAR-1` Dupla progressão

Cada exercício tem uma faixa (ex. 8–12) e uma carga. Você **sobe repetições dentro da faixa**;
quando fecha o **topo da faixa em todas as séries**, na próxima sessão:

```
carga ← carga + incremento        (2,5 kg superior · 5 kg inferior · 2 kg unilateral)
alvo de reps ← piso da faixa
```

É o método mais usado na musculação real, é auditável, e cabe numa função pura. É também a única
coisa do app que ninguém mais faz direito.

📍 `proximoAlvo()` em [`src/domain/progressao.ts`](../src/domain/progressao.ts)

## `CAR-2` Nunca campo vazio

Antes de cada série o app mostra o alvo (`CAR-1`). Você confirma com um toque ou corrige o número.

> Digitar do zero é o que mata app de treino na segunda semana. O gesto mais repetido do app é
> "concluir série" e ele tem que ser **um toque**.

## `CAR-3` Regressão / deload

Duas sessões consecutivas falhando o **piso** da faixa na mesma carga → o app **sugere** −10%
naquele exercício. Sugere, não impõe, e some se você recusar duas vezes.

**`CAR-3.1` Falhar não é vermelho.** Falha é neutra e discreta. Vermelho fica reservado a ação
destrutiva. Um app que te pune por um dia ruim é desinstalado num dia ruim.

📍 `sugerirDeload()` em [`src/domain/progressao.ts`](../src/domain/progressao.ts)

## `CAR-4` Volume semanal por grupo

Soma de séries por grupo muscular na semana corrente. Faixa de referência **10–20 séries**. Três
estados: abaixo · na faixa · acima. É a única métrica "de treinador" do app, e ela existe para
responder uma pergunta só: *o que eu estou negligenciando?*

📍 `volumeSemanal()` em [`src/domain/volume.ts`](../src/domain/volume.ts)

## `CAR-5` Recorde

1RM estimado por **Epley**: `1RM = carga × (1 + reps / 30)`. Calculado por série; o recorde do
exercício é o maior já visto. Bater um recorde é **o único momento do app que tem cor**.

📍 `umRepMaximo()` em [`src/domain/forca.ts`](../src/domain/forca.ts)

## `CAR-6` Descanso automático

Começa sozinho ao encerrar a série. Padrão **90 s composto · 60 s isolado**, editável por exercício.
A tela do cronômetro é a única desenhada para ser lida a dois metros de distância.

## `CAR-7` Tonelagem

`Σ (carga × reps)` da sessão, comparada com a **mesma letra** na vez anterior. É o número dominante
do resumo. Comparar A com B não significaria nada, então não se compara.

📍 `tonelagem()` em [`src/domain/forca.ts`](../src/domain/forca.ts)

## `CAR-8` Sessão aberta expira em 6 h

Saiu do app no meio? A sessão fica aberta e retomável por 6 h. Depois disso fecha sozinha com o que
foi registrado, e não vira sessão-fantasma no histórico.

## `CAR-9` Troca por padrão de movimento

**O diferencial.** Aparelho ocupado é o problema nº 1 da academia real e **nenhum app resolve**. No
Série, exercício pertence a um `padrao`; ao trocar, o app oferece as variações do mesmo padrão e **o
histórico segue o padrão, não o aparelho**.

**`CAR-9.1`** A carga sugerida na variação nova é uma **estimativa declarada como tal**
("sugestão"). A partir da segunda vez naquela variação, usa histórico real. Não inventamos precisão
que não temos.

📍 `alternativasDoMesmoPadrao()` em [`src/data/exercicios.ts`](../src/data/exercicios.ts)

## `CAR-10` Tudo é auto-declarado

Sem sensor não existe verificação. Por isso: sem ranking global, sem selo de "verificado", sem
comparação com estranhos. A honestidade do app é o que sustenta o número dele.

## `CAR-11` A série é cronometrada, e o registro acontece no descanso

O caminho é **Treino ativo → Execução → Descanso**. Na execução a tela inteira é o alvo de toque:
mostra o exercício, qual série, o alvo e o tempo correndo — e mais nada. Não é minimalismo por
estética:

> **Durante a série você não consegue tocar no celular.** Qualquer campo ali é campo que ninguém
> preenche. Registrar repetição durante o esforço nunca ia funcionar.

Por isso o registro migrou para o **descanso**: 90 segundos de tempo morto com as mãos livres. O
campo já chega preenchido com o alvo (`CAR-2`); você confirma ou corrige.

**`CAR-11.1`** Cronometrar a série habilita três métricas que antes não existiam: **tempo sob
tensão**, **duração média da série** e **aderência ao descanso**. Nenhuma exige sensor — todas caem
do próprio cronômetro.

**`CAR-11.2`** A duração da série anterior aparece na tela de execução. É a única informação em
tempo real que ajuda: serve de referência de ritmo.

**`CAR-11.3`** **Alvo de toque mínimo: 44 pt, sempre.** A regra da Série é 56 px nas linhas de série
(mão suada) e 44 pt é o piso absoluto de qualquer coisa clicável, ícone incluído.

📍 `tempoSobTensao()` e `duracaoMediaDaSerie()` em [`src/domain/forca.ts`](../src/domain/forca.ts)

---

## O modelo de domínio

```
Usuário
 ├─ Plano                  dias da semana, divisão
 │   └─ Treino (A, B, C)   nome, ordem
 │       └─ ItemDeTreino   exercício, nº de séries, faixa de reps, descanso
 ├─ Exercício              nome, padrão, grupo muscular, incremento de carga,
 │                         é composto?, unilateral?, unidade (kg / corporal)
 ├─ Sessão                 treino, início, fim, estado (aberta/fechada/abandonada)
 │   └─ SérieRegistrada    item, índice, reps, carga, foi alvo?, duração
 ├─ Recorde                exercício, 1RM estimado, sessão de origem
 └─ Preferências           unidade, descanso padrão, incrementos, lembrete
```

Três decisões escondidas aí que valem dizer em voz alta:

1. **`Exercicio` tem `padrao`, e é o que faz a `CAR-9` funcionar.** Sem isso, trocar de aparelho
   zera seu histórico e o app vira inútil em academia cheia.
2. **`SerieRegistrada` guarda `foiAlvo`.** É como o app aprende se as sugestões estão calibradas. Se
   80% das séries são corrigidas para baixo, o incremento está agressivo demais.
3. **`Sessao` tem estado.** Sem isso, você sai do app para atender o telefone e volta para a tela
   vazia. Ver `CAR-8`.

📍 [`src/domain/types.ts`](../src/domain/types.ts)
