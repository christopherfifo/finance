import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusDivida } from '@prisma/client';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { valor, data, observacao } = body;

    if (!valor || parseFloat(valor) <= 0) {
      return NextResponse.json({ success: false, error: 'Informe um valor válido maior que zero.' }, { status: 400 });
    }

    const valorNum = parseFloat(valor);

    const divida = await prisma.divida.findUnique({
      where: { id },
      include: { pessoa: true },
    });

    if (!divida) {
      return NextResponse.json({ success: false, error: 'Dívida não encontrada' }, { status: 404 });
    }

    const novoValorPago = divida.valorPago + valorNum;
    const isQuitada = novoValorPago >= divida.valorTotal - 0.01;
    const novoStatus: StatusDivida = isQuitada ? StatusDivida.QUITADA : StatusDivida.PAGO_PARCIAL;

    // Transação para gravar o pagamento e atualizar a dívida
    const [pagamento, dividaAtualizada] = await prisma.$transaction([
      prisma.pagamentoDivida.create({
        data: {
          dividaId: id,
          valor: valorNum,
          data: data ? new Date(data) : new Date(),
          observacao: observacao || null,
          pessoaId: divida.pessoaId,
        },
      }),
      prisma.divida.update({
        where: { id },
        data: {
          valorPago: novoValorPago,
          status: novoStatus,
        },
        include: {
          pessoa: true,
          pagamentos: { orderBy: { data: 'desc' } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pagamento,
        divida: dividaAtualizada,
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
