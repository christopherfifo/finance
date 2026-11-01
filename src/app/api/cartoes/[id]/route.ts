import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentMonthRef } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || getCurrentMonthRef();
    const includePrevistosParam = searchParams.get('includePrevistos');
    const includePrevistos = includePrevistosParam === null ? true : includePrevistosParam === 'true';

    const cartao = await prisma.cartaoCredito.findUnique({
      where: { id },
      include: {
        lancamentos: {
          where: {
            mesReferencia: month,
            tipo: 'DESPESA',
            incluirGastosPrevistos: includePrevistos,
          },
          include: { pessoa: true, categoria: true },
          orderBy: { data: 'desc' },
        },
      },
    });

    if (!cartao) {
      return NextResponse.json({ success: false, error: 'Cartão não encontrado' }, { status: 404 });
    }

    // Enriquecer com total e divisão por pessoa similar ao GET list
    const totalFatura = cartao.lancamentos.reduce((acc, curr) => acc + curr.valor, 0);
    const pessoasMap: Record<string, { pessoaId: string; nome: string; cor: string | null; isUser: boolean; valor: number; qtd: number }> = {};
    cartao.lancamentos.forEach((l) => {
      if (!pessoasMap[l.pessoaId]) {
        pessoasMap[l.pessoaId] = { pessoaId: l.pessoaId, nome: l.pessoa.nome, cor: l.pessoa.cor, isUser: l.pessoa.isUser, valor: 0, qtd: 0 };
      }
      pessoasMap[l.pessoaId].valor += l.valor;
      pessoasMap[l.pessoaId].qtd += 1;
    });

    const cartaoComFatura = {
      ...cartao,
      totalFatura,
      divisaoPessoas: Object.values(pessoasMap),
    };

    return NextResponse.json({ success: true, data: cartaoComFatura });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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
