# PRD — Onda 5: Autenticação Real, Usuários e Permissões

## Objetivo
Substituir o login simplificado por professor_id por autenticação com e-mail e senha, com usuários desacoplados da entidade Professor, três funções fixas e permissões validadas no backend.

## Personas
- Admin: gerencia usuários e possui acesso total.
- Coordenação: cadastra professores, UCs, turmas, alocações e atribuições.
- Professor: acesso restrito para visualização da escala.

## Histórias de usuário
- Como admin, quero criar usuários com função e senha temporária para que acessem o sistema.
- Como usuário, quero trocar minha senha no primeiro acesso para garantir credencial pessoal.
- Como admin, quero resetar a senha de um usuário (nova temporária + força troca) para recuperar acesso.
- Como admin, quero desativar/ativar usuários para controlar quem acessa.
- Como coordenação, quero cadastrar professores, UCs, turmas e alocações.
- Como professor, quero visualizar apenas a escala (sem ações de escrita).
- Como sistema, quero validar permissões por ação no backend, não apenas esconder botões.

## Requisitos funcionais
- RF-01: POST /auth/login com e-mail e senha emite JWT com sub (user_id) e funcao.
- RF-02: Usuário com trocar_senha_no_proximo_acesso=true é obrigado a trocar a senha antes de usar o sistema.
- RF-03: CRUD de usuários restrito ao admin (criar, editar, desativar, resetar senha).
- RF-04: Seed cria o super admin (primeiro admin) com credenciais iniciais e troca obrigatória.
- RF-05: GET /auth/me retorna usuário e função para o frontend montar hasPermission real.
- RF-06: Backend protege cada endpoint por função (proteção por ação).

## Requisitos não funcionais
- Senha armazenada com hash forte (bcrypt/argon2).
- JWT com expiração configurável (reuso do padrão da Onda 4).
- SECRET_KEY com no mínimo 32 bytes em produção.

## Critérios de aceite
- Login com e-mail/senha funciona e rejeita credenciais inválidas.
- Usuário novo é forçado a trocar a senha no primeiro acesso.
- Professor autenticado não consegue executar ações de escrita (API retorna 403).
- Coordenação não consegue criar usuários (403).
- Admin consegue desativar um usuário e o acesso é bloqueado imediatamente.
