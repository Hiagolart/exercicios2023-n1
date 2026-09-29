# Fontes de dados: validação com os arquivos reais (Fase 0)

Arquivos oficiais recebidos em 29/09/2026 e usados na primeira carga. Eles ficam em `data/raw/`
(fora do Git) e devem ser baixados novamente a cada atualização.

| Arquivo                                               | Fonte                          | Conteúdo validado                                                                         |
| ----------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `Tabela_NCM_Vigente_20260929.json`                    | Receita Federal (Classif)      | 15.156 códigos: 96 capítulos, 957 posições, 2.685 subposições, 903 itens, 10.515 subitens |
| `tipi.xlsx`                                           | Receita Federal (TIPI)         | 10.520 alíquotas de IPI e 582 destaques Ex (68 deles NT)                                  |
| `25-09-2026-anexos-i-a-x-resolucao-gecex-272-21.xlsx` | Camex (Res. Gecex nº 272/2021) | 10.515 alíquotas de II, 1.614 exceções temporárias, 557 destaques Ex                      |

## Nomenclatura (JSON do Classif)

- Raiz: `Data_Ultima_Atualizacao_NCM` ("Vigente em 29/09/2026"), `Ato` ("Resolução Gecex nº 926/2026")
  e `Nomenclaturas`.
- Cada item: `Codigo` (com pontos), `Descricao` (com traços de recuo), `Data_Inicio`, `Data_Fim`
  (`31/12/9999` = sem término), `Tipo_Ato_Ini`, `Numero_Ato_Ini`, `Ano_Ato_Ini`.
- Resultado da carga: nenhum registro rejeitado e nenhum código sem nível superior.

## TIPI (xlsx)

- Aba única "Tabela Completa"; cabeçalho na linha 8: `NCM | EX | DESCRIÇÃO | ALÍQUOTA (%)`.
- Alíquotas numéricas ou "NT". Os números vêm com resíduo de ponto flutuante (ex.: 3,9 aparece
  como 3,9000000000000004); por isso as alíquotas são arredondadas a 4 casas.
- O número do Ex aparece como `1`, `"Ex 01"` ou `"Ex  04"`.
- Linhas de capítulo, posição e subposição não têm alíquota e são ignoradas.

## Anexos da Resolução Gecex nº 272/2021 (xlsx)

| Aba                            | Tratamento                                                                |
| ------------------------------ | ------------------------------------------------------------------------- |
| Anexo I – TEC                  | Alíquota da TEC do Mercosul; valores como "12,6BK"/"0BIT" marcam BK/BIT   |
| Anexo II – Diferentes da TEC   | "Alíquota aplicada (%)" pelo Brasil; substitui a TEC como alíquota base   |
| Anexo III – Setor aeronáutico  | Lista de subposições sem alíquota; ignorado                               |
| Anexos IV, V, VI, VIII, IX e X | Exceções temporárias; prevalecem sobre os Anexos I e II enquanto vigentes |

- Cabeçalhos com grafias diferentes entre abas ("Nº Ex"/"Nº EX", "Início de vigência"/"Início da
  Vigência"); o leitor identifica as colunas pelo nome.
- Linhas sem número de Ex ("-") valem para a NCM inteira; linhas com número são destaques Ex.
- Algumas exceções valem só dentro de uma quota (ex.: aço no Anexo IX: 25% fora da quota e
  10,8% dentro da quota, no mesmo período). Alíquotas com quota são exibidas à parte e não
  substituem a alíquota aplicável.
- Datas vêm como data do Excel, como texto `dd/mm/aaaa` ou como "-".
- Notas de seção e capítulo aparecem na coluna NCM; só células formadas por dígitos e pontos são
  lidas como códigos.

## Pendências

- Estatísticas do Comex Stat (Fase 6): ainda sem arquivo.
- As regras gerais de PIS/Cofins e CBS/IBS (`data/legislacao/regras-gerais.csv`) são transcrição
  manual e precisam de conferência.
