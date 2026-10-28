import mongoose, { Document, Schema, Model } from 'mongoose';
import { isConnectedToMongo } from '../db';
import { memoryStore } from './memoryStore';

export interface IDeliveryGroup {
  _id?: string;
  fpoId: string | any;
  orderIds: (string | any)[];
  stopOrder: (string | any)[];
  routeGeometry: {
    type: string;
    coordinates: number[][]; // [lng, lat]
  };
  totalDistanceKm: number;
  totalDurationMin: number;
  totalWeightKg: number;
  status: 'shipped' | 'delivered';
  createdAt: Date;
}

export interface IDeliveryGroupDocument extends Omit<IDeliveryGroup, '_id'>, Document {}

const DeliveryGroupSchema = new Schema<IDeliveryGroupDocument>(
  {
    fpoId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderIds: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    stopOrder: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    routeGeometry: {
      type: { type: String, default: 'LineString' },
      coordinates: { type: [[Number]], default: [] },
    },
    totalDistanceKm: { type: Number, default: 0 },
    totalDurationMin: { type: Number, default: 0 },
    totalWeightKg: { type: Number, default: 0 },
    status: { type: String, enum: ['shipped', 'delivered'], default: 'shipped' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const MongooseDeliveryGroupModel: Model<IDeliveryGroupDocument> =
  mongoose.models.DeliveryGroup || mongoose.model<IDeliveryGroupDocument>('DeliveryGroup', DeliveryGroupSchema);

export const DeliveryGroupModel = {
  find: async (q: any = {}) =>
    isConnectedToMongo ? MongooseDeliveryGroupModel.find(q).lean() : memoryStore.deliveryGroups.find(q),
  findOne: async (q: any = {}) =>
    isConnectedToMongo ? MongooseDeliveryGroupModel.findOne(q).lean() : memoryStore.deliveryGroups.findOne(q),
  findById: async (id: any) =>
    isConnectedToMongo ? MongooseDeliveryGroupModel.findById(id).lean() : memoryStore.deliveryGroups.findById(id),
  create: async (data: any) =>
    isConnectedToMongo ? MongooseDeliveryGroupModel.create(data) : memoryStore.deliveryGroups.create(data),
  findOneAndUpdate: async (q: any, u: any, opts?: any) =>
    isConnectedToMongo
      ? MongooseDeliveryGroupModel.findOneAndUpdate(q, u, opts || { new: true }).lean()
      : memoryStore.deliveryGroups.findOneAndUpdate(q, u, opts),
  findByIdAndUpdate: async (id: any, u: any, opts?: any) =>
    isConnectedToMongo
      ? MongooseDeliveryGroupModel.findByIdAndUpdate(id, u, opts || { new: true }).lean()
      : memoryStore.deliveryGroups.findByIdAndUpdate(id, u, opts),
  deleteOne: async (q: any) =>
    isConnectedToMongo ? MongooseDeliveryGroupModel.deleteOne(q) : memoryStore.deliveryGroups.deleteOne(q),
  deleteMany: async (q: any = {}) =>
    isConnectedToMongo ? MongooseDeliveryGroupModel.deleteMany(q) : memoryStore.deliveryGroups.deleteMany(q),
  countDocuments: async (q: any = {}) =>
    isConnectedToMongo ? MongooseDeliveryGroupModel.countDocuments(q) : memoryStore.deliveryGroups.countDocuments(q),
  insertMany: async (docs: any[]) =>
    isConnectedToMongo ? MongooseDeliveryGroupModel.insertMany(docs) : memoryStore.deliveryGroups.insertMany(docs),
};
