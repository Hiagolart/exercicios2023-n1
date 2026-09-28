// Dados do portfólio e das etapas de desenvolvimento.
// Edite este arquivo para cadastrar novos produtos.

// tipo define a ilustração usada: 'retratil', 'tres-rodas' ou 'plataforma'.
const PRODUTOS = [
  { id: 'retratil', nome: 'Empilhadeira retrátil', tipo: 'retratil', cor: '#f5a623' },
  { id: 'tres-rodas', nome: 'Empilhadeira 3 rodas', tipo: 'tres-rodas', cor: '#2fb35a' },
  { id: 'plataforma', nome: 'Plataforma articulada', tipo: 'plataforma', cor: '#3b7dd8' },
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
  'Integração Indiana',
];

const STATUS = {
  concluida: { rotulo: 'Concluída' },
  andamento: { rotulo: 'Em andamento' },
  pendente: { rotulo: 'Pendente' },
};

// Situação inicial das etapas quando um produto ainda não tem registro salvo.
// Segue o exemplo do fluxograma: "Integração com Marketing" em andamento e as
// duas últimas pendentes.
const STATUS_PADRAO = [
  'concluida', 'concluida', 'concluida', 'concluida', 'concluida', 'concluida',
  'concluida', 'concluida', 'andamento', 'pendente', 'pendente',
];
