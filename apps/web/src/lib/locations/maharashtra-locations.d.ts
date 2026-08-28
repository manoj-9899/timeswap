import { PinLocationDetails } from '@timeswap/contracts';
export * from '@timeswap/contracts';
export declare function lookupPinCodeAsync(pin: string): Promise<PinLocationDetails | null>;
