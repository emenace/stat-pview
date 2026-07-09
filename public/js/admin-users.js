import { showToast } from './api-service.js';
import { openModal, closeModal } from './admin.js';

let usersData = [];
let usersTable = null;

// ── API Fetchers ──────────────────────────────────────
async function fetchUsers() {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  const result = await res.json();
  if (!result.success) throw new Error(result.error || 'Unknown error');
  return result;
}

async function saveUser(payload, id = null) {
  const url = id ? `/api/users/${id}` : '/api/users';
  const method = id ? 'PUT' : 'POST';
  
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const result = await res.json();
  if (!res.ok || !result.success) throw new Error(result.error || 'Failed to save user');
  return result;
}

async function deleteUser(id) {
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
  const result = await res.json();
  if (!res.ok || !result.success) throw new Error(result.error || 'Failed to delete user');
  return result;
}

// ── Shell & Init ──────────────────────────────────────
export async function initUserManager() {
  const root = document.getElementById('admin-users-root');
  if (!root) return;
  root.innerHTML = renderUsersShell();

  document.getElementById('btn-add-user').addEventListener('click', () => openUserForm());

  await loadUsers();
}

function renderUsersShell() {
  return `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">Daftar Pengguna</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Kelola akun dan hak akses administrator</p>
      </div>
      <button id="btn-add-user" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        <span>Tambah Pengguna</span>
      </button>
    </div>
    <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
      <div id="users-table-container" class="p-4 overflow-x-auto w-full max-w-full"></div>
    </div>
  `;
}

// ── Data Loading & Table ──────────────────────────────
async function loadUsers() {
  try {
    const res = await fetchUsers();
    usersData = res.data || [];
    renderUsersTable();
  } catch (err) {
    console.error('[UserManager] Load error:', err);
    showToast('Gagal memuat data pengguna', 'error');
  }
}

function renderUsersTable() {
  const container = document.getElementById('users-table-container');
  if (!container) return;

  if (usersTable) {
    usersTable.destroy();
  }

  const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>`;
  const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>`;

  usersTable = new Tabulator('#users-table-container', {
    data: usersData,
    layout: 'fitColumns',
    responsiveLayout: 'collapse',
    pagination: 'local',
    paginationSize: 10,
    columns: [
      { title: 'ID', field: 'id', width: 70, hozAlign: 'center', headerHozAlign: 'center' },
      { title: 'Username', field: 'username', formatter: (cell) => {
          const val = cell.getValue();
          if (val === 'Root') {
            return `<span class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" /></svg>
                      Root (Superuser)
                    </span>`;
          }
          return `<span class="font-medium">${val}</span>`;
      }},
      { title: 'Peran (Role)', field: 'role', formatter: (cell) => {
          const r = cell.getValue();
          return r === 'admin' 
            ? `<span class="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-xs font-bold rounded-md">Admin</span>`
            : `<span class="px-2.5 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold rounded-md">User</span>`;
      }},
      { title: 'Tgl Dibuat', field: 'created_at', formatter: (cell) => {
          return new Date(cell.getValue()).toLocaleString('id-ID', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });
      }},
      {
        title: 'Aksi',
        width: 120,
        hozAlign: 'center',
        headerHozAlign: 'center',
        headerSort: false,
        formatter: (cell) => {
          const data = cell.getData();
          
          let btnEdit = `<button class="btn-edit text-blue-500 hover:text-blue-700 p-1 rounded transition-colors" title="Edit">${editIcon}</button>`;
          let btnDel = `<button class="btn-delete text-red-500 hover:text-red-700 p-1 rounded transition-colors" title="Hapus">${deleteIcon}</button>`;
          
          if (data.username === 'Root') {
            const currentUser = window.currentAdminUser?.username;
            if (currentUser === 'Root') {
               return `<div class="flex items-center justify-center gap-2">${btnEdit}</div>`;
            } else {
               return `<span class="text-xs text-slate-400 italic">Protected</span>`;
            }
          }
          return `<div class="flex items-center justify-center gap-2">${btnEdit}${btnDel}</div>`;
        },
        cellClick: (e, cell) => {
          const action = e.target.closest('button');
          if (!action) return;
          const data = cell.getData();
          
          if (action.classList.contains('btn-edit')) {
            openUserForm(data);
          } else if (action.classList.contains('btn-delete')) {
            confirmDeleteUser(data);
          }
        }
      }
    ]
  });
}

// ── Form Modal ────────────────────────────────────────
function openUserForm(user = null) {
  const isEdit = !!user;
  const isRoot = isEdit && user.username === 'Root';
  
  const title = isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru';
  
  const bodyHtml = `
    <form id="form-user" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Username</label>
        <input type="text" id="usr-username" required value="${isEdit ? user.username : ''}" ${isRoot ? 'disabled' : ''} class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${isRoot ? 'opacity-70 cursor-not-allowed' : ''}">
        ${isRoot ? '<p class="text-[11px] text-amber-500 mt-1">Username Superuser tidak dapat diubah.</p>' : ''}
      </div>
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">${isEdit ? 'Password Baru (Kosongkan jika tidak ingin mengubah)' : 'Password'}</label>
        <input type="password" id="usr-password" ${!isEdit ? 'required' : ''} class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
      </div>
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Peran (Role)</label>
        <select id="usr-role" ${isRoot ? 'disabled' : ''} class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${isRoot ? 'opacity-70 cursor-not-allowed' : ''}">
          <option value="user" ${isEdit && user.role === 'user' ? 'selected' : ''}>User Standar (Viewer)</option>
          <option value="admin" ${isEdit && user.role === 'admin' ? 'selected' : ''}>Administrator</option>
        </select>
        ${isRoot ? '<p class="text-[11px] text-amber-500 mt-1">Hak akses Superuser harus selalu Administrator.</p>' : ''}
      </div>
    </form>
  `;

  const footerHtml = `
    <button type="button" id="btn-cancel-user" class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
      Batal
    </button>
    <button type="button" id="btn-save-user" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all cursor-pointer">
      Simpan
    </button>
  `;

  const closeFn = openModal(title, bodyHtml, footerHtml);

  document.getElementById('btn-cancel-user').onclick = closeFn;
  document.getElementById('btn-save-user').onclick = async () => {
    const username = document.getElementById('usr-username').value.trim();
    const password = document.getElementById('usr-password').value;
    const role = document.getElementById('usr-role').value;
    
    if (!username) {
      return showToast('Username diperlukan', 'error');
    }
    if (!isEdit && !password) {
      return showToast('Password diperlukan untuk pengguna baru', 'error');
    }

    const payload = {};
    if (!isRoot || username !== 'Root') payload.username = username; // Only send username if it's changeable
    if (password) payload.password = password;
    if (!isRoot) payload.role = role;

    try {
      document.getElementById('btn-save-user').disabled = true;
      document.getElementById('btn-save-user').textContent = 'Menyimpan...';
      
      await saveUser(payload, user?.id);
      showToast(isEdit ? 'Pengguna berhasil diperbarui!' : 'Pengguna berhasil ditambahkan!', 'success');
      closeFn();
      loadUsers();
    } catch (err) {
      console.error('[UserManager] Save Error:', err);
      showToast(err.message || 'Gagal menyimpan pengguna', 'error');
    } finally {
      const btn = document.getElementById('btn-save-user');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Simpan';
      }
    }
  };
}

// ── Delete Handler ────────────────────────────────────
function confirmDeleteUser(user) {
  if (user.username === 'Root') {
    return showToast('Superuser Root tidak dapat dihapus', 'error');
  }

  if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.username}"?`)) return;

  deleteUser(user.id)
    .then(() => {
      showToast('Pengguna berhasil dihapus', 'success');
      loadUsers();
    })
    .catch((err) => {
      console.error('[UserManager] Delete Error:', err);
      showToast(err.message || 'Gagal menghapus pengguna', 'error');
    });
}
