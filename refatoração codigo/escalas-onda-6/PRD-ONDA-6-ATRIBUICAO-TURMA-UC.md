# PRD — Onda 6: Atribuição de Turmas/UCs e Carga Prevista

## Objetivo
Permitir que a coordenação atribua professores (titular e substituto) a turmas/UCs com vigência, e que o professor visualize apenas o que lhe foi atribuído. A atribuição vira regra de negócio para novas alocações e alimenta a carga prevista.

## Histórias de usuário
- Como coordenação, quero atribuir um professor titular a uma turma/UC com data de início e fim (vigência).
- Como coordenação, quero atribuir 1 professor substituto por turma/data.
- Como coordenação, quero sobrescrever o substituto em um dia específico, desde que o substituto pontual esteja atribuído como substituto, com justificativa.
- Como professor, quero visualizar apenas as turmas/UCs atribuídas a mim dentro da vigência.
- Como coordenação, quero que o sistema exija atribuição para criar alocação nova (titular e substituto atribuídos).
- Como coordenação, quero ver a carga prevista por professor (soma das cargas das UCs atribuídas na vigência).
- Como coordenação, quero registrar atribuições retroativas para regularizar histórico, com justificativa.

## Requisitos funcionais
- RF-01: CRUD de atribuições (professor + turma + UC + vigência + substituto).
- RF-02: Regra "exigir atribuição" aplicada apenas a alocações novas.
- RF-03: Troca pontual de substituto exige professor atribuído como substituto + justificativa (reusa justificativa_override).
- RF-04: GET /professores/{id}/atribuicoes retorna turmas/UCs do professor na vigência.
- RF-05: Carga prevista = soma das cargas das UCs atribuídas na vigência (sem rateio).
- RF-06: Atribuição retroativa permitida com justificativa obrigatória.
- RF-07: Atribuição carrega uc_id própria (preparação para multi-UC por turma no futuro).

## Critérios de aceite
- Criar alocação nova com professor não atribuído à turma/UC retorna erro.
- Criar alocação nova com substituto não atribuído como substituto retorna erro.
- Sobrescrever substituto sem justificativa retorna erro.
- Professor autenticado vê apenas suas turmas/UCs na vigência.
- Carga prevista reflete a soma das UCs atribuídas no período.
