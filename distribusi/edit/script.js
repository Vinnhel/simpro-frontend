/* ══════════════════════════════════════════════════════════════
   SIMPRO – distribusi/edit/script.js  (API version)
   ══════════════════════════════════════════════════════════════ */

let currentId = null; // ID dari database (bukan index)

// ── DEBOUNCE ──────────────────────────────────────────────────────
let calcTimeout;
function debounce(fn, delay = 300) {
  return function(...args) {
    clearTimeout(calcTimeout);
    calcTimeout = setTimeout(() => fn(...args), delay);
  };
}

// ── FORMAT TANGGAL ────────────────────────────────────────────────
function toISODate(str) {
  if (!str) return '';
  if (str.indexOf('-') !== -1) return str; // sudah ISO
  var parts = str.split('/');
  if (parts.length !== 3) return '';
  return '20' + parts[2] + '-' + parts[1] + '-' + parts[0];
}

function toDMY(str) {
  if (!str) return '';
  if (str.indexOf('/') !== -1) return str; // sudah DMY
  var parts = str.split('-');
  if (parts.length !== 3) return '';
  return parts[2] + '/' + parts[1] + '/' + parts[0].slice(2);
}

function formatExpiryDate(date) {
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── DROPDOWN TANGGAL PRODUKSI ─────────────────────────────────────
async function generateTanggalOptions(selectedISO) {
  var sel       = document.getElementById('tgl_produksi');
  var produkKey = document.getElementById('produk').value;
  if (!sel) return;

  sel.innerHTML = '<option value="" disabled>Pilihan Tanggal Produksi</option>';

  var tanggalList = produkKey ? await simpro_tanggalStokTersedia(produkKey) : [];
  var found = false;

  tanggalList.forEach(function(item) {
    var opt = document.createElement('option');
    opt.value       = item.tanggalISO;
    opt.textContent = item.tanggalDMY + ' (sisa: ' + item.jumlah + ' pcs)';
    if (item.tanggalISO === selectedISO) { opt.selected = true; found = true; }
    sel.appendChild(opt);
  });

  // Jika tanggal tersimpan tidak ada di stok saat ini, tetap tampilkan
  if (selectedISO && !found) {
    var d = new Date(selectedISO + 'T00:00:00');
    var label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    var extraOpt = document.createElement('option');
    extraOpt.value       = selectedISO;
    extraOpt.textContent = label + ' (tersimpan)';
    extraOpt.selected    = true;
    sel.insertBefore(extraOpt, sel.children[1]);
  }
}

// ── KALKULASI ─────────────────────────────────────────────────────
function handleTanggalChange() {
  var produk = document.getElementById('produk').value;
  var tgl    = document.getElementById('tgl_produksi').value;
  if (!produk || !tgl) { document.getElementById('kadaluarsa').value = ''; hitungTotal(); return; }

  var shelf    = (SIMPRO_PRODUK[produk] && SIMPRO_PRODUK[produk].shelf) || 3;
  var prodDate = new Date(tgl + 'T00:00:00');
  var expDate  = new Date(prodDate);
  expDate.setDate(prodDate.getDate() + shelf);
  document.getElementById('kadaluarsa').value = formatExpiryDate(expDate);
  hitungTotal();
}

async function handleProdukChange() {
  var tgl = document.getElementById('tgl_produksi').value;
  await generateTanggalOptions(tgl || '');
  if (tgl) handleTanggalChange();
  else { document.getElementById('kadaluarsa').value = ''; document.getElementById('total').value = ''; }
}

function hitungTotal() {
  var produk   = document.getElementById('produk').value;
  var jumlahEl = document.getElementById('jumlah');
  var jumlah   = parseInt(jumlahEl.value) || 0;
  if (jumlahEl.value !== '' && jumlah < 1) { jumlahEl.value = 1; jumlah = 1; }

  var info  = SIMPRO_PRODUK[produk];
  var harga = info ? info.harga : 0;
  var total = jumlah * harga;
  document.getElementById('total').value = total > 0 ? 'Rp ' + total.toLocaleString('id-ID') : '';
}

const debouncedHitungTotal = debounce(hitungTotal);

// ── LOAD DATA KE FORM ─────────────────────────────────────────────
async function loadDataToForm(data) {
  if (!data) return;
  currentId = data.id;

  document.getElementById('nama').value           = data.pelanggan      || '';
  document.getElementById('telp_pelanggan').value = data.telp_pelanggan || '';
  document.getElementById('no_kendaraan').value   = data.no_kendaraan   || '';
  document.getElementById('telp_kondektur').value = data.telp_kondektur || '';
  document.getElementById('lokasi').value         = data.lokasi         || '';
  document.getElementById('produk').value         = data.produk_key     || data.produk || '';
  document.getElementById('jumlah').value         = data.jumlah         || '';

  // tgl_produksi dari DB: YYYY-MM-DD
  var tglProdISO = data.tgl_produksi
    ? (data.tgl_produksi.indexOf('T') !== -1 ? data.tgl_produksi.split('T')[0] : data.tgl_produksi)
    : toISODate(data.tglProduksi || '');

  await generateTanggalOptions(tglProdISO);
  if (tglProdISO) document.getElementById('tgl_produksi').value = tglProdISO;

  setTimeout(() => { handleTanggalChange(); hitungTotal(); }, 300);
}

// ── INIT ──────────────────────────────────────────────────────────
async function initEditPage() {
  var params = new URLSearchParams(window.location.search);
  var idStr  = params.get('id');

  if (!idStr) { showToast('ID tidak ditemukan!'); return; }

  // Ambil semua distribusi lalu cari berdasarkan id atau index
  var allData = await simpro_ambilSemuaDistribusi();
  var data;

  // Coba cari by id (kolom id dari DB)
  data = allData.find(function(d) { return String(d.id) === String(idStr); });

  // Fallback: cari by index (kompatibilitas dengan link lama ?id=0,1,2...)
  if (!data && !isNaN(parseInt(idStr))) {
    data = allData[parseInt(idStr)];
  }

  if (!data) { showToast('Data tidak ditemukan!'); return; }

  await loadDataToForm(data);
}

// ── SIMPAN DATA ───────────────────────────────────────────────────
async function simpanData() {
  if (currentId === null) return;

  var produk   = document.getElementById('produk').value;
  var jumlah   = parseInt(document.getElementById('jumlah').value) || 0;
  if (jumlah < 1) { showToast('⚠️ Jumlah harus minimal 1!'); return; }

  var info     = SIMPRO_PRODUK[produk];
  var harga    = info ? info.harga : 0;
  var totalStr = document.getElementById('total').value;
  var totalNum = parseInt(totalStr.replace(/Rp\s*/g, '').replace(/\./g, '')) || (jumlah * harga);

  var tglProdISO = document.getElementById('tgl_produksi').value;

  var btn = document.getElementById('btnSimpan');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  try {
    var hasil = await simpro_updateDistribusi(currentId, {
      pelanggan     : document.getElementById('nama').value,
      telp_pelanggan: document.getElementById('telp_pelanggan').value,
      no_kendaraan  : document.getElementById('no_kendaraan').value,
      telp_kondektur: document.getElementById('telp_kondektur').value,
      lokasi        : document.getElementById('lokasi').value,
      jumlah        : jumlah,
      total         : totalNum,
      tgl_produksi  : tglProdISO,
      kadaluarsa    : document.getElementById('kadaluarsa').value
    });

    if (hasil && hasil.error) { showToast('⚠️ ' + hasil.error); return; }

    showToast('Data berhasil diupdate!');
    setTimeout(function() {
      window.location.href = '../../sejarah-distribusi/index.html';
    }, 1000);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan'; }
  }
}

// ── RESET FORM ────────────────────────────────────────────────────
function resetForm() {
  ['nama','telp_pelanggan','no_kendaraan','telp_kondektur',
   'lokasi','produk','tgl_produksi','kadaluarsa','jumlah','total']
    .forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  hitungTotal();
  showToast('Form berhasil direset');
}

// ── TOAST ─────────────────────────────────────────────────────────
function showToast(pesan) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = pesan;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3000);
}

function logout() { simpro_logout(); }

// ── EVENT LISTENERS ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
  simpro_requireLogin();

  var produkEl  = document.getElementById('produk');
  var tglEl     = document.getElementById('tgl_produksi');
  var jumlahEl  = document.getElementById('jumlah');

  if (produkEl) produkEl.addEventListener('change', handleProdukChange);
  if (tglEl)    tglEl.addEventListener('change', handleTanggalChange);
  if (jumlahEl) jumlahEl.addEventListener('input', debouncedHitungTotal);

  await initEditPage();
  setupMobileNav();
});

function setupMobileNav() {
  var hamburger = document.getElementById('hamburger');
  if (!hamburger) return;
  var drawer = document.getElementById('navDrawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'navDrawer'; drawer.className = 'nav-drawer';
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
