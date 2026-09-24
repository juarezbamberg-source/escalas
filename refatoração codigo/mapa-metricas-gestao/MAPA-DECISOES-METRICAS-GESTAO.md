# Mapa: Decisões de Gestão → Métricas → Status no Sistema

**Objetivo**: transformar o sistema Escalas de "registro que funciona" em "ferramenta que influencia decisão". Método: cada métrica só entra no backlog se responder a uma decisão real, com dono e limiar de alerta.

**Como usar**: leve este mapa para a conversa com a gestão. Pergunte primeiro quais decisões eles realmente tomam todo mês/semestre — o que não sair dessa conversa não vira feature. O que sair, vira escopo da próxima onda.

---

## Legenda de status

- ✅ **Já existe** — o sistema calcula e exibe hoje.
- 🟡 **Dados existem, métrica não** — dá para calcular com o que já está no banco; falta endpoint/visual.
- 🔴 **Falta dado** — exigiria registrar informação nova (migração + captura no fluxo).

---

## Bloco A — Equilíbrio de carga (decisão: para quem dar a próxima alocação)

| # | Decisão que a métrica serve | Métrica proposta | Limiar de alerta (sugestão) | Status |
|---|---|---|---|---|
| A1 | "Posso alocar mais no professor X?" | % do limite anual consumido (horas realizadas + prevista ÷ limite configurável) | 🟡 >75% · 🔴 >90% | 🟡 Dados existem (carga realizada/prevista, `limite_anual_carga_horas` configurável) — falta cruzar e exibir |
| A2 | "A carga está concentrada ou distribuída?" | Distribuição: quantos professores concentram X% da carga total (ex.: top 3 = 40%?) | top N > 35% da carga | 🟡 Dados existem (carga por professor) — falta índice de concentração |
| A3 | "Tem gente ociosa enquanto outros estouram?" | Professores ativos com carga prevista zero no semestre | qualquer professor ativo com 0 | 🟡 Dados existem (carga prevista + professor.ativo) |
| A4 | "Vale renegociar contratação?" | Carga por tipo de contratação (CLT/PF/PJ) vs. horas extras pagas a substitutos | PJ+substituto > 20% do total | 🟡 Dados existem (contratação no cadastro, substituições registradas) |

## Bloco B — Qualidade da escala (decisão: a escala está sustentável?)

| # | Decisão | Métrica | Limiar | Status |
|---|---|---|---|---|
| B1 | "A escala está forçada demais?" | Taxa de alocações forçadas no período + tendência (mês a mês) | >10% do total ou crescimento 2 meses seguidos | 🟡 Dado `forcada` + `justificativa_override` já registrados |
| B2 | "Onde está o gargalo?" | Substituições por turma × turno × dia da semana (top ofensoras) | qualquer turma >3 substituições/mês | 🟡 Dados existem (substituto_id, data, turno) |
| B3 | "Precisa de mais contratado?" | Horas de substituto ÷ horas totais por semestre | >15% → argumento para contratação | 🟡 Deriva de B2 |
| B4 | "A grade da turma é o problema?" | Turmas cujo titular nunca consegue cumprir (substituição recorrente na MESMA turma/dia) | ≥2 substituições no mesmo dia/turma/mês | 🟡 Deriva de B2 com agrupamento diferente |

## Bloco C — Cobertura operacional (decisão: o que fica descoberto?)

| # | Decisão | Métrica | Limiar | Status |
|---|---|---|---|---|
| C1 | "Tem horário sem professor?" | Buracos: turma/dia/turno sem alocação dentro do período letivo | qualquer buraco | 🔴 Falta definir calendário letivo (quais dias contam) |
| C2 | "As atribuições estão vigentes?" | Atribuições vencendo nos próximos 30 dias (titular sem renovação) | vencimento <30 dias | 🟡 Dados existem (data_fim das atribuições) |
| C3 | "O substituto está disponível?" | Conflitos de disponibilidade do substituto (quantas vezes o chamado cai em quem já está alocado) | — | 🔴 Falta registrar recusa/indisponibilidade |

## Bloco D — Saúde do processo (decisão: o sistema está sendo usado como deveria?)

| # | Decisão | Métrica | Limiar | Status |
|---|---|---|---|---|
| D1 | "As justificativas retroativas estão sob controle?" | Alocações retroativas com justificativa por mês (tendência) | >5/mês indica processo ruim | 🟡 Dado `justificativa_retroativa` existe |
| D2 | "Quem está desatualizado?" | Usuários inativos, professores desativados com histórico pendente | — | ✅ Onda 9 entrega (aba Inativos) |
| D3 | "A escala foi revisada antes de virar oficial?" | Tempo entre criação e primeira alteração da escala do mês | — | 🔴 Falta registrar evento de auditoria |

---

## O que NÃO recomendo medir agora

- **Volume bruto** (total de alocações, total de horas) — já temos; não muda decisão sozinho.
- **Série temporal diária** — bonito no gráfico, raramente aciona ação; o seletor de período da Onda 11 já cobre comparação entre recortes.
- **Qualquer coisa que exija dado novo de captura manual** (bloco 🔴) antes de validar com a gestão que a decisão correspondente existe — risco de construir captura para métrica que ninguém usa.

## Sugestão de priorização (se a gestão confirmar as decisões)

1. **A1 + A3** (semáforo de limite e ociosos) — maior valor por esforço: só backend + cards no dashboard; dados 100% presentes.
2. **B1 + B2** (forçadas e substituições por turma/turno) — transforma dado que já registramos em diagnóstico; ataca a dor original do sistema.
3. **C2** (atribuições vencendo) — alerta simples, evita surpresa de vigência.
4. Blocos 🔴 (C1, C3, D3) — só depois de confirmar que a decisão existe e vale o custo de captura.

## Formato proposto para exibição

- **Painel de alertas** no topo do dashboard da coordenação: cards vermelhos/amarelos com contagem ("2 professores acima de 90% do limite", "5 alocações forçadas este mês"), clicáveis para o detalhe.
- Métrica sem alerta ativo não aparece — painel limpo significa "nada exige ação", que é a informação mais valiosa de todas.
- Exportação PDF/Excel herdada da Onda 11 com os alertas do período.
