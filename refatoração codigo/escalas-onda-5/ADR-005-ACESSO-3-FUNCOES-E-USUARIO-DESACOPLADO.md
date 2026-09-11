---
adr_number: "005"
status: aceito
created: 2026-09-11
supersedes: "ADR 004 (fluxo simplificado por professor_id)"
---
# ADR 005: Modelo de acesso com 3 funções fixas e usuário desacoplado do professor

## Contexto
O login da Onda 4 (ADR 004) era simplificado: o operador informava o professor_id e recebia um JWT sem validação de credencial. Para uso multiusuário real, é necessária autenticação com credencial e controle de permissões. A coordenadora que alimenta o sistema não é professora — usuário e professor precisam ser entidades separadas.

## Alternativas consideradas
- RBAC completo (usuário, função, grupo, permissão): poderoso, porém complexo para um sistema interno com poucos papéis.
- 3 funções fixas (admin, coordenação, professor) + super admin via seed: cobre os papéis reais sem tabelas extras.
- Login por SSO: depende de integração externa; fica para evolução futura.

## Decisão
- Adotar 3 funções fixas: admin, coordenacao, professor.
- Super admin = primeiro admin criado no seed (sem perfil extra).
- Entidade Usuario desacoplada do Professor, com vínculo opcional professor_id.
- Professor-coordenador = um único usuário com função coordenação + vínculo com o professor.
- Senha temporária criada pelo admin, troca obrigatória no primeiro acesso; reset pelo admin.
- Permissões validadas no backend (proteção por ação); frontend usa hasPermission apenas para UX.

## Consequências
- Positivas: controle de acesso real; modelo simples de manter; base pronta para evoluir para SSO.
- Negativas: recuperação de senha por e-mail fica para a próxima atualização (reset manual pelo admin).
- Neutras: substitui o ADR 004 (fluxo simplificado por professor_id).
