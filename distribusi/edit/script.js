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