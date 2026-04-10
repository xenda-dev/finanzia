// ════════════════════════════════════════════════════════════
// AUTH.JS — Supabase + Biometría WebAuthn
// ════════════════════════════════════════════════════════════

var SUPABASE_URL = 'https://dshwbvqvfbjtlbcqqviz.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaHdidnF2ZmJqdGxiY3Fxdml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTM1OTYsImV4cCI6MjA5MDg4OTU5Nn0.kjie4SHtxJZYkX1rspJK2JNpOWfbd-Xdx3UZfgqydXU';

var _supabase = null;
var _currentUser = null;
var _emailConfirmPending = sessionStorage.getItem('emailConfirmPending') === 'true';

function initSupabase(){
  if(typeof supabase === 'undefined'){ console.error('Supabase CDN no cargó'); return false; }
  _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // CRÍTICO: registrar el listener INMEDIATAMENTE después de crear el cliente.
  // Supabase JS v2 procesa el #access_token al crear el cliente y dispara
  // SIGNED_IN en el mismo tick — si el listener llega tarde, el evento se pierde.
  _supabase.auth.onAuthStateChange(function(event, session){
    if(event === 'SIGNED_OUT'){
      showAuthScreen(); _showScreen('login');
      return;
    }

    // Cuando el usuario regresa del enlace de confirmación,
    // SIGNED_IN se dispara con la sesión ya establecida.
    // Usamos session.user directamente (sin llamar getUser de nuevo).
    if(event === 'SIGNED_IN' && _emailConfirmPending){
      var u = session && session.user;
      var btn = document.getElementById('verify-continue-btn');
      if(u && u.email_confirmed_at && btn){
        btn.disabled = false;
        try{ toast('\u00a1Correo confirmado! Ya puedes continuar.'); }catch(e){}
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

async function signUp(email, password){
  var autoName = generateNameFromEmail(email);
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
  return {ok:true, user:data.user};
}
async function signOut(){
  localStorage.removeItem('_bioEnabled');
  localStorage.removeItem('_bioCredId');
  // PIN se mantiene por dispositivo — no se elimina al cerrar sesión
  try{await _supabase.auth.signOut();}catch(e){console.warn('signOut warning:',e.message);}
  _currentUser = null;
  _showScreen('login');
  showAuthScreen();
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
function _isBioEnabled(){
  return localStorage.getItem('_bioEnabled') === '1' && !!localStorage.getItem('_bioCredId');
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
    localStorage.setItem('_bioCredId', btoa(String.fromCharCode(...arr)));
    localStorage.setItem('_bioEnabled','1');
    return true;
  }catch(e){ console.log('Bio register cancelled:',e.message); return false; }
}

async function bioAuthenticate(){
  if(!_isBioEnabled()) return false;
  try{
    var assertion = await navigator.credentials.get({publicKey:{
      challenge: _randomChallenge(),
      allowCredentials: [{type:'public-key', id:_b64ToBuffer(localStorage.getItem('_bioCredId'))}],
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
    localStorage.removeItem('_bioEnabled');
    localStorage.removeItem('_bioCredId');
    _closeBioSheet();
    showAuthScreen();
    _showScreen('login');
    try{ toast('Usa tu contraseña para continuar'); }catch(e){}
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
    try{ toast('Huella activada ✓'); }catch(e){}
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
  ['login','register','bio','verify','recover','welcome','password-only','reset-password'].forEach(function(id){
    var el=document.getElementById('auth-'+id); if(el)el.style.display='none';
  });
  var t=document.getElementById('auth-'+name);
  if(t) t.style.display=(name==='welcome')?'flex':'block';
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
  if(!email||!pass){_setError('li','Completa todos los campos');return;}
  _setError('li',''); _setBusy('li-btn',true,'Iniciar sesión');
  var res=await signIn(email,pass);
  _setBusy('li-btn',false,'Iniciar sesión');
  if(!res.ok){_setError('li',res.msg);return;}
  await _afterLogin(res.user);
}

async function handleRegister(){
  var email=(document.getElementById('rg-email').value||'').trim();
  var pass=(document.getElementById('rg-pass').value||'').trim();
  if(!email||!pass){_setError('rg','Completa todos los campos');return;}
  if(pass.length<8){_setError('rg','Mínimo 8 caracteres');return;}
  if(!/[A-Z]/.test(pass)){_setError('rg','Debe incluir al menos una mayúscula');return;}
  if(!/[0-9]/.test(pass)){_setError('rg','Debe incluir al menos un número');return;}
  if(!/[^A-Za-z0-9]/.test(pass)){_setError('rg','Debe incluir al menos un carácter especial (!@#$...)');return;}
  var exists=document.getElementById('auth-rg-exists');
  if(exists)exists.style.display='none';
  _setError('rg',''); _setBusy('rg-btn',true,'Crear cuenta');
  var res=await signUp(email,pass);
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
  hideAuthScreen();
  if(typeof initApp==='function') initApp();
  _injectLogoutBtn(user);

  var runOnboarding = function(){
    try{
      // 1. Si el perfil no está completo, abrirlo (sin bloquear el flujo)
      if(!S.profile||!S.profile.name||!S.profile.name.trim()){
        if(typeof openProfilePage==='function') openProfilePage();
      }
      // 2. Solicitar PIN si no existe
      if(!_isPinEnabled()){
        setTimeout(function(){ showSetPinModal(user); }, 400);
        return;
      }
      // 3. Ofrecer biometría si está disponible y no activada
      if(_isBioAvailable()&&!_isBioEnabled()){
        setTimeout(function(){ _showBioOfferSheet(user); }, 500);
      }
    }catch(e){ console.warn('Onboarding error:',e); }
  };

  if(typeof safeSync==='function'){
    safeSync(user.id).then(runOnboarding).catch(function(){
      setTimeout(runOnboarding, 200);
    });
  }else{
    setTimeout(runOnboarding, 400);
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
    _setError('bio','No se reconoció. Intenta de nuevo.');
  }
}
function handleBioFallback(){ _showScreen('login'); }

function _injectLogoutBtn(user){
  if(document.getElementById('drawer-logout-btn'))return;
  var drawer=document.getElementById('drawer'); if(!drawer)return;
  var div=document.createElement('div');
  div.id='drawer-logout-btn';
  div.style.cssText='padding:12px 16px;border-top:1px solid var(--border);margin-top:4px';
  var svgIcon='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
  div.innerHTML='<button onclick="signOut()" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:50px;border:none;background:rgba(239,68,68,.08);color:var(--danger);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font);transition:.15s">'
    +'<div style="width:32px;height:32px;border-radius:50%;background:rgba(239,68,68,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">'+svgIcon+'</div>'
    +'<span>Cerrar sesión</span>'
    +'</button>';
  drawer.appendChild(div);
}

function goToRegister(){_setError('li','');_showScreen('register');}
function goToRecover(){_setError('li','');_showScreen('recover');}
function goToLoginFromRecover(){_setError('rc','');_showScreen('login');}

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
        redirectTo: window.location.origin
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
}
function authKey(e,fn){if(e.key==='Enter'&&typeof window[fn]==='function')window[fn]();}
function togglePass(iId,bId){var i=document.getElementById(iId),b=document.getElementById(bId);if(!i)return;i.type=i.type==='password'?'text':'password';if(b)b.textContent=i.type==='password'?'👁️':'🙈';}

function _authMsg(msg){
  if(!msg)return{ok:false,msg:'Error desconocido'};
  if(msg.includes('already registered'))return{ok:false,msg:'',isExists:true};
  if(msg.includes('User already registered'))return{ok:false,msg:'',isExists:true};
  if(msg.includes('Invalid login'))return{ok:false,msg:'Correo o contraseña incorrectos'};
  if(msg.includes('Password should'))return{ok:false,msg:'Contraseña débil: mínimo 8 caracteres, mayúscula, número y símbolo'};
  if(msg.includes('valid email'))return{ok:false,msg:'Ingresa un correo válido'};
  if(msg.includes('Email not confirmed'))return{ok:false,msg:'Confirma tu correo antes de entrar'};
  if(msg.includes('rate limit'))return{ok:false,msg:'Demasiados intentos. Espera unos minutos'};
  return{ok:false,msg:msg};
}


// ════════════════════════════════════════════════════════════
// VALIDACIÓN VISUAL CONTRASEÑA — tiempo real
// ════════════════════════════════════════════════════════════
function _authPwCheck(val){
  var rules=[
    {id:'pw-r1', ok: val.length>=8},
    {id:'pw-r2', ok: /[A-Z]/.test(val)},
    {id:'pw-r3', ok: /[0-9]/.test(val)},
    {id:'pw-r4', ok: /[^A-Za-z0-9]/.test(val)}
  ];
  rules.forEach(function(r){
    var el=document.getElementById(r.id);
    if(el) el.classList.toggle('ok', r.ok);
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
      if(_currentUser && _currentUser.id && _isBioEnabled()){
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
      try{ toast('Sesión expirada'); }catch(ex){}
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
        +'<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px">'
          +'<img src="/icon-192.png" style="width:24px;height:24px;border-radius:5px" alt="">'
          +'<span style="font-weight:800;font-size:16px;color:var(--text,#0F172A)">Finanz<span style="color:#00D4AA">IA</span></span>'
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
function openPinLogin(){ showPinModal(); }

// FIX 1 — Validación real de sesión al entrar con PIN
async function _enterWithPinSuccess(){
  _resetPinAttempts();
  var realUser = null;
  try{
    var res = await _supabase.auth.getUser();
    if(res.error || !res.data || !res.data.user) throw new Error('Invalid session');
    realUser = res.data.user;
    _currentUser = realUser;
  }catch(e){
    if(_currentUser && _currentUser.id){
      localStorage.removeItem('_pinEnabled_' + _currentUser.id);
      localStorage.removeItem('_userPin_' + _currentUser.id);
    }
    closePinModal();
    showAuthScreen();
    _showScreen('login');
    try{ toast('Sesión expirada. Ingresa nuevamente'); }catch(ex){}
    return;
  }
  closePinModal();
  hideAuthScreen();
  if(typeof initApp === 'function') initApp();
  if(realUser){
    _injectLogoutBtn(realUser);
    if(typeof safeSync === 'function'){
      safeSync(realUser.id).catch(function(e){ console.warn('sync error:',e); });
    }
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
      +'<div style="display:flex;justify-content:center;padding:12px 0 4px"><div style="width:40px;height:4px;border-radius:2px;background:var(--border,#E2E8F0)"></div></div>'
      +'<div style="padding:20px 28px 24px;text-align:center">'
        +'<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px">'
          +'<img src="/icon-192.png" style="width:24px;height:24px;border-radius:5px" alt="">'
          +'<span style="font-weight:800;font-size:16px;color:var(--text,#0F172A)">Finanz<span style="color:#00D4AA">IA</span></span>'
        +'</div>'
        +'<div style="font-size:16px;font-weight:700;color:var(--text,#0F172A);margin-bottom:4px">Ingresa tu PIN</div>'
        +attemptsHtml
        +'<div id="pin-dots" style="display:flex;justify-content:center;gap:16px;margin:16px 0 8px"></div>'
        +'<div id="pin-err" style="min-height:18px;font-size:13px;color:#DC2626;margin-bottom:14px;text-align:center"></div>'
        +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">'+_buildKeypad('_pinKey')+'</div>'
        +'<button onclick="closePinModal()" style="margin-top:14px;background:none;border:none;color:var(--text2,#94A3B8);font-size:14px;cursor:pointer;font-family:var(--font,inherit)">Cancelar</button>'
      +'</div>'
      +'</div>';
    _renderPinDots(pin, 'pin-dots');
    window._pinState = {pin:pin, draw:draw};
  }

  draw();
  document.body.appendChild(overlay);

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
// VERIFICACIÓN DE CORREO
// ════════════════════════════════════════════════════════════

// Polling de respaldo — se activa si onAuthStateChange no dispara
function enableContinueIfVerified(){
  var btn=document.getElementById('verify-continue-btn');
  if(!btn||!btn.disabled) return; // ya habilitado o no existe
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
  if(pass.length<8){_setError('rp','M\u00ednimo 8 caracteres');return;}
  if(!/[A-Z]/.test(pass)){_setError('rp','Debe incluir al menos una may\u00fascula');return;}
  if(!/[0-9]/.test(pass)){_setError('rp','Debe incluir al menos un n\u00famero');return;}
  if(!/[^A-Za-z0-9]/.test(pass)){_setError('rp','Debe incluir al menos un car\u00e1cter especial (!@#$...)');return;}
  _setError('rp',''); _setBusy('rp-btn',true,'Guardar nueva contrase\u00f1a');
  try{
    var rv=await _supabase.auth.updateUser({password:pass});
    _setBusy('rp-btn',false,'Guardar nueva contrase\u00f1a');
    if(rv.error){_setError('rp',rv.error.message||'No se pudo actualizar la contrase\u00f1a');return;}
    try{ toast('Contrase\u00f1a actualizada \u2713'); }catch(e){}
    setTimeout(function(){ _showScreen('login'); },1200);
  }catch(e){
    _setBusy('rp-btn',false,'Guardar nueva contrase\u00f1a');
    _setError('rp','Algo sali\u00f3 mal. Intenta de nuevo.');
  }
}

// ════════════════════════════════════════════════════════════
// PANTALLA BIENVENIDA — una sola línea
// ════════════════════════════════════════════════════════════
function _showWelcomeScreen(user){
  var firstName='Usuario';
  try{ firstName=getFirstName(user||_currentUser); }catch(e){}
  var greetEl=document.getElementById('welcome-greeting');
  if(greetEl) greetEl.textContent='\u00a1Hola, '+firstName+'!';
  _showScreen('welcome');
  var fpIcon=document.getElementById('welcome-fp-icon');
  if(fpIcon&&typeof _fpSvgSm!=='undefined') fpIcon.innerHTML=_fpSvgSm;
}

async function _startBioFromWelcome(){
  try{
    // Validar sesión real con Supabase
    var _sv = await _supabase.auth.getUser();
    if(_sv.error || !_sv.data || !_sv.data.user){
      try{ toast('Sesión no válida. Ingresa con tu contraseña.'); }catch(e){}
      showAuthScreen();
      _showScreen('login');
      return;
    }
    var user = _sv.data.user;
    _currentUser = user;
    // Biometría no habilitada → solo informar, sin redirigir
    if(!_isBioEnabled()){
      try{ toast('La autenticación con huella no está activada en este dispositivo.'); }catch(e){}
      return;
    }
    // Solicitar autenticación biométrica
    var result = await bioAuthenticate();
    if(result === true){
      hideAuthScreen();
      if(typeof initApp === 'function') initApp();
      if(typeof _injectLogoutBtn === 'function') _injectLogoutBtn(user);
      if(typeof safeSync === 'function'){
        safeSync(user.id).catch(function(e){ console.warn('sync error:',e); });
      }
    }else if(result === 'cancelled'){
      try{ toast('Autenticación cancelada.'); }catch(e){}
    }else{
      try{ toast('No se pudo verificar la huella. Inténtalo nuevamente.'); }catch(e){}
    }
  }catch(err){
    console.error('Biometric auth error:', err);
    try{ toast('Error al intentar la autenticación biométrica.'); }catch(e){}
  }
}

// ════════════════════════════════════════════════════════════
// ARRANQUE
// ════════════════════════════════════════════════════════════
async function initAuth(){
  if(!initSupabase()){
    hideAuthScreen(); if(typeof initApp==='function')initApp(); return;
  }
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
  if(user){
    try{
      var _uv = await _supabase.auth.getUser();
      if(_uv.error || !_uv.data || !_uv.data.user){
        user = null;
        _currentUser = null;
      }
    }catch(e){
      user = null;
      _currentUser = null;
    }
  }
  if(user){
    _currentUser=user;
    if(_isBioEnabled() || _isPinEnabled()){
      showAuthScreen();
      _showWelcomeScreen(user);
    }else{
      hideAuthScreen();
      if(typeof initApp==='function') initApp();
      _injectLogoutBtn(user);
      if(typeof safeSync==='function'){
        safeSync(user.id).catch(function(e){ console.warn('sync error:',e); });
      }
    }
  }else{
    localStorage.removeItem('_bioEnabled');
    localStorage.removeItem('_bioCredId');
    localStorage.removeItem('finanziaState3');
    showAuthScreen(); _showScreen('login');
  }
}
