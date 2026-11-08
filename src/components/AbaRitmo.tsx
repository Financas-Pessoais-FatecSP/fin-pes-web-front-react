import { Pencil, Plus, Target } from 'lucide-react';
import { useListas } from '../contexts/ListasContext';
import type { Lista } from '../utils/listas';
import { calcularRitmos } from '../utils/objetivos';
import EditorObjetivos from './EditorObjetivos';
import PainelRitmo from './PainelRitmo';

type Props = {
  lista: Lista;
  editando: boolean;
  onEditar: () => void;
  onFecharEdicao: () => void;
};

export default function AbaRitmo({
  lista,
  editando,
  onEditar,
  onFecharEdicao,
}: Props) {
  const { listas } = useListas();

  if (editando) {
    return <EditorObjetivos lista={lista} onFechar={onFecharEdicao} />;
  }

  const { limite, meta } = calcularRitmos(lista, listas);

  if (!limite && !meta) {
    return (
      <section className="mt-8 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-forest-300 px-6 py-10 text-center">
        <Target className="text-forest-700" size={28} aria-hidden="true" />
        <p className="font-semibold text-forest-900">
          Acompanhe o ritmo desta lista
        </p>
        <p className="max-w-md text-sm text-forest-700">
          Defina um limite de gastos ou uma meta de economia com prazo e veja se
          você está no caminho certo.
        </p>
        <button
          type="button"
          onClick={onEditar}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#FBFE34] px-5 py-3 font-semibold text-forest-950 shadow transition hover:bg-[#E8EB20]"
        >
          <Plus size={18} />
          Definir limite ou meta
        </button>
      </section>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onEditar}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-forest-300 bg-white px-4 py-2 text-sm font-semibold text-forest-900 transition hover:bg-forest-100"
        >
          <Pencil size={16} />
          Editar limite e meta
        </button>
      </div>

      {limite && <PainelRitmo ritmo={limite} />}
      {meta && <PainelRitmo ritmo={meta} />}

      <p className="text-xs text-gray-500">
        Só entram lançamentos com data dentro do período e até hoje. Listas
        adicionadas como entrada contam pelo saldo delas, na data da entrada.
      </p>
    </div>
  );
}
