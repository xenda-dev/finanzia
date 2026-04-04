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
}
// ════════════════════════════════════════════════════════════
// ARRANQUE
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  if(typeof initAuth==='function'){initAuth();}else{initApp();}
});
