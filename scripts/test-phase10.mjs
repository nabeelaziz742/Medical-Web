// SAAD Medical Store — Phase 10 Production QA & Security Verification Suite

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

function extractCookies(response) {
  if (typeof response.headers.getSetCookie === "function") {
    const setCookies = response.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
      return setCookies.map((c) => c.split(";")[0]).join("; ");
    }
  }
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return "";
  return setCookie.split(",").map((c) => c.split(";")[0]).join("; ");
}

async function runTests() {
  console.log("==================================================================");
  console.log("🏥 SAAD MEDICAL STORE — PHASE 10 PRODUCTION AUDIT & QA SUITE");
  console.log(`Target URL: ${BASE_URL}`);
  console.log("==================================================================\n");

  const timestamp = Date.now().toString().slice(-6);
  let adminCookie = "";
  let customerACookie = "";
  let customerBCookie = "";
  let customerAId = "";
  let customerBId = "";

  // -------------------------------------------------------------------------
  // SECTION 1: AUTHENTICATION & ROLE ISOLATION
  // -------------------------------------------------------------------------
  console.log("1. AUTHENTICATION & ROLE ISOLATION");

  // Admin Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailOrPhone: "admin@saadmedicalstore.com",
        password: "admin123",
        rememberMe: true,
      }),
    });
    const data = await res.json();
    adminCookie = extractCookies(res);
    assert(res.status === 200 && data.user?.role === "ADMIN", "Admin authentication succeeds with ADMIN role");
  } catch (err) {
    assert(false, `Admin login error: ${err.message}`);
  }

  // Customer A Registration & Login
  const userAEmail = `customerA_${timestamp}@test.com`;
  const userAPhone = `0300${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testPassword = "Password123!";
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer A",
        email: userAEmail,
        phone: userAPhone,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });
    const regData = await regRes.json();
    customerACookie = extractCookies(regRes);
    customerAId = regData.user?.id;
    assert((regRes.status === 201 || regRes.status === 200) && regData.user?.role === "CUSTOMER", "Customer A registers and authenticates with CUSTOMER role");
  } catch (err) {
    assert(false, `Customer A setup failed: ${err.message}`);
  }

  // Customer B Registration & Login
  const userBEmail = `customerB_${timestamp}@test.com`;
  const userBPhone = `0300${Math.floor(1000000 + Math.random() * 9000000)}`;
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer B",
        email: userBEmail,
        phone: userBPhone,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });
    const regData = await regRes.json();
    customerBCookie = extractCookies(regRes);
    customerBId = regData.user?.id;
    assert((regRes.status === 201 || regRes.status === 200) && regData.user?.role === "CUSTOMER", "Customer B registers and authenticates with CUSTOMER role");
  } catch (err) {
    assert(false, `Customer B setup failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 2: ADMIN SECURITY & PRIVILEGE ENFORCEMENT
  // -------------------------------------------------------------------------
  console.log("\n2. ADMIN SECURITY & PRIVILEGE ENFORCEMENT");

  // Anonymous request to admin metrics -> 401
  const anonMetricsRes = await fetch(`${BASE_URL}/api/admin/metrics`);
  assert(anonMetricsRes.status === 401, "Anonymous access to /api/admin/metrics returns 401 Unauthorized");

  // Anonymous request to admin orders -> 401
  const anonOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`);
  assert(anonOrdersRes.status === 401, "Anonymous access to /api/admin/orders returns 401 Unauthorized");

  // Anonymous request to admin inventory -> 401
  const anonInvRes = await fetch(`${BASE_URL}/api/admin/inventory`);
  assert(anonInvRes.status === 401, "Anonymous access to /api/admin/inventory returns 401 Unauthorized");

  // Customer session requesting admin metrics -> 403
  const custMetricsRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: { Cookie: customerACookie },
  });
  assert(custMetricsRes.status === 403, "Customer session accessing /api/admin/metrics returns 403 Forbidden");

  // Customer session requesting admin orders -> 403
  const custOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`, {
    headers: { Cookie: customerACookie },
  });
  assert(custOrdersRes.status === 403, "Customer session accessing /api/admin/orders returns 403 Forbidden");

  // Customer session requesting admin coupons -> 403
  const custCouponsRes = await fetch(`${BASE_URL}/api/admin/coupons`, {
    headers: { Cookie: customerACookie },
  });
  assert(custCouponsRes.status === 403, "Customer session accessing /api/admin/coupons returns 403 Forbidden");

  // Customer session requesting admin settings -> 403
  const custSettingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    headers: { Cookie: customerACookie },
  });
  assert(custSettingsRes.status === 403, "Customer session accessing /api/admin/settings returns 403 Forbidden");

  // Admin session accessing admin metrics -> 200
  const adminMetricsRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminMetricsRes.status === 200, "Admin session successfully accesses /api/admin/metrics");

  // -------------------------------------------------------------------------
  // SECTION 3: PRESCRIPTION SECURITY & IDOR PROTECTION
  // -------------------------------------------------------------------------
  console.log("\n3. PRESCRIPTION SECURITY & IDOR PROTECTION");

  // Customer A uploads prescription using multipart/form-data
  let rxId = "";
  try {
    const rxFormData = new FormData();
    rxFormData.append("file", new Blob(["Simulated prescription scan for Panadol"], { type: "image/jpeg" }), "rx_test.jpg");
    rxFormData.append("deliveryAddress", "House 12, RajGarh Road, Lahore");
    rxFormData.append("notes", "Prescription for Panadol 500mg and vitamins");

    const rxRes = await fetch(`${BASE_URL}/api/prescriptions`, {
      method: "POST",
      headers: {
        Cookie: customerACookie,
      },
      body: rxFormData,
    });
    const rxData = await rxRes.json();
    rxId = rxData.prescription?.id;
    assert((rxRes.status === 201 || rxRes.status === 200) && rxId, "Customer A submits prescription successfully");
  } catch (err) {
    assert(false, `Prescription upload failed: ${err.message}`);
  }

  // Anonymous access to prescription file -> 401
  const anonRxFileRes = await fetch(`${BASE_URL}/api/prescriptions/${rxId}/file`);
  assert(anonRxFileRes.status === 401, "Anonymous request for private prescription file returns 401 Unauthorized");

  // Customer B (attacker) attempts to view Customer A's prescription -> 403 Forbidden
  const idorRxRes = await fetch(`${BASE_URL}/api/prescriptions/${rxId}`, {
    headers: { Cookie: customerBCookie },
  });
  assert(idorRxRes.status === 403, "Customer B cannot view Customer A's prescription details (IDOR blocked - 403)");

  // Customer B attempts to download Customer A's prescription file -> 403 Forbidden
  const idorRxFileRes = await fetch(`${BASE_URL}/api/prescriptions/${rxId}/file`, {
    headers: { Cookie: customerBCookie },
  });
  assert(idorRxFileRes.status === 403, "Customer B cannot download Customer A's prescription file (IDOR blocked - 403)");

  // Customer A attempts to illegally transition prescription review status via PATCH -> 403 Forbidden
  const custStatusRes = await fetch(`${BASE_URL}/api/prescriptions/${rxId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerACookie,
    },
    body: JSON.stringify({
      status: "APPROVED",
      adminNotes: "Self-approved maliciously",
    }),
  });
  assert(custStatusRes.status === 403, "Customer cannot self-approve or change prescription status (403 Forbidden)");

  // Admin marks prescription as UNDER_REVIEW -> 200 OK
  const adminReviewRes = await fetch(`${BASE_URL}/api/admin/prescriptions/${rxId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      status: "UNDER_REVIEW",
      adminNotes: "Prescription document under review by store pharmacist",
    }),
  });
  assert(adminReviewRes.status === 200, "Store Admin can transition prescription to UNDER_REVIEW");

  // Admin officially APPROVES prescription -> 200 OK
  const adminApproveRes = await fetch(`${BASE_URL}/api/admin/prescriptions/${rxId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      status: "APPROVED",
      adminNotes: "Verified and approved by store pharmacist",
    }),
  });
  assert(adminApproveRes.status === 200, "Store Admin can officially approve verified prescription");

  // -------------------------------------------------------------------------
  // SECTION 4: COMMERCE, COUPON & ORDER INTEGRITY
  // -------------------------------------------------------------------------
  console.log("\n4. COMMERCE, COUPON & ORDER INTEGRITY");

  // Create a promotional test coupon
  const promoCode = `PROMO_${timestamp}`;
  await fetch(`${BASE_URL}/api/admin/coupons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      code: promoCode,
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 100,
      maxDiscount: 500,
      validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: 100,
      perCustomerLimit: 2,
    }),
  });

  // Coupon validation
  const validCouponRes = await fetch(`${BASE_URL}/api/coupons/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerACookie,
    },
    body: JSON.stringify({
      code: promoCode,
      subtotal: 1000,
    }),
  });
  const couponData = await validCouponRes.json();
  assert(validCouponRes.status === 200 && couponData.isValid === true && couponData.discountAmount === 100, "Promotional coupon calculates discount correctly");

  // Invalid coupon test
  const invalidCouponRes = await fetch(`${BASE_URL}/api/coupons/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerACookie,
    },
    body: JSON.stringify({
      code: "NONEXISTENT_COUPON_CODE",
      subtotal: 1000,
    }),
  });
  assert(invalidCouponRes.status === 400, "Invalid coupon code is rejected with 400 Bad Request");

  // Customer A adds item to cart
  const invRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
    headers: { Cookie: adminCookie },
  });
  const invData = await invRes.json();
  const testProduct = invData.products?.find((p) => p.availableStock > 5) || invData.products?.[0] || { id: "prod-panadol-500" };

  await fetch(`${BASE_URL}/api/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerACookie,
    },
    body: JSON.stringify({
      productId: testProduct.id,
      quantity: 2,
    }),
  });

  // Customer A creates an order
  let orderAId = "";
  try {
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerACookie,
      },
      body: JSON.stringify({
        customerName: "Test Customer A",
        customerPhone: userAPhone,
        customerEmail: userAEmail,
        deliveryAddress: "House 12, RajGarh Road, Lahore",
        deliveryMethod: "HOME_DELIVERY",
        paymentMethod: "CASH_ON_DELIVERY",
        couponCode: promoCode,
      }),
    });
    const orderData = await orderRes.json();
    orderAId = orderData.order?.id;
    assert((orderRes.status === 200 || orderRes.status === 201) && orderAId, "Order placed successfully with server-side pricing & coupon");
    assert(orderData.order?.discount > 0, "Server applied coupon discount automatically");
  } catch (err) {
    assert(false, `Order creation failed: ${err.message}`);
  }

  // Order IDOR protection: Customer B cannot access Customer A's order
  const idorOrderRes = await fetch(`${BASE_URL}/api/orders/${orderAId}`, {
    headers: { Cookie: customerBCookie },
  });
  assert(idorOrderRes.status === 403, "Customer B cannot access Customer A's order details (IDOR blocked - 403)");

  // Customer A can view their own order
  const ownOrderRes = await fetch(`${BASE_URL}/api/orders/${orderAId}`, {
    headers: { Cookie: customerACookie },
  });
  assert(ownOrderRes.status === 200, "Customer A can view their own order details");

  // Admin can view any order
  const adminOrderRes = await fetch(`${BASE_URL}/api/admin/orders/${orderAId}`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminOrderRes.status === 200, "Admin can access full order details and item allocations");

  // -------------------------------------------------------------------------
  // SECTION 5: SEO, ROBOTS & PRODUCTION SECURITY HEADERS
  // -------------------------------------------------------------------------
  console.log("\n5. SEO, ROBOTS & PRODUCTION SECURITY HEADERS");

  // Check Sitemap
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  const sitemapText = await sitemapRes.text();
  assert(sitemapRes.status === 200, "Dynamic /sitemap.xml route responds with 200 OK");
  assert(sitemapText.includes("products") && sitemapText.includes("categories"), "Sitemap includes catalog products and category URLs");
  assert(!sitemapText.includes("/admin") && !sitemapText.includes("/account"), "Sitemap strictly excludes private /admin and /account routes");

  // Check Robots.txt
  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  const robotsText = await robotsRes.text();
  assert(robotsRes.status === 200, "Robots route /robots.txt responds with 200 OK");
  assert(robotsText.includes("Disallow: /admin") && robotsText.includes("Disallow: /account"), "Robots directives disallow private /admin and /account routes");
  assert(robotsText.includes("Sitemap:"), "Robots references sitemap.xml");

  // Check Security Headers
  const homeRes = await fetch(`${BASE_URL}/`);
  const xFrame = homeRes.headers.get("x-frame-options");
  const xContentType = homeRes.headers.get("x-content-type-options");
  const referrerPolicy = homeRes.headers.get("referrer-policy");

  assert(Boolean(xFrame), `X-Frame-Options header is present (${xFrame || "default"})`);
  assert(xContentType === "nosniff", `X-Content-Type-Options is nosniff (${xContentType})`);
  assert(Boolean(referrerPolicy), `Referrer-Policy header is present (${referrerPolicy || "default"})`);

  // -------------------------------------------------------------------------
  // SUMMARY SCORECARD
  // -------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`🏁 PHASE 10 QA AUDIT COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
  console.log("==================================================================");

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
