import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Fundo } from '@/components/fundo';
import { LinhaDeAjuste } from '@/components/linha-de-ajuste';
import { TelaDeAba } from '@/components/tela-de-aba';
import { Texto } from '@/components/texto';
import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { formatarDataCsv, gerarCsv } from '@/domain/csv';
import { useHistorico } from '@/estado/historico';
import { compartilharCsv } from '@/lib/compartilhar-csv';
import { accent, font, hit, neutral, radius, size, space, surface } from '@/theme/tokens';

/**
 * Tela 21 · Perfil — ajustes e os dados da pessoa.
 *
 * Os ajustes de treino são SÓ LEITURA no CP5 (mockados, sem backend): mostram as regras
 * que o app já aplica — descanso da `CAR-6`, anilhas do catálogo. Por isso não têm chevron.
 * O que tem ação é real: exportar o histórico em CSV, apagar os dados e sair.
 *
 * ⚠️ "Apagar meus dados" confirma NA PRÓPRIA LINHA, não com `Alert.alert`: no
 * react-native-web o Alert não faz nada, e o botão pareceria quebrado no navegador.
 */
const PERFIL = { nome: 'João', objetivo: 'Hipertrofia' } as const;

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

type Aviso = 'exportado' | 'apagado' | 'erro' | 'vazio' | null;

export default function Perfil() {
  const { sessoes, carregado, restaurarFabrica } = useHistorico();
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  // Antes do AsyncStorage responder `sessoes` é []: "0 treinos" e um CSV vazio com aviso de
  // sucesso. Como no Hoje, melhor o canvas vazio por um instante do que um número errado.
  if (!carregado) return <Fundo />;

  const primeira = sessoes.reduce<number | null>((min, s) => (min === null || s.fimMs < min ? s.fimMs : min), null);
  const desde = primeira !== null ? ` desde ${MESES[new Date(primeira).getMonth()]}` : '';

  const exportar = async () => {
    // Sem nenhuma série o CSV seria só o cabeçalho: avisa em vez de "exportar" um arquivo vazio.
    if (sessoes.every((s) => s.series.length === 0)) {
      setAviso('vazio');
      return;
    }
    const csv = gerarCsv(sessoes, (id) => EXERCICIOS_POR_ID.get(id)?.nome ?? id);
    // Data local, não UTC: às 21h de 04/10 o `toISOString` já dizia dia 05.
    const hoje = formatarDataCsv(Date.now()).slice(0, 10);
    try {
      const exportou = await compartilharCsv(csv, `serie-historico-${hoje}.csv`);
      // Cancelou a folha de compartilhar (iOS): não houve exportação, então nada de aviso.
      setAviso(exportou ? 'exportado' : null);
    } catch {
      setAviso('erro');
    }
  };

  const apagar = () => {
    restaurarFabrica();
    setConfirmando(false);
    setAviso('apagado');
  };

  return (
    <TelaDeAba
      aba="perfil"
      rodape={
        <Texto papel="desc" cor={neutral.n400} style={estilos.versao}>
          Série. {Constants.expoConfig?.version ?? ''} · build de estudo
        </Texto>
      }
    >
      <View style={estilos.cabecalho}>
        <View style={estilos.avatar}>
          <Texto style={estilos.inicial}>{PERFIL.nome[0]}</Texto>
        </View>
        <View style={estilos.cabecalhoTexto}>
          <Texto papel="h2">{PERFIL.nome}</Texto>
          <Texto papel="desc">
            {sessoes.length} {sessoes.length === 1 ? 'treino' : 'treinos'}{desde}
          </Texto>
        </View>
      </View>

      <View>
        <Texto papel="eyebrow" style={estilos.tituloSecao}>Treino</Texto>
        <LinhaDeAjuste rotulo="Objetivo" valor={PERFIL.objetivo} />
        <LinhaDeAjuste rotulo="Unidade" valor="kg" />
        {/* Espaço fixo (U+00A0) dentro de cada item: em tela estreita o valor quebra entre os itens, nunca em "2 kg / halter". */}
        <LinhaDeAjuste rotulo="Descanso padrão" valor={'90\xa0s\xa0composto · 60\xa0s\xa0isolado'} />
        <LinhaDeAjuste rotulo="Incremento de carga" valor={'2,5\xa0kg · 5\xa0kg\xa0pernas · 2\xa0kg\xa0halter'} ultima />
      </View>

      <View>
        <Texto papel="eyebrow" style={estilos.tituloSecao}>Meus dados</Texto>
        <LinhaDeAjuste rotulo="Exportar meus dados" valor="CSV" onPress={exportar} />
        {confirmando ? (
          <View style={estilos.confirmacao}>
            <Texto papel="desc" cor={neutral.n200}>
              Apagar os treinos registrados? O histórico volta ao de fábrica e não dá para desfazer.
            </Texto>
            <View style={estilos.botoes}>
              <Pressable
                onPress={() => setConfirmando(false)}
                accessibilityRole="button"
                style={[estilos.botao, estilos.botaoNeutro]}
              >
                <Texto papel="corpo">Cancelar</Texto>
              </Pressable>
              <Pressable
                onPress={apagar}
                accessibilityRole="button"
                accessibilityLabel="Apagar meus dados de vez"
                style={[estilos.botao, estilos.botaoPerigo]}
              >
                <Texto papel="corpo" cor={neutral.n0}>Apagar</Texto>
              </Pressable>
            </View>
          </View>
        ) : (
          <LinhaDeAjuste
            rotulo="Apagar meus dados"
            onPress={() => {
              setAviso(null);
              setConfirmando(true);
            }}
            ultima
          />
        )}
        {aviso && (
          <Texto papel="desc" accessibilityLiveRegion="polite" style={estilos.aviso}>
            {aviso === 'exportado' && 'Histórico exportado.'}
            {aviso === 'apagado' && 'Dados apagados. O histórico voltou ao de fábrica.'}
            {aviso === 'erro' && 'Não deu para exportar agora. Tente de novo.'}
            {aviso === 'vazio' && 'Nada para exportar ainda: nenhum treino registrado.'}
          </Texto>
        )}
      </View>

      <Pressable
        // `dismissTo` volta à Abertura que já está na base da pilha (ela fez `push('/hoje')`);
        // o `replace` empilhava uma segunda. Sem ela na pilha (recarregou aqui), vira `replace`.
        onPress={() => router.dismissTo('/')}
        accessibilityRole="button"
        style={estilos.sair}
      >
        {/* Vermelho é SÓ ação destrutiva (tokens.accent.danger) — sair da conta é uma. */}
        <Texto papel="corpo" cor={accent.danger}>Sair da conta</Texto>
      </Pressable>
    </TelaDeAba>
  );
}

const AVATAR = 56;

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: space.s4, paddingTop: space.s2 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.full,
    backgroundColor: surface.overlay,
    borderWidth: 1,
    borderColor: surface.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: { fontFamily: font.display, fontSize: size.h2, color: neutral.n100 },
  cabecalhoTexto: { flex: 1, gap: 2 },
  tituloSecao: { marginBottom: space.s1 },
  confirmacao: { gap: space.s3, paddingVertical: space.s4 },
  botoes: { flexDirection: 'row', gap: space.s3 },
  botao: {
    flex: 1,
    minHeight: hit.min,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoNeutro: { backgroundColor: neutral.n700 },
  botaoPerigo: { backgroundColor: accent.danger },
  aviso: { paddingTop: space.s3 },
  sair: { alignSelf: 'flex-start', minHeight: hit.min, justifyContent: 'center' },
  versao: { textAlign: 'center', paddingVertical: space.s3 },
});
