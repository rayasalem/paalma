
/**
 * Email Service
 * 
 * Note: Registration emails are now handled natively by Supabase Auth.
 * This service is kept for custom notifications (like shipping updates) if needed,
 * but requires a dedicated backend/Edge Function to work securely.
 * 
 * For MVP, we log to console to simulate non-auth emails.
 */

export const sendEmail = async (params: { to: string, subject: string, html: string }) => {
  // Simulation only - No backend server in production
  console.log(`[Email Service] Simulating email to ${params.to}: ${params.subject}`);
  return { success: true };
};

/**
 * Log email alias
 */
export const logEmail = async (to: string, subject: string, html: string) => {
  return sendEmail({ to, subject, html });
};

export const getShipmentDetailsTemplate = (details: { customerName: string, orderId: string, shipmentId: string, barcodeImage: string, cod: number, deliveryDate: string, notes: string }) => ({
  subject: `Shipment Details for Order #${details.orderId}`,
  html: `
    <h1>Hello ${details.customerName},</h1>
    <p>Your order #${details.orderId} has been shipped via FlashLine.</p>
    <p><strong>Tracking Number:</strong> ${details.shipmentId}</p>
    <p><strong>Expected Delivery:</strong> ${new Date(details.deliveryDate).toLocaleDateString()}</p>
    <p><strong>COD Amount:</strong> ${details.cod} NIS</p>
    <br/>
    <img src="${details.barcodeImage}" alt="Barcode" />
    <p>Notes: ${details.notes}</p>
  `
});
