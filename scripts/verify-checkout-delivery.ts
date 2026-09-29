import prisma from "../src/lib/prisma";
import { createOrder, getOrderById, getUserOrders } from "../src/lib/orders";
import { getAllAdminOrdersRaw, getAdminOrders, getAdminOrderById, updateAdminOrderStatus } from "../src/lib/admin";
import { createOrderSchema } from "../src/lib/validations/order";
import { addItemToUserCart, clearUserCart, getUserCart } from "../src/lib/cart";

async function main() {
  console.log("==================================================================");
  console.log("SAAD MEDICAL STORE — CHECKOUT DELIVERY VERIFICATION TEST SUITE");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `-> ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    // Setup test users
    const testUserA = await prisma.user.upsert({
      where: { email: "test.customer.a@saadmedicalstore.com" },
      create: {
        name: "Test Customer A",
        email: "test.customer.a@saadmedicalstore.com",
        phone: "03001234567",
        passwordHash: "dummyhash123",
        role: "CUSTOMER",
      },
      update: {
        name: "Test Customer A",
        phone: "03001234567",
      },
    });

    const testUserB = await prisma.user.upsert({
      where: { email: "test.customer.b@saadmedicalstore.com" },
      create: {
        name: "Test Customer B",
        email: "test.customer.b@saadmedicalstore.com",
        phone: "03009876543",
        passwordHash: "dummyhash456",
        role: "CUSTOMER",
      },
      update: {},
    });

    // Ensure a test product with stock exists
    let product = await prisma.product.findFirst({
      where: { isActive: true },
      include: { inventory: true, batches: true },
    });

    if (!product || !product.inventory || product.inventory.totalStock < 10) {
      const cat = await prisma.category.findFirst() || await prisma.category.create({
        data: { name: "General Medicine", slug: "general-medicine" },
      });
      product = await prisma.product.create({
        data: {
          name: "Panadol 500mg Tablets",
          slug: `panadol-test-${Date.now()}`,
          price: 50.00,
          sku: `SKU-TEST-${Date.now()}`,
          categoryId: cat.id,
          inventory: {
            create: { totalStock: 100 },
          },
          batches: {
            create: {
              batchNumber: `BATCH-${Date.now()}`,
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              purchasePrice: 35.00,
              sellingPrice: 50.00,
              quantity: 100,
              initialQuantity: 100,
            },
          },
        },
        include: { inventory: true, batches: true },
      });
    }

    console.log(`Using product: "${product.name}" (ID: ${product.id}) with total stock: ${product.inventory?.totalStock}`);

    // =========================================================================
    // TEST 1 — Checkout without address validation
    // =========================================================================
    console.log("\n--- TEST 1: Validation with missing delivery information ---");

    const invalidInputs = [
      { name: "Empty object", data: {} },
      { name: "Missing name", data: { customerPhone: "03001234567", deliveryAddress: "House 123", deliveryArea: "Johar Town", paymentMethod: "CASH_ON_DELIVERY" } },
      { name: "Missing phone", data: { customerName: "Ali", deliveryAddress: "House 123", deliveryArea: "Johar Town", paymentMethod: "CASH_ON_DELIVERY" } },
      { name: "Invalid phone format", data: { customerName: "Ali", customerPhone: "12345", deliveryAddress: "House 123", deliveryArea: "Johar Town", paymentMethod: "CASH_ON_DELIVERY" } },
      { name: "Missing delivery address", data: { customerName: "Ali", customerPhone: "03001234567", deliveryArea: "Johar Town", paymentMethod: "CASH_ON_DELIVERY" } },
      { name: "Too short address", data: { customerName: "Ali", customerPhone: "03001234567", deliveryAddress: "H1", deliveryArea: "Johar Town", paymentMethod: "CASH_ON_DELIVERY" } },
      { name: "Missing delivery area", data: { customerName: "Ali", customerPhone: "03001234567", deliveryAddress: "House 123, Street 5", paymentMethod: "CASH_ON_DELIVERY" } },
    ];

    for (const testCase of invalidInputs) {
      const parseResult = createOrderSchema.safeParse(testCase.data);
      assert(!parseResult.success, `Validation blocks: ${testCase.name}`);
    }

    // =========================================================================
    // TEST 2 — Valid checkout with full delivery information
    // =========================================================================
    console.log("\n--- TEST 2: Valid checkout and PostgreSQL persistence ---");

    // Clear cart and add 2 items for testUserA
    await clearUserCart(testUserA.id);
    await addItemToUserCart(testUserA.id, product.id, 2);

    const validOrderInput = {
      customerName: "Muhammad Nabeel",
      customerPhone: "03001234567",
      customerEmail: "nabeel@example.com",
      deliveryAddress: "House 123, Street 5, Model Town, Lahore",
      deliveryArea: "Model Town",
      deliveryNotes: "Please call before delivery",
      deliveryMethod: "HOME_DELIVERY" as const,
      paymentMethod: "CASH_ON_DELIVERY" as const,
    };

    const parsed = createOrderSchema.safeParse(validOrderInput);
    assert(parsed.success, "Valid delivery information passes schema validation");

    const initialInventory = await prisma.inventory.findUnique({ where: { productId: product.id } });
    const initialStock = initialInventory?.totalStock || 0;

    const createdOrder = await createOrder(testUserA.id, parsed.data!);
    assert(!!createdOrder.id, "Order created successfully", `Order ID: ${createdOrder.id}, #${createdOrder.orderNumber}`);
    assert(createdOrder.customerName === "Muhammad Nabeel", "Order has correct customerName");
    assert(createdOrder.customerPhone === "03001234567", "Order has correct customerPhone");
    assert(createdOrder.deliveryAddress === "House 123, Street 5, Model Town, Lahore", "Order has correct deliveryAddress");
    assert(createdOrder.deliveryArea === "Model Town", "Order has correct deliveryArea");
    assert(createdOrder.deliveryNotes === "Please call before delivery", "Order has correct deliveryNotes");

    // Verify direct PostgreSQL persistence
    const pgOrder = await prisma.order.findUnique({
      where: { id: createdOrder.id },
      include: { items: true },
    });

    assert(!!pgOrder, "Order exists in PostgreSQL");
    assert(pgOrder?.customerName === "Muhammad Nabeel", "PostgreSQL Order customerName matches");
    assert(pgOrder?.customerPhone === "03001234567", "PostgreSQL Order customerPhone matches");
    assert(pgOrder?.deliveryAddress === "House 123, Street 5, Model Town, Lahore", "PostgreSQL Order deliveryAddress matches");
    assert(pgOrder?.deliveryArea === "Model Town", "PostgreSQL Order deliveryArea matches");
    assert(pgOrder?.deliveryNotes === "Please call before delivery", "PostgreSQL Order deliveryNotes matches");
    assert(pgOrder?.items.length === 1 && pgOrder.items[0].quantity === 2, "PostgreSQL Order items stored accurately");

    // =========================================================================
    // TEST 3 — Admin receives order & sees complete delivery details
    // =========================================================================
    console.log("\n--- TEST 3: Admin receives order & delivery details ---");

    const adminOrdersResult = await getAdminOrders({ search: "Model Town" });
    const foundInAdminList = adminOrdersResult.orders.find((o) => o.id === createdOrder.id);
    assert(!!foundInAdminList, "Admin search by Area 'Model Town' finds the new order");
    assert(foundInAdminList?.deliveryArea === "Model Town", "Admin list contains deliveryArea");

    const adminOrderDetail = await getAdminOrderById(createdOrder.id);
    assert(!!adminOrderDetail, "Admin getAdminOrderById retrieves the order");
    assert(adminOrderDetail?.customerName === "Muhammad Nabeel", "Admin order detail shows customer name");
    assert(adminOrderDetail?.customerPhone === "03001234567", "Admin order detail shows customer phone");
    assert(adminOrderDetail?.deliveryAddress === "House 123, Street 5, Model Town, Lahore", "Admin order detail shows complete address");
    assert(adminOrderDetail?.deliveryArea === "Model Town", "Admin order detail shows area");
    assert(adminOrderDetail?.deliveryNotes === "Please call before delivery", "Admin order detail shows delivery notes");
    assert(adminOrderDetail?.items.length === 1, "Admin order detail shows medicines and quantities");

    // Test Admin quick status transition
    const updatedByAdmin = await updateAdminOrderStatus(createdOrder.id, {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      internalNotes: "Assigned to Rider Ahmad - Bike # 4412",
    });
    assert(updatedByAdmin.status === "CONFIRMED", "Admin successfully transitions status to CONFIRMED");
    assert(updatedByAdmin.internalNotes === "Assigned to Rider Ahmad - Bike # 4412", "Admin internal notes saved");

    // =========================================================================
    // TEST 4 — Customer order history
    // =========================================================================
    console.log("\n--- TEST 4: Customer Order History ---");

    const userAOrders = await getUserOrders(testUserA.id);
    const orderInHistory = userAOrders.find((o) => o.id === createdOrder.id);
    assert(!!orderInHistory, "Order appears in customer order history");
    assert(orderInHistory?.deliveryAddress === "House 123, Street 5, Model Town, Lahore", "Customer history shows deliveryAddress");
    assert(orderInHistory?.deliveryArea === "Model Town", "Customer history shows deliveryArea");
    assert(orderInHistory?.status === "CONFIRMED", "Customer history reflects updated CONFIRMED status");

    // =========================================================================
    // TEST 5 — Address change immutability after order
    // =========================================================================
    console.log("\n--- TEST 5: Order address immutability after profile change ---");

    // Save Address A in user profile
    const addressA = await prisma.address.create({
      data: {
        userId: testUserA.id,
        fullName: "Muhammad Nabeel",
        phone: "03001234567",
        addressLine1: "Address A - House 10, Model Town",
        area: "Model Town",
        city: "Lahore",
        isDefault: true,
      },
    });

    // Place Order with Address A
    await addItemToUserCart(testUserA.id, product.id, 1);
    const orderAddressA = await createOrder(testUserA.id, {
      customerName: "Muhammad Nabeel",
      customerPhone: "03001234567",
      shippingAddressId: addressA.id,
      deliveryAddress: "Address A - House 10, Model Town",
      deliveryArea: "Model Town",
      deliveryMethod: "HOME_DELIVERY",
      paymentMethod: "CASH_ON_DELIVERY",
    });

    // Now update user profile address to Address B
    await prisma.address.update({
      where: { id: addressA.id },
      data: {
        addressLine1: "Address B - House 99, DHA Phase 5",
        area: "DHA Phase 5",
      },
    });

    // Fetch order again
    const fetchedOrderA = await getOrderById(orderAddressA.id);
    assert(fetchedOrderA?.deliveryAddress === "Address A - House 10, Model Town", "Historical order retains Address A after profile update");
    assert(fetchedOrderA?.deliveryArea === "Model Town", "Historical order retains Area A after profile update");

    // =========================================================================
    // TEST 6 — Security & IDOR Authorization
    // =========================================================================
    console.log("\n--- TEST 6: Security and IDOR Protection ---");

    // Customer B tries to view Customer A's order
    const unauthorizedAccess = await getOrderById(createdOrder.id, testUserB.id);
    assert(unauthorizedAccess === null, "Customer B is blocked from viewing Customer A's order (IDOR Protection)");

    // Customer A accessing own order succeeds
    const authorizedAccess = await getOrderById(createdOrder.id, testUserA.id);
    assert(authorizedAccess !== null && authorizedAccess.id === createdOrder.id, "Customer A can view their own order");

    // =========================================================================
    // TEST 7 — Stock deduction behavior
    // =========================================================================
    console.log("\n--- TEST 7: Stock deduction and transaction recording ---");

    const updatedInventory = await prisma.inventory.findUnique({ where: { productId: product.id } });
    const expectedStock = initialStock - 2 - 1; // 2 from test 2, 1 from test 5
    assert(updatedInventory?.totalStock === expectedStock, `Stock accurately deducted from ${initialStock} to ${expectedStock}`);

    const saleTransactions = await prisma.stockTransaction.findMany({
      where: {
        productId: product.id,
        referenceId: createdOrder.orderNumber,
      },
    });
    assert(saleTransactions.length > 0, "StockTransaction record created with reference to order number");
    assert(saleTransactions[0].type === "SALE", "StockTransaction is of type SALE");
    assert(saleTransactions[0].quantity === -2, "StockTransaction deducted correct quantity of -2");

    // =========================================================================
    // TEST 8 — Historical Orders Functionality
    // =========================================================================
    console.log("\n--- TEST 8: Historical Orders Compatibility ---");

    const allAdminOrders = await getAllAdminOrdersRaw();
    assert(allAdminOrders.length >= 2, `Admin can retrieve all ${allAdminOrders.length} orders without errors`);

    console.log("\n==================================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution encountered an error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
