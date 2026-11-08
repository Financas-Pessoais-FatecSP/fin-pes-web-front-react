import { rascunhoVazio, type RascunhosObjetivos } from '../utils/objetivos';
import ObjetivoCampos from './ObjetivoCampos';

type Props = {
  valor: RascunhosObjetivos;
  onChange: (rascunhos: RascunhosObjetivos) => void;
  idPrefix: string;
};

const SECOES = [
  {
    tipo: 'limite',
    titulo: 'Limite de gastos',
    descricao: 'Indica quando você gasta mais do que o esperado no período.',
  },
  {
    tipo: 'meta',
    titulo: 'Meta',
    descricao: 'Acompanha quanto você ganha ou guarda até o prazo.',
  },
] as const;

/** Limite de gastos e meta são independentes: dá para ter só um, os dois ou nenhum. */
export default function ObjetivosFormulario({
  valor,
  onChange,
  idPrefix,
}: Props) {
  return (
    <div className="space-y-4">
      {SECOES.map((secao) => {
        const rascunho = valor[secao.tipo];
        const id = `${idPrefix}-${secao.tipo}`;

        return (
          <div
            key={secao.tipo}
            className="rounded-xl border border-forest-200 bg-white p-4"
          >
            <label
              htmlFor={id}
              className="flex cursor-pointer items-start gap-3"
            >
              <input
                id={id}
                type="checkbox"
                checked={rascunho !== null}
                onChange={(event) =>
                  onChange({
                    ...valor,
                    [secao.tipo]: event.target.checked ? rascunhoVazio() : null,
                  })
                }
                className="mt-1 h-4 w-4 cursor-pointer accent-forest-700"
              />
              <span>
                <span className="block text-sm font-semibold text-forest-950">
                  {secao.titulo}
                </span>
                <span className="block text-xs text-gray-500">
                  {secao.descricao}
                </span>
              </span>
            </label>

            {rascunho && (
              <div className="mt-4">
                <ObjetivoCampos
                  tipo={secao.tipo}
                  valor={rascunho}
                  onChange={(novo) =>
                    onChange({ ...valor, [secao.tipo]: novo })
                  }
                  idPrefix={id}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
