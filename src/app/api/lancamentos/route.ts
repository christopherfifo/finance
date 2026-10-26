import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentMonthRef, getOffsetMonthRef } from '@/lib/utils';
import { randomUUID } from 'crypto';
import { StatusPagamento, TipoLancamento } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const cartaoId = searchParams.get('cartaoId');
    const pessoaId = searchParams.get('pessoaId');
    const categoriaId = searchParams.get('categoriaId');
    const tipo = searchParams.get('tipo');
    const status = searchParams.get('status');
    const isParcelado = searchParams.get('isParcelado');
    const search = searchParams.get('search');

    const where: any = {};

    if (month && month !== 'all') {
      where.mesReferencia = month;
    }
    if (cartaoId) {
      if (cartaoId === 'none') {
        where.cartaoId = null;
      } else {
        where.cartaoId = cartaoId;
      }
    }
    if (pessoaId) {
      where.pessoaId = pessoaId;
    }
    if (categoriaId) {
      where.categoriaId = categoriaId;
    }
    if (tipo) {
      where.tipo = tipo;
    }
    if (status) {
      where.status = status;
    }
    if (isParcelado !== null && isParcelado !== undefined && isParcelado !== '') {
      where.isParcelado = isParcelado === 'true';
    }
    if (search) {
      where.OR = [
        { descricao: { contains: search, mode: 'insensitive' } },
        { observacoes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const lancamentos = await prisma.lancamento.findMany({
      where,
      include: {
        pessoa: true,
        cartao: true,
        categoria: true,
      },
      orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
    });

    // Calcular totais dos itens filtrados
    let totalDespesas = 0;
    let totalReceitas = 0;

    lancamentos.forEach((l) => {
      if (l.tipo === 'DESPESA') {
        totalDespesas += l.valor;
      } else if (l.tipo === 'RECEITA') {
        totalReceitas += l.valor;
      }
    });

    const saldo = totalReceitas - totalDespesas;

    return NextResponse.json({
      success: true,
      data: {
        items: lancamentos,
        totais: {
          totalItens: lancamentos.length,
          totalDespesas,
          totalReceitas,
          saldo,
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
      valor,
      data,
      mesReferencia,
      tipo = 'DESPESA',
      status = 'PENDENTE',
      observacoes,
      categoriaId,
      cartaoId,
      pessoaId,
      isParcelado = false,
      totalParcelas = 1,
      parcelaAtual = 1,
      criarDivida = false,
    } = body;

    if (!descricao || !valor || !pessoaId) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: descrição, valor e pessoa responsável.' },
        { status: 400 }
      );
    }

    const valorNum = parseFloat(valor);
    const dataObj = data ? new Date(data) : new Date();
    const baseMonthRef = mesReferencia || `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}`;

    // Se for parcelado e totalParcelas > 1
    if (isParcelado && totalParcelas > 1) {
      const compraId = randomUUID();
      const totalP = parseInt(totalParcelas, 10);
      const parcelaInicial = parseInt(parcelaAtual, 10) || 1;
      const valorParcela = parseFloat((valorNum / totalP).toFixed(2));

      const registros = [];

      for (let i = parcelaInicial; i <= totalP; i++) {
        const offset = i - parcelaInicial;
        const parcelMonthRef = getOffsetMonthRef(baseMonthRef, offset);
        
        // Data estimada para cada parcela
        const pDate = new Date(dataObj);
        pDate.setMonth(pDate.getMonth() + offset);

        registros.push({
          descricao: `${descricao} (${i}/${totalP})`,
          valor: valorParcela,
          data: pDate,
          mesReferencia: parcelMonthRef,
          tipo: (tipo === 'RECEITA' ? TipoLancamento.RECEITA : TipoLancamento.DESPESA) as TipoLancamento,
          status: (i === parcelaInicial && status === 'PAGO' ? StatusPagamento.PAGO : StatusPagamento.PENDENTE) as StatusPagamento,
          observacoes: observacoes || null,
          isParcelado: true,
          parcelaAtual: i,
          totalParcelas: totalP,
          compraId,
          categoriaId: categoriaId || null,
          cartaoId: cartaoId || null,
          pessoaId,
        });
      }

      await prisma.lancamento.createMany({
        data: registros,
      });

      // Se foi solicitado criar uma dívida correspondente para outra pessoa
      if (criarDivida) {
        const pessoa = await prisma.pessoa.findUnique({ where: { id: pessoaId } });
        if (pessoa && !pessoa.isUser) {
          await prisma.divida.create({
            data: {
              descricao: `Compra parcelada: ${descricao} (${totalP}x)`,
              valorTotal: valorNum,
              valorPago: 0,
              tipo: 'A_RECEBER',
              status: 'PENDENTE',
              origem: cartaoId ? 'Cartão de Crédito' : 'Despesa Parcelada',
              pessoaId: pessoa.id,
              observacoes: `Gerado a partir do lançamento parcelado: ${descricao}`,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `${registros.length} parcelas registradas com sucesso.`,
      }, { status: 201 });
    }

    // Lançamento avulso / à vista
    const lancamento = await prisma.lancamento.create({
      data: {
        descricao,
        valor: valorNum,
        data: dataObj,
        mesReferencia: baseMonthRef,
        tipo: (tipo === 'RECEITA' ? TipoLancamento.RECEITA : TipoLancamento.DESPESA) as TipoLancamento,
        status: (status === 'PAGO' ? StatusPagamento.PAGO : StatusPagamento.PENDENTE) as StatusPagamento,
        observacoes,
        isParcelado: false,
        parcelaAtual: 1,
        totalParcelas: 1,
        categoriaId: categoriaId || null,
        cartaoId: cartaoId || null,
        pessoaId,
      },
    });

    // Se solicitou criar dívida para despesa de outra pessoa
    if (criarDivida) {
      const pessoa = await prisma.pessoa.findUnique({ where: { id: pessoaId } });
      if (pessoa && !pessoa.isUser) {
        await prisma.divida.create({
          data: {
            descricao: `Despesa: ${descricao}`,
            valorTotal: valorNum,
            valorPago: 0,
            tipo: 'A_RECEBER',
            status: 'PENDENTE',
            origem: cartaoId ? 'Cartão de Crédito' : 'Lançamento Direto',
            pessoaId: pessoa.id,
            observacoes: `Gerado a partir do lançamento: ${descricao}`,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: lancamento }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
