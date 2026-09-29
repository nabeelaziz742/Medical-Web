// Comprehensive Phase 7 Admin Dashboard Verification Suite
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING PHASE 7 ADMIN DASHBOARD VERIFICATION SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  function extractCookies(response) {
    if (typeof response.headers.getSetCookie === 'function') {
      const setCookies = response.headers.getSetCookie();
      if (setCookies && setCookies.length > 0) {
        return setCookies.map(c => c.split(';')[0]).join('; ');
      }
    }
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) return '';
    return setCookie.split(',').map(c => c.split(';')[0]).join('; ');
  }

  // 1. Setup Customer User & Admin Session
  console.log('--- Step 1: Authentication & Authorization Setup ---');
  const customerEmail = `customer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`;
  const customerPhone = `0300${Math.floor(1000000 + Math.random() * 9000000)}`;
  const password = 'Password123!';

  // Register standard customer
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Customer Test',
      email: customerEmail,
      phone: customerPhone,
      password,
      confirmPassword: password,
    }),
  });
  if (!regRes.ok) {
    console.error('Customer registration error:', await regRes.text());
  }
  assert(regRes.status === 201 || regRes.status === 200, 'Customer registered successfully');
  const customerCookie = extractCookies(regRes);

  // Admin login
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrPhone: 'admin@saadmedicalstore.com',
      password: 'admin123',
      rememberMe: true,
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  assert(adminLoginRes.status === 200, 'Admin login succeeded');
  assert(adminLoginData.user?.role === 'ADMIN', 'Admin session has role ADMIN');
  const adminCookie = extractCookies(adminLoginRes);

  // 2. Security Check: Non-Admin Access Denial
  console.log('\n--- Step 2: Non-Admin Access Enforcement (403 Forbidden) ---');
  const endpoints = [
    '/api/admin/metrics',
    '/api/admin/orders',
    '/api/admin/products',
    '/api/admin/prescriptions',
    '/api/admin/customers',
    '/api/admin/categories',
    '/api/admin/brands',
  ];

  for (const endpoint of endpoints) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { Cookie: customerCookie },
    });
    assert(res.status === 403, `Customer blocked with 403 Forbidden on ${endpoint} (got ${res.status})`);
  }

  // 3. Security Check: Unauthenticated Access Denial
  console.log('\n--- Step 3: Unauthenticated Access Enforcement (401 Unauthorized) ---');
  for (const endpoint of endpoints) {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    assert(res.status === 401, `Anonymous blocked with 401 Unauthorized on ${endpoint} (got ${res.status})`);
  }

  // 4. Admin Dashboard Metrics
  console.log('\n--- Step 4: Admin Dashboard Metrics Retrieval ---');
  const metricsRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: { Cookie: adminCookie },
  });
  const metricsData = await metricsRes.json();
  assert(metricsRes.status === 200, 'Admin metrics returned status 200');
  assert(metricsData.overview !== undefined, 'Metrics contains overview object');
  assert(typeof metricsData.overview.totalOrders === 'number', `Total orders is number: ${metricsData.overview.totalOrders}`);
  assert(typeof metricsData.overview.totalRevenue === 'number', `Total revenue is number: Rs. ${metricsData.overview.totalRevenue}`);
  assert(Array.isArray(metricsData.recentOrders), 'Recent orders is array');
  assert(Array.isArray(metricsData.prescriptionQueue), 'Prescription queue is array');
  assert(Array.isArray(metricsData.stockAttention), 'Stock attention is array');

  // 5. Customer places an order to test Order Management
  console.log('\n--- Step 5: Create Sample Order for Admin Workflow ---');
  // Add item to cart
  const cartRes = await fetch(`${BASE_URL}/api/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
    body: JSON.stringify({ productId: 'prod-panadol-500', quantity: 2 }),
  });
  const cartData = await cartRes.json();
  assert(cartRes.status === 200, `Item added to cart successfully`);

  // Create order
  const orderCreateRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
    body: JSON.stringify({
      customerName: 'Customer Test',
      customerPhone: '03009998877',
      customerEmail: customerEmail,
      deliveryAddress: 'House 55, Street 2, RajGarh Road, Lahore',
      paymentMethod: 'CASH_ON_DELIVERY',
    }),
  });
  
  let orderCreateData;
  const orderCreateText = await orderCreateRes.text();
  try {
    orderCreateData = JSON.parse(orderCreateText);
  } catch (err) {
    console.error('Order create raw response:', orderCreateText);
    throw new Error(`Order create failed with status ${orderCreateRes.status}`);
  }

  assert(orderCreateRes.status === 201 || orderCreateRes.status === 200, 'Sample order created successfully');
  const testOrderId = orderCreateData.order?.id;
  assert(testOrderId !== undefined, `Created order ID: ${testOrderId}`);

  // 6. Admin Order List & Search
  console.log('\n--- Step 6: Admin Orders List & Search ---');
  const ordersListRes = await fetch(`${BASE_URL}/api/admin/orders?search=${orderCreateData.order?.orderNumber}`, {
    headers: { Cookie: adminCookie },
  });
  const ordersListData = await ordersListRes.json();
  assert(ordersListRes.status === 200, 'Admin orders list returned 200');
  assert(ordersListData.orders?.length >= 1, `Found matching order in admin search`);

  // 7. Admin Order Detail & Status Transition Workflow
  console.log('\n--- Step 7: Order Detail & Status Transitions ---');
  const orderDetailRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
    headers: { Cookie: adminCookie },
  });
  const orderDetailData = await orderDetailRes.json();
  assert(orderDetailRes.status === 200, 'Admin order detail returned 200');
  assert(orderDetailData.order?.customerName === 'Customer Test', 'Order customer name matches');

  // Transition 1: PENDING -> CONFIRMED
  const update1Res = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'CONFIRMED', internalNotes: 'Verified via customer phone call.' }),
  });
  const update1Data = await update1Res.json();
  assert(update1Res.status === 200, 'Order transitioned to CONFIRMED');
  assert(update1Data.order?.status === 'CONFIRMED', 'Status is CONFIRMED');

  // Transition 2: CONFIRMED -> PREPARING
  const update2Res = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'PREPARING' }),
  });
  const update2Data = await update2Res.json();
  assert(update2Res.status === 200, 'Order transitioned to PREPARING');
  assert(update2Data.order?.status === 'PREPARING', 'Status is PREPARING');

  // Transition 3: PREPARING -> DISPATCHED
  const update3Res = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'DISPATCHED' }),
  });
  const update3Data = await update3Res.json();
  assert(update3Res.status === 200, 'Order transitioned to DISPATCHED');
  assert(update3Data.order?.status === 'DISPATCHED', 'Status is DISPATCHED');

  // Transition 4: DISPATCHED -> DELIVERED (Payment PAID)
  const update4Res = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'DELIVERED', paymentStatus: 'PAID' }),
  });
  const update4Data = await update4Res.json();
  assert(update4Res.status === 200, 'Order transitioned to DELIVERED');
  assert(update4Data.order?.status === 'DELIVERED', 'Status is DELIVERED');
  assert(update4Data.order?.paymentStatus === 'PAID', 'Payment status is PAID');

  // Invalid transition test: DELIVERED -> PENDING (Must be rejected)
  const invalidOrderRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'PENDING' }),
  });
  assert(invalidOrderRes.status === 400, `Invalid order transition DELIVERED -> PENDING rejected with 400 (got ${invalidOrderRes.status})`);

  // 8. Product Management (Create, Edit, Delete)
  console.log('\n--- Step 8: Product Catalog Management ---');
  const newProductSlug = `test-medicine-${Date.now()}`;
  const createProductRes = await fetch(`${BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Test Antibiotic Capsule 250mg',
      slug: newProductSlug,
      brand: 'Searle',
      category: 'Medicines',
      genericName: 'Amoxicillin 250mg',
      packSize: '20 Capsules',
      price: 320,
      comparePrice: 350,
      sku: `TEST-MED-${Date.now().toString().slice(-4)}`,
      stockCount: 50,
      stockStatus: 'IN_STOCK',
      requiresPrescription: true,
      isFeatured: false,
      manufacturer: 'The Searle Company Limited',
      description: 'Broad spectrum antibiotic medication.',
    }),
  });
  const createProductData = await createProductRes.json();
  assert(createProductRes.status === 201, 'New product created with status 201');
  assert(createProductData.product?.slug === newProductSlug, 'Created product slug matches');

  const createdProductId = createProductData.product?.id;

  // Edit Product
  const editProductRes = await fetch(`${BASE_URL}/api/admin/products/${createdProductId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ price: 340, stockCount: 45 }),
  });
  const editProductData = await editProductRes.json();
  assert(editProductRes.status === 200, 'Product updated successfully');
  assert(editProductData.product?.price === 340, 'Updated price is 340');

  // Delete Product
  const deleteProductRes = await fetch(`${BASE_URL}/api/admin/products/${createdProductId}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deleteProductRes.status === 200, 'Product deleted successfully');

  // 9. Categories Management & Dependency Protection
  console.log('\n--- Step 9: Category Management & Relationship Protection ---');
  // Attempt to delete category with active products ("medicines")
  const deleteActiveCatRes = await fetch(`${BASE_URL}/api/admin/categories/cat-medicines`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deleteActiveCatRes.status === 400, `Deletion of category with active products rejected with 400 (got ${deleteActiveCatRes.status})`);
  const deleteActiveCatData = await deleteActiveCatRes.json();
  assert(deleteActiveCatData.error?.includes('product'), `Error message mentions active product dependency: "${deleteActiveCatData.error}"`);

  // Create temporary category
  const tempCatSlug = `temp-cat-${Date.now()}`;
  const createCatRes = await fetch(`${BASE_URL}/api/admin/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Temp Category',
      slug: tempCatSlug,
      description: 'Temporary category for testing safe deletion',
    }),
  });
  const createCatData = await createCatRes.json();
  assert(createCatRes.status === 201, 'Temp category created successfully');

  // Safe delete temporary category
  const deleteTempCatRes = await fetch(`${BASE_URL}/api/admin/categories/${createCatData.category?.id}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deleteTempCatRes.status === 200, 'Empty category deleted safely');

  // 10. Brands Management & Dependency Protection
  console.log('\n--- Step 10: Brand Management & Relationship Protection ---');
  // Attempt to delete active brand ("gsk")
  const deleteActiveBrandRes = await fetch(`${BASE_URL}/api/admin/brands/brand-gsk`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deleteActiveBrandRes.status === 400, `Deletion of brand with active products rejected with 400 (got ${deleteActiveBrandRes.status})`);

  // Create temporary brand
  const tempBrandSlug = `temp-brand-${Date.now()}`;
  const createBrandRes = await fetch(`${BASE_URL}/api/admin/brands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Temp Brand Pharma',
      slug: tempBrandSlug,
    }),
  });
  const createBrandData = await createBrandRes.json();
  assert(createBrandRes.status === 201, 'Temp brand created successfully');

  // Safe delete temporary brand
  const deleteTempBrandRes = await fetch(`${BASE_URL}/api/admin/brands/${createBrandData.brand?.id}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deleteTempBrandRes.status === 200, 'Empty brand deleted safely');

  // 11. Customer Accounts View
  console.log('\n--- Step 11: Customers Accounts Directory ---');
  const custRes = await fetch(`${BASE_URL}/api/admin/customers`, {
    headers: { Cookie: adminCookie },
  });
  const custData = await custRes.json();
  assert(custRes.status === 200, 'Admin customers list returned 200');
  assert(custData.customers?.length >= 1, `Found ${custData.customers?.length} customer accounts`);

  console.log('\n========================================');
  console.log(`TOTAL PHASE 7 TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
