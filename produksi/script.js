// ── DATA BAHAN BAKU ──────────────────────────────────────────────
var produkData = {
  tahu_bulat_cimol:   [{ nama: 'Kacang Kedelai',    satuan: 'kg', kebutuhan: 50, harga: 4200  }],
  tahu_bulat_standar: [{ nama: 'Kacang Kedelai',    satuan: 'kg', kebutuhan: 50, harga: 15000 }],
  tahu_bulat_jumbo:   [{ nama: 'Kacang Kedelai',    satuan: 'kg', kebutuhan: 50, harga: 17000 }],
  sotong:             [{ nama: 'Terigu + Tapioka',  satuan: 'kg', kebutuhan: 10, harga: 1700  }]
};

// ══ Render tabel bahan ══
function renderTable() {
  var key   = document.getElementById('produkSelect').value;
  var tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  document.getElementById('outEstimasi').textContent = '';
  document.getElementById('outBiaya').textContent    = '';

  if (!key || !produkData[key]) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.colSpan = 5; td.style.textAlign = 'center';
    td.style.padding = '24px'; td.style.color = '#999'; td.style.fontStyle = 'italic';
    td.textContent = 'Silakan pilih produk terlebih dahulu.';
    tr.appendChild(td); tbody.appendChild(tr);
    return;
  }

  produkData[key].forEach(function(b) {
    var tr = document.createElement('tr');
    var input = document.createElement('input');
    input.type = 'number'; input.min = '0'; input.step = 'any';
    input.placeholder = 'Input Jumlah'; input.className = 'stok-input';

    tr.innerHTML =
      '<td>' + b.nama + '</td>' +
      '<td>' + b.satuan + '</td>' +
      '<td>' + b.kebutuhan + '</td>' +
      '<td>Rp ' + b.harga.toLocaleString('id-ID') + '</td>';
    var tdStok = document.createElement('td');
    tdStok.appendChild(input);
    tr.appendChild(tdStok);
    tbody.appendChild(tr);
  });
}

// ══ Hitung estimasi & biaya ══
function hitung() {
  var key = document.getElementById('produkSelect').value;
  if (!key || !produkData[key]) { showToast('Pilih produk terlebih dahulu!'); return; }

  var bahan  = produkData[key];
  var inputs = document.querySelectorAll('.stok-input');
  if (inputs.length === 0) { showToast('Tabel bahan belum tersedia!'); return; }

  var estimasi = Infinity;
  for (var i = 0; i < inputs.length; i++) {
    var nilaiStr = inputs[i].value.trim();
    if (nilaiStr === '') continue;
    var stokNilai = parseFloat(nilaiStr);
    if (isNaN(stokNilai) || stokNilai < 0) stokNilai = 0;
    var kebutuhan = bahan[i].kebutuhan;
    if (kebutuhan > 0) {
      var bisa = Math.floor(stokNilai / kebutuhan);
      if (bisa < estimasi) estimasi = bisa;
    }
  }
  if (!isFinite(estimasi) || isNaN(estimasi)) estimasi = 0;

  var totalBiaya = 0;
  for (var j = 0; j < bahan.length; j++) {
    totalBiaya += bahan[j].kebutuhan * estimasi * bahan[j].harga;
  }

  document.getElementById('outEstimasi').textContent = estimasi + ' produk';
  document.getElementById('outBiaya').textContent    = 'Rp ' + Math.round(totalBiaya).toLocaleString('id-ID');
}

function reset() {
  document.querySelectorAll('.stok-input').forEach(function(i) { i.value = ''; });
  document.getElementById('outEstimasi').textContent = '';
  document.getElementById('outBiaya').textContent    = '';
}

// ══ Simpan hasil → POST ke backend ══
async function simpan() {
  var key = document.getElementById('produkSelect').value;
  var est = document.getElementById('outEstimasi').textContent.trim();

  if (est === '') { showToast('Hitung terlebih dahulu sebelum menyimpan!'); return; }

  var jumlah = parseInt(est, 10);
  var biaya  = document.getElementById('outBiaya').textContent.trim();

  var btn = document.getElementById('btnSimpan');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  try {
    var hasil = await simpro_simpanHasilProduksi(key, jumlah, biaya);
    if (hasil && hasil.error) {
      showToast('Gagal: ' + hasil.error);
    } else {
      showToast('Hasil perhitungan disimpan! ' + jumlah + ' pcs masuk ke stok.');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan'; }
  }
}

// ══ Toast ══
function showToast(pesan) {
  var toast = document.getElementById('toast');
  toast.textContent = pesan;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

// ══ Init ══
window.onload = function() {
  simpro_requireLogin();
  renderTable();
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
      <a href="../dashboard/index.html">Beranda</a>
      <a href="#" class="nav-active">Produksi</a>
      <a href="../stok-produksi/index.html">Distribusi</a>
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
  if (!hamburger.dataset.listenerSet) {
    hamburger.dataset.listenerSet = 'true';
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      drawer.classList.toggle('open', isOpen);
    });
  }
}
