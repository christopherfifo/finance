import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusPagamento, TipoLancamento } from '@prisma/client';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const dataObj = body.data ? new Date(body.data) : undefined;
    const monthRef = body.mesReferencia || (dataObj ? `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}` : undefined);

    const lancamento = await prisma.lancamento.update({
      where: { id },
      data: {
        descricao: body.descricao,
        valor: body.valor !== undefined ? parseFloat(body.valor) : undefined,
        data: dataObj,
        mesReferencia: monthRef,
        tipo: body.tipo ? (body.tipo as TipoLancamento) : undefined,
        status: body.status ? (body.status as StatusPagamento) : undefined,
        observacoes: body.observacoes,
        categoriaId: body.categoriaId !== undefined ? (body.categoriaId || null) : undefined,
        cartaoId: body.cartaoId !== undefined ? (body.cartaoId || null) : undefined,
        pessoaId: body.pessoaId,
      },
    });

    return NextResponse.json({ success: true, data: lancamento });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const deleteAllInstallments = searchParams.get('allInstallments') === 'true';

    const item = await prisma.lancamento.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Lançamento não encontrado' }, { status: 404 });
    }

    if (deleteAllInstallments && item.compraId) {
      const deleted = await prisma.lancamento.deleteMany({
        where: { compraId: item.compraId },
      });
      return NextResponse.json({
        success: true,
        message: `${deleted.count} parcelas excluídas com sucesso.`,
      });
    }

    await prisma.lancamento.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Lançamento excluído com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
