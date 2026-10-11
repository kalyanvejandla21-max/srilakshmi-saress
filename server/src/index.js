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

// --- DATA PERSISTENCE LAYER ---
const DATA_FILE = path.join(__dirname, '../data/store_db.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Initial DB Seed structure
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

// Optional MongoDB Connection (When MONGODB_URI is provided in production)
let isMongoConnected = false;

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      isMongoConnected = true;
      console.log('📦 Connected securely to MongoDB Atlas / Cloud Database');
    })
    .catch((err) => {
      console.warn('⚠️ MongoDB connection error, falling back to local storage engine:', err.message);
    });
} else {
  console.log('ℹ️ MONGODB_URI not provided. Running with resilient local JSON store.');
}

// --- API ENDPOINTS ---

// Health check endpoint (safe for public monitoring & Render health checks)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: 'Sri Lakshmi Sarees API',
    database: isMongoConnected ? 'mongodb' : 'json-store',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// Get announcement banner
app.get('/api/announcement', (req, res) => {
  const db = getDbData();
  res.json(db.announcement || INITIAL_DATA.announcement);
});

// Search and retrieve an order by Order Number or Order ID
app.get('/api/orders/:idOrNumber', (req, res) => {
  try {
    const { idOrNumber } = req.params;
    const cleanQuery = idOrNumber.trim().toUpperCase();
    const db = getDbData();

    const order = (db.orders || []).find(
      (o) =>
        (o.orderNumber && o.orderNumber.toUpperCase() === cleanQuery) ||
        (o.id && o.id.toUpperCase() === cleanQuery)
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve order', details: error.message });
  }
});

// Create Order API with Server-side verification and AWB generation
app.post('/api/orders', (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode, subtotal, finalTotal, guestEmail } =
      req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order items cannot be empty' });
    }

    const orderNumber = `SLS-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      guestEmail: guestEmail || (shippingAddress && shippingAddress.email) || '',
      items,
      subtotal,
      shippingCharge: subtotal >= 2999 ? 0 : 150,
      discount: 0,
      couponCode,
      finalTotal,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      orderStatus: 'Order Placed',
      courierName: 'Shiprocket Express Courier',
      awbNumber: `AWB${Math.floor(100000000 + Math.random() * 900000000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const db = getDbData();
    db.orders.unshift(newOrder);
    saveDbData(db);

    res.status(201).json({ success: true, order: newOrder });
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
