import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // 1. Limpeza
    await prisma.pagamentoContaFixa.deleteMany();
    await prisma.pagamentoDivida.deleteMany();
    await prisma.lancamento.deleteMany();
    await prisma.divida.deleteMany();
    await prisma.contaFixa.deleteMany();
    await prisma.categoria.deleteMany();
    await prisma.cartaoCredito.deleteMany();
    await prisma.pessoa.deleteMany();

    // 2. Pessoas
    const eu = await prisma.pessoa.create({
      data: {
        nome: 'Christopher',
        relacao: 'Eu',
        isUser: true,
        telefone: '(11) 98765-4321',
        cor: '#4f46e5',
      },
    });

    const pai = await prisma.pessoa.create({
      data: {
        nome: 'Carlos (Pai)',
        relacao: 'Pai',
        isUser: false,
        telefone: '(11) 97111-2233',
        cor: '#059669',
      },
    });

    const mae = await prisma.pessoa.create({
      data: {
        nome: 'Maria (Mãe)',
        relacao: 'Mãe',
        isUser: false,
        telefone: '(11) 97222-3344',
        cor: '#d97706',
      },
    });

    const irma = await prisma.pessoa.create({
      data: {
        nome: 'Juliana (Irmã)',
        relacao: 'Irmã',
        isUser: false,
        telefone: '(11) 97333-4455',
        cor: '#ec4899',
      },
    });

    const amigo = await prisma.pessoa.create({
      data: {
        nome: 'Lucas (Amigo)',
        relacao: 'Amigo',
        isUser: false,
        telefone: '(11) 97444-5566',
        cor: '#0891b2',
      },
    });

    // 3. Categorias
    const catMoradia = await prisma.categoria.create({ data: { nome: 'Moradia', icone: 'Home', cor: '#6366f1' } });
    const catAlimentacao = await prisma.categoria.create({ data: { nome: 'Alimentação', icone: 'Utensils', cor: '#f59e0b' } });
    const catTransporte = await prisma.categoria.create({ data: { nome: 'Transporte', icone: 'Car', cor: '#10b981' } });
    const catLazer = await prisma.categoria.create({ data: { nome: 'Lazer', icone: 'Film', cor: '#8b5cf6' } });
    const catSaude = await prisma.categoria.create({ data: { nome: 'Saúde', icone: 'HeartPulse', cor: '#ef4444' } });
    const catAssinaturas = await prisma.categoria.create({ data: { nome: 'Assinaturas', icone: 'Tv', cor: '#06b6d4' } });
    const catEducacao = await prisma.categoria.create({ data: { nome: 'Educação', icone: 'GraduationCap', cor: '#3b82f6' } });
    const catVestuario = await prisma.categoria.create({ data: { nome: 'Vestuário', icone: 'Shirt', cor: '#ec4899' } });
    const catOutros = await prisma.categoria.create({ data: { nome: 'Outros', icone: 'MoreHorizontal', cor: '#64748b' } });

    // 4. Cartões
    const nubank = await prisma.cartaoCredito.create({
      data: {
        nome: 'Nubank Ultravioleta',
        ultimosDigitos: '7821',
        titular: 'Christopher F.',
        diaFechamento: 25,
        diaVencimento: 5,
        banco: 'Nubank',
        bandeira: 'mastercard',
        cor: 'from-purple-700 via-purple-900 to-indigo-950',
        limite: 15000,
      },
    });

    const xp = await prisma.cartaoCredito.create({
      data: {
        nome: 'XP Visa Infinite',
        ultimosDigitos: '3394',
        titular: 'Christopher F.',
        diaFechamento: 18,
        diaVencimento: 28,
        banco: 'XP Investimentos',
        bandeira: 'visa',
        cor: 'from-zinc-900 via-neutral-800 to-black',
        limite: 25000,
      },
    });

    const inter = await prisma.cartaoCredito.create({
      data: {
        nome: 'Inter Mastercard Black',
        ultimosDigitos: '9012',
        titular: 'Christopher F.',
        diaFechamento: 10,
        diaVencimento: 20,
        banco: 'Banco Inter',
        bandeira: 'mastercard',
        cor: 'from-amber-600 via-orange-700 to-stone-900',
        limite: 10000,
      },
    });

    // 5. Contas Fixas
    const now = new Date();
    const currentMonthRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const cfInternet = await prisma.contaFixa.create({
      data: {
        descricao: 'Internet Fibra 600 Mega',
        valorPadrao: 129.9,
        diaVencimento: 10,
        categoriaId: catAssinaturas.id,
      },
    });

    const cfEnergia = await prisma.contaFixa.create({
      data: {
        descricao: 'Energia Elétrica (Enel)',
        valorPadrao: 280.0,
        diaVencimento: 15,
        categoriaId: catMoradia.id,
      },
    });

    const cfCondominio = await prisma.contaFixa.create({
      data: {
        descricao: 'Condomínio Residencial',
        valorPadrao: 650.0,
        diaVencimento: 5,
        categoriaId: catMoradia.id,
      },
    });

    await prisma.contaFixa.create({
      data: {
        descricao: 'Assinaturas Streaming (Netflix + Spotify)',
        valorPadrao: 95.8,
        diaVencimento: 20,
        categoriaId: catAssinaturas.id,
      },
    });

    await prisma.contaFixa.create({
      data: {
        descricao: 'Academia Smart Fit',
        valorPadrao: 139.9,
        diaVencimento: 12,
        categoriaId: catSaude.id,
      },
    });

    // Registrar algumas como pagas no mês
    await prisma.pagamentoContaFixa.create({
      data: {
        contaFixaId: cfCondominio.id,
        mesReferencia: currentMonthRef,
        valorPago: 650.0,
        status: 'PAGO',
      },
    });

    await prisma.pagamentoContaFixa.create({
      data: {
        contaFixaId: cfInternet.id,
        mesReferencia: currentMonthRef,
        valorPago: 129.9,
        status: 'PAGO',
      },
    });

    // 6. Parcelamentos e Lançamentos
    const compraId = 'compra-nb-dell-001';
    for (let i = 1; i <= 10; i++) {
      const pDate = new Date(now.getFullYear(), now.getMonth() + i - 1, 15);
      const mRef = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      await prisma.lancamento.create({
        data: {
          descricao: `Notebook Dell Inspiron (${i}/10)`,
          valor: 360.0,
          data: pDate,
          mesReferencia: mRef,
          tipo: 'DESPESA',
          status: i === 1 ? 'PAGO' : 'PENDENTE',
          isParcelado: true,
          parcelaAtual: i,
          totalParcelas: 10,
          compraId,
          categoriaId: catEducacao.id,
          cartaoId: xp.id,
          pessoaId: irma.id,
          observacoes: 'Notebook para faculdade da Juliana',
        },
      });
    }

    await prisma.lancamento.create({
      data: {
        descricao: 'Supermercado Pão de Açúcar',
        valor: 485.6,
        data: new Date(now.getFullYear(), now.getMonth(), 8),
        mesReferencia: currentMonthRef,
        tipo: 'DESPESA',
        status: 'PAGO',
        categoriaId: catAlimentacao.id,
        cartaoId: nubank.id,
        pessoaId: eu.id,
      },
    });

    await prisma.lancamento.create({
      data: {
        descricao: 'Jantar Família Outback',
        valor: 340.0,
        data: new Date(now.getFullYear(), now.getMonth(), 14),
        mesReferencia: currentMonthRef,
        tipo: 'DESPESA',
        status: 'PENDENTE',
        categoriaId: catLazer.id,
        cartaoId: nubank.id,
        pessoaId: pai.id,
        observacoes: 'Pai pediu para passar no cartão',
      },
    });

    await prisma.lancamento.create({
      data: {
        descricao: 'Farmácia Droga Raia',
        valor: 165.4,
        data: new Date(now.getFullYear(), now.getMonth(), 18),
        mesReferencia: currentMonthRef,
        tipo: 'DESPESA',
        status: 'PENDENTE',
        categoriaId: catSaude.id,
        cartaoId: inter.id,
        pessoaId: mae.id,
      },
    });

    await prisma.lancamento.create({
      data: {
        descricao: 'Salário Mensal',
        valor: 6500.0,
        data: new Date(now.getFullYear(), now.getMonth(), 5),
        mesReferencia: currentMonthRef,
        tipo: 'RECEITA',
        status: 'PAGO',
        pessoaId: eu.id,
      },
    });

    // 7. Dívidas
    const divLucas = await prisma.divida.create({
      data: {
        descricao: 'Empréstimo conserto de moto',
        valorTotal: 1200.0,
        valorPago: 400.0,
        tipo: 'A_RECEBER',
        status: 'PAGO_PARCIAL',
        origem: 'Empréstimo PIX',
        dataVencimento: new Date(now.getFullYear(), now.getMonth() + 1, 10),
        pessoaId: amigo.id,
      },
    });

    await prisma.pagamentoDivida.create({
      data: {
        dividaId: divLucas.id,
        valor: 400.0,
        observacao: '1ª parcela PIX',
        pessoaId: amigo.id,
      },
    });

    await prisma.divida.create({
      data: {
        descricao: 'Reparo do ar condicionado do carro',
        valorTotal: 350.0,
        valorPago: 0.0,
        tipo: 'A_PAGAR',
        status: 'PENDENTE',
        origem: 'Mecânico',
        dataVencimento: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        pessoaId: pai.id,
      },
    });

    return NextResponse.json({ success: true, message: 'Dados de demonstração criados com sucesso!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
