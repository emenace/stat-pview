import fetch from 'node-fetch';

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

let adminCookie = null;
let userCookie = null;
let testCategoryId = null;
let testSubCategoryId = null;
const testRecordIds = [];

async function runE2ETests() {
  console.log('========================================================================');
  console.log('🚀 STATISTIC PUBLIC VIEW - STAGE 6.2 E2E ROLE & WORKFLOW TEST SUITE 🚀');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`Testing: ${name.padEnd(65, '.')} `);
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

  // Check server readiness
  await test('0. Server Readiness Check (GET /api/health)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const json = await res.json();
    if (res.status !== 200 || json.status !== 'ok') {
      throw new Error('Server health check failed');
    }
  });

  // ========================================================================
  // PART 1: ROLE SECURITY & AUTHORIZATION TESTING
  // ========================================================================
  console.log('\n--- PART 1: ROLE SECURITY TESTING (Unauthenticated & Standard User) ---');

  await test('1.1 Unauthenticated Guest POST /api/records -> 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sub_category_id: 1, data: { test: true } })
    });
    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized, got HTTP ${res.status}`);
    }
  });

  await test('1.2 Unauthenticated Guest PUT /api/records/999 -> 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/records/999`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { test: true } })
    });
    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized, got HTTP ${res.status}`);
    }
  });

  await test('1.3 Unauthenticated Guest DELETE /api/records/999 -> 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/records/999`, {
      method: 'DELETE'
    });
    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized, got HTTP ${res.status}`);
    }
  });

  await test('1.4 Standard User Login (role: user)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user', password: 'user123' })
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success || json.user.role !== 'user') {
      throw new Error('Standard user login failed');
    }
    userCookie = res.headers.get('set-cookie');
    if (!userCookie) throw new Error('Did not receive cookie for standard user');
  });

  await test('1.5 Standard User POST /api/records -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ sub_category_id: 1, data: { test: true } })
    });
    if (res.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden, got HTTP ${res.status}`);
    }
  });

  await test('1.6 Standard User PUT /api/records/999 -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/records/999`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ data: { test: true } })
    });
    if (res.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden, got HTTP ${res.status}`);
    }
  });

  await test('1.7 Standard User DELETE /api/records/999 -> 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/records/999`, {
      method: 'DELETE',
      headers: { 'Cookie': userCookie }
    });
    if (res.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden, got HTTP ${res.status}`);
    }
  });

  // ========================================================================
  // PART 2: COMPLETE ADMIN WORKFLOW & INSTANT DASHBOARD REFLECTION
  // ========================================================================
  console.log('\n--- PART 2: COMPLETE ADMIN WORKFLOW & INSTANT DASHBOARD REFLECTION ---');

  await test('2.1 Admin Login (role: admin)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success || json.user.role !== 'admin') {
      throw new Error('Admin login failed');
    }
    adminCookie = res.headers.get('set-cookie');
    if (!adminCookie) throw new Error('Did not receive cookie for admin user');
  });

  await test('2.2 Admin Creates Top-Level Category', async () => {
    const res = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({
        name: 'Statistik Transportasi Publik 2026',
        description: 'Data kinerja angkutan massal perkotaan',
        icon: 'truck',
        color_theme: 'emerald'
      })
    });
    const json = await res.json();
    if (res.status !== 201 || !json.success || !json.data.id) {
      throw new Error('Failed to create top-level category');
    }
    testCategoryId = json.data.id;
  });

  await test('2.3 Admin Creates Sub-Category', async () => {
    const res = await fetch(`${BASE_URL}/subcategories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({
        category_id: testCategoryId,
        name: 'Armada Bus Kota 2026',
        description: 'Statistik rute dan rata-rata penumpang harian Bus Kota Metro'
      })
    });
    const json = await res.json();
    if (res.status !== 201 || !json.success || !json.data.id) {
      throw new Error('Failed to create sub-category');
    }
    testSubCategoryId = json.data.id;
  });

  await test('2.4 Admin Defines 4 Custom Columns for Sub-Category', async () => {
    const columnsToCreate = [
      { column_name: 'route_name', column_label: 'Nama Rute Bus', data_type: 'text', is_required: true, sort_order: 1 },
      { column_name: 'fleet_count', column_label: 'Jumlah Armada (Unit)', data_type: 'number', is_required: true, sort_order: 2 },
      { column_name: 'daily_passengers', column_label: 'Rata-rata Penumpang Harian', data_type: 'number', is_required: true, sort_order: 3 },
      { column_name: 'active_status', column_label: 'Status Operasional Aktif', data_type: 'boolean', is_required: false, sort_order: 4 }
    ];

    for (const col of columnsToCreate) {
      const res = await fetch(`${BASE_URL}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({
          sub_category_id: testSubCategoryId,
          ...col
        })
      });
      const json = await res.json();
      if (res.status !== 201 || !json.success) {
        throw new Error(`Failed to create column ${col.column_name}: ${json.error}`);
      }
    }
  });

  await test('2.5 Admin Inserts 10 Realistic Data Records', async () => {
    const sampleBusRoutes = [
      { route_name: 'Koridor 1: Terminal Pusat - Pasar Kota', fleet_count: 24, daily_passengers: 4850, active_status: true },
      { route_name: 'Koridor 2: Stasiun Metro - Kampus Utama', fleet_count: 30, daily_passengers: 6420, active_status: true },
      { route_name: 'Koridor 3: Alun-Alun - RSUD Metro', fleet_count: 18, daily_passengers: 3210, active_status: true },
      { route_name: 'Koridor 4: Terminal Utara - Kawasan Industri', fleet_count: 22, daily_passengers: 4100, active_status: true },
      { route_name: 'Koridor 5: Bandara Perintis - Pusat Grosir', fleet_count: 15, daily_passengers: 2890, active_status: true },
      { route_name: 'Koridor 6: Lingkar Luar Timur - Pelabuhan', fleet_count: 28, daily_passengers: 5340, active_status: true },
      { route_name: 'Koridor 7: Kampus Selatan - Perkantoran Pemda', fleet_count: 20, daily_passengers: 3950, active_status: true },
      { route_name: 'Koridor 8: Taman Kota - Gelora Olahraga', fleet_count: 16, daily_passengers: 2750, active_status: true },
      { route_name: 'Koridor 9: Perumahan Indah - Terminal Selatan', fleet_count: 26, daily_passengers: 5120, active_status: true },
      { route_name: 'Koridor 10: Kawasan Ekonomi Khusus - Sentra Bisnis', fleet_count: 32, daily_passengers: 7150, active_status: true }
    ];

    for (const recordData of sampleBusRoutes) {
      const res = await fetch(`${BASE_URL}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({
          sub_category_id: testSubCategoryId,
          data: recordData
        })
      });
      const json = await res.json();
      if (res.status !== 201 || !json.success || !json.data.id) {
        throw new Error(`Failed to insert record: ${JSON.stringify(json.error || json.details)}`);
      }
      testRecordIds.push(json.data.id);
    }

    if (testRecordIds.length !== 10) {
      throw new Error(`Expected 10 inserted records, got ${testRecordIds.length}`);
    }
  });

  await test('2.6 Admin Configures Bar Chart for Sub-Category', async () => {
    const res = await fetch(`${BASE_URL}/charts/${testSubCategoryId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({
        chart_type: 'bar',
        x_axis_column: 'route_name',
        y_axis_column: 'daily_passengers',
        title: 'Rata-rata Penumpang Harian Rute Bus Kota'
      })
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success || json.data.chart_type !== 'bar') {
      throw new Error('Failed to configure bar chart');
    }
  });

  await test('2.7 Verify Public Dashboard Category & Subcategory Reflection', async () => {
    const catRes = await fetch(`${BASE_URL}/categories`);
    const catJson = await catRes.json();
    const foundCat = catJson.data.find(c => c.id === testCategoryId);
    if (!foundCat) throw new Error('Newly created top-level category not reflected on public endpoint');

    const subRes = await fetch(`${BASE_URL}/subcategories/${testCategoryId}`);
    const subJson = await subRes.json();
    const foundSub = subJson.data.find(s => s.id === testSubCategoryId);
    if (!foundSub) throw new Error('Newly created subcategory not reflected on public endpoint');
  });

  await test('2.8 Verify Public Dashboard Columns & Records Reflection (10 Rows)', async () => {
    const colRes = await fetch(`${BASE_URL}/columns/${testSubCategoryId}`);
    const colJson = await colRes.json();
    if (colJson.data.length !== 4) {
      throw new Error(`Expected 4 custom columns, found ${colJson.data.length}`);
    }

    const recRes = await fetch(`${BASE_URL}/records/${testSubCategoryId}?page=1&limit=20`);
    const recJson = await recRes.json();
    if (recJson.pagination.total !== 10 || recJson.data.length !== 10) {
      throw new Error(`Expected 10 public records, got total=${recJson.pagination.total}, count=${recJson.data.length}`);
    }
  });

  await test('2.9 Verify Public Dashboard Chart Data Reflection (X & Y Extracted)', async () => {
    const chartRes = await fetch(`${BASE_URL}/charts/${testSubCategoryId}`);
    const chartJson = await chartRes.json();
    if (chartJson.data.config.chart_type !== 'bar') {
      throw new Error(`Expected chart_type 'bar', got ${chartJson.data.config.chart_type}`);
    }
    const chartData = chartJson.data.chartData;
    if (!chartData || !chartData.labels || chartData.labels.length !== 10 || chartData.values.length !== 10) {
      throw new Error('Chart data labels/values not extracted correctly for the 10 records');
    }
    // Verify first passenger value is 4850
    if (chartData.values[0] !== 4850) {
      throw new Error(`Expected first route passengers value 4850, got ${chartData.values[0]}`);
    }
  });

  await test('2.10 Clean Up Test Category (Verify Cascading Teardown)', async () => {
    const res = await fetch(`${BASE_URL}/categories/${testCategoryId}`, {
      method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success) {
      throw new Error('Failed to delete top-level category during cleanup');
    }

    // Verify subcategory and records were deleted
    const subRes = await fetch(`${BASE_URL}/subcategories/${testCategoryId}`);
    const subJson = await subRes.json();
    if (subJson.data && subJson.data.length > 0) {
      throw new Error('Subcategory was not cascaded deleted');
    }
  });

  console.log('\n========================================================================');
  console.log(`E2E Test Summary: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2ETests().catch(err => {
  console.error('Fatal E2E execution error:', err);
  process.exit(1);
});
