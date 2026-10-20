import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  ChevronRight
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
  adminDispatchShiprocketApi,
  getStoredCoupons
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AdminDashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons] = useState(getStoredCoupons);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'coupons'>('overview');

  // Search & Filter state for orders
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Order Details & Dispatch Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
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
        <Link to="/login" className="btn-primary">
          Sign In as Administrator
        </Link>
      </div>
    );
  }

  // Update Order Status Handler
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
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
  };

  const handleShiprocketDispatch = async (orderId: string) => {
    setIsDispatching(true);
    try {
      const res = await adminDispatchShiprocketApi(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? res.order : o)));
      setSelectedOrder(res.order);
      setManualCourier(res.order.courierName || '');
      setManualAwb(res.order.awbNumber || '');
      setManualTrackingUrl(res.order.trackingUrl || '');
      showToast(`Shipment registered with Shiprocket! AWB: ${res.order.awbNumber || 'Pending Courier Pickup'}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Shiprocket dispatch failed. Please check credentials on Render or use manual dispatch.', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSaveManualDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const updated = await adminUpdateOrderStatusApi(selectedOrder.id || selectedOrder.orderNumber, {
        courierName: manualCourier,
        awbNumber: manualAwb,
        trackingUrl: manualTrackingUrl,
        paymentStatus: manualPaymentStatus as any,
        orderStatus: manualAwb && selectedOrder.orderStatus === 'Order Placed' ? 'In Transit' : selectedOrder.orderStatus,
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

  // Filtered Orders
  const filteredOrders = orders.filter((ord) => {
    if (orderStatusFilter !== 'All' && ord.orderStatus !== orderStatusFilter) {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.trim().toLowerCase();
      const matchNum = ord.orderNumber.toLowerCase().includes(q);
      const matchName = ord.shippingAddress?.fullName?.toLowerCase().includes(q);
      const matchPhone = ord.shippingAddress?.phone?.includes(q);
      if (!matchNum && !matchName && !matchPhone) return false;
    }
    return true;
  });

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

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={loadData} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              <RotateCcw size={14} /> Refresh Data
            </button>
            <Link to="/shop" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              View Store Front
            </Link>
          </div>
        </div>

        {/* Dashboard Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Revenue</span>
              <TrendingUp size={20} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
              ₹{totalSales.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>From recorded database orders</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Orders</span>
              <ShoppingBag size={20} color="var(--color-gold-dark)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
              {orders.length} Orders
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Active customer orders in database</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Sarees</span>
              <Package size={20} color="var(--color-maroon)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
              {activeProducts.length} Sarees
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Published in live store catalogue</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Low Stock Alert</span>
              <AlertTriangle size={20} color="var(--color-danger)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-danger)' }}>
              {lowStockProducts.length} Items
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Stock level ≤ 5 units</div>
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
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search order #, customer, phone"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        style={{ padding: '0.4rem 0.75rem', paddingLeft: '2rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                      />
                      <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    </div>

                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Order Placed">Order Placed</option>
                      <option value="Payment Confirmed">Payment Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Ready for Pickup">Ready for Pickup</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Order #</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Customer & Delivery</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Total</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Fulfillment Status</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Courier / AWB</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                            No orders found matching the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => (
                          <tr key={ord.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
                              #{ord.orderNumber}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ fontWeight: 600 }}>{ord.shippingAddress?.fullName || 'Customer'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {ord.shippingAddress?.phone} • {ord.shippingAddress?.city}, {ord.shippingAddress?.pincode}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div>{ord.paymentMethod}</div>
                              <span style={{ fontSize: '0.75rem', color: ord.paymentStatus === 'Paid' ? 'var(--color-success)' : 'var(--color-gold-dark)', fontWeight: 600 }}>
                                {ord.paymentStatus}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                              ₹{(ord.finalTotal || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <select
                                value={ord.orderStatus}
                                onChange={(e) => handleStatusChange(ord.id || ord.orderNumber, e.target.value as OrderStatus)}
                                style={{
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--color-border)',
                                  fontSize: '0.8125rem',
                                  fontWeight: 600,
                                  backgroundColor: ord.orderStatus === 'Delivered' ? '#ECFDF5' : ord.orderStatus === 'Cancelled' ? '#FEF2F2' : '#FFFFFF',
                                  color: ord.orderStatus === 'Delivered' ? '#065F46' : ord.orderStatus === 'Cancelled' ? '#991B1B' : 'var(--color-maroon)'
                                }}
                              >
                                <option value="Order Placed">Order Placed</option>
                                <option value="Payment Confirmed">Payment Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Ready for Pickup">Ready for Pickup</option>
                                <option value="In Transit">In Transit</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem' }}>
                              {ord.awbNumber ? (
                                <a
                                  href={ord.trackingUrl || `https://shiprocket.co/tracking/${ord.awbNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--color-maroon)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  {ord.awbNumber} <ExternalLink size={12} />
                                </a>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)' }}>Pending AWB</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenOrderModal(ord)}
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Truck size={14} /> Dispatch
                              </button>
                            </td>
                          </tr>
                        ))
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-maroon)', margin: 0 }}>
                    Shipping & Courier Dispatch
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleShiprocketDispatch(selectedOrder.id || selectedOrder.orderNumber)}
                    disabled={isDispatching}
                    className="btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                  >
                    {isDispatching ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                    {isDispatching ? 'Contacting Shiprocket...' : 'Ship with Shiprocket API'}
                  </button>
                </div>

                {/* Manual Tracking & Status Form */}
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
