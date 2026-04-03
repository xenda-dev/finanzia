// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  loadState();
  document.querySelectorAll('[data-page]').forEach(el=>{if(!el.getAttribute('onclick'))el.addEventListener('click',()=>navigate(el.dataset.page));});
  refreshCurrencyToggle();
  applyLanguage();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){if(S.theme==='auto')applyThemeMode();});
  navigate((S.currentPage&&S.currentPage!=='configuracion')?S.currentPage:'dashboard');
  checkAutoPayments();
  fetchExchangeRate();
  // Swipe to open drawer
  let touchStartX=0;
  document.addEventListener('touchstart',e=>{touchStartX=e.touches[0].clientX;},{passive:true});
  document.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-touchStartX;
    if(touchStartX<30&&dx>60)openDrawer();
    if(dx<-60&&document.getElementById('drawer').classList.contains('open'))closeDrawer();
  },{passive:true});
});
