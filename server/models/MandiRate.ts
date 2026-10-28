import mongoose, { Document, Schema, Model } from 'mongoose';
import { isConnectedToMongo } from '../db';
import { memoryStore } from './memoryStore';

export interface IMandiRate {
  _id?: string;
  crop: string;
  ratePerKg: number;
  category?: 'Vegetables' | 'Fruits' | 'Other';
  updatedOn: Date;
}

export interface IMandiRateDocument extends Omit<IMandiRate, '_id'>, Document {}

const MandiRateSchema = new Schema<IMandiRateDocument>(
  {
    crop: { type: String, required: true, unique: true, lowercase: true, trim: true },
    ratePerKg: { type: Number, required: true, min: 0 },
    category: { type: String, enum: ['Vegetables', 'Fruits', 'Other'], default: 'Vegetables' },
    updatedOn: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const MongooseMandiRateModel: Model<IMandiRateDocument> =
  mongoose.models.MandiRate || mongoose.model<IMandiRateDocument>('MandiRate', MandiRateSchema);

export const MandiRateModel = {
  find: async (q: any = {}) =>
    isConnectedToMongo ? MongooseMandiRateModel.find(q).lean() : memoryStore.mandiRates.find(q),
  findOne: async (q: any = {}) =>
    isConnectedToMongo ? MongooseMandiRateModel.findOne(q).lean() : memoryStore.mandiRates.findOne(q),
  findById: async (id: any) =>
    isConnectedToMongo ? MongooseMandiRateModel.findById(id).lean() : memoryStore.mandiRates.findById(id),
  create: async (data: any) =>
    isConnectedToMongo ? MongooseMandiRateModel.create(data) : memoryStore.mandiRates.create(data),
  findOneAndUpdate: async (q: any, u: any, opts?: any) =>
    isConnectedToMongo
      ? MongooseMandiRateModel.findOneAndUpdate(q, u, opts || { new: true }).lean()
      : memoryStore.mandiRates.findOneAndUpdate(q, u, opts),
  findByIdAndUpdate: async (id: any, u: any, opts?: any) =>
    isConnectedToMongo
      ? MongooseMandiRateModel.findByIdAndUpdate(id, u, opts || { new: true }).lean()
      : memoryStore.mandiRates.findByIdAndUpdate(id, u, opts),
  deleteOne: async (q: any) =>
    isConnectedToMongo ? MongooseMandiRateModel.deleteOne(q) : memoryStore.mandiRates.deleteOne(q),
  deleteMany: async (q: any = {}) =>
    isConnectedToMongo ? MongooseMandiRateModel.deleteMany(q) : memoryStore.mandiRates.deleteMany(q),
  countDocuments: async (q: any = {}) =>
    isConnectedToMongo ? MongooseMandiRateModel.countDocuments(q) : memoryStore.mandiRates.countDocuments(q),
  insertMany: async (docs: any[]) =>
    isConnectedToMongo ? MongooseMandiRateModel.insertMany(docs) : memoryStore.mandiRates.insertMany(docs),
};
