import type { FilletSize, OrderRequest, PackageType } from './orders.types.js';

export interface CreateOrderRequestDto {
  packageType: PackageType;
  filletSize: FilletSize;
  quantity: number;
  destination: string;
  companyName: string;
  contactName?: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface ListOrdersDto {
  page: number;
  limit: number;
}

export interface ListOrdersResultDto {
  orders: OrderRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
}
