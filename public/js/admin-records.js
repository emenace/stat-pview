/**
 * Admin Records Manager — Dynamic CRUD for JSON data rows per sub-category
 * Reads custom_columns schema and builds form inputs dynamically
 */

import {
  getCategories, getColumns, getRecords,
  createRecord, updateRecord, deleteRecord, showToast
} from './api-service.js';
import { openModal, closeModal } from './admin.js';

let categoriesData = [];
let selectedCategoryId = null;
let selectedSubCategoryId = null;
let columnsData = [];
let recordsData = [];
let recordTableInstance = null;

// ── Init ──────────────────────────────────────────────
export async function initRecordManager() {
  const root = document.getElementById('admin-records-root');
  if (!root) return;
  root.innerHTML = renderRecordShell();
  await loadCategoriesForRecords();
}

// ── Shell ─────────────────────────────────────────────
function renderRecordShell() {
  return `
    <div class="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">Data Record</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Kelola data record untuk setiap sub-kategori dataset</p>
      </div>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto flex-wrap">
        <div class="flex items-center gap-2">
          <select id="rec-category-selector" class="flex-1 sm:w-48 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer transition-all">
            <option value="">Memuat kategori...</option>
          </select>
          <select id="rec-subcategory-selector" disabled class="flex-1 sm:w-48 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer transition-all disabled:opacity-50">
            <option value="">Pilih Sub-Kategori...</option>
          </select>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button id="btn-add-record" disabled class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Tambah Record</span>
          </button>
          <button id="btn-format-excel" disabled class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-md shadow-indigo-600/20 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Format Excel</span>
          </button>
          <button id="btn-import-excel" disabled class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-md shadow-amber-600/20 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span>Import Excel</span>
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
      <div id="records-table-container" class="p-4">
        <div class="text-center py-12 text-slate-400">
          <p class="text-base">Silakan pilih kategori dan sub-kategori terlebih dahulu di atas</p>
        </div>
      </div>
    </div>
  `;
}

// ── Load Categories ───────────────────────────────────
async function loadCategoriesForRecords() {
  const catSel = document.getElementById('rec-category-selector');
  const subSel = document.getElementById('rec-subcategory-selector');
  const addBtn = document.getElementById('btn-add-record');
  const formatBtn = document.getElementById('btn-format-excel');
  const importBtn = document.getElementById('btn-import-excel');
  if (!catSel || !subSel) return;

  try {
    const result = await getCategories();
    categoriesData = result.data || [];

    if (categoriesData.length === 0) {
      catSel.innerHTML = '<option value="">Belum ada kategori</option>';
      return;
    }

    catSel.innerHTML = '<option value="">— Pilih Kategori —</option>' +
      categoriesData.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    catSel.addEventListener('change', () => {
      selectedCategoryId = catSel.value;
      selectedSubCategoryId = null;
      columnsData = [];
      recordsData = [];
      if (addBtn) addBtn.disabled = true;
      if (formatBtn) formatBtn.disabled = true;
      if (importBtn) importBtn.disabled = true;

      const cat = categoriesData.find(c => String(c.id) === String(selectedCategoryId));
      const subs = cat?.sub_categories || [];

      if (subs.length === 0) {
        subSel.innerHTML = '<option value="">Tidak ada sub-kategori</option>';
        subSel.disabled = true;
        renderEmptyState();
        return;
      }

      subSel.disabled = false;
      subSel.innerHTML = '<option value="">— Pilih Sub-Kategori —</option>' +
        subs.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    });

    subSel.addEventListener('change', async () => {
      selectedSubCategoryId = subSel.value;
      if (!selectedSubCategoryId) {
        if (addBtn) addBtn.disabled = true;
        if (formatBtn) formatBtn.disabled = true;
        if (importBtn) importBtn.disabled = true;
        renderEmptyState();
        return;
      }
      if (addBtn) addBtn.disabled = false;
      if (formatBtn) formatBtn.disabled = false;
      if (importBtn) importBtn.disabled = false;
      await loadColumnsAndRecords();
    });

    if (addBtn) {
      addBtn.addEventListener('click', () => openRecordModal(null));
    }
    if (formatBtn) {
      formatBtn.addEventListener('click', () => openFormatExcelModal());
    }
    if (importBtn) {
      importBtn.addEventListener('click', () => openImportExcelModal());
    }

  } catch (err) {
    catSel.innerHTML = '<option value="">Gagal memuat kategori</option>';
  }
}

function renderEmptyState() {
  const container = document.getElementById('records-table-container');
  if (container) {
    container.innerHTML = '<div class="text-center py-12 text-slate-400"><p class="text-base">Silakan pilih kategori dan sub-kategori terlebih dahulu di atas</p></div>';
  }
}

// ── Load Columns + Records ────────────────────────────
async function loadColumnsAndRecords() {
  try {
    const colRes = await getColumns(selectedSubCategoryId);
    columnsData = (colRes.data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const recRes = await getRecords(selectedSubCategoryId, 1, 200);
    recordsData = recRes.data || [];

    renderRecordsTable();
  } catch (err) {
    showToast('Gagal memuat data.', 'error');
  }
}

// ── Render Tabulator Table ────────────────────────────
function renderRecordsTable() {
  const container = document.getElementById('records-table-container');
  if (!container) return;

  if (columnsData.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <p class="text-lg font-medium">Belum ada kolom skema</p>
        <p class="text-sm mt-1">Silakan buat kolom di tab Skema Kolom terlebih dahulu.</p>
      </div>`;
    return;
  }

  // Build table data by flattening JSON
  const tableData = recordsData.map((rec, idx) => {
    const parsed = typeof rec.data === 'string' ? JSON.parse(rec.data) : (rec.data || {});
    const row = { _row: idx + 1, _id: rec.id };
    columnsData.forEach(col => { row[col.column_name] = parsed[col.column_name] ?? ''; });
    return row;
  });

  // Build Tabulator column definitions
  const tabulatorCols = [
    { title: 'No', field: '_row', width: 60, hozAlign: 'center', headerSort: false },
  ];

  columnsData.forEach(col => {
    tabulatorCols.push({
      title: col.column_label,
      field: col.column_name,
      minWidth: 120,
      headerSort: true,
    });
  });

  tabulatorCols.push({
    title: 'Aksi',
    field: '_id',
    width: 150,
    hozAlign: 'center',
    headerSort: false,
    formatter: function (cell) {
      const id = cell.getValue();
      return `
        <div class="flex items-center justify-center gap-2">
          <button data-action="edit" data-id="${id}" class="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-all cursor-pointer">Edit</button>
          <button data-action="delete" data-id="${id}" class="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold transition-all cursor-pointer">Hapus</button>
        </div>`;
    },
  });

  if (recordTableInstance) {
    try { recordTableInstance.destroy(); } catch (e) { }
  }

  container.innerHTML = '<div id="records-grid"></div>';

  recordTableInstance = new Tabulator('#records-grid', {
    data: tableData,
    layout: 'fitColumns',
    responsiveLayout: 'collapse',
    placeholder: '<div class="text-center py-10 text-slate-400"><p class="text-lg font-medium">Belum ada data record</p><p class="text-sm mt-1">Klik tombol "Tambah Record" untuk menambah data baru.</p></div>',
    columns: tabulatorCols,
  });

  // Delegate click on action buttons
  recordTableInstance.on('cellClick', (e, cell) => {
    const target = e.target.closest('button[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const id = parseInt(target.dataset.id);

    if (action === 'edit') {
      const rec = recordsData.find(r => r.id === id);
      if (rec) openRecordModal(rec);
    } else if (action === 'delete') {
      const rec = recordsData.find(r => r.id === id);
      if (rec) confirmDeleteRecord(rec);
    }
  });
}

// ── Dynamic Form Generator ────────────────────────────
function buildFormInputs(columns, existingData) {
  return columns.map(col => {
    const val = existingData ? (existingData[col.column_name] ?? '') : '';
    const inputId = `rec-field-${col.column_name}`;
    const labelHtml = `<label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">${col.column_label}</label>`;

    let inputHtml = '';
    const baseClass = 'w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm';

    switch (col.data_type) {
      case 'number':
        inputHtml = `<input type="number" id="${inputId}" step="any" value="${val}" placeholder="Masukkan angka" class="${baseClass}" />`;
        break;
      case 'date':
        inputHtml = `<input type="date" id="${inputId}" value="${val}" class="${baseClass}" />`;
        break;
      case 'boolean':
        inputHtml = `
          <select id="${inputId}" class="${baseClass} cursor-pointer">
            <option value="" ${val === '' ? 'selected' : ''}>— Pilih —</option>
            <option value="1" ${String(val) === '1' || val === true ? 'selected' : ''}>Ya</option>
            <option value="0" ${String(val) === '0' || val === false ? 'selected' : ''}>Tidak</option>
          </select>`;
        break;
      case 'select':
        inputHtml = `<input type="text" id="${inputId}" value="${val}" placeholder="Masukkan pilihan" class="${baseClass}" />`;
        break;
      default: // text
        inputHtml = `<input type="text" id="${inputId}" value="${val}" placeholder="Masukkan teks" class="${baseClass}" />`;
        break;
    }

    return `<div>${labelHtml}${inputHtml}</div>`;
  }).join('');
}

function collectFormData(columns) {
  const data = {};
  columns.forEach(col => {
    const el = document.getElementById(`rec-field-${col.column_name}`);
    if (!el) return;
    let val = el.value;
    if (col.data_type === 'number' && val !== '') val = Number(val);
    if (col.data_type === 'boolean' && val !== '') val = Number(val);
    data[col.column_name] = val;
  });
  return data;
}

// ── Open Add/Edit Modal ───────────────────────────────
function openRecordModal(record) {
  const isEdit = !!record;
  const title = isEdit ? 'Edit Data Record' : 'Tambah Data Record';
  const existingData = isEdit
    ? (typeof record.data === 'string' ? JSON.parse(record.data) : (record.data || {}))
    : null;

  if (columnsData.length === 0) {
    showToast('Belum ada kolom skema untuk sub-kategori ini.', 'warning');
    return;
  }

  const bodyHtml = `<form id="record-form" class="space-y-4">${buildFormInputs(columnsData, existingData)}</form>`;
  const footerHtml = `
    <button id="modal-cancel" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all cursor-pointer">Batal</button>
    <button id="modal-save" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 cursor-pointer">${isEdit ? 'Simpan Perubahan' : 'Tambah Record'}</button>
  `;

  openModal(title, bodyHtml, footerHtml);

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', async () => {
    const data = collectFormData(columnsData);

    try {
      if (isEdit) {
        await updateRecord(record.id, { data });
        showToast('Record berhasil diperbarui.', 'success');
      } else {
        await createRecord({ sub_category_id: selectedSubCategoryId, data });
        showToast('Record berhasil ditambahkan.', 'success');
      }
      closeModal();
      await loadColumnsAndRecords();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan record.', 'error');
    }
  });
}

// ── Delete Confirmation ───────────────────────────────
function confirmDeleteRecord(record) {
  const bodyHtml = `
    <div class="text-center py-4">
      <div class="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p class="text-slate-700 dark:text-slate-200 font-semibold text-lg">Hapus Record #${record.id}?</p>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
    </div>`;
  const footerHtml = `
    <button id="modal-cancel" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all cursor-pointer">Batal</button>
    <button id="modal-confirm-delete" class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-md cursor-pointer">Hapus</button>
  `;

  openModal('Konfirmasi Hapus', bodyHtml, footerHtml);

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-confirm-delete').addEventListener('click', async () => {
    try {
      await deleteRecord(record.id);
      showToast('Record berhasil dihapus.', 'success');
      closeModal();
      await loadColumnsAndRecords();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus record.', 'error');
    }
  });
}

// ── Format Excel Modal & Download ─────────────────────
function openFormatExcelModal() {
  if (columnsData.length === 0) {
    showToast('Belum ada kolom skema untuk sub-kategori ini.', 'warning');
    return;
  }

  const bodyHtml = `
    <div class="text-center py-4">
      <div class="w-14 h-14 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <p class="text-slate-800 dark:text-slate-100 font-bold text-lg">Ekspor Format Excel</p>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 px-4 leading-relaxed">
        Ekspor format excel untuk mempermudah penginputan data. Jika data record masih kosong, file hanya berisi header skema kolom.
      </p>
    </div>`;
  const footerHtml = `
    <button id="modal-cancel" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all cursor-pointer">Batal</button>
    <button id="modal-confirm-format" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer">Download Excel</button>
  `;

  openModal('Format Excel', bodyHtml, footerHtml);

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-confirm-format').addEventListener('click', () => {
    try {
      if (typeof XLSX === 'undefined') {
        throw new Error('Library SheetJS tidak ditemukan.');
      }

      // Build data array for worksheet
      const headers = columnsData.map(c => c.column_label);
      const rows = recordsData.map(rec => {
        const parsed = typeof rec.data === 'string' ? JSON.parse(rec.data) : (rec.data || {});
        return columnsData.map(col => parsed[col.column_name] ?? '');
      });

      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      const subSel = document.getElementById('rec-subcategory-selector');
      const subName = (subSel && subSel.options[subSel.selectedIndex]) ? subSel.options[subSel.selectedIndex].text.replace(/[^a-zA-Z0-9_-]/g, '_') : 'format_data';

      XLSX.writeFile(wb, `${subName}_format.xlsx`);
      showToast('Format Excel berhasil didownload.', 'success');
      closeModal();
    } catch (err) {
      showToast(err.message || 'Gagal membuat file Excel.', 'error');
    }
  });
}

// ── Import Excel Modal & Processing ───────────────────
function openImportExcelModal() {
  if (columnsData.length === 0) {
    showToast('Belum ada kolom skema untuk sub-kategori ini.', 'warning');
    return;
  }

  const bodyHtml = `
    <div class="text-center py-4">
      <div class="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <p class="text-slate-800 dark:text-slate-100 font-bold text-lg">Impor dari Excel</p>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 px-4 leading-relaxed">
        Impor dari format excel yang sudah terisi. Sistem akan membaca baris data sesuai skema kolom dan menyimpannya secara otomatis.
      </p>
      <div class="mt-6 text-left">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Pilih File Excel (.xlsx, .xls, .csv)</label>
        <input type="file" id="excel-file-input" accept=".xlsx, .xls, .csv"
          class="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
      </div>
    </div>`;
  const footerHtml = `
    <button id="modal-cancel" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all cursor-pointer">Batal</button>
    <button id="modal-confirm-import" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all shadow-md shadow-amber-600/20 cursor-pointer">Proses Impor</button>
  `;

  openModal('Import Excel', bodyHtml, footerHtml);

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-confirm-import').addEventListener('click', async () => {
    const fileInput = document.getElementById('excel-file-input');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      showToast('Silakan pilih file Excel terlebih dahulu.', 'warning');
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        if (typeof XLSX === 'undefined') {
          throw new Error('Library SheetJS tidak ditemukan.');
        }

        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (jsonData.length === 0) {
          throw new Error('File Excel tidak memiliki baris data.');
        }

        let successCount = 0;
        for (const row of jsonData) {
          const mappedData = {};
          columnsData.forEach(col => {
            // Match by label or by column_name
            let val = row[col.column_label] !== undefined ? row[col.column_label] : row[col.column_name];
            if (val === undefined || val === null) val = '';
            if (col.data_type === 'number' && val !== '') val = Number(val);
            if (col.data_type === 'boolean' && val !== '') val = Number(val);
            mappedData[col.column_name] = val;
          });

          try {
            await createRecord({ sub_category_id: selectedSubCategoryId, data: mappedData });
            successCount++;
          } catch (err) {
            console.warn('Gagal mengimpor baris:', err);
          }
        }

        showToast(`Berhasil mengimpor ${successCount} dari ${jsonData.length} baris data.`, 'success');
        closeModal();
        await loadColumnsAndRecords();
      } catch (err) {
        showToast(err.message || 'Gagal memproses file Excel.', 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  });
}
