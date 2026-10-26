'use client';

import React, { useEffect, useState } from 'react';
import { useMonth } from '@/context/MonthContext';
import { formatCurrency, formatMonthName } from '@/lib/utils';
import {
  CreditCard,
  User,
  ArrowUpRight,
  ArrowDownRight,
  CalendarCheck,
  CalendarClock,
  PieChart,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentMonth, refreshKey, triggerRefresh } = useMonth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [currentMonth, refreshKey]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?month=${currentMonth}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Erro ao carregar dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Carregando painel financeiro...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-base text-amber-100">Não foi possível conectar ao banco de dados PostgreSQL</h3>
            <p className="text-sm text-amber-300/80 leading-relaxed">
              Verifique se a variável <code className="px-1.5 py-0.5 bg-black/40 rounded text-amber-200">DATABASE_URL</code> no arquivo <code className="px-1.5 py-0.5 bg-black/40 rounded text-amber-200">.env</code> aponta para um banco de dados ativo.
            </p>
            <p className="text-xs text-amber-400/60 font-mono">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalFaturas = 0,
    totalMinhasDespesas = 0,
    totalGeralDespesas = 0,
    totalReceitas = 0,
    totalAReceber = 0,
    totalAPagar = 0,
    totalContasFixasPendentes = 0,
    totalContasFixasPagas = 0,
    faturasCartoes = [],
    dividaCartaoPorPessoa = [],
    proximosVencimentos = [],
    gastosPorCategoria = [],
    gastosPorPessoa = [],
    totalLancamentos = 0,
  } = data || {};

  const saldoLiquidoReceber = totalAReceber - totalAPagar;

  return (
    <div className="space-y-6">
      {/* Welcome & Month banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Resumo Financeiro • {formatMonthName(currentMonth)}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visão consolidada de cartões, despesas familiares, contas e valores a receber.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Total Geral Gasto no Mês</span>
            <span className="text-lg font-extrabold text-white">
              {formatCurrency(totalGeralDespesas)}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Faturas Cartões */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Faturas dos Cartões</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(totalFaturas)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{faturasCartoes.length} cartões ativos</span>
              <Link href="/cartoes" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Ver faturas &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Minhas Despesas Pessoais ("Eu") */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Meus Gastos Pessoais</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(totalMinhasDespesas)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>
                {totalGeralDespesas > 0
                  ? `${((totalMinhasDespesas / totalGeralDespesas) * 100).toFixed(0)}% do total familiar`
                  : 'Sem gastos'}
              </span>
              <span className="text-indigo-400 font-medium">Titular</span>
            </div>
          </div>
        </div>

        {/* 3. Valores a Receber vs A Pagar */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Valores a Receber</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 tracking-tight">
              {formatCurrency(totalAReceber)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>A pagar: {formatCurrency(totalAPagar)}</span>
              <Link href="/dividas" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Cobranças &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* 4. Contas Fixas Pendentes */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Contas Fixas Pendentes</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400 tracking-tight">
              {formatCurrency(totalContasFixasPendentes)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Pagas: {formatCurrency(totalContasFixasPagas)}</span>
              <Link href="/contas-fixas" className="text-amber-400 hover:text-amber-300 font-medium">
                Ver contas &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Próximos Vencimentos & Faturas dos Cartões */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faturas dos Cartões Detalhadas (2 colunas) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              Faturas dos Cartões no Mês
            </h3>
            <Link
              href="/cartoes"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              Ver todos os cartões <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {faturasCartoes.length === 0 ? (
              <div className="col-span-2 p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Nenhum cartão cadastrado.
              </div>
            ) : (
              faturasCartoes.map((c: any) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                        {c.banco || 'Cartão'}
                      </span>
                      <h4 className="text-sm font-bold text-white">{c.nome}</h4>
                      <p className="text-[11px] text-slate-400">
                        Final {c.ultimosDigitos || '••••'} • Vence dia {String(c.diaVencimento).padStart(2, '0')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Total da Fatura</span>
                      <span className="text-base font-extrabold text-white">
                        {formatCurrency(c.totalMes)}
                      </span>
                    </div>
                  </div>

                  {/* Divisão por pessoa nesta fatura */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" /> Quem gastou nesta fatura:
                    </span>
                    {c.divisaoPessoas.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">Sem despesas neste mês.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {c.divisaoPessoas.map((p: any, idx: number) => {
                          const pct = c.totalMes > 0 ? (p.valor / c.totalMes) * 100 : 0;
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-300 font-medium">{p.nome}</span>
                                <span className="font-semibold text-white">
                                  {formatCurrency(p.valor)}{' '}
                                  <span className="text-[10px] text-slate-500">({pct.toFixed(0)}%)</span>
                                </span>
                              </div>
                              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resumo da Divisão Global no Cartão */}
          {dividaCartaoPorPessoa.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/30">
              <h4 className="text-xs font-semibold text-indigo-300 mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                Total que cada pessoa deve nas faturas deste mês:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {dividaCartaoPorPessoa.map((p: any) => (
                  <div key={p.pessoaId} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400 block truncate">
                      {p.nome} {p.isUser ? '(Eu)' : ''}
                    </span>
                    <span className="text-sm font-bold text-white">{formatCurrency(p.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Próximos Vencimentos (1 coluna) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-400" />
              Próximos Vencimentos
            </h3>
            <span className="text-xs text-slate-400">{proximosVencimentos.length} pendentes</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
            {proximosVencimentos.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Tudo em dia! Sem vencimentos pendentes.
              </div>
            ) : (
              proximosVencimentos.slice(0, 7).map((item: any) => {
                const isCartao = item.tipo === 'CARTAO';
                const isPago = item.status === 'PAGO';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition ${
                      isPago
                        ? 'bg-emerald-950/20 border-emerald-800/30 text-slate-400'
                        : item.diasRestantes < 0
                        ? 'bg-rose-950/20 border-rose-800/40'
                        : item.diasRestantes <= 3
                        ? 'bg-amber-950/20 border-amber-800/40'
                        : 'bg-slate-800/40 border-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isCartao ? 'bg-purple-500/20 text-purple-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {isCartao ? <CreditCard className="w-3.5 h-3.5" /> : <CalendarCheck className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white block truncate">
                          {item.titulo}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Dia {String(item.dia).padStart(2, '0')} • {item.categoria}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-white block">
                        {formatCurrency(item.valor)}
                      </span>
                      {isPago ? (
                        <span className="text-[10px] text-emerald-400 font-medium">Pago</span>
                      ) : item.diasRestantes < 0 ? (
                        <span className="text-[10px] text-rose-400 font-bold">Atrasado!</span>
                      ) : item.diasRestantes === 0 ? (
                        <span className="text-[10px] text-amber-400 font-bold">Vence hoje!</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Em {item.diasRestantes} dias</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <Link
              href="/contas-fixas"
              className="block text-center text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-2 border-t border-slate-800"
            >
              Gerenciar todas as contas &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Gastos por Categoria e Gastos por Pessoa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Categoria */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Gastos por Categoria
            </h3>
            <span className="text-xs text-slate-400">
              Total: {formatCurrency(totalGeralDespesas)}
            </span>
          </div>

          {gastosPorCategoria.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Nenhuma despesa registrada no mês.</p>
          ) : (
            <div className="space-y-3">
              {gastosPorCategoria.map((cat: any) => (
                <div key={cat.nome} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.cor || '#6366f1' }}
                      />
                      {cat.nome}
                    </span>
                    <span className="text-white font-semibold">
                      {formatCurrency(cat.total)}{' '}
                      <span className="text-[10px] text-slate-500">
                        ({cat.percentual.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${cat.percentual}%`,
                        backgroundColor: cat.cor || '#6366f1',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gastos por Pessoa */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Gastos por Membro da Família
            </h3>
            <Link href="/pessoas" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              Ver acertos &rarr;
            </Link>
          </div>

          {gastosPorPessoa.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Nenhum gasto registrado.</p>
          ) : (
            <div className="space-y-3">
              {gastosPorPessoa.map((pessoa: any) => (
                <div key={pessoa.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: pessoa.cor || '#4f46e5' }}
                      />
                      {pessoa.nome} {pessoa.isUser ? '(Eu)' : ''}
                      {pessoa.relacao && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          • {pessoa.relacao}
                        </span>
                      )}
                    </span>
                    <span className="text-white font-semibold">
                      {formatCurrency(pessoa.total)}{' '}
                      <span className="text-[10px] text-slate-500">
                        ({pessoa.percentual.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pessoa.percentual}%`,
                        backgroundColor: pessoa.cor || '#4f46e5',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
