/**
 * Admin Orchestrator — Session management, tab routing, dark mode, and module loading
 * Main entry point for /admin.html
 */

import { authMe, authLogout, showToast } from './api-service.js';
import { initCategoryManager } from './admin-categories.js';
import { initSchemaManager } from './admin-schema.js';
import { initRecordManager } from './admin-records.js';
import { initChartManager } from './admin-charts.js';

let currentTab = 'categories';

// ── Initialization ────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initDarkMode();
  const authenticated = await verifySession();
  if (!authenticated) return;

  initTabNavigation();
  initMobileMenu();
  initLogout();

  // Load default tab module
  initCategoryManager();
});

// ── Session Verification ──────────────────────────────
async function verifySession() {
  try {
    const result = await authMe();
    if (!result.authenticated || result.user.role !== 'admin') {
      showToast('Akses ditolak. Silakan login sebagai Admin.', 'error');
      setTimeout(() => { window.location.href = '/login.html'; }, 800);
      return false;
    }
    // Update sidebar username
    const usernameEl = document.getElementById('sidebar-username');
    if (usernameEl) usernameEl.textContent = result.user.username;
    return true;
  } catch {
    window.location.href = '/login.html';
    return false;
  }
}

// ── Tab Navigation ────────────────────────────────────
const TAB_META = {
  categories: { title: 'Manajemen Kategori', subtitle: 'Kelola kategori data statistik publik' },
  schema:     { title: 'Skema Kolom', subtitle: 'Definisikan kolom kustom untuk setiap kategori' },
  records:    { title: 'Data Record', subtitle: 'Kelola data record untuk setiap kategori' },
  charts:     { title: 'Konfigurasi Chart', subtitle: 'Atur visualisasi chart untuk setiap kategori' },
};

function initTabNavigation() {
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      const tab = link.dataset.tab;
      if (tab === currentTab) return;
      switchTab(tab);
    });
  });
}

function switchTab(tabName) {
  currentTab = tabName;

  // Update sidebar active states
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.tab === tabName);
  });

  // Show/hide panels
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.add('hidden');
  });
  const activePanel = document.getElementById(`panel-${tabName}`);
  if (activePanel) activePanel.classList.remove('hidden');

  // Update page title/subtitle
  const meta = TAB_META[tabName] || {};
  const titleEl = document.getElementById('page-title');
  const subtitleEl = document.getElementById('page-subtitle');
  if (titleEl) titleEl.textContent = meta.title || '';
  if (subtitleEl) subtitleEl.textContent = meta.subtitle || '';

  // Close mobile sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar && window.innerWidth < 1024) {
    sidebar.classList.add('hidden');
  }

  // Load module (future stages will init their modules here)
  if (tabName === 'categories') {
    initCategoryManager();
  } else if (tabName === 'schema') {
    initSchemaManager();
  } else if (tabName === 'records') {
    initRecordManager();
  } else if (tabName === 'charts') {
    initChartManager();
  }
}

// ── Mobile Menu ───────────────────────────────────────
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
    if (!sidebar.classList.contains('hidden')) {
      sidebar.classList.add('fixed', 'inset-0', 'z-50', 'lg:relative', 'lg:inset-auto', 'lg:z-auto');
    } else {
      sidebar.classList.remove('fixed', 'inset-0', 'z-50');
    }
  });
}

// ── Logout ────────────────────────────────────────────
function initLogout() {
  const logoutBtn = document.getElementById('btn-logout');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      await authLogout();
      showToast('Berhasil keluar.', 'success');
      setTimeout(() => { window.location.href = '/login.html'; }, 600);
    } catch {
      showToast('Gagal logout.', 'error');
    }
  });
}

// ── Dark Mode ─────────────────────────────────────────
function initDarkMode() {
  const toggle = document.getElementById('dark-mode-toggle');
  const html = document.documentElement;

  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      html.classList.toggle('dark');
      localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
      updateDarkModeIcon();
    });
    updateDarkModeIcon();
  }
}

function updateDarkModeIcon() {
  const icon = document.getElementById('dark-mode-icon');
  const label = document.getElementById('dark-mode-label');
  if (!icon) return;
  const isDark = document.documentElement.classList.contains('dark');
  icon.innerHTML = isDark
    ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>';
  if (label) label.textContent = isDark ? 'Terang' : 'Gelap';
}

// ── Shared Modal Utility ──────────────────────────────
export function openModal(title, bodyHtml, footerHtml) {
  const overlay = document.getElementById('modal-overlay');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');
  const closeBtn = document.getElementById('modal-close-btn');

  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = bodyHtml;
  if (footerEl) footerEl.innerHTML = footerHtml;
  if (overlay) overlay.classList.remove('hidden');

  // Close handlers
  const close = () => overlay.classList.add('hidden');
  if (closeBtn) closeBtn.onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };

  return close;
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}
