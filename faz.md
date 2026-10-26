Crie um sistema web de controle financeiro pessoal e familiar utilizando **Next.js, Prisma ORM e PostgreSQL**.

O objetivo é centralizar o controle de cartões de crédito, contas fixas, dívidas e valores que outras pessoas devem, permitindo visualizar facilmente quanto cada pessoa deve e como os gastos estão distribuídos.

### Funcionalidades

**1. Cartões de crédito**
- Cadastrar cartões com nome, últimos dígitos, titular, dia de fechamento e dia de vencimento.
- Identificar facilmente a origem de cada cartão.
- Visualizar as despesas vinculadas a cada cartão.
- Exibir o total da fatura e o valor correspondente a cada pessoa.
- Consultar faturas atuais e anteriores.

**2. Lançamentos financeiros**
- Registrar despesas com descrição, valor, data, categoria e cartão associado, quando aplicável.
- Permitir compras parceladas, informando o número total de parcelas e as parcelas restantes.
- Registrar pagamentos, recebimentos e outros lançamentos financeiros.
- Associar cada despesa a uma pessoa, como pai, mãe, irmã ou outras pessoas cadastradas.
- Permitir adicionar observações aos lançamentos.

**3. Controle de dívidas**
- Registrar valores que outras pessoas devem a mim, incluindo dívidas relacionadas a compras no cartão de crédito.
- Registrar dívidas que tenho com outras pessoas.
- Identificar quem deve, quanto deve, a origem da dívida e os valores já pagos e pendentes.
- Permitir registrar pagamentos parciais até a quitação da dívida.

**4. Contas fixas**
- Cadastrar despesas recorrentes, como internet, energia, água, assinaturas e outras contas.
- Definir descrição, valor, vencimento, categoria e periodicidade.
- Identificar contas pagas e pendentes.
- Organizar as contas por mês e visualizar os próximos vencimentos.

**5. Pessoas e divisão de despesas**
- Cadastrar pessoas e utilizar seus nomes para identificar despesas e dívidas.
- Visualizar quanto cada pessoa gastou em cada cartão.
- Calcular quanto cada pessoa deve pagar, considerando suas despesas, parcelas e pagamentos já realizados.
- Diferenciar os valores que cada pessoa deve a mim dos valores que devo a ela.

**6. Dashboard financeiro**
Criar uma página inicial com um resumo financeiro contendo:
- Total das faturas atuais dos cartões.
- Total que cada pessoa deve em cada cartão.
- Total das minhas despesas pessoais.
- Total de valores a receber e a pagar.
- Total de contas fixas pendentes.
- Próximos vencimentos de cartões e contas.
- Resumo dos gastos por categoria e por pessoa.

**7. Filtros e consultas**
Permitir filtrar os lançamentos por:
- Cartão de crédito.
- Pessoa.
- Categoria.
- Período ou mês de referência.
- Tipo de lançamento.
- Status de pagamento.
- Despesas parceladas ou à vista.

Apresentar os resultados em tabelas organizadas, com totais calculados conforme os filtros selecionados.

### Interface

Desenvolva uma interface moderna, limpa, intuitiva e responsiva, priorizando a facilidade de uso e a visualização das informações financeiras.

Organize o sistema em páginas ou seções para:
- Dashboard.
- Cartões.
- Lançamentos.
- Pessoas.
- Dívidas.
- Contas fixas.
- Histórico financeiro.

Utilize componentes reutilizáveis, formulários objetivos, tabelas com filtros e indicadores visuais para valores pagos, pendentes, a pagar e a receber.

### Tecnologias e estrutura

- **Next.js** para a aplicação web.
- **TypeScript** para tipagem.
- **Prisma ORM** para acesso ao banco de dados.
- **PostgreSQL** como banco de dados.
- Utilize uma estrutura organizada, com responsabilidades bem separadas e componentes reutilizáveis.

Modele o banco de dados de acordo com as funcionalidades, relacionando cartões, lançamentos, pessoas, dívidas, parcelas, pagamentos e contas fixas.

O sistema deve ser funcional e integrado ao banco de dados, mantendo os cálculos financeiros consistentes e as informações organizadas por mês de referência.

O foco é um sistema pessoal e familiar, sem funcionalidades empresariais desnecessárias.