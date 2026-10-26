import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentMonthRef } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || getCurrentMonthRef();

    // 1. Buscar pessoas e cartões
    const [pessoas, cartoes, categorias, contasFixas] = await Promise.all([
      prisma.pessoa.findMany({ orderBy: { nome: 'asc' } }),
      prisma.cartaoCredito.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
      prisma.categoria.findMany({ orderBy: { nome: 'asc' } }),
      prisma.contaFixa.findMany({
        where: { ativo: true },
        include: {
          pagamentos: {
            where: { mesReferencia: month },
          },
          categoria: true,
        },
        orderBy: { diaVencimento: 'asc' },
      }),
    ]);

    // 2. Buscar lançamentos do mês
    const lancamentosMes = await prisma.lancamento.findMany({
      where: {
        mesReferencia: month,
      },
      include: {
        pessoa: true,
        cartao: true,
        categoria: true,
      },
      orderBy: { data: 'desc' },
    });

    // 3. Buscar dívidas ativas
    const dividas = await prisma.divida.findMany({
      where: {
        status: { in: ['PENDENTE', 'PAGO_PARCIAL'] },
      },
      include: {
        pessoa: true,
      },
    });

    // Cálculos
    // A) Faturas dos cartões
    const despesasCartao = lancamentosMes.filter(
      (l) => l.tipo === 'DESPESA' && l.cartaoId !== null
    );
    const totalFaturas = despesasCartao.reduce((acc, curr) => acc + curr.valor, 0);

    // Faturas por cartão detalhado
    const faturasCartoes = cartoes.map((c) => {
      const lancsCartao = despesasCartao.filter((l) => l.cartaoId === c.id);
      const totalCartao = lancsCartao.reduce((acc, curr) => acc + curr.valor, 0);

      // Agrupar por pessoa neste cartão
      const porPessoaMap: Record<string, { nome: string; cor: string | null; valor: number }> = {};
      lancsCartao.forEach((l) => {
        if (!porPessoaMap[l.pessoaId]) {
          porPessoaMap[l.pessoaId] = {
            nome: l.pessoa.nome,
            cor: l.pessoa.cor,
            valor: 0,
          };
        }
        porPessoaMap[l.pessoaId].valor += l.valor;
      });

      return {
        id: c.id,
        nome: c.nome,
        banco: c.banco,
        titular: c.titular,
        ultimosDigitos: c.ultimosDigitos,
        diaFechamento: c.diaFechamento,
        diaVencimento: c.diaVencimento,
        limite: c.limite,
        cor: c.cor,
        bandeira: c.bandeira,
        totalMes: totalCartao,
        itens: lancsCartao.length,
        divisaoPessoas: Object.values(porPessoaMap),
      };
    });

    // B) Total por pessoa no cartão (quem deve quanto no cartão)
    const dividaCartaoPorPessoaMap: Record<string, { pessoaId: string; nome: string; cor: string | null; isUser: boolean; valor: number }> = {};
    despesasCartao.forEach((l) => {
      if (!dividaCartaoPorPessoaMap[l.pessoaId]) {
        dividaCartaoPorPessoaMap[l.pessoaId] = {
          pessoaId: l.pessoaId,
          nome: l.pessoa.nome,
          cor: l.pessoa.cor,
          isUser: l.pessoa.isUser,
          valor: 0,
        };
      }
      dividaCartaoPorPessoaMap[l.pessoaId].valor += l.valor;
    });

    // C) Minhas despesas pessoais (do titular 'Eu')
    const totalMinhasDespesas = lancamentosMes
      .filter((l) => l.tipo === 'DESPESA' && l.pessoa.isUser)
      .reduce((acc, curr) => acc + curr.valor, 0);

    // Total geral de despesas do mês
    const totalGeralDespesas = lancamentosMes
      .filter((l) => l.tipo === 'DESPESA')
      .reduce((acc, curr) => acc + curr.valor, 0);

    // Total de receitas do mês
    const totalReceitas = lancamentosMes
      .filter((l) => l.tipo === 'RECEITA')
      .reduce((acc, curr) => acc + curr.valor, 0);

    // D) Dívidas gerais: A Receber vs A Pagar
    let totalAReceber = 0;
    let totalAPagar = 0;
    dividas.forEach((d) => {
      const saldoRestante = Math.max(0, d.valorTotal - d.valorPago);
      if (d.tipo === 'A_RECEBER') {
        totalAReceber += saldoRestante;
      } else {
        totalAPagar += saldoRestante;
      }
    });

    // E) Contas fixas pendentes e pagas
    let totalContasFixasPendentes = 0;
    let totalContasFixasPagas = 0;
    const listaContasFixasMes = contasFixas.map((cf) => {
      const pagamento = cf.pagamentos[0];
      const pago = pagamento?.status === 'PAGO';
      const valor = pago ? pagamento.valorPago : cf.valorPadrao;
      if (pago) {
        totalContasFixasPagas += valor;
      } else {
        totalContasFixasPendentes += valor;
      }
      return {
        id: cf.id,
        descricao: cf.descricao,
        valor: cf.valorPadrao,
        diaVencimento: cf.diaVencimento,
        categoria: cf.categoria?.nome,
        pago,
        pagamentoId: pagamento?.id,
      };
    });

    // F) Próximos vencimentos combinados (contas fixas + faturas dos cartões)
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const proximosVencimentos: Array<{
      id: string;
      titulo: string;
      tipo: 'CARTAO' | 'CONTA_FIXA';
      dia: number;
      valor: number;
      status: 'PAGO' | 'PENDENTE';
      diasRestantes: number;
      categoria?: string;
    }> = [];

    // Adiciona contas fixas aos vencimentos
    listaContasFixasMes.forEach((cf) => {
      proximosVencimentos.push({
        id: `cf-${cf.id}`,
        titulo: cf.descricao,
        tipo: 'CONTA_FIXA',
        dia: cf.diaVencimento,
        valor: cf.valor,
        status: cf.pago ? 'PAGO' : 'PENDENTE',
        diasRestantes: cf.diaVencimento - diaHoje,
        categoria: cf.categoria || 'Contas Fixas',
      });
    });

    // Adiciona cartões aos vencimentos
    faturasCartoes.forEach((c) => {
      if (c.totalMes > 0) {
        proximosVencimentos.push({
          id: `cartao-${c.id}`,
          titulo: `Fatura ${c.nome}`,
          tipo: 'CARTAO',
          dia: c.diaVencimento,
          valor: c.totalMes,
          status: 'PENDENTE',
          diasRestantes: c.diaVencimento - diaHoje,
          categoria: 'Cartão de Crédito',
        });
      }
    });

    // Ordenar vencimentos pelo dia mais próximo
    proximosVencimentos.sort((a, b) => a.dia - b.dia);

    // G) Gastos por Categoria
    const catMap: Record<string, { nome: string; cor: string | null; total: number }> = {};
    categorias.forEach((c) => {
      catMap[c.id] = { nome: c.nome, cor: c.cor, total: 0 };
    });
    lancamentosMes
      .filter((l) => l.tipo === 'DESPESA')
      .forEach((l) => {
        const catId = l.categoriaId || 'outros';
        if (!catMap[catId]) {
          catMap[catId] = { nome: 'Outros', cor: '#64748b', total: 0 };
        }
        catMap[catId].total += l.valor;
      });

    const gastosPorCategoria = Object.values(catMap)
      .filter((c) => c.total > 0)
      .map((c) => ({
        ...c,
        percentual: totalGeralDespesas > 0 ? (c.total / totalGeralDespesas) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // H) Gastos por Pessoa (todas as despesas da pessoa no mês)
    const pessoaMap: Record<string, { id: string; nome: string; relacao: string | null; cor: string | null; isUser: boolean; total: number }> = {};
    pessoas.forEach((p) => {
      pessoaMap[p.id] = {
        id: p.id,
        nome: p.nome,
        relacao: p.relacao,
        cor: p.cor,
        isUser: p.isUser,
        total: 0,
      };
    });

    lancamentosMes
      .filter((l) => l.tipo === 'DESPESA')
      .forEach((l) => {
        if (pessoaMap[l.pessoaId]) {
          pessoaMap[l.pessoaId].total += l.valor;
        }
      });

    const gastosPorPessoa = Object.values(pessoaMap)
      .map((p) => ({
        ...p,
        percentual: totalGeralDespesas > 0 ? (p.total / totalGeralDespesas) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      data: {
        mesReferencia: month,
        totalFaturas,
        totalMinhasDespesas,
        totalGeralDespesas,
        totalReceitas,
        totalAReceber,
        totalAPagar,
        totalContasFixasPendentes,
        totalContasFixasPagas,
        faturasCartoes,
        dividaCartaoPorPessoa: Object.values(dividaCartaoPorPessoaMap),
        proximosVencimentos,
        gastosPorCategoria,
        gastosPorPessoa,
        totalLancamentos: lancamentosMes.length,
      },
    });
  } catch (error: any) {
    console.error('Erro na API /api/dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao carregar dados do dashboard',
      },
      { status: 500 }
    );
  }
}
