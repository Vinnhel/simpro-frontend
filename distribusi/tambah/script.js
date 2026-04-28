// ═══════════════════════════════════════════════
// DATA PRODUK (DISAMBUNG DENGAN STYLE PRODUKSI)
// ═══════════════════════════════════════════════
var produkData = {
  tahu_bulat_cimol:  { harga: 5000, stok: 200, shelf: 3 },
  tahu_bulat_standar:{ harga: 3000, stok: 150, shelf: 2 },
  tahu_bulat_jumbo:  { harga: 7000, stok: 100, shelf: 4 },
  sotong:            { harga: 4000, stok: 120, shelf: 3 }
};

// ═══════════════════════════════════════════════
// GENERATE TANGGAL PRODUKSI
// ═══════════════════════════════════════════════
function generateTanggalOptions() {
  var sel = document.getElementById('tgl_produksi');

  if (!sel) return;

  sel.innerHTML = '<option value="" disabled selected>Pilihan Tanggal Produksi</option>';

  var today = new Date();

  for (var i = 0; i < 7; i++) {
    var d = new Date(today);
    d.setDate(today.getDate() - i);

    var label = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    var val = d.toISOString().split('T')[0];

    var opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;

    sel.appendChild(opt);
  }
}

// ═══════════════════════════════════════════════
// HANDLE PRODUK CHANGE
// ═══════════════════════════════════════════════
function handleProdukChange() {
  document.getElementById('tgl_produksi').value = '';
  document.getElementById('kadaluarsa').value = '';
  document.getElementById('jumlah').value = '';
  document.getElementById('total').value = '';
}

// ═══════════════════════════════════════════════
// HITUNG KADALUARSA
// ═══════════════════════════════════════════════
function handleTanggalChange() {
  var produk = document.getElementById('produk').value;
  var tgl    = document.getElementById('tgl_produksi').value;

  if (!produk || !tgl) return;

  var shelf = produkData[produk].shelf;

  var prodDate = new Date(tgl);
  var expDate  = new Date(prodDate);

  expDate.setDate(prodDate.getDate() + shelf);

  document.getElementById('kadaluarsa').value =
    expDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });

  hitungTotal();
}

// ═══════════════════════════════════════════════
// HITUNG TOTAL HARGA (STYLE PRODUKSI)
// ═══════════════════════════════════════════════
function hitungTotal() {
  var produk = document.getElementById('produk').value;
  var jumlah = parseInt(document.getElementById('jumlah').value) || 0;

  if (!produk || jumlah <= 0) {
    document.getElementById('total').value = '';
    return;
  }

  var data = produkData[produk];

  if (!data) return;

  if (jumlah > data.stok) {
    showToast("Jumlah melebihi stok!");
    document.getElementById('total').value = '';
    return;
  }

  var total = data.harga * jumlah;

  document.getElementById('total').value =
    "Rp " + total.toLocaleString("id-ID");
}

// ═══════════════════════════════════════════════
// RESET FORM (STYLE PRODUKSI)
// ═══════════════════════════════════════════════
function resetForm() {
  var ids = [
    'nama','telp_pelanggan','no_kendaraan','telp_kondektur',
    'lokasi','produk','tgl_produksi','kadaluarsa','jumlah','total'
  ];

  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el) el.value = '';
  }

  showToast("Form berhasil direset");
}

// ═══════════════════════════════════════════════
// SIMPAN DATA (STYLE PRODUKSI)
// ═══════════════════════════════════════════════
function simpanData() {
  var produk = document.getElementById('produk').value;

  if (!produk) {
    showToast("Pilih produk terlebih dahulu!");
    return;
  }

  var data = {
    nama: document.getElementById('nama').value,
    telp: document.getElementById('telp_pelanggan').value,
    kendaraan: document.getElementById('no_kendaraan').value,
    kondektur: document.getElementById('telp_kondektur').value,
    lokasi: document.getElementById('lokasi').value,
    produk: produk,
    tanggal: document.getElementById('tgl_produksi').value,
    kadaluarsa: document.getElementById('kadaluarsa').value,
    jumlah: document.getElementById('jumlah').value,
    total: document.getElementById('total').value
  };

  console.log("DATA DISTRIBUSI:", data);

  showToast("Data berhasil disimpan!");
}

// ═══════════════════════════════════════════════
// TOAST (SAMA DENGAN FILE PRODUKSI)
// ═══════════════════════════════════════════════
function showToast(pesan) {
  var toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = pesan;
  toast.classList.add("show");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
window.onload = function () {
  generateTanggalOptions();
};

function logout() {
  localStorage.removeItem("isLogin");
  window.location.href = "../../login/index.html";
}
