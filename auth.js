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
  await _supabase.auth.signOut();
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
  ['login','register','bio','verify'].forEach(function(id){
    var el=document.getElementById('auth-'+id); if(el)el.style.display='none';
  });
  var t=document.getElementById('auth-'+name); if(t)t.style.display='block';
}
function _setError(id,msg){
  var el=document.getElementById('auth-err-'+id);
  if(el){el.textContent=msg||'';el.style.display=msg?'block':'none';}
}
function _setBusy(id,busy,label){
  var b=document.getElementById(id); if(!b)return; b.disabled=busy; if(label)b.textContent=busy?'...':label;
}

async function handleLogin(){
  var email=(document.getElementById('li-email').value||'').trim();
  var pass=(document.getElementById('li-pass').value||'').trim();
  if(!email||!pass){_setError('li','Completa todos los campos');return;}
  _setError('li',''); _setBusy('li-btn',true,'Entrar');
  var res=await signIn(email,pass);
  _setBusy('li-btn',false,'Entrar');
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
  if(_isBioAvailable()&&!_isBioEnabled()){
    if(confirm('¿Activar acceso con huella digital para la próxima vez?')){
      var ok=await bioRegister(user.id,user.email);
      if(ok){try{toast('Huella activada ✓');}catch(e){}}
    }
  }
  hideAuthScreen();
  if(typeof initApp==='function') initApp();
  _injectLogoutBtn(user);
  // Si el perfil está vacío → abrir Mi Perfil automáticamente
  setTimeout(function(){
    try{
      if(!S.profile||!S.profile.name||!S.profile.name.trim()){
        if(typeof openProfilePage==='function') openProfilePage();
      }
    }catch(e){}
  }, 400);
}

async function handleBioUnlock(){
  _setBusy('bio-btn',true,'🔓 Desbloquear');
  var ok=await bioAuthenticate();
  _setBusy('bio-btn',false,'🔓 Desbloquear');
  if(ok){
    hideAuthScreen();
    if(typeof initApp==='function') initApp();
    _injectLogoutBtn(_currentUser);
  }else{
    _setError('bio','No se reconoció. Intenta de nuevo.');
  }
}
function handleBioFallback(){ localStorage.removeItem('_bioEnabled'); localStorage.removeItem('_bioCredId'); _showScreen('login'); }

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
      showAuthScreen(); _showScreen('bio');
      var be=document.getElementById('bio-email'); if(be)be.textContent=user.email;
    }else{
      hideAuthScreen(); if(typeof initApp==='function')initApp(); _injectLogoutBtn(user);
    }
  }else{
    showAuthScreen(); _showScreen('login');
  }
}
