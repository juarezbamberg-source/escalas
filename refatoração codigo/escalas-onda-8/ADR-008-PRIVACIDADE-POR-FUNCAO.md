# ADR-008 — Privacidade por Função no Dashboard e nas Rotas de Leitura

## Contexto
Desde a Onda 5, as escritas exigem admin/coordenação, mas as leituras são abertas a qualquer usuário autenticado. O professor consegue, hoje, ver o dashboard com a carga de TODOS os professores e consultar a escala completa — dados operacionais que não dizem respeito ao seu papel. O usuário (dono do produto) definiu: professor deve receber o dashboard somente com as próprias informações; dashboard completo exclusivo de coordenação e admin.

## Decisão
1. **Filtrar no backend, não esconder no frontend.** A restrição é aplicada na API (`GET /professores/carga` filtra pelo `professor_id` do usuário; rotas de escala/cadastros retornam 403 para professor). Ocultar só no frontend deixaria os dados acessíveis por chamada direta.
2. **Professor sem vínculo vê lista vazia, não erro.** `Usuario.professor_id` é opcional; ausência de vínculo resulta em resposta vazia (200), evitando falsa impressão de falha.
3. **"Minhas Atribuições" continua sendo a porta do professor.** A escala completa não é negada por bug, é negada por design: o professor consulta suas atribuições e sua carga própria; a visão operacional integral é da coordenação.
4. **Dashboard único com renderização condicional.** Uma página, dois modos: "Meu Dashboard" (professor) e dashboard completo (coordenação/admin) — evita rota duplicada e mantém o menu por função.

## Consequências
- Novos testes garantem que professor não obtém dados de terceiros (nem por query param).
- Coordenação/admin não têm mudança de comportamento.
- Se no futuro surgir papel "visualização", o padrão `require_funcao` + filtro por vínculo se estende a ele.
