var cur = 'masuk';

function pill(tab) {
  var btn = document.getElementById(tab === 'masuk' ? 'btnMasuk' : 'btnDaftar');
  var p   = document.getElementById('tabPill');
  p.style.left  = btn.offsetLeft + 'px';
  p.style.width = btn.offsetWidth + 'px';
}

function switchTab(tab) {
  if (tab === cur) return;
  var toRight = (tab === 'daftar');
  var out  = document.getElementById(cur === 'masuk' ? 'formMasuk' : 'formDaftar');
  var into = document.getElementById(tab === 'masuk' ? 'formMasuk' : 'formDaftar');

  // Update pill & buttons
  document.getElementById('btnMasuk').classList.toggle('active',  tab === 'masuk');
  document.getElementById('btnDaftar').classList.toggle('active', tab === 'daftar');
  pill(tab);

  // Set starting position untuk form yang masuk (tanpa transisi dulu)
  into.style.transition = 'none';
  into.classList.remove('go-left', 'go-right');
  into.classList.add(toRight ? 'go-right' : 'go-left');
  into.classList.remove('visible');
  into.classList.add('hidden');
  void into.offsetWidth; // force reflow

  // Aktifkan kembali transisi
  into.style.transition = '';

  // Animasi keluar form yang aktif
  out.classList.remove('go-left', 'go-right');
  out.classList.add(toRight ? 'go-left' : 'go-right');
  out.classList.remove('visible');
  out.classList.add('hidden');

  // Animasi masuk form baru
  into.classList.remove('go-left', 'go-right', 'hidden');
  into.classList.add('visible');

  cur = tab;
}

function togglePass(id, btn) {
  var inp = document.getElementById(id);
  var isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';

  // Ganti icon: eye (password terlihat) vs eye-off (password tersembunyi)
  btn.innerHTML = isHidden
    ? /* eye icon — password visible */
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>'
    : /* eye-off icon — password hidden */
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
}

window.addEventListener('load', function() { pill('masuk'); });
window.addEventListener('resize', function() { pill(cur); });
