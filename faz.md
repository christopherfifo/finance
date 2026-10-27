Corrija as funcionalidades de orçamento, faturas e gastos previstos existentes no projeto, mantendo a arquitetura e os padrões atuais.

### 1. Academia e gastos previstos
- A academia não está sendo incluída na fatura mesmo quando está desmarcada. Corrija essa lógica.
- Adicione a opção de incluir ou não os gastos previstos na emissão da fatura, conforme solicitado anteriormente.
- Quando um gasto previsto for efetivamente lançado na fatura, ele deve deixar de ser considerado previsto e passar a ser tratado como gasto normal, evitando duplicidade.

### 2. Remover a lógica de início e fim do mês
Remova a lógica de início e fim do mês utilizada para determinar a inclusão dos gastos.

A referência deve ser a data de vencimento da conta fixa. Se o gasto estiver incluído na fatura correspondente, deve deixar de ser tratado como previsto.

### 3. Compras parceladas
Compras parceladas devem aparecer em todos os meses correspondentes às suas parcelas.

Exemplo: uma compra em 6 parcelas deve refletir as parcelas nos respectivos 6 meses, com valores e numeração corretos, sem duplicar os gastos nos orçamentos.

### 4. Referência mensal
Ao cadastrar uma conta ou fatura, deve ser possível informar a qual mês ela pertence. Essa referência deve determinar em qual orçamento mensal o lançamento será exibido.

### 5. Contas fixas recorrentes
Contas fixas sem data de término devem ser refletidas automaticamente nos orçamentos dos meses seguintes enquanto estiverem ativas, sem exigir novos cadastros mensais.

Se houver uma data de término, respeite-a.

### 6. Prisma e banco de dados
Analise o schema atual e faça as alterações necessárias para suportar essas regras.

**Se houver alterações no schema do Prisma, crie e execute uma migration para aplicá-las ao banco de dados.** Gere novamente o Prisma Client, se necessário, e atualize as consultas e operações afetadas.

Preserve os dados existentes e evite alterações destrutivas desnecessárias.