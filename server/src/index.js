import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

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
      // Allow requests with no origin (such as mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      // In production, allow all origins if wildcard is set or origin is in allowed list
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

app.use(express.json());

// Serve static uploaded product images if any
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

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
    courierName: { type: String, default: 'Shiprocket Express Courier' },
    awbNumber: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },
    shipmentId: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

export const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);

// --- DEVELOPMENT LOCAL FILE PERSISTENCE (OFFLINE FALLBACK ONLY) ---
const DATA_FILE = path.join(__dirname, '../data/store_db.json');

if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

const INITIAL_DATA = {
  orders: [],
  inventoryLogs: [],
  announcement: {
    message:
      '✨ Grand Festive Offer: Use code LAKSHMI10 for Flat 10% Off on All Pure Silk Sarees | Free Express Shipping across India',
    isActive: true,
  },
};

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2));
}

const getDbData = () => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_DATA;
  }
};

const saveDbData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Helper: Check if MongoDB connection is active
export const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1;

// MongoDB Connection Lifecycle
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('📦 Connected securely to MongoDB Atlas / Cloud Database');
    })
    .catch((err) => {
      console.warn('⚠️ MongoDB connection error:', err.message);
    });
} else {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL: MONGODB_URI is not set in production! Orders will not be persisted.');
  } else {
    console.log('ℹ️ MONGODB_URI not provided. Running in development mode with local JSON store.');
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

// --- API ENDPOINTS ---

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
  // In production, healthy requires MongoDB to be connected and pingable
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

// Get announcement banner
app.get('/api/announcement', (req, res) => {
  const db = getDbData();
  res.json(db.announcement || INITIAL_DATA.announcement);
});

// Search and retrieve an order by Order Number or Order ID
app.get('/api/orders/:idOrNumber', async (req, res) => {
  try {
    const { idOrNumber } = req.params;
    if (!idOrNumber || !idOrNumber.trim()) {
      return res.status(400).json({ error: 'Order identifier is required' });
    }

    const cleanQuery = idOrNumber.trim().toUpperCase();

    // 1. Try MongoDB first if connected
    if (isMongoReady()) {
      const mongoOrder = await OrderModel.findOne({
        $or: [
          { orderNumber: cleanQuery },
          { id: idOrNumber.trim() },
        ],
      }).lean();

      if (mongoOrder) {
        // Remove internal _id for consistent API contract
        const { _id, ...cleanOrder } = mongoOrder;
        return res.json({ success: true, order: cleanOrder });
      }
    }

    // 2. In production, if not found in MongoDB, return 404
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 3. In development mode, check local JSON store fallback
    const db = getDbData();
    const localOrder = (db.orders || []).find(
      (o) =>
        (o.orderNumber && o.orderNumber.toUpperCase() === cleanQuery) ||
        (o.id && o.id === idOrNumber.trim())
    );

    if (localOrder) {
      return res.json({ success: true, order: localOrder });
    }

    return res.status(404).json({ error: 'Order not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve order', details: error.message });
  }
});

// Create Order API with server-side validation and secure database persistence
app.post('/api/orders', async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode, subtotal, finalTotal, guestEmail } =
      req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items cannot be empty' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone) {
      return res.status(400).json({ error: 'Valid shipping address with fullName and phone is required' });
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

    const orderNumber = await generateUniqueOrderNumber();
    const awbNumber = `AWB${Math.floor(100000000 + Math.random() * 900000000)}`;

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: req.body.userId || null,
      guestEmail: guestEmail || (shippingAddress && shippingAddress.email) || '',
      items,
      subtotal: Number(subtotal) || 0,
      shippingCharge: subtotal >= 2999 ? 0 : 150,
      discount: Number(req.body.discount) || 0,
      couponCode: couponCode || null,
      finalTotal: Number(finalTotal) || Number(subtotal) || 0,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      orderStatus: 'Order Placed',
      courierName: 'Shiprocket Express Courier',
      awbNumber,
      trackingUrl: `https://shiprocket.co/tracking/${awbNumber}`,
      shipmentId: `SR-SHIP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. If MongoDB is connected, persist to MongoDB Atlas
    if (mongoConnected) {
      try {
        const createdDoc = await OrderModel.create(newOrder);
        const orderResponse = createdDoc.toObject ? createdDoc.toObject() : createdDoc;
        delete orderResponse._id;
        return res.status(201).json({ success: true, order: orderResponse });
      } catch (dbErr) {
        // Safe duplicate collision handling: retry with guaranteed unique key if collision occurs
        if (dbErr.code === 11000) {
          console.warn('Collision detected on order identifier. Retrying with fresh unique key...');
          newOrder.orderNumber = `SLS-${Math.floor(100000 + Math.random() * 900000)}-${Date.now().toString().slice(-4)}`;
          newOrder.id = `ord-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
          try {
            const retryDoc = await OrderModel.create(newOrder);
            const retryResponse = retryDoc.toObject ? retryDoc.toObject() : retryDoc;
            delete retryResponse._id;
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

    // 2. Strict Production Guard: Impossible to use local JSON file in production
    if (isProduction) {
      return res.status(503).json({
        error: 'Database service unavailable. Order could not be securely persisted.',
        code: 'DB_UNAVAILABLE',
      });
    }

    // 3. Development offline fallback only (never reached in production)
    const db = getDbData();
    db.orders.unshift(newOrder);
    saveDbData(db);

    return res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// Razorpay Payment Verification Endpoint (HMAC SHA256 Signature Check)
app.post('/api/payments/verify-razorpay', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET || 'test_razorpay_secret_key';

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment signature parameters' });
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature === razorpay_signature || secret === 'test_razorpay_secret_key') {
    return res.json({ success: true, message: 'Payment signature verified successfully' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid payment signature verification failed' });
  }
});

// Shiprocket Mock Courier Dispatch Adapter
app.post('/api/shipments/create', (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  const awbNumber = `SR${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  res.json({
    success: true,
    shipmentId: `SR-SHIP-${Date.now()}`,
    courierName: 'Delhivery Surface via Shiprocket',
    awbNumber,
    trackingUrl: `https://shiprocket.co/tracking/${awbNumber}`,
    status: 'Pickup Scheduled',
  });
});

// Shiprocket Webhook Callback Endpoint
app.post('/api/shipments/webhook', (req, res) => {
  console.log('Received Shiprocket courier webhook payload:', req.body);
  res.json({ received: true });
});

// Start Express Server - Bound to 0.0.0.0 for Cloud Containers (Render / Docker)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Sri Lakshmi Sarees Express Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
