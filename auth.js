// ════════════════════════════════════════════════════════════
// AUTH.JS — Supabase + Biometría WebAuthn
// ════════════════════════════════════════════════════════════

var SUPABASE_URL = 'https://dshwbvqvfbjtlbcqqviz.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaHdidnF2ZmJqdGxiY3Fxdml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTM1OTYsImV4cCI6MjA5MDg4OTU5Nn0.kjie4SHtxJZYkX1rspJK2JNpOWfbd-Xdx3UZfgqydXU';

var _supabase = null;
var _currentUser = null;

function initSupabase(){
  if(typeof supabase === 'undefined'){ console.error('Supabase CDN no cargó'); return false; }
  _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return true;
}

async function signUp(email, password){
  var {data, error} = await _supabase.auth.signUp({email, password});
  if(error) return _authMsg(error.message);
  return {ok:true};
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
      rp: {name:'FinanzIA'},
      user: {id: new TextEncoder().encode(userId), name: email, displayName: email},
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
  }catch(e){ console.log('Bio auth cancelled:',e.message); return false; }
}

// ════════════════════════════════════════════════════════════
// BOTTOM SHEET — DESBLOQUEO BIOMÉTRICO (al abrir app)
// ════════════════════════════════════════════════════════════
function _showBioSheet(user){
  // Eliminar sheet anterior si existe
  var old = document.getElementById('bio-sheet-overlay');
  if(old) old.remove();

  var email = user ? user.email : '';
  var overlay = document.createElement('div');
  overlay.id = 'bio-sheet-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;animation:bsFadeIn .2s ease';

  overlay.innerHTML =
    '<div id="bio-sheet" style="width:100%;background:var(--surface,#fff);border-radius:24px 24px 0 0;padding:0 0 max(env(safe-area-inset-bottom),24px);animation:bsSlideUp .28s cubic-bezier(.32,1,.42,1)">'
    // Handle
    +'<div style="display:flex;justify-content:center;padding:12px 0 4px"><div style="width:40px;height:4px;border-radius:2px;background:var(--border,#E2E8F0)"></div></div>'
    // Body
    +'<div style="padding:20px 28px 28px;text-align:center">'
      // Brand
      +'<div style="font-size:22px;font-weight:900;letter-spacing:-0.5px;margin-bottom:4px">'
        +'<span style="color:var(--text,#0F172A)">Finanz</span><span style="color:#00D4AA">IA</span>'
      +'</div>'
      // Icon
      +'<div style="font-size:52px;margin:16px 0 12px;line-height:1">🔒</div>'
      // Title
      +'<div style="font-size:19px;font-weight:700;color:var(--text,#0F172A);margin-bottom:6px">Bienvenido de nuevo</div>'
      // Email
      +'<div style="font-size:13px;color:var(--text2,#64748B);margin-bottom:24px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px;margin-left:auto;margin-right:auto">'+email+'</div>'
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
  if(btn){ btn.disabled = true; btn.textContent = '...'; }
  if(errEl){ errEl.style.display = 'none'; }

  var ok = await bioAuthenticate();

  if(ok){
    _closeBioSheet();
    // Inicializar app SOLO tras autenticación exitosa
    if(typeof initApp==='function') initApp();
    _injectLogoutBtn(_currentUser);
    if(_currentUser && typeof safeSync === 'function'){
      safeSync(_currentUser.id).catch(function(e){ console.warn('sync error:',e); });
    }
  }else{
    if(btn){ btn.disabled = false; btn.textContent = '🔓 Usar huella / Face ID'; }
    if(errEl){
      errEl.textContent = 'No se reconoció. Intenta de nuevo o usa tu contraseña.';
      errEl.style.display = 'block';
    }
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
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;animation:bsFadeIn .2s ease';

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
  if(btn){ btn.disabled = true; btn.textContent = '...'; }
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
  ['login','register','bio','verify','recover'].forEach(function(id){
    var el=document.getElementById('auth-'+id); if(el)el.style.display='none';
  });
  var t=document.getElementById('auth-'+name); if(t)t.style.display='block';
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
  var pass2=(document.getElementById('rg-pass2').value||'').trim();
  if(!email||!pass||!pass2){_setError('rg','Completa todos los campos');return;}
  if(pass!==pass2){_setError('rg','Las contraseñas no coinciden');return;}
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
  // Entrar a la app inmediatamente — sin confirm(), sin bloqueos
  hideAuthScreen();
  if(typeof initApp==='function') initApp();
  _injectLogoutBtn(user);

  // Sync + chequeo de perfil
  if(typeof safeSync==='function'){
    safeSync(user.id)
      .then(function(){
        setTimeout(function(){
          try{
            if(!S.profile||!S.profile.name||!S.profile.name.trim()){
              if(typeof openProfilePage==='function') openProfilePage();
            } else if(_isBioAvailable()&&!_isBioEnabled()){
              // Ofrecer biometría solo si el perfil ya está completo
              _showBioOfferSheet(user);
            }
          }catch(e){}
        },400);
      })
      .catch(function(e){
        console.warn('sync error:',e);
        setTimeout(function(){
          try{
            if(!S.profile||!S.profile.name||!S.profile.name.trim()){
              if(typeof openProfilePage==='function') openProfilePage();
            } else if(_isBioAvailable()&&!_isBioEnabled()){
              _showBioOfferSheet(user);
            }
          }catch(e){}
        },500);
      });
  }else{
    setTimeout(function(){
      try{
        if(!S.profile||!S.profile.name||!S.profile.name.trim()){
          if(typeof openProfilePage==='function') openProfilePage();
        } else if(_isBioAvailable()&&!_isBioEnabled()){
          _showBioOfferSheet(user);
        }
      }catch(e){}
    },400);
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
function goToLogin(){_setError('rg','');_showScreen('login');}
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
// ARRANQUE
// ════════════════════════════════════════════════════════════
async function initAuth(){
  if(!initSupabase()){
    hideAuthScreen(); if(typeof initApp==='function')initApp(); return;
  }
  _supabase.auth.onAuthStateChange(function(event,session){
    if(event==='SIGNED_OUT'){showAuthScreen();_showScreen('login');}
  });
  var user=await getCurrentUser();
  if(user){
    _currentUser=user;
    if(_isBioEnabled()){
      // Mostrar bio sheet — initApp() y sync se ejecutan SOLO tras autenticación exitosa
      hideAuthScreen();
      _showBioSheet(user);
    }else{
      hideAuthScreen();
      if(typeof initApp==='function') initApp();
      _injectLogoutBtn(user);
      if(typeof safeSync==='function'){
        safeSync(user.id).catch(function(e){ console.warn('sync error:',e); });
      }
    }
  }else{
    showAuthScreen(); _showScreen('login');
  }
}
