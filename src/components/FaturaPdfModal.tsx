'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { formatCurrency, formatDate, formatMonthName } from '@/lib/utils';
import {
  Printer,
  Download,
  Users,
  CreditCard,
  ExternalLink,
  Receipt,
  User,
  Calendar,
  X,
  CheckCircle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: any;
  month: string;
  initialPessoaId?: string | null;
}

export function FaturaPdfModal({ isOpen, onClose, card, month, initialPessoaId }: Props) {
  const [selectedPessoaId, setSelectedPessoaId] = useState<string>(initialPessoaId || 'TOTAL');
  const [includePrevistos, setIncludePrevistos] = useState<boolean>(true);

  if (!card) return null;

  const handlePrint = () => {
    window.print();
  };

  const isFaturaTotal = selectedPessoaId === 'TOTAL';
  const selectedPessoa = card.divisaoPessoas?.find((p: any) => p.pessoaId === selectedPessoaId);

  // Filtrar lançamentos da fatura conforme a pessoa selecionada
  const lancamentosExibidos = isFaturaTotal
    ? card.lancamentos || []
    : (card.lancamentos || []).filter((l: any) => l.pessoaId === selectedPessoaId);

  // Valor total a exibir
  const valorTotalExibido = isFaturaTotal
    ? card.totalFatura || 0
    : selectedPessoa?.valor || 0;

  // Agrupar por pessoa para fatura total
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

  const linkNovaAba = `/cartoes/${card.id}/fatura/imprimir?month=${month}&pessoaId=${selectedPessoaId}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exportar Fatura em PDF" maxWidth="max-w-4xl">
      <div className="space-y-4">
        {/* Barra de Ações e Seleção (Não aparece na impressão) */}
        <div className="no-print p-3.5 bg-slate-800/90 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">Modo de Exportação:</span>
            <select
              value={selectedPessoaId}
              onChange={(e) => setSelectedPessoaId(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="TOTAL">📑 Fatura Total (Todos os Gastos e Pessoas)</option>
              {card.divisaoPessoas?.map((p: any) => (
                <option key={p.pessoaId} value={p.pessoaId}>
                  👤 Fatura Individual: {p.nome} ({formatCurrency(p.valor)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={linkNovaAba}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition"
              title="Abrir página limpa para impressão em tela cheia"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir em Nova Aba</span>
            </a>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Salvar PDF / Imprimir</span>
            </button>
          </div>
        </div>

        {/* DOCUMENTO DA FATURA (Estilo folha A4 limpa para impressão) */}
        <div className="print-area bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 space-y-6">
          {/* Header da Fatura */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded">
                  FinanFamily
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Extrato de Fatura
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {isFaturaTotal ? 'FATURA CONSOLIDADA' : `FATURA INDIVIDUAL • ${selectedPessoa?.nome}`}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Cartão: <strong>{card.nome}</strong> • Final: <strong>{card.ultimosDigitos || '••••'}</strong> • Titular: <strong>{card.titular}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right bg-slate-100 sm:bg-transparent p-3 sm:p-0 rounded-lg w-full sm:w-auto">
              <span className="text-xs text-slate-500 uppercase font-bold block">Mês de Referência</span>
              <span className="text-base font-extrabold text-slate-900">
                {formatMonthName(month)}
              </span>
              <div className="text-xs text-slate-600 mt-0.5">
                Vence dia: <strong>{String(card.diaVencimento).padStart(2, '0')}</strong> • Fecha dia: <strong>{String(card.diaFechamento).padStart(2, '0')}</strong>
              </div>
            </div>
          </div>

          {/* Box de Valor Total a Pagar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-xl col-span-2 flex flex-col justify-between">
              <span className="text-xs uppercase font-bold text-slate-300">
                {isFaturaTotal ? 'Total Geral da Fatura' : `Total Devido por ${selectedPessoa?.nome}`}
              </span>
              <div className="text-3xl font-black mt-1">
                {formatCurrency(valorTotalExibido)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1">
                {lancamentosExibidos.length} lançamento(s) registrado(s)
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between text-xs">
              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Emissor do Cartão</span>
                <span className="text-sm font-bold text-slate-800">{card.banco || 'Cartão de Crédito'}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200">
                <span className="text-slate-500 block text-[10px]">Data de Emissão:</span>
                <span className="font-semibold text-slate-700">{formatDate(new Date())}</span>
              </div>
            </div>
          </div>

          {/* SE FATURA TOTAL: TABELA DE DIVISÃO POR PESSOA */}
          {isFaturaTotal && card.divisaoPessoas && card.divisaoPessoas.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Resumo da Divisão por Pessoa:
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2 border-b">Pessoa</th>
                      <th className="px-3 py-2 border-b text-center">Compras</th>
                      <th className="px-3 py-2 border-b text-right">% do Total</th>
                      <th className="px-3 py-2 border-b text-right">Valor Devido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {card.divisaoPessoas.map((p: any) => {
                      const pct = card.totalFatura > 0 ? (p.valor / card.totalFatura) * 100 : 0;
                      return (
                        <tr key={p.pessoaId} className="hover:bg-slate-50">
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
                      <td className="px-3 py-2 border-t">TOTAL FATURA</td>
                      <td className="px-3 py-2 border-t text-center">{card.lancamentos?.length || 0}</td>
                      <td className="px-3 py-2 border-t text-right">100%</td>
                      <td className="px-3 py-2 border-t text-right text-sm">
                        {formatCurrency(card.totalFatura)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* DETALHAMENTO DE GASTOS */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Receipt className="w-4 h-4 text-indigo-600" />
              {isFaturaTotal ? 'Detalhamento Completo dos Gastos (Por Pessoa):' : `Gastos de ${selectedPessoa?.nome}:`}
            </h3>

            {isFaturaTotal ? (
              // Agrupado por pessoa
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
              // Individual da pessoa selecionada
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2 border-b">Data</th>
                    <th className="px-3 py-2 border-b">Descrição da Despesa</th>
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
                            <span className="font-bold">{item.parcelaAtual}/{item.totalParcelas}</span>
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
                    <td colSpan={4} className="px-3 py-2 text-right">TOTAL A REEMBOLSAR:</td>
                    <td className="px-3 py-2 text-right text-sm">
                      {formatCurrency(valorTotalExibido)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Instruções / Rodapé */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2">
            <div>
              <p>
                <strong>Observação de Pagamento:</strong> O valor devido deve ser repassado ao titular{' '}
                <strong>{card.titular}</strong> até a data de vencimento da fatura.
              </p>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Gerado via FinanFamily
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
