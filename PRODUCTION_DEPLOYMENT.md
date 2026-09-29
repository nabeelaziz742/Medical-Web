# SAAD MEDICAL STORE — PRODUCTION DEPLOYMENT RUNBOOK

**Target Application:** SAAD Medical Store  
**Location:** RajGarh Road, Lahore, Pakistan  
**Technology Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma ORM, PostgreSQL.

---

## 1. Production Architecture Overview

```
                        [ Cloudflare / Custom Domain ]
                                      │
                                      ▼
                           [ Vercel Edge Network ]
                       (SSL, HTTPS, Security Headers)
                                      │
             ┌────────────────────────┴────────────────────────┐
             ▼                                                 ▼
   [ Next.js Serverless / SSR ]                    [ Static Assets & CDN ]
   - Public Storefront                             - Images & Fonts
   - Dynamic Sitemap & Robots                      - Pre-rendered Pages
   - Authentication (HMAC-SHA256 JWT)
   - Order Checkout & FEFO Inventory
   - Single Admin Operations Portal
             │
             ├─────────────────────────────────────────────────┐
             ▼                                                 ▼
[ Managed PostgreSQL Database ]               [ Object Storage: S3 / Cloudflare R2 ]
(Neon / Supabase / AWS RDS / Self-hosted)     - Secure Private Prescriptions (Encrypted)
- Orders, Inventory, Batches, Coupons         - Streaming with Owner / Admin Auth
- Strict Indexes & FK Constraints
```

---

## 2. Required Production Environment Variables

Configure these environment variables in your deployment platform (e.g., Vercel Project Settings → Environment Variables):

| Variable Name | Required | Description | Example / Recommended Value |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (with connection pooler if serverless) | `postgresql://user:pass@ep-cool-db.us-east-2.aws.neon.tech/saad_medical?sslmode=require` |
| `AUTH_SECRET` | **Yes** | 32+ character random secret for JWT session signing | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Canonical production site URL | `https://saadmedicalstore.com` |
| `NEXT_PUBLIC_APP_NAME` | **Yes** | Public store name | `SAAD Medical Store` |
| `NEXT_PUBLIC_APP_TAGLINE` | **Yes** | Store tagline | `We take care of your health` |
| `NEXT_PUBLIC_STORE_LOCATION` | **Yes** | Physical pharmacy address in Lahore | `RajGarh Road, Lahore` |
| `NEXT_PUBLIC_PHONE_SHARJEEL` | **Yes** | Primary store helpline contact | `03364085027` |
| `NEXT_PUBLIC_PHONE_SAMEER` | **Yes** | Secondary store helpline contact | `03099634214` |
| `S3_ENDPOINT` | Optional | S3 / R2 API endpoint for prescription file storage | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_BUCKET` | Optional | Private bucket name for prescriptions | `saad-prescriptions-prod` |
| `S3_ACCESS_KEY_ID` | Optional | Object storage Access Key ID | `••••••••••••••••` |
| `S3_SECRET_ACCESS_KEY` | Optional | Object storage Secret Access Key | `••••••••••••••••` |
| `S3_REGION` | Optional | Object storage region | `auto` / `us-east-1` |

> [!CAUTION]
> Never commit real secrets to source control. Ensure `.env` is listed in `.gitignore`.

---

## 3. Database Setup & Migration Strategy

### Step 1: Provision Managed PostgreSQL
Recommended providers:
- **Neon Serverless PostgreSQL** (Recommended for Vercel)
- **Supabase PostgreSQL**
- **AWS RDS / DigitalOcean Managed Databases**

Ensure connection pooling (e.g. PgBouncer / Neon connection string with `?pgbouncer=true` or pooled endpoint) is enabled for serverless scaling.

### Step 2: Run Production Migrations
Run the safe Prisma deploy command:
```bash
npx prisma migrate deploy
```
Or generate and apply schema directly if initializing fresh:
```bash
npx prisma db push
```

### Step 3: Seed Initial Admin & Catalog
To seed the single store admin and the baseline Lahore pharmacy catalog:
```bash
node scripts/seed-production.mjs
```
*(Only run once during initial database provisioning).*

---

## 4. Prescription Storage & Security Architecture

1. **Private Storage Isolation**:
   - Prescriptions are strictly stored outside the public directory (`private_storage/prescriptions` or private S3/R2 bucket).
   - Direct anonymous access is completely disabled.

2. **Access Control (IDOR Protection)**:
   - Prescriptions can only be streamed via `/api/prescriptions/[id]/file`.
   - Access is restricted exclusively to the uploading customer session or the verified `ADMIN`.
   - Guest prescription documents can only be accessed by the verified `ADMIN`.

3. **Safe File Streaming**:
   - Files are served with `X-Content-Type-Options: nosniff` and `Cache-Control: private, no-cache, no-store, must-revalidate`.
   - Filenames are sanitized and path traversal is prevented using basename isolation.

---

## 5. Vercel Deployment Instructions

### Method A: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Method B: Deploy via GitHub / GitLab Integration
1. Push repository to your private Git repository.
2. Link the repository in the Vercel Dashboard.
3. Configure Build and Output Settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Add all production environment variables listed in Section 2.
5. Click **Deploy**.

---

## 6. Security Headers & Next.js Production Config

The application automatically injects the following security headers configured in `next.config.ts`:

- `X-Frame-Options: SAMEORIGIN` — Clickjacking protection.
- `X-Content-Type-Options: nosniff` — MIME-sniffing prevention.
- `Referrer-Policy: strict-origin-when-cross-origin` — Safe referrer handling.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — Hardware isolation.
- `X-DNS-Prefetch-Control: on` — Performance optimization.

---

## 7. SEO & Robots Configuration

- **Dynamic Sitemap**: Automatically generated at `/sitemap.xml` listing all products, categories, offers, and static pages.
- **Robots Directives**: Configured at `/robots.txt` allowing search engines to index public storefront while blocking `/admin/*`, `/account/*`, `/checkout/*`, and `/api/*`.
- **Structured Data**: Schema.org `Pharmacy` JSON-LD is embedded in the root layout, and `Product` + `BreadcrumbList` schema is dynamically rendered on product pages.

---

## 8. Post-Deployment Verification Checklist

Once deployed to production, run the verification checklist:

- [ ] **Homepage**: Verify hero, categories, and featured products load cleanly.
- [ ] **Search & Catalog**: Search for "Panadol", "Augmentin", or "Omeprazole" and apply category/brand filters.
- [ ] **Customer Authentication**: Register a test customer account, log out, and log back in.
- [ ] **Shopping Cart & Checkout**:
  - Add items to cart.
  - Apply a valid promotional coupon code.
  - Verify server-side total, subtotal, discount, and delivery fee calculation.
  - Complete Cash-on-Delivery checkout.
- [ ] **Order Tracking**: Check order confirmation page and customer order history under `/account/orders`.
- [ ] **Prescription Upload**:
  - Upload a test prescription (JPG/PDF).
  - Confirm file is private and accessible only by the owner customer and admin.
- [ ] **Admin Operations Portal**:
  - Sign in at `/admin/login` using store admin credentials.
  - Check inventory ledger, batch tracking, and FEFO expiry indicators.
  - Review prescription queue and update status.
  - Review orders and update fulfillment status.
- [ ] **SEO & Metadata**:
  - Inspect `https://<domain>/sitemap.xml` and `https://<domain>/robots.txt`.
  - Validate Open Graph tags on product pages.

---

## 9. Rollback Strategy

In the unlikely event of an issue:

1. **Instant Rollback on Vercel**:
   - Go to **Vercel Dashboard → Project → Deployments**.
   - Select the previous stable deployment and click **Redeploy / Rollback to this deployment**.
2. **Database Schema Rollbacks**:
   - Prisma migrations are non-destructive. If a migration needs reversal, execute targeted down-migration SQL via your PostgreSQL management interface.
