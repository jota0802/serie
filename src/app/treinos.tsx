import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AvisoDeFormulario } from '@/components/aviso-de-formulario';
import { BotaoDeSeta } from '@/components/botao-de-seta';
import { Fundo } from '@/components/fundo';
import { Chevron } from '@/components/icones';
import { Mais } from '@/components/icones-de-edicao';
import { TelaDeAba } from '@/components/tela-de-aba';
import { Texto } from '@/components/texto';
import { definirDias, LIMITES, moverTreino, proximaLetraLivre, treinosEmOrdem, type Resultado } from '@/domain/edicao-plano';
import { proximoTreino } from '@/domain/historico';
import { dataRelativa, ultimaSessaoDe } from '@/domain/progresso';
import type { Treino } from '@/domain/types';
import { useHistorico } from '@/estado/historico';
import { usePerfil } from '@/estado/perfil';
import { font, hit, neutral, radius, size, space, surface } from '@/theme/tokens';

/**
 * Tela 17 · Meus treinos — as letras do plano, a ordem do rodízio e os dias da semana.
 *
 * Cada letra abre a 18 (Montar treino). "Último há 4 dias" e qual letra é a próxima saem do
 * histórico, não de campo guardado: é a mesma conta da tela Hoje (`proximoTreino`, RN-20), então
 * as duas nunca discordam — e mudar a ordem aqui muda o "próximo" na hora.
 *
 * Toda mudança passa por `src/domain/edicao-plano.ts` e vale assim que é tocada (`salvar` grava no
 * aparelho e sobe sozinho, RN-02): não há botão "salvar". Recusa do domínio vira frase na tela.
 *
 * Estética das abas (Início, Progresso): sem cartões — seções abertas com rótulo pequeno, linhas
 * com divisória fina e o fundo aparecendo. "+ Novo treino" é a última linha do rodízio, no lugar
 * onde o treino novo vai aparecer. Fora do Figma, de propósito: "Arquivados" (o plano apaga a
 * letra, RN-10 — o histórico dela fica).
 */

/** RN-23: a semana vai de domingo a sábado — a mesma ordem do `Date.getDay()` (0 = domingo). */
const DIAS = [
  { dia: 0, letra: 'D', nome: 'Domingo' },
  { dia: 1, letra: 'S', nome: 'Segunda' },
  { dia: 2, letra: 'T', nome: 'Terça' },
  { dia: 3, letra: 'Q', nome: 'Quarta' },
  { dia: 4, letra: 'Q', nome: 'Quinta' },
  { dia: 5, letra: 'S', nome: 'Sexta' },
  { dia: 6, letra: 'S', nome: 'Sábado' },
] as const;

// ⚠️ `as Href`: /montar/* é rota nova e o `.expo/types` (gerado pelo dev server) pode não conhecê-la.
const NOVO_TREINO = '/montar/escolher?novo=1' as Href;
const rotaDoTreino = (letra: string) => `/montar/${letra}` as Href;

type Aviso = { onde: 'ordem' | 'dias'; texto: string } | null;

export default function Treinos() {
  const { sessoes, carregado } = useHistorico();
  const { perfil, salvar } = usePerfil();
  const [aviso, setAviso] = useState<Aviso>(null);
  // Relógio lido UMA vez, na montagem: render tem que ser puro (react-hooks/purity), e
  // "há 4 dias" não muda enquanto a tela está aberta.
  const [agora] = useState(() => Date.now());

  const plano = perfil.plano;
  // Antes do AsyncStorage responder `sessoes` é []: o A destacado como próximo e "nunca feito"
  // em toda letra, trocando em seguida. A tela inteira espera, como o Hoje — canvas vazio.
  if (!carregado || !plano || plano.treinos.length === 0) return <Fundo />;

  const treinos = treinosEmOrdem(plano);
  const proximo = proximoTreino(sessoes, treinos).id;
  const meta = plano.dias.length;

  const aplicar = (resultado: Resultado, onde: 'ordem' | 'dias') => {
    if (!resultado.ok) {
      setAviso({ onde, texto: resultado.motivo });
      return;
    }
    setAviso(null);
    salvar({ plano: resultado.plano });
  };

  // RN-16: o domínio recusa tirar o último dia ("Escolha pelo menos um dia de treino.").
  const alternarDia = (dia: number) => {
    const dias = plano.dias.includes(dia) ? plano.dias.filter((d) => d !== dia) : [...plano.dias, dia];
    aplicar(definirDias(plano, dias), 'dias');
  };

  return (
    <TelaDeAba titulo="Treinos" aba="treinos">
      {/* Os dias primeiro: é o que mais se ajusta na semana (viagem, plantão) e define a meta (RN-16). */}
      <View style={estilos.secao}>
        <Texto papel="eyebrow">Dias de treino</Texto>
        <View style={estilos.dias}>
          {DIAS.map(({ dia, letra, nome }) => {
            const marcado = plano.dias.includes(dia);
            return (
              <Pressable
                key={dia}
                onPress={() => alternarDia(dia)}
                accessibilityRole="checkbox"
                accessibilityLabel={nome}
                accessibilityState={{ checked: marcado }}
                style={estilos.dia}
              >
                {({ pressed }) => (
                  <View style={[estilos.bolinha, marcado && estilos.bolinhaMarcada, pressed && !marcado && estilos.pressionado]}>
                    <Texto style={[estilos.letraDoDia, marcado && estilos.letraDoDiaMarcada]}>{letra}</Texto>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        {/* RN-16: a meta semanal é a quantidade de dias — o Início e o Progresso contam por ela. */}
        <Texto papel="desc" cor={neutral.n400}>
          Meta: {meta} {meta === 1 ? 'treino' : 'treinos'} por semana
        </Texto>
        <AvisoDeFormulario>{aviso?.onde === 'dias' ? aviso.texto : null}</AvisoDeFormulario>
      </View>

      <View style={estilos.secao}>
        <Texto papel="eyebrow">Rodízio</Texto>
        <View>
          {treinos.map((treino, i) => {
            const ultima = ultimaSessaoDe(sessoes, treino.id);
            return (
              <LinhaDoTreino
                key={treino.id}
                treino={treino}
                proximo={treino.id === proximo}
                quando={ultima ? `último ${dataRelativa(ultima.fimMs, agora)}` : 'nunca feito'}
                primeiro={i === 0}
                ultimo={i === treinos.length - 1}
                aoAbrir={() => router.push(rotaDoTreino(treino.id))}
                aoMover={(direcao) => aplicar(moverTreino(plano, treino.id, direcao), 'ordem')}
              />
            );
          })}
          {/* RN-10: até 6 letras. No limite a linha some e a tela diz por quê. */}
          {proximaLetraLivre(plano) !== null ? (
            <Pressable
              onPress={() => router.push(NOVO_TREINO)}
              accessibilityRole="button"
              accessibilityLabel="Novo treino"
              style={({ pressed }) => [estilos.linhaDeAcao, estilos.semDivisoria, pressed && estilos.pressionado]}
            >
              <Mais tamanho={18} cor={neutral.n200} />
              <Texto papel="corpo" cor={neutral.n200}>Novo treino</Texto>
            </Pressable>
          ) : (
            <Texto papel="desc" cor={neutral.n400} style={estilos.limite}>
              O plano já tem {LIMITES.treinos.max} treinos, o máximo. Para criar outro, apague um.
            </Texto>
          )}
        </View>
        <AvisoDeFormulario>{aviso?.onde === 'ordem' ? aviso.texto : null}</AvisoDeFormulario>
      </View>

      {/* As três perguntas de novo (06–09): troca o plano inteiro; o histórico fica. */}
      <Pressable
        onPress={() => router.push('/montagem')}
        accessibilityRole="button"
        accessibilityHint="Responde de novo as três perguntas e troca o plano inteiro. O histórico continua."
        style={({ pressed }) => [estilos.linhaDeAcao, estilos.refazer, pressed && estilos.pressionado]}
      >
        <View style={estilos.textos}>
          <Texto papel="corpo">Refazer o plano do zero</Texto>
          <Texto papel="desc" cor={neutral.n400}>As três perguntas de novo. O histórico continua.</Texto>
        </View>
        <Chevron />
      </Pressable>
    </TelaDeAba>
  );
}

/**
 * Uma letra do plano, em LINHA aberta (sem cartão, como as listas do Progresso): as setas à
 * esquerda mudam a ordem do rodízio, e o resto da linha abre a 18.
 * Irmãos, não aninhados — na web o `Pressable` vira <button>, e <button> dentro de <button> quebra.
 */
function LinhaDoTreino({
  treino, proximo, quando, primeiro, ultimo, aoAbrir, aoMover,
}: {
  treino: Treino;
  proximo: boolean;
  quando: string;
  primeiro: boolean;
  ultimo: boolean;
  aoAbrir: () => void;
  aoMover: (direcao: -1 | 1) => void;
}) {
  const n = treino.itens.length;
  const exercicios = `${n} ${n === 1 ? 'exercício' : 'exercícios'}`;

  return (
    <View style={estilos.linha}>
      {/* A ordem do rodízio à ESQUERDA, por onde o polegar entra. Uma letra só não tem ordem. */}
      {!(primeiro && ultimo) && (
        <View style={estilos.ordem}>
          <BotaoDeSeta
            direcao="cima"
            desabilitado={primeiro}
            rotulo={`Subir o treino ${treino.id} no rodízio`}
            onPress={() => aoMover(-1)}
          />
          <BotaoDeSeta
            direcao="baixo"
            desabilitado={ultimo}
            rotulo={`Descer o treino ${treino.id} no rodízio`}
            onPress={() => aoMover(1)}
          />
        </View>
      )}
      <Pressable
        onPress={aoAbrir}
        accessibilityRole="button"
        accessibilityLabel={`Treino ${treino.id}, ${treino.nome}, ${exercicios}, ${quando}${proximo ? ', o próximo' : ''}`}
        accessibilityHint="Abre o treino para montar"
        style={({ pressed }) => [estilos.principal, pressed && estilos.pressionado]}
      >
        {/* A próxima letra é a tinta cheia — a mesma lógica da série feita: o que importa agora. */}
        <View style={[estilos.letra, proximo && estilos.letraProxima]}>
          <Texto style={[estilos.letraTexto, proximo && estilos.letraTextoProxima]}>{treino.id}</Texto>
        </View>
        <View style={estilos.textos}>
          <Texto papel="corpo" numberOfLines={1}>{treino.nome}</Texto>
          <Texto papel="desc" cor={neutral.n400} numberOfLines={2}>
            {exercicios} · {quando}{proximo ? ' · próximo' : ''}
          </Texto>
        </View>
        <Chevron />
      </Pressable>
    </View>
  );
}

/** O selo da letra e o dia da semana têm o mesmo tamanho: 40, dentro de um alvo de 44. */
const SELO = space.s6 + space.s2;

const estilos = StyleSheet.create({
  secao: { gap: space.s3 },
  // Linhas abertas com divisória fina, como as listas do Progresso.
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: surface.line,
  },
  ordem: { marginLeft: -space.s3, marginRight: space.s1 },
  principal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s4,
    minHeight: hit.row + space.s4,
    paddingVertical: space.s3,
  },
  pressionado: { backgroundColor: surface.rowActive },
  letra: {
    width: SELO,
    height: SELO,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: surface.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letraProxima: { backgroundColor: neutral.n100, borderColor: neutral.n100 },
  letraTexto: { fontFamily: font.display, fontSize: size.body, color: neutral.n100 },
  letraTextoProxima: { color: neutral.n1000 },
  textos: { flex: 1, gap: 2 },
  linhaDeAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    minHeight: hit.row,
    borderBottomWidth: 1,
    borderBottomColor: surface.line,
  },
  // A última linha do rodízio ("+ Novo treino") não leva divisória: a próxima seção já abre com uma.
  semDivisoria: { borderBottomWidth: 0 },
  limite: { paddingVertical: space.s3 },
  refazer: { borderTopWidth: 1, borderTopColor: surface.line, paddingVertical: space.s3 },
  // Os 7 dias numa linha. Em tela estreita (320) o alvo cede um pouco; de 360 para cima é 44.
  dias: { flexDirection: 'row', justifyContent: 'space-between' },
  dia: { flexBasis: hit.min, flexShrink: 1, height: hit.min, alignItems: 'center', justifyContent: 'center' },
  bolinha: {
    width: SELO,
    height: SELO,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: surface.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Dia de treino = tinta cheia, o mesmo "escolhido" dos chips do app.
  bolinhaMarcada: { backgroundColor: neutral.n100, borderColor: neutral.n100 },
  letraDoDia: { fontFamily: font.display, fontSize: size.body, color: neutral.n300 },
  letraDoDiaMarcada: { color: neutral.n1000 },
});
