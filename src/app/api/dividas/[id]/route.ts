import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const divida = await prisma.divida.update({
      where: { id },
      data: {
        descricao: body.descricao,
        valorTotal: body.valorTotal !== undefined ? parseFloat(body.valorTotal) : undefined,
        tipo: body.tipo,
        status: body.status,
        origem: body.origem,
        dataVencimento: body.dataVencimento ? new Date(body.dataVencimento) : undefined,
        observacoes: body.observacoes,
        pessoaId: body.pessoaId,
      },
    });

    return NextResponse.json({ success: true, data: divida });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.divida.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
