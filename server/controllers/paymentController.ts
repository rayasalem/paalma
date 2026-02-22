import { Request, Response } from 'express';
import { arabBankPaymentService } from '../services/arabBankPaymentService';

// Mock DB interaction if Supabase client fails in server context without specific setup
// In a real app, use the Admin Client with Service Role Key
const getOrderFromDB = async (orderId: string) => {
  // TODO: Replace with real DB call
  // const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  // return data;
  return { id: orderId, totalAmount: 100, currency: 'ILS' }; // Mock
};

export const createSession = async (req: Request, res: Response) => {
  try {
    const { orderId, customerEmail, returnUrl, cancelUrl } = req.body;

    // 1. Validate Input
    if (!orderId || !customerEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 2. Fetch Order from DB (Security: Don't trust frontend price)
    const order = await getOrderFromDB(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 3. Create Session with Bank
    const sessionResponse = await arabBankPaymentService.createSession({
      amount: order.totalAmount,
      currency: 'ILS', // Or USD, JOD depending on merchant account
      orderId: orderId,
      customerEmail,
      returnUrl: returnUrl || `${process.env.APP_URL}/checkout/success`,
      cancelUrl: cancelUrl || `${process.env.APP_URL}/checkout/cancel`,
    });

    if (sessionResponse.success) {
      return res.json({
        success: true,
        sessionId: sessionResponse.sessionId,
        redirectUrl: sessionResponse.redirectUrl,
      });
    } else {
      return res.status(500).json({ error: sessionResponse.error });
    }
  } catch (error: any) {
    console.error('Create Session Controller Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const handleCallback = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body; // Usually comes from query params or body depending on integration

    if (!orderId) {
      return res.status(400).json({ error: 'Missing Order ID' });
    }

    // 1. Verify Payment Status with Bank (Don't trust callback alone)
    const verification = await arabBankPaymentService.verifyPayment(orderId);

    if (verification.success && verification.status === 'PAID') {
      // 2. Update Order in DB
      // await supabase.from('orders').update({ status: 'PAID', transaction_id: verification.transactionId }).eq('id', orderId);
      
      return res.json({ success: true, status: 'PAID' });
    } else {
      // await supabase.from('orders').update({ status: 'FAILED' }).eq('id', orderId);
      return res.json({ success: false, status: 'FAILED' });
    }
  } catch (error: any) {
    console.error('Callback Controller Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
