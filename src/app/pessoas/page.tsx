'use client';

import React, { useState, useEffect } from 'react';
import { useMonth } from '@/context/MonthContext';
import { formatCurrency, formatMonthName, formatDate } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import {
  Users,
  Plus,
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Phone,
  Trash2,
  Edit2,
  Receipt,
  HandCoins,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function PessoasPage() {
  const { currentMonth, refreshKey, triggerRefresh } = useMonth();
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Nova Pessoa
  const [modalOpen, setModalOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState('');
  const [relacao, setRelacao] = useState('Família');
  const [isUser, setIsUser] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [cor, setCor] = useState('#4f46e5');

  // Modal Editar Pessoa
  const [editingPessoa, setEditingPessoa] = useState<any | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editRelacao, setEditRelacao] = useState('');
  const [editIsUser, setEditIsUser] = useState(false);
  const [editTelefone, setEditTelefone] = useState('');
  const [editCor, setEditCor] = useState('#4f46e5');
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  useEffect(() => {
    loadPessoas();
  }, [currentMonth, refreshKey]);

  const loadPessoas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pessoas?month=${currentMonth}`);
      const json = await res.json();
      if (json.success) {
        setPessoas(json.data);
      }
    } catch (err) {
      console.error('Erro ao carregar pessoas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePessoa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await fetch('/api/pessoas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          relacao,
          isUser,
          telefone,
          cor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setNome('');
        setTelefone('');
        triggerRefresh();
      } else {
        alert('Erro ao cadastrar pessoa: ' + data.error);
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const openEditModal = (p: any) => {
    setEditingPessoa(p);
    setEditNome(p.nome || '');
    setEditRelacao(p.relacao || 'Família');
    setEditIsUser(Boolean(p.isUser));
    setEditTelefone(p.telefone || '');
    setEditCor(p.cor || '#4f46e5');
  };

  const handleUpdatePessoa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPessoa) return;
    setSalvandoEdit(true);
    try {
      const res = await fetch(`/api/pessoas/${editingPessoa.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editNome,
          relacao: editRelacao,
          isUser: editIsUser,
          telefone: editTelefone,
          cor: editCor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingPessoa(null);
        triggerRefresh();
      } else {
        alert('Erro ao atualizar pessoa: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSalvandoEdit(false);
    }
  };

  const handleDeletePessoa = async (id: string, nomePessoa: string) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir ${nomePessoa}? Todos os lançamentos, dívidas e dados associados a esta pessoa serão removidos.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/pessoas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (editingPessoa?.id === id) setEditingPessoa(null);
        triggerRefresh();
      } else {
        alert('Erro ao excluir: ' + data.error);
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    }
  };

  const coresDisponiveis = [
    '#4f46e5',
    '#059669',
    '#d97706',
    '#ec4899',
    '#0891b2',
    '#8b5cf6',
    '#e11d48',
    '#10b981',
    '#f59e0b',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Pessoas & Divisão de Despesas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre, edite todas as informações ou remova familiares e amigos, controlando gastos e balanço líquido.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Pessoa</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : pessoas.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-500" />
          <h3 className="font-semibold text-white">Nenhuma pessoa cadastrada ainda</h3>
          <p className="text-xs">Cadastre familiares e amigos para atribuir despesas e controlar quem deve o quê.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium"
          >
            Cadastrar Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pessoas.map((pessoa) => {
            const isEu = pessoa.isUser;
            const deveAMim = pessoa.valorQueElaMeDeve || 0;
            const devoAEla = pessoa.valorQueEuDevoAEla || 0;
            const saldoLiquido = pessoa.saldoLiquido || 0;

            return (
              <div
                key={pessoa.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition relative group"
              >
                {/* Header do Card */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md shrink-0"
                        style={{ backgroundColor: pessoa.cor || '#4f46e5' }}
                      >
                        {pessoa.nome.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{pessoa.nome}</h3>
                          {isEu && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 text-[9px] font-bold shrink-0">
                              TITULAR
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {pessoa.relacao || 'Sem parentesco'}
                          {pessoa.telefone ? ` • ${pessoa.telefone}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação: Editar e Excluir */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(pessoa)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Editar todas as informações da pessoa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeletePessoa(pessoa.id, pessoa.nome)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                        title="Excluir pessoa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Resumo Financeiro da Pessoa */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  {/* Gastos no mês atual */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total de Gastos no Mês:</span>
                    <span className="font-bold text-white">
                      {formatCurrency(pessoa.totalDespesasMes)}
                    </span>
                  </div>

                  {/* Gastos em cartão no mês */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-purple-400" /> Nas Faturas de Cartão:
                    </span>
                    <span className="font-bold text-purple-300">
                      {formatCurrency(pessoa.totalCartaoMes)}
                    </span>
                  </div>

                  {/* Detalhamento de cartões */}
                  {pessoa.gastosPorCartao && pessoa.gastosPorCartao.length > 0 && (
                    <div className="pl-4 space-y-1 text-[11px] text-slate-400">
                      {pessoa.gastosPorCartao.map((c: any) => (
                        <div key={c.cartaoId} className="flex justify-between">
                          <span className="truncate max-w-[140px]">• {c.cartaoNome}:</span>
                          <span className="text-slate-300 font-medium">
                            {formatCurrency(c.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dívidas gerais fora do cartão */}
                  {!isEu && (
                    <>
                      {pessoa.dividasAReceber > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <HandCoins className="w-3 h-3 text-emerald-400" /> Empréstimos a Receber:
                          </span>
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(pessoa.dividasAReceber)}
                          </span>
                        </div>
                      )}

                      {pessoa.dividasAPagar > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <HandCoins className="w-3 h-3 text-rose-400" /> Devo a esta pessoa:
                          </span>
                          <span className="font-bold text-rose-400">
                            {formatCurrency(pessoa.dividasAPagar)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Balanço Líquido / Acerto */}
                {!isEu ? (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      saldoLiquido > 0
                        ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                        : saldoLiquido < 0
                        ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                        : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold block">
                        {saldoLiquido > 0
                          ? 'Esta pessoa deve a você:'
                          : saldoLiquido < 0
                          ? 'Você deve a esta pessoa:'
                          : 'Balanço zerado:'}
                      </span>
                      <span className="text-base font-black">
                        {formatCurrency(Math.abs(saldoLiquido))}
                      </span>
                    </div>

                    <Link
                      href={`/lancamentos?pessoaId=${pessoa.id}`}
                      className="px-2.5 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-[11px] font-semibold text-white transition flex items-center gap-1"
                    >
                      <span>Ver gastos</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-indigo-400 uppercase font-bold block">
                        Seu Perfil Principal
                      </span>
                      <span className="text-xs text-slate-300">
                        {pessoa.qtdLancamentos} lançamentos registrados no mês
                      </span>
                    </div>

                    <Link
                      href={`/lancamentos?pessoaId=${pessoa.id}`}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-[11px] font-semibold text-indigo-300 transition"
                    >
                      Ver todos
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Editar Pessoa (Edita TODAS as informações) */}
      {editingPessoa && (
        <Modal
          isOpen={Boolean(editingPessoa)}
          onClose={() => setEditingPessoa(null)}
          title={`Editar Pessoa: ${editingPessoa.nome}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdatePessoa} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Nome Completo *</label>
              <input
                type="text"
                required
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Parentesco / Relação</label>
                <select
                  value={editRelacao}
                  onChange={(e) => setEditRelacao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="Eu">Eu (Titular)</option>
                  <option value="Pai">Pai</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Irmão(ã)">Irmão(ã)</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Cônjuge">Cônjuge</option>
                  <option value="Amigo(a)">Amigo(a)</option>
                  <option value="Família">Família</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={editTelefone}
                  onChange={(e) => setEditTelefone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Cor do Avatar / Identificador</label>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {coresDisponiveis.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditCor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      editCor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={editIsUser}
                  onChange={(e) => setEditIsUser(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>É o usuário principal da conta ("Eu")?</span>
              </label>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDeletePessoa(editingPessoa.id, editingPessoa.nome)}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPessoa(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdit}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition disabled:opacity-50"
                >
                  {salvandoEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Nova Pessoa */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Cadastrar Nova Pessoa"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreatePessoa} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos, Juliana, Amanda..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Parentesco / Relação</label>
                <select
                  value={relacao}
                  onChange={(e) => setRelacao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="Eu">Eu (Titular)</option>
                  <option value="Pai">Pai</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Irmão(ã)">Irmão(ã)</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Cônjuge">Cônjuge</option>
                  <option value="Amigo(a)">Amigo(a)</option>
                  <option value="Família">Família</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Cor do Avatar</label>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {coresDisponiveis.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      cor === c ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isUser}
                  onChange={(e) => setIsUser(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>É o usuário principal da conta ("Eu")?</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
