'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { formatCurrency, formatDate, formatMonthName, getCurrentMonthRef } from '@/lib/utils';
import {
  Printer,
  ArrowLeft,
  Users,
  Receipt,
  CreditCard,
  Loader2,
} from 'lucide-react';

export default function FaturaImprimirPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const cardId = params.id as string;
  const month = searchParams.get('month') || getCurrentMonthRef();
  const initialPessoaId = searchParams.get('pessoaId') || 'TOTAL';

  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPessoaId, setSelectedPessoaId] = useState<string>(initialPessoaId);

  useEffect(() => {
    loadCard();
  }, [cardId, month]);

  const loadCard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cartoes?month=${month}`);
      const json = await res.json();
      if (json.success) {
        const found = json.data.find((c: any) => c.id === cardId);
        setCard(found || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <p className="text-lg font-bold mb-4">Cartão não encontrado.</p>
        <button
          onClick={() => router.push('/cartoes')}
          className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-semibold"
        >
          Voltar aos Cartões
        </button>
      </div>
    );
  }

  const isFaturaTotal = selectedPessoaId === 'TOTAL';
  const selectedPessoa = card.divisaoPessoas?.find((p: any) => p.pessoaId === selectedPessoaId);

  const lancamentosExibidos = isFaturaTotal
    ? card.lancamentos || []
    : (card.lancamentos || []).filter((l: any) => l.pessoaId === selectedPessoaId);

  const valorTotalExibido = isFaturaTotal
    ? card.totalFatura || 0
    : selectedPessoa?.valor || 0;

  // Agrupamento por pessoa para fatura total
  const lancamentosPorPessoaMap: Record<string, { nome: string; relacao?: string; cor?: string; total: number; itens: any[] }> = {};
  if (isFaturaTotal) {
    (card.lancamentos || []).forEach((l: any) => {
      const pId = l.pessoaId;
      if (!lancamentosPorPessoaMap[pId]) {
        lancamentosPorPessoaMap[pId] = {
          nome: l.pessoa?.nome || 'Pessoa',
          relacao: l.pessoa?.relacao,
          cor: l.pessoa?.cor,
          total: 0,
          itens: [],
        };
      }
      lancamentosPorPessoaMap[pId].total += l.valor;
      lancamentosPorPessoaMap[pId].itens.push(l);
    });
  }

  return (
    <div className="min-h-screen bg-slate-900 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Barra de Ações (no-print) */}
        <div className="no-print p-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/cartoes')}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Visualização</span>
              <select
                value={selectedPessoaId}
                onChange={(e) => setSelectedPessoaId(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="TOTAL">📑 Fatura Total (Todos os Membros)</option>
                {card.divisaoPessoas?.map((p: any) => (
                  <option key={p.pessoaId} value={p.pessoaId}>
                    👤 Fatura Individual: {p.nome} ({formatCurrency(p.valor)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar como PDF</span>
            </button>
          </div>
        </div>

        {/* DOCUMENTO DE IMPRESSÃO */}
        <div className="print-area bg-white text-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-200 space-y-6">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded">
                  FinanFamily
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Extrato de Cartão de Crédito
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                {isFaturaTotal ? 'FATURA CONSOLIDADA' : `FATURA INDIVIDUAL • ${selectedPessoa?.nome}`}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Cartão: <strong>{card.nome}</strong> • Final: <strong>{card.ultimosDigitos || '••••'}</strong> • Titular: <strong>{card.titular}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase font-bold block">Referência</span>
              <span className="text-base font-extrabold text-slate-900">
                {formatMonthName(month)}
              </span>
              <div className="text-xs text-slate-600 mt-0.5">
                Vencimento: <strong>Dia {String(card.diaVencimento).padStart(2, '0')}</strong> • Fechamento: <strong>Dia {String(card.diaFechamento).padStart(2, '0')}</strong>
              </div>
            </div>
          </div>

          {/* Cards de Valores */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-xl col-span-2 flex flex-col justify-between">
              <span className="text-xs uppercase font-bold text-slate-300">
                {isFaturaTotal ? 'Total da Fatura' : `Total Devido por ${selectedPessoa?.nome}`}
              </span>
              <div className="text-3xl font-black mt-1">
                {formatCurrency(valorTotalExibido)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1">
                {lancamentosExibidos.length} lançamento(s) na fatura
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between text-xs">
              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Banco / Emissor</span>
                <span className="text-sm font-bold text-slate-800">{card.banco || 'Cartão de Crédito'}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200">
                <span className="text-slate-500 block text-[10px]">Data de Emissão:</span>
                <span className="font-semibold text-slate-700">{formatDate(new Date())}</span>
              </div>
            </div>
          </div>

          {/* Tabela de Resumo por Pessoa (se Fatura Total) */}
          {isFaturaTotal && card.divisaoPessoas && card.divisaoPessoas.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Resumo da Divisão por Pessoa:
              </h3>

              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2 border-b">Pessoa</th>
                    <th className="px-3 py-2 border-b text-center">Compras</th>
                    <th className="px-3 py-2 border-b text-right">% da Fatura</th>
                    <th className="px-3 py-2 border-b text-right">Valor a Pagar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {card.divisaoPessoas.map((p: any) => {
                    const pct = card.totalFatura > 0 ? (p.valor / card.totalFatura) * 100 : 0;
                    return (
                      <tr key={p.pessoaId}>
                        <td className="px-3 py-2 font-bold flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: p.cor || '#4f46e5' }}
                          />
                          {p.nome} {p.isUser ? '(Titular)' : ''}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600">{p.qtd}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-600">
                          {pct.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right font-black text-slate-900">
                          {formatCurrency(p.valor)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-black text-slate-900">
                  <tr>
                    <td className="px-3 py-2 border-t">TOTAL GERAL</td>
                    <td className="px-3 py-2 border-t text-center">{card.lancamentos?.length || 0}</td>
                    <td className="px-3 py-2 border-t text-right">100%</td>
                    <td className="px-3 py-2 border-t text-right text-sm">
                      {formatCurrency(card.totalFatura)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Lista Detalhada de Despesas */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Receipt className="w-4 h-4 text-indigo-600" />
              {isFaturaTotal ? 'Detalhamento de Todas as Compras (Agrupadas por Pessoa):' : `Lista de Compras de ${selectedPessoa?.nome}:`}
            </h3>

            {isFaturaTotal ? (
              Object.values(lancamentosPorPessoaMap).map((grupo) => (
                <div key={grupo.nome} className="space-y-1.5">
                  <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded text-xs font-bold text-slate-800">
                    <span>{grupo.nome} {grupo.relacao ? `(${grupo.relacao})` : ''}</span>
                    <span className="text-indigo-700 font-black">{formatCurrency(grupo.total)}</span>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200 rounded overflow-hidden">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[9px]">
                      <tr>
                        <th className="px-3 py-1.5 border-b">Data</th>
                        <th className="px-3 py-1.5 border-b">Descrição</th>
                        <th className="px-3 py-1.5 border-b">Categoria</th>
                        <th className="px-3 py-1.5 border-b text-center">Parcela</th>
                        <th className="px-3 py-1.5 border-b text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {grupo.itens.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">
                            {formatDate(item.data)}
                          </td>
                          <td className="px-3 py-1.5 font-medium">{item.descricao}</td>
                          <td className="px-3 py-1.5 text-slate-500">{item.categoria?.nome || '—'}</td>
                          <td className="px-3 py-1.5 text-center font-mono text-[11px]">
                            {item.isParcelado ? `${item.parcelaAtual}/${item.totalParcelas}` : 'À vista'}
                          </td>
                          <td className="px-3 py-1.5 text-right font-bold text-slate-900">
                            {formatCurrency(item.valor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2 border-b">Data</th>
                    <th className="px-3 py-2 border-b">Descrição</th>
                    <th className="px-3 py-2 border-b">Categoria</th>
                    <th className="px-3 py-2 border-b text-center">Parcela</th>
                    <th className="px-3 py-2 border-b text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {lancamentosExibidos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500 italic">
                        Nenhuma despesa para esta pessoa nesta fatura.
                      </td>
                    </tr>
                  ) : (
                    lancamentosExibidos.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                          {formatDate(item.data)}
                        </td>
                        <td className="px-3 py-2 font-medium">{item.descricao}</td>
                        <td className="px-3 py-2 text-slate-500">{item.categoria?.nome || '—'}</td>
                        <td className="px-3 py-2 text-center font-mono text-[11px]">
                          {item.isParcelado ? (
                            <span className="font-bold">{item.parcelaAtual}/${item.totalParcelas}</span>
                          ) : (
                            'À vista'
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-black text-slate-900">
                          {formatCurrency(item.valor)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-black text-slate-900">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right">TOTAL DEVIDO:</td>
                    <td className="px-3 py-2 text-right text-sm">
                      {formatCurrency(valorTotalExibido)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Rodapé */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
            <p>
              Favor realizar o acerto com <strong>{card.titular}</strong> até a data de vencimento da fatura.
            </p>
            <span className="text-[10px] text-slate-400 font-mono">
              FinanFamily
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
