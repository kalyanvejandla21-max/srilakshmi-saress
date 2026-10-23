import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { INITIAL_PRODUCTS, INITIAL_COUPONS, INITIAL_ANNOUNCEMENT } from './seedData.js';
import {
  isShiprocketConfigured,
  getPickupLocations,
  checkCourierServiceability,
  createShiprocketOrder,
  assignAwbToShipment,
  scheduleCourierPickup,
  trackAwbNumber,
} from './shiprocket.js';
import {
  isMailerConfigured,
  getNotificationEmail,
  getMailerProvider,
  getSenderEmail,
  parseAddress,
  sendOrderNotificationEmail,
  sendTestNotificationEmail,
} from './mailer.js';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// JWT Secret for Admin Sessions
const JWT_SECRET = process.env.JWT_SECRET || 'sls_jwt_secure_secret_prod_key_2026';

// Admin Credentials Configuration
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@srilakshmisarees.com').toLowerCase().trim();
// Pre-computed hash of default secure password or password from env
const DEFAULT_ADMIN_PASS_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin@SLS2026!', 10);

// --- SECURITY HEADERS MIDDLEWARE ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// --- IN-MEMORY RATE LIMITER (Zero extra dependency, sliding window) ---
const rateLimitMap = new Map();
const createRateLimiter = (windowMs, maxRequests, message) => {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'ip';
    const key = `${req.path}_${ip}`;
    const now = Date.now();
    const clientRecord = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > clientRecord.resetTime) {
      clientRecord.count = 0;
      clientRecord.resetTime = now + windowMs;
    }

    clientRecord.count += 1;
    rateLimitMap.set(key, clientRecord);

    if (clientRecord.count > maxRequests) {
      return res.status(429).json({
        error: message || 'Too many requests. Please try again later.',
        retryAfterMs: clientRecord.resetTime - now,
      });
    }

    next();
  };
};

// Cleanup old rate limit keys periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime + 60000) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);

// Dynamic Production & Development CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.trim());
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }

      return callback(null, true); // Permissive fallback for seamless customer checkout
    },
    credentials: true,
  })
);

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Serve static uploaded product images if any
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// --- MONGOOSE PRODUCT SCHEMA & MODEL ---
const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    fabric: { type: String, default: '' },
    color: { type: String, default: '' },
    pattern: { type: String, default: '' },
    occasion: { type: String, default: '' },
    sareeLength: { type: String, default: '5.5 Meters + 0.8 Meter Blouse Piece' },
    blouseIncluded: { type: Boolean, default: true },
    careInstructions: { type: String, default: 'Dry Clean Only' },
    description: { type: String, default: '' },
    stock: { type: Number, required: true, default: 0, min: 0 },
    images: { type: [String], default: [] },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    isDemo: { type: Boolean, default: false },
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 0 },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false, timestamps: false }
);

export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// --- MONGOOSE ORDER SCHEMA & MODEL ---
const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const ShippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    houseNo: { type: String, default: '' },
    street: { type: String, default: '' },
    locality: { type: String, default: '' },
    landmark: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
  },
  { _id: false, strict: false }
);

const OrderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: null },
    guestEmail: { type: String, default: '' },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    finalTotal: { type: Number, required: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, default: 'Pending' },
    orderStatus: { type: String, default: 'Order Placed' },
    courierName: { type: String, default: '' },
    awbNumber: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },
    shipmentId: { type: String, default: '' },
    cashfreeOrderId: { type: String, default: null, index: true },
    cashfreePaymentId: { type: String, default: null, index: true },
    cashfreePaymentSessionId: { type: String, default: null },
    cashfreePaymentStatus: { type: String, default: null },
    razorpayOrderId: { type: String, default: null, index: true },
    razorpayPaymentId: { type: String, default: null, index: true },
    razorpaySignature: { type: String, default: null },
    paymentFailureReason: { type: String, default: null },
    idempotencyKey: { type: String, default: null, index: true },
    emailNotificationSent: { type: Boolean, default: false },
    emailNotificationSentAt: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false, timestamps: false }
);

export const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);

// --- DEVELOPMENT LOCAL FILE PERSISTENCE (OFFLINE FALLBACK ONLY) ---
const DATA_FILE = path.join(__dirname, '../data/store_db.json');

if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

const getDbData = () => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.products || parsed.products.length === 0) {
      parsed.products = INITIAL_PRODUCTS;
    }
    if (!parsed.coupons || parsed.coupons.length === 0) {
      parsed.coupons = INITIAL_COUPONS;
    }
    if (!parsed.announcement) {
      parsed.announcement = INITIAL_ANNOUNCEMENT;
    }
    return parsed;
  } catch {
    return {
      products: INITIAL_PRODUCTS,
      orders: [],
      coupons: INITIAL_COUPONS,
      announcement: INITIAL_ANNOUNCEMENT,
    };
  }
};

const saveDbData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Ensure initial local JSON store contains initial seed data
const initialLocal = getDbData();
saveDbData(initialLocal);

// Helper: Check if MongoDB connection is active
export const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1;

// Seed MongoDB with initial products if empty upon connection
const seedMongoIfEmpty = async () => {
  try {
    const count = await ProductModel.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding initial demo saree products into MongoDB Atlas...');
      await ProductModel.insertMany(INITIAL_PRODUCTS);
      console.log('✅ Demo products seeded successfully.');
    }
  } catch (err) {
    console.warn('⚠️ Could not verify/seed MongoDB products:', err.message);
  }
};

// MongoDB Connection Lifecycle
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('📦 Connected securely to MongoDB Atlas / Cloud Database');
      await seedMongoIfEmpty();
    })
    .catch((err) => {
      console.warn('⚠️ MongoDB connection error:', err.message);
    });
} else {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL: MONGODB_URI is not set in production! Orders will not be persisted.');
  } else {
    console.log('ℹ️ MONGODB_URI not provided. Running in development mode with local store.');
  }
}

// Generate unique order number (checks MongoDB or local DB to prevent collisions)
const generateUniqueOrderNumber = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `SLS-${Math.floor(100000 + Math.random() * 900000)}`;
    if (isMongoReady()) {
      const exists = await OrderModel.findOne({ orderNumber: candidate }).lean();
      if (!exists) return candidate;
    } else {
      const db = getDbData();
      const exists = (db.orders || []).some((o) => o.orderNumber === candidate);
      if (!exists) return candidate;
    }
  }
  return `SLS-${Math.floor(100000 + Math.random() * 900000)}-${Date.now().toString().slice(-4)}`;
};

// --- AUTHENTICATION & AUTHORIZATION MIDDLEWARE ---
export const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient administrative privileges' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin token' });
  }
};

// Rate Limiters
const orderLimiter = createRateLimiter(60000, 15, 'Too many order requests. Please wait a minute.');
const trackingLimiter = createRateLimiter(60000, 45, 'Too many tracking requests.');
const loginLimiter = createRateLimiter(60000, 8, 'Too many login attempts. Please wait a minute.');

// ==========================================
// --- PUBLIC API ENDPOINTS ---
// ==========================================

// Health check endpoint (reports actual database connectivity without exposing secrets)
app.get('/api/health', async (req, res) => {
  const readyState = mongoose.connection ? mongoose.connection.readyState : 0;
  const stateLabels = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const connectionState = stateLabels[readyState] || 'unknown';

  let pingOk = false;
  let latencyMs = null;

  if (readyState === 1 && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      latencyMs = Date.now() - start;
      pingOk = true;
    } catch {
      pingOk = false;
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isHealthy = isProduction ? readyState === 1 && pingOk : true;

  const healthPayload = {
    status: isHealthy ? 'ok' : 'degraded',
    store: 'Sri Lakshmi Sarees API',
    database: {
      type: readyState === 1 ? 'mongodb' : isProduction ? 'none' : 'json-store',
      state: connectionState,
      ping: pingOk ? 'ok' : 'unreachable',
      ...(latencyMs !== null ? { latencyMs } : {}),
    },
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  };

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(healthPayload);
});

// Announcement banner
app.get('/api/announcement', (req, res) => {
  const db = getDbData();
  res.json(db.announcement || INITIAL_ANNOUNCEMENT);
});

// Public Products Catalog Endpoint
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, fabric, color, occasion, inStock, limit } = req.query;

    let products = [];
    if (isMongoReady()) {
      const query = { isActive: true };
      if (category && category !== 'All') {
        query.category = category;
      }
      if (fabric && fabric !== 'All') {
        query.fabric = fabric;
      }
      if (color && color !== 'All') {
        query.color = new RegExp(color, 'i');
      }
      if (occasion && occasion !== 'All') {
        query.occasion = new RegExp(occasion, 'i');
      }
      if (inStock === 'true') {
        query.stock = { $gt: 0 };
      }
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: regex }, { sku: regex }, { fabric: regex }, { description: regex }];
      }

      let mongoQuery = ProductModel.find(query).sort({ createdAt: -1 });
      if (limit) {
        mongoQuery = mongoQuery.limit(parseInt(limit, 10));
      }
      products = await mongoQuery.lean();
    } else {
      const db = getDbData();
      products = (db.products || []).filter((p) => p.isActive);
      if (category && category !== 'All') {
        products = products.filter((p) => p.category === category);
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.fabric.toLowerCase().includes(q)
        );
      }
      if (inStock === 'true') {
        products = products.filter((p) => p.stock > 0);
      }
    }

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve products', details: error.message });
  }
});

// Public Single Product Lookup by Slug or ID
app.get('/api/products/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let product = null;

    if (isMongoReady()) {
      product = await ProductModel.findOne({
        $or: [{ slug: slugOrId }, { id: slugOrId }, { sku: slugOrId }],
        isActive: true,
      }).lean();
    } else {
      const db = getDbData();
      product = (db.products || []).find(
        (p) => (p.slug === slugOrId || p.id === slugOrId || p.sku === slugOrId) && p.isActive
      );
    }

    if (!product) {
      return res.status(404).json({ error: 'Saree not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve product', details: error.message });
  }
});

// Public Active Coupons Endpoint
app.get('/api/coupons', (req, res) => {
  const db = getDbData();
  const activeCoupons = (db.coupons || INITIAL_COUPONS).filter((c) => c.isActive);
  res.json({ success: true, coupons: activeCoupons });
});

// Create Order API with Authoritative Server-Side Price & Total Calculation
app.post('/api/orders', orderLimiter, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      couponCode,
      guestEmail,
      idempotencyKey,
    } = req.body;

    // 1. Validation of required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items cannot be empty' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone) {
      return res.status(400).json({ error: 'Valid shipping address with fullName and 10-digit phone is required' });
    }

    const cleanPhone = String(shippingAddress.phone).replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit Indian mobile number' });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const mongoConnected = isMongoReady();

    // STRICT PRODUCTION SAFEGUARD:
    // In production, never report success unless MongoDB is connected and ready.
    if (isProduction && !mongoConnected) {
      return res.status(503).json({
        error: 'Database service unavailable. Order could not be securely persisted.',
        code: 'DB_UNAVAILABLE',
      });
    }

    // 2. Idempotency Check: Prevent duplicate submissions
    if (idempotencyKey) {
      if (mongoConnected) {
        const existingOrder = await OrderModel.findOne({ idempotencyKey }).lean();
        if (existingOrder) {
          delete existingOrder._id;
          return res.status(200).json({
            success: true,
            isDuplicate: true,
            order: existingOrder,
            message: 'Order already created with this submission token',
          });
        }
      } else {
        const db = getDbData();
        const existingOrder = (db.orders || []).find((o) => o.idempotencyKey === idempotencyKey);
        if (existingOrder) {
          return res.status(200).json({
            success: true,
            isDuplicate: true,
            order: existingOrder,
            message: 'Order already created with this submission token',
          });
        }
      }
    }

    // 3. Authoritative Product & Price Verification
    // Retrieve canonical products from DB/fallback
    const validatedItems = [];
    let authoritativeSubtotal = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ error: 'Invalid item quantity or product ID in order request' });
      }

      let canonicalProduct = null;
      if (mongoConnected) {
        canonicalProduct = await ProductModel.findOne({ id: item.productId, isActive: true }).lean();
      } else {
        const db = getDbData();
        canonicalProduct = (db.products || []).find((p) => p.id === item.productId && p.isActive);
      }

      if (!canonicalProduct) {
        return res.status(400).json({
          error: `Product with ID ${item.productId} is not available in our active catalog`,
        });
      }

      // Check Inventory
      if (canonicalProduct.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${canonicalProduct.name}". Only ${canonicalProduct.stock} left in inventory.`,
        });
      }

      const authoritativePrice = Number(canonicalProduct.price);
      const lineTotal = authoritativePrice * item.quantity;
      authoritativeSubtotal += lineTotal;

      validatedItems.push({
        productId: canonicalProduct.id,
        productName: canonicalProduct.name,
        image: canonicalProduct.images[0] || item.image || '',
        price: authoritativePrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    // 4. Authoritative Coupon Verification
    let authoritativeDiscount = 0;
    let validatedCoupon = null;

    if (couponCode && String(couponCode).trim()) {
      const cleanCoupon = String(couponCode).trim().toUpperCase();
      const allCoupons = getDbData().coupons || INITIAL_COUPONS;
      const foundCoupon = allCoupons.find((c) => c.code.toUpperCase() === cleanCoupon && c.isActive);

      if (foundCoupon && authoritativeSubtotal >= foundCoupon.minOrderValue) {
        validatedCoupon = foundCoupon.code;
        if (foundCoupon.discountType === 'percentage') {
          authoritativeDiscount = Math.round((authoritativeSubtotal * foundCoupon.discountValue) / 100);
        } else {
          authoritativeDiscount = foundCoupon.discountValue;
        }
      }
    }

    // 5. Authoritative Shipping & Final Total Calculation
    // Free express delivery over ₹2,999; otherwise ₹150 flat shipping
    const shippingCharge = authoritativeSubtotal >= 2999 ? 0 : 150;
    const authoritativeFinalTotal = Math.max(0, authoritativeSubtotal - authoritativeDiscount + shippingCharge);

    const orderNumber = await generateUniqueOrderNumber();

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: req.body.userId || null,
      guestEmail: guestEmail || (shippingAddress && shippingAddress.email) || '',
      items: validatedItems,
      subtotal: authoritativeSubtotal,
      shippingCharge,
      discount: authoritativeDiscount,
      couponCode: validatedCoupon,
      finalTotal: authoritativeFinalTotal,
      shippingAddress: {
        ...shippingAddress,
        phone: cleanPhone,
      },
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Order Placed',
      courierName: '',
      awbNumber: '',
      trackingUrl: '',
      shipmentId: '',
      cashfreeOrderId: null,
      cashfreePaymentId: null,
      cashfreePaymentSessionId: null,
      cashfreePaymentStatus: null,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      razorpaySignature: null,
      paymentFailureReason: null,
      idempotencyKey: idempotencyKey || null,
      emailNotificationSent: false,
      emailNotificationSentAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 6. Persistence to MongoDB Atlas
    if (mongoConnected) {
      try {
        const createdDoc = await OrderModel.create(newOrder);

        // Safely decrement stock for ordered items
        for (const item of validatedItems) {
          await ProductModel.updateOne(
            { id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } }
          );
        }

        const orderResponse = createdDoc.toObject ? createdDoc.toObject() : createdDoc;
        delete orderResponse._id;

        // If Cash on Delivery, order is confirmed immediately. Trigger email alert asynchronously.
        if (newOrder.paymentMethod === 'COD') {
          sendOrderNotificationEmail(orderResponse).then(async (mailResult) => {
            if (mailResult && mailResult.success) {
              await OrderModel.updateOne(
                { id: orderResponse.id },
                { $set: { emailNotificationSent: true, emailNotificationSentAt: new Date().toISOString() } }
              ).catch((e) => console.error('[Order] Failed to mark email notification sent:', e.message));
            }
          }).catch((err) => console.error('[Order] Error in email notification flow:', err.message));
        }

        return res.status(201).json({ success: true, order: orderResponse });
      } catch (dbErr) {
        if (dbErr.code === 11000) {
          console.warn('Collision detected on order identifier. Retrying with fresh unique key...');
          newOrder.orderNumber = `SLS-${Math.floor(100000 + Math.random() * 900000)}-${Date.now().toString().slice(-4)}`;
          newOrder.id = `ord-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
          try {
            const retryDoc = await OrderModel.create(newOrder);
            const retryResponse = retryDoc.toObject ? retryDoc.toObject() : retryDoc;
            delete retryResponse._id;

            if (newOrder.paymentMethod === 'COD') {
              sendOrderNotificationEmail(retryResponse).then(async (mailResult) => {
                if (mailResult && mailResult.success) {
                  await OrderModel.updateOne(
                    { id: retryResponse.id },
                    { $set: { emailNotificationSent: true, emailNotificationSentAt: new Date().toISOString() } }
                  ).catch((e) => console.error('[Order] Failed to mark email notification sent:', e.message));
                }
              }).catch((err) => console.error('[Order] Error in email notification flow:', err.message));
            }

            return res.status(201).json({ success: true, order: retryResponse });
          } catch (retryErr) {
            console.error('Fatal retry error saving order to MongoDB:', retryErr.message);
            return res.status(500).json({ error: 'Failed to persist order to database', details: retryErr.message });
          }
        }

        console.error('Failed to save order to MongoDB:', dbErr.message);
        return res.status(500).json({
          error: 'Failed to persist order to database',
          details: dbErr.message,
        });
      }
    }

    // Strict Production Guard
    if (isProduction) {
      return res.status(503).json({
        error: 'Database service unavailable. Order could not be securely persisted.',
        code: 'DB_UNAVAILABLE',
      });
    }

    // 7. Development Offline Fallback Only (Never reached in production)
    const db = getDbData();
    db.orders = db.orders || [];
    db.orders.unshift(newOrder);

    // Decrement local stock
    if (db.products) {
      for (const item of validatedItems) {
        const p = db.products.find((prod) => prod.id === item.productId);
        if (p) p.stock = Math.max(0, p.stock - item.quantity);
      }
    }
    saveDbData(db);

    if (newOrder.paymentMethod === 'COD') {
      sendOrderNotificationEmail(newOrder).catch((err) =>
        console.error('[Order] Error in dev email notification flow:', err.message)
      );
    }

    return res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// Secure Privacy-Preserving Order Tracking Endpoint
// Protects customer delivery details unless verified with registered phone or email
app.get('/api/orders/:idOrNumber', trackingLimiter, async (req, res) => {
  try {
    const { idOrNumber } = req.params;
    const { phone, email } = req.query;

    if (!idOrNumber || !idOrNumber.trim()) {
      return res.status(400).json({ error: 'Order identifier is required' });
    }

    const cleanQuery = idOrNumber.trim().toUpperCase();
    let foundOrder = null;

    // 1. Try MongoDB first if connected
    if (isMongoReady()) {
      foundOrder = await OrderModel.findOne({
        $or: [{ orderNumber: cleanQuery }, { id: idOrNumber.trim() }],
      }).lean();
    }

    // 2. In dev mode, check local JSON store
    if (!foundOrder && process.env.NODE_ENV !== 'production') {
      const db = getDbData();
      foundOrder = (db.orders || []).find(
        (o) =>
          (o.orderNumber && o.orderNumber.toUpperCase() === cleanQuery) ||
          (o.id && o.id === idOrNumber.trim())
      );
    }

    if (!foundOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Remove internal database _id
    const { _id, ...cleanOrder } = foundOrder;

    // Check Verification: Match registered phone or email
    const orderPhone = (cleanOrder.shippingAddress && cleanOrder.shippingAddress.phone) || '';
    const cleanOrderPhone = String(orderPhone).replace(/\D/g, '');
    const cleanInputPhone = phone ? String(phone).replace(/\D/g, '') : '';
    const cleanInputEmail = email ? String(email).trim().toLowerCase() : '';
    const orderEmail = (cleanOrder.guestEmail || (cleanOrder.shippingAddress && cleanOrder.shippingAddress.email) || '').toLowerCase();

    const isVerified =
      (cleanInputPhone && cleanOrderPhone && cleanOrderPhone.endsWith(cleanInputPhone.slice(-10))) ||
      (cleanInputEmail && orderEmail && cleanInputEmail === orderEmail);

    if (isVerified) {
      // Return full verified order details
      return res.json({
        success: true,
        isVerified: true,
        order: cleanOrder,
      });
    }

    // Mask sensitive customer delivery information for unverified public queries
    const recipientName = cleanOrder.shippingAddress?.fullName || 'Customer';
    const nameParts = recipientName.split(' ');
    const maskedName = nameParts.map((p) => p.charAt(0) + '*'.repeat(Math.max(1, p.length - 1))).join(' ');

    const sanitizedOrder = {
      orderNumber: cleanOrder.orderNumber,
      orderStatus: cleanOrder.orderStatus,
      createdAt: cleanOrder.createdAt,
      courierName: cleanOrder.courierName,
      awbNumber: cleanOrder.awbNumber,
      trackingUrl: cleanOrder.trackingUrl,
      paymentMethod: cleanOrder.paymentMethod,
      paymentStatus: cleanOrder.paymentStatus,
      itemsCount: cleanOrder.items.reduce((sum, i) => sum + i.quantity, 0),
      items: cleanOrder.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        image: i.image,
      })),
      shippingAddress: {
        fullName: maskedName,
        city: cleanOrder.shippingAddress?.city || 'Regional Hub',
        state: cleanOrder.shippingAddress?.state || 'India',
      },
    };

    return res.json({
      success: true,
      isVerified: false,
      order: sanitizedOrder,
      message: 'Enter your 10-digit registered mobile phone number to view full invoice and exact address.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve order', details: error.message });
  }
});

// ==========================================
// --- ADMIN AUTHENTICATION & MANAGEMENT ---
// ==========================================

// Admin Login Endpoint
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const inputEmail = String(email).toLowerCase().trim();

    // Verify email against configured admin email
    if (inputEmail !== ADMIN_EMAIL) {
      return res.status(401).json({ error: 'Invalid administrator credentials' });
    }

    // Verify password against secure bcrypt hash
    const isPasswordValid = bcrypt.compareSync(password, DEFAULT_ADMIN_PASS_HASH);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid administrator credentials' });
    }

    // Generate signed JWT token valid for 24 hours
    const token = jwt.sign(
      { email: ADMIN_EMAIL, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        email: ADMIN_EMAIL,
        role: 'admin',
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Admin authentication failed', details: error.message });
  }
});

// Admin Stats Endpoint
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    let orders = [];
    let products = [];

    if (isMongoReady()) {
      orders = await OrderModel.find().lean();
      products = await ProductModel.find().lean();
    } else {
      const db = getDbData();
      orders = db.orders || [];
      products = db.products || [];
    }

    const totalRevenue = orders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
    const lowStockCount = products.filter((p) => p.stock <= 5 && p.isActive).length;
    const activeProductsCount = products.filter((p) => p.isActive).length;

    res.json({
      success: true,
      stats: {
        totalRevenue,
        ordersCount: orders.length,
        activeProductsCount,
        lowStockCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve stats', details: error.message });
  }
});

// Admin: Get All Orders
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    let orders = [];
    if (isMongoReady()) {
      orders = await OrderModel.find().sort({ createdAt: -1 }).lean();
    } else {
      const db = getDbData();
      orders = db.orders || [];
    }

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve admin orders', details: error.message });
  }
});

// Admin: Update Order Status & Courier Dispatch Details
app.patch('/api/admin/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, courierName, awbNumber, trackingUrl } = req.body;

    const updateFields = { updatedAt: new Date().toISOString() };
    if (orderStatus) updateFields.orderStatus = orderStatus;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;
    if (courierName) updateFields.courierName = courierName;
    if (awbNumber) updateFields.awbNumber = awbNumber;
    if (trackingUrl) updateFields.trackingUrl = trackingUrl;

    if (isMongoReady()) {
      const updated = await OrderModel.findOneAndUpdate(
        { $or: [{ id }, { orderNumber: id }] },
        { $set: updateFields },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ error: 'Order not found' });
      }

      delete updated._id;
      return res.json({ success: true, order: updated });
    } else {
      const db = getDbData();
      const order = (db.orders || []).find((o) => o.id === id || o.orderNumber === id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      Object.assign(order, updateFields);
      saveDbData(db);
      return res.json({ success: true, order });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status', details: error.message });
  }
});

// Admin: Create New Product
app.post('/api/admin/products', authenticateAdmin, async (req, res) => {
  try {
    const productData = req.body;
    if (!productData.name || !productData.price || !productData.category) {
      return res.status(400).json({ error: 'Product name, price, and category are required' });
    }

    const slug =
      productData.slug ||
      productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const id = `prod-${Date.now()}`;
    const sku = productData.sku || `SLS-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProduct = {
      ...productData,
      id,
      sku,
      slug,
      price: Number(productData.price),
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : 0,
      stock: Number(productData.stock) || 0,
      isActive: productData.isActive !== false,
      isDemo: false, // User created real products are never demo
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isMongoReady()) {
      const created = await ProductModel.create(newProduct);
      const resObj = created.toObject ? created.toObject() : created;
      delete resObj._id;
      return res.status(201).json({ success: true, product: resObj });
    } else {
      const db = getDbData();
      db.products = db.products || [];
      db.products.unshift(newProduct);
      saveDbData(db);
      return res.status(201).json({ success: true, product: newProduct });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

// Admin: Update Product (price, stock, details, isActive)
app.put('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates._id;

    if (updates.price) updates.price = Number(updates.price);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);

    if (isMongoReady()) {
      const updated = await ProductModel.findOneAndUpdate(
        { $or: [{ id }, { sku: id }] },
        { $set: updates },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ error: 'Product not found' });
      }

      delete updated._id;
      return res.json({ success: true, product: updated });
    } else {
      const db = getDbData();
      const product = (db.products || []).find((p) => p.id === id || p.sku === id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      Object.assign(product, updates);
      saveDbData(db);
      return res.json({ success: true, product });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// Admin: Archive Product
app.delete('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoReady()) {
      const archived = await ProductModel.findOneAndUpdate(
        { $or: [{ id }, { sku: id }] },
        { $set: { isActive: false, updatedAt: new Date().toISOString() } },
        { new: true }
      ).lean();

      if (!archived) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.json({ success: true, message: 'Product archived successfully' });
    } else {
      const db = getDbData();
      const product = (db.products || []).find((p) => p.id === id || p.sku === id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      product.isActive = false;
      saveDbData(db);
      return res.json({ success: true, message: 'Product archived successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive product', details: error.message });
  }
});

// Admin: Seed or Reset Demo Catalog
app.post('/api/admin/products/reset-demo', authenticateAdmin, async (req, res) => {
  try {
    if (isMongoReady()) {
      await ProductModel.deleteMany({ isDemo: true });
      await ProductModel.insertMany(INITIAL_PRODUCTS);
    } else {
      const db = getDbData();
      db.products = INITIAL_PRODUCTS;
      saveDbData(db);
    }

    res.json({ success: true, message: 'Demo saree catalog restored successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset demo catalog', details: error.message });
  }
});

// ==========================================
// --- PAYMENT & SHIPPING INTEGRATION BOUNDARIES ---
// ==========================================

// --- CASHFREE PAYMENT GATEWAY HELPER ---
function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();
  const rawEnv = (process.env.CASHFREE_ENV || process.env.CASHFREE_ENVIRONMENT || 'TEST').trim().toUpperCase();
  const isProduction = rawEnv === 'PRODUCTION' || rawEnv === 'PROD';
  const apiVersion = process.env.CASHFREE_API_VERSION?.trim() || '2023-08-01';

  const baseUrl = isProduction ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
  const isConfigured = Boolean(
    appId &&
    secretKey &&
    !appId.includes('placeholder') &&
    !secretKey.includes('placeholder') &&
    secretKey !== 'test_cashfree_secret_key'
  );

  return {
    appId,
    secretKey,
    isProduction,
    environment: isProduction ? 'production' : 'sandbox',
    apiVersion,
    baseUrl,
    isConfigured,
  };
}

// Public Payment Gateway Status (Read-only configuration; strictly no secret keys exposed)
app.get('/api/payments/config', (req, res) => {
  const cfConfig = getCashfreeConfig();
  const rzpKeyId = process.env.RAZORPAY_KEY_ID?.trim();
  const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const isRzpConfigured = Boolean(
    rzpKeyId &&
    rzpKeySecret &&
    rzpKeySecret !== 'test_razorpay_secret_key' &&
    !rzpKeyId.includes('placeholder')
  );

  res.json({
    cashfree: {
      configured: cfConfig.isConfigured,
      environment: cfConfig.environment,
      apiVersion: cfConfig.apiVersion,
    },
    razorpay: {
      configured: isRzpConfigured,
      keyId: isRzpConfigured ? rzpKeyId : null,
    },
    activeGateway: cfConfig.isConfigured ? 'cashfree' : (isRzpConfigured ? 'razorpay' : 'none'),
  });
});

// Cashfree Order Creation Endpoint (Authoritative Server-side creation)
app.post('/api/payments/create-cashfree-order', orderLimiter, async (req, res) => {
  try {
    const { orderNumber } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ error: 'orderNumber is required' });
    }

    const cfConfig = getCashfreeConfig();
    if (!cfConfig.isConfigured) {
      return res.status(400).json({
        success: false,
        code: 'GATEWAY_NOT_CONFIGURED',
        message: 'Cashfree payment keys are not configured in the server environment. Please set up merchant credentials on Render.',
      });
    }

    let order = null;
    if (isMongoReady()) {
      order = await OrderModel.findOne({ orderNumber }).lean();
    } else {
      const db = getDbData();
      order = (db.orders || []).find((o) => o.orderNumber === orderNumber);
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ error: 'Order has already been paid and confirmed' });
    }

    const finalAmount = Number(order.finalTotal);
    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid order amount for online payment' });
    }

    const rawPhone = order.shippingAddress?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10) || '9999999999';
    const customerId = `cust_${cleanPhone || order.id || Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
    const customerEmail = order.guestEmail || order.shippingAddress?.email || 'customer@srilakshmisarees.com';
    const customerName = (order.shippingAddress?.fullName || 'Customer').slice(0, 100);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const returnUrl = `${clientUrl.replace(/\/$/, '')}/order-confirmation/${order.orderNumber}?order_id={order_id}&orderNumber=${order.orderNumber}`;

    const cfRequestBody = {
      order_id: order.orderNumber,
      order_amount: Number(finalAmount.toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: cleanPhone,
      },
      order_meta: {
        return_url: returnUrl,
      },
      order_note: `Sri Lakshmi Sarees Order #${order.orderNumber}`,
    };

    const cfResponse = await fetch(`${cfConfig.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': cfConfig.apiVersion,
        'x-client-id': cfConfig.appId,
        'x-client-secret': cfConfig.secretKey,
      },
      body: JSON.stringify(cfRequestBody),
    });

    const cfData = await cfResponse.json().catch(() => ({}));

    if (!cfResponse.ok || !cfData.payment_session_id) {
      const errDetail = cfData.message || cfData.error || `Cashfree order creation failed (${cfResponse.status})`;
      return res.status(cfResponse.status || 500).json({
        error: 'Cashfree order creation failed',
        details: errDetail,
      });
    }

    // Persist cashfreeOrderId and cashfreePaymentSessionId in order record
    const updateFields = {
      cashfreeOrderId: cfData.order_id || order.orderNumber,
      cashfreePaymentSessionId: cfData.payment_session_id,
      updatedAt: new Date().toISOString(),
    };

    if (isMongoReady()) {
      await OrderModel.updateOne({ orderNumber }, { $set: updateFields });
    } else {
      const db = getDbData();
      const localOrd = (db.orders || []).find((o) => o.orderNumber === orderNumber);
      if (localOrd) {
        Object.assign(localOrd, updateFields);
        saveDbData(db);
      }
    }

    // Strictly return session ID and order details to client without exposing secret key
    res.json({
      success: true,
      paymentSessionId: cfData.payment_session_id,
      orderId: cfData.order_id || order.orderNumber,
      cfOrderId: cfData.cf_order_id,
      orderNumber: order.orderNumber,
      amount: cfData.order_amount,
      currency: cfData.order_currency,
      environment: cfConfig.environment,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Cashfree order', details: error.message });
  }
});

// Cashfree Payment Verification Endpoint (Authoritative Server-side Verification)
app.post('/api/payments/verify-cashfree', async (req, res) => {
  try {
    const { orderNumber } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ success: false, message: 'orderNumber is required' });
    }

    const cfConfig = getCashfreeConfig();
    if (!cfConfig.isConfigured) {
      return res.status(400).json({
        success: false,
        code: 'GATEWAY_NOT_CONFIGURED',
        message: 'Cashfree payment keys are not configured in the server environment. Please set up merchant credentials on Render.',
      });
    }

    let order = null;
    if (isMongoReady()) {
      order = await OrderModel.findOne({ orderNumber }).lean();
    } else {
      const db = getDbData();
      order = (db.orders || []).find((o) => o.orderNumber === orderNumber);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'Paid') {
      return res.json({
        success: true,
        message: 'Order has already been verified and paid',
        order,
      });
    }

    const cashfreeOrderId = order.cashfreeOrderId || order.orderNumber;

    // 1. Authoritative query: Fetch payment attempts for this order from Cashfree
    const paymentsResponse = await fetch(
      `${cfConfig.baseUrl}/orders/${encodeURIComponent(cashfreeOrderId)}/payments`,
      {
        method: 'GET',
        headers: {
          'x-api-version': cfConfig.apiVersion,
          'x-client-id': cfConfig.appId,
          'x-client-secret': cfConfig.secretKey,
        },
      }
    );

    const paymentsData = await paymentsResponse.json().catch(() => null);

    // 2. Authoritative query: Fetch order entity from Cashfree
    const orderResponse = await fetch(
      `${cfConfig.baseUrl}/orders/${encodeURIComponent(cashfreeOrderId)}`,
      {
        method: 'GET',
        headers: {
          'x-api-version': cfConfig.apiVersion,
          'x-client-id': cfConfig.appId,
          'x-client-secret': cfConfig.secretKey,
        },
      }
    );
    const orderData = await orderResponse.json().catch(() => null);

    let successfulPayment = null;
    let failedPayment = null;

    if (Array.isArray(paymentsData)) {
      successfulPayment = paymentsData.find((p) => p.payment_status === 'SUCCESS');
      failedPayment = paymentsData.find((p) => p.payment_status === 'FAILED' || p.payment_status === 'USER_DROPPED');
    }

    const isPaidOnCashfree =
      Boolean(successfulPayment) || (orderData && orderData.order_status === 'PAID');

    if (!isPaidOnCashfree) {
      const failureReason =
        (successfulPayment && successfulPayment.payment_message) ||
        (failedPayment && failedPayment.payment_message) ||
        (orderData && `Cashfree order status is ${orderData.order_status}`) ||
        'No successful payment found on Cashfree';

      if (failedPayment || (orderData && (orderData.order_status === 'EXPIRED' || orderData.order_status === 'TERMINATED'))) {
        const failFields = {
          paymentStatus: 'Failed',
          paymentFailureReason: failureReason,
          updatedAt: new Date().toISOString(),
        };

        if (isMongoReady()) {
          await OrderModel.updateOne({ orderNumber }, { $set: failFields });
        } else {
          const db = getDbData();
          const localOrd = (db.orders || []).find((o) => o.orderNumber === orderNumber);
          if (localOrd) {
            Object.assign(localOrd, failFields);
            saveDbData(db);
          }
        }
      }

      return res.status(400).json({
        success: false,
        paymentStatus: 'Pending',
        message: 'Payment verification failed: No successful payment transaction confirmed by Cashfree.',
        details: failureReason,
      });
    }

    // Payment Authoritatively Verified! Update order status to 'Paid' and 'Payment Confirmed'
    const cfPaymentId = successfulPayment
      ? String(successfulPayment.cf_payment_id)
      : String(orderData?.cf_order_id || 'cf_verified');

    const updateFields = {
      paymentStatus: 'Paid',
      orderStatus: 'Payment Confirmed',
      cashfreePaymentId: cfPaymentId,
      cashfreeOrderId: cashfreeOrderId,
      cashfreePaymentStatus: 'SUCCESS',
      paymentFailureReason: null,
      updatedAt: new Date().toISOString(),
    };

    let updatedOrder = null;
    if (isMongoReady()) {
      updatedOrder = await OrderModel.findOneAndUpdate(
        { orderNumber },
        { $set: updateFields },
        { new: true }
      ).lean();
      if (updatedOrder) delete updatedOrder._id;
    } else {
      const db = getDbData();
      const localOrd = (db.orders || []).find((o) => o.orderNumber === orderNumber);
      if (localOrd) {
        Object.assign(localOrd, updateFields);
        saveDbData(db);
        updatedOrder = localOrd;
      }
    }

    // Trigger order confirmation email asynchronously
    if (updatedOrder && !updatedOrder.emailNotificationSent) {
      sendOrderNotificationEmail(updatedOrder).then(async (mailResult) => {
        if (mailResult && mailResult.success) {
          if (isMongoReady()) {
            await OrderModel.updateOne(
              { orderNumber },
              { $set: { emailNotificationSent: true, emailNotificationSentAt: new Date().toISOString() } }
            ).catch((e) => console.error('[Cashfree] Failed to update emailNotificationSent:', e.message));
          } else {
            const db = getDbData();
            const localOrd = (db.orders || []).find((o) => o.orderNumber === orderNumber);
            if (localOrd) {
              localOrd.emailNotificationSent = true;
              localOrd.emailNotificationSentAt = new Date().toISOString();
              saveDbData(db);
            }
          }
        }
      }).catch((err) => console.error('[Cashfree] Error sending notification email:', err.message));
    }

    return res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify Cashfree payment', details: error.message });
  }
});

// Cashfree Webhook Endpoint (HMAC SHA-256 Base64 Signature Verification)
app.post('/api/payments/cashfree-webhook', async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBodyBuffer = req.rawBody;

    const cfConfig = getCashfreeConfig();
    if (!cfConfig.secretKey) {
      console.warn('[Cashfree Webhook] Secret key not configured, ignoring webhook');
      return res.status(400).send('Webhook unconfigured');
    }

    if (!signature || !timestamp || !rawBodyBuffer) {
      return res.status(400).send('Missing webhook signature, timestamp, or raw payload');
    }

    const rawBodyString = rawBodyBuffer.toString('utf8');
    const signaturePayload = `${timestamp}${rawBodyString}`;
    const expectedSignature = crypto
      .createHmac('sha256', cfConfig.secretKey)
      .update(signaturePayload)
      .digest('base64');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.warn('⚠️ Cashfree webhook signature verification failed');
      return res.status(400).send('Invalid webhook signature');
    }

    const event = req.body;
    const orderId = event.data?.order?.order_id;
    const paymentStatus = event.data?.payment?.payment_status;
    const cfPaymentId = event.data?.payment?.cf_payment_id;

    if (orderId && paymentStatus === 'SUCCESS') {
      const updateFields = {
        paymentStatus: 'Paid',
        orderStatus: 'Payment Confirmed',
        cashfreePaymentId: String(cfPaymentId || ''),
        cashfreeOrderId: orderId,
        cashfreePaymentStatus: 'SUCCESS',
        paymentFailureReason: null,
        updatedAt: new Date().toISOString(),
      };

      if (isMongoReady()) {
        const existing = await OrderModel.findOne({ orderNumber: orderId }).lean();
        if (existing && !existing.emailNotificationSent) {
          const updated = { ...existing, ...updateFields };
          sendOrderNotificationEmail(updated).then(async (mailResult) => {
            if (mailResult && mailResult.success) {
              await OrderModel.updateOne(
                { orderNumber: orderId },
                { $set: { emailNotificationSent: true, emailNotificationSentAt: new Date().toISOString() } }
              ).catch((e) => console.error('[Cashfree Webhook] Failed to update emailNotificationSent:', e.message));
            }
          }).catch((err) => console.error('[Cashfree Webhook] Error sending notification email:', err.message));
        }
        await OrderModel.updateOne({ orderNumber: orderId }, { $set: updateFields });
      } else {
        const db = getDbData();
        const ord = (db.orders || []).find((o) => o.orderNumber === orderId);
        if (ord) {
          if (!ord.emailNotificationSent) {
            const updated = { ...ord, ...updateFields };
            sendOrderNotificationEmail(updated).then((mailResult) => {
              if (mailResult && mailResult.success) {
                ord.emailNotificationSent = true;
                ord.emailNotificationSentAt = new Date().toISOString();
                saveDbData(db);
              }
            }).catch((err) => console.error('[Cashfree Webhook] Error sending notification email:', err.message));
          }
          Object.assign(ord, updateFields);
          saveDbData(db);
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('[Cashfree Webhook] Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Razorpay Order Creation Endpoint (Authoritative Server-side creation)
app.post('/api/payments/create-razorpay-order', orderLimiter, async (req, res) => {
  try {
    const { orderNumber } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ error: 'orderNumber is required' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keySecret === 'test_razorpay_secret_key') {
      return res.status(400).json({
        success: false,
        code: 'GATEWAY_NOT_CONFIGURED',
        message: 'Razorpay payment keys are not configured in the server environment. Please set up merchant credentials on Render.',
      });
    }

    let order = null;
    if (isMongoReady()) {
      order = await OrderModel.findOne({ orderNumber }).lean();
    } else {
      const db = getDbData();
      order = (db.orders || []).find((o) => o.orderNumber === orderNumber);
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ error: 'Order has already been paid and confirmed' });
    }

    const amountInPaise = Math.round(Number(order.finalTotal) * 100);
    if (amountInPaise <= 0) {
      return res.status(400).json({ error: 'Invalid order amount for online payment' });
    }

    const authHeader = Buffer.from(`${keyId.trim()}:${keySecret.trim()}`).toString('base64');
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          orderNumber: order.orderNumber,
          customerPhone: order.shippingAddress?.phone || '',
        },
      }),
    });

    const rzpData = await rzpResponse.json().catch(() => ({}));
    if (!rzpResponse.ok || !rzpData.id) {
      const errDetail = rzpData.error?.description || `Razorpay order creation failed (${rzpResponse.status})`;
      return res.status(rzpResponse.status || 500).json({
        error: 'Razorpay order creation failed',
        details: errDetail,
      });
    }

    // Persist razorpayOrderId in order record
    if (isMongoReady()) {
      await OrderModel.updateOne(
        { orderNumber },
        { $set: { razorpayOrderId: rzpData.id, updatedAt: new Date().toISOString() } }
      );
    } else {
      const db = getDbData();
      const localOrd = (db.orders || []).find((o) => o.orderNumber === orderNumber);
      if (localOrd) {
        localOrd.razorpayOrderId = rzpData.id;
        localOrd.updatedAt = new Date().toISOString();
        saveDbData(db);
      }
    }

    res.json({
      success: true,
      razorpayOrderId: rzpData.id,
      amount: rzpData.amount,
      currency: rzpData.currency,
      keyId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Razorpay order', details: error.message });
  }
});

// Razorpay Payment Verification Endpoint (HMAC SHA256 Signature Check & Order Confirmation)
app.post('/api/payments/verify-razorpay', async (req, res) => {
  try {
    const { orderNumber, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || secret === 'test_razorpay_secret_key') {
      return res.status(400).json({
        success: false,
        code: 'GATEWAY_NOT_CONFIGURED',
        message: 'Razorpay payment key secret is not configured in the server environment. Please set up merchant credentials on Render.',
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment signature parameters' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret.trim())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const signatureBuffer = Buffer.from(generatedSignature);
    const clientSignatureBuffer = Buffer.from(razorpay_signature);

    const isMatch =
      signatureBuffer.length === clientSignatureBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, clientSignatureBuffer);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature verification failed' });
    }

    // Payment Signature verified! Update order status to 'Paid' and 'Payment Confirmed'
    const updateFields = {
      paymentStatus: 'Paid',
      orderStatus: 'Payment Confirmed',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      paymentFailureReason: null,
      updatedAt: new Date().toISOString(),
    };

    let updatedOrder = null;
    const query = orderNumber ? { orderNumber } : { razorpayOrderId: razorpay_order_id };

    if (isMongoReady()) {
      updatedOrder = await OrderModel.findOneAndUpdate(
        query,
        { $set: updateFields },
        { new: true }
      ).lean();
      if (updatedOrder) delete updatedOrder._id;
    } else {
      const db = getDbData();
      const localOrd = (db.orders || []).find(
        (o) => (orderNumber && o.orderNumber === orderNumber) || o.razorpayOrderId === razorpay_order_id
      );
      if (localOrd) {
        Object.assign(localOrd, updateFields);
        saveDbData(db);
        updatedOrder = localOrd;
      }
    }

    // Send order notification email for verified paid online orders
    if (updatedOrder && !updatedOrder.emailNotificationSent) {
      sendOrderNotificationEmail(updatedOrder).then(async (mailResult) => {
        if (mailResult && mailResult.success) {
          if (isMongoReady()) {
            await OrderModel.updateOne(
              query,
              { $set: { emailNotificationSent: true, emailNotificationSentAt: new Date().toISOString() } }
            ).catch((e) => console.error('[Payment] Failed to update emailNotificationSent:', e.message));
          } else {
            const db = getDbData();
            const localOrd = (db.orders || []).find(
              (o) => (orderNumber && o.orderNumber === orderNumber) || o.razorpayOrderId === razorpay_order_id
            );
            if (localOrd) {
              localOrd.emailNotificationSent = true;
              localOrd.emailNotificationSentAt = new Date().toISOString();
              saveDbData(db);
            }
          }
        }
      }).catch((err) => console.error('[Payment] Error sending notification email:', err.message));
    }

    return res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify payment', details: error.message });
  }
});

// Record Payment Failure Endpoint
app.post('/api/payments/record-failure', async (req, res) => {
  try {
    const { orderNumber, reason, razorpay_order_id, cashfree_order_id } = req.body;
    if (!orderNumber && !razorpay_order_id && !cashfree_order_id) {
      return res.status(400).json({ error: 'orderNumber, cashfree_order_id, or razorpay_order_id is required' });
    }

    const query = orderNumber
      ? { orderNumber }
      : cashfree_order_id
      ? { $or: [{ cashfreeOrderId: cashfree_order_id }, { orderNumber: cashfree_order_id }] }
      : { razorpayOrderId: razorpay_order_id };

    const updateFields = {
      paymentStatus: 'Failed',
      paymentFailureReason: reason || 'Customer cancelled payment or transaction declined',
      updatedAt: new Date().toISOString(),
    };

    if (isMongoReady()) {
      await OrderModel.updateOne(query, { $set: updateFields });
    } else {
      const db = getDbData();
      const ord = (db.orders || []).find(
        (o) =>
          (orderNumber && o.orderNumber === orderNumber) ||
          (cashfree_order_id && (o.cashfreeOrderId === cashfree_order_id || o.orderNumber === cashfree_order_id)) ||
          (razorpay_order_id && o.razorpayOrderId === razorpay_order_id)
      );
      if (ord) {
        Object.assign(ord, updateFields);
        saveDbData(db);
      }
    }

    res.json({ success: true, message: 'Payment failure recorded' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payment failure', details: error.message });
  }
});

// Razorpay Webhook Callback Endpoint
app.post('/api/payments/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (webhookSecret && signature && req.rawBody) {
      const expected = crypto
        .createHmac('sha256', webhookSecret.trim())
        .update(req.rawBody)
        .digest('hex');

      const expectedBuf = Buffer.from(expected);
      const sigBuf = Buffer.from(signature);

      if (expectedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expectedBuf, sigBuf)) {
        console.warn('⚠️ Razorpay webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id || payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (rzpOrderId) {
        const updateFields = {
          paymentStatus: 'Paid',
          orderStatus: 'Payment Confirmed',
          ...(paymentId ? { razorpayPaymentId: paymentId } : {}),
          updatedAt: new Date().toISOString(),
        };

        if (isMongoReady()) {
          const existing = await OrderModel.findOne({ razorpayOrderId: rzpOrderId }).lean();
          if (existing && !existing.emailNotificationSent) {
            const updated = { ...existing, ...updateFields };
            sendOrderNotificationEmail(updated).then(async (mailResult) => {
              if (mailResult && mailResult.success) {
                await OrderModel.updateOne(
                  { razorpayOrderId: rzpOrderId },
                  { $set: { emailNotificationSent: true, emailNotificationSentAt: new Date().toISOString() } }
                ).catch((e) => console.error('[Webhook] Failed to update emailNotificationSent:', e.message));
              }
            }).catch((err) => console.error('[Webhook] Error sending notification email:', err.message));
          }
          await OrderModel.updateOne({ razorpayOrderId: rzpOrderId }, { $set: updateFields });
        } else {
          const db = getDbData();
          const ord = (db.orders || []).find((o) => o.razorpayOrderId === rzpOrderId);
          if (ord) {
            if (!ord.emailNotificationSent) {
              const updated = { ...ord, ...updateFields };
              sendOrderNotificationEmail(updated).then((mailResult) => {
                if (mailResult && mailResult.success) {
                  ord.emailNotificationSent = true;
                  ord.emailNotificationSentAt = new Date().toISOString();
                  saveDbData(db);
                }
              }).catch((err) => console.error('[Webhook] Error sending notification email:', err.message));
            }
            Object.assign(ord, updateFields);
            saveDbData(db);
          }
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const failureReason = paymentEntity?.error_description || 'Payment failed';

      if (rzpOrderId) {
        if (isMongoReady()) {
          await OrderModel.updateOne(
            { razorpayOrderId: rzpOrderId },
            { $set: { paymentStatus: 'Failed', paymentFailureReason: failureReason, updatedAt: new Date().toISOString() } }
          );
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Courier Serviceability Endpoint (Shiprocket Live Check with Clean Fallback)
app.get('/api/shipments/serviceability', async (req, res) => {
  try {
    const { deliveryPincode, pickupPincode, cod } = req.query;
    if (!deliveryPincode || !/^\d{6}$/.test(String(deliveryPincode))) {
      return res.status(400).json({ error: 'Valid 6-digit delivery PIN code is required' });
    }

    if (!isShiprocketConfigured()) {
      return res.json({
        success: true,
        isConfigured: false,
        message: 'Standard express courier delivery available across India (3 - 5 business days).',
      });
    }

    const result = await checkCourierServiceability({
      deliveryPostcode: deliveryPincode,
      pickupPostcode: pickupPincode || '631501',
      cod: cod === '1' ? 1 : 0,
    });

    res.json({ success: true, isConfigured: true, ...result });
  } catch (error) {
    res.json({
      success: true,
      isConfigured: false,
      message: 'Standard express courier delivery available across India (3 - 5 business days).',
      error: error.message,
    });
  }
});

// Admin: Get Shiprocket Registered Pickup Locations
app.get('/api/admin/shiprocket/pickup-locations', authenticateAdmin, async (req, res) => {
  try {
    if (!isShiprocketConfigured()) {
      return res.status(400).json({
        success: false,
        code: 'SHIPROCKET_NOT_CONFIGURED',
        message: 'Shiprocket email/password is not configured in server environment. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD on Render.',
      });
    }

    const locations = await getPickupLocations();
    res.json({ success: true, locations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve pickup locations from Shiprocket', details: error.message });
  }
});

// Admin: Dispatch Order via Shiprocket (Adhoc creation + AWB assignment)
app.post('/api/admin/orders/:id/dispatch-shiprocket', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { pickupLocation } = req.body;

    if (!isShiprocketConfigured()) {
      return res.status(400).json({
        success: false,
        code: 'SHIPROCKET_NOT_CONFIGURED',
        message: 'Shiprocket credentials are not configured on server. Please configure SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD on Render.',
      });
    }

    let order = null;
    if (isMongoReady()) {
      order = await OrderModel.findOne({ $or: [{ id }, { orderNumber: id }] }).lean();
    } else {
      const db = getDbData();
      order = (db.orders || []).find((o) => o.id === id || o.orderNumber === id);
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 1. Create order in Shiprocket
    const srOrderResult = await createShiprocketOrder(order, pickupLocation);

    // 2. Assign AWB to shipment
    let awbResult = null;
    try {
      awbResult = await assignAwbToShipment(srOrderResult.shipmentId);
    } catch (awbErr) {
      console.warn('AWB assignment notice:', awbErr.message);
    }

    // 3. Update database record with official Shiprocket details
    const updateFields = {
      shipmentId: String(srOrderResult.shipmentId),
      orderStatus: 'Ready for Pickup',
      courierName: awbResult?.courierName || 'Shiprocket Partner Courier',
      awbNumber: awbResult?.awbCode || '',
      trackingUrl: awbResult?.trackingUrl || `https://shiprocket.co/tracking/${srOrderResult.shipmentId}`,
      updatedAt: new Date().toISOString(),
    };

    if (isMongoReady()) {
      const updated = await OrderModel.findOneAndUpdate(
        { $or: [{ id }, { orderNumber: id }] },
        { $set: updateFields },
        { new: true }
      ).lean();
      if (updated) delete updated._id;
      return res.json({ success: true, order: updated, shiprocket: srOrderResult, awb: awbResult });
    } else {
      const db = getDbData();
      const localOrd = (db.orders || []).find((o) => o.id === id || o.orderNumber === id);
      if (localOrd) {
        Object.assign(localOrd, updateFields);
        saveDbData(db);
      }
      return res.json({ success: true, order: localOrd, shiprocket: srOrderResult, awb: awbResult });
    }
  } catch (error) {
    res.status(500).json({ error: 'Shiprocket dispatch failed', details: error.message });
  }
});

// Shiprocket Webhook Callback Endpoint
app.post('/api/shipments/webhook', (req, res) => {
  console.log('Received Shiprocket courier webhook payload:', req.body);
  res.json({ received: true });
});

// ==========================================
// --- NOTIFICATION STATUS & TESTING ENDPOINTS ---
// ==========================================

// Check Email Notification Configuration Status (Safe for public/admin checks, no secrets exposed)
app.get('/api/admin/notifications/status', (req, res) => {
  const isConfigured = isMailerConfigured();
  const provider = getMailerProvider();
  let transportType = 'none';
  if (provider === 'resend') transportType = 'HTTPS (Resend REST API - Port 443)';
  else if (provider === 'brevo') transportType = 'HTTPS (Brevo REST API - Port 443)';
  else if (provider === 'smtp') transportType = 'Direct SMTP (Nodemailer - Port 587)';

  const sender = getSenderEmail();
  const notificationEmail = getNotificationEmail();
  const parsedSender = parseAddress(sender);

  let senderWarning = null;
  if (provider === 'resend' && parsedSender.isFreemail) {
    senderWarning = `EMAIL_FROM uses public email domain '@${parsedSender.domain}'. Resend strictly rejects sending from public email domains. Remove EMAIL_FROM in Render settings to use Resend's test sender (onboarding@resend.dev), or set EMAIL_FROM to an address on a verified custom domain.`;
  }

  res.json({
    success: true,
    isConfigured,
    provider,
    transportType,
    notificationEmail,
    sender,
    senderWarning,
    smtpHost: provider === 'smtp' ? (process.env.SMTP_HOST || 'smtp.gmail.com') : null,
    smtpPort: provider === 'smtp' ? parseInt(process.env.SMTP_PORT || '587', 10) : null,
    smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
    message: isConfigured
      ? `Email notification service is active via ${provider.toUpperCase()} (${transportType}).`
      : 'No email provider configured. For Render, configure RESEND_API_KEY (recommended HTTPS API) or SMTP credentials in environment.',
  });
});

// Admin Endpoint: Dispatch Test Notification to Business Email
app.post('/api/admin/notifications/test-email', authenticateAdmin, async (req, res) => {
  try {
    const { targetEmail } = req.body || {};
    const result = await sendTestNotificationEmail(targetEmail);
    if (result.success) {
      return res.json({
        success: true,
        message: `Test order notification delivered to ${result.recipient}!`,
        messageId: result.messageId,
        provider: result.provider,
        sender: result.sender,
        recipient: result.recipient,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to deliver test email',
        details: result.providerError && result.providerError !== result.error
          ? `${result.error} (Provider response: "${result.providerError}")`
          : (result.error || result.reason),
        error: result.error,
        providerError: result.providerError,
        step: result.step,
        provider: result.provider,
        sender: result.sender,
        recipient: result.recipient,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to process test email request', details: error.message });
  }
});

// Admin Endpoint: Resend Order Notification for Any Existing Order
app.post('/api/admin/orders/:id/resend-notification', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let foundOrder = null;

    if (isMongoReady()) {
      foundOrder = await OrderModel.findOne({ $or: [{ id }, { orderNumber: id }] }).lean();
    } else {
      const db = getDbData();
      foundOrder = (db.orders || []).find((o) => o.id === id || o.orderNumber === id);
    }

    if (!foundOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const mailResult = await sendOrderNotificationEmail(foundOrder);
    if (mailResult.success) {
      if (isMongoReady()) {
        await OrderModel.updateOne(
          { $or: [{ id }, { orderNumber: id }] },
          { $set: { emailNotificationSent: true, emailNotificationSentAt: new Date().toISOString() } }
        );
      }
      return res.json({
        success: true,
        message: `Order notification resent to ${mailResult.recipient}`,
        messageId: mailResult.messageId,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Could not send email notification',
        details: mailResult.error || mailResult.reason,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to resend order notification', details: error.message });
  }
});

// Start Express Server - Bound to 0.0.0.0 for Cloud Containers (Render / Docker)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Sri Lakshmi Sarees Express Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
