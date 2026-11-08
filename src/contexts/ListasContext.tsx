import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import dadosFinanceiros from '../mocks/lancamentos';
import {
  ehReferencia,
  type ItemLista,
  type Lancamento,
  type Lista,
  type Objetivo,
  type ObjetivosLista,
} from '../utils/listas';

type ListasContextValue = {
  listas: Lista[];
  adicionarLista: (nome: string, objetivos?: ObjetivosLista) => void;
  definirObjetivos: (listaId: number, objetivos: ObjetivosLista) => void;
  excluirLista: (listaId: number) => void;
  adicionarItem: (listaId: number, item: ItemLista) => void;
  atualizarLancamento: (
    listaId: number,
    itemId: number,
    dados: Omit<Lancamento, 'id'>,
  ) => void;
  removerItem: (listaId: number, itemId: number) => void;
};

const CHAVE_ARMAZENAMENTO = 'equilibrafin:listas:v1';

/** Formato antigo: um único `objetivo` por lista. */
type ListaLegada = Lista & { objetivo?: Objetivo };

function migrar(lista: ListaLegada): Lista {
  const { objetivo, ...resto } = lista;

  if (!objetivo) return resto;

  return objetivo.tipo === 'limite'
    ? { ...resto, limite: resto.limite ?? objetivo }
    : { ...resto, meta: resto.meta ?? objetivo };
}

function carregarListas(): Lista[] {
  try {
    const salvo = localStorage.getItem(CHAVE_ARMAZENAMENTO);

    if (salvo) {
      const dados: unknown = JSON.parse(salvo);
      if (Array.isArray(dados)) return (dados as ListaLegada[]).map(migrar);
    }
  } catch {
    // Armazenamento indisponível ou corrompido: começa do mock.
  }

  return [
    {
      ...dadosFinanceiros.lista,
      itens: dadosFinanceiros.lancamentos as Lancamento[],
    },
  ];
}

const ListasContext = createContext<ListasContextValue | null>(null);

export function ListasProvider({ children }: { children: ReactNode }) {
  const [listas, setListas] = useState<Lista[]>(carregarListas);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(listas));
    } catch {
      // Sem armazenamento: os dados ficam só em memória.
    }
  }, [listas]);

  const adicionarLista = (nome: string, objetivos: ObjetivosLista = {}) =>
    setListas((atuais) => [
      ...atuais,
      { id: Date.now(), nome, itens: [], ...objetivos },
    ]);

  // Substitui limite e meta: o que não vier em `objetivos` é removido.
  const definirObjetivos = (listaId: number, objetivos: ObjetivosLista) =>
    setListas((atuais) =>
      atuais.map((lista) =>
        lista.id === listaId
          ? { ...lista, limite: objetivos.limite, meta: objetivos.meta }
          : lista,
      ),
    );

  // Ao excluir uma lista, remove também as entradas que apontavam para ela.
  const excluirLista = (listaId: number) =>
    setListas((atuais) =>
      atuais
        .filter((lista) => lista.id !== listaId)
        .map((lista) => ({
          ...lista,
          itens: lista.itens.filter(
            (item) => !(ehReferencia(item) && item.listaId === listaId),
          ),
        })),
    );

  const adicionarItem = (listaId: number, item: ItemLista) =>
    setListas((atuais) =>
      atuais.map((lista) =>
        lista.id === listaId
          ? { ...lista, itens: [...lista.itens, item] }
          : lista,
      ),
    );

  const atualizarLancamento = (
    listaId: number,
    itemId: number,
    dados: Omit<Lancamento, 'id'>,
  ) =>
    setListas((atuais) =>
      atuais.map((lista) =>
        lista.id === listaId
          ? {
              ...lista,
              itens: lista.itens.map((item) =>
                item.id === itemId && !ehReferencia(item)
                  ? { ...item, ...dados }
                  : item,
              ),
            }
          : lista,
      ),
    );

  const removerItem = (listaId: number, itemId: number) =>
    setListas((atuais) =>
      atuais.map((lista) =>
        lista.id === listaId
          ? { ...lista, itens: lista.itens.filter((i) => i.id !== itemId) }
          : lista,
      ),
    );

  return (
    <ListasContext.Provider
      value={{
        listas,
        adicionarLista,
        definirObjetivos,
        excluirLista,
        adicionarItem,
        atualizarLancamento,
        removerItem,
      }}
    >
      {children}
    </ListasContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useListas() {
  const contexto = useContext(ListasContext);

  if (!contexto) {
    throw new Error('useListas deve ser usado dentro de <ListasProvider>.');
  }

  return contexto;
}
