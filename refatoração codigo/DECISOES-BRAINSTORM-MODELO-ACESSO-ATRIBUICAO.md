# Decisões do Brainstorm — Modelo de Acesso e Atribuição (Escalas)

*Consolidação das 18 decisões — 11/09/2026*

| # | Decisão | Escolha | Justificativa |
|---|---|---|---|
| 1 | Funções do sistema | 3 fixas: admin, coordenação, professor | Cobre os papéis reais sem RBAC completo. |
| 2 | Super admin | Primeiro admin criado no seed, sem perfil extra | Ponto de partida sem duplicar permissões. |
| 3 | Entidade Usuário | Desacoplada do Professor; nome, e-mail, senha (hash), função, ativo; vínculo opcional professor_id | A coordenadora opera sem ser professora; professor com login aponta para o cadastro. |
| 4 | Professor-coordenador | Um único usuário com função coordenação + vínculo com o professor | Sem duplicidade de login. |
| 5 | Senha | Admin cria temporária; troca no 1º acesso; reset pelo admin | Recuperação por e-mail fica para a próxima atualização. |
| 6 | Permissões | Backend valida por função; frontend usa hasPermission só para UX | Esconder botão não protege; a API é a barreira real. |
| 7 | Atribuição | Entidade persistente: professor + turma + UC, com vigência e 1 substituto | Vínculo estável; professor vê suas turmas/UCs mesmo sem alocações. |
| 8 | Vigência | Data de início e fim definem a vigência e a visualização do professor | Filtra o que o professor enxerga por período. |
| 9 | Substituto | 1 por turma/data; troca pontual exige professor atribuído como substituto + justificativa (reusa justificativa_override) | Consistência e rastreabilidade. |
| 10 | Exigir atribuição para alocar | Vale apenas para alocações novas | Histórico intacto, sem retrabalho de dados antigos. |
| 11 | Visualização do professor | Apenas turmas/UCs atribuídas a ele na vigência | Foco no que é relevante. |
| 12 | Carga horária | Dupla: prevista (atribuição) + realizada (alocações) | Distingue planejamento de registro real. |
| 13 | Carga prevista | Carga da UC por vigência (cheia, sem rateio) | Simples e suficiente para planejamento e pagamento externo. |
| 14 | Pagamento | Em R$ fora do sistema; coordenação exporta as horas | Evita virar módulo financeiro. |
| 15 | Atribuição retroativa | Permitida para regularizar histórico, com justificativa obrigatória | Flexibilidade para a coordenação. |
| 16 | Multi-UC por turma | Atribuição carrega uc_id própria; turma×UC vira N:N em onda futura | Preparado para a intenção de várias UCs por turma. |
| 17 | Desativação | Soft delete (ativo) em professor/UC/turma; coordenação desativa; só admin gerencia usuários | Preserva histórico; listas grandes resolvidas com filtros. |
| 18 | Fluxo de cadastro | Nova turma: coordenação cadastra turma, professor, UC e alocação | Operação centralizada na coordenação. |

## Pontos em aberto
- Modelo N:N turma × UC: migração dedicada quando o multi-UC for implementado.
- Carga prevista com múltiplas UCs: soma das cargas das UCs atribuídas na vigência (regra já coberta pelo desenho).
