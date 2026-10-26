'use client';

import React, { useState, useEffect } from 'react';
import { useMonth } from '@/context/MonthContext';
import { formatCurrency, formatMonthName, formatDate, getOffsetMonthRef } from '@/lib/utils';
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Loader2,
  CalendarCheck,
} from 'lucide-react';

export default function RelatoriosPage() {
  const { currentMonth } = useMonth();
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<any[]>([]);
  const [dadosMes, setDadosMes] = useState<any>(null);

  // Toggle: incluir contas fixas pendentes no CSV
  const [incluirContasFixas, setIncluirContasFixas] = useState(true);

  useEffect(() => {
    carregarRelatorios();
  }, [currentMonth]);

  const carregarRelatorios = async () => {
    setLoading(true);
    try {
      // 1. Carregar dados do mês atual
      const resAtual = await fetch(`/api/dashboard?month=${currentMonth}`);
      const dataAtual = await resAtual.json();
      if (dataAtual.success) {
        setDadosMes(dataAtual.data);
      }

      // 2. Carregar os últimos 6 meses para histórico comparativo
      const meses = [];
      for (let i = 5; i >= 0; i--) {
        meses.push(getOffsetMonthRef(currentMonth, -i));
      }

      const requests = meses.map((m) =>
        fetch(`/api/dashboard?month=${m}`)
          .then((r) => r.json())
          .then((j) => (j.success ? j.data : null))
      );

      const resultados = await Promise.all(requests);
      setHistorico(resultados.filter(Boolean));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = async () => {
    try {
      // Buscar lançamentos reais do mês
      const res = await fetch(`/api/lancamentos?month=${currentMonth}`);
      const json = await res.json();
      if (!json.success || !json.data.items) {
        alert('Nenhum dado para exportar.');
        return;
      }

      const rows = [
        ['Data', 'Descricao', 'Tipo', 'Valor (R$)', 'Pessoa', 'Cartao', 'Categoria', 'Parcela', 'Status'],
        ...json.data.items.map((i: any) => [
          formatDate(i.data),
          `"${i.descricao.replace(/"/g, '""')}"`,
          i.tipo,
          i.valor.toFixed(2),
          `"${i.pessoa?.nome || ''}"`,
          `"${i.cartao?.nome || 'PIX/Conta'}"`,
          `"${i.categoria?.nome || ''}"`,
          i.isParcelado ? `${i.parcelaAtual}/${i.totalParcelas}` : 'À vista',
          i.status,
        ]),
      ];

      // Adicionar seção de contas fixas pendentes se toggle ativado
      if (incluirContasFixas) {
        const resContas = await fetch(`/api/contas-fixas?month=${currentMonth}`);
        const jsonContas = await resContas.json();

        if (jsonContas.success && jsonContas.data.items) {
          const contasPendentes = jsonContas.data.items.filter((c: any) => !c.pago);

          if (contasPendentes.length > 0) {
            // Linha separadora
            rows.push([]);
            rows.push(['--- CONTAS FIXAS PREVISTAS (PENDENTES) ---']);
            rows.push([
              'Descrição',
              'Forma de Pagamento',
              'Cartão',
              'Pessoa',
              'Categoria',
              'Dia Vencimento',
              'Valor Estimado (R$)',
              'Status',
            ]);

            contasPendentes.forEach((c: any) => {
              const formaPagamentoLabels: Record<string, string> = {
                CARTAO_CREDITO: 'Cartão de Crédito',
                DEBITO_AUTOMATICO: 'Débito Automático (Cartão)',
                BOLETO: 'Boleto',
                PIX: 'PIX / Transferência',
              };
              rows.push([
                `"${c.descricao || ''}"`,
                `"${formaPagamentoLabels[c.formaPagamento] || c.formaPagamento || ''}"`,
                `"${c.cartao?.nome || ''}"`,
                `"${c.pessoa?.nome || ''}"`,
                `"${c.categoria?.nome || ''}"`,
                String(c.diaVencimento || ''),
                c.valorPadrao != null ? parseFloat(c.valorPadrao).toFixed(2) : '0.00',
                'PREVISTO',
              ]);
            });
          }
        }
      }

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `relatorio_financeiro_${currentMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Erro ao exportar: ' + err.message);
    }
  };

  const maxDespesa = Math.max(...historico.map((h) => h.totalGeralDespesas || 0), 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Histórico &amp; Relatórios Financeiros
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evolução mensal dos gastos familiares, divisão por categorias e exportação em planilha.
          </p>
        </div>

        {/* Controles de exportação */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Toggle: incluir contas fixas */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setIncluirContasFixas((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                incluirContasFixas ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  incluirContasFixas ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Incluir gastos previstos (contas fixas pendentes)</span>
            </div>
          </label>

          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Planilha (CSV)</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Gráfico de Evolução dos Últimos 6 Meses */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Evolução Mensal dos Gastos (Últimos 6 Meses)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparação de despesas totais, faturas de cartões e gastos pessoais.
                </p>
              </div>
            </div>

            <div className="pt-6 pb-2">
              <div className="grid grid-cols-6 gap-3 items-end h-48">
                {historico.map((m) => {
                  const alturaPct = Math.min(100, Math.max(8, (m.totalGeralDespesas / maxDespesa) * 100));
                  const isCurrent = m.mesReferencia === currentMonth;

                  return (
                    <div key={m.mesReferencia} className="flex flex-col items-center h-full justify-end group">
                      <div className="text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                        {formatCurrency(m.totalGeralDespesas)}
                      </div>

                      <div className="w-full max-w-[48px] bg-slate-800 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-300 ${
                            isCurrent
                              ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-600/30'
                              : 'bg-gradient-to-t from-slate-700 to-slate-600 group-hover:from-indigo-700 group-hover:to-indigo-500'
                          }`}
                          style={{ height: `${alturaPct}%` }}
                        />
                      </div>

                      <span
                        className={`text-[11px] font-medium mt-2 truncate w-full text-center ${
                          isCurrent ? 'text-indigo-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {formatMonthName(m.mesReferencia).split(' de ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-indigo-500" />
                <span>Mês Selecionado ({formatMonthName(currentMonth).split(' de ')[0]})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-600" />
                <span>Meses Anteriores</span>
              </div>
            </div>
          </div>

          {/* Comparativo Detalhado do Mês Ativo */}
          {dadosMes && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Despesas Pessoais vs Familiares */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Divisão: Eu vs. Outros Membros da Família
                </h3>

                <div className="space-y-4">
                  {/* Minhas despesas */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-indigo-400">Minhas Despesas (&quot;Eu&quot;):</span>
                      <span className="font-bold text-white">
                        {formatCurrency(dadosMes.totalMinhasDespesas)} (
                        {dadosMes.totalGeralDespesas > 0
                          ? (
                              (dadosMes.totalMinhasDespesas / dadosMes.totalGeralDespesas) *
                              100
                            ).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: `${
                            dadosMes.totalGeralDespesas > 0
                              ? (dadosMes.totalMinhasDespesas / dadosMes.totalGeralDespesas) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Despesas de familiares */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-rose-400">Despesas de Outras Pessoas:</span>
                      <span className="font-bold text-white">
                        {formatCurrency(
                          dadosMes.totalGeralDespesas - dadosMes.totalMinhasDespesas
                        )}{' '}
                        (
                        {dadosMes.totalGeralDespesas > 0
                          ? (
                              ((dadosMes.totalGeralDespesas - dadosMes.totalMinhasDespesas) /
                                dadosMes.totalGeralDespesas) *
                              100
                            ).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{
                          width: `${
                            dadosMes.totalGeralDespesas > 0
                              ? ((dadosMes.totalGeralDespesas - dadosMes.totalMinhasDespesas) /
                                  dadosMes.totalGeralDespesas) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-xl text-xs text-slate-400 space-y-1">
                  <p>
                    💡 <strong>Dica de Controle:</strong> Os valores gastos por outras pessoas nos seus
                    cartões de crédito devem ser reembolsados a você para o pagamento da fatura. Acompanhe na
                    aba <strong>Pessoas</strong> os valores líquidos devidos.
                  </p>
                </div>
              </div>

              {/* Tabela de Maiores Despesas do Mês */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-400" />
                  Top Gastos por Categoria
                </h3>

                <div className="space-y-2.5">
                  {dadosMes.gastosPorCategoria && dadosMes.gastosPorCategoria.length > 0 ? (
                    dadosMes.gastosPorCategoria.slice(0, 5).map((cat: any, idx: number) => (
                      <div
                        key={cat.nome}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[10px]">#{idx + 1}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: cat.cor || '#6366f1' }}
                          />
                          <span className="font-semibold text-white">{cat.nome}</span>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-white">{formatCurrency(cat.total)}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-medium">
                            ({cat.percentual.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">Sem registros neste mês.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
