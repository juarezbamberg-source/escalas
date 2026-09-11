# TRD — Onda 6: Atribuição de Turmas/UCs e Carga Prevista

## Modelo de dados

### Entidade Atribuicao
| Campo | Tipo | Regras |
|---|---|---|
| id | int PK | |
| professor_id | int FK | titular |
| turma_id | int FK | |
| uc_id | int FK | UC da turma (prepara multi-UC) |
| data_inicio | date | início da vigência |
| data_fim | date | fim da vigência |
| professor_substituto_id | int FK nullable | 1 substituto |
| justificativa_retroativa | str nullable | obrigatória se data_inicio < hoje |
| created_at / updated_at | datetime | |

## Regras de negócio
- Vigência ativa: data_inicio <= data <= data_fim.
- Exigir atribuição (alocação nova): professor titular da alocação deve ter atribuição ativa para turma/UC na data; substituto da alocação deve ter atribuição como substituto na mesma turma/UC/data.
- 1 substituto por turma/data (na atribuição).
- Troca pontual de substituto na alocação: substituto deve estar atribuído como substituto; justificativa obrigatória (reusa justificativa_override).
- Atribuição retroativa: permitida, exige justificativa_retroativa.
- Multi-UC futuro: uc_id na atribuição; turma×UC vira relação N:N em onda futura (migração dedicada).

## Endpoints
- GET /atribuicoes — lista (filtros: professor, turma, vigência)
- POST /atribuicoes — cria atribuição
- PATCH /atribuicoes/{id} — edita vigência/substituto
- DELETE /atribuicoes/{id} — com confirmar
- GET /professores/{id}/atribuicoes — turmas/UCs do professor na vigência (visualização)
- GET /professores/carga?tipo=prevista|realizada — carga prevista (atribuições) e realizada (alocações)

## Carga prevista
- Soma das cargas das UCs das atribuições ativas na vigência.
- Sem rateio proporcional (carga cheia por vigência).
- Pagamento em R$ permanece fora do sistema (exportação de horas pela coordenação).

## Migração
- Alembic 0004: tabela atribuicoes.
