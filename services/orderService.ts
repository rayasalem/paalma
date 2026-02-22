
import { db } from './core/storage';
import { Order, OrderItem, OrderStatus, PaymentMethod, ActionResponse } from '../types';
import { productService } from './productService';

/**
 * Order Service
 * Handles order placement, status updates, and retrieval.
 */
export const orderService = {
  
  getAll(): Order[] {
    return db.orders;
  },

  getItems(): OrderItem[] {
    return db.orderItems;
  },

  async placeOrder(productId: string, userId: string, paymentMethod: PaymentMethod, shippingDetails: any): Promise<ActionResponse<Order>> {
    const product = productService.getById(productId);
    if (!product) return { success: false, error: 'Product not found' };

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const newOrder: Order = {
      id: orderId,
      customer_id: userId,
      customerId: userId,
      merchantId: product.merchant_id || product.merchantId,
      items: [{ ...product, quantity: 1, price: product.price || 0 }], // Basic single item logic for MVP
      totalAmount: product.price || 0,
      total_price_ils: product.price_ils || 0,
      status: OrderStatus.PENDING,
      payment_method: paymentMethod,
      shipping_name: shippingDetails.fullName,
      shipping_phone: shippingDetails.phone,
      shipping_address: shippingDetails.address,
      shippingAddress: {
        cityId: shippingDetails.cityId,
        cityName: shippingDetails.cityName,
        villageId: shippingDetails.villageId,
        villageName: shippingDetails.villageName,
        addressDetails: shippingDetails.address,
        phone: shippingDetails.phone,
        regionId: shippingDetails.regionId
      },
      date: new Date().toISOString(),
      createdAt: Date.now()
    };

    const newItem: OrderItem = {
      id: `ITM-${Date.now()}`,
      order_id: orderId,
      product_id: product.id,
      quantity: 1,
      price: product.price || 0
    };

    db.addItem('orders', newOrder);
    db.addItem('orderItems', newItem);

    return { success: true, data: newOrder };
  },

  updateShipmentInfo(orderId: string, info: any) {
    db.updateItem<Order>('orders', orderId, {
      delivery_id: info.shipmentId,
      shipmentId: info.shipmentId,
      barcode_image: info.barcodeImage,
      barcodeImage: info.barcodeImage,
      expected_delivery_date: info.expectedDeliveryDate,
      status: 'SHIPPED',
      delivery_status: 'READY_FOR_PICKUP',
      trackingNumber: info.trackingNumber
    });
  },

  updateStatus(orderId: string, status: string) {
    const updates: any = { delivery_status: status };
    if (status === 'CANCELLED') updates.status = OrderStatus.CANCELLED;
    if (status === 'DELIVERED') updates.status = OrderStatus.DELIVERED;
    
    db.updateItem<Order>('orders', orderId, updates);
  }
};