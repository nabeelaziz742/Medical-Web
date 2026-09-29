import { CATALOG_PRODUCTS, BRANDS, ProductDetail } from "@/data/products";
import { CATEGORIES_NAV } from "@/lib/constants";

export interface FilterOptions {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  prescriptionOnly?: boolean;
  sort?: "price-asc" | "price-desc" | "name-asc" | "name-desc" | "featured";
}

export function getProducts(options?: FilterOptions): ProductDetail[] {
  let filtered = [...CATALOG_PRODUCTS];

  if (!options) return filtered;

  // Search filter
  if (options.search && options.search.trim()) {
    const q = options.search.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.genericName?.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  // Category filter
  if (options.category && options.category !== "all") {
    filtered = filtered.filter(
      (p) => p.categorySlug.toLowerCase() === options.category?.toLowerCase()
    );
  }

  // Brand filter
  if (options.brand && options.brand !== "all") {
    filtered = filtered.filter(
      (p) => p.brandSlug.toLowerCase() === options.brand?.toLowerCase() || p.brand.toLowerCase() === options.brand?.toLowerCase()
    );
  }

  // Price range
  if (typeof options.minPrice === "number" && !isNaN(options.minPrice)) {
    filtered = filtered.filter((p) => p.price >= options.minPrice!);
  }
  if (typeof options.maxPrice === "number" && !isNaN(options.maxPrice)) {
    filtered = filtered.filter((p) => p.price <= options.maxPrice!);
  }

  // Stock status filter
  if (options.inStockOnly) {
    filtered = filtered.filter((p) => p.stockStatus === "IN_STOCK" || p.stockStatus === "LOW_STOCK");
  }

  // Prescription requirement filter
  if (options.prescriptionOnly !== undefined) {
    filtered = filtered.filter((p) => p.requiresPrescription === options.prescriptionOnly);
  }

  // Sorting
  switch (options.sort) {
    case "price-asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "featured":
    default:
      filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
      break;
  }

  return filtered;
}

export function getProductBySlug(slug: string): ProductDetail | undefined {
  return CATALOG_PRODUCTS.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
}

export function getRelatedProducts(product: ProductDetail, limit = 4): ProductDetail[] {
  return CATALOG_PRODUCTS.filter(
    (p) => p.id !== product.id && (p.categorySlug === product.categorySlug || p.brand === product.brand)
  ).slice(0, limit);
}

export function getCategoriesWithCounts() {
  return CATEGORIES_NAV.map((cat) => ({
    ...cat,
    count: CATALOG_PRODUCTS.filter((p) => p.categorySlug === cat.slug).length,
  }));
}

export function getBrandsList() {
  return BRANDS;
}

export function searchCatalogAutocomplete(query: string) {
  if (!query || query.trim().length < 2) {
    return { products: [], categories: [], brands: [] };
  }

  const q = query.toLowerCase().trim();

  const matchingProducts = CATALOG_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.genericName?.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
  ).slice(0, 5);

  const matchingCategories = CATEGORIES_NAV.filter((c) =>
    c.name.toLowerCase().includes(q)
  ).slice(0, 3);

  const matchingBrands = BRANDS.filter((b) =>
    b.name.toLowerCase().includes(q)
  ).slice(0, 3);

  return {
    products: matchingProducts,
    categories: matchingCategories,
    brands: matchingBrands,
  };
}
