/* ══════════════════════════════════════════════════════════════
   SIMPRO – sejarah-distribusi/script.js  (terintegrasi)
   Base: commit terbaru (sudah pakai localStorage "distribusiData")
   Perubahan tambahan:
   - Seed data dihapus → data nyata dari localStorage
   - updateStatus() sekarang memperbarui via simpro_updateDistribusi()
   - Tambah tombol hapus → memanggil simpro_hapusDistribusi()
     + stok dikembalikan otomatis
   - optionsHtml() disesuaikan dengan 3 status konsep:
     Belum Dikirim / Sedang Dikirim / Sudah Terkirim
   - simpanBuat() (modal cepat) → simpro_tambahDistribusi()
   - Guard login via simpro_requireLogin()
   ══════════════════════════════════════════════════════════════ */

// Tidak ada seed data lagi — data nyata dari localStorage

var perPage     = 15;
var currentPage = 1;
var editIndex   = -1;

function totalPages() {
  return Math.ceil(simpro_ambilSemuaDistribusi().length / perPage);
}

// ══ Render tabel ══
function renderTable() {
  // ← INI YANG BERUBAH: dulu var allData = seed dummy, sekarang baca dari localStorage
  var allData = simpro_ambilSemuaDistribusi();
  var tbody   = document.getElementById('distribusiTableBody');
  tbody.innerHTML = '';

  if (allData.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:32px;color:#aaa;font-style:italic;">' +
      'Belum ada data distribusi. Tambahkan distribusi baru.</td></tr>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  var start    = (currentPage - 1) * perPage;
  var end      = Math.min(start + perPage, allData.length);
  var pageData = allData.slice(start, end);

  pageData.forEach(function(row, idx) {
    var realIdx = start + idx;
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + (row.tglDistribusi || '-') + '</td>' +
      '<td>' + (row.pelanggan     || '-') + '</td>' +
      '<td>' + (row.tglProduksi   || '-') + '</td>' +
      '<td>' + (row.jumlah        || 0)   + '</td>' +
      '<td>' +
        "<button class='edit-btn' onclick='openModal(" + realIdx + ")' title='Edit'>" +
          "<svg width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.8' viewBox='0 0 24 24'>" +
            "<path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/>" +
            "<path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/>" +
          '</svg>' +
        '</button> ' +
        // ← TOMBOL HAPUS (baru)
        "<button class='edit-btn' onclick='konfirmasiHapus(" + realIdx + ")' title='Hapus' style='color:#c0392b;margin-left:4px;'>" +
          "<svg width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.8' viewBox='0 0 24 24'>" +
            "<polyline points='3 6 5 6 21 6'/>" +
            "<path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/>" +
            "<path d='M10 11v6M14 11v6'/>" +
          '</svg>' +
        '</button>' +
      '</td>' +
      '<td>' +
        "<select class='status-select " + _statusClass(row.status) + "' onchange='updateStatus(" + realIdx + ", this.value)'>" +
          optionsHtml(row.status) +
        '</select>' +
      '</td>';
    tbody.appendChild(tr);
  });

  renderPagination();
}

// ── Status CSS class ──
function _statusClass(status) {
  switch (status) {
    case 'Sudah Terkirim': return 'status-terkirim';
    case 'Sedang Dikirim': return 'status-dikirim';
    default:               return 'status-belum';
  }
}

// ← INI YANG BERUBAH: 3 status sesuai konsep (bukan Dikirim/Selesai/Pending/Dibatalkan)
function optionsHtml(selected) {
  var opts = ['Belum Dikirim', 'Sedang Dikirim', 'Sudah Terkirim'];
  return opts.map(function(o) {
    return "<option value='" + o + "'" + (o === selected ? ' selected' : '') + '>' + o + '</option>';
  }).join('');
}

// ← INI YANG BERUBAH: dulu hanya update array lokal, sekarang via shared.js
function updateStatus(i, val) {
  simpro_updateDistribusi(i, { status: val });
  renderTable(); // re-render agar warna badge ikut berubah
  showToast('Status diperbarui: ' + val);
}

// ── Hapus distribusi (baru) ──
function konfirmasiHapus(i) {
  if (!confirm('Hapus data distribusi ini? Stok akan dikembalikan.')) return;
  simpro_hapusDistribusi(i);
  if (currentPage > totalPages()) currentPage = Math.max(1, totalPages());
  renderTable();
  showToast('Data dihapus dan stok dikembalikan.');
}

// ══ Render pagination ══
function renderPagination() {
  var pg    = document.getElementById('pagination');
  pg.innerHTML = '';
  var total = totalPages();
  if (total <= 1) return;

  var prev = document.createElement('button');
  prev.className   = 'page-btn';
  prev.textContent = '‹';
  prev.disabled    = currentPage === 1;
  prev.onclick     = function() {
    if (currentPage > 1) { currentPage--; renderTable(); }
  };
  pg.appendChild(prev);

  [1, 2, 3].forEach(function(p) {
    if (p > total) return;
    var btn = document.createElement('button');
    btn.className   = 'page-btn' + (p === currentPage ? ' active' : '');
    btn.textContent = p;
    btn.onclick     = (function(page) {
      return function() { currentPage = page; renderTable(); };
    })(p);
    pg.appendChild(btn);
  });

  if (total > 4) {
    var dots = document.createElement('span');
    dots.className   = 'page-dots';
    dots.textContent = '...';
    pg.appendChild(dots);
  }

  if (total > 3) {
    var lastBtn = document.createElement('button');
    lastBtn.className   = 'page-btn' + (total === currentPage ? ' active' : '');
    lastBtn.textContent = total;
    lastBtn.onclick     = function() { currentPage = total; renderTable(); };
    pg.appendChild(lastBtn);
  }

  var next = document.createElement('button');
  next.className   = 'page-btn';
  next.textContent = '›';
  next.disabled    = currentPage === total;
  next.onclick     = function() {
    if (currentPage < total) { currentPage++; renderTable(); }
  };
  pg.appendChild(next);
}

// ══ Modal Edit cepat ══
function openModal(i) {
  // Redirect ke halaman edit lengkap (sesuai commit baru)
  window.location.href = '../distribusi/edit/edit.html?id=' + i;
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  editIndex = -1;
}

function saveEdit() {
  if (editIndex < 0) return;
  // ← INI YANG BERUBAH: dulu update array lokal saja
  simpro_updateDistribusi(editIndex, {
    pelanggan: document.getElementById('editPelanggan').value,
    jumlah   : parseInt(document.getElementById('editJumlah').value) || 0,
    status   : document.getElementById('editStatus').value
  });
  closeModal();
  renderTable();
  showToast('Distribusi berhasil diperbarui!');
}

// ══ Modal Buat Baru (shortcut) ══
function openModalBuat() {
  var today = new Date();
  var iso   = today.toISOString().split('T')[0];
  document.getElementById('buatTanggal').value     = iso;
  document.getElementById('buatTanggalProd').value = iso;
  document.getElementById('buatPelanggan').value   = '';
  document.getElementById('buatJumlah').value      = '';
  document.getElementById('buatStatus').value      = 'Belum Dikirim';
  document.getElementById('modalBuat').classList.add('show');
}

function closeBuat() {
  document.getElementById('modalBuat').classList.remove('show');
}

// ← INI YANG BERUBAH: redirect ke form tambah lengkap agar stok tervalidasi
function simpanBuat() {
  closeBuat();
  window.location.href = '../distribusi/tambah/tambah.html';
}

// ══ Toast ══
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3000);
}

// ══ Init ══
window.onload = function() {
  simpro_requireLogin();
  renderTable();
  ['modalOverlay', 'modalBuat'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.remove('show');
          editIndex = -1;
        }
      });
    }
  });
};

function logout() {
  simpro_logout();
}

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
      <a href="#" class="nav-active">Distribusi</a>
      <a href="../keuntungan/index.html">Laporan Keuntungan</a>
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

document.addEventListener('DOMContentLoaded', setupMobileNav);
