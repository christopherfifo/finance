import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Tenta uma query simples para testar conexão com Postgres
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      connected: true,
      message: 'Conectado ao PostgreSQL com sucesso!',
    });
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      message: 'Não conectado ao banco PostgreSQL',
      error: error.message,
    });
  }
}
