// ════════════════════════════════════════════════════════════
// AUTH.JS — Supabase Authentication
// Cargar DESPUÉS de supabase CDN, ANTES de app.js
// ════════════════════════════════════════════════════════════

var SUPABASE_URL  = 'https://TU_PROJECT_ID.supabase.co';  // ← reemplazar
var SUPABASE_KEY  = 'TU_ANON_KEY';                         // ← reemplazar

var _supabase = null;

function initSupabase(){
  if(typeof supabase === 'undefined'){
    console.error('Supabase CDN no cargó');
    return false;
  }
  _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return true;
}

// ── Registro ─────────────────────────────────────────────
async function signUp(email, password){
  var {data, error} = await _supabase.auth.signUp({email, password});
  if(error) return {ok: false, msg: _authMsg(error.message)};
  return {ok: true, msg: 'Cuenta creada. Revisa tu correo para confirmar.'};
}

// ── Login ─────────────────────────────────────────────────
async function signIn(email, password){
  var {data, error} = await _supabase.auth.signInWithPassword({email, password});
  if(error) return {ok: false, msg: _authMsg(error.message)};
  return {ok: true, user: data.user};
}

// ── Logout ────────────────────────────────────────────────
async function signOut(){
  await _supabase.auth.signOut();
  showAuthScreen();
}

// ── Usuario actual ────────────────────────────────────────
async function getCurrentUser(){
  var {data} = await _supabase.auth.getSession();
  return data.session ? data.session.user : null;
}

// ── Observar cambios de sesión ────────────────────────────
function onAuthChange(callback){
  _supabase.auth.onAuthStateChange(function(event, session){
    callback(event, session ? session.user : null);
  });
}

// ── Mensajes de error legibles ────────────────────────────
function _authMsg(msg){
  if(!msg) return 'Error desconocido';
  if(msg.includes('Invalid login')) return 'Correo o contraseña incorrectos';
  if(msg.includes('already registered')) return 'Este correo ya tiene una cuenta';
  if(msg.includes('Password should')) return 'La contraseña debe tener al menos 6 caracteres';
  if(msg.includes('valid email')) return 'Ingresa un correo válido';
  if(msg.includes('Email not confirmed')) return 'Confirma tu correo antes de entrar';
  if(msg.includes('rate limit')) return 'Demasiados intentos. Espera unos minutos';
  return msg;
}

// ════════════════════════════════════════════════════════════
// UI DEL LOGIN
// ════════════════════════════════════════════════════════════

function showAuthScreen(){
  var el = document.getElementById('auth-screen');
  if(el) el.style.display = 'flex';
  var app = document.getElementById('app');
  if(app) app.style.display = 'none';
}

function hideAuthScreen(){
  var el = document.getElementById('auth-screen');
  if(el) el.style.display = 'none';
  var app = document.getElementById('app');
  if(app) app.style.display = 'flex';
}

function _setAuthError(msg){
  var el = document.getElementById('auth-error');
  if(el){ el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
}

function _setAuthLoading(loading){
  var btn = document.getElementById('auth-btn-login');
  var btnR = document.getElementById('auth-btn-register');
  if(btn){ btn.disabled = loading; btn.textContent = loading ? '...' : 'Entrar'; }
  if(btnR){ btnR.disabled = loading; }
}

async function handleLogin(){
  var email = (document.getElementById('auth-email').value || '').trim();
  var pass  = (document.getElementById('auth-pass').value || '').trim();
  if(!email || !pass){ _setAuthError('Completa todos los campos'); return; }
  _setAuthError('');
  _setAuthLoading(true);
  var res = await signIn(email, pass);
  _setAuthLoading(false);
  if(!res.ok){ _setAuthError(res.msg); return; }
  hideAuthScreen();
  if(typeof initApp === 'function') initApp();
}

async function handleRegister(){
  var email = (document.getElementById('auth-email').value || '').trim();
  var pass  = (document.getElementById('auth-pass').value || '').trim();
  if(!email || !pass){ _setAuthError('Completa todos los campos'); return; }
  if(pass.length < 6){ _setAuthError('La contraseña debe tener al menos 6 caracteres'); return; }
  _setAuthError('');
  _setAuthLoading(true);
  var res = await signUp(email, pass);
  _setAuthLoading(false);
  _setAuthError(res.msg);
}

function toggleAuthPass(){
  var i = document.getElementById('auth-pass');
  var b = document.getElementById('auth-pass-toggle');
  if(!i) return;
  i.type = i.type === 'password' ? 'text' : 'password';
  if(b) b.textContent = i.type === 'password' ? '👁️' : '🙈';
}

// ── Enter en campos ────────────────────────────────────────
function authKeydown(e){
  if(e.key === 'Enter') handleLogin();
}

// ════════════════════════════════════════════════════════════
// ARRANQUE — llamado desde app.js
// ════════════════════════════════════════════════════════════

async function initAuth(){
  if(!initSupabase()){
    // Si Supabase falla, arrancar app sin auth (modo offline)
    console.warn('Supabase no disponible — modo offline');
    hideAuthScreen();
    if(typeof initApp === 'function') initApp();
    return;
  }

  // Escuchar cambios de sesión
  onAuthChange(function(event, user){
    if(event === 'SIGNED_OUT'){
      showAuthScreen();
    }
  });

  // Verificar si ya hay sesión activa
  var user = await getCurrentUser();
  if(user){
    hideAuthScreen();
    if(typeof initApp === 'function') initApp();
  } else {
    showAuthScreen();
  }
}
