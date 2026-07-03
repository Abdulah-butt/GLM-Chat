import type { OrderRequest } from './orders.types.js';

// In-memory store for the MVP demo — resets on restart.
// Swap for a DB / QuickBooks-backed repository without touching the service layer.
const orders: OrderRequest[] = [];
let sequence = 1000;

export const nextOrderNumber = (): string => {
  sequence += 1;
  return `BC-${sequence}`;
};

export const insert = (order: OrderRequest): OrderRequest => {
  orders.unshift(order);
  return order;
};

export const findAll = (page: number, limit: number): { items: OrderRequest[]; total: number } => {
  const start = (page - 1) * limit;
  return { items: orders.slice(start, start + limit), total: orders.length };
};
