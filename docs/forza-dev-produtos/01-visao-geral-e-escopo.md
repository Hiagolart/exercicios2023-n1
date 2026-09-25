# 01 — Visão geral e escopo

## 1. Objetivo

Plataforma para acompanhar cada **projeto de desenvolvimento de máquina/equipamento** da Forza BR desde a pesquisa de mercado até o pós-lançamento, concentrando em um só lugar:

- evolução por fase/etapa, responsáveis e prazos;
- requisitos técnicos por categoria e ficha de cada modelo;
- fornecedores, cotações (FOB em USD) e matriz técnica;
- concorrentes, preços de mercado (com data e fonte) e equivalência técnica;
- nacionalização, cenários de simulação e viabilidade econômica;
- amostras, testes, homologação e configuração congelada;
- SKU, peças, documentação, treinamentos e liberação para marketing;
- primeiro lote comparado com a amostra homologada;
- ocorrências e melhorias pós-lançamento;
- histórico e anexos/evidências de tudo.

## 2. Fora do escopo (nesta versão)

- Controle de estoque, faturamento e pedidos de venda (o sistema apenas **consulta/registra** disponibilidade quando necessário para o gate de lançamento).
- Emissão de documentos de importação (DI/DUIMP) — apenas registro de valores e anexos.
- Integração com ERP (prevista como evolução — ver PD na doc 07).
- Modo escuro (previsto para depois, tokens de cor já preparados).

## 3. Áreas usuárias e papel principal

| Área | Papel no sistema |
|------|------------------|
| **P&D** | Dono do projeto na maior parte do ciclo; cria projetos, conduz pesquisa, requisitos, definição final |
| **Engenharia** | Requisitos técnicos, análise técnica de cotações, testes de amostra, relatório técnico, conferência de lote |
| **Comercial** | Pesquisa de mercado, concorrentes, preços de mercado, preço de venda, lançamento comercial, treinamento recebido |
| **Comex** | Cotações, nacionalização, câmbio/frete, pedido de amostra, pedido de primeiro lote |
| **Pós-Vendas** | Peças iniciais, manuais/manutenção, garantia, treinamentos, ocorrências pós-lançamento |
| **Qualidade** [PROPOSTA] | Auditoria de fornecedor, inspeção de recebimento (amostra e lote). Se não houver área formal, papel assumido por Engenharia |
| **Marketing** | Recebe apenas informações validadas (etapa 17) |
| **Diretoria** | Aprovações de gate (viabilidade, definição final, lançamento), visão consolidada |
| **Administrador** | Cadastros-base (categorias, atributos, concorrentes, parâmetros, usuários) |

Perfis de acesso detalhados: ver [06-telas-e-navegacao.md §8](06-telas-e-navegacao.md#8-perfis-e-permissões-proposta).

## 4. Glossário e conceitos centrais

| Termo | Definição no sistema |
|-------|----------------------|
| **Projeto** | Unidade de acompanhamento. Um projeto = um equipamento Forza em desenvolvimento (ex.: "Empilhadeira elétrica contrabalançada 3 t"). Possui código próprio (`PRJ-AAAA-NNN`), que **não é SKU**. |
| **Categoria** | Família técnica do equipamento (elétrica contrabalançada, diesel, GLP/gasolina, paleteira, patolada, retrátil, plataforma, outros). Define quais atributos técnicos e acessórios se aplicam. |
| **Atributo técnico** | Item do catálogo único de especificações (ex.: capacidade nominal, centro de carga, tensão da bateria). Tem unidade, tipo de dado e regra de comparação. |
| **Modelo de máquina** | Qualquer máquina que possua ficha técnica: produto Forza, modelo ofertado por fornecedor ou modelo de concorrente. Diferenciados pelo campo `origem`. |
| **Requisitos do projeto** | Conjunto versionado de valores-alvo por atributo que o produto Forza deve atender. Base para cotação, análise técnica e testes. |
| **Cotação** | Proposta de um fornecedor para um modelo, vinculada a uma **versão de requisitos**. FOB sempre em USD. |
| **Matriz técnica** | Resultado da comparação requisito × informado por fornecedor (atende / não atende / superior / pendente / não informado). |
| **Equivalência** | Classificação de um modelo concorrente em relação ao produto Forza: Equivalente / Parcialmente equivalente / Não equivalente. |
| **Nacionalização oficial** | Versão aprovada do cálculo de custo nacionalizado do projeto. Só existe uma vigente por projeto. |
| **Cenário** | Simulação salva separadamente; nunca altera a nacionalização oficial. |
| **Configuração homologada** | "Foto congelada" do produto após a etapa 12: fornecedor, modelo, especificações, componentes, acessórios e correções. Referência para SKU, documentação e primeiro lote. |
| **Gate** | Pré-requisito que bloqueia o início ou a conclusão de uma etapa. |
| **Evidência** | Anexo ou registro estruturado que comprova a entrega de uma etapa. |
| **Ocorrência** | Registro pós-lançamento (falha, garantia, reclamação, sugestão, melhoria). |

## 5. Identidade visual (herdada do Forza Cost Control)

| Elemento | Diretriz |
|----------|----------|
| Cor principal | **Amarelo Forza** — [A DEFINIR] extrair o hexadecimal exato do Forza Cost Control (não inventar) |
| Navegação | Menu lateral grafite/preto, ícone + texto, item ativo destacado em amarelo |
| Fundo | Branco ou cinza claro; cards brancos com borda/sombra suave |
| Destaques | Somente o necessário: KPIs, atrasos e bloqueios. Evitar excesso de cor |
| Tipografia | Mesma família do Forza Cost Control [A DEFINIR] |
| Responsividade | Desktop como uso principal; celular com cards empilhados, tabelas com rolagem horizontal ou versão em lista |
| Modo escuro | Futuro. Todas as cores serão definidas como **tokens** (variáveis) desde o início para permitir o tema escuro sem retrabalho |

### 5.1 Cores de status — padrão único para todo o sistema

Uma cor representa **um significado**, independentemente da entidade (etapa, amostra, fornecedor, cotação…).

| Cor | Significado | Exemplos de status mapeados |
|-----|-------------|-----------------------------|
| 🟢 Verde | Concluído / aprovado / homologado / atende | Concluído, Homologado, Aprovada, Atende, Superior, Avançar, Lançado, Conforme |
| 🔵 Azul | Em andamento / em análise | Em andamento, Em análise, Em validação, Em cotação |
| 🟡 Amarelo | Aguardando / negociação / atenção | Aguardando terceiro, Em negociação, Revisar, Aprovada com ressalvas, Pendente, Parcialmente equivalente |
| 🟣 Roxo | Amostra / testes | Amostra solicitada, Em produção de amostra, Em teste |
| ⚪ Cinza | Não iniciado / pausado / neutro | Não iniciado, Pausado, Não aplicável, Não informado, Rascunho |
| 🔴 Vermelho | Bloqueado / reprovado / cancelado / não atende | Bloqueado, Reprovada, Cancelado, Encerrar, Não atende, Não equivalente, Não conforme, Atrasado |

> **Observação:** "Em validação" (etapa) é azul; já os status específicos de amostra/teste (produção, teste físico) são roxos, para que o usuário identifique visualmente que o projeto está em fase de amostra.
> O mapeamento completo status → cor fica na tabela de domínio `status_dominio` (ver doc 04), para que a cor seja a mesma em badges, gráficos e filtros.
