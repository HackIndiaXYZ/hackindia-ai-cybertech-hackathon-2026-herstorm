import mongoose, { Document, Schema, Model } from 'mongoose';
import { isConnectedToMongo } from '../db';
import { memoryStore } from './memoryStore';

export interface IOrderItem {
  listingId: string | any;
  name: string;
  qty: number;
  price: number;
}

export interface IOrder {
  _id?: string;
  customerId: string | any;
  customerName?: string;
  customerPhone?: string;
  items: IOrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  status: 'placed' | 'grouped' | 'shipped' | 'delivered';
  groupId?: string | any | null;
  createdAt: Date;
  shippedAt?: Date | null;
}

export interface IOrderDocument extends Omit<IOrder, '_id'>, Document {}

const OrderItemSchema = new Schema(
  {
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    deliveryAddress: { type: String, required: true, trim: true },
    deliveryLat: { type: Number, default: 0 },
    deliveryLng: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['placed', 'grouped', 'shipped', 'delivered'],
      default: 'placed',
    },
    groupId: { type: Schema.Types.ObjectId, ref: 'DeliveryGroup', default: null },
    createdAt: { type: Date, default: Date.now },
    shippedAt: { type: Date, default: null },
  },
  { timestamps: false }
);

export const MongooseOrderModel: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export const OrderModel = {
  find: async (q: any = {}) => (isConnectedToMongo ? MongooseOrderModel.find(q).lean() : memoryStore.orders.find(q)),
  findOne: async (q: any = {}) => (isConnectedToMongo ? MongooseOrderModel.findOne(q).lean() : memoryStore.orders.findOne(q)),
  findById: async (id: any) => (isConnectedToMongo ? MongooseOrderModel.findById(id).lean() : memoryStore.orders.findById(id)),
  create: async (data: any) => (isConnectedToMongo ? MongooseOrderModel.create(data) : memoryStore.orders.create(data)),
  findOneAndUpdate: async (q: any, u: any, opts?: any) =>
    isConnectedToMongo ? MongooseOrderModel.findOneAndUpdate(q, u, opts || { new: true }).lean() : memoryStore.orders.findOneAndUpdate(q, u, opts),
  findByIdAndUpdate: async (id: any, u: any, opts?: any) =>
    isConnectedToMongo ? MongooseOrderModel.findByIdAndUpdate(id, u, opts || { new: true }).lean() : memoryStore.orders.findByIdAndUpdate(id, u, opts),
  deleteOne: async (q: any) => (isConnectedToMongo ? MongooseOrderModel.deleteOne(q) : memoryStore.orders.deleteOne(q)),
  deleteMany: async (q: any = {}) => (isConnectedToMongo ? MongooseOrderModel.deleteMany(q) : memoryStore.orders.deleteMany(q)),
  countDocuments: async (q: any = {}) => (isConnectedToMongo ? MongooseOrderModel.countDocuments(q) : memoryStore.orders.countDocuments(q)),
  insertMany: async (docs: any[]) => (isConnectedToMongo ? MongooseOrderModel.insertMany(docs) : memoryStore.orders.insertMany(docs)),
};
