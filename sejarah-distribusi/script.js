// ══ Data distribusi ══
var allData = [];

var pelangganList = [
  "Warung Bu Sari",
  "Toko Maju",
  "RM Sederhana",
  "Kantin Sekolah",
  "Warung Pak Budi",
  "Restoran Nusantara"
];

var statusList = ["Dikirim", "Selesai", "Pending", "Dibatalkan"];

function pad(n) { return n < 10 ? "0" + n : "" + n; }

function padDate(d) {
  return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + String(d.getFullYear()).slice(2);
}

// Generate 25 sample data
for (var i = 0; i < 25; i++) {
  var d  = new Date(2026, 3, 27 - i);
  var dp = new Date(2026, 3, 25 - i);
  allData.push({
    tglDistribusi: padDate(d),
    pelanggan:     pelangganList[i % pelangganList.length],
    tglProduksi:   padDate(dp),
    jumlah:        50 + (i * 13 % 200),
    status:        statusList[i % statusList.length]
  });
}

// ══ Pagination ══
var perPage     = 15;
var currentPage = 1;
var editIndex   = -1;

function totalPages() {
  return Math.ceil(allData.length / perPage);
}

// ══ Render tabel ══
function renderTable() {
  var tbody = document.getElementById("distribusiTableBody");
  tbody.innerHTML = "";

  var start    = (currentPage - 1) * perPage;
  var end      = Math.min(start + perPage, allData.length);
  var pageData = allData.slice(start, end);

  pageData.forEach(function(row, idx) {
    var realIdx = start + idx;
    var tr = document.createElement("tr");
    tr.innerHTML =
  "<td>" + row.tglDistribusi + "</td>" +
  "<td>" + row.pelanggan + "</td>" +
  "<td>" + row.tglProduksi + "</td>" +
  "<td>" + row.jumlah + "</td>" +
  "<td>" +
    "<button class='edit-btn' onclick='openModal(" + realIdx + ")' title='Edit'>" +
      "<svg width='15' height='15' fill='none' stroke='currentColor' stroke-width='1.8' viewBox='0 0 24 24'>" +
        "<path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/>" +
        "<path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/>" +
      "</svg>" +
    "</button>" +
  "</td>" +
  "<td>" +
    "<select class='status-select' onchange='updateStatus(" + realIdx + ", this.value)'>" +
      optionsHtml(row.status) +
    "</select>" +
  "</td>";
    tbody.appendChild(tr);
  });

  renderPagination();
}

function optionsHtml(selected) {
  var opts = ["Dikirim", "Selesai", "Pending", "Dibatalkan"];
  return opts.map(function(o) {
    return "<option value='" + o + "'" + (o === selected ? " selected" : "") + ">" + o + "</option>";
  }).join("");
}

function updateStatus(i, val) {
  allData[i].status = val;
}

// ══ Render pagination ══
function renderPagination() {
  var pg    = document.getElementById("pagination");
  pg.innerHTML = "";
  var total = totalPages();

  // Tombol prev
  var prev = document.createElement("button");
  prev.className   = "page-btn";
  prev.textContent = "‹";
  prev.disabled    = currentPage === 1;
  prev.onclick     = function() {
    if (currentPage > 1) { currentPage--; renderTable(); }
  };
  pg.appendChild(prev);

  // Halaman 1, 2, 3
  [1, 2, 3].forEach(function(p) {
    if (p > total) return;
    var btn = document.createElement("button");
    btn.className   = "page-btn" + (p === currentPage ? " active" : "");
    btn.textContent = p;
    btn.onclick     = (function(page) {
      return function() { currentPage = page; renderTable(); };
    })(p);
    pg.appendChild(btn);
  });

  // Titik-titik
  if (total > 4) {
    var dots = document.createElement("span");
    dots.className   = "page-dots";
    dots.textContent = "...";
    pg.appendChild(dots);
  }

  // Halaman terakhir
  if (total > 3) {
    var lastBtn = document.createElement("button");
    lastBtn.className   = "page-btn" + (total === currentPage ? " active" : "");
    lastBtn.textContent = total;
    lastBtn.onclick     = function() { currentPage = total; renderTable(); };
    pg.appendChild(lastBtn);
  }

  // Tombol next
  var next = document.createElement("button");
  next.className   = "page-btn";
  next.textContent = "›";
  next.disabled    = currentPage === total;
  next.onclick     = function() {
    if (currentPage < total) { currentPage++; renderTable(); }
  };
  pg.appendChild(next);
}

// ══ Modal Edit ══
function openModal(i) {
  window.location.href = '../distribusi/edit/edit.html?id=' + i;
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("show");
  editIndex = -1;
}

function saveEdit() {
  if (editIndex < 0) return;
  allData[editIndex].pelanggan = document.getElementById("editPelanggan").value;
  allData[editIndex].jumlah    = parseInt(document.getElementById("editJumlah").value) || 0;
  allData[editIndex].status    = document.getElementById("editStatus").value;
  closeModal();
  renderTable();
  showToast("Distribusi berhasil diperbarui!");
}

// ══ Modal Buat Baru ══
function openModalBuat() {
  var today = new Date();
  var iso   = today.toISOString().split("T")[0];
  document.getElementById("buatTanggal").value     = iso;
  document.getElementById("buatTanggalProd").value = iso;
  document.getElementById("buatPelanggan").value   = "";
  document.getElementById("buatJumlah").value      = "";
  document.getElementById("buatStatus").value      = "Pending";
  document.getElementById("modalBuat").classList.add("show");
}

function closeBuat() {
  document.getElementById("modalBuat").classList.remove("show");
}

function simpanBuat() {
  var tgl  = document.getElementById("buatTanggal").value;
  var pel  = document.getElementById("buatPelanggan").value.trim();
  var tglp = document.getElementById("buatTanggalProd").value;
  var jml  = parseInt(document.getElementById("buatJumlah").value) || 0;
  var sts  = document.getElementById("buatStatus").value;

  if (!pel) { showToast("Nama pelanggan wajib diisi!"); return; }

  function fmtDate(str) {
    var parts = str.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0].slice(2);
  }

  allData.unshift({
    tglDistribusi: fmtDate(tgl),
    pelanggan:     pel,
    tglProduksi:   fmtDate(tglp),
    jumlah:        jml,
    status:        sts
  });

  closeBuat();
  currentPage = 1;
  renderTable();
  showToast("Distribusi baru berhasil ditambahkan!");
}

// ══ Toast ══
function showToast(msg) {
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(function() { t.classList.remove("show"); }, 3000);
}

// ══ Init ══
window.onload = function() {
  renderTable();
  ["modalOverlay", "modalBuat"].forEach(function(id) {
    document.getElementById(id).addEventListener("click", function(e) {
      if (e.target === this) {
        this.classList.remove("show");
        editIndex = -1;
      }
    });
  });
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
        <button class="btn-keluar" onclick="window.location.href='../login/index.html'">Keluar</button>
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