/**
 * RevenueCat Billing Service
 * 
 * Modern implementation with:
 * - SDK v9+ best practices
 * - Paywall UI integration
 * - Customer Center support
 * - Comprehensive error handling
 * - Entitlement checking for Parker Pro
 */

import { Platform } from 'react-native';
import Purchases, { 
  CustomerInfo, 
  PURCHASES_ERROR_CODE, 
  PurchasesError,
  LOG_LEVEL,
  PurchasesPackage,
  PurchasesOffering
} from 'react-native-purchases';

// ============================================================================
// Types & Configuration
// ============================================================================

export type BillingStatus = {
  enabled: boolean;
  isPro: boolean;
  renewsAtISO: string | null;
  willRenew: boolean;
  expiresAtISO: string | null;
  productIdentifier: string | null;
  customerInfo?: CustomerInfo;
};

export type PurchaseResult = {
  success: boolean;
  customerInfo?: CustomerInfo;
  userCancelled: boolean;
  error?: string;
};

// Configuration constants - can be customized via env vars
const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID || 'Parker Pro';
const MONTHLY_PRODUCT_ID = process.env.EXPO_PUBLIC_RC_MONTHLY_PRODUCT_ID || 'monthly';
const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';

let isConfigured = false;

// ============================================================================
// SDK Configuration & Initialization
// ============================================================================

/**
 * Initialize RevenueCat SDK with proper configuration
 * Call this once during app startup
 */
export async function initializeRevenueCat(appUserId?: string): Promise<BillingStatus> {
  console.log('[RevenueCat] Configuration:', {
    hasApiKey: !!API_KEY,
    entitlementId: ENTITLEMENT_ID,
    monthlyProductId: MONTHLY_PRODUCT_ID,
  });
  
  if (!API_KEY) {
    console.warn('[RevenueCat] API key not configured');
    return createDisabledStatus();
  }

  try {
    if (!isConfigured) {
      // Configure SDK with best practices
      Purchases.setLogLevel(LOG_LEVEL.DEBUG); // Use INFO or ERROR in production
      
      await Purchases.configure({
        apiKey: API_KEY,
        appUserID: appUserId, // Optional: Set specific user ID
      });

      // Set up customer info listener for real-time updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        const isPro = hasProEntitlement(info);
        const activeEntitlements = Object.keys(info.entitlements.active);
        
        console.log('[RevenueCat] Customer info updated:', {
          isPro,
          activeEntitlements,
          lookingFor: ENTITLEMENT_ID,
        });
      });

      isConfigured = true;
      console.log('[RevenueCat] SDK initialized successfully');
    }

    // Fetch latest customer info
    const customerInfo = await Purchases.getCustomerInfo();
    return toBillingStatus(customerInfo);
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
    return createDisabledStatus();
  }
}

/**
 * Check if SDK is properly configured
 */
export function isRevenueCatConfigured(): boolean {
  return isConfigured && !!API_KEY;
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Get current customer info and billing status
 */
export async function refreshBillingStatus(): Promise<BillingStatus> {
  if (!isRevenueCatConfigured()) {
    return createDisabledStatus();
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return toBillingStatus(customerInfo);
  } catch (error) {
    console.error('[RevenueCat] Failed to refresh billing status:', error);
    return createDisabledStatus();
  }
}

/**
 * Check if user has Pro entitlement
 */
export function hasProEntitlement(customerInfo: CustomerInfo): boolean {
  const hasEntitlement = ENTITLEMENT_ID in customerInfo.entitlements.active;
  const hasActiveSubscription = customerInfo.activeSubscriptions.length > 0;

  // Fallback for test-store / dashboard mapping delays: if any subscription is active,
  // treat user as Pro since this app currently has only Free and Pro tiers.
  return hasEntitlement || hasActiveSubscription;
}

/**
 * Get available offerings and packages
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!isRevenueCatConfigured()) {
    throw new Error('RevenueCat is not configured');
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('[RevenueCat] Failed to get offerings:', error);
    throw error;
  }
}

/**
 * Purchase a specific package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  if (!isRevenueCatConfigured()) {
    return {
      success: false,
      userCancelled: false,
      error: 'RevenueCat is not configured',
    };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    
    return {
      success: true,
      customerInfo,
      userCancelled: false,
    };
  } catch (error) {
    const purchasesError = error as PurchasesError;
    
    // Handle user cancellation gracefully
    if (purchasesError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return {
        success: false,
        userCancelled: true,
      };
    }
    
    console.error('[RevenueCat] Purchase error:', purchasesError);
    return {
      success: false,
      userCancelled: false,
      error: purchasesError.message || 'Purchase failed',
    };
  }
}

/**
 * Purchase Pro subscription (convenience method)
 */
export async function purchasePro(): Promise<BillingStatus | null> {
  if (!isRevenueCatConfigured()) {
    throw new Error('RevenueCat API key is not configured.');
  }

  try {
    const offering = await getOfferings();
    
    if (!offering || !offering.availablePackages.length) {
      throw new Error('No purchase packages found. Check your RevenueCat offering setup in the dashboard.');
    }

    // Find the monthly package
    let targetPackage = offering.availablePackages.find(
      (pkg) => pkg.product.identifier === MONTHLY_PRODUCT_ID
    );

    // Fallback: try monthly package type or first available
    if (!targetPackage) {
      targetPackage = offering.monthly || offering.availablePackages[0];
    }

    if (!targetPackage) {
      throw new Error(`Monthly package "${MONTHLY_PRODUCT_ID}" not found in offering.`);
    }

    console.log('[RevenueCat] Purchasing package:', {
      identifier: targetPackage.product.identifier,
      price: targetPackage.product.priceString,
    });

    const result = await purchasePackage(targetPackage);
    
    if (result.userCancelled) {
      return null; // User cancelled
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Purchase failed');
    }
    
    return toBillingStatus(result.customerInfo!);
  } catch (error) {
    console.error('[RevenueCat] Purchase Pro error:', error);
    throw error;
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<BillingStatus> {
  if (!isRevenueCatConfigured()) {
    throw new Error('RevenueCat is not configured.');
  }

  try {
    console.log('[RevenueCat] Restoring purchases...');
    const customerInfo = await Purchases.restorePurchases();
    const status = toBillingStatus(customerInfo);
    
    console.log('[RevenueCat] Restore complete:', {
      isPro: status.isPro,
      activeEntitlements: Object.keys(customerInfo.entitlements.active),
    });
    
    return status;
  } catch (error) {
    console.error('[RevenueCat] Restore error:', error);
    throw error;
  }
}

// ============================================================================
// User Management
// ============================================================================

/**
 * Login with a specific app user ID
 */
export async function loginUser(appUserId: string): Promise<BillingStatus> {
  if (!isRevenueCatConfigured()) {
    throw new Error('RevenueCat is not configured.');
  }

  try {
    const { customerInfo } = await Purchases.logIn(appUserId);
    return toBillingStatus(customerInfo);
  } catch (error) {
    console.error('[RevenueCat] Login error:', error);
    throw error;
  }
}

/**
 * Logout current user (anonymous)
 */
export async function logoutUser(): Promise<BillingStatus> {
  if (!isRevenueCatConfigured()) {
    throw new Error('RevenueCat is not configured.');
  }

  try {
    const customerInfo = await Purchases.logOut();
    return toBillingStatus(customerInfo);
  } catch (error) {
    console.error('[RevenueCat] Logout error:', error);
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert CustomerInfo to app-friendly BillingStatus
 */
function toBillingStatus(customerInfo: CustomerInfo): BillingStatus {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  const hasEntitlement = Boolean(entitlement);
  const hasActiveSubscription = customerInfo.activeSubscriptions.length > 0;
  const isPro = hasEntitlement || hasActiveSubscription;

  const fallbackProductIdentifier =
    customerInfo.activeSubscriptions[0] ??
    customerInfo.allPurchasedProductIdentifiers[0] ??
    null;

  const fallbackExpirationDate = customerInfo.latestExpirationDate ?? null;
  
  // Log detailed entitlement info for debugging
  console.log('[RevenueCat] Converting customer info to billing status:', {
    lookingForEntitlement: ENTITLEMENT_ID,
    activeEntitlements: Object.keys(customerInfo.entitlements.active),
    activeSubscriptions: customerInfo.activeSubscriptions,
    allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers,
    foundEntitlement: hasEntitlement,
    hasActiveSubscription,
    isPro,
    productIdentifier: entitlement?.productIdentifier,
    willRenew: entitlement?.willRenew,
    expirationDate: entitlement?.expirationDate,
  });
  
  return {
    enabled: true,
    isPro,
    renewsAtISO: entitlement?.expirationDate ?? fallbackExpirationDate,
    expiresAtISO: entitlement?.expirationDate ?? fallbackExpirationDate,
    willRenew: entitlement?.willRenew ?? isPro,
    productIdentifier: entitlement?.productIdentifier ?? fallbackProductIdentifier,
    customerInfo,
  };
}

/**
 * Create a disabled billing status for when SDK is not configured
 */
function createDisabledStatus(): BillingStatus {
  return {
    enabled: false,
    isPro: false,
    renewsAtISO: null,
    expiresAtISO: null,
    willRenew: false,
    productIdentifier: null,
  };
}

/**
 * Get user's active subscriptions (for debugging)
 */
export async function getActiveSubscriptions(): Promise<string[]> {
  if (!isRevenueCatConfigured()) {
    return [];
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active);
  } catch (error) {
    console.error('[RevenueCat] Failed to get active subscriptions:', error);
    return [];
  }
}
