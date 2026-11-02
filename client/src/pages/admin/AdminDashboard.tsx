import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Tag,
  Truck,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Search,
  Filter,
  X,
  ExternalLink,
  FileText,
  ChevronRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  LogOut,
  Calendar,
  CreditCard,
  Check,
} from 'lucide-react';
import { Product, Order, OrderStatus, SareeCategory } from '../../types';
import {
  fetchProductsFromServer,
  adminGetOrdersApi,
  adminUpdateOrderStatusApi,
  adminCreateProductApi,
  adminUpdateProductApi,
  adminArchiveProductApi,
  adminResetDemoCatalogApi,
  adminCreateShipmentApi,
  adminAssignAwbApi,
  adminBookPickupApi,
  adminDispatchShiprocketApi,
  adminTrackShipmentApi,
  getStoredCoupons
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AdminDashboard: React.FC = () => {
  const { isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons] = useState(getStoredCoupons);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'coupons'>('overview');

  // Search & Filter state for orders
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');

  // Order Details & Dispatch Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeShipAction, setActiveShipAction] = useState<'all' | 'shipment' | 'awb' | 'pickup' | null>(null);
  const [isTrackingLive, setIsTrackingLive] = useState(false);
  const [liveTrackingInfo, setLiveTrackingInfo] = useState<any | null>(null);
  const [manualCourier, setManualCourier] = useState('');
  const [manualAwb, setManualAwb] = useState('');
  const [manualTrackingUrl, setManualTrackingUrl] = useState('');
  const [manualPaymentStatus, setManualPaymentStatus] = useState<string>('Pending');

  // Add Product Modal state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'Silk Sarees' as SareeCategory,
    price: '',
    originalPrice: '',
    fabric: 'Pure Mulberry Silk',
    color: '',
    pattern: '',
    occasion: 'Bridal & Wedding',
    stock: '5',
    imageUrl: '/images/cat-silk.jpg',
    description: ''
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Edit Stock State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedOrders, fetchedProducts] = await Promise.all([
        adminGetOrdersApi().catch(() => []),
        fetchProductsFromServer().catch(() => [])
      ]);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
    } catch (err: any) {
      showToast(err.message || 'Failed to load backend administration data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="section-padding" style={{ textAlign: 'center', minHeight: '60vh' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-maroon)' }}>
          Access Denied
        </h2>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
          You must be authenticated as an Administrator with a valid session token to access this management dashboard.
        </p>
        <Link to="/admin/login" className="btn-primary">
          Sign In to Admin Portal
        </Link>
      </div>
    );
  }

  // Safe Order Status Transition Handler with Dispatch Guard
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

    // Front-end status transition safeguard: disallow Dispatched or In Transit without valid AWB and courier
    if (newStatus === 'Dispatched' || newStatus === 'In Transit') {
      const hasAwb = Boolean(targetOrder?.awbNumber || targetOrder?.shipping?.awbNumber || targetOrder?.trackingNumber);
      const hasCourier = Boolean(targetOrder?.courierName || targetOrder?.shipping?.courierName || targetOrder?.courierPartner);

      if (!hasAwb || !hasCourier) {
        showToast(
          `Cannot mark as "${newStatus}". A valid AWB number and courier partner must be assigned first via Shiprocket or dispatch modal.`,
          'error'
        );
        return;
      }
    }

    try {
      const updated = await adminUpdateOrderStatusApi(orderId, { orderStatus: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? updated : o)));
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderNumber === orderId)) {
        setSelectedOrder(updated);
      }
      showToast(`Order status updated to "${newStatus}"`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status on server', 'error');
    }
  };

  const handleOpenOrderModal = (ord: Order) => {
    setSelectedOrder(ord);
    setManualCourier(ord.courierName || '');
    setManualAwb(ord.awbNumber || '');
    setManualTrackingUrl(ord.trackingUrl || '');
    setManualPaymentStatus(ord.paymentStatus || 'Pending');
    setLiveTrackingInfo(null);
  };

  // 1-Click Complete Dispatch via Shiprocket Pipeline
  const handleShiprocketDispatch = async (orderId: string) => {
    setIsDispatching(true);
    setActiveShipAction('all');
    try {
      const res = await adminDispatchShiprocketApi(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? res.order : o)));
      setSelectedOrder(res.order);
      setManualCourier(res.order.courierName || '');
      setManualAwb(res.order.awbNumber || '');
      setManualTrackingUrl(res.order.trackingUrl || '');
      if (res.partial) {
        showToast(res.message || 'Shipment created, but AWB or pickup pending.', 'info');
      } else {
        showToast(`Shipment processed! AWB: ${res.order.awbNumber || 'Assigned'} • Pickup: ${res.order.pickupStatus || 'Scheduled'}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Shiprocket dispatch failed. Please verify credentials on Render.', 'error');
    } finally {
      setIsDispatching(false);
      setActiveShipAction(null);
    }
  };

  // Step 1: Create Shipment in Shiprocket
  const handleCreateShipment = async (orderId: string) => {
    setActiveShipAction('shipment');
    try {
      const res = await adminCreateShipmentApi(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? res.order : o)));
      setSelectedOrder(res.order);
      showToast(`Shiprocket shipment created! ID: ${res.order.shipmentId}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create Shiprocket shipment', 'error');
    } finally {
      setActiveShipAction(null);
    }
  };

  // Step 2: Assign AWB to Shipment
  const handleAssignAwb = async (orderId: string) => {
    setActiveShipAction('awb');
    try {
      const res = await adminAssignAwbApi(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? res.order : o)));
      setSelectedOrder(res.order);
      setManualCourier(res.order.courierName || '');
      setManualAwb(res.order.awbNumber || '');
      setManualTrackingUrl(res.order.trackingUrl || '');
      showToast(`AWB assigned: ${res.order.awbNumber} (${res.order.courierName})`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to assign AWB in Shiprocket', 'error');
    } finally {
      setActiveShipAction(null);
    }
  };

  // Step 3: Schedule Courier Pickup
  const handleBookPickup = async (orderId: string) => {
    setActiveShipAction('pickup');
    try {
      const res = await adminBookPickupApi(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? res.order : o)));
      setSelectedOrder(res.order);
      showToast(`Courier pickup scheduled! Token: ${res.order.pickupTokenNumber || 'Confirmed'}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to book courier pickup', 'error');
    } finally {
      setActiveShipAction(null);
    }
  };

  // Live Tracking Sync & Query
  const handleTrackLive = async (orderId: string) => {
    setIsTrackingLive(true);
    try {
      const res = await adminTrackShipmentApi(orderId);
      setLiveTrackingInfo(res.tracking);
      if (res.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? res.order : o)));
        setSelectedOrder(res.order);
      }
      showToast(`Live status: ${res.tracking?.currentStatus || 'Sync complete'}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to query live tracking from Shiprocket', 'error');
    } finally {
      setIsTrackingLive(false);
    }
  };

  const handleSaveManualDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const hasBoth = Boolean(manualCourier.trim() && manualAwb.trim());
    if (manualAwb.trim() && !manualCourier.trim()) {
      showToast('Please specify the courier partner name along with the AWB number.', 'error');
      return;
    }

    try {
      const updated = await adminUpdateOrderStatusApi(selectedOrder.id || selectedOrder.orderNumber, {
        courierName: manualCourier.trim(),
        awbNumber: manualAwb.trim(),
        trackingUrl: manualTrackingUrl.trim(),
        paymentStatus: manualPaymentStatus as any,
        orderStatus: hasBoth && (selectedOrder.orderStatus === 'Order Placed' || selectedOrder.orderStatus === 'Processing' || selectedOrder.orderStatus === 'Ready for Pickup')
          ? 'In Transit'
          : selectedOrder.orderStatus,
      });
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id || o.orderNumber === selectedOrder.orderNumber ? updated : o)));
      setSelectedOrder(updated);
      showToast('Fulfillment & courier tracking updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update courier dispatch details', 'error');
    }
  };

  // Create Product Handler
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      showToast('Please provide product name and price', 'error');
      return;
    }

    setIsSavingProduct(true);
    try {
      const created = await adminCreateProductApi({
        name: newProduct.name,
        sku: newProduct.sku || `SLS-${Math.floor(1000 + Math.random() * 9000)}`,
        category: newProduct.category,
        price: Number(newProduct.price),
        originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
        fabric: newProduct.fabric,
        color: newProduct.color,
        pattern: newProduct.pattern,
        occasion: newProduct.occasion,
        stock: Number(newProduct.stock) || 0,
        images: [newProduct.imageUrl || '/images/cat-silk.jpg'],
        description: newProduct.description,
        isActive: true
      });

      setProducts((prev) => [created, ...prev]);
      showToast(`Saree "${created.name}" created and saved to database!`, 'success');
      setIsAddProductOpen(false);
      setNewProduct({
        name: '',
        sku: '',
        category: 'Silk Sarees',
        price: '',
        originalPrice: '',
        fabric: 'Pure Mulberry Silk',
        color: '',
        pattern: '',
        occasion: 'Bridal & Wedding',
        stock: '5',
        imageUrl: '/images/cat-silk.jpg',
        description: ''
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to save product to backend database', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Stock Update Handler
  const handleUpdateStock = async (product: Product, newStock: number) => {
    try {
      const updated = await adminUpdateProductApi(product.id, { stock: Math.max(0, newStock) });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      setEditingProductId(null);
      showToast(`Stock updated to ${newStock} for "${product.name}"`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update stock', 'error');
    }
  };

  // Archive Saree Handler
  const handleArchiveProduct = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to archive "${product.name}"? It will no longer appear in the store front.`)) {
      return;
    }

    try {
      await adminArchiveProductApi(product.id);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isActive: false } : p)));
      showToast(`Archived "${product.name}" successfully`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to archive product', 'error');
    }
  };

  // Reset Demo Catalog Handler
  const handleResetDemoCatalog = async () => {
    if (!window.confirm('Reset demo saree catalog? This will restore initial sample sarees in the database.')) {
      return;
    }

    try {
      await adminResetDemoCatalogApi();
      await loadData();
      showToast('Demo saree catalog restored successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset demo catalog', 'error');
    }
  };

  // Calculated Stats
  const totalSales = orders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
  const activeProducts = products.filter((p) => p.isActive);
  const lowStockProducts = activeProducts.filter((p) => p.stock <= 5);

  const totalOrdersCount = orders.length;
  const newOrdersCount = orders.filter((o) => o.orderStatus === 'Order Placed').length;
  const processingOrdersCount = orders.filter(
    (o) => o.orderStatus === 'Processing' || o.orderStatus === 'Payment Confirmed' || o.orderStatus === 'Ready for Pickup'
  ).length;
  const dispatchedOrdersCount = orders.filter(
    (o) => o.orderStatus === 'Dispatched' || o.orderStatus === 'In Transit' || o.orderStatus === 'Out for Delivery'
  ).length;
  const deliveredOrdersCount = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const pendingPaymentsCount = orders.filter((o) => o.paymentStatus === 'Pending').length;

  // Date Filter Helper
  const isDateMatching = (createdAt: string, filter: string) => {
    if (filter === 'All') return true;
    const orderDate = new Date(createdAt);
    if (isNaN(orderDate.getTime())) return true;
    const now = new Date();
    if (filter === 'Today') {
      return (
        orderDate.getDate() === now.getDate() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }
    if (filter === '7days') {
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }
    if (filter === '30days') {
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }
    return true;
  };

  // Filtered Orders
  const filteredOrders = orders.filter((ord) => {
    if (orderStatusFilter !== 'All' && ord.orderStatus !== orderStatusFilter) {
      return false;
    }
    if (paymentStatusFilter !== 'All' && ord.paymentStatus !== paymentStatusFilter) {
      return false;
    }
    if (!isDateMatching(ord.createdAt, dateFilter)) {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.trim().toLowerCase();
      const matchNum = ord.orderNumber.toLowerCase().includes(q);
      const matchName = ord.shippingAddress?.fullName?.toLowerCase().includes(q);
      const matchPhone = ord.shippingAddress?.phone?.includes(q);
      const matchEmail = (ord.guestEmail || ord.shippingAddress?.email || '').toLowerCase().includes(q);
      const matchPin = ord.shippingAddress?.pincode?.includes(q);
      if (!matchNum && !matchName && !matchPhone && !matchEmail && !matchPin) return false;
    }
    return true;
  });

  const getShippingBadge = (ord: Order) => {
    if (ord.orderStatus === 'Delivered') {
      return { text: 'Delivered', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' };
    }
    if (ord.orderStatus === 'In Transit' || ord.orderStatus === 'Dispatched' || ord.orderStatus === 'Out for Delivery') {
      return { text: ord.orderStatus, bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' };
    }
    if (ord.pickupStatus === 'SCHEDULED' || ord.orderStatus === 'Ready for Pickup') {
      return { text: 'Pickup Scheduled', bg: '#FDF4FF', color: '#86198F', border: '#F5D0FE' };
    }
    if (ord.awbNumber) {
      return { text: 'AWB Assigned', bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' };
    }
    if (ord.shipmentId) {
      return { text: 'Shipment Created', bg: '#FEF9C3', color: '#854D0E', border: '#FEF08A' };
    }
    return { text: 'Not Created', bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' };
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '85vh' }}>
      <div className="container">
        {/* Admin Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-gold-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Sri Lakshmi Sarees Store Management
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--color-maroon)', marginTop: '0.25rem' }}>
              Admin Management Portal
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={loadData} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              <RotateCcw size={14} /> Refresh Data
            </button>
            <Link to="/shop" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              View Store Front
            </Link>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.8125rem',
                color: '#991B1B',
                borderColor: '#FCA5A5',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
              title="End Administrator Session"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>

        {/* Dashboard Top Summary Cards (7 Metrics) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {/* Card 1: Total Orders */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Orders</span>
              <ShoppingBag size={18} color="var(--color-gold-dark)" />
            </div>
            <div style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
              {totalOrdersCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>All recorded orders</div>
          </div>

          {/* Card 2: New Orders / Order Placed */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>New Orders</span>
              <Clock size={18} color="#2563EB" />
            </div>
            <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#2563EB' }}>
              {newOrdersCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Awaiting preparation</div>
          </div>

          {/* Card 3: Processing Orders */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Processing</span>
              <RefreshCw size={18} color="#D97706" />
            </div>
            <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#D97706' }}>
              {processingOrdersCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Confirmed / Packing</div>
          </div>

          {/* Card 4: Dispatched / In Transit */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>In Transit</span>
              <Truck size={18} color="#7C3AED" />
            </div>
            <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#7C3AED' }}>
              {dispatchedOrdersCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Dispatched with AWB</div>
          </div>

          {/* Card 5: Delivered Orders */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Delivered</span>
              <CheckCircle2 size={18} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {deliveredOrdersCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Fulfilled orders</div>
          </div>

          {/* Card 6: Pending Payments */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Pending Payments</span>
              <AlertTriangle size={18} color="#DC2626" />
            </div>
            <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#DC2626' }}>
              {pendingPaymentsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>COD or unpaid prepaid</div>
          </div>

          {/* Card 7: Total Revenue */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Revenue</span>
              <TrendingUp size={18} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
              ₹{totalSales.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>From recorded database orders</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            className={`btn-${activeTab === 'overview' ? 'primary' : 'secondary'}`}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
            onClick={() => setActiveTab('overview')}
          >
            Orders Log ({orders.length})
          </button>

          <button
            className={`btn-${activeTab === 'products' ? 'primary' : 'secondary'}`}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
            onClick={() => setActiveTab('products')}
          >
            Manage Saree Inventory ({products.length})
          </button>

          <button
            className={`btn-${activeTab === 'coupons' ? 'primary' : 'secondary'}`}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
            onClick={() => setActiveTab('coupons')}
          >
            Promotional Coupons ({coupons.length})
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--color-maroon)' }} />
            <div>Loading live database records...</div>
          </div>
        ) : (
          <>
            {/* Tab 1: Orders Table */}
            {activeTab === 'overview' && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-maroon)', fontSize: '1.125rem' }}>
                    Customer Orders Log
                  </div>

                  {/* Search & Filter Controls */}
                  <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', minWidth: '220px' }}>
                      <input
                        type="text"
                        placeholder="Search #, name, phone, email, PIN"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem 0.75rem', paddingLeft: '2rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                      />
                      <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    </div>

                    {/* Order Status Filter */}
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="All">All Order Statuses</option>
                      <option value="Order Placed">Order Placed</option>
                      <option value="Payment Confirmed">Payment Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Ready for Pickup">Ready for Pickup</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    {/* Payment Status Filter */}
                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="All">All Payment Statuses</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                    </select>

                    {/* Date Range Filter */}
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="All">All Dates</option>
                      <option value="Today">Today</option>
                      <option value="7days">Past 7 Days</option>
                      <option value="30days">Past 30 Days</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Order # & Date</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Customer & Contact</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Delivery Address</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Products</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Total</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Order Status</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Shipping Status</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                            No orders found matching the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => {
                          const shipBadge = getShippingBadge(ord);
                          return (
                            <tr key={ord.id || ord.orderNumber} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              {/* Order Number & Date */}
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 700, color: 'var(--color-maroon)' }}>
                                  #{ord.orderNumber}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                                  {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                              </td>

                              {/* Customer & Contact */}
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 600 }}>{ord.shippingAddress?.fullName || 'Customer'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  📞 {ord.shippingAddress?.phone || 'No phone'}
                                </div>
                                {(ord.guestEmail || ord.shippingAddress?.email) && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    ✉️ {ord.guestEmail || ord.shippingAddress?.email}
                                  </div>
                                )}
                              </td>

                              {/* Delivery Address & PIN */}
                              <td style={{ padding: '0.75rem 1rem', maxWidth: '200px' }}>
                                <div style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.3 }}>
                                  {ord.shippingAddress?.city}, {ord.shippingAddress?.state}
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-maroon)', marginTop: '0.15rem' }}>
                                  PIN: {ord.shippingAddress?.pincode}
                                </div>
                              </td>

                              {/* Ordered Products Preview */}
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {ord.items && ord.items[0]?.image && (
                                    <img
                                      src={ord.items[0].image}
                                      alt=""
                                      style={{ width: '32px', height: '40px', objectFit: 'cover', borderRadius: '3px', border: '1px solid var(--color-border)' }}
                                    />
                                  )}
                                  <div style={{ fontSize: '0.75rem' }}>
                                    <div style={{ fontWeight: 600 }}>{ord.items?.length || 0} item(s)</div>
                                    <div style={{ color: 'var(--color-text-muted)' }}>
                                      {ord.items?.reduce((s, it) => s + (it.quantity || 1), 0)} pcs total
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Payment */}
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{ord.paymentMethod}</div>
                                <span
                                  style={{
                                    fontSize: '0.6875rem',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                    display: 'inline-block',
                                    marginTop: '0.2rem',
                                    backgroundColor: ord.paymentStatus === 'Paid' ? '#ECFDF5' : ord.paymentStatus === 'Failed' ? '#FEF2F2' : '#FFFBEB',
                                    color: ord.paymentStatus === 'Paid' ? '#065F46' : ord.paymentStatus === 'Failed' ? '#991B1B' : '#92400E',
                                    border: `1px solid ${ord.paymentStatus === 'Paid' ? '#A7F3D0' : ord.paymentStatus === 'Failed' ? '#FECACA' : '#FDE68A'}`,
                                  }}
                                >
                                  {ord.paymentStatus}
                                </span>
                              </td>

                              {/* Total Amount */}
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
                                ₹{(ord.finalTotal || 0).toLocaleString('en-IN')}
                              </td>

                              {/* Order Status Select */}
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <select
                                  value={ord.orderStatus}
                                  onChange={(e) => handleStatusChange(ord.id || ord.orderNumber, e.target.value as OrderStatus)}
                                  style={{
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    backgroundColor: ord.orderStatus === 'Delivered' ? '#ECFDF5' : ord.orderStatus === 'Cancelled' ? '#FEF2F2' : '#FFFFFF',
                                    color: ord.orderStatus === 'Delivered' ? '#065F46' : ord.orderStatus === 'Cancelled' ? '#991B1B' : 'var(--color-maroon)'
                                  }}
                                >
                                  <option value="Order Placed">Order Placed</option>
                                  <option value="Payment Confirmed">Payment Confirmed</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Ready for Pickup">Ready for Pickup</option>
                                  <option value="Dispatched">Dispatched</option>
                                  <option value="In Transit">In Transit</option>
                                  <option value="Out for Delivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>

                              {/* Shipping Status & AWB */}
                              <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.6875rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    display: 'inline-block',
                                    backgroundColor: shipBadge.bg,
                                    color: shipBadge.color,
                                    border: `1px solid ${shipBadge.border}`,
                                    marginBottom: ord.awbNumber ? '0.25rem' : '0'
                                  }}
                                >
                                  {shipBadge.text}
                                </span>
                                {ord.awbNumber && (
                                  <div>
                                    <a
                                      href={ord.trackingUrl || `https://shiprocket.co/tracking/${ord.awbNumber}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: 'var(--color-maroon)', fontWeight: 600, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                    >
                                      {ord.awbNumber} <ExternalLink size={10} />
                                    </a>
                                  </div>
                                )}
                              </td>

                              {/* Actions */}
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenOrderModal(ord)}
                                  className="btn-secondary"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <FileText size={13} /> View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Products Inventory Management */}
            {activeTab === 'products' && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)' }}>
                      Saree Inventory Catalogue ({products.length})
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Add real sarees or manage existing inventory. Demo items are clearly labeled below.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={handleResetDemoCatalog} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                      <RotateCcw size={14} /> Restore Demo Sarees
                    </button>
                    <button className="btn-gold" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }} onClick={() => setIsAddProductOpen(true)}>
                      <Plus size={16} /> Add New Saree
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {products.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        padding: '1rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: p.isActive ? 'var(--bg-primary)' : '#F3F4F6',
                        opacity: p.isActive ? 1 : 0.65
                      }}
                    >
                      <img src={p.images[0] || '/images/cat-silk.jpg'} alt="" style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                      
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-maroon)', fontSize: '1rem' }}>{p.name}</span>
                          {p.isDemo && (
                            <span style={{ fontSize: '0.6875rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                              Demo Catalog
                            </span>
                          )}
                          {!p.isActive && (
                            <span style={{ fontSize: '0.6875rem', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                              Archived
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                          SKU: <strong>{p.sku}</strong> • Category: {p.category} • Fabric: {p.fabric || 'Pure Silk'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.375rem' }}>
                          <span style={{ fontWeight: 700 }}>₹{p.price.toLocaleString('en-IN')}</span>

                          {/* Inline Stock Editing */}
                          {editingProductId === p.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <input
                                type="number"
                                min={0}
                                value={editStockValue}
                                onChange={(e) => setEditStockValue(parseInt(e.target.value, 10) || 0)}
                                style={{ width: '60px', padding: '0.2rem 0.4rem', fontSize: '0.8125rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                              />
                              <button
                                className="btn-primary"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => handleUpdateStock(p, editStockValue)}
                              >
                                Save
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => setEditingProductId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: p.stock > 5 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                              Stock: {p.stock} units
                              <button
                                onClick={() => {
                                  setEditingProductId(p.id);
                                  setEditStockValue(p.stock);
                                }}
                                style={{ marginLeft: '0.5rem', textDecoration: 'underline', color: 'var(--color-maroon)', fontSize: '0.75rem', cursor: 'pointer', background: 'none', border: 'none' }}
                              >
                                Edit Stock
                              </button>
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {p.isActive && (
                          <button
                            onClick={() => handleArchiveProduct(p)}
                            className="btn-secondary"
                            style={{ padding: '0.5rem' }}
                            title="Archive Saree"
                          >
                            <Trash2 size={16} color="var(--color-danger)" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Coupons */}
            {activeTab === 'coupons' && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)', marginBottom: '1.5rem' }}>
                  Active Promotional Coupons
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                  {coupons.map((c) => (
                    <div key={c.id} style={{ padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-gold-light)' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-gold-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Tag size={18} /> {c.code}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', marginTop: '0.25rem' }}>
                        {c.discountType === 'percentage' ? `${c.discountValue}% Off` : `Flat ₹${c.discountValue} Off`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        Min order: ₹{c.minOrderValue.toLocaleString('en-IN')} • Used {c.timesUsed} times
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal: Add New Saree */}
        {isAddProductOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', color: 'var(--color-maroon)' }}>
                  Add New Real Saree to Catalogue
                </h3>
                <button onClick={() => setIsAddProductOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Saree Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Bridal Maroon Kanjivaram Silk Saree"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Category *</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as SareeCategory })}
                      className="form-input"
                    >
                      <option value="Silk Sarees">Silk Sarees</option>
                      <option value="Cotton Sarees">Cotton Sarees</option>
                      <option value="Wedding Sarees">Wedding Sarees</option>
                      <option value="Festive Sarees">Festive Sarees</option>
                      <option value="Designer Sarees">Designer Sarees</option>
                      <option value="Daily Wear Sarees">Daily Wear Sarees</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">SKU</label>
                    <input
                      type="text"
                      placeholder="e.g. SLS-KAN-009"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      placeholder="e.g. 18500"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Original Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 22000"
                      value={newProduct.originalPrice}
                      onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Fabric</label>
                    <input
                      type="text"
                      placeholder="e.g. Pure Mulberry Silk"
                      value={newProduct.fabric}
                      onChange={(e) => setNewProduct({ ...newProduct, fabric: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Initial Stock Units *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Image URL / Relative Path</label>
                  <input
                    type="text"
                    placeholder="e.g. /images/cat-silk.jpg or https://..."
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe weave, zari pattern, border, and blouse piece details..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsAddProductOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSavingProduct}>
                    {isSavingProduct ? 'Saving to Database...' : 'Save Product to Live Store'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Details & Courier Dispatch Modal */}
        {selectedOrder && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem', backdropFilter: 'blur(3px)' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: 'var(--shadow-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', color: 'var(--color-maroon)', margin: 0 }}>
                    Order #{selectedOrder.orderNumber}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="icon-button">
                  <X size={20} />
                </button>
              </div>

              {/* Order Items Table */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-maroon)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Ordered Items ({selectedOrder.items?.length || 0})
                </h4>
                <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', padding: '0.75rem' }}>
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: idx < (selectedOrder.items?.length || 0) - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={it.image || '/images/cat-silk.jpg'} alt="" style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{it.productName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Qty: {it.quantity} × ₹{it.price.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        ₹{it.lineTotal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--color-border-dark)', fontWeight: 700 }}>
                    <span>Final Total</span>
                    <span>₹{(selectedOrder.finalTotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Customer & Delivery Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
                <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>Customer & Shipping Address</div>
                  <div style={{ fontWeight: 600 }}>{selectedOrder.shippingAddress?.fullName}</div>
                  <div>Phone: {selectedOrder.shippingAddress?.phone}</div>
                  <div>Email: {selectedOrder.guestEmail || 'None provided'}</div>
                  <div style={{ marginTop: '0.25rem' }}>
                    {selectedOrder.shippingAddress?.houseNo}, {selectedOrder.shippingAddress?.street}
                  </div>
                  <div>
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>Payment Gateway Details</div>
                  <div>Method: <strong>{selectedOrder.paymentMethod}</strong></div>
                  <div>Status: <span style={{ fontWeight: 700, color: selectedOrder.paymentStatus === 'Paid' ? 'var(--color-success)' : 'var(--color-gold-dark)' }}>{selectedOrder.paymentStatus}</span></div>
                  {selectedOrder.cashfreePaymentId && (
                    <div style={{ wordBreak: 'break-all', marginTop: '0.25rem' }}>
                      Cashfree Payment ID: <code>{selectedOrder.cashfreePaymentId}</code>
                    </div>
                  )}
                  {selectedOrder.cashfreeOrderId && (
                    <div style={{ wordBreak: 'break-all' }}>
                      Cashfree Order ID: <code>{selectedOrder.cashfreeOrderId}</code>
                    </div>
                  )}
                  {selectedOrder.razorpayPaymentId && (
                    <div style={{ wordBreak: 'break-all', marginTop: '0.25rem' }}>
                      Razorpay Payment ID: <code>{selectedOrder.razorpayPaymentId}</code>
                    </div>
                  )}
                  {selectedOrder.razorpayOrderId && (
                    <div style={{ wordBreak: 'break-all' }}>
                      Razorpay Order ID: <code>{selectedOrder.razorpayOrderId}</code>
                    </div>
                  )}
                  {selectedOrder.paymentFailureReason && (
                    <div style={{ color: 'var(--color-danger)', marginTop: '0.25rem' }}>
                      Failure Reason: {selectedOrder.paymentFailureReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Courier Fulfillment Section */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-maroon)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={16} /> Official Shiprocket Fulfillment
                  </h4>
                  {selectedOrder.awbNumber && (
                    <button
                      type="button"
                      onClick={() => handleTrackLive(selectedOrder.id || selectedOrder.orderNumber)}
                      disabled={isTrackingLive}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {isTrackingLive ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      Track Live via Shiprocket
                    </button>
                  )}
                </div>

                {/* Payment Gating & COD Notice Banners */}
                {selectedOrder.paymentMethod === 'Prepaid' ? (
                  selectedOrder.paymentStatus === 'Paid' ? (
                    <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.625rem 0.875rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.8125rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} />
                      <span><strong>Payment Verified:</strong> Full online payment of ₹{(selectedOrder.finalTotal || 0).toLocaleString('en-IN')} confirmed. Authorized for official Shiprocket shipment creation.</span>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '0.625rem 0.875rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.8125rem', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={16} />
                      <span><strong>Prepaid Payment Pending:</strong> Shiprocket automated shipping is protected and blocked until payment verification succeeds. Verify payment status before proceeding.</span>
                    </div>
                  )
                ) : (
                  <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.625rem 0.875rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.8125rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={16} />
                    <span><strong>Cash on Delivery (COD) Order:</strong> Collect ₹{(selectedOrder.finalTotal || 0).toLocaleString('en-IN')} from recipient upon delivery. Payment status remains Pending until delivered.</span>
                  </div>
                )}

                {/* Shiprocket Fulfillment Metadata Card */}
                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Shipment ID:</span>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {selectedOrder.shipmentId || <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Not Created</span>}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>AWB Number:</span>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {selectedOrder.awbNumber ? (
                        <a
                          href={selectedOrder.trackingUrl || `https://shiprocket.co/tracking/${selectedOrder.awbNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-maroon)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          {selectedOrder.awbNumber} <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Pending AWB</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Courier Partner:</span>
                    <div style={{ fontWeight: 600 }}>
                      {selectedOrder.courierName || <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Not Assigned</span>}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Pickup Status:</span>
                    <div style={{ fontWeight: 600, color: selectedOrder.pickupStatus === 'SCHEDULED' ? '#059669' : 'inherit' }}>
                      {selectedOrder.pickupStatus === 'SCHEDULED'
                        ? `Scheduled (${selectedOrder.pickupTokenNumber ? `Token: ${selectedOrder.pickupTokenNumber}` : 'Confirmed'})`
                        : <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Not Scheduled</span>}
                    </div>
                  </div>
                </div>

                {/* Shiprocket Automated Action Controls */}
                <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* 1-Click Complete Dispatch */}
                    <button
                      type="button"
                      onClick={() => handleShiprocketDispatch(selectedOrder.id || selectedOrder.orderNumber)}
                      disabled={isDispatching || (selectedOrder.paymentMethod === 'Prepaid' && selectedOrder.paymentStatus !== 'Paid')}
                      className="btn-primary"
                      style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title={selectedOrder.paymentMethod === 'Prepaid' && selectedOrder.paymentStatus !== 'Paid' ? 'Payment must be verified first' : ''}
                    >
                      {activeShipAction === 'all' ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                      {activeShipAction === 'all' ? 'Processing Dispatch...' : '1-Click Dispatch via Shiprocket'}
                    </button>

                    {/* Step 1: Create Shipment */}
                    {!selectedOrder.shipmentId && (
                      <button
                        type="button"
                        onClick={() => handleCreateShipment(selectedOrder.id || selectedOrder.orderNumber)}
                        disabled={Boolean(activeShipAction) || (selectedOrder.paymentMethod === 'Prepaid' && selectedOrder.paymentStatus !== 'Paid')}
                        className="btn-secondary"
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
                      >
                        {activeShipAction === 'shipment' ? <Loader2 size={14} className="animate-spin" /> : '1. Create Shipment'}
                      </button>
                    )}

                    {/* Step 2: Assign AWB */}
                    {selectedOrder.shipmentId && !selectedOrder.awbNumber && (
                      <button
                        type="button"
                        onClick={() => handleAssignAwb(selectedOrder.id || selectedOrder.orderNumber)}
                        disabled={Boolean(activeShipAction)}
                        className="btn-secondary"
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
                      >
                        {activeShipAction === 'awb' ? <Loader2 size={14} className="animate-spin" /> : '2. Assign AWB'}
                      </button>
                    )}

                    {/* Step 3: Book Pickup */}
                    {selectedOrder.shipmentId && selectedOrder.awbNumber && selectedOrder.pickupStatus !== 'SCHEDULED' && (
                      <button
                        type="button"
                        onClick={() => handleBookPickup(selectedOrder.id || selectedOrder.orderNumber)}
                        disabled={Boolean(activeShipAction)}
                        className="btn-secondary"
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
                      >
                        {activeShipAction === 'pickup' ? <Loader2 size={14} className="animate-spin" /> : '3. Book Pickup'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Tracking Result View */}
                {liveTrackingInfo && (
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.875rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#166534' }}>Live Shiprocket Tracking Status: {liveTrackingInfo.currentStatus}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#15803D' }}>AWB: {liveTrackingInfo.awbCode}</span>
                    </div>
                    {liveTrackingInfo.edd && (
                      <div style={{ fontSize: '0.75rem', color: '#15803D', marginBottom: '0.5rem' }}>
                        Estimated Delivery: {liveTrackingInfo.edd}
                      </div>
                    )}
                    {Array.isArray(liveTrackingInfo.activities) && liveTrackingInfo.activities.length > 0 && (
                      <div style={{ borderTop: '1px solid #DCFCE7', paddingTop: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                        {liveTrackingInfo.activities.map((act: any, idx: number) => (
                          <div key={idx} style={{ fontSize: '0.75rem', color: '#374151', padding: '0.2rem 0' }}>
                            <span style={{ color: '#6B7280' }}>{act.date}:</span> {act.activity} {act.location ? `(${act.location})` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Courier Override Form */}
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Manual Courier Override (For non-Shiprocket local consignments):
                </div>
                <form onSubmit={handleSaveManualDispatch} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Courier Partner Name</label>
                    <input
                      type="text"
                      placeholder="e.g. DTDC / Delhivery / Shiprocket"
                      value={manualCourier}
                      onChange={(e) => setManualCourier(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>AWB / Tracking Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 1428573921"
                      value={manualAwb}
                      onChange={(e) => setManualAwb(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Public Tracking URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://shiprocket.co/tracking/..."
                      value={manualTrackingUrl}
                      onChange={(e) => setManualTrackingUrl(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Payment Status</label>
                    <select
                      value={manualPaymentStatus}
                      onChange={(e) => setManualPaymentStatus(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.8125rem' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }}>
                      Save Dispatch Details
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
