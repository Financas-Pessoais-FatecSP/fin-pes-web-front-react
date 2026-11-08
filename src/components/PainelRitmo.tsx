import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ROTULO_PERIODO,
  formatarDataCurta,
  gerarInsights,
  nomeObjetivo,
  rotuloRealizado,
  type Ritmo,
} from '../utils/objetivos';
import { BadgeRitmo, BarraRitmo } from './IndicadoresRitmo';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Painel de um único objetivo (limite ou meta): barra, números, gráfico e insights. */
export default function PainelRitmo({ ritmo }: { ritmo: Ritmo }) {
  const { objetivo } = ritmo;
  const insights = gerarInsights(ritmo);

  const nomeSerie =
    objetivo.tipo === 'limite'
      ? 'Gasto'
      : objetivo.base === 'ganhos'
        ? 'Ganho'
        : 'Guardado';

  const numeros = [
    { rotulo: rotuloRealizado(objetivo), valor: moeda(ritmo.realizado) },
    { rotulo: 'Esperado até hoje', valor: moeda(ritmo.esperado) },
    { rotulo: 'Projeção no fim', valor: moeda(ritmo.projecao) },
    { rotulo: 'Dias restantes', valor: String(ritmo.diasRestantes) },
  ];

  return (
    <article className="rounded-2xl border border-forest-200 bg-white p-5 shadow-sm md:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-forest-950">
          {nomeObjetivo(objetivo)} · {ROTULO_PERIODO[objetivo.periodo]}
        </h2>
        <BadgeRitmo ritmo={ritmo} />
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {moeda(objetivo.valor)} · {formatarDataCurta(ritmo.inicio)} a{' '}
        {formatarDataCurta(ritmo.fim)}
      </p>

      <BarraRitmo ritmo={ritmo} className="mt-6" />
      <p className="mt-2 text-xs text-gray-500">
        A marca vertical mostra quanto era esperado até hoje.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {numeros.map((item) => (
          <div key={item.rotulo}>
            <dt className="text-xs font-medium text-gray-500">{item.rotulo}</dt>
            <dd className="mt-1 text-lg font-bold text-forest-950">
              {item.valor}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={ritmo.serie}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="dia"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              width={64}
              tick={{ fontSize: 12 }}
              tickFormatter={(valor) =>
                Number(valor).toLocaleString('pt-BR', { notation: 'compact' })
              }
            />
            <Tooltip formatter={(valor) => moeda(Number(valor))} />
            <Legend />
            <Line
              type="monotone"
              dataKey="ideal"
              name="Esperado"
              stroke="#9ca3af"
              strokeDasharray="6 4"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="projecao"
              name="Projeção"
              stroke="#f59e0b"
              strokeDasharray="2 4"
              dot={false}
              strokeWidth={2}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="real"
              name={nomeSerie}
              stroke="var(--color-forest-700, #2f6f4e)"
              dot={false}
              strokeWidth={3}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {insights.length > 0 && (
        <ul className="mt-6 space-y-2 rounded-xl bg-forest-100/60 p-4 text-sm text-forest-900">
          {insights.map((texto) => (
            <li key={texto}>{texto}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
