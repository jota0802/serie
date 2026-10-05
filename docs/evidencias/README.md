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

## O que fica para o CP6

| Falta | Por quê |
|---|---|
| vídeo do app final e print do APK instalado num aparelho | "APK instalável e funcional" vale **20%** da nota do CP6 |
| app rodando no **emulador do Android Studio** | para o CP5 o navegador cumpre o enunciado; no CP6 o APK roda no Android de verdade |

## Como reproduzir

```bash
npm install
npm run web
```

Com o navegador aberto em `localhost:8081`, ative o modo dispositivo (F12 → ícone de celular) e
escolha um aparelho de 390 × 844. O caminho é: **Montar meu treino → Começar treino → Iniciar série
→ tocar na tela → Pular descanso**, repetindo até o resumo. No segundo exercício, **Trocar
exercício** abre a tela 16.

Para apagar o histórico e voltar aos dados de fábrica: **Perfil → Apagar meus dados**.

Para o emulador do Android Studio: abra um AVD, rode `npm start` e pressione `a`.

## Sugestão de roteiro para um vídeo curto

O enunciado aceita print **ou** vídeo, e não define roteiro. Se o grupo quiser gravar, em **40 a 60
segundos** cobre os itens da avaliação (navegação, telas e fluxo; simulação funcionando):

1. a Abertura → **Montar meu treino** → o **Hoje**: o alvo veio da regra, não de um valor fixo (6 s)
2. **Começar treino** → a carga que subiu (5 s)
3. **Iniciar série** → o cronômetro → tocar para encerrar (8 s)
4. o descanso com os campos **já preenchidos**; corrigir um número (8 s)
5. no 2º exercício, **Trocar exercício** → escolher a variação → a carga estimada (10 s)
6. pular para o fim (ou mostrar o resumo já pronto) → o **Resumo** (6 s)
7. **Fechar** → o Hoje já no **B**; passar pelas abas Progresso, Treinos e Perfil (10 s)

Sem áudio e sem edição resolve. Guarde aqui como `cp5-video.mp4` se couber no limite de 100 MB do
GitHub; se não couber, suba no Drive e ponha o link no README.
