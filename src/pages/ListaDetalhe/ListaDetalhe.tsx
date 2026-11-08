import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Gauge,
  Layers,
  LayoutDashboard,
  List,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import AbaDashboard from '../../components/AbaDashboard';
import AbaRitmo from '../../components/AbaRitmo';
import { useListas } from '../../contexts/ListasContext';
import {
  calcularSaldo,
  ehReferencia,
  listasDisponiveis,
  resolverItem,
  type Lancamento,
  type ReferenciaLista,
  type TipoLancamento,
} from '../../utils/listas';

const formatarMoeda = (valor: number) =>
  valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const formatarData = (data: string) =>
  new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');

function obterDataAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

type Aba = 'lancamentos' | 'ritmo' | 'dashboard';

const ABAS = [
  { id: 'lancamentos', rotulo: 'Lançamentos', Icone: List },
  { id: 'ritmo', rotulo: 'Ritmo', Icone: Gauge },
  { id: 'dashboard', rotulo: 'Dashboard', Icone: LayoutDashboard },
] as const;

export default function ListaDetalhe() {
  const { id } = useParams();

  const { listas, adicionarItem, atualizarLancamento, removerItem } =
    useListas();

  const listaId = Number(id);
  const lista = listas.find((item) => item.id === listaId);
  const itens = lista?.itens ?? [];
  const disponiveis = listasDisponiveis(listaId, listas);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarSaldo, setMostrarSaldo] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState<TipoLancamento>('despesa');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(obterDataAtual());
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState<Aba>('lancamentos');
  const [editandoRitmo, setEditandoRitmo] = useState(false);
  const [mostrarFormularioLista, setMostrarFormularioLista] = useState(false);
  const [listaSelecionadaId, setListaSelecionadaId] = useState('');

  // Listas aninhadas entram aqui já classificadas como receita ou despesa.
  const itensResolvidos = itens.map((item) => ({
    item,
    ...resolverItem(item, listas),
  }));

  const receitas = itensResolvidos
    .filter((item) => item.tipo === 'receita')
    .reduce((total, item) => total + item.valor, 0);

  const despesas = itensResolvidos
    .filter((item) => item.tipo === 'despesa')
    .reduce((total, item) => total + item.valor, 0);

  const saldo = Math.round((receitas - despesas) * 100) / 100;

  const saldoListaSelecionada = listaSelecionadaId
    ? calcularSaldo(Number(listaSelecionadaId), listas)
    : null;

  function adicionarLancamento(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const valorNumerico = Number(valor.replace(',', '.'));

    if (
      !descricao.trim() ||
      !categoria.trim() ||
      !valor.trim() ||
      !Number.isFinite(valorNumerico) ||
      valorNumerico <= 0 ||
      !data
    ) {
      setErro('Preencha os campos obrigatórios com valores válidos.');
      return;
    }

    const novoLancamento: Lancamento = {
      id: Date.now(),
      descricao: descricao.trim(),
      categoria: categoria.trim(),
      tipo,
      valor: valorNumerico,
      data,
      observacao: observacao.trim(),
    };

    adicionarItem(listaId, novoLancamento);
    setDescricao('');
    setCategoria('');
    setTipo('despesa');
    setValor('');
    setData(obterDataAtual());
    setObservacao('');
    setErro('');
    setMostrarFormulario(false);
  }

  function abrirRitmo() {
    setAba('ritmo');
    setEditandoRitmo(true);
  }

  function abrirFormularioLancamento() {
    if (aba !== 'lancamentos') {
      setAba('lancamentos');
      if (mostrarFormulario) return;
    }

    if (mostrarFormulario) {
      cancelarEdicao();
      return;
    }

    setMostrarFormularioLista(false);
    setErro('');
    setMostrarFormulario(true);
  }

  function abrirFormularioLista() {
    if (aba !== 'lancamentos') {
      setAba('lancamentos');
      if (mostrarFormularioLista) return;
    }

    if (mostrarFormularioLista) {
      fecharFormularioLista();
      return;
    }

    cancelarEdicao();
    setMostrarFormularioLista(true);
  }

  function fecharFormularioLista() {
    setMostrarFormularioLista(false);
    setListaSelecionadaId('');
    setData(obterDataAtual());
    setObservacao('');
    setErro('');
  }

  function adicionarLista(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const idSelecionado = Number(listaSelecionadaId);

    if (
      !listaSelecionadaId ||
      !disponiveis.some((item) => item.id === idSelecionado) ||
      !data
    ) {
      setErro('Escolha uma lista e uma data válida.');
      return;
    }

    const novaReferencia: ReferenciaLista = {
      id: Date.now(),
      listaId: idSelecionado,
      data,
      observacao: observacao.trim(),
    };

    adicionarItem(listaId, novaReferencia);
    fecharFormularioLista();
  }

  function editarLancamento(lancamento: Lancamento) {
    setMostrarFormularioLista(false);
    setEditandoId(lancamento.id);
    setDescricao(lancamento.descricao);
    setCategoria(lancamento.categoria);
    setTipo(lancamento.tipo);
    setValor(String(lancamento.valor).replace('.', ','));
    setData(lancamento.data);
    setObservacao(lancamento.observacao);
    setErro('');
    setMostrarFormulario(true);
  }

  function excluirLancamento(id: number) {
    removerItem(listaId, id);

    if (editandoId === id) {
      cancelarEdicao();
    }
  }

  function salvarEdicao(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const valorNumerico = Number(valor.replace(',', '.'));

    if (
      !descricao.trim() ||
      !categoria.trim() ||
      !valor.trim() ||
      !Number.isFinite(valorNumerico) ||
      valorNumerico <= 0 ||
      !data ||
      editandoId === null
    ) {
      setErro('Preencha os campos obrigatórios com valores válidos.');
      return;
    }

    atualizarLancamento(listaId, editandoId, {
      descricao: descricao.trim(),
      categoria: categoria.trim(),
      tipo,
      valor: valorNumerico,
      data,
      observacao: observacao.trim(),
    });

    cancelarEdicao();
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setDescricao('');
    setCategoria('');
    setTipo('despesa');
    setValor('');
    setData(obterDataAtual());
    setObservacao('');
    setErro('');
    setMostrarFormulario(false);
  }

  if (!lista) {
    return (
      <main className="min-h-screen bg-forest-100 p-6">
        <p className="text-forest-950">Lista não encontrada.</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 text-forest-800 hover:underline"
        >
          <ArrowLeft size={18} />
          Voltar ao dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-forest-100 px-4 py-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-forest-800 transition hover:text-forest-950"
        >
          <ArrowLeft size={18} />
          Voltar ao dashboard
        </Link>

        <header className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            {lista.ano && (
              <p className="text-sm font-medium text-forest-700">
                Outubro de {lista.ano}
              </p>
            )}
            <h1 className="mt-1 text-3xl font-bold text-forest-950 md:text-4xl">
              {lista.nome}
            </h1>
            <p className="mt-2 text-forest-800">
              Organize seus lançamentos e acompanhe sua vida financeira.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={abrirFormularioLista}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-forest-300 bg-white px-5 py-3 font-semibold text-forest-900 shadow-sm transition hover:bg-forest-100"
            >
              <Layers size={19} />
              Adicionar lista
            </button>

            <button
              type="button"
              onClick={abrirRitmo}
              title="Defina um limite de gastos ou uma meta de economia com prazo e veja se você está no caminho certo."
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-forest-300 bg-white px-5 py-3 font-semibold text-forest-900 shadow-sm transition hover:bg-forest-100"
            >
              <Target size={19} />
              {lista.limite || lista.meta ? 'Editar ritmo' : 'Acompanhar ritmo'}
            </button>

            <button
              type="button"
              onClick={abrirFormularioLancamento}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FBFE34] px-5 py-3 font-semibold text-forest-950 shadow transition hover:scale-[1.02] hover:bg-[#E8EB20]"
            >
              <Plus size={19} />
              {editandoId !== null ? 'Editar lançamento' : 'Novo lançamento'}
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-forest-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Receitas</p>
              <span className="rounded-xl bg-forest-100 p-2 text-forest-700">
                <TrendingUp size={21} />
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-forest-700 md:text-3xl">
              {formatarMoeda(receitas)}
            </p>
            <p className="mt-1 text-sm text-gray-500">Total recebido</p>
          </article>

          <article className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Despesas</p>
              <span className="rounded-xl bg-red-50 p-2 text-red-600">
                <TrendingDown size={21} />
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-red-600 md:text-3xl">
              {formatarMoeda(despesas)}
            </p>
            <p className="mt-1 text-sm text-gray-500">Total gasto</p>
          </article>

          <article className="rounded-2xl border border-forest-800 bg-forest-900 p-5 text-white shadow-sm md:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-forest-200">Saldo atual</p>
              <button
                type="button"
                onClick={() => setMostrarSaldo((visivel) => !visivel)}
                aria-label={mostrarSaldo ? 'Ocultar saldo' : 'Mostrar saldo'}
                aria-pressed={mostrarSaldo}
                className="cursor-pointer rounded-lg p-2 text-forest-200 transition hover:bg-forest-800 hover:text-white"
              >
                {mostrarSaldo ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            <p className="mt-4 text-2xl font-bold md:text-3xl">
              {mostrarSaldo ? formatarMoeda(saldo) : '••••••'}
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm text-forest-200">
              <Wallet size={16} />
              <span>Receitas menos despesas</span>
            </div>
          </article>
        </section>

        <nav
          role="tablist"
          aria-label="Seções da lista"
          className="mt-8 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-forest-200 scrollbar-hide"
        >
          {ABAS.map(({ id: abaId, rotulo, Icone }) => (
            <button
              key={abaId}
              type="button"
              role="tab"
              aria-selected={aba === abaId}
              onClick={() => setAba(abaId)}
              className={`-mb-px inline-flex cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                aba === abaId
                  ? 'border-forest-800 text-forest-950'
                  : 'border-transparent text-gray-500 hover:text-forest-800'
              }`}
            >
              <Icone size={17} aria-hidden="true" />
              {rotulo}
            </button>
          ))}
        </nav>

        {aba === 'ritmo' && (
          <AbaRitmo
            key={lista.id}
            lista={lista}
            editando={editandoRitmo}
            onEditar={() => setEditandoRitmo(true)}
            onFecharEdicao={() => setEditandoRitmo(false)}
          />
        )}

        {aba === 'dashboard' && <AbaDashboard key={lista.id} lista={lista} />}

        {aba === 'lancamentos' && (
          <>
            {mostrarFormularioLista && (
              <section className="mt-8 rounded-2xl border border-forest-200 bg-white p-5 shadow-sm md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-forest-950">
                      Adicionar lista
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      O saldo da lista entra aqui como receita (positivo) ou
                      despesa (negativo) e acompanha as mudanças dela.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fecharFormularioLista}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </div>

                {disponiveis.length === 0 ? (
                  <p className="mt-6 text-sm text-gray-500">
                    Não há outras listas disponíveis. Crie uma nova no dashboard
                    para poder adicioná-la aqui.
                  </p>
                ) : (
                  <form onSubmit={adicionarLista} className="mt-6">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="listaSelecionada"
                          className="mb-2 block text-sm font-medium text-forest-950"
                        >
                          Lista
                        </label>
                        <select
                          id="listaSelecionada"
                          value={listaSelecionadaId}
                          onChange={(event) =>
                            setListaSelecionadaId(event.target.value)
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-forest-600"
                          required
                        >
                          <option value="">Selecione uma lista</option>
                          {disponiveis.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.nome}
                            </option>
                          ))}
                        </select>

                        {saldoListaSelecionada !== null && (
                          <p
                            className={`mt-2 text-sm font-medium ${
                              saldoListaSelecionada >= 0
                                ? 'text-forest-700'
                                : 'text-red-600'
                            }`}
                          >
                            Entrará como{' '}
                            {saldoListaSelecionada >= 0 ? 'receita' : 'despesa'}{' '}
                            de {formatarMoeda(Math.abs(saldoListaSelecionada))}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="dataLista"
                          className="mb-2 block text-sm font-medium text-forest-950"
                        >
                          Data
                        </label>
                        <input
                          id="dataLista"
                          type="date"
                          value={data}
                          onChange={(event) => setData(event.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-forest-600"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          htmlFor="observacaoLista"
                          className="mb-2 block text-sm font-medium text-forest-950"
                        >
                          Observação (opcional)
                        </label>
                        <input
                          id="observacaoLista"
                          value={observacao}
                          onChange={(event) =>
                            setObservacao(event.target.value)
                          }
                          placeholder="Detalhes adicionais"
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-forest-600"
                        />
                      </div>
                    </div>

                    {erro && (
                      <p role="alert" className="mt-4 text-sm text-red-600">
                        {erro}
                      </p>
                    )}

                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FBFE34] px-6 py-3 font-semibold text-forest-950 shadow transition hover:scale-[1.01] hover:bg-[#E8EB20] sm:w-auto"
                      >
                        <Plus size={18} />
                        Adicionar lista
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}

            {mostrarFormulario && (
              <section className="mt-8 rounded-2xl border border-forest-200 bg-white p-5 shadow-sm md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-forest-950">
                      Novo lançamento
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Preencha os dados da receita ou despesa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setErro('');
                    }}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </div>

                <form
                  onSubmit={
                    editandoId !== null ? salvarEdicao : adicionarLancamento
                  }
                  className="mt-6"
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-forest-950">
                        Tipo de lançamento
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTipo('receita')}
                          className={`cursor-pointer rounded-xl border p-3 font-semibold transition ${
                            tipo === 'receita'
                              ? 'border-forest-600 bg-forest-100 text-forest-900'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          Receita
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipo('despesa')}
                          className={`cursor-pointer rounded-xl border p-3 font-semibold transition ${
                            tipo === 'despesa'
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          Despesa
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="valor"
                        className="mb-2 block text-sm font-medium text-forest-950"
                      >
                        Valor (R$)
                      </label>
                      <input
                        id="valor"
                        inputMode="decimal"
                        value={valor}
                        onChange={(event) => setValor(event.target.value)}
                        placeholder="Ex.: 250,00"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-forest-600"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="descricao"
                        className="mb-2 block text-sm font-medium text-forest-950"
                      >
                        Descrição
                      </label>
                      <input
                        id="descricao"
                        value={descricao}
                        onChange={(event) => setDescricao(event.target.value)}
                        placeholder="Ex.: Conta de luz"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-forest-600"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="categoria"
                        className="mb-2 block text-sm font-medium text-forest-950"
                      >
                        Categoria
                      </label>
                      <input
                        id="categoria"
                        value={categoria}
                        onChange={(event) => setCategoria(event.target.value)}
                        placeholder="Ex.: Contas fixas"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-forest-600"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="data"
                        className="mb-2 block text-sm font-medium text-forest-950"
                      >
                        Data
                      </label>
                      <input
                        id="data"
                        type="date"
                        value={data}
                        onChange={(event) => setData(event.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-forest-600"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="observacao"
                        className="mb-2 block text-sm font-medium text-forest-950"
                      >
                        Observação (opcional)
                      </label>
                      <input
                        id="observacao"
                        value={observacao}
                        onChange={(event) => setObservacao(event.target.value)}
                        placeholder="Detalhes adicionais"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-forest-600"
                      />
                    </div>
                  </div>

                  {erro && (
                    <p role="alert" className="mt-4 text-sm text-red-600">
                      {erro}
                    </p>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FBFE34] px-6 py-3 font-semibold text-forest-950 shadow transition hover:scale-[1.01] hover:bg-[#E8EB20] sm:w-auto"
                    >
                      <Plus size={18} />
                      {editandoId !== null
                        ? 'Salvar alterações'
                        : 'Adicionar lançamento'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="mt-8 rounded-2xl border border-forest-200 bg-white p-5 shadow-sm md:p-7">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold text-forest-950">
                    Seus lançamentos
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {itens.length}{' '}
                    {itens.length === 1
                      ? 'lançamento registrado'
                      : 'lançamentos registrados'}
                  </p>
                </div>
              </div>

              {itens.length === 0 ? (
                <div className="py-12 text-center">
                  <Wallet className="mx-auto text-forest-400" size={36} />
                  <p className="mt-3 font-semibold text-forest-950">
                    Nenhum lançamento por aqui
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Adicione sua primeira receita ou despesa.
                  </p>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-180 text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="px-3 py-3 font-medium">Descrição</th>
                        <th className="px-3 py-3 font-medium">Categoria</th>
                        <th className="px-3 py-3 font-medium">Data</th>
                        <th className="px-3 py-3 font-medium">Tipo</th>
                        <th className="px-3 py-3 text-right font-medium">
                          Valor
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Ações
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {itensResolvidos
                        .slice()
                        .sort((a, b) => b.item.data.localeCompare(a.item.data))
                        .map(({ item, tipo: tipoItem, valor: valorItem }) => {
                          const listaAninhada = ehReferencia(item)
                            ? listas.find((outra) => outra.id === item.listaId)
                            : undefined;

                          const nome = ehReferencia(item)
                            ? (listaAninhada?.nome ?? 'Lista removida')
                            : item.descricao;

                          return (
                            <tr
                              key={item.id}
                              className="border-b border-gray-100 last:border-0 hover:bg-forest-100/40"
                            >
                              <td className="px-3 py-4">
                                {ehReferencia(item) ? (
                                  <Link
                                    to={`/dashboard/listas/${item.listaId}`}
                                    className="inline-flex items-center gap-2 font-semibold text-forest-950 hover:underline"
                                  >
                                    <Layers
                                      size={16}
                                      className="text-forest-700"
                                      aria-hidden="true"
                                    />
                                    {nome}
                                  </Link>
                                ) : (
                                  <p className="font-semibold text-forest-950">
                                    {nome}
                                  </p>
                                )}
                                {item.observacao && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {item.observacao}
                                  </p>
                                )}
                              </td>

                              <td className="px-3 py-4 text-gray-600">
                                {ehReferencia(item) ? 'Lista' : item.categoria}
                              </td>

                              <td className="whitespace-nowrap px-3 py-4 text-gray-600">
                                {formatarData(item.data)}
                              </td>

                              <td className="px-3 py-4">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    tipoItem === 'receita'
                                      ? 'bg-forest-100 text-forest-800'
                                      : 'bg-red-50 text-red-700'
                                  }`}
                                >
                                  {tipoItem === 'receita'
                                    ? 'Receita'
                                    : 'Despesa'}
                                </span>
                              </td>

                              <td
                                className={`whitespace-nowrap px-3 py-4 text-right font-semibold ${
                                  tipoItem === 'receita'
                                    ? 'text-forest-700'
                                    : 'text-red-600'
                                }`}
                              >
                                {tipoItem === 'receita' ? '+' : '−'}
                                {formatarMoeda(valorItem)}
                              </td>

                              <td className="px-3 py-4">
                                <div className="flex items-center justify-end gap-1">
                                  {!ehReferencia(item) && (
                                    <button
                                      type="button"
                                      onClick={() => editarLancamento(item)}
                                      aria-label={`Editar ${nome}`}
                                      title="Editar lançamento"
                                      className="inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-forest-700 transition hover:bg-forest-100 hover:text-forest-950"
                                    >
                                      <Pencil size={17} />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => excluirLancamento(item.id)}
                                    aria-label={`Excluir ${nome}`}
                                    title={
                                      ehReferencia(item)
                                        ? 'Remover lista desta lista'
                                        : 'Excluir lançamento'
                                    }
                                    className="inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                  >
                                    <Trash2 size={17} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
