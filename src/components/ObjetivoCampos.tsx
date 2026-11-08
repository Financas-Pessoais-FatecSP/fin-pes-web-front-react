import type { PeriodoTipo } from '../utils/listas';
import { ROTULO_PERIODO, type RascunhoObjetivo } from '../utils/objetivos';

type Props = {
  tipo: 'limite' | 'meta';
  valor: RascunhoObjetivo;
  onChange: (rascunho: RascunhoObjetivo) => void;
  idPrefix: string;
};

const BASES = [
  { id: 'ganhos', titulo: 'Ganhos', descricao: 'Conta só as receitas.' },
  {
    id: 'saldo',
    titulo: 'Saldo',
    descricao: 'Receitas menos despesas.',
  },
] as const;

const campo =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-forest-950 outline-none transition placeholder:text-gray-400 focus:border-forest-600 focus:ring-2 focus:ring-forest-500';

export default function ObjetivoCampos({
  tipo,
  valor,
  onChange,
  idPrefix,
}: Props) {
  const atualizar = <K extends keyof RascunhoObjetivo>(
    chave: K,
    novo: RascunhoObjetivo[K],
  ) => onChange({ ...valor, [chave]: novo });

  return (
    <div className="space-y-4">
      {tipo === 'meta' && (
        <div>
          <span className="mb-2 block text-sm font-semibold text-forest-950">
            A meta considera
          </span>
          <div className="grid gap-3 sm:grid-cols-2">
            {BASES.map((base) => (
              <button
                key={base.id}
                type="button"
                aria-pressed={valor.base === base.id}
                onClick={() => atualizar('base', base.id)}
                className={`cursor-pointer rounded-xl border p-3 text-left transition ${
                  valor.base === base.id
                    ? 'border-forest-700 bg-white ring-2 ring-forest-500'
                    : 'border-gray-300 bg-white hover:border-forest-400'
                }`}
              >
                <span className="block text-sm font-semibold text-forest-950">
                  {base.titulo}
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  {base.descricao}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${idPrefix}-valor`}
            className="mb-2 block text-sm font-semibold text-forest-950"
          >
            {tipo === 'limite' ? 'Valor do limite' : 'Valor da meta'}
          </label>
          <input
            id={`${idPrefix}-valor`}
            inputMode="decimal"
            value={valor.valor}
            onChange={(event) => atualizar('valor', event.target.value)}
            placeholder="Ex.: 1500,00"
            className={campo}
          />
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-periodo`}
            className="mb-2 block text-sm font-semibold text-forest-950"
          >
            Período
          </label>
          <select
            id={`${idPrefix}-periodo`}
            value={valor.periodo}
            onChange={(event) =>
              atualizar('periodo', event.target.value as PeriodoTipo)
            }
            className={campo}
          >
            {(Object.keys(ROTULO_PERIODO) as PeriodoTipo[]).map((periodo) => (
              <option key={periodo} value={periodo}>
                {ROTULO_PERIODO[periodo]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {valor.periodo === 'customizado' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`${idPrefix}-inicio`}
              className="mb-2 block text-sm font-semibold text-forest-950"
            >
              Início
            </label>
            <input
              id={`${idPrefix}-inicio`}
              type="date"
              value={valor.inicio}
              onChange={(event) => atualizar('inicio', event.target.value)}
              className={campo}
            />
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}-fim`}
              className="mb-2 block text-sm font-semibold text-forest-950"
            >
              Fim
            </label>
            <input
              id={`${idPrefix}-fim`}
              type="date"
              value={valor.fim}
              onChange={(event) => atualizar('fim', event.target.value)}
              className={campo}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500">
          O período {ROTULO_PERIODO[valor.periodo].toLowerCase()} se renova
          automaticamente.
        </p>
      )}
    </div>
  );
}
