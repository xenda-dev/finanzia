// ════════════════════════════════════════════════════════════
// AUTH.JS — Supabase + Biometría WebAuthn
// ════════════════════════════════════════════════════════════

var SUPABASE_URL = 'https://dshwbvqvfbjtlbcqqviz.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaHdidnF2ZmJqdGxiY3Fxdml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTM1OTYsImV4cCI6MjA5MDg4OTU5Nn0.kjie4SHtxJZYkX1rspJK2JNpOWfbd-Xdx3UZfgqydXU';

var _supabase = null;
var _currentUser = null;
var _emailConfirmPending = sessionStorage.getItem('emailConfirmPending') === 'true';
var _intentionalSignOut = false; // previene que onAuthStateChange SIGNED_OUT interfiera con nuestro flujo

function initSupabase(){
  if(typeof supabase === 'undefined'){ console.error('Supabase CDN no cargó'); return false; }
  _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // CRÍTICO: registrar el listener INMEDIATAMENTE después de crear el cliente.
  // Supabase JS v2 procesa el #access_token al crear el cliente y dispara
  // SIGNED_IN en el mismo tick — si el listener llega tarde, el evento se pierde.
  _supabase.auth.onAuthStateChange(function(event, session){
    if((event==='SIGNED_IN'||event==='TOKEN_REFRESHED')&&session&&session.access_token){
      try{ localStorage.setItem('_sbAccess',session.access_token); localStorage.setItem('_sbAccessAt',String(Date.now())); }catch(e){}
    }
    if(event === 'SIGNED_OUT'){
      // Si el cierre fue iniciado por nuestro signOut(), él maneja la pantalla
      if(_intentionalSignOut){ _intentionalSignOut = false; return; }
      _currentUser = null;
      showAuthScreen();
      _showScreen('login');
      return;
    }

    // Cuando el usuario regresa del enlace de confirmación,
    // SIGNED_IN se dispara con la sesión ya establecida.
    // Usamos session.user directamente (sin llamar getUser de nuevo).
    if(event === 'SIGNED_IN' && _emailConfirmPending){
      var u = session && session.user;
      if(u) _currentUser = u;
      var btn = document.getElementById('verify-continue-btn');
      if(u && u.email_confirmed_at && btn){
        btn.disabled = false;
        try{ toast('¡Listo! Correo confirmado ✓'); }catch(e){}
      }else if(btn){
        // Fallback: el evento llegó pero email_confirmed_at aún no está
        enableContinueIfVerified();
      }
      return; // No ir al dashboard
    }

    if(event === 'PASSWORD_RECOVERY'){
      if(session && session.user) _currentUser = session.user;
      showAuthScreen(); _showScreen('reset-password');
      try{ window.history.replaceState({}, document.title, window.location.pathname); }catch(e){}
    }
  });

  return true;
}

function generateNameFromEmail(email){
  if(!email) return 'Usuario';
  return email.split('@')[0]
    .replace(/[0-9]/g,'').replace(/[._-]/g,' ')
    .replace(/\b\w/g,function(l){ return l.toUpperCase(); })
    .trim() || 'Usuario';
}

async function signUp(email, password, fullName){
  var autoName = (fullName&&fullName.trim())?fullName.trim():generateNameFromEmail(email);
  var {data, error} = await _supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: 'https://finanzia.xenda.co',
      data: { full_name: autoName }
    }
  });
  if(error) return _authMsg(error.message);
  return {ok:true, data:data};
}
async function signIn(email, password){
  var {data, error} = await _supabase.auth.signInWithPassword({email, password});
  if(error) return _authMsg(error.message);
  _currentUser = data.user;
  var _sName=(data.user.user_metadata&&data.user.user_metadata.full_name)||'';
  _persistLastUserId(data.user.id, data.user.email, _sName);
  if(data.session){ try{ localStorage.setItem('_sbAccess',data.session.access_token); localStorage.setItem('_sbAccessAt',String(Date.now())); }catch(e){} }
  return {ok:true, user:data.user};
}
async function signOut(){
  try{
    if(_currentUser && _currentUser.id){ var _oName=(_currentUser.user_metadata&&_currentUser.user_metadata.full_name)||''; _persistLastUserId(_currentUser.id, _currentUser.email, _oName); }
    _intentionalSignOut = true;
    localStorage.setItem('_signedOutNormally', '1'); // marca que fue un cierre voluntario
    await _supabase.auth.signOut();
  }catch(e){ console.warn('signOut warning:',e.message); _intentionalSignOut = false; }
  showAuthScreen();
  var lastUser = _getLastAuthUser();
  if(lastUser){
    _currentUser = lastUser;
    _showWelcomeScreen(null);
  }else{
    _currentUser = null;
    _showScreen('login');
  }
}
async function deleteUserAccount(){
  confirmDialog(
    '⚠️',
    'Eliminar cuenta',
    '¿Seguro que quieres irte? Borraremos todos tus datos para siempre. Esto no tiene marcha atrás.',
    function(){ _showDeletePasswordModal(); },
    'Sí, eliminar todo',
    'btn-danger'
  );
}
function _getFirstNameForDelete(){
  try{
    if(typeof S!=='undefined'&&S.profile&&S.profile.name) return S.profile.name.split(' ')[0];
    if(_currentUser&&_currentUser.user_metadata&&_currentUser.user_metadata.full_name) return _currentUser.user_metadata.full_name.split(' ')[0];
    if(_currentUser&&_currentUser.email) return _currentUser.email.split('@')[0];
  }catch(e){}
  return 'usuario';
}
function _showDeletePasswordModal(){
  var old = document.getElementById('delete-pw-overlay');
  if(old) old.remove();
  var ov = document.createElement('div');
  ov.id = 'delete-pw-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;animation:bsFadeIn .2s ease';
  ov.innerHTML =
    '<div style="width:100%;background:var(--surface);border-radius:24px 24px 0 0;padding:24px 24px max(env(safe-area-inset-bottom),32px);animation:bsSlideUp .28s cubic-bezier(.32,1,.42,1)">'
    +'<div style="display:flex;justify-content:center;margin-bottom:16px"><div style="width:40px;height:4px;border-radius:2px;background:var(--border)"></div></div>'
    +'<div style="font-size:24px;font-weight:700;color:var(--text);text-align:center;margin-bottom:4px">Hola, '+_getFirstNameForDelete()+'</div>'
    +'<div style="font-size:18px;font-weight:700;color:var(--danger);margin-bottom:8px;text-align:center">⚠️ Confirma tu identidad</div>'
    +'<div style="font-size:13px;color:var(--text2);text-align:center;margin-bottom:20px">Por seguridad es necesario que ingreses la contraseña con la que te registraste para eliminar tu cuenta definitivamente.</div>'
    +'<div style="position:relative;margin-bottom:8px">'
      +'<input id="del-pw-input" type="password" placeholder="Contraseña" autocomplete="current-password" style="width:100%;padding:14px 48px 14px 16px;border-radius:12px;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);font-size:15px;font-family:var(--font);box-sizing:border-box">'
      +'<button onclick="_toggleDelPw()" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text3);font-size:18px" id="del-pw-eye">&#128065;</button>'
    +'</div>'
    +'<div id="del-pw-err" style="min-height:18px;font-size:12px;color:var(--danger);margin-bottom:14px;padding-left:4px"></div>'
    +'<button id="del-pw-btn" onclick="_confirmDeleteWithPassword()" style="width:100%;padding:15px;border-radius:50px;background:var(--danger);border:none;color:white;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--font)">Eliminar mi cuenta</button>'
    +'<button onclick="_closeDeletePwOverlay()" style="width:100%;padding:12px;border-radius:50px;background:transparent;border:none;color:var(--text2);font-size:14px;cursor:pointer;font-family:var(--font);margin-top:8px">Cancelar</button>'
    +'</div>';
  document.body.appendChild(ov);
  setTimeout(function(){ var i=document.getElementById('del-pw-input'); if(i) i.focus(); },300);
}
function _closeDeletePwOverlay(){ var o=document.getElementById('delete-pw-overlay'); if(o) o.remove(); }
function _toggleDelPw(){
  var inp=document.getElementById('del-pw-input');
  var eye=document.getElementById('del-pw-eye');
  if(!inp) return;
  if(inp.type==='password'){ inp.type='text'; if(eye) eye.innerHTML='&#128584;'; }
  else{ inp.type='password'; if(eye) eye.innerHTML='&#128065;'; }
}
async function _confirmDeleteWithPassword(){
  var inp=document.getElementById('del-pw-input');
  var err=document.getElementById('del-pw-err');
  var btn=document.getElementById('del-pw-btn');
  if(!inp) return;
  var pw=inp.value.trim();
  if(!pw){ if(err) err.textContent='Ingresa tu contraseña'; return; }
  var email=(_currentUser&&_currentUser.email)||localStorage.getItem('_lastAuthUserEmail')||'';
  if(!email){ if(err) err.textContent='No se encontró el email'; return; }
  if(btn){ btn.disabled=true; btn.textContent='Verificando...'; }
  try{
    var {data,error}=await _supabase.auth.signInWithPassword({email:email,password:pw});
    if(error||!data.session){
      if(err) err.textContent='Contraseña incorrecta';
      if(btn){ btn.disabled=false; btn.textContent='Eliminar mi cuenta'; }
      return;
    }
    var token=data.session.access_token;
    if(btn) btn.textContent='Eliminando...';
    var controller=new AbortController();
    var fetchTimeout=setTimeout(function(){controller.abort();},15000);
    var res=await fetch('https://dshwbvqvfbjtlbcqqviz.supabase.co/functions/v1/delete-account',{
      method:'POST',
      headers:{
        'Authorization':'Bearer '+token,
        'apikey':'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaHdidnF2ZmJqdGxiY3Fxdml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTM1OTYsImV4cCI6MjA5MDg4OTU5Nn0.kjie4SHtxJZYkX1rspJK2JNpOWfbd-Xdx3UZfgqydXU',
      },
      signal:controller.signal
    });
    clearTimeout(fetchTimeout);
    var json=await res.json();
    if(!res.ok){
      if(err) err.textContent='Error: '+(json.error||'No se pudo eliminar');
      if(btn){ btn.disabled=false; btn.textContent='Eliminar mi cuenta'; }
      return;
    }
    var ov2=document.getElementById('delete-pw-overlay');
    if(ov2) ov2.remove();
    localStorage.clear();
    sessionStorage.clear();
    _currentUser=null;
    _intentionalSignOut=true;
    try{ await _supabase.auth.signOut(); }catch(e){}
    var el=document.getElementById('onboarding-screen');
    if(el) el.remove();
    _showOnboarding();
  }catch(e){
    if(err) err.textContent='Error: '+e.message;
    if(btn){ btn.disabled=false; btn.textContent='Eliminar mi cuenta'; }
  }
}
async function getCurrentUser(){
  var {data} = await _supabase.auth.getSession();
  return data.session ? data.session.user : null;
}

// ════════════════════════════════════════════════════════════
// BIOMETRÍA — WebAuthn
// ════════════════════════════════════════════════════════════
function _isBioAvailable(){
  return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
}
// Migración única: mueve claves bio globales a claves por usuario (compatibilidad con versiones anteriores)
function _migrateBioToUserKeys(){
  var lastUid = localStorage.getItem('_lastAuthUserId');
  if(!lastUid) return;
  var globalEnabled = localStorage.getItem('_bioEnabled');
  var globalCredId  = localStorage.getItem('_bioCredId');
  if(globalEnabled && !localStorage.getItem('_bioEnabled_' + lastUid)){
    localStorage.setItem('_bioEnabled_' + lastUid, globalEnabled);
    if(globalCredId) localStorage.setItem('_bioCredId_' + lastUid, globalCredId);
  }
  localStorage.removeItem('_bioEnabled');
  localStorage.removeItem('_bioCredId');
}
function _isBioEnabled(){
  if(!_currentUser || !_currentUser.id) return false;
  var uid = _currentUser.id;
  return localStorage.getItem('_bioEnabled_' + uid) === '1' && !!localStorage.getItem('_bioCredId_' + uid);
}
function _b64ToBuffer(b64){ var bin=atob(b64),buf=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i); return buf.buffer; }
function _randomChallenge(){ var arr=new Uint8Array(32); crypto.getRandomValues(arr); return arr; }

async function bioRegister(userId, email){
  if(!_isBioAvailable()) return false;
  try{
    var cred = await navigator.credentials.create({publicKey:{
      challenge: _randomChallenge(),
      rp: {name:'FinanzIA', id: window.location.hostname},
      user: {id: new TextEncoder().encode(userId), name: 'FinanzIA', displayName: 'FinanzIA User'},
      pubKeyCredParams: [{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
      authenticatorSelection: {authenticatorAttachment:'platform', userVerification:'required'},
      timeout: 60000
    }});
    var arr = new Uint8Array(cred.rawId);
    localStorage.setItem('_bioCredId_' + userId, btoa(String.fromCharCode(...arr)));
    localStorage.setItem('_bioEnabled_' + userId, '1');
    return true;
  }catch(e){ console.log('Bio register cancelled:',e.message); return false; }
}

async function bioAuthenticate(){
  if(!_isBioEnabled()) return false;
  try{
    var assertion = await navigator.credentials.get({publicKey:{
      challenge: _randomChallenge(),
      allowCredentials: [{type:'public-key', id:_b64ToBuffer(localStorage.getItem('_bioCredId_' + (_currentUser && _currentUser.id ? _currentUser.id : '')))}],
      userVerification: 'required',
      timeout: 60000
    }});
    return !!assertion;
  }catch(e){
    console.log('Bio auth error:', e.message);
    if(e.name === 'NotAllowedError') return 'cancelled';
    return false;
  }
}

// ════════════════════════════════════════════════════════════
// BOTTOM SHEET — DESBLOQUEO BIOMÉTRICO (al abrir app)
// ════════════════════════════════════════════════════════════
function _showBioSheet(user){
  var old = document.getElementById('bio-sheet-overlay');
  if(old) old.remove();

  var overlay = document.createElement('div');
  overlay.id = 'bio-sheet-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;animation:bsFadeIn .2s ease;pointer-events:auto';

  overlay.innerHTML =
    '<div id="bio-sheet" style="width:100%;background:var(--surface,#fff);border-radius:24px 24px 0 0;padding:0 0 max(env(safe-area-inset-bottom),24px);animation:bsSlideUp .28s cubic-bezier(.32,1,.42,1)">'
    +'<div style="display:flex;justify-content:center;padding:12px 0 4px"><div style="width:40px;height:4px;border-radius:2px;background:var(--border,#E2E8F0)"></div></div>'
    +'<div style="padding:20px 28px 28px;text-align:center">'
      // Logo row
      +'<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px">'
        +'<img src="/icon-192.png" style="width:28px;height:28px;border-radius:6px" alt="FinanzIA">'
        +'<span style="font-weight:800;font-size:18px;color:var(--text,#0F172A);letter-spacing:-.3px">Finanz<span style="color:#00D4AA">IA</span></span>'
      +'</div>'
      // Icon
      +'<div style="font-size:52px;margin:8px 0 16px;line-height:1">🔒</div>'
      // Text
      +'<div style="font-size:17px;font-weight:700;color:var(--text,#0F172A);margin-bottom:24px">Usa tu huella o Face ID para continuar</div>'
      // Error
      +'<div id="bio-sheet-err" style="display:none;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:10px 14px;font-size:13px;color:#DC2626;margin-bottom:16px;text-align:left"></div>'
      // Primary btn
      +'<button id="bio-sheet-btn" onclick="_handleBioSheetUnlock()" style="width:100%;height:52px;background:linear-gradient(135deg,#00D4AA,#7461EF);border:none;border-radius:50px;color:white;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:12px;font-family:var(--font,inherit);transition:opacity .15s">🔓 Usar huella / Face ID</button>'
      // Secondary btn
      +'<button onclick="_bioSheetFallback()" style="background:none;border:none;color:var(--text2,#94A3B8);font-size:14px;cursor:pointer;font-family:var(--font,inherit);padding:8px">Usar contraseña</button>'
    +'</div>'
    +'</div>';

  document.body.appendChild(overlay);
}

function _closeBioSheet(){
  var el = document.getElementById('bio-sheet-overlay');
  if(!el) return;
  var sheet = document.getElementById('bio-sheet');
  if(sheet) sheet.style.animation = 'bsSlideDown .22s ease forwards';
  el.style.animation = 'none';
  el.style.opacity = '0';
  el.style.transition = 'opacity .22s';
  setTimeout(function(){ if(el.parentNode) el.remove(); }, 240);
}

async function _handleBioSheetUnlock(){
  var btn = document.getElementById('bio-sheet-btn');
  var errEl = document.getElementById('bio-sheet-err');
  if(btn){ btn.disabled = true; btn.textContent = 'Verificando...'; }
  if(errEl){ errEl.style.display = 'none'; }

  console.log('Bio start');
  if(!_currentUser || !_currentUser.id){
    try{
      var u = await getCurrentUser();
      if(!u){
        _closeBioSheet();
        showAuthScreen();
        _showScreen('login');
        return;
      }
      _currentUser = u;
    }catch(e){}
  }
  var ok = await bioAuthenticate();
  console.log('Bio result:', ok);

  if(ok){
    _closeBioSheet();
    var user = _currentUser;
    if(!user){ try{ user = await getCurrentUser(); _currentUser = user; }catch(e){} }
    if(typeof initApp==='function') initApp();
    if(user){
      _injectLogoutBtn(user);
      if(typeof safeSync === 'function'){
        safeSync(user.id).catch(function(e){ console.warn('sync error:',e); });
      }
    }
  }else{
    var _buid=(_currentUser&&_currentUser.id)?_currentUser.id:localStorage.getItem('_lastAuthUserId');
    if(_buid){ localStorage.removeItem('_bioEnabled_'+_buid); localStorage.removeItem('_bioCredId_'+_buid); }
    _closeBioSheet();
    showAuthScreen();
    _showScreen('login');
    try{ toast('Hmm, no te reconocí. Intenta con tu contraseña.'); }catch(e){}
  }
}

function _bioSheetFallback(){
  // Solo cerrar sheet y mostrar login — NO eliminar configuración biométrica
  // La biometría sigue activa para el próximo ingreso
  _closeBioSheet();
  showAuthScreen();
  _showScreen('login');
}

// ════════════════════════════════════════════════════════════
// BOTTOM SHEET — OFERTA DE ACTIVAR BIOMETRÍA (post-login)
// ════════════════════════════════════════════════════════════
function _showBioOfferSheet(user){
  if(!_isBioAvailable() || _isBioEnabled()) return;

  var old = document.getElementById('bio-offer-overlay');
  if(old) old.remove();

  var overlay = document.createElement('div');
  overlay.id = 'bio-offer-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;animation:bsFadeIn .2s ease;pointer-events:auto';

  overlay.innerHTML =
    '<div id="bio-offer-sheet" style="width:100%;background:var(--surface,#fff);border-radius:24px 24px 0 0;padding:0 0 max(env(safe-area-inset-bottom),24px);animation:bsSlideUp .28s cubic-bezier(.32,1,.42,1)">'
    +'<div style="display:flex;justify-content:center;padding:12px 0 4px"><div style="width:40px;height:4px;border-radius:2px;background:var(--border,#E2E8F0)"></div></div>'
    +'<div style="padding:20px 28px 28px">'
      // Header
      +'<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">'
        +'<div style="width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,rgba(0,212,170,.15),rgba(116,97,239,.15));display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">🔐</div>'
        +'<div>'
          +'<div style="font-size:17px;font-weight:700;color:var(--text,#0F172A);margin-bottom:3px">Activa acceso rápido</div>'
          +'<div style="font-size:13px;color:var(--text2,#64748B)">Más cómodo y seguro</div>'
        +'</div>'
      +'</div>'
      // Description
      +'<div style="font-size:14px;color:var(--text2,#64748B);line-height:1.6;margin-bottom:24px;padding:14px 16px;background:var(--surface2,#F1F5F9);border-radius:12px">'
        +'Puedes ingresar con tu <strong style="color:var(--text,#0F172A)">huella o Face ID</strong> la próxima vez. Sin recordar contraseñas, sin demoras.'
      +'</div>'
      // Buttons
      +'<button id="bio-offer-btn" onclick="_activateBioFromSheet(\'' + (user ? user.id : '') + '\',\'' + (user ? user.email : '') + '\')" style="width:100%;height:50px;background:linear-gradient(135deg,#00D4AA,#7461EF);border:none;border-radius:50px;color:white;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;font-family:var(--font,inherit);transition:opacity .15s">Activar ahora</button>'
      +'<button onclick="_closeBioOfferSheet()" style="width:100%;height:44px;background:transparent;border:1.5px solid var(--border,#E2E8F0);border-radius:50px;color:var(--text2,#64748B);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font,inherit)">Ahora no</button>'
    +'</div>'
    +'</div>';

  document.body.appendChild(overlay);
}

function _closeBioOfferSheet(){
  var el = document.getElementById('bio-offer-overlay');
  if(!el) return;
  var sheet = document.getElementById('bio-offer-sheet');
  if(sheet) sheet.style.animation = 'bsSlideDown .22s ease forwards';
  el.style.opacity = '0';
  el.style.transition = 'opacity .22s';
  setTimeout(function(){ if(el.parentNode) el.remove(); }, 240);
}

async function _activateBioFromSheet(userId, email){
  var btn = document.getElementById('bio-offer-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Verificando...'; }
  var ok = await bioRegister(userId, email);
  _closeBioOfferSheet();
  if(ok){
    if(typeof S!=='undefined'&&S.currentPage==='mi-perfil'){
      setTimeout(function(){if(typeof renderPage==='function')renderPage('mi-perfil');},300);
    }else{
      try{ toast('¡Listo! Huella activada ✓'); }catch(e){}
    }
  }
}

// ════════════════════════════════════════════════════════════
// UI
// ════════════════════════════════════════════════════════════
function showAuthScreen(){
  var el=document.getElementById('auth-screen'); if(el)el.style.display='flex';
  var app=document.getElementById('app'); if(app)app.style.display='none';
}
function hideAuthScreen(){
  var el=document.getElementById('auth-screen'); if(el)el.style.display='none';
  var app=document.getElementById('app'); if(app)app.style.display='flex';
}
function _showScreen(name){
  ['login','register','bio','verify','recover','welcome','password-only','reset-password','set-pin','bio-setup'].forEach(function(id){
    var el=document.getElementById('auth-'+id); if(el)el.style.display='none';
  });
  var t=document.getElementById('auth-'+name);
  // display:flex activa flex-direction:column de .auth-panel → auth-body flex:1 empuja auth-bottom al fondo
  // auth-bio tiene estructura propia (no usa auth-panel), se muestra como block
  if(t) t.style.display = (name==='bio') ? 'block' : 'flex';
  if(name==='login') setTimeout(_loadSavedCredentials, 50);
}
function _setError(id,msg){
  var el=document.getElementById('auth-err-'+id);
  if(el){el.textContent=msg||'';el.style.display=msg?'block':'none';}
}
function _setBusy(id,busy,label){
  var b=document.getElementById(id); if(!b)return; b.disabled=busy; if(label)b.textContent=busy?'Cargando...':label;
}

async function handleLogin(){
  var email=(document.getElementById('li-email').value||'').trim();
  var pass=(document.getElementById('li-pass').value||'').trim();
  if(!email||!pass){_setError('li','Falta algo por completar 👆');return;}
  _setError('li',''); _setBusy('li-btn',true,'Iniciar sesión');
  var res=await signIn(email,pass);
  _setBusy('li-btn',false,'Iniciar sesión');
  if(!res.ok){
    // Contar intentos fallidos
    var _liAttempts=(parseInt(sessionStorage.getItem('_liAttempts')||'0'))+1;
    sessionStorage.setItem('_liAttempts',String(_liAttempts));
    var errMsg=res.msg;
    if(_liAttempts>=3){
      errMsg=res.msg+'<br><button onclick="goToRecover()" style="margin-top:8px;background:none;border:none;color:var(--primary);font-size:13px;cursor:pointer;font-family:var(--font);text-decoration:underline;padding:0">¿Olvidaste tu contraseña?</button>';
      var errEl=document.getElementById('auth-err-li');
      if(errEl){errEl.innerHTML=errMsg;errEl.style.display='block';}
    }else{
      _setError('li',errMsg);
    }
    return;
  }
  sessionStorage.removeItem('_liAttempts');
  // Guardar credenciales si "Recordar mis datos" está activo
  var remBox=document.getElementById('li-remember-box');
  if(remBox&&remBox.classList.contains('ck')){
    try{localStorage.setItem('_remEmail',email);localStorage.setItem('_remPass',pass);}catch(e){}
  }else{
    try{localStorage.removeItem('_remEmail');localStorage.removeItem('_remPass');}catch(e){}
  }
  await _afterLogin(res.user);
}

async function handleRegister(){
  var name=(document.getElementById('rg-name').value||'').trim();
  var email=(document.getElementById('rg-email').value||'').trim();
  var pass=(document.getElementById('rg-pass').value||'').trim();
  if(!name){_setError('rg','Ingresa tu nombre y apellido');return;}
  var tcCheck=document.getElementById('rg-tc');
  if(!tcCheck||!tcCheck.checked){_setError('rg','Debes aceptar los Términos y Condiciones para continuar');return;}
  if(name.split(/\s+/).filter(Boolean).length<2){_setError('rg','Ingresa nombre y apellido completos');return;}
  if(!email||!pass){_setError('rg','Falta algo por completar 👆');return;}
  if(pass.length<8){_setError('rg','Mínimo 8 caracteres');return;}
  if(!/[A-Z]/.test(pass)){_setError('rg','Debe incluir al menos una mayúscula');return;}
  if(!/[0-9]/.test(pass)){_setError('rg','Debe incluir al menos un número');return;}
  if(!/[^A-Za-z0-9]/.test(pass)){_setError('rg','Debe incluir al menos un carácter especial (!@#$...)');return;}
  var exists=document.getElementById('auth-rg-exists');
  if(exists)exists.style.display='none';
  _setError('rg',''); _setBusy('rg-btn',true,'Crear cuenta');
  var res=await signUp(email,pass,name);
  _setBusy('rg-btn',false,'Crear cuenta');
  if(!res.ok){
    if(res.isExists){
      if(exists)exists.style.display='block';
    }else{
      _setError('rg',res.msg);
    }
    return;
  }
  _showScreen('verify');
  // Mostrar email en la pantalla de verificación
  var vEd=document.getElementById('verify-email-display');
  if(vEd)vEd.textContent=email;
  // localStorage: el enlace de confirmación puede abrir en nueva instancia de la PWA
  localStorage.setItem('pendingEmail', email);
  localStorage.setItem('pendingPassword', pass);
  localStorage.setItem('pendingName', name);
  enableContinueIfVerified();
}
function goToLoginWithEmail(){
  var email=(document.getElementById('rg-email').value||'').trim();
  goToLogin();
  setTimeout(function(){
    var li=document.getElementById('li-email');
    if(li&&email)li.value=email;
  },100);
}

async function _afterLogin(user){
  localStorage.removeItem('pendingEmail');
  localStorage.removeItem('pendingPassword');
  localStorage.removeItem('pendingName');
  _currentUser = user;
  _injectLogoutBtn(user);

  // Onboarding solo si nunca se completó para este usuario
  if(!_isOnboardingCompleted(user.id)){
    showAuthScreen();
    _initSetPinScreen();
    _showScreen('set-pin');
    return;
  }

  // Onboarding ya completado → entrar al app directamente
  hideAuthScreen();
  if(typeof initApp==='function') initApp();
  if(typeof safeSync==='function'){
    safeSync(user.id).then(function(){
      try{
        if(!S.profile||!S.profile.name||!S.profile.name.trim()){
          if(typeof openProfilePage==='function') openProfilePage();
        }
      }catch(e){ console.warn('Profile check error:',e); }
    }).catch(function(e){ console.warn('sync error:',e); });
  }
}

// Mantener handleBioUnlock para compatibilidad con auth-bio existente
async function handleBioUnlock(){
  _setBusy('bio-btn',true,'🔓 Desbloquear');
  var ok=await bioAuthenticate();
  _setBusy('bio-btn',false,'🔓 Desbloquear');
  if(ok){
    hideAuthScreen();
    if(typeof initApp==='function') initApp();
    _injectLogoutBtn(_currentUser);
    if(_currentUser&&typeof safeSync==='function'){
      safeSync(_currentUser.id).catch(function(e){console.warn('sync error:',e);});
    }
  }else{
    _setError('bio','Hmm, no te reconocí. Intenta de nuevo o usa tu contraseña.');
  }
}
function handleBioFallback(){ _showScreen('login'); }

function _injectLogoutBtn(){
  if(document.getElementById('drawer-logout-btn')) return;
  var drawer = document.getElementById('drawer'); if(!drawer) return;
  var container = document.createElement('div');
  container.id = 'drawer-logout-btn';
  container.setAttribute('onclick', 'signOut()');
  container.style.cssText = 'padding:10px 14px 18px;border-top:0.5px solid var(--border);flex-shrink:0;cursor:pointer';
  container.innerHTML =
    '<div class="drawer-logout-btn">'
    +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;color:var(--danger)">'
    +'<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'
    +'</svg>'
    +'<span style="pointer-events:none">Cerrar sesión</span>'
    +'</div>';
  drawer.appendChild(container);
}

// Delegación de eventos: cualquier clic dentro de #drawer-logout-btn activa signOut()
document.addEventListener('click', function(e){
  if(e.target.closest && e.target.closest('#drawer-logout-btn')){
    e.preventDefault();
    signOut();
  }
});

function goToRegister(){_setError('li','');_showScreen('register');}
function goToRecover(){_setError('li','');_showScreen('recover');}
function goToLoginFromRecover(){_setError('rc','');_showScreen('login');}

function _toggleRemember(row){
  var box=document.getElementById('li-remember-box');
  if(!box)return;
  if(box.classList.contains('ck')){
    box.classList.remove('ck');
    box.innerHTML='';
  }else{
    box.classList.add('ck');
    box.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
  }
}

function _loadSavedCredentials(){
  try{
    var em=localStorage.getItem('_remEmail');
    var ps=localStorage.getItem('_remPass');
    var elE=document.getElementById('li-email');
    var elP=document.getElementById('li-pass');
    if(em&&elE)elE.value=em;
    if(ps&&elP)elP.value=ps;
  }catch(e){}
}

async function handleRecoverPassword(){
  var email=(document.getElementById('rc-email').value||'').trim();
  if(!email){_setError('rc','Ingresa tu correo');return;}
  _setError('rc','');
  var btn=document.getElementById('rc-btn');
  if(btn){btn.disabled=true;btn.textContent='Cargando...';}
  try{
    // Supabase password reset — envía email con link
    if(_supabase){
      var {error}=await _supabase.auth.resetPasswordForEmail(email,{
        redirectTo: 'https://finanzia.xenda.co'
      });
      if(error){
        _setError('rc','No pudimos enviar el correo. Verifica la dirección.');
      }else{
        // Mostrar estado de éxito inline dentro de la misma pantalla
        var okEl=document.getElementById('auth-rc-ok');
        if(okEl)okEl.style.display='block';
        var btnEl=document.getElementById('rc-btn');
        if(btnEl)btnEl.style.display='none';
      }
    }
  }catch(e){
    _setError('rc','Algo salió mal. Intenta de nuevo.');
  }
  if(btn){btn.disabled=false;btn.textContent='Recuperar contraseña';}
}
function goToLogin(){
  _emailConfirmPending = false;
  sessionStorage.removeItem('emailConfirmPending');
  _showScreen('login');
  // Precargar credenciales del registro para facilitar el primer login
  // Usa localStorage porque el enlace de confirmación puede abrir en otra instancia
  var pe = localStorage.getItem('pendingEmail');
  var pp = localStorage.getItem('pendingPassword');
  if(pe || pp){
    setTimeout(function(){
      var elEmail = document.getElementById('li-email');
      var elPass  = document.getElementById('li-pass');
      if(elEmail && pe) elEmail.value = pe;
      if(elPass  && pp) elPass.value  = pp;
      localStorage.removeItem('pendingEmail');
      localStorage.removeItem('pendingPassword');
      localStorage.removeItem('pendingName');
    }, 80);
  }
}
function authKey(e,fn){if(e.key==='Enter'&&typeof window[fn]==='function')window[fn]();}
function togglePass(iId,bId){var i=document.getElementById(iId),b=document.getElementById(bId);if(!i)return;i.type=i.type==='password'?'text':'password';if(b)b.textContent=i.type==='password'?'👁️':'🙈';}

function _authMsg(msg){
  if(!msg)return{ok:false,msg:'Error desconocido'};
  if(msg.includes('already registered'))return{ok:false,msg:'',isExists:true};
  if(msg.includes('User already registered'))return{ok:false,msg:'',isExists:true};
  if(msg.includes('Invalid login'))return{ok:false,msg:'Hmm, algo no cuadra. ¿Revisamos el correo o la contraseña?'};
  if(msg.includes('Password should'))return{ok:false,msg:'Contraseña débil: mínimo 8 caracteres, mayúscula, número y símbolo'};
  if(msg.includes('valid email'))return{ok:false,msg:'Ingresa un correo válido'};
  if(msg.includes('Email not confirmed'))return{ok:false,msg:'Primero confirma tu correo — revisa tu bandeja 📬'};
  if(msg.includes('rate limit'))return{ok:false,msg:'Demasiados intentos seguidos. Espera un momento e intenta de nuevo.'};
  return{ok:false,msg:msg};
}


// ════════════════════════════════════════════════════════════
// VALIDACIÓN VISUAL CONTRASEÑA — tiempo real
// ════════════════════════════════════════════════════════════
function _authPwCheck(val){
  var checks=[
    {ok: val.length>=8},
    {ok: /[A-Z]/.test(val)},
    {ok: /[0-9]/.test(val)},
    {ok: /[^A-Za-z0-9]/.test(val)}
  ];
  checks.forEach(function(r,i){
    var n=i+1;
    var elA=document.getElementById('pw-r'+n);
    var elB=document.getElementById('rp-r'+n);
    var elC=document.getElementById('pwc-r'+n);
    if(elA)elA.classList.toggle('ok',r.ok);
    if(elB)elB.classList.toggle('ok',r.ok);
    if(elC)elC.classList.toggle('ok',r.ok);
  });
}

// Google auth — placeholder (conectar OAuth cuando esté disponible)
function handleGoogleAuth(){
  // TODO: implementar Google OAuth con Supabase
  try{toast('Google próximamente disponible');}catch(e){}
}

// ════════════════════════════════════════════════════════════
// PIN — Sistema completo (hash + guardar + validar + UI)
// ════════════════════════════════════════════════════════════

// PARTE 1 — Hash seguro con Web Crypto API
async function _hashPin(pin){
  var enc = new TextEncoder().encode(pin);
  var buf = await crypto.subtle.digest('SHA-256', enc);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
}

// PARTE 2 — Guardar PIN (por usuario)
async function saveUserPin(pin){
  if(!_currentUser || !_currentUser.id){ console.warn('PIN sin usuario válido'); return false; }
  var uid = _currentUser.id;
  var hash = await _hashPin(pin);
  localStorage.setItem('_userPin_' + uid, hash);
  localStorage.setItem('_pinEnabled_' + uid, '1');
}

// PARTE 3 — Validar PIN (por usuario)
async function validateUserPin(pin){
  if(!_currentUser || !_currentUser.id){ console.warn('PIN sin usuario válido'); return false; }
  var uid = _currentUser.id;
  var stored = localStorage.getItem('_userPin_' + uid);
  if(!stored) return false;
  var hash = await _hashPin(pin);
  return hash === stored;
}

// Helpers de estado
function _isPinEnabled(){
  if(!_currentUser || !_currentUser.id) return false;
  var uid = _currentUser.id;
  return localStorage.getItem('_pinEnabled_' + uid) === '1' && !!localStorage.getItem('_userPin_' + uid);
}
function _isOnboardingCompleted(uid){
  return localStorage.getItem('_onboardingCompleted_' + uid) === '1';
}
function _setOnboardingCompleted(uid){
  localStorage.setItem('_onboardingCompleted_' + uid, '1');
}
// Retorna true si el usuario tiene PIN o biometría configurados en este dispositivo
function _hasQuickAccess(uid){
  if(!uid) return false;
  var hasPin = localStorage.getItem('_pinEnabled_' + uid) === '1' && !!localStorage.getItem('_userPin_' + uid);
  var hasBio = localStorage.getItem('_bioEnabled_' + uid) === '1' && !!localStorage.getItem('_bioCredId_' + uid);
  return hasPin || hasBio;
}

// Persiste el UID y email del último usuario autenticado para detectar eliminaciones posteriores
function _persistLastUserId(uid, email, name){
  if(uid){
    localStorage.setItem('_lastAuthUserId', uid);
    if(email) localStorage.setItem('_lastAuthUserEmail', email);
    if(name) localStorage.setItem('_lastAuthUserName', name);
  }
}

// Devuelve un objeto {id, email} del último usuario (real o stub post-signOut)
function _getLastAuthUser(){
  if(_currentUser && _currentUser.id) return _currentUser;
  var lastUid = localStorage.getItem('_lastAuthUserId');
  if(!lastUid) return null;
  var email = localStorage.getItem('_lastAuthUserEmail') || '';
  return {id: lastUid, email: email};
}

// Detecta si el usuario fue eliminado de Supabase (basado en respuesta del servidor).
async function _wasUserDeleted(){
  var lastUid = localStorage.getItem('_lastAuthUserId');
  if(!lastUid) return false;
  try{
    var rv = await _supabase.auth.getUser();
    if(rv.error || !rv.data || !rv.data.user) return true;
  }catch(e){
    console.warn('Error verificando eliminaci\u00f3n del usuario:', e);
    return true;
  }
  return false;
}

// Limpieza centralizada de todos los datos locales del usuario
function _clearAllLocalUserData(){
  try{
    localStorage.removeItem('finanziaState3');
    localStorage.removeItem('_bioEnabled');
    localStorage.removeItem('_bioCredId');
    localStorage.removeItem('_lastAuthUserId');
    localStorage.removeItem('_lastAuthUserEmail');
    localStorage.removeItem('_pinAttempts');
    localStorage.removeItem('_pinLockUntil');
    localStorage.removeItem('pendingEmail');
    localStorage.removeItem('pendingPassword');
    localStorage.removeItem('pendingName');
    localStorage.removeItem('_signedOutNormally');
    Object.keys(localStorage).forEach(function(key){
      if(key.startsWith('_userPin_')||key.startsWith('_pinEnabled_')||
         key.startsWith('_onboardingCompleted_')||key.startsWith('_bioEnabled_')||
         key.startsWith('_bioCredId_')||key.startsWith('_pinAttempts_')||
         key.startsWith('_pinLockUntil_')){
        localStorage.removeItem(key);
      }
    });
  }catch(e){ console.warn('Error limpiando datos locales:', e); }
}
function _getPinAttempts(){ return parseInt(localStorage.getItem('_pinAttempts') || '0'); }
function _isPinLocked(){
  var until = parseInt(localStorage.getItem('_pinLockUntil') || '0');
  return Date.now() < until;
}
function _getPinLockSecondsLeft(){
  var until = parseInt(localStorage.getItem('_pinLockUntil') || '0');
  return Math.ceil((until - Date.now()) / 1000);
}
function _resetPinAttempts(){
  localStorage.removeItem('_pinAttempts');
  localStorage.removeItem('_pinLockUntil');
}

// ── Modal PIN helper: redibuja puntos ──
function _renderPinDots(pin, elId){
  var el = document.getElementById(elId || 'pin-dots');
  if(!el) return;
  var html = '';
  for(var i=0;i<4;i++){
    var filled = pin.length > i;
    html += '<div style="width:16px;height:16px;border-radius:50%;border:2px solid #00D4AA;background:'+(filled?'#00D4AA':'transparent')+';transition:background .1s"></div>';
  }
  el.innerHTML = html;
}

// ── SVG huella profesional (string reutilizable) ──
// ── SVG huella profesional (string reutilizable) ──
var _fpSvgLg = '<svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C7.58 2 4 5.58 4 10c0 3.54 2.29 6.53 5.47 7.59" stroke="#00D4AA" stroke-width="2" stroke-linecap="round"/><path d="M12 2c4.42 0 8 3.58 8 8 0 3.54-2.29 6.53-5.47 7.59" stroke="#00D4AA" stroke-width="2" stroke-linecap="round"/><path d="M8.5 10c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-2 4.5-4 6" stroke="#00D4AA" stroke-width="2" stroke-linecap="round"/><path d="M6 10c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="#00D4AA" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/></svg>';
var _fpSvgSm = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="pointer-events:none"><path d="M12 3C8.13 3 5 6.13 5 10c0 2.8 1.8 5.2 4.3 6.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 3c3.87 0 7 3.13 7 7 0 2.8-1.8 5.2-4.3 6.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 10c0-1.66 1.34-3 3-3s3 1.34 3 3c0 2-1.5 3.5-3 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

// ── Modal PIN helper: keypad con huella ──
function _buildKeypad(handler){
  var keys = [1,2,3,4,5,6,7,8,9,'fp',0,'⌫'];
  var html = '';
  keys.forEach(function(k){
    if(k === 'fp'){
      // Botón huella — solo si bio está habilitada, si no vacío
      if(_isBioEnabled()){
        html += '<button onclick="_pinUseBiometric()" '
          +'style="height:64px;border:none;background:var(--surface2,#F1F5F9);border-radius:14px;'
          +'cursor:pointer;color:#00D4AA;display:flex;align-items:center;justify-content:center;'
          +'-webkit-tap-highlight-color:transparent;transition:transform .08s,background .08s;width:100%" '
          +'ontouchstart="this.style.background=\'var(--surface3,#E2E8F0)\';this.style.transform=\'scale(.94)\'" '
          +'ontouchend="this.style.background=\'var(--surface2,#F1F5F9)\';this.style.transform=\'scale(1)\'">'
          +_fpSvgSm+'</button>';
      }else{
        html += '<div></div>';
      }
    }else{
      var isBackspace = k === '⌫';
      html += '<button onclick="'+handler+'(\''+k+'\')" '
        +'style="height:64px;border:none;background:var(--surface2,#F1F5F9);border-radius:14px;'
        +'font-size:'+(isBackspace?'22px':'24px')+';font-weight:'+(isBackspace?'400':'700')+';'
        +'cursor:pointer;color:var(--text,#0F172A);font-family:var(--font,inherit);'
        +'-webkit-tap-highlight-color:transparent;transition:transform .08s,background .08s" '
        +'ontouchstart="this.style.background=\'var(--surface3,#E2E8F0)\';this.style.transform=\'scale(.94)\'" '
        +'ontouchend="this.style.background=\'var(--surface2,#F1F5F9)\';this.style.transform=\'scale(1)\'">'
        +k+'</button>';
    }
  });
  return html;
}

// ── Biometría desde teclado PIN ──
async function _pinUseBiometric(){
  if(!_isBioEnabled()){
    try{ toast('Activa la huella primero'); }catch(e){}
    return;
  }
  closePinModal();
  var result = await bioAuthenticate();
  if(result === true){
    try{
      var res = await _supabase.auth.getUser();
      if(res.error || !res.data || !res.data.user) throw new Error('Invalid session');
      _currentUser = res.data.user;
    }catch(e){
      showAuthScreen(); _showScreen('login');
      try{ toast('Tu sesión expiró. Ingresa de nuevo.'); }catch(ex){}
      return;
    }
    hideAuthScreen();
    if(typeof initApp === 'function') initApp();
    if(_currentUser){
      _injectLogoutBtn(_currentUser);
      if(typeof safeSync === 'function'){
        safeSync(_currentUser.id).catch(function(e){ console.warn('sync error:',e); });
      }
    }
  }else if(result === 'cancelled'){
    showPinModal();
  }else{
    try{ toast('No se pudo verificar'); }catch(e){}
    showPinModal();
  }
}

// ════════════════════════════════════════════════════════════
// PARTE 4 — Modal creación de PIN (post login)
// ════════════════════════════════════════════════════════════
function showSetPinModal(user){
  var old = document.getElementById('set-pin-overlay');
  if(old) old.remove();

  // Estado único — única fuente de verdad, sin duplicación de variables
  var st = {step:1, first:[], current:[], user:user};

  var overlay = document.createElement('div');
  overlay.id = 'set-pin-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;animation:bsFadeIn .2s ease;pointer-events:auto';

  function draw(){
    var title    = st.step === 1 ? 'Crea tu PIN de 4 dígitos' : 'Confirma tu PIN';
    var subtitle = st.step === 1 ? 'Lo usarás para ingresar rápidamente' : 'Ingresa el mismo PIN de nuevo';
    overlay.innerHTML =
      '<div id="set-pin-sheet" style="width:100%;background:var(--surface,#fff);border-radius:24px 24px 0 0;padding:0 0 max(env(safe-area-inset-bottom),24px);animation:bsSlideUp .28s cubic-bezier(.32,1,.42,1)">'
      +'<div style="display:flex;justify-content:center;padding:12px 0 4px"><div style="width:40px;height:4px;border-radius:2px;background:var(--border,#E2E8F0)"></div></div>'
      +'<div style="padding:20px 28px 24px;text-align:center">'
        +'<div style="display:flex;align-items:center;justify-content:center;margin-bottom:10px">'
          +'<img src="/icon-192.png" style="width:40px;height:40px;border-radius:8px" alt="FinanzIA">'
        +'</div>'
        +'<div style="font-size:16px;font-weight:700;color:var(--text,#0F172A);margin-bottom:4px">'+title+'</div>'
        +'<div style="font-size:13px;color:var(--text2,#64748B);margin-bottom:20px">'+subtitle+'</div>'
        +'<div id="set-pin-dots" style="display:flex;justify-content:center;gap:16px;margin-bottom:8px"></div>'
        +'<div id="set-pin-err" style="min-height:20px;font-size:13px;color:#DC2626;margin-bottom:16px;text-align:center"></div>'
        +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">'+_buildKeypad('_setPinKey')+'</div>'
        +'<button onclick="closeSetPinModal()" style="margin-top:14px;background:none;border:none;color:var(--text2,#94A3B8);font-size:14px;cursor:pointer;font-family:var(--font,inherit)">Ahora no</button>'
      +'</div>'
      +'</div>';
    _renderPinDots(st.current, 'set-pin-dots');
  }

  draw();
  document.body.appendChild(overlay);

  window._setPinKey = async function(k){
    if(k === '⌫'){
      st.current.pop();
    }else if(st.current.length < 4){
      st.current.push(k);
      try{ if(navigator.vibrate) navigator.vibrate(10); }catch(e){}
    }
    _renderPinDots(st.current, 'set-pin-dots');

    if(st.current.length === 4){
      if(st.step === 1){
        // Paso 1 completo → avanzar a confirmación
        st.first   = st.current.slice();
        st.step    = 2;
        st.current = [];
        setTimeout(draw, 150);
      }else{
        // Paso 2 → comparar
        if(st.current.join('') === st.first.join('')){
          await saveUserPin(st.current.join(''));
          var u = st.user;
          closeSetPinModal();
          try{ toast('PIN guardado correctamente ✓'); }catch(e){}
          setTimeout(function(){
            if(_isBioAvailable() && !_isBioEnabled() && u){
              _showBioOfferSheet(u);
            }
          }, 500);
        }else{
          var errEl = document.getElementById('set-pin-err');
          if(errEl) errEl.textContent = 'Los PIN no coinciden. Inténtalo de nuevo.';
          st.step    = 1;
          st.first   = [];
          st.current = [];
          setTimeout(draw, 300);
        }
      }
    }
  };
}

function closeSetPinModal(){
  var el = document.getElementById('set-pin-overlay');
  if(!el) return;
  var sheet = document.getElementById('set-pin-sheet');
  if(sheet) sheet.style.animation = 'bsSlideDown .22s ease forwards';
  el.style.opacity = '0'; el.style.transition = 'opacity .22s';
  setTimeout(function(){ if(el.parentNode) el.remove(); window._setPinState = null; }, 240);
}

// ════════════════════════════════════════════════════════════
// PARTE 5 — Modal login con PIN (reemplaza placeholder)
// ════════════════════════════════════════════════════════════
function openPinLogin(){
  if(!_isPinEnabled()){
    try{ toast('El PIN no est\u00e1 configurado en este dispositivo.'); }catch(e){}
    return;
  }
  showPinModal();
}

// FIX 1 — Validación real de sesión al entrar con PIN
async function _enterWithPinSuccess(){
  _resetPinAttempts();
  closePinModal();
  var lastUser = _getLastAuthUser();
  if(!lastUser){
    showAuthScreen(); _showScreen('login');
    try{ toast('No se encontr\u00f3 un usuario v\u00e1lido.'); }catch(e){}
    return;
  }
  _currentUser = lastUser;
  hideAuthScreen();
  if(typeof initApp === 'function') initApp();
  if(typeof _injectLogoutBtn === 'function') _injectLogoutBtn(_currentUser);
  if(typeof safeSync === 'function'){
    safeSync(_currentUser.id).catch(function(e){ console.warn('sync error:',e); });
  }
}

function showPinModal(){
  if(_isPinLocked()){
    var secs = _getPinLockSecondsLeft();
    try{ toast('PIN bloqueado. Espera '+secs+'s'); }catch(e){}
    return;
  }

  var old = document.getElementById('pin-modal-overlay');
  if(old) old.remove();

  var pin = [];
  var overlay = document.createElement('div');
  overlay.id = 'pin-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;animation:bsFadeIn .2s ease;pointer-events:auto';

  function draw(){
    var attempts = _getPinAttempts();
    var attemptsLeft = 5 - attempts;
    var attemptsHtml = attempts > 0
      ? '<div style="font-size:12px;color:#F59E0B;margin-top:6px">'+attemptsLeft+' intento'+(attemptsLeft===1?'':'s')+' restante'+(attemptsLeft===1?'':'s')+'</div>'
      : '';
    overlay.innerHTML =
      '<div id="pin-sheet" style="width:100%;background:var(--surface,#fff);border-radius:24px 24px 0 0;padding:0 0 max(env(safe-area-inset-bottom),24px);animation:bsSlideUp .28s cubic-bezier(.32,1,.42,1)">'
      +'<div style="display:flex;justify-content:flex-end;padding:14px 16px 0">'
        +'<button onclick="closePinModal()" style="width:32px;height:32px;border-radius:50%;background:var(--surface2,#F1F5F9);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2,#64748B)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
      +'</div>'
      +'<div style="padding:8px 28px 24px;text-align:center">'
        +'<div style="display:flex;align-items:center;justify-content:center;margin-bottom:10px">'
          +'<img src="/icon-192.png" style="width:40px;height:40px;border-radius:8px" alt="FinanzIA">'
        +'</div>'
        +'<div style="font-size:16px;font-weight:700;color:var(--text,#0F172A);margin-bottom:4px">Ingresa tu PIN</div>'
        +attemptsHtml
        +'<div id="pin-dots" style="display:flex;justify-content:center;gap:16px;margin:16px 0 8px"></div>'
        +'<div id="pin-err" style="min-height:18px;font-size:13px;color:#DC2626;margin-bottom:14px;text-align:center"></div>'
        +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">'+_buildKeypad('_pinKey')+'</div>'
        +'<button onclick="closePinModal();_showPinRecovery()" style="margin-top:16px;background:none;border:none;color:var(--primary,#00D4AA);font-size:14px;cursor:pointer;font-family:var(--font,inherit);text-decoration:underline">¿Olvidaste tu PIN?</button>'
      +'</div>'
      +'</div>';
    _renderPinDots(pin, 'pin-dots');
    window._pinState = {pin:pin, draw:draw};
  }

  draw();
  document.body.appendChild(overlay);
  setTimeout(function(){_renderPinDots([],'pin-dots');},0);

  window._pinKey = async function(k){
    if(_isPinLocked()){
      var secs = _getPinLockSecondsLeft();
      try{ toast('PIN bloqueado. Espera '+secs+'s'); }catch(e){}
      return;
    }
    var st = window._pinState;
    var p = st.pin;
    if(k === '⌫'){ p.pop(); }
    else if(p.length < 4){ p.push(k); try{ if(navigator.vibrate) navigator.vibrate(10); }catch(e){} }
    st.pin = p;
    _renderPinDots(p, 'pin-dots');

    if(p.length === 4){
      // Validar
      var ok = await validateUserPin(p.join(''));
      if(ok){
        await _enterWithPinSuccess();
      }else{
        // PIN incorrecto
        try{ if(navigator.vibrate) navigator.vibrate([60,40,60]); }catch(e){}
        var attempts = _getPinAttempts() + 1;
        localStorage.setItem('_pinAttempts', attempts);
        if(attempts >= 5){
          localStorage.setItem('_pinLockUntil', Date.now() + 30000);
          localStorage.removeItem('_pinAttempts');
          closePinModal();
          try{ toast('Demasiados intentos. Espera 30 segundos.'); }catch(e){}
        }else{
          var attemptsLeft = 5 - attempts;
          var errEl = document.getElementById('pin-err');
          if(errEl) errEl.textContent = 'PIN incorrecto. Te quedan ' + attemptsLeft + ' intento' + (attemptsLeft === 1 ? '' : 's') + '.';
          st.pin = [];
          _renderPinDots([], 'pin-dots');
          // Shake animation en dots
          var dotsEl = document.getElementById('pin-dots');
          if(dotsEl){
            dotsEl.style.animation = 'none';
            dotsEl.style.transition = 'transform .1s';
            dotsEl.style.transform = 'translateX(8px)';
            setTimeout(function(){dotsEl.style.transform='translateX(-8px)';},100);
            setTimeout(function(){dotsEl.style.transform='translateX(0)';},200);
          }
        }
      }
    }
  };
}


// ════════════════════════════════════════════════════════════
// RECUPERACIÓN DE PIN vía OTP por correo
// ════════════════════════════════════════════════════════════
async function _showPinRecovery(){
  var email=(_currentUser&&_currentUser.email)||localStorage.getItem('_lastAuthUserEmail')||'';
  if(!email){ try{toast('No se encontró el correo asociado.');}catch(e){} return; }
  var ov=document.getElementById('pin-recovery-overlay');
  if(ov)ov.remove();
  ov=document.createElement('div');
  ov.id='pin-recovery-overlay';
  ov.style.cssText='position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.55);display:flex;align-items:flex-end;animation:bsFadeIn .2s ease;pointer-events:auto';
  var masked=email.replace(/(.{2})[^@]+(@.+)/,function(m,a,b){return a+'*****'+b;});
  var inStyle='width:40px;height:50px;border-radius:12px;border:1.5px solid #E2E8F0;background:#F8FAFC;text-align:center;font-size:22px;font-weight:700;color:#0F172A;font-family:inherit;outline:none;transition:.15s';
  ov.innerHTML=''
    +'<div id="pr-sheet" style="width:100%;background:#fff;border-radius:24px 24px 0 0;animation:bsSlideUp .28s cubic-bezier(.32,1,.42,1)">'
      // Micro gradiente teal sin línea divisoria
      +'<div style="background:linear-gradient(180deg,rgba(0,212,170,.08) 0%,rgba(255,255,255,0) 100%);border-radius:24px 24px 0 0;padding:10px 20px 0">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'
          +'<div style="width:36px;height:4px;border-radius:2px;background:#E2E8F0;margin:0 auto"></div>'
          +'<button onclick="_closePinRecovery()" style="width:30px;height:30px;border-radius:50%;background:rgba(241,245,249,.9);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748B"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
        +'</div>'
        +'<div style="display:flex;align-items:center;gap:12px;padding-bottom:14px">'
          +'<div id="pr-icon" style="width:44px;height:44px;border-radius:50%;background:rgba(0,212,170,.1);border:1.5px solid rgba(0,212,170,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0">'
            +'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1" fill="#00D4AA"/></svg>'
          +'</div>'
          +'<div>'
            +'<div style="font-size:16px;font-weight:900;color:#0F172A;letter-spacing:-.3px">Recuperar PIN</div>'
            +'<div style="font-size:12px;color:#64748B;margin-top:1px">Código enviado a <strong style="color:#0F172A">'+masked+'</strong></div>'
          +'</div>'
        +'</div>'
      +'</div>'
      // Cuerpo blanco
      +'<div style="padding:0 24px max(env(safe-area-inset-bottom),28px);text-align:center">'
        +'<div style="display:flex;gap:7px;justify-content:center;margin-bottom:8px">'
          +'<input id="pr-0" maxlength="1" inputmode="numeric" style="'+inStyle+'">'
          +'<input id="pr-1" maxlength="1" inputmode="numeric" style="'+inStyle+'">'
          +'<input id="pr-2" maxlength="1" inputmode="numeric" style="'+inStyle+'">'
          +'<input id="pr-3" maxlength="1" inputmode="numeric" style="'+inStyle+'">'
          +'<input id="pr-4" maxlength="1" inputmode="numeric" style="'+inStyle+'">'
          +'<input id="pr-5" maxlength="1" inputmode="numeric" style="'+inStyle+'">'
        +'</div>'
        +'<div style="margin:10px 0 8px">'
          +'<div style="background:#F1F5F9;border-radius:4px;height:4px;overflow:hidden"><div id="pr-bar" style="width:100%;height:100%;background:linear-gradient(90deg,#00D4AA,#F59E0B);border-radius:4px;transition:width 1s linear"></div></div>'
          +'<div style="display:flex;justify-content:space-between;margin-top:4px"><span style="font-size:11px;color:#94A3B8">Código válido por</span><span id="pr-timer" style="font-size:11px;font-weight:700;color:#F59E0B">15:00</span></div>'
        +'</div>'
        +'<div id="pr-err" style="min-height:16px;font-size:12px;color:#EF4444;margin-bottom:8px"></div>'
        +'<div style="display:flex;align-items:center;justify-content:center;gap:6px">'
          +'<span style="font-size:12px;color:#94A3B8">¿No llegó?</span>'
          +'<button id="pr-resend-btn" onclick="_resendPinRecoveryOtp()" disabled style="background:none;border:none;color:#CBD5E1;font-family:inherit;font-size:12px;font-weight:700;cursor:not-allowed">Reenviar</button>'
        +'</div>'
      +'</div>'
    +'</div>';
  document.body.appendChild(ov);
  window._pinRecoveryEmail=email;
  window._prTotalSecs=900;
  setTimeout(function(){var f=document.getElementById('pr-0');if(f)f.focus();},200);
  _setupOtpInputs();
  _startPinRecoveryTimer(900);
  _sendPinRecoveryOtpSilent(email);
}
function _closePinRecovery(){
  if(window._prTimerInterval){clearInterval(window._prTimerInterval);window._prTimerInterval=null;}
  var ov=document.getElementById('pin-recovery-overlay');
  if(!ov)return;
  var sh=document.getElementById('pr-sheet');
  if(sh)sh.style.animation='bsSlideDown .22s ease forwards';
  ov.style.opacity='0';ov.style.transition='opacity .22s';
  setTimeout(function(){if(ov.parentNode)ov.remove();},240);
}
async function _sendPinRecoveryOtpSilent(email){
  try{
    var res=await _supabase.auth.signInWithOtp({email:email,options:{shouldCreateUser:false}});
    if(res.error){ try{toast('Error al enviar el código. Cierra y vuelve a intentarlo.');}catch(e){} }
  }catch(e){ try{toast('Error: '+e.message);}catch(e2){} }
}
async function _resendPinRecoveryOtp(){
  var email=window._pinRecoveryEmail;
  if(!email)return;
  var rbtn=document.getElementById('pr-resend-btn');
  if(rbtn){rbtn.disabled=true;rbtn.textContent='Enviando...';}
  try{
    var res=await _supabase.auth.signInWithOtp({email:email,options:{shouldCreateUser:false}});
    if(res.error){
      if(rbtn){rbtn.disabled=false;rbtn.textContent='Enviar nuevo código';}
      try{toast('Error al reenviar. Inténtalo de nuevo.');}catch(e){}
      return;
    }
    if(rbtn){rbtn.disabled=true;rbtn.style.opacity='.4';rbtn.style.cursor='not-allowed';}
    for(var i=0;i<6;i++){var inp=document.getElementById('pr-'+i);if(inp){inp.value='';inp.style.opacity='1';inp.disabled=false;}}
    var err=document.getElementById('pr-err');if(err)err.textContent='';
    var icon=document.getElementById('pr-icon');
    if(icon){icon.style.background='rgba(0,212,170,.12)';icon.querySelector('svg').style.stroke='#00D4AA';}
    _startPinRecoveryTimer(900);
    setTimeout(function(){var f=document.getElementById('pr-0');if(f)f.focus();},100);
    try{toast('Código reenviado ✓');}catch(e){}
  }catch(e){
    if(rbtn){rbtn.disabled=false;rbtn.textContent='Enviar nuevo código';}
  }
}
function _startPinRecoveryTimer(secs){
  if(window._prTimerInterval)clearInterval(window._prTimerInterval);
  var remaining=secs;
  function tick(){
    var m=Math.floor(remaining/60);
    var s=remaining%60;
    var el=document.getElementById('pr-timer');
    if(el){
      if(remaining<=0){
        el.textContent='Código expirado';
        el.style.color='#EF4444';
        clearInterval(window._prTimerInterval);
        for(var i=0;i<6;i++){var inp=document.getElementById('pr-'+i);if(inp){inp.disabled=true;inp.style.opacity='.4';}}
        var rbtn=document.getElementById('pr-resend-btn');
        if(rbtn){rbtn.disabled=false;rbtn.style.opacity='1';rbtn.style.cursor='pointer';}
        var icon=document.getElementById('pr-icon');
        if(icon){icon.style.background='rgba(239,68,68,.1)';var sv=icon.querySelector('svg');if(sv)sv.style.stroke='#EF4444';}
        return;
      }
      el.textContent=m+':'+(s<10?'0':'')+s;
      el.style.color=remaining<=60?'#EF4444':'#F59E0B';
      // Update progress bar
      var total=window._prTotalSecs||900;
      var bar=document.getElementById('pr-bar');
      if(bar)bar.style.width=Math.max(0,Math.round(remaining/total*100))+'%';
    }else{
      clearInterval(window._prTimerInterval);
    }
    remaining--;
  }
  tick();
  window._prTimerInterval=setInterval(tick,1000);
}
function _setupOtpInputs(){
  for(var i=0;i<6;i++){
    (function(idx){
      var inp=document.getElementById('pr-'+idx);
      if(!inp)return;
      inp.addEventListener('input',function(e){
        var v=e.target.value.replace(/[^0-9]/g,'');
        e.target.value=v;
        // Highlight active input
        for(var k=0;k<6;k++){var el=document.getElementById('pr-'+k);if(el)el.style.borderColor='';}
        if(v&&idx<5){var next=document.getElementById('pr-'+(idx+1));if(next){next.focus();next.style.borderColor='#00D4AA';}}
        var code='';for(var j=0;j<6;j++){var el=document.getElementById('pr-'+j);code+=el?el.value:'';}
        if(code.length===6)_verifyPinRecoveryOtp();
      });
      inp.addEventListener('focus',function(){this.style.borderColor='#00D4AA';this.style.background='#fff';});
      inp.addEventListener('blur',function(){if(!this.value)this.style.borderColor='';});
      inp.addEventListener('keydown',function(e){
        if(e.key==='Backspace'&&!e.target.value&&idx>0){var prev=document.getElementById('pr-'+(idx-1));if(prev){prev.focus();prev.value='';}}
      });
    })(i);
  }
}
async function _verifyPinRecoveryOtp(){
  var email=window._pinRecoveryEmail;
  var code='';
  for(var i=0;i<6;i++){var el=document.getElementById('pr-'+i);code+=(el?el.value:'');}
  if(code.length<6){
    var err=document.getElementById('pr-err');
    if(err)err.textContent='Ingresa los 6 dígitos del código';
    return;
  }
  try{
    var res=await _supabase.auth.verifyOtp({email:email,token:code,type:'email'});
    if(res.error){
      var err=document.getElementById('pr-err');
      if(err)err.textContent='Código incorrecto o expirado';
      for(var i=0;i<6;i++){var b=document.getElementById('pr-'+i);if(b)b.value='';}
      setTimeout(function(){var f=document.getElementById('pr-0');if(f)f.focus();},50);
      return;
    }
    if(res.data&&res.data.user){
      _currentUser=res.data.user;
      _persistLastUserId(res.data.user.id,res.data.user.email);
    }
    _closePinRecovery();
    window._pinFromProfile=false;
    window._pinFromRecovery=true;
    showAuthScreen();
    _initSetPinScreen();
    _showScreen('set-pin');
  }catch(e){
    var err=document.getElementById('pr-err');
    if(err)err.textContent='Error: '+e.message;
  }
}

function closePinModal(){
  var el = document.getElementById('pin-modal-overlay');
  if(!el) return;
  var sheet = document.getElementById('pin-sheet');
  if(sheet) sheet.style.animation = 'bsSlideDown .22s ease forwards';
  el.style.opacity = '0'; el.style.transition = 'opacity .22s';
  setTimeout(function(){ if(el.parentNode) el.remove(); window._pinState = null; }, 240);
}

function _getDisplayName(fullName){
  if(!fullName) return 'Usuario';
  return fullName.trim().split(/\s+/).slice(0,2).join(' ');
}

// Prioridades: S.profile.name → localStorage → user_metadata.full_name → email
function getFirstName(user){
  try{
    if(typeof S!=='undefined'&&S&&S.profile&&S.profile.name&&S.profile.name.trim())
      return S.profile.name.trim().split(/\s+/)[0];
  }catch(e){}
  try{
    var raw=localStorage.getItem('finanziaState3');
    if(raw){var st=JSON.parse(raw);if(st&&st.profile&&st.profile.name&&st.profile.name.trim())
      return st.profile.name.trim().split(/\s+/)[0];}
  }catch(e){}
  try{
    var fn=user&&user.user_metadata&&user.user_metadata.full_name;
    if(fn&&fn.trim()) return fn.trim().split(/\s+/)[0];
  }catch(e){}
  try{ if(user&&user.email) return user.email.split('@')[0]; }catch(e){}
  return 'Usuario';
}

// ════════════════════════════════════════════════════════════
// INGRESO SOLO CON CONTRASEÑA (desde welcome)
// ════════════════════════════════════════════════════════════
function goToPasswordLogin(){
  var u = _getLastAuthUser();
  if(!u){ _setError('li',''); _showScreen('login'); return; }
  _currentUser = u; // asegurar que handlePasswordOnlyLogin tenga el email
  var po=document.getElementById('po-pass'); if(po)po.value='';
  _setError('po',''); _showScreen('password-only');
}

async function handlePasswordOnlyLogin(){
  var pass=(document.getElementById('po-pass').value||'').trim();
  if(!pass){_setError('po','Ingresa tu contraseña');return;}
  _setError('po',''); _setBusy('po-btn',true,'Ingresar');
  var user=_currentUser;
  if(!user){try{user=await getCurrentUser();}catch(e){}}
  if(!user||!user.email){
    _setError('po','Sesión no encontrada. Inicia sesión con tu correo.');
    _setBusy('po-btn',false,'Ingresar'); _showScreen('login'); return;
  }
  var res=await signIn(user.email,pass);
  _setBusy('po-btn',false,'Ingresar');
  if(!res.ok){_setError('po',res.msg);return;}
  await _afterLogin(res.user);
}

// ════════════════════════════════════════════════════════════
// ONBOARDING — Flujo post-registro (auth-set-pin + auth-bio-setup)
// ════════════════════════════════════════════════════════════

// Navegar a crear PIN tras confirmar correo
async function goToSetPin(){
  _emailConfirmPending = false;
  sessionStorage.removeItem('emailConfirmPending');
  // Asegurar _currentUser disponible para saveUserPin
  if(!_currentUser){
    try{
      var rv = await _supabase.auth.getUser();
      if(rv.data && rv.data.user) _currentUser = rv.data.user;
    }catch(e){ console.warn('goToSetPin getUser error:', e); }
  }
  _initSetPinScreen();
  _showScreen('set-pin');
}

// Inicializa la lógica interactiva de la pantalla auth-set-pin
function _initSetPinScreen(){
  var st = {step:1, first:[], current:[]};

  function refreshPinScreen(){
    var isRecov=window._pinFromRecovery||false;
    var title = st.step === 1
      ? (isRecov ? 'Elige tu nuevo PIN \uD83D\uDD10' : 'Elige tu PIN secreto \uD83D\uDD10')
      : 'Confirma tu PIN';
    var sub   = st.step === 1
      ? 'Nadie m\u00e1s lo sabr\u00e1'
      : 'Repite los 4 d\u00edgitos para confirmar';
    var titleEl  = document.getElementById('set-pin-screen-title');
    var subEl    = document.getElementById('set-pin-screen-subtitle');
    var errEl    = document.getElementById('set-pin-screen-err');
    var keypadEl = document.getElementById('set-pin-screen-keypad');
    if(titleEl)  titleEl.textContent = title;
    if(subEl)    subEl.textContent   = sub;
    if(errEl)    errEl.textContent   = '';
    if(keypadEl) keypadEl.innerHTML  = _buildKeypad('_setPinScreenKey');
    _renderPinDots(st.current, 'set-pin-screen-dots');
  }

  refreshPinScreen();
  window._setPinScreenState   = st;
  window._setPinScreenRefresh = refreshPinScreen;

  window._setPinScreenKey = async function(k){
    var s = window._setPinScreenState;
    if(k === '\u232b'){
      s.current.pop();
    }else if(s.current.length < 4){
      s.current.push(k);
      try{ if(navigator.vibrate) navigator.vibrate(10); }catch(e){}
    }
    _renderPinDots(s.current, 'set-pin-screen-dots');

    if(s.current.length === 4){
      if(s.step === 1){
        s.first   = s.current.slice();
        s.step    = 2;
        s.current = [];
        setTimeout(window._setPinScreenRefresh, 150);
      }else{
        if(s.current.join('') === s.first.join('')){
          await saveUserPin(s.current.join(''));
          if(window._pinFromProfile){
            window._pinFromProfile=false;
            hideAuthScreen();
            if(typeof renderPage==='function')renderPage('mi-perfil');
          }else if(window._pinFromRecovery){
            window._pinFromRecovery=false;
            openPinLogin();
          }else{
            try{ toast('¡PIN creado! Ya puedes entrar rápido ✓'); }catch(e){}
            _initBioSetupScreen();
            _showScreen('bio-setup');
          }
        }else{
          var errEl = document.getElementById('set-pin-screen-err');
          if(errEl) errEl.textContent = 'Los PIN no coinciden. Int\u00e9ntalo de nuevo.';
          s.step    = 1;
          s.first   = [];
          s.current = [];
          setTimeout(window._setPinScreenRefresh, 300);
        }
      }
    }
  };
}

// Inicializa el estado de la pantalla auth-bio-setup
function _initBioSetupScreen(){
  var infoEl = document.getElementById('bio-setup-info');
  var btnEl  = document.getElementById('bio-setup-activate-btn');
  if(!_isBioAvailable()){
    if(infoEl) infoEl.textContent = 'La biometría no está disponible en este dispositivo.';
    if(btnEl)  btnEl.style.display = 'none';
  }else if(_isBioEnabled()){
    if(infoEl) infoEl.textContent = 'La huella ya está activada en este dispositivo.';
    if(btnEl)  btnEl.style.display = 'none';
  }else{
    if(infoEl) infoEl.textContent = 'Activa tu huella y olvídate de contraseñas para siempre';
    if(btnEl){ btnEl.style.display = ''; btnEl.disabled = false; btnEl.textContent = 'Activar huella'; }
  }
}

// Completa el onboarding: entra a la app y navega a Configuración
function _completeOnboarding(){
  // Marcar onboarding completado para este usuario (no vuelve a ejecutarse)
  if(_currentUser && _currentUser.id) _setOnboardingCompleted(_currentUser.id);
  hideAuthScreen();
  if(typeof initApp === 'function') initApp();
  if(_currentUser && typeof _injectLogoutBtn === 'function') _injectLogoutBtn(_currentUser);
  var done = function(){
    S.currentPage = 'configuracion';
    if(typeof saveState === 'function') saveState();
    if(typeof renderPage === 'function') renderPage('configuracion');
  };
  if(typeof safeSync === 'function' && _currentUser){
    safeSync(_currentUser.id).then(done).catch(done);
  }else{
    done();
  }
}

// Omitir creación de PIN → pasar igualmente por pantalla de bio-setup
function skipPinSetup(){
  _initBioSetupScreen();
  _showScreen('bio-setup');
}

// Activar biometría desde la pantalla bio-setup y completar onboarding
async function _bioSetupActivate(){
  var btn = document.getElementById('bio-setup-activate-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Activando...'; }
  if(!_currentUser){
    try{
      var rv = await _supabase.auth.getUser();
      if(rv.data && rv.data.user) _currentUser = rv.data.user;
    }catch(e){}
  }
  if(_currentUser){
    var ok = await bioRegister(_currentUser.id, _currentUser.email);
    if(ok){ try{ toast('Huella activada \u2713'); }catch(e){} }
  }
  _completeOnboarding();
}

// Omitir biometría y completar onboarding
function _bioSetupSkip(){
  _completeOnboarding();
}

// ════════════════════════════════════════════════════════════
// VERIFICACIÓN DE CORREO
// ════════════════════════════════════════════════════════════

// Polling de respaldo — se activa si onAuthStateChange no dispara
function enableContinueIfVerified(){
  var btn=document.getElementById('verify-continue-btn');
  if(!btn||!btn.disabled) return;
  var interval=setInterval(function(){
    _supabase.auth.getUser().then(function(rv){
      if(rv.data&&rv.data.user&&rv.data.user.email_confirmed_at){
        clearInterval(interval);
        btn.disabled=false;
        try{ toast('\u00a1Correo confirmado! Ya puedes continuar.'); }catch(e){}
      }
    }).catch(function(){ clearInterval(interval); });
  },2000);
}

async function handleResendVerification(){
  var email=localStorage.getItem('pendingEmail');
  if(!email){try{toast('No encontramos el correo pendiente. Intenta registrarte de nuevo.');}catch(e){}return;}
  try{
    var res=await _supabase.auth.resend({type:'signup',email:email});
    if(res.error){try{toast('Error al reenviar. Intenta de nuevo.');}catch(e){}
    }else{try{toast('Correo reenviado \u2713 Revisa tu bandeja.');}catch(e){}}
  }catch(e){try{toast('Error al reenviar.');}catch(e2){}}
}

// Detecta el hash del enlace de confirmación de Supabase.
// El SDK procesa el token automáticamente al crear el cliente;
// nosotros solo detectamos, activamos el flag y mostramos la pantalla.
// El botón se habilita vía onAuthStateChange(SIGNED_IN) en initSupabase().
function handleEmailConfirmation(){
  var hash=window.location.hash||'';
  if(!hash.includes('access_token')&&!hash.includes('type=signup')) return;
  _emailConfirmPending=true;
  sessionStorage.setItem('emailConfirmPending','true');
  showAuthScreen();
  _showScreen('verify');
  // Limpiar hash después de 500ms — tiempo suficiente para que el SDK lo procese
  setTimeout(function(){
    try{ window.history.replaceState({},document.title,window.location.pathname); }catch(e){}
  },500);
}

// ════════════════════════════════════════════════════════════
// RESTABLECER CONTRASEÑA
// ════════════════════════════════════════════════════════════
async function handleResetPassword(){
  var pass=(document.getElementById('rp-pass').value||'').trim();
  var confirm=(document.getElementById('rp-pass-confirm').value||'').trim();
  if(!pass||!confirm){_setError('rp','Completa ambos campos');return;}
  if(pass!==confirm){_setError('rp','Las contraseñas no coinciden');return;}
  if(pass.length<8){_setError('rp','Mínimo 8 caracteres');return;}
  if(!/[A-Z]/.test(pass)){_setError('rp','Debe incluir al menos una mayúscula');return;}
  if(!/[0-9]/.test(pass)){_setError('rp','Debe incluir al menos un número');return;}
  if(!/[^A-Za-z0-9]/.test(pass)){_setError('rp','Debe incluir al menos un carácter especial (!@#$...)');return;}
  _setError('rp','');
  _setBusy('rp-btn',true,'Actualizando...');
  try{
    var rv=await _supabase.auth.updateUser({password:pass});
    _setBusy('rp-btn',false,'Guardar nueva contraseña');
    if(rv.error){_setError('rp',rv.error.message||'No se pudo actualizar la contraseña');return;}
    // Limpiar hash de la URL para que no quede el token expuesto
    try{window.history.replaceState({},document.title,window.location.pathname);}catch(e){}
    // Cerrar sesión activa de recuperación y pedir login limpio
    try{await _supabase.auth.signOut();}catch(e){}
    _currentUser=null;
    // Mostrar pantalla de éxito breve antes de ir al login
    var panel=document.getElementById('auth-reset-password');
    if(panel){
      var body=panel.querySelector('.auth-body');
      if(body)body.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;gap:16px">'
        +'<div style="font-size:56px">🔐</div>'
        +'<div style="font-size:20px;font-weight:800;color:var(--text)">¡Contraseña actualizada!</div>'
        +'<div style="font-size:14px;color:var(--text2);line-height:1.6">Tu contraseña fue cambiada exitosamente.<br>Inicia sesión con tu nueva contraseña.</div>'
        +'</div>';
    }
    setTimeout(function(){
      _showScreen('login');
      // Pre-llenar email si lo tenemos
      var emailEl=document.getElementById('li-email');
      if(emailEl&&_currentUser&&_currentUser.email)emailEl.value=_currentUser.email;
    },2200);
  }catch(e){
    _setBusy('rp-btn',false,'Guardar nueva contraseña');
    _setError('rp','Algo salió mal. Intenta de nuevo.');
  }
}

// ════════════════════════════════════════════════════════════
// PANTALLA BIENVENIDA — una sola línea
// ════════════════════════════════════════════════════════════
function _showWelcomeScreen(user){
  var firstName = 'Usuario';
  if(user && user.id){
    try{ firstName = getFirstName(user); }catch(e){}
  }else{
    // Sin sesión activa: intentar recuperar nombre desde caché local (solo visual)
    try{
      var raw = localStorage.getItem('finanziaState3');
      if(raw){
        var st = JSON.parse(raw);
        if(st && st.profile && st.profile.name) firstName = st.profile.name.split(' ')[0];
      }
    }catch(e){}
  }
  var greetEl = document.getElementById('welcome-greeting');
  if(greetEl){
    var _wh=new Date().getHours();
    var _wsaludo=_wh<12?'Buenos d\u00edas':_wh<19?'Buenas tardes':'Buenas noches';
    greetEl.textContent=_wsaludo+', '+firstName+' \uD83D\uDC4B';
  }
  _showScreen('welcome');
  var fpIcon = document.getElementById('welcome-fp-icon');
  if(fpIcon && typeof _fpSvgSm !== 'undefined') fpIcon.innerHTML = _fpSvgSm;
}

async function _startBioFromWelcome(){
  try{
    var u = _getLastAuthUser();
    if(!u){ showAuthScreen(); _showScreen('login'); return; }
    _currentUser = u;
    if(!_isBioEnabled()){
      try{ toast('La autenticaci\u00f3n con huella no est\u00e1 activada en este dispositivo.'); }catch(e){}
      return;
    }
    var result = await bioAuthenticate();
    if(result === true){
      // Bio exitosa → validar con servidor antes de dar acceso
      if(_supabase){
        try{
          // Primero intentar refrescar la sesión (maneja JWT expirado)
          var refreshed=await _supabase.auth.refreshSession();
          if(refreshed.data&&refreshed.data.user){
            // Sesión refrescada correctamente
            _currentUser=refreshed.data.user;
          }else{
            // refreshSession falló → verificar si el usuario realmente fue eliminado
            var rv=await _supabase.auth.getUser();
            if(rv.error&&rv.error.message&&rv.error.message.toLowerCase().indexOf('user')!==-1&&rv.error.message.toLowerCase().indexOf('not')!==-1){
              // Usuario eliminado de la BD → limpiar y mostrar login
              _currentUser=null;
              _clearAllLocalUserData();
              showAuthScreen();
              _showScreen('login');
              try{toast('Tu cuenta ya no existe. Por favor regístrate de nuevo.');}catch(e){}
              return;
            }
            // Otro error (red, etc.) → acceso offline con datos locales
          }
        }catch(netErr){
          // Sin conexión → permitir acceso offline con datos locales
          console.warn('Bio server check fallido (posiblemente offline):',netErr);
        }
      }
      hideAuthScreen();
      if(typeof initApp === 'function') initApp();
      if(typeof _injectLogoutBtn === 'function') _injectLogoutBtn(_currentUser);
      if(typeof safeSync === 'function'){
        safeSync(_currentUser.id).catch(function(e){ console.warn('sync error:',e); });
      }
    }else if(result === 'cancelled'){
      try{ toast('Autenticaci\u00f3n cancelada.'); }catch(e){}
    }else{
      try{ toast('No se pudo verificar la huella. Int\u00e9ntalo nuevamente.'); }catch(e){}
    }
  }catch(err){
    console.error('Biometric auth error:', err);
    try{ toast('Error al intentar la autenticaci\u00f3n biom\u00e9trica.'); }catch(e){}
  }
}

// ════════════════════════════════════════════════════════════
// ARRANQUE
// ════════════════════════════════════════════════════════════
async function initAuth(){
  if(!localStorage.getItem('_finanzia_onboarded')){
    _showOnboarding();
    return;
  }
  if(!initSupabase()){
    hideAuthScreen(); if(typeof initApp==='function')initApp(); return;
  }
  // Migrar claves bio globales a claves por usuario (una sola vez)
  _migrateBioToUserKeys();
  // Detectar retorno desde enlace de confirmación ANTES de cualquier otra lógica.
  // El listener onAuthStateChange ya está registrado dentro de initSupabase().
  handleEmailConfirmation();
  if(_emailConfirmPending){
    // Activar polling de respaldo por si onAuthStateChange ya disparó
    // antes de que handleEmailConfirmation mostrara el botón
    enableContinueIfVerified();
    return;
  }
  var user=await getCurrentUser();
  var _serverRejected=false; // true solo si el servidor rechazó el token (usuario eliminado/inválido)
  if(user){
    try{
      var _uv = await _supabase.auth.getUser();
      if(_uv.error || !_uv.data || !_uv.data.user){
        user = null;
        _currentUser = null;
        _serverRejected = true; // el servidor rechazó explícitamente el token
      }
    }catch(e){
      user = null;
      _currentUser = null;
      _serverRejected = true;
    }
  }
  if(user){
    _currentUser=user;
    // Si el usuario que llega es diferente al último → limpiar datos del anterior
    var _storedUid = localStorage.getItem('_lastAuthUserId');
    if(_storedUid && _storedUid !== user.id){
      _clearAllLocalUserData();
      // Reinicializar estado en memoria para que no queden datos del usuario anterior
      try{ if(typeof S !== 'undefined') S = {}; }catch(e){}
    }
    _persistLastUserId(user.id, user.email);
    if(_hasQuickAccess(user.id)){
      showAuthScreen();
      _showWelcomeScreen(user);
    }else{
      // Sin PIN ni bio → ir directo al app (ya autenticado)
      hideAuthScreen();
      if(typeof initApp==='function') initApp();
      _injectLogoutBtn(user);
      if(typeof safeSync==='function'){
        safeSync(user.id).catch(function(e){ console.warn('sync error:',e); });
      }
    }
  }else if(_serverRejected){
    // El servidor rechazó el token → usuario eliminado o token expirado → limpiar todo
    _currentUser = null;
    _clearAllLocalUserData();
    showAuthScreen();
    _showScreen('login');
  }else{
    // No hay sesión activa
    _currentUser = null;
    var lastUid   = localStorage.getItem('_lastAuthUserId');
    var lastEmail = localStorage.getItem('_lastAuthUserEmail') || '';
    localStorage.removeItem('_signedOutNormally');
    if(lastUid){
      _currentUser = {id: lastUid, email: lastEmail};
      showAuthScreen();
      _showWelcomeScreen(null);
      return;
    }
    showAuthScreen();
    _showScreen('login');
  }
}

// ════════════════════════════════════════════════════════════
// ONBOARDING — Se muestra una sola vez al instalar
// ════════════════════════════════════════════════════════════
function _showOnboarding(){
  var slides=[
    {
      emoji:'💚',
      title:'Tus finanzas,<br>por fin en orden',
      sub:'Registra, analiza y controla tu dinero desde un solo lugar. <strong>Sin complicaciones, sin jerga bancaria.</strong> Solo lo que necesitas saber.'
    },
    {
      emoji:'🎯',
      title:'Metas que s\u00ed<br>se cumplen',
      sub:'Crea presupuestos, define metas de ahorro y programa tus pagos. <strong>Tu dinero, con prop\u00f3sito real.</strong>'
    },
    {
      emoji:'\uD83E\uDD1D',
      title:'Emiliano,<br>siempre contigo',
      sub:'Tu Wealth Manager personal con IA. <strong>Analiza tus finanzas en tiempo real</strong> y te ayuda a tomar mejores decisiones con tu dinero.'
    }
  ];
  var cur=0;
  var goingBack=false;
  var ov=document.createElement('div');
  ov.id='onboarding-screen';
  ov.style.cssText='position:fixed;inset:0;z-index:9999;overflow:hidden;font-family:var(--font);background:#fff';
  function render(back){
    var s=slides[cur];
    var isLast=cur===slides.length-1;
    var dots=slides.map(function(_,i){
      var isPast=i<cur;
      var isActive=i===cur;
      return '<div data-dot="'+i+'" style="width:'+(isActive?'22':'8')+'px;height:8px;border-radius:4px;'
        +'background:'+(isActive?'#00D4AA':isPast?'rgba(0,212,170,.5)':'#CBD5E1')
        +';transition:.3s cubic-bezier(.4,0,.2,1);cursor:'+(isPast?'pointer':'default')+'"></div>';
    }).join('');
    ov.innerHTML=
      // Fondo: gradiente teal sin divisor
      '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,212,170,.22) 0%,rgba(0,212,170,.14) 25%,rgba(0,212,170,.06) 50%,rgba(0,212,170,0) 72%);pointer-events:none;z-index:0"></div>'
      +'<div style="position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(0,212,170,.18) 0%,transparent 70%);pointer-events:none;z-index:0"></div>'
      // Contenido
      +'<div style="position:relative;z-index:1;display:flex;flex-direction:column;height:100%;background:transparent;'+(back?'animation:_obBack .35s cubic-bezier(.4,0,.2,1)':'animation:_obIn .35s cubic-bezier(.4,0,.2,1)')+'">'
        // Top: saltar
        +'<div style="display:flex;justify-content:flex-end;padding:20px 20px 0;flex-shrink:0">'
          +(isLast?'<div style="width:50px"></div>':'<button onclick="_finishOnboarding()" style="border:none;background:none;color:#94A3B8;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);padding:6px 0">Saltar</button>')
        +'</div>'
        // Emoji
        +'<div style="padding:20px 24px 0;flex-shrink:0">'
          +'<span style="font-size:72px;line-height:1;display:block;filter:drop-shadow(0 8px 24px rgba(0,212,170,.25))">'+s.emoji+'</span>'
        +'</div>'
        // Texto alineado a la izquierda
        +'<div style="padding:28px 24px 0;flex:1">'
          +'<div style="font-size:28px;font-weight:900;color:#0F172A;letter-spacing:-.7px;line-height:1.1;margin-bottom:12px">'+s.title+'</div>'
          +'<div style="font-size:15px;color:#475569;line-height:1.65;font-weight:500">'+s.sub+'</div>'
        +'</div>'
        // Footer: dots + botón
        +'<div style="padding:0 24px 40px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'
          +'<div id="_ob_dots" style="display:flex;align-items:center;gap:7px;cursor:pointer">'+dots+'</div>'
          +'<button onclick="_onboardingNext()" style="padding:14px 28px;border-radius:50px;background:linear-gradient(135deg,#00D4AA,#7461EF);border:none;color:white;font-size:15px;font-weight:800;cursor:pointer;font-family:var(--font);box-shadow:0 4px 16px rgba(0,212,170,.35);letter-spacing:-.2px">'
            +(isLast?'\u00a1Empecemos \uD83D\uDE80':'Siguiente \u2192')
          +'</button>'
        +'</div>'
      +'</div>';
    // Dots click para volver
    var dotsEl=document.getElementById('_ob_dots');
    if(dotsEl){
      dotsEl.addEventListener('click',function(e){
        var dotEl=e.target.closest('[data-dot]');
        if(!dotEl)return;
        var idx=parseInt(dotEl.getAttribute('data-dot'));
        if(idx<cur){goBack(idx);}
      });
    }
  }
  // Añadir keyframes de animación
  if(!document.getElementById('_ob_style')){
    var st=document.createElement('style');
    st.id='_ob_style';
    st.textContent='@keyframes _obIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}'
      +'@keyframes _obBack{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(st);
  }
  function goBack(idx){
    cur=idx;
    render(true);
    addSwipe();
  }
  window._onboardingNext=function(){
    if(cur<slides.length-1){cur++;render(false);addSwipe();}else{_finishOnboarding();}
  };
  function addSwipe(){
    var startX=0;
    ov.ontouchstart=function(e){startX=e.touches[0].clientX;};
    ov.ontouchend=function(e){
      var diff=startX-e.changedTouches[0].clientX;
      if(Math.abs(diff)>50){
        if(diff>0&&cur<slides.length-1){cur++;render(false);addSwipe();}
        else if(diff<0&&cur>0){cur--;render(true);addSwipe();}
      }
    };
  }
  render(false);
  addSwipe();
  document.body.appendChild(ov);
}
function _finishOnboarding(){
  localStorage.setItem('_finanzia_onboarded','1');
  var el=document.getElementById('onboarding-screen');
  if(el)el.remove();
  initAuth();
}
