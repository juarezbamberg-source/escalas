---
adr_number: "006"
status: aceito
created: 2026-09-11
---
# ADR 006: Atribuição persistente de turma/UC com vigência e substituto

## Contexto
O professor precisa saber quais turmas/UCs são dele de forma estável, e a coordenação precisa designar isso antes mesmo de existirem alocações. Além disso, a coordenação controla carga horária e pagamento de horas-aula fora do sistema.

## Alternativas consideradas
- Derivar a "atribuição" das alocações existentes: sem entidade nova, mas professor sem alocação não vê nada e não existe designação oficial.
- Entidade Atribuicao persistente (professor + turma + UC + vigência + substituto): vínculo estável e explícito; professor vê suas turmas mesmo sem alocações; base para carga prevista.

## Decisão
- Criar a entidade Atribuicao persistente com vigência (data_inicio/data_fim) e 1 substituto por turma/data.
- Exigir atribuição para criar alocações novas (titular e substituto atribuídos).
- Troca pontual de substituto exige professor atribuído como substituto + justificativa (reusa justificativa_override).
- Visualização do professor limitada às turmas/UCs atribuídas na vigência.
- Carga prevista = carga da UC por vigência (cheia); pagamento em R$ fora do sistema.
- Atribuição retroativa permitida com justificativa.
- Atribuição carrega uc_id própria para preparar o multi-UC por turma no futuro (N:N em onda futura).

## Consequências
- Positivas: vínculo estável, visualização correta, regra de consistência para novas alocações, base para relatórios.
- Negativas: nova entidade, tela e regras para manter.
- Neutras: alocações históricas não exigem atribuição retroativa (regra vale apenas para alocações novas).
