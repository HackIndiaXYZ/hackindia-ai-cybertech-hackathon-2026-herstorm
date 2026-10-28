import bcrypt from 'bcryptjs';
import { connectDB } from './db';
import { UserModel } from './models/User';
import { MandiRateModel } from './models/MandiRate';
import { ListingModel } from './models/Listing';
import { OrderModel } from './models/Order';
import { DeliveryGroupModel } from './models/DeliveryGroup';

export async function runSeed(verbose = true) {
  if (verbose) console.log('[TraceCrop Seed] Initializing database seeding...');
  await connectDB();

  // 1. Clear existing seed collections
  await UserModel.deleteMany({});
  await MandiRateModel.deleteMany({});
  await ListingModel.deleteMany({});
  await OrderModel.deleteMany({});
  await DeliveryGroupModel.deleteMany({});

  // 2. Hash default password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 3. Create demo users
  const farmer1 = await UserModel.create({
    name: 'Ramesh Patil',
    phone: '9876543210',
    passwordHash,
    role: 'farmer',
    address: 'Wadgaon Village, Haveli, Pune',
    lat: 18.4575,
    lng: 73.8654,
    createdAt: new Date(),
  });

  const farmer2 = await UserModel.create({
    name: 'Suresh Deshmukh',
    phone: '9876543211',
    passwordHash,
    role: 'farmer',
    address: 'Saswad Agri Belt, Purandar, Pune',
    lat: 18.3444,
    lng: 74.0305,
    createdAt: new Date(),
  });

  const fpo1 = await UserModel.create({
    name: 'Sahyadri Farmers Producer Co.',
    phone: '9876543220',
    passwordHash,
    role: 'fpo',
    address: 'Market Yard Hub, Gultekdi, Pune',
    lat: 18.4975,
    lng: 73.8697,
    createdAt: new Date(),
  });

  const customer1 = await UserModel.create({
    name: 'Priya Sharma',
    phone: '9876543230',
    passwordHash,
    role: 'customer',
    address: 'Flat 402, Shivajinagar Residency, Pune',
    lat: 18.5314,
    lng: 73.8446,
    createdAt: new Date(),
  });

  const customer2 = await UserModel.create({
    name: 'Amit Joshi',
    phone: '9876543231',
    passwordHash,
    role: 'customer',
    address: 'Bungalow 12, Mayur Colony, Kothrud, Pune',
    lat: 18.5074,
    lng: 73.8077,
    createdAt: new Date(),
  });

  if (verbose) {
    console.log('[TraceCrop Seed] Created 5 demo accounts (password: password123):');
    console.log(' - Farmer 1: 9876543210 (Ramesh Patil)');
    console.log(' - Farmer 2: 9876543211 (Suresh Deshmukh)');
    console.log(' - FPO Hub: 9876543220 (Sahyadri Farmers Producer Co.)');
    console.log(' - Customer 1: 9876543230 (Priya Sharma)');
    console.log(' - Customer 2: 9876543231 (Amit Joshi)');
  }

  // 4. Seed 24 realistic Mandi Rates
  const mandiData = [
    { crop: 'tomato', ratePerKg: 28, category: 'Vegetables' },
    { crop: 'potato', ratePerKg: 22, category: 'Vegetables' },
    { crop: 'onion', ratePerKg: 35, category: 'Vegetables' },
    { crop: 'carrot', ratePerKg: 40, category: 'Vegetables' },
    { crop: 'spinach', ratePerKg: 25, category: 'Vegetables' },
    { crop: 'cauliflower', ratePerKg: 32, category: 'Vegetables' },
    { crop: 'cabbage', ratePerKg: 20, category: 'Vegetables' },
    { crop: 'brinjal', ratePerKg: 30, category: 'Vegetables' },
    { crop: 'okra', ratePerKg: 45, category: 'Vegetables' },
    { crop: 'peas', ratePerKg: 65, category: 'Vegetables' },
    { crop: 'green chilli', ratePerKg: 50, category: 'Vegetables' },
    { crop: 'ginger', ratePerKg: 110, category: 'Vegetables' },
    { crop: 'garlic', ratePerKg: 140, category: 'Vegetables' },
    { crop: 'capsicum', ratePerKg: 48, category: 'Vegetables' },
    { crop: 'cucumber', ratePerKg: 26, category: 'Vegetables' },
    { crop: 'apple', ratePerKg: 120, category: 'Fruits' },
    { crop: 'banana', ratePerKg: 35, category: 'Fruits' },
    { crop: 'mango', ratePerKg: 160, category: 'Fruits' },
    { crop: 'orange', ratePerKg: 70, category: 'Fruits' },
    { crop: 'grapes', ratePerKg: 85, category: 'Fruits' },
    { crop: 'papaya', ratePerKg: 32, category: 'Fruits' },
    { crop: 'guava', ratePerKg: 55, category: 'Fruits' },
    { crop: 'lemon', ratePerKg: 75, category: 'Fruits' },
    { crop: 'pomegranate', ratePerKg: 130, category: 'Fruits' },
  ];

  await MandiRateModel.insertMany(
    mandiData.map((m) => ({
      crop: m.crop.toLowerCase(),
      ratePerKg: m.ratePerKg,
      category: m.category as any,
      updatedOn: new Date(),
    }))
  );
  if (verbose) console.log(`[TraceCrop Seed] Seeded ${mandiData.length} Mandi crop benchmarks.`);

  // 5. Seed Initial Produce Listings across various statuses
  const farmer1Id = String(farmer1._id || farmer1.id);
  const farmer2Id = String(farmer2._id || farmer2.id);
  const fpo1Id = String(fpo1._id || fpo1.id);

  const listingApproved1 = await ListingModel.create({
    farmerId: farmer1Id,
    farmerName: 'Ramesh Patil',
    fpoId: fpo1Id,
    name: 'Fresh Red Tomatoes (Grade A)',
    category: 'Vegetables',
    quantity: 120,
    price: 34,
    harvestDate: '2026-10-25',
    location: 'Wadgaon Farm 3, Haveli',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    aiGrade: 'A',
    aiReason: 'Uniform bright red pigment, firm skin texture, zero surface blemishes detected.',
    aiConfidence: 0.94,
    aiSource: 'gemini',
    mandiRate: 28,
    suggestedPrice: 33.6,
    priceFlagged: false,
    status: 'approved',
    rejectionReason: '',
    createdAt: new Date(Date.now() - 86400000 * 2),
  });

  const listingApproved2 = await ListingModel.create({
    farmerId: farmer1Id,
    farmerName: 'Ramesh Patil',
    fpoId: fpo1Id,
    name: 'Organically Grown Spinach',
    category: 'Vegetables',
    quantity: 45,
    price: 30,
    harvestDate: '2026-10-26',
    location: 'Wadgaon Farm 1, Haveli',
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
    aiGrade: 'A',
    aiReason: 'Deep green foliage, crisp stem structure, no wilting or fungal discoloration.',
    aiConfidence: 0.91,
    aiSource: 'gemini',
    mandiRate: 25,
    suggestedPrice: 30,
    priceFlagged: false,
    status: 'approved',
    rejectionReason: '',
    createdAt: new Date(Date.now() - 86400000),
  });

  const listingApproved3 = await ListingModel.create({
    farmerId: farmer2Id,
    farmerName: 'Suresh Deshmukh',
    fpoId: fpo1Id,
    name: 'Sweet Thompson Seedless Grapes',
    category: 'Fruits',
    quantity: 80,
    price: 102,
    harvestDate: '2026-10-26',
    location: 'Saswad Vineyard Plot B',
    imageUrl: 'https://images.unsplash.com/photo-1596363505729-4190a9506133?w=600&auto=format&fit=crop&q=80',
    aiGrade: 'A',
    aiReason: 'Well formed clusters, translucent green skin, high natural bloom integrity.',
    aiConfidence: 0.96,
    aiSource: 'gemini',
    mandiRate: 85,
    suggestedPrice: 102,
    priceFlagged: false,
    status: 'approved',
    rejectionReason: '',
    createdAt: new Date(Date.now() - 43200000),
  });

  const listingPending = await ListingModel.create({
    farmerId: farmer2Id,
    farmerName: 'Suresh Deshmukh',
    name: 'Farm Fresh Red Onions',
    category: 'Vegetables',
    quantity: 95,
    price: 58,
    harvestDate: '2026-10-26',
    location: 'Saswad Agri Plot A',
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    aiGrade: 'B',
    aiReason: 'Good outer dry skin coverage; minor diameter variance observed across batch.',
    aiConfidence: 0.88,
    aiSource: 'gemini',
    mandiRate: 35,
    suggestedPrice: 42,
    priceFlagged: true,
    status: 'pending_fpo',
    rejectionReason: '',
    createdAt: new Date(Date.now() - 10800000),
  });

  const listingAutoRejected = await ListingModel.create({
    farmerId: farmer1Id,
    farmerName: 'Ramesh Patil',
    name: 'Overripe Bruised Bananas',
    category: 'Fruits',
    quantity: 30,
    price: 25,
    harvestDate: '2026-10-20',
    location: 'Wadgaon Depot',
    imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80',
    aiGrade: 'C',
    aiReason: 'Extensive peel browning, softness indicators, and structural bruising exceeding quality threshold.',
    aiConfidence: 0.97,
    aiSource: 'gemini',
    mandiRate: 35,
    suggestedPrice: 42,
    priceFlagged: false,
    status: 'auto_rejected',
    rejectionReason: 'Automated AI Quality Gate: Grade C produce does not meet minimum marketplace freshness standards.',
    createdAt: new Date(Date.now() - 21600000),
  });

  const listingManualRejected = await ListingModel.create({
    farmerId: farmer2Id,
    farmerName: 'Suresh Deshmukh',
    fpoId: fpo1Id,
    name: 'Field Carrots (Batch 4)',
    category: 'Vegetables',
    quantity: 50,
    price: 48,
    harvestDate: '2026-10-22',
    location: 'Saswad Plot C',
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=600&auto=format&fit=crop&q=80',
    aiGrade: 'B',
    aiReason: 'Acceptable colouration with minor root splits.',
    aiConfidence: 0.82,
    aiSource: 'gemini',
    mandiRate: 40,
    suggestedPrice: 48,
    priceFlagged: false,
    status: 'rejected',
    rejectionReason: 'Excess soil residue on produce; physical cleaning and re-sorting required before market dispatch.',
    createdAt: new Date(Date.now() - 172800000),
  });

  if (verbose) {
    console.log('[TraceCrop Seed] Seeded produce listings:');
    console.log(' - 3 Approved listings (Tomatoes, Spinach, Grapes)');
    console.log(' - 1 Pending FPO review listing with price warning flag (Onions)');
    console.log(' - 1 Auto-rejected listing by AI quality gate (Overripe Bananas)');
    console.log(' - 1 FPO-rejected listing with audit reason (Field Carrots)');
  }

  // 6. Seed a sample customer order for demonstration
  const customer1Id = String(customer1._id || customer1.id);
  const sampleOrder = await OrderModel.create({
    customerId: customer1Id,
    customerName: customer1.name,
    customerPhone: customer1.phone,
    items: [
      {
        listingId: String(listingApproved1._id || listingApproved1.id),
        name: listingApproved1.name,
        qty: 5,
        price: listingApproved1.price,
      },
      {
        listingId: String(listingApproved2._id || listingApproved2.id),
        name: listingApproved2.name,
        qty: 2,
        price: listingApproved2.price,
      },
    ],
    totalAmount: 5 * listingApproved1.price + 2 * listingApproved2.price,
    deliveryAddress: customer1.address,
    deliveryLat: customer1.lat,
    deliveryLng: customer1.lng,
    status: 'placed',
    groupId: null,
    createdAt: new Date(),
    shippedAt: null,
  });

  if (verbose) {
    console.log(`[TraceCrop Seed] Seeded 1 initial customer order #${sampleOrder._id || sampleOrder.id} in 'placed' status.`);
    console.log('[TraceCrop Seed] Database seeding completed successfully.');
  }
}

// Standalone execution via `npm run seed`
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeed(true)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[TraceCrop Seed] Error running seed script:', err);
      process.exit(1);
    });
}
