// Dados do portfólio e das etapas de desenvolvimento.
// Edite este arquivo para cadastrar novas classes, linhas e produtos.

const CLASSES = ['Classe I', 'Classe II', 'Classe III', 'Classe V', 'Classe VI', 'Classe VII'];

// Cada linha pertence a uma classe e tem uma cor usada na ilustração da máquina.
const LINHAS = [
  { id: 'xh', nome: 'XH', classe: 'Classe I', cor: '#f5a623' },
  { id: 'xc', nome: 'XC', classe: 'Classe I', cor: '#2fb35a' },
  { id: 'xr', nome: 'XR', classe: 'Classe II', cor: '#3b7dd8' },
  { id: 'xp', nome: 'XP', classe: 'Classe III', cor: '#d64545' },
  { id: 'xd', nome: 'XD', classe: 'Classe V', cor: '#f5a623' },
  { id: 'xt', nome: 'XT', classe: 'Classe VI', cor: '#7a5cd6' },
  { id: 'xa', nome: 'XA', classe: 'Classe VII', cor: '#c9a227' },
];

const PRODUTOS = [
  { id: 'xh15', linha: 'xh', modelo: 'XH15', capacidade: '1.500 kg' },
  { id: 'xh20', linha: 'xh', modelo: 'XH20', capacidade: '2.000 kg' },
  { id: 'xh25', linha: 'xh', modelo: 'XH25', capacidade: '2.500 kg' },
  { id: 'xh30', linha: 'xh', modelo: 'XH30', capacidade: '3.000 kg' },
  { id: 'xh35', linha: 'xh', modelo: 'XH35', capacidade: '3.500 kg' },
  { id: 'xc15', linha: 'xc', modelo: 'XC15', capacidade: '1.500 kg' },
  { id: 'xc20', linha: 'xc', modelo: 'XC20', capacidade: '2.000 kg' },
  { id: 'xc25', linha: 'xc', modelo: 'XC25', capacidade: '2.500 kg' },
  { id: 'xc30', linha: 'xc', modelo: 'XC30', capacidade: '3.000 kg' },
  { id: 'xc35', linha: 'xc', modelo: 'XC35', capacidade: '3.500 kg' },
  { id: 'xr14', linha: 'xr', modelo: 'XR14', capacidade: '1.400 kg' },
  { id: 'xr20', linha: 'xr', modelo: 'XR20', capacidade: '2.000 kg' },
  { id: 'xp20', linha: 'xp', modelo: 'XP20', capacidade: '2.000 kg' },
  { id: 'xp25', linha: 'xp', modelo: 'XP25', capacidade: '2.500 kg' },
  { id: 'xd50', linha: 'xd', modelo: 'XD50', capacidade: '5.000 kg' },
  { id: 'xd70', linha: 'xd', modelo: 'XD70', capacidade: '7.000 kg' },
  { id: 'xt30', linha: 'xt', modelo: 'XT30', capacidade: '3.000 kg (reboque)' },
  { id: 'xa30', linha: 'xa', modelo: 'XA30', capacidade: '3.000 kg' },
];

// Etapas do processo de desenvolvimento de produto (na ordem do fluxo).
const ETAPAS = [
  'Desenvolvimento para novos produtos',
  'Estudo de viabilidade',
  'Pesquisa de mercado',
  'Definição de Requisitos técnicos',
  'Pesquisar fornecedores na China',
  'Orçamento junto aos fornecedores',
  'Cálculo de Nacionalização',
  'Análise de especificações pela área técnica',
  'Análise de viabilidade econômica',
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
  na: { rotulo: 'Não se aplica' },
};

// Situação inicial das etapas quando um produto ainda não tem registro salvo.
// Segue o exemplo do fluxograma: algumas etapas riscadas, "Integração com
// Marketing" em andamento e as duas últimas pendentes.
const STATUS_PADRAO = [
  'na', 'concluida', 'concluida', 'concluida', 'na', 'concluida', 'na', 'na',
  'na', 'concluida', 'concluida', 'concluida', 'concluida', 'andamento',
  'pendente', 'pendente',
];
