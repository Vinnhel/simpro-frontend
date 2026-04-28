/* ══════════════════════════════════════════
   SIMPRO – Laporan Keuntungan | script.js
   ══════════════════════════════════════════ */

'use strict';

/* ── CONFIG ── */
const HARGA = {
  tahuBulat: 2500,   // Rp per pcs
  sotong:    3000,   // Rp per pcs
};

/* ── MOCK DATA (replace with real API/localStorage reads) ── */
const RAW_DATA = generateMockData();

function generateMockData() {
  const months = [
    'Jan','Feb','Mar','Apr','Mei','Jun',
    'Jul','Agu','Sep','Okt','Nov','Des'
  ];
  const year = new Date().getFullYear();
  const curMonth = new Date().getMonth(); // 0-based

  return months.slice(0, curMonth + 1).map((m, i) => {
    const tahu  = Math.floor(Math.random() * 300 + 120);
    const sotong = Math.floor(Math.random() * 250 + 80);
    return {
      label: `${m} ${year}`,
      month: i,
      tahuBulat: tahu,
      sotong: sotong,
      totalTerjual: tahu + sotong,
      totalKeuntungan: tahu * HARGA.tahuBulat + sotong * HARGA.sotong,
      days: new Date(year, i + 1, 0).getDate(),
    };
  });
}

/* ── PERIOD FILTER ── */
function getFiltered(period) {
  const all = RAW_DATA;
  if (!all.length) return [];
  switch (period) {
    case 'bulan-ini':  return all.slice(-1);
    case '3-bulan':    return all.slice(-3);
    case '6-bulan':    return all.slice(-6);
    case 'tahun-ini':  return all;
    default:           return all.slice(-1);
  }
}

/* ── CHART ── */
let chartInstance = null;

function buildChartData(data) {
  // Create smooth area dataset from daily-point simulation
  const labels = [];
  const values = [];

  data.forEach(row => {
    // Simulate ~4 data points per month for smoother look
    const pointsPerMonth = 4;
    for (let p = 0; p < pointsPerMonth; p++) {
      const frac = p / pointsPerMonth;
      // Add slight wave for visual richness
      const wave = Math.sin(frac * Math.PI) * (row.totalKeuntungan * 0.15);
      const base = row.totalKeuntungan * (0.6 + frac * 0.4);
      values.push(Math.round(base + wave));
      labels.push(p === 0 ? row.label : '');
    }
  });
  // Final point
  if (data.length) {
    labels.push('');
    values.push(data[data.length - 1].totalKeuntungan);
  }

  return { labels, values };
}

function renderChart(data) {
  const ctx = document.getElementById('keuntunganChart').getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const { labels, values } = buildChartData(data);

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, 'rgba(211, 47, 47, 0.85)');
  gradient.addColorStop(0.6, 'rgba(211, 47, 47, 0.55)');
  gradient.addColorStop(1, 'rgba(211, 47, 47, 0.05)');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        fill: true,
        backgroundColor: gradient,
        borderColor: '#D32F2F',
        borderWidth: 2.5,
        tension: 0.42,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#D32F2F',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(26,26,26,0.88)',
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,0.75)',
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const label = items[0].label;
              return label || '';
            },
            label: (item) => {
              return 'Keuntungan: ' + formatRupiah(item.raw);
            },
          }
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#999',
            font: { family: 'DM Sans', size: 11 },
            maxRotation: 0,
            callback: function(val, idx) {
              return this.getLabelForValue(val) || null;
            },
          }
        },
        y: {
          display: false,
          beginAtZero: true,
        }
      },
      animation: {
        duration: 700,
        easing: 'easeInOutCubic',
      },
    }
  });
}

/* ── TABLE ── */
function renderTable(data) {
  const tbody = document.getElementById('detailBody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:24px;">Tidak ada data</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(row => `
    <tr>
      <td>${row.label}</td>
      <td>${row.tahuBulat.toLocaleString('id')} pcs</td>
      <td>${row.sotong.toLocaleString('id')} pcs</td>
      <td>${row.totalTerjual.toLocaleString('id')} pcs</td>
      <td>${formatRupiah(row.totalKeuntungan)}</td>
    </tr>
  `).join('');
}

/* ── RINGKASAN ── */
function renderRingkasan(data) {
  const totalKeuntungan = data.reduce((s, r) => s + r.totalKeuntungan, 0);
  const totalProduk     = data.reduce((s, r) => s + r.totalTerjual, 0);
  const totalDays       = data.reduce((s, r) => s + r.days, 0) || 1;
  const avgHari         = totalKeuntungan / totalDays;

  animateValue('sumKeuntungan', totalKeuntungan, formatRupiah);
  animateValue('sumProduk', totalProduk, v => v.toLocaleString('id') + ' pcs');
  animateValue('avgHari', avgHari, formatRupiah);
}

/* ── NUMBER ANIMATION ── */
function animateValue(id, target, formatter) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = 0;
  const duration = 600;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    el.textContent = formatter(current);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ── HELPERS ── */
function formatRupiah(val) {
  return 'Rp ' + Math.round(val).toLocaleString('id');
}

/* ── UPDATE ALL ── */
function updateAll(period) {
  const data = getFiltered(period);
  renderChart(data);
  renderTable(data);
  renderRingkasan(data);
}

/* ── EXPORT (CSV) ── */
function exportCSV() {
  const period = document.getElementById('periodSelect').value;
  const data   = getFiltered(period);

  const header = 'Bulan,Tahu Bulat (pcs),Sotong (pcs),Total Terjual (pcs),Total Keuntungan (Rp)';
  const rows   = data.map(r =>
    `${r.label},${r.tahuBulat},${r.sotong},${r.totalTerjual},${r.totalKeuntungan}`
  );
  const csv = [header, ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `laporan-keuntungan-${period}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── HAMBURGER / MOBILE NAV ── */
function setupMobileNav() {
  const hamburger = document.getElementById('hamburger');
  if (!hamburger) return;

  // Build drawer dynamically
  let drawer = document.getElementById('navDrawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'navDrawer';
    drawer.className = 'nav-drawer';
    drawer.innerHTML = `
  <a href="../dashboard/index.html">Beranda</a>
  <a href="../produksi/index.html">Produksi</a>
  <a href="../stok-produksi/index.html">Distribusi</a>
  <a href="#" class="nav-active">Laporan Keuntungan</a>
      <div class="drawer-bottom">
        <button class="btn-icon" aria-label="Profil">
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="19" cy="19" r="18" stroke="#A64B4B" stroke-width="1.5" fill="#f2e8e8"/>
          <circle cx="19" cy="15" r="5" stroke="#A64B4B" stroke-width="1.5" fill="none"/>
          <path d="M8 32c0-6 5-10 11-10s11 4 11 10" stroke="#A64B4B" stroke-width="1.5" stroke-linecap="round" fill="none"/>
</svg>
        </button>
        <button class="btn-keluar">Keluar</button>
      </div>
    `;
    document.getElementById('navbar').insertAdjacentElement('afterend', drawer);
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    if (isOpen) {
      drawer.style.display = 'flex';
      // Force reflow then add open class for transition
      requestAnimationFrame(() => drawer.classList.add('open'));
    } else {
      drawer.classList.remove('open');
      setTimeout(() => { drawer.style.display = 'none'; }, 300);
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !drawer.contains(e.target)) {
      if (hamburger.classList.contains('open')) {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        setTimeout(() => { drawer.style.display = 'none'; }, 300);
      }
    }
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  const periodSelect = document.getElementById('periodSelect');
  const btnExport    = document.getElementById('btnExport');

  // Initial render
  updateAll(periodSelect.value);

  // Period change
  periodSelect.addEventListener('change', () => {
    updateAll(periodSelect.value);
  });

  // Export
  btnExport.addEventListener('click', exportCSV);

  // Mobile nav
  setupMobileNav();
});
