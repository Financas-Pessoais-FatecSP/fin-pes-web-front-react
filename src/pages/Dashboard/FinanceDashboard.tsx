import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileChartColumn,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';

type Account = { id: number; name: string; status: string };
type Category = { id: number; name: string; type: 'RECEITA' | 'DESPESA' };
type SummaryEntry = {
  id: number | null;
  account: Account;
  category: { id: number; name: string; type: string } | null;
  type: string;
  description: string;
  amount: number;
  date: string;
  details: string | null;
};
type Entry = {
  id: number;
  accountId: number;
  categoryId: number | null;
  type: 'RECEITA' | 'DESPESA';
  description: string;
  amount: number;
  date: string;
  details: string | null;
};
type AccountEntries = {
  accountId: number;
  accountName: string;
  accountStatus: string;
  accountEntries: Entry[];
};
type Summary = {
  totalRevenues: number;
  totalExpenses: number;
  balance: number;
  balanceByAccount: (Account & { balance: number })[];
  recentEntries: SummaryEntry[];
};
type CategoryReport = { totalAmount: number; entries: Entry[] };
type Report = {
  totalRevenues: number;
  totalExpenses: number;
  balance: number;
  revenuesByCategory: Record<string, CategoryReport>;
  expensesByCategory: Record<string, CategoryReport>;
};
type Panel = 'overview' | 'entries' | 'accounts' | 'categories' | 'reports';

const NAV_ITEMS: { id: Panel; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Visão geral', Icon: LayoutDashboard },
  { id: 'entries', label: 'Lançamentos', Icon: FileChartColumn },
  { id: 'accounts', label: 'Contas', Icon: Wallet },
  { id: 'categories', label: 'Categorias', Icon: Tags },
  { id: 'reports', label: 'Relatórios', Icon: FileChartColumn },
];

const CHART_COLORS = ['#147d64', '#e3a72f', '#3976a8', '#c34d46', '#7b8f34', '#6e5e9d'];

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function monthDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
}

export default function FinanceDashboard() {
  const { token, user, signOut } = useAuth();
  const initialPeriod = monthDates();
  const [panel, setPanel] = useState<Panel>('overview');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entriesByAccount, setEntriesByAccount] = useState<Record<number, Entry[]>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [from, setFrom] = useState(initialPeriod.from);
  const [to, setTo] = useState(initialPeriod.to);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [accountName, setAccountName] = useState('');
  const [editingAccount, setEditingAccount] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'RECEITA' | 'DESPESA'>('DESPESA');
  const [entryType, setEntryType] = useState<'RECEITA' | 'DESPESA'>('DESPESA');
  const [entryAccountId, setEntryAccountId] = useState('');
  const [entryCategoryId, setEntryCategoryId] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDate, setEntryDate] = useState(today());
  const [entryDetails, setEntryDetails] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!token) return;
    const authToken = token;
    let active = true;

    async function load() {
      if (from && to && from > to) {
        setLoading(false);
        setError('A data inicial não pode ser posterior à data final.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        if (panel === 'overview') {
          const nextSummary = await apiRequest<Summary>(
            `/dashboards/financial-summary?from=${from}&to=${to}`,
            {},
            authToken,
          );
          if (!active) return;
          setSummary(nextSummary);
          return;
        }

        const [accountData, categoryData, nextReport] =
          await Promise.all([
            apiRequest<{ accounts: Account[] }>('/accounts', {}, authToken),
            apiRequest<{ categories: Category[] }>('/entries/categories', {}, authToken),
            apiRequest<Report>(`/reports/entries?from=${from}&to=${to}`, {}, authToken),
          ]);
        const accountEntries = await Promise.all(
          accountData.accounts.map(async (account) => {
            const result = await apiRequest<AccountEntries>(
              `/entries?accountId=${account.id}`,
              {},
              authToken,
            );
            return [account.id, result.accountEntries ?? []] as const;
          }),
        );
        if (!active) return;
        setAccounts(accountData.accounts);
        setCategories(categoryData.categories);
        setReport(nextReport);
        setEntriesByAccount(Object.fromEntries(accountEntries));
        setEntryAccountId((current) => current || String(accountData.accounts[0]?.id ?? ''));
      } catch {
        if (active) setError('Não foi possível carregar os dados. Confira a API e tente novamente.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [token, from, to, refreshKey, panel]);

  const allEntries = useMemo(
    () => Object.values(entriesByAccount).flat(),
    [entriesByAccount],
  );
  const activeAccounts = accounts.filter((account) => account.status === 'ATIVA');
  const availableCategories = categories.filter((category) => category.type === entryType);
  const filteredEntries = allEntries
    .filter((entry) => filterAccount === 'all' || entry.accountId === Number(filterAccount))
    .filter((entry) => filterCategory === 'all' || entry.categoryId === Number(filterCategory))
    .filter((entry) => filterType === 'all' || entry.type === filterType)
    .filter((entry) => !filterFrom || entry.date >= filterFrom)
    .filter((entry) => !filterTo || entry.date <= filterTo)
    .sort((left, right) => right.date.localeCompare(left.date) || right.id - left.id);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const pageEntries = filteredEntries.slice(page * pageSize, (page + 1) * pageSize);

  function showError(message: string) {
    setNotice('');
    setError(message);
  }

  function clearFeedback(message: string) {
    setError('');
    setNotice(message);
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !accountName.trim()) return;
    setBusy(true);
    try {
      await apiRequest('/accounts', {
        method: 'POST',
        body: JSON.stringify({ name: accountName.trim() }),
      }, token);
      setAccountName('');
      clearFeedback('Conta criada.');
      setRefreshKey((key) => key + 1);
    } catch {
      showError('Não foi possível criar a conta.');
    } finally {
      setBusy(false);
    }
  }

  async function updateAccount(event: FormEvent<HTMLFormElement>, account: Account) {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await apiRequest(`/accounts/${account.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          newAccountName: String(form.get('name')).trim(),
          newAccountStatus: String(form.get('status')),
        }),
      }, token);
      setEditingAccount(null);
      clearFeedback('Conta atualizada.');
      setRefreshKey((key) => key + 1);
    } catch {
      showError('Não foi possível atualizar a conta.');
    } finally {
      setBusy(false);
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !categoryName.trim()) return;
    setBusy(true);
    try {
      await apiRequest('/entries/categories', {
        method: 'POST',
        body: JSON.stringify({ name: categoryName.trim(), type: categoryType }),
      }, token);
      setCategoryName('');
      clearFeedback('Categoria criada.');
      setRefreshKey((key) => key + 1);
    } catch {
      showError('Não foi possível criar a categoria.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(categoryId: number) {
    if (!token || !window.confirm('Excluir esta categoria?')) return;
    setBusy(true);
    try {
      await apiRequest(`/entries/categories/${categoryId}`, { method: 'DELETE' }, token);
      clearFeedback('Categoria excluída.');
      setRefreshKey((key) => key + 1);
    } catch {
      showError('Não foi possível excluir a categoria. Ela pode estar vinculada a lançamentos.');
    } finally {
      setBusy(false);
    }
  }

  async function createEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const amount = Number(entryAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0 || !entryAccountId || !entryDate) {
      showError('Informe conta, data e um valor maior que zero.');
      return;
    }
    setBusy(true);
    try {
      await apiRequest('/entries', {
        method: 'POST',
        body: JSON.stringify({
          accountId: Number(entryAccountId),
          categoryId: entryCategoryId ? Number(entryCategoryId) : null,
          type: entryType,
          description: entryDescription.trim(),
          amount,
          date: entryDate,
          details: entryDetails.trim() || null,
        }),
      }, token);
      setEntryDescription('');
      setEntryAmount('');
      setEntryDetails('');
      setEntryDate(today());
      clearFeedback('Lançamento registrado.');
      setRefreshKey((key) => key + 1);
    } catch {
      showError('Não foi possível registrar o lançamento.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteEntry(entryId: number) {
    if (!token || !window.confirm('Excluir este lançamento?')) return;
    setBusy(true);
    try {
      await apiRequest(`/entries/${entryId}`, { method: 'DELETE' }, token);
      clearFeedback('Lançamento excluído.');
      setRefreshKey((key) => key + 1);
    } catch {
      showError('Não foi possível excluir o lançamento.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass = 'w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15';
  const labelClass = 'mb-1.5 block text-xs font-semibold text-stone-700';
  const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-md bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50';

  function renderEntries(rows: Entry[]) {
    if (!rows.length) {
      return <p className="px-4 py-10 text-center text-sm text-stone-500">Nenhum lançamento neste período.</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
            <tr><th className="px-4 py-3 font-semibold">Descrição</th><th className="px-4 py-3 font-semibold">Conta</th><th className="px-4 py-3 font-semibold">Data</th><th className="px-4 py-3 text-right font-semibold">Valor</th><th className="w-12 px-2 py-3" /></tr>
          </thead>
          <tbody>
            {rows.map((entry) => {
              const category = categories.find((item) => item.id === entry.categoryId);
              const account = accounts.find((item) => item.id === entry.accountId);
              const isRevenue = entry.type === 'RECEITA';
              return (
                <tr key={entry.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3"><p className="font-medium text-stone-900">{entry.description}</p><p className="mt-0.5 text-xs text-stone-500">{category?.name ?? 'Sem categoria'}</p></td>
                  <td className="px-4 py-3 text-stone-600">{account?.name ?? 'Conta'}</td>
                  <td className="px-4 py-3 text-stone-600">{dateLabel(entry.date)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${isRevenue ? 'text-emerald-700' : 'text-rose-700'}`}>{isRevenue ? '+' : '-'} {money(entry.amount)}</td>
                  <td className="px-2 py-3 text-right"><button type="button" onClick={() => void deleteEntry(entry.id)} disabled={busy} aria-label={`Excluir ${entry.description}`} title="Excluir lançamento" className="rounded p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 size={16} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderSummaryEntries(rows: SummaryEntry[]) {
    if (!rows.length) {
      return <p className="px-4 py-10 text-center text-sm text-stone-500">Nenhum lançamento neste período.</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
            <tr><th className="px-4 py-3 font-semibold">Descrição</th><th className="px-4 py-3 font-semibold">Conta</th><th className="px-4 py-3 font-semibold">Data</th><th className="px-4 py-3 text-right font-semibold">Valor</th><th className="w-12 px-2 py-3" /></tr>
          </thead>
          <tbody>
            {rows.map((entry, index) => {
              const isRevenue = entry.type === 'RECEITA';
              const entryId = entry.id;
              return (
                <tr key={entry.id ?? `${entry.date}-${index}`} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3"><p className="font-medium text-stone-900">{entry.description}</p><p className="mt-0.5 text-xs text-stone-500">{entry.category?.name ?? 'Sem categoria'}</p></td>
                  <td className="px-4 py-3 text-stone-600">{entry.account.name}</td>
                  <td className="px-4 py-3 text-stone-600">{dateLabel(entry.date)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${isRevenue ? 'text-emerald-700' : 'text-rose-700'}`}>{isRevenue ? '+' : '-'} {money(entry.amount)}</td>
                  <td className="px-2 py-3 text-right">{entryId !== null && <button type="button" onClick={() => void deleteEntry(entryId)} disabled={busy} aria-label={`Excluir ${entry.description}`} title="Excluir lançamento" className="rounded p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 size={16} /></button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderCategoryEntries(groups: Record<string, CategoryReport>) {
    const categories = Object.entries(groups).sort(
      ([, left], [, right]) => right.totalAmount - left.totalAmount,
    );

    return (
      <div className="mt-6 border-t border-stone-200 pt-5">
        <h3 className="mb-3 text-sm font-bold text-stone-900">
          Lançamentos por categoria
        </h3>
        <div className="divide-y divide-stone-200">
          {categories.map(([name, category]) => {
            const entries = [...(category.entries ?? [])].sort(
              (left, right) => right.date.localeCompare(left.date) || right.id - left.id,
            );

            return (
              <section key={name} className="py-5 first:pt-0 last:pb-0">
                <div className="mb-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                      Categoria
                    </p>
                    <h4 className="mt-1 text-base font-bold text-stone-950">
                      {name === 'Empty' || !name.trim() ? 'Sem categoria' : name}
                    </h4>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                      Subtotal · {entries.length} {entries.length === 1 ? 'lançamento' : 'lançamentos'}
                    </p>
                    <p className="mt-1 text-lg font-bold text-stone-950">
                      {money(category.totalAmount)}
                    </p>
                  </div>
                </div>
                {entries.length ? (
                  <ul className="mt-3 divide-y divide-stone-100 border-t border-stone-200">
                    {entries.map((entry) => {
                      const isRevenue = entry.type === 'RECEITA';
                      const accountName = accounts.find(
                        (account) => account.id === entry.accountId,
                      )?.name ?? 'Conta';

                      return (
                        <li
                          key={entry.id}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4"
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                              Descrição
                            </p>
                            <p className="mt-1 break-words font-semibold text-stone-950">
                              {entry.description}
                            </p>
                            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                              <div>
                                <dt className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
                                  Data
                                </dt>
                                <dd className="mt-0.5 text-sm font-medium text-stone-800">
                                  {dateLabel(entry.date)}
                                </dd>
                              </div>
                              <div className="min-w-0">
                                <dt className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
                                  Conta
                                </dt>
                                <dd className="mt-0.5 truncate text-sm font-medium text-stone-800">
                                  {accountName}
                                </dd>
                              </div>
                            </dl>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
                              Valor
                            </p>
                            <p className={`mt-1 whitespace-nowrap text-lg font-bold ${isRevenue ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {isRevenue ? '+' : '-'} {money(entry.amount)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-stone-500">Nenhum lançamento nesta categoria.</p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  function renderCategoryDonut(
    heading: string,
    totalLabel: string,
    groups: Record<string, CategoryReport>,
    total: number,
  ) {
    const data = Object.entries(groups)
      .map(([name, value]) => ({
        name: name === 'Empty' || !name.trim() ? 'Sem categoria' : name,
        amount: value.totalAmount,
      }))
      .filter((category) => category.amount > 0)
      .sort((left, right) => right.amount - left.amount);

    return (
      <section className="min-w-0">
        <h2 className="mb-3 font-bold">{heading}</h2>
        {data.length ? (
          <div className="grid min-w-0 gap-5 border-y border-stone-200 bg-white p-4 xl:grid-cols-[minmax(240px,340px)_1fr] xl:items-center">
            <div className="relative mx-auto h-60 w-full max-w-[340px] min-w-0 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {data.map((category, index) => (
                      <Cell
                        key={category.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => money(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-stone-500">{totalLabel}</span>
                <strong className="mt-1 text-lg text-stone-900">{money(total)}</strong>
              </div>
            </div>
            <ul className="space-y-3">
              {data.map((category, index) => (
                <li key={category.name} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-stone-800">
                    {category.name}
                  </span>
                  <span className="whitespace-nowrap text-stone-700">
                    {money(category.amount)}
                  </span>
                  <span className="w-14 text-right font-semibold text-stone-900">
                    {total ? `${((category.amount / total) * 100).toFixed(1)}%` : '0.0%'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="border-y border-stone-200 bg-white px-4 py-8 text-sm text-stone-500">
            Sem dados no período.
          </p>
        )}
        {data.length > 0 && renderCategoryEntries(groups)}
      </section>
    );
  }

  const activePanelTitle = NAV_ITEMS.find((item) => item.id === panel)?.label ?? 'Visão geral';

  return (
    <div className="min-h-screen bg-[#f5f7f2] text-stone-900 md:flex">
      <aside className="flex shrink-0 flex-col bg-[#103d2f] text-white md:min-h-screen md:w-60">
        <div className="flex items-center justify-between px-5 py-5 md:px-6"><a href="/dashboard" className="font-ultra text-2xl tracking-normal">Equilibra<span className="text-lime-300">Fin</span></a><button type="button" onClick={signOut} aria-label="Sair" title="Sair" className="rounded p-2 text-emerald-100 hover:bg-white/10 md:hidden"><LogOut size={18} /></button></div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3 md:py-4">
          {NAV_ITEMS.map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => setPanel(id)} className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition ${panel === id ? 'bg-lime-300 text-emerald-950' : 'text-emerald-100 hover:bg-white/10'}`}><Icon size={18} />{label}</button>)}
        </nav>
        <div className="mt-auto hidden border-t border-white/15 p-4 md:block"><p className="truncate text-sm font-medium">{user ? `${user.name} ${user.surname}` : 'Minha conta'}</p><button type="button" onClick={signOut} className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-100 hover:text-white"><LogOut size={15} /> Encerrar sessão</button></div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4 md:px-9"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Finanças pessoais</p><h1 className="mt-1 text-xl font-bold text-stone-950">{activePanelTitle}</h1></div><p className="hidden text-sm text-stone-500 sm:block">{user?.name} {user?.surname}</p></header>
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-9 md:py-8">
          {(error || notice) && <div className={`mb-5 flex items-center justify-between rounded-md border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`} role={error ? 'alert' : 'status'}><span>{error || notice}</span><button type="button" onClick={() => { setError(''); setNotice(''); }} aria-label="Fechar mensagem" className="ml-4 font-bold">×</button></div>}
          {loading ? <div className="py-20 text-center text-sm text-stone-500">Carregando dados financeiros...</div> : <>
            {(panel === 'overview' || panel === 'reports') && <div className="mb-6 flex flex-wrap items-end gap-3"><div><label className={labelClass} htmlFor="period-from">De</label><input id="period-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} /></div><div><label className={labelClass} htmlFor="period-to">Até</label><input id="period-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} /></div></div>}

            {panel === 'overview' && <>
              <section className="grid gap-3 sm:grid-cols-3"><article className="border-l-4 border-emerald-700 bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">Saldo do período</p><p className="mt-3 text-2xl font-bold">{money(summary?.balance ?? 0)}</p></article><article className="border-l-4 border-teal-500 bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">Receitas</p><p className="mt-3 flex items-center gap-2 text-2xl font-bold text-emerald-800"><ArrowUpRight size={20} />{money(summary?.totalRevenues ?? 0)}</p></article><article className="border-l-4 border-rose-500 bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">Despesas</p><p className="mt-3 flex items-center gap-2 text-2xl font-bold text-rose-700"><ArrowDownRight size={20} />{money(summary?.totalExpenses ?? 0)}</p></article></section>
              <section className="mt-8"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold">Contas</h2><button type="button" onClick={() => setPanel('accounts')} className="text-sm font-semibold text-emerald-800 hover:underline">Gerenciar contas</button></div>{summary?.balanceByAccount.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{summary.balanceByAccount.map((account) => <article key={account.id} className="flex items-center justify-between border border-stone-200 bg-white p-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><Wallet size={19} /></span><div className="min-w-0"><p className="truncate font-semibold">{account.name}</p><p className="text-xs text-stone-500">{account.status.toLowerCase()}</p></div></div><p className="font-bold">{money(account.balance)}</p></article>)}</div> : <p className="border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">Nenhuma conta cadastrada.</p>}</section>
              <section className="mt-8 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-stone-200 px-4 py-4"><h2 className="font-bold">Lançamentos recentes</h2><button type="button" onClick={() => setPanel('entries')} className="text-sm font-semibold text-emerald-800 hover:underline">Ver todos</button></div>{renderSummaryEntries((summary?.recentEntries ?? []).slice(0, 5))}</section>
            </>}

            {panel === 'accounts' && <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"><section><h2 className="mb-3 text-base font-bold">Suas contas</h2><div className="divide-y divide-stone-200 border-y border-stone-200 bg-white">{accounts.map((account) => editingAccount === account.id ? <form key={account.id} onSubmit={(event) => void updateAccount(event, account)} className="grid gap-3 p-4 sm:grid-cols-[1fr_150px_auto_auto] sm:items-end"><div><label className={labelClass} htmlFor={`account-name-${account.id}`}>Nome</label><input id={`account-name-${account.id}`} name="name" defaultValue={account.name} required className={inputClass} /></div><div><label className={labelClass} htmlFor={`account-status-${account.id}`}>Status</label><select id={`account-status-${account.id}`} name="status" defaultValue={account.status} className={inputClass}><option value="ATIVA">Ativa</option><option value="INATIVA">Inativa</option></select></div><button disabled={busy} className={primaryButton}>Salvar</button><button type="button" onClick={() => setEditingAccount(null)} className="rounded-md px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">Cancelar</button></form> : <div key={account.id} className="flex items-center justify-between gap-4 p-4"><div><p className="font-semibold">{account.name}</p><p className="mt-1 text-xs text-stone-500">{account.status}</p></div><button type="button" onClick={() => setEditingAccount(account.id)} aria-label={`Editar ${account.name}`} title="Editar conta" className="rounded p-2 text-stone-600 hover:bg-stone-100"><Pencil size={17} /></button></div>)}</div></section><form onSubmit={(event) => void createAccount(event)} className="h-fit border border-stone-200 bg-white p-5"><h2 className="font-bold">Nova conta</h2><label className={`${labelClass} mt-4`} htmlFor="new-account">Nome da conta</label><input id="new-account" value={accountName} onChange={(event) => setAccountName(event.target.value)} required maxLength={80} className={inputClass} placeholder="Ex.: Conta corrente" /><button disabled={busy} className={`${primaryButton} mt-4 w-full`}><Plus size={17} />Criar conta</button></form></div>}

            {panel === 'categories' && <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"><section><h2 className="mb-3 text-base font-bold">Categorias cadastradas</h2><div className="divide-y divide-stone-200 border-y border-stone-200 bg-white">{categories.length ? categories.map((category) => <div key={category.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-semibold">{category.name}</p><p className="mt-1 text-xs text-stone-500">{category.type === 'RECEITA' ? 'Receita' : 'Despesa'}</p></div><button type="button" onClick={() => void deleteCategory(category.id)} disabled={busy} aria-label={`Excluir ${category.name}`} title="Excluir categoria" className="rounded p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={17} /></button></div>) : <p className="px-4 py-10 text-center text-sm text-stone-500">Nenhuma categoria encontrada.</p>}</div></section><form onSubmit={(event) => void createCategory(event)} className="h-fit border border-stone-200 bg-white p-5"><h2 className="font-bold">Nova categoria</h2><label className={`${labelClass} mt-4`} htmlFor="category-name">Nome</label><input id="category-name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required maxLength={60} className={inputClass} /><label className={`${labelClass} mt-4`} htmlFor="category-type">Tipo</label><select id="category-type" value={categoryType} onChange={(event) => setCategoryType(event.target.value as 'RECEITA' | 'DESPESA')} className={inputClass}><option value="DESPESA">Despesa</option><option value="RECEITA">Receita</option></select><button disabled={busy} className={`${primaryButton} mt-4 w-full`}><Plus size={17} />Criar categoria</button></form></div>}

            {panel === 'entries' && <>
              <form onSubmit={(event) => void createEntry(event)} className="mb-8 border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-bold">Novo lançamento</h2>
                  <div className="flex rounded-md border border-stone-300 p-1">
                    <button type="button" onClick={() => { setEntryType('DESPESA'); setEntryCategoryId(''); }} className={`rounded px-3 py-1.5 text-sm font-semibold ${entryType === 'DESPESA' ? 'bg-rose-100 text-rose-800' : 'text-stone-600'}`}>Despesa</button>
                    <button type="button" onClick={() => { setEntryType('RECEITA'); setEntryCategoryId(''); }} className={`rounded px-3 py-1.5 text-sm font-semibold ${entryType === 'RECEITA' ? 'bg-emerald-100 text-emerald-800' : 'text-stone-600'}`}>Receita</button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className={labelClass} htmlFor="entry-description">Descrição</label>
                    <input id="entry-description" value={entryDescription} onChange={(event) => setEntryDescription(event.target.value)} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="entry-amount">Valor</label>
                    <input id="entry-amount" inputMode="decimal" value={entryAmount} onChange={(event) => setEntryAmount(event.target.value)} required className={inputClass} placeholder="0,00" />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="entry-account">Conta</label>
                    <select id="entry-account" value={entryAccountId} onChange={(event) => setEntryAccountId(event.target.value)} required className={inputClass}>
                      <option value="">Selecione</option>
                      {activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="entry-category">Categoria (opcional)</label>
                    <select id="entry-category" value={entryCategoryId} onChange={(event) => setEntryCategoryId(event.target.value)} className={inputClass}>
                      <option value="">Sem categoria</option>
                      {availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="entry-date">Data</label>
                    <input id="entry-date" type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} required className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="entry-details">Detalhes (opcional)</label>
                    <input id="entry-details" value={entryDetails} onChange={(event) => setEntryDetails(event.target.value)} className={inputClass} />
                  </div>
                  <div className="flex items-end">
                    <button disabled={busy || !activeAccounts.length} className={`${primaryButton} w-full}`}>
                      <Plus size={17} />Registrar
                    </button>
                  </div>
                </div>
              </form>
              <section className="border border-stone-200 bg-white shadow-sm"><div className="border-b border-stone-200 p-4"><h2 className="font-bold">Movimentações</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><div><label className={labelClass} htmlFor="filter-account">Conta</label><select id="filter-account" value={filterAccount} onChange={(event) => { setFilterAccount(event.target.value); setPage(0); }} className={inputClass}><option value="all">Todas</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></div><div><label className={labelClass} htmlFor="filter-category">Categoria</label><select id="filter-category" value={filterCategory} onChange={(event) => { setFilterCategory(event.target.value); setPage(0); }} className={inputClass}><option value="all">Todas</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div><label className={labelClass} htmlFor="filter-type">Tipo</label><select id="filter-type" value={filterType} onChange={(event) => { setFilterType(event.target.value); setPage(0); }} className={inputClass}><option value="all">Todos</option><option value="RECEITA">Receitas</option><option value="DESPESA">Despesas</option></select></div><div><label className={labelClass} htmlFor="filter-from">De</label><input id="filter-from" type="date" value={filterFrom} onChange={(event) => { setFilterFrom(event.target.value); setPage(0); }} className={inputClass} /></div><div><label className={labelClass} htmlFor="filter-to">Até</label><input id="filter-to" type="date" value={filterTo} onChange={(event) => { setFilterTo(event.target.value); setPage(0); }} className={inputClass} /></div></div></div>{renderEntries(pageEntries)}<footer className="flex items-center justify-between border-t border-stone-200 px-4 py-3 text-sm text-stone-600"><span>{filteredEntries.length} lançamento(s)</span><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} aria-label="Página anterior" className="rounded border border-stone-300 p-1.5 disabled:opacity-40"><ChevronLeft size={17} /></button><span>{page + 1} / {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page >= pageCount - 1} aria-label="Próxima página" className="rounded border border-stone-300 p-1.5 disabled:opacity-40"><ChevronRight size={17} /></button></div></footer></section>
            </>}

            {panel === 'reports' && report && <>
              <div className="mb-6 overflow-x-auto border-b border-stone-200">
                <div className="flex min-w-max gap-1" role="tablist" aria-label="Relatório financeiro">
                  <button
                    id="report-tab-summary"
                    type="button"
                    role="tab"
                    aria-selected="true"
                    aria-controls="report-panel"
                    className="border-b-2 border-emerald-800 px-4 py-3 text-sm font-semibold text-emerald-900"
                  >
                    Resumo Financeiro
                  </button>
                </div>
              </div>

              <div id="report-panel" role="tabpanel" aria-labelledby="report-tab-summary">
                <section className="grid gap-3 sm:grid-cols-3">
                  <article className="bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">Receitas no período</p><p className="mt-2 text-xl font-bold text-emerald-800">{money(report.totalRevenues)}</p></article>
                  <article className="bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">Despesas no período</p><p className="mt-2 text-xl font-bold text-rose-700">{money(report.totalExpenses)}</p></article>
                  <article className="bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">Saldo</p><p className="mt-2 text-xl font-bold">{money(report.balance)}</p></article>
                </section>
                <div className="mt-8 grid gap-8 lg:grid-cols-2">
                  {renderCategoryDonut('Receitas por categoria', 'Total de receitas', report.revenuesByCategory, report.totalRevenues)}
                  {renderCategoryDonut('Despesas por categoria', 'Total de despesas', report.expensesByCategory, report.totalExpenses)}
                </div>
              </div>
            </>}
          </>}
        </div>
      </main>
    </div>
  );
}