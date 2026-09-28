const CHAVE_STORAGE = 'desenvolvimento-produto:etapas';

let classeAtiva = CLASSES[0];
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

// ---------- Ilustração da empilhadeira ----------

function empilhadeiraSVG(cor) {
  return `
    <svg viewBox="0 0 120 80" aria-hidden="true">
      <rect x="18" y="4" width="4" height="62" fill="var(--metal-escuro)"/>
      <rect x="24" y="4" width="4" height="62" fill="var(--metal-claro)"/>
      <rect x="2" y="64" width="30" height="3" fill="var(--metal-escuro)"/>
      <rect x="2" y="50" width="26" height="3" fill="var(--metal-escuro)"/>
      <path d="M40 22 L70 22 L78 42 L40 42 Z" fill="none" stroke="var(--metal-escuro)" stroke-width="3"/>
      <rect x="54" y="30" width="10" height="8" rx="2" fill="#222"/>
      <path d="M32 42 H100 a6 6 0 0 1 6 6 V62 H32 Z" fill="${cor}"/>
      <rect x="88" y="34" width="16" height="10" rx="2" fill="${cor}"/>
      <circle cx="46" cy="64" r="10" fill="#222"/>
      <circle cx="46" cy="64" r="4" fill="#999"/>
      <circle cx="92" cy="65" r="9" fill="#222"/>
      <circle cx="92" cy="65" r="3.5" fill="#999"/>
    </svg>`;
}

// ---------- Tela 1: portfólio ----------

function renderAbas() {
  const abas = document.getElementById('abas');
  abas.innerHTML = '';
  CLASSES.forEach((classe) => {
    const botao = document.createElement('button');
    botao.textContent = classe;
    botao.className = classe === classeAtiva ? 'ativa' : '';
    botao.addEventListener('click', () => {
      classeAtiva = classe;
      renderAbas();
      renderLinhas();
    });
    abas.appendChild(botao);
  });
}

function progresso(lista) {
  const aplicaveis = lista.filter((s) => s !== 'na');
  if (!aplicaveis.length) return 100;
  const feitas = aplicaveis.filter((s) => s === 'concluida').length;
  return Math.round((feitas / aplicaveis.length) * 100);
}

function etapaAtual(lista) {
  const i = lista.indexOf('andamento');
  if (i >= 0) return ETAPAS[i];
  const p = lista.indexOf('pendente');
  return p >= 0 ? ETAPAS[p] : 'Finalizado';
}

function renderLinhas() {
  const container = document.getElementById('linhas');
  container.innerHTML = '';

  const linhas = LINHAS.filter((l) => l.classe === classeAtiva);
  if (!linhas.length) {
    container.innerHTML = '<p class="vazio">Nenhum produto cadastrado nesta classe.</p>';
    return;
  }

  linhas.forEach((linha) => {
    const secao = document.createElement('section');
    secao.innerHTML = `<h2 class="rotulo-linha">Linha: ${linha.nome}</h2>`;

    const grade = document.createElement('div');
    grade.className = 'grade';

    PRODUTOS.filter((p) => p.linha === linha.id).forEach((produto) => {
      const lista = statusDoProduto(produto.id);
      const pct = progresso(lista);

      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-imagem">${empilhadeiraSVG(linha.cor)}</div>
        <p class="card-modelo">${produto.modelo}</p>
        <p class="capacidade"><span class="icone-info">i</span> Capacidade: <strong>${produto.capacidade}</strong></p>
        <p class="card-etapa" title="${etapaAtual(lista)}">${etapaAtual(lista)}</p>
        <div class="progresso-barra mini"><div style="width:${pct}%"></div></div>
        <button class="detalhes">Ver Detalhes &rarr;</button>`;
      card.addEventListener('click', () => {
        location.hash = produto.id;
      });
      grade.appendChild(card);
    });

    secao.appendChild(grade);
    container.appendChild(secao);
  });
}

// ---------- Tela 2: etapas do produto ----------

function renderProduto(produto) {
  const linha = LINHAS.find((l) => l.id === produto.linha);
  document.getElementById('produto-imagem').innerHTML = empilhadeiraSVG(linha.cor);
  document.getElementById('produto-linha').textContent = `${linha.classe} · Linha ${linha.nome}`;
  document.getElementById('produto-modelo').textContent = produto.modelo;
  document.getElementById('produto-capacidade').textContent = `Capacidade: ${produto.capacidade}`;
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
    classeAtiva = LINHAS.find((l) => l.id === produto.linha).classe;
    renderProduto(produto);
  } else {
    produtoAtual = null;
    renderAbas();
    renderLinhas();
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
