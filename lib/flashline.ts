
import { FlashLineService } from '../services/flashlineService';

export const flashline = {
  createShipment: FlashLineService.createShipment,
  checkStatus: FlashLineService.getShipmentStatus
};

// Re-export helpers for component use
export const getInternalCities = FlashLineService.getInternalCities;
export const getInternalVillages = FlashLineService.getInternalVillages;
