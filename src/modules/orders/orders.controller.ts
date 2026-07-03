import type { Request, Response } from 'express';
import { sendSuccess } from '../../core/http/apiResponse.js';
import { HTTP_STATUS } from '../../core/http/statusCodes.js';
import * as ordersService from './orders.service.js';
import type { ListOrdersDto } from './orders.dto.js';

export const listOrders = (_req: Request, res: Response): void => {
  const query = res.locals['query'] as ListOrdersDto;
  const result = ordersService.listOrderRequests(query);
  sendSuccess(res, HTTP_STATUS.OK, 'Order requests fetched successfully.', result.orders, result.meta);
};
