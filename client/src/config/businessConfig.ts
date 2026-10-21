/**
 * Sri Lakshmi Sarees - Centralized Business & Regulatory Configuration
 * 
 * Single source of truth for business identity, customer support details,
 * regulatory policies, and marketing trust claims.
 * 
 * Verification flags (isConfirmed) ensure that unverified contact numbers,
 * unconfirmed emails, or placeholder addresses are NEVER displayed as active/verified.
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
    phone: string | null;
    phoneDisplay: string;
    whatsapp: string | null;
    whatsappDisplay: string;
    isPhoneConfirmed: boolean;
    email: string | null;
    emailDisplay: string;
    isEmailConfirmed: boolean;
    fullAddress: string;
    isAddressConfirmed: boolean;
    addressDetails: {
      city: string;
      state: string;
      country: string;
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
    email: string | null;
    phone: string | null;
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
    // Phone numbers set to null until confirmed by user to prevent broken tel: links
    phone: null,
    phoneDisplay: 'Support line: Pending carrier activation',
    whatsapp: null,
    whatsappDisplay: 'WhatsApp: Pending carrier activation',
    isPhoneConfirmed: false,

    // Unconfirmed support email explicitly flagged
    email: null,
    emailDisplay: 'Email: Pending mailbox activation',
    isEmailConfirmed: false,

    // Home operating address - physical district/state indicated without inventing a fake door/street
    fullAddress: 'Home Dispatch Studio, Tamil Nadu, India (Physical address pending verification)',
    isAddressConfirmed: false,
    addressDetails: {
      city: 'Kanchipuram',
      state: 'Tamil Nadu',
      country: 'India',
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
    checkoutBadgeSubtitle: '256-Bit SSL Encrypted Razorpay Payments',
  },

  social: {
    // Kept null to hide broken placeholder social links until verified URLs are provided
    instagram: null,
    facebook: null,
  },

  grievanceOfficer: {
    name: 'Customer Inquiries & Grievances',
    designation: 'Family Management Team',
    email: null,
    phone: null,
    notice: 'For customer disputes, order issues, or privacy inquiries, contact the family management team. Formal statutory grievance officer designation will be published upon business entity registration and payment gateway verification.',
    isConfirmed: false,
  },
};
