/**
 * Admin Categories Manager — Interactive CRUD table for statistical categories
 * Renders inside #admin-categories-root on admin.html
 */

import { getCategories, createCategory, updateCategory, deleteCategory, showToast } from './api-service.js';
import { openModal, closeModal } from './admin.js';

let categoriesData = [];

// Available icon options with labels and SVG paths
const ICON_OPTIONS = [
  { value: 'chart-bar', label: 'Grafik Batang', path: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
  { value: 'building', label: 'Bangunan', path: 'M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819' },
  { value: 'map', label: 'Peta', path: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z' },
  { value: 'users', label: 'Pengguna', path: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
  { value: 'academic-cap', label: 'Pendidikan', path: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5' },
  { value: 'bus', label: 'Transportasi', path: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
];

/**
 * Initialize the category manager module
 */
export async function initCategoryManager() {
  const root = document.getElementById('admin-categories-root');
  if (!root) return;

  root.innerHTML = renderCategoryShell();
  await loadAndRenderCategories();

  // Bind "Add" button
  const addBtn = document.getElementById('btn-add-category');
  if (addBtn) addBtn.addEventListener('click', () => openCategoryModal(null));
}

/**
 * Render the outer shell (header + table container)
 */
function renderCategoryShell() {
  return `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">Daftar Kategori</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Kelola kategori dataset statistik yang ditampilkan di dashboard publik</p>
      </div>
      <button id="btn-add-category" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all duration-200 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>Tambah Kategori</span>
      </button>
    </div>
    <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
      <div id="categories-table-container" class="p-4"></div>
    </div>
  `;
}

/**
 * Fetch categories and render the table
 */
async function loadAndRenderCategories() {
  const container = document.getElementById('categories-table-container');
  if (!container) return;

  try {
    const result = await getCategories();
    categoriesData = result.data || [];
    renderCategoriesTable(container);
  } catch {
    container.innerHTML = '<p class="text-center text-red-500 py-8">Gagal memuat data kategori.</p>';
  }
}

/**
 * Render the categories table using Tabulator
 */
function renderCategoriesTable(container) {
  // Flatten for display
  const tableData = categoriesData.map((cat, idx) => ({
    _row: idx + 1,
    id: cat.id,
    name: cat.name,
    description: cat.description || '-',
    icon: cat.icon || 'chart-bar',
    color_theme: cat.color_theme || 'emerald',
    created_at: cat.created_at,
  }));

  new Tabulator(`#${container.id}`, {
    data: tableData,
    layout: 'fitColumns',
    responsiveLayout: 'collapse',
    placeholder: '<div class="text-center py-8 text-slate-400"><p class="text-lg">Belum ada kategori</p><p class="text-sm">Klik "Tambah Kategori" untuk memulai.</p></div>',
    columns: [
      { title: '#', field: '_row', width: 50, hozAlign: 'center', headerSort: false },
      {
        title: 'Ikon',
        field: 'icon',
        width: 70,
        hozAlign: 'center',
        headerSort: false,
        formatter: function (cell) {
          const iconVal = cell.getValue();
          const iconData = ICON_OPTIONS.find(i => i.value === iconVal);
          if (!iconData) return '';
          return `<div class="w-8 h-8 mx-auto rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="${iconData.path}" /></svg>
          </div>`;
        },
      },
      { title: 'Nama Kategori', field: 'name', minWidth: 180 },
      { title: 'Deskripsi', field: 'description', minWidth: 200 },
      {
        title: 'Aksi',
        field: 'id',
        width: 160,
        hozAlign: 'center',
        headerSort: false,
        formatter: function (cell) {
          const id = cell.getValue();
          return `
            <div class="flex items-center justify-center gap-2">
              <button data-action="edit" data-id="${id}" class="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-all cursor-pointer">Edit</button>
              <button data-action="delete" data-id="${id}" class="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold transition-all cursor-pointer">Hapus</button>
            </div>
          `;
        },
        cellClick: function (e, cell) {
          const target = e.target.closest('button');
          if (!target) return;
          const action = target.dataset.action;
          const id = parseInt(target.dataset.id);
          if (action === 'edit') {
            const cat = categoriesData.find(c => c.id === id);
            if (cat) openCategoryModal(cat);
          } else if (action === 'delete') {
            const cat = categoriesData.find(c => c.id === id);
            if (cat) confirmDeleteCategory(cat);
          }
        },
      },
    ],
  });
}

/**
 * Open modal for creating or editing a category
 */
function openCategoryModal(category) {
  const isEdit = !!category;
  const title = isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru';

  // Build icon selector options
  const iconOptionsHtml = ICON_OPTIONS.map((icon) => {
    const selected = (category && category.icon === icon.value) ? 'selected' : '';
    return `<option value="${icon.value}" ${selected}>${icon.label}</option>`;
  }).join('');

  const bodyHtml = `
    <form id="category-form" class="space-y-4">
      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Kategori <span class="text-red-500">*</span></label>
        <input type="text" id="cat-name" required placeholder="Contoh: Tempat Ibadah Kota Metro"
          value="${isEdit ? category.name : ''}"
          class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm" />
      </div>
      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Deskripsi</label>
        <textarea id="cat-description" rows="3" placeholder="Deskripsi singkat kategori data statistik"
          class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm resize-none">${isEdit ? (category.description || '') : ''}</textarea>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ikon</label>
          <select id="cat-icon"
            class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm cursor-pointer">
            ${iconOptionsHtml}
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tema Warna</label>
          <select id="cat-color-theme"
            class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm cursor-pointer">
            <option value="emerald" ${(!category || category.color_theme === 'emerald') ? 'selected' : ''}>Hijau (Emerald)</option>
            <option value="indigo" ${(category && category.color_theme === 'indigo') ? 'selected' : ''}>Biru (Indigo)</option>
            <option value="amber" ${(category && category.color_theme === 'amber') ? 'selected' : ''}>Kuning (Amber)</option>
            <option value="rose" ${(category && category.color_theme === 'rose') ? 'selected' : ''}>Merah (Rose)</option>
            <option value="violet" ${(category && category.color_theme === 'violet') ? 'selected' : ''}>Ungu (Violet)</option>
          </select>
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button id="modal-cancel" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all cursor-pointer">Batal</button>
    <button id="modal-save" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 cursor-pointer">${isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}</button>
  `;

  openModal(title, bodyHtml, footerHtml);

  // Bind modal actions
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', async () => {
    const name = document.getElementById('cat-name').value.trim();
    const description = document.getElementById('cat-description').value.trim();
    const icon = document.getElementById('cat-icon').value;
    const color_theme = document.getElementById('cat-color-theme').value;

    if (!name) {
      showToast('Nama kategori wajib diisi.', 'warning');
      return;
    }

    const payload = { name, description, icon, color_theme };

    try {
      if (isEdit) {
        await updateCategory(category.id, payload);
        showToast(`Kategori "${name}" berhasil diperbarui.`, 'success');
      } else {
        await createCategory(payload);
        showToast(`Kategori "${name}" berhasil ditambahkan.`, 'success');
      }
      closeModal();
      await loadAndRenderCategories();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan kategori.', 'error');
    }
  });
}

/**
 * Confirm and delete a category
 */
function confirmDeleteCategory(category) {
  const bodyHtml = `
    <div class="text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-red-600 dark:text-red-400">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Hapus Kategori?</h4>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Kategori <strong class="text-slate-700 dark:text-slate-200">"${category.name}"</strong> beserta seluruh kolom, data record, dan konfigurasi chart yang terkait akan dihapus secara permanen.
      </p>
    </div>
  `;

  const footerHtml = `
    <button id="modal-cancel" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all cursor-pointer">Batal</button>
    <button id="modal-confirm-delete" class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-md cursor-pointer">Ya, Hapus</button>
  `;

  openModal('Konfirmasi Penghapusan', bodyHtml, footerHtml);

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-confirm-delete').addEventListener('click', async () => {
    try {
      await deleteCategory(category.id);
      showToast(`Kategori "${category.name}" berhasil dihapus.`, 'success');
      closeModal();
      await loadAndRenderCategories();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus kategori.', 'error');
    }
  });
}
