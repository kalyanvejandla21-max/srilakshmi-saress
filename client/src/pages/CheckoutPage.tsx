import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, Banknote, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Order, ShippingAddress } from '../types';
import {
  createOrderOnServer,
  createRazorpayOrderApi,
  verifyRazorpayPaymentApi,
  recordPaymentFailureApi,
} from '../services/api';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal, appliedCoupon, discountAmount, finalTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: user?.name || '',
    phone: user?.phone || '',
    pincode: '',
    houseNo: '',
    street: '',
    locality: '',
    landmark: '',
    city: '',
    state: ''
  });

  const [email, setEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState<'Prepaid' | 'COD'>('Prepaid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGatewayUnconfigured, setIsGatewayUnconfigured] = useState(false);
  const [idempotencyKey] = useState<string>(() => `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  if (cart.length === 0) {
    return (
      <div className="section-padding" style={{ textAlign: 'center', minHeight: '60vh' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-maroon)' }}>
          Your Shopping Cart is Empty
        </h2>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
          Add sarees to your cart before proceeding to checkout.
        </p>
        <button className="btn-primary" onClick={() => navigate('/shop')}>
          Browse Sarees
        </button>
      </div>
    );
  }

  const shippingFee = subtotal > 0 && subtotal < 2999 ? 150 : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsGatewayUnconfigured(false);

    // Validation
    if (!address.fullName || !address.phone || !address.pincode || !address.houseNo || !address.street || !address.city || !address.state) {
      showToast('Please complete all required shipping address fields.', 'error');
      return;
    }

    const cleanPhone = address.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }

    const cleanPincode = address.pincode.replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      showToast('Please enter a valid 6-digit Indian PIN Code.', 'error');
      return;
    }

    setIsSubmitting(true);

    const orderPayload: Partial<Order> = {
      userId: user?.id,
      guestEmail: email || '',
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        image: item.product.images[0] || '',
        price: item.product.price,
        quantity: item.quantity,
        lineTotal: item.product.price * item.quantity
      })),
      shippingAddress: {
        ...address,
        phone: cleanPhone,
        pincode: cleanPincode
      },
      paymentMethod,
      couponCode: appliedCoupon?.code,
      idempotencyKey
    };

    try {
      // 1. Create order securely on server (status will be Pending)
      const createdOrder = await createOrderOnServer(orderPayload);

      // 2. Handle Cash on Delivery Flow
      if (paymentMethod === 'COD') {
        clearCart();
        setIsSubmitting(false);
        showToast(`Order #${createdOrder.orderNumber} confirmed successfully!`, 'success');
        navigate(`/order-confirmation/${createdOrder.orderNumber}`, { state: { order: createdOrder } });
        return;
      }

      // 3. Handle Prepaid Flow via Razorpay
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Unable to load secure Razorpay payment modal. Please check your internet connection or choose Cash on Delivery.');
      }

      let rzpOrderData;
      try {
        rzpOrderData = await createRazorpayOrderApi(createdOrder.orderNumber);
      } catch (orderErr: any) {
        if (orderErr.code === 'GATEWAY_NOT_CONFIGURED') {
          setIsGatewayUnconfigured(true);
          setPaymentMethod('COD');
          throw new Error('Online Payment Gateway is currently pending merchant activation. Please switch to Cash on Delivery (COD) to place your order now.');
        }
        throw orderErr;
      }

      // Launch official Razorpay Checkout modal
      const options = {
        key: rzpOrderData.keyId,
        amount: rzpOrderData.amount,
        currency: rzpOrderData.currency,
        name: 'Sri Lakshmi Sarees',
        description: `Order #${createdOrder.orderNumber} - Handwoven Pure Silk Sarees`,
        image: '/saree-logo.svg',
        order_id: rzpOrderData.razorpayOrderId,
        prefill: {
          name: address.fullName,
          email: email || '',
          contact: cleanPhone,
        },
        theme: {
          color: '#5C061C',
        },
        handler: async (response: any) => {
          try {
            setIsSubmitting(true);
            const verifiedOrder = await verifyRazorpayPaymentApi({
              orderNumber: createdOrder.orderNumber,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart();
            setIsSubmitting(false);
            showToast(`Payment verified! Order #${verifiedOrder.orderNumber} placed successfully!`, 'success');
            navigate(`/order-confirmation/${verifiedOrder.orderNumber}`, { state: { order: verifiedOrder } });
          } catch (verifyErr: any) {
            setIsSubmitting(false);
            const errText = `Payment verification failed: ${verifyErr.message}. If funds were debited, our team will verify your transaction manually.`;
            setSubmitError(errText);
            showToast(errText, 'error');
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            recordPaymentFailureApi(createdOrder.orderNumber, 'Payment modal dismissed by user', rzpOrderData.razorpayOrderId);
            showToast(`Payment was cancelled. Order #${createdOrder.orderNumber} is preserved as Pending. You may retry or pay via COD.`, 'info');
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', (resp: any) => {
        setIsSubmitting(false);
        const reason = resp.error?.description || 'Transaction declined by bank';
        recordPaymentFailureApi(createdOrder.orderNumber, reason, rzpOrderData.razorpayOrderId);
        setSubmitError(`Payment failed: ${reason}. Please retry or choose Cash on Delivery.`);
        showToast(`Payment failed: ${reason}`, 'error');
      });

      razorpayInstance.open();
    } catch (err: any) {
      setIsSubmitting(false);
      const errorMsg = err.message || 'We could not securely process your order. Please try again.';
      setSubmitError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '85vh' }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--color-maroon)', marginBottom: '2rem', textAlign: 'center' }}>
          Secure Checkout
        </h1>

        {submitError && (
          <div style={{
            backgroundColor: isGatewayUnconfigured ? '#FFFBEB' : '#FEF2F2',
            border: `1px solid ${isGatewayUnconfigured ? '#FCD34D' : '#FCA5A5'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            color: isGatewayUnconfigured ? '#92400E' : '#991B1B'
          }}>
            <AlertCircle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
                {isGatewayUnconfigured ? 'Online Gateway Notice' : 'Order Could Not Be Completed'}
              </div>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                {submitError}
              </div>
              {isGatewayUnconfigured ? (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('COD');
                    setSubmitError(null);
                    setIsGatewayUnconfigured(false);
                  }}
                  className="btn-primary"
                  style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                >
                  Confirm with Cash on Delivery (COD)
                </button>
              ) : (
                <div style={{ fontSize: '0.8125rem', color: '#7F1D1D' }}>
                  Your cart and entered address details have been preserved. Please check your connection and click "Place Order" again to retry.
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="checkout-form-grid">
          {/* Left Column: Customer Address & Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Contact Details */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                1. Contact & Customer Details
              </h3>
              <div className="form-group">
                <label className="form-label">Email Address (For Order Updates & Tracking)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                2. Shipping & Delivery Address
              </h3>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={address.fullName}
                    onChange={handleInputChange}
                    placeholder="Recipient Full Name"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={address.phone}
                    onChange={handleInputChange}
                    placeholder="10-Digit Mobile Number"
                    maxLength={10}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">PIN Code *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleInputChange}
                    placeholder="6-Digit PIN Code"
                    maxLength={6}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">House / Flat No / Building *</label>
                  <input
                    type="text"
                    name="houseNo"
                    value={address.houseNo}
                    onChange={handleInputChange}
                    placeholder="House No, Apartment"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Street / Area / Locality *</label>
                <input
                  type="text"
                  name="street"
                  value={address.street}
                  onChange={handleInputChange}
                  placeholder="Street Name, Main Road"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Landmark (Optional)</label>
                  <input
                    type="text"
                    name="landmark"
                    value={address.landmark}
                    onChange={handleInputChange}
                    placeholder="Near Temple / Park"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    required
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                3. Select Payment Method
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: paymentMethod === 'Prepaid' ? '2px solid var(--color-maroon)' : '1px solid var(--color-border)',
                    backgroundColor: paymentMethod === 'Prepaid' ? 'var(--color-maroon-light)' : '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Prepaid"
                    checked={paymentMethod === 'Prepaid'}
                    onChange={() => setPaymentMethod('Prepaid')}
                    style={{ accentColor: 'var(--color-maroon)' }}
                  />
                  <CreditCard size={24} color="var(--color-maroon)" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-maroon)' }}>Prepaid Online Payment (Razorpay / UPI / NetBanking / Cards)</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Fastest dispatch & 100% Instant Payment Guarantee</div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: paymentMethod === 'COD' ? '2px solid var(--color-maroon)' : '1px solid var(--color-border)',
                    backgroundColor: paymentMethod === 'COD' ? 'var(--color-maroon-light)' : '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    style={{ accentColor: 'var(--color-maroon)' }}
                  />
                  <Banknote size={24} color="var(--color-gold-dark)" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-maroon)' }}>Cash on Delivery (COD)</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Pay cash to courier executive upon delivery</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary Box */}
          <div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)', marginBottom: '1.25rem' }}>
                Order Summary ({cart.length} items)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.5rem' }}>
                {cart.map((item) => (
                  <div key={item.product.id} style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                    <img src={item.product.images[0]} alt="" style={{ width: '56px', height: '70px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-maroon)' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Qty: {item.quantity} × ₹{item.product.price.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontWeight: 600 }}>
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                  <span>Shipping Fee</span>
                  <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-maroon)', borderTop: '1px dashed var(--color-border-dark)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <span>Final Payable</span>
                  <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', justifyContent: 'center' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing Order...' : `Place Order (${paymentMethod})`} <ArrowRight size={18} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                <Lock size={14} color="var(--color-gold-dark)" /> 256-Bit SSL Encrypted & Verified Order Processing
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
