import { Router, Response } from 'express';
import { OrderModel } from '../models/Order';
import { DeliveryGroupModel } from '../models/DeliveryGroup';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import {
  clusterOrdersByProximity,
  optimizeGroupRoute,
  DispatchOrder,
  ProposedGroup,
} from '../services/routing';

export const dispatchRouter = Router();

// POST /api/dispatch/group (propose smart clusters & routes)
dispatchRouter.post(
  '/group',
  requireAuth,
  requireRole('fpo'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { orderIds: requestedOrderIds, maxKm = 8, maxKg = 200 } = req.body;

      const query: any = { status: 'placed' };
      if (Array.isArray(requestedOrderIds) && requestedOrderIds.length > 0) {
        query._id = { $in: requestedOrderIds };
      }

      const rawOrders = await OrderModel.find(query);
      if (!rawOrders || rawOrders.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No open orders with status "placed" found for grouping.',
        });
        return;
      }

      // Convert to DispatchOrder with weight calculation
      const dispatchOrders: DispatchOrder[] = rawOrders.map((o: any) => {
        const totalWeightKg = (o.items || []).reduce((sum: number, it: any) => sum + (it.qty || 0), 0);
        return {
          _id: String(o._id || o.id),
          customerName: o.customerName || 'Customer',
          customerPhone: o.customerPhone || '',
          deliveryAddress: o.deliveryAddress,
          deliveryLat: o.deliveryLat || 18.5204,
          deliveryLng: o.deliveryLng || 73.8567,
          totalWeightKg,
          items: o.items,
          totalAmount: o.totalAmount,
        };
      });

      // FPO distribution hub coordinates
      const fpoHub = {
        lat: req.user!.lat && req.user!.lat !== 0 ? req.user!.lat : 18.4975,
        lng: req.user!.lng && req.user!.lng !== 0 ? req.user!.lng : 73.8697,
      };

      // 1. Greedy proximity clustering
      const clusters = clusterOrdersByProximity(dispatchOrders, Number(maxKm), Number(maxKg));

      // 2. Optimize route for each cluster
      const proposedGroups: ProposedGroup[] = [];
      for (const cluster of clusters) {
        const groupResult = await optimizeGroupRoute(fpoHub, cluster);
        proposedGroups.push(groupResult);
      }

      res.json({
        success: true,
        hub: fpoHub,
        proposedGroups,
        totalOrdersConsidered: dispatchOrders.length,
        groupsGenerated: proposedGroups.length,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Smart order grouping failed.',
      });
    }
  }
);

// POST /api/dispatch/confirm (persist DeliveryGroup and mark orders shipped)
dispatchRouter.post(
  '/confirm',
  requireAuth,
  requireRole('fpo'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        orderIds,
        stopOrder,
        routeGeometry,
        totalDistanceKm = 0,
        totalDurationMin = 0,
        totalWeightKg = 0,
      } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        res.status(400).json({ success: false, message: 'orderIds array is required.' });
        return;
      }

      // 1. Create DeliveryGroup
      const deliveryGroup = await DeliveryGroupModel.create({
        fpoId: req.user!._id,
        orderIds,
        stopOrder: stopOrder || orderIds,
        routeGeometry: routeGeometry || { type: 'LineString', coordinates: [] },
        totalDistanceKm: Number(totalDistanceKm),
        totalDurationMin: Number(totalDurationMin),
        totalWeightKg: Number(totalWeightKg),
        status: 'shipped',
        createdAt: new Date(),
      });

      const groupId = String(deliveryGroup._id || deliveryGroup.id);
      const shippedAt = new Date();

      // 2. Transition all orders to 'shipped' and link groupId
      for (const orderId of orderIds) {
        await OrderModel.findByIdAndUpdate(orderId, {
          $set: {
            status: 'shipped',
            groupId,
            shippedAt,
          },
        });
      }

      res.status(201).json({
        success: true,
        deliveryGroup,
        message: `Delivery group confirmed. ${orderIds.length} orders transitioned to 'shipped'.`,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to confirm dispatch group.',
      });
    }
  }
);

// PATCH /api/dispatch/:groupId/delivered (mark group & all member orders delivered)
dispatchRouter.patch(
  '/:groupId/delivered',
  requireAuth,
  requireRole('fpo'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      const group = await DeliveryGroupModel.findById(groupId);

      if (!group) {
        res.status(404).json({ success: false, message: 'Delivery group not found.' });
        return;
      }

      // Update DeliveryGroup
      const updatedGroup = await DeliveryGroupModel.findByIdAndUpdate(
        groupId,
        { $set: { status: 'delivered' } },
        { new: true }
      );

      // Transition member orders to 'delivered'
      for (const orderId of group.orderIds) {
        await OrderModel.findByIdAndUpdate(orderId, {
          $set: { status: 'delivered' },
        });
      }

      res.json({
        success: true,
        deliveryGroup: updatedGroup,
        message: 'Delivery group and all orders marked as delivered.',
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to update delivery group status.',
      });
    }
  }
);

// GET /api/dispatch/groups (list dispatched groups for FPO map & reports)
dispatchRouter.get(
  '/groups',
  requireAuth,
  requireRole('fpo'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const groups = await DeliveryGroupModel.find({ fpoId: req.user!._id });
      groups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Hydrate with order details
      const populatedGroups = await Promise.all(
        groups.map(async (g) => {
          const orders = await OrderModel.find({ _id: { $in: g.orderIds } });
          return {
            ...g,
            orders,
          };
        })
      );

      res.json({
        success: true,
        groups: populatedGroups,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve delivery groups.',
      });
    }
  }
);
