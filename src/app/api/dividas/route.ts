import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TipoDivida, StatusDivida } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo'); // A_RECEBER ou A_PAGAR
    const status = searchParams.get('status');
    const pessoaId = searchParams.get('pessoaId');

    const where: any = {};
    if (tipo) where.tipo = tipo;
    if (status) where.status = status;
    if (pessoaId) where.pessoaId = pessoaId;

    const dividas = await prisma.divida.findMany({
      where,
      include: {
        pessoa: true,
        pagamentos: {
          orderBy: { data: 'desc' },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    // Calcular resumo
    let totalAReceberPendente = 0;
    let totalAReceberPago = 0;
    let totalAPagarPendente = 0;
    let totalAPagarPago = 0;

    dividas.forEach((d) => {
      const saldo = Math.max(0, d.valorTotal - d.valorPago);
      if (d.tipo === 'A_RECEBER') {
        totalAReceberPendente += saldo;
        totalAReceberPago += d.valorPago;
      } else {
        totalAPagarPendente += saldo;
        totalAPagarPago += d.valorPago;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        items: dividas,
        totais: {
          totalAReceberPendente,
          totalAReceberPago,
          totalAPagarPendente,
          totalAPagarPago,
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
      valorTotal,
      tipo = 'A_RECEBER',
      origem,
      dataVencimento,
      observacoes,
      pessoaId,
    } = body;

    if (!descricao || !valorTotal || !pessoaId) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: descrição, valor e pessoa.' },
        { status: 400 }
      );
    }

    const divida = await prisma.divida.create({
      data: {
        descricao,
        valorTotal: parseFloat(valorTotal),
        valorPago: 0,
        tipo: (tipo === 'A_PAGAR' ? TipoDivida.A_PAGAR : TipoDivida.A_RECEBER) as TipoDivida,
        status: StatusDivida.PENDENTE,
        origem: origem || 'Outros',
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        observacoes,
        pessoaId,
      },
      include: { pessoa: true },
    });

    return NextResponse.json({ success: true, data: divida }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
