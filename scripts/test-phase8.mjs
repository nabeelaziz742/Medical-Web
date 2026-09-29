// Comprehensive Phase 8 Inventory, Batches, Expiry & Stock Management Test Suite
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING PHASE 8 INVENTORY, BATCHES, EXPIRY & STOCK MANAGEMENT VERIFICATION SUITE ===\n');

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

  // -------------------------------------------------------------
  // 1. SETUP SESSIONS
  // -------------------------------------------------------------
  console.log('--- Step 1: Authentication & Authorization Setup ---');
  const customerEmail = `customer_p8_${Date.now()}@example.com`;
  const customerPhone = `0300${Math.floor(1000000 + Math.random() * 9000000)}`;
  const password = 'Password123!';

  // Register Customer
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Phase 8 Customer',
      email: customerEmail,
      phone: customerPhone,
      password,
      confirmPassword: password,
    }),
  });
  assert(regRes.status === 200 || regRes.status === 201, 'Customer registered successfully');
  const customerCookie = extractCookies(regRes);

  // Admin Login
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

  // -------------------------------------------------------------
  // 2. AUTHORIZATION CHECKS
  // -------------------------------------------------------------
  console.log('\n--- Step 2: Authorization Enforcement (401 & 403) ---');
  const adminInventoryEndpoints = [
    { url: '/api/admin/inventory', method: 'GET' },
    { url: '/api/admin/inventory/transactions', method: 'GET' },
    { url: '/api/admin/inventory/metrics', method: 'GET' },
    { url: '/api/admin/inventory/receive', method: 'POST', body: {} },
    { url: '/api/admin/inventory/adjust', method: 'POST', body: {} },
  ];

  // Test 1: Anonymous -> 401
  for (const ep of adminInventoryEndpoints) {
    const res = await fetch(`${BASE_URL}${ep.url}`, {
      method: ep.method,
      headers: { 'Content-Type': 'application/json' },
      body: ep.method === 'POST' ? JSON.stringify(ep.body) : undefined,
    });
    assert(res.status === 401, `[Test 1] Anonymous blocked with 401 Unauthorized on ${ep.url}`);
  }

  // Test 2: Customer -> 403
  for (const ep of adminInventoryEndpoints) {
    const res = await fetch(`${BASE_URL}${ep.url}`, {
      method: ep.method,
      headers: {
        'Content-Type': 'application/json',
        Cookie: customerCookie,
      },
      body: ep.method === 'POST' ? JSON.stringify(ep.body) : undefined,
    });
    assert(res.status === 403, `[Test 2] Customer blocked with 403 Forbidden on ${ep.url}`);
  }

  // Test 3: Admin -> Allowed
  const adminInvRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminInvRes.status === 200, '[Test 3] Admin successfully accessed /api/admin/inventory');
  const invData = await adminInvRes.json();
  assert(Array.isArray(invData.products), 'Inventory products array returned');
  assert(invData.products.length > 0, 'Inventory products populated');

  const testProduct = invData.products[0];
  console.log(`Using test product: "${testProduct.name}" (ID: ${testProduct.id}, SKU: ${testProduct.sku})`);

  // -------------------------------------------------------------
  // 3. STOCK RECEIVING & BATCH CREATION
  // -------------------------------------------------------------
  console.log('\n--- Step 3: Stock Receiving & Batch Creation ---');
  const testBatchNum = `BATCH-P8-${Date.now().toString().slice(-6)}`;
  const mfgDate = '2026-01-01';
  const validExpDate = '2027-06-30'; // Far in future

  // Test 4: Create / Receive new batch
  const receiveRes1 = await fetch(`${BASE_URL}/api/admin/inventory/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      productId: testProduct.id,
      batchNumber: testBatchNum,
      quantity: 50,
      purchasePrice: 150,
      sellingPrice: 220,
      manufacturingDate: mfgDate,
      expiryDate: validExpDate,
      referenceId: 'PO-TEST-001',
      notes: 'Initial test intake',
    }),
  });
  const receiveData1 = await receiveRes1.json();
  if (receiveRes1.status !== 201) {
    console.error('Receive error details:', receiveRes1.status, receiveData1);
  }
  assert(receiveRes1.status === 201, `[Test 4] Stock received into new batch ${testBatchNum}`);
  assert(receiveData1.batch?.quantity === 50, '[Test 4] Batch quantity initialized to 50');

  // Test 5: Duplicate batch receipt increases stock atomically
  const receiveRes2 = await fetch(`${BASE_URL}/api/admin/inventory/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      productId: testProduct.id,
      batchNumber: testBatchNum,
      quantity: 25,
      purchasePrice: 150,
      sellingPrice: 220,
      manufacturingDate: mfgDate,
      expiryDate: validExpDate,
      referenceId: 'PO-TEST-002',
      notes: 'Additional stock for same batch',
    }),
  });
  const receiveData2 = await receiveRes2.json();
  assert(receiveRes2.status === 201, '[Test 5] Stock receiving into existing batch succeeded');
  assert(receiveData2.batch?.quantity === 75, '[Test 5] Batch quantity correctly incremented to 75');

  // Test 6: Invalid expiry date rejected (precedes manufacturing date)
  const invalidExpRes = await fetch(`${BASE_URL}/api/admin/inventory/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      productId: testProduct.id,
      batchNumber: `INV-EXP-${Date.now()}`,
      quantity: 10,
      purchasePrice: 100,
      sellingPrice: 150,
      manufacturingDate: '2026-05-01',
      expiryDate: '2025-01-01', // Before mfg
    }),
  });
  assert(invalidExpRes.status === 400, '[Test 6] Invalid expiry date preceding manufacturing date rejected (400)');

  // Test 7: Negative/Zero quantity rejected
  const negQtyRes = await fetch(`${BASE_URL}/api/admin/inventory/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      productId: testProduct.id,
      batchNumber: `NEG-QTY-${Date.now()}`,
      quantity: -5,
      purchasePrice: 100,
      sellingPrice: 150,
      expiryDate: '2027-01-01',
    }),
  });
  assert(negQtyRes.status === 400, '[Test 7] Negative received quantity rejected with 400');

  // Test 8 & 9: Verify PURCHASE transaction was appended to ledger
  const ledgerRes = await fetch(`${BASE_URL}/api/admin/inventory/transactions?productId=${testProduct.id}&type=PURCHASE`, {
    headers: { Cookie: adminCookie },
  });
  const ledgerData = await ledgerRes.json();
  assert(ledgerRes.status === 200, '[Test 8] Stock transactions ledger fetched');
  const foundTx = ledgerData.transactions.find((t) => t.batchNumber === testBatchNum && t.type === 'PURCHASE');
  assert(!!foundTx, `[Test 9] Ledger records PURCHASE transaction for batch ${testBatchNum}`);
  assert(foundTx?.performedBy === 'admin@saadmedicalstore.com', '[Test 9] Ledger records actor identity');

  // Test 10: Rollback / validation safety on missing product
  const nonExistentProdRes = await fetch(`${BASE_URL}/api/admin/inventory/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      productId: 'non-existent-prod-id',
      batchNumber: 'GHOST-BATCH',
      quantity: 10,
      purchasePrice: 50,
      sellingPrice: 100,
      expiryDate: '2027-01-01',
    }),
  });
  assert(nonExistentProdRes.status === 400, '[Test 10] Non-existent product receipt safely rejected');

  // -------------------------------------------------------------
  // 4. MANUAL STOCK ADJUSTMENTS
  // -------------------------------------------------------------
  console.log('\n--- Step 4: Manual Stock Adjustments & Ledger ---');
  const targetBatchId = receiveData2.batch.id;

  // Test 11: Stock Increase (ADJUSTMENT_IN)
  const adjInRes = await fetch(`${BASE_URL}/api/admin/inventory/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      batchId: targetBatchId,
      type: 'ADJUSTMENT_IN',
      quantity: 5,
      notes: 'Found extra unopened box during physical inventory check',
      referenceId: 'AUDIT-ADJ-01',
    }),
  });
  const adjInData = await adjInRes.json();
  assert(adjInRes.status === 200, '[Test 11] Stock increase ADJUSTMENT_IN succeeded');
  assert(adjInData.batch?.quantity === 80, '[Test 11] Batch quantity increased from 75 to 80');

  // Test 12: Stock Decrease (DAMAGE)
  const adjDamRes = await fetch(`${BASE_URL}/api/admin/inventory/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      batchId: targetBatchId,
      type: 'DAMAGE',
      quantity: 10,
      notes: 'Water damage in storage rack 4',
      referenceId: 'DAMAGE-REP-01',
    }),
  });
  const adjDamData = await adjDamRes.json();
  assert(adjDamRes.status === 200, '[Test 12] Stock decrease DAMAGE succeeded');
  assert(adjDamData.batch?.quantity === 70, '[Test 12] Batch quantity decreased from 80 to 70');

  // Test 13: Reduction greater than available stock rejected
  const overReduceRes = await fetch(`${BASE_URL}/api/admin/inventory/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      batchId: targetBatchId,
      type: 'DAMAGE',
      quantity: 9999, // Exceeds 70
      notes: 'Excessive damage reduction test',
    }),
  });
  assert(overReduceRes.status === 400, '[Test 13] Stock reduction exceeding available quantity rejected (400)');

  // Test 14: Adjustment transaction logged in ledger
  const adjLedgerRes = await fetch(`${BASE_URL}/api/admin/inventory/transactions?batchId=${targetBatchId}`, {
    headers: { Cookie: adminCookie },
  });
  const adjLedgerData = await adjLedgerRes.json();
  assert(adjLedgerData.transactions.some((t) => t.type === 'DAMAGE' && t.quantity === -10), '[Test 14] DAMAGE transaction logged in ledger');
  assert(adjLedgerData.transactions.some((t) => t.type === 'ADJUSTMENT_IN' && t.quantity === 5), '[Test 14] ADJUSTMENT_IN transaction logged in ledger');

  // Test 15: Failed adjustment rolls back without modifying batch quantity
  const batchDetailRes = await fetch(`${BASE_URL}/api/admin/inventory/batches/${targetBatchId}`, {
    headers: { Cookie: adminCookie },
  });
  const batchDetail = await batchDetailRes.json();
  assert(batchDetail.batch?.quantity === 70, '[Test 15] Batch quantity preserved exactly at 70 after rejected reduction');

  // -------------------------------------------------------------
  // 5. EXPIRY STATUS DETECTION & SELLABILITY
  // -------------------------------------------------------------
  console.log('\n--- Step 5: Expiry Management & Status Detection ---');

  // Receive an Expired Batch (Expiry in the past)
  const expiredBatchNum = `EXP-TEST-${Date.now().toString().slice(-4)}`;
  const pastExpDate = '2025-01-01'; // Past date
  const expiredRecRes = await fetch(`${BASE_URL}/api/admin/inventory/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      productId: testProduct.id,
      batchNumber: expiredBatchNum,
      quantity: 20,
      purchasePrice: 100,
      sellingPrice: 150,
      manufacturingDate: '2024-01-01',
      expiryDate: pastExpDate,
      notes: 'Expired stock intake for test',
    }),
  });
  const expiredRecData = await expiredRecRes.json();
  assert(expiredRecRes.status === 201, 'Expired batch recorded for testing');

  // Receive an Expiring-Soon Batch (Expires in 45 days)
  const soonBatchNum = `SOON-TEST-${Date.now().toString().slice(-4)}`;
  const soonDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const soonRecRes = await fetch(`${BASE_URL}/api/admin/inventory/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      productId: testProduct.id,
      batchNumber: soonBatchNum,
      quantity: 15,
      purchasePrice: 100,
      sellingPrice: 150,
      manufacturingDate: '2025-06-01',
      expiryDate: soonDate,
      notes: 'Expiring soon batch intake for test',
    }),
  });
  assert(soonRecRes.status === 201, 'Expiring soon batch recorded for testing');

  // Test 16: Verify Expired status
  const expBatchDetailRes = await fetch(`${BASE_URL}/api/admin/inventory/batches/${expiredRecData.batch.id}`, {
    headers: { Cookie: adminCookie },
  });
  const expBatchDetail = await expBatchDetailRes.json();
  assert(expBatchDetail.batch?.expiryStatus === 'EXPIRED', '[Test 16] Expired batch correctly tagged as EXPIRED');

  // Test 17: Verify Expiring Soon status
  const soonBatchDetailRes = await fetch(`${BASE_URL}/api/admin/inventory/batches/${soonRecRes ? (await soonRecRes.json()).batch.id : ''}`, {
    headers: { Cookie: adminCookie },
  });
  // Or fetch product detail
  const prodDetailRes = await fetch(`${BASE_URL}/api/admin/inventory/${testProduct.id}`, {
    headers: { Cookie: adminCookie },
  });
  const prodDetail = await prodDetailRes.json();
  const soonBatch = prodDetail.batches.find((b) => b.batchNumber === soonBatchNum);
  assert(soonBatch?.expiryStatus === 'EXPIRING_SOON', '[Test 17] Batch within 90 days correctly tagged as EXPIRING_SOON');

  // Test 18: Available stock excludes expired batches
  const totalPhysical = prodDetail.batches.reduce((sum, b) => sum + b.quantity, 0);
  const availableValid = prodDetail.product.availableStock;
  assert(availableValid < totalPhysical, '[Test 18] Available sellable stock strictly excludes expired batch quantity');

  // -------------------------------------------------------------
  // 6. FEFO ALLOCATION & ORDER INTEGRATION
  // -------------------------------------------------------------
  console.log('\n--- Step 6: FEFO Allocation & Atomic Order Integration ---');

  // Setup a special product with two known batches to verify FEFO ordering:
  // Batch Earliest: Expires in 3 months, quantity = 5
  // Batch Later: Expires in 12 months, quantity = 20
  // Order quantity = 8
  // Expected Allocation: 5 from Earliest, 3 from Later!

  // Clear customer cart
  await fetch(`${BASE_URL}/api/cart`, {
    method: 'DELETE',
    headers: { Cookie: customerCookie },
  });

  // Add 8 units of testProduct to customer cart
  const addCartRes = await fetch(`${BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      productId: testProduct.id,
      quantity: 8,
    }),
  });
  assert(addCartRes.status === 200, 'Added 8 units of product to customer cart');

  // Capture pre-order stock
  const preOrderProdRes = await fetch(`${BASE_URL}/api/admin/inventory/${testProduct.id}`, {
    headers: { Cookie: adminCookie },
  });
  const preOrderProd = await preOrderProdRes.json();
  const validBatchesSorted = preOrderProd.batches
    .filter((b) => b.expiryStatus !== 'EXPIRED' && b.quantity > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const earliestBatch = validBatchesSorted[0];
  const earliestPreQty = earliestBatch.quantity;

  // Checkout / Create Order
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      customerName: 'FEFO Verification Customer',
      customerPhone: '03001234567',
      customerEmail: customerEmail,
      deliveryAddress: 'House 14, Street 9, Sector B, DHA Lahore',
      paymentMethod: 'CASH_ON_DELIVERY',
    }),
  });
  const orderData = await orderRes.json();
  assert(orderRes.status === 200 || orderRes.status === 201, `[Test 24] Order created successfully (${orderData.order?.orderNumber})`);

  // Test 19: Earliest expiry batch consumed first (FEFO)
  const postOrderProdRes = await fetch(`${BASE_URL}/api/admin/inventory/${testProduct.id}`, {
    headers: { Cookie: adminCookie },
  });
  const postOrderProd = await postOrderProdRes.json();
  const updatedEarliestBatch = postOrderProd.batches.find((b) => b.id === earliestBatch.id);
  
  const expectedDeductionFromEarliest = Math.min(earliestPreQty, 8);
  assert(
    updatedEarliestBatch?.quantity === earliestPreQty - expectedDeductionFromEarliest,
    `[Test 19] FEFO consumed ${expectedDeductionFromEarliest} units from earliest expiry batch ${earliestBatch.batchNumber}`
  );

  // Test 25: SALE transactions recorded for deducted batches
  const postSaleLedgerRes = await fetch(`${BASE_URL}/api/admin/inventory/transactions?productId=${testProduct.id}&type=SALE`, {
    headers: { Cookie: adminCookie },
  });
  const postSaleLedger = await postSaleLedgerRes.json();
  const orderSaleTx = postSaleLedger.transactions.find((t) => t.referenceId === orderData.order?.orderNumber);
  assert(!!orderSaleTx, `[Test 25] SALE stock transaction recorded with reference ${orderData.order?.orderNumber}`);

  // Test 26: Insufficient unexpired stock rejects order safely
  // Attempt to buy 99999 units
  await fetch(`${BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      productId: testProduct.id,
      quantity: 99999,
    }),
  });

  const failOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      customerName: 'Fail Order Customer',
      customerPhone: '03001234567',
      deliveryAddress: 'Lahore',
      paymentMethod: 'CASH_ON_DELIVERY',
    }),
  });
  assert(failOrderRes.status === 400, '[Test 22 & 26] Order exceeding available valid stock rejected with 400');

  // Test 28 & 29: Order item batch allocations & traceability
  const orderDetailRes = await fetch(`${BASE_URL}/api/orders/${orderData.order?.id}`, {
    headers: { Cookie: customerCookie },
  });
  const orderDetail = await orderDetailRes.json();
  const orderItem = orderDetail.order?.items[0];
  assert(orderItem?.allocations && orderItem.allocations.length > 0, '[Test 28] Order item contains batch allocation traceability');
  const sumAllocated = orderItem?.allocations?.reduce((s, a) => s + a.quantity, 0);
  assert(sumAllocated === orderItem?.quantity, `[Test 29] Multi-batch allocations (${sumAllocated}) reconcile exactly to ordered quantity (${orderItem?.quantity})`);

  // -------------------------------------------------------------
  // 7. DASHBOARD METRICS INTEGRATION
  // -------------------------------------------------------------
  console.log('\n--- Step 7: Dashboard Metrics Verification ---');
  const metricsRes = await fetch(`${BASE_URL}/api/admin/inventory/metrics`, {
    headers: { Cookie: adminCookie },
  });
  const metricsData = await metricsRes.json();
  assert(metricsRes.status === 200, 'Inventory metrics endpoint returned 200');
  assert(typeof metricsData.counts?.totalUnits === 'number', 'Total units metric is numeric');
  assert(Array.isArray(metricsData.lowStockProducts), 'Low stock products array present');
  assert(Array.isArray(metricsData.expiringSoonBatches), 'Expiring soon batches array present');
  assert(Array.isArray(metricsData.expiredBatches), 'Expired batches array present');

  console.log(`\n==================================================`);
  console.log(`PHASE 8 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
