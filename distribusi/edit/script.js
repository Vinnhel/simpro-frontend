/* ══════════════════════════════════════════════════════════════
   SIMPRO – distribusi/edit/script.js  (terintegrasi)
   Base: commit terbaru (sudah punya logika penuh localStorage)
   Perubahan tambahan:
   - produkData dihapus, pakai SIMPRO_PRODUK dari shared.js
   - generateTanggalOptions() menampilkan tanggal dari stok nyata
   - simpanData() memanggil simpro_updateDistribusi() → selisih
     stok ditangani otomatis
   - Guard login via simpro_requireLogin()
   ══════════════════════════════════════════════════════════════ */

// ── STATE ───────────────────────────────────────────
let currentId      = null;
let distribusiData = JSON.parse(localStorage.getItem('distribusiData')) || [];

// ── DEBOUNCE HELPER ──────────────────────────────────
let calcTimeout;
function debounce(fn, delay = 300) {
  return function(...args) {
    clearTimeout(calcTimeout);
    calcTimeout = setTimeout(() => fn(...args), delay);
  };
}

// ── HELPER: konversi DD/MM/YY → YYYY-MM-DD ──────────
function toISODate(str) {
  if (!str) return '';
  var parts = str.split('/');
  if (parts.length !== 3) return '';
  return '20' + parts[2] + '-' + parts[1] + '-' + parts[0];
}

// ── HELPER: konversi YYYY-MM-DD → DD/MM/YY ──────────
function toDMY(str) {
  if (!str) return '';
  var parts = str.split('-');
  if (parts.length !== 3) return '';
  return parts[2] + '/' + parts[1] + '/' + parts[0].slice(2);
}

// ── FORMAT TANGGAL KADALUARSA ────────────────────────
function formatExpiryDate(date) {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  });
}

// ── GENERATE DROPDOWN TANGGAL PRODUKSI ──────────────
// ← INI YANG BERUBAH: commit baru pakai 7 hari terakhir,
//   sekarang pakai tanggal dari stok nyata + fallback ke tersimpan
function generateTanggalOptions(selectedISO) {
  var sel       = document.getElementById('tgl_produksi');
  var produkKey = document.getElementById('produk').value;
  if (!sel) return;

  sel.innerHTML = '<option value="" disabled>Pilihan Tanggal Produksi</option>';

  // Ambil dari stok nyata
  var tanggalList = produkKey ? simpro_tanggalStokTersedia(produkKey) : [];
  var found       = false;

  tanggalList.forEach(function(item) {
    var opt         = document.createElement('option');
    opt.value       = item.tanggalISO;
    opt.textContent = item.tanggalDMY + ' (sisa: ' + item.jumlah + ' pcs)';
    if (item.tanggalISO === selectedISO) {
      opt.selected = true;
      found = true;
    }
    sel.appendChild(opt);
  });

  // Jika tanggal tersimpan tidak ada di stok saat ini (stok habis), tetap tampilkan
  if (selectedISO && !found) {
    var extraOpt         = document.createElement('option');
    extraOpt.value       = selectedISO;
    extraOpt.textContent = formatLabel(selectedISO) + ' (tersimpan)';
    extraOpt.selected    = true;
    sel.insertBefore(extraOpt, sel.children[1]);
  }
}

// ── FORMAT LABEL SELECT ──────────────────────────────
function formatLabel(isoStr) {
  if (!isoStr) return '';
  var d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

// ── MASTER CALCULATION ───────────────────────────────
function updateCalculations() {
  handleTanggalChange();
  debouncedHitungTotal();
}

// ── HITUNG KADALUARSA OTOMATIS ───────────────────────
function handleTanggalChange() {
  var produk = document.getElementById('produk').value;
  var tgl    = document.getElementById('tgl_produksi').value;

  if (!produk || !tgl) {
    document.getElementById('kadaluarsa').value = '';
    hitungTotal();
    return;
  }

  // ← Pakai SIMPRO_PRODUK bukan produkData lokal
  var shelf    = (SIMPRO_PRODUK[produk] && SIMPRO_PRODUK[produk].shelf) || 3;
  var prodDate = new Date(tgl + 'T00:00:00');
  var expDate  = new Date(prodDate);
  expDate.setDate(prodDate.getDate() + shelf);

  document.getElementById('kadaluarsa').value = formatExpiryDate(expDate);
  hitungTotal();
}

// ── RESET TANGGAL SAAT PRODUK GANTI ─────────────────
function handleProdukChange() {
  var tgl = document.getElementById('tgl_produksi').value;
  generateTanggalOptions(tgl || '');
  if (tgl) {
    handleTanggalChange();
  } else {
    document.getElementById('kadaluarsa').value = '';
    document.getElementById('total').value      = '';
  }
}

// ── HITUNG TOTAL ─────────────────────────────────────
function hitungTotal() {
  var produk = document.getElementById('produk').value;
  var jumlahEl = document.getElementById('jumlah');
  var jumlah = parseInt(jumlahEl.value) || 0;

  // Paksa nilai minimum 1 jika user ketik 0 atau minus
  if (jumlahEl.value !== '' && jumlah < 1) {
    jumlahEl.value = 1;
    jumlah = 1;
  }

  // ← Pakai SIMPRO_PRODUK bukan produkData lokal
  var info  = SIMPRO_PRODUK[produk];
  var harga = info ? info.harga : 0;
  var total = jumlah * harga;

  document.getElementById('total').value =
    total > 0 ? 'Rp ' + total.toLocaleString('id-ID') : '';
}

const debouncedHitungTotal = debounce(hitungTotal);

// ── LOAD DATA KE FORM ────────────────────────────────
function loadDataToForm(data) {
  if (!data) return;
  currentId = data.id ?? null;

  document.getElementById('nama').value           = data.pelanggan      || '';
  document.getElementById('telp_pelanggan').value = data.telp_pelanggan || '';
  document.getElementById('no_kendaraan').value   = data.no_kendaraan   || '';
  document.getElementById('telp_kondektur').value = data.telp_kondektur || '';
  document.getElementById('lokasi').value         = data.lokasi         || '';
  document.getElementById('produk').value         = data.produk         || '';
  document.getElementById('jumlah').value         = data.jumlah         || '';

  var tglProdISO = toISODate(data.tglProduksi || '');
  generateTanggalOptions(tglProdISO);

  if (tglProdISO) {
    document.getElementById('tgl_produksi').value = tglProdISO;
  }

  setTimeout(() => {
    updateCalculations();
    hitungTotal();

    const produkEl = document.getElementById('produk');
    const jumlahEl = document.getElementById('jumlah');
    if (produkEl) produkEl.dispatchEvent(new Event('change', { bubbles: true }));
    if (jumlahEl) jumlahEl.dispatchEvent(new Event('input',  { bubbles: true }));

    setTimeout(hitungTotal, 100);
  }, 600);
}

// ── INIT ─────────────────────────────────────────────
function initEditPage() {
  var params = new URLSearchParams(window.location.search);
  var idStr  = params.get('id');

  if (idStr === null) {
    showToast('ID tidak ditemukan!');
    return;
  }

  var id   = parseInt(idStr, 10);
  var data = distribusiData[id];

  if (!data) {
    showToast('Data tidak ditemukan!');
    return;
  }

  loadDataToForm({ id: id, ...data });
}

// ── SIMPAN DATA ──────────────────────────────────────
// ← INI YANG BERUBAH: selain update distribusiData lokal dan localStorage,
//   sekarang juga memanggil simpro_updateDistribusi() untuk tangani selisih stok
function simpanData() {
  if (currentId === null) return;

  var produk    = document.getElementById('produk').value;
  var jumlah    = parseInt(document.getElementById('jumlah').value) || 0;

  if (jumlah < 1) {
    showToast('⚠️ Jumlah harus minimal 1!');
    return;
  }
  var info      = SIMPRO_PRODUK[produk];
  var harga     = info ? info.harga : 0;
  var totalStr  = document.getElementById('total').value;
  var totalNum  = parseInt(totalStr.replace(/Rp\s*/g, '').replace(/\./g, '')) || (jumlah * harga);

  var tglProdISO = document.getElementById('tgl_produksi').value;
  var tglProdDMY = toDMY(tglProdISO);

  // Update via shared.js → tangani selisih stok otomatis
  var hasil = simpro_updateDistribusi(currentId, {
    pelanggan     : document.getElementById('nama').value,
    telp_pelanggan: document.getElementById('telp_pelanggan').value,
    no_kendaraan  : document.getElementById('no_kendaraan').value,
    telp_kondektur: document.getElementById('telp_kondektur').value,
    lokasi        : document.getElementById('lokasi').value,
    produk        : produk,
    jumlah        : jumlah,
    total         : totalNum,
    tglProduksi   : tglProdDMY,
    kadaluarsa    : document.getElementById('kadaluarsa').value
  });

  // Jika ada error (misal stok tidak cukup), tampilkan pesan dan batalkan
  if (hasil && hasil.error) {
    showToast('⚠️ ' + hasil.error);
    return;
  }

  // Sync variabel lokal agar konsisten
  distribusiData = JSON.parse(localStorage.getItem('distribusiData')) || [];

  showToast('Data berhasil diupdate!');
  setTimeout(function() {
    window.location.href = '../../sejarah-distribusi/index.html';
  }, 1000);
}

// ── RESET FORM ───────────────────────────────────────
function resetForm() {
  var ids = [
    'nama','telp_pelanggan','no_kendaraan','telp_kondektur',
    'lokasi','produk','tgl_produksi','kadaluarsa','jumlah','total'
  ];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  updateCalculations();
  showToast('Form berhasil direset');
}

// ── TOAST ────────────────────────────────────────────
function showToast(pesan) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = pesan;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3000);
}

function logout() {
  simpro_logout();
}

function setupMobileNav() {
  var hamburger = document.getElementById('hamburger');
  if (!hamburger) return;

  var drawer = document.getElementById('navDrawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id        = 'navDrawer';
    drawer.className = 'nav-drawer';
    drawer.innerHTML = `
      <a href="../../dashboard/index.html">Beranda</a>
      <a href="../../produksi/index.html">Produksi</a>
      <a href="#" class="nav-active">Distribusi</a>
      <a href="../../keuntungan/index.html">Laporan Keuntungan</a>
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

  hamburger.addEventListener('click', function() {
    var isOpen = hamburger.classList.toggle('open');
    drawer.classList.toggle('open', isOpen);
  });
}

// ── EVENT LISTENERS ──────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  simpro_requireLogin();

  var produkEl = document.getElementById('produk');
  var tglEl    = document.getElementById('tgl_produksi');
  var jumlahEl = document.getElementById('jumlah');

  if (produkEl) produkEl.addEventListener('change', handleProdukChange);
  if (tglEl)    tglEl.addEventListener('change',    handleTanggalChange);
  if (jumlahEl) jumlahEl.addEventListener('input',  debouncedHitungTotal);

  initEditPage();
  setupMobileNav();
});
