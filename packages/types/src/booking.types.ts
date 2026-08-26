import { BookingStatus } from './enums.js';

export interface BookingSummary {
  id: string;
  requesterId: string;
  providerId: string;
  durationMinutes: 30 | 60;
  creditAmount: number;
  status: BookingStatus;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
}
