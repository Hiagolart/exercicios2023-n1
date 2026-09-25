# PBI — Forza Dev Produtos (Gestão de Desenvolvimento de Novos Equipamentos)

> Status do documento: **v0.1 — estrutura funcional em definição** (nenhuma tela ou código implementado).
> Referência de experiência e visual: **Forza Cost Control**.

Este diretório concentra toda a definição funcional do sistema **antes** da implementação.
A ordem de trabalho acordada é: **processo → regras → dados → cálculos → telas → implementação**.

## Índice

| # | Documento | Conteúdo |
|---|-----------|----------|
| 01 | [Visão geral e escopo](01-visao-geral-e-escopo.md) | Objetivo, áreas usuárias, glossário, conceitos centrais, identidade visual e cores de status |
| 02 | [Processo e etapas](02-processo-e-etapas.md) | As 5 fases e 21 etapas: responsável, entradas, entrega, evidência obrigatória, pré-requisitos (gates), tabelas envolvidas |
| 03 | [Regras de negócio](03-regras-de-negocio.md) | Regras numeradas (RN-xxx), com validação sistêmica e efeito no status |
| 04 | [Modelo de dados](04-modelo-de-dados.md) | Tabelas, campos, relacionamentos e diagrama ER |
| 05 | [Cálculos e indicadores](05-calculos-e-indicadores.md) | Progresso, atraso, etapa atual, equivalência, nacionalização, comparação de mercado, viabilidade, KPIs do dashboard |
| 06 | [Telas e navegação](06-telas-e-navegacao.md) | Menu lateral, dashboard, lista de projetos, abas do projeto e regras de visibilidade |
| 07 | [Pendências e decisões](07-pendencias-e-decisoes.md) | Perguntas em aberto, premissas assumidas e registro de decisões |

## Checklist obrigatório para toda nova regra, campo ou funcionalidade

Toda inclusão no PBI deve responder às 7 perguntas abaixo antes de ser aceita.
O modelo está em [07-pendencias-e-decisoes.md](07-pendencias-e-decisoes.md#modelo-para-novas-inclusões).

1. Em qual **etapa** do processo pertence?
2. Em qual **tabela** será armazenada?
3. Já existe **dado semelhante**? (evitar duplicidade)
4. Como será **exibida** ao usuário?
5. Impacta algum **cálculo, indicador ou status**?
6. Qual **área** é responsável pela informação?
7. Qual **evidência** é necessária para considerar a atividade concluída?

## Princípios que guiam todo o PBI

1. **Não inventar dados técnicos ou comerciais.** Todo valor tem origem (fonte) registrada; ausência de dado é exibida como "não informado", nunca preenchida por suposição.
2. **FOB é sempre USD** e nunca é sobrescrito, convertido como indicador principal ou misturado com custo nacionalizado.
3. **Uma única fonte da verdade por dado.** Especificações técnicas usam um catálogo único de atributos por categoria, reaproveitado em requisitos, cotações, concorrentes, amostra e primeiro lote.
4. **Toda conclusão exige evidência.** Etapa sem entrega/evidência não pode ser concluída.
5. **Toda alteração técnica relevante gera histórico.**
6. **Simulação nunca altera dado oficial.**
7. **Mesma experiência do Forza Cost Control**: quem já usa deve reconhecer a navegação.

## Convenções

- Regras de negócio: `RN-001`, `RN-002`…
- Pendências: `PD-001`… | Decisões: `DC-001`…
- Itens marcados com **[PROPOSTA]** são sugestões de estrutura que precisam de validação do negócio.
- Itens marcados com **[A DEFINIR]** dependem de informação que não deve ser inventada (alíquotas, tolerâncias, cores exatas etc.).
