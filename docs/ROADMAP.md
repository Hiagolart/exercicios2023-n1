# Roadmap: funcionalidades equivalentes ao TECwin

> Revisão de 29/09/2026. Substitui o roadmap da seção 8 de `ANALISE_TECNICA.md`.
>
> **Objetivo:** oferecer as mesmas funcionalidades de um sistema de consulta aduaneira como o
> TECwin, com identidade visual, código, textos e base de dados próprios. Todo o conteúdo vem de
> fontes oficiais. Não se copia a interface, os textos, os comentários nem a base do TECwin.

## 1. Mapa de funcionalidades

Levantamento funcional feito a partir da descrição pública do produto ([Aduaneiras — TECwin](https://www.aduaneiras.com.br/produtos/tecwin)).

| Funcionalidade                                           | Fonte oficial                                   | Acesso                                          | Fase |
| -------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- | ---- |
| Pesquisa de NCM por código, descrição e estrutura        | Receita Federal (Classif)                       | Download público                                | 2    |
| Alíquota do II (TEC) e exceções (LETEC, LEBIT-BK etc.)   | Camex (planilha da TEC, Res. Gecex 272/2021)    | Download público                                | 3    |
| Ex-tarifários vigentes                                   | Camex (resoluções e listas publicadas)          | Download público                                | 3    |
| Alíquota do IPI                                          | Receita Federal (TIPI)                          | Download público                                | 3    |
| PIS/Cofins-Importação                                    | Legislação da Receita                           | Público; regras precisam ser modeladas          | 3    |
| CBS/IBS (reforma tributária, transição a partir de 2026) | LC 214/2025 e regulamentação                    | Público; regras em transição                    | 3    |
| Tratamento tributário completo por NCM e país            | Receita Federal (TTCE, Portal Único)            | **Exige certificado digital**                   | 3    |
| Simulador de tributos na importação                      | Cálculo sobre os dados acima                    | —                                               | 3    |
| Histórico de alíquotas e alterações da NCM               | Cargas versionadas + atos legais                | Construído a partir das cargas                  | 3–4  |
| Notas explicativas (NESH)                                | Receita Federal (IN RFB 2.169/2023)             | Público; texto integral pede avaliação jurídica | 4    |
| Legislação (atos que criaram ou alteraram cada código)   | Classif (ato legal), Diário Oficial             | Público                                         | 4    |
| Tratamento administrativo (anuências, LPCO)              | Portal Único (Tratamento Administrativo e LPCO) | A verificar                                     | 5    |
| Antidumping, medidas compensatórias e salvaguardas       | Secex/MDIC, Diário Oficial                      | Público, sem base estruturada                   | 5    |
| Acordos comerciais, preferências e regras de origem      | Siscomex, Aladi                                 | Público                                         | 5    |
| Alíquotas de ICMS por estado                             | Legislação estadual                             | Público, disperso                               | 5    |
| Estatísticas de importação por NCM                       | MDIC (Comex Stat)                               | Download público                                | 6    |
| Análise com IA e Assistente Comex                        | Dados da própria base                           | —                                               | 7    |
| Relatórios (PDF, Excel, CSV)                             | —                                               | —                                               | 8    |

## 2. Fases

| Fase | Entrega                                                                                       | Situação                    |
| ---- | --------------------------------------------------------------------------------------------- | --------------------------- |
| 0    | Validação das fontes com download real                                                        | Bloqueada: rede do ambiente |
| 1    | Fundação: monorepo, banco, autenticação, layout, estrutura da NCM                             | ✅                          |
| 2    | Pesquisa NCM: busca por código e descrição, página de detalhes, favoritos, histórico          | Em andamento                |
| 3    | Tributação: II, exceções e ex-tarifários, IPI, PIS/Cofins, CBS/IBS, histórico, simulador      | —                           |
| 4    | Nomenclatura avançada: NESH, notas de seção e capítulo, legislação e atos legais              | —                           |
| 5    | Tratamento administrativo, defesa comercial, acordos e preferências, ICMS                     | —                           |
| 6    | Estatísticas de importação (Comex Stat): o diferencial em relação ao TECwin                   | —                           |
| 7    | IA: resumo da NCM, apoio à classificação (nunca como classificação oficial), Assistente Comex | —                           |
| 8    | Relatórios em PDF, Excel e CSV                                                                | —                           |
| 9    | Refinamento: segurança, desempenho, acessibilidade, documentação                              | —                           |

## 3. Decisões e riscos desta revisão

- **TTCE (Tratamento Tributário do Comércio Exterior).** É a fonte oficial mais completa: devolve
  os tributos incidentes por NCM, país de origem e data, e tem uma API de consulta em lote. O
  acesso exige certificado digital (e-CPF) de alguém habilitado no comércio exterior. Sem isso, a
  Fase 3 monta a tributação a partir das tabelas públicas (TEC, TIPI e legislação), que cobrem II
  e IPI, mas exigem modelar à mão as regras de PIS/Cofins e as exceções.
- **Reforma tributária.** A LC 214/2025 inicia a transição para CBS e IBS em 2026, com extinção
  gradual de PIS/Cofins e mudanças no IPI. O modelo de dados trata cada tributo como uma alíquota
  com vigência e fundamento legal, para acomodar a transição sem reescrita.
- **Fórmulas de cálculo.** O simulador de tributos só será liberado com as fórmulas conferidas
  contra a legislação e com casos de teste documentados. Até lá, a tela mostra alíquotas, não
  valores calculados.
- **Rede do ambiente.** As fontes oficiais continuam bloqueadas neste ambiente de
  desenvolvimento. As Fases 3 a 6 dependem de liberar os domínios ou de receber os arquivos
  baixados manualmente.
