/* ==============================================
   ARQUIVO: java.js
   DESCRIÇÃO: Lógica interativa do Cardápio Digital
   do Colarinho Lounge Bar.
   Fluxo completo: Carrinho → Identificação →
   Pix → Comprovante → WhatsApp → Confirmação
================================================ */


/* ==============================================
   DADOS GLOBAIS DA SESSÃO
   Variáveis que guardam as informações do pedido
   durante todo o fluxo, do carrinho até o envio.
================================================ */

// Carrinho: objeto que guarda os itens escolhidos
// Formato: { "Nome do Item": { preco: 25.00, qtd: 2 } }
const carrinho = {};

// Dados do cliente — preenchidos na Etapa 2
// Usados depois na Etapa 8 (WhatsApp) e Etapa 9 (confirmação)
const dadosCliente = {
  nome: '',   // Nome digitado pelo cliente
  mesa: ''    // Número da mesa digitado pelo cliente
};

// Número do pedido — vai de 1 até 50 e reinicia
let numeroPedido = parseInt(localStorage.getItem('numeroPedido') || '0');


/* ==============================================
   CARRINHO DE PEDIDOS
================================================ */

function atualizarBarra() {
  const itens = Object.values(carrinho);
  const totalQtd = itens.reduce((soma, item) => soma + item.qtd, 0);
  const totalValor = itens.reduce((soma, item) => soma + item.preco * item.qtd, 0);
  const barra = document.getElementById('barra-carrinho');

  document.getElementById('carrinho-qtd').textContent =
    totalQtd === 1 ? '1 item' : `${totalQtd} itens`;
  document.getElementById('carrinho-total').textContent =
    'R$ ' + totalValor.toFixed(2).replace('.', ',');

  if (totalQtd > 0) {
    barra.classList.add('visivel');
  } else {
    barra.classList.remove('visivel');
  }
}

/* ----------------------------------------------
   atualizarFritas()
   Libera ou bloqueia o adicional de fritas
   dependendo se há burger no carrinho.
---------------------------------------------- */
function atualizarFritas() {
  const burgers = [
    'Burguer 120g',
    'Burguer Duplo 120g',
    'Burguer Duplo Especial Colarinho'
  ];

  const temBurger = burgers.some(nome => carrinho[nome] && carrinho[nome].qtd > 0);
  const botoesMaisFritas = document.querySelectorAll(
    '.item[data-nome="Adicional de fritas"] .btn-mais'
  );

  if (!botoesMaisFritas.length) return;

  if (!temBurger) {
    botoesMaisFritas.forEach(btn => btn.disabled = true);
    if (carrinho['Adicional de fritas']) {
      delete carrinho['Adicional de fritas'];
      document.querySelectorAll('.item[data-nome="Adicional de fritas"] .item-qtd')
        .forEach(el => el.textContent = '0');
      document.querySelectorAll('.item[data-nome="Adicional de fritas"] .btn-menos')
        .forEach(btn => btn.disabled = true);
      atualizarBarra();
    }
  } else {
    botoesMaisFritas.forEach(btn => btn.disabled = false);
  }
}

/* ----------------------------------------------
   alterarQtd(nome, preco, delta)
   Adiciona (+1) ou remove (-1) um item do carrinho.
---------------------------------------------- */
function alterarQtd(nome, preco, delta) {
  if (!carrinho[nome]) {
    carrinho[nome] = { preco: parseFloat(preco), qtd: 0 };
  }
  carrinho[nome].qtd += delta;
  if (carrinho[nome].qtd <= 0) {
    delete carrinho[nome];
  }

  // Atualiza visual de TODOS os elementos com esse nome
  document.querySelectorAll(`.item[data-nome="${nome}"]`).forEach(itemEl => {
    const qtdEl = itemEl.querySelector('.item-qtd');
    const btnMenos = itemEl.querySelector('.btn-menos');
    const qtd = carrinho[nome]?.qtd || 0;
    if (qtdEl) qtdEl.textContent = qtd;
    if (btnMenos) btnMenos.disabled = qtd === 0;
  });

  atualizarFritas();
  atualizarBarra();

  if (document.getElementById('modal-carrinho').classList.contains('ativo')) {
    renderizarModal();
  }
}

/* ----------------------------------------------
   renderizarModal()
   Gera a lista de itens no modal do carrinho.
---------------------------------------------- */
function renderizarModal() {
  const lista = document.getElementById('lista-carrinho');
  const itens = Object.entries(carrinho);

  if (itens.length === 0) {
    lista.innerHTML = '<div class="carrinho-vazio">😶 Nenhum item no pedido ainda</div>';
    document.getElementById('total-final').textContent = 'R$ 0,00';
    return;
  }

  let total = 0;
  lista.innerHTML = itens.map(([nome, { preco, qtd }]) => {
    const subtotal = preco * qtd;
    total += subtotal;
    return `
      <div class="item-carrinho">
        <div class="item-carrinho-info">
          <div class="item-carrinho-nome">${nome}</div>
          <div class="item-carrinho-preco">
            R$ ${preco.toFixed(2).replace('.', ',')} × ${qtd} = R$ ${subtotal.toFixed(2).replace('.', ',')}
          </div>
        </div>
        <div class="item-carrinho-controles">
          <button class="btn-carrinho-menos" onclick="alterarQtd('${nome}', ${preco}, -1)">−</button>
          <span class="carrinho-item-qtd">${qtd}</span>
          <button class="btn-carrinho-mais" onclick="alterarQtd('${nome}', ${preco}, +1)">+</button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('total-final').textContent =
    'R$ ' + total.toFixed(2).replace('.', ',');
}

function abrirCarrinho() {
  renderizarModal();
  document.getElementById('modal-carrinho').classList.add('ativo');
  document.getElementById('overlay-carrinho').classList.add('ativo');
}

function fecharCarrinho() {
  document.getElementById('modal-carrinho').classList.remove('ativo');
  document.getElementById('overlay-carrinho').classList.remove('ativo');
}


/* ==============================================
   ETAPA 1 → 2
   Cliente clica em "Finalizar e Pagar no Pix"
   → abre o modal de identificação
================================================ */
function iniciarFluxo() {
  fecharCarrinho();
  document.getElementById('input-nome-cliente').value = '';
  document.getElementById('input-mesa').value = '';
  document.getElementById('identificacao-erro').textContent = '';
  document.getElementById('modal-identificacao').classList.add('ativo');
  document.getElementById('overlay-identificacao').classList.add('ativo');
}

function fecharIdentificacao() {
  document.getElementById('modal-identificacao').classList.remove('ativo');
  document.getElementById('overlay-identificacao').classList.remove('ativo');
}


/* ==============================================
   ETAPA 2 → 3 → 4
   Cliente preenche nome e mesa → salva na variável
   dadosCliente → abre o modal do Pix
================================================ */
function avancarParaPix() {
  const nome = document.getElementById('input-nome-cliente').value.trim();
  const mesa = document.getElementById('input-mesa').value.trim();
  const erro = document.getElementById('identificacao-erro');

  // Validações
  if (!nome) {
    erro.textContent = '⚠️ Por favor, informe seu nome.';
    return;
  }
  if (!mesa) {
    erro.textContent = '⚠️ Por favor, selecione o número da mesa.';
    return;
  }

  erro.textContent = '';

  // ETAPA 3 — Salva os dados do cliente no objeto dadosCliente
  // Esses dados serão usados na Etapa 8 (WhatsApp) e Etapa 9 (confirmação)
  dadosCliente.nome = nome;
  dadosCliente.mesa = mesa;

  fecharIdentificacao();
  abrirPix(); // ETAPA 4
}


/* ==============================================
   ETAPA 4 — MODAL DO PIX
   Gera o QR Code com o valor total do pedido.
================================================ */
function abrirPix() {
  const total = Object.values(carrinho).reduce((s, i) => s + i.preco * i.qtd, 0);

  document.getElementById('pix-valor').textContent =
    'R$ ' + total.toFixed(2).replace('.', ',');

  const box = document.querySelector('.pix-qrcode-box');
  box.innerHTML = '<div id="qrcode-gerado"></div>';

  const payload = gerarPayloadPix('04010003030', 'Colarinho Louge Bar', 'Novo Hamburgo', total);

  new QRCode(document.getElementById('qrcode-gerado'), {
    text: payload,
    width: 200, height: 200,
    colorDark: '#000000', colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  document.getElementById('modal-pix').classList.add('ativo');
  document.getElementById('overlay-pix').classList.add('ativo');
}

function fecharPix() {
  document.getElementById('modal-pix').classList.remove('ativo');
  document.getElementById('overlay-pix').classList.remove('ativo');
}

function copiarChave() {
  navigator.clipboard.writeText('04010003030').then(() => {
    const btn = document.querySelector('.btn-copiar');
    btn.textContent = '✅ Copiado!';
    setTimeout(() => btn.textContent = '📋 Copiar', 2000);
  });
}

/* ----------------------------------------------
   gerarPayloadPix — formato oficial Banco Central
---------------------------------------------- */
function gerarPayloadPix(chave, nome, cidade, valor) {
  function campo(id, v) {
    const t = String(v.length).padStart(2, '0');
    return `${id}${t}${v}`;
  }
  const merchantInfo = campo('26', campo('00', 'br.gov.bcb.pix') + campo('01', chave));
  const payloadSemCRC =
    campo('00', '01') + merchantInfo + campo('52', '0000') +
    campo('53', '986') + campo('54', valor.toFixed(2)) +
    campo('58', 'BR') + campo('59', nome.substring(0, 25).toUpperCase()) +
    campo('60', cidade.substring(0, 15).toUpperCase()) +
    campo('62', campo('05', '***')) + '6304';

  function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }
  return payloadSemCRC + crc16(payloadSemCRC);
}


/* ==============================================
   ETAPA 5 — MODAL DE ANEXAR COMPROVANTE
   Cliente anexa o print do comprovante do Pix.
================================================ */
function abrirComprovante() {
  fecharPix();
  document.getElementById('modal-comprovante').classList.add('ativo');
  document.getElementById('overlay-comprovante').classList.add('ativo');
}

function fecharComprovante() {
  document.getElementById('modal-comprovante').classList.remove('ativo');
  document.getElementById('overlay-comprovante').classList.remove('ativo');
}


/* ==============================================
   ETAPA 6 e 7 — ENVIAR PEDIDO PELO WHATSAPP
================================================ */
function enviarPedido() {
  // ETAPA 8 — Incrementa o número do pedido (1 a 50, depois reinicia)
  numeroPedido = (numeroPedido % 50) + 1;
  localStorage.setItem('numeroPedido', numeroPedido);

  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const numeroPedidoFormatado = String(numeroPedido).padStart(3, '0');

  const itens = Object.entries(carrinho);
  let total = 0;
  let listaItens = '';
  itens.forEach(([nome, { preco, qtd }]) => {
    const subtotal = preco * qtd;
    total += subtotal;
    listaItens += `• ${nome} x${qtd} = R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
  });

  // Monta a mensagem para o WhatsApp
  const mensagem =
    `🍺 *NOVO PEDIDO - Colarinho Lounge Bar*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📋 *Pedido Nº: #${numeroPedidoFormatado}*\n` +
    `📅 Data: ${data} às ${hora}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 Cliente: ${dadosCliente.nome}\n` +
    `🪑 Mesa: ${dadosCliente.mesa}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🛒 *Itens do Pedido:*\n${listaItens}` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ Pagamento via Pix realizado.\n` +
    `📎 *Comprovante anexado abaixo.*`;

  // ⚠️ Substitua SEUNUMERO pelo número real (ex: 5551999999999)
  const numeroWhatsApp = 'SEUNUMERO';
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

  window.open(urlWhatsApp, '_blank');

  fecharPix();
  abrirConfirmacaoFinal(numeroPedidoFormatado, data, hora, total, itens);
}


/* ==============================================
   ETAPA 9 — CONFIRMAÇÃO FINAL PARA O CLIENTE
   Mostra o comprovante com todos os dados
   do pedido e mensagem de aguardar na mesa.
================================================ */
function abrirConfirmacaoFinal(numeroPedidoFormatado, data, hora, total, itens) {
  // Preenche os dados do comprovante
  document.getElementById('conf-numero-pedido').textContent = `#${numeroPedidoFormatado}`;
  document.getElementById('conf-nome-cliente').textContent = dadosCliente.nome;
  document.getElementById('conf-mesa').textContent = dadosCliente.mesa;
  document.getElementById('conf-data-hora').textContent = `${data} às ${hora}`;
  document.getElementById('conf-total').textContent =
    'R$ ' + total.toFixed(2).replace('.', ',');

  // Gera a lista de itens do comprovante
  document.getElementById('conf-itens').innerHTML = itens.map(([nome, { preco, qtd }]) => {
    const subtotal = preco * qtd;
    return `
      <div class="nota-item">
        <div class="nota-item-info">
          <span class="nota-item-nome">${nome}</span>
          <span class="nota-item-qtd">x${qtd}</span>
        </div>
        <span class="nota-item-preco">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
      </div>
    `;
  }).join('');

  document.getElementById('modal-confirmacao-final').classList.add('ativo');
  document.getElementById('overlay-confirmacao-final').classList.add('ativo');
}

function fecharConfirmacaoFinal() {
  document.getElementById('modal-confirmacao-final').classList.remove('ativo');
  document.getElementById('overlay-confirmacao-final').classList.remove('ativo');

  // Zera o carrinho e reseta tudo para novo pedido
  Object.keys(carrinho).forEach(nome => delete carrinho[nome]);
  document.querySelectorAll('.item-qtd').forEach(el => el.textContent = '0');
  document.querySelectorAll('.btn-menos').forEach(btn => btn.disabled = true);
  document.querySelectorAll('.item[data-nome="Adicional de fritas"] .btn-mais')
    .forEach(btn => btn.disabled = true);

  // Limpa os dados do cliente para o próximo pedido
  dadosCliente.nome = '';
  dadosCliente.mesa = '';
  arquivoComprovante = null;

  atualizarBarra();
}


/* ==============================================
   BOTÕES + / − EM CADA ITEM DO CARDÁPIO
================================================ */
function inicializarBotoes() {
  document.querySelectorAll('.item[data-nome]').forEach(itemEl => {
    const nome = itemEl.dataset.nome;
    const preco = itemEl.dataset.preco;
    const controles = document.createElement('div');
    controles.className = 'item-controles';
    controles.innerHTML = `
      <button class="btn-menos" onclick="alterarQtd('${nome}', ${preco}, -1)" disabled>−</button>
      <span class="item-qtd">0</span>
      <button class="btn-mais" onclick="alterarQtd('${nome}', ${preco}, +1)">+</button>
    `;
    itemEl.appendChild(controles);
  });

  // Fritas bloqueadas ao iniciar
  document.querySelectorAll('.item[data-nome="Adicional de fritas"] .btn-mais')
    .forEach(btn => btn.disabled = true);
}


/* ==============================================
   NAVEGAÇÃO POR CATEGORIAS
================================================ */
function mostrarCategoria(categoria, botaoClicado) {
  document.querySelectorAll('.card').forEach(card => {
    card.classList.remove('show');
    setTimeout(() => {
      if (!card.classList.contains('show')) card.style.display = 'none';
    }, 400);
  });

  document.querySelectorAll('.btn-categoria').forEach(btn => btn.classList.remove('ativo'));
  botaoClicado.classList.add('ativo');
  botaoClicado.scrollIntoView({ inline: 'center', behavior: 'smooth' });

  const cardAlvo = document.querySelector(`[data-categoria="${categoria}"]`);
  if (cardAlvo) {
    cardAlvo.style.display = 'block';
    cardAlvo.getBoundingClientRect();
    cardAlvo.classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


/* ==============================================
   INICIALIZAÇÃO DA PÁGINA
================================================ */
window.addEventListener('load', () => {
  inicializarBotoes();

  document.querySelectorAll('.card').forEach(card => {
    card.style.display = 'none';
    card.classList.remove('show');
  });

  const primeiro = document.querySelector('[data-categoria="drinks"]');
  if (primeiro) {
    primeiro.style.display = 'block';
    primeiro.getBoundingClientRect();
    primeiro.classList.add('show');
  }
});


/* ==============================================
   POPUP DE PROMOÇÃO
================================================ */
const popup = document.getElementById('popup');

window.addEventListener('load', () => {
  setTimeout(() => popup.classList.add('ativo'), 1000);
});

function fecharPopup() {
  popup.classList.remove('ativo');
}

popup.addEventListener('click', function(e) {
  if (e.target === this) fecharPopup();
});
