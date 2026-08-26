import { DeliveryFormat } from './enums.js';

export interface SessionSummary {
  id: string;
  bookingId: string;
  deliveryFormat: DeliveryFormat;
  meetingLink?: string;
  meetingLocationText?: string;
  autoSettleAt: Date;
}
