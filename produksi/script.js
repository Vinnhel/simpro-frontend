// ══ Data bahan baku per produk ══
var produkData = {
  tahu_bulat_cimol: [
    { nama: "Kacang Kedelai", satuan: "kg",  kebutuhan: 50, harga: 4200  },
  ],
  tahu_bulat_standar: [
    { nama: "Kacang Kedelai", satuan: "kg",  kebutuhan: 50, harga: 15000  },
  ],
  tahu_bulat_jumbo: [
    { nama: "Kacang Kedelai", satuan: "kg",  kebutuhan: 50, harga: 17000  },
  ],
  sotong: [
    { nama: "Terigu + Tapioka", satuan: "kg",  kebutuhan: 10, harga: 1700  },
  ]
};

// ══ Render tabel bahan sesuai produk dipilih ══
function renderTable() {
  var key   = document.getElementById("produkSelect").value;
  var tbody = document.getElementById("tableBody");

  // Reset tabel dan output
  tbody.innerHTML = "";
  document.getElementById("outEstimasi").textContent = "";
  document.getElementById("outBiaya").textContent = "";

  if (!key || !produkData[key]) {
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.colSpan = 5;
    td.style.textAlign = "center";
    td.style.padding = "24px";
    td.style.color = "#999";
    td.style.fontStyle = "italic";
    td.textContent = "Silakan pilih produk terlebih dahulu.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  var bahan = produkData[key];

  for (var i = 0; i < bahan.length; i++) {
    var b = bahan[i];

    var tr         = document.createElement("tr");
    var tdNama     = document.createElement("td");
    var tdSatuan   = document.createElement("td");
    var tdKebu     = document.createElement("td");
    var tdHarga    = document.createElement("td");
    var tdStok     = document.createElement("td");

    tdNama.textContent   = b.nama;
    tdSatuan.textContent = b.satuan;
    tdKebu.textContent   = b.kebutuhan;
    tdHarga.textContent  = "Rp " + b.harga.toLocaleString("id-ID");

    var input        = document.createElement("input");
    input.type       = "number";
    input.min        = "0";
    input.step       = "any";
    input.placeholder= "Input Jumlah";
    input.className  = "stok-input";

    tdStok.appendChild(input);

    tr.appendChild(tdNama);
    tr.appendChild(tdSatuan);
    tr.appendChild(tdKebu);
    tr.appendChild(tdHarga);
    tr.appendChild(tdStok);

    tbody.appendChild(tr);
  }
}

// ══ Hitung estimasi & biaya ══
function hitung() {
  var key = document.getElementById("produkSelect").value;

  if (!key || !produkData[key]) {
    showToast("Pilih produk terlebih dahulu!");
    return;
  }

  var bahan  = produkData[key];
  var inputs = document.querySelectorAll(".stok-input");

  if (inputs.length === 0) {
    showToast("Tabel bahan belum tersedia!");
    return;
  }

  // Hitung estimasi minimum (faktor pembatas = bahan paling terbatas)
  var estimasi = Infinity;

  for (var i = 0; i < inputs.length; i++) {
    var nilaiStr = inputs[i].value.trim();

    // Lewati input yang kosong
    if (nilaiStr === "") continue;

    if (bahan[i].harga === 0) continue;

    var stokNilai = parseFloat(nilaiStr);
    if (isNaN(stokNilai) || stokNilai < 0) stokNilai = 0;

    var kebutuhan = bahan[i].kebutuhan;

    if (kebutuhan > 0) {
      var bisa = Math.floor(stokNilai / kebutuhan);
      if (bisa < estimasi) estimasi = bisa;
    }
  }

  if (!isFinite(estimasi) || isNaN(estimasi)) estimasi = 0;

  // Hitung total biaya produksi
  var totalBiaya = 0;
  for (var j = 0; j < bahan.length; j++) {
    totalBiaya += bahan[j].kebutuhan * estimasi * bahan[j].harga;
  }
  totalBiaya = Math.round(totalBiaya);

  // Tampilkan hasil
  document.getElementById("outEstimasi").textContent = estimasi + " produk";
  document.getElementById("outBiaya").textContent    = "Rp " + totalBiaya.toLocaleString("id-ID");
}

// ══ Reset semua input stok ══
function reset() {
  var inputs = document.querySelectorAll(".stok-input");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].value = "";
  }
  document.getElementById("outEstimasi").textContent = "";
  document.getElementById("outBiaya").textContent    = "";
}

// ══ Simpan hasil ══
function simpan() {
  var est = document.getElementById("outEstimasi").textContent.trim();
  if (est === "") {
    showToast("Hitung terlebih dahulu sebelum menyimpan!");
    return;
  }
  showToast("Hasil perhitungan disimpan!");
}

// ══ Toast notifikasi ══
function showToast(pesan) {
  var toast = document.getElementById("toast");
  toast.textContent = pesan;
  toast.classList.add("show");
  setTimeout(function() {
    toast.classList.remove("show");
  }, 3000);
}

// ══ Init ══
window.onload = function() {
  renderTable();
};