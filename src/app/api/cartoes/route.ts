import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentMonthRef } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || getCurrentMonthRef();

    const cartoes = await prisma.cartaoCredito.findMany({
      orderBy: { nome: 'asc' },
      include: {
        lancamentos: {
          where: {
            mesReferencia: month,
            tipo: 'DESPESA',
          },
          include: {
            pessoa: true,
            categoria: true,
          },
          orderBy: { data: 'desc' },
        },
      },
    });

    // Enriquecer cada cartão com total e divisão por pessoas
    const cartoesComFatura = cartoes.map((cartao) => {
      const totalFatura = cartao.lancamentos.reduce((acc, curr) => acc + curr.valor, 0);

      const pessoasMap: Record<string, { pessoaId: string; nome: string; cor: string | null; isUser: boolean; valor: number; qtd: number }> = {};
      cartao.lancamentos.forEach((l) => {
        if (!pessoasMap[l.pessoaId]) {
          pessoasMap[l.pessoaId] = {
            pessoaId: l.pessoaId,
            nome: l.pessoa.nome,
            cor: l.pessoa.cor,
            isUser: l.pessoa.isUser,
            valor: 0,
            qtd: 0,
          };
        }
        pessoasMap[l.pessoaId].valor += l.valor;
        pessoasMap[l.pessoaId].qtd += 1;
      });

      return {
        ...cartao,
        totalFatura,
        divisaoPessoas: Object.values(pessoasMap),
      };
    });

    return NextResponse.json({ success: true, data: cartoesComFatura });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nome,
      ultimosDigitos,
      titular,
      diaFechamento,
      diaVencimento,
      limite,
      banco,
      bandeira,
      cor,
    } = body;

    if (!nome || !titular || !diaFechamento || !diaVencimento) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: nome, titular, fechamento e vencimento.' },
        { status: 400 }
      );
    }

    const cartao = await prisma.cartaoCredito.create({
      data: {
        nome,
        ultimosDigitos: ultimosDigitos || null,
        titular,
        diaFechamento: parseInt(diaFechamento, 10),
        diaVencimento: parseInt(diaVencimento, 10),
        limite: limite ? parseFloat(limite) : null,
        banco: banco || null,
        bandeira: bandeira || 'mastercard',
        cor: cor || 'from-indigo-600 to-slate-900',
      },
    });

    return NextResponse.json({ success: true, data: cartao }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
