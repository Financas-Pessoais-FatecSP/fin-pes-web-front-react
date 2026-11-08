import { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useListas } from '../contexts/ListasContext';
import type { Lista } from '../utils/listas';
import {
  ROTULO_FILTRO,
  calcularIndicadores,
  type FiltroPeriodo,
} from '../utils/indicadores';
import type { CategoriaGasto } from '../utils/objetivos';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CORES = [
  '#2f6f4e',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#14b8a6',
  '#ec4899',
];
const COR_OUTRAS = '#9ca3af';
const MAX_FATIAS = 6;

function agruparOutras(categorias: CategoriaGasto[]): CategoriaGasto[] {
  if (categorias.length <= MAX_FATIAS) return categorias;

  const principais = categorias.slice(0, MAX_FATIAS - 1);
  const resto = categorias.slice(MAX_FATIAS - 1);

  return [
    ...principais,
    { nome: 'Outras', valor: resto.reduce((total, c) => total + c.valor, 0) },
  ];
}

function Rosca({
  titulo,
  dados,
  vazio,
}: {
  titulo: string;
  dados: CategoriaGasto[];
  vazio: string;
}) {
  const fatias = agruparOutras(dados);
  const total = fatias.reduce((soma, fatia) => soma + fatia.valor, 0);
  const cor = (indice: number, nome: string) =>
    nome === 'Outras' ? COR_OUTRAS : CORES[indice % CORES.length];

  return (
    <article className="rounded-2xl border border-forest-200 bg-white p-5 shadow-sm md:p-6">
      <h3 className="font-semibold text-forest-950">{titulo}</h3>

      {fatias.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">{vazio}</p>
      ) : (
        <>
          <div className="mt-4 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fatias}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {fatias.map((fatia, indice) => (
                    <Cell key={fatia.nome} fill={cor(indice, fatia.nome)} />
                  ))}
                </Pie>
                <Tooltip formatter={(valor) => moeda(Number(valor))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-2 space-y-2">
            {fatias.map((fatia, indice) => (
              <li
                key={fatia.nome}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2 text-forest-900">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cor(indice, fatia.nome) }}
                    aria-hidden="true"
                  />
                  {fatia.nome}
                </span>
                <span className="text-gray-500">
                  {moeda(fatia.valor)} ·{' '}
                  {Math.round((fatia.valor / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}

export default function AbaDashboard({ lista }: { lista: Lista }) {
  const { listas } = useListas();
  const [filtro, setFiltro] = useState<FiltroPeriodo>('tudo');

  const indicadores = calcularIndicadores(lista, listas, filtro);

  const cartoes = [
    {
      rotulo: 'Receitas',
      valor: moeda(indicadores.receitas),
      classe: 'text-forest-700',
    },
    {
      rotulo: 'Despesas',
      valor: moeda(indicadores.despesas),
      classe: 'text-red-600',
    },
    {
      rotulo: 'Saldo',
      valor: moeda(indicadores.saldo),
      classe: indicadores.saldo >= 0 ? 'text-forest-700' : 'text-red-600',
    },
    {
      rotulo: 'Taxa de poupança',
      valor:
        indicadores.taxaPoupanca === null
          ? '—'
          : `${Math.round(indicadores.taxaPoupanca * 100)}%`,
      detalhe: 'Parte do que entrou que sobrou',
    },
    {
      rotulo: 'Média diária de gastos',
      valor: moeda(indicadores.mediaDiariaGastos),
    },
    {
      rotulo: 'Maior despesa',
      valor: indicadores.maiorDespesa
        ? moeda(indicadores.maiorDespesa.valor)
        : '—',
      detalhe: indicadores.maiorDespesa?.nome,
    },
    {
      rotulo: 'Maior receita',
      valor: indicadores.maiorReceita
        ? moeda(indicadores.maiorReceita.valor)
        : '—',
      detalhe: indicadores.maiorReceita?.nome,
    },
    { rotulo: 'Lançamentos', valor: String(indicadores.quantidade) },
  ];

  const agrupamento = {
    dia: 'por dia',
    semana: 'por semana',
    mes: 'por mês',
  }[indicadores.agrupamento];

  return (
    <div className="mt-8 space-y-6">
      <div
        role="group"
        aria-label="Período do dashboard"
        className="flex flex-wrap gap-2"
      >
        {(Object.keys(ROTULO_FILTRO) as FiltroPeriodo[]).map((opcao) => (
          <button
            key={opcao}
            type="button"
            aria-pressed={filtro === opcao}
            onClick={() => setFiltro(opcao)}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
              filtro === opcao
                ? 'bg-forest-900 text-white'
                : 'bg-white text-forest-800 ring-1 ring-forest-200 hover:bg-forest-100'
            }`}
          >
            {ROTULO_FILTRO[opcao]}
          </button>
        ))}
      </div>

      {indicadores.quantidade === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-forest-300 px-6 py-12 text-center">
          <p className="font-semibold text-forest-900">
            Nenhum lançamento neste período
          </p>
          <p className="mt-2 text-sm text-forest-700">
            Adicione lançamentos ou escolha outro período para ver os gráficos.
          </p>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {cartoes.map((cartao) => (
              <div
                key={cartao.rotulo}
                className="rounded-2xl border border-forest-200 bg-white p-4 shadow-sm"
              >
                <dt className="text-xs font-medium text-gray-500">
                  {cartao.rotulo}
                </dt>
                <dd
                  className={`mt-2 text-xl font-bold ${cartao.classe ?? 'text-forest-950'}`}
                >
                  {cartao.valor}
                </dd>
                {cartao.detalhe && (
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {cartao.detalhe}
                  </p>
                )}
              </div>
            ))}
          </dl>

          <article className="rounded-2xl border border-forest-200 bg-white p-5 shadow-sm md:p-6">
            <h3 className="font-semibold text-forest-950">Entradas e saídas</h3>
            <p className="text-xs text-gray-500">
              {agrupamento[0].toUpperCase() + agrupamento.slice(1)}, com o saldo
              acumulado no período.
            </p>

            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={indicadores.fluxo}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="rotulo"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    width={64}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(valor) =>
                      Number(valor).toLocaleString('pt-BR', {
                        notation: 'compact',
                      })
                    }
                  />
                  <Tooltip formatter={(valor) => moeda(Number(valor))} />
                  <Legend />
                  <Bar
                    dataKey="receitas"
                    name="Receitas"
                    fill="var(--color-forest-600, #3f8f62)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="despesas"
                    name="Despesas"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldoAcumulado"
                    name="Saldo acumulado"
                    stroke="var(--color-forest-950, #0f2a1d)"
                    strokeWidth={3}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </article>

          <div className="grid gap-6 md:grid-cols-2">
            <Rosca
              titulo="Despesas por categoria"
              dados={indicadores.categoriasDespesa}
              vazio="Sem despesas neste período."
            />
            <Rosca
              titulo="Receitas por categoria"
              dados={indicadores.categoriasReceita}
              vazio="Sem receitas neste período."
            />
          </div>
        </>
      )}
    </div>
  );
}
