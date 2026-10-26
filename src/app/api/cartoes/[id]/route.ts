import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const cartao = await prisma.cartaoCredito.update({
      where: { id },
      data: {
        nome: body.nome,
        titular: body.titular,
        ultimosDigitos: body.ultimosDigitos,
        diaFechamento: body.diaFechamento ? parseInt(body.diaFechamento, 10) : undefined,
        diaVencimento: body.diaVencimento ? parseInt(body.diaVencimento, 10) : undefined,
        limite: body.limite !== undefined ? (body.limite ? parseFloat(body.limite) : null) : undefined,
        banco: body.banco,
        bandeira: body.bandeira,
        cor: body.cor,
        ativo: body.ativo !== undefined ? body.ativo : undefined,
      },
    });

    return NextResponse.json({ success: true, data: cartao });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.cartaoCredito.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
