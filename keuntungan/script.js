/* ══════════════════════════════════════════════════════════════
   SIMPRO – keuntungan/script.js  (terintegrasi)
   Base: commit terbaru (struktur chart & UI lengkap)
   Perubahan:
   - RAW_DATA mock dihapus
   - getFiltered() membaca dari simpro_rekapKeuntungan()
     → hanya distribusi berstatus "Sudah Terkirim"
   - renderKosong() ditampilkan jika belum ada data nyata
   - Guard login via simpro_requireLogin()
   ══════════════════════════════════════════════════════════════ */

'use strict';

// ── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  simpro_requireLogin();

  var periodSelect = document.getElementById('periodSelect');
  var btnExport    = document.getElementById('btnExport');

  updateAll(periodSelect.value);

  periodSelect.addEventListener('change', function () {
    updateAll(periodSelect.value);
  });

  if (btnExport) btnExport.addEventListener('click', exportCSV);

  setupMobileNav();
});

// ── FILTER PERIODE ───────────────────────────────────────────────
// ← INI YANG BERUBAH: dulu pakai RAW_DATA mock, sekarang dari localStorage
function getFiltered(period) {
  var all = simpro_rekapKeuntungan(); // hanya status "Sudah Terkirim"
  if (!all.length) return [];
  switch (period) {
    case 'bulan-ini': return all.slice(-1);
    case '3-bulan':   return all.slice(-3);
    case '6-bulan':   return all.slice(-6);
    case 'tahun-ini': return all;
    default:          return all.slice(-1);
  }
}

// ── UPDATE SEMUA KOMPONEN ────────────────────────────────────────
function updateAll(period) {
  var data = getFiltered(period);

  if (data.length === 0) {
    renderKosong();
    return;
  }

  renderChart(data);
  renderTable(data);
  renderRingkasan(data);
}

// ── STATE KOSONG ─────────────────────────────────────────────────
function renderKosong() {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  var canvas = document.getElementById('keuntunganChart');
  var ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Tulis pesan di canvas
  ctx.save();
  ctx.fillStyle    = '#bbb';
  ctx.font         = '14px DM Sans, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'Belum ada data distribusi berstatus "Sudah Terkirim"',
    canvas.width / 2,
    canvas.height / 2
  );
  ctx.restore();

  var tbody = document.getElementById('detailBody');
  if (tbody) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;padding:32px;color:#aaa;font-style:italic;">' +
      'Data muncul setelah status distribusi diubah ke "Sudah Terkirim".</td></tr>';
  }

  ['sumKeuntungan','sumProduk','avgHari'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = id === 'sumProduk' ? '0 pcs' : 'Rp 0';
  });
}

// ── CHART ────────────────────────────────────────────────────────
var chartInstance = null;

function buildChartData(data) {
  var labels = [];
  var values = [];

  data.forEach(function(row) {
    var pointsPerMonth = 4;
    for (var p = 0; p < pointsPerMonth; p++) {
      var frac = p / pointsPerMonth;
      var wave = Math.sin(frac * Math.PI) * (row.totalKeuntungan * 0.12);
      var base = row.totalKeuntungan * (0.65 + frac * 0.35);
      values.push(Math.round(base + wave));
      labels.push(p === 0 ? row.label : '');
    }
  });

  if (data.length) {
    labels.push('');
    values.push(data[data.length - 1].totalKeuntungan);
  }

  return { labels: labels, values: values };
}

function renderChart(data) {
  var ctx = document.getElementById('keuntunganChart').getContext('2d');
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  var chartData = buildChartData(data);

  var gradient = ctx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0,   'rgba(211, 47, 47, 0.85)');
  gradient.addColorStop(0.6, 'rgba(211, 47, 47, 0.55)');
  gradient.addColorStop(1,   'rgba(211, 47, 47, 0.05)');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels  : chartData.labels,
      datasets: [{
        data                    : chartData.values,
        fill                    : true,
        backgroundColor         : gradient,
        borderColor             : '#D32F2F',
        borderWidth             : 2.5,
        tension                 : 0.42,
        pointRadius             : 0,
        pointHoverRadius        : 5,
        pointHoverBackgroundColor: '#D32F2F',
        pointHoverBorderColor   : '#fff',
        pointHoverBorderWidth   : 2
      }]
    },
    options: {
      responsive         : true,
      maintainAspectRatio: false,
      interaction        : { mode: 'index', intersect: false },
      plugins: {
        legend : { display: false },
        tooltip: {
          backgroundColor: 'rgba(26,26,26,0.88)',
          titleColor     : '#fff',
          bodyColor      : 'rgba(255,255,255,0.75)',
          padding        : 12,
          cornerRadius   : 8,
          displayColors  : false,
          callbacks: {
            title: function(items) { return items[0].label || ''; },
            label: function(item)  {
              return 'Keuntungan: Rp ' + Math.round(item.raw).toLocaleString('id-ID');
            }
          }
        }
      },
      scales: {
        x: {
          grid  : { display: false },
          border: { display: false },
          ticks : {
            color      : '#999',
            font       : { family: 'DM Sans', size: 11 },
            maxRotation: 0,
            callback   : function(val) {
              return this.getLabelForValue(val) || null;
            }
          }
        },
        y: { display: false, beginAtZero: true }
      },
      animation: { duration: 700, easing: 'easeInOutCubic' }
    }
  });
}

// ── TABEL DETAIL ─────────────────────────────────────────────────
function renderTable(data) {
  var tbody = document.getElementById('detailBody');
  if (!tbody) return;

  tbody.innerHTML = data.map(function(row) {
    return '<tr>' +
      '<td>' + row.label + '</td>' +
      '<td>' + row.tahuBulat.toLocaleString('id-ID')    + ' pcs</td>' +
      '<td>' + row.sotong.toLocaleString('id-ID')       + ' pcs</td>' +
      '<td>' + row.totalTerjual.toLocaleString('id-ID') + ' pcs</td>' +
      '<td>Rp ' + row.totalKeuntungan.toLocaleString('id-ID') + '</td>' +
    '</tr>';
  }).join('');
}

// ── RINGKASAN ─────────────────────────────────────────────────────
function renderRingkasan(data) {
  var totalKeuntungan = data.reduce(function(s, r) { return s + r.totalKeuntungan; }, 0);
  var totalProduk     = data.reduce(function(s, r) { return s + r.totalTerjual;    }, 0);
  var totalDays       = data.reduce(function(s, r) { return s + r.days;            }, 0) || 1;
  var avgHari         = totalKeuntungan / totalDays;

  animateValue('sumKeuntungan', totalKeuntungan, function(v) {
    return 'Rp ' + Math.round(v).toLocaleString('id-ID');
  });
  animateValue('sumProduk', totalProduk, function(v) {
    return Math.round(v).toLocaleString('id-ID') + ' pcs';
  });
  animateValue('avgHari', avgHari, function(v) {
    return 'Rp ' + Math.round(v).toLocaleString('id-ID');
  });
}

// ── ANIMASI ANGKA ─────────────────────────────────────────────────
function animateValue(id, target, formatter) {
  var el = document.getElementById(id);
  if (!el) return;

  var duration  = 600;
  var startTime = performance.now();

  function update(now) {
    var elapsed  = now - startTime;
    var progress = Math.min(elapsed / duration, 1);
    var eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatter(target * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── EXPORT CSV ────────────────────────────────────────────────────
function exportCSV() {
  var period = document.getElementById('periodSelect').value;
  var data   = getFiltered(period);

  if (!data.length) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  var header = 'Bulan,Tahu Bulat (pcs),Sotong (pcs),Total Terjual (pcs),Total Keuntungan (Rp)';
  var rows   = data.map(function(r) {
    return [r.label, r.tahuBulat, r.sotong, r.totalTerjual, r.totalKeuntungan].join(',');
  });
  var csv  = [header].concat(rows).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = 'laporan-keuntungan-' + period + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── MOBILE NAV ────────────────────────────────────────────────────
function setupMobileNav() {
  const hamburger = document.getElementById('hamburger');
  if (!hamburger) return;

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
        <button class="btn-icon">
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <circle cx="19" cy="19" r="18" stroke="#A64B4B" stroke-width="1.5" fill="#f2e8e8"/>
            <circle cx="19" cy="15" r="5" stroke="#A64B4B" stroke-width="1.5" fill="none"/>
            <path d="M8 32c0-6 5-10 11-10s11 4 11 10" stroke="#A64B4B" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </svg>
        </button>
        <button class="btn-keluar" onclick="simpro_logout()">Keluar</button>
      </div>
    `;
    document.getElementById('navbar').insertAdjacentElement('afterend', drawer);
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    if (isOpen) {
      drawer.classList.add('open');
    } else {
      drawer.classList.remove('open');
    }
  });
}

function logout() {
  simpro_logout();
}
