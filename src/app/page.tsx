import React from "react";
import { HeroSection } from "@/components/storefront/HeroSection";
import { CategorySection } from "@/components/storefront/CategorySection";
import { PromoCards } from "@/components/storefront/PromoCards";
import { PopularProducts } from "@/components/storefront/PopularProducts";
import { TrustSection } from "@/components/storefront/TrustSection";
import { CtaSection } from "@/components/storefront/CtaSection";

export const metadata = {
  title: "SAAD Medical Store — We take care of your health | Lahore",
  description: "SAAD Medical Store on RajGarh Road, Lahore. Order genuine medicines, healthcare products, and upload doctor's prescriptions with home delivery across Lahore.",
};

export default function HomePage() {
  return (
    <div className="w-full">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Shop by Category */}
      <CategorySection />

      {/* 3. Promotional Feature Highlights */}
      <PromoCards />

      {/* 4. Popular Products */}
      <PopularProducts />

      {/* 5. Trust / Verified Store Features */}
      <TrustSection />

      {/* 6. Refined Final CTA */}
      <CtaSection />
    </div>
  );
}
