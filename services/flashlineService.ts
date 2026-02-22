
import { env } from '../config/env';
import { palestineVillages, City, Village } from '../data/palestine-villages';
import { ActionResponse, ShipmentBody, FlashlineShipmentResponse, Order, User } from '../types';
import { logEmail } from './emailService';

let cachedToken: string | null = null;

const safeParseJson = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { error: "Non-JSON response", raw: text.substring(0, 100) };
  }
};

/**
 * Validate required fields for a shipment.
 */
export const validateShipmentPayload = (body: ShipmentBody): { valid: boolean; error?: string } => {
  const { pkg, destinationAddress } = body;
  if (!pkg.receiverPhone || pkg.receiverPhone.length < 9) return { valid: false, error: "Invalid receiver phone" };
  if (!destinationAddress.cityId || !destinationAddress.villageId) return { valid: false, error: "Incomplete address" };
  return { valid: true };
};

/**
 * Prepare standard payload object for FlashLine API.
 */
export const prepareShipmentPayload = (params: {
  orderId: string;
  productName: string;
  category: string;
  price: number;
  customer: any;
  merchant: any;
}): ShipmentBody => {
  return {
    pkgUnitType: "METRIC",
    pkg: {
      cod: params.customer.type === 'COD' ? params.price : 0,
      notes: `${params.customer.notes || ''} | Palma Ref: ${params.orderId}`,
      invoiceNumber: params.orderId,
      senderName: params.merchant.name,
      receiverName: params.customer.name,
      businessSenderName: params.merchant.businessName,
      senderPhone: params.merchant.phone,
      receiverPhone: params.customer.phone,
      quantity: 1,
      description: `${params.productName}`,
      shipmentType: params.customer.type,
      serviceType: "STANDARD"
    },
    destinationAddress: {
      addressLine1: params.customer.address,
      addressLine2: "", 
      cityId: params.customer.cityId,
      villageId: params.customer.villageId,
      regionId: params.customer.regionId
    },
    originAddress: {
      addressLine1: params.merchant.address,
      addressLine2: "",
      cityId: params.merchant.cityId,
      villageId: params.merchant.villageId,
      regionId: params.merchant.regionId
    }
  };
};

/**
 * Create a Shipment (Mock or Real based on config).
 */
export const createShipment = async (shipmentData: ShipmentBody): Promise<FlashlineShipmentResponse> => {
  const validation = validateShipmentPayload(shipmentData);
  if (!validation.valid) return { success: false, error: validation.error };

  // Use Config for mock check
  if (env.FEATURES.USE_MOCK_DATA) {
    const mockId = `FL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    return {
      success: true,
      shipmentId: mockId,
      trackingNumber: mockId,
      barcode: `PALMA-${shipmentData.pkg.invoiceNumber}`,
      barcodeImage: `https://bwipjs-api.metafloor.com/?bcid=code128&text=${mockId}&scale=2&rotate=N&includetext`,
      expectedDeliveryDate: new Date(Date.now() + 259200000).toISOString(),
      cost: 15,
      status: 'READY_FOR_PICKUP',
      payload: shipmentData
    };
  }
  
  // Real API Logic placeholder
  return { success: false, error: "Real API disabled in config" };
};

export const getShipmentStatus = async (shipmentId: string): Promise<string | null> => {
  if (shipmentId.startsWith('FL-')) return 'IN_TRANSIT';
  return null;
};

export const mapFlashlineStatus = (status: string | undefined): string => {
  if (!status) return "قيد المعالجة";
  const statusMap: Record<string, string> = {
    "READY_FOR_PICKUP": "جاهز للاستلام",
    "IN_TRANSIT": "قيد التوصيل",
    "CANCELLED": "ملغاة",
    "DELIVERED": "تم التسليم",
  };
  return statusMap[status] || status;
};

export const cancelLogestechsShipment = async (shipmentId: string | number, email: string, password: string): Promise<ActionResponse<any>> => {
  if (env.FEATURES.USE_MOCK_DATA) {
    return { success: true, data: { message: "Simulated cancellation", id: shipmentId } };
  }
  return { success: false, error: "Real cancellation API not configured" };
};

export const automateShipmentCreation = async (order: Order, merchant: User): Promise<FlashlineShipmentResponse> => {
  const address = order.shippingAddress;
  if (!address) return { success: false, error: "Missing shipping address" };

  const shipmentBody = prepareShipmentPayload({
    orderId: order.id,
    productName: 'Various Items', // simplified
    category: 'General',
    price: order.totalAmount || 0,
    customer: {
      name: order.shipping_name || address.phone, 
      email: 'customer@example.com',
      phone: address.phone,
      address: address.addressDetails,
      cityId: address.cityId,
      villageId: address.villageId || 101,
      regionId: address.regionId || 1,
      type: 'COD'
    },
    merchant: {
      name: merchant.name,
      businessName: merchant.companyName || merchant.name,
      phone: merchant.phone,
      address: merchant.city || 'Ramallah',
      cityId: 1,
      villageId: 101,
      regionId: 1
    }
  });

  const result = await createShipment(shipmentBody);
  if (result.success) {
    logEmail(merchant.email, `Shipment Created for Order #${order.id}`, `Tracking: ${result.trackingNumber}`);
  }
  return result;
};

export const getInternalCities = (): City[] => palestineVillages;
export const getInternalVillages = (cityId: number): Village[] => {
  const city = palestineVillages.find(c => c.id === cityId);
  return city ? city.villages : [];
};
export const resolveLocationName = (id: number, type: 'city' | 'village', lang: 'ar' | 'en' = 'ar'): string => {
  if (type === 'city') {
    const city = palestineVillages.find(c => c.id === id);
    return city ? (lang === 'ar' ? city.nameAr : city.nameEn) : '';
  } else {
    for (const city of palestineVillages) {
      const village = city.villages.find(v => v.id === id);
      if (village) return lang === 'ar' ? village.nameAr : village.nameEn;
    }
    return '';
  }
};

export const getShipmentLabels = async (shipmentId: string): Promise<string[]> => {
  return [`https://placehold.co/400x600?text=Label+${shipmentId}`];
};

export const FlashLineService = {
    createShipment,
    getShipmentStatus,
    mapFlashlineStatus,
    prepareShipmentPayload,
    automateShipmentCreation,
    getInternalCities,
    getInternalVillages,
    cancelLogestechsShipment,
    resolveLocationName,
    getShipmentLabels
};