// SAAD Medical Store — Verified Store Information & Global Navigation Data

export const STORE_INFO = {
  name: "SAAD Medical Store",
  tagline: "We take care of your health",
  address: "RajGarh Road, Lahore",
  city: "Lahore",
  service: "Home Delivery Available",
  contacts: [
    { name: "Sharjeel", phone: "03364085027", formatted: "0336 4085027" },
    { name: "Sameer", phone: "03099634214", formatted: "0309 9634214" },
  ],
  timing: "Mon - Sat: 9:00 AM - 11:00 PM | Sun: 12:00 PM - 10:00 PM",
} as const;

export const CATEGORIES_NAV = [
  { name: "Medicines", slug: "medicines", href: "/category/medicines" },
  { name: "Vitamins & Supplements", slug: "vitamins-supplements", href: "/category/vitamins-supplements" },
  { name: "Personal Care", slug: "personal-care", href: "/category/personal-care" },
  { name: "Baby Care", slug: "baby-care", href: "/category/baby-care" },
  { name: "Skin Care", slug: "skin-care", href: "/category/skin-care" },
  { name: "Hair Care", slug: "hair-care", href: "/category/hair-care" },
  { name: "Oral Care", slug: "oral-care", href: "/category/oral-care" },
  { name: "Medical Devices", slug: "medical-devices", href: "/category/medical-devices" },
  { name: "First Aid", slug: "first-aid", href: "/category/first-aid" },
  { name: "Health & Wellness", slug: "health-wellness", href: "/category/health-wellness" },
] as const;

export const PROMOTIONAL_HIGHLIGHTS = [
  {
    id: "delivery",
    title: "Fast & Reliable\nHome Delivery",
    subtitle: "Across Lahore",
    cta: "Order Now",
    href: "/category/medicines",
  },
  {
    id: "prescription",
    title: "Upload Your\nPrescription",
    subtitle: "Get your prescribed medicines with ease and privacy.",
    cta: "Upload Now",
    href: "/prescription",
  },
  {
    id: "offers",
    title: "Special Offers",
    subtitle: "Selected healthcare products",
    cta: "View Offers",
    href: "/offers",
  },
] as const;
