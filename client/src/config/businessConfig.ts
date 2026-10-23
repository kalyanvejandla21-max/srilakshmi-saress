/**
 * Sri Lakshmi Sarees - Centralized Business & Regulatory Configuration
 * 
 * Single source of truth for business identity, customer support details,
 * regulatory policies, and marketing trust claims.
 * 
 * Note: Confirmation flags are kept strictly false until physical reachability tests
 * and full postal registrations are completed.
 */

export interface BusinessConfig {
  brandName: string;
  tagline: string;
  legalEntity: {
    legalOwnerName: string;
    entityType: string;
    tradeName: string;
    gstin: string | null;
    udyamNumber: string | null;
    isHomeBased: boolean;
    isOwnerConfirmed: boolean;
  };
  contact: {
    phone: string;
    phoneDisplay: string;
    whatsapp: string;
    whatsappDisplay: string;
    isPhoneConfirmed: boolean;
    phoneStatusNotice: string;
    email: string;
    emailDisplay: string;
    isEmailConfirmed: boolean;
    emailStatusNotice: string;
    fullAddress: string;
    isAddressConfirmed: boolean;
    isPostalAddressComplete: boolean;
    addressStatusNotice: string;
    addressDetails: {
      location: string;
      locality: string;
      district: string;
      city: string;
      state: string;
      country: string;
      pincode: string | null;
    };
    supportHours: string;
  };
  policies: {
    freeShippingThreshold: number;
    standardShippingFee: number;
    returnWindowDays: number;
    dispatchTimeline: string;
    metroDeliveryDays: string;
    regionalDeliveryDays: string;
    courierPartners: string;
  };
  claims: {
    fabricBadgeTitle: string;
    fabricBadgeSubtitle: string;
    deliveryBadgeTitle: string;
    deliveryBadgeSubtitle: string;
    returnsBadgeTitle: string;
    returnsBadgeSubtitle: string;
    checkoutBadgeTitle: string;
    checkoutBadgeSubtitle: string;
  };
  social: {
    instagram: string | null;
    facebook: string | null;
  };
  grievanceOfficer: {
    name: string;
    designation: string;
    email: string;
    phone: string;
    notice: string;
    isConfirmed: boolean;
  };
}

export const BUSINESS_CONFIG: BusinessConfig = {
  brandName: 'Sri Lakshmi Sarees',
  tagline: 'Timeless Handpicked Sarees, Pure Silk & Artisanal Weaves',

  legalEntity: {
    legalOwnerName: 'Proprietor (Pending Confirmation)',
    entityType: 'Sole Proprietorship (Family-run home enterprise)',
    tradeName: 'Sri Lakshmi Sarees',
    gstin: null, // Exempt under Notification No. 34/2023 - Central Tax (Turnover below threshold)
    udyamNumber: null, // Pending MSME Udyam registration
    isHomeBased: true,
    isOwnerConfirmed: false,
  },

  contact: {
    // Supplied customer support phone & WhatsApp (flagged false until live reachability test is performed)
    phone: '+91 72072 77006',
    phoneDisplay: '+91 72072 77006',
    whatsapp: '+91 72072 77006',
    whatsappDisplay: '+91 72072 77006',
    isPhoneConfirmed: false,
    phoneStatusNotice: 'Customer support phone supplied; reachability testing in progress.',

    // Supplied customer support email (flagged false until inbox message receipt test is confirmed)
    email: 'bhavanivejandla6@gmail.com',
    emailDisplay: 'bhavanivejandla6@gmail.com',
    isEmailConfirmed: false,
    emailStatusNotice: 'Customer support email supplied; inbox receipt testing in progress.',

    // Supplied dispatch location (marked incomplete: door number and postal PIN code not yet supplied)
    fullAddress: 'Tekupalli Entrance, Mopidevi, Krishna District, Andhra Pradesh, India',
    isAddressConfirmed: false,
    isPostalAddressComplete: false,
    addressStatusNotice: 'Operating dispatch location; full postal door/house number and PIN code pending confirmation.',
    addressDetails: {
      location: 'Tekupalli Entrance',
      locality: 'Mopidevi',
      district: 'Krishna District',
      city: 'Mopidevi',
      state: 'Andhra Pradesh',
      country: 'India',
      pincode: null, // Not supplied; do not invent
    },
    supportHours: 'Monday – Saturday: 10:00 AM – 7:00 PM IST (Sunday Closed)',
  },

  policies: {
    freeShippingThreshold: 2999,
    standardShippingFee: 150,
    returnWindowDays: 7,
    dispatchTimeline: '24 to 48 business hours',
    metroDeliveryDays: '3 to 5 business days (Courier estimate)',
    regionalDeliveryDays: '4 to 7 business days (Courier estimate)',
    courierPartners: 'Shiprocket logistics network (Delhivery, Blue Dart, DTDC, Xpressbees)',
  },

  claims: {
    // Accurate catalog wording covering silk, cotton, and blends
    fabricBadgeTitle: 'Authentic Handloom & Silk',
    fabricBadgeSubtitle: 'Curated Pure Silk, Mulmul Cotton & Blends',
    deliveryBadgeTitle: 'Tracked Express Delivery',
    deliveryBadgeSubtitle: 'Free shipping on orders over ₹2,999',
    returnsBadgeTitle: '7-Day Return Window',
    returnsBadgeSubtitle: 'Hassle-free reverse doorstep pickup',
    checkoutBadgeTitle: 'Secure Online Checkout',
    checkoutBadgeSubtitle: '256-Bit SSL Encrypted Cashfree Payments',
  },

  social: {
    // Kept null to hide broken placeholder social links until verified URLs are provided
    instagram: null,
    facebook: null,
  },

  grievanceOfficer: {
    name: 'Customer Inquiries & Grievances',
    designation: 'Family Management Team',
    email: 'bhavanivejandla6@gmail.com',
    phone: '+91 72072 77006',
    notice: 'For customer disputes, order issues, or privacy inquiries, contact the family management team. Formal statutory grievance officer designation will be published upon business entity registration and payment gateway verification.',
    isConfirmed: false,
  },
};
