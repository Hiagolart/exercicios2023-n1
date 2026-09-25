# 07 — Pendências, premissas e decisões

## 1. Pendências para validação (responder antes da estrutura definitiva)

| ID | Tema | Pergunta | Proposta atual | Impacta |
|----|------|----------|----------------|---------|
| PD-001 | Status de etapa | Incluir o status **"Não aplicável"** (ex.: auditoria dispensada, treinamento de rede inexistente) separado de "Cancelado"? | Sim — sai do cálculo de % e exige justificativa | RN-006, % avanço |
| PD-002 | Cards do dashboard | Os cards de estágio devem ser mutuamente exclusivos (cada projeto em um só)? "Homologados" = projetos com etapa 12 concluída ainda não lançados, ou todos com 12 concluída? Incluir cards "Em viabilidade" e "Auditoria/pedido de amostra" para cobrir etapas 06–09? | Exclusivos; incluir os 2 cards novos | Dashboard |
| PD-003 | Responsáveis | Validar área responsável e aprovador por etapa (doc 02 §1.1). Existe área de Qualidade formal? Quem cria o SKU (Engenharia, Cadastro, Fiscal)? | Tabela proposta | Permissões, notificações |
| PD-004 | Equivalência | Quais atributos são críticos para equivalência em cada categoria e qual tolerância de cada um? | Definir com Engenharia + Comercial por categoria | Precificação |
| PD-005 | Faixa de mercado | Parcialmente equivalentes entram na média por padrão? | Não (opcional por filtro) | Comparação de mercado |
| PD-006 | Validade de preço | Após quantos dias um preço de concorrente é "desatualizado"? | Parâmetro configurável | RN-014 |
| PD-007 | Nacionalização | Fórmula tributária oficial do Comex (bases de cálculo de II, IPI, PIS/COFINS, ICMS "por dentro", AFRMM, Siscomex), NCMs usuais, fonte do câmbio (PTAX? data?) | Estrutura parametrizável; valores pelo Comex | Custo nacionalizado |
| PD-008 | Margem | Definição de margem usada pela Forza (bruta? contribuição?) e base de preço (com/sem impostos de venda) | Mesmo conceito usado no Forza Cost Control, se existir | Viabilidade |
| PD-009 | Lançamento | Diretoria pode liberar lançamento com exceção (item do checklist pendente)? | Não, regra rígida | RN-080 |
| PD-010 | Pós-lançamento | Duração do acompanhamento pós-lançamento (6/12 meses?) e critério de encerramento da etapa 21 | Parâmetro por projeto | Etapa 21 |
| PD-011 | Integrações | Integração futura com ERP (SKU, estoque de peças, vendas, garantia)? Com o próprio Forza Cost Control (compartilhar login, fornecedores, câmbio)? | Fora do escopo v1, mas IDs preparados | Modelo de dados |
| PD-012 | Identidade visual | Hex do amarelo Forza, grafite, tipografia e logotipo exatamente como no Forza Cost Control | Extrair do Cost Control | Telas |
| PD-013 | Plataforma | Onde será implementado (mesma stack do Forza Cost Control?) e onde ficam os anexos (armazenamento de arquivos) | Mesma stack e padrão do Cost Control | Implementação |
| PD-014 | Atributos por categoria | Lista inicial de atributos obrigatórios por categoria (8 categorias) | Montar planilha com Engenharia — próximo passo sugerido | Requisitos, comparação |
| PD-015 | Moeda do preço de concorrente | Preços de fabricantes (Heli/Hangcha) podem vir em USD e de importadores em BRL. Comparação de mercado usa qual moeda/base? | Comparar em BRL no mercado nacional; preços de fabricante (USD) ficam como referência de custo, não de preço de venda | Precificação |

## 2. Premissas assumidas nesta versão

1. Um projeto corresponde a **um** equipamento Forza (uma categoria, um modelo-base). Variações de configuração (ex.: altura de mastro) são tratadas como acessórios/opcionais ou versões — **não** como projetos separados. *(validar)*
2. Todos os projetos seguem as 21 etapas; etapas podem ser marcadas como não aplicáveis com justificativa (depende de PD-001).
3. Fornecedores e concorrentes são cadastros **globais** reutilizados por todos os projetos.
4. Nenhum valor tributário, tolerância técnica ou preço será pré-carregado pelo sistema.

## 3. Registro de decisões

| ID | Data | Decisão | Origem |
|----|------|---------|--------|
| DC-001 | 2026-09-25 | Processo com 5 fases e 21 etapas conforme briefing | Briefing do PBI |
| DC-002 | 2026-09-25 | FOB sempre em USD, separado do custo nacionalizado | Briefing (regras 4 e 5) |
| DC-003 | 2026-09-25 | Preço de concorrente exige data e fonte | Briefing (regra 3) |
| DC-004 | 2026-09-25 | Base inicial de concorrentes: Heli, Hangcha (fabricantes); Netmak, Craft, Brutos, TLM (importadores) | Briefing |
| DC-005 | 2026-09-25 | Catálogo único de atributos técnicos por categoria e tabela única de modelos (Forza/fornecedor/concorrente) | Proposta estrutural (doc 04 §1) — **aguarda validação** |
| DC-006 | 2026-09-25 | Requisitos e configuração homologada versionados | Proposta estrutural — **aguarda validação** |

## 4. Próximos passos sugeridos (um bloco por vez)

1. **Validar pendências PD-001 a PD-003** (status, cards, responsáveis) — fecham o esqueleto do processo.
2. **Fase 1 em detalhe:** atributos por categoria (PD-014), equivalência (PD-004/005) e campos finais de concorrentes/preços.
3. **Nacionalização e viabilidade:** fórmula do Comex (PD-007) e conceito de margem (PD-008).
4. **Fase 2:** plano de testes padrão por categoria e checklist de auditoria.
5. **Fases 3–5:** documentos obrigatórios por categoria, checklist de lançamento, pós-lançamento.
6. Consolidar a **estrutura definitiva** (modelo físico) e iniciar a implementação tendo o Forza Cost Control como referência.

## Modelo para novas inclusões

Copiar este bloco para cada nova regra, campo ou funcionalidade:

```markdown
### [Nome da inclusão]
- Descrição:
- 1. Etapa do processo:
- 2. Tabela de armazenamento:
- 3. Dado semelhante já existente? (onde)
- 4. Exibição ao usuário (aba/tela/componente):
- 5. Impacto em cálculo, indicador ou status:
- 6. Área responsável:
- 7. Evidência necessária para concluir:
- Regras relacionadas (RN-xxx):
- Status: Proposta / Validada / Implementada
```
