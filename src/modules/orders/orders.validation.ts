import { z } from 'zod';
import { FILLET_SIZES, PACKAGE_TYPES } from './orders.types.js';

// Shared by the AI place_order tool and any future HTTP create endpoint.
export const createOrderRequestSchema = z.object({
  packageType: z.enum(PACKAGE_TYPES),
  filletSize: z.enum(FILLET_SIZES),
  quantity: z.number().int().positive().max(10_000),
  destination: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email(),
  phone: z.string().trim().min(5).max(30).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
