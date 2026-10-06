# Manual de uso — Série.

> Para quem vai usar o app. Cada seção é um caminho completo, do toque inicial ao resultado. As
> regras por trás de cada comportamento estão em [`regras.md`](regras.md) (treino, `CAR-*`) e
> [`regras-do-app.md`](regras-do-app.md) (app, `RN-*`).

---

## 1. Instalar

**Android (APK):** baixe o APK pelo link do README, abra o arquivo no celular e permita
"instalar de fontes desconhecidas" quando o Android pedir. O app aparece como **Série.**

**Para desenvolver:** `npm install` e `npm start` (Expo Go no celular, `a` para o emulador
Android, `w` para o navegador). O `.env` do repositório já aponta para o Supabase do projeto.

## 2. Criar a conta e montar o plano

1. Na abertura, toque em **Montar meu treino**.
2. **Criar conta:** nome, e-mail e senha (mínimo 8 caracteres). Precisa de internet só agora.
3. **Três perguntas** (cerca de 30 segundos):
   - **06 · Medidas:** o peso é o que importa (define a carga de partida); idade e altura são
     opcionais.
   - **07 · Dias por semana:** de 2 a 6. Define a divisão — 2 dias: corpo inteiro A/B; 3 ou mais:
     A/B/C em rodízio — e os dias da semana, que você muda depois na aba Treinos.
   - **08 · Objetivo:** hipertrofia, força ou condicionamento. Define as faixas de repetições; nos
     exercícios compostos, 8–12, 4–6 ou 12–15.
4. **09 · Seu plano:** confira as letras e os exercícios e toque em **Usar este plano**.

As cargas do plano são de **partida** e conservadoras. Na primeira semana você corrige no descanso
o que estiver leve ou pesado; daí em diante o app ajusta sozinho.

Já tem conta? **Já tenho conta → Entrar.** Esqueceu a senha? **Esqueci minha senha** manda um link
por e-mail que abre a tela **Nova senha** no app.

## 3. O Início

A primeira tela depois do login responde duas perguntas:

- **O que eu faço hoje?** A letra do dia (a próxima do rodízio), os exercícios com o alvo de cada
  um e o que mudou desde a última vez ("Supino reto sobe para 52,5 kg"). Quer outra letra hoje?
  Toque nela nos círculos A/B/C. Dia de descanso no seu plano? O app avisa, e **Treinar mesmo
  assim** continua funcionando.
- **Como está minha constância?** O **heatmap do ano**: cada quadrado é um dia, mais claro quanto
  mais séries; **amarelo é dia de recorde**. Toque num dia para ver os treinos dele (e abrir cada
  um). Junto do heatmap: as semanas seguidas na meta.

No topo, numa linha só: a data, quantos treinos da meta da semana você já fez ("2 de 3 na semana")
e quando é o próximo.

## 4. Treinar

1. **Começar treino** → **Treino ativo:** o exercício, a carga de hoje (o número grande) e as
   séries. "Subiu de 50 kg · você fechou a faixa" explica por que a carga subiu.
2. **Iniciar série** → a tela inteira vira o cronômetro da série. **Durante a série não mexa no
   celular.** Terminou? Toque em qualquer lugar.
3. **Descanso:** o cronômetro do descanso corre, e embaixo estão **reps** e **carga** já
   preenchidas com o alvo. Fez o que estava escrito? Não mexa em nada. Fez diferente? Use **−** e
   **+** (ou toque no número para digitar). **Pular descanso** segue para a próxima série; **+30 s**
   estica o descanso. Quando o descanso acaba, a série é registrada sozinha.
4. Repita até o fim — ou toque no **X** do topo:
   - **Terminar e salvar** guarda o que você fez (vale para o histórico e o rodízio);
   - **Descartar treino** joga fora (pede confirmação);
   - **Continuar treinando** volta.
5. **Aparelho ocupado?** No Treino ativo, **Trocar exercício** oferece variações do mesmo padrão de
   movimento e do mesmo grupo. Na primeira vez numa variação a carga vem **estimada** (e a tela
   diz isso).

Saiu do app no meio do treino? Ao voltar, ele continua na mesma série — por até 6 horas.

## 5. O resumo

No fim do treino:

- **Os números:** minutos, séries, repetições e tempo sob tensão.
- **O que evoluiu:** em quantos exercícios você subiu carga ou repetições.
- **Recordes**, em amarelo: o melhor 1RM estimado de cada exercício que você superou.
- **Na próxima vez:** o que bater em cada exercício no próximo treino ("55 kg × 4 ↑").
- **Sua semana** e quando é o próximo treino.

Errou um número? **Corrigir uma série** abre o treino no histórico.

## 6. Editar o plano (aba Treinos)

- **Dias de treino:** toque nos dias da semana. A meta semanal é a quantidade de dias.
- **Rodízio:** as setas ↑ ↓ à esquerda mudam a ordem das letras. Toque numa letra para montar.
- **Montar treino:** renomeie o treino; toque num exercício para ajustar **séries, faixa de
  repetições, carga e descanso**; **Trocar** substitui o exercício (o catálogo abre no mesmo padrão
  de movimento); as setas mudam a ordem; **Remover** tira.
- **+ Adicionar exercício** abre o catálogo com busca e filtro por padrão de movimento.
- **+ Novo treino** cria uma letra nova (até 6).
- **Refazer o plano do zero** repete as três perguntas. O histórico continua.

Mudanças no plano valem **a partir do próximo treino** — o treino em andamento segue como começou.

## 7. Histórico e progresso (aba Progresso)

- **Progresso:** treinos por semana (nas últimas 4 semanas, 3 meses ou desde o começo), as séries
  por grupo muscular nos últimos 7 dias contra a faixa de 10 a 20 (o grupo mais abaixo dela é o
  que você está esquecendo) e os recordes recentes.
- **Histórico de treinos:** todos os treinos, por mês. Abra um para ver as séries.
  - **Corrigir:** toque numa série, ajuste reps e carga e toque em **Salvar**.
  - **Tirar esta série** ou **Apagar treino:** pedem confirmação.
  - Recordes e progresso se recalculam na hora.

## 8. Perfil

- **Exportar meus dados:** o histórico inteiro em CSV, que abre no Excel em português.
- **Apagar meu histórico:** apaga no aparelho e na nuvem (pede confirmação; precisa de internet).
- **Sair da conta.**
- O topo diz **"Tudo salvo na nuvem"** ou quantos treinos ainda esperam conexão.

## 9. Sem internet

Academia é subsolo, então o app foi feito para isso:

- tudo que você faz vale **na hora**, no celular;
- o que ainda não subiu aparece como **aguardando conexão** e sobe sozinho quando a rede volta;
- trocar de celular não perde nada: entre com a mesma conta e o histórico desce da nuvem.
