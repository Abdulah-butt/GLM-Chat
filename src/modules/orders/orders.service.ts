import { logger } from '../../infra/logger/logger.js';
import * as ordersRepository from './orders.repository.js';
import type { CreateOrderRequestDto, ListOrdersDto, ListOrdersResultDto } from './orders.dto.js';
import type { OrderRequest } from './orders.types.js';

export const createOrderRequest = (dto: CreateOrderRequestDto, requestId: string): OrderRequest => {
  const order: OrderRequest = {
    ...dto,
    orderNumber: ordersRepository.nextOrderNumber(),
    status: 'pending_review',
    createdAt: new Date().toISOString(),
  };
  ordersRepository.insert(order);
  logger.info(
    { requestId, orderNumber: order.orderNumber, companyName: order.companyName },
    'Order request created',
  );
  return order;
};

export const listOrderRequests = (dto: ListOrdersDto): ListOrdersResultDto => {
  const { items, total } = ordersRepository.findAll(dto.page, dto.limit);
  return {
    orders: items,
    meta: {
      page: dto.page,
      limit: dto.limit,
      total,
      hasNextPage: dto.page * dto.limit < total,
    },
  };
};
