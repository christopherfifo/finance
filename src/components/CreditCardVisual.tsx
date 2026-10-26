'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { Wifi, Users } from 'lucide-react';

interface Props {
  card: {
    id: string;
    nome: string;
    banco?: string | null;
    titular: string;
    ultimosDigitos?: string | null;
    diaFechamento: number;
    diaVencimento: number;
    limite?: number | null;
    cor?: string | null;
    bandeira?: string | null;
    totalMes?: number;
    divisaoPessoas?: Array<{
      pessoaId?: string;
      nome: string;
      cor?: string | null;
      valor: number;
    }>;
  };
  onClick?: () => void;
  selected?: boolean;
}

export function CreditCardVisual({ card, onClick, selected }: Props) {
  const gradientClass = card.cor || 'from-indigo-600 via-purple-700 to-slate-900';
  const total = card.totalMes || 0;
  const limite = card.limite || 0;
  const percentualUso = limite > 0 ? Math.min(100, (total / limite) * 100) : null;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl p-5 text-white shadow-xl transition-all duration-200 cursor-pointer overflow-hidden bg-gradient-to-br ${gradientClass} ${
        selected ? 'ring-2 ring-indigo-400 scale-[1.02]' : 'hover:scale-[1.01]'
      }`}
    >
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl group-hover:bg-white/15 transition-all" />

      {/* Header: Banco & Contactless */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-white/80">
            {card.banco || 'Cartão'}
          </span>
          <h3 className="text-sm font-semibold text-white drop-shadow-sm">{card.nome}</h3>
        </div>
        <Wifi className="w-5 h-5 text-white/70 rotate-90" />
      </div>

      {/* Chip e Número */}
      <div className="flex items-center justify-between mb-4">
        {/* EMV Chip visual */}
        <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 border border-amber-500/40 shadow-inner flex flex-col justify-around p-1">
          <div className="h-0.5 bg-amber-600/30 rounded" />
          <div className="h-0.5 bg-amber-600/30 rounded" />
        </div>

        <div className="text-sm font-mono tracking-widest text-white/90">
          •••• {card.ultimosDigitos || '••••'}
        </div>
      </div>

      {/* Titular e Datas */}
      <div className="flex items-end justify-between text-xs pt-1 border-t border-white/10">
        <div>
          <span className="text-[10px] uppercase text-white/60 block">Titular</span>
          <span className="font-medium text-white/95 uppercase tracking-wide">
            {card.titular}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-white/70 block">
            Fecha dia {String(card.diaFechamento).padStart(2, '0')} • Vence dia {String(card.diaVencimento).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Fatura do Mês & Barra de Limite */}
      <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-white/75 block">Fatura do Mês</span>
          <span className="text-base font-bold text-white drop-shadow">
            {formatCurrency(total)}
          </span>
        </div>

        {card.bandeira && (
          <span className="text-xs uppercase font-extrabold tracking-wider text-white/70 bg-black/20 px-2 py-0.5 rounded">
            {card.bandeira}
          </span>
        )}
      </div>

      {/* Limite de Crédito Barra */}
      {limite > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-white/70 mb-1">
            <span>Uso: {percentualUso?.toFixed(0)}%</span>
            <span>Limite: {formatCurrency(limite)}</span>
          </div>
          <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (percentualUso || 0) > 85 ? 'bg-rose-400' : 'bg-emerald-300'
              }`}
              style={{ width: `${percentualUso}%` }}
            />
          </div>
        </div>
      )}

      {/* Divisão por pessoas */}
      {card.divisaoPessoas && card.divisaoPessoas.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-white/10">
          <div className="flex items-center gap-1 text-[10px] text-white/70 mb-1.5 font-medium">
            <Users className="w-3 h-3" />
            <span>Divisão desta fatura:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {card.divisaoPessoas.map((p, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-black/30 border border-white/15 text-white/90 font-medium flex items-center gap-1"
              >
                <span>{p.nome}:</span>
                <span className="font-bold">{formatCurrency(p.valor)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
