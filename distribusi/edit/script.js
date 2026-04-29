// ── STATE ───────────────────────────────────────────
let currentId = null; // nanti dipakai kalau sudah ada data

// ── LOAD DATA KE FORM (SIAP UNTUK MASA DEPAN) ───────
function loadDataToForm(data) {
  if (!data) return;

  currentId = data.id || null;

  document.getElementById("nama").value = data.nama || "";
  document.getElementById("telp_pelanggan").value = data.telp_pelanggan || "";
  document.getElementById("no_kendaraan").value = data.no_kendaraan || "";
  document.getElementById("telp_kondektur").value = data.telp_kondektur || "";
  document.getElementById("lokasi").value = data.lokasi || "";
  document.getElementById("produk").value = data.produk || "";
  document.getElementById("tgl_produksi").value = data.tgl_produksi || "";
  document.getElementById("kadaluarsa").value = data.kadaluarsa || "";
  document.getElementById("jumlah").value = data.jumlah || "";
  document.getElementById("total").value = data.total || "";
}

// ── SIMPAN DATA (EDIT MODE) ─────────────────────────
function simpanData() {
  const data = {
    id: currentId,
    nama: document.getElementById("nama").value,
    telp_pelanggan: document.getElementById("telp_pelanggan").value,
    no_kendaraan: document.getElementById("no_kendaraan").value,
    telp_kondektur: document.getElementById("telp_kondektur").value,
    lokasi: document.getElementById("lokasi").value,
    produk: document.getElementById("produk").value,
    tgl_produksi: document.getElementById("tgl_produksi").value,
    kadaluarsa: document.getElementById("kadaluarsa").value,
    jumlah: document.getElementById("jumlah").value,
    total: document.getElementById("total").value,
  };

  console.log("[EDIT DATA SIAP DIKIRIM KE BACKEND]:", data);

  showToast("Perubahan disimpan (sementara console)");
}

// ── RESET FORM ──────────────────────────────────────
function resetForm() {
  document.querySelectorAll("input, select").forEach(el => el.value = "");
  currentId = null;
}

// ── TOAST ───────────────────────────────────────────
function showToast(pesan) {
  const t = document.getElementById("toast");
  t.textContent = pesan;
  t.classList.add("show");

  setTimeout(() => {
    t.classList.remove("show");
  }, 3000);
}

function logout() {
  localStorage.removeItem("isLogin");
  window.location.href = "../../login/index.html";
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