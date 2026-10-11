export type SareeCategory = 
  | 'Silk Sarees'
  | 'Cotton Sarees'
  | 'Wedding Sarees'
  | 'Festive Sarees'
  | 'Designer Sarees'
  | 'Daily Wear Sarees'
  | 'Budget Collection'
  | 'Premium Collection'
  | 'New Arrivals'
  | 'Best Sellers'
  | 'Sale';

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category: SareeCategory;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  fabric: string;
  color: string;
  pattern: string;
  occasion: string;
  sareeLength: string; // e.g. "5.5 Meters + 0.8 Meter Blouse Piece"
  blouseIncluded: boolean;
  careInstructions: string;
  description: string;
  stock: number;
  images: string[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isActive: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer';
  addresses?: ShippingAddress[];
}

export interface ShippingAddress {
  id?: string;
  fullName: string;
  phone: string;
  pincode: string;
  houseNo: string;
  street: string;
  locality: string;
  landmark?: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  image: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export type OrderStatus = 
  | 'Order Placed'
  | 'Payment Confirmed'
  | 'Processing'
  | 'Ready for Pickup'
  | 'Picked Up'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Return Initiated'
  | 'Returned';

export type PaymentMethod = 'Prepaid' | 'COD';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestEmail?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCharge: number;
  discount: number;
  couponCode?: string;
  finalTotal: number;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  courierName?: string;
  awbNumber?: string;
  trackingUrl?: string;
  shipmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  expiryDate: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  reason: string;
  photos?: string[];
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  adminNotes?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  message: string;
  isActive: boolean;
  linkText?: string;
  linkUrl?: string;
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  storeAddress: string;
  freeShippingMinAmount: number;
  standardShippingFee: number;
  codEnabled: boolean;
  returnWindowDays: number;
}
