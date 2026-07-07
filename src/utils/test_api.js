import fetch from 'node-fetch';
import '../server.js'; // Starts the Express server in-process

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
let authCookie = null;
let testCategoryId = null;
let testRecordId = null;
let testColumnId = null;

async function runTests() {
  console.log('======================================================');
  console.log('🚀 STATISTIC PUBLIC VIEW - BACKEND API TEST SUITE 🚀');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`Testing: ${name.padEnd(50, '.')} `);
    try {
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log('❌ FAIL');
      console.error(`   -> Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Health Check
  await test('GET /health (Server Health Status)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const json = await res.json();
    if (res.status !== 200 || json.status !== 'ok') throw new Error('Health check returned non-ok status');
  });

  // 2. Auth - Guest check
  await test('GET /auth/me (Unauthenticated Guest)', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`);
    const json = await res.json();
    if (json.authenticated !== false) throw new Error('Expected unauthenticated state for guest');
  });

  // 3. Auth - Admin Login
  await test('POST /auth/login (Admin Login)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success || json.user.role !== 'admin') {
      throw new Error('Admin login failed or returned wrong role');
    }
    authCookie = res.headers.get('set-cookie');
    if (!authCookie) throw new Error('Did not receive session cookie');
  });

  // 4. Auth - Admin session check
  await test('GET /auth/me (Authenticated Admin Session)', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Cookie': authCookie }
    });
    const json = await res.json();
    if (!json.authenticated || json.user.username !== 'admin') {
      throw new Error('Session verification failed');
    }
  });

  // 5. Categories - List public categories
  await test('GET /categories (List Dummy Categories)', async () => {
    const res = await fetch(`${BASE_URL}/categories`);
    const json = await res.json();
    if (res.status !== 200 || !Array.isArray(json.data) || json.data.length < 2) {
      throw new Error(`Expected at least 2 seeded categories, got ${json.data?.length}`);
    }
  });

  // 6. Categories - Create test category
  await test('POST /categories (Admin Create Category)', async () => {
    const res = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ name: 'Automated Test Category', description: 'Temporary category for API test suite', icon: 'beaker', color_theme: 'rose' })
    });
    const json = await res.json();
    if (res.status !== 201 || !json.success || !json.data.id) {
      throw new Error('Failed to create category');
    }
    testCategoryId = json.data.id;
  });

  // 7. Columns - Create custom column
  await test('POST /columns (Admin Create Custom Column)', async () => {
    const res = await fetch(`${BASE_URL}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ category_id: testCategoryId, column_name: 'test_score', column_label: 'Test Score (%)', data_type: 'number', is_required: true, sort_order: 10 })
    });
    const json = await res.json();
    if (res.status !== 201 || !json.success || !json.data.id) {
      throw new Error('Failed to create custom column');
    }
    testColumnId = json.data.id;
  });

  // 8. Columns - List columns for category
  await test('GET /columns/:category_id (List Category Columns)', async () => {
    const res = await fetch(`${BASE_URL}/columns/${testCategoryId}`);
    const json = await res.json();
    if (res.status !== 200 || !Array.isArray(json.data) || json.data.length !== 1) {
      throw new Error('Failed to list columns or incorrect count');
    }
  });

  // 9. Records - Validation error check
  await test('POST /records (Schema Validation - Reject Missing Required Field)', async () => {
    const res = await fetch(`${BASE_URL}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ category_id: testCategoryId, data: {} })
    });
    const json = await res.json();
    if (res.status !== 400 || !json.details || !json.details[0].includes('required')) {
      throw new Error('Did not reject record missing required field as expected');
    }
  });

  // 10. Records - Create valid record
  await test('POST /records (Admin Create Valid JSON Record)', async () => {
    const res = await fetch(`${BASE_URL}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ category_id: testCategoryId, data: { test_score: 98.5 } })
    });
    const json = await res.json();
    if (res.status !== 201 || !json.success || !json.data.id) {
      throw new Error('Failed to create valid data record');
    }
    testRecordId = json.data.id;
  });

  // 11. Records - List paginated records
  await test('GET /records/:category_id (Paginated Record Retrieval)', async () => {
    const res = await fetch(`${BASE_URL}/records/${testCategoryId}?page=1&limit=10`);
    const json = await res.json();
    if (res.status !== 200 || json.pagination.total !== 1 || json.data[0].data.test_score !== 98.5) {
      throw new Error('Failed to retrieve paginated records or data mismatch');
    }
  });

  // 12. Charts - Upsert chart config
  await test('POST /charts/:category_id (Upsert Chart Config)', async () => {
    const res = await fetch(`${BASE_URL}/charts/${testCategoryId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ chart_type: 'bar', x_axis_column: 'test_score', y_axis_column: 'test_score', title: 'Automated Test Chart' })
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success || json.data.chart_type !== 'bar') {
      throw new Error('Failed to save chart configuration');
    }
  });

  // 13. Charts - Get chart config and pre-extracted data
  await test('GET /charts/:category_id (Extract Chart Data Engine)', async () => {
    const res = await fetch(`${BASE_URL}/charts/${testCategoryId}`);
    const json = await res.json();
    if (res.status !== 200 || !json.data.chartData || json.data.chartData.values[0] !== 98.5) {
      throw new Error('Failed to extract numeric values for chart visualization');
    }
  });

  // 14. Cleanup - Delete category (cascades)
  await test('DELETE /categories/:id (Cascade Delete Test Category)', async () => {
    const res = await fetch(`${BASE_URL}/categories/${testCategoryId}`, {
      method: 'DELETE',
      headers: { 'Cookie': authCookie }
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success) {
      throw new Error('Failed to delete test category');
    }
  });

  // 15. Auth - Logout
  await test('POST /auth/logout (Admin Logout)', async () => {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Cookie': authCookie }
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success) {
      throw new Error('Failed to logout');
    }
  });

  console.log('\n======================================================');
  console.log(`Test Summary: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Give server 500ms to boot up before running tests
setTimeout(() => {
  runTests().catch(err => {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  });
}, 500);
