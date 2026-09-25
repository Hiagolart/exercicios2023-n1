# 02 — Processo e etapas

## 1. Visão geral: 5 fases, 21 etapas

```
FASE 1  Pesquisa e viabilidade ........ etapas 01–07
FASE 2  Amostra e homologação ......... etapas 08–12   ◆ marco: PRODUTO HOMOLOGADO (12)
FASE 3  Preparação para venda ......... etapas 13–17
FASE 4  Primeiro lote e lançamento .... etapas 18–20   ◆ marco: PRODUTO LANÇADO (20)
FASE 5  Pós-lançamento ................ etapa  21
```

### 1.1 Tabela-resumo

Responsável e aprovador são **[PROPOSTA]** — validar com a Forza (PD-003).

| # | Etapa | Fase | Área responsável | Aprovador | Pode iniciar quando (gate de início) | Entrega / evidência mínima para concluir | Tabelas principais | Aba |
|---|-------|------|------------------|-----------|--------------------------------------|------------------------------------------|--------------------|-----|
| 01 | Pesquisa de mercado | 1 | Comercial + P&D | P&D | Projeto criado | Resumo da oportunidade preenchido + ≥1 concorrente com preço (data+fonte) **ou** justificativa de ausência | `projetos`, `pesquisa_mercado`*, `concorrentes`, `modelos_maquinas`, `precos_concorrentes` | Visão geral / Concorrentes |
| 02 | Definição dos requisitos técnicos | 1 | P&D + Engenharia | Engenharia + Comercial | Categoria definida | Versão de requisitos **aprovada** (todos os atributos obrigatórios da categoria preenchidos) | `requisitos_versao`*, `requisitos_projeto`*, `modelo_acessorios` | Requisitos técnicos |
| 03 | Pesquisa de fornecedores | 1 | P&D + Comex | P&D | Projeto criado (paralela a 01–02) | ≥1 fornecedor com status "Apto a cotar" vinculado ao projeto | `fornecedores`, `projeto_fornecedores`* | Fornecedores |
| 04 | Orçamento com fornecedores | 1 | Comex | P&D | Etapa 02 com versão aprovada **e** etapa 03 com fornecedor apto | ≥1 cotação recebida, vinculada à versão de requisitos, com FOB USD, validade e anexo da proposta | `cotacoes`, `cotacao_itens`* | Cotações |
| 05 | Análise técnica das cotações | 1 | Engenharia | P&D | ≥1 cotação recebida | Matriz técnica completa (nenhuma linha obrigatória "pendente" sem justificativa) + fornecedor(es) recomendado(s) | `analise_tecnica`, `especificacoes_modelo` | Comparação técnica |
| 06 | Cálculo de nacionalização | 1 | Comex | Comex (gestor) | ≥1 cotação analisada | Nacionalização **oficial** aprovada para a cotação recomendada | `nacionalizacao`, `nacionalizacao_itens`*, `cenarios_nacionalizacao` | Nacionalização / Precificação |
| 07 | Análise de viabilidade econômica | 1 | P&D + Comercial | **Diretoria** | Etapas 01, 05 e 06 concluídas | Decisão registrada: Avançar / Revisar / Encerrar, com responsável, data e observação | `viabilidade`* | Viabilidade |
| 08 | Auditoria do fornecedor | 2 | Qualidade/Engenharia | P&D | Viabilidade = Avançar | Relatório de auditoria anexado **ou** dispensa justificada (fornecedor já homologado) | `auditorias_fornecedor`* | Fornecedores |
| 09 | Pedido de amostra — Comex | 2 | Comex | P&D | Etapa 08 concluída **e** especificação da amostra aprovada | Pedido registrado com PO/proforma anexada | `amostras` | Amostra |
| 10 | Produção da amostra | 2 | Comex (acompanha) + P&D | P&D | Etapa 09 concluída | Amostra embarcada/entregue + registros de produção (fotos/vídeos, alterações, testes de fábrica) | `amostras`, `amostra_alteracoes`* | Amostra |
| 11 | Recebimento e validação da amostra | 2 | Engenharia (+ Pós-Vendas) | P&D | Amostra recebida | Todos os testes obrigatórios executados + resultado final da amostra | `testes_amostra`, `nao_conformidades`* | Testes |
| 12 | Definição final do produto e fornecedor | 2 | P&D | **Diretoria** | Amostra "Aprovada" ou "Aprovada com ressalvas" (ressalvas com plano) | Configuração homologada congelada e aprovada | `configuracao_homologada`*, `configuracao_itens`* | Homologação |
| 13 | Criação de SKU e relatório técnico | 3 | Engenharia / Cadastro | P&D | Etapa 12 concluída | SKU definitivo cadastrado + relatório técnico anexado | `projetos` (sku), `documentos` | Homologação / Documentação |
| 14 | Lista inicial de peças | 3 | Pós-Vendas | Pós-Vendas (gestor) | Etapa 12 concluída | Lista com peças críticas e de desgaste (código, qtd. sugerida, fornecedor) | `pecas_iniciais` | Peças |
| 15 | Manuais, catálogo de peças e manutenção | 3 | Engenharia + Pós-Vendas | Pós-Vendas | Etapa 12 concluída | Todos os documentos obrigatórios em status "Aprovado" | `documentos` | Documentação |
| 16 | Treinamentos | 3 | Pós-Vendas + P&D | Pós-Vendas | Etapa 15 com manual de operação aprovado [PROPOSTA] | Treinamentos de Pós-Vendas **e** Comercial realizados com lista de presença | `treinamentos`, `treinamento_participantes`* | Treinamentos |
| 17 | Integração com Marketing | 3 | Marketing | P&D | Etapa 12 concluída | Pacote de informações validadas liberado (ficha, fotos aprovadas, diferenciais) | `liberacoes_marketing`* | Documentação |
| 18 | Pedido do primeiro lote — Comex | 4 | Comex | P&D + Diretoria | Etapa 12 concluída (pode ser paralela à fase 3) | Pedido emitido referenciando a configuração homologada (PO anexada) | `primeiro_lote` | Primeiro lote |
| 19 | Recebimento do primeiro lote | 4 | Qualidade/Engenharia | P&D | Lote recebido | Conferência lote × configuração homologada 100% preenchida; não conformidades tratadas ou aceitas | `primeiro_lote`, `conferencia_lote`* | Primeiro lote |
| 20 | Lançamento comercial | 4 | Comercial | **Diretoria** | Checklist de lançamento 100% verde (ver RN-080) | Data oficial de lançamento + comunicado | `projetos`, `checklist_lancamento` (calculado) | Visão geral |
| 21 | Acompanhamento pós-lançamento | 5 | Pós-Vendas | P&D | Etapa 20 concluída | Período de acompanhamento encerrado + relatório de pós-lançamento | `pos_lancamento` | Pós-lançamento |

\* Tabela adicional proposta além da lista inicial — justificativa na doc 04.

### 1.2 Paralelismo permitido

- **03** pode ocorrer em paralelo com **01** e **02**.
- **06** pode começar assim que houver uma cotação analisada, mesmo que **05** siga para outros fornecedores.
- **13, 14, 15, 17** podem ocorrer em paralelo após a **12**. **16** depende da documentação mínima.
- **18** pode ser emitido em paralelo à fase 3 (prazo de fabricação longo), mas **20** exige a fase 3 concluída.

Por isso o sistema trabalha com **etapa atual** (a primeira etapa aplicável não concluída, ver doc 05 §3) **e** com a lista de **etapas em andamento**.

### 1.3 Ciclos de retorno (loops)

| Situação | Retorno |
|----------|---------|
| Viabilidade = **Revisar** | Reabre etapas indicadas na decisão (ex.: 04, 05, 06). Etapa 07 volta para "Em andamento". |
| Viabilidade = **Encerrar** | Projeto passa para situação **Encerrado**; etapas abertas ficam "Cancelado". |
| Amostra = **Reprovada** | Decisão: nova amostra com o mesmo fornecedor (volta à 09) ou troca de fornecedor (volta à 04/05). |
| Amostra = **Necessita nova amostra** | Cria nova amostra (nº sequencial) e reabre 09–11. Histórico da amostra anterior é mantido. |
| Primeiro lote **não conforme** | Registra não conformidades; lançamento bloqueado até tratativa ou aceite formal. |
| Mudança técnica após homologação | Exige **solicitação de alteração** que gera nova versão da configuração homologada (RN-061). |

Reabrir uma etapa concluída exige justificativa e gera histórico.

---

## 2. Detalhamento por etapa

Formato: **Objetivo · Registros · Regras · Entrega/Evidência · Impacto em indicadores**.

### FASE 1 — PESQUISA E VIABILIDADE

#### Etapa 01 — Pesquisa de mercado
- **Objetivo:** confirmar a oportunidade.
- **Registros (resumo da oportunidade — `pesquisa_mercado`):** aplicação da máquina; segmento(s); clientes potenciais; demanda estimada (quantidade/ano + premissa + fonte); faixa de preço observada (derivada de `precos_concorrentes`, não digitada); principais diferenciais encontrados; conclusão.
- **Concorrentes:** vincula modelos da **base histórica de concorrentes** ao projeto (reuso — não recadastrar). Se o modelo não existir, cadastra-se na base (fica disponível para outros projetos).
- **Regras:** RN-010 a RN-014 (preço com data e fonte; demanda com premissa).
- **Entrega:** resumo da oportunidade concluído.
- **Indicadores:** alimenta "projetos em pesquisa" e a faixa de preço de mercado.

#### Etapa 02 — Definição dos requisitos técnicos
- **Objetivo:** definir o que o produto Forza precisa atender.
- **Registros:** para cada atributo aplicável à categoria: valor-alvo, critério (mínimo / máximo / exato / faixa / lista / texto), tolerância, prioridade (obrigatório / desejável), fonte/justificativa. Acessórios requeridos ou opcionais (somente os compatíveis com a categoria/modelo).
- **Versionamento:** requisitos são salvos em **versões** (v1, v2…). Só uma versão fica "Aprovada/vigente". Cotações ficam amarradas à versão usada no pedido.
- **Ficha do modelo Forza:** o projeto cria um registro em `modelos_maquinas` com `origem = FORZA`. A ficha (modelo, categoria, capacidade, mastro, bateria, motor, controladora, dimensões, peso, itens principais, diferenciais) é **a mesma estrutura** de atributos — não há ficha paralela.
- **Regras:** RN-020 a RN-025.
- **Entrega:** versão aprovada.

#### Etapa 03 — Pesquisa de fornecedores
- **Registros:** cadastro geral do fornecedor (reutilizável entre projetos) + vínculo com o projeto (status no projeto: Identificado → Contatado → Apto a cotar → Descartado, com motivo).
- **Campos do fornecedor:** nome, país, contato(s), linha de produtos, capacidade produtiva, experiência, histórico com a Forza, status de homologação, auditoria (última data/resultado), suporte técnico, disponibilidade de peças.
- **Entrega:** lista de fornecedores aptos a receber cotação.

#### Etapa 04 — Orçamento com fornecedores
- **Registros:** fornecedor; modelo do fornecedor (vira `modelos_maquinas` com `origem = FORNECEDOR`); versão de requisitos enviada; FOB USD; opcionais e acessórios (cada um com preço USD, incluso ou não); prazo de fabricação; prazo de entrega; garantia; quantidade por contêiner (e tipo de contêiner); peças (kit/lista e preço); condições de amostra (preço, prazo, abatimento); validade da proposta; observações; anexo da proposta.
- **Regras:** RN-030 a RN-034 (FOB em USD, mesma configuração, validade).
- **Status da cotação:** Solicitada → Recebida → Em análise → Recomendada / Descartada / Vencida.

#### Etapa 05 — Análise técnica das cotações
- **Registros:** para cada requisito × cotação: valor informado, resultado (Atende / Não atende / Superior / Pendente / Não informado), divergência, observação. Sugestão automática para atributos numéricos (doc 05 §5); resultado final é confirmado por Engenharia.
- **Entrega:** matriz técnica dos fornecedores + recomendação.

#### Etapa 06 — Cálculo de nacionalização
- **Registros:** nacionalização oficial (premissas, itens de custo, câmbio com data e fonte) e cenários de simulação. Também permite nacionalização estimada de **concorrentes** quando houver dados (mesma estrutura, `alvo = CONCORRENTE`).
- **Regras:** RN-040 a RN-047.
- **Entrega:** nacionalização oficial aprovada da cotação recomendada.

#### Etapa 07 — Análise de viabilidade econômica
- **Registros:** custo nacionalizado (puxado da oficial), preço de venda estimado, margem (calculada), posicionamento de mercado (puxado da comparação), demanda (puxada da etapa 01), riscos (lista com probabilidade/impacto), investimento necessário (amostra, homologação, documentação, ferramental, estoque inicial…), parecer.
- **Decisão:** Avançar / Revisar / Encerrar + responsável + data + observação (obrigatórios).
- **Regras:** RN-050 a RN-053.

### FASE 2 — AMOSTRA E HOMOLOGAÇÃO

#### Etapa 08 — Auditoria do fornecedor
- **Registros:** tipo (presencial / remota / documental), data, auditor, itens avaliados (fábrica, processo produtivo, controle de qualidade, rastreabilidade, testes, fornecedores de componentes) com nota/conceito, resultado (Aprovado / Aprovado com ações / Reprovado), plano de ação.
- **Fornecedor já homologado:** campo "Nova auditoria necessária?" (Sim/Não) + justificativa. Se "Não", a etapa é concluída com a justificativa como evidência.

#### Etapa 09 — Pedido de amostra — Comex
- **Confirma:** modelo, configuração (referência à versão de requisitos + cotação), preço (USD), prazo, documentos, forma de pagamento, transporte, opcionais.
- **Gate:** RN-055 — só com viabilidade "Avançar", auditoria concluída/dispensada e especificação aprovada.

#### Etapa 10 — Produção da amostra
- **Registros:** data de início, previsão, datas reais, fotos, vídeos, componentes (marca/modelo de motor, controlador, bateria…), **alterações** (cada alteração é um registro com o que mudou, motivo, quem aprovou), testes de fábrica.
- **Regra:** RN-057 — toda alteração de configuração é registrada e gera histórico.

#### Etapa 11 — Recebimento e validação da amostra
- **Plano de testes:** funcionamento, desempenho, segurança, acabamento, manutenção, componentes, conformidade técnica (itens do plano podem vir dos requisitos: cada requisito obrigatório vira um item de teste).
- **Registros por teste:** método, valor esperado, valor medido, resultado, executor, data, evidência.
- **Falhas:** registradas como não conformidades (severidade, correção necessária, responsável, prazo, status).
- **Resultado:** Aprovada / Aprovada com ressalvas / Reprovada / Necessita nova amostra.

#### Etapa 12 — Definição final do produto e fornecedor
- **Congela:** fornecedor, modelo do fornecedor, configuração final, acessórios, componentes, especificações, correções pós-amostra.
- **Efeito:** projeto recebe o marco **Homologado**; a configuração passa a ser somente leitura (alterações só via solicitação de alteração — RN-061).

### FASE 3 — PREPARAÇÃO PARA VENDA

#### Etapa 13 — Criação de SKU e relatório técnico
- SKU definitivo só pode ser informado após a etapa 12 (RN-070). Antes disso, usa-se apenas o código do projeto.
- Relatório técnico = documento tipo "Relatório técnico" em `documentos`.

#### Etapa 14 — Lista inicial de peças
- **Registros:** código Forza, código do fornecedor, descrição, classificação (crítica / desgaste / reposição comum), quantidade sugerida para estoque inicial, preço (USD/BRL identificado), fornecedor, disponibilidade, lead time.

#### Etapa 15 — Manuais, catálogo de peças e manutenção
- **Documentos controlados:** manual de operação, manual de manutenção/serviço, diagramas (elétrico/hidráulico), catálogo de peças, plano de manutenção, termo/política de garantia, ficha técnica.
- **Cada documento:** tipo, idioma, versão, status (Em elaboração / Em revisão / Aprovado / Obsoleto), responsável, aprovador, arquivo.
- Documentos obrigatórios por categoria são parametrizáveis.

#### Etapa 16 — Treinamentos
- **Registros:** público (Pós-Vendas / Comercial / Rede / Cliente), tema, instrutor, data, carga horária, participantes, material, lista de presença (evidência), avaliação.
- **Gate de conclusão:** ≥1 treinamento Pós-Vendas e ≥1 Comercial realizados.

#### Etapa 17 — Integração com Marketing
- Pacote liberado apenas com dados **da configuração homologada** e documentos aprovados (RN-075). Registro do que foi liberado, quando e por quem.

### FASE 4 — PRIMEIRO LOTE E LANÇAMENTO

#### Etapa 18 — Pedido do primeiro lote — Comex
- **Registros:** nº do pedido, quantidade, FOB USD unitário e total, configuração homologada referenciada (versão), prazos, pagamento, anexos. Divergência entre pedido e configuração homologada bloqueia a conclusão (RN-078).

#### Etapa 19 — Recebimento do primeiro lote
- **Conferência:** para cada item da configuração homologada (especificações, componentes, acessórios, acabamento, documentação que acompanha), registrar: valor esperado (homologado), valor encontrado no lote, conforme / não conforme, evidência. Amostragem (quantas unidades conferidas) registrada.
- **Regra:** RN-079 — amostra aprovada não garante lote correto; conferência é obrigatória.

#### Etapa 20 — Lançamento comercial
- **Checklist automático:** produto (lote conforme), documentação (obrigatórios aprovados), peças (lista concluída + disponibilidade), treinamento (PV e Comercial), preço (preço de venda aprovado), suporte (Pós-Vendas apto). Ver RN-080.
- **Registro:** data oficial de lançamento, responsável, comunicado.

### FASE 5 — PÓS-LANÇAMENTO

#### Etapa 21 — Acompanhamento pós-lançamento
- **Ocorrências:** tipo (falha, garantia, retorno de cliente, assistência, melhoria), data, cliente/região, nº de série, componente/peça, descrição, severidade, causa, ação, responsável, status, custo (quando houver), anexos.
- **Período de acompanhamento:** [A DEFINIR] (ex.: 6 ou 12 meses após o lançamento — PD-010). Etapa concluída com relatório de fechamento.
- Melhorias aprovadas geram **solicitação de alteração** na configuração homologada (nova versão), mantendo rastreabilidade.
