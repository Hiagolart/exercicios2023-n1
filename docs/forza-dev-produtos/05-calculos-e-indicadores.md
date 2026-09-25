# 05 — Cálculos e indicadores

## 1. Percentual de avanço do projeto

```
% avanço = Σ peso(etapas Concluídas) / Σ peso(etapas aplicáveis) × 100
```

- **Etapas aplicáveis** = todas, exceto "Cancelado" por decisão de não aplicabilidade (ou "Não aplicável", se aprovado em PD-001).
- Peso padrão = 1 para todas as 21 etapas (cada etapa ≈ 4,76%). Estrutura já preparada para pesos diferentes via `etapas_modelo.peso` (e sobrescrita por projeto, se necessário).
- Etapa reaberta deixa de contar como concluída até ser concluída novamente.
- Projeto **Encerrado** mantém o % no momento do encerramento (congelado) e sai dos indicadores ativos.

**Avanço por fase** (barra de fases no dashboard e no projeto): mesmo cálculo restrito às etapas da fase.

## 2. Atraso

Para cada etapa não concluída e aplicável:
```
dias_atraso_etapa = max(0, hoje − data_prevista)
```
Para etapa concluída: `atraso_conclusao = max(0, data_real_conclusao − data_prevista)` (histórico, não entra no KPI "atrasados").

- **Projeto atrasado** = existe ≥1 etapa aplicável, não concluída, com `data_prevista < hoje` **ou** `data_prevista_lancamento < hoje` sem lançamento.
- **Dias de atraso do projeto** (coluna da tabela principal) = maior `dias_atraso_etapa` entre as etapas abertas.
- **Desvio de baseline** (informativo): `data_prevista − data_prevista_baseline` — mostra quanto o prazo foi replanejado.

## 3. Etapa atual e fase atual

- **Etapa atual** = etapa aplicável de **menor número** que não está Concluída.
- **Fase atual** = fase da etapa atual.
- **Etapas em andamento** = todas com status Em andamento / Aguardando terceiro / Em validação / Bloqueado (pode haver mais de uma por causa do paralelismo).
- **Principal pendência** (tabela principal) = campo `pendencia` da etapa atual; se vazio, a pendência da etapa bloqueada ou atrasada mais antiga.
- **Status exibido do projeto** = status da etapa atual, exceto quando a situação do projeto é Pausado/Encerrado/Concluído (prevalece a situação).

## 4. Classificação para os cards do dashboard [PROPOSTA — validar PD-002]

Cada projeto **ativo** entra em um único card de "estágio" (mutuamente exclusivos), mais os cards de alerta (que se sobrepõem).

| Card | Regra |
|------|-------|
| Total de projetos | Todos (com filtro de situação) |
| Em desenvolvimento | Situação Ativo e etapa 20 não concluída |
| Em pesquisa | Etapa atual ∈ {01, 02, 03} |
| Em cotação | Etapa atual ∈ {04, 05} |
| Em análise de viabilidade [PROPOSTA — novo card] | Etapa atual ∈ {06, 07} |
| Em auditoria / pedido de amostra [PROPOSTA] | Etapa atual ∈ {08, 09} |
| Em produção de amostra | Etapa atual = 10 |
| Em validação | Etapa atual = 11 |
| Homologados | Etapa 12 concluída **e** etapa atual ∈ fase 3 ainda não iniciada (ou decidir: todos com 12 concluída — ver PD-002) |
| Em preparação para lançamento | Etapa atual ∈ {13…19} |
| Lançados | Etapa 20 concluída |
| **Alerta:** Aguardando fornecedor | ∃ etapa com status Aguardando terceiro e `tipo_terceiro = Fornecedor` |
| **Alerta:** Atrasados | Regra §2 |
| **Alerta:** Bloqueados | ∃ etapa com status Bloqueado |

Todo card é clicável e abre a lista de projetos com o filtro correspondente.

## 5. Matriz técnica — sugestão automática de resultado

Para cada requisito × cotação, com `v` = valor informado e `a` = valor-alvo:

| Critério | Atende | Superior | Não atende |
|----------|--------|----------|------------|
| MIN (≥) | a − tolerância ≤ v ≤ a + margem_superior | v > a + margem_superior | v < a − tolerância |
| MAX (≤) | a − margem_superior ≤ v ≤ a + tolerância | v < a − margem_superior | v > a + tolerância |
| EXATO | \|v − a\| ≤ tolerância | — | fora da tolerância |
| FAIXA | a ≤ v ≤ a_max | — | fora |
| LISTA / TEXTO | sem sugestão automática → **Pendente** para avaliação manual | | |

- `margem_superior` (a partir de quanto é "Superior" e não apenas "Atende") é parâmetro por atributo — [A DEFINIR]; enquanto não definido, vale 0 (qualquer valor melhor que o alvo = Superior).
- Valor vazio ⇒ **Não informado**. Sem conclusão possível ⇒ **Pendente**.
- O resultado sugerido é apenas sugestão; o **resultado final** é confirmado pela Engenharia. Divergência entre sugerido e final exige observação.
- **Resumo por fornecedor:** % de requisitos obrigatórios atendidos (Atende + Superior), nº de "Não atende" obrigatórios, nº de pendências. Fornecedor com "Não atende" em requisito obrigatório recebe destaque vermelho.

## 6. Equivalência de concorrentes — sugestão

Aplica-se apenas a modelos da **mesma categoria** (RN-092). Usa os atributos com `critico_equivalencia = S` da categoria.

```
Para cada atributo crítico:
  dentro   → valor do concorrente dentro da tolerância do valor Forza
  fora     → fora da tolerância
  sem dado → concorrente ou Forza sem informação

Sugestão:
  Equivalente               → todos os críticos "dentro"
  Parcialmente equivalente  → capacidade nominal "dentro" e ≥1 crítico "fora" ou "sem dado"
  Não equivalente           → capacidade nominal "fora" ou tipo de energia diferente
                              ou nº de críticos "fora" acima do limite [A DEFINIR]
```

- Tolerâncias por atributo e limites: **[A DEFINIR]** com Engenharia/Comercial (PD-004). Nenhum valor será assumido.
- A classificação final é **manual** (com justificativa); a sugestão ajuda e mostra quais atributos diferem.

## 7. Nacionalização (produto Forza e concorrente)

Estrutura do cálculo — **a fórmula tributária exata deve ser validada pelo Comex** (PD-007). O sistema não assume alíquotas.

```
Entradas (oficiais ou do cenário):
  FOB_USD_unit           (da cotação; nunca alterado)
  Q = qtd por contêiner
  Câmbio (valor, data, fonte)
  Itens de custo: cada um com moeda (USD/BRL) e base (por contêiner | por unidade | % sobre base)

Passos:
  1. Itens por contêiner  → rateio: valor / Q
  2. Itens em USD         → × câmbio
  3. Base aduaneira unit. (BRL) = (FOB_USD_unit + frete_int_unit_USD + seguro_unit_USD) × câmbio
  4. Impostos/taxas       → conforme parâmetros do NCM (bases de cálculo configuráveis por item)
  5. Custo nacionalizado unit. (BRL) = base aduaneira + impostos + taxas + despesas portuárias
                                       + despesas de importação + transporte nacional
                                       + acessórios + peças + outros (todos unitários)
Saídas exibidas lado a lado (nunca somadas):
  FOB unitário ........ USD
  Custo nacionalizado . BRL / unidade
  Composição (%) por grupo de custo
```

- Sensibilidade exibida: impacto no custo unitário de ±X% de câmbio e de ±1 unidade por contêiner (valores apenas calculados, sem alterar oficial).

## 8. Comparação de mercado (tela de Precificação)

Conjunto de preços considerado: `precos_concorrentes` dos modelos vinculados ao projeto, com **equivalência final = Equivalente** (+ Parcial, se o filtro estiver ligado), **mesmo tipo de preço** (padrão: Anunciado), **mesmas condições de impostos**, não desatualizados (RN-014) — cada filtro visível na tela. Se houver várias consultas do mesmo modelo, usa a **mais recente**.

| Indicador | Cálculo |
|-----------|---------|
| Menor preço encontrado | mín(preços) — com modelo, concorrente, data e fonte |
| Média de mercado | média aritmética (exibir também nº de amostras "n") |
| Maior preço encontrado | máx(preços) — com referência |
| Preço projetado Forza | preço de venda estimado vigente (viabilidade) ou do cenário selecionado |
| Diferença % para a média | (Preço Forza − Média) / Média × 100 |
| Posicionamento na faixa | (Preço Forza − Mín) / (Máx − Mín) × 100 → Abaixo da faixa (<0) / Faixa inferior (0–33) / Faixa média (33–66) / Faixa superior (66–100) / Acima da faixa (>100) [limites PROPOSTA] |

- Com **n < 3** preços, mostrar alerta "amostra de mercado insuficiente" [PROPOSTA].
- Preço Forza e preços de concorrentes devem estar na **mesma base** (com/sem impostos). Se a base divergir, a comparação é bloqueada com aviso.
- Tabela de apoio: configuração entregue, acessórios inclusos, garantia e diferenças técnicas de cada concorrente considerado.

## 9. Viabilidade econômica

| Indicador | Cálculo |
|-----------|---------|
| Margem bruta estimada (%) | (Preço de venda estimado líquido − Custo nacionalizado) / Preço de venda estimado líquido × 100 |
| Preço sugerido pela margem desejada | Custo nacionalizado / (1 − margem desejada) |
| Payback do investimento [PROPOSTA] | Investimento necessário / (margem unitária × demanda anual) |

- "Preço líquido" (dedução de impostos sobre venda, comissões, frete de venda etc.): **[A DEFINIR]** com Financeiro/Comercial (PD-008). Até lá, o sistema mostra claramente qual base foi usada.

## 10. Checklist de lançamento (etapa 20)

| Item | Verde quando |
|------|--------------|
| Produto | Etapa 19 concluída; NCs do lote resolvidas ou aceitas |
| Documentação | Todos os documentos obrigatórios da categoria com status Aprovado |
| Peças | Etapa 14 concluída; peças críticas com disponibilidade = Disponível |
| Treinamento | Etapa 16 concluída (PV + Comercial) |
| Preço | Preço de venda aprovado registrado no projeto |
| Suporte | Pós-Vendas marcou "apto a atender" [PROPOSTA] |

## 11. Indicadores pós-lançamento

- Nº de ocorrências por tipo e severidade; ocorrências abertas; tempo médio de resolução.
- Taxa de falhas = ocorrências de falha / unidades vendidas [requer dado de vendas — integração futura, PD-011].
- Custo de garantia acumulado (BRL).
