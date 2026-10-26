import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const conta = await prisma.contaFixa.update({
      where: { id },
      data: {
        descricao: body.descricao,
        valorPadrao: body.valorPadrao !== undefined ? parseFloat(body.valorPadrao) : undefined,
        diaVencimento: body.diaVencimento ? parseInt(body.diaVencimento, 10) : undefined,
        diaDesconto: body.diaDesconto !== undefined
          ? (body.diaDesconto !== null ? parseInt(body.diaDesconto, 10) : null)
          : undefined,
        periodicidade: body.periodicidade,
        ativo: body.ativo !== undefined ? body.ativo : undefined,
        categoriaId: body.categoriaId !== undefined ? (body.categoriaId || null) : undefined,
        observacoes: body.observacoes,
        mesInicio: body.mesInicio !== undefined ? (body.mesInicio || null) : undefined,
        mesFim: body.mesFim !== undefined ? (body.mesFim || null) : undefined,
        formaPagamento: body.formaPagamento !== undefined ? (body.formaPagamento || null) : undefined,
        cartaoId: body.cartaoId !== undefined ? (body.cartaoId || null) : undefined,
        pessoaId: body.pessoaId !== undefined ? (body.pessoaId || null) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: conta });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.contaFixa.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
