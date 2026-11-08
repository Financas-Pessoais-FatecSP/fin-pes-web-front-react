export type TipoLancamento = 'receita' | 'despesa';

export type Lancamento = {
  id: number;
  descricao: string;
  categoria: string;
  tipo: TipoLancamento;
  valor: number;
  data: string;
  observacao: string;
};

/** Uma lista usada como entrada dentro de outra lista. */
export type ReferenciaLista = {
  id: number;
  listaId: number;
  data: string;
  observacao: string;
};

export type ItemLista = Lancamento | ReferenciaLista;

export type PeriodoTipo = 'semanal' | 'mensal' | 'anual' | 'customizado';

/**
 * Limite: quanto se espera gastar, no máximo, no período (só indica, não bloqueia).
 * Meta: quanto se espera guardar (receitas − despesas) no período.
 */
export type Objetivo = {
  tipo: 'limite' | 'meta';
  valor: number;
  periodo: PeriodoTipo;
  inicio?: string; // YYYY-MM-DD, só no período customizado
  fim?: string; // YYYY-MM-DD, só no período customizado
  /**
   * Só para metas. 'ganhos': conta apenas receitas. 'saldo': receitas − despesas.
   * Metas antigas, sem este campo, continuam valendo como 'saldo'.
   */
  base?: 'ganhos' | 'saldo';
};

/** Cada lista pode ter um limite de gastos e uma meta, cada um com seu período. */
export type ObjetivosLista = {
  limite?: Objetivo;
  meta?: Objetivo;
};

export type Lista = {
  id: number;
  nome: string;
  ano?: number;
  itens: ItemLista[];
  limite?: Objetivo;
  meta?: Objetivo;
};

export type ItemResolvido = {
  tipo: TipoLancamento;
  valor: number;
};

export function ehReferencia(item: ItemLista): item is ReferenciaLista {
  return 'listaId' in item;
}

const arredondar = (valor: number) => Math.round(valor * 100) / 100;

/**
 * Saldo de uma lista (receitas − despesas), resolvendo listas aninhadas
 * recursivamente. `pilha` protege contra ciclos: uma lista que já está
 * sendo calculada não é recalculada.
 */
export function calcularSaldo(
  listaId: number,
  listas: Lista[],
  pilha: number[] = [],
): number {
  if (pilha.includes(listaId)) return 0;

  const lista = listas.find((item) => item.id === listaId);
  if (!lista) return 0;

  const novaPilha = [...pilha, listaId];

  const total = lista.itens.reduce((soma, item) => {
    if (ehReferencia(item)) {
      return soma + calcularSaldo(item.listaId, listas, novaPilha);
    }
    return soma + (item.tipo === 'receita' ? item.valor : -item.valor);
  }, 0);

  return arredondar(total);
}

/**
 * Tipo e valor efetivos de um item. Para uma lista aninhada, o tipo é
 * decidido pelo saldo dela: saldo >= 0 vira receita, saldo < 0 vira despesa.
 */
export function resolverItem(item: ItemLista, listas: Lista[]): ItemResolvido {
  if (!ehReferencia(item)) {
    return { tipo: item.tipo, valor: item.valor };
  }

  const saldo = calcularSaldo(item.listaId, listas);
  return {
    tipo: saldo >= 0 ? 'receita' : 'despesa',
    valor: Math.abs(saldo),
  };
}

/** `raizId` contém `alvoId`, direta ou indiretamente? */
export function listaContem(
  raizId: number,
  alvoId: number,
  listas: Lista[],
  visitadas: Set<number> = new Set(),
): boolean {
  if (visitadas.has(raizId)) return false;
  visitadas.add(raizId);

  const raiz = listas.find((lista) => lista.id === raizId);
  if (!raiz) return false;

  return raiz.itens.some(
    (item) =>
      ehReferencia(item) &&
      (item.listaId === alvoId ||
        listaContem(item.listaId, alvoId, listas, visitadas)),
  );
}

/**
 * Listas que podem ser adicionadas dentro de `listaAtualId`: nunca ela
 * mesma, nenhuma que já a contenha (evita ciclos) e nenhuma já adicionada.
 */
export function listasDisponiveis(
  listaAtualId: number,
  listas: Lista[],
): Lista[] {
  const atual = listas.find((lista) => lista.id === listaAtualId);
  const jaAdicionadas = new Set(
    (atual?.itens ?? []).filter(ehReferencia).map((item) => item.listaId),
  );

  return listas.filter(
    (lista) =>
      lista.id !== listaAtualId &&
      !jaAdicionadas.has(lista.id) &&
      !listaContem(lista.id, listaAtualId, listas),
  );
}
