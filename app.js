// ════════════════════════════════════════════════════════════
// ERROR HANDLER
// ════════════════════════════════════════════════════════════
window.onerror=function(msg,src,line){
  console.error('ERR:',msg,'L:'+line);
  try{toast('⚠️ '+msg);}catch(e){}
  return false;
};
// ════════════════════════════════════════════════════════════
// INIT APP — llamado por auth.js tras login exitoso
// ════════════════════════════════════════════════════════════
function initApp(){
  loadState();

  // ── Quitar monedas hardcodeadas si son las de prueba ──────
  // Solo limpia si el usuario no ha configurado su perfil (currencies vacío = ok)
  // No tocar si ya tiene monedas elegidas por él

  document.querySelectorAll('[data-page]').forEach(el=>{if(!el.getAttribute('onclick'))el.addEventListener('click',()=>navigate(el.dataset.page));});
  refreshCurrencyToggle();
  applyLanguage();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){if(S.theme==='auto')applyThemeMode();});
  navigate((S.currentPage&&S.currentPage!=='configuracion')?S.currentPage:'dashboard');
  checkAutoPayments();
  fetchExchangeRate();
  let touchStartX=0;
  document.addEventListener('touchstart',e=>{touchStartX=e.touches[0].clientX;},{passive:true});
  document.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-touchStartX;
    if(touchStartX<30&&dx>60)openDrawer();
    if(dx<-60&&document.getElementById('drawer').classList.contains('open'))closeDrawer();
  },{passive:true});

  // ── Pantalla de privacidad en multitarea ─────────────────
  // Muestra overlay cuando la app va a segundo plano
  var _privacyOverlay=null;
  function _showPrivacyScreen(){
    if(_privacyOverlay)return;
    _privacyOverlay=document.createElement('div');
    _privacyOverlay.id='privacy-overlay';
    _privacyOverlay.style.cssText='position:fixed;inset:0;z-index:99999;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px';
    _privacyOverlay.innerHTML='<img src="/icon-192.png" style="width:80px;height:80px;border-radius:20px;opacity:.9">'
      +'<div style="font-size:22px;font-weight:900;color:var(--text)">Finanz<span style="color:var(--primary)">IA</span></div>';
    document.body.appendChild(_privacyOverlay);
  }
  function _hidePrivacyScreen(){
    if(_privacyOverlay){_privacyOverlay.remove();_privacyOverlay=null;}
  }

  // ── Auto-lock tras 3 min en segundo plano ─────────────────
  var _bgTimestamp=0;
  var _AUTO_LOCK_MS=3*60*1000; // 3 minutos

  // ── Sync bidireccional + privacidad + auto-lock ───────────
  document.addEventListener('visibilitychange',function(){
    if(!document.hidden){
      // App vuelve al frente
      _hidePrivacyScreen();
      // Auto-lock: si estuvo más de 3 min en segundo plano
      if(_bgTimestamp>0&&Date.now()-_bgTimestamp>=_AUTO_LOCK_MS){
        _bgTimestamp=0;
        // Verificar que hay sesión activa antes de pedir auth
        if(typeof _currentUser!=='undefined'&&_currentUser){
          if(typeof showAuthScreen==='function')showAuthScreen();
          if(typeof _showWelcomeScreen==='function')_showWelcomeScreen(_currentUser);
          else if(typeof _showScreen==='function')_showScreen('login');
        }
        return;
      }
      _bgTimestamp=0;
      try{
        if(typeof _currentUser!=='undefined'&&_currentUser&&typeof safeSync==='function'){
          console.log('👁️ app al frente -> sync');
          safeSync(_currentUser.id).catch(function(e){console.warn('visibility sync:',e);});
        }
      }catch(e){}
    }else{
      // App va al fondo
      _showPrivacyScreen();
      _bgTimestamp=Date.now();
      try{
        if(typeof _currentUser!=='undefined'&&_currentUser&&typeof saveUserData==='function'){
          window._lastSupabaseSave=0;
          saveUserData(_currentUser.id,S).catch(function(e){console.warn('visibility save:',e);});
        }
      }catch(e){}
    }
  });

  // ── Supabase Realtime ─────────────────────────────────────
  _startRealtimeSync();
}

async function safeSync(userId, retries){
  retries = retries || 3;
  for(var i=0;i<retries;i++){
    try{
      await syncFromSupabase(userId);
      return true;
    }catch(e){
      if(i===retries-1){ console.warn('Sync failed after retries',e); return false; }
      await new Promise(function(r){ setTimeout(r,1000); });
    }
  }
}
function _startRealtimeSync(){
  try{
    if(typeof _supabase==='undefined'||!_supabase) return;
    if(typeof _currentUser==='undefined'||!_currentUser) return;
    if(window._realtimeChannel) return;
    window._realtimeChannel=_supabase
      .channel('user_data_changes')
      .on('postgres_changes',{
        event:'UPDATE',
        schema:'public',
        table:'user_data',
        filter:'user_id=eq.'+_currentUser.id
      },function(payload){
        var remoteTs=payload.new&&payload.new.updated_at
          ?new Date(payload.new.updated_at).getTime():0;
        var localTs=S._lastSync||0;
        if(remoteTs>localTs){
          console.log('🔔 Realtime: cambio remoto -> sync');
          if(typeof safeSync==='function'&&_currentUser){
            safeSync(_currentUser.id).catch(function(e){console.warn('realtime sync:',e);});
          }
        }else{
          console.log('🔔 Realtime: cambio propio, ignorado');
        }
      })
      .subscribe(function(status){
        console.log('📡 Realtime:',status);
      });
  }catch(e){console.warn('_startRealtimeSync error:',e);}
}
// ════════════════════════════════════════════════════════════
// ARRANQUE
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  if(typeof initAuth==='function'){initAuth();}else{initApp();}
});
