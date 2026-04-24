// dados globais do pedido
const carrinho = {};
const dadosCliente = { nome: '', mesa: '' };

// número do pedido vai de 1 a 50 e reinicia
// localStorage guarda o valor mesmo se a página for recarregada
let numeroPedido = parseInt(localStorage.getItem('numeroPedido') || '0');


// atualiza a barra vermelha do rodapé com quantidade e total
function atualizarBarraDoCarrinho() {
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


// fritas só podem ser adicionadas se houver ao menos 1 burger no carrinho
function verificarSeFritasEstaLiberada() {
  const burgers = [
    'Burguer 120g',
    'Burguer Duplo 120g',
    'Burguer Duplo Especial Colarinho'
  ];

  const temBurger = burgers.some(nome => carrinho[nome] && carrinho[nome].qtd > 0);
  const botoesMais = document.querySelectorAll('.item[data-nome="Adicional de fritas"] .btn-mais');

  if (!botoesMais.length) return;

  if (!temBurger) {
    botoesMais.forEach(btn => btn.disabled = true);
    if (carrinho['Adicional de fritas']) {
      delete carrinho['Adicional de fritas'];
      document.querySelectorAll('.item[data-nome="Adicional de fritas"] .item-qtd')
        .forEach(el => el.textContent = '0');
      document.querySelectorAll('.item[data-nome="Adicional de fritas"] .btn-menos')
        .forEach(btn => btn.disabled = true);
      atualizarBarraDoCarrinho();
    }
  } else {
    botoesMais.forEach(btn => btn.disabled = false);
  }
}


// chamada pelos botões + e - de cada produto
// delta: +1 para adicionar, -1 para remover
function adicionarOuRemoverItem(nome, preco, delta) {
  if (!carrinho[nome]) {
    carrinho[nome] = { preco: parseFloat(preco), qtd: 0 };
  }

  carrinho[nome].qtd += delta;

  if (carrinho[nome].qtd <= 0) {
    delete carrinho[nome];
  }

  // usa querySelectorAll para funcionar mesmo quando o produto
  // aparece em mais de uma aba (ex: Orloff em Doses e Combos)
  document.querySelectorAll(`.item[data-nome="${nome}"]`).forEach(itemEl => {
    const qtdEl = itemEl.querySelector('.item-qtd');
    const btnMenos = itemEl.querySelector('.btn-menos');
    const qtd = carrinho[nome]?.qtd || 0;
    if (qtdEl) qtdEl.textContent = qtd;
    if (btnMenos) btnMenos.disabled = qtd === 0;
  });

  verificarSeFritasEstaLiberada();
  atualizarBarraDoCarrinho();

  if (document.getElementById('modal-carrinho').classList.contains('ativo')) {
    mostrarItensDoCarrinho();
  }
}


// gera a lista de itens dentro do modal do carrinho
function mostrarItensDoCarrinho() {
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
          <button class="btn-carrinho-menos" onclick="adicionarOuRemoverItem('${nome}', ${preco}, -1)">−</button>
          <span class="carrinho-item-qtd">${qtd}</span>
          <button class="btn-carrinho-mais" onclick="adicionarOuRemoverItem('${nome}', ${preco}, +1)">+</button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('total-final').textContent =
    'R$ ' + total.toFixed(2).replace('.', ',');
}


function abrirTelaDoCarrinho() {
  mostrarItensDoCarrinho();
  document.getElementById('modal-carrinho').classList.add('ativo');
  document.getElementById('overlay-carrinho').classList.add('ativo');
}

function fecharTelaDoCarrinho() {
  document.getElementById('modal-carrinho').classList.remove('ativo');
  document.getElementById('overlay-carrinho').classList.remove('ativo');
}


// adiciona os botões + e - em cada item do cardápio ao carregar a página
function criarBotoesDeQuantidade() {
  document.querySelectorAll('.item[data-nome]').forEach(itemEl => {
    const nome = itemEl.dataset.nome;
    const preco = itemEl.dataset.preco;
    const controles = document.createElement('div');
    controles.className = 'item-controles';
    controles.innerHTML = `
      <button class="btn-menos" onclick="adicionarOuRemoverItem('${nome}', ${preco}, -1)" disabled>−</button>
      <span class="item-qtd">0</span>
      <button class="btn-mais" onclick="adicionarOuRemoverItem('${nome}', ${preco}, +1)">+</button>
    `;
    itemEl.appendChild(controles);
  });

  document.querySelectorAll('.item[data-nome="Adicional de fritas"] .btn-mais')
    .forEach(btn => btn.disabled = true);
}


// troca a categoria visível quando o cliente clica nos botões do topo
function trocarCategoria(categoria, botaoClicado) {
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
    cardAlvo.getBoundingClientRect(); // força o navegador calcular antes da animação
    cardAlvo.classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


// roda uma vez quando a página termina de carregar
window.addEventListener('load', () => {
  criarBotoesDeQuantidade();

  document.querySelectorAll('.card').forEach(card => {
    card.style.display = 'none';
    card.classList.remove('show');
  });

  const cardDrinks = document.querySelector('[data-categoria="drinks"]');
  if (cardDrinks) {
    cardDrinks.style.display = 'block';
    cardDrinks.getBoundingClientRect();
    cardDrinks.classList.add('show');
  }
});


// popup de promoção: abre 1 segundo após carregar a página
const popup = document.getElementById('popup');

window.addEventListener('load', () => {
  setTimeout(() => popup.classList.add('ativo'), 1000);
});

function fecharAnuncio() {
  popup.classList.remove('ativo');
}

popup.addEventListener('click', function (e) {
  if (e.target === this) fecharAnuncio();
});


// --- FLUXO DE PAGAMENTO ---

// abre a tela de identificação (nome e mesa)
function comecarPedido() {
  fecharTelaDoCarrinho();
  document.getElementById('input-nome-cliente').value = '';
  document.getElementById('input-mesa').value = '';
  document.getElementById('identificacao-erro').textContent = '';
  document.getElementById('modal-identificacao').classList.add('ativo');
  document.getElementById('overlay-identificacao').classList.add('ativo');
}

function fecharTelaDeDados() {
  document.getElementById('modal-identificacao').classList.remove('ativo');
  document.getElementById('overlay-identificacao').classList.remove('ativo');
}


// valida os dados e avança para o pix
function confirmarDadosEIrParaPix() {
  const nome = document.getElementById('input-nome-cliente').value.trim();
  const mesa = document.getElementById('input-mesa').value.trim();
  const erro = document.getElementById('identificacao-erro');

  if (!nome) { erro.textContent = '⚠️ Por favor, informe seu nome.'; return; }
  if (!mesa) { erro.textContent = '⚠️ Por favor, selecione o número da mesa.'; return; }

  erro.textContent = '';
  dadosCliente.nome = nome;
  dadosCliente.mesa = mesa;

  fecharTelaDeDados();
  abrirTelaDepagamentoPix();
}


// gera o qrcode via Mercado Pago e abre a tela de pagamento
async function abrirTelaDepagamentoPix() {
  const total = Object.values(carrinho).reduce((s, i) => s + i.preco * i.qtd, 0);

  document.getElementById('pix-valor').textContent =
    'R$ ' + total.toFixed(2).replace('.', ',');

  // mostra o qrcode box com loading enquanto gera
  const box = document.querySelector('.pix-qrcode-box');
  box.innerHTML = '<div class="pix-loading">Gerando QR Code... ⏳</div>';

  document.getElementById('modal-pix').classList.add('ativo');
  document.getElementById('overlay-pix').classList.add('ativo');

  // monta a descrição do pedido para enviar ao Mercado Pago
  const itens = Object.entries(carrinho);
  let listaItens = '';
  itens.forEach(([nome, { qtd }]) => {
    listaItens += `${nome} x${qtd} | `;
  });

  const descricao =
    `Mesa ${dadosCliente.mesa} | ${dadosCliente.nome} | ${listaItens}Total R$ ${total.toFixed(2)}`;

  try {
    // chama a função serverless do Vercel que cria o pagamento no Mercado Pago
    const resposta = await fetch('/api/criar-pagamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valor: total,
        descricao: descricao,
        nomecliente: dadosCliente.nome,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      box.innerHTML = '<div class="pix-erro">❌ Erro ao gerar QR Code. Tente novamente.</div>';
      return;
    }

    // salva o id do pagamento para verificar depois
    window.pagamentoAtualId = dados.id;

    // exibe o QR Code como imagem (base64 vindo do Mercado Pago)
    box.innerHTML = `<img src="data:image/png;base64,${dados.qrcode_base64}" alt="QR Code Pix" style="width:200px;height:200px;">`;

    // atualiza a chave pix copiável com o código real do pix copia e cola
    document.querySelector('.pix-chave-texto').textContent = dados.qrcode;

    // inicia a verificação automática do pagamento a cada 5 segundos
    iniciarVerificacaoDePagamento(dados.id);

  } catch (erro) {
    console.error('Erro ao gerar pagamento:', erro);
    box.innerHTML = '<div class="pix-erro">❌ Erro de conexão. Tente novamente.</div>';
  }
}

function fecharTelaDePagamentoPix() {
  document.getElementById('modal-pix').classList.remove('ativo');
  document.getElementById('overlay-pix').classList.remove('ativo');
  // para a verificação automática ao fechar
  pararVerificacaoDePagamento();
}

// copia o código pix copia e cola para a área de transferência
function copiarChavePix() {
  const chave = document.querySelector('.pix-chave-texto').textContent;
  navigator.clipboard.writeText(chave).then(() => {
    const btn = document.querySelector('.btn-copiar');
    btn.textContent = '✅ Copiado!';
    setTimeout(() => btn.textContent = '📋 Copiar', 2000);
  });
}


// verifica automaticamente se o pagamento foi aprovado
// checa a cada 5 segundos consultando o Mercado Pago
let intervaloVerificacao = null;

function iniciarVerificacaoDePagamento(idPagamento) {
  pararVerificacaoDePagamento(); // garante que não tem outro intervalo rodando

  intervaloVerificacao = setInterval(async () => {
    try {
      const resposta = await fetch(`/api/verificar-pagamento?id=${idPagamento}`);
      const dados = await resposta.json();

      if (dados.status === 'approved') {
        pararVerificacaoDePagamento();
        fecharTelaDePagamentoPix();
        enviarPedidoNoWhatsApp(); // envia para o whatsapp e mostra comprovante
      }
    } catch (erro) {
      console.error('Erro ao verificar pagamento:', erro);
    }
  }, 5000); // verifica a cada 5 segundos
}

function pararVerificacaoDePagamento() {
  if (intervaloVerificacao) {
    clearInterval(intervaloVerificacao);
    intervaloVerificacao = null;
  }
}


// gera o payload no padrão oficial do Banco Central (EMV + CRC16)
function gerarCodigoQrcodePix(chave, nome, cidade, valor) {
  function campo(id, conteudo) {
    const tamanho = String(conteudo.length).padStart(2, '0');
    return `${id}${tamanho}${conteudo}`;
  }

  const infoRecebedor = campo('26',
    campo('00', 'br.gov.bcb.pix') +
    campo('01', chave)
  );

  const payloadSemCRC =
    campo('00', '01') +
    infoRecebedor +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', valor.toFixed(2)) +
    campo('58', 'BR') +
    campo('59', nome.substring(0, 25).toUpperCase()) +
    campo('60', cidade.substring(0, 15).toUpperCase()) +
    campo('62', campo('05', '***')) +
    '6304';

  function calcularCRC16(texto) {
    let crc = 0xFFFF;
    for (let i = 0; i < texto.length; i++) {
      crc ^= texto.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  return payloadSemCRC + calcularCRC16(payloadSemCRC);
}


// monta a mensagem e envia para o whatsapp do atendente
function enviarPedidoNoWhatsApp() {
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

  const numeroWhatsApp = '51996830150';
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

  window.open(urlWhatsApp, '_blank');
  fecharTelaDePagamentoPix();
  mostrarComprovanteDoCliente(numeroPedidoFormatado, data, hora, total, itens);
}


// exibe o comprovante final para o cliente com os dados do pedido
function mostrarComprovanteDoCliente(numeroPedidoFormatado, data, hora, total, itens) {
  document.getElementById('conf-numero-pedido').textContent = `#${numeroPedidoFormatado}`;
  document.getElementById('conf-nome-cliente').textContent = dadosCliente.nome;
  document.getElementById('conf-mesa').textContent = dadosCliente.mesa;
  document.getElementById('conf-data-hora').textContent = `${data} às ${hora}`;
  document.getElementById('conf-total').textContent =
    'R$ ' + total.toFixed(2).replace('.', ',');

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


// fecha o comprovante e reseta tudo para um novo pedido
function fecharTelaDeConfirmacao() {
  document.getElementById('modal-confirmacao-final').classList.remove('ativo');
  document.getElementById('overlay-confirmacao-final').classList.remove('ativo');

  Object.keys(carrinho).forEach(nome => delete carrinho[nome]);
  document.querySelectorAll('.item-qtd').forEach(el => el.textContent = '0');
  document.querySelectorAll('.btn-menos').forEach(btn => btn.disabled = true);
  document.querySelectorAll('.item[data-nome="Adicional de fritas"] .btn-mais')
    .forEach(btn => btn.disabled = true);

  dadosCliente.nome = '';
  dadosCliente.mesa = '';
  atualizarBarraDoCarrinho();
}
