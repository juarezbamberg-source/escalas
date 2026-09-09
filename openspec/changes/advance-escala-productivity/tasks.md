## 1. Explicabilidade Imediata

- [x] 1.1 Derivar uma estrutura reutilizavel de motivos operacionais por item da escala e verificar que grade, drill-down e drawer leem os mesmos sinais base
- [x] 1.2 Exibir resumo e detalhe local dos motivos na grade e no drill-down, e verificar em `frontend/src/pages/EscalaPage.test.tsx` que o usuario entende por que o item entrou em alerta
- [x] 1.3 Reforcar a separacao visual entre professor titular e substituto nas celulas principais, e verificar leitura distinta dos papeis na tabela e no drill-down

## 2. Hierarquia de Acoes

- [x] 2.1 Rebaixar `Remover` e demais acoes menos frequentes para camada secundaria ou overflow, e verificar que a acao principal continua evidente por contexto operacional
- [x] 2.2 Associar a acao principal aos sinais exibidos na mesma linha, e verificar que o usuario consegue relacionar prioridade de acao e motivo do alerta

## 3. Produtividade da Workbench

- [x] 3.1 Introduzir a base de um modo mais compacto para grade e calendario, e verificar leitura melhor em recortes com maior volume sem perder badges e acoes
- [x] 3.2 Preparar retomada rapida do contexto recente de consulta, e verificar preservacao de filtros e modo de leitura em navegacao local
- [x] 3.3 Registrar no frontend e na documentacao o backlog priorizado de aceleradores operacionais seguintes, e verificar clareza do roadmap para a proxima aplicacao

## 4. Qualidade

- [x] 4.1 Cobrir tooltip, detalhe local de motivos e hierarquia de acoes com testes de interface, e verificar com `cd frontend && npm run test -- --run`
- [x] 4.2 Validar a integracao final da workbench com `cd frontend && npm run build`, confirmando que a nova camada de explicabilidade nao quebrou a tela
