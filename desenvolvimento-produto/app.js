const CHAVE_STORAGE = 'desenvolvimento-produto:etapas';

let produtoAtual = null;

// ---------- Persistência (localStorage) ----------

function lerTodosStatus() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_STORAGE)) || {};
  } catch {
    return {};
  }
}

function statusDoProduto(id) {
  const salvo = lerTodosStatus()[id];
  if (Array.isArray(salvo) && salvo.length === ETAPAS.length) return salvo;
  return [...STATUS_PADRAO];
}

function salvarStatus(id, lista) {
  const todos = lerTodosStatus();
  if (lista) todos[id] = lista;
  else delete todos[id];
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(todos));
  } catch {
    // Sem armazenamento disponível: as alterações valem só nesta sessão.
  }
}

// ---------- Ilustrações ----------

const ROSCA = (x, y, r) => `
  <circle cx="${x}" cy="${y}" r="${r}" fill="#222"/>
  <circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#999"/>`;

const DESENHOS = {
  // Empilhadeira retrátil: mastro alto, braços estabilizadores e operador em pé.
  retratil: (cor) => `
    <rect x="30" y="2" width="4" height="66" fill="var(--metal-escuro)"/>
    <rect x="36" y="2" width="4" height="66" fill="var(--metal-claro)"/>
    <rect x="10" y="60" width="26" height="3" fill="var(--metal-escuro)"/>
    <rect x="6" y="70" width="44" height="4" rx="2" fill="var(--metal-escuro)"/>
    <path d="M58 20 H82 V40 H58 Z" fill="none" stroke="var(--metal-escuro)" stroke-width="3"/>
    <path d="M44 40 H96 a6 6 0 0 1 6 6 V68 H44 Z" fill="${cor}"/>
    <rect x="62" y="44" width="16" height="4" rx="1" fill="#222"/>
    ${ROSCA(14, 72, 5)}${ROSCA(88, 70, 8)}`,

  // Empilhadeira 3 rodas: compacta, com uma única roda traseira.
  'tres-rodas': (cor) => `
    <rect x="20" y="6" width="4" height="60" fill="var(--metal-escuro)"/>
    <rect x="26" y="6" width="4" height="60" fill="var(--metal-claro)"/>
    <rect x="4" y="64" width="30" height="3" fill="var(--metal-escuro)"/>
    <path d="M42 24 L68 24 L76 42 L42 42 Z" fill="none" stroke="var(--metal-escuro)" stroke-width="3"/>
    <rect x="54" y="32" width="10" height="7" rx="2" fill="#222"/>
    <path d="M34 42 H90 a10 10 0 0 1 10 10 V62 H34 Z" fill="${cor}"/>
    ${ROSCA(48, 64, 10)}${ROSCA(88, 67, 6)}`,

  // Plataforma articulada: chassi com lança em duas seções e cesto.
  plataforma: (cor) => `
    <path d="M40 58 L60 40 L42 22" fill="none" stroke="${cor}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M42 22 L86 10" fill="none" stroke="${cor}" stroke-width="4"/>
    <rect x="86" y="4" width="22" height="12" rx="1" fill="none" stroke="var(--metal-escuro)" stroke-width="2.5"/>
    <rect x="86" y="10" width="22" height="7" fill="var(--metal-claro)"/>
    <rect x="30" y="52" width="24" height="10" rx="2" fill="var(--metal-escuro)"/>
    <rect x="16" y="60" width="76" height="8" rx="2" fill="${cor}"/>
    ${ROSCA(28, 70, 7)}${ROSCA(80, 70, 7)}`,
};

function desenhoSVG(produto) {
  return `<svg viewBox="0 0 120 80" aria-hidden="true">${DESENHOS[produto.tipo](produto.cor)}</svg>`;
}

// ---------- Tela 1: portfólio ----------

function progresso(lista) {
  const feitas = lista.filter((s) => s === 'concluida').length;
  return Math.round((feitas / lista.length) * 100);
}

function etapaAtual(lista) {
  const i = lista.indexOf('andamento');
  if (i >= 0) return ETAPAS[i];
  const p = lista.indexOf('pendente');
  return p >= 0 ? ETAPAS[p] : 'Finalizado';
}

function renderPortfolio() {
  const grade = document.getElementById('produtos');
  grade.innerHTML = '';

  PRODUTOS.forEach((produto) => {
    const lista = statusDoProduto(produto.id);
    const pct = progresso(lista);

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-imagem">${desenhoSVG(produto)}</div>
      <p class="card-modelo">${produto.nome}</p>
      <p class="card-etapa" title="${etapaAtual(lista)}">${etapaAtual(lista)}</p>
      <div class="progresso-barra mini"><div style="width:${pct}%"></div></div>
      <button class="detalhes">Ver Detalhes &rarr;</button>`;
    card.addEventListener('click', () => {
      location.hash = produto.id;
    });
    grade.appendChild(card);
  });
}

// ---------- Tela 2: etapas do produto ----------

function renderProduto(produto) {
  document.getElementById('produto-imagem').innerHTML = desenhoSVG(produto);
  document.getElementById('produto-nome').textContent = produto.nome;
  renderFluxo();
}

function renderFluxo() {
  const lista = statusDoProduto(produtoAtual.id);
  const pct = progresso(lista);
  document.getElementById('progresso-preenchido').style.width = `${pct}%`;
  document.getElementById('progresso-texto').textContent = `${pct}% concluído`;

  const fluxo = document.getElementById('fluxo');
  fluxo.innerHTML = '';
  ETAPAS.forEach((nome, i) => {
    const item = document.createElement('li');
    const botao = document.createElement('button');
    botao.className = `etapa ${lista[i]}`;
    botao.title = `${nome} — ${STATUS[lista[i]].rotulo}`;
    botao.innerHTML = `<span>${nome}</span>`;
    botao.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirMenu(botao, i);
    });
    item.appendChild(botao);
    fluxo.appendChild(item);
  });
}

function abrirMenu(ancora, indice) {
  const menu = document.getElementById('menu-status');
  menu.innerHTML = `<p>${ETAPAS[indice]}</p>`;
  Object.entries(STATUS).forEach(([chave, { rotulo }]) => {
    const opcao = document.createElement('button');
    opcao.innerHTML = `<span class="amostra ${chave}"></span>${rotulo}`;
    opcao.addEventListener('click', () => {
      const lista = statusDoProduto(produtoAtual.id);
      lista[indice] = chave;
      salvarStatus(produtoAtual.id, lista);
      fecharMenu();
      renderFluxo();
    });
    menu.appendChild(opcao);
  });

  menu.hidden = false;
  const r = ancora.getBoundingClientRect();
  const largura = menu.offsetWidth;
  const esquerda = Math.min(Math.max(8, r.left + r.width / 2 - largura / 2), window.innerWidth - largura - 8);
  menu.style.left = `${esquerda + window.scrollX}px`;
  menu.style.top = `${r.bottom + window.scrollY + 8}px`;
}

function fecharMenu() {
  document.getElementById('menu-status').hidden = true;
}

// ---------- Navegação ----------

function rotear() {
  fecharMenu();
  const match = location.hash.match(/^#(.+)$/);
  const produto = match && PRODUTOS.find((p) => p.id === decodeURIComponent(match[1]));

  document.getElementById('tela-portfolio').hidden = !!produto;
  document.getElementById('tela-produto').hidden = !produto;

  if (produto) {
    produtoAtual = produto;
    renderProduto(produto);
  } else {
    produtoAtual = null;
    renderPortfolio();
  }
  window.scrollTo(0, 0);
}

document.getElementById('voltar').addEventListener('click', () => {
  location.hash = '';
});

document.getElementById('restaurar').addEventListener('click', () => {
  salvarStatus(produtoAtual.id, null);
  renderFluxo();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#menu-status')) fecharMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharMenu();
});
window.addEventListener('hashchange', rotear);

rotear();
