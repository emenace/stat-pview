/**
 * Dashboard Orchestrator — Connects UI to API, Chart, and Table modules
 * Main entry point for the public dashboard (index.html)
 */

import { getCategories, getColumns, getRecords, getChartConfig, authMe, showToast } from './api-service.js';
import { renderChart, destroyChart } from './chart-handler.js';
import { renderTable, destroyTable } from './table-handler.js';

let categories = [];
let activeCategoryId = null;
let activeSubCategoryId = null;

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
      if (activeSubCategoryId && !document.getElementById('statistics-view-section').classList.contains('hidden')) {
        loadSubCategoryData(activeSubCategoryId);
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

  const exportBtns = document.querySelectorAll('.btn-export-placeholder');
  exportBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Export (${btn.textContent.trim()}) is a placeholder without logic.`, 'info');
    });
  });
}

function showCategoryGridView() {
  activeCategoryId = null;
  activeSubCategoryId = null;
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
    'chart-bar': '<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" />',
    'building': '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />',
    'building-office': '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />',
    'map': '<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />',
    'map-pin': '<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />',
    'users': '<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />',
    'academic-cap': '<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />',
    'bus': '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />',
    'book-open': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />',
    'globe-alt': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />',
    'briefcase': '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />',
    'heart': '<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />',
    'banknotes': '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />',
    'home': '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />',
    'shield-check': '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />',
    'scale': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />',
    'sparkles': '<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />',
  };

  categories.forEach((cat) => {
    const card = document.createElement('div');
    card.className = 'group relative w-full max-w-[280px] aspect-square bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 rounded-[2.2rem] p-8 shadow-sm hover:shadow-xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer transform hover:-translate-y-1.5';

    const iconSvg = icons[cat.icon] || icons['chart-bar'];

    card.innerHTML = `
      <div class="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-8 h-8">
          ${iconSvg}
        </svg>
      </div>
      <h3 class="text-xl font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 leading-snug">
        ${cat.name}
      </h3>
    `;

    card.addEventListener('click', () => selectCategory(cat.id));
    container.appendChild(card);
  });
}

function selectCategory(categoryId) {
  activeCategoryId = categoryId;
  showStatisticsView();

  // Update header title
  const cat = categories.find((c) => c.id === categoryId);
  const titleEl = document.getElementById('active-category-title');
  if (titleEl && cat) titleEl.textContent = cat.name;

  // Render sub-category tabs
  renderSubCategoryTabs(cat?.sub_categories || []);
}

function renderSubCategoryTabs(subCategories) {
  const container = document.getElementById('subcategory-tabs-container');
  if (!container) return;
  container.innerHTML = '';

  if (subCategories.length === 0) {
    container.innerHTML = `<span class="text-sm text-slate-400 dark:text-slate-500 italic">Tidak ada sub-kategori tersedia.</span>`;
    showEmptyState();
    destroyChart();
    destroyTable();
    return;
  }

  subCategories.forEach((sub, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `subcat-tab-btn px-4 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 whitespace-nowrap ${
      idx === 0
        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600'
    }`;
    btn.textContent = sub.name;
    btn.dataset.id = sub.id;

    btn.addEventListener('click', () => selectSubCategory(sub.id));
    container.appendChild(btn);
  });

  // Automatically select the first sub-category
  selectSubCategory(subCategories[0].id);
}

function selectSubCategory(subCategoryId) {
  activeSubCategoryId = subCategoryId;

  // Update button active styling
  const buttons = document.querySelectorAll('.subcat-tab-btn');
  buttons.forEach((btn) => {
    if (parseInt(btn.dataset.id) === subCategoryId) {
      btn.className = 'subcat-tab-btn px-4 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 whitespace-nowrap bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20';
    } else {
      btn.className = 'subcat-tab-btn px-4 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 whitespace-nowrap bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600';
    }
  });

  loadSubCategoryData(subCategoryId);
}

// ── Data Loading ──────────────────────────────────────
async function loadSubCategoryData(subCategoryId) {
  showLoading(true);

  try {
    const [columnsResult, recordsResult, chartResult] = await Promise.all([
      getColumns(subCategoryId),
      getRecords(subCategoryId, 1, 200),
      getChartConfig(subCategoryId),
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
    if (chartConfig && chartConfig.config && chartConfig.config.chart_type !== 'none') {
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
