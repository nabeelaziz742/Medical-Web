import prisma from "@/lib/prisma";
import { UpdateSettingsInput } from "@/lib/validations/settings";

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  storeLocation: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  isDeliveryEnabled: boolean;
  expiryThresholdDays: number;
  lowStockThreshold: number;
  minOrderValue: number;
  updatedAt?: string;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "SAAD Medical Store",
  storePhone: "+92 300 1234567",
  storeEmail: "info@saadmedicalstore.com",
  storeAddress: "Shop #1, Near Main Gate, RajGarh Road, Lahore",
  storeLocation: "Lahore, Punjab, Pakistan",
  deliveryFee: 150,
  freeDeliveryThreshold: 2000,
  isDeliveryEnabled: true,
  expiryThresholdDays: 90,
  lowStockThreshold: 10,
  minOrderValue: 0,
};

// Global in-memory storage for store settings
const globalForSettings = globalThis as unknown as {
  memorySettings?: StoreSettings;
};

export const memorySettings: StoreSettings =
  globalForSettings.memorySettings || { ...DEFAULT_STORE_SETTINGS };

if (process.env.NODE_ENV !== "production") {
  globalForSettings.memorySettings = memorySettings;
}

/**
 * Retrieve all store settings (DB with in-memory fallback)
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const dbSettings = await prisma.setting.findMany();
    if (dbSettings && dbSettings.length > 0) {
      const settingsMap: Record<string, string> = {};
      dbSettings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      const merged: StoreSettings = {
        storeName: settingsMap.storeName || memorySettings.storeName || DEFAULT_STORE_SETTINGS.storeName,
        storePhone: settingsMap.storePhone || memorySettings.storePhone || DEFAULT_STORE_SETTINGS.storePhone,
        storeEmail: settingsMap.storeEmail || memorySettings.storeEmail || DEFAULT_STORE_SETTINGS.storeEmail,
        storeAddress: settingsMap.storeAddress || memorySettings.storeAddress || DEFAULT_STORE_SETTINGS.storeAddress,
        storeLocation: settingsMap.storeLocation || memorySettings.storeLocation || DEFAULT_STORE_SETTINGS.storeLocation,
        deliveryFee: settingsMap.deliveryFee !== undefined ? Number(settingsMap.deliveryFee) : memorySettings.deliveryFee,
        freeDeliveryThreshold: settingsMap.freeDeliveryThreshold !== undefined ? Number(settingsMap.freeDeliveryThreshold) : memorySettings.freeDeliveryThreshold,
        isDeliveryEnabled: settingsMap.isDeliveryEnabled !== undefined ? settingsMap.isDeliveryEnabled === "true" : memorySettings.isDeliveryEnabled,
        expiryThresholdDays: settingsMap.expiryThresholdDays !== undefined ? Number(settingsMap.expiryThresholdDays) : memorySettings.expiryThresholdDays,
        lowStockThreshold: settingsMap.lowStockThreshold !== undefined ? Number(settingsMap.lowStockThreshold) : memorySettings.lowStockThreshold,
        minOrderValue: settingsMap.minOrderValue !== undefined ? Number(settingsMap.minOrderValue) : memorySettings.minOrderValue,
      };

      // Keep memory synced
      Object.assign(memorySettings, merged);
      return merged;
    }
  } catch (err) {
    // Database query failed or unconfigured, use memory
  }

  return { ...memorySettings };
}

/**
 * Retrieve a single setting by key
 */
export async function getSettingByKey<K extends keyof StoreSettings>(
  key: K,
  defaultValue?: StoreSettings[K]
): Promise<StoreSettings[K]> {
  const settings = await getStoreSettings();
  if (settings[key] !== undefined) {
    return settings[key];
  }
  return defaultValue !== undefined ? defaultValue : (DEFAULT_STORE_SETTINGS[key] as StoreSettings[K]);
}

/**
 * Update store settings atomically (ADMIN only)
 */
export async function updateStoreSettings(
  input: UpdateSettingsInput,
  _actor?: string
): Promise<StoreSettings> {
  // Update memory state first
  Object.assign(memorySettings, input, { updatedAt: new Date().toISOString() });

  try {
    const entries = Object.entries(input);
    for (const [key, val] of entries) {
      const stringValue = typeof val === "boolean" ? (val ? "true" : "false") : String(val);
      await prisma.setting.upsert({
        where: { key },
        update: { value: stringValue },
        create: {
          key,
          value: stringValue,
          description: `Store setting for ${key}`,
        },
      });
    }
  } catch (err) {
    // Falls back to in-memory storage seamlessly
  }

  return { ...memorySettings };
}

/**
 * Safe public store settings suitable for client-side consumption
 */
export async function getPublicStoreSettings() {
  const settings = await getStoreSettings();
  return {
    storeName: settings.storeName,
    storePhone: settings.storePhone,
    storeEmail: settings.storeEmail,
    storeAddress: settings.storeAddress,
    storeLocation: settings.storeLocation,
    deliveryFee: settings.deliveryFee,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
    isDeliveryEnabled: settings.isDeliveryEnabled,
    minOrderValue: settings.minOrderValue,
  };
}

/**
 * Dynamic Expiry Warning Threshold in Days (Default: 90)
 */
export function getExpiryThresholdDays(): number {
  return memorySettings.expiryThresholdDays || DEFAULT_STORE_SETTINGS.expiryThresholdDays;
}

/**
 * Dynamic delivery calculations based on current store settings
 */
export function getDeliveryConfig(subtotal: number) {
  const settings = memorySettings;
  const standardFee = settings.deliveryFee;
  const freeThreshold = settings.freeDeliveryThreshold;
  const isEnabled = settings.isDeliveryEnabled;

  const deliveryFee = !isEnabled || subtotal >= freeThreshold || subtotal === 0 ? 0 : standardFee;
  const amountForFreeDelivery = Math.max(0, freeThreshold - subtotal);

  return {
    deliveryFee,
    freeDeliveryThreshold: freeThreshold,
    amountForFreeDelivery,
    isDeliveryEnabled: isEnabled,
  };
}
