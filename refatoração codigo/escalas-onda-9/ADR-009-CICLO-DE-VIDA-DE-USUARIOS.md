# ADR-009 — Ciclo de Vida de Usuários: Exclusão Criteriosa e Desativação Imperceptível

## Contexto
O sistema não tinha exclusão física de usuários (o DELETE fazia soft delete) nem travas de segurança: era possível desativar o único admin, alocar professor desligado e desativar usuário com escala futura. O brainstorm do dono do produto consolidou as decisões.

## Decisão
1. **Duas vias de saída, propósitos distintos**: *Desativar* (soft, reversível, imperceptível — padrão para desligamentos) e *Excluir* (físico, restrito a usuários sem alocações e sem atribuições ativas — limpeza de cadastros errados/testes).
2. **Backend é a fonte única de verdade**: a UI não pré-calcula elegibilidade de exclusão; tenta e trata o 409 com o motivo retornado. Evita duplicar regra de negócio e divergir.
3. **Trava de último admin no backend** (não só na UI): desativar ou excluir o único admin ativo retorna 409 em qualquer via.
4. **Bloqueio em camada**: alocação nova recusa professor com cadastro inativo **ou** usuário vinculado desativado (checagem dupla confirmada pelo dono do produto).
5. **Desativação com escala futura é bloqueada com aviso**: o admin resolve a alocação futura (remove/reatribui) antes de desativar — impede escala de professor desligado sem apagar histórico automaticamente.
6. **Motivo como campo simples** (`motivo_desativacao` + `desativado_em`), sem tabela de auditoria nesta onda.

## Consequências
- DELETE /usuarios/{id} muda de comportamento (soft → físico) — breaking change controlada: única chamada conhecida é a própria UI, que passa a usar PATCH para desativar.
- Professor desligado permanece no cadastro (soft delete da Onda 7) e no histórico de alocações — nada é apagado em cascata.
- Reativação restaura acesso e elegibilidade para alocação, limpando motivo/data.
