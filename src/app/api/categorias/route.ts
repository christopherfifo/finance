import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json({ success: true, data: categorias });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, icone, cor } = body;

    if (!nome) {
      return NextResponse.json({ success: false, error: 'O nome da categoria é obrigatório' }, { status: 400 });
    }

    const categoria = await prisma.categoria.create({
      data: {
        nome,
        icone: icone || 'Tag',
        cor: cor || '#6366f1',
      },
    });

    return NextResponse.json({ success: true, data: categoria }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
