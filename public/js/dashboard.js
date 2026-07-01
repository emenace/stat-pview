/**
 * Dashboard Orchestrator — Connects UI to API, Chart, and Table modules
 * Main entry point for the public dashboard (index.html)
 */

import { getCategories, getColumns, getRecords, getChartConfig, authMe, showToast } from './api-service.js';
import { renderChart, destroyChart } from './chart-handler.js';
import { renderTable, destroyTable } from './table-handler.js';

let categories = [];
let activeCategoryId = null;

// ── Initialization ────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initDarkMode();
  initNavListeners();
  await checkAuth();
  await loadCategories();
});

// ── Dark Mode Toggle ──────────────────────────────────
function initDarkMode() {
  const toggle = document.getElementById('dark-mode-toggle');
  const html = document.documentElement;

  // Check local storage or system preference
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      html.classList.toggle('dark');
      localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
      updateDarkModeIcon();
      // Re-render active chart/table with new theme colors
      if (activeCategoryId && !document.getElementById('statistics-view-section').classList.contains('hidden')) {
        loadCategoryData(activeCategoryId);
      }
    });
    updateDarkModeIcon();
  }
}

function updateDarkModeIcon() {
  const icon = document.getElementById('dark-mode-icon');
  if (!icon) return;
  const isDark = document.documentElement.classList.contains('dark');
  icon.innerHTML = isDark
    ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5 text-amber-400"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5 text-slate-600"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>';
}

// ── Navigation & View Switching ───────────────────────
function initNavListeners() {
  const brandLink = document.getElementById('brand-link');
  const backBtn = document.getElementById('btn-back-categories');

  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      showCategoryGridView();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showCategoryGridView();
    });
  }
}

function showCategoryGridView() {
  activeCategoryId = null;
  const gridSection = document.getElementById('category-grid-section');
  const statsSection = document.getElementById('statistics-view-section');

  if (statsSection) statsSection.classList.add('hidden');
  if (gridSection) gridSection.classList.remove('hidden');

  destroyChart();
  destroyTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStatisticsView() {
  const gridSection = document.getElementById('category-grid-section');
  const statsSection = document.getElementById('statistics-view-section');

  if (gridSection) gridSection.classList.add('hidden');
  if (statsSection) statsSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Auth Check ────────────────────────────────────────
async function checkAuth() {
  try {
    const result = await authMe();
    const loginLink = document.getElementById('auth-link');
    if (loginLink) {
      if (result.authenticated) {
        loginLink.innerHTML = result.user.role === 'admin' 
          ? '<span>⚙ Admin Panel</span>' 
          : `<span>👤 ${result.user.username}</span>`;
        loginLink.href = result.user.role === 'admin' ? '/admin.html' : '#';
      } else {
        loginLink.innerHTML = '<span>Login</span>';
        loginLink.href = '/login.html';
      }
    }
  } catch {
    // Guest mode
  }
}

// ── Category Loading & Card Grid Rendering ────────────
async function loadCategories() {
  try {
    const result = await getCategories();
    categories = result.data || [];
    renderCategoryGridCards();
  } catch {
    showToast('Failed to load statistical categories.', 'error');
  }
}

function renderCategoryGridCards() {
  const container = document.getElementById('category-cards');
  if (!container) return;
  container.innerHTML = '';

  if (categories.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <p class="text-lg text-slate-400 dark:text-slate-500 font-medium">No statistical datasets published yet.</p>
      </div>`;
    return;
  }

  const icons = {
    'bus': '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />',
    'academic-cap': '<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />',
    'chart-bar': '<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />',
  };

  categories.forEach((cat) => {
    const card = document.createElement('div');
    card.className = 'group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5';
    
    const iconSvg = icons[cat.icon] || icons['chart-bar'];

    card.innerHTML = `
      <div>
        <div class="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-6 h-6">
            ${iconSvg}
          </svg>
        </div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 mb-2">
          ${cat.name}
        </h3>
        <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
          ${cat.description || 'Interactive statistical data tables and visual analytics charts.'}
        </p>
      </div>
      <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-1">
          <span>View Statistics</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
        <span class="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">Dataset</span>
      </div>
    `;

    card.addEventListener('click', () => selectCategory(cat.id));
    container.appendChild(card);
  });
}

function selectCategory(categoryId) {
  activeCategoryId = categoryId;
  showStatisticsView();

  // Update header titles
  const cat = categories.find((c) => c.id === categoryId);
  const titleEl = document.getElementById('active-category-title');
  const descEl = document.getElementById('active-category-desc');
  if (titleEl && cat) titleEl.textContent = cat.name;
  if (descEl && cat) descEl.textContent = cat.description || '';

  loadCategoryData(categoryId);
}

// ── Data Loading ──────────────────────────────────────
async function loadCategoryData(categoryId) {
  showLoading(true);

  try {
    const [columnsResult, recordsResult, chartResult] = await Promise.all([
      getColumns(categoryId),
      getRecords(categoryId, 1, 200),
      getChartConfig(categoryId),
    ]);

    const columns = columnsResult.data || [];
    const records = recordsResult.data || [];
    const chartConfig = chartResult.data;

    // Show or hide empty state
    if (records.length === 0) {
      showEmptyState();
      destroyChart();
      destroyTable();
      showLoading(false);
      return;
    }

    hideEmptyState();

    // Render chart (use emerald as default palette)
    if (chartConfig && chartConfig.config) {
      document.getElementById('chart-section').classList.remove('hidden');
      const palette = chartConfig.config.palette === 'default' ? 'emerald' : chartConfig.config.palette;
      renderChart('stats-chart', chartConfig.config, chartConfig.chartData, palette);
    } else {
      document.getElementById('chart-section').classList.add('hidden');
      destroyChart();
    }

    // Render table
    document.getElementById('table-section').classList.remove('hidden');
    renderTable('stats-table', columns, records);

    // Update record count
    const countEl = document.getElementById('record-count');
    if (countEl) {
      countEl.textContent = `${records.length} Total Records`;
    }
  } catch (err) {
    showToast('Failed to load statistical insights.', 'error');
    console.error('[Dashboard] Load Error:', err);
  }

  showLoading(false);
}

// ── UI Helpers ────────────────────────────────────────
function showLoading(visible) {
  const loader = document.getElementById('loading-spinner');
  if (loader) loader.classList.toggle('hidden', !visible);
}

function showEmptyState() {
  const el = document.getElementById('empty-state');
  if (el) el.classList.remove('hidden');
  const chart = document.getElementById('chart-section');
  const table = document.getElementById('table-section');
  if (chart) chart.classList.add('hidden');
  if (table) table.classList.add('hidden');
}

function hideEmptyState() {
  const el = document.getElementById('empty-state');
  if (el) el.classList.add('hidden');
}
