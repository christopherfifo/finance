# FinanFamily - Sistema de Controle Financeiro Pessoal e Familiar

Sistema web moderno e completo para **controle financeiro pessoal e familiar**, desenvolvido com **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM** e **PostgreSQL**.

O objetivo do sistema é centralizar e descomplicar o controle de **cartões de crédito**, **contas fixas recorrentes**, **dívidas/empréstimos** e **valores que familiares ou amigos devem a você**, permitindo visualizar em segundos quanto cada membro da família gastou e como o orçamento está distribuído.

---

## 🚀 Funcionalidades Principais

### 1. 💳 Cartões de Crédito e Faturas
- Cadastro e **edição completa de todas as informações**: nome, banco, titular, últimos dígitos, dia de fechamento, dia de vencimento, limite de crédito, bandeira e tema visual.
- **Exclusão de cartões** com confirmação segura (mantendo os lançamentos históricos desvinculados).
- Visualização estilo cartão de crédito físico (com chip EMV, indicador contactless e barra de limite).
- **Discriminação de Fatura por Pessoa**: exibe o total da fatura e o valor exato correspondente a cada familiar (ex: Titular R$ 1.200, Irmã R$ 360, Pai R$ 340).
- **📄 Exportação em PDF**:
  - **Fatura Total**: extrato completo com todos os gastos do cartão no mês, agrupados por pessoa, resumo de valores e percentuais.
  - **Fatura Individual por Pessoa**: extrato específico com apenas as compras feitas por aquela pessoa naquele cartão, com total exato a reembolsar e data de vencimento.
- Consulta de faturas do mês atual e navegação rápida entre faturas de meses anteriores e futuros.
- Lista completa e detalhada de todas as compras vinculadas a cada cartão.

### 2. 📝 Lançamentos Financeiros e Compras Parceladas
- Registro de despesas e receitas com descrição, valor, data, categoria, forma de pagamento (cartão de crédito ou dinheiro/PIX/débito) e observações.
- **Suporte Avançado a Compras Parceladas**:
  - Geração automática de todas as parcelas (`1/10`, `2/10`, etc.) distribuídas nos meses seguintes de referência.
  - Exclusão inteligente (excluir apenas a parcela selecionada ou todas as parcelas da compra de uma só vez).
- Associação de cada despesa a uma pessoa cadastrada (ex: Eu, Pai, Mãe, Irmã, Amigo).
- Opção automática no momento do cadastro para gerar uma **dívida a receber** quando uma compra for feita para outra pessoa.

### 3. 🤝 Pessoas e Divisão de Despesas
- Cadastro, **edição de todas as informações** (nome, parentesco/relação, telefone, cor visual e se é o titular) e **exclusão de pessoas**.
- Cálculo automático de quanto cada pessoa gastou em cada cartão no mês selecionado.
- **Balanço Líquido de Acerto de Contas ("Quem deve a quem")**:
  - Diferenciação precisa entre o que cada pessoa deve a você (gastos no seu cartão + empréstimos a receber) e o que você deve a ela.
  - Indicador visual claro: "Deve a você: R$ X,XX" ou "Você deve: R$ X,XX".

### 4. 💸 Controle de Dívidas e Empréstimos
- Abas separadas para **Valores a Receber (outros me devem)** e **Valores a Pagar (eu devo a outros)**.
- Identificação da origem (Empréstimo PIX, Cartão de Crédito, Divisão de Contas, etc.).
- **Amortizações e Pagamentos Parciais**:
  - Modal para registrar pagamentos com data, valor e notas.
  - Barra de progresso visual de quitação (% pago).
  - Atualização automática de status (`PENDENTE`, `PAGO_PARCIAL`, `QUITADA`).
  - Histórico de todos os pagamentos parciais realizados.

### 5. 📅 Contas Fixas Recorrentes
- Cadastro de despesas fixas (Internet Fibra, Energia Elétrica, Condomínio, Água, Streaming, Academia, etc.).
- Definição de valor padrão, dia de vencimento, categoria e periodicidade.
- **Controle Mensal de Pagamentos**:
  - Alternância de status com 1 clique (Marcar como Pago / Desmarcar).
  - Alertas visuais com badges para contas vencendo hoje, atrasadas ou a vencer.
  - Indicador de progresso do mês (% do total de contas quitadas).

### 6. 📊 Dashboard Central
- **4 Cards de KPIs Principais**: Total de faturas dos cartões, Meus gastos pessoais, Valores a receber vs. a pagar, e Contas fixas pendentes.
- **Próximos Vencimentos**: painel unificado com faturas e contas fixas ordenadas por proximidade do dia de vencimento.
- **Faturas dos Cartões no Mês**: resumo de faturas com barras de divisão por pessoa.
- **Gastos por Categoria**: distribuição percentual e valores totais por categoria.
- **Gastos por Membro da Família**: gráfico comparativo de quanto cada pessoa consumiu no orçamento.

### 7. 🔍 Filtros Avançados e Relatórios
- Filtragem combinada por texto, mês de referência, pessoa, cartão, categoria, tipo, status de pagamento e compras parceladas vs. à vista.
- Cálculo em tempo real dos totais dos itens filtrados (Total Despesas, Total Receitas e Saldo Líquido).
- **Relatório e Histórico**: gráfico de barras com evolução dos últimos 6 meses.
- **Exportação de Dados**: botão para baixar todos os lançamentos do mês em formato **CSV (Planilha)**.

---

## 🛠️ Tecnologias Utilizadas

- **Framework Web**: [Next.js 14](https://nextjs.org/) (App Router, Server Components e Route Handlers)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **ORM & Banco de Dados**: [Prisma ORM](https://www.prisma.io/) com [PostgreSQL](https://www.postgresql.org/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Manipulação de Datas**: [date-fns](https://date-fns.org/)

---

## 📁 Estrutura do Projeto

```
├── prisma/
│   ├── schema.prisma       # Modelagem completa do PostgreSQL (Cartões, Pessoas, Lançamentos, Dívidas, Contas Fixas)
│   └── seed.js             # Script de povoamento com dados realistas
├── src/
│   ├── app/
│   │   ├── api/            # API Route Handlers RESTful
│   │   │   ├── cartoes/    # Endpoints de cartões e faturas
│   │   │   ├── categorias/ # Endpoints de categorias
│   │   │   ├── contas-fixas/# Endpoints de contas fixas e toggle de pagamento
│   │   │   ├── dashboard/  # Endpoints com agregações do dashboard
│   │   │   ├── dividas/    # Endpoints de dívidas e amortizações
│   │   │   ├── health/     # Verificação de conectividade com PostgreSQL
│   │   │   ├── lancamentos/# Endpoints de lançamentos e parcelamentos
│   │   │   ├── pessoas/    # Endpoints de pessoas e acerto de contas
│   │   │   └── seed/       # Endpoint de 1 clique para popular dados demo
│   │   ├── cartoes/        # Página de Cartões & Faturas
│   │   ├── contas-fixas/   # Página de Contas Fixas
│   │   ├── dashboard/      # Página principal do Dashboard
│   │   ├── dividas/        # Página de Dívidas & Empréstimos
│   │   ├── lancamentos/    # Página de Lançamentos e Filtros
│   │   ├── pessoas/        # Página de Pessoas & Divisão
│   │   ├── relatorios/     # Página de Histórico & Exportação CSV
│   │   ├── globals.css     # Estilos globais e utilitários Tailwind
│   │   ├── layout.tsx      # Layout com Sidebar, Topbar e Contexto
│   │   └── page.tsx        # Redirecionamento inicial
│   ├── components/         # Componentes React reutilizáveis
│   │   ├── CreditCardVisual.tsx
│   │   ├── Header.tsx
│   │   ├── Modal.tsx
│   │   ├── NovoLancamentoModal.tsx
│   │   └── Sidebar.tsx
│   ├── context/
│   │   └── MonthContext.tsx# Gerenciador global do mês de referência
│   └── lib/
│       ├── prisma.ts       # Singleton do Prisma Client
│       └── utils.ts        # Formatadores (BRL, datas, offsets)
├── docker-compose.yml      # Container PostgreSQL pronto para uso
├── .env.example            # Exemplo de variáveis de ambiente
└── package.json            # Dependências e scripts npm
```

---

## ⚙️ Como Executar o Projeto

### 1. Pré-requisitos
- Node.js instalado (v18 ou superior)
- PostgreSQL (pode ser executado localmente, via Docker ou serviços em nuvem como Neon, Supabase, Railway)

### 2. Configuração do Banco de Dados

Se você utiliza **Docker**, basta rodar na raiz do projeto:
```bash
docker compose up -d
```
Isso iniciará um PostgreSQL na porta `5432` com usuário e senha padrão `postgres`.

No arquivo `.env`, certifique-se de que a variável `DATABASE_URL` aponta para o seu banco:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/financeiro?schema=public"
```

*(Caso use Neon, Supabase ou outro serviço, basta colar a connection string no `.env`)*.

### 3. Criar as Tabelas e Povoar os Dados Iniciais
Execute:
```bash
# 1. Cria as tabelas no PostgreSQL
npx prisma db push

# 2. Povoa o banco com dados de exemplo (cartões, contas fixas, despesas familiares e dívidas)
npm run db:seed
```

*(Observação: você também pode clicar no botão **"Povoar Demo"** direto na interface do sistema).*

### 4. Iniciar a Aplicação
```bash
npm run dev
```

Abra no navegador em [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts Disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Next.js |
| `npm run build` | Compila e otimiza a aplicação para produção |
| `npm run start` | Inicia o servidor de produção compilado |
| `npm run db:generate` | Gera o cliente do Prisma (`@prisma/client`) |
| `npm run db:push` | Sincroniza o schema Prisma diretamente com o PostgreSQL |
| `npm run db:seed` | Executa o script de seed para povoar a base de dados |
| `npm run db:studio` | Abre a interface visual do Prisma Studio no navegador |
