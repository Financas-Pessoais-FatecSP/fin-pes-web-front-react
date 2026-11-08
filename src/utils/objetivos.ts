import {
  ehReferencia,
  resolverItem,
  type Lista,
  type Objetivo,
  type ObjetivosLista,
  type PeriodoTipo,
} from './listas';

const MS_POR_DIA = 86_400_000;

export const arredondar = (valor: number) => Math.round(valor * 100) / 100;

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const percentual = (fracao: number) => `${Math.round(fracao * 100)}%`;

const plural = (n: number, singular: string, pluralTxt: string) =>
  `${n} ${n === 1 ? singular : pluralTxt}`;

export const formatarDataCurta = (data: Date) =>
  data.toLocaleDateString('pt-BR');

export const ROTULO_PERIODO: Record<PeriodoTipo, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  anual: 'Anual',
  customizado: 'Personalizado',
};

/* ------------------------------ datas ------------------------------ */

/** Converte YYYY-MM-DD em Date local (evita o deslocamento de fuso do UTC). */
export function paraData(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export const inicioDoDia = (data: Date) =>
  new Date(data.getFullYear(), data.getMonth(), data.getDate());

export const diasEntre = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / MS_POR_DIA);

/** Período vigente do objetivo. Semanal, mensal e anual se renovam sozinhos. */
export function periodoDoObjetivo(
  objetivo: Objetivo,
  hoje: Date,
): { inicio: Date; fim: Date } {
  const base = inicioDoDia(hoje);
  const ano = base.getFullYear();
  const mes = base.getMonth();

  switch (objetivo.periodo) {
    case 'semanal': {
      const deslocamento = (base.getDay() + 6) % 7; // semana começa na segunda
      const inicio = new Date(ano, mes, base.getDate() - deslocamento);
      const fim = new Date(ano, mes, base.getDate() - deslocamento + 6);
      return { inicio, fim };
    }
    case 'mensal':
      return { inicio: new Date(ano, mes, 1), fim: new Date(ano, mes + 1, 0) };
    case 'anual':
      return { inicio: new Date(ano, 0, 1), fim: new Date(ano, 11, 31) };
    default: {
      const hojeISO = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
      return {
        inicio: paraData(objetivo.inicio ?? hojeISO),
        fim: paraData(objetivo.fim ?? hojeISO),
      };
    }
  }
}

/* ------------------------------ ritmo ------------------------------ */

export type StatusRitmo =
  | 'nao-iniciado'
  | 'no-ritmo'
  | 'atencao'
  | 'fora-do-ritmo';

export type PontoSerie = {
  dia: string;
  real: number | null;
  ideal: number;
  projecao: number | null;
};

export type CategoriaGasto = { nome: string; valor: number };

export type Ritmo = {
  objetivo: Objetivo;
  inicio: Date;
  fim: Date;
  diasTotal: number;
  diasDecorridos: number;
  diasRestantes: number;
  decorrido: number; // fração do período já passada (0 a 1)
  encerrado: boolean;
  /** Limite: gasto até hoje. Meta: saldo (receitas − despesas) até hoje. */
  realizado: number;
  esperado: number; // valor × fração decorrida
  projecao: number; // valor ao fim do período se o ritmo atual continuar
  progresso: number; // realizado / valor
  atingido: boolean; // limite: realizado <= valor | meta: realizado >= valor
  status: StatusRitmo;
  serie: PontoSerie[];
  categorias: CategoriaGasto[];
  totalDespesas: number;
};

/**
 * Compara o que foi realizado com o que se esperava até hoje.
 * Só entram lançamentos com data dentro do período e até hoje. Uma lista
 * aninhada conta pelo saldo dela, na data da entrada; o limite/meta da lista
 * aninhada é ignorado aqui.
 */
export function calcularRitmo(
  objetivo: Objetivo,
  lista: Lista,
  listas: Lista[],
  hoje: Date = new Date(),
): Ritmo {
  const { inicio, fim } = periodoDoObjetivo(objetivo, hoje);
  const diaAtual = inicioDoDia(hoje);

  const diasTotal = Math.max(diasEntre(inicio, fim) + 1, 1);
  const indiceHoje = diasEntre(inicio, diaAtual); // < 0: ainda não começou
  const diasDecorridos = Math.min(Math.max(indiceHoje + 1, 0), diasTotal);
  const diasRestantes = diasTotal - diasDecorridos;
  const encerrado = indiceHoje >= diasTotal;
  const decorrido = diasDecorridos / diasTotal;

  const deltaPorDia: number[] = new Array(diasTotal).fill(0);
  const gastosPorCategoria = new Map<string, number>();
  let totalDespesas = 0;

  for (const item of lista.itens) {
    const indice = diasEntre(inicio, paraData(item.data));
    if (indice < 0 || indice >= diasTotal || indice > indiceHoje) continue;

    const { tipo, valor } = resolverItem(item, listas);

    if (tipo === 'despesa') {
      const nome = ehReferencia(item)
        ? (listas.find((outra) => outra.id === item.listaId)?.nome ?? 'Lista')
        : item.categoria.trim() || 'Sem categoria';

      gastosPorCategoria.set(nome, (gastosPorCategoria.get(nome) ?? 0) + valor);
      totalDespesas += valor;
    }

    if (objetivo.tipo === 'limite') {
      deltaPorDia[indice] += tipo === 'despesa' ? valor : 0;
    } else if (tipo === 'receita') {
      deltaPorDia[indice] += valor;
    } else if (objetivo.base !== 'ganhos') {
      deltaPorDia[indice] -= valor; // meta por saldo desconta as despesas
    }
  }

  const realizado = arredondar(deltaPorDia.reduce((a, b) => a + b, 0));
  const esperado = arredondar(objetivo.valor * decorrido);
  const projecao = diasDecorridos > 0 ? arredondar(realizado / decorrido) : 0;
  const atingido =
    objetivo.tipo === 'limite'
      ? realizado <= objetivo.valor
      : realizado >= objetivo.valor;

  let status: StatusRitmo;
  if (diasDecorridos === 0) {
    status = 'nao-iniciado';
  } else if (objetivo.tipo === 'limite') {
    if (realizado > objetivo.valor) status = 'fora-do-ritmo';
    else if (realizado <= esperado) status = 'no-ritmo';
    else if (realizado <= esperado * 1.2) status = 'atencao';
    else status = 'fora-do-ritmo';
  } else if (realizado >= esperado) {
    status = 'no-ritmo';
  } else if (realizado >= esperado * 0.8) {
    status = 'atencao';
  } else {
    status = 'fora-do-ritmo';
  }

  // Série diária para o gráfico: acumulado real, linha ideal e projeção.
  const taxaDiaria = diasDecorridos > 0 ? realizado / diasDecorridos : 0;
  const serie: PontoSerie[] = [];
  let acumulado = 0;

  for (let i = 0; i < diasTotal; i++) {
    const dia = new Date(
      inicio.getFullYear(),
      inicio.getMonth(),
      inicio.getDate() + i,
    );

    let real: number | null = null;
    if (i <= indiceHoje) {
      acumulado += deltaPorDia[i];
      real = arredondar(acumulado);
    }

    let proj: number | null = null;
    if (!encerrado && diasDecorridos > 0 && i >= diasDecorridos - 1) {
      proj = arredondar(realizado + taxaDiaria * (i - (diasDecorridos - 1)));
    }

    serie.push({
      dia: dia.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      real,
      ideal: arredondar((objetivo.valor * (i + 1)) / diasTotal),
      projecao: proj,
    });
  }

  const categorias = [...gastosPorCategoria.entries()]
    .map(([nome, valor]) => ({ nome, valor: arredondar(valor) }))
    .sort((a, b) => b.valor - a.valor);

  return {
    objetivo,
    inicio,
    fim,
    diasTotal,
    diasDecorridos,
    diasRestantes,
    decorrido,
    encerrado,
    realizado,
    esperado,
    projecao,
    progresso: objetivo.valor > 0 ? realizado / objetivo.valor : 0,
    atingido,
    status,
    serie,
    categorias,
    totalDespesas: arredondar(totalDespesas),
  };
}

export function calcularRitmos(
  lista: Lista,
  listas: Lista[],
  hoje: Date = new Date(),
): { limite: Ritmo | null; meta: Ritmo | null } {
  return {
    limite: lista.limite
      ? calcularRitmo(lista.limite, lista, listas, hoje)
      : null,
    meta: lista.meta ? calcularRitmo(lista.meta, lista, listas, hoje) : null,
  };
}

export function nomeObjetivo(objetivo: Objetivo): string {
  if (objetivo.tipo === 'limite') return 'Limite de gastos';
  return objetivo.base === 'ganhos' ? 'Meta de ganhos' : 'Meta de economia';
}

export function rotuloRealizado(objetivo: Objetivo): string {
  if (objetivo.tipo === 'limite') return 'Gasto até hoje';
  return objetivo.base === 'ganhos' ? 'Ganho até hoje' : 'Guardado até hoje';
}

/* ----------------------------- insights ----------------------------- */

export function gerarInsights(r: Ritmo): string[] {
  const { objetivo, realizado, projecao, diasRestantes } = r;
  const v = objetivo.valor;
  const insights: string[] = [];
  const ganhos = objetivo.base === 'ganhos';
  const passado = ganhos ? 'ganhou' : 'guardou';
  const imperativo = ganhos ? 'ganhe' : 'guarde';
  const infinitivo = ganhos ? 'ganhar' : 'guardar';

  if (r.status === 'nao-iniciado') {
    return [`O período começa em ${formatarDataCurta(r.inicio)}.`];
  }

  if (objetivo.tipo === 'limite') {
    if (r.encerrado) {
      insights.push(
        r.atingido
          ? `Período encerrado dentro do esperado: você gastou ${moeda(realizado)} de ${moeda(v)}.`
          : `Período encerrado acima do esperado: você gastou ${moeda(realizado)}, ${moeda(realizado - v)} a mais que o limite.`,
      );
    } else {
      insights.push(
        `Você usou ${percentual(r.progresso)} do limite com ${percentual(r.decorrido)} do período.`,
      );

      if (realizado > v) {
        insights.push(
          `O limite já foi ultrapassado em ${moeda(realizado - v)}.`,
        );
      } else if (projecao > v) {
        insights.push(
          `No ritmo atual, você deve ultrapassar o limite em ${moeda(projecao - v)}.`,
        );
      } else {
        insights.push(
          `No ritmo atual, você termina o período com ${moeda(v - projecao)} de folga.`,
        );
      }

      if (realizado < v && diasRestantes > 0) {
        insights.push(
          `Para ficar dentro do limite, gaste no máximo ${moeda((v - realizado) / diasRestantes)} por dia nos próximos ${plural(diasRestantes, 'dia', 'dias')}.`,
        );
      }
    }
  } else if (r.encerrado) {
    insights.push(
      r.atingido
        ? `Meta atingida: você ${passado} ${moeda(realizado)} de ${moeda(v)}.`
        : `Meta não atingida: você ${passado} ${moeda(realizado)} e faltaram ${moeda(v - realizado)}.`,
    );
  } else {
    insights.push(
      `Você ${passado} ${moeda(realizado)} de ${moeda(v)} (${percentual(Math.max(r.progresso, 0))}) com ${percentual(r.decorrido)} do período.`,
    );

    if (realizado >= v) {
      insights.push(
        `A meta já foi atingida. O que você ${infinitivo} daqui para frente é extra.`,
      );
    } else {
      const falta = v - realizado;

      if (diasRestantes === 0) {
        insights.push(
          `Hoje é o último dia: faltam ${moeda(falta)} para a meta.`,
        );
      } else {
        const necessario =
          diasRestantes >= 60
            ? `${moeda(falta / (diasRestantes / 30.4375))} por mês`
            : diasRestantes >= 14
              ? `${moeda(falta / (diasRestantes / 7))} por semana`
              : `${moeda(falta / diasRestantes)} por dia`;

        insights.push(
          `Para atingir a meta, ${imperativo} cerca de ${necessario} nos próximos ${plural(diasRestantes, 'dia', 'dias')}.`,
        );
        insights.push(
          `No ritmo atual, você termina com ${moeda(projecao)} (${percentual(Math.max(projecao, 0) / v)} da meta).`,
        );
      }
    }
  }

  const maior = r.categorias[0];
  if (maior && r.totalDespesas > 0) {
    insights.push(
      `Maior categoria de despesa: ${maior.nome} (${percentual(maior.valor / r.totalDespesas)} dos gastos do período).`,
    );
  }

  return insights;
}

/* ---------------------------- formulário ---------------------------- */

export type RascunhoObjetivo = {
  valor: string;
  periodo: PeriodoTipo;
  inicio: string;
  fim: string;
  base: 'ganhos' | 'saldo'; // só para metas
};

/** `null` = esse objetivo não foi definido. */
export type RascunhosObjetivos = {
  limite: RascunhoObjetivo | null;
  meta: RascunhoObjetivo | null;
};

export const rascunhoVazio = (): RascunhoObjetivo => ({
  valor: '',
  periodo: 'mensal',
  inicio: '',
  fim: '',
  base: 'ganhos',
});

export const rascunhosVazios = (): RascunhosObjetivos => ({
  limite: null,
  meta: null,
});

const rascunhoDe = (objetivo: Objetivo): RascunhoObjetivo => ({
  valor: String(objetivo.valor).replace('.', ','),
  periodo: objetivo.periodo,
  inicio: objetivo.inicio ?? '',
  fim: objetivo.fim ?? '',
  base: objetivo.base ?? 'saldo',
});

export const rascunhosDe = (lista: Lista): RascunhosObjetivos => ({
  limite: lista.limite ? rascunhoDe(lista.limite) : null,
  meta: lista.meta ? rascunhoDe(lista.meta) : null,
});

function validarRascunho(
  tipo: Objetivo['tipo'],
  rascunho: RascunhoObjetivo,
): { objetivo: Objetivo } | { erro: string } {
  const valor = Number(rascunho.valor.replace(',', '.'));

  if (!rascunho.valor.trim() || !Number.isFinite(valor) || valor <= 0) {
    return { erro: 'informe um valor maior que zero.' };
  }

  if (rascunho.periodo === 'customizado') {
    if (!rascunho.inicio || !rascunho.fim) {
      return { erro: 'informe as datas de início e fim do período.' };
    }
    if (rascunho.fim < rascunho.inicio) {
      return { erro: 'a data final deve ser igual ou posterior à inicial.' };
    }
  }

  return {
    objetivo: {
      tipo,
      valor,
      periodo: rascunho.periodo,
      ...(rascunho.periodo === 'customizado'
        ? { inicio: rascunho.inicio, fim: rascunho.fim }
        : {}),
      ...(tipo === 'meta' ? { base: rascunho.base } : {}),
    },
  };
}

export function validarRascunhos(
  rascunhos: RascunhosObjetivos,
): { objetivos: ObjetivosLista } | { erro: string } {
  const objetivos: ObjetivosLista = {};

  if (rascunhos.limite) {
    const resultado = validarRascunho('limite', rascunhos.limite);
    if ('erro' in resultado)
      return { erro: `Limite de gastos: ${resultado.erro}` };
    objetivos.limite = resultado.objetivo;
  }

  if (rascunhos.meta) {
    const resultado = validarRascunho('meta', rascunhos.meta);
    if ('erro' in resultado) return { erro: `Meta: ${resultado.erro}` };
    objetivos.meta = resultado.objetivo;
  }

  return { objetivos };
}
