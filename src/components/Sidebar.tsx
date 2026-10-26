'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Users,
  HandCoins,
  CalendarCheck,
  BarChart3,
  Wallet,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cartoes', label: 'Cartões & Faturas', icon: CreditCard },
  { href: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
  { href: '/pessoas', label: 'Pessoas & Acertos', icon: Users },
  { href: '/dividas', label: 'Dívidas & Empréstimos', icon: HandCoins },
  { href: '/contas-fixas', label: 'Contas Fixas', icon: CalendarCheck },
  { href: '/relatorios', label: 'Relatórios & Histórico', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 shadow-lg hover:bg-slate-700"
          aria-label="Abrir menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col transition-transform duration-200 backdrop-blur-md',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              FinanFamily
            </h1>
            <p className="text-xs text-slate-400 font-medium">Controle Pessoal & Familiar</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform group-hover:scale-110',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span>Next.js + Prisma</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-500">PostgreSQL integrado</p>
          </div>
        </div>
      </aside>
    </>
  );
}
