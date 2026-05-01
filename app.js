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
  if('serviceWorker'in navigator){
    navigator.serviceWorker.register('/sw.js').catch(function(e){
      console.warn('SW registro fallido:',e);
    });
  }
  // Detectar navegación desde push
  var _notifPage=localStorage.getItem('_notifPage')||'';
  if(!_notifPage){
    var _urlParams=new URLSearchParams(window.location.search);
    _notifPage=_urlParams.get('notif_page')||'';
  }
  if(_notifPage){
    localStorage.removeItem('_notifPage');
    setTimeout(function(){
      try{
        if(typeof navigate==='function'&&_notifPage){navigate(_notifPage);}
      }catch(e){
        if(typeof toast==='function')toast('Nav error: '+String(e).substring(0,60));
      }
    },2000);
  }
  loadState();

  // ── Quitar monedas hardcodeadas si son las de prueba ──────
  // Solo limpia si el usuario no ha configurado su perfil (currencies vacío = ok)
  // No tocar si ya tiene monedas elegidas por él

  document.querySelectorAll('[data-page]').forEach(el=>{if(!el.getAttribute('onclick'))el.addEventListener('click',()=>navigate(el.dataset.page));});
  refreshCurrencyToggle();
  applyLanguage();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){if(S.theme==='auto')applyThemeMode();});
  navigate(S.currentPage||'dashboard');
  checkAutoPayments();
  checkBudgetNotifs();
  checkGoalNotifs();
  checkWeeklyNotif();
  checkTipsNotif();
  if(typeof _subscribePush==='function'&&typeof Notification!=='undefined'&&Notification.permission==='granted'&&S.notifPrefs&&S.notifPrefs._master===true){
    setTimeout(_subscribePush,2000);
  }
  fetchExchangeRate();
  let touchStartX=0;
  document.addEventListener('touchstart',e=>{touchStartX=e.touches[0].clientX;},{passive:true});
  document.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-touchStartX;
    if(touchStartX<30&&dx>60)openDrawer();
    if(dx<-60&&document.getElementById('drawer').classList.contains('open'))closeDrawer();
  },{passive:true});

  // ── Pantalla de privacidad en multitarea ─────────────────
  function _showPrivacyScreen(){
    var el=document.getElementById('privacy-screen');
    if(el)el.style.display='flex';
  }
  function _hidePrivacyScreen(){
    var el=document.getElementById('privacy-screen');
    if(el)el.style.display='none';
  }

  // pagehide: dispara ANTES que visibilitychange en Android → screenshot ya cubierto
  window.addEventListener('pagehide',function(){_showPrivacyScreen();},false);
  window.addEventListener('pageshow',function(){_hidePrivacyScreen();},false);

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
if('serviceWorker'in navigator){
  navigator.serviceWorker.addEventListener('message',function(e){
    if(e.data&&e.data.type==='notif_page'&&e.data.page){
      if(typeof navigate==='function'){navigate(e.data.page);}
      else{localStorage.setItem('_notifPage',e.data.page);}
    }
  });
}
