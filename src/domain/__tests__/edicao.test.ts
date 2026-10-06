import { EXERCICIOS_POR_ID } from '@/data/exercicios';
import { sessoesDeFabrica } from '@/data/historico';
import {
  adicionarExercicio, adicionarTreino, atualizarExercicio, definirDias, descreverItem, itemPadrao, moverExercicio, moverTreino,
  problemasDoPlano, proximaLetraLivre, removerExercicio, removerTreino, renomearTreino, treinosEmOrdem, trocarExercicio, type Resultado,
} from '@/domain/edicao-plano';
import { corrigirSerie, removerSerie } from '@/domain/historico';
import { gerarPlano, type Plano } from '@/domain/plano';
import { novaSessao, registrarSerie, sessaoParaRestaurar, terminarAgora } from '@/domain/sessao';

const plano = gerarPlano({ pesoKg: 80, diasPorSemana: 3, objetivo: 'hipertrofia' }, EXERCICIOS_POR_ID);
const exige = (r: Resultado): Plano => {
  if (!r.ok) throw new Error(r.motivo);
  return r.plano;
};
const motivo = (r: Resultado) => (r.ok ? null : r.motivo);
const supinoMaquina = EXERCICIOS_POR_ID.get('supino-maquina')!;

describe('RN-10 a RN-19 · editar o plano', () => {
  it('RN-18 · exercício novo entra com a prescrição do objetivo e a carga de partida pelo peso', () => {
    expect(itemPadrao(supinoMaquina, { objetivo: 'forca', pesoKg: 80 })).toMatchObject({ series: 5, faixa: { min: 4, max: 6 } });
    expect(itemPadrao(EXERCICIOS_POR_ID.get('barra-fixa')!, { objetivo: null, pesoKg: null })).toMatchObject({ cargaKg: 0 });
  });

  it('RN-12 · adiciona no fim, sem repetir exercício no mesmo treino', () => {
    const novo = exige(adicionarExercicio(plano, 'A', itemPadrao(supinoMaquina, { objetivo: 'hipertrofia', pesoKg: 80 })));
    expect(novo.treinos[0].itens.at(-1)!.exercicioId).toBe('supino-maquina');
    expect(motivo(adicionarExercicio(novo, 'A', itemPadrao(supinoMaquina, { objetivo: null, pesoKg: 80 })))).toMatch(/já está/);
  });

  it('RN-12 · no máximo 12 exercícios; o último não sai (apague o treino)', () => {
    let p = plano;
    const extras = ['supino-maquina', 'flexao', 'paralelas', 'rosca-scott', 'triceps-testa', 'crucifixo-inverso', 'elevacao-lateral'];
    for (const id of extras) p = exige(adicionarExercicio(p, 'A', itemPadrao(EXERCICIOS_POR_ID.get(id)!, { objetivo: null, pesoKg: 80 })));
    expect(p.treinos[0].itens).toHaveLength(12);
    expect(motivo(adicionarExercicio(p, 'A', itemPadrao(EXERCICIOS_POR_ID.get('prancha')!, { objetivo: null, pesoKg: 80 })))).toMatch(/12/);

    let um = plano;
    while (um.treinos[0].itens.length > 1) um = exige(removerExercicio(um, 'A', 0));
    expect(motivo(removerExercicio(um, 'A', 0))).toMatch(/pelo menos um/);
  });

  it('mover exercício troca de lugar com o vizinho; nas pontas não faz nada', () => {
    const p = exige(moverExercicio(plano, 'A', 0, 1));
    expect(p.treinos[0].itens.slice(0, 2).map((i) => i.exercicioId)).toEqual(['supino-inclinado-halter', 'supino-reto-barra']);
    expect(exige(moverExercicio(plano, 'A', 0, -1))).toEqual(plano);
  });

  it('RN-13/14/15 · cada número tem limite, e a carga cai no passo de 0,5 kg', () => {
    expect(motivo(atualizarExercicio(plano, 'A', 0, { series: 11 }))).toMatch(/1 a 10/);
    expect(motivo(atualizarExercicio(plano, 'A', 0, { faixa: { min: 12, max: 8 } }))).toMatch(/mínimo/);
    expect(motivo(atualizarExercicio(plano, 'A', 0, { cargaKg: -5 }))).toMatch(/Carga/);
    expect(exige(atualizarExercicio(plano, 'A', 0, { cargaKg: 42.3 })).treinos[0].itens[0].cargaKg).toBe(42.5);
    expect(exige(atualizarExercicio(plano, 'A', 0, { descansoSegundos: 100 })).treinos[0].itens[0].descansoSegundos).toBe(105);
    expect(motivo(atualizarExercicio(plano, 'A', 0, { descansoSegundos: 10 }))).toMatch(/Descanso/);
    const semDescanso = exige(atualizarExercicio(exige(atualizarExercicio(plano, 'A', 0, { descansoSegundos: 90 })), 'A', 0, { descansoSegundos: null }));
    expect(semDescanso.treinos[0].itens[0].descansoSegundos).toBeUndefined();
  });

  it('RN-11 · nome de 1 a 30 caracteres, sem espaço sobrando', () => {
    expect(exige(renomearTreino(plano, 'A', '  Peito   pesado ')).treinos[0].nome).toBe('Peito pesado');
    expect(motivo(renomearTreino(plano, 'A', '   '))).toMatch(/nome/);
    expect(motivo(renomearTreino(plano, 'A', 'x'.repeat(31)))).toMatch(/30/);
  });

  it('RN-10 · treino novo pega a primeira letra livre; apagar o B não renomeia o C', () => {
    const semB = exige(removerTreino(plano, 'B'));
    expect(treinosEmOrdem(semB).map((t) => t.id)).toEqual(['A', 'C']);
    expect(proximaLetraLivre(semB)).toBe('B');
    const comNovo = exige(adicionarTreino(semB, 'Ombro', itemPadrao(supinoMaquina, { objetivo: null, pesoKg: 80 })));
    expect(treinosEmOrdem(comNovo).map((t) => `${t.id}:${t.nome}`)).toEqual(['A:Peito e tríceps', 'C:Pernas e ombro', 'B:Ombro']);
  });

  it('RN-10 · no máximo 6 treinos, e o último não pode ser apagado', () => {
    let p = plano;
    for (let i = 0; i < 3; i++) p = exige(adicionarTreino(p, '', itemPadrao(supinoMaquina, { objetivo: null, pesoKg: 80 })));
    expect(p.treinos.map((t) => t.id)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(motivo(adicionarTreino(p, 'G', itemPadrao(supinoMaquina, { objetivo: null, pesoKg: 80 })))).toMatch(/máximo/);
    let um = plano;
    um = exige(removerTreino(um, 'A'));
    um = exige(removerTreino(um, 'B'));
    expect(motivo(removerTreino(um, 'C'))).toMatch(/pelo menos um/);
  });

  it('mover treino muda o rodízio', () => {
    expect(treinosEmOrdem(exige(moverTreino(plano, 'C', -1))).map((t) => t.id)).toEqual(['A', 'C', 'B']);
  });

  it('RN-16 · dias de treino: únicos, em ordem, pelo menos um', () => {
    expect(exige(definirDias(plano, [5, 1, 3, 1])).dias).toEqual([1, 3, 5]);
    expect(motivo(definirDias(plano, []))).toMatch(/pelo menos um/);
  });

  it('o plano gerado não tem problema nenhum; e o rótulo do item é o da tela', () => {
    expect(problemasDoPlano(plano, EXERCICIOS_POR_ID)).toEqual([]);
    expect(descreverItem(plano.treinos[0].itens[0], EXERCICIOS_POR_ID.get('supino-reto-barra'))).toBe('4 × 8–12 · 40 kg');
    expect(descreverItem(plano.treinos[1].itens[0], EXERCICIOS_POR_ID.get('barra-fixa'))).toBe('4 × 8–12 · peso do corpo');
  });
});

describe('RN-40 a RN-43 · corrigir o histórico', () => {
  const [s] = sessoesDeFabrica(new Date(2026, 9, 5, 21).getTime());

  it('corrige reps e carga, e a série perde o foiAlvo (RN-41)', () => {
    const r = corrigirSerie(s, 0, { reps: 7, cargaKg: 72.5 });
    if (!r.ok) throw new Error(r.motivo);
    expect(r.sessao.series[0]).toMatchObject({ reps: 7, cargaKg: 72.5, foiAlvo: false });
    expect(r.sessao.series.slice(1)).toEqual(s.series.slice(1));
  });

  it('sem mudança devolve a mesma sessão; número inválido é recusado', () => {
    const igual = corrigirSerie(s, 0, { reps: s.series[0].reps });
    expect(igual.ok && igual.sessao).toBe(s);
    expect(corrigirSerie(s, 0, { reps: 2.5 }).ok).toBe(false);
    expect(corrigirSerie(s, 0, { cargaKg: 2000 }).ok).toBe(false);
  });

  it('tirar uma série renumera as do mesmo exercício; a única não sai (RN-42)', () => {
    const r = removerSerie(s, 0);
    if (!r.ok) throw new Error(r.motivo);
    const doExercicio = r.sessao.series.filter((x) => x.exercicioId === s.series[0].exercicioId);
    expect(doExercicio.map((x) => x.indice)).toEqual(doExercicio.map((_, i) => i));
    const unica = { ...s, series: [s.series[0]] };
    expect(removerSerie(unica, 0).ok).toBe(false);
  });
});

describe('RN-17 e RN-30 · a sessão em andamento', () => {
  const A = plano.treinos[0];

  it('RN-17 · guarda a versão do treino de quando começou, e ela volta do disco', () => {
    const s = novaSessao('A', 1000, A);
    expect(s.treino).toEqual(A);
    expect(sessaoParaRestaurar(JSON.stringify(s), 2000)?.treino).toEqual(A);
  });

  it('RN-30 · terminar antes salva o que foi feito; sem série nenhuma, descarta', () => {
    const vazia = novaSessao('A', 1000, A);
    expect(terminarAgora(vazia, 5000)).toBeNull();
    const umaSerie = registrarSerie(vazia, A, 10, 40, { reps: 8, cargaKg: 40 }, 2000);
    const terminada = terminarAgora(umaSerie, 5000)!;
    expect(terminada.fimMs).toBe(5000);
    expect(terminada.registradas).toHaveLength(1);
  });
});

describe('RN-12a · trocar um exercício no plano', () => {
  const comDescanso = exige(atualizarExercicio(plano, 'A', 0, { series: 5, faixa: { min: 6, max: 10 }, descansoSegundos: 120 }));
  const halter = itemPadrao(EXERCICIOS_POR_ID.get('supino-reto-halter')!, { objetivo: 'hipertrofia', pesoKg: 80 });

  it('mantém séries, faixa e descanso; a carga recomeça pela de partida do novo', () => {
    const trocado = exige(trocarExercicio(comDescanso, 'A', 0, halter)).treinos[0].itens[0];
    expect(trocado).toEqual({ exercicioId: 'supino-reto-halter', series: 5, faixa: { min: 6, max: 10 }, cargaKg: halter.cargaKg, descansoSegundos: 120 });
  });

  it('não troca por um exercício que já está no treino; trocar por ele mesmo não muda nada', () => {
    const inclinado = itemPadrao(EXERCICIOS_POR_ID.get('supino-inclinado-halter')!, { objetivo: null, pesoKg: 80 });
    expect(motivo(trocarExercicio(plano, 'A', 0, inclinado))).toMatch(/já está/);
    expect(exige(trocarExercicio(plano, 'A', 0, plano.treinos[0].itens[0]))).toEqual(plano);
  });
});
