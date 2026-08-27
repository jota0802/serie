# Ideia de venda — Série.

> Checkpoint 4 · como o app se sustenta e por que ele ganha dos que já existem
> Versão 1.0 — agosto de 2026

---

## 1. O pitch em trinta segundos

> Quem treina sem personal anota a carga no bloco de notas e esquece. Os apps que existem ou são
> catálogo de exercício — que some na hora que importa — ou são planilha com skin, que te faz
> digitar tudo do zero e morre na segunda semana.
>
> A **Série.** faz a única coisa que nenhum deles faz: **ela chega com o campo preenchido.** Abre
> sabendo qual é o treino de hoje, qual carga você tem que botar e quantas repetições tem que
> fazer — porque ela lembra do que você fez da última vez e sobe a carga sozinha quando você fecha
> a faixa.
>
> E quando o aparelho está ocupado — que é a interrupção número um de qualquer academia cheia —
> ela te oferece a variação do **mesmo padrão de movimento** e leva o seu histórico junto. Nenhum
> app do mercado faz isso.

## 2. Diferencial competitivo

### O concorrente real não é um app

É o **bloco de notas do celular** e a planilha do Google. É onde o público-alvo está hoje: zero
atrito para escrever, e zero inteligência. Ganhar dele não é ter mais recurso — é ter **menos
digitação**. Essa é a régua do produto.

### E os apps de verdade

| Concorrente | O que é | Onde a Série ganha |
|---|---|---|
| **Hevy** | log de treino com camada social: feed, amigos, curtidas | o feed não te diz o que bater hoje. A Série troca a rede social pela prescrição (`CAR-1` + `CAR-2`) |
| **Strong** | log de treino, referência da categoria | tem histórico, mas **quem decide a progressão é você**. Na Série a carga sobe sozinha ao fechar o topo da faixa |
| **JEFIT** e similares | catálogo grande de exercícios + log | conteúdo é o que sobra no mercado. Some no momento que importa: entre uma série e outra |
| **FitNotes** | log minimalista, gratuito | é o mais próximo da nossa tese, e ainda assim é registro puro: campo vazio toda vez |
| **Bloco de notas / Sheets** | o que o público usa hoje | ganha em atrito, perde em tudo o mais. É o alvo real |

> 📌 **Para a apresentação:** conferir os preços e os limites do plano grátis de cada um na semana
> da entrega. Preço de assinatura muda, e citar número desatualizado na banca custa caro.

### A vantagem que é estrutural, não cosmética

Três coisas aqui **não são recurso a mais, são decisão de arquitetura** — e é isso que as torna
difíceis de copiar sem reescrever o produto:

1. **`CAR-9` — o histórico segue o padrão de movimento, não o aparelho.** Nos concorrentes o
   histórico é preso ao exercício. Trocar de aparelho zera o seu progresso. Para copiar isso, eles
   teriam que remodelar o banco de dados inteiro. Aparelho ocupado é o problema nº 1 da academia
   real e **nenhum app resolve**.
2. **`CAR-11` — a série é cronometrada e o registro acontece no descanso.** Durante o esforço
   ninguém toca no celular; qualquer campo ali é campo que ninguém preenche. Mover o registro para
   os 90 segundos de descanso — mãos livres — é o que torna o "um toque" possível. E dá de graça
   três métricas **sem sensor nenhum**: tempo sob tensão, duração média da série e aderência ao
   descanso.
3. **`CAR-10` — tudo é auto-declarado, e a gente assume isso.** Sem sensor não existe verificação,
   então não existe ranking global nem selo de "verificado". A competição é contra a sua última
   sessão. Isso não é limitação disfarçada: é o que sustenta a honestidade do número.

## 3. Modelo de negócio

### A restrição que define o modelo

**O produto só prova o valor dele depois de mais ou menos seis semanas** — que é quando a dupla
progressão fecha o segundo ciclo e a pessoa percebe que a carga subiu sem ela ter decidido nada.
Duas consequências, e as duas são regra:

- **Cobrar antes disso mata a conversão.** A pessoa ainda não viu o app funcionar.
- **Limitar função no plano grátis quebra o produto.** Um caderno de treino que só deixa registrar
  três exercícios não é um caderno de treino — é uma demo, e demo se desinstala.

Por isso o corte **não é entre funções**. É entre **registrar** e **entender**.

### Freemium, com o corte no lugar certo

| | **Série** (grátis, para sempre) | **Série Pro** |
|---|---|---|
| Treinos e exercícios | ilimitados | ilimitados |
| Registro de séries | ilimitado | ilimitado |
| Dupla progressão `CAR-1` | ✅ completa | ✅ |
| Troca por padrão `CAR-9` | ✅ completa | ✅ |
| Cronômetro e descanso | ✅ | ✅ |
| Recorde de 1RM | ✅ | ✅ |
| Histórico | últimos **90 dias** | **ilimitado** |
| Volume semanal por grupo `CAR-4` | — | ✅ |
| Gráficos de evolução por exercício | — | ✅ |
| Exportar CSV | — | ✅ |
| Múltiplos planos (ex. bulk / cut) | 1 plano ativo | ✅ |
| Backup e sincronia entre aparelhos | — | ✅ |

**O ciclo completo de treinar é grátis para sempre.** O que se paga é o que o histórico *revela*
depois que ele existe — e ele só existe se o app for bom o bastante para você usar por três meses.

**O paywall aparece no dia 90**, que é exatamente o dia em que ele começa a valer alguma coisa. Não
antes.

### Preço

| Plano | Preço | Observação |
|---|---|---|
| Mensal | **R$ 14,90** | |
| Anual | **R$ 89,90** | equivale a R$ 7,49/mês — 50% de desconto |

Posicionamento: **abaixo dos concorrentes internacionais, e em real.** Hevy e Strong cobram
assinatura cotada em dólar; para o público brasileiro isso é uma barreira que não tem nada a ver
com o produto. Preço em real, sem conversão, é argumento de venda por si só.

### Por que não anúncio

Foi considerado e **descartado**, por dois motivos concretos:

1. **A tela da execução é o app.** Ela é preta, com um número de 120 px e nada mais — porque é lida
   com o celular apoiado no banco, entre séries. Anúncio ali destrói exatamente a coisa que faz o
   produto funcionar.
2. **A impressão vale pouco.** O usuário está com as mãos ocupadas e a atenção no próximo set. É o
   pior contexto possível para publicidade, e o CPM refletiria isso.

### O que a arquitetura faz pelo negócio

O app é **offline-first** — decisão tomada por um motivo físico (academia é subsolo, não tem sinal).
Mas ela tem uma consequência econômica que vale dizer em voz alta:

> **Toda a inteligência do app roda no celular.** A dupla progressão, o 1RM estimado, o volume
> semanal — tudo é função pura sobre dados locais. O servidor só guarda backup, e só para quem
> paga.

Ou seja: **o usuário gratuito custa perto de zero.** Não há inferência de modelo, não há chamada de
API por série registrada, não há tráfego. Isso é o que permite manter o plano grátis generoso sem
que ele afunde o projeto — e é o oposto de qualquer app que dependa de IA no servidor.

## 4. Como o app se sustenta — os números

### Custo para colocar de pé

| Item | Custo | Frequência |
|---|---|---|
| Google Play Console | US$ 25 ≈ **R$ 135** | uma vez, para sempre |
| Apple Developer Program | US$ 99 ≈ **R$ 535** | por ano *(opcional: o CP6 só exige APK)* |
| Supabase | **R$ 0** | plano grátis cobre bem além do nosso volume inicial |
| EAS Build (Expo) | **R$ 0** | plano grátis atende o ritmo do projeto |
| **Ano 1, só Android** | **≈ R$ 135** | |
| **Ano 1, Android + iOS** | **≈ R$ 670** | |

*Câmbio de referência ≈ R$ 5,40/US$ — reconferir na semana da entrega.*

### Ponto de equilíbrio

Descontada a taxa das lojas (30% no primeiro ano; **15%** depois disso, e 15% desde o início pelos
programas para desenvolvedor pequeno), a assinatura anual líquida fica em torno de **R$ 76**.

| Cenário | Assinantes anuais para pagar o ano |
|---|---|
| Só Android | **2** |
| Android + iOS | **9** |

O número é baixo de propósito, e a leitura correta dele é esta: **o custo real deste produto não é
dinheiro, é tempo de desenvolvimento.** O modelo de negócio não precisa ser agressivo porque a
operação é barata — o que precisa ser bom é a retenção.

### Se crescer

| Instalações | Conversão | Assinantes | Receita líquida/mês | Custo/mês | Sobra |
|---|---|---|---|---|---|
| 1.000 | 3% | 30 | ≈ R$ 380 | ≈ R$ 240 | ≈ R$ 140 |
| 10.000 | 3% | 300 | ≈ R$ 3.800 | ≈ R$ 240 | ≈ R$ 3.560 |

*3% é uma conversão conservadora para app de nicho com plano grátis generoso. O custo/mês passa a
existir quando o volume ultrapassa o plano grátis do Supabase e do EAS Build (≈ US$ 25 + US$ 19).*

### Caminhos que existem, mas ficam fora do MVP

Ficam registrados porque são a continuação natural — e porque dizer o que **não** vamos fazer agora
é o que mantém o escopo em pé:

- **B2B para academias.** A academia tem interesse direto no `CAR-9` (aparelho ocupado é problema
  dela também). Licenciar por unidade é uma receita maior e mais estável — e exige uma operação de
  vendas que não cabe num semestre.
- **Personal trainer monta, o aluno acompanha.** É onde apps deste tipo ganham dinheiro de verdade.
  Não contradiz a tese: o personal prescreve, o app continua dizendo o que bater hoje.

## 5. A pergunta que decide o projeto

> **Alguém do grupo usa a Série por seis semanas seguidas, sem que a gente peça?**

Antes disso é preparação. Depois disso é otimização. Nenhuma métrica de download importa antes
dessa resposta.
