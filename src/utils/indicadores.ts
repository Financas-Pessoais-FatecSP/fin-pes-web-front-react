import { ehReferencia, resolverItem, type Lista } from './listas';
import {
  arredondar,
  diasEntre,
  inicioDoDia,
  paraData,
  type CategoriaGasto,
} from './objetivos';

export type FiltroPeriodo = 'tudo' | 'mes' | '30dias' | 'ano';
export type Agrupamento = 'dia' | 'semana' | 'mes';

export type PontoFluxo = {
  rotulo: string;
  receitas: number;
  despesas: number;
  saldoAcumulado: number;
};

export type Destaque = { nome: string; valor: number };

export type Indicadores = {
  quantidade: number;
  receitas: number;
  despesas: number;
  saldo: number;
  taxaPoupanca: number | null; // saldo / receitas
  mediaDiariaGastos: number;
  maiorDespesa: Destaque | null;
  maiorReceita: Destaque | null;
  agrupamento: Agrupamento;
  fluxo: PontoFluxo[];
  categoriasDespesa: CategoriaGasto[];
  categoriasReceita: CategoriaGasto[];
};

export const ROTULO_FILTRO: Record<FiltroPeriodo, string> = {
  tudo: 'Tudo',
  mes: 'Este mês',
  '30dias': 'Últimos 30 dias',
  ano: 'Este ano',
};

const somarDias = (data: Date, dias: number) =>
  new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);

function inicioDoBucket(data: Date, agrupamento: Agrupamento): Date {
  if (agrupamento === 'dia') return inicioDoDia(data);
  if (agrupamento === 'mes')
    return new Date(data.getFullYear(), data.getMonth(), 1);
  return somarDias(inicioDoDia(data), -((data.getDay() + 6) % 7)); // segunda-feira
}

function proximoBucket(data: Date, agrupamento: Agrupamento): Date {
  if (agrupamento === 'dia') return somarDias(data, 1);
  if (agrupamento === 'semana') return somarDias(data, 7);
  return new Date(data.getFullYear(), data.getMonth() + 1, 1);
}

const chaveBucket = (data: Date) =>
  `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;

function rotuloBucket(data: Date, agrupamento: Agrupamento): string {
  if (agrupamento === 'mes') {
    return data
      .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      .replace(' de ', '/');
  }
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function agruparCategorias(mapa: Map<string, number>): CategoriaGasto[] {
  return [...mapa.entries()]
    .map(([nome, valor]) => ({ nome, valor: arredondar(valor) }))
    .sort((a, b) => b.valor - a.valor);
}

/**
 * Entradas, saídas e indicadores de uma lista. Listas aninhadas contam pelo
 * saldo delas, na data da entrada, e aparecem como categoria pelo nome da lista.
 */
export function calcularIndicadores(
  lista: Lista,
  listas: Lista[],
  filtro: FiltroPeriodo,
  hoje: Date = new Date(),
): Indicadores {
  const base = inicioDoDia(hoje);
  const ano = base.getFullYear();
  const mes = base.getMonth();

  let inicio: Date | null = null;
  let fim: Date | null = null;

  if (filtro === 'mes') {
    inicio = new Date(ano, mes, 1);
    fim = new Date(ano, mes + 1, 0);
  } else if (filtro === '30dias') {
    inicio = somarDias(base, -29);
    fim = base;
  } else if (filtro === 'ano') {
    inicio = new Date(ano, 0, 1);
    fim = new Date(ano, 11, 31);
  }

  const itens = lista.itens
    .map((item) => ({
      item,
      data: paraData(item.data),
      ...resolverItem(item, listas),
    }))
    .filter(
      (registro) =>
        (!inicio || registro.data >= inicio) && (!fim || registro.data <= fim),
    );

  if (filtro === 'tudo' && itens.length > 0) {
    const tempos = itens.map((registro) => registro.data.getTime());
    inicio = new Date(Math.min(...tempos));
    fim = new Date(Math.max(...tempos));
  }

  const vazio: Indicadores = {
    quantidade: 0,
    receitas: 0,
    despesas: 0,
    saldo: 0,
    taxaPoupanca: null,
    mediaDiariaGastos: 0,
    maiorDespesa: null,
    maiorReceita: null,
    agrupamento: 'dia',
    fluxo: [],
    categoriasDespesa: [],
    categoriasReceita: [],
  };

  if (itens.length === 0 || !inicio || !fim) return vazio;

  let receitas = 0;
  let despesas = 0;
  let maiorDespesa: Destaque | null = null;
  let maiorReceita: Destaque | null = null;
  const porCategoriaDespesa = new Map<string, number>();
  const porCategoriaReceita = new Map<string, number>();

  for (const { item, tipo, valor } of itens) {
    const nomeCategoria = ehReferencia(item)
      ? (listas.find((outra) => outra.id === item.listaId)?.nome ?? 'Lista')
      : item.categoria.trim() || 'Sem categoria';
    const nomeItem = ehReferencia(item) ? nomeCategoria : item.descricao;

    if (tipo === 'receita') {
      receitas += valor;
      porCategoriaReceita.set(
        nomeCategoria,
        (porCategoriaReceita.get(nomeCategoria) ?? 0) + valor,
      );
      if (!maiorReceita || valor > maiorReceita.valor) {
        maiorReceita = { nome: nomeItem, valor };
      }
    } else {
      despesas += valor;
      porCategoriaDespesa.set(
        nomeCategoria,
        (porCategoriaDespesa.get(nomeCategoria) ?? 0) + valor,
      );
      if (!maiorDespesa || valor > maiorDespesa.valor) {
        maiorDespesa = { nome: nomeItem, valor };
      }
    }
  }

  const saldo = arredondar(receitas - despesas);

  // Série para o gráfico: dia, semana ou mês conforme a duração do período.
  const duracao = diasEntre(inicio, fim) + 1;
  const agrupamento: Agrupamento =
    duracao <= 31 ? 'dia' : duracao <= 150 ? 'semana' : 'mes';

  const buckets = new Map<string, { receitas: number; despesas: number }>();
  for (const { data, tipo, valor } of itens) {
    const chave = chaveBucket(inicioDoBucket(data, agrupamento));
    const atual = buckets.get(chave) ?? { receitas: 0, despesas: 0 };
    if (tipo === 'receita') atual.receitas += valor;
    else atual.despesas += valor;
    buckets.set(chave, atual);
  }

  const fluxo: PontoFluxo[] = [];
  let acumulado = 0;
  for (
    let cursor = inicioDoBucket(inicio, agrupamento);
    cursor <= fim;
    cursor = proximoBucket(cursor, agrupamento)
  ) {
    const bucket = buckets.get(chaveBucket(cursor)) ?? {
      receitas: 0,
      despesas: 0,
    };
    acumulado += bucket.receitas - bucket.despesas;
    fluxo.push({
      rotulo: rotuloBucket(cursor, agrupamento),
      receitas: arredondar(bucket.receitas),
      despesas: arredondar(bucket.despesas),
      saldoAcumulado: arredondar(acumulado),
    });
  }

  const fimEfetivo = fim < base ? fim : base;
  const diasConsiderados = Math.max(diasEntre(inicio, fimEfetivo) + 1, 1);

  return {
    quantidade: itens.length,
    receitas: arredondar(receitas),
    despesas: arredondar(despesas),
    saldo,
    taxaPoupanca: receitas > 0 ? saldo / receitas : null,
    mediaDiariaGastos: arredondar(despesas / diasConsiderados),
    maiorDespesa,
    maiorReceita,
    agrupamento,
    fluxo,
    categoriasDespesa: agruparCategorias(porCategoriaDespesa),
    categoriasReceita: agruparCategorias(porCategoriaReceita),
  };
}
