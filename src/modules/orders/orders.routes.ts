import { Router } from 'express';
import { validateQuery } from '../../middlewares/validate.middleware.js';
import { listOrdersQuerySchema } from './orders.validation.js';
import * as ordersController from './orders.controller.js';

const router = Router();

// Demo note: no auth on this list endpoint — the MVP has no user accounts yet.
router.get('/', validateQuery(listOrdersQuerySchema), ordersController.listOrders);

export const ordersRoutes = router;
