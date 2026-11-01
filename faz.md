### 8. Execução obrigatória e continuidade entre IAs

**Não fique apenas analisando, planejando ou explicando o que precisa ser feito. Execute as alterações no código.** Trabalhe em etapas curtas para evitar consumir os tokens sem entregar resultados.

1. Faça uma análise inicial objetiva do projeto e comece a implementar. Não perca tempo com análises extensas, relatórios desnecessários ou perguntas que possam ser resolvidas consultando o próprio código.
2. Divida o trabalho em etapas funcionais e implemente cada uma antes de passar à próxima. Priorize as regras de negócio, o banco de dados, as APIs e, depois, as interfaces.
3. Não considere uma tarefa concluída apenas por ter criado um plano, explicado a solução ou iniciado a edição de arquivos. Implemente e verifique as alterações realizadas.
4. Evite reescrever arquivos inteiros quando alterações pontuais forem suficientes. Não faça refatorações desnecessárias nem altere funcionalidades fora do escopo.
5. **Se perceber que os tokens estão acabando, interrompa o trabalho atual de forma organizada e prepare imediatamente a continuidade para outra IA.** Não espere acabar o contexto para registrar o progresso.

#### Arquivo obrigatório de continuidade

Crie e mantenha o arquivo `CONTINUACAO_IA.md` na raiz do projeto, atualizando-o após cada etapa concluída.

Ele deve registrar:
- Objetivo das alterações.
- Como o sistema funciona atualmente e quais regras de negócio foram identificadas.
- Arquivos modificados e criados, com seus respectivos caminhos.
- Funcionalidades concluídas e o que realmente foi implementado.
- Funcionalidades pendentes, indicando exatamente o que falta fazer.
- Problemas encontrados, erros conhecidos e decisões técnicas tomadas.
- Migrations criadas e situação do banco de dados.
- Próxima ação exata que outra IA deve executar.
- Comandos necessários para continuar o desenvolvimento.

Não registre uma funcionalidade como concluída se ela estiver apenas planejada ou parcialmente implementada.

#### Regras para evitar perda de progresso

- Trabalhe diretamente no projeto existente.
- Preserve as alterações já realizadas e não sobrescreva trabalho anterior sem necessidade.
- Ao concluir cada etapa, atualize o arquivo de continuidade antes de iniciar a próxima.
- Não pare após criar o arquivo de continuidade. Ele serve para registrar o progresso, não para substituir a implementação.
- Não finalize a execução voluntariamente enquanto ainda houver tempo e contexto suficientes para implementar a próxima etapa.
- Se precisar interromper, deixe o projeto em um estado consistente e informe o que falta.

#### Instrução final

Comece analisando apenas o necessário para identificar a estrutura do projeto e implemente a primeira etapa imediatamente.

**Priorize código funcional em vez de explicações.** Se não conseguir concluir tudo nesta execução, deixe as alterações realizadas preservadas e o `CONTINUACAO_IA.md` atualizado, permitindo que outra IA continue sem precisar refazer a análise inicial.

Ao finalizar, informe objetivamente o que foi implementado, o que falta e qual deve ser a próxima ação.