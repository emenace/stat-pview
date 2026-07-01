/**
 * API Service — Modular fetch() wrappers for Statistic Public View
 * All endpoints return { success, data?, error?, ... } JSON
 */

const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `Request failed (${res.status})`);
    }
    return json;
  } catch (err) {
    showToast(err.message || 'Network error', 'error');
    throw err;
  }
}

// ── Auth ──────────────────────────────────────────────
export async function authLogin(username, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function authLogout() {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export async function authMe() {
  return apiFetch('/auth/me');
}

// ── Categories ────────────────────────────────────────
export async function getCategories() {
  return apiFetch('/categories');
}

export async function getCategory(id) {
  return apiFetch(`/categories/${id}`);
}

// ── Custom Columns ────────────────────────────────────
export async function getColumns(categoryId) {
  return apiFetch(`/columns/${categoryId}`);
}

// ── Data Records ──────────────────────────────────────
export async function getRecords(categoryId, page = 1, limit = 100, search = '') {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  return apiFetch(`/records/${categoryId}?${params}`);
}

// ── Chart Config ──────────────────────────────────────
export async function getChartConfig(categoryId) {
  return apiFetch(`/charts/${categoryId}`);
}

// ── Toast Notification System ─────────────────────────
let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'info', duration = 4000) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');

  const colors = {
    info: 'bg-indigo-600 text-white',
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
  };

  const icons = {
    info: '🛈',
    success: '✓',
    error: '✕',
    warning: '⚠',
  };

  toast.className = `${colors[type] || colors.info} px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transform transition-all duration-300 translate-x-full opacity-0`;
  toast.innerHTML = `<span class="text-lg">${icons[type] || icons.info}</span><span>${message}</span>`;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');
  });

  // Auto-remove
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
