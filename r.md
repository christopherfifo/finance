1. Faça todas as alterações solicitadas, priorizando a correção das regras de negócio e a consistência entre orçamento, faturas e gastos previstos.

2. Analise as migrations existentes e crie uma nova migration do Prisma se necessário. Execute-a para aplicar as alterações ao banco.

3. Verifique se já existem testes e atualize-os se necessário. Não perca tempo criando uma estrutura de testes do zero.

4. Analise o schema atual e reutilize os campos existentes quando fizer sentido. Se precisar de um novo campo para o mês de referência, altere o schema e crie a migration.

5. Analise como as contas fi
6. xas funcionam atualmente e implemente a recorrência sem duplicar registros ou valores. Contas sem data de término devem continuar aparecendo nos orçamentos futuros enquanto estiverem ativas.

7. Atualize também a interface, as APIs e os componentes necessários para implementar as funcionalidades, incluindo a opção de incluir ou não gastos previstos na emissão da fatura.

8. Não há prazo específico. Faça as alterações diretamente no projeto, sem gastar tokens com planejamentos extensos ou perguntas desnecessárias. Analise a implementação existente e tome as decisões técnicas necessárias.