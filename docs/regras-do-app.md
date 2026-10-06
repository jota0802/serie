# Regras do app — Série.

> As regras de **treino** (`CAR-*`) estão em [`regras.md`](regras.md): dupla progressão, recorde,
> troca de exercício. Este documento tem as regras do **app**: conta, dados, plano, sessão,
> histórico e Início. Cada regra tem um número (`RN-xx`) que aparece no código, no comentário da
> função que a cumpre — e quase todas têm teste em `src/domain/__tests__/`.

---

## 1. Conta e dados (RN-01 a RN-06)

| | Regra | Por quê | Onde |
|---|---|---|---|
| **RN-01** | O app exige conta. O plano e o histórico são **da conta**, não do aparelho. | trocar de celular não pode perder o histórico | [`estado/auth.tsx`](../src/estado/auth.tsx), rotas protegidas em [`app/_layout.tsx`](../src/app/_layout.tsx) |
| **RN-02** | **Offline-first:** toda gravação vale primeiro no aparelho; a nuvem é cópia. O login precisa de internet **uma vez**; depois o app abre e treina sem rede. | academia é subsolo | [`estado/historico.tsx`](../src/estado/historico.tsx), [`estado/perfil.tsx`](../src/estado/perfil.tsx) |
| **RN-03** | O que ainda não subiu fica **pendente** e o app tenta sozinho (ao voltar para a frente, ao reconectar, a cada 30 s). O Perfil mostra quantos treinos aguardam conexão. | a pessoa precisa saber que o treino do subsolo não se perdeu | [`hooks/use-ao-reconectar.ts`](../src/hooks/use-ao-reconectar.ts) |
| **RN-04** | Sincronização sem duplicar: o treino tem id gerado no aparelho, então reenviar é idempotente; aparelho e nuvem são **mesclados** por id. O plano é um documento: vence a versão mais recente. | rede que cai no meio do envio não pode duplicar treino | [`lib/sincronizacao.ts`](../src/lib/sincronizacao.ts) |
| **RN-05** | Dados separados por conta também no aparelho: dois logins no mesmo celular não se misturam. | celular emprestado | chaves `serie:*:<usuário>` |
| **RN-06** | Senha de no mínimo 8 caracteres. Esqueceu: link por e-mail, que abre a tela **Nova senha** no app. | — | [`app/redefinir-senha.tsx`](../src/app/redefinir-senha.tsx) |

**Segurança.** O app usa só a chave **publicável** do Supabase. Quem protege os dados é a RLS do
banco: cada tabela só devolve e só aceita as linhas do usuário logado
([`supabase/migrations/`](../supabase/migrations/)).

## 2. O plano (RN-10 a RN-19)

O plano nasce das três perguntas da montagem (telas 06–09) e é **editável** (17, 18 e 19).

| | Regra |
|---|---|
| **RN-10** | De **1 a 6 treinos**, com letras de A a F. A letra é a identidade do treino: o histórico guarda "fiz o B", então apagar o B **não** renomeia o C — o próximo treino criado reusa a letra livre. |
| **RN-11** | Nome do treino: 1 a 30 caracteres. |
| **RN-12** | De **1 a 12 exercícios** por treino, sem repetir exercício no mesmo treino. Treino vazio não existe: o novo já nasce com o primeiro exercício, e o último exercício não sai (apaga-se o treino). |
| **RN-12a** | Trocar um exercício **no plano** (Montar treino → Trocar): o novo entra na mesma posição, com as mesmas séries, faixa e descanso; a carga recomeça pela de partida do novo, porque é outro exercício. Não troca por um que já está no treino. É diferente da `CAR-9`, a troca de aparelho durante o treino, que não mexe no plano. |
| **RN-13** | Séries de 1 a 10. Faixa de repetições de 1 a 50, com mínimo ≤ máximo. |
| **RN-14** | Carga de 0 a 1000 kg, em passos de 0,5 kg. |
| **RN-15** | Descanso por exercício de 30 s a 5 min, em passos de 15 s. Vazio = o padrão da `CAR-6` (90 s composto, 60 s isolado). |
| **RN-16** | Dias de treino: de 1 a 7 dias da semana. A **meta semanal** é a quantidade de dias. |
| **RN-17** | Editar o plano **não mexe** no histórico nem no treino em andamento — ele usa a versão da letra de quando começou. Vale a partir do próximo treino. |
| **RN-18** | Exercício novo entra com a prescrição do objetivo (séries e faixa) e a carga de partida pelo peso, como na montagem: o campo nunca chega vazio (`CAR-2`). |
| **RN-19** | A dupla progressão (`CAR-1`) segue o histórico **do exercício**: mudar a faixa ou a carga do plano muda o alvo da próxima vez, sem apagar nada do que foi feito. |

📍 [`src/domain/edicao-plano.ts`](../src/domain/edicao-plano.ts) — cada operação devolve o plano
novo ou o motivo da recusa; nenhuma deixa o plano inválido.

## 3. O rodízio e o dia (RN-20 a RN-23)

| | Regra |
|---|---|
| **RN-20** | A letra de hoje é a que vem **depois da última sessão concluída**, na ordem do plano. |
| **RN-21** | Se hoje não é dia de treino do plano, o Início diz que é dia de descanso — e deixa treinar mesmo assim. |
| **RN-22** | A pessoa pode escolher outra letra hoje. O rodízio segue a partir da que ela fez. |
| **RN-23** | A semana vai de domingo a sábado, no fuso do aparelho. |

## 4. A sessão de treino (RN-30 a RN-32)

| | Regra |
|---|---|
| **RN-30** | **Terminar antes do fim:** com pelo menos uma série registrada, o treino é salvo como está (conta para o rodízio e para o histórico; série que faltou não fecha faixa — `CAR-1`). Sem nenhuma série, é descartado. |
| **RN-31** | Uma sessão aberta por vez. Abrir o app com sessão aberta **retoma**, não recomeça — por até 6 h (`CAR-8`). |
| **RN-32** | Descartar um treino que já tem série registrada pede confirmação: jogar fora o que foi feito não pode ser um toque errado. |

📍 `terminarAgora()` e `novaSessao()` em [`src/domain/sessao.ts`](../src/domain/sessao.ts)

## 5. O histórico (RN-40 a RN-43)

| | Regra |
|---|---|
| **RN-40** | Um treino concluído pode ser **corrigido** (reps e carga de cada série, ou tirar uma série) ou **apagado**. Errar um número no descanso não pode envenenar a progressão para sempre. |
| **RN-41** | A série corrigida perde o `foiAlvo`: o que ficou registrado não era o alvo confirmado. |
| **RN-42** | A última série de um treino não sai sozinha: para isso, apaga-se o treino. |
| **RN-43** | Recorde, volume e "a última vez" são **derivados** das séries — nada é guardado à parte — então a correção vale na hora em todo o app, e sobe para a nuvem substituindo a versão antiga. |

📍 `corrigirSerie()` e `removerSerie()` em [`src/domain/historico.ts`](../src/domain/historico.ts)

## 6. O Início e o heatmap (RN-50 a RN-54)

A primeira tela depois do login. Responde, nesta ordem: **o que eu faço hoje?** e **como está a
minha constância?**

| | Regra |
|---|---|
| **RN-50** | O heatmap mostra **53 semanas**, de domingo a sábado; a última coluna é a semana de hoje, e os dias depois de hoje aparecem vazios — nunca como dia sem treino. |
| **RN-51** | A intensidade do dia é o **número de séries**, em faixas fixas: 0 · 1–8 · 9–15 · 16–24 · 25 ou mais. Fixas para serem auditáveis e não mudarem quando um treino gigante entra no histórico. |
| **RN-52** | Dia com **recorde** (`CAR-5`) é o quadrado inteiro em **ouro** — o único lugar de cor, como no resto do app. A primeira vez num exercício não é recorde: não havia o que bater. |
| **RN-53** | A sequência conta **semanas que bateram a meta**, não dias seguidos: na academia o descanso faz parte do treino, e "dias seguidos" puniria quem descansa. A semana atual só entra quando bate a meta, e não quebra a sequência antes disso. |
| **RN-54** | As datas são do fuso do aparelho: o treino das 23h de segunda é de segunda. |

📍 [`src/domain/calendario.ts`](../src/domain/calendario.ts)
