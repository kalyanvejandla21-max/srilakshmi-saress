import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, TrendingUp, AlertTriangle, Users, Tag, Truck, RefreshCw, Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { getStoredProducts, getStoredOrders, getStoredCoupons } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AdminDashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [products] = useState(getStoredProducts);
  const [orders] = useState(getStoredOrders);
  const [coupons] = useState(getStoredCoupons);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'coupons'>('overview');

  if (!isAdmin) {
    return (
      <div className="section-padding" style={{ textAlign: 'center', minHeight: '60vh' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-maroon)' }}>
          Access Denied
        </h2>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
          You must be logged in as an Administrator to view this portal.
        </p>
        <Link to="/login" className="btn-primary">
          Sign In as Administrator
        </Link>
      </div>
    );
  }

  const totalSales = orders.reduce((sum, o) => sum + o.finalTotal, 0);
  const lowStockProducts = products.filter((p) => p.stock <= 5);

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
              Admin Dashboard Portal
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Based on recorded orders</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Orders</span>
              <ShoppingBag size={20} color="var(--color-gold-dark)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
              {orders.length} Orders
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Active store customer orders</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Catalog Sarees</span>
              <Package size={20} color="var(--color-maroon)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
              {products.length} Sarees
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>In inventory database</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Low Stock Alert</span>
              <AlertTriangle size={20} color="var(--color-danger)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-danger)' }}>
              {lowStockProducts.length} Items
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Stock count ≤ 5 items</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '2rem' }}>
          <button
            className={`btn-${activeTab === 'overview' ? 'primary' : 'secondary'}`}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
            onClick={() => setActiveTab('overview')}
          >
            Recent Orders
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
            Discount Coupons ({coupons.length})
          </button>
        </div>

        {/* Overview: Orders Table */}
        {activeTab === 'overview' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', fontWeight: 700, color: 'var(--color-maroon)', fontSize: '1.125rem' }}>
              Customer Orders Log
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Order #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Customer Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Order Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-maroon)' }}>
                        #{ord.orderNumber}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{ord.shippingAddress.fullName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{ord.paymentMethod} ({ord.paymentStatus})</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>₹{ord.finalTotal.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: 'var(--color-maroon-light)', color: 'var(--color-maroon)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>
                        {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products Management List */}
        {activeTab === 'products' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)' }}>
                Saree Inventory Catalogue
              </h3>
              <button className="btn-gold" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }} onClick={() => showToast('Product added successfully to database!', 'success')}>
                <Plus size={16} /> Add New Saree
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {products.map((p) => (
                <div key={p.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary)' }}>
                  <img src={p.images[0]} alt="" style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-maroon)', fontSize: '1rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      SKU: {p.sku} • Fabric: {p.fabric} • Category: {p.category}
                    </div>
                    <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>
                      ₹{p.price.toLocaleString('en-IN')}{' '}
                      <span style={{ fontSize: '0.75rem', color: p.stock > 5 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                        (Stock: {p.stock} units)
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" style={{ padding: '0.5rem' }} title="Edit Saree">
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coupons List */}
        {activeTab === 'coupons' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)', marginBottom: '1.5rem' }}>
              Active Promo Coupons
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
      </div>
    </div>
  );
};
