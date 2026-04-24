// api/verificar-pagamento.js
// Consulta o status do pagamento no Mercado Pago
// Chamada pelo frontend a cada 5 segundos para saber se o pix foi pago

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ erro: 'ID do pagamento não informado' });
  }

  try {
    const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    });

    const dados = await resposta.json();

    return res.status(200).json({ status: dados.status });

  } catch (erro) {
    console.error('Erro ao verificar pagamento:', erro);
    return res.status(500).json({ erro: 'Erro ao verificar pagamento' });
  }
}
