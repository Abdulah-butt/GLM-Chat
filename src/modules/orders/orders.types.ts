export const PACKAGE_TYPES = ['5kg_box', '10kg_box', 'full_pallet', 'container'] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];

export const FILLET_SIZES = ['small', 'medium', 'large'] as const;
export type FilletSize = (typeof FILLET_SIZES)[number];

export type OrderStatus = 'pending_review';

export interface OrderRequest {
  orderNumber: string;
  packageType: PackageType;
  filletSize: FilletSize;
  quantity: number;
  destination: string;
  companyName: string;
  contactName?: string;
  email: string;
  phone?: string;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
}
