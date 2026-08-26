import { UserRole, UserStatus } from './enums.js';

export interface UserSummary {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}
