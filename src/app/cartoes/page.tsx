'use client';

import React, { useState, useEffect } from 'react';
import { useMonth } from '@/context/MonthContext';
import { formatCurrency, formatDate, formatMonthName } from '@/lib/utils';
import { CreditCardVisual } from '@/components/CreditCardVisual';
import { Modal } from '@/components/Modal';
import { FaturaPdfModal } from '@/components/FaturaPdfModal';
import {
  CreditCard,
  Plus,
  Calendar,
  Users,
  Trash2,
  Edit2,
  ExternalLink,
  Receipt,
  AlertCircle,
  Loader2,
  Printer,
  FileText,
} from 'lucide-react';

export default function CartoesPage() {
  const { currentMonth, refreshKey, triggerRefresh } = useMonth();
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal Novo Cartão
  const [modalOpen, setModalOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState('');
  const [titular, setTitular] = useState('Christopher');
  const [ultimosDigitos, setUltimosDigitos] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('25');
  const [diaVencimento, setDiaVencimento] = useState('5');
  const [limite, setLimite] = useState('');
  const [banco, setBanco] = useState('Nubank');
  const [bandeira, setBandeira] = useState('mastercard');
  const [cor, setCor] = useState('from-purple-700 via-purple-900 to-indigo-950');

  // Modal Editar Cartão
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editTitular, setEditTitular] = useState('');
  const [editUltimosDigitos, setEditUltimosDigitos] = useState('');
  const [editDiaFechamento, setEditDiaFechamento] = useState('25');
  const [editDiaVencimento, setEditDiaVencimento] = useState('5');
  const [editLimite, setEditLimite] = useState('');
  const [editBanco, setEditBanco] = useState('');
  const [editBandeira, setEditBandeira] = useState('mastercard');
  const [editCor, setEditCor] = useState('from-purple-700 via-purple-900 to-indigo-950');
  const [editAtivo, setEditAtivo] = useState(true);
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  // Modal PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfInitialPessoaId, setPdfInitialPessoaId] = useState<string | null>(null);

  useEffect(() => {
    loadCartoes();
  }, [currentMonth, refreshKey]);

  const loadCartoes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cartoes?month=${currentMonth}`);
      const json = await res.json();
      if (json.success) {
        setCartoes(json.data);
        if (json.data.length > 0 && !selectedCardId) {
          setSelectedCardId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar cartões:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await fetch('/api/cartoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          titular,
          ultimosDigitos,
          diaFechamento,
          diaVencimento,
          limite,
          banco,
          bandeira,
          cor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setNome('');
        setUltimosDigitos('');
        setLimite('');
        triggerRefresh();
      } else {
        alert('Erro ao criar cartão: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const openEditModal = (card: any) => {
    setEditingCard(card);
    setEditNome(card.nome || '');
    setEditTitular(card.titular || '');
    setEditUltimosDigitos(card.ultimosDigitos || '');
    setEditDiaFechamento(card.diaFechamento?.toString() || '25');
    setEditDiaVencimento(card.diaVencimento?.toString() || '5');
    setEditLimite(card.limite?.toString() || '');
    setEditBanco(card.banco || '');
    setEditBandeira(card.bandeira || 'mastercard');
    setEditCor(card.cor || 'from-purple-700 via-purple-900 to-indigo-950');
    setEditAtivo(card.ativo ?? true);
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    setSalvandoEdit(true);
    try {
      const res = await fetch(`/api/cartoes/${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editNome,
          titular: editTitular,
          ultimosDigitos: editUltimosDigitos,
          diaFechamento: editDiaFechamento,
          diaVencimento: editDiaVencimento,
          limite: editLimite,
          banco: editBanco,
          bandeira: editBandeira,
          cor: editCor,
          ativo: editAtivo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingCard(null);
        triggerRefresh();
      } else {
        alert('Erro ao atualizar cartão: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSalvandoEdit(false);
    }
  };

  const handleDeleteCard = async (id: string, nomeCartao: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cartão "${nomeCartao}"? Todos os lançamentos vinculados a ele continuarão no sistema sem o vínculo deste cartão.`)) return;
    try {
      const res = await fetch(`/api/cartoes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (selectedCardId === id) {
          setSelectedCardId(null);
        }
        triggerRefresh();
      } else {
        alert('Erro ao excluir cartão: ' + data.error);
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    }
  };

  const openPdfModal = (pessoaId: string | null = null) => {
    setPdfInitialPessoaId(pessoaId);
    setPdfModalOpen(true);
  };

  const selectedCard = cartoes.find((c) => c.id === selectedCardId) || cartoes[0];
  const totalFaturasTodos = cartoes.reduce((acc, curr) => acc + (curr.totalFatura || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            Cartões & Faturas • {formatMonthName(currentMonth)}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie cartões, edite dados, veja quanto cada pessoa deve e exporte faturas completas ou individuais em PDF.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block">Total de Todas as Faturas</span>
            <span className="text-base font-extrabold text-white">
              {formatCurrency(totalFaturasTodos)}
            </span>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Cartão</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : cartoes.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-3">
          <CreditCard className="w-10 h-10 mx-auto text-slate-500" />
          <h3 className="font-semibold text-white">Nenhum cartão cadastrado ainda</h3>
          <p className="text-xs">Cadastre seu primeiro cartão para centralizar despesas e parcelas.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium"
          >
            Cadastrar Agora
          </button>
        </div>
      ) : (
        <>
          {/* Grid de Cartões Visuais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cartoes.map((card) => (
              <div key={card.id} className="relative group">
                <CreditCardVisual
                  card={card}
                  selected={card.id === selectedCard?.id}
                  onClick={() => setSelectedCardId(card.id)}
                />
                <div className="absolute top-3 right-12 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(card);
                    }}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90 backdrop-blur shadow"
                    title="Editar informações do cartão"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCard(card.id, card.nome);
                    }}
                    className="p-1.5 rounded-lg bg-rose-600/80 text-white hover:bg-rose-600 backdrop-blur shadow"
                    title="Excluir cartão"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Detalhes da Fatura do Cartão Selecionado */}
          {selectedCard && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      {selectedCard.banco || 'Cartão'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">
                      Final {selectedCard.ultimosDigitos || '••••'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Fatura de {selectedCard.nome} ({formatMonthName(currentMonth)})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fecha todo dia {String(selectedCard.diaFechamento).padStart(2, '0')} • Vence dia{' '}
                    {String(selectedCard.diaVencimento).padStart(2, '0')} • Titular:{' '}
                    {selectedCard.titular}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Total da Fatura</span>
                    <span className="text-lg font-extrabold text-white">
                      {formatCurrency(selectedCard.totalFatura)}
                    </span>
                  </div>

                  {/* Botão Exportar PDF Fatura Total */}
                  <button
                    onClick={() => openPdfModal('TOTAL')}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold shadow-sm transition"
                    title="Exportar fatura completa em PDF com todos os gastos"
                  >
                    <Printer className="w-4 h-4 text-indigo-400" />
                    <span>PDF da Fatura Total</span>
                  </button>

                  {/* Botão Editar Cartão */}
                  <button
                    onClick={() => openEditModal(selectedCard)}
                    className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
                    title="Editar informações deste cartão"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Botão Excluir Cartão */}
                  <button
                    onClick={() => handleDeleteCard(selectedCard.id, selectedCard.nome)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 transition"
                    title="Excluir cartão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Divisão por Pessoa desta fatura */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Divisão da Fatura por Pessoa:
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Clique em "PDF da Pessoa" para gerar o extrato individual para cobrança
                  </span>
                </div>

                {(!selectedCard.divisaoPessoas || selectedCard.divisaoPessoas.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">
                    Nenhum gasto neste cartão no mês de {formatMonthName(currentMonth)}.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedCard.divisaoPessoas.map((p: any) => {
                      const pct = selectedCard.totalFatura > 0 ? (p.valor / selectedCard.totalFatura) * 100 : 0;
                      return (
                        <div
                          key={p.pessoaId}
                          className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between space-y-2 hover:border-indigo-500/40 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: p.cor || '#4f46e5' }}
                              />
                              {p.nome}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">{p.qtd} compras</span>
                          </div>

                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-extrabold text-white">
                              {formatCurrency(p.valor)}
                            </span>
                            <span className="text-xs text-indigo-400 font-semibold">{pct.toFixed(0)}%</span>
                          </div>

                          {/* Botão de PDF individual para a pessoa */}
                          <div className="pt-2 border-t border-slate-700/50 flex justify-end">
                            <button
                              onClick={() => openPdfModal(p.pessoaId)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/40 text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5 transition"
                              title={`Exportar extrato/fatura individual de ${p.nome}`}
                            >
                              <FileText className="w-3 h-3 text-indigo-400" />
                              <span>PDF de {p.nome}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tabela de Lançamentos da Fatura */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    Despesas nesta Fatura ({selectedCard.lancamentos?.length || 0}):
                  </h4>

                  <button
                    onClick={() => openPdfModal('TOTAL')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimir extrato completo
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Descrição</th>
                        <th className="px-4 py-3">Pessoa</th>
                        <th className="px-4 py-3">Categoria</th>
                        <th className="px-4 py-3">Parcela</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {(!selectedCard.lancamentos || selectedCard.lancamentos.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-slate-500 italic">
                            Nenhuma compra associada a este cartão neste mês.
                          </td>
                        </tr>
                      ) : (
                        selectedCard.lancamentos.map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3 font-mono text-[11px]">{formatDate(item.data)}</td>
                            <td className="px-4 py-3 font-medium text-white">{item.descricao}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: item.pessoa?.cor || '#6366f1' }}
                                />
                                {item.pessoa?.nome}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">{item.categoria?.nome || '—'}</td>
                            <td className="px-4 py-3">
                              {item.isParcelado ? (
                                <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 font-mono text-[11px]">
                                  {item.parcelaAtual}/{item.totalParcelas}
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">À vista</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-white">
                              {formatCurrency(item.valor)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Editar Cartão (Edita TODAS as informações) */}
      {editingCard && (
        <Modal
          isOpen={Boolean(editingCard)}
          onClose={() => setEditingCard(null)}
          title={`Editar Cartão: ${editingCard.nome}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateCard} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Nome do Cartão *</label>
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
                <label className="text-xs font-medium text-slate-300">Banco / Emissor</label>
                <input
                  type="text"
                  value={editBanco}
                  onChange={(e) => setEditBanco(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Últimos 4 Dígitos</label>
                <input
                  type="text"
                  maxLength={4}
                  value={editUltimosDigitos}
                  onChange={(e) => setEditUltimosDigitos(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Nome do Titular *</label>
              <input
                type="text"
                required
                value={editTitular}
                onChange={(e) => setEditTitular(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Dia Fechamento *</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={editDiaFechamento}
                  onChange={(e) => setEditDiaFechamento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Dia Vencimento *</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={editDiaVencimento}
                  onChange={(e) => setEditDiaVencimento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Limite (R$)</label>
                <input
                  type="number"
                  step="100"
                  value={editLimite}
                  onChange={(e) => setEditLimite(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Bandeira</label>
                <select
                  value={editBandeira}
                  onChange={(e) => setEditBandeira(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="mastercard">Mastercard</option>
                  <option value="visa">Visa</option>
                  <option value="elo">Elo</option>
                  <option value="amex">American Express</option>
                  <option value="hipercard">Hipercard</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Tema Visual</label>
                <select
                  value={editCor}
                  onChange={(e) => setEditCor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="from-purple-700 via-purple-900 to-indigo-950">Roxo Nubank</option>
                  <option value="from-zinc-900 via-neutral-800 to-black">Preto Black / Infinite</option>
                  <option value="from-amber-600 via-orange-700 to-stone-900">Laranja Inter</option>
                  <option value="from-blue-700 via-indigo-800 to-slate-900">Azul Royal</option>
                  <option value="from-emerald-700 via-teal-900 to-slate-950">Verde Esmeralda</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDeleteCard(editingCard.id, editingCard.nome)}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Cartão</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
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

      {/* Modal Cadastrar Cartão */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Cadastrar Novo Cartão de Crédito"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateCard} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Nome do Cartão *</label>
              <input
                type="text"
                required
                placeholder="Ex: Nubank Roxinho, C6 Carbon..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Banco / Emissor</label>
                <input
                  type="text"
                  placeholder="Ex: Nubank, Itaú, XP..."
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Últimos 4 Dígitos</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Ex: 1234"
                  value={ultimosDigitos}
                  onChange={(e) => setUltimosDigitos(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Nome do Titular *</label>
              <input
                type="text"
                required
                placeholder="Ex: Christopher F."
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Dia Fechamento *</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={diaFechamento}
                  onChange={(e) => setDiaFechamento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Dia Vencimento *</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={diaVencimento}
                  onChange={(e) => setDiaVencimento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Limite (R$)</label>
                <input
                  type="number"
                  step="100"
                  placeholder="Ex: 5000"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Bandeira</label>
                <select
                  value={bandeira}
                  onChange={(e) => setBandeira(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                >
                  <option value="mastercard">Mastercard</option>
                  <option value="visa">Visa</option>
                  <option value="elo">Elo</option>
                  <option value="amex">American Express</option>
                  <option value="hipercard">Hipercard</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Tema Visual</label>
                <select
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                >
                  <option value="from-purple-700 via-purple-900 to-indigo-950">Roxo Nubank</option>
                  <option value="from-zinc-900 via-neutral-800 to-black">Preto Black / Infinite</option>
                  <option value="from-amber-600 via-orange-700 to-stone-900">Laranja Inter</option>
                  <option value="from-blue-700 via-indigo-800 to-slate-900">Azul Royal</option>
                  <option value="from-emerald-700 via-teal-900 to-slate-950">Verde Esmeralda</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Salvar Cartão</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Exportação PDF */}
      {pdfModalOpen && selectedCard && (
        <FaturaPdfModal
          isOpen={pdfModalOpen}
          onClose={() => setPdfModalOpen(false)}
          card={selectedCard}
          month={currentMonth}
          initialPessoaId={pdfInitialPessoaId}
        />
      )}
    </div>
  );
}
