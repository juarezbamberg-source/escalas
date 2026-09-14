# PRD — Onda 8: Privacidade por Função, Gráficos e Polimento

## Objetivo
Garantir que o professor veja somente as próprias informações (dashboard e rotas), enriquecer o dashboard da coordenação com novos gráficos, corrigir a descoberta da reativação de cadastros (UX), permitir edição de cadastros pela tela, paginar listas e exportar a escala.

## Histórias de usuário
- Como professor, quero ver o dashboard somente com as minhas informações (minha carga realizada e prevista).
- Como coordenação/admin, quero continuar vendo o dashboard completo de todos os professores.
- Como professor, quero acessar apenas as telas do meu papel, sem receber dados de outros professores.
- Como coordenação, quero gráficos adicionais (alocações por turno, por turma, substituições) para acompanhar a operação.
- Como usuário, quero ser orientado a reativar um cadastro desativado (mensagem clara + contadores nas abas).
- Como coordenação, quero editar nome/código/dados de professor, UC e turma pela tela.
- Como usuário, quero paginar listas grandes sem perder os filtros.
- Como coordenação, quero exportar a escala por período/turma em PDF e Excel.

## Requisitos funcionais
- RF-01: `GET /professores/carga` restrito por função — professor recebe somente a própria carga; coordenação/admin recebem todos.
- RF-02: Rotas de leitura de negócio (alocações/escala, cadastros) bloqueadas (403) para função professor, exceto as próprias informações.
- RF-03: Dashboard renderiza visão do professor (dados próprios) e visão completa para coordenação/admin.
- RF-04: Novos gráficos no dashboard completo: alocações por turno, por turma e substituições no período.
- RF-05: Mensagem de desativação orienta a reativação via filtro "Inativos".
- RF-06: Contadores nas abas do filtro de status (`Ativos (n) · Inativos (n) · Todos (n)`).
- RF-07: Edição de professor, UC e turma pela tela (formulário preenchido, persistência via PATCH).
- RF-08: Paginação nas listas de cadastros e usuários (backend com skip/limit + frontend).
- RF-09: Exportação da escala por período/turma em PDF e XLSX.

## Fora do escopo
- Recuperação de senha por e-mail (onda futura).
- Rateio de carga prevista (mantém regra da Onda 6).

## Critérios de aceite
- Professor autenticado não consegue obter carga nem escala de outros professores (resposta filtrada ou 403).
- Escritas continuam 403 para professor (regra da Onda 5 preservada).
- Contadores das abas refletem o total real por status.
- Edição persiste via PATCH e atualiza a lista sem recarregar a página.
- Paginação mantém filtro de status e busca ativos.
- Exportação respeita período e turma informados; arquivo baixa com nome legível.
