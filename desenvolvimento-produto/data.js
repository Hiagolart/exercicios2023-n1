// Dados do portfólio e das etapas de desenvolvimento.
// Edite este arquivo para cadastrar novos produtos.

// Linhas de produto, na ordem em que aparecem no portfólio.
const LINHAS = [
  { id: 'empilhadeira', nome: 'Empilhadeira' },
  { id: 'plataforma', nome: 'Plataforma elevatória articulada' },
];

// linha: id de uma das LINHAS acima.
// foto: imagem do produto (pasta img/). clarearFoto: clareia fotos com fundo cinza. Sem foto, usa a ilustração definida em tipo:
// 'retratil', 'tres-rodas' ou 'plataforma'.
const PRODUTOS = [
  { id: 'retratil', linha: 'empilhadeira', nome: 'Empilhadeira retrátil', foto: 'img/empilhadeira-retratil.webp', tipo: 'retratil', cor: 'var(--amarelo)' },
  { id: 'tres-rodas', linha: 'empilhadeira', nome: 'Empilhadeira 3 rodas', foto: 'img/empilhadeira-3-rodas.webp', clarearFoto: true, tipo: 'tres-rodas', cor: 'var(--amarelo)' },
  { id: 'plataforma', linha: 'plataforma', nome: 'Plataforma articulada', foto: 'img/plataforma-articulada.png', tipo: 'plataforma', cor: 'var(--amarelo)' },
];

// Etapas do processo de desenvolvimento de produto (na ordem do fluxo).
const ETAPAS = [
  'Estudo de viabilidade',
  'Pesquisa de mercado',
  'Definição de Requisitos técnicos',
  'Orçamento junto aos fornecedores',
  'Auditoria nas fábricas da China',
  'Solicitação de amostra de produto',
  'Visita às fábricas na China',
  'Definição de Fornecedor e Produto',
  'Integração com Marketing',
  'Apresentação do produto e fornecedor',
];

const STATUS = {
  concluida: { rotulo: 'Concluída' },
  andamento: { rotulo: 'Em andamento' },
  pendente: { rotulo: 'Pendente' },
};

// Situação inicial das etapas quando um produto ainda não tem registro salvo.
// Segue o exemplo do fluxograma: "Integração com Marketing" em andamento e a
// última pendente.
const STATUS_PADRAO = [
  'concluida', 'concluida', 'concluida', 'concluida', 'concluida', 'concluida',
  'concluida', 'concluida', 'andamento', 'pendente',
];
