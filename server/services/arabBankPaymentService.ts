import axios from 'axios';
import crypto from 'crypto';

interface PaymentSessionRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  returnUrl: string;
  cancelUrl: string;
}

interface PaymentSessionResponse {
  success: boolean;
  sessionId?: string;
  redirectUrl?: string;
  error?: string;
}

const MERCHANT_ID = process.env.ARAB_BANK_MERCHANT_ID || 'TESTMERCHANT';
const API_PASSWORD = process.env.ARAB_BANK_API_PASSWORD || 'TESTPASSWORD';
const API_BASE_URL = process.env.ARAB_BANK_API_URL || 'https://test-arab.test.gateway.mastercard.com/api/rest/version/60/merchant';

/**
 * Arab Bank Payment Service (MPGS Integration)
 */
export const arabBankPaymentService = {
  /**
   * Create Payment Session
   */
  async createSession(data: PaymentSessionRequest): Promise<PaymentSessionResponse> {
    try {
      const url = `${API_BASE_URL}/${MERCHANT_ID}/session`;
      const auth = Buffer.from(`merchant.${MERCHANT_ID}:${API_PASSWORD}`).toString('base64');

      const payload = {
        apiOperation: 'CREATE_CHECKOUT_SESSION',
        order: {
          id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          description: `Order #${data.orderId}`,
        },
        interaction: {
          returnUrl: data.returnUrl,
          cancelUrl: data.cancelUrl,
          merchant: {
            name: 'Palma Marketplace',
            address: {
              line1: 'Ramallah',
              line2: 'Palestine',
            },
          },
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.session && response.data.session.id) {
        return {
          success: true,
          sessionId: response.data.session.id,
          redirectUrl: response.data.interaction?.redirectUrl || '', // MPGS usually handles redirect via JS SDK, but some versions return URL
        };
      }

      return { success: false, error: 'Failed to create session' };
    } catch (error: any) {
      console.error('Arab Bank Create Session Error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.result || error.message };
    }
  },

  /**
   * Verify Payment (Callback)
   * In MPGS, you typically query the order status after redirect.
   */
  async verifyPayment(orderId: string): Promise<{ success: boolean; status: string; transactionId?: string }> {
    try {
      const url = `${API_BASE_URL}/${MERCHANT_ID}/order/${orderId}`;
      const auth = Buffer.from(`merchant.${MERCHANT_ID}:${API_PASSWORD}`).toString('base64');

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      const result = response.data;
      if (result && result.result === 'SUCCESS') {
        // Check transaction status
        const transaction = result.transaction && result.transaction[0];
        if (transaction && (transaction.result === 'SUCCESS' || transaction.result === 'PENDING')) {
           return { success: true, status: 'PAID', transactionId: transaction.id };
        }
      }

      return { success: false, status: 'FAILED' };
    } catch (error: any) {
      console.error('Arab Bank Verify Payment Error:', error.response?.data || error.message);
      return { success: false, status: 'ERROR' };
    }
  },

  /**
   * Validate Webhook Signature (If using Webhooks)
   */
  validateWebhookSignature(payload: any, signature: string): boolean {
    const secret = process.env.ARAB_BANK_WEBHOOK_SECRET || '';
    if (!secret) return false;

    // Implementation depends on specific bank logic (HMAC usually)
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    const calculatedSignature = hmac.digest('hex');

    return calculatedSignature === signature;
  }
};
