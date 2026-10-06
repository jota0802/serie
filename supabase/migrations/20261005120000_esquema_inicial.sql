-- Série — esquema inicial do CP6.
--
-- O celular continua sendo a fonte da verdade (offline-first: academia é subsolo). O banco é a
-- cópia na nuvem, por usuário, e é o que permite trocar de aparelho sem perder o histórico.
--
-- Duas formas de guardar, de propósito:
--   * o PLANO (as letras A/B/C e seus exercícios) é editado como um documento inteiro — na
--     montagem (telas 06–09) e no "Montar treino" (18) — então mora num jsonb do perfil e é
--     gravado de uma vez, sem estado intermediário;
--   * as SÉRIES são fatos imutáveis (o que você levantou em tal dia), então são linhas.
--     Recorde, tonelagem e "a última vez" NÃO são guardados: o app calcula a partir delas.
--
-- Segurança: RLS em todas as tabelas. A chave publicável do app só enxerga as linhas do
-- usuário logado (auth.uid()).

-- ---------------------------------------------------------------------------------------------
-- perfis: as respostas da montagem (06–08) e o plano gerado (09), um por usuário
-- ---------------------------------------------------------------------------------------------
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  -- 06: o peso é o único usado de verdade (exercícios com peso do corpo); idade e altura são opcionais
  peso_kg numeric(5, 1) check (peso_kg is null or peso_kg between 25 and 300),
  idade smallint check (idade is null or idade between 12 and 100),
  altura_cm smallint check (altura_cm is null or altura_cm between 100 and 250),
  -- 07 e 08
  dias_por_semana smallint check (dias_por_semana is null or dias_por_semana between 2 and 6),
  objetivo text check (objetivo is null or objetivo in ('hipertrofia', 'forca', 'condicionamento')),
  -- 09: { "dias": [1,2,4,5], "treinos": [{ "id": "A", "nome": ..., "ordem": 0, "itens": [...] }] }
  plano jsonb check (plano is null or jsonb_typeof(plano -> 'treinos') = 'array'),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.perfis is 'Respostas da montagem do plano e o plano A/B/C do usuário (documento jsonb).';

-- O perfil nasce junto com a conta, com o nome que a pessoa digitou na tela 03.
create function public.criar_perfil_da_conta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''));
  return new;
end;
$$;

create trigger ao_criar_conta
  after insert on auth.users
  for each row execute function public.criar_perfil_da_conta();

-- ---------------------------------------------------------------------------------------------
-- sessoes e series: o histórico. O id da sessão é gerado NO APARELHO ("sessao-<início em ms>"),
-- então reenviar a mesma sessão é idempotente (upsert) — é o que torna a fila offline segura.
-- ---------------------------------------------------------------------------------------------
create table public.sessoes (
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  treino_id text not null check (char_length(treino_id) between 1 and 8),
  inicio timestamptz not null,
  fim timestamptz not null check (fim >= inicio),
  enviada_em timestamptz not null default now(),
  primary key (usuario_id, id)
);

comment on table public.sessoes is 'Treinos terminados. Id gerado no aparelho: reenviar é idempotente.';

create table public.series (
  usuario_id uuid not null default auth.uid(),
  sessao_id text not null,
  -- a posição da série dentro da sessão, na ordem em que foi feita
  ordem smallint not null check (ordem >= 0),
  exercicio_id text not null check (char_length(exercicio_id) between 1 and 64),
  -- a posição dentro do exercício (1ª, 2ª série…), base 0
  indice smallint not null check (indice >= 0),
  reps smallint not null check (reps between 0 and 200),
  carga_kg numeric(6, 2) not null check (carga_kg between 0 and 1000),
  foi_alvo boolean not null default false,
  duracao_s smallint check (duracao_s is null or duracao_s between 0 and 3600),
  primary key (usuario_id, sessao_id, ordem),
  foreign key (usuario_id, sessao_id) references public.sessoes (usuario_id, id) on delete cascade
);

comment on table public.series is 'Cada série registrada: reps × carga. Recorde e tonelagem são calculados no app.';

create index series_por_exercicio on public.series (usuario_id, exercicio_id);

-- ---------------------------------------------------------------------------------------------
-- RLS: cada um só enxerga e mexe no que é seu
-- ---------------------------------------------------------------------------------------------
alter table public.perfis enable row level security;
alter table public.sessoes enable row level security;
alter table public.series enable row level security;

create policy "perfil: o dono lê" on public.perfis
  for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: o dono cria" on public.perfis
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "perfil: o dono altera" on public.perfis
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "sessões: o dono lê" on public.sessoes
  for select to authenticated using ((select auth.uid()) = usuario_id);
create policy "sessões: o dono grava" on public.sessoes
  for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy "sessões: o dono reenvia" on public.sessoes
  for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy "sessões: o dono apaga" on public.sessoes
  for delete to authenticated using ((select auth.uid()) = usuario_id);

create policy "séries: o dono lê" on public.series
  for select to authenticated using ((select auth.uid()) = usuario_id);
create policy "séries: o dono grava" on public.series
  for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy "séries: o dono reenvia" on public.series
  for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy "séries: o dono apaga" on public.series
  for delete to authenticated using ((select auth.uid()) = usuario_id);

-- A função do gatilho não deve ser chamável pela API.
revoke execute on function public.criar_perfil_da_conta() from public, anon, authenticated;
