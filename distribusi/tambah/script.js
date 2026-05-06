/* ══════════════════════════════════════════════════════════════
   SIMPRO – distribusi/tambah/script.js  (API version)
   ══════════════════════════════════════════════════════════════ */

// ══ Generate tanggal produksi tersedia ══
async function generateTanggalOptions() {
  var produkKey = document.getElementById('produk').value;
  var sel       = document.getElementById('tgl_produksi');
  sel.innerHTML = '<option value="" disabled selected>Pilihan Tanggal Produksi</option>';
  if (!produkKey) return;

  var tanggalList = await simpro_tanggalStokTersedia(produkKey);

  if (tanggalList.length === 0) {
    var opt = document.createElement('option');
    opt.disabled = true;
    opt.textContent = 'Tidak ada stok tersedia untuk produk ini';
    sel.appendChild(opt);
    _setInfoStok('');
    return;
  }

  tanggalList.forEach(function(item) {
    var opt         = document.createElement('option');
    opt.value       = item.tanggalISO;
    opt.dataset.dmy = item.tanggalDMY;
    opt.textContent = item.tanggalDMY + ' (sisa: ' + item.jumlah + ' pcs)';
    sel.appendChild(opt);
  });

  var stokAda = tanggalList.reduce(function(s, i) { return s + i.jumlah; }, 0);
  _setInfoStok('Total stok tersedia: ' + stokAda + ' pcs');
}

// ══ Handle produk change ══
async function handleProdukChange() {
  document.getElementById('tgl_produksi').value = '';
  document.getElementById('kadaluarsa').value   = '';
  document.getElementById('jumlah').value       = '';
  document.getElementById('total').value        = '';
  _setInfoStok('');
  await generateTanggalOptions();
}

// ══ Handle tanggal change → hitung kadaluarsa ══
function handleTanggalChange() {
  var produkKey = document.getElementById('produk').value;
  var tgl       = document.getElementById('tgl_produksi').value;
  if (!produkKey || !tgl) return;

  var shelf    = SIMPRO_PRODUK[produkKey] ? SIMPRO_PRODUK[produkKey].shelf : 3;
  var prodDate = new Date(tgl + 'T00:00:00');
  var expDate  = new Date(prodDate);
  expDate.setDate(prodDate.getDate() + shelf);

  document.getElementById('kadaluarsa').value =
    expDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });

  hitungTotal();
}

// ══ Hitung total harga ══
function hitungTotal() {
  var produkKey = document.getElementById('produk').value;
  var jumlah    = parseInt(document.getElementById('jumlah').value) || 0;

  if (!produkKey || jumlah <= 0) {
    document.getElementById('total').value = '';
    return;
  }

  var produk = SIMPRO_PRODUK[produkKey];
  if (!produk) return;

  document.getElementById('total').value = 'Rp ' + (produk.harga * jumlah).toLocaleString('id-ID');
}

// ══ Reset form ══
function resetForm() {
  ['nama','telp_pelanggan','no_kendaraan','telp_kondektur',
   'lokasi','produk','tgl_produksi','kadaluarsa','jumlah','total']
    .forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
  _setInfoStok('');
  showToast('Form berhasil direset');
}

// ══ Simpan data ══
async function simpanData() {
  var produkKey = document.getElementById('produk').value;
  if (!produkKey) { showToast('Pilih produk terlebih dahulu!'); return; }

  var nama     = document.getElementById('nama').value.trim();
  var telp     = document.getElementById('telp_pelanggan').value.trim();
  var noKend   = document.getElementById('no_kendaraan').value.trim();
  var telpKond = document.getElementById('telp_kondektur').value.trim();
  var lokasi   = document.getElementById('lokasi').value.trim();
  var tglISO   = document.getElementById('tgl_produksi').value;
  var jumlahStr = document.getElementById('jumlah').value.trim();

  if (!nama)                                   { showToast('Nama pelanggan harus diisi!'); return; }
  if (!tglISO)                                 { showToast('Pilih tanggal produksi!'); return; }
  if (!jumlahStr || parseInt(jumlahStr) <= 0)  { showToast('Jumlah harus lebih dari 0!'); return; }

  var btn = document.getElementById('btnSimpan');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  try {
    var hasil = await simpro_tambahDistribusi({
      pelanggan     : nama,
      telp_pelanggan: telp,
      no_kendaraan  : noKend,
      telp_kondektur: telpKond,
      lokasi        : lokasi,
      produk        : produkKey,
      tglProduksi   : tglISO,
      jumlah        : parseInt(jumlahStr, 10)
    });

    if (hasil.error) { showToast(hasil.error); return; }

    showToast('Data berhasil disimpan!');
    setTimeout(function() {
      window.location.href = '../../sejarah-distribusi/index.html';
    }, 1200);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan'; }
  }
}

// ══ Helper ══
function _setInfoStok(teks) {
  var el = document.getElementById('stok-info');
  if (el) el.textContent = teks;
}

function showToast(pesan) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = pesan;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

function logout() { simpro_logout(); }

// ══ Init ══
window.onload = function() {
  simpro_requireLogin();
  setupMobileNav();
};

function setupMobileNav() {
  const hamburger = document.getElementById('hamburger');
  if (!hamburger) return;
  let drawer = document.getElementById('navDrawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'navDrawer';
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
  if (!hamburger.dataset.listenerSet) {
    hamburger.dataset.listenerSet = 'true';
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      drawer.classList.toggle('open', isOpen);
    });
  }
}
