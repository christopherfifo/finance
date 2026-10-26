'use client';

import React, { useState, useEffect } from 'react';
import { useMonth } from '@/context/MonthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import {
  HandCoins,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  History,
  DollarSign,
  Trash2,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function DividasPage() {
  const { refreshKey, triggerRefresh } = useMonth();
  const [tab, setTab] = useState<'A_RECEBER' | 'A_PAGAR'>('A_RECEBER');
  const [items, setItems] = useState<any[]>([]);
  const [totais, setTotais] = useState<any>({
    totalAReceberPendente: 0,
    totalAReceberPago: 0,
    totalAPagarPendente: 0,
    totalAPagarPago: 0,
  });
  const [loading, setLoading] = useState(true);

  // Pessoas para formulários
  const [pessoas, setPessoas] = useState<any[]>([]);

  // Modal Nova Dívida
  const [modalNovaOpen, setModalNovaOpen] = useState(false);
  const [salvandoNova, setSalvandoNova] = useState(false);
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novaPessoaId, setNovaPessoaId] = useState('');
  const [novaOrigem, setNovaOrigem] = useState('Empréstimo PIX');
  const [novoVencimento, setNovoVencimento] = useState('');
  const [novasObs, setNovasObs] = useState('');

  // Modal Registrar Pagamento Parcial
  const [pagamentoDivida, setPagamentoDivida] = useState<any | null>(null);
  const [valorPagamento, setValorPagamento] = useState('');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [obsPagamento, setObsPagamento] = useState('');
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);

  useEffect(() => {
    loadPessoas();
  }, []);

  useEffect(() => {
    loadDividas();
  }, [tab, refreshKey]);

  const loadPessoas = async () => {
    try {
      const res = await fetch('/api/pessoas');
      const data = await res.json();
      if (data.success) {
        setPessoas(data.data);
        if (data.data.length > 0) setNovaPessoaId(data.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadDividas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dividas?tipo=${tab}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setTotais(json.data.totais);
      }
    } catch (err) {
      console.error('Erro ao carregar dívidas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDivida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaDescricao || !novoValor || !novaPessoaId) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setSalvandoNova(true);
    try {
      const res = await fetch('/api/dividas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: novaDescricao,
          valorTotal: novoValor,
          tipo: tab,
          origem: novaOrigem,
          dataVencimento: novoVencimento || null,
          observacoes: novasObs,
          pessoaId: novaPessoaId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalNovaOpen(false);
        setNovaDescricao('');
        setNovoValor('');
        setNovasObs('');
        triggerRefresh();
      } else {
        alert('Erro ao criar registro: ' + data.error);
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSalvandoNova(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorPagamento || parseFloat(valorPagamento) <= 0) {
      alert('Informe um valor válido maior que zero');
      return;
    }

    setSalvandoPagamento(true);
    try {
      const res = await fetch(`/api/dividas/${pagamentoDivida.id}/pagamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: valorPagamento,
          data: dataPagamento,
          observacao: obsPagamento,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPagamentoDivida(null);
        setValorPagamento('');
        setObsPagamento('');
        triggerRefresh();
      } else {
        alert('Erro ao registrar amortização: ' + data.error);
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSalvandoPagamento(false);
    }
  };

  const handleDeleteDivida = async (id: string, desc: string) => {
    if (!confirm(`Deseja excluir "${desc}"?`)) return;
    try {
      const res = await fetch(`/api/dividas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saldoLiquidoGeral = totais.totalAReceberPendente - totais.totalAPagarPendente;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-indigo-400" />
            Controle de Dívidas & Empréstimos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe valores que outras pessoas devem a você e dívidas que você tem a pagar, com amortizações parciais.
          </p>
        </div>

        <button
          onClick={() => setModalNovaOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>
            {tab === 'A_RECEBER' ? 'Registrar Valor a Receber' : 'Registrar Valor a Pagar'}
          </span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* A Receber Pendente */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total a Receber (Pendente)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {formatCurrency(totais.totalAReceberPendente)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Já amortizado: {formatCurrency(totais.totalAReceberPago)}
          </div>
        </div>

        {/* A Pagar Pendente */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total a Pagar (Pendente)</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-400">
            {formatCurrency(totais.totalAPagarPendente)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Já amortizado: {formatCurrency(totais.totalAPagarPago)}
          </div>
        </div>

        {/* Saldo Líquido de Empréstimos */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Balanço Líquido</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`mt-2 text-2xl font-black ${
              saldoLiquidoGeral >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(saldoLiquidoGeral)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {saldoLiquidoGeral >= 0 ? 'Você tem saldo positivo a receber' : 'Você tem saldo a pagar'}
          </div>
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setTab('A_RECEBER')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            tab === 'A_RECEBER'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Valores que Devem a Mim ({tab === 'A_RECEBER' ? items.length : '...'})</span>
        </button>

        <button
          onClick={() => setTab('A_PAGAR')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            tab === 'A_PAGAR'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Dívidas que Devo a Outros ({tab === 'A_PAGAR' ? items.length : '...'})</span>
        </button>
      </div>

      {/* Lista de Dívidas */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="font-semibold text-white">Nenhum registro encontrado</h3>
          <p className="text-xs">
            {tab === 'A_RECEBER'
              ? 'Ninguém deve valores a você no momento.'
              : 'Você não possui dívidas pendentes com outras pessoas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((divida) => {
            const saldoPendente = Math.max(0, divida.valorTotal - divida.valorPago);
            const percentualPago =
              divida.valorTotal > 0 ? (divida.valorPago / divida.valorTotal) * 100 : 0;
            const isQuitada = divida.status === 'QUITADA' || saldoPendente <= 0;

            return (
              <div
                key={divida.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: divida.pessoa?.cor || '#6366f1' }}
                          />
                          {divida.pessoa?.nome}
                        </span>

                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800/80 text-slate-400">
                          {divida.origem || 'Outros'}
                        </span>

                        {isQuitada ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                            Quitada
                          </span>
                        ) : divida.valorPago > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                            Parcial
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/40">
                            Pendente
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white mt-1">{divida.descricao}</h4>
                      {divida.observacoes && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{divida.observacoes}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteDivida(divida.id, divida.descricao)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Excluir dívida"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Valores & Progresso */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Saldo Restante</span>
                      <span
                        className={`text-lg font-extrabold ${
                          isQuitada ? 'text-slate-400 line-through' : 'text-white'
                        }`}
                      >
                        {formatCurrency(saldoPendente)}
                      </span>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-slate-400">Total Original: </span>
                      <span className="font-semibold text-slate-200">
                        {formatCurrency(divida.valorTotal)}
                      </span>
                      <div className="text-[11px] text-emerald-400">
                        Pago: {formatCurrency(divida.valorPago)} ({percentualPago.toFixed(0)}%)
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isQuitada ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, percentualPago)}%` }}
                    />
                  </div>

                  {divida.dataVencimento && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Vencimento previsto: {formatDate(divida.dataVencimento)}</span>
                    </div>
                  )}
                </div>

                {/* Histórico de Pagamentos Recentes & Botão Amortizar */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                    <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      {divida.pagamentos?.length || 0} amortizaç{divida.pagamentos?.length === 1 ? 'ão' : 'ões'}
                    </span>
                  </div>

                  {!isQuitada && (
                    <button
                      onClick={() => {
                        setPagamentoDivida(divida);
                        setValorPagamento(saldoPendente.toString());
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition"
                    >
                      Amortizar / Quitar
                    </button>
                  )}
                </div>

                {/* Lista de pagamentos anteriores */}
                {divida.pagamentos && divida.pagamentos.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-1 text-[11px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Últimos pagamentos:
                    </span>
                    {divida.pagamentos.slice(0, 3).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between text-slate-300">
                        <span>
                          {formatDate(p.data)} {p.observacao ? `• ${p.observacao}` : ''}
                        </span>
                        <span className="font-semibold text-emerald-400">
                          +{formatCurrency(p.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar Pagamento / Amortização */}
      {pagamentoDivida && (
        <Modal
          isOpen={Boolean(pagamentoDivida)}
          onClose={() => setPagamentoDivida(null)}
          title={`Amortizar Dívida: ${pagamentoDivida.descricao}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="p-3 bg-slate-800/60 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Pessoa:</span>
                <strong className="text-white">{pagamentoDivida.pessoa?.nome}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Valor Total da Dívida:</span>
                <span>{formatCurrency(pagamentoDivida.valorTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Saldo Pendente Restante:</span>
                <strong className="text-emerald-400">
                  {formatCurrency(
                    Math.max(0, pagamentoDivida.valorTotal - pagamentoDivida.valorPago)
                  )}
                </strong>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Valor do Pagamento (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={valorPagamento}
                onChange={(e) => setValorPagamento(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Data do Pagamento</label>
              <input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Observações / Comprovante</label>
              <input
                type="text"
                placeholder="Ex: Transferência PIX, Parcela 1..."
                value={obsPagamento}
                onChange={(e) => setObsPagamento(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPagamentoDivida(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoPagamento}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition disabled:opacity-50"
              >
                {salvandoPagamento ? 'Salvando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Nova Dívida */}
      {modalNovaOpen && (
        <Modal
          isOpen={modalNovaOpen}
          onClose={() => setModalNovaOpen(false)}
          title={tab === 'A_RECEBER' ? 'Novo Valor a Receber' : 'Nova Dívida a Pagar'}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateDivida} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Descrição *</label>
              <input
                type="text"
                required
                placeholder="Ex: Empréstimo moto, Reparo carro, Celular..."
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Valor Total (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  {tab === 'A_RECEBER' ? 'Quem deve a você? *' : 'A quem você deve? *'}
                </label>
                <select
                  value={novaPessoaId}
                  onChange={(e) => setNovaPessoaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  {pessoas
                    .filter((p) => !p.isUser)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.relacao || 'Pessoa'})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Origem da Dívida</label>
                <select
                  value={novaOrigem}
                  onChange={(e) => setNovaOrigem(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="Empréstimo PIX">Empréstimo PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Divisão de Conta">Divisão de Conta</option>
                  <option value="Compra Compartilhada">Compra Compartilhada</option>
                  <option value="Serviço / Reforma">Serviço / Reforma</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Data Prevista Quitação</label>
                <input
                  type="date"
                  value={novoVencimento}
                  onChange={(e) => setNovoVencimento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Observações (opcional)</label>
              <textarea
                rows={2}
                placeholder="Detalhes ou condições combinadas..."
                value={novasObs}
                onChange={(e) => setNovasObs(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalNovaOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoNova}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition disabled:opacity-50"
              >
                {salvandoNova ? 'Salvando...' : 'Salvar Registro'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
