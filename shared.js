/* ══════════════════════════════════════════════════════════════
   SIMPRO – shared.js  (v2, sesuai commit terbaru)
   
   Data layer bersama untuk semua halaman.
   Key dan struktur data disesuaikan dengan yang sudah ada
   di sejarah-distribusi dan distribusi/edit commit terbaru.
   
   localStorage keys:
     "distribusiData"  → array distribusi (index-based, sesuai commit baru)
     "stokData"        → array stok produksi (mengganti dummy var stokData)
     "simpro_user"     → data user login
     "simpro_is_login" → flag login
   ══════════════════════════════════════════════════════════════ */

'use strict';

// ── STORAGE KEYS ────────────────────────────────────────────────
var SIMPRO_KEY_DISTRIBUSI = 'distribusiData';   // sesuai commit baru
var SIMPRO_KEY_STOK       = 'stokData';
var SIMPRO_KEY_LOGIN      = 'isLogin';   // sesuai login/script.js

// ── MASTER DATA PRODUK ──────────────────────────────────────────
// Sumber kebenaran tunggal untuk harga jual, shelf life, bahan baku.
// Harga disesuaikan dengan hargaMap di sejarah-distribusi commit baru.
var SIMPRO_PRODUK = {
  tahu_bulat_cimol: {
    label    : 'Tahu Bulat Cimol',
    harga    : 7000,
    shelf    : 3,
    bahan    : [{ nama: 'Kacang Kedelai', satuan: 'kg', kebutuhan: 50, harga: 4200 }]
  },
  tahu_bulat_standar: {
    label    : 'Tahu Bulat Standar',
    harga    : 15000,
    shelf    : 2,
    bahan    : [{ nama: 'Kacang Kedelai', satuan: 'kg', kebutuhan: 50, harga: 15000 }]
  },
  tahu_bulat_jumbo: {
    label    : 'Tahu Bulat Jumbo',
    harga    : 10200,
    shelf    : 4,
    bahan    : [{ nama: 'Kacang Kedelai', satuan: 'kg', kebutuhan: 50, harga: 17000 }]
  },
  sotong: {
    label    : 'Sotong',
    harga    : 1700,
    shelf    : 3,
    bahan    : [{ nama: 'Terigu + Tapioka', satuan: 'kg', kebutuhan: 10, harga: 1700 }]
  }
};

// ── DATE HELPERS ─────────────────────────────────────────────────
// Format yang dipakai di seluruh project: DD/MM/YY

function simpro_pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

/** Date object → "DD/MM/YY" */
function simpro_toDMY(date) {
  return simpro_pad(date.getDate()) + '/' +
         simpro_pad(date.getMonth() + 1) + '/' +
         String(date.getFullYear()).slice(2);
}

/** "YYYY-MM-DD" (dari <input type="date">) → "DD/MM/YY" */
function simpro_isoToDMY(isoStr) {
  if (!isoStr) return '';
  var p = isoStr.split('-');
  if (p.length !== 3) return '';
  return p[2] + '/' + p[1] + '/' + p[0].slice(2);
}

/** "DD/MM/YY" → "YYYY-MM-DD" (untuk <input type="date">) */
function simpro_dmyToISO(dmy) {
  if (!dmy) return '';
  var p = dmy.split('/');
  if (p.length !== 3) return '';
  return '20' + p[2] + '-' + p[1] + '-' + p[0];
}

/** Format rupiah: 15000 → "Rp 15.000" */
function simpro_formatRupiah(val) {
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
}

// ── AUTH HELPERS ─────────────────────────────────────────────────
function simpro_isLoggedIn() {
  return localStorage.getItem(SIMPRO_KEY_LOGIN) === 'true';
}

function simpro_requireLogin() {
  if (!simpro_isLoggedIn()) {
    window.location.href = simpro_loginPath();
  }
}

function simpro_logout() {
  localStorage.removeItem(SIMPRO_KEY_LOGIN);
  window.location.href = simpro_loginPath();
}

function simpro_loginPath() {
  var path = window.location.pathname.replace(/\\/g, '/');
  if (path.indexOf('/distribusi/tambah') !== -1 || path.indexOf('/distribusi/edit') !== -1) {
    return '../../login/index.html';
  }
  return '../login/index.html';
}

// ── STOK PRODUKSI ────────────────────────────────────────────────
// Struktur tiap entri stok:
// { tanggal, produkKey, produk (label), stok (status), jumlah }

function simpro_ambilSemuaStok() {
  try {
    return JSON.parse(localStorage.getItem(SIMPRO_KEY_STOK) || '[]');
  } catch (e) { return []; }
}

/**
 * Simpan hasil perhitungan produksi ke stok.
 * @param {string} produkKey
 * @param {number} jumlah
 * @param {number} biaya  (untuk referensi, tidak disimpan di stok)
 */
function simpro_simpanHasilProduksi(produkKey, jumlah, biaya) {
  var list   = simpro_ambilSemuaStok();
  var produk = SIMPRO_PRODUK[produkKey];
  var entry  = {
    tanggal  : simpro_toDMY(new Date()),
    produkKey: produkKey,
    produk   : produk ? produk.label : produkKey,
    stok     : 'Tersedia',
    jumlah   : parseInt(jumlah, 10)
  };
  // Tambahkan di depan (terbaru di atas, sesuai tampilan tabel stok)
  list.unshift(entry);
  localStorage.setItem(SIMPRO_KEY_STOK, JSON.stringify(list));
  return entry;
}

/**
 * Edit stok berdasarkan index.
 * Status (stok) dihitung otomatis dari jumlah baru.
 */
function simpro_editStok(index, jumlahBaru) {
  var list = simpro_ambilSemuaStok();
  if (!list[index]) return;
  list[index].jumlah = parseInt(jumlahBaru, 10);
  list[index].stok   = _simpro_statusDariJumlah(list[index].jumlah);
  localStorage.setItem(SIMPRO_KEY_STOK, JSON.stringify(list));
}

function _simpro_statusDariJumlah(jumlah) {
  if (jumlah <= 0)  return 'Habis';
  if (jumlah <= 20) return 'Hampir Habis';
  return 'Tersedia';
}

/**
 * Hitung total stok tersedia untuk produk tertentu.
 */
function simpro_totalStokProduk(produkKey) {
  return simpro_ambilSemuaStok()
    .filter(function(s) { return s.produkKey === produkKey && s.jumlah > 0; })
    .reduce(function(sum, s) { return sum + s.jumlah; }, 0);
}

/**
 * Kurangi stok FIFO (entri terlama = index terbesar karena unshift).
 * Dipanggil saat distribusi disimpan.
 */
function simpro_kurangiStok(produkKey, jumlahKurang) {
  var list = simpro_ambilSemuaStok();
  var sisa = parseInt(jumlahKurang, 10);

  // unshift → terbaru di index 0, terlama di index terakhir → kurangi dari belakang
  for (var i = list.length - 1; i >= 0 && sisa > 0; i--) {
    if (list[i].produkKey === produkKey && list[i].jumlah > 0) {
      var kurang     = Math.min(list[i].jumlah, sisa);
      list[i].jumlah -= kurang;
      list[i].stok   = _simpro_statusDariJumlah(list[i].jumlah);
      sisa           -= kurang;
    }
  }
  localStorage.setItem(SIMPRO_KEY_STOK, JSON.stringify(list));
}

/**
 * Kembalikan stok (saat distribusi dihapus atau jumlah dikurangi).
 */
function simpro_kembalikanStok(produkKey, jumlahKembali) {
  var list = simpro_ambilSemuaStok();
  var sisa = parseInt(jumlahKembali, 10);
  // Kembalikan ke entri terbaru yang produknya sama
  for (var i = 0; i < list.length && sisa > 0; i++) {
    if (list[i].produkKey === produkKey) {
      list[i].jumlah += sisa;
      list[i].stok    = _simpro_statusDariJumlah(list[i].jumlah);
      sisa = 0;
    }
  }
  localStorage.setItem(SIMPRO_KEY_STOK, JSON.stringify(list));
}

/**
 * Ambil daftar tanggal produksi yang masih ada stoknya,
 * untuk dropdown di form tambah/edit distribusi.
 * @param {string} produkKey
 * @returns {Array} [{ tanggalDMY, tanggalISO, jumlah }]
 */
function simpro_tanggalStokTersedia(produkKey) {
  return simpro_ambilSemuaStok()
    .filter(function(s) { return s.produkKey === produkKey && s.jumlah > 0; })
    .map(function(s) {
      return {
        tanggalDMY : s.tanggal,
        tanggalISO : simpro_dmyToISO(s.tanggal),
        jumlah     : s.jumlah
      };
    });
}

// ── DISTRIBUSI ───────────────────────────────────────────────────
// Struktur tiap entri distribusi (sesuai commit baru):
// {
//   tglDistribusi, pelanggan, tglProduksi, jumlah, status,
//   produk (key), total (angka), telp_pelanggan,
//   no_kendaraan, telp_kondektur, lokasi, kadaluarsa
// }
// Disimpan sebagai array, akses via index.

function simpro_ambilSemuaDistribusi() {
  try {
    return JSON.parse(localStorage.getItem(SIMPRO_KEY_DISTRIBUSI) || '[]');
  } catch (e) { return []; }
}

/**
 * Tambah distribusi baru (unshift = terbaru di index 0).
 * Otomatis hitung kadaluarsa, total, kurangi stok.
 * @returns {object|{error:string}}
 */
function simpro_tambahDistribusi(data) {
  var produkKey = data.produk;
  var produk    = SIMPRO_PRODUK[produkKey];
  var jumlah    = parseInt(data.jumlah, 10);

  // Validasi stok
  var stokAda = simpro_totalStokProduk(produkKey);
  if (jumlah > stokAda) {
    return { error: 'Jumlah melebihi stok tersedia (' + stokAda + ' pcs)' };
  }

  // Hitung kadaluarsa
  var shelf      = produk ? produk.shelf : 3;
  var tglProdISO = simpro_dmyToISO(data.tglProduksi);
  // Jika tglProduksi sudah ISO (dari <input type="date">), deteksi otomatis
  if (!tglProdISO && data.tglProduksi && data.tglProduksi.indexOf('-') !== -1) {
    tglProdISO = data.tglProduksi;
  }
  var tglProd = new Date(tglProdISO + 'T00:00:00');
  var tglKad  = new Date(tglProd);
  tglKad.setDate(tglProd.getDate() + shelf);

  var harga = produk ? produk.harga : 0;
  var total = harga * jumlah;

  // Format tanggal distribusi
  var tglDistrib = data.tglDistribusi
    ? data.tglDistribusi
    : simpro_toDMY(new Date());

  // Format tglProduksi ke DD/MM/YY jika belum
  var tglProdDMY = data.tglProduksi.indexOf('/') !== -1
    ? data.tglProduksi
    : simpro_isoToDMY(data.tglProduksi);

  var entry = {
    tglDistribusi : tglDistrib,
    pelanggan     : data.pelanggan     || '',
    tglProduksi   : tglProdDMY,
    jumlah        : jumlah,
    status        : 'Belum Dikirim',
    produk        : produkKey,
    total         : total,
    telp_pelanggan: data.telp_pelanggan || '',
    no_kendaraan  : data.no_kendaraan  || '',
    telp_kondektur: data.telp_kondektur || '',
    lokasi        : data.lokasi        || '',
    kadaluarsa    : simpro_toDMY(tglKad)
  };

  var list = simpro_ambilSemuaDistribusi();
  list.unshift(entry);
  localStorage.setItem(SIMPRO_KEY_DISTRIBUSI, JSON.stringify(list));

  // Kurangi stok
  simpro_kurangiStok(produkKey, jumlah);

  return { index: 0, entry: entry };
}

/**
 * Update distribusi berdasarkan index (sesuai cara kerja commit baru).
 * Menangani perubahan jumlah → selisih stok otomatis.
 */
function simpro_updateDistribusi(index, perubahan) {
  var list = simpro_ambilSemuaDistribusi();
  if (!list[index]) return { error: 'Data tidak ditemukan' };

  var lama = JSON.parse(JSON.stringify(list[index]));

  // Validasi stok jika jumlah bertambah
  if (perubahan.jumlah !== undefined) {
    var jumlahBaru  = parseInt(perubahan.jumlah, 10);
    var jumlahLama  = parseInt(lama.jumlah, 10);
    var produkKey   = perubahan.produk || lama.produk;
    var selisihCek  = jumlahBaru - jumlahLama;

    if (selisihCek > 0) {
      var stokTersedia = simpro_totalStokProduk(produkKey);
      if (selisihCek > stokTersedia) {
        var maxBisa = jumlahLama + stokTersedia;
        return { error: 'Stok tidak mencukupi. Stok tersedia: ' + stokTersedia + ' pcs. Maksimal jumlah yang bisa diinput: ' + maxBisa + ' pcs.' };
      }
    }
  }

  // Terapkan perubahan
  Object.keys(perubahan).forEach(function(k) {
    list[index][k] = perubahan[k];
  });

  // Hitung ulang total jika jumlah atau produk berubah
  if (perubahan.jumlah !== undefined || perubahan.produk !== undefined) {
    var produk = SIMPRO_PRODUK[list[index].produk];
    var harga  = produk ? produk.harga : 0;
    list[index].total = harga * parseInt(list[index].jumlah, 10);
  }

  localStorage.setItem(SIMPRO_KEY_DISTRIBUSI, JSON.stringify(list));

  // Selisih stok
  if (perubahan.jumlah !== undefined) {
    var selisih = parseInt(perubahan.jumlah, 10) - parseInt(lama.jumlah, 10);
    if (selisih > 0) simpro_kurangiStok(lama.produk, selisih);
    if (selisih < 0) simpro_kembalikanStok(lama.produk, Math.abs(selisih));
  }

  return { success: true };
}

/**
 * Hapus distribusi berdasarkan index, kembalikan stok.
 */
function simpro_hapusDistribusi(index) {
  var list   = simpro_ambilSemuaDistribusi();
  var target = list[index];
  if (!target) return;
  simpro_kembalikanStok(target.produk, target.jumlah);
  list.splice(index, 1);
  localStorage.setItem(SIMPRO_KEY_DISTRIBUSI, JSON.stringify(list));
}

// ── KEUNTUNGAN ────────────────────────────────────────────────────
/**
 * Rekap keuntungan bulanan dari distribusi berstatus "Sudah Terkirim".
 * @returns {Array} [{ label, bulan, tahun, tahuBulat, sotong, totalTerjual, totalKeuntungan, days }]
 */
function simpro_rekapKeuntungan() {
  var distribusi = simpro_ambilSemuaDistribusi()
    .filter(function(d) { return d.status === 'Sudah Terkirim'; });

  var map = {};

  distribusi.forEach(function(d) {
    // Parse tanggal DD/MM/YY
    var iso = simpro_dmyToISO(d.tglDistribusi);
    if (!iso) return;
    var tgl   = new Date(iso + 'T00:00:00');
    var bulan = tgl.getMonth();
    var tahun = tgl.getFullYear();
    var key   = tahun + '-' + simpro_pad(bulan + 1);

    if (!map[key]) {
      var namaBulan = ['Jan','Feb','Mar','Apr','Mei','Jun',
                       'Jul','Agu','Sep','Okt','Nov','Des'][bulan];
      map[key] = {
        key             : key,
        label           : namaBulan + ' ' + tahun,
        bulan           : bulan,
        tahun           : tahun,
        tahuBulat       : 0,
        sotong          : 0,
        totalTerjual    : 0,
        totalKeuntungan : 0,
        days            : new Date(tahun, bulan + 1, 0).getDate()
      };
    }

    var isTahu = d.produk && d.produk.indexOf('tahu') !== -1;
    if (isTahu) map[key].tahuBulat += d.jumlah;
    else        map[key].sotong    += d.jumlah;

    map[key].totalTerjual    += d.jumlah;
    map[key].totalKeuntungan += (typeof d.total === 'number' ? d.total : 0);
  });

  return Object.values(map).sort(function(a, b) {
    return a.tahun !== b.tahun ? a.tahun - b.tahun : a.bulan - b.bulan;
  });
}
