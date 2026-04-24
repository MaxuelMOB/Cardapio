// api/criar-pagamento.js
// Função serverless do Vercel que cria o pagamento Pix no Mercado Pago
// Essa função roda no servidor, então as credenciais ficam protegidas

export default async function handler(req, res) {
  // só aceita requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { valor, descricao, nomecliente } = req.body;

  // valida os dados recebidos
  if (!valor || !descricao || !nomecliente) {
    return res.status(400).json({ erro: 'Dados incompletos' });
  }

  try {
    const resposta = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // pega o token salvo nas variáveis de ambiente do Vercel
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `colarinho-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: parseFloat(valor),
        description: descricao,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@colarinho.com',
          first_name: nomecliente,
        },
        // o pagamento expira em 30 minutos
        date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        notification_url: `https://colarinho.vercel.app/api/webhook`,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error('Erro MP:', dados);
      return res.status(500).json({ erro: 'Erro ao criar pagamento', detalhe: dados });
    }

    // retorna só o que o frontend precisa
    return res.status(200).json({
      id: dados.id,
      qrcode: dados.point_of_interaction.transaction_data.qr_code,
      qrcode_base64: dados.point_of_interaction.transaction_data.qr_code_base64,
      status: dados.status,
    });

  } catch (erro) {
    console.error('Erro interno:', erro);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}
