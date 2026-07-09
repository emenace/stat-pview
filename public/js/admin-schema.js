/**
 * Admin Schema Builder — Interactive CRUD manager for custom table columns (EAV schema)
 * Renders inside #admin-schema-root on admin.html
 */

import { getCategories, getColumns, createColumn, updateColumn, deleteColumn, showToast } from './api-service.js';
import { openModal, closeModal } from './admin.js';

let categoriesData = [];
let selectedCategoryId = null;
let selectedSubCategoryId = null;
let columnsData = [];
let schemaTableInstance = null;

const DATA_TYPE_LABELS = {
  text: { label: 'Teks (Singkat/Panjang)', badge: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  number: { label: 'Angka / Numerik', badge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  date: { label: 'Tanggal / Kalender', badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  boolean: { label: 'Ya / Tidak (Boolean)', badge: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  select: { label: 'Pilihan (Dropdown)', badge: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
};

/**
 * Initialize the Schema Manager module
 */
export async function initSchemaManager() {
  const root = document.getElementById('admin-schema-root');
  if (!root) return;

  root.innerHTML = renderSchemaShell();
  await loadCategoriesForSchema();
}

/**
 * Render outer HTML shell for Schema Manager
 */
function renderSchemaShell() {
  return `
    <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">Skema Kolom Kustom</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Definisikan struktur kolom dan tipe data untuk setiap sub-kategori dataset</p>
      </div>
      <div class="flex items-center gap-3 w-full lg:w-auto flex-wrap">
        <select id="schema-category-selector" class="flex-1 sm:w-52 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer transition-all">
          <option value="">Memuat kategori...</option>
        </select>
        <select id="schema-subcategory-selector" disabled class="flex-1 sm:w-52 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer transition-all disabled:opacity-50">
          <option value="">Pilih Sub-Kategori...</option>
        </select>
        <button id="btn-add-column" disabled class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Tambah Kolom</span>
        </button>
      </div>
    </div>

    <!-- Info Banner -->
    <div class="mb-6 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-start gap-3 text-sm text-emerald-800 dark:text-emerald-300">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
      <div>
        <span class="font-semibold">Sistem Schema Dinamis (No DDL Migrations):</span> Kolom yang Anda tambahkan di sini akan langsung tersedia pada tabel data publik dan modal input record tanpa perlu mengubah struktur tabel database.
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
      <div id="schema-table-container" class="p-4 overflow-x-auto w-full max-w-full">
        <div class="text-center py-12 text-slate-400">
          <p class="text-base">Silakan pilih kategori dan sub-kategori terlebih dahulu di atas</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Fetch available categories and populate cascaded selectors
 */
async function loadCategoriesForSchema() {
  const catSelector = document.getElementById('schema-category-selector');
  const subSelector = document.getElementById('schema-subcategory-selector');
  const addBtn = document.getElementById('btn-add-column');
  if (!catSelector || !subSelector) return;

  try {
    const result = await getCategories();
    categoriesData = result.data || [];

    if (categoriesData.length === 0) {
      catSelector.innerHTML = '<option value="">Belum ada kategori</option>';
      subSelector.innerHTML = '<option value="">Belum ada sub-kategori</option>';
      if (addBtn) addBtn.disabled = true;
      return;
    }

    catSelector.innerHTML = categoriesData.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    // Select first category by default
    if (!selectedCategoryId || !categoriesData.some(c => c.id === selectedCategoryId)) {
      selectedCategoryId = categoriesData[0].id;
    }
    catSelector.value = selectedCategoryId;

    // Populate subcategories for the selected category
    populateSubCategories(selectedCategoryId);

    // Bind change event for category
    catSelector.onchange = (e) => {
      selectedCategoryId = parseInt(e.target.value);
      populateSubCategories(selectedCategoryId);
    };

    // Bind change event for subcategory
    subSelector.onchange = (e) => {
      selectedSubCategoryId = parseInt(e.target.value);
      loadAndRenderColumns();
    };

  } catch (err) {
    catSelector.innerHTML = '<option value="">Gagal memuat kategori</option>';
  }
}

function populateSubCategories(catId) {
  const subSelector = document.getElementById('schema-subcategory-selector');
  const addBtn = document.getElementById('btn-add-column');
  const container = document.getElementById('schema-table-container');
  if (!subSelector) return;

  const cat = categoriesData.find(c => c.id === catId);
  const subs = cat?.sub_categories || [];

  if (subs.length === 0) {
    subSelector.innerHTML = '<option value="">Tidak ada sub-kategori</option>';
    subSelector.disabled = true;
    selectedSubCategoryId = null;
    if (addBtn) addBtn.disabled = true;
    if (container) {
      container.innerHTML = '<div class="text-center py-12 text-slate-400"><p class="text-base font-semibold">Kategori ini belum memiliki Sub-Kategori</p><p class="text-sm mt-1">Silakan tambahkan sub-kategori terlebih dahulu di menu Kategori Utama.</p></div>';
    }
    return;
  }

  subSelector.disabled = false;
  subSelector.innerHTML = subs.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  
  if (!selectedSubCategoryId || !subs.some(s => s.id === selectedSubCategoryId)) {
    selectedSubCategoryId = subs[0].id;
  }
  subSelector.value = selectedSubCategoryId;

  if (addBtn) {
    addBtn.disabled = false;
    addBtn.onclick = () => openColumnModal(null);
  }

  loadAndRenderColumns();
}

/**
 * Load columns for the selected subcategory and render Tabulator
 */
async function loadAndRenderColumns() {
  const container = document.getElementById('schema-table-container');
  if (!container || !selectedSubCategoryId) return;

  container.innerHTML = '<div class="text-center py-8 text-slate-400"><div class="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>Memuat skema kolom...</div>';

  try {
    const result = await getColumns(selectedSubCategoryId);
    columnsData = result.data || [];
    renderColumnsTable(container);
  } catch (err) {
    container.innerHTML = '<p class="text-center text-red-500 py-8">Gagal memuat skema kolom.</p>';
  }
}

/**
 * Render Tabulator grid for columns
 */
function renderColumnsTable(container) {
  // Sort by sort_order ascending
  const sortedData = [...columnsData].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  const tableData = sortedData.map((col, idx) => ({
    _row: idx + 1,
    id: col.id,
    category_id: col.category_id,
    column_label: col.column_label,
    column_name: col.column_name,
    data_type: col.data_type || 'text',
    is_required: col.is_required ? 1 : 0,
    sort_order: col.sort_order || 0,
  }));

  if (schemaTableInstance) {
    try { schemaTableInstance.destroy(); } catch (e) {}
  }

  // Create clean wrapper div inside container for Tabulator
  container.innerHTML = '<div id="schema-grid"></div>';

  schemaTableInstance = new Tabulator('#schema-grid', {
    data: tableData,
    layout: 'fitColumns',
    responsiveLayout: 'collapse',
    placeholder: '<div class="text-center py-10 text-slate-400"><p class="text-lg font-medium">Belum ada kolom kustom</p><p class="text-sm mt-1">Klik tombol "Tambah Kolom" untuk membuat skema baru.</p></div>',
    columns: [
      { title: 'No. Urut', field: 'sort_order', width: 90, hozAlign: 'center', headerSort: true },
      { 
        title: 'Label Kolom (Tampilan)', 
        field: 'column_label', 
        minWidth: 180,
        formatter: function(cell) {
          return `<span class="font-semibold text-slate-800 dark:text-slate-100">${cell.getValue()}</span>`;
        }
      },
      { 
        title: 'Nama Sistem (ID)', 
        field: 'column_name', 
        minWidth: 160,
        formatter: function(cell) {
          return `<code class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono border border-slate-200/60 dark:border-slate-700/60">${cell.getValue()}</code>`;
        }
      },
      {
        title: 'Aksi',
        field: 'id',
        width: 150,
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
            const col = columnsData.find(c => c.id === id);
            if (col) openColumnModal(col);
          } else if (action === 'delete') {
            const col = columnsData.find(c => c.id === id);
            if (col) confirmDeleteColumn(col);
          }
        },
      },
    ],
  });
}

/**
 * Open Modal to Add or Edit Column
 */
function openColumnModal(column) {
  const isEdit = !!column;
  const title = isEdit ? 'Edit Kolom Kustom' : 'Tambah Kolom Baru';

  // Calculate default sort order if adding new column (auto-increment by 1)
  let defaultSortOrder = 1;
  if (!isEdit && columnsData.length > 0) {
    const maxOrder = Math.max(...columnsData.map(c => c.sort_order || 0));
    defaultSortOrder = maxOrder + 1;
  }

  const bodyHtml = `
    <form id="column-form" class="space-y-4">
      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Label Kolom (Untuk Tampilan User) <span class="text-red-500">*</span></label>
        <input type="text" id="col-label" required placeholder="Contoh: Luas Tanah (m²)"
          value="${isEdit ? column.column_label : ''}"
          class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" />
        <p class="text-xs text-slate-400 mt-1">Nama yang akan ditampilkan pada tabel dan form input.</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Sistem (ID Kolom) <span class="text-red-500">*</span></label>
        <input type="text" id="col-name" required placeholder="Contoh: luas_tanah"
          value="${isEdit ? column.column_name : ''}" ${isEdit ? 'readonly' : ''}
          class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${isEdit ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}" />
        <p class="text-xs text-slate-400 mt-1">${isEdit ? 'Nama sistem tidak dapat diubah setelah kolom dibuat.' : 'Otomatis dibuat berdasarkan label kolom di atas.'}</p>
      </div>

      <input type="hidden" id="col-type" value="${isEdit ? (column.data_type || 'text') : 'text'}" />
      <input type="hidden" id="col-sort" value="${isEdit ? (column.sort_order || 0) : defaultSortOrder}" />
      <input type="hidden" id="col-required" value="0" />
    </form>
  `;

  const footerHtml = `
    <button id="modal-cancel" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all cursor-pointer">Batal</button>
    <button id="modal-save" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 cursor-pointer">${isEdit ? 'Simpan Perubahan' : 'Tambah Kolom'}</button>
  `;

  openModal(title, bodyHtml, footerHtml);

  // Auto-generate system name from label when adding new column
  if (!isEdit) {
    const labelInput = document.getElementById('col-label');
    const nameInput = document.getElementById('col-name');
    let manualNameEdit = false;

    nameInput.addEventListener('input', () => { manualNameEdit = true; });
    labelInput.addEventListener('input', () => {
      if (!manualNameEdit) {
        const slug = labelInput.value.trim().toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_');
        nameInput.value = slug;
      }
    });
  }

  // Bind buttons
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', async () => {
    const label = document.getElementById('col-label').value.trim();
    const name = document.getElementById('col-name').value.trim().toLowerCase().replace(/\s+/g, '_');
    const dataTypeEl = document.getElementById('col-type');
    const dataType = dataTypeEl ? dataTypeEl.value : 'text';
    const sortOrderEl = document.getElementById('col-sort');
    const sortOrder = sortOrderEl ? (parseInt(sortOrderEl.value) || 0) : 1;
    const reqEl = document.getElementById('col-required');
    const isRequired = reqEl ? (reqEl.checked || reqEl.value === '1' ? 1 : 0) : 0;

    if (!label || !name) {
      showToast('Label kolom dan nama sistem wajib diisi.', 'warning');
      return;
    }

    const payload = {
      sub_category_id: selectedSubCategoryId,
      category_id: selectedSubCategoryId,
      column_name: name,
      column_label: label,
      data_type: dataType,
      is_required: isRequired,
      sort_order: sortOrder
    };

    try {
      if (isEdit) {
        await updateColumn(column.id, payload);
        showToast(`Kolom "${label}" berhasil diperbarui.`, 'success');
      } else {
        await createColumn(payload);
        showToast(`Kolom "${label}" berhasil ditambahkan.`, 'success');
      }
      closeModal();
      await loadAndRenderColumns();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan kolom.', 'error');
    }
  });
}

/**
 * Confirm and delete column
 */
function confirmDeleteColumn(column) {
  const bodyHtml = `
    <div class="text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-red-600 dark:text-red-400">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Hapus Kolom "${column.column_label}"?</h4>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Apakah Anda yakin ingin menghapus kolom <code class="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">${column.column_name}</code>? Definisi kolom ini akan dihapus dari skema kategori.
      </p>
    </div>
  `;

  const footerHtml = `
    <button id="modal-cancel" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all cursor-pointer">Batal</button>
    <button id="modal-confirm-delete" class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-md cursor-pointer">Ya, Hapus</button>
  `;

  openModal('Konfirmasi Penghapusan Kolom', bodyHtml, footerHtml);

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-confirm-delete').addEventListener('click', async () => {
    try {
      await deleteColumn(column.id);
      showToast(`Kolom "${column.column_label}" berhasil dihapus.`, 'success');
      closeModal();
      await loadAndRenderColumns();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus kolom.', 'error');
    }
  });
}
