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

  // ── Sync bidireccional ────────────────────────────────────
  // 1) visibilitychange: al volver al frente recibe cambios; al ir al fondo guarda
  document.addEventListener('visibilitychange',function(){
    if(!document.hidden){
      try{
        if(typeof _currentUser!=='undefined'&&_currentUser&&typeof syncFromSupabase==='function'){
          console.log('👁️ app al frente -> sync');
          syncFromSupabase(_currentUser.id).catch(function(e){console.warn('visibility sync:',e);});
        }
      }catch(e){}
    }else{
      try{
        if(typeof _currentUser!=='undefined'&&_currentUser&&typeof saveUserData==='function'){
          window._lastSupabaseSave=0;
          saveUserData(_currentUser.id,S).catch(function(e){console.warn('visibility save:',e);});
        }
      }catch(e){}
    }
  });

  // 2) Supabase Realtime: recibe cambios del servidor en tiempo real
  _startRealtimeSync();
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
          if(typeof syncFromSupabase==='function'&&_currentUser){
            syncFromSupabase(_currentUser.id).catch(function(e){console.warn('realtime sync:',e);});
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
