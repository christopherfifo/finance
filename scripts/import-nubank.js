const fs = require('fs');
const path = require('path');
const { PrismaClient, TipoLancamento, StatusPagamento } = require('@prisma/client');

const prisma = new PrismaClient();

async function importNubank() {
  console.log('Iniciando importação da fatura Nubank...');

  // 1. Encontrar ou criar categorias padrão
  const categoriasBase = [
    { nome: 'Transporte', icone: 'Car', cor: '#10b981' },
    { nome: 'Alimentação', icone: 'Utensils', cor: '#f59e0b' },
    { nome: 'Assinaturas', icone: 'Tv', cor: '#06b6d4' },
    { nome: 'Compras', icone: 'ShoppingBag', cor: '#ec4899' },
    { nome: 'Serviços', icone: 'Receipt', cor: '#6366f1' },
    { nome: 'Outros', icone: 'MoreHorizontal', cor: '#64748b' },
  ];

  const catMap = {};
  for (const c of categoriasBase) {
    let cat = await prisma.categoria.findUnique({ where: { nome: c.nome } });
    if (!cat) {
      cat = await prisma.categoria.create({ data: c });
    }
    catMap[c.nome] = cat.id;
  }
  console.log('✓ Categorias prontas');

  // 2. Encontrar o cartão Nubank final 7956
  let card = await prisma.cartaoCredito.findFirst({
    where: {
      OR: [
        { ultimosDigitos: '7956' },
        { nome: { contains: 'nubank', mode: 'insensitive' } },
      ],
    },
  });

  if (!card) {
    card = await prisma.cartaoCredito.create({
      data: {
        nome: 'Nubank',
        ultimosDigitos: '7956',
        titular: 'Christopher',
        diaFechamento: 20,
        diaVencimento: 27,
        limite: 4000,
        banco: 'Nubank',
        bandeira: 'mastercard',
        cor: 'from-purple-700 via-purple-900 to-indigo-950',
      },
    });
    console.log('✓ Cartão Nubank criado');
  } else {
    // Garante que o nome e final estejam corretos
    card = await prisma.cartaoCredito.update({
      where: { id: card.id },
      data: {
        nome: 'Nubank',
        ultimosDigitos: '7956',
      },
    });
    console.log('✓ Cartão Nubank atualizado:', card.id);
  }

  // 3. Mapear pessoas cadastradas
  const pessoas = await prisma.pessoa.findMany();
  const pessoaMap = {};
  pessoas.forEach((p) => {
    pessoaMap[p.nome.trim().toLowerCase()] = p;
  });

  console.log('Pessoas no banco:', Object.keys(pessoaMap));

  // 4. Ler e processar o arquivo CSV
  const csvPath = path.join(__dirname, '..', 'Nubank_2026-11-27.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  // Pula o cabeçalho: date,title,amount, dono
  const header = lines[0];
  const dataLines = lines.slice(1);

  const mesReferencia = '2026-10'; // Fatura do mês 10 que vence no mês 11
  let count = 0;

  for (const line of dataLines) {
    // Parser que respeita aspas como "34,15"
    const match = line.match(/^([^,]+),(".*?"|[^,]+),(".*?"|[^,]+),\s*(.*)$/);
    if (!match) continue;

    const rawDate = match[1].trim();
    let title = match[2].trim().replace(/^"|"$/g, '');
    let rawAmount = match[3].trim().replace(/^"|"$/g, '').replace(',', '.');
    let dono = match[4].trim().replace(/^"|"$/g, '');

    const amount = parseFloat(rawAmount);
    const dateObj = new Date(rawDate);

    // Identificar dono correspondente
    const donoKey = dono.toLowerCase();
    let pessoa = pessoaMap[donoKey];

    if (!pessoa) {
      // Tenta achar por aproximação
      const found = Object.keys(pessoaMap).find((k) => k.includes(donoKey) || donoKey.includes(k));
      if (found) {
        pessoa = pessoaMap[found];
      } else {
        // Cria a pessoa se não existir
        pessoa = await prisma.pessoa.create({
          data: {
            nome: dono,
            relacao: 'Família',
            isUser: dono.toLowerCase() === 'christopher',
            cor: '#4f46e5',
          },
        });
        pessoaMap[donoKey] = pessoa;
      }
    }

    // Detectar categoria com base no título
    let categoriaId = catMap['Outros'];
    const titleLower = title.toLowerCase();

    if (titleLower.includes('uber') || titleLower.includes('99')) {
      categoriaId = catMap['Transporte'];
    } else if (titleLower.includes('mercado') || titleLower.includes('loja')) {
      categoriaId = catMap['Alimentação'];
    } else if (titleLower.includes('youtube') || titleLower.includes('google')) {
      categoriaId = catMap['Assinaturas'];
    } else if (titleLower.includes('comercio') || titleLower.includes('keetabr') || titleLower.includes('matsuo')) {
      categoriaId = catMap['Compras'];
    } else if (titleLower.includes('pix') || titleLower.includes('parcelamento')) {
      categoriaId = catMap['Serviços'];
    }

    // Detectar se é parcelado (ex: "Parcela 2/10" ou "6/9")
    let isParcelado = false;
    let parcelaAtual = 1;
    let totalParcelas = 1;

    const parcelMatch = title.match(/Parcela\s+(\d+)\/(\d+)/i) || title.match(/-\s+(\d+)\/(\d+)/i);
    if (parcelMatch) {
      isParcelado = true;
      parcelaAtual = parseInt(parcelMatch[1], 10);
      totalParcelas = parseInt(parcelMatch[2], 10);
    }

    // Criar o lançamento no banco de dados
    await prisma.lancamento.create({
      data: {
        descricao: title,
        valor: amount,
        data: dateObj,
        mesReferencia,
        tipo: TipoLancamento.DESPESA,
        status: StatusPagamento.PENDENTE,
        isParcelado,
        parcelaAtual,
        totalParcelas,
        categoriaId,
        cartaoId: card.id,
        pessoaId: pessoa.id,
        observacoes: `Fatura Nubank 7956 - Mês ${mesReferencia} (Dono: ${dono})`,
      },
    });

    count++;
    console.log(`+ [${pessoa.nome}] ${title} -> R$ ${amount.toFixed(2)} (${rawDate})`);
  }

  console.log(`\n✓ Importação finalizada com sucesso! ${count} lançamentos inseridos na fatura de ${mesReferencia}.`);
}

importNubank()
  .catch((e) => {
    console.error('Erro na importação:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
