// Comprehensive Phase 6 Test Script
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING PHASE 6 VERIFICATION SUITE ===\n');

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

  // Helper for cookies
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

  // 1. Setup users
  console.log('--- Step 1: User Authentication Setup ---');
  const user1Email = `rx_user_${Date.now()}@example.com`;
  const user2Email = `rx_other_${Date.now()}@example.com`;
  const password = 'Password123!';

  // Register User 1
  const reg1Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ahmad Khan', email: user1Email, password, confirmPassword: password, phone: '03001234567' }),
  });
  const reg1Data = await reg1Res.json();
  assert(reg1Res.status === 201 || reg1Res.status === 200, 'User 1 registered successfully');
  const user1Cookie = extractCookies(reg1Res);

  // Register User 2 (Attacker/Separate account)
  const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Other User', email: user2Email, password, confirmPassword: password, phone: '03007654321' }),
  });
  const reg2Data = await reg2Res.json();
  assert(reg2Res.status === 201 || reg2Res.status === 200, 'User 2 registered successfully');
  const user2Cookie = extractCookies(reg2Res);

  // Admin login for pharmacist reviews
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrPhone: 'admin@saadmedicalstore.com',
      password: 'admin123',
      rememberMe: true,
    }),
  });
  const adminCookie = extractCookies(adminLoginRes);

  // 2. Unauthenticated Upload Check
  console.log('\n--- Step 2: Unauthenticated Upload Protection ---');
  const unauthFormData = new FormData();
  unauthFormData.append('file', new Blob(['fake content'], { type: 'image/jpeg' }), 'test.jpg');
  unauthFormData.append('deliveryAddress', 'House 14, Lahore');
  unauthFormData.append('notes', 'Need this urgently');

  const unauthRes = await fetch(`${BASE_URL}/api/prescriptions`, {
    method: 'POST',
    body: unauthFormData,
  });
  assert(unauthRes.status === 401, `Unauthenticated upload blocked with 401 (got ${unauthRes.status})`);

  // 3. Invalid File Type Validation
  console.log('\n--- Step 3: Invalid File Type Validation ---');
  const invalidTypeFormData = new FormData();
  invalidTypeFormData.append('file', new Blob(['malicious payload'], { type: 'application/x-msdownload' }), 'malware.exe');
  invalidTypeFormData.append('deliveryAddress', 'House 14, Lahore');
  invalidTypeFormData.append('notes', 'Testing invalid type');

  const invalidTypeRes = await fetch(`${BASE_URL}/api/prescriptions`, {
    method: 'POST',
    headers: { Cookie: user1Cookie },
    body: invalidTypeFormData,
  });
  assert(invalidTypeRes.status === 400, `Invalid file type rejected with 400 (got ${invalidTypeRes.status})`);
  const invalidTypeData = await invalidTypeRes.json();
  assert(
    invalidTypeData.error?.toLowerCase().includes('supported') ||
    invalidTypeData.error?.toLowerCase().includes('pdf') ||
    invalidTypeData.error?.toLowerCase().includes('unsupported'),
    `Error message mentions supported formats: "${invalidTypeData.error}"`
  );

  // 4. Missing File Validation
  console.log('\n--- Step 4: Missing File Validation ---');
  const missingFileFormData = new FormData();
  missingFileFormData.append('deliveryAddress', 'House 14, Lahore');
  missingFileFormData.append('notes', 'No file attached');
  const missingFileRes = await fetch(`${BASE_URL}/api/prescriptions`, {
    method: 'POST',
    headers: { Cookie: user1Cookie },
    body: missingFileFormData,
  });
  assert(missingFileRes.status === 400, `Missing file rejected with 400 (got ${missingFileRes.status})`);

  // 5. Valid JPEG Upload
  console.log('\n--- Step 5: Valid JPEG Image Prescription Upload ---');
  const validJpegBlob = new Blob([Buffer.from('fake-jpeg-image-bytes-saad-medical')], { type: 'image/jpeg' });
  const validJpegFormData = new FormData();
  validJpegFormData.append('file', validJpegBlob, 'dr_tariq_prescription.jpg');
  validJpegFormData.append('notes', 'Please provide Panadol Extra & Augmentin 625mg');
  validJpegFormData.append('deliveryAddress', 'House 14-B, Street 3, Rajgarh Road, Lahore');

  const upload1Res = await fetch(`${BASE_URL}/api/prescriptions`, {
    method: 'POST',
    headers: { Cookie: user1Cookie },
    body: validJpegFormData,
  });
  const upload1Data = await upload1Res.json();
  assert(upload1Res.status === 201, `Valid JPEG upload successful (status 201)`);
  assert(upload1Data.prescription?.prescriptionNumber?.startsWith('RX-'), `Generated prescription number: ${upload1Data.prescription?.prescriptionNumber}`);
  assert(upload1Data.prescription?.status === 'PENDING', `Initial status is PENDING`);
  assert(upload1Data.prescription?.fileName === 'dr_tariq_prescription.jpg', `Filename preserved accurately`);

  const prescription1Id = upload1Data.prescription?.id;

  // 6. Valid PDF Upload
  console.log('\n--- Step 6: Valid PDF Prescription Upload ---');
  const validPdfBlob = new Blob([Buffer.from('%PDF-1.4 simulated pdf content')], { type: 'application/pdf' });
  const validPdfFormData = new FormData();
  validPdfFormData.append('file', validPdfBlob, 'shaukat_khanum_rx.pdf');
  validPdfFormData.append('deliveryAddress', 'House 14-B, Street 3, Rajgarh Road, Lahore');
  validPdfFormData.append('notes', 'Monthly repeat prescription for cardiology');

  const upload2Res = await fetch(`${BASE_URL}/api/prescriptions`, {
    method: 'POST',
    headers: { Cookie: user1Cookie },
    body: validPdfFormData,
  });
  const upload2Data = await upload2Res.json();
  assert(upload2Res.status === 201, `Valid PDF upload successful (status 201)`);
  assert(upload2Data.prescription?.prescriptionNumber?.startsWith('RX-'), `Generated prescription number: ${upload2Data.prescription?.prescriptionNumber}`);
  assert(upload2Data.prescription?.fileType === 'application/pdf', `File type is application/pdf`);

  // 7. Get Customer Prescriptions List
  console.log('\n--- Step 7: Customer Prescription History List ---');
  const listRes = await fetch(`${BASE_URL}/api/prescriptions`, {
    headers: { Cookie: user1Cookie },
  });
  const listData = await listRes.json();
  assert(listRes.status === 200, `List prescriptions returned 200`);
  assert(listData.prescriptions?.length >= 2, `Found ${listData.prescriptions?.length} prescriptions for User 1`);

  // 8. Get Prescription Detail as Owner
  console.log('\n--- Step 8: Prescription Detail as Owner ---');
  const detailRes = await fetch(`${BASE_URL}/api/prescriptions/${prescription1Id}`, {
    headers: { Cookie: user1Cookie },
  });
  const detailData = await detailRes.json();
  assert(detailRes.status === 200, `Detail returned 200 for owner`);
  assert(detailData.prescription?.id === prescription1Id, `Returned correct prescription ID`);
  assert(detailData.prescription?.deliveryAddress?.includes('Lahore'), `Delivery address snapshot preserved: "${detailData.prescription?.deliveryAddress}"`);

  // 9. Unauthorized Access to Another User's Prescription
  console.log('\n--- Step 9: Unauthorized Ownership Protection ---');
  const unauthorizedDetailRes = await fetch(`${BASE_URL}/api/prescriptions/${prescription1Id}`, {
    headers: { Cookie: user2Cookie },
  });
  assert(unauthorizedDetailRes.status === 403, `User 2 blocked from User 1 prescription with 403 Forbidden (got ${unauthorizedDetailRes.status})`);

  // 10. Secure File Streaming
  console.log('\n--- Step 10: Secure File Access Streaming ---');
  const fileStreamRes = await fetch(`${BASE_URL}/api/prescriptions/${prescription1Id}/file`, {
    headers: { Cookie: user1Cookie },
  });
  assert(fileStreamRes.status === 200, `File download returned 200 for owner`);
  assert(fileStreamRes.headers.get('content-type')?.includes('image/jpeg'), `Content-Type header correct: ${fileStreamRes.headers.get('content-type')}`);
  assert(fileStreamRes.headers.get('x-content-type-options') === 'nosniff', `X-Content-Type-Options is nosniff`);
  const fileContent = await fileStreamRes.text();
  assert(fileContent === 'fake-jpeg-image-bytes-saad-medical', `File binary content streamed accurately`);

  // 11. Unauthorized File Access
  console.log('\n--- Step 11: Unauthorized File Access Protection ---');
  const unauthFileRes = await fetch(`${BASE_URL}/api/prescriptions/${prescription1Id}/file`, {
    headers: { Cookie: user2Cookie },
  });
  assert(unauthFileRes.status === 403, `User 2 blocked from User 1 file with 403 (got ${unauthFileRes.status})`);

  const anonFileRes = await fetch(`${BASE_URL}/api/prescriptions/${prescription1Id}/file`);
  assert(anonFileRes.status === 401, `Anonymous user blocked from file with 401 (got ${anonFileRes.status})`);

  // 12. Status Transitions & Review Workflow
  console.log('\n--- Step 12: Review Workflow & Status Transitions ---');
  
  // Transition 1: PENDING -> UNDER_REVIEW
  const transition1Res = await fetch(`${BASE_URL}/api/prescriptions/${prescription1Id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'UNDER_REVIEW' }),
  });
  const transition1Data = await transition1Res.json();
  assert(transition1Res.status === 200, `Transition to UNDER_REVIEW succeeded`);
  assert(transition1Data.prescription?.status === 'UNDER_REVIEW', `Status updated to UNDER_REVIEW`);

  // Transition 2: UNDER_REVIEW -> NEEDS_CLARIFICATION
  const clarificationMessage = 'Doctor signature is blurred. Please upload a clear photo of the lower section.';
  const transition2Res = await fetch(`${BASE_URL}/api/prescriptions/${prescription1Id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'NEEDS_CLARIFICATION', rejectionReason: clarificationMessage }),
  });
  const transition2Data = await transition2Res.json();
  assert(transition2Res.status === 200, `Transition to NEEDS_CLARIFICATION succeeded`);
  assert(transition2Data.prescription?.status === 'NEEDS_CLARIFICATION', `Status updated to NEEDS_CLARIFICATION`);
  assert(transition2Data.prescription?.rejectionReason === clarificationMessage, `Clarification message stored`);

  // Customer Replacement File Upload
  console.log('\n--- Step 13: Customer Replacement File Upload ---');
  const replaceFormData = new FormData();
  replaceFormData.append('file', new Blob([Buffer.from('clearer-prescription-photo-v2')], { type: 'image/jpeg' }), 'dr_tariq_prescription_clear.jpg');

  const replaceRes = await fetch(`${BASE_URL}/api/prescriptions/${prescription1Id}`, {
    method: 'PATCH',
    headers: { Cookie: user1Cookie },
    body: replaceFormData,
  });
  const replaceData = await replaceRes.json();
  assert(replaceRes.status === 200, `Replacement file upload succeeded`);
  assert(replaceData.prescription?.status === 'UNDER_REVIEW', `Status automatically reset to UNDER_REVIEW upon file replacement (got ${replaceData.prescription?.status})`);
  assert(replaceData.prescription?.fileName === 'dr_tariq_prescription_clear.jpg', `New filename updated`);

  // Transition 3: UNDER_REVIEW -> APPROVED
  console.log('\n--- Step 14: Final Approval & Completion ---');
  const transition3Res = await fetch(`${BASE_URL}/api/prescriptions/${prescription1Id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'APPROVED', adminNotes: 'Verified with Dr. Tariq clinic.' }),
  });
  const transition3Data = await transition3Res.json();
  assert(transition3Res.status === 200, `Transition to APPROVED succeeded`);
  assert(transition3Data.prescription?.status === 'APPROVED', `Status updated to APPROVED`);

  // Transition 4: APPROVED -> COMPLETED
  const transition4Res = await fetch(`${BASE_URL}/api/prescriptions/${prescription1Id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'COMPLETED' }),
  });
  const transition4Data = await transition4Res.json();
  assert(transition4Res.status === 200, `Transition to COMPLETED succeeded`);
  assert(transition4Data.prescription?.status === 'COMPLETED', `Status updated to COMPLETED`);

  // Transition 5: Invalid transition test (COMPLETED -> PENDING)
  const invalidTransitionRes = await fetch(`${BASE_URL}/api/prescriptions/${prescription1Id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'PENDING' }),
  });
  assert(invalidTransitionRes.status === 400, `Invalid transition COMPLETED -> PENDING rejected with 400 (got ${invalidTransitionRes.status})`);

  // 15. Check Storage Isolation
  console.log('\n--- Step 15: Private Storage Architecture Validation ---');
  const publicPathCheck = fs.existsSync(path.join(process.cwd(), 'public', 'prescriptions'));
  assert(!publicPathCheck, `Public prescriptions folder DOES NOT exist in public/ (Private isolation verified)`);

  const privatePathCheck = fs.existsSync(path.join(process.cwd(), 'private_storage', 'prescriptions'));
  assert(privatePathCheck, `Private storage folder exists outside public/ directory`);

  console.log('\n========================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
