import { z } from 'zod';

export interface DistrictContractDto {
  id: string;
  lgdCode?: number;
  name_en?: string;
  nameEn?: string;
  name_mr?: string;
  nameMr?: string;
  stateCode?: string;
}

export interface TalukaContractDto {
  id: string;
  lgdCode?: number;
  districtId?: string;
  name_en?: string;
  nameEn?: string;
  name_mr?: string;
  nameMr?: string;
}

export interface LocalityContractDto {
  id?: string;
  talukaId?: string;
  name_en: string;
  nameEn?: string;
  city?: string;
  pincode: string;
}

export interface ResolvedPincodeContractDto {
  pincode: string;
  district: DistrictContractDto;
  talukas: TalukaContractDto[];
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

export const DistrictResponseSchema = z.object({
  id: z.string(),
  name_en: z.string().optional(),
  nameEn: z.string().optional(),
  name_mr: z.string().optional(),
  nameMr: z.string().optional(),
});

export const TalukaResponseSchema = z.object({
  id: z.string(),
  name_en: z.string().optional(),
  nameEn: z.string().optional(),
  name_mr: z.string().optional(),
  nameMr: z.string().optional(),
});

export const LocalityResponseSchema = z.object({
  name_en: z.string(),
  city: z.string().optional(),
  pincode: z.string(),
});

export const PincodeResolutionResponseSchema = z.object({
  district: DistrictResponseSchema,
  talukas: z.array(TalukaResponseSchema),
  localities: z.array(LocalityResponseSchema),
});

