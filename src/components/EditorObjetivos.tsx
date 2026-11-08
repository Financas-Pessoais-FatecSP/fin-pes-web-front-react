import { useState } from 'react';
import { useListas } from '../contexts/ListasContext';
import type { Lista } from '../utils/listas';
import { rascunhosDe, validarRascunhos } from '../utils/objetivos';
import ObjetivosFormulario from './ObjetivosFormulario';

type Props = {
  lista: Lista;
  onFechar: () => void;
};

export default function EditorObjetivos({ lista, onFechar }: Props) {
  const { definirObjetivos } = useListas();
  const [rascunhos, setRascunhos] = useState(() => rascunhosDe(lista));
  const [erro, setErro] = useState('');

  function salvar() {
    const resultado = validarRascunhos(rascunhos);

    if ('erro' in resultado) {
      setErro(resultado.erro);
      return;
    }

    definirObjetivos(lista.id, resultado.objetivos);
    onFechar();
  }

  return (
    <section className="mt-8 rounded-2xl border border-forest-200 bg-white p-5 shadow-sm md:p-7">
      <h2 className="text-xl font-bold text-forest-950">
        Limite e meta desta lista
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Marque o que quiser acompanhar. Desmarcar remove o limite ou a meta.
      </p>

      <div className="mt-5">
        <ObjetivosFormulario
          valor={rascunhos}
          onChange={setRascunhos}
          idPrefix="editor-objetivos"
        />
      </div>

      {erro && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {erro}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onFechar}
          className="cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          className="cursor-pointer rounded-xl bg-[#FBFE34] px-6 py-3 font-semibold text-forest-950 shadow transition hover:bg-[#E8EB20]"
        >
          Salvar
        </button>
      </div>
    </section>
  );
}
