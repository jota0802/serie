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

### CP5 — o app rodando

| Arquivo | O que mostra |
|---|---|
| [`fluxo-critico.png`](fluxo-critico.png) | as cinco telas do caminho crítico, lado a lado — é a imagem do README |
| [`10-hoje.png`](10-hoje.png) | tela 10 · Hoje, com o alvo calculado pela `CAR-1` |
| [`11-treino-ativo.png`](11-treino-ativo.png) | tela 11 · Treino ativo, com o aviso de carga que subiu |
| [`11b-series-fechadas.png`](11b-series-fechadas.png) | a mesma tela com duas séries já registradas |
| [`12-execucao.png`](12-execucao.png) | tela 12 · Execução, com o cronômetro da série correndo |
| [`13-descanso.png`](13-descanso.png) | tela 13 · Descanso, com os campos já preenchidos |
| [`14-resumo.png`](14-resumo.png) | tela 14 · Resumo, ao fim de um treino A completo (16 séries) |

Todos são capturas do app rodando de verdade — Expo + React Native Web, viewport de 390 × 844,
sem retoque. O resumo é o resultado de um treino inteiro percorrido tela a tela, com as 16 séries
registradas: os números (4.452 kg, 192 reps, o recorde no supino) saem das regras `CAR-*`, não de
um mock de tela.

## O que ainda falta capturar

| Checkpoint | Falta | Por quê |
|---|---|---|
| **CP5** | app rodando no **emulador do Android Studio** | o enunciado cita o emulador explicitamente, e "Simulação funcionando" vale **20%** da nota do CP5 |
| **CP5** | print do `npm test` verde no terminal | comprova o item "ambiente de teste configurado" (15%) |
| **CP6** | vídeo do app final e print do APK instalado num aparelho | "APK instalável e funcional" vale **20%** da nota do CP6 |

## Como reproduzir os prints

```bash
npm run web
```

Com o navegador aberto em `localhost:8081`, ative o modo dispositivo (F12 → ícone de celular) e
escolha um aparelho de 390 × 844. O caminho é: **Começar treino → Iniciar série → tocar na tela →
Pular descanso**, repetindo até o resumo.

Para o emulador do Android Studio: abra um AVD, rode `npm start` e pressione `a`.

## Sugestão de roteiro para o vídeo do CP5

Como o enunciado não define roteiro, o que rende nota é cobrir os itens da tabela de avaliação —
navegação, telas e fluxo (30%) e simulação funcionando (20%). Em **40 a 60 segundos**, gravando a
tela do emulador:

1. o app abrindo — splash e a tela **Hoje** (2 s)
2. o card *"o que o app já sabe"*: o alvo veio da regra, não de um valor fixo (5 s)
3. **Começar treino** → a tela do exercício com a carga que subiu (8 s)
4. **Iniciar série** → o cronômetro correndo → tocar para encerrar (10 s)
5. o descanso com os campos **já preenchidos** — corrigir um número para mostrar que é editável (10 s)
6. pular o descanso duas ou três vezes até fechar o exercício (8 s)
7. o **Resumo**, com a tonelagem e o recorde em ouro (7 s)

Sem áudio e sem edição resolve. Guarde o arquivo aqui como `cp5-emulador.mp4` se couber no limite
de 100 MB do GitHub; se não couber, suba no Drive e ponha o link no README.

Nomeie por checkpoint: `cp5-emulador.mp4`, `cp5-testes.png`, `cp6-apk-instalado.png`.
