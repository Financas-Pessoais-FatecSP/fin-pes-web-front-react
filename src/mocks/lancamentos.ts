const dadosFinanceiros = {
  lista: {
    id: 1,
    nome: 'Despesas de Outubro',
    mes: 10,
    ano: 2026,
    moeda: 'BRL',
  },

  lancamentos: [
    {
      id: 1,
      descricao: 'Salário',
      categoria: 'Trabalho',
      tipo: 'receita',
      valor: 3500,
      data: '2026-10-05',
      observacao: 'Salário mensal',
    },
    {
      id: 2,
      descricao: 'Aluguel',
      categoria: 'Moradia',
      tipo: 'despesa',
      valor: 900,
      data: '2026-10-10',
      observacao: 'Aluguel mensal',
    },
    {
      id: 3,
      descricao: 'Supermercado',
      categoria: 'Alimentação',
      tipo: 'despesa',
      valor: 350,
      data: '2026-10-12',
      observacao: 'Compras do mês',
    },
    {
      id: 4,
      descricao: 'Internet',
      categoria: 'Contas fixas',
      tipo: 'despesa',
      valor: 100,
      data: '2026-10-15',
      observacao: 'Plano de internet',
    },
    {
      id: 5,
      descricao: 'Freelance',
      categoria: 'Renda extra',
      tipo: 'receita',
      valor: 450,
      data: '2026-10-18',
      observacao: 'Projeto extra',
    },
    {
      id: 6,
      descricao: 'Transporte',
      categoria: 'Mobilidade',
      tipo: 'despesa',
      valor: 180,
      data: '2026-10-20',
      observacao: 'Transporte do mês',
    },
  ],
};

export default dadosFinanceiros;
