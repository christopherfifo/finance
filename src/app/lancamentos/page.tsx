'use client';

import React, { useState, useEffect } from 'react';
import { useMonth } from '@/context/MonthContext';
import { formatCurrency, formatDate, formatMonthName } from '@/lib/utils';
import { NovoLancamentoModal } from '@/components/NovoLancamentoModal';
import { Modal } from '@/components/Modal';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  CreditCard,
  Users,
  Tag,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  X,
  Loader2,
} from 'lucide-react';

export default function LancamentosPage() {
  const { currentMonth, refreshKey, triggerRefresh } = useMonth();

  const [items, setItems] = useState<any[]>([]);
  const [totais, setTotais] = useState<any>({
    totalItens: 0,
    totalDespesas: 0,
    totalReceitas: 0,
    saldo: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [filtroMes, setFiltroMes] = useState<string>(currentMonth);
  const [filtroPessoa, setFiltroPessoa] = useState<string>('');
  const [filtroCartao, setFiltroCartao] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroParcelado, setFiltroParcelado] = useState<string>('');

  // Dependências para os filtros
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  // Modais
  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any | null>(null);

  // Sincronizar filtro do mês quando o contexto mudar
  useEffect(() => {
    setFiltroMes(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    loadLancamentos();
  }, [
    filtroMes,
    filtroPessoa,
    filtroCartao,
    filtroCategoria,
    filtroTipo,
    filtroStatus,
    filtroParcelado,
    search,
    refreshKey,
  ]);

  const loadDependencies = async () => {
    try {
      const [resP, resC, resCat] = await Promise.all([
        fetch('/api/pessoas'),
        fetch('/api/cartoes'),
        fetch('/api/categorias'),
      ]);
      const [dataP, dataC, dataCat] = await Promise.all([resP.json(), resC.json(), resCat.json()]);
      if (dataP.success) setPessoas(dataP.data);
      if (dataC.success) setCartoes(dataC.data);
      if (dataCat.success) setCategorias(dataCat.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLancamentos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroMes) params.append('month', filtroMes);
      if (filtroPessoa) params.append('pessoaId', filtroPessoa);
      if (filtroCartao) params.append('cartaoId', filtroCartao);
      if (filtroCategoria) params.append('categoriaId', filtroCategoria);
      if (filtroTipo) params.append('tipo', filtroTipo);
      if (filtroStatus) params.append('status', filtroStatus);
      if (filtroParcelado) params.append('isParcelado', filtroParcelado);
      if (search) params.append('search', search);

      const res = await fetch(`/api/lancamentos?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setTotais(json.data.totais);
      }
    } catch (err) {
      console.error('Erro ao carregar lançamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: any, allInstallments: boolean) => {
    try {
      const res = await fetch(
        `/api/lancamentos/${item.id}?allInstallments=${allInstallments ? 'true' : 'false'}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (json.success) {
        setDeleteConfirmItem(null);
        triggerRefresh();
      } else {
        alert('Erro ao excluir: ' + json.error);
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const handleToggleStatus = async (item: any) => {
    const novoStatus = item.status === 'PAGO' ? 'PENDENTE' : 'PAGO';
    try {
      const res = await fetch(`/api/lancamentos/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      const json = await res.json();
      if (json.success) {
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const limparFiltros = () => {
    setSearch('');
    setFiltroPessoa('');
    setFiltroCartao('');
    setFiltroCategoria('');
    setFiltroTipo('');
    setFiltroStatus('');
    setFiltroParcelado('');
    setFiltroMes(currentMonth);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
            Lançamentos Financeiros
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Filtragem avançada, controle de despesas à vista e parceladas.
          </p>
        </div>

        <button
          onClick={() => setModalNovoOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Totais do Filtro Atual */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">Itens Filtrados</span>
          <span className="text-lg font-bold text-white">{totais.totalItens}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">Total Despesas</span>
          <span className="text-lg font-bold text-rose-400">{formatCurrency(totais.totalDespesas)}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">Total Receitas</span>
          <span className="text-lg font-bold text-emerald-400">{formatCurrency(totais.totalReceitas)}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">Saldo Líquido</span>
          <span
            className={`text-lg font-bold ${
              totais.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(totais.saldo)}
          </span>
        </div>
      </div>

      {/* Painel de Filtros */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            Filtros e Consultas
          </span>

          <button
            onClick={limparFiltros}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpar Filtros
          </button>
        </div>

        {/* Busca e Seletores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Busca text */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Mês de Referência */}
          <div>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Todos os Meses</option>
              <option value={currentMonth}>Mês Atual ({formatMonthName(currentMonth)})</option>
            </select>
          </div>

          {/* Pessoa */}
          <div>
            <select
              value={filtroPessoa}
              onChange={(e) => setFiltroPessoa(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Todas as Pessoas</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} {p.isUser ? '(Eu)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Cartão */}
          <div>
            <select
              value={filtroCartao}
              onChange={(e) => setFiltroCartao(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Todos os Meios</option>
              <option value="none">Sem Cartão (PIX/Dinheiro)</option>
              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>
                  💳 {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Categoria */}
          <div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Todas Categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Parcelado / À Vista */}
          <div>
            <select
              value={filtroParcelado}
              onChange={(e) => setFiltroParcelado(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Parcelado / À Vista</option>
              <option value="true">Apenas Parceladas</option>
              <option value="false">Apenas À Vista</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm font-medium text-slate-300">Nenhum lançamento encontrado.</p>
            <p className="text-xs text-slate-500">Tente ajustar os filtros ou cadastre um novo lançamento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Data</th>
                  <th className="px-4 py-3.5">Descrição</th>
                  <th className="px-4 py-3.5">Pessoa</th>
                  <th className="px-4 py-3.5">Meio / Cartão</th>
                  <th className="px-4 py-3.5">Categoria</th>
                  <th className="px-4 py-3.5">Parcelas</th>
                  <th className="px-4 py-3.5 text-right">Valor</th>
                  <th className="px-4 py-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {items.map((item) => {
                  const isDespesa = item.tipo === 'DESPESA';
                  const isPago = item.status === 'PAGO';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      {/* Status toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`p-1 rounded-md transition ${
                            isPago
                              ? 'text-emerald-400 hover:text-emerald-300'
                              : 'text-slate-500 hover:text-amber-400'
                          }`}
                          title={isPago ? 'Marcar como pendente' : 'Marcar como pago'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Data */}
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {formatDate(item.data)}
                      </td>

                      {/* Descrição & Observações */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{item.descricao}</div>
                        {item.observacoes && (
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">
                            {item.observacoes}
                          </div>
                        )}
                      </td>

                      {/* Pessoa */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300 text-[11px]">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.pessoa?.cor || '#6366f1' }}
                          />
                          {item.pessoa?.nome}
                          {item.pessoa?.isUser && (
                            <span className="text-[9px] text-indigo-400 font-bold ml-0.5">EU</span>
                          )}
                        </span>
                      </td>

                      {/* Meio / Cartão */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.cartao ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-purple-300 bg-purple-950/30 px-2 py-0.5 rounded-md border border-purple-800/30">
                            <CreditCard className="w-3 h-3" />
                            {item.cartao.nome}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">PIX / Conta</span>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {item.categoria?.nome || '—'}
                      </td>

                      {/* Parcelas */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.isParcelado ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 font-mono text-[11px] font-bold">
                            {item.parcelaAtual}/{item.totalParcelas}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">À vista</span>
                        )}
                      </td>

                      {/* Valor */}
                      <td
                        className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                          isDespesa ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isDespesa ? '-' : '+'} {formatCurrency(item.valor)}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Confirmação de Exclusão (com suporte a parceladas) */}
      {deleteConfirmItem && (
        <Modal
          isOpen={Boolean(deleteConfirmItem)}
          onClose={() => setDeleteConfirmItem(null)}
          title="Excluir Lançamento"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Tem certeza que deseja excluir o lançamento{' '}
              <strong className="text-white">"{deleteConfirmItem.descricao}"</strong> no valor de{' '}
              <strong className="text-white">{formatCurrency(deleteConfirmItem.valor)}</strong>?
            </p>

            {deleteConfirmItem.isParcelado && deleteConfirmItem.compraId && (
              <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs text-amber-300">
                Esta é uma compra parcelada ({deleteConfirmItem.parcelaAtual}/
                {deleteConfirmItem.totalParcelas}). Você pode excluir apenas esta parcela ou todas as
                parcelas vinculadas.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>

              {deleteConfirmItem.isParcelado && deleteConfirmItem.compraId ? (
                <>
                  <button
                    onClick={() => handleDelete(deleteConfirmItem, false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40"
                  >
                    Excluir Apenas Esta
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirmItem, true)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500"
                  >
                    Excluir Todas ({deleteConfirmItem.totalParcelas}x)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleDelete(deleteConfirmItem, false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500"
                >
                  Confirmar Exclusão
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Novo Lançamento */}
      {modalNovoOpen && (
        <NovoLancamentoModal
          isOpen={modalNovoOpen}
          onClose={() => setModalNovoOpen(false)}
          onSuccess={() => {
            setModalNovoOpen(false);
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
}
