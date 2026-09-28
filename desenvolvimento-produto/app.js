const CHAVE_STORAGE = 'desenvolvimento-produto:etapas';
const CHAVE_PRECOS = 'desenvolvimento-produto:precos';
const CHAVE_REQUISITOS = 'desenvolvimento-produto:requisitos';
const ETAPA_PESQUISA = ETAPAS.indexOf('Pesquisa de mercado');
const ETAPA_REQUISITOS = ETAPAS.indexOf('Definição de Requisitos técnicos');

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
  // Registros salvos antes da remoção da etapa "Integração Indiana" (a última) tinham uma etapa a mais.
  if (Array.isArray(salvo) && salvo.length === ETAPAS.length + 1) return salvo.slice(0, ETAPAS.length);
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
  return Array.isArray(salvo) && salvo.length ? salvo : [{ concorrente: '', preco: null }];
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

// Planilha de requisitos técnicos: uma matriz de textos por produto.
function planilhaNova() {
  const cabecalho = ['Requisito', 'Especificação', 'Unidade', 'Observação', ''];
  return [cabecalho, ...Array.from({ length: 9 }, () => Array(cabecalho.length).fill(''))];
}

function requisitosDoProduto(id) {
  try {
    const salvo = (JSON.parse(localStorage.getItem(CHAVE_REQUISITOS)) || {})[id];
    if (Array.isArray(salvo) && salvo.length && Array.isArray(salvo[0])) return salvo;
  } catch {
    // Ignora dados inválidos e começa uma planilha nova.
  }
  return planilhaNova();
}

function salvarRequisitos(id, grade) {
  try {
    const todos = JSON.parse(localStorage.getItem(CHAVE_REQUISITOS)) || {};
    todos[id] = grade;
    localStorage.setItem(CHAVE_REQUISITOS, JSON.stringify(todos));
  } catch {
    // Sem armazenamento disponível: as alterações valem só nesta sessão.
  }
}

// ---------- Ilustrações ----------

const ROSCA = (x, y, r) => `
  <circle cx="${x}" cy="${y}" r="${r}" fill="var(--pneu)"/>
  <circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="var(--aro)"/>`;

const DESENHOS = {
  // Empilhadeira retrátil: mastro alto, braços estabilizadores e operador em pé.
  retratil: (cor) => `
    <rect x="30" y="2" width="4" height="66" fill="var(--metal-escuro)"/>
    <rect x="36" y="2" width="4" height="66" fill="var(--metal-claro)"/>
    <rect x="10" y="60" width="26" height="3" fill="var(--metal-escuro)"/>
    <rect x="6" y="70" width="44" height="4" rx="2" fill="var(--metal-escuro)"/>
    <path d="M58 20 H82 V40 H58 Z" fill="none" stroke="var(--metal-escuro)" stroke-width="3"/>
    <path d="M44 40 H96 a6 6 0 0 1 6 6 V68 H44 Z" fill="${cor}"/>
    <rect x="62" y="44" width="16" height="4" rx="1" fill="var(--pneu)"/>
    ${ROSCA(14, 72, 5)}${ROSCA(88, 70, 8)}`,

  // Empilhadeira 3 rodas: compacta, com uma única roda traseira.
  'tres-rodas': (cor) => `
    <rect x="20" y="6" width="4" height="60" fill="var(--metal-escuro)"/>
    <rect x="26" y="6" width="4" height="60" fill="var(--metal-claro)"/>
    <rect x="4" y="64" width="30" height="3" fill="var(--metal-escuro)"/>
    <path d="M42 24 L68 24 L76 42 L42 42 Z" fill="none" stroke="var(--metal-escuro)" stroke-width="3"/>
    <rect x="54" y="32" width="10" height="7" rx="2" fill="var(--pneu)"/>
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

let filtroLinha = 'todos';

function renderFiltros() {
  const filtros = document.getElementById('filtros');
  const opcoes = [
    { id: 'todos', nome: 'Todos', total: PRODUTOS.length },
    ...LINHAS.map((l) => ({ ...l, total: PRODUTOS.filter((p) => p.linha === l.id).length })),
  ];
  filtros.innerHTML = opcoes.map((o) => `
    <button class="filtro ${o.id === filtroLinha ? 'ativo' : ''}" data-linha="${o.id}" aria-pressed="${o.id === filtroLinha}">
      ${o.nome} <span>${o.total}</span>
    </button>`).join('');
  filtros.querySelectorAll('.filtro').forEach((b) => {
    b.addEventListener('click', () => {
      filtroLinha = b.dataset.linha;
      renderPortfolio();
    });
  });
}

function cardProduto(produto, numero) {
  const lista = statusDoProduto(produto.id);
  const pct = progresso(lista);
  const linha = LINHAS.find((l) => l.id === produto.linha);

  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;
  card.innerHTML = `
    <div class="card-imagem">
      ${desenhoSVG(produto)}
      <span class="card-numero">${String(numero).padStart(2, '0')}</span>
    </div>
    <div class="card-info">
      <p class="card-linha">${linha.nome}</p>
      <p class="card-modelo">${produto.nome}</p>
      <p class="card-etapa">Etapa atual: <strong>${etapaAtual(lista)}</strong></p>
      <div class="card-progresso">
        <div class="progresso-barra mini"><div style="width:${pct}%"></div></div>
        <span>${pct}%</span>
      </div>
      <div class="card-rodape">
        <span>Acessar etapas</span>
        <span class="card-seta" aria-hidden="true">&rarr;</span>
      </div>
    </div>`;
  const abrir = () => { location.hash = produto.id; };
  card.addEventListener('click', abrir);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
  });
  return card;
}

function renderPortfolio() {
  renderFiltros();
  const container = document.getElementById('produtos');
  container.innerHTML = '';

  // Cada linha de produto é uma seção, uma embaixo da outra; os cards ficam lado a lado.
  const linhas = filtroLinha === 'todos' ? LINHAS : LINHAS.filter((l) => l.id === filtroLinha);
  let numero = 0;
  linhas.forEach((linha) => {
    const produtos = PRODUTOS.filter((p) => p.linha === linha.id);
    if (!produtos.length) return;

    const secao = document.createElement('section');
    secao.className = 'linha-secao';
    secao.innerHTML = `
      <h3 class="linha-titulo">${linha.nome} <span>${produtos.length} ${produtos.length === 1 ? 'produto' : 'produtos'}</span></h3>`;
    const grade = document.createElement('div');
    grade.className = 'grade';
    produtos.forEach((produto) => grade.appendChild(cardProduto(produto, ++numero)));
    secao.appendChild(grade);
    container.appendChild(secao);
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
    botao.innerHTML = `<small>${String(i + 1).padStart(2, '0')}</small><span>${nome}</span>`;
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
  const palavras = ETAPAS[i].split(' ');
  const ultima = palavras.pop();
  painel.innerHTML = `
    <div class="painel-topo">
      <h3>${palavras.join(' ')} <span class="destaque">${ultima}</span></h3>
      <button class="fechar" id="fechar-painel" aria-label="Fechar">&times;</button>
    </div>
    <div class="painel-corpo">
      <div class="situacoes" role="group" aria-label="Situação da etapa">
        ${Object.entries(STATUS).map(([chave, { rotulo }]) => `
          <button class="situacao ${lista[i] === chave ? 'ativa' : ''}" data-status="${chave}">
            <span class="amostra ${chave}"></span>${rotulo}
          </button>`).join('')}
      </div>
      <div id="conteudo-etapa" class="cartao-interno"></div>
    </div>`;

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

  const conteudo = document.getElementById('conteudo-etapa');
  if (i === ETAPA_PESQUISA) renderTabelaPrecos(conteudo);
  if (i === ETAPA_REQUISITOS) renderPlanilha(conteudo);
}

function renderTabelaPrecos(container) {
  const linhas = precosDoProduto(produtoAtual.id);

  container.innerHTML = `
    <h4>Preços dos concorrentes</h4>
    <div class="tabela-rolagem">
      <table class="tabela-precos">
        <thead>
          <tr><th>Concorrente</th><th class="col-preco" colspan="2">Preço</th></tr>
        </thead>
        <tbody>
          ${linhas.map((l, n) => `
            <tr class="${!l.concorrente && l.preco == null ? 'vazia' : ''}">
              <td><input id="conc-${n}" data-linha="${n}" data-campo="concorrente" value="${(l.concorrente || '').replace(/"/g, '&quot;')}" placeholder="Nome do concorrente" aria-label="Concorrente"></td>
              <td class="col-preco"><input id="preco-${n}" data-linha="${n}" data-campo="preco" inputmode="decimal" value="${formatarPreco(l.preco)}" placeholder="R$ 0,00" aria-label="Preço"></td>
              <td><button class="remover" data-linha="${n}" aria-label="Remover linha" title="Remover linha">&times;</button></td>
            </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr>
            <th>Média geral</th>
            <td class="col-preco" id="media-preco" colspan="2">${formatarPreco(media(linhas.map((l) => l.preco))) || '—'}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <button class="adicionar" id="adicionar-linha"><b aria-hidden="true">+</b> Adicionar concorrente</button>`;

  const atualizarMedias = () => {
    container.querySelector('#media-preco').textContent = formatarPreco(media(linhas.map((l) => l.preco))) || '—';
  };

  container.querySelectorAll('input').forEach((input) => {
    const { linha, campo } = input.dataset;
    input.addEventListener('input', () => {
      linhas[linha][campo] = campo === 'concorrente' ? input.value : lerPreco(input.value);
      input.closest('tr').classList.toggle('vazia', !linhas[linha].concorrente && linhas[linha].preco == null);
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
    linhas.push({ concorrente: '', preco: null });
    salvarPrecos(produtoAtual.id, linhas);
    renderTabelaPrecos(container);
    container.querySelector(`#conc-${linhas.length - 1}`).focus();
  });
}

// ---------- Planilha (estilo Excel) ----------

const letraColuna = (n) => {
  let s = '';
  for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

const escaparAttr = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function renderPlanilha(container, foco) {
  const grade = requisitosDoProduto(produtoAtual.id);
  const colunas = grade[0].length;
  const salvar = () => salvarRequisitos(produtoAtual.id, grade);

  container.innerHTML = `
    <h4>Requisitos técnicos</h4>
    <div class="planilha-barra">
      <span class="ref-celula" id="ref-celula">A1</span>
      <button class="planilha-acao" id="add-linha">+ Linha</button>
      <button class="planilha-acao" id="add-coluna">+ Coluna</button>
      <button class="planilha-acao" id="del-linha" ${grade.length <= 1 ? 'disabled' : ''}>− Linha</button>
      <button class="planilha-acao" id="del-coluna" ${colunas <= 1 ? 'disabled' : ''}>− Coluna</button>
    </div>
    <div class="planilha-rolagem">
      <table class="planilha">
        <thead>
          <tr><th class="canto"></th>${grade[0].map((_, c) => `<th data-col="${c}">${letraColuna(c)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${grade.map((linha, r) => `
            <tr>
              <th data-lin="${r}">${r + 1}</th>
              ${linha.map((valor, c) => `<td><input id="cel-${r}-${c}" data-r="${r}" data-c="${c}" value="${escaparAttr(valor)}" aria-label="Célula ${letraColuna(c)}${r + 1}" autocomplete="off"></td>`).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="planilha-dica">Use as setas, Enter e Tab para navegar. Dá para colar células copiadas do Excel. "− Linha" e "− Coluna" apagam a última linha ou coluna.</p>`;

  const celula = (r, c) => container.querySelector(`#cel-${r}-${c}`);
  const focar = (r, c) => {
    const alvo = celula(Math.max(0, Math.min(grade.length - 1, r)), Math.max(0, Math.min(colunas - 1, c)));
    if (alvo) { alvo.focus(); alvo.select(); }
  };

  container.querySelectorAll('.planilha input').forEach((input) => {
    const r = Number(input.dataset.r);
    const c = Number(input.dataset.c);

    input.addEventListener('focus', () => {
      container.querySelector('#ref-celula').textContent = `${letraColuna(c)}${r + 1}`;
      container.querySelectorAll('.planilha .ativo').forEach((el) => el.classList.remove('ativo'));
      container.querySelector(`th[data-col="${c}"]`).classList.add('ativo');
      container.querySelector(`th[data-lin="${r}"]`).classList.add('ativo');
    });

    input.addEventListener('input', () => {
      grade[r][c] = input.value;
      salvar();
    });

    input.addEventListener('keydown', (e) => {
      const noInicio = input.selectionStart === 0 && input.selectionEnd === 0;
      const noFim = input.selectionStart === input.value.length;
      const tudoSelecionado = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      if (e.key === 'ArrowUp') { e.preventDefault(); focar(r - 1, c); }
      else if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) { e.preventDefault(); focar(r + 1, c); }
      else if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); focar(r - 1, c); }
      else if (e.key === 'ArrowLeft' && (noInicio || tudoSelecionado)) { e.preventDefault(); focar(r, c - 1); }
      else if (e.key === 'ArrowRight' && (noFim || tudoSelecionado)) { e.preventDefault(); focar(r, c + 1); }
    });

    // Colar várias células (texto separado por tabulação e quebra de linha, como o Excel copia).
    input.addEventListener('paste', (e) => {
      const texto = e.clipboardData?.getData('text/plain') || '';
      if (!texto.includes('\t') && !texto.trim().includes('\n')) return;
      e.preventDefault();
      const linhas = texto.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((l) => l.split('\t'));
      const largura = Math.max(...linhas.map((l) => l.length));
      while (grade[0].length < c + largura) grade.forEach((l) => l.push(''));
      while (grade.length < r + linhas.length) grade.push(Array(grade[0].length).fill(''));
      linhas.forEach((l, dr) => l.forEach((v, dc) => { grade[r + dr][c + dc] = v; }));
      salvar();
      renderPlanilha(container, [r, c]);
    });
  });

  container.querySelector('#add-linha').addEventListener('click', () => {
    grade.push(Array(colunas).fill(''));
    salvar();
    renderPlanilha(container, [grade.length - 1, 0]);
  });
  container.querySelector('#add-coluna').addEventListener('click', () => {
    grade.forEach((l) => l.push(''));
    salvar();
    renderPlanilha(container, [0, colunas]);
  });
  container.querySelector('#del-linha').addEventListener('click', () => {
    grade.pop();
    salvar();
    renderPlanilha(container);
  });
  container.querySelector('#del-coluna').addEventListener('click', () => {
    grade.forEach((l) => l.pop());
    salvar();
    renderPlanilha(container);
  });

  if (foco) focar(...foco);
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
