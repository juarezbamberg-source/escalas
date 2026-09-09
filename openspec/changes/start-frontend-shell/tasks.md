## 1. Bootstrap do frontend

- [x] 1.1 Criar o projeto `frontend/` com React, Vite e TypeScript e verificar que `npm run build` conclui sem erro
- [x] 1.2 Configurar variavel de ambiente para URL da API e verificar que o cliente HTTP consegue montar URLs para `/health` e `/alocacoes`
- [x] 1.3 Definir base visual global com tipografia, paleta, layout responsivo e verificar que a home renderiza sem tela em branco

## 2. Shell e navegacao

- [x] 2.1 Implementar shell da aplicacao com cabecalho, menu principal e area de conteudo e verificar navegacao entre modulos sem recarregar a pagina
- [x] 2.2 Criar uma pagina inicial orientada ao fluxo por turno e verificar que ela apresenta acessos para escala e cadastros
- [x] 2.3 Implementar estado global leve para feedback de carregamento e erro de API e verificar exibicao visivel quando a API estiver indisponivel

## 3. Consulta da escala

- [x] 3.1 Implementar filtro de turno com `manha`, `tarde` e `noite` e verificar consulta ao endpoint `GET /alocacoes`
- [x] 3.2 Renderizar grade cronologica da escala com data, turma, titular, substituto e override e verificar atualizacao ao trocar de turno
- [x] 3.3 Implementar visao de calendario usando `GET /alocacoes/calendario` e verificar exibicao de legenda e status `VERDE`, `VERMELHO`, `AMARELO` e `ROXO`
- [x] 3.4 Implementar estados de carregamento e vazio na consulta de escala e verificar comportamento com respostas lentas e listas vazias

## 4. Cadastros e alocacoes

- [x] 4.1 Implementar formulario de professores e verificar criacao e atualizacao visual da lista
- [x] 4.2 Implementar formulario de UCs e turmas e verificar que dependencias basicas aparecem para criar uma alocacao
- [x] 4.3 Implementar formulario de alocacao com override opcional e verificar envio de justificativa quando override estiver ativo
- [x] 4.4 Exibir mensagens exatas de erro retornadas pela API nos formularios e verificar com resposta de duplicidade e justificativa invalida

## 5. Qualidade e documentacao

- [x] 5.1 Adicionar testes de interface para navegacao e consulta principal e verificar a execucao automatizada no frontend
- [x] 5.2 Adicionar testes para estados de erro e exibicao do semaforo visual e verificar cobertura dos cenarios essenciais
- [x] 5.3 Documentar no README como instalar e iniciar backend e frontend juntos e verificar o fluxo local descrito
