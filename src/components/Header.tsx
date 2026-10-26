'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Calendar,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useMonth } from '@/context/MonthContext';
import { formatMonthName } from '@/lib/utils';
import { NovoLancamentoModal } from './NovoLancamentoModal';

export function Header() {
  const { currentMonth, nextMonth, prevMonth, resetToToday, triggerRefresh } = useMonth();
  const [modalOpen, setModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string } | null>(null);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbStatus(data);
    } catch {
      setDbStatus({ connected: false, message: 'Falha na conexão com o servidor' });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSeed = async () => {
    if (!confirm('Deseja povoar o banco com dados de exemplo (cartões, contas, despesas familiares)? Dados anteriores serão atualizados.')) {
      return;
    }
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Banco de dados povoado com sucesso!');
        triggerRefresh();
        checkHealth();
      } else {
        alert('Erro ao povoar banco: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (e: any) {
      alert('Erro ao chamar API de seed: ' + e.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Mês Selector */}
          <div className="flex items-center gap-2 pl-12 lg:pl-0 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center bg-slate-800/80 border border-slate-700/60 rounded-xl p-1 shadow-inner">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 flex items-center gap-2 min-w-[160px] justify-center">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white tracking-wide">
                  {formatMonthName(currentMonth)}
                </span>
              </div>

              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={resetToToday}
              className="text-xs px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition border border-transparent hover:border-slate-700 hidden sm:block"
            >
              Mês Atual
            </button>
          </div>

          {/* Actions & DB Status */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Status do Banco */}
            {dbStatus && (
              <div
                className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                  dbStatus.connected
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                    : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                }`}
                title={dbStatus.message}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{dbStatus.connected ? 'Postgres Conectado' : 'Postgres Pendente'}</span>
              </div>
            )}

            {/* Botão Demo */}
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/50 transition disabled:opacity-50"
              title="Povoar com dados de exemplo"
            >
              {seeding ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span className="hidden sm:inline">Povoar Demo</span>
            </button>

            {/* Novo Lançamento */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Novo Lançamento */}
      {modalOpen && (
        <NovoLancamentoModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            triggerRefresh();
          }}
        />
      )}
    </>
  );
}
