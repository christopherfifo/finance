import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MonthProvider } from '@/context/MonthContext';

export const metadata: Metadata = {
  title: 'FinanFamily - Controle Financeiro Pessoal e Familiar',
  description: 'Controle de cartões de crédito, contas fixas, dívidas e divisão de despesas familiares.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white">
        <MonthProvider>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto pb-16">
                {children}
              </main>
            </div>
          </div>
        </MonthProvider>
      </body>
    </html>
  );
}
