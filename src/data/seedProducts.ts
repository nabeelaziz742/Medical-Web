// Seed products for SAAD Medical Store storefront
// Strictly commerce information without invented medical claims or certifications

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  categorySlug: string;
  packSize: string;
  price: number;
  comparePrice?: number;
  sku: string;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  requiresPrescription: boolean;
  image?: string;
}

export const POPULAR_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    name: "Panadol 500mg",
    slug: "panadol-500mg",
    brand: "GSK",
    category: "Medicines",
    categorySlug: "medicines",
    packSize: "200 Tablets (20x10)",
    price: 650,
    sku: "MED-PAN-500",
    stockStatus: "IN_STOCK",
    requiresPrescription: false,
  },
  {
    id: "prod-2",
    name: "Liv.52",
    slug: "liv-52-tablets",
    brand: "Himalaya",
    category: "Health & Wellness",
    categorySlug: "health-wellness",
    packSize: "100 Tablets",
    price: 420,
    comparePrice: 450,
    sku: "HW-LIV-100",
    stockStatus: "IN_STOCK",
    requiresPrescription: false,
  },
  {
    id: "prod-3",
    name: "Calcium-D",
    slug: "calcium-d",
    brand: "Searle",
    category: "Vitamins & Supplements",
    categorySlug: "vitamins-supplements",
    packSize: "30 Tablets",
    price: 380,
    sku: "VIT-CAL-030",
    stockStatus: "IN_STOCK",
    requiresPrescription: false,
  },
  {
    id: "prod-4",
    name: "Cebion Vitamin C 500mg",
    slug: "cebion-vitamin-c-500mg",
    brand: "Merck",
    category: "Vitamins & Supplements",
    categorySlug: "vitamins-supplements",
    packSize: "20 Effervescent Tablets",
    price: 290,
    comparePrice: 320,
    sku: "VIT-CEB-500",
    stockStatus: "IN_STOCK",
    requiresPrescription: false,
  },
  {
    id: "prod-5",
    name: "Accu-Chek Active Test Strips",
    slug: "accu-chek-active-test-strips",
    brand: "Roche",
    category: "Medical Devices",
    categorySlug: "medical-devices",
    packSize: "50 Strips Pack",
    price: 2450,
    sku: "DEV-ACC-050",
    stockStatus: "LOW_STOCK",
    requiresPrescription: false,
  },
  {
    id: "prod-6",
    name: "Ensure Vanilla",
    slug: "ensure-vanilla-400g",
    brand: "Abbott",
    category: "Health & Wellness",
    categorySlug: "health-wellness",
    packSize: "400g Tin",
    price: 1850,
    comparePrice: 1950,
    sku: "HW-ENS-400",
    stockStatus: "IN_STOCK",
    requiresPrescription: false,
  },
];
