// api/webhook.js
// Função serverless que o Mercado Pago chama automaticamente
// quando o cliente finaliza o pagamento Pix

export default async function handler(req, res) {
  // o Mercado Pago envia um POST quando o pagamento é confirmado
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { type, data } = req.body;

  // só processa notificações de pagamento
  if (type !== 'payment') {
    return res.status(200).json({ ok: true });
  }

  try {
    // busca os detalhes completos do pagamento no Mercado Pago
    const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    });

    const pagamento = await resposta.json();

    // só continua se o pagamento foi aprovado
    if (pagamento.status !== 'approved') {
      return res.status(200).json({ ok: true, status: pagamento.status });
    }

    // pega os dados que vieram na descrição do pagamento
    // ex: "Pedido #001 | João Silva | Mesa 5 | Caipira Vodka x1..."
    const descricao = pagamento.description || '';

    // monta a mensagem para o WhatsApp do atendente
    const mensagem =
      `✅ *PAGAMENTO CONFIRMADO - Colarinho Lounge Bar*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 Valor: R$ ${pagamento.transaction_amount.toFixed(2).replace('.', ',')}\n` +
      `🆔 ID do pagamento: ${pagamento.id}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${descricao}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ Pix recebido e confirmado automaticamente!`;

    // ⚠️ substitua pelo número do atendente (com 55 + DDD)
    const numeroWhatsApp = '5551996830150';
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(mensagem)}`;

    console.log('Pagamento aprovado! WhatsApp URL:', urlWhatsApp);
    console.log('Mensagem:', mensagem);

    return res.status(200).json({ ok: true, mensagem: 'Pagamento processado com sucesso' });

  } catch (erro) {
    console.error('Erro no webhook:', erro);
    return res.status(500).json({ erro: 'Erro interno' });
  }
}
