/* ─────────────────────────────────────
   auth.js — Authentication (Login / Signup / Logout)
   ───────────────────────────────────── */

let currentUser    = null;
let currentProfile = null;
let signupRole     = 'teacher';

/* ── Tab switching (Login / Signup) ── */
function switchAuthTab(tab, el) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signupForm').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('authMsg').textContent = '';
}

/* ── Role selection on signup ── */
function setSignupRole(role, el) {
  signupRole = role;
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const isStudent = role === 'student';
  document.getElementById('rollGroup').classList.toggle('hidden', !isStudent);
  document.getElementById('sectionGroupSignup').classList.toggle('hidden', !isStudent);
}

/* ── Sign In ── */
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;

  if (!email || !pass) { showAuthMsg('Please fill in all fields.', 'error'); return; }

  const btn = document.getElementById('loginBtn');
  btn.innerHTML = '<span class="spinner"></span> Signing in...';
  btn.disabled = true;

  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });

  btn.innerHTML = 'Sign In →';
  btn.disabled  = false;

  if (error) { showAuthMsg(error.message, 'error'); return; }

  currentUser = data.user;
  await loadProfile();
  showApp();
}

/* ── Sign Up ── */
async function doSignup() {
  const name    = document.getElementById('signupName').value.trim();
  const email   = document.getElementById('signupEmail').value.trim();
  const pass    = document.getElementById('signupPass').value;
  const roll    = document.getElementById('signupRoll').value.trim();
  const section = document.getElementById('signupSection').value;

  if (!name || !email || !pass) { showAuthMsg('Please fill in all fields.', 'error'); return; }
  if (pass.length < 6)          { showAuthMsg('Password must be at least 6 characters.', 'error'); return; }

  const btn = document.getElementById('signupBtn');
  btn.innerHTML = '<span class="spinner"></span> Creating...';
  btn.disabled  = true;

  const meta = { full_name: name, role: signupRole };
  if (signupRole === 'student') { meta.roll_number = roll; meta.section = section; }

  const { error } = await sb.auth.signUp({ email, password: pass, options: { data: meta } });

  btn.innerHTML = 'Create Account →';
  btn.disabled  = false;

  if (error) { showAuthMsg(error.message, 'error'); return; }
  showAuthMsg('Account created! Check your email to confirm before signing in.', 'success');
}

/* ── Sign Out ── */
async function doLogout() {
  await sb.auth.signOut();
  currentUser    = null;
  currentProfile = null;
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('loginPage').classList.remove('hidden');
}

/* ── Load user profile from DB ── */
async function loadProfile() {
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (!error) currentProfile = data;
}

/* ── Auth message helper ── */
function showAuthMsg(msg, type) {
  const el   = document.getElementById('authMsg');
  el.textContent = msg;
  el.style.color = type === 'error' ? 'var(--danger)' : 'var(--success)';
}

/* ── Listen for session restore on page load ── */
sb.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    currentUser = session.user;
    await loadProfile();
    showApp();
  }
});
