/**
 * Admin Chart Customizer — Stage 5.6
 * Live-updating Chart.js preview configurator bound to sub_category_id
 */

import {
  getCategories, getColumns, getRecords,
  getChartConfig, saveChartConfig, showToast
} from './api-service.js';
import { renderChart, destroyChart } from './chart-handler.js';

let categoriesData = [];
let selectedCategoryId = null;
let selectedSubCategoryId = null;
let columnsData = [];
let recordsData = [];
let currentConfig = null;

// ── Init ──────────────────────────────────────────────
export async function initChartManager() {
  const root = document.getElementById('admin-charts-root');
  if (!root) return;
  root.innerHTML = renderChartShell();
  await loadCategoriesForCharts();
}

// ── Shell ─────────────────────────────────────────────
function renderChartShell() {
  return `
    <div class="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">Konfigurasi Chart</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Sesuaikan visualisasi grafik dan pemetaan kolom dengan pratinjau langsung</p>
      </div>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
        <select id="chart-category-selector" class="flex-1 sm:w-56 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer transition-all">
          <option value="">Memuat kategori...</option>
        </select>
        <select id="chart-subcategory-selector" disabled class="flex-1 sm:w-56 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer transition-all disabled:opacity-50">
          <option value="">Pilih Sub-Kategori...</option>
        </select>
      </div>
    </div>

    <div id="chart-workspace" class="hidden grid grid-cols-1 lg:grid-cols-12 gap-6 items-start fade-in">
      <!-- Left Column: Config Form -->
      <div class="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm">
        <h4 class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-emerald-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
          </svg>
          <span>Pengaturan Grafik</span>
        </h4>

        <form id="chart-config-form" class="space-y-4" onsubmit="return false;">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Judul Grafik</label>
            <input type="text" id="cfg-title" placeholder="Contoh: Grafik Data Statistik" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Tipe Visualisasi</label>
            <div class="grid grid-cols-3 gap-2" id="cfg-type-pills">
              <button type="button" data-type="bar" class="chart-type-pill py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                <span>Bar Chart</span>
              </button>
              <button type="button" data-type="line" class="chart-type-pill py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
                <span>Line Chart</span>
              </button>
              <button type="button" data-type="area" class="chart-type-pill py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125L9 8.25l4.5 4.5 7.5-6.75v12a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 18v-4.875z" /></svg>
                <span>Area Chart</span>
              </button>
              <button type="button" data-type="pie" class="chart-type-pill py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /></svg>
                <span>Pie Chart</span>
              </button>
              <button type="button" data-type="doughnut" class="chart-type-pill py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all col-span-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>
                <span>Doughnut Chart</span>
              </button>
            </div>
            <input type="hidden" id="cfg-type" value="bar">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Kolom Label (X-Axis)</label>
              <select id="cfg-x-col" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer">
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Kolom Nilai (Y-Axis)</label>
              <select id="cfg-y-col" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer">
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Tema Warna</label>
            <select id="cfg-palette" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer">
              <option value="emerald">Emerald Green (Dominan Hijau Kemenag)</option>
              <option value="indigo">Indigo Slate (Dominan Biru Elegan)</option>
              <option value="rose">Rose Crimson (Dominan Merah Cerah)</option>
              <option value="default">Multicolor Rainbow (Warna-Warni)</option>
            </select>
          </div>

          <div class="pt-3">
            <button type="button" id="btn-save-config" class="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              <span>Simpan Konfigurasi Chart</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Right Column: Live Preview -->
      <div class="lg:col-span-7 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between" style="min-height: 480px;">
        <div class="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/60 mb-4">
          <div class="flex items-center gap-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">Live Preview Visualisasi</span>
          </div>
          <span class="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md" id="preview-data-status">Memuat data...</span>
        </div>

        <div class="flex-1 relative flex items-center justify-center min-h-[350px]">
          <canvas id="admin-chart-preview-canvas" class="w-full h-full max-h-[380px]"></canvas>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-400 text-center">
          Pratinjau ini diperbarui secara real-time berdasarkan data record dan opsi yang dipilih.
        </div>
      </div>
    </div>

    <div id="chart-empty-state" class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-12 text-center text-slate-400">
      <p class="text-base">Silakan pilih kategori dan sub-kategori di atas untuk mulai mengatur chart</p>
    </div>
  `;
}

// ── Load Categories ───────────────────────────────────
async function loadCategoriesForCharts() {
  const catSel = document.getElementById('chart-category-selector');
  const subSel = document.getElementById('chart-subcategory-selector');
  if (!catSel || !subSel) return;

  try {
    const res = await getCategories();
    categoriesData = res.data || [];

    if (categoriesData.length === 0) {
      catSel.innerHTML = '<option value="">Belum ada kategori</option>';
      return;
    }

    catSel.innerHTML = '<option value="">— Pilih Kategori —</option>' +
      categoriesData.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    catSel.addEventListener('change', () => {
      selectedCategoryId = catSel.value;
      selectedSubCategoryId = null;
      document.getElementById('chart-workspace')?.classList.add('hidden');
      document.getElementById('chart-empty-state')?.classList.remove('hidden');
      destroyChart();

      const cat = categoriesData.find(c => String(c.id) === String(selectedCategoryId));
      const subs = cat?.sub_categories || [];

      if (subs.length === 0) {
        subSel.innerHTML = '<option value="">(Belum ada sub-kategori)</option>';
        subSel.disabled = true;
      } else {
        subSel.innerHTML = '<option value="">— Pilih Sub-Kategori —</option>' +
          subs.map(s => `<option value="${s.id}">${s.title}</option>`).join('');
        subSel.disabled = false;
      }
    });

    subSel.addEventListener('change', async () => {
      selectedSubCategoryId = subSel.value;
      if (!selectedSubCategoryId) {
        document.getElementById('chart-workspace')?.classList.add('hidden');
        document.getElementById('chart-empty-state')?.classList.remove('hidden');
        destroyChart();
        return;
      }
      await loadSubCategoryWorkspace(selectedSubCategoryId);
    });
  } catch (err) {
    console.error('[ChartManager] Load Categories Error:', err);
    showToast('Gagal memuat kategori', 'error');
  }
}

// ── Load Workspace ────────────────────────────────────
async function loadSubCategoryWorkspace(subCatId) {
  const ws = document.getElementById('chart-workspace');
  const empty = document.getElementById('chart-empty-state');
  if (!ws || !empty) return;

  try {
    // Fetch columns, records, and current chart config in parallel
    const [colsRes, recsRes, cfgRes] = await Promise.all([
      getColumns(subCatId),
      getRecords(subCatId, 1, 200),
      getChartConfig(subCatId)
    ]);

    columnsData = colsRes.data || [];
    recordsData = recsRes.data || [];
    currentConfig = cfgRes.data?.config || null;

    if (columnsData.length === 0) {
      empty.innerHTML = `<p class="text-base text-amber-500 font-medium">Sub-kategori ini belum memiliki skema kolom. Silakan tambahkan kolom di tab Skema Kolom terlebih dahulu.</p>`;
      ws.classList.add('hidden');
      empty.classList.remove('hidden');
      destroyChart();
      return;
    }

    ws.classList.remove('hidden');
    empty.classList.add('hidden');

    populateConfigForm(subCatId);
    bindConfigFormEvents(subCatId);
    updateLivePreview();
  } catch (err) {
    console.error('[ChartManager] Load Workspace Error:', err);
    showToast('Gagal memuat konfigurasi grafik', 'error');
  }
}

// ── Populate Form ─────────────────────────────────────
function populateConfigForm(subCatId) {
  const titleInput = document.getElementById('cfg-title');
  const typeInput = document.getElementById('cfg-type');
  const xSelect = document.getElementById('cfg-x-col');
  const ySelect = document.getElementById('cfg-y-col');
  const paletteSelect = document.getElementById('cfg-palette');

  // Sub-category title fallback
  let defaultTitle = 'Grafik Statistik';
  const cat = categoriesData.find(c => String(c.id) === String(selectedCategoryId));
  const sub = cat?.sub_categories?.find(s => String(s.id) === String(subCatId));
  if (sub) defaultTitle = `Grafik ${sub.title}`;

  titleInput.value = currentConfig?.title || defaultTitle;
  typeInput.value = currentConfig?.chart_type || 'bar';
  paletteSelect.value = currentConfig?.palette || 'emerald';

  // Populate column selectors
  xSelect.innerHTML = columnsData.map(c => 
    `<option value="${c.column_name}" ${currentConfig?.x_axis_column === c.column_name ? 'selected' : ''}>${c.column_label}</option>`
  ).join('');

  // For Y column, prioritize numbers but allow all
  ySelect.innerHTML = columnsData.map(c => 
    `<option value="${c.column_name}" ${currentConfig?.y_axis_column === c.column_name ? 'selected' : ''}>${c.column_label} (${c.data_type})</option>`
  ).join('');

  // If no currentConfig y_axis_column, auto select first number column if available
  if (!currentConfig?.y_axis_column) {
    const numCol = columnsData.find(c => c.data_type === 'number');
    if (numCol && ySelect.querySelector(`option[value="${numCol.column_name}"]`)) {
      ySelect.value = numCol.column_name;
    }
  }

  updateTypePillsUI(typeInput.value);
}

// ── Bind Events ───────────────────────────────────────
function bindConfigFormEvents(subCatId) {
  const titleInput = document.getElementById('cfg-title');
  const typeInput = document.getElementById('cfg-type');
  const xSelect = document.getElementById('cfg-x-col');
  const ySelect = document.getElementById('cfg-y-col');
  const paletteSelect = document.getElementById('cfg-palette');
  const saveBtn = document.getElementById('btn-save-config');
  const pills = document.querySelectorAll('.chart-type-pill');

  titleInput.oninput = updateLivePreview;
  xSelect.onchange = updateLivePreview;
  ySelect.onchange = updateLivePreview;
  paletteSelect.onchange = updateLivePreview;

  pills.forEach(pill => {
    pill.onclick = () => {
      const type = pill.getAttribute('data-type');
      typeInput.value = type;
      updateTypePillsUI(type);
      updateLivePreview();
    };
  });

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>Menyimpan...</span>`;
    try {
      const payload = {
        title: titleInput.value.trim() || 'Grafik Statistik',
        chart_type: typeInput.value || 'bar',
        x_axis_column: xSelect.value,
        y_axis_column: ySelect.value,
        palette: paletteSelect.value || 'emerald'
      };
      await saveChartConfig(subCatId, payload);
      showToast('Konfigurasi chart berhasil disimpan!', 'success');
    } catch (err) {
      console.error('[ChartManager] Save Error:', err);
      showToast('Gagal menyimpan konfigurasi', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        <span>Simpan Konfigurasi Chart</span>
      `;
    }
  };
}

// ── Type Pills UI ─────────────────────────────────────
function updateTypePillsUI(activeType) {
  document.querySelectorAll('.chart-type-pill').forEach(pill => {
    if (pill.getAttribute('data-type') === activeType) {
      pill.className = 'chart-type-pill py-2.5 px-3 rounded-xl border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold flex flex-col items-center gap-1 shadow-sm transition-all cursor-pointer';
    } else {
      pill.className = 'chart-type-pill py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center gap-1 transition-all cursor-pointer';
    }
  });
}

// ── Live Preview Updater ──────────────────────────────
function updateLivePreview() {
  const title = document.getElementById('cfg-title')?.value || 'Grafik Statistik';
  const type = document.getElementById('cfg-type')?.value || 'bar';
  const xCol = document.getElementById('cfg-x-col')?.value;
  const yCol = document.getElementById('cfg-y-col')?.value;
  const palette = document.getElementById('cfg-palette')?.value || 'emerald';
  const statusEl = document.getElementById('preview-data-status');

  let labels = [];
  let values = [];

  if (recordsData && recordsData.length > 0 && xCol && yCol) {
    recordsData.forEach(rec => {
      const parsed = typeof rec.data === 'string' ? JSON.parse(rec.data) : (rec.data || {});
      const xVal = parsed[xCol] !== undefined && parsed[xCol] !== null ? String(parsed[xCol]) : `ID #${rec.id}`;
      let yVal = Number(parsed[yCol]);
      if (isNaN(yVal)) yVal = 0;
      labels.push(xVal);
      values.push(yVal);
    });
    if (statusEl) statusEl.textContent = `${recordsData.length} data record`;
  } else {
    // Dummy preview data when no records exist
    labels = ['Contoh A', 'Contoh B', 'Contoh C', 'Contoh D', 'Contoh E'];
    values = [45, 80, 65, 110, 95];
    if (statusEl) statusEl.textContent = 'Data contoh (Belum ada record)';
  }

  const config = { chart_type: type, title };
  renderChart('admin-chart-preview-canvas', config, { labels, values }, palette);
}
