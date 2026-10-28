import mongoose, { Document, Schema, Model } from 'mongoose';
import { isConnectedToMongo } from '../db';
import { memoryStore } from './memoryStore';

export interface IUser {
  _id?: string;
  name: string;
  phone: string;
  passwordHash: string;
  role: 'farmer' | 'fpo' | 'customer';
  address: string;
  lat: number;
  lng: number;
  createdAt: Date;
}

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'fpo', 'customer'], required: true },
    address: { type: String, default: '', trim: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const MongooseUserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export const UserModel = {
  find: async (q: any = {}) => (isConnectedToMongo ? MongooseUserModel.find(q).lean() : memoryStore.users.find(q)),
  findOne: async (q: any = {}) => (isConnectedToMongo ? MongooseUserModel.findOne(q).lean() : memoryStore.users.findOne(q)),
  findById: async (id: any) => (isConnectedToMongo ? MongooseUserModel.findById(id).lean() : memoryStore.users.findById(id)),
  create: async (data: any) => (isConnectedToMongo ? MongooseUserModel.create(data) : memoryStore.users.create(data)),
  findOneAndUpdate: async (q: any, u: any, opts?: any) =>
    isConnectedToMongo ? MongooseUserModel.findOneAndUpdate(q, u, opts || { new: true }).lean() : memoryStore.users.findOneAndUpdate(q, u, opts),
  findByIdAndUpdate: async (id: any, u: any, opts?: any) =>
    isConnectedToMongo ? MongooseUserModel.findByIdAndUpdate(id, u, opts || { new: true }).lean() : memoryStore.users.findByIdAndUpdate(id, u, opts),
  deleteOne: async (q: any) => (isConnectedToMongo ? MongooseUserModel.deleteOne(q) : memoryStore.users.deleteOne(q)),
  deleteMany: async (q: any = {}) => (isConnectedToMongo ? MongooseUserModel.deleteMany(q) : memoryStore.users.deleteMany(q)),
  countDocuments: async (q: any = {}) => (isConnectedToMongo ? MongooseUserModel.countDocuments(q) : memoryStore.users.countDocuments(q)),
  insertMany: async (docs: any[]) => (isConnectedToMongo ? MongooseUserModel.insertMany(docs) : memoryStore.users.insertMany(docs)),
};
