# PRD — Onda 9: Gestão de Ciclo de Vida de Usuários

## Objetivo
Dar ao admin controle completo e seguro do ciclo de vida dos usuários: exclusão física criteriosa, desativação imperceptível e rastreável (motivo), com travas que evitem sistema órfão ou escala de professor desligado.

## Histórias de usuário
- Como admin, quero excluir fisicamente um usuário que nunca atuou (sem alocações/atribuições ativas), mantendo o banco limpo.
- Como admin, quero desativar um usuário com motivo opcional, sem que o ex-funcionário perceba a diferença no login.
- Como admin, quero ser avisado quando um usuário a desativar tiver alocações futuras, resolvendo-as antes.
- Como admin, quero ver a lista de inativos com motivo e data, e reativar quando necessário.
- Como sistema, quero impedir que o único admin ativo seja desativado ou excluído.
- Como sistema, quero impedir alocação de professor inativo (cadastro) ou com usuário vinculado desativado.

## Requisitos funcionais
- RF-01: DELETE físico em /usuarios/{id} — permitido somente sem alocações/atribuições ativas; 409 caso contrário; confirmação obrigatória na UI.
- RF-02: Trava de último admin — backend recusa (409) desativar ou excluir o único admin ativo.
- RF-03: Bloqueio de alocação — criar alocação recusa professor titular/substituto com Professor.ativo=false OU Usuario vinculado ativo=false (409 com mensagem clara).
- RF-04: Bloqueio de desativação com escala futura — desativar usuário com professor vinculado que tenha alocação futura (data >= hoje) retorna 409 listando as datas; admin resolve (remove/reatribui) e tenta de novo.
- RF-05: Motivo da desativação — campo opcional `motivo_desativacao` (string) gravado no PATCH de desativação; exibido na aba Inativos com a data.
- RF-06: Filtro de status na tela de usuários — abas Ativos/Inativos/Todos (padrão: Ativos), com busca por username.
- RF-07: Menu Usuários visível somente para admin (coordenação perde o item; backend já exige ADMIN).
- RF-08: Aba Inativos — lista desativados com motivo e data da desativação, ação "Reativar".

## Comportamentos já garantidos (não refazer)
- Login de desativado: erro genérico "Usuario ou senha invalidos." (sem vazar estado).
- Histórico de alocações antigas preservado (soft delete da Onda 7).
- Botão Reativar existente na tabela.

## Fora do escopo
- Histórico de eventos de desativação (tabela de auditoria) — campo simples nesta onda.
- Recuperação de senha por e-mail (backlog geral).
- Exclusão física de professores/UCs/turmas (permanece soft delete, ADR-007).

## Critérios de aceite
- Exclusão física só acontece com usuário sem vínculo operacional ativo; tentativa com vínculo retorna 409 com motivo.
- Desativar o único admin ativo retorna 409 em qualquer via (UI, API direta).
- Alocação envolvendo professor inativo ou desligado retorna 409 com mensagem que identifique o professor.
- Desativação com alocação futura retorna 409 com a lista de datas; após resolver, a desativação funciona.
- Aba Inativos mostra motivo e data; Reativar restaura acesso e elegibilidade.
- Coordenação não vê mais o item Usuários no menu.
