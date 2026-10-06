import { router, Stack, type Href } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Objetivo, RespostasDaMontagem } from '@/domain/plano';
import { usePerfil, type Perfil } from '@/estado/perfil';
import { formatarKg } from '@/lib/formato';
import { motion, neutral } from '@/theme/tokens';

/**
 * Telas 06–09 · a montagem do plano. Três perguntas (medidas, dias por semana, objetivo) e o
 * plano que sai delas, que só vale quando a pessoa aceita na 09.
 *
 * As respostas moram AQUI, num contexto do grupo, enquanto se anda entre as telas: nada vai para
 * o perfil antes do "Usar este plano", e sair da montagem pelo voltar descarta o rascunho.
 *
 * Pré-preenchida pelo perfil (o Perfil oferece "refazer o plano"): o estado guarda só o que a
 * pessoa MUDOU, e o resto é lido do perfil a cada render. Derivar em vez de copiar: o perfil que
 * chega depois (a nuvem respondendo) entra sozinho, sem efeito copiando um estado no outro.
 */

/** As rotas do grupo. ⚠️ `as Href`: o `.expo/types` vem do dev server, fora do git, e pode não conhecê-las. */
export const ROTAS_DA_MONTAGEM = {
  medidas: '/montagem' as Href,
  dias: '/montagem/dias' as Href,
  objetivo: '/montagem/objetivo' as Href,
  plano: '/montagem/plano' as Href,
};

/** O que vem marcado na 07 e na 08 para quem responde pela primeira vez (o "recomendado" do Figma). */
export const DIAS_RECOMENDADOS = 4;
export const OBJETIVO_RECOMENDADO: Objetivo = 'hipertrofia';

/**
 * Os limites da 06 são os `check` da tabela `perfis` (migração inicial). Fora deles o upsert
 * falharia em silêncio e o perfil ficaria "pendente" para sempre, então a tela nem deixa passar.
 */
const PESO_KG = { min: 25, max: 300 };
const IDADE = { min: 12, max: 100 };
const ALTURA_CM = { min: 100, max: 250 };

/** Abaixo disso, a altura foi digitada em metros ("1,78"); acima, em centímetros ("178"). */
const LIMITE_DOS_METROS = 3;

/** O que a pessoa respondeu, como está na tela: os campos da 06 são TEXTO ("72,5"). */
export interface Rascunho {
  peso: string;
  idade: string;
  altura: string;
  diasPorSemana: number;
  objetivo: Objetivo;
}

interface Montagem {
  rascunho: Rascunho;
  mudar: (mudanca: Partial<Rascunho>) => void;
  /** Por que a 06 ainda não fecha, numa frase curta que cabe no botão. `null` quando fecha. */
  pendencia: string | null;
  /** As respostas prontas para o `gerarPlano`. `null` enquanto a 06 não fecha. */
  respostas: RespostasDaMontagem | null;
}

const MontagemContexto = createContext<Montagem | null>(null);

function ProvedorDaMontagem({ children }: { children: ReactNode }) {
  const { perfil } = usePerfil();
  const [mudado, setMudado] = useState<Partial<Rascunho>>({});

  const mudar = useCallback((mudanca: Partial<Rascunho>) => {
    setMudado((atual) => ({ ...atual, ...mudanca }));
  }, []);

  const rascunho = useMemo<Rascunho>(() => ({ ...rascunhoDoPerfil(perfil), ...mudado }), [perfil, mudado]);
  const leitura = useMemo(() => lerRascunho(rascunho), [rascunho]);

  const valor = useMemo(() => ({ rascunho, mudar, ...leitura }), [rascunho, mudar, leitura]);
  return <MontagemContexto.Provider value={valor}>{children}</MontagemContexto.Provider>;
}

export function useMontagem() {
  const ctx = useContext(MontagemContexto);
  if (!ctx) throw new Error('useMontagem precisa estar dentro do grupo /montagem');
  return ctx;
}

export default function LayoutDaMontagem() {
  return (
    <ProvedorDaMontagem>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: neutral.n1000 },
          // as perguntas são passos para a frente: deslizam da direita (o voltar desliza de volta)
          animation: 'slide_from_right',
          animationDuration: motion.sheet,
        }}
      />
    </ProvedorDaMontagem>
  );
}

/**
 * Voltar um passo. Aberta direto pela URL (recarregou no navegador no meio da montagem) não há
 * tela embaixo, e o `back` não faria nada: vai para a pergunta anterior.
 */
export function voltar(anterior: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(anterior);
}

/** A unidade que a 06 mostra colada na altura: a mesma regra que a leitura usa. */
export function unidadeDaAltura(texto: string): 'm' | 'cm' {
  const valor = lerNumero(texto);
  return valor !== null && valor >= LIMITE_DOS_METROS ? 'cm' : 'm';
}

function rascunhoDoPerfil(perfil: Perfil): Rascunho {
  return {
    peso: perfil.pesoKg != null ? formatarKg(perfil.pesoKg) : '',
    idade: perfil.idade != null ? String(perfil.idade) : '',
    // Em metros, como o Figma mostra ("1,78 m"); a leitura aceita os dois.
    altura: perfil.alturaCm != null ? (perfil.alturaCm / 100).toFixed(2).replace('.', ',') : '',
    diasPorSemana: perfil.diasPorSemana ?? DIAS_RECOMENDADOS,
    objetivo: perfil.objetivo ?? OBJETIVO_RECOMENDADO,
  };
}

/** "72,5" → 72.5. Vírgula ou ponto, e o separador no fim de quem ainda digita ("72,"). */
function lerNumero(texto: string): number | null {
  const limpo = texto.trim().replace(',', '.');
  return /^\d+(\.\d*)?$/.test(limpo) ? Number(limpo) : null;
}

const dentro = (valor: number | null, { min, max }: { min: number; max: number }): valor is number =>
  valor !== null && valor >= min && valor <= max;

function lerRascunho(r: Rascunho): Pick<Montagem, 'pendencia' | 'respostas'> {
  const peso = lerNumero(r.peso);
  // Uma casa, como o `numeric(5,1)` do banco: o que a tela confere é o que vai ser gravado.
  const pesoKg = peso === null ? null : Math.round(peso * 10) / 10;
  const idade = /^\d+$/.test(r.idade.trim()) ? Number(r.idade.trim()) : null;
  const altura = lerNumero(r.altura);
  const alturaCm = altura === null ? null : Math.round(altura < LIMITE_DOS_METROS ? altura * 100 : altura);

  const temIdade = r.idade.trim() !== '';
  const temAltura = r.altura.trim() !== '';

  let pendencia: string | null = null;
  if (r.peso.trim() === '') pendencia = 'Preencha o peso';
  else if (!dentro(pesoKg, PESO_KG)) pendencia = `Peso entre ${PESO_KG.min} e ${PESO_KG.max} kg`;
  else if (temIdade && !dentro(idade, IDADE)) pendencia = `Idade entre ${IDADE.min} e ${IDADE.max} anos`;
  else if (temAltura && !dentro(alturaCm, ALTURA_CM)) pendencia = 'Altura entre 1,00 e 2,50 m';

  if (pendencia !== null || pesoKg === null) return { pendencia, respostas: null };
  return {
    pendencia: null,
    respostas: {
      pesoKg,
      ...(temIdade && idade !== null ? { idade } : {}),
      ...(temAltura && alturaCm !== null ? { alturaCm } : {}),
      diasPorSemana: r.diasPorSemana,
      objetivo: r.objetivo,
    },
  };
}
