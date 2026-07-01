/**
 * Table Handler — Dynamic Tabulator.js grid for Statistic Public View
 * Translates custom_columns definitions into Tabulator column configs
 */

let tableInstance = null;

/**
 * Build Tabulator column definitions from custom_columns schema
 * @param {Array} columns - Array of custom_column objects from API
 * @returns {Array} Tabulator-compatible column definitions
 */
function buildColumnDefs(columns) {
  const defs = [
    {
      title: '#',
      formatter: 'rownum',
      width: 50,
      hozAlign: 'center',
      headerSort: false,
      cssClass: 'text-slate-400',
    },
  ];

  columns.forEach((col) => {
    const def = {
      title: col.column_label,
      field: col.column_name,
      headerFilter: 'input',
      headerFilterPlaceholder: `Search ${col.column_label}...`,
      sorter: col.data_type === 'number' ? 'number' : 'string',
    };

    // Apply formatting based on data_type
    switch (col.data_type) {
      case 'number':
        def.hozAlign = 'right';
        def.formatter = function (cell) {
          const val = cell.getValue();
          if (val === null || val === undefined) return '-';
          return Number(val).toLocaleString('id-ID');
        };
        break;
      case 'date':
        def.sorter = 'date';
        def.formatter = function (cell) {
          const val = cell.getValue();
          if (!val) return '-';
          try {
            return new Date(val).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
          } catch { return val; }
        };
        break;
      case 'boolean':
        def.hozAlign = 'center';
        def.formatter = function (cell) {
          return cell.getValue() ? '<span class="text-emerald-500 font-bold">✓</span>' : '<span class="text-red-400">✕</span>';
        };
        break;
      default:
        // text, select — no special formatting
        break;
    }

    defs.push(def);
  });

  return defs;
}

/**
 * Render a Tabulator grid inside the given container
 * @param {string} containerId - The DOM id of the container element
 * @param {Array} columns - custom_columns definitions from the API
 * @param {Array} records - data_records array (each with .data object)
 */
export function renderTable(containerId, columns, records) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Destroy previous instance
  if (tableInstance) {
    tableInstance.destroy();
    tableInstance = null;
  }

  // Flatten records: extract .data fields into top-level row object
  const flatData = records.map((rec, idx) => ({
    _id: rec.id,
    _row: idx + 1,
    ...rec.data,
  }));

  const columnDefs = buildColumnDefs(columns);

  const isDark = document.documentElement.classList.contains('dark');

  tableInstance = new Tabulator(`#${containerId}`, {
    data: flatData,
    columns: columnDefs,
    layout: 'fitColumns',
    responsiveLayout: 'collapse',
    pagination: true,
    paginationSize: 20,
    paginationSizeSelector: [10, 20, 50, 100],
    movableColumns: true,
    placeholder: '<div class="text-center py-8 text-slate-400"><p class="text-lg">No data records found</p><p class="text-sm">Add records in the Admin panel to display data here.</p></div>',
    headerSortElement: function(column, dir) {
      if (dir === 'asc') return '<span class="ml-1 text-indigo-400">▲</span>';
      if (dir === 'desc') return '<span class="ml-1 text-indigo-400">▼</span>';
      return '<span class="ml-1 text-slate-400">⇅</span>';
    },
  });
}

/**
 * Destroy the current table (for cleanup)
 */
export function destroyTable() {
  if (tableInstance) {
    tableInstance.destroy();
    tableInstance = null;
  }
}
