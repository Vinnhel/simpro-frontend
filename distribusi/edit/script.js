// ── STATE ───────────────────────────────────────────
let currentId = null;
let distribusiData = JSON.parse(localStorage.getItem("distribusiData")) || [];

// ── DATA PRODUK (aligned with sejarah-distribusi hargaMap) ──
var produkData = {
  tahu_bulat_cimol:   { harga: 7000,  shelf: 3 },
  tahu_bulat_standar: { harga: 15000, shelf: 2 },
  tahu_bulat_jumbo:   { harga: 10200, shelf: 4 },
  sotong:             { harga: 1700,  shelf: 3 }
};

// ── DEBOUNCE HELPER ──
let calcTimeout;
function debounce(fn, delay = 300) {
  return function(...args) {
    clearTimeout(calcTimeout);
    calcTimeout = setTimeout(() => fn(...args), delay);
  };
}

// ── HELPER: konversi DD/MM/YY → YYYY-MM-DD ──────────
function toISODate(str) {
  if (!str) return "";
  var parts = str.split("/");
  if (parts.length !== 3) return "";
  return "20" + parts[2] + "-" + parts[1] + "-" + parts[0];
}

// ── HELPER: konversi YYYY-MM-DD → DD/MM/YY ──────────
function toDMY(str) {
  if (!str) return "";
  var parts = str.split("-");
  if (parts.length !== 3) return "";
  return parts[2] + "/" + parts[1] + "/" + parts[0].slice(2);
}

// ── STANDARD DATE FORMAT (DD/MM/YY) ──
function formatExpiryDate(date) {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit", 
    year: "2-digit"
  });
}

// ── GENERATE OPSI TANGGAL PRODUKSI ──────────────────
function generateTanggalOptions(selectedISO) {
  var sel = document.getElementById("tgl_produksi");
  if (!sel) return;

  sel.innerHTML = '<option value="" disabled>Pilihan Tanggal Produksi</option>';

  var today = new Date();
  var found = false;

  for (var i = 0; i < 7; i++) {
    var d = new Date(today);
    d.setDate(today.getDate() - i);
    var val = d.toISOString().split("T")[0];

    var opt = document.createElement("option");
    opt.value = val;
    opt.textContent = formatLabel(val);
    if (val === selectedISO) {
      opt.selected = true;
      found = true;
    }
    sel.appendChild(opt);
  }

  if (selectedISO && !found) {
    var extraOpt = document.createElement("option");
    extraOpt.value = selectedISO;
    extraOpt.textContent = formatLabel(selectedISO) + " (tersimpan)";
    extraOpt.selected = true;
    sel.insertBefore(extraOpt, sel.children[1]);
  }
}

// ── FORMAT LABEL SELECT ──
function formatLabel(isoStr) {
  if (!isoStr) return "";
  var d = new Date(isoStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

// ── MASTER CALCULATION FUNCTION ──
function updateCalculations() {
  handleTanggalChange();
  debouncedHitungTotal();
}

// ── HITUNG KADALUARSA OTOMATIS ───────────────────────
function handleTanggalChange() {
  var produk = document.getElementById("produk").value;
  var tgl    = document.getElementById("tgl_produksi").value;

  if (!produk || !tgl) {
    document.getElementById("kadaluarsa").value = "";
    hitungTotal();
    return;
  }

  var shelf    = (produkData[produk] && produkData[produk].shelf) || 3;
  var prodDate = new Date(tgl + "T00:00:00");
  var expDate  = new Date(prodDate);
  expDate.setDate(prodDate.getDate() + shelf);

  document.getElementById("kadaluarsa").value = formatExpiryDate(expDate);
  hitungTotal();
}

// ── RESET TANGGAL SAAT PRODUK GANTI ─────────────────
function handleProdukChange() {
  var tgl = document.getElementById("tgl_produksi").value;
  if (tgl) {
    handleTanggalChange();
  } else {
    document.getElementById("kadaluarsa").value = "";
    document.getElementById("total").value = "";
  }
}

// ── HITUNG TOTAL (direct, non-debounced) ─────────────
function hitungTotal() {
  var produk = document.getElementById("produk").value;
  var jumlah = parseInt(document.getElementById("jumlah").value) || 0;

  var info  = produkData[produk];
  var harga = info ? info.harga : 0;
  var total = jumlah * harga;

  document.getElementById("total").value =
    total > 0 ? "Rp " + total.toLocaleString("id-ID") : "";
}

// ── HITUNG TOTAL OTOMATIS (debounced) ────────────────
const debouncedHitungTotal = debounce(hitungTotal);

// ── LOAD DATA KE FORM ────────────────────────────────
function loadDataToForm(data) {
  if (!data) return;
  currentId = data.id ?? null;

  document.getElementById("nama").value           = data.pelanggan      || "";
  document.getElementById("telp_pelanggan").value = data.telp_pelanggan || "";
  document.getElementById("no_kendaraan").value   = data.no_kendaraan   || "";
  document.getElementById("telp_kondektur").value = data.telp_kondektur || "";
  document.getElementById("lokasi").value         = data.lokasi         || "";
  document.getElementById("jumlah").value         = data.jumlah         || "";

  document.getElementById("produk").value = data.produk || "";
  var tglProdISO = toISODate(data.tglProduksi || "");
  generateTanggalOptions(tglProdISO);

  if (tglProdISO) {
    document.getElementById("tgl_produksi").value = tglProdISO;
  }

// Trigger calculations: longer delay + dispatch events for natural trigger
  setTimeout(() => {
    // Recalc
    updateCalculations();
    hitungTotal();
    
    // Dispatch events to trigger listeners reliably
    const produkEl = document.getElementById("produk");
    const jumlahEl = document.getElementById("jumlah");
    if (produkEl) produkEl.dispatchEvent(new Event('change', { bubbles: true }));
    if (jumlahEl) jumlahEl.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Final direct calc
    setTimeout(hitungTotal, 100);
  }, 600);
}

// ── INIT ─────────────────────────────────────────────
function initEditPage() {
  var params = new URLSearchParams(window.location.search);
  var idStr  = params.get("id");

  if (idStr === null) {
    showToast("ID tidak ditemukan!");
    return;
  }

  var id   = parseInt(idStr, 10);
  var data = distribusiData[id];

  if (!data) {
    showToast("Data tidak ditemukan!");
    return;
  }

  loadDataToForm({ id: id, ...data });
}

// ── SIMPAN DATA (numeric total) ─────────────────────
function simpanData() {
  if (currentId === null) return;

  var produk  = document.getElementById("produk").value;
  var jumlah  = parseInt(document.getElementById("jumlah").value) || 0;
  var info    = produkData[produk];
  var harga   = info ? info.harga : 0;
  var totalStr = document.getElementById("total").value;
  var totalNum = parseInt(totalStr.replace(/Rp\s*/g, "").replace(/\./g, "")) || (jumlah * harga);

  var tglProdISO = document.getElementById("tgl_produksi").value;
  var tglProdDMY = toDMY(tglProdISO);

  distribusiData[currentId].pelanggan      = document.getElementById("nama").value;
  distribusiData[currentId].telp_pelanggan = document.getElementById("telp_pelanggan").value;
  distribusiData[currentId].no_kendaraan   = document.getElementById("no_kendaraan").value;
  distribusiData[currentId].telp_kondektur = document.getElementById("telp_kondektur").value;
  distribusiData[currentId].lokasi         = document.getElementById("lokasi").value;
  distribusiData[currentId].produk         = produk;
  distribusiData[currentId].jumlah         = jumlah;
  distribusiData[currentId].total          = totalNum; // numeric
  distribusiData[currentId].tglProduksi    = tglProdDMY;
  distribusiData[currentId].kadaluarsa     = document.getElementById("kadaluarsa").value;

  localStorage.setItem("distribusiData", JSON.stringify(distribusiData));
  showToast("Data berhasil diupdate!");
  setTimeout(function() {
    window.location.href = "../../sejarah-distribusi/index.html";
  }, 1000);
}

// ── RESET FORM ───────────────────────────────────────
function resetForm() {
  var ids = [
    "nama", "telp_pelanggan", "no_kendaraan", "telp_kondektur",
    "lokasi", "produk", "tgl_produksi", "kadaluarsa", "jumlah", "total"
  ];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = "";
  });
  updateCalculations();
  showToast("Form berhasil direset");
}

// ── TOAST, LOGOUT, MOBILE NAV (unchanged) ────────────
function showToast(pesan) {
  var t = document.getElementById("toast");
  if (!t) return;
  t.textContent = pesan;
  t.classList.add("show");
  setTimeout(function() { t.classList.remove("show"); }, 3000);
}

function logout() {
  localStorage.removeItem("isLogin");
  window.location.href = "../../login/index.html";
}

function setupMobileNav() {
  var hamburger = document.getElementById("hamburger");
  if (!hamburger) return;

  var drawer = document.getElementById("navDrawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id        = "navDrawer";
    drawer.className = "nav-drawer";
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
        <button class="btn-keluar" onclick="window.location.href='../../login/index.html'">Keluar</button>
      </div>
    `;
    document.getElementById("navbar").insertAdjacentElement("afterend", drawer);
  }

  hamburger.addEventListener("click", function() {
    var isOpen = hamburger.classList.toggle("open");
    drawer.classList.toggle("open", isOpen);
  });
}

// ── EVENT LISTENERS (comprehensive) ─────────────────
document.addEventListener("DOMContentLoaded", function() {
  // Attach listeners properly (no reliance on inline)
  var produkEl = document.getElementById("produk");
  var tglEl = document.getElementById("tgl_produksi");
  var jumlahEl = document.getElementById("jumlah");

  if (produkEl) produkEl.addEventListener("change", handleProdukChange);
  if (tglEl) tglEl.addEventListener("change", handleTanggalChange);
  if (jumlahEl) jumlahEl.addEventListener("input", debouncedHitungTotal);

  initEditPage();
  setupMobileNav();
});

