'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useMonth } from '@/context/MonthContext';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Plus, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NovoLancamentoModal({ isOpen, onClose, onSuccess }: Props) {
  const { currentMonth } = useMonth();

  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  // Form states
  const [tipo, setTipo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [pessoaId, setPessoaId] = useState('');
  const [cartaoId, setCartaoId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [status, setStatus] = useState<'PENDENTE' | 'PAGO'>('PENDENTE');
  const [observacoes, setObservacoes] = useState('');

  // Parcelamento
  const [isParcelado, setIsParcelado] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState(2);
  const [parcelaAtual, setParcelaAtual] = useState(1);
  const [criarDivida, setCriarDivida] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    try {
      const [resPessoas, resCartoes, resCats] = await Promise.all([
        fetch('/api/pessoas'),
        fetch('/api/cartoes'),
        fetch('/api/categorias'),
      ]);

      const [dataP, dataC, dataCat] = await Promise.all([
        resPessoas.json(),
        resCartoes.json(),
        resCats.json(),
      ]);

      if (dataP.success) {
        setPessoas(dataP.data);
        const user = dataP.data.find((p: any) => p.isUser);
        if (user) setPessoaId(user.id);
        else if (dataP.data.length > 0) setPessoaId(dataP.data[0].id);
      }

      if (dataC.success) {
        setCartoes(dataC.data);
      }

      if (dataCat.success) {
        setCategorias(dataCat.data);
        if (dataCat.data.length > 0) setCategoriaId(dataCat.data[0].id);
      }

      setDataLoaded(true);
    } catch (err) {
      console.error('Erro ao carregar dependências do formulário:', err);
    }
  };

  const selectedPessoa = pessoas.find((p) => p.id === pessoaId);
  const isOutraPessoa = selectedPessoa && !selectedPessoa.isUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor || !pessoaId) {
      alert('Preencha os campos obrigatórios (descrição, valor e pessoa)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        descricao,
        valor: parseFloat(valor),
        data,
        mesReferencia: currentMonth,
        tipo,
        status,
        categoriaId: categoriaId || null,
        cartaoId: cartaoId || null,
        pessoaId,
        observacoes,
        isParcelado,
        totalParcelas: isParcelado ? totalParcelas : 1,
        parcelaAtual: isParcelado ? parcelaAtual : 1,
        criarDivida: isOutraPessoa && criarDivida,
      };

      const res = await fetch('/api/lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        onSuccess();
      } else {
        alert('Erro ao registrar lançamento: ' + (result.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      alert('Erro na requisição: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const valorNum = parseFloat(valor) || 0;
  const valorParcelaCalculado = isParcelado && totalParcelas > 0 ? (valorNum / totalParcelas).toFixed(2) : '0.00';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Lançamento Financeiro" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Tipo: Despesa / Receita */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setTipo('DESPESA')}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              tipo === 'DESPESA'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => {
              setTipo('RECEITA');
              setCartaoId('');
              setIsParcelado(false);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              tipo === 'RECEITA'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Receita
          </button>
        </div>

        {/* Descrição e Valor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-300">Descrição *</label>
            <input
              type="text"
              required
              placeholder="Ex: Supermercado, Notebook Dell, PIX..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>
        </div>

        {/* Data e Pessoa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Data do Gasto</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Pessoa Responsável *</label>
            <select
              value={pessoaId}
              onChange={(e) => setPessoaId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} {p.relacao ? `(${p.relacao})` : ''} {p.isUser ? '★ Titular' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cartão de Crédito e Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tipo === 'DESPESA' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Forma de Pagamento</label>
              <select
                value={cartaoId}
                onChange={(e) => setCartaoId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Conta Corrente / PIX / Dinheiro</option>
                {cartoes.map((c) => (
                  <option key={c.id} value={c.id}>
                    💳 {c.nome} (final {c.ultimosDigitos || '••••'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Categoria</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Sem categoria</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Seção Parcelamento (apenas para despesa) */}
        {tipo === 'DESPESA' && (
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">Compra Parcelada?</span>
                <p className="text-[11px] text-slate-400">Gera as parcelas automaticamente para os próximos meses</p>
              </div>
              <input
                type="checkbox"
                checked={isParcelado}
                onChange={(e) => setIsParcelado(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {isParcelado && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Total de Parcelas</label>
                  <select
                    value={totalParcelas}
                    onChange={(e) => setTotalParcelas(parseInt(e.target.value, 10))}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                      <option key={n} value={n}>
                        {n}x de {valorNum > 0 ? formatCurrency(valorNum / n) : '...'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Começar na Parcela</label>
                  <input
                    type="number"
                    min="1"
                    max={totalParcelas}
                    value={parcelaAtual}
                    onChange={(e) => setParcelaAtual(parseInt(e.target.value, 10) || 1)}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Opção de Dívida se for outra pessoa */}
        {tipo === 'DESPESA' && isOutraPessoa && (
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-amber-300">
                <input
                  type="checkbox"
                  checked={criarDivida}
                  onChange={(e) => setCriarDivida(e.target.checked)}
                  className="accent-amber-500 rounded"
                />
                <span>Também registrar como valor a receber de {selectedPessoa.nome}?</span>
              </label>
              <p className="text-[11px] text-amber-400/70 mt-0.5">
                Cria uma dívida formal na aba Dívidas para acompanhar pagamentos e quitação.
              </p>
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Observações (opcional)</label>
          <textarea
            rows={2}
            placeholder="Ex: Detalhes da compra, loja, motivo..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Botões */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Salvar Lançamento</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
