/* ==============================================
   Funções deste arquivo:
   - trocarCategoria()
   - fecharAnuncio()
   - Inicialização da página (window load)
   - Inicialização do popup
================================================ */
// -----------------------------------------------
// trocarCategoria(categoria, botaoClicado)
// Chamada quando o cliente toca em um botão
// de categoria (Drinks, Cervejas, Burgers...).
// Esconde a categoria atual e mostra a nova.
// -----------------------------------------------
function trocarCategoria(categoria, botaoClicado) {
  // Esconde todos os cards com animação de saída
  document.querySelectorAll('.card').forEach(card => {
    card.classList.remove('show');

    // Após a animação terminar (400ms), esconde de verdade
    setTimeout(() => {
      if (!card.classList.contains('show')) card.style.display = 'none';
    }, 400);
  });

  // Remove o destaque vermelho de todos os botões
  document.querySelectorAll('.btn-categoria').forEach(btn => btn.classList.remove('ativo'));

  // Deixa o botão clicado destacado em vermelho
  botaoClicado.classList.add('ativo');

  // Centraliza o botão clicado na barra de scroll horizontal
  // Útil quando o botão está no começo ou fim da barra
  botaoClicado.scrollIntoView({ inline: 'center', behavior: 'smooth' });

  // Encontra o card da categoria pelo atributo data-categoria no HTML
  const cardDaCategoria = document.querySelector(`[data-categoria="${categoria}"]`);
  if (cardDaCategoria) {
    cardDaCategoria.style.display = 'block';

    // getBoundingClientRect() força o navegador a "calcular" o elemento
    // antes de iniciar a animação — sem isso a animação pode não funcionar
    cardDaCategoria.getBoundingClientRect();

    // Adiciona a classe 'show' que ativa a animação de entrada (CSS)
    cardDaCategoria.classList.add('show');

    // Rola a página de volta ao topo para o cliente ver o início da categoria
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


// -----------------------------------------------
// INICIALIZAÇÃO DA PÁGINA
// Este bloco roda UMA ÚNICA VEZ quando a página
// termina de carregar completamente.
// -----------------------------------------------
window.addEventListener('load', () => {

  // Cria os botões + e − em todos os itens do cardápio
  criarBotoesDeQuantidade();

  // Esconde todos os cards inicialmente
  document.querySelectorAll('.card').forEach(card => {
    card.style.display = 'none';
    card.classList.remove('show');
  });

  // Mostra apenas a categoria "Drinks" por padrão ao abrir o cardápio
  const cardDrinks = document.querySelector('[data-categoria="drinks"]');
  if (cardDrinks) {
    cardDrinks.style.display = 'block';
    cardDrinks.getBoundingClientRect(); // Força reflow para animação funcionar
    cardDrinks.classList.add('show');
  }
});


// -----------------------------------------------
// POPUP DE PROMOÇÃO
// Abre automaticamente 1 segundo após a página
// carregar, mostrando a promoção do dia.
// -----------------------------------------------
const popup = document.getElementById('popup');

// Abre o popup depois de 1 segundo (1000 milissegundos)
window.addEventListener('load', () => {
  setTimeout(() => popup.classList.add('ativo'), 1000);
});


// -----------------------------------------------
// fecharAnuncio()
// Fecha o popup de promoção.
// Chamada pelo botão × do popup.
// -----------------------------------------------
function fecharAnuncio() {
  popup.classList.remove('ativo');
}

// Fecha o popup ao clicar no fundo escuro (fora da imagem)
// e.target === this verifica se o clique foi no fundo, não na imagem
popup.addEventListener('click', function (e) {
  if (e.target === this) fecharAnuncio();
});
/* ==============================================
  
   DESCRIÇÃO: Variáveis globais que guardam as
   informações do pedido durante todo o fluxo.

================================================ */


// -----------------------------------------------
// CARRINHO
// Objeto que guarda os itens que o cliente escolheu.
//
// carrinho = {
//   "Caipira Vodka": { preco: 25.00, qtd: 2 },
//   "Heineken":      { preco: 17.00, qtd: 1 }
// }
// -----------------------------------------------
const carrinho = {};


// -----------------------------------------------
// DADOS DO CLIENTE
// Guarda o nome e a mesa preenchidos na Etapa 2.
// Usado depois na mensagem do WhatsApp e no comprovante.
// -----------------------------------------------
const dadosCliente = {
  nome: '',  // Ex: "João Silva"
  mesa: ''   // Ex: "5"
};


// -----------------------------------------------
// NÚMERO DO PEDIDO
// Começa em 0 e vai até 50, depois reinicia.
// Salvo no localStorage para não perder ao recarregar a página.
// localStorage é uma memória do navegador que persiste mesmo fechando a aba.
// -----------------------------------------------
let numeroPedido = parseInt(localStorage.getItem('numeroPedido') || '0');
/* ==============================================
   ARQUIVO: carrinho.js
   DESCRIÇÃO: Todas as funções relacionadas ao
   carrinho de compras do cliente.

   Funções deste arquivo:
   - atualizarBarraDoCarrinho()
   - verificarSeFritasEstaLiberada()
   - adicionarOuRemoverItem()
   - mostrarItensDoCarrinho()
   - abrirTelaDoCarrinho()
   - fecharTelaDoCarrinho()
================================================ */


// -----------------------------------------------
// atualizarBarraDoCarrinho()
// Atualiza a barra dourada/vermelha que aparece
// na parte inferior da tela mostrando quantos
// itens há no carrinho e o valor total.
// É chamada sempre que um item é adicionado ou removido.
// -----------------------------------------------
function atualizarBarraDoCarrinho() {
  const itens = Object.values(carrinho);

  // Soma todas as quantidades de todos os itens
  const totalQtd = itens.reduce((soma, item) => soma + item.qtd, 0);

  // Soma o valor total (preço × quantidade de cada item)
  const totalValor = itens.reduce((soma, item) => soma + item.preco * item.qtd, 0);

  const barra = document.getElementById('barra-carrinho');

  // Atualiza o texto: "1 item" ou "3 itens"
  document.getElementById('carrinho-qtd').textContent =
    totalQtd === 1 ? '1 item' : `${totalQtd} itens`;

  // Atualiza o valor em reais com vírgula (ex: R$ 25,00)
  document.getElementById('carrinho-total').textContent =
    'R$ ' + totalValor.toFixed(2).replace('.', ',');

  // Mostra a barra se tiver itens, esconde se estiver vazio
  if (totalQtd > 0) {
    barra.classList.add('visivel');
  } else {
    barra.classList.remove('visivel');
  }
}


// -----------------------------------------------
// verificarSeFritasEstaLiberada()
// O "Adicional de fritas" só pode ser adicionado
// se o cliente tiver pelo menos 1 burger no carrinho.
// Esta função verifica isso e habilita ou bloqueia o botão +.
// -----------------------------------------------
function verificarSeFritasEstaLiberada() {
  // Lista dos burgers que liberam o adicional de fritas
  const burgers = [
    'Burguer 120g',
    'Burguer Duplo 120g',
    'Burguer Duplo Especial Colarinho'
  ];

  // some() retorna true se PELO MENOS UM burger estiver no carrinho
  const temBurger = burgers.some(nome => carrinho[nome] && carrinho[nome].qtd > 0);

  // Seleciona todos os botões + das fritas na página
  const botoesMaisFritas = document.querySelectorAll(
    '.item[data-nome="Adicional de fritas"] .btn-mais'
  );

  if (!botoesMaisFritas.length) return;

  if (!temBurger) {
    // Sem burger → bloqueia o botão + das fritas
    botoesMaisFritas.forEach(btn => btn.disabled = true);

    // Se as fritas já estavam no carrinho, remove automaticamente
    if (carrinho['Adicional de fritas']) {
      delete carrinho['Adicional de fritas'];

      document.querySelectorAll('.item[data-nome="Adicional de fritas"] .item-qtd')
        .forEach(el => el.textContent = '0');
      document.querySelectorAll('.item[data-nome="Adicional de fritas"] .btn-menos')
        .forEach(btn => btn.disabled = true);

      atualizarBarraDoCarrinho();
    }
  } else {
    // Com burger → libera o botão +
    botoesMaisFritas.forEach(btn => btn.disabled = false);
  }
}


// -----------------------------------------------
// adicionarOuRemoverItem(nome, preco, delta)
// Chamada pelos botões + e − de cada produto.
//
// Parâmetros:
//   nome  → nome do produto  (ex: "Caipira Vodka")
//   preco → preço unitário   (ex: 25.00)
//   delta → +1 para adicionar, -1 para remover
// -----------------------------------------------
function adicionarOuRemoverItem(nome, preco, delta) {
  // Cria o item no carrinho se ainda não existir
  if (!carrinho[nome]) {
    carrinho[nome] = { preco: parseFloat(preco), qtd: 0 };
  }

  // Adiciona ou subtrai 1 da quantidade
  carrinho[nome].qtd += delta;

  // Se chegou a 0, remove o item do carrinho completamente
  if (carrinho[nome].qtd <= 0) {
    delete carrinho[nome];
  }

  // Atualiza o número visual em TODOS os elementos com esse nome
  // (usa querySelectorAll para funcionar mesmo quando o mesmo
  // produto aparece em mais de uma aba, ex: Orloff em Doses e Combos)
  document.querySelectorAll(`.item[data-nome="${nome}"]`).forEach(itemEl => {
    const qtdEl = itemEl.querySelector('.item-qtd');
    const btnMenos = itemEl.querySelector('.btn-menos');
    const qtd = carrinho[nome]?.qtd || 0;
    if (qtdEl) qtdEl.textContent = qtd;
    if (btnMenos) btnMenos.disabled = qtd === 0;
  });

  // Verifica se as fritas devem ser liberadas ou bloqueadas
  verificarSeFritasEstaLiberada();

  // Atualiza o total na barra inferior
  atualizarBarraDoCarrinho();

  // Se o carrinho estiver aberto, atualiza a lista em tempo real
  if (document.getElementById('modal-carrinho').classList.contains('ativo')) {
    mostrarItensDoCarrinho();
  }
}


// -----------------------------------------------
// mostrarItensDoCarrinho()
// Gera o HTML da lista de itens dentro do modal
// do carrinho. É chamada ao abrir o carrinho ou
// quando um item é alterado com o carrinho aberto.
// -----------------------------------------------
function mostrarItensDoCarrinho() {
  const lista = document.getElementById('lista-carrinho');
  const itens = Object.entries(carrinho);

  // Se não tiver nenhum item, mostra mensagem de vazio
  if (itens.length === 0) {
    lista.innerHTML = '<div class="carrinho-vazio">😶 Nenhum item no pedido ainda</div>';
    document.getElementById('total-final').textContent = 'R$ 0,00';
    return;
  }

  let total = 0;

  // Para cada item, gera uma linha com nome, preço e botões + −
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

  // Atualiza o total no rodapé do carrinho
  document.getElementById('total-final').textContent =
    'R$ ' + total.toFixed(2).replace('.', ',');
}


// -----------------------------------------------
// abrirTelaDoCarrinho()
// Abre o modal do carrinho deslizando de baixo.
// Chamada pelo botão "Ver pedido" na barra inferior.
// -----------------------------------------------
function abrirTelaDoCarrinho() {
  mostrarItensDoCarrinho();
  document.getElementById('modal-carrinho').classList.add('ativo');
  document.getElementById('overlay-carrinho').classList.add('ativo');
}


// -----------------------------------------------
// fecharTelaDoCarrinho()
// Fecha o modal do carrinho.
// Chamada pelo botão × ou clicando no fundo escuro.
// -----------------------------------------------
function fecharTelaDoCarrinho() {
  document.getElementById('modal-carrinho').classList.remove('ativo');
  document.getElementById('overlay-carrinho').classList.remove('ativo');
}


// -----------------------------------------------
// criarBotoesDeQuantidade()
// Percorre todos os itens do cardápio e adiciona
// os botões + e − dinamicamente em cada um.
// Chamada uma única vez quando a página carrega.
// -----------------------------------------------
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

  // Fritas começam bloqueadas pois nenhum burger foi selecionado ainda
  document.querySelectorAll('.item[data-nome="Adicional de fritas"] .btn-mais')
    .forEach(btn => btn.disabled = true);
}
/* ==============================================
  Pagamento
   DESCRIÇÃO: Todas as funções relacionadas ao
   fluxo de pagamento: identificação do cliente,
   QR Code Pix, envio pelo WhatsApp e confirmação.

   Funções deste arquivo:
   - comecarPedido()
   - fecharTelaDeDados()
   - confirmarDadosEIrParaPix()
   - abrirTelaDepagamentoPix()
   - fecharTelaDePagamentoPix()
   - copiarChavePix()
   - gerarCodigoQrcodePix()
   - enviarPedidoNoWhatsApp()
   - mostrarComprovanteDoCliente()
   - fecharTelaDeConfirmacao()
================================================ */


// -----------------------------------------------
// comecarPedido()
// Chamada quando o cliente clica em
// "Finalizar e Pagar no Pix" no carrinho.
// Fecha o carrinho e abre a tela de identificação.
// -----------------------------------------------
function comecarPedido() {
  fecharTelaDoCarrinho();

  // Limpa os campos antes de abrir
  document.getElementById('input-nome-cliente').value = '';
  document.getElementById('input-mesa').value = '';
  document.getElementById('identificacao-erro').textContent = '';

  document.getElementById('modal-identificacao').classList.add('ativo');
  document.getElementById('overlay-identificacao').classList.add('ativo');
}


// -----------------------------------------------
// fecharTelaDeDados()
// Fecha a tela de identificação (nome e mesa).
// -----------------------------------------------
function fecharTelaDeDados() {
  document.getElementById('modal-identificacao').classList.remove('ativo');
  document.getElementById('overlay-identificacao').classList.remove('ativo');
}


// -----------------------------------------------
// confirmarDadosEIrParaPix()
// Valida os campos preenchidos pelo cliente,
// salva os dados e avança para a tela do Pix.
// -----------------------------------------------
function confirmarDadosEIrParaPix() {
  const nome = document.getElementById('input-nome-cliente').value.trim();
  const mesa = document.getElementById('input-mesa').value.trim();
  const erro = document.getElementById('identificacao-erro');

  // Validação: nome obrigatório
  if (!nome) {
    erro.textContent = '⚠️ Por favor, informe seu nome.';
    return;
  }

  // Validação: mesa obrigatória
  if (!mesa) {
    erro.textContent = '⚠️ Por favor, selecione o número da mesa.';
    return;
  }

  erro.textContent = '';

  // Salva os dados do cliente
  // Esses dados são usados na mensagem do WhatsApp e no comprovante final
  dadosCliente.nome = nome;
  dadosCliente.mesa = mesa;

  fecharTelaDeDados();
  abrirTelaDepagamentoPix(); // ETAPA 4
}


// -----------------------------------------------
// abrirTelaDepagamentoPix()
// Calcula o total do carrinho, gera o QR Code
// com o valor exato e abre a tela de pagamento.
// -----------------------------------------------
function abrirTelaDepagamentoPix() {
  const total = Object.values(carrinho).reduce((s, i) => s + i.preco * i.qtd, 0);

  // Mostra o valor na tela
  document.getElementById('pix-valor').textContent =
    'R$ ' + total.toFixed(2).replace('.', ',');

  // Limpa o QR Code anterior e cria um novo espaço para gerar
  const box = document.querySelector('.pix-qrcode-box');
  box.innerHTML = '<div id="qrcode-gerado"></div>';

  // Gera o payload (código) no formato oficial do Banco Central
  const payload = gerarCodigoQrcodePix(
    '+5551998443038',      // Chave Pix (telefone com +55)
    'Colarinho Louge Bar', // Nome do recebedor
    'Novo Hamburgo',       // Cidade
    total                  // Valor total do pedido
  );

  // Usa a biblioteca QRCode.js para desenhar o QR Code na tela
  new QRCode(document.getElementById('qrcode-gerado'), {
    text: payload,
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  document.getElementById('modal-pix').classList.add('ativo');
  document.getElementById('overlay-pix').classList.add('ativo');
}


// -----------------------------------------------
// fecharTelaDePagamentoPix()
// Fecha a tela do Pix.
// -----------------------------------------------
function fecharTelaDePagamentoPix() {
  document.getElementById('modal-pix').classList.remove('ativo');
  document.getElementById('overlay-pix').classList.remove('ativo');
}


// -----------------------------------------------
// copiarChavePix()
// Copia a chave Pix para a área de transferência
// do celular e muda o texto do botão por 2 segundos
// para confirmar que copiou.
// -----------------------------------------------
function copiarChavePix() {
  navigator.clipboard.writeText('+5551998443038').then(() => {
    const btn = document.querySelector('.btn-copiar');
    btn.textContent = '✅ Copiado!';
    setTimeout(() => btn.textContent = '📋 Copiar', 2000);
  });
}


// -----------------------------------------------
// gerarCodigoQrcodePix(chave, nome, cidade, valor)
// Gera a string no formato oficial do Banco Central
// (padrão EMV com CRC16) que é usada para criar o QR Code.
//
// Parâmetros:
//   chave  → chave Pix (ex: "+5551998443038")
//   nome   → nome do recebedor (max 25 caracteres)
//   cidade → cidade do recebedor (max 15 caracteres)
//   valor  → valor numérico (ex: 47.50)
// -----------------------------------------------
function gerarCodigoQrcodePix(chave, nome, cidade, valor) {

  // Função auxiliar que monta cada campo no padrão do Banco Central
  // Formato: ID (2 dígitos) + tamanho (2 dígitos) + conteúdo
  function campo(id, conteudo) {
    const tamanho = String(conteudo.length).padStart(2, '0');
    return `${id}${tamanho}${conteudo}`;
  }

  // Monta as informações do recebedor (Merchant Account Info)
  const infoRecebedor = campo('26',
    campo('00', 'br.gov.bcb.pix') + // Identificador padrão do Pix
    campo('01', chave)               // Chave Pix
  );

  // Monta o payload completo sem o código de verificação (CRC)
  const payloadSemVerificacao =
    campo('00', '01') +                              // Versão do payload
    infoRecebedor +                                  // Dados do recebedor
    campo('52', '0000') +                            // Código da categoria (0000 = genérico)
    campo('53', '986') +                             // Moeda: 986 = Real (BRL)
    campo('54', valor.toFixed(2)) +                  // Valor com 2 casas decimais
    campo('58', 'BR') +                              // País: BR = Brasil
    campo('59', nome.substring(0, 25).toUpperCase()) + // Nome (máx 25 caracteres)
    campo('60', cidade.substring(0, 15).toUpperCase()) + // Cidade (máx 15 caracteres)
    campo('62', campo('05', '***')) +                // Referência do pedido
    '6304';                                          // Início do campo CRC (sempre assim)

  // Calcula o CRC16 — código de verificação obrigatório pelo Banco Central
  // Garante que o QR Code não foi alterado e é válido
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

  // Retorna o payload completo com o CRC no final
  return payloadSemVerificacao + calcularCRC16(payloadSemVerificacao);
}


// -----------------------------------------------
// enviarPedidoNoWhatsApp()
// Incrementa o número do pedido, monta a mensagem
// completa e abre o WhatsApp com tudo preenchido.
// -----------------------------------------------
function enviarPedidoNoWhatsApp() {
  // ETAPA 8 — Incrementa o número do pedido (1 a 50, depois volta ao 1)
  numeroPedido = (numeroPedido % 50) + 1;
  localStorage.setItem('numeroPedido', numeroPedido); // Salva na memória do navegador

  // Captura data e hora atual
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Formata o número do pedido com 3 dígitos (ex: 001, 012, 050)
  const numeroPedidoFormatado = String(numeroPedido).padStart(3, '0');

  // Monta a lista de itens e calcula o total
  const itens = Object.entries(carrinho);
  let total = 0;
  let listaItens = '';

  itens.forEach(([nome, { preco, qtd }]) => {
    const subtotal = preco * qtd;
    total += subtotal;
    listaItens += `• ${nome} x${qtd} = R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
  });

  // Monta a mensagem completa para o WhatsApp do atendente
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

  // ⚠️ Número do WhatsApp do atendente
  // Formato: código do país (55) + DDD + número, sem espaços
  const numeroWhatsApp = '5551996830150';
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

  // Abre o WhatsApp em uma nova aba com a mensagem já escrita
  window.open(urlWhatsApp, '_blank');

  fecharTelaDePagamentoPix();

  // ETAPA 9 — Abre o comprovante final para o cliente
  mostrarComprovanteDoCliente(numeroPedidoFormatado, data, hora, total, itens);
}


// -----------------------------------------------
// mostrarComprovanteDoCliente()
// Exibe o comprovante final com todos os dados
// do pedido e a mensagem de aguardar na mesa.
//
// Parâmetros recebidos de enviarPedidoNoWhatsApp():
//   numeroPedidoFormatado →  "007"
//   data                  →  "13/04/2026"
//   hora                  →  "21:30"
//   total                 →  R$ 74.50
//   itens                 → array com os itens do carrinho
// -----------------------------------------------
function mostrarComprovanteDoCliente(numeroPedidoFormatado, data, hora, total, itens) {
  // Preenche cada campo do comprovante
  document.getElementById('conf-numero-pedido').textContent = `#${numeroPedidoFormatado}`;
  document.getElementById('conf-nome-cliente').textContent = dadosCliente.nome;
  document.getElementById('conf-mesa').textContent = dadosCliente.mesa;
  document.getElementById('conf-data-hora').textContent = `${data} às ${hora}`;
  document.getElementById('conf-total').textContent =
    'R$ ' + total.toFixed(2).replace('.', ',');

  // Gera a lista de itens no comprovante
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


// -----------------------------------------------
// fecharTelaDeConfirmacao()
// Fecha o comprovante final e zera tudo para
// que um novo pedido possa ser feito.
// -----------------------------------------------
function fecharTelaDeConfirmacao() {
  document.getElementById('modal-confirmacao-final').classList.remove('ativo');
  document.getElementById('overlay-confirmacao-final').classList.remove('ativo');

  // Limpa todos os itens do carrinho
  Object.keys(carrinho).forEach(nome => delete carrinho[nome]);

  // Reseta os contadores visuais de todos os itens para 0
  document.querySelectorAll('.item-qtd').forEach(el => el.textContent = '0');
  document.querySelectorAll('.btn-menos').forEach(btn => btn.disabled = true);

  // Bloqueia novamente o botão + das fritas
  document.querySelectorAll('.item[data-nome="Adicional de fritas"] .btn-mais')
    .forEach(btn => btn.disabled = true);

  // Limpa os dados do cliente para o próximo pedido
  dadosCliente.nome = '';
  dadosCliente.mesa = '';

  // Atualiza a barra (vai desaparecer pois o carrinho está vazio)
  atualizarBarraDoCarrinho();
}
