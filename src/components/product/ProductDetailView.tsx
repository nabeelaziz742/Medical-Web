"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Heart, 
  ShoppingBag, 
  FileText, 
  Truck, 
  MapPin, 
  Phone, 
  Check, 
  Minus, 
  Plus, 
  ShieldCheck, 
  Pill, 
  AlertCircle, 
  ChevronRight,
  Stethoscope,
  Sparkles,
  Activity
} from "lucide-react";
import { ProductDetail } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { STORE_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/storefront/ProductCard";

import { useCart } from "@/context/CartContext";

interface ProductDetailViewProps {
  product: ProductDetail;
  relatedProducts: ProductDetail[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem, openDrawer } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "usage" | "warnings" | "storage">("details");

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleAddToCart = async () => {
    if (isAdding || product.stockStatus === "OUT_OF_STOCK") return;
    setIsAdding(true);
    const success = await addItem(product.id, quantity);
    setIsAdding(false);
    if (success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const handleBuyNow = async () => {
    if (isAdding || product.stockStatus === "OUT_OF_STOCK") return;
    setIsAdding(true);
    await addItem(product.id, quantity);
    setIsAdding(false);
    router.push("/checkout");
  };

  const stockBadgeMap = {
    IN_STOCK: { label: "In Stock (Available at RajGarh Road Store)", variant: "success" as const },
    LOW_STOCK: { label: "Low Stock (Few Units Left)", variant: "warning" as const },
    OUT_OF_STOCK: { label: "Out of Stock", variant: "danger" as const },
  };

  const stockInfo = stockBadgeMap[product.stockStatus];

  const getProductIcon = () => {
    if (product.categorySlug === "medical-devices") return <Stethoscope className="h-16 w-16 text-blue-700" />;
    if (product.categorySlug === "vitamins-supplements") return <Sparkles className="h-16 w-16 text-amber-600" />;
    if (product.categorySlug === "health-wellness") return <Activity className="h-16 w-16 text-emerald-600" />;
    return <Pill className="h-16 w-16 text-blue-700" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
        <Link href="/" className="hover:text-blue-700">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-blue-700">Products</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/products?category=${product.categorySlug}`} className="hover:text-blue-700">
          {product.category}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-slate-900 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Image Presentation */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/90 shadow-subtle p-8 flex items-center justify-center overflow-hidden">
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              <Badge variant={stockInfo.variant} size="sm">
                {product.stockStatus === "IN_STOCK" ? "In Stock" : stockInfo.label}
              </Badge>
              {product.requiresPrescription && (
                <Badge variant="danger" size="sm">
                  Prescription Required (Rx)
                </Badge>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`absolute top-4 right-4 p-2 rounded-full bg-white border border-slate-200 shadow-xs transition-colors cursor-pointer ${
                isWishlisted
                  ? "text-red-500 bg-red-50 border-red-200"
                  : "text-slate-400 hover:text-red-500 hover:bg-slate-50"
              }`}
              title="Add to Wishlist"
              aria-label="Toggle Wishlist"
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current text-red-500" : ""}`} />
            </button>

            {/* Central Product Monogram / Glyph */}
            <div className="w-32 h-32 rounded-3xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center">
              {getProductIcon()}
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                SKU: {product.sku}
              </span>
            </div>
          </div>

          {/* Delivery & Pharmacy Notice Card */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-semibold text-blue-900">
              <Truck className="h-4 w-4 text-blue-700 shrink-0" />
              <span>{STORE_INFO.service} Across Lahore</span>
            </div>
            <p className="text-[11px] text-slate-600 pl-6">
              Dispatched directly from our physical store on {STORE_INFO.address}.
            </p>
          </div>
        </div>

        {/* Right Column: Commerce Details & Actions */}
        <div className="lg:col-span-7 space-y-6">
          
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                href={`/products?brand=${product.brandSlug}`}
                className="text-xs font-semibold uppercase tracking-wider text-blue-700 hover:underline"
              >
                {product.brand}
              </Link>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-normal">{product.category}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {product.genericName && (
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                Generic: {product.genericName}
              </p>
            )}

            <div className="mt-2.5 inline-block px-2.5 py-1 rounded bg-slate-100 text-xs font-normal text-slate-700">
              Pack Size: <span className="font-semibold">{product.packSize}</span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-base text-slate-400 line-through font-normal">
                {formatPrice(product.comparePrice)}
              </span>
            )}
            {product.comparePrice && (
              <Badge variant="danger" size="sm">
                Save {formatPrice(product.comparePrice - product.price)}
              </Badge>
            )}
          </div>

          {/* Prescription Notice */}
          {product.requiresPrescription && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Doctor&apos;s Prescription Required for this item</p>
                <p className="mt-0.5 text-amber-800 font-normal">
                  Please have your prescription ready. You can upload it during checkout or via our prescription portal.
                </p>
                <Link href="/prescription" className="inline-block font-semibold text-amber-900 underline mt-1.5">
                  Upload Doctor&apos;s Prescription Now →
                </Link>
              </div>
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="p-2 hover:bg-slate-50 text-slate-600 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-12 text-center text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="p-2 hover:bg-slate-50 text-slate-600 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stockStatus === "OUT_OF_STOCK"}
                className={`flex-1 min-w-[180px] gap-2 font-semibold shadow-md ${
                  isAdded ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white" : ""
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Added to Cart ({quantity})</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={handleBuyNow}
                disabled={product.stockStatus === "OUT_OF_STOCK"}
                className="flex-1 min-w-[140px] font-semibold"
              >
                Buy Now
              </Button>
            </div>
          </div>

          {/* Quick Verified Support Strip */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-700 shrink-0" />
              <span>{STORE_INFO.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-blue-700 shrink-0" />
              <span>Sharjeel: {STORE_INFO.contacts[0].formatted}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Structured Details Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
        
        {/* Tab Header Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "details"
                ? "bg-blue-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Product Overview & Composition
          </button>
          <button
            onClick={() => setActiveTab("usage")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "usage"
                ? "bg-blue-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Usage & Directions
          </button>
          <button
            onClick={() => setActiveTab("warnings")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "warnings"
                ? "bg-blue-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Warnings & Precautions
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "storage"
                ? "bg-blue-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Storage & Manufacturer
          </button>
        </div>

        {/* Tab Content */}
        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4 pt-2">
          {activeTab === "details" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold font-display text-slate-900 text-sm mb-1.5">Description</h3>
                <p className="text-slate-600 font-normal">{product.description}</p>
              </div>
              {product.composition && (
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="font-semibold font-display text-slate-900 text-sm mb-1.5">Active Ingredients / Composition</h3>
                  <p className="text-slate-600 font-normal">{product.composition}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "usage" && (
            <div>
              <h3 className="font-semibold font-display text-slate-900 text-sm mb-1.5">Usage & Instructions</h3>
              <p className="text-slate-600 font-normal">{product.usageInfo || "Follow the directions provided on the packaging or as prescribed by your healthcare physician."}</p>
            </div>
          )}

          {activeTab === "warnings" && (
            <div>
              <h3 className="font-semibold font-display text-slate-900 text-sm mb-1.5">Precautions & Warnings</h3>
              <p className="text-slate-600 font-normal">{product.warnings || "Consult a registered doctor or qualified pharmacist before use if you are pregnant, nursing, or taking ongoing prescription medication."}</p>
            </div>
          )}

          {activeTab === "storage" && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold font-display text-slate-900 text-sm mb-1.5">Storage Instructions</h3>
                <p className="text-slate-600 font-normal">{product.storageInfo || "Store in a cool, dry place below 30°C. Protect from moisture and direct sunlight."}</p>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <h3 className="font-semibold font-display text-slate-900 text-sm mb-1.5">Manufacturer</h3>
                <p className="text-slate-600 font-normal">{product.manufacturer}</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Recommendations</span>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-0.5">
                Related Healthcare Products
              </h2>
            </div>
            <Link
              href={`/products?category=${product.categorySlug}`}
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              View More in {product.category}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {relatedProducts.map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
