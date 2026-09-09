## Purpose

Permitir que o operador aplique recortes recorrentes da escala com um clique, reduzindo combinacoes manuais repetidas e acelerando a triagem diaria.

## ADDED Requirements

### Requirement: workbench deve oferecer atalhos recorrentes de triagem
O sistema MUST expor atalhos operacionais predefinidos para recortes frequentes da escala.

#### Scenario: atalho para conflitos
- **WHEN** o usuario aciona um atalho recorrente como conflitos, lacunas ou overrides
- **THEN** o sistema aplica automaticamente a combinacao esperada de filtros e atualiza grade e calendario

### Requirement: atalhos devem manter o recorte visivel
O sistema MUST refletir o uso de atalhos na combinacao visivel de filtros ativos.

#### Scenario: leitura do recorte apos atalho
- **WHEN** um atalho e aplicado
- **THEN** o usuario consegue identificar no resumo do recorte quais filtros passaram a valer
