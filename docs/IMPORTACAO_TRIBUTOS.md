# Importação de dados tributários

Todas as cargas geram um relatório (processados, inseridos, atualizados, inalterados, rejeitados,
ignorados e erros por linha) e ficam registradas com a fonte, o hash do arquivo e a data de
referência.

## Tabelas oficiais

| Comando                                               | Tributo | Fonte                                     |
| ----------------------------------------------------- | ------- | ----------------------------------------- |
| `pnpm ingest tributos --source tipi --file tipi.xlsx` | IPI     | Receita Federal (TIPI)                    |
| `pnpm ingest tributos --source tec --file tec.xlsx`   | II      | Camex (TEC, Res. Gecex 272/2021, Anexo I) |

Opções:

- `--ato "Decreto nº ..."` registra o fundamento legal em todas as alíquotas da carga.
- `--referencia aaaa-mm-dd` informa a data da tabela (padrão: hoje). É usada quando uma alíquota
  muda e a planilha não traz a data de início: a nova alíquota começa nessa data e a anterior é
  encerrada na véspera. Esses registros aparecem como "deduzido da carga".

Na TIPI, o leitor procura a linha de cabeçalho com "NCM" e "ALÍQUOTA". Linhas com código de 8
dígitos e alíquota viram registros; linhas com a coluna "EX" preenchida viram destaques Ex;
capítulos e posições são ignorados.

Na planilha da Camex, o leitor combina as abas: a alíquota base do II vem do Anexo II quando a
NCM consta nele e, senão, do Anexo I (TEC). As exceções dos Anexos IV, V, VI, VIII, IX e X viram
exceções da NCM ou destaques Ex, com quota quando houver. Detalhes em
[`FONTES_DE_DADOS.md`](FONTES_DE_DADOS.md).

Cada carga é tratada como a lista completa da fonte: registros que deixam de aparecer são
encerrados na véspera da data de referência (ou removidos, se ainda não tinham começado).

## Modelo próprio (CSV ou JSON)

Para dados sem planilha oficial estruturada: listas de exceção (LETEC, LEBIT-BK etc.),
ex-tarifários e regras gerais da legislação.

```bash
pnpm ingest tributos --source arquivo --file excecoes.csv --fonte "Camex — Res. Gecex nº X/2026" --fonte-url https://...
```

O nome informado em `--fonte` aparece na interface como origem dos dados. CSV com `;` ou `,`
(detectado pelo cabeçalho) e datas em `dd/mm/aaaa` ou `aaaa-mm-dd`.

| Coluna            | Obrigatória             | Valores                                                             |
| ----------------- | ----------------------- | ------------------------------------------------------------------- |
| `tipo_registro`   | não (padrão `aliquota`) | `aliquota` ou `destaque`                                            |
| `ncm`             | conforme o regime       | 8 dígitos, com ou sem pontos; vazio na regra geral                  |
| `tributo`         | sim                     | `II`, `IPI`, `PIS`, `COFINS`, `CBS`, `IBS`                          |
| `regime`          | não                     | `geral` (padrão com NCM), `excecao`, `regra_geral` (padrão sem NCM) |
| `lista`           | na exceção              | Ex.: `LETEC`, `LEBIT-BK`                                            |
| `aliquota`        | sim                     | Percentual (`14`, `12,5`) ou `NT`                                   |
| `vigencia_inicio` | não                     | Data                                                                |
| `vigencia_fim`    | não                     | Data                                                                |
| `ato_legal`       | recomendada             | Fundamento legal exibido na interface                               |
| `observacao`      | não                     | Nota exibida junto da alíquota                                      |
| `numero_ex`       | no destaque             | Número do Ex                                                        |
| `descricao_ex`    | no destaque             | Descrição do Ex                                                     |

Exemplo:

```csv
tipo_registro;ncm;tributo;regime;lista;aliquota;vigencia_inicio;vigencia_fim;ato_legal;numero_ex;descricao_ex
aliquota;9901.10.10;II;excecao;LETEC;2;01/01/2026;31/12/2027;Res. Gecex nº ...;;
destaque;9901.10.10;II;;;0;01/03/2026;31/12/2027;Res. Gecex nº ...;001;Descrição transcrita do ato
```

> O exemplo mostra o formato. Os números de ato, datas e descrições precisam vir do ato oficial.

## Regras gerais da legislação

`pnpm ingest tributos --source legislacao` carrega `data/legislacao/regras-gerais.csv`: alíquotas
gerais de PIS/Cofins-Importação e as alíquotas de teste de CBS/IBS de 2026, cada uma com o ato
legal citado. É uma transcrição manual, marcada na interface para conferência.

## Precedência na consulta

Para cada tributo, na data consultada: exceção vigente sem quota → alíquota da NCM → regra geral.
Exceções limitadas a uma quota são exibidas à parte, porque valem só para o volume da quota.
