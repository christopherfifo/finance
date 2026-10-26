import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentMonthRef, formatDayToDateBR, formatMonthYearBR } from '@/lib/utils';
import { Periodicidade } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || getCurrentMonthRef();

    // 1. Buscar todas as contas fixas ativas com seus relacionamentos
    const todasContas = await prisma.contaFixa.findMany({
      where: {
        ativo: true,
      },
      include: {
        categoria: true,
        cartao: true,
        pessoa: true,
        pagamentos: {
          where: { mesReferencia: month },
        },
      },
      orderBy: [{ diaDesconto: 'asc' }, { diaVencimento: 'asc' }],
    });

    // 2. Filtrar pelo mês de início e mês de fim
    // Uma conta só é exibida se: (!mesInicio || mesInicio <= month) e (!mesFim || mesFim >= month)
    const contas = todasContas.filter((conta) => {
      if (conta.mesInicio && month < conta.mesInicio) return false;
      if (conta.mesFim && month > conta.mesFim) return false;
      return true;
    });

    const hoje = new Date();
    const currentMonthReal = getCurrentMonthRef();
    const diaHoje = hoje.getDate();

    // ─── Auto-criação lazy de Lancamento para contas com cartão vinculado ────────
    // Para cada conta ativa do mês que usa CARTAO_CREDITO ou DEBITO_AUTOMATICO
    // e cujo dia de desconto/vencimento já chegou, garantir que existe um Lancamento real.
    for (const conta of contas) {
      if (!conta.cartaoId) continue;
      if (conta.formaPagamento !== 'CARTAO_CREDITO' && conta.formaPagamento !== 'DEBITO_AUTOMATICO') continue;

      const diaEfetivo = conta.diaDesconto || conta.diaVencimento;

      // Determinar se deve efetivar o lançamento:
      // - Mês passado (< currentMonthReal): sim, sempre
      // - Mês atual (=== currentMonthReal) e diaEfetivo <= diaHoje: sim
      // - Mês futuro (> currentMonthReal): não
      const deveEfetivar =
        month < currentMonthReal ||
        (month === currentMonthReal && diaEfetivo <= diaHoje);

      if (!deveEfetivar) continue;

      // Verificar se já existe um lançamento gerado por esta conta fixa neste mês
      const lancExistente = await prisma.lancamento.findFirst({
        where: {
          contaFixaOrigemId: conta.id,
          mesReferencia: month,
        },
      });

      if (lancExistente) continue; // Já criado anteriormente

      // Determinar pessoaId: usar pessoaId da conta, ou buscar o usuário principal
      let pessoaId = conta.pessoaId;
      if (!pessoaId) {
        const userPessoa = await prisma.pessoa.findFirst({ where: { isUser: true } });
        pessoaId = userPessoa?.id || null;
      }
      if (!pessoaId) continue; // Sem pessoa associada, pular

      // Criar a data do lançamento como o dia de vencimento naquele mês (cap em 28 para segurança)
      const [yearStr, monthStr] = month.split('-');
      const dataLanc = new Date(parseInt(yearStr), parseInt(monthStr) - 1, Math.min(diaEfetivo, 28));

      await prisma.lancamento.create({
        data: {
          descricao: conta.descricao,
          valor: conta.valorPadrao,
          data: dataLanc,
          mesReferencia: month,
          tipo: 'DESPESA',
          status: 'PENDENTE',
          observacoes: conta.observacoes || null,
          isParcelado: false,
          parcelaAtual: 1,
          totalParcelas: 1,
          categoriaId: conta.categoriaId || null,
          cartaoId: conta.cartaoId,
          pessoaId: pessoaId,
          contaFixaOrigemId: conta.id,
        },
      });
    }
    // ─── Fim auto-criação ──────────────────────────────────────────────────────────

    let totalPrevisto = 0;
    let totalPago = 0;
    let totalPendente = 0;

    const contasComStatus = contas.map((conta) => {
      const pagamento = conta.pagamentos[0];
      const pago = pagamento?.status === 'PAGO';
      const valor = pago ? pagamento.valorPago : conta.valorPadrao;

      totalPrevisto += conta.valorPadrao;
      if (pago) {
        totalPago += valor;
      } else {
        totalPendente += conta.valorPadrao;
      }

      // Cálculo de status de desconto no cartão / débito
      const diaEfetivoDesconto = conta.diaDesconto || conta.diaVencimento;
      let isDescontado = false;

      if (pago) {
        isDescontado = true;
      } else if (month < currentMonthReal) {
        // Mês passado: se não foi pago, é atrasado / vencido
        isDescontado = true;
      } else if (month > currentMonthReal) {
        // Mês futuro: é 100% previsto
        isDescontado = false;
      } else {
        // Mês atual: se já passou o dia do débito, muda para descontado
        isDescontado = diaHoje >= diaEfetivoDesconto;
      }

      const diasParaDesconto = diaEfetivoDesconto - diaHoje;

      return {
        id: conta.id,
        descricao: conta.descricao,
        valorPadrao: conta.valorPadrao,
        diaVencimento: conta.diaVencimento,
        diaDesconto: conta.diaDesconto || conta.diaVencimento,
        mesInicio: conta.mesInicio || null,
        mesFim: conta.mesFim || null,
        mesInicioFormatado: conta.mesInicio ? formatMonthYearBR(conta.mesInicio) : null,
        formaPagamento: conta.formaPagamento || 'CARTAO_CREDITO',
        periodicidade: conta.periodicidade,
        ativo: conta.ativo,
        observacoes: conta.observacoes,
        categoriaId: conta.categoriaId,
        categoria: conta.categoria,
        cartaoId: conta.cartaoId,
        cartao: conta.cartao,
        pessoaId: conta.pessoaId,
        pessoa: conta.pessoa,
        pago,
        isDescontado,
        diasParaDesconto,
        dataVencimentoFormatada: formatDayToDateBR(conta.diaVencimento, month),
        dataDescontoFormatada: formatDayToDateBR(diaEfetivoDesconto, month),
        pagamentoId: pagamento?.id || null,
        dataPagamento: pagamento?.dataPagamento || null,
        valorPago: pagamento?.valorPago || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: contasComStatus,
        totais: {
          totalPrevisto,
          totalPago,
          totalPendente,
          totalContas: contas.length,
          contasPagas: contasComStatus.filter((c) => c.pago).length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      descricao,
      valorPadrao,
      diaVencimento,
      diaDesconto,
      mesInicio,
      mesFim,
      formaPagamento = 'CARTAO_CREDITO',
      cartaoId,
      pessoaId,
      periodicidade = 'MENSAL',
      categoriaId,
      observacoes,
    } = body;

    if (!descricao || !valorPadrao || !diaVencimento) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: descrição, valor e dia de vencimento.' },
        { status: 400 }
      );
    }

    const conta = await prisma.contaFixa.create({
      data: {
        descricao,
        valorPadrao: parseFloat(valorPadrao),
        diaVencimento: parseInt(diaVencimento, 10),
        diaDesconto: diaDesconto ? parseInt(diaDesconto, 10) : parseInt(diaVencimento, 10),
        mesInicio: mesInicio || null,
        mesFim: mesFim || null,
        formaPagamento: formaPagamento || 'CARTAO_CREDITO',
        cartaoId: ((formaPagamento === 'CARTAO_CREDITO' || formaPagamento === 'DEBITO_AUTOMATICO') && cartaoId) ? cartaoId : null,
        pessoaId: pessoaId || null,
        periodicidade: (periodicidade || 'MENSAL') as Periodicidade,
        categoriaId: categoriaId || null,
        observacoes,
      },
      include: {
        categoria: true,
        cartao: true,
        pessoa: true,
      },
    });

    return NextResponse.json({ success: true, data: conta }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
