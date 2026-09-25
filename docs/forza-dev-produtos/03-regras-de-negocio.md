# 03 — Regras de negócio

Formato: **ID · Regra · Validação sistêmica · Efeito**.
"Bloqueia" = o sistema impede a ação. "Alerta" = permite, mas sinaliza.

## RN-000 — Regras gerais

| ID | Regra | Validação | Efeito |
|----|-------|-----------|--------|
| RN-001 | Não inventar informações técnicas ou comerciais. Campo sem dado fica vazio e é exibido como **"Não informado"**. | Nenhum campo técnico/comercial recebe valor padrão fictício | Relatórios mostram lacunas explicitamente |
| RN-002 | Todo dado técnico ou comercial relevante permite registrar **fonte** (documento, site, contato, teste, cotação) e, quando aplicável, **data**. | Campos `fonte`, `data_referencia`, `anexo_id` disponíveis nas tabelas de dados | — |
| RN-003 | Toda alteração em dados críticos gera registro em `historico_projeto` (quem, quando, campo, antes, depois, motivo). Dados críticos: requisitos, cotação recomendada, nacionalização oficial, preço de venda, decisão de viabilidade, resultado de amostra, configuração homologada, SKU, datas previstas, responsáveis, status de etapa. | Automático (auditoria) + motivo obrigatório para dados técnicos | Aba Histórico |
| RN-004 | Anexos podem ser vinculados a qualquer entidade (projeto, etapa, cotação, teste, documento, ocorrência…). Tipos: foto, vídeo, PDF, planilha, cotação, relatório, laudo, documento técnico, outro. | — | Aba Anexos consolida todos |
| RN-005 | Nenhum registro com histórico é excluído fisicamente após concluída a etapa; usa-se **inativação/cancelamento** com motivo. | Exclusão física só em rascunho | Rastreabilidade |

## RN-00x — Controle das etapas

| ID | Regra | Validação | Efeito |
|----|-------|-----------|--------|
| RN-006 | Status possíveis da etapa: Não iniciado, Em andamento, Aguardando terceiro, Em validação, Concluído, Bloqueado, Cancelado. **[PROPOSTA]** incluir **Não aplicável** (ver PD-001). | Domínio fixo | Cores padrão (doc 01) |
| RN-007 | Etapa só pode ser **Concluída** com a entrega/evidência mínima definida na doc 02 §1.1. | Bloqueia conclusão sem evidência (anexo marcado como evidência ou registro estruturado exigido) | — |
| RN-008 | Etapa não pode ser iniciada sem o **gate de início** atendido. | Bloqueia mudança para "Em andamento"; mostra o que falta | Reduz retrabalho |
| RN-009 | Status **Aguardando terceiro** exige indicar o terceiro (Fornecedor / Área interna / Cliente / Órgão / Outro) e a pendência. **Bloqueado** exige motivo e responsável pelo desbloqueio. | Campos obrigatórios condicionais | Alimenta KPIs "Aguardando fornecedor" e "Bloqueados" |
| RN-009a | Data prevista é obrigatória para etapas "Em andamento" ou posteriores. Alteração de data prevista exige motivo (histórico). A **data prevista original (baseline)** é preservada. | — | Permite medir replanejamento |
| RN-009b | Data real de conclusão é preenchida automaticamente ao concluir (editável com motivo). | — | Cálculo de atraso |
| RN-009c | Reabrir etapa concluída exige justificativa e permissão (responsável do projeto ou aprovador). | — | Histórico + recálculo de progresso |
| RN-009d | Cada etapa possui **aprovador**; as etapas 07, 12 e 20 exigem aprovação da Diretoria. | Conclusão fica "Em validação" até aprovação | — |

## RN-01x — Pesquisa de mercado e concorrentes

| ID | Regra | Validação | Efeito |
|----|-------|-----------|--------|
| RN-010 | Base de concorrentes é **única e histórica**, compartilhada entre projetos. Carga inicial: Fabricantes/marcas — **Heli, Hangcha**; Importadores nacionais — **Netmak, Craft, Brutos, TLM**. Novos concorrentes podem ser incluídos. | Cadastro com tipo (Fabricante / Importador) | — |
| RN-011 | Todo preço de concorrente **obrigatoriamente** tem **data da consulta** e **fonte**. | Bloqueia salvar sem data e fonte | — |
| RN-012 | Preço de concorrente registra o **tipo**: Anunciado / Negociado / Estimado, e as **condições**: inclui impostos (S/N/Não informado), inclui frete (S/N/NI), condição de pagamento, localização (UF/cidade). | Campos obrigatórios: tipo; condições podem ser "Não informado" | Evita comparar preços de naturezas diferentes |
| RN-013 | Preços nunca são sobrescritos: nova consulta = novo registro. Mantém série histórica. | — | Gráfico de evolução de preço |
| RN-014 | Preço com mais de **N dias** é marcado como **desatualizado** [A DEFINIR N — PD-006]. Preços desatualizados aparecem, mas são destacados e podem ser excluídos da média por filtro. | Cálculo por data | Alerta na comparação de mercado |
| RN-015 | Demanda estimada exige premissa e fonte. | — | — |

## RN-02x — Requisitos técnicos, modelos e acessórios

| ID | Regra | Validação | Efeito |
|----|-------|-----------|--------|
| RN-020 | Especificações usam **catálogo único de atributos** (`atributos_tecnicos`). A aplicabilidade por categoria é definida em `categoria_atributos`. | Não é permitido criar "campo solto" de especificação | Garante comparabilidade |
| RN-021 | Na tela, somente atributos aplicáveis à categoria do modelo/projeto são exibidos. | Filtro por categoria | Ex.: "tipo de mastro" não aparece para paleteira se não aplicável |
| RN-022 | Requisitos são **versionados**; apenas uma versão vigente aprovada por projeto. Alterar requisito aprovado cria nova versão. | — | Cotações ligadas à versão |
| RN-023 | Versão só pode ser aprovada com todos os atributos **obrigatórios** da categoria preenchidos (valor-alvo ou "não se aplica" justificado). | Bloqueia aprovação | — |
| RN-024 | Acessório só é oferecido para modelos/categorias **compatíveis** (`modelo_acessorios` / `categoria_acessorios`). Nenhum acessório aparece automaticamente para todos. | Filtro de compatibilidade | — |
| RN-025 | Ficha técnica do modelo Forza é a mesma estrutura de atributos usada para fornecedores e concorrentes (`modelos_maquinas` + `especificacoes_modelo`). | — | Comparação direta |

## RN-03x — Fornecedores e cotações

| ID | Regra | Validação | Efeito |
|----|-------|-----------|--------|
| RN-030 | **FOB é sempre armazenado e exibido em USD.** Não há conversão automática de FOB para BRL como indicador principal. | Campo `fob_usd` sem moeda alternativa | — |
| RN-031 | Cotação deve referenciar a **versão de requisitos** enviada ao fornecedor. Cotações de versões diferentes são sinalizadas na comparação. | Obrigatório | Alerta "configuração diferente" |
| RN-032 | Opcionais/acessórios cotados registram se estão **inclusos no FOB** ou com preço adicional (USD). | — | Comparação justa entre fornecedores |
| RN-033 | Cotação vencida (validade < hoje) muda para status "Vencida" e não pode ser base de nacionalização oficial nova sem revalidação. | Automático diário | Alerta |
| RN-034 | Apenas fornecedores "Apto a cotar" no projeto podem receber cotação. | Bloqueia | — |

## RN-04x — Nacionalização e cenários

| ID | Regra | Validação | Efeito |
|----|-------|-----------|--------|
| RN-040 | Nacionalização **não altera** o FOB: o FOB USD é apenas lido da cotação e mantido separado. | — | — |
| RN-041 | Câmbio é **premissa** do cálculo, com valor, data e fonte. | Obrigatórios | — |
| RN-042 | Custo nacionalizado (BRL) e FOB (USD) **nunca** são somados/exibidos como mesmo indicador. Telas mostram os dois lado a lado com moeda explícita. | — | — |
| RN-043 | Alíquotas e taxas não são pré-preenchidas com valores inventados; são parâmetros informados/validados pelo Comex (NCM, II, IPI, PIS, COFINS, ICMS, AFRMM, taxa Siscomex, despesas etc.). | — | [A DEFINIR] tabela de parâmetros vigente — PD-007 |
| RN-044 | Só existe **uma nacionalização oficial vigente** por projeto. Nova oficial substitui a anterior, que fica no histórico. | — | Viabilidade usa sempre a vigente |
| RN-045 | **Cenários** permitem alterar temporariamente câmbio, frete, qtd. por contêiner, FOB, margem desejada e preço de venda. **Nunca** alteram dados oficiais. | Cenário é registro separado | — |
| RN-046 | Cenário pode ser salvo com nome e descrição; pode ser **promovido** a oficial somente por aprovador, gerando histórico. | Permissão | — |
| RN-047 | Nacionalização de concorrente é marcada como **estimativa** e exige fonte das premissas. | — | Exibida com selo "Estimado" |

## RN-05x — Viabilidade, auditoria, amostra

| ID | Regra | Validação | Efeito |
|----|-------|-----------|--------|
| RN-050 | Decisão de viabilidade: **Avançar / Revisar / Encerrar**, com responsável, data e observação obrigatórios. | Bloqueia sem os 4 campos | — |
| RN-051 | **Revisar** exige indicar quais etapas serão reabertas. | — | Reabre etapas |
| RN-052 | **Encerrar** muda a situação do projeto para "Encerrado" e cancela etapas abertas. | Confirmação | Sai dos KPIs ativos |
| RN-053 | Viabilidade usa dados vigentes (nacionalização oficial, preços de mercado). Se esses dados mudarem após a decisão, o sistema **alerta** que a viabilidade está desatualizada. | Comparação de versões | Alerta |
| RN-054 | Fornecedor já homologado: registrar se nova auditoria é necessária (S/N + justificativa). | — | Permite concluir etapa 08 sem auditoria |
| RN-055 | Pedido de amostra só com: viabilidade = Avançar, etapa 08 concluída e especificação da amostra aprovada. | Bloqueia etapa 09 | — |
| RN-056 | Cada amostra é um registro numerado (Amostra 1, 2…). Nova amostra não apaga a anterior. | — | Histórico completo |
| RN-057 | Toda alteração de configuração durante a produção da amostra é registrada (o quê, motivo, solicitante, aprovador). | — | Histórico |
| RN-058 | Resultado da amostra: Aprovada / Aprovada com ressalvas / Reprovada / Necessita nova amostra. **Aprovada com ressalvas** exige lista de ressalvas com plano de ação e prazo. | — | Gate da etapa 12 |
| RN-059 | Não conformidade de severidade **crítica** aberta impede resultado "Aprovada". | Bloqueia | — |

## RN-06x — Homologação e alterações

| ID | Regra | Validação | Efeito |
|----|-------|-----------|--------|
| RN-060 | Na etapa 12 a configuração é **congelada** (fornecedor, modelo, especificações, componentes, acessórios, correções). | Somente leitura após aprovação | Marco "Homologado" |
| RN-061 | Alteração após congelamento só por **solicitação de alteração**, com motivo, impacto (custo, documentação, peças, SKU) e aprovação. Aprovada ⇒ nova versão da configuração. | Fluxo próprio | Histórico + alerta para docs/peças impactados |

## RN-07x — Preparação para venda, lote e lançamento

| ID | Regra | Validação | Efeito |
|----|-------|-----------|--------|
| RN-070 | **SKU definitivo** só pode ser cadastrado após etapa 12 concluída. | Campo bloqueado antes | — |
| RN-071 | Documentos obrigatórios por categoria são parametrizados; etapa 15 só conclui com todos "Aprovados". | — | — |
| RN-072 | Documento tem versão; nova versão torna a anterior "Obsoleta". | — | — |
| RN-073 | Treinamento só é considerado realizado com lista de presença anexada. | — | — |
| RN-075 | Marketing recebe somente informações da configuração homologada vigente e documentos aprovados. | Pacote gerado a partir desses dados | — |
| RN-078 | Pedido do primeiro lote deve referenciar a versão vigente da configuração homologada; qualquer divergência bloqueia a conclusão da etapa 18. | — | — |
| RN-079 | Amostra aprovada **não** garante lote correto. Conferência do lote × configuração homologada é obrigatória na etapa 19. | Bloqueia etapa 19 sem conferência 100% preenchida | — |
| RN-080 | Lançamento (etapa 20) só com checklist completo: produto (lote conforme ou NC aceitas formalmente), documentação aprovada, lista de peças concluída com disponibilidade, treinamentos PV e Comercial realizados, preço de venda aprovado, suporte Pós-Vendas apto. | Bloqueia | [A DEFINIR] se Diretoria pode liberar com exceção — PD-009 |

## RN-08x — Pós-lançamento

| ID | Regra | Validação | Efeito |
|----|-------|-----------|--------|
| RN-081 | Ocorrências só podem ser registradas para projetos lançados. | — | — |
| RN-082 | Ocorrência de melhoria aprovada gera solicitação de alteração (RN-061). | — | Rastreabilidade até a versão |
| RN-083 | Ocorrência de falha com severidade crítica gera alerta ao responsável do projeto e à Engenharia. | — | Notificação |

## RN-09x — Equivalência de concorrentes

| ID | Regra | Validação | Efeito |
|----|-------|-----------|--------|
| RN-090 | Equivalência: **Equivalente / Parcialmente equivalente / Não equivalente**. | Domínio fixo | — |
| RN-091 | Equivalência **não** pode ser determinada apenas pela capacidade nominal. Considera atributos marcados como "crítico para equivalência" na categoria (ex.: bateria, mastro, altura, motor, capacidade residual, dimensões, acessórios/opcionais, configuração geral). | Sugestão automática (doc 05 §6) + confirmação manual com justificativa | — |
| RN-092 | Somente modelos da **mesma categoria** podem ser comparados. | Filtro | — |
| RN-093 | A faixa de preço de mercado usa apenas **Equivalentes** por padrão. Inclusão de Parcialmente equivalentes é opcional, sinalizada na tela. [A DEFINIR padrão — PD-005] | Filtro | Afeta mín/médio/máx |
