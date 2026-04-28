// ══ Data stok produksi ══
var stokData = [
  { tanggal: "12/04/26", produk: "Tahu Bulat Cimol",   stok: "Tersedia",     jumlah: 150 },
  { tanggal: "12/04/26", produk: "Tahu Bulat Standar", stok: "Tersedia",     jumlah: 200 },
  { tanggal: "12/04/26", produk: "Tahu Bulat Jumbo",   stok: "Tersedia",     jumlah: 80  },
  { tanggal: "12/04/26", produk: "Sotong",             stok: "Tersedia",     jumlah: 120 },
  { tanggal: "11/04/26", produk: "Tahu Bulat Cimol",   stok: "Habis",        jumlah: 0   },
  { tanggal: "11/04/26", produk: "Tahu Bulat Standar", stok: "Tersedia",     jumlah: 60  },
  { tanggal: "11/04/26", produk: "Sotong",             stok: "Hampir Habis", jumlah: 15  },
  { tanggal: "10/04/26", produk: "Tahu Bulat Jumbo",   stok: "Tersedia",     jumlah: 90  },
  { tanggal: "10/04/26", produk: "Tahu Bulat Cimol",   stok: "Tersedia",     jumlah: 175 },
  { tanggal: "09/04/26", produk: "Sotong",             stok: "Tersedia",     jumlah: 100 },
  { tanggal: "09/04/26", produk: "Tahu Bulat Standar", stok: "Hampir Habis", jumlah: 20  },
  { tanggal: "08/04/26", produk: "Tahu Bulat Jumbo",   stok: "Tersedia",     jumlah: 110 },
  { tanggal: "08/04/26", produk: "Tahu Bulat Cimol",   stok: "Tersedia",     jumlah: 130 },
  { tanggal: "07/04/26", produk: "Sotong",             stok: "Habis",        jumlah: 0   },
  { tanggal: "07/04/26", produk: "Tahu Bulat Standar", stok: "Tersedia",     jumlah: 95  }
];

var editIndex = -1;

// ══ Render tabel ══
function renderTable() {
  var tbody = document.getElementById("stokTableBody");
  tbody.innerHTML = "";

  stokData.forEach(function(row, i) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + row.tanggal + "</td>" +
      "<td>" + row.produk + "</td>" +
      "<td>" + row.stok + "</td>" +
      "<td>" + row.jumlah + "</td>" +
      "<td>" +
        "<button class='edit-btn' onclick='openModal(" + i + ")' title='Edit'>" +
          "<svg width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.8' viewBox='0 0 24 24'>" +
            "<path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/>" +
            "<path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/>" +
          "</svg>" +
        "</button>" +
      "</td>";
    tbody.appendChild(tr);
  });

  updateRingkasan();
}

// ══ Update ringkasan stok ══
function updateRingkasan() {
  var tahuTotal   = 0;
  var sotongTotal = 0;

  stokData.forEach(function(r) {
    if (r.produk.toLowerCase().indexOf("tahu") !== -1) {
      tahuTotal += r.jumlah;
    }
    if (r.produk.toLowerCase().indexOf("sotong") !== -1) {
      sotongTotal += r.jumlah;
    }
  });

  document.getElementById("ringTahu").textContent   = tahuTotal + " pcs";
  document.getElementById("ringSotong").textContent = sotongTotal + " pcs";
}

// ══ Buka modal edit ══
function openModal(i) {
  editIndex = i;
  document.getElementById("editNama").value   = stokData[i].produk;
  document.getElementById("editStok").value   = stokData[i].stok;
  document.getElementById("editJumlah").value = stokData[i].jumlah;
  document.getElementById("modalOverlay").classList.add("show");
}

// ══ Tutup modal ══
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("show");
  editIndex = -1;
}

// ══ Simpan hasil edit ══
function saveEdit() {
  if (editIndex < 0) return;
  stokData[editIndex].stok   = document.getElementById("editStok").value;
  stokData[editIndex].jumlah = parseInt(document.getElementById("editJumlah").value) || 0;
  closeModal();
  renderTable();
  showToast("Stok berhasil diperbarui!");
}

// ══ Toast notifikasi ══
function showToast(msg) {
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(function() { t.classList.remove("show"); }, 3000);
}

// ══ Init ══
window.onload = function() {
  renderTable();
  document.getElementById("modalOverlay").addEventListener("click", function(e) {
    if (e.target === this) closeModal();
  });
};