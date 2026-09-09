## Context

Ver `proposal.md` para motivacao. O repositorio hoje possui somente o backend FastAPI em funcionamento, com endpoints CRUD e consultas por turno/calendario. Nao existe ainda estrutura de frontend, pipeline Node ou convencoes visuais no projeto, entao esta mudanca precisa introduzir uma base SPA sem quebrar o backend atual.

## Goals / Non-Goals

**Goals:**
- Criar uma base React + Vite + TypeScript no mesmo repositorio, isolada do backend Python.
- Definir uma arquitetura simples de frontend com rotas, camada de API e componentes reutilizaveis.
- Entregar uma experiencia inicial focada no fluxo principal: consultar escala por turno e registrar dados basicos.
- Garantir um visual intencional e responsivo, evitando uma tela vazia ou puramente tecnica.

**Non-Goals:**
- Implementar autenticacao, permissao por perfil ou sessao.
- Introduzir gerenciamento de estado complexo ou SSR.
- Cobrir edicao completa de todos os registros na primeira iteracao.
- Alterar contratos existentes da API backend nesta mudanca.

## Decisions

### 1. Frontend em `frontend/` com Vite, React e TypeScript
Racional: separa claramente o SPA do backend Python e simplifica scripts de desenvolvimento.
Alternativas consideradas:
- Renderizar HTML dentro do FastAPI: mais simples no curtissimo prazo, mas limita a evolucao do produto.
- Misturar arquivos frontend na raiz: aumenta ruído e dificulta manutencao.

### 2. Estrutura por features leves
Racional: organizar em `src/app`, `src/pages`, `src/components`, `src/features`, `src/lib` e `src/styles` mantem o projeto legivel sem introduzir arquitetura pesada cedo demais.
Alternativas consideradas:
- Estrutura totalmente flat: boa para demos pequenas, pior para crescimento.
- Arquitetura enterprise com muitas camadas: excesso de complexidade para o tamanho atual.

### 3. Camada de API centralizada com `fetch`
Racional: o backend atual expõe poucos endpoints e nao exige ainda cache sofisticado; uma camada pequena de cliente HTTP basta para esta fase.
Alternativas consideradas:
- React Query/TanStack Query: interessante para futuro, mas adiciona peso conceitual antes de validar o fluxo base.
- Chamadas espalhadas nos componentes: mais rapido no inicio, porem pior para reuso e tratamento consistente de erros.

### 4. Navegacao inicial centrada em turno
Racional: preserva o modelo mental registrado no ADR 003 e evita que a home vire uma lista genérica de CRUDs sem foco operacional.
Alternativas consideradas:
- Dashboard geral sem foco: mais bonito no papel, menos alinhado ao uso real.
- Comecar pelos cadastros: util, mas nao atende o fluxo principal de consulta da escala.

### 5. Semaforo visual com mapa fixo de estados
Racional: usar um mapa local para `VERDE`, `VERMELHO`, `AMARELO` e `ROXO` garante consistencia entre legenda, cards e calendario.
Alternativas consideradas:
- Calcular cor no frontend a partir das regras: duplicaria logica de negocio desnecessariamente.
- Exibir apenas texto do status: reduz legibilidade.

## Risks / Trade-offs

- [Dois servidores locais] -> Mitigar com scripts claros para subir backend e frontend separadamente.
- [Sem cliente de cache] -> Mitigar com componentes simples e pontos de refresh explicitos apos cadastros/alocacoes.
- [API ainda sem CORS/config detalhada] -> Mitigar prevendo configuracao local caso o frontend rode em porta separada.
- [Escopo visual crescer rapido] -> Mitigar entregando primeiro shell, consulta por turno e formularios minimos antes de iterar no refinamento.

## Migration Plan

1. Criar o app React em `frontend/` com Vite e TypeScript.
2. Adicionar configuracao de ambiente para URL base da API.
3. Implementar shell, pagina inicial e modulos de consulta/cadastro.
4. Validar localmente com backend FastAPI rodando em paralelo.
5. Documentar como iniciar os dois lados do sistema.

## Open Questions

- A interface inicial deve ficar toda em uma unica pagina operacional ou em paginas separadas por modulo. Assumicao desta mudanca: paginas separadas com navegacao simples, para reduzir acoplamento inicial.
