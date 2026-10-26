import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentMonthRef } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || getCurrentMonthRef();

    const [pessoas, cartoes] = await Promise.all([
      prisma.pessoa.findMany({
        orderBy: [{ isUser: 'desc' }, { nome: 'asc' }],
        include: {
          lancamentos: {
            where: { mesReferencia: month },
            include: { cartao: true, categoria: true },
            orderBy: { data: 'desc' },
          },
          dividas: {
            where: { status: { in: ['PENDENTE', 'PAGO_PARCIAL'] } },
            include: { pagamentos: true },
          },
        },
      }),
      prisma.cartaoCredito.findMany({ where: { ativo: true } }),
    ]);

    const pessoasComTotais = pessoas.map((pessoa) => {
      // Despesas do mês
      const despesas = pessoa.lancamentos.filter((l) => l.tipo === 'DESPESA');
      const receitas = pessoa.lancamentos.filter((l) => l.tipo === 'RECEITA');
      const totalDespesasMes = despesas.reduce((acc, curr) => acc + curr.valor, 0);
      const totalReceitasMes = receitas.reduce((acc, curr) => acc + curr.valor, 0);

      // Despesas em cartão de crédito no mês
      const despesasCartao = despesas.filter((l) => l.cartaoId !== null);
      const totalCartaoMes = despesasCartao.reduce((acc, curr) => acc + curr.valor, 0);

      // Detalhamento por cartão
      const gastosPorCartao = cartoes
        .map((c) => {
          const valor = despesasCartao
            .filter((l) => l.cartaoId === c.id)
            .reduce((acc, curr) => acc + curr.valor, 0);
          return {
            cartaoId: c.id,
            cartaoNome: c.nome,
            cor: c.cor,
            valor,
          };
        })
        .filter((c) => c.valor > 0);

      // Dívidas ativas
      let dividasAReceber = 0; // Esta pessoa me deve
      let dividasAPagar = 0;   // Eu devo a esta pessoa

      pessoa.dividas.forEach((d) => {
        const saldo = Math.max(0, d.valorTotal - d.valorPago);
        if (d.tipo === 'A_RECEBER') {
          dividasAReceber += saldo;
        } else {
          dividasAPagar += saldo;
        }
      });

      // Saldo líquido em relação ao usuário principal:
      // Se for o próprio usuário (isUser), o saldo líquido representa seu balanço geral
      // Se for outra pessoa, representa: quanto ela me deve (cartão no mês + dividas a receber) - quanto eu devo a ela
      const valorQueElaMeDeve = totalCartaoMes + dividasAReceber;
      const valorQueEuDevoAEla = dividasAPagar;
      const saldoLiquido = valorQueElaMeDeve - valorQueEuDevoAEla;

      return {
        id: pessoa.id,
        nome: pessoa.nome,
        relacao: pessoa.relacao,
        isUser: pessoa.isUser,
        telefone: pessoa.telefone,
        cor: pessoa.cor,
        totalDespesasMes,
        totalReceitasMes,
        totalCartaoMes,
        gastosPorCartao,
        dividasAReceber,
        dividasAPagar,
        valorQueElaMeDeve,
        valorQueEuDevoAEla,
        saldoLiquido,
        qtdLancamentos: pessoa.lancamentos.length,
        lancamentosRecentes: pessoa.lancamentos.slice(0, 5),
      };
    });

    return NextResponse.json({ success: true, data: pessoasComTotais });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, relacao, isUser = false, telefone, cor } = body;

    if (!nome) {
      return NextResponse.json({ success: false, error: 'O nome é obrigatório' }, { status: 400 });
    }

    const pessoa = await prisma.pessoa.create({
      data: {
        nome,
        relacao: relacao || null,
        isUser: Boolean(isUser),
        telefone: telefone || null,
        cor: cor || '#4f46e5',
      },
    });

    return NextResponse.json({ success: true, data: pessoa }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
