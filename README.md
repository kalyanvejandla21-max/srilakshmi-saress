# Sri Lakshmi Sarees — E-Commerce Web Application

A luxury Indian ethnic wear and bridal saree e-commerce platform built with React (TypeScript), Vite, Express.js, and modern full-stack deployment architecture.

---

## 🌟 Architecture Overview

- **Frontend**: React 18 + TypeScript + Vite + Vanilla CSS design system.
  - Deployed on **Vercel** (`client/` root).
  - Features: Animated Category Slider, Product Quick View, Shopping Cart Drawer, Filter & Search, Multi-step Checkout, Responsive Tracking Stepper.
- **Backend API**: Node.js + Express 4.
  - Deployed on **Render** Web Service (`server/` root).
  - Features: Order creation with server-side validation, AWB number generator, Shiprocket courier dispatch adapter, Razorpay HMAC SHA256 payment signature verification, health monitoring.
- **Database Layer**:
  - Resilient dual-mode persistence:
    - **Production**: MongoDB Atlas / Cloud Database (via `MONGODB_URI`).
    - **Fallback**: Embedded JSON store (`server/data/store_db.json`) for zero-downtime offline operation.

---

## 🚀 Deployment Instructions

### 1. GitHub (Source Repository)
- Repository: `sri-lakshmi-sarees`
- Branch: `main`

### 2. Render (Backend API Service)
1. In Render Dashboard, click **New + > Web Service** (or use Blueprint with `render.yaml`).
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Name**: `sri-lakshmi-sarees-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. In the **Environment** tab, set:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `ALLOWED_ORIGINS`: `https://<your-vercel-app>.vercel.app`
   - `CLIENT_URL`: `https://<your-vercel-app>.vercel.app`
   - `MONGODB_URI`: *(Optional: your MongoDB Atlas connection string)*
   - `RAZORPAY_KEY_ID`: *(Optional: Razorpay key id)*
   - `RAZORPAY_KEY_SECRET`: *(Optional: Razorpay key secret)*
5. Click **Deploy Web Service** and note your Render service URL (e.g., `https://sri-lakshmi-sarees-api.onrender.com`).

### 3. Vercel (Frontend Deployment)
1. In Vercel Dashboard, click **Add New > Project** and import the GitHub repository.
2. Configure project settings:
   - **Root Directory**: Click "Edit" and choose `client`.
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. In **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://<your-render-app>.onrender.com` (Your Render backend URL).
4. Click **Deploy**.

---

## 📦 Local Development

```bash
# Install all dependencies
npm run setup

# Run frontend (port 3000) and backend (port 5000) concurrently
npm run dev

# Or run individually:
npm run dev:client
npm run dev:server
```

---

## 🛍️ Replacing Demo Saree Products with Real Inventory

The website currently displays handcrafted demo saree products (`INITIAL_PRODUCTS` in `client/src/services/api.ts`).

When real inventory is ready:
1. Prepare high-resolution photos of your mother's real sarees (recommended: aspect ratio 3:4 or 4:5, webp or jpg, placed in `client/public/images/`).
2. Update the product catalog in `client/src/services/api.ts` (or seed into your MongoDB `products` collection):
   - `sku`: Unique stock keeping unit (e.g., `SLS-KAN-001`).
   - `name`: Saree title (e.g., *Pure Kanjivaram Korvai Silk Saree*).
   - `category`: `Silk Sarees`, `Cotton Sarees`, `Wedding Sarees`, `Festive Sarees`, `Designer Sarees`, or `Daily Wear Sarees`.
   - `price` & `originalPrice`: Actual selling price and MRP in INR.
   - `fabric`, `color`, `occasion`, `sareeLength`, `blouseIncluded`, `careInstructions`.
   - `stock`: Actual real inventory count per piece.
3. Commit and push changes to `main` — Vercel will automatically redeploy the updated catalog!
