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
      if (activeCategoryId) loadCategoryData(activeCategoryId);
    });
    updateDarkModeIcon();
  }
}

function updateDarkModeIcon() {
  const icon = document.getElementById('dark-mode-icon');
  if (!icon) return;
  const isDark = document.documentElement.classList.contains('dark');
  icon.innerHTML = isDark
    ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>';
}

// ── Auth Check ────────────────────────────────────────
async function checkAuth() {
  try {
    const result = await authMe();
    const loginLink = document.getElementById('auth-link');
    if (loginLink) {
      if (result.authenticated) {
        loginLink.textContent = result.user.role === 'admin' ? '⚙ Admin Panel' : `👤 ${result.user.username}`;
        loginLink.href = result.user.role === 'admin' ? '/admin.html' : '#';
      } else {
        loginLink.textContent = 'Login';
        loginLink.href = '/login.html';
      }
    }
  } catch {
    // Guest mode — no action needed
  }
}

// ── Category Loading ──────────────────────────────────
async function loadCategories() {
  try {
    const result = await getCategories();
    categories = result.data || [];
    renderCategoryTabs();

    if (categories.length > 0) {
      selectCategory(categories[0].id);
    } else {
      showEmptyState('No statistical categories available yet.');
    }
  } catch {
    showEmptyState('Failed to load categories. Please try again later.');
  }
}

function renderCategoryTabs() {
  const container = document.getElementById('category-tabs');
  if (!container) return;
  container.innerHTML = '';

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.id = `tab-cat-${cat.id}`;
    btn.className = 'category-tab px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap border border-transparent hover:shadow-md hover:-translate-y-0.5 cursor-pointer';
    btn.textContent = cat.name;
    btn.title = cat.description || cat.name;
    btn.addEventListener('click', () => selectCategory(cat.id));
    container.appendChild(btn);
  });
}

function selectCategory(categoryId) {
  activeCategoryId = categoryId;

  // Update tab active states
  document.querySelectorAll('.category-tab').forEach((tab) => {
    const isActive = tab.id === `tab-cat-${categoryId}`;
    if (isActive) {
      tab.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'border-indigo-500');
      tab.classList.remove('bg-white/60', 'dark:bg-slate-800/60', 'text-slate-600', 'dark:text-slate-300', 'hover:bg-white', 'dark:hover:bg-slate-700');
    } else {
      tab.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg', 'border-indigo-500');
      tab.classList.add('bg-white/60', 'dark:bg-slate-800/60', 'text-slate-600', 'dark:text-slate-300', 'hover:bg-white', 'dark:hover:bg-slate-700');
    }
  });

  // Update description
  const cat = categories.find((c) => c.id === categoryId);
  const descEl = document.getElementById('category-description');
  if (descEl && cat) {
    descEl.textContent = cat.description || '';
  }

  loadCategoryData(categoryId);
}

// ── Data Loading ──────────────────────────────────────
async function loadCategoryData(categoryId) {
  showLoading(true);

  try {
    // Load columns, records, and chart config in parallel
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
      showEmptyState('No data records available for this category yet.');
      destroyChart();
      destroyTable();
      showLoading(false);
      return;
    }

    hideEmptyState();

    // Render chart
    if (chartConfig && chartConfig.config) {
      document.getElementById('chart-section').classList.remove('hidden');
      renderChart('stats-chart', chartConfig.config, chartConfig.chartData, chartConfig.config.palette);
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
      countEl.textContent = `${records.length} records`;
    }
  } catch (err) {
    showEmptyState('Failed to load data. Please try again.');
    console.error('[Dashboard] Load Error:', err);
  }

  showLoading(false);
}

// ── UI Helpers ────────────────────────────────────────
function showLoading(visible) {
  const loader = document.getElementById('loading-spinner');
  if (loader) loader.classList.toggle('hidden', !visible);
}

function showEmptyState(message) {
  const el = document.getElementById('empty-state');
  if (el) {
    el.querySelector('p').textContent = message;
    el.classList.remove('hidden');
  }
  const chart = document.getElementById('chart-section');
  const table = document.getElementById('table-section');
  if (chart) chart.classList.add('hidden');
  if (table) table.classList.add('hidden');
}

function hideEmptyState() {
  const el = document.getElementById('empty-state');
  if (el) el.classList.add('hidden');
}
