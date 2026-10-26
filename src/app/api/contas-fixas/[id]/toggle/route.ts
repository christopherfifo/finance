import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentMonthRef } from '@/lib/utils';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const month = body.month || getCurrentMonthRef();
    const valorPago = body.valor ? parseFloat(body.valor) : undefined;

    // Verificar se já tem pagamento registrado neste mês
    const existing = await prisma.pagamentoContaFixa.findUnique({
      where: {
        contaFixaId_mesReferencia: {
          contaFixaId: id,
          mesReferencia: month,
        },
      },
    });

    if (existing) {
      // Se já estava pago, remove o pagamento (desmarcar como pago)
      await prisma.pagamentoContaFixa.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, pago: false, message: 'Conta marcada como pendente' });
    } else {
      // Se não estava pago, busca o valor padrão da conta
      const conta = await prisma.contaFixa.findUnique({ where: { id } });
      if (!conta) {
        return NextResponse.json({ success: false, error: 'Conta fixa não encontrada' }, { status: 404 });
      }

      const pagamento = await prisma.pagamentoContaFixa.create({
        data: {
          contaFixaId: id,
          mesReferencia: month,
          valorPago: valorPago !== undefined ? valorPago : conta.valorPadrao,
          status: 'PAGO',
          dataPagamento: new Date(),
        },
      });

      return NextResponse.json({ success: true, pago: true, data: pagamento, message: 'Conta marcada como paga' });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
