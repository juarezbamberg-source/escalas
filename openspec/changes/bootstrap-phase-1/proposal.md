# Proposta: bootstrap da fase 1 do sistema de escala

## Resumo
Criar a base funcional do sistema de escala de professores do SENAC-RS para substituir o processo atual em planilhas. Esta mudanca estabelece a primeira versao do produto com backend FastAPI, modelo relacional consistente e capacidades suficientes para cadastrar dados base, registrar alocacoes por turno e visualizar o calendario com semaforo.

## Problema
Hoje a operacao depende de planilhas separadas por turno e de uma planilha adicional de conferencia. Isso aumenta o risco de duplicidades, conflitos de horario, quebra de formulas e inconsistencias de dados. A coordenacao precisa de um sistema que bloqueie erros por padrao, mas permita excecoes auditadas quando a operacao exigir.

## Objetivos
- Centralizar professores, turmas, UCs e alocacoes em banco relacional.
- Bloquear duplicidades e conflitos com mensagens claras e override justificado.
- Organizar a consulta da escala por turno, em ordem cronologica.
- Exibir o estado da escala no calendario com semaforo visual.
- Preparar uma base tecnica simples de evoluir para frontend SPA e deploy futuro.

## Escopo
- CRUD de professores, turmas, unidades curriculares e alocacoes.
- Validacao de turno com allowlist `manha`, `tarde` e `noite`.
- Regras de conflito para duplicidade, choque de professor e titular/substituto.
- Override auditado com justificativa minima de 10 caracteres.
- Controle de contratacao PF, CLT e PJ, com teto anual de 300 horas para PF.
- Consulta da escala por turno e calendario com semaforo.

## Nao escopo
- Importacao automatica das planilhas antigas.
- Autenticacao e autorizacao por perfis.
- Deploy em producao.
- Definicao final da tecnologia do frontend SPA.

## Impacto esperado
O produto passa a ter uma fonte unica da verdade, regras de negocio verificaveis e um plano de implementacao orientado por especificacao. Isso reduz risco operacional e facilita evoluir do planejamento para codigo sem perder os criterios de aceite.
