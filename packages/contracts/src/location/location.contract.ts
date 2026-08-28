import { z } from 'zod';

export interface DistrictContractDto {
  id: string;
  lgdCode: number;
  nameEn: string;
  nameMr: string;
  stateCode: string;
}

export interface TalukaContractDto {
  id: string;
  lgdCode: number;
  districtId: string;
  nameEn: string;
  nameMr: string;
}

export interface LocalityContractDto {
  id: string;
  talukaId: string;
  nameEn: string;
  nameMr?: string | null;
  type: string;
  pincode?: string | null;
}

export interface ResolvedPincodeContractDto {
  pincode: string;
  district: DistrictContractDto;
  taluka: TalukaContractDto;
  localities: LocalityContractDto[];
}

export const pincodeParamSchema = z.object({
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'PIN code must be exactly 6 numeric digits'),
});

export type PincodeParamInput = z.infer<typeof pincodeParamSchema>;

export const localityQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export type LocalityQueryInput = z.infer<typeof localityQuerySchema>;
