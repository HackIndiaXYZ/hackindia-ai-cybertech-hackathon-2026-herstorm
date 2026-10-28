import { Router, Response } from 'express';
import { OrderModel } from '../models/Order';
import { ListingModel } from '../models/Listing';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

export const ordersRouter = Router();

// POST /api/orders (customer places order with atomic stock decrement)
ordersRouter.post(
  '/',
  requireAuth,
  requireRole('customer'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { items, deliveryAddress, deliveryLat, deliveryLng } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: 'At least one item is required in the order.' });
        return;
      }

      if (!deliveryAddress || !String(deliveryAddress).trim()) {
        res.status(400).json({ success: false, message: 'Delivery address is required.' });
        return;
      }

      // Decrement stock atomically item by item with rollback tracking
      const decremented: Array<{ listingId: string; qty: number }> = [];
      const orderItems: Array<{ listingId: string; name: string; qty: number; price: number }> = [];
      let totalAmount = 0;

      for (const item of items) {
        const qty = parseInt(String(item.qty), 10);
        if (isNaN(qty) || qty <= 0) {
          // Rollback prior decrements
          for (const d of decremented) {
            await ListingModel.findOneAndUpdate({ _id: d.listingId }, { $inc: { quantity: d.qty } });
          }
          res.status(400).json({ success: false, message: `Invalid item quantity requested: ${item.qty}` });
          return;
        }

        const listingId = String(item.listingId || item.id);
        // Atomic decrement: only match if approved and sufficient stock
        const updatedListing = await ListingModel.findOneAndUpdate(
          {
            _id: listingId,
            status: 'approved',
            quantity: { $gte: qty },
          },
          {
            $inc: { quantity: -qty },
          },
          { new: true }
        );

        if (!updatedListing) {
          // Rollback all prior successful decrements
          for (const d of decremented) {
            await ListingModel.findOneAndUpdate({ _id: d.listingId }, { $inc: { quantity: d.qty } });
          }

          // Check current listing state to provide helpful error
          const current = await ListingModel.findById(listingId);
          const available = current ? current.quantity : 0;
          const produceName = current ? current.name : 'Selected produce';

          res.status(400).json({
            success: false,
            message: `Insufficient stock for "${produceName}". Requested: ${qty} kg, Available: ${available} kg.`,
          });
          return;
        }

        decremented.push({ listingId, qty });
        const itemPrice = updatedListing.price;
        totalAmount += itemPrice * qty;

        orderItems.push({
          listingId,
          name: updatedListing.name,
          qty,
          price: itemPrice,
        });
      }

      const orderLat = typeof deliveryLat === 'number' && deliveryLat !== 0 ? deliveryLat : req.user!.lat || 18.5204;
      const orderLng = typeof deliveryLng === 'number' && deliveryLng !== 0 ? deliveryLng : req.user!.lng || 73.8567;

      const newOrder = await OrderModel.create({
        customerId: req.user!._id,
        customerName: req.user!.name,
        customerPhone: req.user!.phone,
        items: orderItems,
        totalAmount: Math.round(totalAmount * 100) / 100,
        deliveryAddress: String(deliveryAddress).trim(),
        deliveryLat: orderLat,
        deliveryLng: orderLng,
        status: 'placed',
        groupId: null,
        createdAt: new Date(),
        shippedAt: null,
      });

      res.status(201).json({
        success: true,
        order: newOrder,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to place order.',
      });
    }
  }
);

// GET /api/orders/mine (customer: view own orders)
ordersRouter.get(
  '/mine',
  requireAuth,
  requireRole('customer'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const orders = await OrderModel.find({ customerId: req.user!._id });
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({
        success: true,
        orders,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to load your orders.',
      });
    }
  }
);

// GET /api/orders (fpo: view marketplace orders)
ordersRouter.get(
  '/',
  requireAuth,
  requireRole('fpo'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const query: any = {};
      if (req.query.status && req.query.status !== 'all') {
        query.status = req.query.status;
      }

      const orders = await OrderModel.find(query);
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({
        success: true,
        orders,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to load orders.',
      });
    }
  }
);

// GET /api/orders/:id (detail drawer/view for customer or FPO)
ordersRouter.get(
  '/:id',
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const order = await OrderModel.findById(req.params.id);
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found.' });
        return;
      }

      // Isolation: Customer can only view their own order
      if (req.user!.role === 'customer' && String(order.customerId) !== String(req.user!._id)) {
        res.status(403).json({ success: false, message: 'Unauthorized. You can only view your own orders.' });
        return;
      }

      res.json({
        success: true,
        order,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to load order details.',
      });
    }
  }
);
