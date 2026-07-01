/**
 * Chart Handler — Dynamic Chart.js renderer for Statistic Public View
 * Supports: bar, line, pie, doughnut, area with rich gradient palettes
 */

// Color palettes for chart datasets
const PALETTES = {
  default: [
    'rgba(99, 102, 241, 0.85)',   // indigo
    'rgba(16, 185, 129, 0.85)',   // emerald
    'rgba(245, 158, 11, 0.85)',   // amber
    'rgba(239, 68, 68, 0.85)',    // red
    'rgba(139, 92, 246, 0.85)',   // violet
    'rgba(6, 182, 212, 0.85)',    // cyan
    'rgba(236, 72, 153, 0.85)',   // pink
    'rgba(34, 197, 94, 0.85)',    // green
  ],
  indigo: [
    'rgba(99, 102, 241, 0.9)', 'rgba(129, 140, 248, 0.8)', 'rgba(165, 180, 252, 0.7)',
    'rgba(199, 210, 254, 0.6)', 'rgba(224, 231, 255, 0.5)', 'rgba(238, 242, 255, 0.4)',
  ],
  emerald: [
    'rgba(16, 185, 129, 0.9)', 'rgba(52, 211, 153, 0.8)', 'rgba(110, 231, 183, 0.7)',
    'rgba(167, 243, 208, 0.6)', 'rgba(209, 250, 229, 0.5)', 'rgba(236, 253, 245, 0.4)',
  ],
  rose: [
    'rgba(244, 63, 94, 0.9)', 'rgba(251, 113, 133, 0.8)', 'rgba(253, 164, 175, 0.7)',
    'rgba(254, 205, 211, 0.6)', 'rgba(255, 228, 230, 0.5)', 'rgba(255, 241, 242, 0.4)',
  ],
};

const BORDER_PALETTES = {
  default: [
    'rgb(99, 102, 241)', 'rgb(16, 185, 129)', 'rgb(245, 158, 11)', 'rgb(239, 68, 68)',
    'rgb(139, 92, 246)', 'rgb(6, 182, 212)', 'rgb(236, 72, 153)', 'rgb(34, 197, 94)',
  ],
  indigo: ['rgb(99, 102, 241)', 'rgb(129, 140, 248)', 'rgb(165, 180, 252)', 'rgb(199, 210, 254)', 'rgb(224, 231, 255)', 'rgb(238, 242, 255)'],
  emerald: ['rgb(16, 185, 129)', 'rgb(52, 211, 153)', 'rgb(110, 231, 183)', 'rgb(167, 243, 208)', 'rgb(209, 250, 229)', 'rgb(236, 253, 245)'],
  rose: ['rgb(244, 63, 94)', 'rgb(251, 113, 133)', 'rgb(253, 164, 175)', 'rgb(254, 205, 211)', 'rgb(255, 228, 230)', 'rgb(255, 241, 242)'],
};

let chartInstance = null;

/**
 * Render a Chart.js chart inside the given canvas element
 * @param {string} canvasId - The DOM id of the <canvas> element
 * @param {object} config - { chart_type, title }
 * @param {object} chartData - { labels: [], values: [] }
 * @param {string} palette - palette name from PALETTES
 */
export function renderChart(canvasId, config, chartData, palette = 'default') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Destroy previous chart instance
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const { labels, values } = chartData;
  if (!labels || labels.length === 0) return;

  const colors = PALETTES[palette] || PALETTES.default;
  const borderColors = BORDER_PALETTES[palette] || BORDER_PALETTES.default;
  const chartType = config.chart_type === 'area' ? 'line' : config.chart_type;
  const isCircular = chartType === 'pie' || chartType === 'doughnut';

  const dataset = {
    label: config.title || 'Data',
    data: values,
    backgroundColor: isCircular ? colors.slice(0, values.length) : colors[0],
    borderColor: isCircular ? borderColors.slice(0, values.length) : borderColors[0],
    borderWidth: isCircular ? 2 : 2,
    borderRadius: chartType === 'bar' ? 6 : 0,
    tension: 0.4,
    fill: config.chart_type === 'area',
    hoverOffset: isCircular ? 12 : 0,
  };

  chartInstance = new Chart(ctx, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [dataset],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
      },
      plugins: {
        title: {
          display: !!config.title,
          text: config.title || '',
          font: { size: 16, weight: '600', family: 'Inter, sans-serif' },
          padding: { bottom: 16 },
          color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b',
        },
        legend: {
          display: isCircular,
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            font: { size: 12, family: 'Inter, sans-serif' },
            color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#475569',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Inter, sans-serif', weight: '600' },
          bodyFont: { family: 'Inter, sans-serif' },
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: function (context) {
              let val = context.parsed.y ?? context.parsed;
              if (typeof val === 'number') {
                val = val.toLocaleString('id-ID');
              }
              return ` ${context.dataset.label}: ${val}`;
            },
          },
        },
      },
      scales: isCircular ? {} : {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11, family: 'Inter, sans-serif' },
            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
            maxRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: document.documentElement.classList.contains('dark') ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.2)',
          },
          ticks: {
            font: { size: 11, family: 'Inter, sans-serif' },
            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
            callback: function (value) {
              return value.toLocaleString('id-ID');
            },
          },
        },
      },
    },
  });
}

/**
 * Destroy the current chart (for cleanup)
 */
export function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}
