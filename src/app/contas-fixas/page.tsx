'use client';

import React, { useState, useEffect } from 'react';
import { useMonth } from '@/context/MonthContext';
import { formatCurrency, formatMonthName, formatDayToDateBR, getCurrentMonthRef } from '@/lib/utils';
import { Modal } from '@/components/Modal';
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Trash2,
  Edit2,
  Tv,
  Home,
  Check,
  X,
  Loader2,
  CreditCard,
  Receipt,
  Banknote,
  Smartphone,
  User,
} from 'lucide-react';

// ─── Helpers de formato mês/ano ────────────────────────────────────────────────

/** "10/2026" → "2026-10" */
function displayToMonthRef(display: string): string {
  if (!display || !display.includes('/')) return '';
  const [mm, yyyy] = display.split('/');
  return `${yyyy}-${mm.padStart(2, '0')}`;
}

/** "2026-10" → "10/2026" */
function monthRefToDisplay(ref: string): string {
  if (!ref || !ref.includes('-')) return '';
  const [yyyy, mm] = ref.split('-');
  return `${mm}/${yyyy}`;
}

/** Retorna o mês atual no formato de exibição "MM/YYYY" */
function defaultMesInicioDisplay(): string {
  const ref = getCurrentMonthRef(); // "2026-10"
  return monthRefToDisplay(ref);
}

// ─── Ícone de forma de pagamento ──────────────────────────────────────────────

function FormaPagamentoIcon({ forma }: { forma: string }) {
  if (forma === 'CARTAO_CREDITO') return <CreditCard className="w-3 h-3" />;
  if (forma === 'DEBITO_AUTOMATICO') return <CreditCard className="w-3 h-3" />;
  if (forma === 'BOLETO') return <Receipt className="w-3 h-3" />;
  if (forma === 'PIX') return <Smartphone className="w-3 h-3" />;
  return null;
}

function formaPagamentoLabel(forma: string): string {
  const labels: Record<string, string> = {
    CARTAO_CREDITO: 'Cartão de Crédito',
    DEBITO_AUTOMATICO: 'Débito Automático (Cartão)',
    BOLETO: 'Boleto',
    PIX: 'PIX / Transferência',
  };
  return labels[forma] || forma;
}

// ─── Badge de status ──────────────────────────────────────────────────────────

function StatusBadge({ conta, diaHoje, currentMonth }: { conta: any; diaHoje: number; currentMonth: string }) {
  if (conta.pago) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
        <Check className="w-3 h-3" /> Pago
      </span>
    );
  }

  // Verifica se estamos no mês atual
  const hoje = getCurrentMonthRef();
  if (currentMonth < hoje) {
    // Mês passado e não pago → Atrasado
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/40">
        Atrasado
      </span>
    );
  }

  if (currentMonth === hoje) {
    const diaDesconto = conta.diaDesconto ?? conta.diaVencimento;
    if (diaHoje > diaDesconto) {
      // Já passou o dia de desconto e não foi marcado pago → Descontado
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
          Descontado
        </span>
      );
    }
  }

  // Ainda não passou → Gasto Previsto
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
      Gasto Previsto
    </span>
  );
}

// ─── Estado inicial compartilhado entre criar e editar ────────────────────────

function emptyForm() {
  return {
    descricao: '',
    valorPadrao: '',
    diaVencimento: '10',
    diaDesconto: '',
    periodicidade: 'MENSAL',
    categoriaId: '',
    observacoes: '',
    mesInicio: defaultMesInicioDisplay(),
    mesFim: '',
    formaPagamento: 'BOLETO',
    cartaoId: '',
    pessoaId: '',
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ContasFixasPage() {
  const { currentMonth, refreshKey, triggerRefresh } = useMonth();
  const [contas, setContas] = useState<any[]>([]);
  const [totais, setTotais] = useState<any>({
    totalPrevisto: 0,
    totalPago: 0,
    totalPendente: 0,
    totalContas: 0,
    contasPagas: 0,
  });
  const [loading, setLoading] = useState(true);

  // Dados auxiliares para selects
  const [categorias, setCategorias] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [pessoas, setPessoas] = useState<any[]>([]);

  // Modal Nova Conta Fixa
  const [modalOpen, setModalOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // Modal Edição de Conta Fixa
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm());
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  // Toggling status loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const pctPagas = totais.totalContas > 0 ? (totais.contasPagas / totais.totalContas) * 100 : 0;

  // Carregar dados auxiliares uma só vez
  useEffect(() => {
    loadAuxData();
  }, []);

  // Carregar contas ao mudar de mês ou trigger refresh
  useEffect(() => {
    loadContas();
  }, [currentMonth, refreshKey]);

  const loadAuxData = async () => {
    try {
      const [resCat, resCartoes, resPessoas] = await Promise.all([
        fetch('/api/categorias'),
        fetch('/api/cartoes'),
        fetch('/api/pessoas'),
      ]);
      const [dataCat, dataCartoes, dataPessoas] = await Promise.all([
        resCat.json(),
        resCartoes.json(),
        resPessoas.json(),
      ]);

      if (dataCat.success) {
        setCategorias(dataCat.data);
        // Pré-selecionar primeira categoria no formulário
        if (dataCat.data.length > 0) {
          setForm((prev) => ({ ...prev, categoriaId: dataCat.data[0].id }));
        }
      }

      // /api/cartoes retorna { success, data: [ {...cartao, totalFatura, divisaoPessoas}, ... ] }
      if (dataCartoes.success) {
        setCartoes(dataCartoes.data);
      }

      // /api/pessoas retorna { success, data: [ {...pessoa, totalDespesasMes, ...}, ... ] }
      if (dataPessoas.success) {
        setPessoas(dataPessoas.data);
        // Pré-selecionar o usuário principal (isUser=true)
        const usuarioPrincipal = dataPessoas.data.find((p: any) => p.isUser);
        if (usuarioPrincipal) {
          setForm((prev) => ({ ...prev, pessoaId: usuarioPrincipal.id }));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados auxiliares:', err);
    }
  };

  const loadContas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contas-fixas?month=${currentMonth}`);
      const json = await res.json();
      if (json.success) {
        setContas(json.data.items);
        setTotais(json.data.totais);
      }
    } catch (err) {
      console.error('Erro ao carregar contas fixas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePago = async (conta: any) => {
    setTogglingId(conta.id);
    try {
      const res = await fetch(`/api/contas-fixas/${conta.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth }),
      });
      const data = await res.json();
      if (data.success) {
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  // ─── Criar conta fixa ───────────────────────────────────────────────────────

  const handleCreateConta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descricao || !form.valorPadrao || !form.diaVencimento) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setSalvando(true);
    try {
      const payload: any = {
        descricao: form.descricao,
        valorPadrao: form.valorPadrao,
        diaVencimento: form.diaVencimento,
        diaDesconto: form.diaDesconto || null,
        periodicidade: form.periodicidade,
        categoriaId: form.categoriaId || null,
        observacoes: form.observacoes,
        mesInicio: form.mesInicio ? displayToMonthRef(form.mesInicio) : null,
        mesFim: form.mesFim ? displayToMonthRef(form.mesFim) : null,
        formaPagamento: form.formaPagamento || null,
        pessoaId: form.pessoaId || null,
      };

      // Cartão apenas se forma de pagamento usar cartão
      if (form.formaPagamento === 'CARTAO_CREDITO' || form.formaPagamento === 'DEBITO_AUTOMATICO') {
        payload.cartaoId = form.cartaoId || null;
      } else {
        payload.cartaoId = null;
      }

      const res = await fetch('/api/contas-fixas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        // Reset form mantendo defaults
        const defaultForm = emptyForm();
        if (categorias.length > 0) defaultForm.categoriaId = categorias[0].id;
        const usuarioPrincipal = pessoas.find((p) => p.isUser);
        if (usuarioPrincipal) defaultForm.pessoaId = usuarioPrincipal.id;
        setForm(defaultForm);
        triggerRefresh();
      } else {
        alert('Erro ao criar conta fixa: ' + data.error);
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  // ─── Abrir modal de edição ──────────────────────────────────────────────────

  const handleOpenEdit = (conta: any) => {
    setEditandoId(conta.id);
    setEditForm({
      descricao: conta.descricao || '',
      valorPadrao: String(conta.valorPadrao ?? ''),
      diaVencimento: String(conta.diaVencimento ?? '10'),
      diaDesconto: conta.diaDesconto != null ? String(conta.diaDesconto) : '',
      periodicidade: conta.periodicidade || 'MENSAL',
      categoriaId: conta.categoriaId || '',
      observacoes: conta.observacoes || '',
      mesInicio: conta.mesInicio ? monthRefToDisplay(conta.mesInicio) : defaultMesInicioDisplay(),
      mesFim: conta.mesFim ? monthRefToDisplay(conta.mesFim) : '',
      formaPagamento: conta.formaPagamento || 'BOLETO',
      cartaoId: conta.cartaoId || '',
      pessoaId: conta.pessoaId || '',
    });
    setEditModalOpen(true);
  };

  // ─── Salvar edição ──────────────────────────────────────────────────────────

  const handleEditConta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoId) return;
    if (!editForm.descricao || !editForm.valorPadrao || !editForm.diaVencimento) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setSalvandoEdit(true);
    try {
      const payload: any = {
        descricao: editForm.descricao,
        valorPadrao: editForm.valorPadrao,
        diaVencimento: editForm.diaVencimento,
        diaDesconto: editForm.diaDesconto || null,
        periodicidade: editForm.periodicidade,
        categoriaId: editForm.categoriaId || null,
        observacoes: editForm.observacoes,
        mesInicio: editForm.mesInicio ? displayToMonthRef(editForm.mesInicio) : null,
        mesFim: editForm.mesFim ? displayToMonthRef(editForm.mesFim) : null,
        formaPagamento: editForm.formaPagamento || null,
        pessoaId: editForm.pessoaId || null,
      };

      if (editForm.formaPagamento === 'CARTAO_CREDITO' || editForm.formaPagamento === 'DEBITO_AUTOMATICO') {
        payload.cartaoId = editForm.cartaoId || null;
      } else {
        payload.cartaoId = null;
      }

      const res = await fetch(`/api/contas-fixas/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditandoId(null);
        triggerRefresh();
      } else {
        alert('Erro ao editar conta fixa: ' + data.error);
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSalvandoEdit(false);
    }
  };

  // ─── Excluir conta fixa ─────────────────────────────────────────────────────

  const handleDeleteConta = async (id: string, desc: string) => {
    if (!confirm(`Deseja excluir a conta fixa "${desc}"?`)) return;
    try {
      const res = await fetch(`/api/contas-fixas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Helper: determinar se forma usa cartão ─────────────────────────────────

  const formaUsaCartao = (forma: string) =>
    forma === 'CARTAO_CREDITO' || forma === 'DEBITO_AUTOMATICO';

  // ─── Campos do formulário (reutilizado em Criar e Editar) ──────────────────

  function FormFields({
    f,
    setF,
  }: {
    f: typeof form;
    setF: React.Dispatch<React.SetStateAction<typeof form>>;
  }) {
    return (
      <>
        {/* Descrição */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Descrição da Conta *</label>
          <input
            type="text"
            required
            placeholder="Ex: Internet Fibra, Energia Enel, Netflix..."
            value={f.descricao}
            onChange={(e) => setF((prev) => ({ ...prev, descricao: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Valor + Dia Vencimento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Valor Estimado (R$) *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              value={f.valorPadrao}
              onChange={(e) => setF((prev) => ({ ...prev, valorPadrao: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Dia do Vencimento *</label>
            <input
              type="number"
              min="1"
              max="31"
              required
              value={f.diaVencimento}
              onChange={(e) => setF((prev) => ({ ...prev, diaVencimento: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
            />
          </div>
        </div>

        {/* Dia Desconto + Periodicidade */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Dia do Desconto/Débito</label>
            <input
              type="number"
              min="1"
              max="31"
              placeholder="Ex: 5"
              value={f.diaDesconto}
              onChange={(e) => setF((prev) => ({ ...prev, diaDesconto: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
            />
            <p className="text-[10px] text-slate-500">Dia que o cartão debita ou desconta</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Periodicidade</label>
            <select
              value={f.periodicidade}
              onChange={(e) => setF((prev) => ({ ...prev, periodicidade: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
            >
              <option value="MENSAL">Mensal</option>
              <option value="ANUAL">Anual</option>
              <option value="SEMANAL">Semanal</option>
            </select>
          </div>
        </div>

        {/* Forma de Pagamento */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Forma de Pagamento</label>
          <select
            value={f.formaPagamento}
            onChange={(e) => {
              const novaForma = e.target.value;
              setF((prev) => ({
                ...prev,
                formaPagamento: novaForma,
                // Limpar cartão se mudar para forma que não usa cartão
                cartaoId: formaUsaCartao(novaForma) ? prev.cartaoId : '',
              }));
            }}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
          >
            <option value="CARTAO_CREDITO">Cartão de Crédito</option>
            <option value="DEBITO_AUTOMATICO">Débito Automático (Cartão)</option>
            <option value="BOLETO">Boleto</option>
            <option value="PIX">PIX / Transferência</option>
          </select>
        </div>

        {/* Cartão (condicional) */}
        {formaUsaCartao(f.formaPagamento) && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Cartão Vinculado</label>
            <select
              value={f.cartaoId}
              onChange={(e) => setF((prev) => ({ ...prev, cartaoId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
            >
              <option value="">— Selecione o cartão —</option>
              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Categoria + Pessoa */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Categoria</label>
            <select
              value={f.categoriaId}
              onChange={(e) => setF((prev) => ({ ...prev, categoriaId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
            >
              <option value="">— Sem categoria —</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Pessoa</label>
            <select
              value={f.pessoaId}
              onChange={(e) => setF((prev) => ({ ...prev, pessoaId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
            >
              <option value="">— Selecione —</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isUser ? `${p.nome} (Eu)` : p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Observações (opcional)</label>
          <textarea
            rows={2}
            placeholder="Código de barras, contrato, etc..."
            value={f.observacoes}
            onChange={(e) => setF((prev) => ({ ...prev, observacoes: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
          />
        </div>
      </>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-400" />
            Contas Fixas &amp; Recorrentes • {formatMonthName(currentMonth)}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe contas de água, energia, internet e assinaturas, marcando com 1 clique o status de cada mês.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Conta Fixa</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 block">Total Previsto no Mês</span>
          <div className="mt-2 text-2xl font-black text-white">
            {formatCurrency(totais.totalPrevisto)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totais.totalContas} contas cadastradas
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 block">Total Já Pago</span>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {formatCurrency(totais.totalPago)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totais.contasPagas} contas quitadas no mês
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 block">Total Pendente</span>
          <div className="mt-2 text-2xl font-black text-amber-400">
            {formatCurrency(totais.totalPendente)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totais.totalContas - totais.contasPagas} contas a pagar
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Progresso do Mês</span>
            <span className="text-xs font-bold text-indigo-400">{pctPagas.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden my-2">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${pctPagas}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500">
            {totais.contasPagas} de {totais.totalContas} contas pagas
          </div>
        </div>
      </div>

      {/* Grid de Contas */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : contas.length === 0 ? (
        <div className="p-10 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
          <CalendarCheck className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="font-semibold text-white">Nenhuma conta fixa cadastrada</h3>
          <p className="text-xs">Cadastre suas despesas mensais como água, luz e assinaturas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contas.map((conta) => {
            const isPago = conta.pago;
            const isToggling = togglingId === conta.id;
            const diaDesconto = conta.diaDesconto ?? conta.diaVencimento;

            return (
              <div
                key={conta.id}
                className={`p-5 rounded-2xl border shadow-md flex flex-col justify-between space-y-4 transition ${
                  isPago
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                    : 'bg-slate-900/90 border-slate-800 text-slate-200'
                }`}
              >
                {/* Cabeçalho do card */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Badges: categoria + status */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                          {conta.categoria?.nome || 'Contas'}
                        </span>
                        <StatusBadge conta={conta} diaHoje={diaHoje} currentMonth={currentMonth} />
                      </div>

                      <h4 className="text-sm font-bold text-white mt-1 truncate">{conta.descricao}</h4>

                      {/* Forma de pagamento */}
                      {conta.formaPagamento && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                          <FormaPagamentoIcon forma={conta.formaPagamento} />
                          <span>{formaPagamentoLabel(conta.formaPagamento)}</span>
                        </div>
                      )}

                      {/* Cartão vinculado */}
                      {conta.cartao && (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-indigo-400">
                          <CreditCard className="w-3 h-3" />
                          <span>{conta.cartao.nome}</span>
                        </div>
                      )}

                      {/* Pessoa vinculada */}
                      {conta.pessoa && (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400">
                          <User className="w-3 h-3" />
                          <span>{conta.pessoa.isUser ? `${conta.pessoa.nome} (Eu)` : conta.pessoa.nome}</span>
                        </div>
                      )}

                      {conta.observacoes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{conta.observacoes}</p>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(conta)}
                        className="p-1 text-slate-500 hover:text-indigo-400 transition"
                        title="Editar conta fixa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteConta(conta.id, conta.descricao)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Excluir conta fixa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rodapé do card */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  {/* Datas e valor */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Vencimento: {formatDayToDateBR(conta.diaVencimento, currentMonth)}
                    </span>
                    {conta.diaDesconto && conta.diaDesconto !== conta.diaVencimento && (
                      <span className="text-[10px] text-slate-500">
                        Desconto: {formatDayToDateBR(conta.diaDesconto, currentMonth)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-extrabold text-white">
                      {formatCurrency(conta.valorPadrao)}
                    </span>

                    <button
                      onClick={() => handleTogglePago(conta)}
                      disabled={isToggling}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm ${
                        isPago
                          ? 'bg-slate-800 text-slate-300 hover:bg-rose-950/50 hover:text-rose-300 border border-slate-700'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30'
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isPago ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Desmarcar</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar Pago</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal Nova Conta Fixa ─────────────────────────────────────────────── */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Cadastrar Nova Conta Fixa"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleCreateConta} className="space-y-4">
            <FormFields f={form} setF={setForm} />

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
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
                {salvando ? 'Salvando...' : 'Salvar Conta'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Modal Editar Conta Fixa ───────────────────────────────────────────── */}
      {editModalOpen && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => { setEditModalOpen(false); setEditandoId(null); }}
          title="Editar Conta Fixa"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleEditConta} className="space-y-4">
            <FormFields f={editForm} setF={setEditForm} />

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { setEditModalOpen(false); setEditandoId(null); }}
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
          </form>
        </Modal>
      )}
    </div>
  );
}
