import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileNav";
import { STORE_INFO } from "@/lib/constants";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import "./globals.css";
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${STORE_INFO.name}`,
    default: `${STORE_INFO.name} — ${STORE_INFO.tagline} | Lahore`,
  },
  description: `${STORE_INFO.name} on ${STORE_INFO.address}. Genuine medicines, vitamins, and healthcare products with home delivery across Lahore. Contacts: Sharjeel (${STORE_INFO.contacts[0].formatted}), Sameer (${STORE_INFO.contacts[1].formatted}).`,
  keywords: [
    "SAAD Medical Store",
    "Pharmacy Lahore",
    "Medicines Lahore",
    "RajGarh Road Pharmacy",
    "Online Medicine Delivery Lahore",
    "Healthcare Lahore",
  ],
  authors: [{ name: STORE_INFO.name }],
  openGraph: {
    title: `${STORE_INFO.name} — ${STORE_INFO.tagline}`,
    description: `${STORE_INFO.name} on ${STORE_INFO.address}. Home delivery available across Lahore.`,
    type: "website",
    locale: "en_PK",
    siteName: STORE_INFO.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    "name": STORE_INFO.name,
    "description": STORE_INFO.tagline,
    "url": "https://saadmedicalstore.com",
    "telephone": STORE_INFO.contacts[0].phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": STORE_INFO.address,
      "addressLocality": "Lahore",
      "addressRegion": "Punjab",
      "addressCountry": "PK",
    },
    "openingHours": "Mo-Su 09:00-23:00",
    "priceRange": "PKR",
    "currenciesAccepted": "PKR",
    "paymentAccepted": "Cash, Bank Transfer, EasyPaisa, JazzCash",
  };

  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
        <CartProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
