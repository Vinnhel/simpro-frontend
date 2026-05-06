var cur = 'masuk';

// ══ Tab pill ══
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

  document.getElementById('btnMasuk').classList.toggle('active',  tab === 'masuk');
  document.getElementById('btnDaftar').classList.toggle('active', tab === 'daftar');
  pill(tab);

  into.style.transition = 'none';
  into.classList.remove('go-left', 'go-right');
  into.classList.add(toRight ? 'go-right' : 'go-left');
  into.classList.remove('visible');
  into.classList.add('hidden');
  void into.offsetWidth;

  into.style.transition = '';
  out.classList.remove('go-left', 'go-right');
  out.classList.add(toRight ? 'go-left' : 'go-right');
  out.classList.remove('visible');
  out.classList.add('hidden');

  into.classList.remove('go-left', 'go-right', 'hidden');
  into.classList.add('visible');

  cur = tab;
}

// ══ Toggle password ══
function togglePass(id, btn) {
  var inp = document.getElementById(id);
  var isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
}

// ══ INGAT SAYA ══
window.addEventListener('load', function() {
  pill('masuk');
  var savedUsername = localStorage.getItem('simpro_remember_user');
  if (savedUsername) {
    var inputUser = document.querySelector("#formMasuk input[type='text']");
    var cbIngat   = document.querySelector("#formMasuk input[type='checkbox']");
    if (inputUser) inputUser.value = savedUsername;
    if (cbIngat)   cbIngat.checked = true;
  }
});

window.addEventListener('resize', function() { pill(cur); });

// ══ LOGIN ══
async function handleLogin() {
  var username  = document.querySelector("#formMasuk input[type='text']").value.trim();
  var password  = document.getElementById('passLogin').value;
  var ingatSaya = document.querySelector("#formMasuk input[type='checkbox']").checked;

  if (!username || !password) { alert('Username dan password harus diisi!'); return; }

  try {
    var res  = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    var data = await res.json();
    if (!res.ok) { alert(data.error || 'Username atau password salah!'); return; }

    localStorage.setItem('simpro_token', data.token);
    if (ingatSaya) localStorage.setItem('simpro_remember_user', username);
    else           localStorage.removeItem('simpro_remember_user');

    window.location.href = '../dashboard/index.html';
  } catch (err) {
    alert('Gagal terhubung ke server. Pastikan backend berjalan.');
  }
}

// ══ DAFTAR ══
async function handleRegister() {
  var username = document.querySelector("#formDaftar input[type='text']").value.trim();
  var email    = document.querySelector("#formDaftar input[type='email']").value.trim();
  var password = document.getElementById('passRegister').value;

  if (!username || !email || !password) { alert('Semua field harus diisi!'); return; }

  try {
    var res  = await fetch(API + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    var data = await res.json();
    if (!res.ok) { alert(data.error || 'Gagal daftar'); return; }

    localStorage.setItem('simpro_token', data.token);
    window.location.href = '../dashboard/index.html';
  } catch (err) {
    alert('Gagal terhubung ke server. Pastikan backend berjalan.');
  }
}

// ══ LUPA PASSWORD ══
async function lupaPasword() {
  var username = document.querySelector("#formMasuk input[type='text']").value.trim();

  var existing = document.getElementById('modalLupa');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'modalLupa';
  modal.style.cssText = [
    'position:fixed','inset:0','background:rgba(0,0,0,0.45)',
    'display:flex','align-items:center','justify-content:center',
    'z-index:9999','font-family:Poppins,sans-serif'
  ].join(';');

  var pesan = 'Memproses...';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:36px 32px;max-width:340px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
      <div style="font-size:2rem;margin-bottom:12px;">🔒</div>
      <h3 style="margin:0 0 10px;font-size:1.1rem;color:#1a1a1a;">Lupa Password</h3>
      <p id="pesanLupa" style="color:#888;font-size:.88rem;margin:0 0 24px;">${pesan}</p>
      <button onclick="document.getElementById('modalLupa').remove()" style="background:#A95454;color:#fff;border:none;border-radius:8px;padding:10px 28px;font-size:.9rem;cursor:pointer;font-family:inherit;">Tutup</button>
    </div>`;

  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);

  if (!username) {
    document.getElementById('pesanLupa').textContent = 'Masukkan username terlebih dahulu.';
    return;
  }

  try {
    var res  = await fetch(API + '/auth/lupa-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    var data = await res.json();
    document.getElementById('pesanLupa').textContent = res.ok
      ? 'Akun ditemukan. Hubungi admin untuk reset password.'
      : (data.error || 'Username tidak ditemukan di sistem.');
  } catch (err) {
    document.getElementById('pesanLupa').textContent = 'Gagal terhubung ke server.';
  }
}
