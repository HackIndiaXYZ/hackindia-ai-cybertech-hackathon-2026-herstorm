import mongoose, { Document, Schema, Model } from 'mongoose';
import { isConnectedToMongo } from '../db';
import { memoryStore } from './memoryStore';

export interface IListing {
  _id?: string;
  farmerId: string | any;
  farmerName?: string;
  fpoId?: string | any;
  name: string;
  category: 'Vegetables' | 'Fruits' | 'Other';
  quantity: number;
  price: number;
  harvestDate: string;
  location: string;
  imageUrl: string;
  aiGrade: 'A' | 'B' | 'C';
  aiReason: string;
  aiConfidence: number;
  aiSource: 'gemini' | 'fallback';
  mandiRate: number;
  suggestedPrice: number;
  priceFlagged: boolean;
  status: 'pending_fpo' | 'approved' | 'rejected' | 'auto_rejected';
  rejectionReason: string;
  createdAt: Date;
}

export interface IListingDocument extends Omit<IListing, '_id'>, Document {}

const ListingSchema = new Schema<IListingDocument>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    farmerName: { type: String, default: '' },
    fpoId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Vegetables', 'Fruits', 'Other'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    harvestDate: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    aiGrade: { type: String, enum: ['A', 'B', 'C'], default: 'B' },
    aiReason: { type: String, default: '' },
    aiConfidence: { type: Number, default: 0.8 },
    aiSource: { type: String, enum: ['gemini', 'fallback'], default: 'fallback' },
    mandiRate: { type: Number, default: 0 },
    suggestedPrice: { type: Number, default: 0 },
    priceFlagged: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending_fpo', 'approved', 'rejected', 'auto_rejected'],
      default: 'pending_fpo',
    },
    rejectionReason: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const MongooseListingModel: Model<IListingDocument> =
  mongoose.models.Listing || mongoose.model<IListingDocument>('Listing', ListingSchema);

export const ListingModel = {
  find: async (q: any = {}) => (isConnectedToMongo ? MongooseListingModel.find(q).lean() : memoryStore.listings.find(q)),
  findOne: async (q: any = {}) => (isConnectedToMongo ? MongooseListingModel.findOne(q).lean() : memoryStore.listings.findOne(q)),
  findById: async (id: any) => (isConnectedToMongo ? MongooseListingModel.findById(id).lean() : memoryStore.listings.findById(id)),
  create: async (data: any) => (isConnectedToMongo ? MongooseListingModel.create(data) : memoryStore.listings.create(data)),
  findOneAndUpdate: async (q: any, u: any, opts?: any) =>
    isConnectedToMongo ? MongooseListingModel.findOneAndUpdate(q, u, opts || { new: true }).lean() : memoryStore.listings.findOneAndUpdate(q, u, opts),
  findByIdAndUpdate: async (id: any, u: any, opts?: any) =>
    isConnectedToMongo ? MongooseListingModel.findByIdAndUpdate(id, u, opts || { new: true }).lean() : memoryStore.listings.findByIdAndUpdate(id, u, opts),
  deleteOne: async (q: any) => (isConnectedToMongo ? MongooseListingModel.deleteOne(q) : memoryStore.listings.deleteOne(q)),
  deleteMany: async (q: any = {}) => (isConnectedToMongo ? MongooseListingModel.deleteMany(q) : memoryStore.listings.deleteMany(q)),
  countDocuments: async (q: any = {}) => (isConnectedToMongo ? MongooseListingModel.countDocuments(q) : memoryStore.listings.countDocuments(q)),
  insertMany: async (docs: any[]) => (isConnectedToMongo ? MongooseListingModel.insertMany(docs) : memoryStore.listings.insertMany(docs)),
};
