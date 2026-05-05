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

// ══ INGAT SAYA — load username tersimpan saat halaman dibuka ══
window.addEventListener('load', function() {
  pill('masuk');

  var savedUsername = localStorage.getItem('simpro_remember_user');
  var savedPassword = localStorage.getItem('simpro_remember_pass');
  if (savedUsername) {
    var inputUser = document.querySelector("#formMasuk input[type='text']");
    var inputPass = document.getElementById('passLogin');
    var cbIngat   = document.querySelector("#formMasuk input[type='checkbox']");
    if (inputUser) inputUser.value = savedUsername;
    if (inputPass && savedPassword) inputPass.value = savedPassword;
    if (cbIngat)   cbIngat.checked = true;
  }
});

window.addEventListener('resize', function() { pill(cur); });

// ══ LOGIN ══
function handleLogin() {
  var username = document.querySelector("#formMasuk input[type='text']").value.trim();
  var password = document.getElementById('passLogin').value;
  var ingatSaya = document.querySelector("#formMasuk input[type='checkbox']").checked;

  var storedUser = JSON.parse(localStorage.getItem('user'));

  if (!storedUser) {
    alert('Belum ada akun, silakan daftar dulu!');
    return;
  }

  if (username === storedUser.username && password === storedUser.password) {
    // ── Ingat Saya ──
    if (ingatSaya) {
      localStorage.setItem('simpro_remember_user', username);
      localStorage.setItem('simpro_remember_pass', password);
    } else {
      localStorage.removeItem('simpro_remember_user');
      localStorage.removeItem('simpro_remember_pass');
    }

    localStorage.setItem('isLogin', 'true');
    window.location.href = '../dashboard/index.html';
  } else {
    alert('Username atau password salah!');
  }
}

// ══ DAFTAR ══
function handleRegister() {
  var username = document.querySelector("#formDaftar input[type='text']").value.trim();
  var email    = document.querySelector("#formDaftar input[type='email']").value.trim();
  var password = document.getElementById('passRegister').value;

  if (!username || !email || !password) {
    alert('Semua field harus diisi!');
    return;
  }

  localStorage.setItem('user', JSON.stringify({ username, email, password }));
  localStorage.setItem('isLogin', 'true');
  window.location.href = '../dashboard/index.html';
}

// ══ LUPA PASSWORD — tampilkan modal dengan username & password tersimpan ══
function lupaPasword() {
  var storedUser = JSON.parse(localStorage.getItem('user'));

  // Buat modal kalau belum ada
  var existing = document.getElementById('modalLupa');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'modalLupa';
  modal.style.cssText = [
    'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.45)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'z-index:9999', 'font-family:Poppins,sans-serif'
  ].join(';');

  if (!storedUser) {
    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:36px 32px;max-width:340px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
        <div style="font-size:2rem;margin-bottom:12px;">🔒</div>
        <h3 style="margin:0 0 10px;font-size:1.1rem;color:#1a1a1a;">Belum Ada Akun</h3>
        <p style="color:#888;font-size:.88rem;margin:0 0 24px;">Silakan daftar terlebih dahulu untuk membuat akun.</p>
        <button onclick="document.getElementById('modalLupa').remove()" style="background:#A95454;color:#fff;border:none;border-radius:8px;padding:10px 28px;font-size:.9rem;cursor:pointer;font-family:inherit;">Tutup</button>
      </div>`;
  } else {
    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:36px 32px;max-width:360px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
        <div style="font-size:2rem;text-align:center;margin-bottom:12px;">🔑</div>
        <h3 style="margin:0 0 6px;font-size:1.1rem;color:#1a1a1a;text-align:center;">Informasi Akun</h3>
        <p style="color:#888;font-size:.82rem;text-align:center;margin:0 0 24px;">Berikut data akun yang tersimpan di perangkat ini.</p>
        <div style="background:#f9f1f1;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
          <div style="margin-bottom:12px;">
            <div style="font-size:.75rem;color:#A95454;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Username</div>
            <div style="font-size:.98rem;color:#1a1a1a;font-weight:500;">${storedUser.username}</div>
          </div>
          <div>
            <div style="font-size:.75rem;color:#A95454;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Password</div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span id="passText" style="font-size:.98rem;color:#1a1a1a;font-weight:500;letter-spacing:.12em;">••••••••</span>
              <button onclick="toggleShowPass()" id="btnShowPass"
                style="background:none;border:none;cursor:pointer;color:#A95454;font-size:.8rem;font-family:inherit;padding:0;text-decoration:underline;">
                Tampilkan
              </button>
            </div>
          </div>
        </div>
        <button onclick="document.getElementById('modalLupa').remove()"
          style="width:100%;background:#A95454;color:#fff;border:none;border-radius:8px;padding:11px;font-size:.9rem;cursor:pointer;font-family:inherit;font-weight:500;">
          Tutup
        </button>
      </div>`;
  }

  // Tutup saat klik backdrop
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

// Toggle tampil/sembunyikan password di modal
function toggleShowPass() {
  var span = document.getElementById('passText');
  var btn  = document.getElementById('btnShowPass');
  var storedUser = JSON.parse(localStorage.getItem('user'));

  if (btn.textContent === 'Tampilkan') {
    span.style.letterSpacing = 'normal';
    span.textContent = storedUser.password;
    btn.textContent  = 'Sembunyikan';
  } else {
    span.style.letterSpacing = '.12em';
    span.textContent = '••••••••';
    btn.textContent  = 'Tampilkan';
  }
}