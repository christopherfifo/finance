import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const pessoa = await prisma.pessoa.update({
      where: { id },
      data: {
        nome: body.nome,
        relacao: body.relacao,
        isUser: body.isUser !== undefined ? Boolean(body.isUser) : undefined,
        telefone: body.telefone,
        cor: body.cor,
      },
    });

    return NextResponse.json({ success: true, data: pessoa });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.pessoa.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
