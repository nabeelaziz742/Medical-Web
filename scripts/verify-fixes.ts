import prisma from "../src/lib/prisma";
import {
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  getAdminProductById,
  ensureDatabaseCatalogSeeded,
} from "../src/lib/admin";
import { receiveStock, getProductInventoryDetail } from "../src/lib/inventory";

async function main() {
  console.log("================================================================");
  console.log("🏥 SAAD MEDICAL STORE — ADMIN CRUD & INVENTORY VERIFICATION");
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // SETUP & INITIAL CATALOG SEEDING CHECK
    // -------------------------------------------------------------
    console.log("--- Initial PostgreSQL Catalog Setup ---");
    await ensureDatabaseCatalogSeeded();
    const initialDbProductsCount = await prisma.product.count();
    assert(initialDbProductsCount >= 12, `PostgreSQL has initial catalog items (${initialDbProductsCount} products)`);

    // -------------------------------------------------------------
    // TEST 1: CREATE A NEW MEDICINE WITH INITIAL STOCK
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Create New Medicine with Initial Stock in PostgreSQL ---");
    const testSku1 = `MED-TEST-${Date.now().toString().slice(-6)}`;
    const testSlug1 = `test-amoxicillin-${Date.now().toString().slice(-6)}`;
    const initialStock1 = 30;

    const created = await createAdminProduct({
      name: "Amoxicillin 500mg Capsules",
      slug: testSlug1,
      genericName: "Amoxicillin Trihydrate 500mg",
      brand: "GSK",
      category: "Antibiotics",
      packSize: "30 Capsules (3 x 10 Blisters)",
      price: 450,
      comparePrice: 500,
      sku: testSku1,
      stockStatus: "IN_STOCK",
      stockCount: initialStock1,
      requiresPrescription: true,
      isFeatured: false,
      manufacturer: "GlaxoSmithKline Pakistan Limited",
      description: "Broad-spectrum penicillin antibiotic for bacterial infections.",
      composition: "Each capsule contains Amoxicillin Trihydrate equivalent to 500mg Amoxicillin.",
      usageInfo: "Take 1 capsule every 8 hours with water.",
      warnings: "Complete full course. Do not take if allergic to penicillin.",
      storageInfo: "Store below 25°C in a dry place.",
    });

    assert(Boolean(created && created.id), "createAdminProduct returns created product with ID");
    assert(created.stockCount === initialStock1, `Returned product stockCount is ${initialStock1}`);

    // Verify in PostgreSQL directly via Prisma
    const dbProduct1 = await prisma.product.findUnique({
      where: { id: created.id },
      include: {
        inventory: true,
        batches: true,
        stockTransactions: true,
        category: true,
        brand: true,
      },
    });

    assert(dbProduct1 !== null, "Product is physically persisted in PostgreSQL Product table");
    assert(dbProduct1?.sku === testSku1, "PostgreSQL SKU matches");
    assert(dbProduct1?.category?.name === "Antibiotics", "Category correctly assigned in PostgreSQL");
    assert(dbProduct1?.inventory !== null, "Inventory record exists in PostgreSQL");
    assert(dbProduct1?.inventory?.totalStock === initialStock1, `Inventory.totalStock in PostgreSQL is ${initialStock1}`);
    assert(dbProduct1?.batches?.length === 1, "Initial Batch record created in PostgreSQL");
    assert(dbProduct1?.batches[0]?.quantity === initialStock1, `Batch.quantity in PostgreSQL is ${initialStock1}`);
    assert(dbProduct1?.stockTransactions?.length === 1, "StockTransaction created in PostgreSQL");
    assert(dbProduct1?.stockTransactions[0]?.type === "PURCHASE", "StockTransaction type is PURCHASE");
    assert(dbProduct1?.stockTransactions[0]?.quantity === initialStock1, "StockTransaction quantity recorded accurately");

    // Verify reading via getAdminProductById
    const fetched1 = await getAdminProductById(created.id);
    assert(fetched1 !== null && fetched1.stockCount === initialStock1, "getAdminProductById reads persisted stockCount");

    // -------------------------------------------------------------
    // TEST 2: INCREASE MEDICINE STOCK (EDIT PRODUCT FLOW)
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Increase Medicine Stock via Edit Product (PostgreSQL Persistence) ---");
    const updatedStockCount = 50; // Increased by +20 (from 30 to 50)

    const updated1 = await updateAdminProduct(created.id, {
      stockCount: updatedStockCount,
    });

    assert(updated1.stockCount === updatedStockCount, `updateAdminProduct returned updated stockCount = ${updatedStockCount}`);

    // Verify in PostgreSQL
    const dbProductAfterUpdate = await prisma.product.findUnique({
      where: { id: created.id },
      include: {
        inventory: true,
        batches: true,
        stockTransactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    assert(dbProductAfterUpdate?.inventory?.totalStock === 50, "PostgreSQL Inventory.totalStock updated to 50");
    assert(dbProductAfterUpdate?.batches[0]?.quantity === 50, "PostgreSQL Batch.quantity updated to 50");
    assert(dbProductAfterUpdate?.stockTransactions?.length === 2, "New StockTransaction logged for the edit");
    assert(
      dbProductAfterUpdate?.stockTransactions[0]?.type === "ADJUSTMENT_IN" ||
      dbProductAfterUpdate?.stockTransactions[0]?.type === "PURCHASE",
      "StockTransaction logged as positive stock adjustment"
    );
    assert(dbProductAfterUpdate?.stockTransactions[0]?.quantity === 20, "StockTransaction recorded delta = +20");
    assert(dbProductAfterUpdate?.stockTransactions[0]?.balanceAfter === 50, "StockTransaction balanceAfter = 50");

    // Verify getAdminProductById after reload
    const reloadedProduct = await getAdminProductById(created.id);
    assert(reloadedProduct?.stockCount === 50, "Fresh getAdminProductById query returns stockCount = 50");

    // -------------------------------------------------------------
    // TEST 2B: RECEIVE STOCK WORKFLOW (INVENTORY MODULE SYNC)
    // -------------------------------------------------------------
    console.log("\n--- TEST 2B: Stock Receiving Workflow Integration ---");
    const recvResult = await receiveStock({
      productId: created.id,
      batchNumber: `SM-2026-RECV-${Date.now().toString().slice(-4)}`,
      quantity: 25,
      purchasePrice: 300,
      sellingPrice: 450,
      expiryDate: new Date(Date.now() + 500 * 24 * 60 * 60 * 1000).toISOString(),
    });

    assert(recvResult.success, "receiveStock succeeded on PostgreSQL product");

    const invDetail = await getProductInventoryDetail(created.id);
    assert(invDetail?.product.totalStock === 75, `Total stock after receiveStock = 75 (was 50 + 25)`);
    assert(invDetail?.batches.length === 2, "Product now has 2 distinct batches");

    // -------------------------------------------------------------
    // TEST 3: DELETE PRODUCT WITH NO HISTORICAL DEPENDENCIES
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Delete Product with No Historical Orders ---");
    // Create a temporary product to delete
    const tempSku = `MED-TEMP-${Date.now().toString().slice(-6)}`;
    const tempSlug = `temp-medicine-${Date.now().toString().slice(-6)}`;
    const tempProduct = await createAdminProduct({
      name: "Temporary Medicine for Delete Test",
      slug: tempSlug,
      brand: "Getz Pharma",
      category: "General Medicine",
      packSize: "10 Tablets",
      price: 100,
      sku: tempSku,
      stockStatus: "IN_STOCK",
      stockCount: 15,
      requiresPrescription: false,
      manufacturer: "Getz Pharma",
      description: "Temporary product to test safe database deletion.",
    });

    // Verify it exists in DB
    const beforeDelete = await prisma.product.findUnique({ where: { id: tempProduct.id } });
    assert(beforeDelete !== null, "Temporary product confirmed in PostgreSQL prior to delete");

    // Perform Delete
    const deleteResult = await deleteAdminProduct(tempProduct.id);
    assert(deleteResult.success, "deleteAdminProduct returned success = true");

    // Verify it is completely removed from PostgreSQL
    const afterDelete = await prisma.product.findUnique({ where: { id: tempProduct.id } });
    assert(afterDelete === null, "Product record does NOT exist in PostgreSQL after deletion");

    const afterDeleteInventory = await prisma.inventory.findFirst({ where: { productId: tempProduct.id } });
    assert(afterDeleteInventory === null, "Cascaded Inventory record deleted from PostgreSQL");

    const afterDeleteBatches = await prisma.batch.findMany({ where: { productId: tempProduct.id } });
    assert(afterDeleteBatches.length === 0, "Cascaded Batch records deleted from PostgreSQL");

    // Verify getAdminProductById returns null
    const getDeleted = await getAdminProductById(tempProduct.id);
    assert(getDeleted === null, "getAdminProductById returns null for deleted product");

    // -------------------------------------------------------------
    // TEST 4: DELETE PRODUCT WITH HISTORICAL ORDER DEPENDENCIES
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Prevent Deletion of Product with Historical Orders ---");
    // Create product with order link
    const orderedSku = `MED-ORD-${Date.now().toString().slice(-6)}`;
    const orderedSlug = `ordered-medicine-${Date.now().toString().slice(-6)}`;
    const orderedProduct = await createAdminProduct({
      name: "Ordered Vital Medicine",
      slug: orderedSlug,
      brand: "Abbott",
      category: "Critical Care",
      packSize: "100 Tablets",
      price: 800,
      sku: orderedSku,
      stockStatus: "IN_STOCK",
      stockCount: 40,
      requiresPrescription: true,
      manufacturer: "Abbott Laboratories",
      description: "Critical medicine with historical customer order.",
    });

    // Create an order in PostgreSQL referencing this product
    const orderNumber = `SM-TEST-${Date.now().toString().slice(-6)}`;
    const testOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerName: "Historical Customer",
        customerPhone: "03001234567",
        deliveryAddress: "123 Test Street, Lahore",
        subtotal: 800,
        total: 800,
        status: "DELIVERED",
        items: {
          create: {
            productId: orderedProduct.id,
            productName: orderedProduct.name,
            unitPrice: 800,
            quantity: 1,
            subtotal: 800,
          },
        },
      },
    });

    assert(testOrder !== null, `Created historical order ${orderNumber} linked to product`);

    // Attempt to delete product
    let deleteBlocked = false;
    let blockErrorMessage = "";
    try {
      await deleteAdminProduct(orderedProduct.id);
    } catch (err: any) {
      deleteBlocked = true;
      blockErrorMessage = err.message;
    }

    assert(deleteBlocked, "deleteAdminProduct blocked with an exception when product has historical orders");
    assert(
      blockErrorMessage.includes("historical") || blockErrorMessage.includes("Cannot delete"),
      `Clear error message provided: "${blockErrorMessage}"`
    );

    // Verify product and order STILL EXIST in PostgreSQL intact
    const verifyProdStillExists = await prisma.product.findUnique({ where: { id: orderedProduct.id } });
    assert(verifyProdStillExists !== null, "Product STILL EXISTS in PostgreSQL (order history protected)");

    const verifyOrderStillExists = await prisma.order.findUnique({ where: { id: testOrder.id }, include: { items: true } });
    assert(verifyOrderStillExists !== null && verifyOrderStillExists.items.length === 1, "Order and OrderItem are 100% intact");

    // Clean up test data safely
    await prisma.order.delete({ where: { id: testOrder.id } });
    await prisma.product.delete({ where: { id: orderedProduct.id } });
    await prisma.product.delete({ where: { id: created.id } });

    // -------------------------------------------------------------
    // TEST 5: PERSISTENCE & RELOAD VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Verification of PostgreSQL Authoritative Data Across Fresh Instances ---");
    const freshProductsList = await getAdminProducts({ limit: 10 });
    assert(freshProductsList.products.length > 0, `Fresh getAdminProducts query returned ${freshProductsList.products.length} products`);
    assert(freshProductsList.pagination.total >= 12, `Total product count from PostgreSQL = ${freshProductsList.pagination.total}`);

    console.log("\n================================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
