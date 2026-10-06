# Evidências de entrega

O enunciado pede isso em dois lugares, e nos dois **print e vídeo são alternativas** — não é
obrigatório gravar vídeo:

> **CP5 — o que deve ser entregue:** *"Simulação via Android Studio (emulador) ou Navegador
> (execução do app rodando, com **print/vídeo** comprovando funcionamento)"*

> **Observações finais:** *"Apresentem sempre **prints ou vídeos curtos** de cada entrega como
> evidência de funcionamento."*

A única especificação sobre o vídeo é **"curto"**. Não há formato, duração nem roteiro exigidos.

## O que já está aqui

### CP4 — a identidade visual, exportada do Figma

| Arquivo | O que é |
|---|---|
| [`figma-capa.pdf`](figma-capa.pdf) | capa do arquivo do Design System |
| [`figma-fundacao.pdf`](figma-fundacao.pdf) | página Foundations — tokens, tipografia e elevação |
| [`figma-telas.pdf`](figma-telas.pdf) | overview do Figma — as 21 telas do protótipo |

As mesmas 21 telas em PNG, uma a uma, estão em [`../telas/`](../telas/).

### CP5 — o app rodando (simulação no navegador)

O enunciado aceita *"Simulação via Android Studio (emulador) **ou Navegador**"*. Estas são capturas
do app rodando de verdade em `npm run web` (Expo + React Native Web), viewport de celular 390 × 844,
sem retoque. Foram tiradas percorrendo o app como um usuário, em duas passadas do mesmo roteiro: um
treino A inteiro (16 séries), a página recarregada no meio do treino, o resumo e a volta ao Hoje. O
caminho crítico, o resumo e as abas são da passada **sem** troca; a 16 e a 11 depois da troca são da
passada **com** troca de aparelho no segundo exercício (nela o resumo sai diferente: o volume sobe,
porque a barra carrega mais que o halter). Os números saem das regras `CAR-*` sobre o histórico
salvo, não de um mock de tela.

| Arquivo | O que mostra |
|---|---|
| [`fluxo-critico.png`](fluxo-critico.png) | as cinco telas do caminho crítico, lado a lado — é a imagem do README |
| [`fluxo-apoio.png`](fluxo-apoio.png) | a troca de exercício, a carga estimada, o histórico do exercício, o progresso e o Hoje depois do treino |
| [`cp5-testes.png`](cp5-testes.png) | o `npm test` verde: 113 testes em 5 suítes |
| [`01-abertura.png`](01-abertura.png) … [`05-link-enviado.png`](05-link-enviado.png) | a entrada: abertura, entrar, criar conta, recuperar senha, link enviado |
| [`10-hoje.png`](10-hoje.png) | tela 10 · Hoje, com o alvo calculado pela `CAR-1` sobre o histórico |
| [`11-treino-ativo.png`](11-treino-ativo.png) | tela 11 · Treino ativo, com o aviso de carga que subiu |
| [`11b-series-fechadas.png`](11b-series-fechadas.png) | a mesma tela com duas séries já registradas |
| [`12-execucao.png`](12-execucao.png) | tela 12 · Execução, com o cronômetro da série correndo |
| [`13-descanso.png`](13-descanso.png) | tela 13 · Descanso, com os campos já preenchidos |
| [`14-resumo.png`](14-resumo.png) | tela 14 · Resumo, ao fim do treino A completo |
| [`10b-hoje-depois-do-treino.png`](10b-hoje-depois-do-treino.png) | o Hoje depois do treino: já propõe o B — o app aprendeu |
| [`16-trocar-exercicio.png`](16-trocar-exercicio.png) | tela 16 · Trocar exercício (`CAR-9`): só variações do mesmo padrão e grupo |
| [`11c-depois-da-troca.png`](11c-depois-da-troca.png) | a 11 depois da troca, com a carga estimada e declarada (`CAR-9.1`) |
| [`15-exercicio.png`](15-exercicio.png) | tela 15 · Exercício: recorde, últimas sessões e prescrição |
| [`17-meus-treinos.png`](17-meus-treinos.png) | tela 17 · Meus treinos |
| [`20-progresso.png`](20-progresso.png) | tela 20 · Progresso (`CAR-4`) |
| [`21-perfil.png`](21-perfil.png) | tela 21 · Perfil, com exportar CSV |

O que as passadas mediram, além dos prints:

- **a pilha de telas não cresce**: o histórico do navegador fica do mesmo tamanho nas 16 séries
  (antes ganhava uma tela por série);
- **recarregar a página no meio do treino** volta para a mesma série, com o que já foi registrado
  (`CAR-8`) — antes era tela preta sem saída;
- **o app aprende**: depois do resumo, o Hoje propõe o B, e continua no B depois de recarregar;
- **zero erro no console** do navegador.

## CP6 — o app final no Android

O APK sai do EAS Build e o link para instalar está no README, em
[Instalar o APK](../../README.md#instalar-o-apk). "APK instalável e funcional" vale **20%** da
nota do CP6. As capturas abaixo são do APK instalado no **emulador do Android Studio** (Pixel 9,
Android 16), logado numa conta de verdade, com os dados vindos do Supabase. As telas de entrada são
da 1.0.0 (não mudaram); o resto, da 1.0.1.

| Arquivo | O que mostra |
|---|---|
| [`cp6-apk-instalado.png`](cp6-apk-instalado.png) | as informações do app no Android: Série, versão 1.0.1, nenhuma permissão pedida |
| [`cp6-android-entrada.png`](cp6-android-entrada.png) | a Abertura, o Entrar e o Criar conta |
| [`cp6-android-treino.png`](cp6-android-treino.png) | o Início com o heatmap do ano, o treino ativo, a execução da série e o descanso |
| [`cp6-android-edicao.png`](cp6-android-edicao.png) | Meus treinos, Montar treino, um treino do histórico (corrigível) e o Progresso |
| [`apk-qr.png`](apk-qr.png) | o QR code do APK mais recente (Release `latest`): na apresentação, quem tiver Android instala na hora |

O que o passeio no emulador mediu, além dos prints:

- a 1.0.1 instalou **por cima** da 1.0.0 (versionCode 2) e o login continuou;
- abrir o app a frio leva **cerca de 1 s** (`am start -W`: de 0,96 a 1,46 s);
- **zero erro** no log do app (`logcat`), do login ao descanso;
- o treino começado para os prints foi **descartado** no fim: nada entrou no histórico.

O passeio também achou três ajustes, que viraram a 1.0.1: o rótulo "out" do heatmap cortado em
"ou" (o Android corta o que passa da grade), o total de kg ainda como destaque no treino do
histórico, e um aviso de "deprecated" da supabase-js no log.

Para reforçar, se o grupo quiser: um print num celular Android de verdade e o **vídeo curto**
(roteiro abaixo; guarde como `cp6-video.mp4` se couber nos 100 MB do GitHub, ou suba no Drive e
ponha o link no README). O `npm test` verde (248 testes em 16 suítes) está no README, em
[Ambiente de teste](../../README.md#ambiente-de-teste).

## Como reproduzir no Android Studio

1. Abra o Android Studio → **Device Manager** e ligue um emulador (aqui: Pixel 9, Android 16).
2. Arraste o `.apk` para a janela do emulador (ou `adb install serie.apk`).
3. Para desenvolver com o código, `npm start` e a tecla `a` abrem o app no mesmo emulador.

## Como reproduzir no navegador

```bash
npm install
npm run web
```

Com o navegador aberto em `localhost:8081`, ative o modo dispositivo (F12 → ícone de celular) e
escolha um aparelho de 390 × 844. Crie uma conta em **Montar meu treino**, responda as três
perguntas e toque em **Usar este plano**. Depois: **Começar treino → Iniciar série → tocar na tela
→ Pular descanso**, repetindo até o resumo. No segundo exercício, **Trocar exercício** abre a
tela 16.

Para começar o histórico do zero: **Perfil → Apagar meu histórico**.

## Roteiro para um vídeo curto (CP6)

O enunciado aceita print **ou** vídeo e não define roteiro. No celular com o APK, em **60 a 90
segundos**:

1. abrir a Série. → **Montar meu treino** → criar a conta (8 s)
2. as três perguntas → **Seu plano** → **Usar este plano** (12 s)
3. o **Início**: a letra do dia, o que mudou desde a última vez e o heatmap (6 s)
4. **Começar treino** → **Iniciar série** → tocar para encerrar → o descanso com os campos já
   preenchidos; corrigir um número (15 s)
5. **Trocar exercício** → escolher a variação → a carga estimada (8 s)
6. **X → Terminar e salvar** → o **Resumo**: o que evoluiu e o alvo da próxima vez (8 s)
7. de volta ao Início, o dia de hoje aceso no heatmap; aba **Treinos** → uma letra → **Trocar**
   um exercício (12 s)
8. **Progresso → Histórico de treinos** → abrir o treino → corrigir uma série (8 s)
9. **Perfil**: "Tudo salvo na nuvem" (4 s)

Sem áudio e sem edição resolve.
