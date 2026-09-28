const CHAVE_STORAGE = 'desenvolvimento-produto:etapas';
const CHAVE_PRECOS = 'desenvolvimento-produto:precos';
const ETAPA_PESQUISA = ETAPAS.indexOf('Pesquisa de mercado');

let produtoAtual = null;
let etapaSelecionada = null;

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

function lerTodosPrecos() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_PRECOS)) || {};
  } catch {
    return {};
  }
}

function precosDoProduto(id) {
  const salvo = lerTodosPrecos()[id];
  return Array.isArray(salvo) && salvo.length ? salvo : [{ concorrente: '', preco: null, precoMedio: null }];
}

function salvarPrecos(id, linhas) {
  const todos = lerTodosPrecos();
  todos[id] = linhas;
  try {
    localStorage.setItem(CHAVE_PRECOS, JSON.stringify(todos));
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
      <div class="card-info">
        <p class="card-modelo">${produto.nome}</p>
        <p class="card-etapa">Etapa atual: <strong>${etapaAtual(lista)}</strong></p>
        <div class="card-progresso">
          <div class="progresso-barra mini"><div style="width:${pct}%"></div></div>
          <span>${pct}%</span>
        </div>
      </div>
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
    if (i === etapaSelecionada) botao.classList.add('selecionada');
    botao.setAttribute('aria-pressed', i === etapaSelecionada);
    botao.addEventListener('click', () => {
      etapaSelecionada = etapaSelecionada === i ? null : i;
      renderFluxo();
      renderPainel();
    });
    item.appendChild(botao);
    fluxo.appendChild(item);
  });
}

// ---------- Painel da etapa selecionada ----------

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatarPreco(valor) {
  return valor == null ? '' : moeda.format(valor);
}

// Aceita "1.234,56", "1234,56", "1234.56" ou "R$ 1.234,56".
function lerPreco(texto) {
  let t = texto.replace(/[^\d,.-]/g, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if ((t.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(t)) t = t.replace(/\./g, '');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function media(valores) {
  const v = valores.filter((x) => x != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
}

function renderPainel() {
  const painel = document.getElementById('painel-etapa');
  if (etapaSelecionada == null) {
    painel.hidden = true;
    return;
  }
  const i = etapaSelecionada;
  const lista = statusDoProduto(produtoAtual.id);
  painel.hidden = false;
  painel.innerHTML = `
    <div class="painel-topo">
      <h3>${ETAPAS[i]}</h3>
      <button class="fechar" id="fechar-painel" aria-label="Fechar">&times;</button>
    </div>
    <div class="situacoes" role="group" aria-label="Situação da etapa">
      ${Object.entries(STATUS).map(([chave, { rotulo }]) => `
        <button class="situacao ${lista[i] === chave ? 'ativa' : ''}" data-status="${chave}">
          <span class="amostra ${chave}"></span>${rotulo}
        </button>`).join('')}
    </div>
    <div id="conteudo-etapa"></div>`;

  painel.querySelector('#fechar-painel').addEventListener('click', () => {
    etapaSelecionada = null;
    renderFluxo();
    renderPainel();
  });
  painel.querySelectorAll('.situacao').forEach((b) => {
    b.addEventListener('click', () => {
      const atual = statusDoProduto(produtoAtual.id);
      atual[i] = b.dataset.status;
      salvarStatus(produtoAtual.id, atual);
      renderFluxo();
      renderPainel();
    });
  });

  if (i === ETAPA_PESQUISA) renderTabelaPrecos(document.getElementById('conteudo-etapa'));
}

function renderTabelaPrecos(container) {
  const linhas = precosDoProduto(produtoAtual.id);

  container.innerHTML = `
    <h4>Preços dos concorrentes</h4>
    <div class="tabela-rolagem">
      <table class="tabela-precos">
        <thead>
          <tr><th>Concorrente</th><th class="num">Preço</th><th class="num">Preço médio</th><th></th></tr>
        </thead>
        <tbody>
          ${linhas.map((l, n) => `
            <tr>
              <td><input id="conc-${n}" data-linha="${n}" data-campo="concorrente" value="${(l.concorrente || '').replace(/"/g, '&quot;')}" placeholder="Nome do concorrente" aria-label="Concorrente"></td>
              <td class="num"><input id="preco-${n}" data-linha="${n}" data-campo="preco" inputmode="decimal" value="${formatarPreco(l.preco)}" placeholder="R$ 0,00" aria-label="Preço"></td>
              <td class="num"><input id="medio-${n}" data-linha="${n}" data-campo="precoMedio" inputmode="decimal" value="${formatarPreco(l.precoMedio)}" placeholder="R$ 0,00" aria-label="Preço médio"></td>
              <td><button class="remover" data-linha="${n}" aria-label="Remover linha" title="Remover linha">&times;</button></td>
            </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr>
            <th>Média geral</th>
            <td class="num" id="media-preco">${formatarPreco(media(linhas.map((l) => l.preco))) || '—'}</td>
            <td class="num" id="media-medio">${formatarPreco(media(linhas.map((l) => l.precoMedio))) || '—'}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <button class="adicionar" id="adicionar-linha">+ Adicionar concorrente</button>`;

  const atualizarMedias = () => {
    container.querySelector('#media-preco').textContent = formatarPreco(media(linhas.map((l) => l.preco))) || '—';
    container.querySelector('#media-medio').textContent = formatarPreco(media(linhas.map((l) => l.precoMedio))) || '—';
  };

  container.querySelectorAll('input').forEach((input) => {
    const { linha, campo } = input.dataset;
    input.addEventListener('input', () => {
      linhas[linha][campo] = campo === 'concorrente' ? input.value : lerPreco(input.value);
      salvarPrecos(produtoAtual.id, linhas);
      atualizarMedias();
    });
    if (campo !== 'concorrente') {
      input.addEventListener('blur', () => {
        input.value = formatarPreco(linhas[linha][campo]);
      });
    }
  });

  container.querySelectorAll('.remover').forEach((b) => {
    b.addEventListener('click', () => {
      linhas.splice(Number(b.dataset.linha), 1);
      salvarPrecos(produtoAtual.id, linhas);
      renderTabelaPrecos(container);
    });
  });

  container.querySelector('#adicionar-linha').addEventListener('click', () => {
    linhas.push({ concorrente: '', preco: null, precoMedio: null });
    salvarPrecos(produtoAtual.id, linhas);
    renderTabelaPrecos(container);
    container.querySelector(`#conc-${linhas.length - 1}`).focus();
  });
}

// ---------- Navegação ----------

function rotear() {
  etapaSelecionada = null;
  const match = location.hash.match(/^#(.+)$/);
  const produto = match && PRODUTOS.find((p) => p.id === decodeURIComponent(match[1]));

  document.getElementById('tela-portfolio').hidden = !!produto;
  document.getElementById('tela-produto').hidden = !produto;

  if (produto) {
    produtoAtual = produto;
    renderProduto(produto);
    renderPainel();
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
  renderPainel();
});

window.addEventListener('hashchange', rotear);

rotear();
