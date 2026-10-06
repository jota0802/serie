import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AvisoDeFormulario } from './aviso-de-formulario';
import { BotaoLiso } from './botao-liso';
import { CampoComUnidade } from './campo-com-unidade';
import { AcaoDestrutiva, ConfirmacaoDestrutiva } from './confirmacao-destrutiva';
import { falaDaSerie, lerNumero, textoDaCarga, textoDaSerie } from './formato-do-historico';
import { Texto } from './texto';
import type { SerieRegistrada } from '@/domain/types';
import { font, hit, neutral, space, surface } from '@/theme/tokens';

/**
 * Uma série de um treino concluído — e a correção dela NA PRÓPRIA LINHA (RN-40 a RN-42).
 *
 * Fechada, é a linha "1ª · 10 × 40 kg", e a linha inteira é o alvo de toque (`hit.row`, como toda
 * linha de série do app). Aberta, vira os campos de reps e carga (o <CampoComUnidade> da montagem:
 * um só idioma de input no app), com Salvar e Cancelar; e o "Tirar esta série", que pergunta antes.
 *
 * Quem decide é o domínio (`corrigirSerie` / `removerSerie`): a tela só mostra o motivo da recusa
 * na linha, neutro como todo aviso de formulário — errar um número não é ação destrutiva.
 */
export interface SerieCorrigivelProps {
  /** 1 para a 1ª série do exercício neste treino. */
  ordinal: number;
  serie: SerieRegistrada;
  corporal: boolean;
  /** O nome do exercício, para a pergunta de tirar e para o leitor de tela. */
  exercicio: string;
  aberta: boolean;
  aoAbrir: () => void;
  aoFechar: () => void;
  /** Aplica a correção. Devolve o motivo da recusa, ou nulo se corrigiu. */
  aoSalvar: (correcao: { reps?: number; cargaKg?: number }) => string | null;
  aoTirar: () => void;
  /** RN-42: por que esta série não sai sozinha (é a única do treino), ou nulo se pode sair. */
  bloqueioAoTirar: string | null;
}

export function SerieCorrigivel(props: SerieCorrigivelProps) {
  const { ordinal, serie, corporal, exercicio, aberta, aoAbrir } = props;
  if (aberta) return <Correcao {...props} />;
  return (
    <Pressable
      onPress={aoAbrir}
      accessibilityRole="button"
      accessibilityLabel={`${ordinal}ª série de ${exercicio}: ${falaDaSerie(serie, corporal)}`}
      accessibilityHint="Abre a correção desta série"
      style={({ pressed }) => [estilos.linha, pressed && estilos.pressionada]}
    >
      <Texto papel="desc" style={estilos.ordinal}>{ordinal}ª</Texto>
      <Texto papel="corpo" numberOfLines={1} style={estilos.valor}>{textoDaSerie(serie, corporal)}</Texto>
    </Pressable>
  );
}

function Correcao({ ordinal, serie, exercicio, aoFechar, aoSalvar, aoTirar, bloqueioAoTirar }: SerieCorrigivelProps) {
  // Os campos nascem com o que está gravado — a carga EXATA, não a arredondada da linha.
  const [repsIniciais] = useState(() => String(serie.reps));
  const [cargaInicial] = useState(() => textoDaCarga(serie.cargaKg));
  const [reps, setReps] = useState(repsIniciais);
  const [carga, setCarga] = useState(cargaInicial);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [tirando, setTirando] = useState(false);

  const salvar = () => {
    // Só vai para a correção o campo que mudou: Salvar sem mexer em nada não regrava a carga
    // nem tira o `foiAlvo` da série (RN-41).
    setMotivo(
      aoSalvar({
        ...(reps !== repsIniciais ? { reps: lerNumero(reps) } : {}),
        ...(carga !== cargaInicial ? { cargaKg: lerNumero(carga) } : {}),
      }),
    );
  };

  if (tirando) {
    return (
      <View style={estilos.correcao}>
        <ConfirmacaoDestrutiva
          pergunta={`Tirar a ${ordinal}ª série de ${exercicio.toLowerCase()}?`}
          detalhe="Não dá para desfazer."
          acao="Tirar"
          rotuloDaAcao={`Tirar a ${ordinal}ª série`}
          aoConfirmar={aoTirar}
          aoCancelar={() => setTirando(false)}
        />
      </View>
    );
  }

  return (
    <View style={estilos.correcao}>
      {/* Salvar e Cancelar EM CIMA dos campos: o teclado numérico do iOS não tem "OK", e o sistema
          rola só até o cursor — embaixo dos campos, os dois ficariam atrás do teclado. */}
      <View style={estilos.topo}>
        <Texto papel="eyebrow" numberOfLines={1} style={estilos.titulo}>{ordinal}ª série</Texto>
        <BotaoLiso onPress={aoFechar}>Cancelar</BotaoLiso>
        <BotaoLiso variante="tinta" onPress={salvar} rotuloDeAcessibilidade={`Salvar a ${ordinal}ª série`}>
          Salvar
        </BotaoLiso>
      </View>

      <View style={estilos.campos}>
        <View style={estilos.campo}>
          <CampoComUnidade
            rotulo="Repetições"
            unidade="reps"
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
            autoFocus
            returnKeyType="done"
            onSubmitEditing={salvar}
            accessibilityLabel="Repetições"
          />
        </View>
        <View style={estilos.campo}>
          <CampoComUnidade
            rotulo="Carga"
            unidade="kg"
            value={carga}
            onChangeText={setCarga}
            // Vírgula aceita: é o teclado decimal do aparelho em português.
            keyboardType="decimal-pad"
            maxLength={7}
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={salvar}
            accessibilityLabel="Carga em quilos"
          />
        </View>
      </View>

      <AvisoDeFormulario>{motivo}</AvisoDeFormulario>

      {bloqueioAoTirar ? (
        <Texto papel="desc">{bloqueioAoTirar}</Texto>
      ) : (
        <AcaoDestrutiva onPress={() => setTirando(true)}>Tirar esta série</AcaoDestrutiva>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  // 56, não 44: é linha de série — mão suada, e a correção costuma vir ainda na academia.
  // Sem recuo lateral: o detalhe do treino é aberto (sem cartão), a linha vai de borda a borda do texto.
  linha: {
    minHeight: hit.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    borderTopWidth: 1,
    borderTopColor: surface.line,
  },
  pressionada: { backgroundColor: surface.rowActive },
  ordinal: { minWidth: 28, color: neutral.n300 },
  valor: { flex: 1, fontFamily: font.textMedium },
  correcao: {
    gap: space.s3,
    paddingHorizontal: space.s4,
    paddingVertical: space.s4,
    borderTopWidth: 1,
    borderTopColor: surface.line,
    backgroundColor: surface.rowActive,
  },
  topo: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  // O rótulo cede (corta) antes dos botões, em tela estreita.
  titulo: { flex: 1 },
  campos: { flexDirection: 'row', gap: space.s3 },
  campo: { flex: 1 },
});
