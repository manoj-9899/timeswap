export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  UNVERIFIED = 'UNVERIFIED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum DeliveryFormat {
  ONLINE = 'ONLINE',
  IN_PERSON = 'IN_PERSON',
  BOTH = 'BOTH',
}

export enum SkillRole {
  OFFERED = 'OFFERED',
  LEARNING = 'LEARNING',
}

export enum BookingStatus {
  PENDING_ACCEPTANCE = 'PENDING_ACCEPTANCE',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum EscrowStatus {
  HELD = 'HELD',
  SETTLED = 'SETTLED',
  REFUNDED = 'REFUNDED',
  SPLIT = 'SPLIT',
}

export enum LedgerAccountType {
  USER_WALLET = 'USER_WALLET',
  ESCROW_HOLD = 'ESCROW_HOLD',
  SYSTEM_RESERVE = 'SYSTEM_RESERVE',
  TREASURY_SINK = 'TREASURY_SINK',
}

export enum EntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}
