// ════════════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════════════
function applyThemeMode(){
  let effective=S.theme;
  if(S.theme==='auto'){
    effective=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  }
  document.documentElement.setAttribute('data-theme',effective);
  const btn=document.getElementById('theme-btn');
  if(btn)btn.textContent=effective==='dark'?'☀️':'🌙';
}
function buildNumFormatCaps(){
  var opts=[['auto','Automático'],['2','Con decimales'],['0','Sin decimales']];
  var cur=S.numFormat||'auto';
  return opts.map(function(o){
    var isOn=cur===o[0];
    return '<button onclick="setNumFormat(\''+o[0]+'\')" style="flex:1;padding:8px 4px;border-radius:50px;border:none;background:'+(isOn?'var(--primary)':'transparent')+';color:'+(isOn?'white':'var(--text2)')+';font-size:12px;font-weight:'+(isOn?'700':'500')+';cursor:pointer;font-family:var(--font);transition:.15s">'+o[1]+'</button>';
  }).join('');
}
function buildNumFormatExample(){
  var n=1500000;
  var d=S.numFormat==='0'?0:2;
  try{
    var meta=getCurrencyMeta(S.currency||(S.currencies&&S.currencies[0])||'USD');
    var str=n.toLocaleString(meta.locale,{minimumFractionDigits:d,maximumFractionDigits:d});
    return meta.pos==='before'?meta.sym+str:str+' '+meta.sym;
  }catch(e){return n.toFixed(d);}
}
function setNumFormat(val){completeAction(function(){S.numFormat=val;},'configuracion');}
function buildThemeCaps(){
  var opts=[['light','☀️ Claro'],['dark','🌙 Oscuro'],['auto','⚙️ Auto']];
  var cur=S.theme||'light';
  return opts.map(function(o){
    var isOn=cur===o[0];
    return '<button onclick="setThemeInline(\''+o[0]+'\')" style="flex:1;padding:8px 4px;border-radius:50px;border:none;background:'+(isOn?'var(--primary)':'transparent')+';color:'+(isOn?'white':'var(--text2)')+';font-size:12px;font-weight:'+(isOn?'700':'500')+';cursor:pointer;font-family:var(--font);transition:.15s">'+o[1]+'</button>';
  }).join('');
}
function setThemeInline(val){
  S.theme=val;
  applyThemeMode();
  saveState();
  renderPage('configuracion');
}
function setTheme(val){
  S.theme=val;
  applyThemeMode();
  togglePPick('theme-picker');
  saveState();
  renderPage('configuracion');
}
function toggleTheme(){
  const effective=S.theme==='auto'
    ?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')
    :S.theme;
  setTheme(effective==='dark'?'light':'dark');
}

// ════════════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════════════
var _navHistory=[];
var _goingBack=false;
function navigate(page){
  var _wasBack=_goingBack;
  closeModal();
  closeBottomSheet();
  if(!_goingBack&&S.currentPage&&S.currentPage!==page)_navHistory.push(S.currentPage);
  if(_navHistory.length>20)_navHistory.shift();
  _goingBack=false;
  if(page==='cuentas')S._cuentasGrupo='';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  S.currentPage=page;
  document.getElementById('page-'+page).classList.add('active');
  document.getElementById('main').scrollTo(0,0);
  renderPage(page);
  closeDrawer();
  refreshCurrencyToggle();
  _updateHeader(page);
}
function goBack(){
  var prev=_navHistory.pop()||'dashboard';
  _goingBack=true;
  navigate(prev);
}
function _switchPage(page){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('[data-page]').forEach(function(b){b.classList.toggle('active',b.dataset.page===page);});
  S.currentPage=page;
  var el=document.getElementById('page-'+page);
  if(el)el.classList.add('active');
  try{document.getElementById('main').scrollTo(0,0);}catch(e){}
  try{renderPage(page);}catch(e){}
  try{refreshCurrencyToggle();}catch(e){}
  try{_updateHeader(page);}catch(e){}
}
var _PAGE_LABELS={
  movimientos:'Movimientos',cuentas:'Cuentas',presupuestos:'Presupuestos',
  metas:'Metas',pagos:'Pagos programados',deudas:'Deudas',
  analisis:'Análisis',categorias:'Categorías',configuracion:'Configuración',
  herramientas:'Emiliano IA',calculadora:'Créditos',simulador:'Ahorro',
  simuladores:'Simuladores',jubilacion:'Jubilación',emergencia:'Emergencia',
  inflacion:'Inflación',rentabilidad:'Rentabilidad',
  estrategia:'Estrategia deudas',cambio:'Tipo de cambio',
  listas:'Listas de compra',inversiones:'Inversiones',
  test:'Test',
  'grp-midinero':'Mi Dinero',
  'grp-planificacion':'Planificación',
  'grp-herramientas':'Herramientas',
  'mis-cuentas':'Mis Cuentas',
  'cuentas-grupo':'Tipo de cuenta',
  'suscripciones':'Suscripciones',
  'mi-perfil':'Mi Perfil'
};
function _getPageTitle(page){
  if(page==='cuenta-detalle') return 'Detalle de Cuenta';
  if(page==='amortizacion') return 'Tabla de Amortización';
  if(page==='form-cuenta') return (S._fcData&&S._fcData.id)?'Edición de cuenta':'Nueva cuenta';
  if(page==='cuentas-grupo') return accGroupLabel(S._cuentasGrupo);
  return _PAGE_LABELS[page]||'';
}
function _updateHeader(page){
  var hTitle=document.getElementById('header-title');
  var hBack=document.getElementById('header-back');
  var hBrand=document.getElementById('header-brand');
  var hMenu=document.getElementById('header-menu');
  var hControls=document.getElementById('header-controls');
  var hSpacer=document.getElementById('header-spacer');
  if(!hTitle||!hBack||!hBrand)return;
  var isDash=page==='dashboard';
  // Brand y controles solo en dashboard
  hBrand.style.display=isDash?'flex':'none';
  hMenu.style.display=isDash?'flex':'none';
  hControls.style.display=isDash?'flex':'none';
  // Título y flecha en demás pantallas
  hTitle.style.display=isDash?'none':'block';
  hBack.style.display=isDash?'none':'flex';
  if(hSpacer)hSpacer.style.display=isDash?'none':'block';
  if(!isDash){
    hTitle.textContent=_getPageTitle(page);
    hBack.style.alignItems='center';
    hBack.style.justifyContent='center';
  }
}
function renderPage(page){
  var el=document.getElementById('page-'+page);
  if(!el){console.error('renderPage: no existe page-'+page);return;}
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  el.classList.add('active');
  S.currentPage=page;
  el.innerHTML='';
  try{
    switch(page){
      case'dashboard':el.innerHTML=renderDashboard();initExchangeWidget();break;
      case'movimientos':el.innerHTML=renderMovimientos();break;
      case'mis-cuentas':el.innerHTML=renderMisCuentas();break;
      case'cuenta-detalle':el.innerHTML=renderCuentaDetalle();break;
      case'amortizacion':el.innerHTML=renderAmortizacion();break;
      case'suscripciones':el.innerHTML=renderSuscripciones();break;
      case'cuentas':el.innerHTML=renderCuentas();break;
      case'cuentas-grupo':el.innerHTML=renderCuentasGrupoPage();break;
      case'form-cuenta':el.innerHTML=renderFormCuenta();break;
      case'presupuestos':el.innerHTML=renderPresupuestos();break;
      case'metas':el.innerHTML=renderMetas();break;
      case'pagos':el.innerHTML=renderPagos();break;
      case'deudas':el.innerHTML=renderDeudas();break;
      case'analisis':el.innerHTML=renderAnalisis();break;
      case'categorias':el.innerHTML=renderCategorias();break;
      case'configuracion':el.innerHTML=renderConfiguracion();break;
      case'herramientas':el.innerHTML=renderHerramientas();break;
      case'calculadora':el.innerHTML=renderCalculadora();break;
      case'simulador':el.innerHTML=renderSimulador();break;
      case'simuladores':el.innerHTML=renderSimuladores();break;
      case'jubilacion':el.innerHTML=renderJubilacion();break;
      case'emergencia':el.innerHTML=renderEmergencia();break;
      case'inflacion':el.innerHTML=renderInflacion();break;
      case'rentabilidad':el.innerHTML=renderRentabilidad();break;
      case'estrategia':window._estrategiaMetodo='';el.innerHTML=renderEstrategia();break;
      case'cambio':el.innerHTML=renderCambio();break;
      case'listas':el.innerHTML=renderListas();break;
      case'inversiones':el.innerHTML=renderInversiones();break;
      case'test':el.innerHTML=renderTest();break;
      case'grp-midinero':el.innerHTML=renderDrawerGroup('midinero');break;
      case'grp-planificacion':el.innerHTML=renderDrawerGroup('planificacion');break;
      case'grp-herramientas':el.innerHTML=renderDrawerGroup('herramientas');break;
      case'mi-perfil':el.innerHTML=renderMiPerfil();break;
    }
  }catch(e){
    console.error('renderPage ERROR ['+page+']:',e);
    el.innerHTML='<div style="padding:32px 20px;text-align:center"><div style="font-size:32px;margin-bottom:12px">⚠️</div><div style="font-size:15px;font-weight:700;color:var(--danger);margin-bottom:8px">Error al cargar '+page+'</div><div style="font-size:12px;color:var(--text2);font-family:monospace">'+e.message+'</div></div>';
  }
  try{document.getElementById('main').scrollTo(0,0);}catch(e){}
}
function initExchangeWidget(){
  const el=document.getElementById('exchange-widget');
  if(el)renderExchangeWidget(el); // render immediately with cached
  fetchExchangeRate();            // then refresh in background
}
function openDrawer(){document.getElementById('drawer').classList.add('open');document.getElementById('overlay').classList.add('active');}
function closeDrawer(){document.getElementById('drawer').classList.remove('open');document.getElementById('overlay').classList.remove('active');}
// ── Drawer Group Portal ─────────────────────────────────────
var DRAWER_GROUPS={
  midinero:{
    label:'Mi Dinero',icon:'💰',color:'#00D4AA',
    items:[
      {icon:'💳',label:'Cuentas',page:'mis-cuentas'},
      {icon:'📋',label:'Movimientos',page:'movimientos'},
      {icon:'💸',label:'Deudas',page:'deudas'},
    ]
  },
  planificacion:{
    label:'Planificación',icon:'📅',color:'#7461EF',
    items:[
      {icon:'📊',label:'Presupuestos',page:'presupuestos'},
      {icon:'🎯',label:'Metas de ahorro',page:'metas'},
      {icon:'🔔',label:'Pagos programados',page:'pagos'},
      {icon:'🔁',label:'Suscripciones',page:'suscripciones'},
    ]
  },
  herramientas:{
    label:'Herramientas',icon:'🔧',color:'#F59E0B',
    items:[
      {icon:'🤖',label:'Emiliano IA',page:'herramientas'},
      {icon:'📊',label:'Simuladores',page:'simuladores'},
      {icon:'🏥',label:'Salud financiera',page:'test'},
      {icon:'❄️',label:'Estrategia deudas',page:'estrategia'},
      {icon:'💱',label:'Tipo de cambio',page:'cambio'},
      {icon:'🛒',label:'Listas de compra',page:'listas'},
    ]
  }
};
function renderDrawerGroup(groupKey){
  var g=DRAWER_GROUPS[groupKey];
  if(!g)return'';
  var questions={midinero:'\u00bfQu\u00e9 quieres gestionar?',planificacion:'\u00bfQu\u00e9 quieres planificar?',herramientas:'\u00bfQu\u00e9 herramienta necesitas?'};
  var qtitle=questions[groupKey]||'';
  var html='';
  if(qtitle){
    html+='<div style="padding:20px 16px 8px;text-align:center">'
      +'<div style="font-size:18px;font-weight:800;color:var(--text);line-height:1.3">'+qtitle+'</div>'
      +'</div>';
  }
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:12px 0 32px">';
  g.items.forEach(function(item){
    html+='<button onclick="navigate(\'' +item.page+ '\')" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 8px 16px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--card-shadow);border-radius:18px;cursor:pointer;transition:.15s;gap:8px;font-family:var(--font);min-height:100px">'
      +'<span style="font-size:30px;line-height:1">'+item.icon+'</span>'
      +'<span style="font-size:11px;font-weight:700;color:var(--text);text-align:center;line-height:1.3">'+item.label+'</span>'
      +'</button>';
  });
  html+='</div>';
  return html;
}
// ════════════════════════════════════════════════════════════
// TOAST & CONFIRM
// ════════════════════════════════════════════════════════════
function toast(msg){try{var t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2500);}catch(e){}}

let _confirmCb=null;
function confirmDialog(icon,title,msg,cb,okLabel='Confirmar',okClass='btn-danger'){
  _confirmCb=cb;
  document.getElementById('confirm-icon').textContent=icon;
  document.getElementById('confirm-title').textContent=title;
  document.getElementById('confirm-msg').textContent=msg;
  const ok=document.getElementById('confirm-ok');
  ok.textContent=okLabel;ok.className='btn '+okClass+' btn-sm';
  document.getElementById('confirm-root').classList.add('active');
}
function runConfirm(){try{if(_confirmCb)_confirmCb();}finally{closeConfirm();}}
function closeConfirm(){document.getElementById('confirm-root').classList.remove('active');_confirmCb=null;}
// ── completeAction: patrón estándar acción→estado→cerrarUI→render→feedback ──
// renderTarget: string (nombre de página) | function (nav/render custom) | null
// message: string para toast | null/undefined para omitir
function completeAction(callback,renderTarget,message){
  try{
    if(callback&&typeof callback==='function')callback();
    saveState();
  }catch(e){
    console.error('completeAction error:',e);
  }finally{
    closeModal();
    closeConfirm();
    closeBottomSheet();
  }
  if(typeof renderTarget==='function'){
    renderTarget();
  }else if(renderTarget){
    renderPage(renderTarget);
  }
  if(message)toast(message);
}

// ════════════════════════════════════════════════════════════
// MODAL
// ════════════════════════════════════════════════════════════
function openModal(type,data){
  const root=document.getElementById('modal-root');
  const sheet=document.getElementById('modal-sheet');
  sheet.innerHTML=buildModal(type,data||{});
  root.classList.add('active');
}
function closeModal(){
  document.getElementById('modal-root').classList.remove('active');
  document.getElementById('modal-sheet').innerHTML='';
}

// ════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════
async function openNotifPage(){
  const overlay=document.createElement('div');
  overlay.id='notif-page-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;flex-direction:column;overflow:hidden';
  overlay.innerHTML=
    '<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'+
    '<button onclick="document.getElementById(\'notif-page-overlay\').remove()" style="width:36px;height:36px;border-radius:50%;border:none;background:transparent;color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>'+
    '<span style="font-size:17px;font-weight:800">Notificaciones</span>'+
    '<button onclick="requestNotifPerm()" style="background:var(--primary);border:none;color:white;padding:6px 12px;border-radius:20px;font-size:12px;cursor:pointer;font-family:var(--font)">Activar</button>'+
    '</div>'+
    '<div style="flex:1;overflow-y:auto;padding:16px">'+
    '<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:var(--text2)">'+
    '🔔 Activa las notificaciones del sistema para recibir alertas. Luego personaliza cuáles deseas recibir abajo.'+
    '</div>'+
    buildNotifToggles()+
    '</div>';
  document.body.appendChild(overlay);
}
function buildNotifToggles(){
  var keys=['notifPayments','notifBudget','notifGoal','notifWeekly','notifMonthly','notifDebt'];
  var labels={'notifPayments':'💳 Pagos próximos','notifBudget':'📊 Presupuesto al límite','notifGoal':'🎯 Meta de ahorro alcanzada','notifWeekly':'📅 Resumen semanal','notifMonthly':'📈 Resumen mensual','notifDebt':'💸 Alerta de deuda alta'};
  var descs={'notifPayments':'Recordatorio antes de que venza un pago','notifBudget':'Cuando llegues al 80% o 100% del presupuesto','notifGoal':'Celebración al completar una meta de ahorro','notifWeekly':'Resumen de gastos cada lunes','notifMonthly':'Balance de ingresos vs gastos al cierre del mes','notifDebt':'Cuando una deuda supere el 40% de tus ingresos'};
  return keys.map(function(key){
    var isOn=!!(S.notifPrefs&&S.notifPrefs[key]);
    return '<div style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px">'
      +'<div style="flex:1"><div style="font-size:14px;font-weight:600">'+labels[key]+'</div><div style="font-size:12px;color:var(--text2);margin-top:2px">'+descs[key]+'</div></div>'
      +'<div onclick="toggleNotifPref(\''+key+'\')" style="width:44px;height:24px;border-radius:12px;background:'+(isOn?'var(--primary)':'var(--border)')+';cursor:pointer;position:relative;flex-shrink:0">'
      +'<div style="width:20px;height:20px;border-radius:50%;background:white;position:absolute;top:2px;'+(isOn?'right:2px':'left:2px')+';box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>'
      +'</div></div>';
  }).join('');
}
function toggleNotifPref(key){
  if(!S.notifPrefs)S.notifPrefs={};
  S.notifPrefs[key]=!S.notifPrefs[key];
  saveState();
  var list=document.querySelector('#notif-page-overlay [style*="overflow-y:auto"]');
  if(list)list.innerHTML='<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:var(--text2)">🔔 Activa las notificaciones del sistema para recibir alertas. Luego personaliza cuáles deseas recibir abajo.</div>'+buildNotifToggles();
}
function requestNotifPerm(){
  if(!('Notification'in window)){toast('Notificaciones no disponibles en este navegador');return;}
  if(Notification.permission==='granted'){toast('✅ Notificaciones ya están activas');return;}
  if(Notification.permission==='denied'){
    // Show instructions to unblock
    confirmDialog('🔔','Notificaciones bloqueadas',
      'Para activarlas: en Chrome toca el ícono 🔒 en la barra de dirección → Configuración del sitio → Notificaciones → Permitir. Luego vuelve aquí y toca de nuevo.',
      ()=>{},'Entendido','btn-primary');
    return;
  }
  // 'default' - request permission
  Notification.requestPermission().then(result=>{
    if(result==='granted'){toast('🔔 Notificaciones activadas ✓');}
    else if(result==='denied'){toast('Notificaciones bloqueadas en el navegador');}
    renderPage('configuracion');
  });
}
function sendNotif(title,body){
  if('Notification'in window&&Notification.permission==='granted'){
    try{new Notification(title,{body,icon:'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Ctext y=%27.9em%27 font-size=%2790%27%3E💰%3C/text%3E%3C/svg%3E'});}catch(e){}
  }
}
function checkAutoPayments(){
  const today=todayStr();
  S.scheduledPayments.forEach(p=>{
    if(p.isAuto&&p.nextDate===today){
      const alreadyDone=S.transactions.some(t=>t.description==='AUTO:'+p.id&&t.date===today);
      if(!alreadyDone){
        const tx=stampItem({id:uid(),type:'gasto',accountId:p.accountId||'',categoryId:p.categoryId||'',subcategoryId:p.subcategoryId||'',amount:p.amount,currency:p.currency||S.currency,date:today,description:'AUTO:'+p.id,paymentMethod:''});
        S.transactions.push(tx);
        sendNotif('💳 Pago automático',`${p.name} — ${fmt(p.amount,p.currency||S.currency)}`);
        advancePayment(p);
        toast('Auto-pago: '+p.name);
      }
    }
    if(p.nextDate<=today&&!p.isAuto){
      sendNotif('⚠️ Pago pendiente',`${p.name} venció el ${p.nextDate}`);
    }
  });
  saveState();
}
function advancePayment(p){
  const d=new Date(p.nextDate);
  const freq=p.frequency;
  if(freq==='Diario')d.setDate(d.getDate()+1);
  else if(freq==='Semanal')d.setDate(d.getDate()+7);
  else if(freq==='Quincenal')d.setDate(d.getDate()+15);
  else if(freq==='Mensual')d.setMonth(d.getMonth()+1);
  else if(freq==='Bimestral')d.setMonth(d.getMonth()+2);
  else if(freq==='Trimestral')d.setMonth(d.getMonth()+3);
  else if(freq==='Semestral')d.setMonth(d.getMonth()+6);
  else if(freq==='Anual')d.setFullYear(d.getFullYear()+1);
  p.nextDate=d.toISOString().split('T')[0];
}

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════
function renderDashboard(){
  const{inc,exp}=getMonthTotals();
  const bal=getTotalBalance();
  const savings=inc-exp;
  const savingsRate=inc>0?Math.round(savings/inc*100):0;
  const _pays=filterDeleted(S.scheduledPayments);
  const urgentPayments=_pays.filter(p=>daysUntil(p.nextDate)<=3&&daysUntil(p.nextDate)>=0);
  const overduePayments=_pays.filter(p=>daysUntil(p.nextDate)<0);
  const budgets=filterDeleted(S.budgets).filter(b=>(b.currency||S.currency)===S.currency).slice(0,3);
  const recentTxs=[...filterDeleted(S.transactions)].filter(t=>t.currency===S.currency).sort((a,b)=>{const dd=new Date(b.date)-new Date(a.date);if(dd!==0)return dd;return b.id>a.id?1:-1;}).slice(0,5);

  const budgetHtml=budgets.length?budgets.map(b=>{
    const spent=getBudgetSpent(b);
    const pct=Math.min(100,b.amount>0?Math.round(spent/b.amount*100):0);
    const cat=getCat(b.categoryId);
    const color=pct>=90?'var(--danger)':pct>=70?'var(--warning)':'var(--primary)';
    return`<div class="budget-item"><div class="budget-header"><span class="budget-name">${cat?cat.icon+' '+cat.name:'Sin cat.'}</span><span class="budget-amounts">${fmt(spent)}/${fmt(b.amount)}</span></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div></div>`;
  }).join(''):'<div style="color:var(--text2);font-size:13px">Sin presupuestos</div>';

  const alertHtml=[
    ...overduePayments.map(p=>`<div class="alert-banner">🚨 <span><strong>${p.name}</strong> venció hace ${Math.abs(daysUntil(p.nextDate))} días — ${fmt(p.amount,p.currency)}</span></div>`),
    ...urgentPayments.map(p=>`<div class="${daysUntil(p.nextDate)===0?'alert-banner':'warn-banner'}">${daysUntil(p.nextDate)===0?'⚠️':'🔔'} <span><strong>${p.name}</strong> ${daysUntil(p.nextDate)===0?'vence HOY':'vence en '+daysUntil(p.nextDate)+' días'} — ${fmt(p.amount,p.currency)}</span></div>`)
  ].join('');

  const totalGoalSavings=filterDeleted(S.goals).filter(g=>(g.currency||S.currency)===S.currency).reduce((s,g)=>s+(parseFloat(g.current)||0),0);
  return`
    ${alertHtml}
    <div id="exchange-widget" class="exchange-widget"></div>
    <div class="balance-card">
      <div class="balance-label">Balance total (${S.currency})</div>
      <div class="balance-amount">${fmt(bal)}</div>
      <div class="balance-row">
        <div class="balance-stat"><div class="balance-stat-label">↑ Ingresos mes</div><div class="balance-stat-val inc">${fmt(inc)}</div></div>
        <div class="balance-stat"><div class="balance-stat-label">↓ Gastos mes</div><div class="balance-stat-val exp">${fmt(exp)}</div></div>
      </div>
    </div>
    <div class="kpi-row">
      <div class="kpi-card" style="cursor:pointer" onclick="openModal('balanceDistribution',{})">
        <div class="kpi-label">💎 Total disponible</div>
        <div class="kpi-val" style="font-size:13px;color:var(--primary)">${fmt(bal-totalGoalSavings>=0?bal-totalGoalSavings:0)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px">👆 ver distribución</div>
      </div>
      <div class="kpi-card" style="cursor:pointer" onclick="navigate('metas')">
        <div class="kpi-label">🎯 Total ahorrado</div>
        <div class="kpi-val" style="font-size:13px;color:var(--success)">${fmt(totalGoalSavings)}</div>
        <div style="font-size:10px;color:${savingsRate<=0?'var(--text3)':savingsRate>=20?'var(--success)':savingsRate>=10?'var(--warning)':'var(--danger)'};margin-top:2px">${savingsRate<=0?'—':savingsRate+'% del ingreso'}</div>
      </div>
      <div class="kpi-card" style="cursor:pointer" onclick="navigate('deudas')">
        <div class="kpi-label">💸 Total deudas</div>
        <div class="kpi-val" style="font-size:13px;color:var(--danger)">${fmt(S.accounts.filter(a=>a.type==='pasivo'&&(a.currency||S.currency)===S.currency).reduce((s,a)=>s+Math.abs(getBalance(a.id)),0))}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px">👆 ver deudas</div>
      </div>
      <div class="kpi-card" style="cursor:pointer" onclick="navigate('cuentas')">
        <div class="kpi-label">💳 Cuentas activas</div>
        <div class="kpi-val">${S.accounts.filter(a=>a.type==='activo'&&(a.currency||S.currency)===S.currency).length}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px">👆 ver cuentas</div>
      </div>
    </div>
    <div style="margin-top:20px">${renderRule502030()}</div>
    <div class="section-header"><div class="section-title">📊 ${t('budgets')}</div><button class="btn-text" onclick="navigate('presupuestos')">Ver todos</button></div>
    <div class="card">${budgetHtml}</div>
    <div class="section-header"><div class="section-title">📋 ${t('recentMovements')}</div><button class="btn-text" onclick="navigate('movimientos')">Ver todos</button></div>
    ${recentTxs.length?recentTxs.map(txRow).join(''):'<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Sin movimientos</div><div class="empty-desc">Toca + para registrar</div></div>'}
  `;
}

// ════════════════════════════════════════════════════════════
// TX ROW
// ════════════════════════════════════════════════════════════
function txRow(t){
  const cat=getCat(t.categoryId);const sub=getSub(t.subcategoryId);const acc=getAcc(t.accountId);
  const icon=t.type==='transferencia'?'↔️':(cat?cat.icon:'📦');
  const color=t.type==='transferencia'?'var(--secondary)':(cat?cat.color:'#64748B');
  const sign=t.type==='ingreso'?'+':t.type==='gasto'?'−':'↔';
  const cls=t.type==='ingreso'?'inc':t.type==='gasto'?'exp':'tra';
  const name=t.type==='transferencia'?`${getAcc(t.accountId)?.name||'?'} → ${getAcc(t.toAccountId)?.name||'?'}`:(cat?cat.name:'Sin categoría');
  const subName=sub?sub.name:(acc?acc.name:'');
  return`<div class="tx-item" onclick="openModal('viewTx',{id:'${t.id}'})">
    <div class="tx-icon" style="background:${color}22">${icon}</div>
    <div class="tx-info"><div class="tx-name">${name}</div><div class="tx-sub">${subName?subName+' · ':''}${t.date}${t.paymentMethod?' · '+t.paymentMethod:''}</div></div>
    <div class="tx-amount ${cls}">${sign}${fmt(t.amount,t.currency)}</div>
  </div>`;
}

// ════════════════════════════════════════════════════════════
// MOVIMIENTOS
// ════════════════════════════════════════════════════════════
function renderMovimientos(){
  const f=S.movFilter;
  let txs=[...filterDeleted(S.transactions)].filter(t=>t.currency===S.currency).sort((a,b)=>{const dd=new Date(b.date)-new Date(a.date);if(dd!==0)return dd;return b.id>a.id?1:-1;});
  if(f.tab!=='todos')txs=txs.filter(t=>t.type===f.tab);
  if(f.search){const q=f.search.toLowerCase();txs=txs.filter(t=>{const cat=getCat(t.categoryId);const acc=getAcc(t.accountId);return(cat&&cat.name.toLowerCase().includes(q))||(acc&&acc.name.toLowerCase().includes(q))||(t.description&&t.description.toLowerCase().includes(q));});}
  if(f.dateFrom)txs=txs.filter(t=>t.date>=f.dateFrom);
  if(f.dateTo)txs=txs.filter(t=>t.date<=f.dateTo);
  if(f.catId)txs=txs.filter(t=>t.categoryId===f.catId);
  if(f.accountId)txs=txs.filter(t=>t.accountId===f.accountId||t.toAccountId===f.accountId);
  if(f.payMethod)txs=txs.filter(t=>t.paymentMethod===f.payMethod);
  const hasFilters=f.dateFrom||f.dateTo||f.catId||f.accountId||f.payMethod;
  const total=txs.reduce((s,t)=>{const v=parseFloat(t.amount)||0;return t.type==='ingreso'?s+v:t.type==='gasto'?s-v:s;},0);
  return`
    <div class="search-bar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="text" placeholder="Buscar..." value="${f.search}" oninput="S.movFilter.search=this.value;renderPage('movimientos')">
      <button style="background:none;border:none;color:${hasFilters?'var(--primary)':'var(--text3)'};font-size:13px;cursor:pointer;font-weight:700" onclick="openModal('filterMovimientos',{})">⚙ Filtros${hasFilters?' •':''}</button>
    </div>
    ${f.dateFrom||f.dateTo?`<div style="font-size:12px;color:var(--text2);margin-bottom:8px">📅 ${f.dateFrom||'inicio'} → ${f.dateTo||'hoy'} <button style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:13px" onclick="S.movFilter.dateFrom='';S.movFilter.dateTo='';renderPage('movimientos')">✕</button></div>`:''}
    <div class="chip-row" style="margin-bottom:10px">
      ${['todos','ingreso','gasto','transferencia'].map(tab=>`<button class="chip ${f.tab===tab?'active':''}" onclick="S.movFilter.tab='${tab}';renderPage('movimientos')">${tab==='todos'?'Todos':tab==='ingreso'?'Ingresos':tab==='gasto'?'Gastos':'Transferencias'}</button>`).join('')}
    </div>
    ${txs.length>0?`<div style="font-size:12px;color:var(--text2);margin-bottom:10px">${txs.length} movimientos · Balance: <span style="color:${total>=0?'var(--success)':'var(--danger)'};font-weight:700">${fmt(total)}</span></div>`:''}
    ${txs.length?txs.map(txRow).join(''):'<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Sin resultados</div><div class="empty-desc">Ajusta los filtros</div></div>'}
  `;
}

// ════════════════════════════════════════════════════════════
// CUENTAS — CATÁLOGO Y HELPERS
// ════════════════════════════════════════════════════════════

var ACC_GROUPS=[
  {id:'efectivo',  type:'activo',  icon:'💵', label:'Efectivo',           color:'#10B981',
   subs:[{id:'efectivo_fisico',label:'Efectivo en físico',icon:'💵'}]},
  {id:'banco',     type:'activo',  icon:'🏦', label:'Bancos',              color:'#3B82F6',
   subs:[
     {id:'ahorro',    label:'Cuenta de ahorros', icon:'🏦'},
     {id:'corriente', label:'Cuenta corriente',   icon:'💳'},
     {id:'nomina',    label:'Cuenta nómina',       icon:'💼'},
     {id:'cheques',   label:'Cuenta cheques',      icon:'🖊️'}
   ]},
  {id:'virtual',   type:'activo',  icon:'🌐', label:'Cuentas virtuales',  color:'#8B5CF6',
   subs:[
     {id:'paypal',   label:'PayPal',            icon:'🅿️'},
     {id:'wise',     label:'Wise',              icon:'💚'},
     {id:'payoneer', label:'Payoneer',          icon:'🟠'},
     {id:'skrill',   label:'Skrill',            icon:'🔵'},
     {id:'revolut',  label:'Revolut',           icon:'⚡'},
     {id:'digital',  label:'Billetera digital', icon:'📱'}
   ]},
  {id:'inversion', type:'activo',  icon:'📈', label:'Inversiones',        color:'#F59E0B',
   subs:[
     {id:'broker',   label:'Cuenta broker / Acciones', icon:'📈'},
     {id:'fondo',    label:'Fondo de inversión',        icon:'🏦'},
     {id:'cdt',      label:'CDT / Plazo fijo',          icon:'🔒'},
     {id:'etf',      label:'ETF',                       icon:'📊'},
     {id:'cripto',   label:'Criptomonedas',             icon:'₿'},
     {id:'pension',  label:'Pensión voluntaria',         icon:'👴'},
     {id:'inv_otro', label:'Otra inversión',            icon:'💡'}
   ]},
  {id:'bien',      type:'activo',  icon:'🏠', label:'Bienes',             color:'#EC4899',
   subs:[
     {id:'inmueble',  label:'Inmueble',  icon:'🏠'},
     {id:'vehiculo',  label:'Vehículo',  icon:'🚗'},
     {id:'bien_otro', label:'Otro bien', icon:'📦'}
   ]},
  {id:'tc',        type:'pasivo',  icon:'💳', label:'Tarjetas de crédito',color:'#EF4444',
   subs:[
     {id:'visa',       label:'Visa',             icon:'🔵', color:'#1A1F71'},
     {id:'mastercard', label:'Mastercard',        icon:'🔴', color:'#EB001B'},
     {id:'amex',       label:'American Express',  icon:'🟦', color:'#2E77BC'},
     {id:'diners',     label:'Diners Club',        icon:'⚫', color:'#4A4A4A'},
     {id:'discover',   label:'Discover',           icon:'🟠', color:'#FF6600'},
     {id:'unionpay',   label:'UnionPay',           icon:'🟥', color:'#CC0000'},
     {id:'tc_otra',    label:'Otra franquicia',    icon:'💳', color:'#EF4444'}
   ]},
  {id:'prestamo',  type:'pasivo',  icon:'🏦', label:'Préstamos',          color:'#F97316',
   subs:[
     {id:'hipoteca',   label:'Crédito hipotecario', icon:'🏠'},
     {id:'vehiculo_d', label:'Crédito de vehículo', icon:'🚗'},
     {id:'consumo',    label:'Crédito de consumo',  icon:'🛒'},
     {id:'personal',   label:'Préstamo personal',   icon:'🤝'},
     {id:'micro',      label:'Microcrédito',         icon:'💵'},
     {id:'educativo',  label:'Crédito educativo',    icon:'🎓'},
     {id:'empresarial',label:'Crédito empresarial',  icon:'💼'}
   ]},
  {id:'informal',  type:'pasivo',  icon:'👤', label:'Deudas informales',  color:'#6366F1',
   subs:[
     {id:'persona', label:'Deuda con persona', icon:'👤'}
   ]}
];

function accGroupLabel(grpId){
  var g=ACC_GROUPS.find(function(x){return x.id===grpId;});
  return g?g.label:'Cuentas';
}

function getSubInfo(subId){
  for(var i=0;i<ACC_GROUPS.length;i++){
    var found=ACC_GROUPS[i].subs.find(function(s){return s.id===subId;});
    if(found)return {sub:found,grp:ACC_GROUPS[i]};
  }
  return null;
}

function _accMatchesGrp(a,grpId,cur){
  if((a.currency||cur)!==cur)return false;
  if(a._grpId===grpId)return true;
  if(grpId==='banco'&&a.subtype==='banco')return true;
  if(grpId==='efectivo'&&a.subtype==='efectivo')return true;
  if(grpId==='virtual'&&a.subtype==='digital')return true;
  if(grpId==='inversion'&&a.subtype==='inversion')return true;
  if(grpId==='tc'&&a.subtype==='tc')return true;
  if(grpId==='prestamo'&&(a.subtype==='credito'||a.subtype==='prestamo'))return true;
  return false;
}

// ════════════════════════════════════════════════════════════
// MIS CUENTAS — pantalla principal con todas las cuentas
// ════════════════════════════════════════════════════════════
function accListItem(a,cur){
  var bal=getBalance(a.id);
  var info=getSubInfo(a._subId||a.subtype);
  var bank=a.bankEntity?getBank(a.bankEntity,a.currency||cur):null;
  var subtypeColorL={efectivo:'#10B981',tc:'#7461EF',digital:'#3B82F6',inversion:'#F59E0B',bien:'#8B5CF6',prestamo:'#EF4444',informal:'#EC4899',banco:'#0EA5E9'};
  var grpObjL=ACC_GROUPS.find(function(g){return g.id===(a._grpId||a.subtype);});
  var baseColor=bank?bank.color:((info&&info.grp&&info.grp.color)?info.grp.color:(grpObjL&&grpObjL.color)?grpObjL.color:(subtypeColorL[a.subtype]||'#00D4AA'));
  if(!baseColor||baseColor==='undefined')baseColor='#00D4AA';
  var typeIcon=a.subtype==='efectivo'?'💵':a.subtype==='tc'?'💳':a.subtype==='digital'?'📱':a.subtype==='inversion'?'📈':a.subtype==='bien'?'🏠':a.subtype==='prestamo'?'💰':'🏦';
  // Tipo de cuenta: sub label o grp label
  // Subtítulo: tipo de cuenta (+ banco si aplica, solo cuando hay info de entidad)
  var grpLabelL=grpObjL?grpObjL.label:'';
  var subLabelL=(info&&info.sub&&info.sub.label)?info.sub.label:'';
  var tipoLabel='';
  if(a._grpId==='tc'||a.subtype==='tc'){
    // TC: "Tarjeta de crédito · Visa"
    tipoLabel='Tarjeta de crédito'+(subLabelL?' · '+subLabelL:'');
  } else if(bank){
    // Cuenta con banco: "Cuenta de ahorros · BCO"
    tipoLabel=(subLabelL||grpLabelL)+(bank?' · '+bank.abbr:'');
  } else {
    tipoLabel=subLabelL||grpLabelL||a.subtype||'Cuenta';
  }
  var isNeg=a.type==='pasivo';
  return '<div onclick="openCuentaDetalle(\''+a.id+'\',event)" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer">'
    +'<div style="width:44px;height:44px;border-radius:14px;background:'+baseColor+'22;border:1px solid '+baseColor+'44;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+typeIcon+'</div>'
    +'<div style="flex:1;min-width:0">'
      +'<div style="font-size:14px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.name+'</div>'
      +'<div style="font-size:12px;color:var(--text3);margin-top:1px">'+tipoLabel+'</div>'
    +'</div>'
    +'<div style="text-align:right;flex-shrink:0">'
      +'<div style="font-size:15px;font-weight:800;color:'+(isNeg?'var(--danger)':'var(--text)')+'">'+fmt(Math.abs(bal),cur)+'</div>'
      +'<div style="font-size:10px;color:var(--text3);margin-top:1px">'+(isNeg?'Deuda':'Saldo')+'</div>'
    +'</div>'
    +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>'
    +'</div>';
}

function renderMisCuentas(){
  var cur=S.currency;
  var _accs=filterDeleted(S.accounts);
  var activos=_accs.filter(function(a){return a.type==='activo'&&(a.currency||cur)===cur;});
  var pasivos=_accs.filter(function(a){return a.type==='pasivo'&&(a.currency||cur)===cur;});
  var nw=getNetWorth();
  var assets=nw.assets,liabilities=nw.liabilities,net=nw.net;
  var html='<div class="summary-totals" style="margin-bottom:20px">'
    +'<div class="summary-total-item">'
      +'<div class="summary-total-label">💚 Activos</div>'
      +'<div class="summary-total-val" style="color:var(--success)">'+fmt(assets)+'</div>'
      +(activos.length?'<div style="font-size:10px;color:var(--text3);margin-top:2px">'+activos.length+' cuenta'+(activos.length!==1?'s':'')+'</div>':'')
    +'</div>'
    +'<div class="summary-total-item">'
      +'<div class="summary-total-label">🔴 Pasivos</div>'
      +'<div class="summary-total-val" style="color:var(--danger)">'+fmt(liabilities)+'</div>'
      +(pasivos.length?'<div style="font-size:10px;color:var(--text3);margin-top:2px">'+pasivos.length+' cuenta'+(pasivos.length!==1?'s':'')+'</div>':'')
    +'</div>'
    +'<div class="summary-total-item">'
      +'<div class="summary-total-label">💎 Patrimonio</div>'
      +'<div class="summary-total-val" style="color:'+(net>=0?'var(--primary)':'var(--danger)')+'">'+fmt(net)+'</div>'
    +'</div>'
    +'</div>'
    +'<div style="display:flex;justify-content:flex-end;margin-bottom:16px">'
      +'<button class="btn btn-primary btn-sm" onclick="navigate(\'cuentas\')">+ Nueva cuenta</button>'
    +'</div>';

  if(activos.length===0&&pasivos.length===0){
    html+='<div class="empty-state"><div class="empty-icon">💳</div>'
      +'<div class="empty-title">Sin cuentas</div>'
      +'<div class="empty-desc">Toca "+ Nueva cuenta" para empezar</div></div>';
    return html;
  }

  if(activos.length){
    html+='<div class="section-header" style="margin-bottom:4px"><div class="section-title">💚 Activos</div></div>';
    html+='<div style="background:var(--surface);border-radius:16px;padding:0 14px;margin-bottom:16px;box-shadow:var(--card-shadow)">';
    activos.forEach(function(a){html+=accListItem(a,cur);});
    html+='</div>';
  }
  if(pasivos.length){
    html+='<div class="section-header" style="margin-bottom:4px"><div class="section-title">🔴 Pasivos</div></div>';
    html+='<div style="background:var(--surface);border-radius:16px;padding:0 14px;box-shadow:var(--card-shadow)">';
    pasivos.forEach(function(a){html+=accListItem(a,cur);});
    html+='</div>';
  }
  return html;
}

// ════════════════════════════════════════════════════════════
// CUENTAS HUB — selector de tipo (grilla 3 cols)
// ════════════════════════════════════════════════════════════
function renderCuentas(){
  var activosGrp=ACC_GROUPS.filter(function(g){return g.type==='activo';});
  var pasivosGrp=ACC_GROUPS.filter(function(g){return g.type==='pasivo';});
  function grpCard(g){
    var oc='openAccGroup(\'' + g.id + '\')';
    return '<button onclick="'+oc+'" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px 8px;background:var(--surface);border:1px solid var(--border);border-radius:16px;cursor:pointer;font-family:var(--font);min-height:88px;width:100%">'
      +'<div style="width:46px;height:46px;border-radius:12px;background:'+g.color+'22;display:flex;align-items:center;justify-content:center;font-size:24px">'+g.icon+'</div>'
      +'<span style="font-size:11px;font-weight:700;color:var(--text);text-align:center;line-height:1.3">'+g.label+'</span>'
      +'</button>';
  }
  return '<div style="padding:4px 0 14px;text-align:center">'
      +'<div style="font-size:18px;font-weight:800;color:var(--text)">&#191;Qu&#233; tipo de cuenta deseas crear?</div>'
    +'</div>'
    +'<div style="margin-bottom:16px">'
      +'<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">&#128154; Activos</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">'+activosGrp.map(grpCard).join('')+'</div>'
    +'</div>'
    +'<div>'
      +'<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">&#128308; Pasivos</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">'+pasivosGrp.map(grpCard).join('')+'</div>'
    +'</div>';
}
function openAccGroup(grpId){
  if(grpId==='efectivo'){
    // Efectivo va directo al formulario (solo tiene un subtipo)
    S._fcData={grpId:'efectivo',subId:'efectivo_fisico',id:'',step:1,fields:{}};
    navigate('form-cuenta');
    return;
  }
  S._cuentasGrupo=grpId;
  navigate('cuentas-grupo');
}

function renderCuentasGrupoPage(){
  var grpId=S._cuentasGrupo||'';
  return renderCuentasGrupo(grpId);
}
function renderCuentasGrupo(grpId){
  var cur=S.currency;
  var grp=ACC_GROUPS.find(function(g){return g.id===grpId;});
  if(!grp)return '';
  var cuentas=filterDeleted(S.accounts).filter(function(a){return _accMatchesGrp(a,grpId,cur);});
  var html='<div style="padding:4px 0 16px;text-align:center">'
    +(function(){
      var msgs={
        tc:{title:'Elige la franquicia de tu TC',sub:'Selecciona la red de tu tarjeta'},
        prestamo:{title:'Elige el cr\u00e9dito a registrar',sub:'Selecciona el tipo de cr\u00e9dito'},
        informal:{title:'Elige la deuda a registrar',sub:'Selecciona el tipo de deuda'}
      };
      var m=msgs[grpId]||{title:'Elige la cuenta a registrar',sub:'Selecciona el tipo de cuenta'};
      return '<div style="font-size:17px;font-weight:800;color:var(--text)">'+m.title+'</div>'
        +'<div style="font-size:12px;color:var(--text3);margin-top:4px">'+m.sub+'</div>';
    })()
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:24px">';
  grp.subs.forEach(function(sub){
    var oc='openFormCuenta(\'' + grpId + '\',\'' + sub.id + '\')';
    html+='<button onclick="'+oc+'" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px 8px;background:var(--surface);border:1px solid var(--border);border-radius:16px;cursor:pointer;font-family:var(--font);min-height:88px;width:100%">'
      +'<div style="width:46px;height:46px;border-radius:12px;background:'+grp.color+'22;display:flex;align-items:center;justify-content:center;font-size:24px">'+sub.icon+'</div>'
      +'<span style="font-size:11px;font-weight:700;color:var(--text);text-align:center;line-height:1.3">'+sub.label+'</span>'
      +'</button>';
  });
  html+='</div>';
  return html;
}
function accCardNew(a,cur){
  var bal=getBalance(a.id);
  var info=getSubInfo(a._subId||a.subtype);
  var bank=a.bankEntity?getBank(a.bankEntity,a.currency||cur):null;
  var subtypeColor={efectivo:'#10B981',tc:'#7461EF',digital:'#3B82F6',inversion:'#F59E0B',bien:'#8B5CF6',prestamo:'#EF4444',informal:'#EC4899',banco:'#0EA5E9'};
  var grpObjAcc=ACC_GROUPS.find(function(g){return g.id===(a._grpId||a.subtype);});
  var baseColor=bank?bank.color:((info&&info.grp&&info.grp.color)?info.grp.color:(grpObjAcc&&grpObjAcc.color)?grpObjAcc.color:(subtypeColor[a.subtype]||'#00D4AA'));
  if(!baseColor||baseColor==='undefined')baseColor='#00D4AA';
  var isTcCard=(a._grpId==='tc'||a.subtype==='tc')&&a.tcLimit;
  var days=a.paymentDate?(function(){var now=new Date();var d=new Date(now.getFullYear(),now.getMonth(),a.paymentDate);if(d<now)d.setMonth(d.getMonth()+1);return Math.round((d-now)/86400000);})():null;
  var subtypeToGrp2={efectivo:'efectivo',digital:'virtual',tc:'tc',prestamo:'prestamo',informal:'informal',inversion:'inversion',bien:'bien',banco:'banco'};
  // Ícono tipo cuenta (derecha superior)
  var typeIcon=a.subtype==='efectivo'?'💵':a.subtype==='tc'?'💳':a.subtype==='digital'?'📱':a.subtype==='inversion'?'📈':a.subtype==='bien'?'🏠':a.subtype==='prestamo'?'💰':'🏦';
  // Número de tarjeta enmascarado
  var cardNum=a.lastDigits?('•••• •••• •••• '+a.lastDigits):'•••• •••• •••• ••••';
  // Chip SVG dorado
  var chipSVG='<svg width="34" height="26" viewBox="0 0 34 26" fill="none" xmlns="http://www.w3.org/2000/svg">'
    +'<rect x="1" y="1" width="32" height="24" rx="4" fill="#C8960C" stroke="#A07800" stroke-width=".8"/>'
    +'<rect x="1" y="8.5" width="32" height="9" fill="#A07800" opacity=".4"/>'
    +'<rect x="11" y="1" width="12" height="24" fill="#A07800" opacity=".4"/>'
    +'<rect x="12" y="8.5" width="10" height="9" rx="1" fill="#C8960C" stroke="#A07800" stroke-width=".6"/>'
    +'<line x1="1" y1="8.5" x2="33" y2="8.5" stroke="#A07800" stroke-width=".6"/>'
    +'<line x1="1" y1="17.5" x2="33" y2="17.5" stroke="#A07800" stroke-width=".6"/>'
    +'<line x1="11" y1="1" x2="11" y2="25" stroke="#A07800" stroke-width=".6"/>'
    +'<line x1="23" y1="1" x2="23" y2="25" stroke="#A07800" stroke-width=".6"/>'
    +'</svg>';
  // Contactless SVG
  var nfcSVG='<svg width="20" height="20" viewBox="0 0 24 24" fill="none">'
    +'<path d="M12 2C8.5 5.5 8.5 18.5 12 22" stroke="rgba(255,255,255,.7)" stroke-width="2" stroke-linecap="round"/>'
    +'<path d="M16 5C10 9 10 15 16 19" stroke="rgba(255,255,255,.7)" stroke-width="2" stroke-linecap="round"/>'
    +'<path d="M20 8C13 10.5 13 13.5 20 16" stroke="rgba(255,255,255,.7)" stroke-width="2" stroke-linecap="round"/>'
    +'</svg>';
  // Gradiente de la tarjeta
  var grad='linear-gradient(135deg,'+baseColor+' 0%,'+baseColor+'AA 50%,'+baseColor+'66 100%)';
  // Urgencia TC
  var urgentBorder=days!==null&&days<=3?'box-shadow:0 0 0 2px '+(days===0?'#EF4444':'#F59E0B')+';':'';
  // Nombre banco o tipo
  var bankLabel=bank?bank.abbr:(info&&info.sub?info.sub.label.slice(0,6).toUpperCase():a.subtype.toUpperCase());
  var html='<div onclick="openCuentaDetalle(\''+a.id+'\',event)" style="'
    +'background:'+grad+';'
    +'border-radius:20px;'
    +'padding:20px 22px 18px;'
    +'margin-bottom:14px;'
    +'cursor:pointer;'
    +'position:relative;'
    +'overflow:hidden;'
    +'min-height:160px;'
    +'display:flex;flex-direction:column;justify-content:space-between;'
    +urgentBorder
    +'">'
    // Círculo decorativo fondo
    +'<div style="position:absolute;right:-30px;top:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.08)"></div>'
    +'<div style="position:absolute;right:30px;bottom:-50px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.05)"></div>'
    // Fila superior: banco + tipo
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative">'
      +'<div>'
        +'<div style="font-size:13px;font-weight:800;color:rgba(255,255,255,.9);letter-spacing:1px;text-transform:uppercase">'+bankLabel+'</div>'
        +(bank?'<div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:1px">'+bank.name+'</div>':'')
      +'</div>'
      +'<div style="font-size:22px">'+typeIcon+'</div>'
    +'</div>'
    // Chip + contactless
    +'<div style="display:flex;align-items:center;gap:10px;position:relative">'+chipSVG+nfcSVG+'</div>'
    // Número enmascarado
    +'<div style="font-size:13px;color:rgba(255,255,255,.75);letter-spacing:3px;font-family:monospace;position:relative">'+cardNum+'</div>'
    // Fila inferior: nombre + saldo
    +'<div style="display:flex;justify-content:space-between;align-items:flex-end;position:relative">'
      +'<div>'
        +'<div style="font-size:10px;color:rgba(255,255,255,.55);font-weight:600;text-transform:uppercase;letter-spacing:.5px">'+(a.type==='pasivo'?'Deuda':'Cuenta')+'</div>'
        +'<div style="font-size:13px;font-weight:700;color:white;margin-top:1px">'+a.name+'</div>'
      +'</div>'
      +'<div style="text-align:right">'
        +(days!==null&&days<=5?'<div style="font-size:10px;color:'+(days<=2?'#FF8080':'#FFD080')+';font-weight:700;margin-bottom:2px">⚠ Pago '+(days===0?'HOY':days+'d')+'</div>':'')
        +'<div style="font-size:11px;color:rgba(255,255,255,.55);font-weight:500">Saldo</div>'
        +'<div style="font-size:20px;font-weight:800;color:white;letter-spacing:-.5px">'+fmt(Math.abs(bal),a.currency||cur)+'</div>'
      +'</div>'
    +'</div>'
    // Barra TC
    +(isTcCard?'<div style="margin-top:10px;position:relative"><div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,.6);margin-bottom:4px"><span>Usado '+Math.min(100,a.tcLimit>0?Math.round(bal/a.tcLimit*100):0)+'%</span><span>Límite '+fmt(a.tcLimit,a.currency||cur)+'</span></div><div style="height:4px;background:rgba(255,255,255,.2);border-radius:99px"><div style="height:100%;border-radius:99px;background:'+(a.tcLimit>0&&bal/a.tcLimit>0.8?'#FF8080':'rgba(255,255,255,.8)')+';width:'+Math.min(100,a.tcLimit>0?Math.round(bal/a.tcLimit*100):0)+'%;transition:width .3s"></div></div></div>':'')
    +'</div>';
  return html;
}
function openFormCuenta(grpId,subId,accId){
  var preFields={};
  if(accId){
    var ea=S.accounts.find(function(a){return a.id===accId;});
    if(ea){
      preFields['fc-name']=ea.name||'';
      preFields['fc-currency']=ea.currency||S.currency;
      preFields['fc-bank']=ea.bankEntity||'';
      preFields['fc-balance']=fmtRTLValue(ea.initialBalance||0, ea.currency||S.currency);
      preFields['fc-tae']=ea.tae?ea.tae.toFixed(2)+'%':'';
      preFields['fc-digits']=ea.lastDigits||'';
      preFields['fc-broker']=ea.broker||'';
      preFields['fc-ratio']=String(ea.utilizationRatio||30);
      preFields['fc-ratio-notif']=ea.utilizationNotif?'1':'0';
      preFields['fc-tc-limit']=ea.tcLimit?fmtRTLValue(ea.tcLimit,ea.currency||S.currency):'';
      preFields['fc-cut']=String(ea.cutDate||'');
      preFields['fc-paydate']=String(ea.paymentDate||'');
      preFields['fc-monthly']=ea.monthlyPayment?fmtRTLValue(ea.monthlyPayment,ea.currency||S.currency):'';
      preFields['fc-credit-total']=ea.creditTotal?fmtRTLValue(ea.creditTotal,ea.currency||S.currency):'';
      preFields['fc-term-years']=String(ea.termYears||'');
      preFields['fc-term-months']=String(ea.termMonths||'');
      preFields['fc-disb-date']=ea.disbDate||'';
      preFields['fc-end-date']=ea.endDate||'';
      preFields['fc-cap-freq']=ea.capFreq||'mensual';
      preFields['fc-pay-freq']=ea.payFreq||'mensual';
      preFields['fc-last-payment']=ea.lastPaymentDate||'';
      preFields['fc-acreedor']=ea.acreedor||ea.name||'';
      preFields['fc-tel-acreedor']=ea.telAcreedor||'';
      preFields['fc-email-acreedor']=ea.emailAcreedor||'';
      preFields['fc-foto-acreedor']=ea.fotoAcreedor||'';
      preFields['fc-deadline']=ea.deadline||'';
      preFields['acc-include']=ea.excludeFromTotal?'0':'1';
    }
  }
  S._fcData={grpId:grpId||'', subId:subId||'', id:accId||'', step:1, fields:preFields};
  navigate('form-cuenta');
}
function fcNext(){
  if(!fcValidateStep())return;
  fcSaveStepFields();
  S._fcData.step=(S._fcData.step||1)+1;
  renderPage('form-cuenta');
  var ht=document.getElementById('header-title');
  if(ht)ht.textContent=S._fcData.id?'Edición de cuenta':'Nueva cuenta';
}
function fcBack(){
  if((S._fcData.step||1)<=1){goBack();return;}
  S._fcData.step=(S._fcData.step||1)-1;
  renderPage('form-cuenta');
}
function fcValidateStep(){
  var step=S._fcData.step||1;
  var grpId=S._fcData.grpId||'';
  if(step===1){
    if(grpId==='informal'){
      var acr=(document.getElementById('fc-acreedor')||{}).value||'';
      if(!acr.trim()){toast('Ingresa el nombre del acreedor');return false;}
    } else if(grpId!=='efectivo'){
      var nm=(document.getElementById('fc-name')||{}).value||'';
      if(!nm.trim()){toast('Ingresa un nombre para la cuenta');return false;}
    }
  }
  return true;
}
function fcSaveStepFields(){
  // Guardar todos los inputs del paso actual en S._fcData.fields
  var fields=S._fcData.fields||{};
  var ids=['fc-name','fc-currency','fc-bank','fc-balance','fc-tae','fc-tc-limit','fc-cut','fc-paydate',
           'fc-monthly','fc-credit-total','fc-broker','fc-value','fc-year','fc-color-val',
           'fc-digits','fc-ratio','fc-ratio-notif','fc-acreedor','fc-tel-acreedor','fc-tel-code',
           'fc-email-acreedor','fc-foto-acreedor','fc-deadline','acc-include',
           'fc-term-years','fc-term-months','fc-disb-date','fc-end-date',
           'fc-cap-freq','fc-pay-freq','fc-last-payment'];
  ids.forEach(function(id){
    var el=document.getElementById(id);
    if(el)fields[id]=el.value||el.getAttribute('data-on')||'';
  });
  S._fcData.fields=fields;
}
function fcGetField(id,def){
  var f=S._fcData&&S._fcData.fields?S._fcData.fields[id]:'';
  return f!==undefined&&f!==''?f:(def||'');
}

function buildAccToggleHTML(acc){
  var checked=acc?!acc.excludeFromTotal:true;
  var onTap='(function(el){'
    +'var on=el.getAttribute(\'data-on\')===\'1\';'
    +'on=!on;'
    +'el.setAttribute(\'data-on\',on?\'1\':\'0\');'
    +'el.style.background=on?\'var(--primary)\':\'var(--border)\';'
    +'el.querySelector(\'.acc-tog-thumb\').style.left=on?\'22px\':\'2px\';'
    +'document.getElementById(\'acc-include\').value=on?\'1\':\'0\';'
    +'})(this)';
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--surface2);border-radius:12px;margin-top:4px">'
    +'<div>'
      +'<div style="font-size:14px;font-weight:600;color:var(--text)">Incluir en balance total</div>'
      +'<div style="font-size:12px;color:var(--text3);margin-top:2px">Esta cuenta se suma al patrimonio neto</div>'
    +'</div>'
    +'<div data-on="'+(checked?'1':'0')+'" onclick="'+onTap+'" style="position:relative;width:44px;height:24px;border-radius:24px;background:'+(checked?'var(--primary)':'var(--border)')+';cursor:pointer;flex-shrink:0;transition:background .2s">'
      +'<div class="acc-tog-thumb" style="position:absolute;left:'+(checked?'22':'2')+'px;top:2px;width:20px;height:20px;background:#fff;border-radius:50%;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>'
    +'</div>'
    +'<input type="hidden" id="acc-include" value="'+(checked?'1':'0')+'">'
    +'</div>';
}

function renderFormCuenta(){
  var data=S._fcData||{};
  var grpId=data.grpId||'';
  var subId=data.subId||'';
  var accId=data.id||'';
  var step=data.step||1;
  var acc=accId?S.accounts.find(function(a){return a.id===accId;}):null;
  var grp=ACC_GROUPS.find(function(g){return g.id===grpId;})||ACC_GROUPS[0];
  var sub=subId?grp.subs.find(function(s){return s.id===subId;}):null;
  var grpColor=grp.color||'#00D4AA';

  // Cuentas sin pasos (simples) — solo TC y préstamo son multipantalla
  var isSimple=(grpId==='efectivo'||grpId==='virtual'||grpId==='inversion'||grpId==='bien'||grpId==='informal');

  // Definir pasos por tipo
  var stepDefs=fcGetSteps(grpId);
  var totalSteps=isSimple?1:stepDefs.length+1; // +1 = revisión

  // Si no hay subId y el grupo tiene múltiples, mostrar selector
  if(!subId&&grp.subs.length>1){
    var btns='';
    grp.subs.forEach(function(s){
      var oc='openFormCuenta(\''+grpId+'\',\''+s.id+'\')';
      btns+='<button onclick="'+oc+'" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--surface);border:1px solid '+grpColor+'44;border-radius:14px;cursor:pointer;font-family:var(--font);text-align:left;width:100%;margin-bottom:8px">'
        +'<div style="width:44px;height:44px;border-radius:11px;background:'+grpColor+'22;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+s.icon+'</div>'
        +'<div style="flex:1"><div style="font-size:14px;font-weight:700;color:var(--text)">'+s.label+'</div></div>'
        +'<span style="color:var(--text3);font-size:20px">&#8250;</span>'
        +'</button>';
    });
    return '<div style="padding:4px 0 12px;text-align:center">'
        +'<div style="font-size:17px;font-weight:800;color:var(--text)">'+fcGroupTitle(grpId)+'</div>'
      +'</div>'
      +'<div style="display:flex;flex-direction:column">'+btns+'</div>';
  }

  if(!sub&&grp.subs.length===1)sub=grp.subs[0];
  if(!subId&&sub)subId=sub.id;

  var html='<div style="padding-bottom:32px">';

  // ── Progreso (si multipantalla) ────────────────────────
  if(!isSimple&&totalSteps>1){
    var isReview=step>stepDefs.length;
    var displayStep=isReview?totalSteps:step;
    html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:20px">';
    for(var i=1;i<=totalSteps;i++){
      var active=i===displayStep;
      var done=i<displayStep;
      html+='<div style="flex:1;height:5px;border-radius:3px;background:'+(done?'var(--primary)':active?'var(--primary)':'var(--border)')+';transition:.3s"></div>';
    }
    html+='</div>';
    var stepLabel=isReview?'Revisar y confirmar':(stepDefs[step-1]?stepDefs[step-1].label:'');
    html+='<div style="font-size:12px;color:var(--text3);margin-bottom:6px">Paso '+displayStep+' de '+totalSteps+'</div>';
    html+='<div style="font-size:17px;font-weight:800;color:var(--text);margin-bottom:16px">'+stepLabel+'</div>';
  } else {
    // Banner simple
    html+='<div style="display:flex;align-items:center;gap:12px;background:'+grpColor+'14;border:1px solid '+grpColor+'40;border-radius:14px;padding:14px 16px;margin-bottom:20px">'
      +'<div style="width:48px;height:48px;border-radius:13px;background:'+grpColor+'22;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">'+(sub?sub.icon:grp.icon)+'</div>'
      +'<div><div style="font-size:15px;font-weight:800;color:var(--text)">'+(sub?sub.label:grp.label)+'</div>'
      +'<div style="font-size:12px;color:var(--text3);margin-top:2px">'+grp.label+' \xb7 '+(grp.type==='activo'?'Activo':'Pasivo')+'</div></div>'
      +'</div>';
  }

  html+='<input type="hidden" id="fc-id" value="'+(acc?acc.id||'':'')+'">'
    +'<input type="hidden" id="fc-grpid" value="'+grpId+'">'
    +'<input type="hidden" id="fc-subid" value="'+subId+'">';

  // ── Contenido del paso ─────────────────────────────────
  var isReview=(!isSimple)&&step>stepDefs.length;
  if(isReview){
    html+=fcBuildReview(grpId,subId,acc);
  } else {
    var stepIdx=isSimple?-1:(step-1);
    html+=fcBuildStepContent(grpId,subId,acc,stepIdx,isSimple);
  }

  // ── Botones de navegación (sticky bottom) ──────────────
  var btns='';
  if(isSimple){
    btns+=(acc?'<button onclick="deleteAccountFC()" style="flex:1;padding:13px 8px;border-radius:50px;border:1px solid var(--danger);background:transparent;color:var(--danger);font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Eliminar</button>':'');
    btns+='<button onclick="saveAccountFC()" style="flex:1;padding:13px 8px;border-radius:50px;background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:white;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Guardar</button>';
  } else if(isReview){
    var hasAcc=acc&&!acc.protected;
    var btnBase='padding:13px 8px;border-radius:50px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font);flex:1';
    btns='<button onclick="fcBack()" style="'+btnBase+';border:1px solid var(--border);background:transparent;color:var(--text2)">Atrás</button>'
      +'<button onclick="saveAccountFC()" style="'+btnBase+';background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:white">'+(acc?'Guardar':'Crear')+'</button>'
      +(hasAcc?'<button onclick="deleteAccountFC()" style="'+btnBase+';border:1px solid var(--danger);background:transparent;color:var(--danger)">Eliminar</button>':'');
  } else {
    btns+=(step>1?'<button onclick="fcBack()" style="flex:1;padding:13px 8px;border-radius:50px;border:1px solid var(--border);background:transparent;color:var(--text2);font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Atrás</button>':'');
    btns+='<button onclick="fcNext()" style="flex:1;padding:13px 8px;border-radius:50px;background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:white;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Siguiente</button>';
  }
  html+='<div style="height:calc(var(--nav-h) + 76px)"></div></div>'
    +'<div style="position:fixed;bottom:calc(var(--nav-h) + 8px);left:0;right:0;background:var(--bg);padding:10px 16px;display:flex;gap:8px;z-index:55;box-shadow:0 -1px 0 var(--border)">'
    +btns
    +'</div>';
  return html;
}

function fcGroupTitle(grpId){
  var t={tc:'Elige la franquicia de tu TC',prestamo:'Elige el cr\u00e9dito a registrar',informal:'Elige la deuda a registrar'};
  return t[grpId]||'Elige la cuenta a registrar';
}

function fcGetSteps(grpId){
  var steps={
    virtual:[
      {label:'Informaci\u00f3n b\u00e1sica'},
      {label:'Saldo y ajustes'}
    ],
    banco:[
      {label:'Datos de la cuenta'}
    ],
    inversion:[
      {label:'Informaci\u00f3n b\u00e1sica'},
      {label:'Detalles de inversi\u00f3n'}
    ],
    bien:[
      {label:'Informaci\u00f3n b\u00e1sica'},
      {label:'Valor del bien'}
    ],
    tc:[
      {label:'Informaci\u00f3n b\u00e1sica'},
      {label:'L\u00edmites y costos'},
      {label:'Fechas y alertas'}
    ],
    prestamo:[
      {label:'Informaci\u00f3n b\u00e1sica'},
      {label:'Condiciones del cr\u00e9dito'},
      {label:'Pagos y seguimiento'}
    ],
    informal:[
      {label:'Datos del acreedor'},
      {label:'Detalles de la deuda'}
    ]
  };
  return steps[grpId]||[];
}

function fcBuildStepContent(grpId,subId,acc,stepIdx,isSimple){
  var f=fcGetField;
  var defCur=f('fc-currency',acc?acc.currency:S.currency);
  var defBank=f('fc-bank',acc?acc.bankEntity||'':'');
  var curHtml='<div class="form-group"><label class="form-label">Moneda</label>'
    +'<input type="hidden" id="fc-currency" value="'+defCur+'">'
    +'<div class="bs-trigger" onclick="showBS_fcCurrency()">'
      +'<div id="fc-currency-lbl" style="display:flex;align-items:center;gap:4px">'+buildCurTriggerLabel(defCur)+'</div>'
      +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
    +'</div></div>';
  var banksList=defCur==='COP'?BANKS_COP:BANKS_PLN;
  var defBankName=defBank?(function(){var b=banksList.find(function(x){return x.id===defBank;});return b?b.abbr+' \xb7 '+b.name:defBank;})():'';
  var bankHtml='<div class="form-group"><label class="form-label">Entidad financiera <span style="color:var(--text3);font-weight:400">(opcional)</span></label>'
    +'<input type="hidden" id="fc-bank" value="'+defBank+'">'
    +'<div class="bs-trigger" onclick="showBS_fcBank()">'
      +'<span id="fc-bank-lbl" style="color:'+(defBank?'var(--text)':'var(--text3)')+';font-size:14px">'+(defBankName||'Sin entidad')+'</span>'
      +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
    +'</div></div>';
  var defBal=f('fc-balance',acc&&acc.initialBalance?fmtRTLValue(acc.initialBalance,defCur):'');
  var balLabel=(function(){var m={tc:'Saldo actual (deuda)',prestamo:'Saldo pendiente actual',informal:'Saldo actual (deuda)'};return m[grpId]||'Balance inicial';})();
  var balHtml='<div class="form-group"><label class="form-label">'+balLabel+'</label>'
    +'<input class="form-input" type="text" inputmode="numeric" id="fc-balance" placeholder="0,00" oninput="numInputFC(this)" style="text-align:right" value="'+defBal+'">'
    +'</div>';

  // ── BANCO (pantalla única con todos los campos) ──────
  if(grpId==='banco'){
    var nm=f('fc-name',acc?acc.name:'');
    var digits=f('fc-digits',acc?acc.lastDigits||'':'');
    var tae=f('fc-tae',acc?acc.tae?String(acc.tae.toFixed(2))+'%':'':'');
    var bankPH={corriente:'Mi cuenta corriente',ahorros:'Mi cuenta de ahorros',ahorro:'Mi cuenta de ahorros',nomina:'Mi cuenta nómina',cdts:'Mi CDT',cheques:'Mi cuenta de cheques',fiduciaria:'Mi fiduciaria',nequi:'Mi Nequi',daviplata:'Mi Daviplata'};
    var bankPlaceholder=bankPH[subId]||'Mi cuenta bancaria';
    return '<div class="form-group"><label class="form-label">Nombre de la cuenta</label>'
      +'<input class="form-input" type="text" id="fc-name" placeholder="Ej: '+bankPlaceholder+'" value="'+nm+'"></div>'
      +curHtml
      +bankHtml
      +'<div class="form-group"><label class="form-label">Últimos 4 dígitos <span style="color:var(--text3);font-weight:400">(opcional)</span></label>'
      +'<div style="font-size:11px;color:var(--text3);margin-bottom:6px">🔒 Por seguridad ingresa solo los últimos 4 dígitos</div>'
      +'<input class="form-input" type="text" id="fc-digits" placeholder="Ej: 4521" maxlength="4" value="'+digits+'"></div>'
      +balHtml
      +'<div class="form-group"><label class="form-label">Tasa de interés (%) <span style="color:var(--text3);font-weight:400">(opcional)</span></label>'
      +'<input class="form-input" type="text" inputmode="decimal" oninput="pctInput(this)" style="text-align:right" id="fc-tae" placeholder="0.00%" value="'+tae+'"></div>'
      +buildAccToggleHTML(acc);
  }

  // ── EFECTIVO y otros tipos simples ───────────────────
  if(isSimple){
    var nm=f('fc-name',acc?acc.name:(grpId==='efectivo'?'Efectivo':''));
    return '<div class="form-group"><label class="form-label">Nombre de la cuenta</label>'
      +'<input class="form-input" type="text" id="fc-name" '
      +(grpId==='efectivo'?'readonly style="opacity:.7;cursor:default" ':'')
      +'placeholder="Mi cuenta de efectivo" value="'+nm+'">'
      +'</div>'
      +curHtml+balHtml
      +buildAccToggleHTML(acc);
  }

  // ── VIRTUAL ──────────────────────────────────────────
  if(grpId==='virtual'){
    if(stepIdx===0){
      var nm=f('fc-name',acc?acc.name:'');
      var virtualPH={paypal:'Mi cuenta PayPal',wise:'Mi cuenta Wise',payoneer:'Mi cuenta Payoneer',skrill:'Mi cuenta Skrill',revolut:'Mi cuenta Revolut',digital:'Mi billetera digital'};
      var virtualPlaceholder=virtualPH[subId]||'Mi billetera digital';
      return '<div class="form-group"><label class="form-label">Nombre de la cuenta</label>'
        +'<input class="form-input" type="text" id="fc-name" placeholder="Ej: '+virtualPlaceholder+'" value="'+nm+'"></div>'
        +curHtml;
    }
    if(stepIdx===1){ return balHtml+buildAccToggleHTML(acc); }
  }


  // ── INVERSIÓN ────────────────────────────────────────
  if(grpId==='inversion'){
    if(stepIdx===0){
      var nm=f('fc-name',acc?acc.name:'');
      var broker=f('fc-broker',acc?acc.broker||'':'');
      var invPH={broker:'Mi portafolio de acciones',fondo:'Mi fondo de inversión',cdt:'Mi CDT',etf:'Mi ETF',cripto:'Mi cartera cripto',pension:'Mi pensión voluntaria',inv_otro:'Mi inversión'};
      var invPlaceholder=invPH[subId]||'Mi inversión';
      return '<div class="form-group"><label class="form-label">Nombre de la cuenta</label>'
        +'<input class="form-input" type="text" id="fc-name" placeholder="Ej: '+invPlaceholder+'" value="'+nm+'"></div>'
        +curHtml
        +'<div class="form-group"><label class="form-label">Plataforma / Broker <span style="color:var(--text3);font-weight:400">(opcional)</span></label>'
        +'<input class="form-input" type="text" id="fc-broker" placeholder="Ej: Mi broker principal" value="'+broker+'"></div>';
    }
    if(stepIdx===1){
      var tae=f('fc-tae',acc?acc.tae||'':'');
      return balHtml
        +'<div class="form-group"><label class="form-label">Rendimiento esperado (%) <span style="color:var(--text3);font-weight:400">(anual)</span></label>'
        +'<input class="form-input" type="text" inputmode="decimal" oninput="pctInput(this)" style="text-align:right" id="fc-tae" placeholder="0.00%" value="'+tae+'"></div>'
        +buildAccToggleHTML(acc);
    }
  }

  // ── BIENES ───────────────────────────────────────────
  if(grpId==='bien'){
    if(stepIdx===0){
      var nm=f('fc-name',acc?acc.name:'');
      var bienPH={inmueble:'Mi inmueble',vehiculo:'Mi vehículo',bien_otro:'Mi bien'};
      var bienPlaceholder=bienPH[subId]||'Mi bien';
      return '<div class="form-group"><label class="form-label">Nombre del bien</label>'
        +'<input class="form-input" type="text" id="fc-name" placeholder="Ej: '+bienPlaceholder+'" value="'+nm+'"></div>'
        +curHtml;
    }
    if(stepIdx===1){
      var val=f('fc-value',acc?fmtRTLValue(acc.assetValue||0,defCur):'');
      var yr=f('fc-year',acc?acc.acquireYear||'':'');
      return '<div class="form-group"><label class="form-label">Valor estimado actual</label>'
        +'<input class="form-input" type="text" inputmode="numeric" id="fc-value" placeholder="0,00" oninput="numInputFC(this)" style="text-align:right" value="'+val+'"></div>'
        +'<div class="form-group"><label class="form-label">Año de adquisición</label>'
        +'<input class="form-input" type="number" id="fc-year" placeholder="Ej: 2020" value="'+yr+'"></div>'
        +buildAccToggleHTML(acc);
    }
  }

  // ── TARJETA DE CRÉDITO ───────────────────────────────
  if(grpId==='tc'){
    if(stepIdx===0){
      var nm=f('fc-name',acc?acc.name:'');
      var digits=f('fc-digits',acc?acc.lastDigits||'':'');
      var subInfo=getSubInfo(subId);
      var fran=subInfo?subInfo.sub.label:'';
      return '<div style="display:flex;align-items:center;gap:10px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:12px;padding:12px;margin-bottom:16px">'
        +'<span style="font-size:22px">'+((subInfo&&subInfo.sub.icon)||'💳')+'</span>'
        +'<div><div style="font-size:13px;font-weight:700;color:var(--text)">'+fran+'</div><div style="font-size:11px;color:var(--text3)">Tarjeta de crédito</div></div></div>'
        +'<div class="form-group"><label class="form-label">Nombre de la tarjeta</label>'
        +'<input class="form-input" type="text" id="fc-name" placeholder="Ej: Mi tarjeta principal" value="'+nm+'"></div>'
        +curHtml+bankHtml
        +'<div class="form-group"><label class="form-label">Últimos 4 dígitos <span style="color:var(--text3);font-weight:400">(opcional)</span></label>'
        +'<div style="font-size:11px;color:var(--text3);margin-bottom:6px">🔒 Por seguridad ingresa solo los últimos 4 dígitos</div>'
        +'<input class="form-input" type="text" id="fc-digits" placeholder="Ej: 8765" maxlength="4" value="'+digits+'"></div>';
    }
    if(stepIdx===1){
      var lim=f('fc-tc-limit',acc?fmtRTLValue(acc.tcLimit||0,defCur):'');
      var tae=f('fc-tae',acc?acc.tae||'':'');
      return balHtml
        +'<div class="form-group"><label class="form-label">Límite de cupo</label>'
        +'<input class="form-input" type="text" inputmode="numeric" id="fc-tc-limit" placeholder="0,00" oninput="numInputFC(this)" style="text-align:right" value="'+lim+'"></div>'
        +'<div class="form-group"><label class="form-label">Tasa de interés anual (TAE %)</label>'
        +'<input class="form-input" type="text" inputmode="decimal" oninput="pctInput(this)" style="text-align:right" id="fc-tae" placeholder="0.00%" value="'+tae+'"></div>';
    }
    if(stepIdx===2){
      var defCut=f('fc-cut',acc?String(acc.cutDate||''):'');
      var defPay=f('fc-paydate',acc?String(acc.paymentDate||''):'');
      var defRatio=f('fc-ratio',acc?String(acc.utilizationRatio||30):'30');
      var defNotif=f('fc-ratio-notif',acc?(acc.utilizationNotif?'1':'0'):'1');
      return '<div class="form-row">'
        +'<div class="form-group"><label class="form-label">Día de corte</label>'
          +'<input type="hidden" id="fc-cut" value="'+defCut+'">'
          +'<div class="bs-trigger" onclick="showBS_fcDay(\'fc-cut\',\'fc-cut-lbl\',\'Día de corte\')">'
            +'<span id="fc-cut-lbl" style="color:'+(defCut?'var(--text)':'var(--text3)')+';font-size:14px">'+(defCut?'Día '+defCut:'Seleccionar día')+'</span>'
            +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
          +'</div></div>'
        +'<div class="form-group"><label class="form-label">Día de pago</label>'
          +'<input type="hidden" id="fc-paydate" value="'+defPay+'">'
          +'<div class="bs-trigger" onclick="showBS_fcDay(\'fc-paydate\',\'fc-paydate-lbl\',\'Día de pago\')">'
            +'<span id="fc-paydate-lbl" style="color:'+(defPay?'var(--text)':'var(--text3)')+';font-size:14px">'+(defPay?'Día '+defPay:'Seleccionar día')+'</span>'
            +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
          +'</div></div>'
        +'</div>'
        +'<div class="form-group" style="margin-top:8px">'
          +'<label class="form-label">Ratio de utilización recomendado</label>'
          +'<div style="font-size:11px;color:var(--text3);margin-bottom:10px">Se recomienda no superar el 30% del cupo disponible</div>'
          +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
            +'<span style="font-size:13px;color:var(--text2)">0%</span>'
            +'<span id="fc-ratio-lbl" style="font-size:16px;font-weight:800;color:var(--primary)">'+defRatio+'%</span>'
            +'<span style="font-size:13px;color:var(--text2)">100%</span>'
          +'</div>'
          +'<input type="range" id="fc-ratio" min="0" max="100" step="5" value="'+defRatio+'" '
          +'oninput="document.getElementById(\'fc-ratio-lbl\').textContent=this.value+\'%\'" '
          +'style="width:100%;accent-color:var(--primary);cursor:pointer">'
        +'</div>'
        +'<div style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);margin-top:8px">'
          +'<div style="flex:1"><div style="font-size:14px;font-weight:600">Notificar al superar el ratio</div>'
          +'<div style="font-size:12px;color:var(--text2);margin-top:2px">Recibir alerta cuando tu uso supere el límite configurado</div></div>'
          +'<div onclick="toggleFcRatioNotif(this)" id="fc-ratio-notif" data-on="'+defNotif+'" style="width:44px;height:24px;border-radius:12px;background:'+(defNotif==='1'?'var(--primary)':'var(--border)')+';cursor:pointer;position:relative;flex-shrink:0">'
            +'<div style="width:20px;height:20px;border-radius:50%;background:white;position:absolute;top:2px;'+(defNotif==='1'?'right:2px':'left:2px')+';box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>'
          +'</div></div>'
        +buildAccToggleHTML(acc);
    }
  }

  // ── PRÉSTAMOS / CRÉDITO ──────────────────────────────
  if(grpId==='prestamo'){
    if(stepIdx===0){
      var nm=f('fc-name',acc?acc.name:'');
      var loanPlaceholders={hipoteca:'Mi crédito hipotecario',vehiculo_d:'Mi crédito de vehículo',consumo:'Mi crédito de consumo',personal:'Mi préstamo personal',micro:'Mi microcrédito',educativo:'Mi crédito educativo',empresarial:'Mi crédito empresarial'};
      var loanPH=loanPlaceholders[subId]||'Mi crédito';
      return '<div class="form-group"><label class="form-label">Nombre del crédito</label>'
        +'<input class="form-input" type="text" id="fc-name" placeholder="Ej: '+loanPH+'" value="'+nm+'"></div>'
        +curHtml+bankHtml;
    }
    if(stepIdx===1){
      var total=f('fc-credit-total',acc?fmtRTLValue(acc.creditTotal||0,defCur):'');
      var tae=f('fc-tae',acc?String(acc.tae||''):'');
      var termYears=f('fc-term-years',acc?String(acc.termYears||''):'');
      var termMonths=f('fc-term-months',acc?String(acc.termMonths||''):'');
      var disbDate=f('fc-disb-date',acc?acc.disbDate||'':'');
      var endDate=f('fc-end-date',acc?acc.endDate||'':'');
      var capFreq=f('fc-cap-freq',acc?acc.capFreq||'mensual':'mensual');
      var payFreq=f('fc-pay-freq',acc?acc.payFreq||'mensual':'mensual');
      var capFreqN={mensual:12,trimestral:4,semestral:2,anual:1};
      var n=capFreqN[capFreq]||12;
      var taeNum=parseFloat(String(tae).replace('%','').replace(',','.'))||0;
      var temStr=taeNum>0?((Math.pow(1+taeNum/100,1/n)-1)*100).toFixed(2)+'%':'—';
      var capFreqOpts=[{val:'mensual',label:'Mensual'},{val:'trimestral',label:'Trimestral'},{val:'semestral',label:'Semestral'},{val:'anual',label:'Anual'}];
      var payFreqOpts=[{val:'mensual',label:'Mensual'},{val:'quincenal',label:'Quincenal'},{val:'semanal',label:'Semanal'}];
      var capLabel=capFreqOpts.find(function(x){return x.val===capFreq;})||capFreqOpts[0];
      var payLabel=payFreqOpts.find(function(x){return x.val===payFreq;})||payFreqOpts[0];
      return '<div class="form-group"><label class="form-label">Monto del préstamo</label>'
        +'<input class="form-input" type="text" inputmode="numeric" id="fc-credit-total" placeholder="0,00" oninput="numInputFC(this)" style="text-align:right" value="'+total+'"></div>'
        +'<div class="form-row">'
          +'<div class="form-group"><label class="form-label">Plazo en años</label>'
            +'<input class="form-input" type="number" id="fc-term-years" placeholder="Ej: 5" min="1" max="30" value="'+termYears+'" oninput="fcUpdateLoanCalc()"></div>'
          +'<div class="form-group"><label class="form-label">Plazo en meses</label>'
            +'<input class="form-input" type="text" id="fc-term-months" placeholder="Auto" readonly style="background:var(--surface2);opacity:.8" value="'+termMonths+'"></div>'
        +'</div>'
        +'<div class="form-row">'
          +'<div class="form-group"><label class="form-label">Fecha desembolso</label>'
            +'<input class="form-input" type="date" id="fc-disb-date" value="'+disbDate+'" oninput="fcUpdateLoanCalc()"></div>'
          +'<div class="form-group"><label class="form-label">Fecha finalización</label>'
            +'<input class="form-input" type="text" id="fc-end-date-display" readonly style="background:var(--surface2);opacity:.8" value="'+(endDate?fmtDate(endDate):'Auto')+'">'
            +'<input type="hidden" id="fc-end-date" value="'+endDate+'"></div>'
        +'</div>'
        // TAE + TEM en la misma fila
        +'<div class="form-row">'
          +'<div class="form-group"><label class="form-label">TAE (%)</label>'
            +'<input class="form-input" type="text" inputmode="decimal" oninput="pctInput(this);fcUpdateLoanCalc()" style="text-align:right" id="fc-tae" placeholder="0.00%" value="'+tae+'"></div>'
          +'<div class="form-group"><label class="form-label">TEM (calculada)</label>'
            +'<input class="form-input" type="text" id="fc-tem-display" readonly style="background:var(--surface2);opacity:.9;text-align:right;font-weight:700;color:var(--primary)" value="'+temStr+'"></div>'
        +'</div>'
        +'<div class="form-row">'
          +'<div class="form-group"><label class="form-label">Frecuencia capitalización</label>'
            +'<input type="hidden" id="fc-cap-freq" value="'+capFreq+'">'
            +'<div class="bs-trigger" onclick="showBS_fcFreq(\'fc-cap-freq\',\'fc-cap-freq-lbl\',\'Capitalización\',\'cap\')">'
              +'<span id="fc-cap-freq-lbl" style="font-size:14px;color:var(--text)">'+capLabel.label+'</span>'
              +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
            +'</div></div>'
          +'<div class="form-group"><label class="form-label">Frecuencia de pago</label>'
            +'<input type="hidden" id="fc-pay-freq" value="'+payFreq+'">'
            +'<div class="bs-trigger" onclick="showBS_fcFreq(\'fc-pay-freq\',\'fc-pay-freq-lbl\',\'Pago\',\'pay\')">'
              +'<span id="fc-pay-freq-lbl" style="font-size:14px;color:var(--text)">'+payLabel.label+'</span>'
              +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
            +'</div></div>'
        +'</div>';
    }
    if(stepIdx===2){
      var defPay=f('fc-paydate',acc?String(acc.paymentDate||''):'');
      var monthly=f('fc-monthly',acc?fmtRTLValue(acc.monthlyPayment||0,defCur):'');
      // Próximo pago calculado desde fecha desembolso + día de pago
      var disbDate2=f('fc-disb-date',acc?acc.disbDate||'':'');
      var nextPay=fcCalcNextPaymentFromDisb(disbDate2,parseInt(defPay)||0);
      return balHtml
        +'<div class="form-group"><label class="form-label">Cuota pactada <span style="color:var(--text3);font-weight:400">(valor real que pagas)</span></label>'
          +'<input class="form-input" type="text" inputmode="numeric" id="fc-monthly" placeholder="0,00" oninput="numInputFC(this)" style="text-align:right" value="'+monthly+'"></div>'
        +'<div class="form-group"><label class="form-label">Día de pago</label>'
          +'<input type="hidden" id="fc-paydate" value="'+defPay+'">'
          +'<div class="bs-trigger" onclick="showBS_fcDay(\'fc-paydate\',\'fc-paydate-lbl\',\'Día de pago\',true)">'
            +'<span id="fc-paydate-lbl" style="color:'+(defPay?'var(--text)':'var(--text3)')+';font-size:14px">'+(defPay?'Día '+defPay:'Seleccionar día')+'</span>'
            +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
          +'</div></div>'
        +'<div style="background:var(--surface2);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'
          +'<div style="font-size:13px;color:var(--text2);font-weight:600">Próximo pago estimado</div>'
          +'<div id="fc-next-pay-display" style="font-size:14px;font-weight:800;color:var(--primary)">'+nextPay+'</div>'
        +'</div>'
        +buildAccToggleHTML(acc);
    }
  }

  // ── DEUDAS INFORMALES ────────────────────────────────
  if(grpId==='informal'){
    // Siempre isSimple para informal — todos los campos en una pantalla
    var acreedor=f('fc-acreedor',acc?acc.acreedor||'':'');
    var tel=f('fc-tel-acreedor',acc?acc.telAcreedor||'':'');
    var telCode=f('fc-tel-code',acc?acc.telCode||'+57':'+57');
    var email=f('fc-email-acreedor',acc?acc.emailAcreedor||'':'');
    var deadline=f('fc-deadline',acc?acc.deadline||'':'');
    var fotoSrc=f('fc-foto-acreedor',acc?acc.fotoAcreedor||'':'');
    // Generar opciones de indicativo (reutilizar mismo sistema que perfil)
    var phoneMapI={};
    var flagsI={};
    Object.keys(COUNTRY_DATA).forEach(function(name){
      var cd=COUNTRY_DATA[name];
      if(cd.phone&&!phoneMapI[cd.phone]){phoneMapI[cd.phone]=cd.phone;}
    });
    var phoneOptsI='<option value="">Ind.</option>';
    Object.keys(phoneMapI).sort().forEach(function(code){
      phoneOptsI+='<option value="'+code+'"'+(telCode===code?' selected':'')+'>'+code+'</option>';
    });
    return '<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:20px">'
      +'<div onclick="showPhotoSheetAcreedor()" style="width:90px;height:90px;border-radius:50%;background:var(--surface2);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;position:relative" id="fc-acreedor-photo-wrap">'
        +(fotoSrc
          ?'<img src="'+fotoSrc+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%" id="fc-acreedor-img">'
          :'<span style="font-size:36px" id="fc-acreedor-img">👤</span>')
        +'<div style="position:absolute;bottom:0;right:0;width:28px;height:28px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;border:2px solid var(--surface)">'
          +'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>'
        +'</div>'
      +'</div>'
      +'<input type="file" id="fc-acreedor-cam-input" accept="image/*" capture="user" style="display:none" onchange="handleFotoAcreedor(event)">'
      +'<input type="file" id="fc-acreedor-gal-input" accept="image/*" style="display:none" onchange="handleFotoAcreedor(event)">'
      +'<input type="hidden" id="fc-foto-acreedor" value="'+fotoSrc+'">'
      +'<div style="font-size:12px;color:var(--text3);margin-top:8px">Toca para cambiar foto</div>'
      +'</div>'
      +'<div class="form-group"><label class="form-label">Nombre del acreedor <span style="color:var(--danger)">*</span></label>'
        +'<input class="form-input" type="text" id="fc-acreedor" placeholder="Nombre completo" value="'+acreedor+'" oninput="document.getElementById(\'fc-name\').value=this.value"></div>'
      +'<input type="hidden" id="fc-name" value="'+acreedor+'">'
      +'<div class="form-group"><label class="form-label">Teléfono <span style="color:var(--text3);font-weight:400">(opcional)</span></label>'
        +'<div style="display:flex;gap:6px">'
          +'<select class="form-select" id="fc-tel-code" style="width:90px;flex-shrink:0">'+phoneOptsI+'</select>'
          +'<input class="form-input" type="tel" id="fc-tel-acreedor" placeholder="Número de contacto" value="'+tel+'" style="flex:1">'
        +'</div></div>'
      +'<div class="form-group"><label class="form-label">Correo electrónico <span style="color:var(--text3);font-weight:400">(opcional)</span></label>'
        +'<input class="form-input" type="email" id="fc-email-acreedor" placeholder="correo@ejemplo.com" value="'+email+'"></div>'
      +balHtml
      +'<div class="form-group"><label class="form-label">Tasa de interés (%) <span style="color:var(--text3);font-weight:400">(opcional)</span></label>'
        +'<input class="form-input" type="text" inputmode="decimal" oninput="pctInput(this)" style="text-align:right" id="fc-tae" placeholder="0.00%" value="'+(f('fc-tae',acc?acc.tae?acc.tae.toFixed(2)+'%':'' :'')||'')+'"></div>'
      +'<div class="form-group"><label class="form-label">Fecha límite de pago <span style="color:var(--text3);font-weight:400">(opcional)</span></label>'
        +'<input class="form-input" type="date" id="fc-deadline" value="'+deadline+'" max="2099-12-31"></div>'
      +buildAccToggleHTML(acc);
  }

  return '';
}

function toggleFcRatioNotif(el){
  var isOn=el.getAttribute('data-on')==='1';
  var newOn=!isOn;
  el.setAttribute('data-on',newOn?'1':'0');
  el.style.background=newOn?'var(--primary)':'var(--border)';
  var knob=el.querySelector('div');
  if(knob){knob.style.right=newOn?'2px':'';knob.style.left=newOn?'':'2px';}
}

function fcUpdateLoanCalc(){
  var years=parseInt((document.getElementById('fc-term-years')||{}).value)||0;
  var months=years*12;
  var mEl=document.getElementById('fc-term-months');
  if(mEl)mEl.value=months||'';
  // Fecha finalización
  var disbEl=document.getElementById('fc-disb-date');
  var endEl=document.getElementById('fc-end-date');
  var endDispEl=document.getElementById('fc-end-date-display');
  if(disbEl&&disbEl.value&&months>0){
    var d=new Date(disbEl.value);d.setMonth(d.getMonth()+months);
    var isoVal=d.toISOString().slice(0,10);
    if(endEl)endEl.value=isoVal;
    if(endDispEl)endDispEl.value=fmtDate(isoVal);
  } else {
    if(endEl)endEl.value='';
    if(endDispEl)endDispEl.value='Auto';
  }
  // TEM
  var taeEl=document.getElementById('fc-tae');
  var capEl=document.getElementById('fc-cap-freq');
  var temEl=document.getElementById('fc-tem-display');
  if(taeEl&&temEl){
    var capFreq=capEl?capEl.value:'mensual';
    var capN={mensual:12,trimestral:4,semestral:2,anual:1};
    var n=capN[capFreq]||12;
    var taeStr=taeEl.value.replace('%','').replace(',','.');
    var taeNum=parseFloat(taeStr)||0;
    temEl.value=taeNum>0?((Math.pow(1+taeNum/100,1/n)-1)*100).toFixed(2)+'%':'—';
  }
}
function fcCalcNextPaymentFromDisb(disbDate, payDay){
  if(!disbDate||!payDay) return '—';
  try{
    var now=new Date();
    var d=new Date(disbDate);
    // Avanzar mes a mes desde desembolso hasta encontrar el próximo pago futuro
    d.setDate(payDay);
    if(d<=now) d.setMonth(d.getMonth()+1);
    while(d<=now) d.setMonth(d.getMonth()+1);
    return d.toISOString().slice(0,10);
  }catch(e){return '—';}
}

function fcUpdateNextPayment(){
  var dayEl=document.getElementById('fc-paydate');
  var disbDate=fcGetField('fc-disb-date','');
  var dispEl=document.getElementById('fc-next-pay-display');
  if(!dispEl)return;
  var day=dayEl?parseInt(dayEl.value)||0:0;
  dispEl.textContent=fcCalcNextPaymentFromDisb(disbDate,day)||'—';
}

function showBS_fcFreq(inputId,lblId,title,type){
  var current=document.getElementById(inputId)?document.getElementById(inputId).value:'mensual';
  var opts=type==='pay'
    ?[{val:'mensual',label:'Mensual'},{val:'quincenal',label:'Quincenal'},{val:'semanal',label:'Semanal'}]
    :[{val:'mensual',label:'Mensual'},{val:'trimestral',label:'Trimestral'},{val:'semestral',label:'Semestral'},{val:'anual',label:'Anual'}];
  var items=opts.map(function(o){return {val:o.val,label:o.label};});
  showBottomSheet({
    title:'Frecuencia de '+title,items:items,selected:current,searchable:false,
    onSelect:function(val){
      var inp=document.getElementById(inputId);
      var lbl=document.getElementById(lblId);
      var found=opts.find(function(o){return o.val===val;});
      if(inp)inp.value=val;
      if(lbl)lbl.textContent=found?found.label:val;
      fcUpdateLoanCalc();
    }
  });
}

function fcBuildReview(grpId,subId,acc){
  var f=fcGetField;
  var cur=f('fc-currency',S.currency);
  var meta=getCurrencyMeta(cur);
  var sym=meta?meta.sym:cur;
  var grp=ACC_GROUPS.find(function(g){return g.id===grpId;})||ACC_GROUPS[0];
  var sub=subId?grp.subs.find(function(s){return s.id===subId;}):null;
  var bank=f('fc-bank','');
  var blist=cur==='COP'?BANKS_COP:BANKS_PLN;
  var bankObj=bank?blist.find(function(x){return x.id===bank;}):null;
  var subtypeColorR={efectivo:'#10B981',tc:'#7461EF',digital:'#3B82F6',inversion:'#F59E0B',bien:'#8B5CF6',prestamo:'#EF4444',informal:'#EC4899',banco:'#0EA5E9'};
  var grpColor=bankObj?bankObj.color:((grp.color)?grp.color:(subtypeColorR[grp.id]||'#00D4AA'));
  if(!grpColor||grpColor==='undefined')grpColor='#00D4AA';
  function row(label,val){
    if(!val&&val!==0&&val!=='')return '';
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">'
      +'<span style="font-size:13px;color:var(--text2)">'+label+'</span>'
      +'<span style="font-size:14px;font-weight:600;color:var(--text)">'+val+'</span>'
      +'</div>';
  }
  var displayName=grpId==='informal'?f('fc-acreedor',''):f('fc-name','Sin nombre');

  // Tarjeta resumen estilo visual
  var html='<div style="background:linear-gradient(135deg,'+grpColor+','+grpColor+'99);border-radius:18px;padding:18px;margin-bottom:16px">'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">'
      +'<div>'
        +'<div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:600;text-transform:uppercase;letter-spacing:.5px">'+(sub?sub.label:grp.label)+'</div>'
        +'<div style="font-size:18px;font-weight:800;color:white;margin-top:2px">'+displayName+'</div>'
        +(bankObj?'<div style="font-size:11px;color:rgba(255,255,255,.7);margin-top:2px">'+bankObj.name+'</div>':'')
      +'</div>'
      +'<div style="font-size:28px">'+(sub?sub.icon:grp.icon)+'</div>'
    +'</div>'
    +'<div style="font-size:24px;font-weight:800;color:white;margin-bottom:4px">'+cur+' '+sym+'</div>'
    +'</div>';

  // Detalles en grilla 2 columnas
  function cell(label,val){
    if(!val&&val!==0&&val!=='')return '';
    return '<div style="background:var(--surface2);border-radius:10px;padding:10px 12px">'
      +'<div style="font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px">'+label+'</div>'
      +'<div style="font-size:13px;font-weight:700;color:var(--text);word-break:break-word">'+val+'</div>'
      +'</div>';
  }
  // Helper para formatear montos con fmt()
  function fmtVal(raw){ return raw?fmt(parseNumSubs(raw,cur),cur):''; }
  var tae=f('fc-tae','');
  var capFreq=f('fc-cap-freq','');
  var payFreq=f('fc-pay-freq','');
  // TEM solo si hay TAE y es préstamo
  var temStr='';
  if(tae&&grpId==='prestamo'&&capFreq){
    var capN={mensual:12,trimestral:4,semestral:2,anual:1};
    var n=capN[capFreq]||12;
    var taeNum=parseFloat(String(tae).replace('%','').replace(',','.'))||0;
    if(taeNum>0) temStr=((Math.pow(1+taeNum/100,1/n)-1)*100).toFixed(2)+'%';
  }

  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">';

  if(grpId==='tc'){
    var lim=f('fc-tc-limit','');if(lim)html+=cell('Límite de cupo',fmtVal(lim));
    var bal=f('fc-balance','');if(bal)html+=cell('Deuda actual',fmtVal(bal));
    if(tae)html+=cell('TAE',tae);
    var digits=f('fc-digits','');if(digits)html+=cell('Últimos 4','\u2022\u2022\u2022\u2022 '+digits);
    var cut=f('fc-cut','');if(cut)html+=cell('Día de corte','Día '+cut);
    var pay=f('fc-paydate','');if(pay)html+=cell('Día de pago','Día '+pay);
    var ratio=f('fc-ratio','');
    if(ratio)html+='<div style="grid-column:1/-1;background:rgba(116,97,239,.1);border:1px solid rgba(116,97,239,.25);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px">'
      +'<div style="font-size:20px">⚡</div>'
      +'<div>'
        +'<div style="font-size:12px;font-weight:700;color:var(--secondary)">Límite de uso establecido</div>'
        +'<div style="font-size:12px;color:var(--text2);margin-top:2px">Se te notificará cuando el uso de tu tarjeta supere el <strong>'+ratio+'%</strong> del cupo disponible.</div>'
      +'</div>'
      +'</div>';
  } else if(grpId==='prestamo'){
    var total=f('fc-credit-total','');if(total)html+=cell('Monto préstamo',fmtVal(total));
    var bal=f('fc-balance','');if(bal)html+=cell('Saldo pendiente',fmtVal(bal));
    if(tae)html+=cell('TAE',tae);
    if(temStr)html+=cell('TEM',temStr);
    var disbDate=f('fc-disb-date','');if(disbDate)html+=cell('Desembolso',fmtDate(disbDate));
    var endDate=f('fc-end-date','');if(endDate)html+=cell('Finalización',fmtDate(endDate));
    if(payFreq)html+=cell('Frec. pago',payFreq.charAt(0).toUpperCase()+payFreq.slice(1));
    var termM=f('fc-term-months','');if(termM)html+=cell('Plazo',termM+' meses');
    if(capFreq)html+=cell('Capitalización',capFreq.charAt(0).toUpperCase()+capFreq.slice(1));
    var pay=f('fc-paydate','');if(pay)html+=cell('Día de pago','Día '+pay);
    var monthly=f('fc-monthly','');if(monthly)html+=cell('Cuota pactada',fmtVal(monthly));
    var disbDate2=f('fc-disb-date','');
    var nextP=fcCalcNextPaymentFromDisb(disbDate2,parseInt(pay)||0);
    if(nextP&&nextP!=='—')html+=cell('Próximo pago',fmtDate(nextP));
  } else if(grpId==='banco'){
    var bal=f('fc-balance','');if(bal)html+=cell('Balance inicial',fmtVal(bal));
    var digits=f('fc-digits','');if(digits)html+=cell('Últimos 4','\u2022\u2022\u2022\u2022 '+digits);
    if(tae)html+=cell('Tasa banco',tae);
  } else if(grpId==='virtual'){
    var bal=f('fc-balance','');if(bal)html+=cell('Balance inicial',fmtVal(bal));
  } else if(grpId==='inversion'){
    var bal=f('fc-balance','');if(bal)html+=cell('Balance inicial',fmtVal(bal));
    if(tae)html+=cell('Rendimiento esperado',tae);
    var broker=f('fc-broker','');if(broker)html+=cell('Plataforma/Broker',broker);
  } else if(grpId==='bien'){
    var val=f('fc-value','');if(val)html+=cell('Valor estimado',fmtVal(val));
    var yr=f('fc-year','');if(yr)html+=cell('Año adquisición',yr);
  } else if(grpId==='informal'){
    var bal=f('fc-balance','');if(bal)html+=cell('Deuda actual',fmtVal(bal));
    var acreedor=f('fc-acreedor','');if(acreedor)html+=cell('Acreedor',acreedor);
    var tel=f('fc-tel-acreedor','');if(tel)html+=cell('Teléfono',tel);
    var email=f('fc-email-acreedor','');if(email)html+=cell('Correo',email);
  } else {
    // Genérico
    var bal=f('fc-balance','');if(bal)html+=cell('Balance',fmtVal(bal));
  }
  html+='</div>';

  // Tabla de amortización para préstamos
  if(grpId==='prestamo'){
    var totalNum=parseNumSubs(total,cur);
    var monthlyNum=parseNumSubs(monthly,cur);
    var taeNum2=parseFloat(String(tae).replace('%','').replace(',','.'))||0;
    var capFreq2=capFreq||'mensual';
    var payFreq2=payFreq||'mensual';
    var capN2={mensual:12,trimestral:4,semestral:2,anual:1};
    var n2=capN2[capFreq2]||12;
    var termMNum=parseInt(termM)||0;
    if(totalNum>0&&taeNum2>0&&termMNum>0){
      var payPeriods={mensual:12,quincenal:26,semanal:52};
      var periods=payPeriods[payFreq2]||12;
      var rPeriod=Math.pow(1+taeNum2/100,1/periods)-1;
      var nPeriods=payFreq2==='mensual'?termMNum:payFreq2==='quincenal'?Math.round(termMNum/12*26):Math.round(termMNum/12*52);
      // Botón Ver detalles ARRIBA de la tabla
      html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
        +'<div style="font-size:13px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">Amortización</div>'
        +(nPeriods>12?'<button onclick="openAmortizacionFull()" style="padding:8px 16px;border-radius:50px;border:1px solid var(--primary);background:transparent;color:var(--primary);font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font)">Ver detalles</button>':'')
        +'</div>';
      html+='<div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border)">'
        +'<table style="width:100%;border-collapse:collapse;font-size:12px">'
        +'<thead><tr style="background:var(--surface2)">'
          +'<th style="padding:8px 6px;text-align:center;color:var(--text3);font-weight:700">#</th>'
          +'<th style="padding:8px 6px;text-align:right;color:var(--text3);font-weight:700">Cuota</th>'
          +'<th style="padding:8px 6px;text-align:right;color:var(--primary);font-weight:700">Capital</th>'
          +'<th style="padding:8px 6px;text-align:right;color:var(--danger);font-weight:700">Interés</th>'
          +'<th style="padding:8px 6px;text-align:right;color:var(--text3);font-weight:700">Saldo</th>'
        +'</tr></thead><tbody>';
      var saldo=totalNum;
      var cuotaFixed=monthlyNum||((rPeriod*(Math.pow(1+rPeriod,nPeriods)))/(Math.pow(1+rPeriod,nPeriods)-1)*totalNum);
      var preview=Math.min(12,nPeriods);
      for(var i=1;i<=preview;i++){
        var interest=saldo*rPeriod;
        var capital=cuotaFixed-interest;
        if(capital<0)capital=0;
        if(capital>saldo)capital=saldo;
        saldo=Math.max(0,saldo-capital);
        var odd=i%2===0?'background:var(--surface2)':'';
        html+='<tr style="'+odd+'">'
          +'<td style="padding:7px 6px;text-align:center;color:var(--text3)">'+i+'</td>'
          +'<td style="padding:7px 6px;text-align:right;font-weight:600;color:var(--text)">'+fmtC(cuotaFixed,cur)+'</td>'
          +'<td style="padding:7px 6px;text-align:right;color:var(--primary)">'+fmtC(capital,cur)+'</td>'
          +'<td style="padding:7px 6px;text-align:right;color:var(--danger)">'+fmtC(interest,cur)+'</td>'
          +'<td style="padding:7px 6px;text-align:right;color:var(--text2)">'+fmtC(saldo,cur)+'</td>'
          +'</tr>';
      }
      html+='</tbody></table></div>';
    }
  }
  return html;
}

function showPhotoSheetAcreedor(){
  var s=document.createElement('div');
  s.style.cssText='position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;justify-content:flex-end';
  var hasFoto=!!(document.getElementById('fc-foto-acreedor')&&document.getElementById('fc-foto-acreedor').value);
  s.innerHTML='<div style="flex:1;background:rgba(0,0,0,.5)" onclick="this.parentElement.remove()"></div>'
    +'<div style="background:var(--surface);border-radius:16px 16px 0 0;padding:16px;display:flex;flex-direction:column;gap:8px">'
    +'<div style="font-size:11px;font-weight:700;color:var(--text3);text-align:center;padding-bottom:4px">FOTO DE PERFIL</div>'
    +'<button onclick="document.getElementById(\'fc-acreedor-cam-input\').click();this.closest(\'div[style*=fixed]\').remove()" style="width:100%;padding:14px;border-radius:12px;border:none;background:var(--surface2);color:var(--text);font-size:15px;cursor:pointer;font-family:var(--font);text-align:left">📷 Tomar foto</button>'
    +'<button onclick="document.getElementById(\'fc-acreedor-gal-input\').click();this.closest(\'div[style*=fixed]\').remove()" style="width:100%;padding:14px;border-radius:12px;border:none;background:var(--surface2);color:var(--text);font-size:15px;cursor:pointer;font-family:var(--font);text-align:left">🖼️ Elegir de galería</button>'
    +(hasFoto?'<button onclick="removeFotoAcreedor();this.closest(\'div[style*=fixed]\').remove()" style="width:100%;padding:14px;border-radius:12px;border:none;background:rgba(239,68,68,.1);color:var(--danger);font-size:15px;cursor:pointer;font-family:var(--font)">🗑️ Quitar foto</button>':'')
    +'<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="width:100%;padding:14px;border-radius:12px;border:none;background:var(--surface2);color:var(--text2);font-size:15px;cursor:pointer;font-family:var(--font);margin-top:4px">Cancelar</button>'
    +'</div>';
  document.body.appendChild(s);
}
function handleFotoAcreedor(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var src=ev.target.result;
    var hidden=document.getElementById('fc-foto-acreedor');
    if(hidden)hidden.value=src;
    var wrap=document.getElementById('fc-acreedor-photo-wrap');
    if(wrap){
      wrap.innerHTML='<img src="'+src+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%" id="fc-acreedor-img">'
        +'<div style="position:absolute;bottom:0;right:0;width:28px;height:28px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;border:2px solid var(--surface)">'
          +'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>'
        +'</div>';
    }
  };
  reader.readAsDataURL(file);
}
function removeFotoAcreedor(){
  var hidden=document.getElementById('fc-foto-acreedor');
  if(hidden)hidden.value='';
  var wrap=document.getElementById('fc-acreedor-photo-wrap');
  if(wrap)wrap.innerHTML='<span style="font-size:36px" id="fc-acreedor-img">👤</span>'
    +'<div style="position:absolute;bottom:0;right:0;width:28px;height:28px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;border:2px solid var(--surface)">'
      +'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>'
    +'</div>';
}
// Mantener pickFotoAcreedor como alias por compatibilidad
function pickFotoAcreedor(){showPhotoSheetAcreedor();}function saveAccountFC(){
  // Validar que el perfil esté configurado
  var hasProfile=S.profile&&S.profile.name&&S.profile.name.trim()!=='';
  var hasCurrency=S.currencies&&S.currencies.length>0;
  if(!hasProfile||!hasCurrency){
    confirmDialog('⚠️','Configuración incompleta',
      'Para crear una cuenta debes completar tu perfil y configurar al menos una moneda activa en Configuración.',
      function(){navigate('configuracion');}
    );
    return;
  }
  // Guardar campos actuales antes de procesar
  fcSaveStepFields();
  var f=fcGetField;
  var grpId=(document.getElementById('fc-grpid')||{}).value||'';
  var subId=(document.getElementById('fc-subid')||{}).value||'';
  var accId=(document.getElementById('fc-id')||{}).value||'';
  var existing=accId?S.accounts.find(function(a){return a.id===accId;}):null;
  var grp=ACC_GROUPS.find(function(g){return g.id===grpId;});
  if(!grp){toast('Tipo de cuenta no válido');return;}
  var actualSubId=subId||grp.subs[0].id;
  var info=getSubInfo(actualSubId);
  var legacySubtype=grpId==='tc'?'tc':grpId==='prestamo'||grpId==='informal'?'prestamo':grpId==='banco'?'banco':grpId==='efectivo'?'efectivo':grpId==='virtual'?'digital':grpId==='inversion'?'inversion':'activo';
  // Para informal: sincronizar fc-acreedor → fc-name antes de guardar
  if(grpId==='informal'){
    var acrEl=document.getElementById('fc-acreedor');
    var nmEl=document.getElementById('fc-name');
    if(acrEl&&nmEl)nmEl.value=acrEl.value;
  }
  // Nombre: para informal usar fc-acreedor del DOM directamente
  var nameRaw=grpId==='informal'?(document.getElementById('fc-acreedor')||{}).value||f('fc-acreedor',''):f('fc-name','');
  if(!nameRaw.trim()){toast('Ingresa el nombre'+(grpId==='informal'?' del acreedor':' de la cuenta'));return;}
  var cur=f('fc-currency',S.currency)||S.currency;
  var toggleOn=f('fc-ratio-notif','1');
  var accInclude=f('acc-include','1');
  var acc={
    id:existing?existing.id:uid(),
    name:nameRaw.trim(),
    type:grp.type,
    subtype:legacySubtype,
    _grpId:grpId,
    _subId:actualSubId,
    currency:cur,
    bankEntity:f('fc-bank',''),
    initialBalance:parseNumSubs(f('fc-balance','0'),cur),
    icon:(info&&info.sub?info.sub.icon:'💳'),
    color:COLORS_PALETTE[grpId==='tc'?0:grpId==='prestamo'||grpId==='informal'?1:grpId==='banco'?5:grpId==='inversion'?7:grpId==='bien'?14:16],
    subAccounts:existing?existing.subAccounts||[]:[],
    excludeFromTotal:accInclude==='0',
    lastDigits:f('fc-digits',''),
    tae:parseFloat(f('fc-tae',''))||0
  };
  if(grpId==='tc'){
    acc.tcLimit=parseNumSubs(f('fc-tc-limit','0'),cur);
    acc.cutDate=parseInt(f('fc-cut',''))||0;
    acc.paymentDate=parseInt(f('fc-paydate',''))||0;
    acc.utilizationRatio=parseInt(f('fc-ratio','30'))||30;
    acc.utilizationNotif=f('fc-ratio-notif','1')==='1';
  } else if(grpId==='prestamo'){
    acc.creditTotal=parseNumSubs(f('fc-credit-total','0'),cur);
    acc.monthlyPayment=parseNumSubs(f('fc-monthly','0'),cur);
    acc.paymentDate=parseInt(f('fc-paydate',''))||0;
    acc.termYears=parseInt(f('fc-term-years',''))||0;
    acc.termMonths=parseInt(f('fc-term-months',''))||0;
    acc.disbDate=f('fc-disb-date','');
    acc.endDate=f('fc-end-date','');
    acc.capFreq=f('fc-cap-freq','mensual');
    acc.payFreq=f('fc-pay-freq','mensual');
    acc.lastPaymentDate=f('fc-last-payment','');
  } else if(grpId==='informal'){
    acc.creditTotal=parseNumSubs(f('fc-credit-total','0'),cur);
    acc.acreedor=f('fc-acreedor','');
    acc.telAcreedor=f('fc-tel-acreedor','');
    acc.emailAcreedor=f('fc-email-acreedor','');
    acc.fotoAcreedor=f('fc-foto-acreedor','');
    acc.deadline=f('fc-deadline','');
  } else if(grpId==='inversion'){
    acc.broker=f('fc-broker','');
  } else if(grpId==='bien'){
    acc.assetValue=parseNumSubs(f('fc-value','0'),cur);
    acc.acquireYear=parseInt(f('fc-year',''))||0;
  }
  if(existing){
    var idx=S.accounts.findIndex(function(a){return a.id===accId;});
    S.accounts[idx]=stampItem(acc);
  } else {
    S.accounts.push(stampItem(acc));
  }
  saveState();
  S._fcData={};
  S._cuentasGrupo=grpId;
  _navHistory=_navHistory.filter(function(p){return p!=='form-cuenta'&&p!=='cuentas'&&p!=='cuentas-grupo';});
  toast(existing?'Cuenta actualizada ✓':'Cuenta creada ✓');
  navigate('mis-cuentas');
}

function deleteAccountFC(){
  var accId=(document.getElementById('fc-id')||{}).value||'';
  var acc=accId?S.accounts.find(function(a){return a.id===accId;}):null;
  if(!acc){toast('Cuenta no encontrada');return;}
  var cur=acc.currency||S.currency;
  // Verificar si es la última cuenta en esa moneda
  var otherAccounts=S.accounts.filter(function(a){return a.id!==accId&&(a.currency||S.currency)===cur;});
  if(acc.subtype==='efectivo'&&otherAccounts.length===0){
    confirmDialog('⚠️','No se puede eliminar','Esta cuenta no puede ser eliminada. Debes tener mínimo una cuenta creada.',function(){});
    return;
  }
  if(acc.protected){
    confirmDialog('⚠️','No se puede eliminar','Esta cuenta está protegida y no puede ser eliminada.',function(){});
    return;
  }
  var grpId=acc._grpId||'banco';
  confirmDialog('🗑️','Eliminar cuenta','Los movimientos asociados quedarán sin cuenta. ¿Deseas continuar?',function(){
    S.accounts=softDelete(S.accounts,accId);
    saveState();
    S._fcData={};
    S._cuentasGrupo=grpId;
    _navHistory=_navHistory.filter(function(p){return p!=='form-cuenta'&&p!=='cuentas'&&p!=='cuentas-grupo';});
    toast('Cuenta eliminada');
    navigate('mis-cuentas');
  });
}

// ════════════════════════════════════════════════════════════
// SUSCRIPCIONES
// ════════════════════════════════════════════════════════════
var SUBS_CATS=[
  {id:'entretenimiento', label:'Entretenimiento', icon:'🎬'},
  {id:'musica',          label:'Música',          icon:'🎵'},
  {id:'gaming',          label:'Gaming',          icon:'🎮'},
  {id:'productividad',   label:'Productividad',   icon:'💼'},
  {id:'educacion',       label:'Educación',       icon:'📚'},
  {id:'salud',           label:'Salud',           icon:'🏥'},
  {id:'hogar',           label:'Hogar',           icon:'🏠'},
  {id:'noticias',        label:'Noticias',        icon:'📰'},
  {id:'almacenamiento',  label:'Almacenamiento',  icon:'☁️'},
  {id:'otro',            label:'Otro',            icon:'📦'}
];

function renderSuscripciones(){
  if(!S.subscriptions)S.subscriptions=[];
  var subs=filterDeleted(S.subscriptions);
  var cur=S.currency;

  // Calcular total mensual
  var totalMes=subs.filter(function(s){return s.estado!=='pausada';}).reduce(function(acc,s){
    if(!s.monto)return acc;
    var m=parseFloat(s.monto)||0;
    if(s.ciclo==='anual')m=m/12;
    else if(s.ciclo==='semestral')m=m/6;
    else if(s.ciclo==='trimestral')m=m/3;
    else if(s.ciclo==='bimensual')m=m/2;
    else if(s.ciclo==='quincenal')m=m*2;
    else if(s.ciclo==='semanal')m=m*4.33;
    else if(s.ciclo==='diario')m=m*30;
    return acc+m;
  },0);

  // Próximas a vencer (dentro de 7 días)
  var hoy=new Date();
  var proximas=subs.filter(function(s){
    if(!s.diaCobro||s.estado==='pausada')return false;
    var d=new Date(hoy.getFullYear(),hoy.getMonth(),parseInt(s.diaCobro));
    if(d<hoy)d.setMonth(d.getMonth()+1);
    return Math.round((d-hoy)/86400000)<=7;
  }).length;

  var html='';

  // Resumen header
  html+='<div style="background:linear-gradient(135deg,rgba(0,212,170,.1),rgba(116,97,239,.08));border:1px solid rgba(0,212,170,.2);border-radius:16px;padding:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">'
    +'<div>'
      +'<div style="font-size:12px;color:var(--text3);margin-bottom:2px">Total mensual activo</div>'
      +'<div style="font-size:24px;font-weight:800;color:var(--primary)">'+fmt(totalMes,cur)+'</div>'
    +'</div>'
    +(proximas>0?'<div style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);border-radius:12px;padding:8px 14px;text-align:center">'
      +'<div style="font-size:20px">🔔</div>'
      +'<div style="font-size:11px;font-weight:700;color:var(--danger)">'+proximas+' vence'+(proximas>1?'n':'')+' esta semana</div>'
    +'</div>':'')
    +'</div>';

  html+='<div style="display:flex;justify-content:flex-end;margin-bottom:16px">'
    +'<button class="btn btn-primary btn-sm" onclick="openSubsModal({})">+ Nueva suscripción</button>'
    +'</div>';

  if(!subs.length){
    html+='<div class="empty-state"><div class="empty-icon">🔁</div>'
      +'<div class="empty-title">Sin suscripciones</div>'
      +'<div class="empty-desc">Registra tus servicios recurrentes</div></div>';
    return html;
  }

  // Agrupar por categoría
  var groups={};
  subs.forEach(function(s){
    var cat=s.categoria||'otro';
    if(!groups[cat])groups[cat]=[];
    groups[cat].push(s);
  });

  Object.keys(groups).forEach(function(catId){
    var catInfo=SUBS_CATS.find(function(c){return c.id===catId;})||{label:catId,icon:'📦'};
    var catSubs=groups[catId];
    var catTotal=catSubs.filter(function(s){return s.estado!=='pausada';}).reduce(function(acc,s){
      var m=parseFloat(s.monto)||0;
      if(s.ciclo==='anual')m=m/12;
      if(s.ciclo==='semanal')m=m*4.33;
      return acc+(s.estado==='pausada'?0:m);
    },0);

    html+='<div style="margin-bottom:20px">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
        +'<span style="font-size:16px">'+catInfo.icon+'</span>'
        +'<span style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">'+catInfo.label+'</span>'
        +'<span style="margin-left:auto;font-size:12px;color:var(--text3)">'+fmt(catTotal,cur)+'/mes</span>'
      +'</div>';

    catSubs.forEach(function(s){
      var hoy=new Date();
      var dias=null;
      if(s.diaCobro){
        var d=new Date(hoy.getFullYear(),hoy.getMonth(),parseInt(s.diaCobro));
        if(d<hoy)d.setMonth(d.getMonth()+1);
        dias=Math.round((d-hoy)/86400000);
      }
      var pausada=s.estado==='pausada';
      var montoMes=parseFloat(s.monto)||0;
      if(s.ciclo==='anual')montoMes=montoMes/12;
      else if(s.ciclo==='semestral')montoMes=montoMes/6;
      else if(s.ciclo==='trimestral')montoMes=montoMes/3;
      else if(s.ciclo==='bimensual')montoMes=montoMes/2;
      else if(s.ciclo==='quincenal')montoMes=montoMes*2;
      else if(s.ciclo==='semanal')montoMes=montoMes*4.33;
      else if(s.ciclo==='diario')montoMes=montoMes*30;
      var urgente=!pausada&&dias!==null&&dias<=3;

      html+='<div onclick="openSubsModal({id:\''+s.id+'\'})" style="'
        +'background:var(--surface);border:1px solid '+(urgente?'var(--danger)':'var(--border)')+';'
        +'border-radius:14px;padding:14px 16px;margin-bottom:8px;cursor:pointer;'
        +'opacity:'+(pausada?'0.6':'1')+'">'
        +'<div style="display:flex;align-items:center;gap:12px">'
          +'<div style="width:44px;height:44px;border-radius:12px;background:rgba(0,212,170,.12);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+catInfo.icon+'</div>'
          +'<div style="flex:1;min-width:0">'
            +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">'
              +'<span style="font-size:14px;font-weight:700;color:var(--text)">'+s.nombre+'</span>'
              +(pausada?'<span style="font-size:10px;background:rgba(100,116,139,.2);color:var(--text3);border-radius:99px;padding:2px 8px">Pausada</span>':'')
            +'</div>'
            +'<div style="font-size:11px;color:var(--text3)">'
              +((function(){var lmap={diario:'Diario',semanal:'Semanal',quincenal:'Quincenal',mensual:'Mensual',bimensual:'Bimensual',trimestral:'Trimestral',semestral:'Semestral',anual:'Anual'};return (lmap[s.ciclo]||s.ciclo)+' · '+fmt(s.monto,s.moneda||cur)+(s.ciclo!=='mensual'?' · ~'+fmt(montoMes,s.moneda||cur)+'/mes':'');})())
              +(s.diaCobro?' · Día '+s.diaCobro:'')
            +'</div>'
          +'</div>'
          +'<div style="text-align:right;flex-shrink:0">'
            +'<div style="font-size:16px;font-weight:800;color:var(--primary)">'+fmt(s.ciclo==='anual'?montoMes:(parseFloat(s.monto)||0),s.moneda||cur)+'</div>'
            +'<div style="font-size:10px;color:var(--text3)">'+(s.ciclo==='anual'?'/mes est.':'/'+((s.ciclo||'mes').replace('ual','').replace('ana','em')))+'</div>'
            +(dias!==null&&!pausada?'<div style="font-size:10px;font-weight:700;color:'+(dias<=3?'var(--danger)':'var(--text3)')+'">'+( dias===0?'🔴 HOY':'⏱ '+dias+'d')+'</div>':'')
          +'</div>'
        +'</div>'
        +'</div>';
    });
    html+='</div>';
  });

  return html;
}

function openSubsModal(data){
  var s=data.id?((S.subscriptions||[]).find(function(x){return x.id===data.id;})):null;
  var isEdit=!!s;
  var defCur=s?s.moneda:S.currency;
  var defCat=s?s.categoria:'entretenimiento';
  var defCiclo=s?s.ciclo:'mensual';
  var defEstado=s?s.estado:'activa';
  var defDia=s?s.diaCobro:'';
  var curName=buildCurTriggerLabel(defCur);
  var catInfo=SUBS_CATS.find(function(c){return c.id===defCat;})||SUBS_CATS[0];
  var cicloLabel={diario:'Diario',semanal:'Semanal',quincenal:'Quincenal',mensual:'Mensual',bimensual:'Bimensual',trimestral:'Trimestral',semestral:'Semestral',anual:'Anual'};

  var html='<div class="modal-header"><div class="modal-title">'+(isEdit?'Editar':'Nueva')+' suscripci\u00f3n</div><button class="modal-close" onclick="closeModal()">\u00d7</button></div>'
    +'<div class="modal-body">'
    +'<input type="hidden" id="subs-id" value="'+(s?s.id:'')+'">'
    +'<input type="hidden" id="subs-cat" value="'+defCat+'">'
    +'<input type="hidden" id="subs-ciclo" value="'+defCiclo+'">'
    +'<input type="hidden" id="subs-estado" value="'+defEstado+'">'
    +'<input type="hidden" id="subs-moneda" value="'+defCur+'">'
    +'<input type="hidden" id="subs-dia" value="'+defDia+'">'

    // Nombre
    +'<div class="form-group"><label class="form-label">Nombre del servicio</label>'
      +'<input class="form-input" type="text" id="subs-nombre" placeholder="Ej: Netflix, Spotify..." value="'+(s?s.nombre:'')+'">'
    +'</div>'

    // Categoría BS
    +'<div class="form-group"><label class="form-label">Categor\u00eda</label>'
      +'<div class="bs-trigger" onclick="showBS_subsCat()">'
        +'<span id="subs-cat-lbl" style="color:var(--text);font-size:14px">'+catInfo.icon+' '+catInfo.label+'</span>'
        +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
      +'</div>'
    +'</div>'

    // Estado BS
    +'<div class="form-group"><label class="form-label">Estado</label>'
      +'<div class="bs-trigger" onclick="showBS_subsEstado()">'
        +'<span id="subs-estado-lbl" style="color:var(--text);font-size:14px">'+(defEstado==='activa'?'✅ Activa':'⏸ Pausada')+'</span>'
        +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
      +'</div>'
    +'</div>'

    // Moneda + Monto (moneda primero para aplicar formato correcto)
    +'<div class="form-row">'
      +'<div class="form-group"><label class="form-label">Moneda</label>'
        +'<div class="bs-trigger" onclick="showBS_subsMoneda()">'
          +'<div id="subs-moneda-lbl" style="display:flex;align-items:center;gap:4px;flex:1">'+buildCurTriggerLabel(defCur)+'</div>'
          +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
        +'</div>'
      +'</div>'
      +'<div class="form-group"><label class="form-label">Monto</label>'
        +'<input class="form-input" type="text" inputmode="numeric" id="subs-monto" '
        +'placeholder="0,00" oninput="numInputSubs(this)" '
        +'style="text-align:right;letter-spacing:.5px" '
        +'value="'+(s&&s.monto?s.monto:'')+'">'
      +'</div>'
    +'</div>'

    // Ciclo BS
    +'<div class="form-group"><label class="form-label">Ciclo de cobro</label>'
      +'<div class="bs-trigger" onclick="showBS_subsCiclo()">'
        +'<span id="subs-ciclo-lbl" style="color:var(--text);font-size:14px">'+(cicloLabel[defCiclo]||defCiclo)+'</span>'
        +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
      +'</div>'
    +'</div>'

    // Día cobro BS
    +'<div class="form-group"><label class="form-label">D\u00eda de cobro <span style="color:var(--text3);font-weight:400">(opcional)</span></label>'
      +'<div class="bs-trigger" onclick="showBS_subsDia()">'
        +'<span id="subs-dia-lbl" style="color:'+(defDia?'var(--text)':'var(--text3)')+';font-size:14px">'+(defDia?'D\u00eda '+defDia:'Seleccionar d\u00eda')+'</span>'
        +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
      +'</div>'
    +'</div>'

    // Notas
    +'<div class="form-group"><label class="form-label">Notas <span style="color:var(--text3);font-weight:400">(opcional)</span></label>'
      +'<input class="form-input" type="text" id="subs-notas" placeholder="Ej: Plan familiar, 4 pantallas..." value="'+(s?s.notas||'':'')+'">'
    +'</div>'

    +'<div class="btn-row">'
      +(isEdit?'<button class="btn btn-danger" onclick="deleteSubs(\''+( s?s.id:'')+'\')">Eliminar</button>':'')
      +'<button class="btn btn-primary" onclick="saveSubs()">Guardar</button>'
    +'</div>'
    +'</div>';

  openModal('custom',{html:html});
}

function saveSubs(){
  var id=document.getElementById('subs-id')&&document.getElementById('subs-id').value||'';
  var nombre=(document.getElementById('subs-nombre')||{}).value||'';
  if(!nombre.trim()){toast('Ingresa el nombre del servicio');return;}
  var cur=(document.getElementById('subs-moneda')||{}).value||S.currency;
  var monto=parseNumSubs((document.getElementById('subs-monto')||{}).value||'0',cur);
  var obj={
    id:id||uid(),
    nombre:nombre.trim(),
    monto:monto,
    ciclo:(document.getElementById('subs-ciclo')||{}).value||'mensual',
    categoria:(document.getElementById('subs-cat')||{}).value||'entretenimiento',
    estado:(document.getElementById('subs-estado')||{}).value||'activa',
    moneda:cur,
    diaCobro:(document.getElementById('subs-dia')||{}).value||'',
    notas:(document.getElementById('subs-notas')||{}).value||''
  };
  if(!S.subscriptions)S.subscriptions=[];
  if(id){
    var idx=S.subscriptions.findIndex(function(x){return x.id===id;});
    if(idx>=0)S.subscriptions[idx]=stampItem(obj);else S.subscriptions.push(stampItem(obj));
  } else {
    S.subscriptions.push(stampItem(obj));
  }
  var _subsMsg=id?'Suscripción actualizada ✓':'Suscripción guardada ✓';
  completeAction(function(){
    if(id){var idx=S.subscriptions.findIndex(function(x){return x.id===id;});if(idx>=0)S.subscriptions[idx]=stampItem(obj);else S.subscriptions.push(stampItem(obj));}
    else{S.subscriptions.push(stampItem(obj));}
  },'suscripciones',_subsMsg);
}
function deleteSubs(id){
  confirmDialog('🗑️','¿Eliminar suscripción?','Esta acción no se puede deshacer.',function(){
    completeAction(function(){S.subscriptions=softDelete(S.subscriptions||[],id);},'suscripciones','Suscripción eliminada');
  });
}
// BS helpers para suscripciones
function showBS_subsCat(){
  var cur=document.getElementById('subs-cat')?document.getElementById('subs-cat').value:'';
  var items=SUBS_CATS.map(function(c){return {val:c.id,label:c.icon+' '+c.label};});
  showBottomSheet({title:'Categor\u00eda',items:items,selected:cur,searchable:false,
    onSelect:function(val){
      var inp=document.getElementById('subs-cat');
      var lbl=document.getElementById('subs-cat-lbl');
      var c=SUBS_CATS.find(function(x){return x.id===val;});
      if(inp)inp.value=val;
      if(lbl&&c){lbl.textContent=c.icon+' '+c.label;lbl.style.color='var(--text)';}
    }
  });
}
function showBS_subsEstado(){
  var cur=document.getElementById('subs-estado')?document.getElementById('subs-estado').value:'activa';
  var items=[{val:'activa',label:'\u2705 Activa'},{val:'pausada',label:'\u23f8 Pausada'}];
  showBottomSheet({title:'Estado',items:items,selected:cur,searchable:false,
    onSelect:function(val){
      var inp=document.getElementById('subs-estado');
      var lbl=document.getElementById('subs-estado-lbl');
      if(inp)inp.value=val;
      if(lbl){lbl.textContent=val==='activa'?'\u2705 Activa':'\u23f8 Pausada';lbl.style.color='var(--text)';}
    }
  });
}
function showBS_subsMoneda(){
  var cur=document.getElementById('subs-moneda')?document.getElementById('subs-moneda').value:'';
  var items=buildCurrencyItems(cur);
  showBottomSheet({title:'Moneda',items:items,selected:cur,searchable:true,
    onSelect:function(val){
      var inp=document.getElementById('subs-moneda');
      var lbl=document.getElementById('subs-moneda-lbl');
      if(inp)inp.value=val;
      if(lbl){      lbl.innerHTML=buildCurTriggerLabel(val);}
      var balEl=document.getElementById('fc-balance');
      if(balEl&&balEl.value){numInputFC(balEl);}
    }
  });
}
function showBS_subsCiclo(){
  var cur=document.getElementById('subs-ciclo')?document.getElementById('subs-ciclo').value:'mensual';
  var ciclos=[{val:'diario',label:'Diario'},{val:'semanal',label:'Semanal'},{val:'quincenal',label:'Quincenal'},{val:'mensual',label:'Mensual'},{val:'bimensual',label:'Bimensual'},{val:'trimestral',label:'Trimestral'},{val:'semestral',label:'Semestral'},{val:'anual',label:'Anual'}];
  showBottomSheet({title:'Ciclo de cobro',items:ciclos,selected:cur,searchable:false,
    onSelect:function(val){
      var inp=document.getElementById('subs-ciclo');
      var lbl=document.getElementById('subs-ciclo-lbl');
      if(inp)inp.value=val;
      if(lbl){lbl.textContent=val.charAt(0).toUpperCase()+val.slice(1);lbl.style.color='var(--text)';}
    }
  });
}
function showBS_subsDia(){
  var cur=document.getElementById('subs-dia')?document.getElementById('subs-dia').value:'';
  var items=[{val:'',label:'Sin dia especifico'}];
  for(var i=1;i<=31;i++)items.push({val:String(i),label:'Dia '+i});
  showBottomSheet({title:'Dia de cobro',items:items,selected:cur,searchable:false,allowDeselect:true,
    onSelect:function(val){
      var inp=document.getElementById('subs-dia');
      var lbl=document.getElementById('subs-dia-lbl');
      if(inp)inp.value=val;
      if(lbl){lbl.textContent=val?'Dia '+val:'Sin dia especifico';lbl.style.color=val?'var(--text)':'var(--text3)';}
    }
  });
}
function showBS_fcCurrency(){
  var current=document.getElementById('fc-currency')?document.getElementById('fc-currency').value:'';
  var items=buildCurrencyItems(current);
  showBottomSheet({
    title:'Seleccionar moneda',items:items,selected:current,searchable:true,
    onSelect:function(val){
      var inp=document.getElementById('fc-currency');
      var lbl=document.getElementById('fc-currency-lbl');
      if(inp)inp.value=val;
      if(lbl){lbl.innerHTML=buildCurTriggerLabel(val);}
      var balEl=document.getElementById('fc-balance');
      if(balEl&&balEl.value){numInputFC(balEl);}
    }
  });
}
function showBS_fcBank(){
  var cur=document.getElementById('fc-currency')?document.getElementById('fc-currency').value:S.currency;
  showBS_fcBank_refresh(cur,true);
}
function showBS_fcBank_refresh(cur,open){
  var banksList=cur==='COP'?BANKS_COP:BANKS_PLN;
  var current=document.getElementById('fc-bank')?document.getElementById('fc-bank').value:'';
  var items=[{val:'',label:'Sin entidad'}].concat(banksList.map(function(b){return {val:b.id,label:b.abbr+' · '+b.name};}));
  if(!open)return;
  showBottomSheet({
    title:'Entidad financiera',items:items,selected:current,searchable:true,allowDeselect:true,
    onSelect:function(val){
      var inp=document.getElementById('fc-bank');
      var lbl=document.getElementById('fc-bank-lbl');
      var banks=cur==='COP'?BANKS_COP:BANKS_PLN;
      var b=banks.find(function(x){return x.id===val;});
      if(inp)inp.value=val;
      if(lbl){lbl.textContent=b?b.abbr+' · '+b.name:'Sin entidad';lbl.style.color=b?'var(--text)':'var(--text3)';}
    }
  });
}
function showBS_fcDay(inputId,lblId,title,updateNextPay){
  var current=document.getElementById(inputId)?String(document.getElementById(inputId).value):'';
  var items=[];
  for(var i=1;i<=31;i++)items.push({val:String(i),label:'Día '+i});
  showBottomSheet({
    title:title,items:items,selected:current,searchable:false,allowDeselect:true,
    onSelect:function(val){
      var inp=document.getElementById(inputId);
      var lbl=document.getElementById(lblId);
      if(inp)inp.value=val;
      if(lbl){
        lbl.textContent=val?'Día '+val:'Seleccionar día';
        lbl.style.color=val?'var(--text)':'var(--text3)';
      }
      if(updateNextPay)fcUpdateNextPayment();
    }
  });
}

// ════════════════════════════════════════════════════════════
// PRESUPUESTOS
// ════════════════════════════════════════════════════════════
function renderBudgetGroups(budgets){
  var groups={};
  budgets.forEach(function(b){
    var catId=b.categoryId||'none';
    if(!groups[catId])groups[catId]=[];
    groups[catId].push(b);
  });
  return Object.keys(groups).map(function(catId){
    var grpBudgets=groups[catId];
    var cat=getCat(catId);
    var totalAmt=grpBudgets.reduce(function(s,b){return s+(parseFloat(b.amount)||0);},0);
    var totalSpent=grpBudgets.reduce(function(s,b){return s+getBudgetSpent(b);},0);
    var totalPct=Math.min(100,totalAmt>0?Math.round(totalSpent/totalAmt*100):0);
    var color=totalPct>=90?'var(--danger)':totalPct>=70?'var(--warning)':'var(--primary)';
    var bColor=grpBudgets[0].color||'var(--primary)';
    var hasMultiple=grpBudgets.length>1||(grpBudgets.length===1&&grpBudgets[0].subcategoryId);
    var gId='bgrp-'+catId;
    var q="'";
    var onclickMain=hasMultiple
      ?'document.getElementById('+q+gId+q+').classList.toggle('+q+'hidden'+q+');this.querySelector('+q+'.bgrp-arrow'+q+').textContent=document.getElementById('+q+gId+q+').classList.contains('+q+'hidden'+q+')?'+q+'▶'+q+':'+q+'▼'+q
      :'openModal('+q+'budget'+q+',{id:'+q+grpBudgets[0].id+q+'})';
    var h='<div class="card" style="border-left:4px solid '+bColor+';margin-bottom:12px">'
      +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;cursor:pointer" onclick="'+onclickMain+'">'
      +'<div style="width:40px;height:40px;border-radius:10px;background:'+bColor+'22;display:flex;align-items:center;justify-content:center;font-size:20px">'+(cat?cat.icon:'📦')+'</div>'
      +'<div style="flex:1">'
      +'<div style="font-size:14px;font-weight:700">'+(cat?cat.name:'Sin categoría')+'</div>'
      +'<div style="font-size:11px;color:var(--text2)">'+grpBudgets.length+' presupuesto'+(grpBudgets.length>1?'s':'')+' · '+(grpBudgets[0].currency||S.currency)+'</div>'
      +'</div>'
      +'<div style="display:flex;align-items:center;gap:8px">'
      +'<span class="badge" style="background:'+color+'22;color:'+color+'">'+totalPct+'%</span>'
      +(hasMultiple?'<span class="bgrp-arrow" style="color:var(--text3);font-size:12px">▶</span>':'')
      +'</div></div>'
      +'<div class="progress-bar" style="height:8px;margin-bottom:8px"><div class="progress-fill" style="width:'+totalPct+'%;background:'+color+'"></div></div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:11px;text-align:center;margin-bottom:'+(hasMultiple?'8':'0')+'px">'
      +'<div><div style="color:var(--text2)">Gastado</div><div style="font-weight:700;color:var(--danger)">'+fmt(totalSpent)+'</div></div>'
      +'<div><div style="color:var(--text2)">Restante</div><div style="font-weight:700;color:'+(totalAmt-totalSpent>=0?'var(--success)':'var(--danger)')+'">'+fmt(Math.max(0,totalAmt-totalSpent))+'</div></div>'
      +'<div><div style="color:var(--text2)">Límite</div><div style="font-weight:700">'+fmt(totalAmt)+'</div></div>'
      +'</div>';
    if(hasMultiple){
      h+='<div id="'+gId+'" class="hidden" style="border-top:1px solid var(--border);padding-top:8px">';
      grpBudgets.forEach(function(b){
        var sub=getSub(b.subcategoryId);
        var bSpent=getBudgetSpent(b);
        var bPct=Math.min(100,b.amount>0?Math.round(bSpent/b.amount*100):0);
        var bColor2=bPct>=90?'var(--danger)':bPct>=70?'var(--warning)':'var(--primary)';
        h+='<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="openModal('+q+'budget'+q+',{id:'+q+b.id+q+'})">'
          +'<span style="font-size:12px;flex:1;color:var(--text2)">'+(sub?sub.icon+' '+sub.name:'General')+'</span>'
          +'<span style="font-size:11px;color:var(--text2)">'+fmt(bSpent)+'/'+fmt(b.amount)+'</span>'
          +'<span class="badge" style="background:'+bColor2+'22;color:'+bColor2+';font-size:10px">'+bPct+'%</span>'
          +'</div>';
      });
      h+='</div>';
    }
    h+='</div>';
    return h;
  }).join('');
}
function renderPresupuestos(){
  var budgets=filterDeleted(S.budgets).filter(function(b){return(b.currency||S.currency)===S.currency;});
  var totalLimit=budgets.reduce(function(s,b){return s+(parseFloat(b.amount)||0);},0);
  var totalSpent=budgets.reduce(function(s,b){return s+getBudgetSpent(b);},0);
  var totalPct=totalLimit>0?Math.min(100,Math.round(totalSpent/totalLimit*100)):0;
  var totalColor=totalPct>=90?'var(--danger)':totalPct>=70?'var(--warning)':'var(--primary)';
  var html='';
  if(budgets.length){
    html+='<div class="card" style="margin-bottom:12px">'
      +'<div class="card-title">Resumen total de presupuestos</div>'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:8px">'
      +'<div><div style="font-size:12px;color:var(--text2)">Gastado</div><div style="font-size:18px;font-weight:800;color:var(--danger)">'+fmt(totalSpent)+'</div></div>'
      +'<div style="text-align:right"><div style="font-size:12px;color:var(--text2)">Límite total</div><div style="font-size:18px;font-weight:800">'+fmt(totalLimit)+'</div></div>'
      +'</div>'
      +'<div class="progress-bar" style="height:10px;margin-bottom:6px"><div class="progress-fill" style="width:'+totalPct+'%;background:'+totalColor+'"></div></div>'
      +'<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2)">'
      +'<span>Usado: <strong style="color:'+totalColor+'">'+totalPct+'%</strong></span>'
      +'<span>Restante: <strong style="color:'+(totalLimit-totalSpent>=0?'var(--success)':'var(--danger)')+'">'+fmt(Math.max(0,totalLimit-totalSpent))+'</strong></span>'
      +'</div></div>';
  }
  html+='<div style="display:flex;justify-content:flex-end;margin-bottom:12px">'
    +'<button class="btn btn-primary btn-sm" onclick="openModal(\'budget\',{})">+ '+(t('newBudget')||'Nuevo presupuesto')+'</button>'
    +'</div>';
  html+=!budgets.length
    ?'<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Sin presupuestos</div><div class="empty-desc">Define límites por categoría</div></div>'
    :renderBudgetGroups(budgets);
  return html;
}

function renderMetas(){
  const goals=filterDeleted(S.goals).filter(g=>(g.currency||S.currency)===S.currency);
  const totalSaved=goals.reduce((s,g)=>s+(parseFloat(g.current)||0),0);
  const totalTarget=goals.reduce((s,g)=>s+(parseFloat(g.target)||0),0);
  const motivMsg=(pct)=>{
    if(pct>=100)return{icon:'🏆',msg:'¡Meta alcanzada! Sigue así, eres increíble.',color:'var(--success)'};
    if(pct>=80)return{icon:'🔥',msg:'¡Casi llegás! Estás en la recta final.',color:'var(--warning)'};
    if(pct>=50)return{icon:'💪',msg:'¡Vas a la mitad! Cada peso cuenta.',color:'var(--info)'};
    if(pct>=25)return{icon:'🌱',msg:'Buen comienzo, estás construyendo tu futuro.',color:'var(--primary)'};
    return{icon:'🚀',msg:'Acaba de comenzar. ¡El primer paso ya está dado!',color:'var(--text2)'};
  };
  return`
    ${goals.length>0?`<div class="card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <div><div style="font-size:12px;color:var(--text2)">Total ahorrado</div><div style="font-size:14px;font-weight:800;color:var(--success)">${fmt(totalSaved)}</div></div>
        <div style="text-align:right"><div style="font-size:12px;color:var(--text2)">Objetivo total</div><div style="font-size:20px;font-weight:800">${fmt(totalTarget)}</div></div>
      </div>
      <div class="progress-bar" style="height:8px"><div class="progress-fill" style="width:${Math.min(100,totalTarget>0?Math.round(totalSaved/totalTarget*100):0)}%;background:var(--primary)"></div></div>
    </div>`:''}
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-primary btn-sm" onclick="openModal('goal',{})">+ ${t('newGoal')||'Nueva meta'}</button>
    </div>
    ${!goals.length?'<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-title">Sin metas</div><div class="empty-desc">Define tus objetivos de ahorro</div></div>':
    goals.map(g=>{
      const rawPct=g.target>0?Math.round(g.current/g.target*100):0;
      const barPct=Math.min(100,rawPct);
      const exceeded=rawPct>=100;
      const remaining=Math.max(0,g.target-g.current);
      const days=(!exceeded&&g.deadline)?daysUntil(g.deadline):null;
      const monthly=days&&days>0?remaining/(days/30):0;
      const gColor=g.color||'var(--primary)';
      const acc=getAcc(g.accountId);
      const motiv=motivMsg(rawPct);
      return`<div class="goal-card" style="border-left:4px solid ${gColor}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px" onclick="openModal('goal',{id:'${g.id}'})">
          <div style="width:44px;height:44px;border-radius:12px;background:${gColor}22;display:flex;align-items:center;justify-content:center;font-size:24px">${g.icon||'🎯'}</div>
          <div style="flex:1">
            <div style="font-size:15px;font-weight:700">${g.name}</div>
            <div style="font-size:11px;color:var(--text2)">${g.deadline&&!exceeded?'Meta: '+g.deadline+' ·':''} ${acc?'📌 '+acc.name:''}</div>
          </div>
          <span class="badge" style="background:${motiv.color}22;color:${motiv.color}">${rawPct}%</span>
        </div>
        <div class="progress-bar" style="height:10px;margin-bottom:8px;position:relative">
          <div class="progress-fill" style="width:${barPct}%;background:${gColor}"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:8px">
          <span>Ahorrado: <strong style="color:var(--text)">${fmt(g.current,g.currency)}</strong></span>
          <span>Meta: <strong style="color:var(--text)">${fmt(g.target,g.currency)}</strong></span>
        </div>
        <div style="background:${motiv.color}11;border-left:3px solid ${motiv.color};border-radius:4px;padding:8px 10px;margin-bottom:10px;font-size:12px;color:${motiv.color}">
          ${motiv.icon} ${motiv.msg}${exceeded&&g.current>g.target?` (¡Superaste la meta en ${fmt(g.current-g.target,g.currency)}!)`:''}</div>
        ${(!exceeded&&monthly>0)?`<div style="font-size:11px;color:var(--text2);margin-bottom:10px">💡 Necesitas ${fmt(monthly,g.currency)}/mes para llegar a tiempo (${days}d restantes)</div>`:''}
        <button class="btn btn-success btn-sm" style="width:100%" onclick="openModal('addToGoal',{id:'${g.id}'})">+ Agregar ahorro</button>
      </div>`;
    }).join('')}
  `;
}

// ════════════════════════════════════════════════════════════
// PAGOS PROGRAMADOS
// ════════════════════════════════════════════════════════════
function renderPagos(){
  return`
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-primary btn-sm" onclick="openModal('payment',{})">+ ${t('newPayment')||'Nuevo pago'}</button>
    </div>
    ${(()=>{const _sp=filterDeleted(S.scheduledPayments);if(!_sp.length)return '<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">Sin pagos programados</div><div class="empty-desc">Programa tus pagos recurrentes</div></div>';return _sp.map(p=>{
      const days=daysUntil(p.nextDate);
      const cat=getCat(p.categoryId);
      const borderColor=days<0?'var(--danger)':days===0?'var(--warning)':days<=3?'#F59E0B88':(p.color||'var(--border)');
      let statusClass='';let statusBadge='';
      if(days<0){statusClass='sched-overdue';statusBadge=`<span class="badge badge-danger">Vencido hace ${Math.abs(days)}d</span>`;}
      else if(days===0){statusClass='sched-today';statusBadge=`<span class="badge badge-warning">⚡ HOY</span>`;}
      else if(days<=3){statusClass='sched-soon';statusBadge=`<span class="badge badge-warning">En ${days}d</span>`;}
      else{statusBadge=`<span class="badge badge-info">En ${days}d</span>`;}
      return`<div class="sched-item ${statusClass}" style="border-left:4px solid ${borderColor}" onclick="openModal('payment',{id:'${p.id}'})">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:${days<=3?'10px':'0'}">
          <div style="width:44px;height:44px;border-radius:12px;background:${cat?cat.color+'22':'#64748B22'};display:flex;align-items:center;justify-content:center;font-size:22px">${cat?cat.icon:'🔔'}</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700">${p.name}</div>
            <div style="font-size:11px;color:var(--text2)">${p.frequency} · ${p.nextDate} ${p.isAuto?'· 🤖 Auto':''}</div>
          </div>
          <div style="text-align:right">${statusBadge}<div style="font-size:16px;font-weight:700;color:var(--danger);margin-top:4px">${fmt(p.amount,p.currency)}</div></div>
        </div>
        ${days<=5?`<button class="btn btn-primary btn-sm" style="width:100%" onclick="event.stopPropagation();registerPaymentManual('${p.id}')">✓ Registrar pago${days===0?' HOY':days<0?' (vencido)':' ('+days+'d)'}</button>`:''}
      </div>`;
    }).join('')})()}
  `;
}

function registerPaymentManual(id){
  const p=S.scheduledPayments.find(x=>x.id===id);if(!p)return;
  const tx=stampItem({id:uid(),type:'gasto',accountId:p.accountId||'',categoryId:p.categoryId||'',subcategoryId:p.subcategoryId||'',amount:p.amount,currency:p.currency||S.currency,date:todayStr(),description:p.name,paymentMethod:''});
  S.transactions.push(tx);
  advancePayment(p);
  saveState();renderPage('pagos');toast('Pago registrado ✓');
}

// ════════════════════════════════════════════════════════════
// DEUDAS
// ════════════════════════════════════════════════════════════
function renderDeudas(){
  const pasivos=filterDeleted(S.accounts).filter(a=>a.type==='pasivo'&&(a.currency||S.currency)===S.currency);
  const totalDebt=pasivos.reduce((s,a)=>s+Math.abs(getBalance(a.id)),0);

  return`
    ${pasivos.length?`<div class="balance-card" style="margin-bottom:16px;cursor:default">
      <div class="balance-label">Total deudas (${S.currency})</div>
      <div class="balance-amount" style="color:#FF8080">${fmt(totalDebt)}</div>
      <div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,.5)">${pasivos.length} ${pasivos.length===1?'deuda':'deudas'} registradas</div>
    </div>`:''}
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-primary btn-sm" onclick="openModal('account',{defaultType:'pasivo'})">+ ${t('newDebt')||'Nueva deuda'}</button>
    </div>
    ${!pasivos.length?'<div class="empty-state"><div class="empty-icon">💸</div><div class="empty-title">Sin deudas en '+S.currency+'</div><div class="empty-desc">Las cuentas pasivas aparecerán aquí</div></div>':
    pasivos.map(a=>{
      const bal=Math.abs(getBalance(a.id));
      const b=getBank(a.bankEntity,a.currency||S.currency);
      const bColor=b?b.color:'#64748B';
      const subLabel=a.subtype==='tc'?'💳 Tarjeta Crédito':a.subtype==='credito'?'💰 Crédito':'🏦 Préstamo';
      const days=a.paymentDate?(()=>{const now=new Date();const d=new Date(now.getFullYear(),now.getMonth(),a.paymentDate);if(d<now)d.setMonth(d.getMonth()+1);return Math.round((d-now)/86400000);})():null;
      const dColor=days!==null?(days<=0?'var(--danger)':days<=5?'var(--warning)':'var(--text2)'):'var(--text2)';
      return`<div class="debt-card" style="border-left:4px solid ${bColor}" onclick="openModal('account',{id:'${a.id}'})">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:12px">
            ${bankBadge(a.bankEntity,a.currency||S.currency,44,a)}
            <div><div style="font-size:15px;font-weight:700">${a.name}</div><div style="font-size:12px;color:var(--text2)">${subLabel} · ${a.currency||S.currency}</div>${b?`<div style="font-size:11px;color:var(--text3)">${b.name}</div>`:''}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:15px;font-weight:800;color:var(--danger);word-break:break-all">${fmt(bal,a.currency||S.currency)}</div>
            ${days!==null?`<div style="font-size:11px;color:${dColor};font-weight:600">Pago: ${days<=0?'Vencido':days===1?'Mañana':days+'d'}</div>`:''}
          </div>
        </div>
        ${a.subtype==='tc'&&a.tcLimit?`<div><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text2);margin-bottom:4px"><span>Usado: ${fmt(bal,a.currency||S.currency)}</span><span>Límite: ${fmt(a.tcLimit,a.currency||S.currency)}</span></div><div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100,a.tcLimit>0?Math.round(bal/a.tcLimit*100):0)}%;background:${a.tcLimit>0&&bal/a.tcLimit>0.8?'var(--danger)':'var(--warning)'}"></div></div></div>`:''}
        ${a.tae||a.cutDate||a.paymentDate||a.monthlyPayment?`<div style="display:flex;gap:16px;margin-top:8px;font-size:11px;color:var(--text2);flex-wrap:wrap">
          ${a.tae?`<span>TAE: ${a.tae}%</span>`:''}
          ${a.cutDate?`<span>Corte: día ${a.cutDate}</span>`:''}
          ${a.paymentDate?`<span>Pago: día ${a.paymentDate}</span>`:''}
          ${a.monthlyPayment?`<span>Cuota: ${fmt(a.monthlyPayment,a.currency||S.currency)}</span>`:''}
        </div>`:''}
        <button class="btn btn-primary btn-sm" style="width:100%;margin-top:12px" onclick="event.stopPropagation();openModal('debtPayment',{id:'${a.id}'})">💳 Registrar pago</button>
      </div>`;
    }).join('')}
  `;
}

// ════════════════════════════════════════════════════════════
// ANÁLISIS
// ════════════════════════════════════════════════════════════
function renderAnalisis(){
  const{from,to}=getAnalysisPeriodRange();
  const afTxs=S.transactions.filter(t=>{const d=new Date(t.date);return t.currency===S.currency&&d>=from&&d<=to;});
  const inc=afTxs.filter(t=>t.type==='ingreso').reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const exp=afTxs.filter(t=>t.type==='gasto').reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const savings=inc-exp;
  const savingsRate=inc>0?Math.round(savings/inc*100):0;

  const txsInPeriod=afTxs;
  const catExpenses={};
  txsInPeriod.filter(t=>t.type==='gasto').forEach(t=>{if(!catExpenses[t.categoryId])catExpenses[t.categoryId]=0;catExpenses[t.categoryId]+=parseFloat(t.amount)||0;});
  const sortedCats=Object.entries(catExpenses).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const totalExp=sortedCats.reduce((s,[,v])=>s+v,0);

  // Build 6 bars for mini chart — always show last 6 months regardless of filter
  const barCount=6;const bars=[];
  for(let i=barCount-1;i>=0;i--){
    const d=new Date();
    d.setMonth(d.getMonth()-i);
    const m=d.getMonth();const y=d.getFullYear();
    const mInc=S.transactions.filter(t=>t.type==='ingreso'&&t.currency===S.currency&&new Date(t.date).getMonth()===m&&new Date(t.date).getFullYear()===y).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
    const mExp=S.transactions.filter(t=>t.type==='gasto'&&t.currency===S.currency&&new Date(t.date).getMonth()===m&&new Date(t.date).getFullYear()===y).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
    bars.push({label:d.toLocaleString('es',{month:'short'}),inc:mInc,exp:mExp});
  }
  const maxVal=Math.max(...bars.map(b=>Math.max(b.inc,b.exp)),1);

  const barChart=`<div style="display:flex;align-items:flex-end;gap:6px;height:120px;margin-bottom:6px">
    ${bars.map(b=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
      <div style="width:100%;display:flex;gap:2px;align-items:flex-end;height:90px">
        <div style="flex:1;background:var(--success);border-radius:3px 3px 0 0;height:${Math.max(2,Math.round(b.inc/maxVal*90))}px;opacity:.8"></div>
        <div style="flex:1;background:var(--danger);border-radius:3px 3px 0 0;height:${Math.max(2,Math.round(b.exp/maxVal*90))}px;opacity:.8"></div>
      </div>
      <div style="font-size:9px;color:var(--text3)">${b.label}</div>
    </div>`).join('')}
  </div>
  <div style="display:flex;gap:16px;font-size:11px"><span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:var(--success);border-radius:2px;display:inline-block"></span>Ingresos</span><span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:var(--danger);border-radius:2px;display:inline-block"></span>Gastos</span></div>`;

  let donutPaths='',legendItems='';
  if(sortedCats.length){
    let offset=0;const r=50,cx=60,cy=60,circ=2*Math.PI*r;
    sortedCats.forEach(([catId,val])=>{
      const cat=getCat(catId);const pct=totalExp>0?val/totalExp:0;const dash=pct*circ;
      const color=cat?cat.color:'#64748B';
      donutPaths+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="18" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset+=dash;
      legendItems+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:12px"><div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div><span style="flex:1">${cat?cat.icon+' '+cat.name:'Sin cat.'}</span><span style="font-weight:700">${totalExp>0?Math.round(val/totalExp*100):0}% · ${fmt(val)}</span></div>`;
    });
  }

  return`
    <div style="display:flex;gap:10px;margin-bottom:14px">
      <div style="flex:1">
        <div style="font-size:11px;color:var(--text2);margin-bottom:4px;font-weight:600">AÑO</div>
        <select class="form-select" style="font-size:14px" onchange="S.analysisYear=parseInt(this.value);saveState();renderPage('analisis')">${Array.from({length:8},(_,i)=>new Date().getFullYear()-i).map(y=>`<option value="${y}" ${y===(S.analysisYear||new Date().getFullYear())?'selected':''}>${y}</option>`).join('')}</select>
      </div>
      <div style="flex:2">
        <div style="font-size:11px;color:var(--text2);margin-bottom:4px;font-weight:600">PERÍODO</div>
        <select class="form-select" style="font-size:14px" onchange="S.analysisPeriodSub=this.value;saveState();renderPage('analisis')">
          <option value="anual" ${(S.analysisPeriodSub||'anual')==='anual'?'selected':''}>Todo el año</option>
          <option value="sem1" ${(S.analysisPeriodSub)==='sem1'?'selected':''}>Semestre 1 (Ene-Jun)</option>
          <option value="sem2" ${(S.analysisPeriodSub)==='sem2'?'selected':''}>Semestre 2 (Jul-Dic)</option>
          <option value="q1" ${(S.analysisPeriodSub)==='q1'?'selected':''}>T1 (Ene-Mar)</option>
          <option value="q2" ${(S.analysisPeriodSub)==='q2'?'selected':''}>T2 (Abr-Jun)</option>
          <option value="q3" ${(S.analysisPeriodSub)==='q3'?'selected':''}>T3 (Jul-Sep)</option>
          <option value="q4" ${(S.analysisPeriodSub)==='q4'?'selected':''}>T4 (Oct-Dic)</option>
          <option value="01" ${(S.analysisPeriodSub)==='01'?'selected':''}>Enero</option>
          <option value="02" ${(S.analysisPeriodSub)==='02'?'selected':''}>Febrero</option>
          <option value="03" ${(S.analysisPeriodSub)==='03'?'selected':''}>Marzo</option>
          <option value="04" ${(S.analysisPeriodSub)==='04'?'selected':''}>Abril</option>
          <option value="05" ${(S.analysisPeriodSub)==='05'?'selected':''}>Mayo</option>
          <option value="06" ${(S.analysisPeriodSub)==='06'?'selected':''}>Junio</option>
          <option value="07" ${(S.analysisPeriodSub)==='07'?'selected':''}>Julio</option>
          <option value="08" ${(S.analysisPeriodSub)==='08'?'selected':''}>Agosto</option>
          <option value="09" ${(S.analysisPeriodSub)==='09'?'selected':''}>Septiembre</option>
          <option value="10" ${(S.analysisPeriodSub)==='10'?'selected':''}>Octubre</option>
          <option value="11" ${(S.analysisPeriodSub)==='11'?'selected':''}>Noviembre</option>
          <option value="12" ${(S.analysisPeriodSub)==='12'?'selected':''}>Diciembre</option>
          <option value="7d" ${(S.analysisPeriodSub)==='7d'?'selected':''}>Últimos 7 días</option>
          <option value="30d" ${(S.analysisPeriodSub)==='30d'?'selected':''}>Últimos 30 días</option>
          <option value="90d" ${(S.analysisPeriodSub)==='90d'?'selected':''}>Últimos 90 días</option>
        </select>
      </div>
    </div>
    <div class="card" style="margin-bottom:12px">
      <div class="card-title">Resumen · ${S.analysisYear||new Date().getFullYear()}</div>
      <div class="kpi-row" style="margin:0">
        <div class="kpi-card"><div class="kpi-label">Ingresos</div><div class="kpi-val" style="font-size:13px;color:var(--success)">${fmt(inc)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Gastos</div><div class="kpi-val" style="font-size:13px;color:var(--danger)">${fmt(exp)}</div></div>
        <div class="kpi-card"><div class="kpi-label">💸 Deudas</div><div class="kpi-val" style="font-size:13px;color:var(--danger)">${fmt(S.accounts.filter(a=>a.type==='pasivo'&&(a.currency||S.currency)===S.currency).reduce((s,a)=>s+Math.abs(getBalance(a.id)),0))}</div></div>
        <div class="kpi-card"><div class="kpi-label">💰 Ahorro</div><div class="kpi-val" style="font-size:12px;color:${savingsRate<=0?'var(--text2)':savingsRate>=20?'var(--success)':savingsRate>=10?'var(--warning)':'var(--danger)'}">${fmt(savings)}</div><div style="font-size:11px;color:var(--text3);margin-top:2px">${savingsRate<=0?'0%':savingsRate+'%'} del ingreso</div></div>
      </div>
    </div>
    <div class="card" style="margin-bottom:12px"><div class="card-title">Evolución histórica</div>${barChart}</div>
    <div class="card"><div class="card-title">Gastos por categoría · ${S.analysisPeriodSub||'anual'} ${S.analysisYear||new Date().getFullYear()}</div>
    ${sortedCats.length?`<div style="display:flex;align-items:center;gap:16px">
      <svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface3)" stroke-width="18"/>${donutPaths}</svg>
      <div style="flex:1">${legendItems}</div>
    </div>`:'<div style="color:var(--text2);font-size:13px">Sin datos de gastos en este período</div>'}
    </div>
  `;
}

// ════════════════════════════════════════════════════════════
// CATEGORÍAS
// ════════════════════════════════════════════════════════════
function closeCatPanel(){var el=document.getElementById('cat-panel-overlay');if(el)el.remove();if(S.currentPage==='configuracion')renderPage('configuracion');}
function openCatPanel(){
  var overlay=document.createElement('div');
  overlay.id='cat-panel-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;flex-direction:column;overflow:hidden';
  var tab=S._catTab||'gasto';
  var btnStyle=function(active){return'flex:1;padding:8px 6px;border-radius:50px;border:none;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);transition:.15s;background:'+(active?'var(--primary)':'transparent')+';color:'+(active?'white':'var(--text2)');};
  overlay.innerHTML=
    '<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'+
      '<button onclick="closeCatPanel()" style="width:36px;height:36px;border-radius:50%;border:none;background:transparent;color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>'+
      '<span style="font-size:17px;font-weight:800">Categorías</span>'+
      '<button class="btn btn-primary btn-sm" onclick="openModal(\'category\',{defaultType:S._catTab||\'gasto\',lockedType:true})">+ Nueva</button>'+
    '</div>'+
    '<div style="padding:12px 16px 8px;flex-shrink:0">'+
      '<div style="background:var(--surface2);border-radius:50px;padding:3px;display:flex;gap:2px">'+
        '<button id="catpnl-gasto" onclick="setCatTab(\'gasto\')" style="'+btnStyle(tab==='gasto')+'">GASTOS</button>'+
        '<button id="catpnl-ingreso" onclick="setCatTab(\'ingreso\')" style="'+btnStyle(tab==='ingreso')+'">INGRESOS</button>'+
        '<button id="catpnl-transferencia" onclick="setCatTab(\'transferencia\')" style="'+btnStyle(tab==='transferencia')+'">TRANSF.</button>'+
      '</div>'+
    '</div>'+
    '<div id="cat-panel-list" style="flex:1;overflow-y:auto;padding:0 16px 16px">'+renderCatList(tab)+'</div>';
  document.body.appendChild(overlay);
}
function setCatTab(tab){
  S._catTab=tab;saveState();
  var tabs=['gasto','ingreso','transferencia'];
  var ids=['catpnl-gasto','catpnl-ingreso','catpnl-transferencia'];
  ids.forEach(function(id,idx){
    var btn=document.getElementById(id);
    if(!btn)return;
    var active=tabs[idx]===tab;
    btn.style.background=active?'var(--primary)':'transparent';
    btn.style.color=active?'white':'var(--text2)';
  });
  var list=document.getElementById('cat-panel-list');
  if(list)list.innerHTML=renderCatList(tab);
}
function renderCatList(tab){
  if(tab==='gasto'){
    var groups=[
      {key:'necesidades',label:'\u{1F3E0} Necesidades',color:'#EF4444'},
      {key:'deseos',label:'\u{1F3AF} Deseos',color:'#F59E0B'},
      {key:'ahorros',label:'\u{1F4B0} Ahorros',color:'#00D4AA'},
    ];
    var html='';
    groups.forEach(function(g){
      var cats=S.categories.filter(function(c){return c.type==='gasto'&&c.nature===g.key;});
      if(!cats.length)return;
      var count=cats.length;
      var emoji=g.label.split(' ')[0];
      var name=g.label.split(' ').slice(1).join(' ');
      html+='<div onclick="openNatureSheet(\''+g.key+'\',\''+g.label+'\',\''+g.color+'\')" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--surface);border-radius:var(--radius);margin-bottom:10px;cursor:pointer;border:1px solid var(--border);border-left:4px solid '+g.color+'">';
      html+='<div style="display:flex;align-items:center;gap:12px">';
      html+='<div style="width:44px;height:44px;border-radius:12px;background:'+g.color+'22;display:flex;align-items:center;justify-content:center;font-size:22px">'+emoji+'</div>';
      html+='<div>';
      html+='<div style="font-size:14px;font-weight:700;color:var(--text)">'+name+'</div>';
      html+='<div style="font-size:12px;color:var(--text3);margin-top:2px">'+count+' categor'+(count===1?'ía':'ías')+'</div>';
      html+='</div></div>';
      html+='<span style="color:'+g.color+';font-size:24px;font-weight:300;line-height:1">\u203A</span>';
      html+='</div>';
    });
    return html||'<div class="empty-state"><div class="empty-icon">🏷️</div><div class="empty-title">Sin categorías de gasto</div></div>';
  }
  if(tab==='ingreso'){
    var grpInc=[
      {key:'principal',label:'\u2B50 Principal',color:'#00D4AA'},
      {key:'secundario',label:'\u2795 Secundario',color:'#8B5CF6'},
    ];
    var grouped='';
    grpInc.forEach(function(g){
      var cats=S.categories.filter(function(cat){return cat.type==='ingreso'&&(g.key==='principal'?(!cat.incomeType||cat.incomeType==='principal'):cat.incomeType===g.key);});
      if(!cats.length)return;
      var count=cats.length;
      var emoji=g.label.split(' ')[0];
      var name=g.label.split(' ').slice(1).join(' ');
      grouped+='<div onclick="openNatureSheet(\''+g.key+'\',\''+g.label+'\',\''+g.color+'\')" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--surface);border-radius:var(--radius);margin-bottom:10px;cursor:pointer;border:1px solid var(--border);border-left:4px solid '+g.color+'">';
      grouped+='<div style="display:flex;align-items:center;gap:12px">';
      grouped+='<div style="width:44px;height:44px;border-radius:12px;background:'+g.color+'22;display:flex;align-items:center;justify-content:center;font-size:22px">'+emoji+'</div>';
      grouped+='<div>';
      grouped+='<div style="font-size:14px;font-weight:700;color:var(--text)">'+name+'</div>';
      grouped+='<div style="font-size:12px;color:var(--text3);margin-top:2px">'+count+' categor'+(count===1?'ía':'ías')+'</div>';
      grouped+='</div></div>';
      grouped+='<span style="color:'+g.color+';font-size:24px;font-weight:300;line-height:1">\u203A</span>';
      grouped+='</div>';
    });
    return grouped||'<div class="empty-state"><div class="empty-icon">🏷️</div><div class="empty-title">Sin categorías de ingreso</div></div>';
  }
  if(tab==='transferencia'){
    var transCats=S.categories.filter(function(c){return c.type==='transferencia';});
    if(!transCats.length)return'<div class="empty-state"><div class="empty-icon">\u21D4</div><div class="empty-title">Sin categorías de transferencia</div></div>';
    var tcolor='#6366F1';var tcount=transCats.length;
    var th='<div onclick="openNatureSheet(\'transferencia\',\'\u21D4\uFE0F Transferencias\',\'#6366F1\')" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--surface);border-radius:var(--radius);margin-bottom:10px;cursor:pointer;border:1px solid var(--border);border-left:4px solid '+tcolor+'">';
    th+='<div style="display:flex;align-items:center;gap:12px">';
    th+='<div style="width:44px;height:44px;border-radius:12px;background:'+tcolor+'22;display:flex;align-items:center;justify-content:center;font-size:22px">\u21D4\uFE0F</div>';
    th+='<div><div style="font-size:14px;font-weight:700;color:var(--text)">Transferencias</div>';
    th+='<div style="font-size:12px;color:var(--text3);margin-top:2px">'+tcount+' categor'+(tcount===1?'ía':'ías')+'</div></div></div>';
    th+='<span style="color:'+tcolor+';font-size:24px;font-weight:300;line-height:1">\u203A</span></div>';
    return th;
  }
  return'<div class="empty-state"><div class="empty-icon">🏷️</div><div class="empty-title">Sin categorías</div></div>';
}
function renderCatItem(cat){
  var subs=S.subcategories.filter(function(s){return s.categoryId===cat.id;});
  var typeBadge=cat.type==='ingreso'?'badge-success':cat.type==='gasto'?'badge-danger':'badge-info';
  var catDomId='catg-'+cat.id;
  var q="'";
  var h='<div class="cat-group" style="border-left:4px solid '+(cat.color||'var(--border)')+'">'+
    '<div class="cat-group-header" onclick="toggleCatGroup('+q+catDomId+q+',this)" style="cursor:pointer">'+
    '<div class="cat-group-left">'+
    '<div style="width:38px;height:38px;border-radius:10px;background:'+(cat.color||'#64748B')+'22;display:flex;align-items:center;justify-content:center;font-size:18px">'+cat.icon+'</div>'+
    '<div><div style="font-size:13px;font-weight:700">'+cat.name+'</div>'+
    '<span class="badge '+typeBadge+'" style="font-size:9px">'+(cat.type==='ingreso'?'Ingreso':cat.type==='gasto'?'Gasto':'Transf.')+'</span>'+
    (subs.length?'<span style="font-size:10px;color:var(--text3);margin-left:4px">'+subs.length+' subcats</span>':'')+
    '</div></div>'+
    '<div style="display:flex;gap:6px;align-items:center">'+
    '<button class="btn-text" style="font-size:12px" onclick="event.stopPropagation();openModal('+q+'subcategory'+q+',{categoryId:'+q+cat.id+q+'})">+ Sub</button>'+
    '<button class="btn-del" onclick="event.stopPropagation();deleteCat('+q+cat.id+q+')">🗑</button>'+
    '<span class="cat-arrow" style="color:var(--text3);font-size:12px">▶</span>'+
    '</div></div>'+
    '<div id="'+catDomId+'" class="hidden">';
  if(subs.length){
    h+='<div class="subcat-list">';
    subs.forEach(function(s){
      h+='<div class="subcat-item"><span>'+s.icon+' '+s.name+'</span>'+
        '<div style="display:flex;gap:4px">'+
        '<button class="btn-text" style="font-size:11px" onclick="openModal('+q+'editSubcategory'+q+',{id:'+q+s.id+q+'})">✏️</button>'+
        '<button class="btn-del" onclick="deleteSub('+q+s.id+q+')">✕</button>'+
        '</div></div>';
    });
    h+='</div>';
  }
  h+='</div></div>';
  return h;
}
function renderCategorias(){
  var btn='<div style="display:flex;justify-content:flex-end;margin-bottom:12px">'+
    '<button class="btn btn-primary btn-sm" onclick="openModal(\'category\',{})">+ '+(t('newCategory')||'Nueva categoría')+'</button></div>';
  if(!S.categories.length)return btn+'<div class="empty-state"><div class="empty-icon">🏷️</div><div class="empty-title">Sin categorías</div></div>';
  return btn+S.categories.map(function(cat){return renderCatItem(cat);}).join('');
}function toggleCatGroup(id,header){
  const el=document.getElementById(id);
  if(!el)return;
  el.classList.toggle('hidden');
  const arrow=header.querySelector('.cat-arrow');
  if(arrow)arrow.textContent=el.classList.contains('hidden')?'▶':'▼';
}
// ── Nature Bottom Sheet ─────────────────────────────────────
function openNatureSheet(groupKey,label,color){
  closeNatureSheet();
  window._nsKey=groupKey;
  window._nsLabel=label;
  window._nsColor=color;
  var cats=_getNsCats(groupKey);
  var catType=groupKey==='transferencia'?'transferencia':(groupKey==='principal'||groupKey==='secundario')?'ingreso':'gasto';
  var emoji=label.split(' ')[0];
  var name=label.split(' ').slice(1).join(' ');
  var overlay=document.createElement('div');
  overlay.id='ns-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:250;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;animation:bsFadeIn .18s ease';
  overlay.onclick=function(e){if(e.target===overlay)closeNatureSheet();};
  var sheet=document.createElement('div');
  sheet.id='ns-sheet';
  sheet.style.cssText='width:100%;background:var(--surface);border-radius:20px 20px 0 0;max-height:82vh;display:flex;flex-direction:column;animation:bsSlideUp .22s ease';
  sheet.innerHTML=
    '<div style="display:flex;justify-content:center;padding:10px 0 2px"><div style="width:36px;height:4px;background:var(--border);border-radius:2px"></div></div>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 16px 12px;border-bottom:1px solid var(--border)">'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        '<div style="width:34px;height:34px;border-radius:10px;background:'+color+'22;display:flex;align-items:center;justify-content:center;font-size:18px">'+emoji+'</div>'+
        '<div>'+
          '<div style="font-size:15px;font-weight:800;color:var(--text)">'+name+'</div>'+
          '<div id="ns-count-lbl" style="font-size:11px;color:var(--text3)">'+cats.length+' categor'+(cats.length===1?'ía':'ías')+'</div>'+
        '</div>'+
      '</div>'+
      '<button onclick="closeNatureSheet()" style="width:28px;height:28px;border-radius:50%;border:none;background:var(--surface2);color:var(--text2);cursor:pointer;font-size:13px;line-height:1">✕</button>'+
    '</div>'+
    '<div id="ns-cat-list" style="overflow-y:auto;flex:1;padding:10px 12px 8px">'+renderNsItems(cats)+'</div>'+
    '<div style="padding:12px 16px 20px;border-top:1px solid var(--border)">'+
      '<button class="btn btn-primary" style="width:100%;padding:13px" onclick="closeNatureSheet();setTimeout(function(){openModal(\'category\',{defaultType:\''+catType+'\',lockedType:true,lockedNature:\''+groupKey+'\'})},100)">+ Nueva categoría en este grupo</button>'+
    '</div>';
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
}
function _getNsCats(groupKey){
  if(groupKey==='transferencia')return S.categories.filter(function(c){return c.type==='transferencia';});
  if(groupKey==='principal')return S.categories.filter(function(c){return c.type==='ingreso'&&(!c.incomeType||c.incomeType==='principal');});
  if(groupKey==='secundario')return S.categories.filter(function(c){return c.type==='ingreso'&&c.incomeType==='secundario';});
  return S.categories.filter(function(c){return c.type==='gasto'&&c.nature===groupKey;});
}
function closeNatureSheet(){
  var o=document.getElementById('ns-overlay');
  if(o)o.remove();
  window._nsKey=null;
}
function refreshNatureSheet(){
  if(!window._nsKey)return;
  var list=document.getElementById('ns-cat-list');
  if(list){
    var cats=_getNsCats(window._nsKey);
    list.innerHTML=renderNsItems(cats);
    var lbl=document.getElementById('ns-count-lbl');
    if(lbl)lbl.textContent=cats.length+' categor'+(cats.length===1?'ía':'ías');
  }
  var cpnl=document.getElementById('cat-panel-list');
  if(cpnl)cpnl.innerHTML=renderCatList(S._catTab||'gasto');
}
function renderNsItems(cats){
  if(!cats.length)return'<div style="text-align:center;padding:36px 0;color:var(--text3)"><div style="font-size:36px;margin-bottom:10px">🏷️</div><div style="font-size:14px;font-weight:600;color:var(--text2)">Sin categorías</div><div style="font-size:12px;margin-top:4px">Toca el botón de abajo para crear una</div></div>';
  return cats.map(function(cat){return renderCatItemInSheet(cat);}).join('');
}
function renderCatItemInSheet(cat){
  var subs=S.subcategories.filter(function(s){return s.categoryId===cat.id;});
  var domId='ns-catg-'+cat.id;
  var q="'";
  var h='';
  h+='<div class="cat-group" style="border-left:4px solid '+(cat.color||'var(--border)')+';">';
  h+='<div class="cat-group-header" onclick="toggleNsGroup('+q+domId+q+',this)" style="cursor:pointer">';
  h+='<div class="cat-group-left">';
  h+='<div style="width:38px;height:38px;border-radius:10px;background:'+(cat.color||'#64748B')+'22;display:flex;align-items:center;justify-content:center;font-size:18px">'+cat.icon+'</div>';
  h+='<div><div style="font-size:13px;font-weight:700">'+cat.name+'</div>';
  if(subs.length)h+='<span style="font-size:10px;color:var(--text3)">'+subs.length+' subcat'+(subs.length===1?'':'s')+'</span>';
  h+='</div></div>';
  h+='<div style="display:flex;gap:6px;align-items:center">';
  h+='<button class="btn-text" style="font-size:12px" onclick="event.stopPropagation();openModal('+q+'subcategory'+q+',{categoryId:'+q+cat.id+q+'})">+ Sub</button>';
  h+='<button class="btn-del" onclick="event.stopPropagation();deleteCat('+q+cat.id+q+')">🗑</button>';
  if(subs.length)h+='<span class="cat-arrow" style="color:var(--text3);font-size:12px">▶</span>';
  h+='</div></div>';
  h+='<div id="'+domId+'" class="hidden">';
  if(subs.length){
    h+='<div class="subcat-list">';
    subs.forEach(function(s){
      h+='<div class="subcat-item"><span>'+s.icon+' '+s.name+'</span>';
      h+='<div style="display:flex;gap:4px">';
      h+='<button class="btn-text" style="font-size:11px" onclick="openModal('+q+'editSubcategory'+q+',{id:'+q+s.id+q+'})">✏️</button>';
      h+='<button class="btn-del" onclick="deleteSub('+q+s.id+q+')">✕</button>';
      h+='</div></div>';
    });
    h+='</div>';
  }
  h+='</div></div>';
  return h;
}
function toggleNsGroup(id,header){
  var el=document.getElementById(id);
  if(!el)return;
  el.classList.toggle('hidden');
  var arrow=header.querySelector('.cat-arrow');
  if(arrow)arrow.textContent=el.classList.contains('hidden')?'▶':'▼';
}
function deleteCat(id){confirmDialog('🗑️','¿Eliminar categoría?','Se eliminarán sus subcategorías y los movimientos perderán la categoría.',function(){S.categories=softDelete(S.categories,id);S.subcategories=S.subcategories.map(function(s){return s.categoryId===id?Object.assign({},s,{deleted:true,updated_at:new Date().toISOString()}):s;});saveState();refreshNatureSheet();var cpnl=document.getElementById('cat-panel-list');if(cpnl)cpnl.innerHTML=renderCatList(S._catTab||'gasto');if(S.currentPage==='configuracion')renderPage('configuracion');else renderPage('categorias');toast('Eliminada');});}
function deleteSub(id){confirmDialog('🗑️','¿Eliminar subcategoría?','',function(){S.subcategories=softDelete(S.subcategories,id);saveState();refreshNatureSheet();var cpnl=document.getElementById('cat-panel-list');if(cpnl)cpnl.innerHTML=renderCatList(S._catTab||'gasto');if(S.currentPage==='configuracion')renderPage('configuracion');else renderPage('categorias');toast('Eliminada');});}

// ════════════════════════════════════════════════════════════
// I18N — Translations
// ════════════════════════════════════════════════════════════
const TRANSLATIONS = {
  es:{
    dashboard:'Inicio',movements:'Movimientos',accounts:'Cuentas',budgets:'Presupuestos',
    goals:'Metas',payments:'Pagos',debts:'Deudas',analysis:'Análisis',categories:'Categorías',settings:'Configuración',
    newMovement:'Nuevo movimiento',newAccount:'Nueva cuenta',newBudget:'Nuevo presupuesto',
    newGoal:'Nueva meta',newPayment:'Nuevo pago',newDebt:'Nueva deuda',
    balance:'Balance total',income:'Ingresos',expenses:'Gastos',savings:'Ahorro',savingsRate:'Tasa ahorro',
    activeAccounts:'Cuentas activas',totalDebts:'Total deudas',totalSaved:'Total ahorrado',
    recentMovements:'Últimos movimientos',seeAll:'Ver todos',
    type:'Tipo',amount:'Monto',date:'Fecha',description:'Descripción',category:'Categoría',
    subcategory:'Subcategoría',paymentMethod:'Medio de pago',currency:'Moneda',account:'Cuenta',
    income_type:'Ingreso',expense_type:'Gasto',transfer_type:'Transferencia',
    save:'Guardar',cancel:'Cancelar',delete:'Eliminar',edit:'Editar',create:'Crear',
    confirm:'Confirmar',back:'Atrás',close:'Cerrar',
    noData:'Sin datos',noAccounts:'Sin cuentas',noGoals:'Sin metas',
    noPayments:'Sin pagos programados',noDebts:'Sin deudas',noMovements:'Sin movimientos',
    name:'Nombre',limit:'Límite',balance_initial:'Balance inicial',entity:'Entidad Financiera',
    subtype:'Subtipo',color:'Color identificador',icon:'Ícono',
    monthly:'Mensual',frequency:'Frecuencia',nextPayment:'Próximo pago',
    autoPayment:'Pago automático',autoPaymentDesc:'Se debitará automáticamente en la fecha',
    deadline:'Fecha límite',target:'Meta',saved:'Ahorrado',addSavings:'Agregar ahorro',
    linkedAccount:'Cuenta vinculada',pocket:'Bolsillo',addPocket:'＋ Bolsillo',
    fromAccount:'Cuenta origen',toAccount:'Cuenta destino',
    registerPayment:'Registrar pago',suggestedPayment:'Cuota sugerida',
    debtBalance:'Saldo actual',
    preferences:'Preferencias',appearance:'Apariencia',system:'Sistema',
    language:'Idioma',weekStart:'Inicio de semana',activeCurrencies:'Monedas activas',
    theme:'Tema',dark:'Oscuro',light:'Claro',changeTo:'Cambiar a',
    notifications:'Notificaciones',notifGranted:'✅ Activadas',notifDenied:'🚫 Bloqueadas',notifDefault:'⏳ Sin configurar',notifNA:'No disponible',
    export:'Exportar datos',exportDesc:'Descarga respaldo JSON',
    import:'Importar datos',importDesc:'Restaura desde respaldo',
    reset:'Restaurar app',resetDesc:'Elimina TODOS los datos',
    resetConfirm:'¿Restaurar la app?',resetMsg:'Se eliminarán TODOS tus datos. Esta acción es irreversible.',
    monday:'Lunes',sunday:'Domingo',
    search:'Buscar...',selected:'seleccionadas',
    activeText:'activo',passiveText:'pasivo',net:'Patrimonio',
    pockets:'Bolsillos',mainAccount:'Cuenta principal',
    spent:'Gastado',remaining:'Restante',
    installments:'¿A cuántas cuotas?',tcDetected:'(TC detectada)',
    tapOptions:'👆 opciones',
    version:'FinanzIA v3.3 · Datos locales · Hecho con ❤️',
    grpMain:'Principal',grpPlan:'Planificación',grpAnalysis:'Análisis',grpManage:'Gestión',
    grpMoney:'Mi Dinero',grpReports:'Reportes',grpTools:'Herramientas',grpConfig:'Configuración',aiAssistant:'Asistente IA',loanCalc:'Calculadora préstamo',savingsSim:'Simulador de ahorro',
    noEntity:'Sin entidad',accActive:'Activo',accPassive:'Pasivo',
    newCategory:'Nueva categoría',newSubcategory:'Nueva subcategoría',
    pocket:'Bolsillo',addPocket:'＋ Bolsillo',editAccount:'✏️ Editar',
    showMovements:'📋 Movimientos',
    spent:'Gastado',remaining:'Restante',limit:'Límite',
    monthly:'Mensual',
    noSubcategory:'Sin subcategoría',
    goToSettings:'Configuración',
    goal_saved:'Ahorrado',goal_target:'Meta',
    transfer_from:'Cuenta origen',transfer_to:'Cuenta destino',
    add_savings:'Agregar ahorro',register_payment:'Registrar pago',
    budget_group_budgets:'presupuesto',
    scheduled_auto:'🤖 Auto',today:'HOY',overdue:'vencido',
  },
  en:{
    dashboard:'Home',movements:'Transactions',accounts:'Accounts',budgets:'Budgets',
    goals:'Goals',payments:'Payments',debts:'Debts',analysis:'Analysis',categories:'Categories',settings:'Settings',
    newMovement:'New transaction',newAccount:'New account',newBudget:'New budget',
    newGoal:'New goal',newPayment:'New payment',newDebt:'New debt',
    balance:'Total balance',income:'Income',expenses:'Expenses',savings:'Savings',savingsRate:'Savings rate',
    activeAccounts:'Active accounts',totalDebts:'Total debts',totalSaved:'Total saved',
    recentMovements:'Recent transactions',seeAll:'See all',
    type:'Type',amount:'Amount',date:'Date',description:'Description',category:'Category',
    subcategory:'Subcategory',paymentMethod:'Payment method',currency:'Currency',account:'Account',
    income_type:'Income',expense_type:'Expense',transfer_type:'Transfer',
    save:'Save',cancel:'Cancel',delete:'Delete',edit:'Edit',create:'Create',
    confirm:'Confirm',back:'Back',close:'Close',
    noData:'No data',noAccounts:'No accounts',noGoals:'No goals',
    noPayments:'No scheduled payments',noDebts:'No debts',noMovements:'No transactions',
    name:'Name',limit:'Limit',balance_initial:'Initial balance',entity:'Financial Institution',
    subtype:'Subtype',color:'Color',icon:'Icon',
    monthly:'Monthly',frequency:'Frequency',nextPayment:'Next payment',
    autoPayment:'Auto payment',autoPaymentDesc:'Automatically debited on due date',
    deadline:'Deadline',target:'Target',saved:'Saved',addSavings:'Add savings',
    linkedAccount:'Linked account',pocket:'Pocket',addPocket:'＋ Pocket',
    fromAccount:'Source account',toAccount:'Destination account',
    registerPayment:'Register payment',suggestedPayment:'Suggested payment',
    debtBalance:'Current balance',
    preferences:'Preferences',appearance:'Appearance',system:'System',
    language:'Language',weekStart:'Week starts on',activeCurrencies:'Active currencies',
    theme:'Theme',dark:'Dark',light:'Light',changeTo:'Switch to',
    notifications:'Notifications',notifGranted:'✅ Active',notifDenied:'🚫 Blocked',notifDefault:'⏳ Not set',notifNA:'Not available',
    export:'Export data',exportDesc:'Download JSON backup',
    import:'Import data',importDesc:'Restore from backup',
    reset:'Reset app',resetDesc:'Delete ALL data',
    resetConfirm:'Reset the app?',resetMsg:'ALL your data will be deleted. This cannot be undone.',
    monday:'Monday',sunday:'Sunday',
    search:'Search...',selected:'selected',
    activeText:'asset',passiveText:'liability',net:'Net worth',
    pockets:'Pockets',mainAccount:'Main account',
    spent:'Spent',remaining:'Remaining',
    installments:'How many installments?',tcDetected:'(Credit card detected)',
    tapOptions:'👆 options',
    version:'FinanzIA v3.3 · Local data · Made with ❤️',
    grpMain:'Main',grpPlan:'Planning',grpAnalysis:'Analysis',grpManage:'Management',
    grpMoney:'My Money',grpReports:'Reports',grpTools:'Tools',grpConfig:'Settings',aiAssistant:'AI Assistant',loanCalc:'Loan calculator',savingsSim:'Savings simulator',
    noEntity:'No entity',accActive:'Asset',accPassive:'Liability',newCategory:'New category',newSubcategory:'New subcategory',pocket:'Pocket',addPocket:'＋ Pocket',editAccount:'✏️ Edit',showMovements:'📋 Transactions',spent:'Spent',remaining:'Remaining',limit:'Limit',monthly:'Monthly',noSubcategory:'No subcategory',goToSettings:'Settings',goal_saved:'Saved',goal_target:'Target',transfer_from:'From account',transfer_to:'To account',add_savings:'Add savings',register_payment:'Register payment',today:'TODAY',overdue:'overdue',
  },
  pl:{
    dashboard:'Główna',movements:'Transakcje',accounts:'Konta',budgets:'Budżety',
    goals:'Cele',payments:'Płatności',debts:'Długi',analysis:'Analiza',categories:'Kategorie',settings:'Ustawienia',
    newMovement:'Nowa transakcja',newAccount:'Nowe konto',newBudget:'Nowy budżet',
    newGoal:'Nowy cel',newPayment:'Nowa płatność',newDebt:'Nowy dług',
    balance:'Saldo całkowite',income:'Przychody',expenses:'Wydatki',savings:'Oszczędności',savingsRate:'Stopa oszczędności',
    activeAccounts:'Aktywne konta',totalDebts:'Łączne długi',totalSaved:'Łącznie zaoszczędzone',
    recentMovements:'Ostatnie transakcje',seeAll:'Zobacz wszystko',
    type:'Typ',amount:'Kwota',date:'Data',description:'Opis',category:'Kategoria',
    subcategory:'Podkategoria',paymentMethod:'Metoda płatności',currency:'Waluta',account:'Konto',
    income_type:'Przychód',expense_type:'Wydatek',transfer_type:'Przelew',
    save:'Zapisz',cancel:'Anuluj',delete:'Usuń',edit:'Edytuj',create:'Utwórz',
    confirm:'Potwierdź',back:'Wróć',close:'Zamknij',
    noData:'Brak danych',noAccounts:'Brak kont',noGoals:'Brak celów',
    noPayments:'Brak płatności',noDebts:'Brak długów',noMovements:'Brak transakcji',
    name:'Nazwa',limit:'Limit',balance_initial:'Saldo początkowe',entity:'Instytucja finansowa',
    subtype:'Podtyp',color:'Kolor',icon:'Ikona',
    monthly:'Miesięcznie',frequency:'Częstotliwość',nextPayment:'Następna płatność',
    autoPayment:'Auto płatność',autoPaymentDesc:'Automatycznie pobierane w terminie',
    deadline:'Termin',target:'Cel',saved:'Zaoszczędzone',addSavings:'Dodaj oszczędności',
    linkedAccount:'Powiązane konto',pocket:'Skarbonka',addPocket:'＋ Skarbonka',
    fromAccount:'Konto źródłowe',toAccount:'Konto docelowe',
    registerPayment:'Zarejestruj płatność',suggestedPayment:'Sugerowana rata',
    debtBalance:'Aktualne saldo',
    preferences:'Preferencje',appearance:'Wygląd',system:'System',
    language:'Język',weekStart:'Tydzień zaczyna się od',activeCurrencies:'Aktywne waluty',
    theme:'Motyw',dark:'Ciemny',light:'Jasny',changeTo:'Zmień na',
    notifications:'Powiadomienia',notifGranted:'✅ Aktywne',notifDenied:'🚫 Zablokowane',notifDefault:'⏳ Nie skonfigurowane',notifNA:'Niedostępne',
    export:'Eksportuj dane',exportDesc:'Pobierz kopię JSON',
    import:'Importuj dane',importDesc:'Przywróć z kopii',
    reset:'Resetuj aplikację',resetDesc:'Usuń WSZYSTKIE dane',
    resetConfirm:'Zresetować aplikację?',resetMsg:'Wszystkie dane zostaną usunięte. Tej operacji nie można cofnąć.',
    monday:'Poniedziałek',sunday:'Niedziela',
    search:'Szukaj...',selected:'wybrane',
    activeText:'aktyw',passiveText:'pasywo',net:'Majątek netto',
    pockets:'Skarbonki',mainAccount:'Konto główne',
    spent:'Wydano',remaining:'Pozostało',
    installments:'Na ile rat?',tcDetected:'(Karta kredytowa)',
    tapOptions:'👆 opcje',
    version:'FinanzIA v3.3 · Dane lokalne · Zrobione z ❤️',
    grpMain:'Główne',grpPlan:'Planowanie',grpAnalysis:'Analiza',grpManage:'Zarządzanie',
    grpMoney:'Moje Pieniądze',grpReports:'Raporty',grpTools:'Narzędzia',grpConfig:'Ustawienia',aiAssistant:'Asystent AI',loanCalc:'Kalkulator kredytu',savingsSim:'Symulator oszczędności',
    noEntity:'Brak podmiotu',accActive:'Aktyw',accPassive:'Zobowiązanie',newCategory:'Nowa kategoria',pocket:'Skarbonka',addPocket:'＋ Skarbonka',editAccount:'✏️ Edytuj',showMovements:'📋 Transakcje',spent:'Wydano',remaining:'Pozostało',limit:'Limit',monthly:'Miesięcznie',noSubcategory:'Bez podkategorii',goal_saved:'Zaoszczędzone',goal_target:'Cel',today:'DZIŚ',overdue:'przeterminowane',
  },
  pt:{dashboard:'Início',movements:'Transações',accounts:'Contas',budgets:'Orçamentos',goals:'Metas',payments:'Pagamentos',debts:'Dívidas',analysis:'Análise',categories:'Categorias',settings:'Configurações',income:'Receitas',expenses:'Despesas',savings:'Poupança',savingsRate:'Taxa de poupança',balance:'Saldo total',activeAccounts:'Contas ativas',totalDebts:'Total dívidas',totalSaved:'Total poupado',recentMovements:'Transações recentes',seeAll:'Ver tudo',save:'Salvar',cancel:'Cancelar',delete:'Excluir',edit:'Editar',create:'Criar',income_type:'Receita',expense_type:'Despesa',transfer_type:'Transferência',name:'Nome',amount:'Valor',date:'Data',description:'Descrição',category:'Categoria',subcategory:'Subcategoria',paymentMethod:'Forma de pagamento',currency:'Moeda',account:'Conta',noMovements:'Sem transações',noAccounts:'Sem contas',noGoals:'Sem metas',preferences:'Preferências',appearance:'Aparência',system:'Sistema',language:'Idioma',weekStart:'Início da semana',activeCurrencies:'Moedas ativas',theme:'Tema',dark:'Escuro',light:'Claro',changeTo:'Mudar para',notifications:'Notificações',export:'Exportar',import:'Importar',reset:'Restaurar',resetDesc:'Apaga TODOS os dados',monday:'Segunda',sunday:'Domingo',search:'Buscar...',selected:'selecionadas',spent:'Gasto',remaining:'Restante',addSavings:'Adicionar poupança',registerPayment:'Registrar pagamento',tapOptions:'👆 opções',version:'FinanzIA v3.3 · Feito com ❤️',
    grpMain:'Principal',grpPlan:'Planejamento',grpAnalysis:'Análise',grpManage:'Gestão',
    grpMoney:'Meu Dinheiro',grpReports:'Relatórios',grpTools:'Ferramentas',grpConfig:'Configurações',aiAssistant:'Assistente IA',loanCalc:'Calculadora empréstimo',savingsSim:'Simulador poupança',
    noEntity:'Sem entidade',pocket:'Bolso',editAccount:'✏️ Editar',showMovements:'📋 Transações',spent:'Gasto',remaining:'Restante',limit:'Limite',monthly:'Mensal',noSubcategory:'Sem subcategoria',today:'HOJE',overdue:'vencido',
  },
  fr:{dashboard:'Accueil',movements:'Transactions',accounts:'Comptes',budgets:'Budgets',goals:'Objectifs',payments:'Paiements',debts:'Dettes',analysis:'Analyse',categories:'Catégories',settings:'Paramètres',income:'Revenus',expenses:'Dépenses',savings:'Épargne',savingsRate:"Taux d'épargne",balance:'Solde total',activeAccounts:'Comptes actifs',totalDebts:'Total dettes',totalSaved:'Total épargné',recentMovements:'Transactions récentes',seeAll:'Voir tout',save:'Enregistrer',cancel:'Annuler',delete:'Supprimer',edit:'Modifier',create:'Créer',income_type:'Revenu',expense_type:'Dépense',transfer_type:'Virement',name:'Nom',amount:'Montant',date:'Date',description:'Description',category:'Catégorie',subcategory:'Sous-catégorie',paymentMethod:'Moyen de paiement',currency:'Devise',account:'Compte',noMovements:'Aucune transaction',noAccounts:'Aucun compte',noGoals:'Aucun objectif',preferences:'Préférences',appearance:'Apparence',system:'Système',language:'Langue',weekStart:'Début de semaine',activeCurrencies:'Devises actives',theme:'Thème',dark:'Sombre',light:'Clair',changeTo:'Passer en',notifications:'Notifications',export:'Exporter',import:'Importer',reset:'Réinitialiser',resetDesc:'Supprime TOUTES les données',monday:'Lundi',sunday:'Dimanche',search:'Rechercher...',selected:'sélectionnées',spent:'Dépensé',remaining:'Restant',addSavings:'Ajouter épargne',registerPayment:'Enregistrer paiement',tapOptions:'👆 options',version:'FinanzIA v3.3 · Fait avec ❤️',
    grpMain:'Principal',grpPlan:'Planification',grpAnalysis:'Analyse',grpManage:'Gestion',
    grpMoney:'Mon Argent',grpReports:'Rapports',grpTools:'Outils',grpConfig:'Paramètres',aiAssistant:'Assistant IA',loanCalc:'Calculateur prêt',savingsSim:'Simulateur épargne',
    noEntity:'Sans entité',pocket:'Poche',editAccount:'✏️ Modifier',showMovements:'📋 Transactions',spent:'Dépensé',remaining:'Restant',limit:'Limite',monthly:'Mensuel',noSubcategory:'Sans sous-catégorie',today:'AUJOURD\'HUI',overdue:'expiré',
  },
  de:{dashboard:'Übersicht',movements:'Transaktionen',accounts:'Konten',budgets:'Budgets',goals:'Ziele',payments:'Zahlungen',debts:'Schulden',analysis:'Analyse',categories:'Kategorien',settings:'Einstellungen',income:'Einnahmen',expenses:'Ausgaben',savings:'Ersparnisse',savingsRate:'Sparquote',balance:'Gesamtguthaben',activeAccounts:'Aktive Konten',totalDebts:'Gesamtschulden',totalSaved:'Gespart',recentMovements:'Letzte Transaktionen',seeAll:'Alle sehen',save:'Speichern',cancel:'Abbrechen',delete:'Löschen',edit:'Bearbeiten',create:'Erstellen',income_type:'Einnahme',expense_type:'Ausgabe',transfer_type:'Überweisung',name:'Name',amount:'Betrag',date:'Datum',description:'Beschreibung',category:'Kategorie',subcategory:'Unterkategorie',paymentMethod:'Zahlungsmethode',currency:'Währung',account:'Konto',noMovements:'Keine Transaktionen',noAccounts:'Keine Konten',noGoals:'Keine Ziele',preferences:'Einstellungen',appearance:'Erscheinungsbild',system:'System',language:'Sprache',weekStart:'Wochenstart',activeCurrencies:'Aktive Währungen',theme:'Design',dark:'Dunkel',light:'Hell',changeTo:'Wechseln zu',notifications:'Benachrichtigungen',export:'Exportieren',import:'Importieren',reset:'Zurücksetzen',resetDesc:'Löscht ALLE Daten',monday:'Montag',sunday:'Sonntag',search:'Suchen...',selected:'ausgewählt',spent:'Ausgegeben',remaining:'Verbleibend',addSavings:'Ersparnis hinzufügen',registerPayment:'Zahlung registrieren',tapOptions:'👆 Optionen',version:'FinanzIA v3.3 · Mit ❤️ gemacht',
    grpMain:'Hauptmenü',grpPlan:'Planung',grpAnalysis:'Analyse',grpManage:'Verwaltung',
    grpMoney:'Mein Geld',grpReports:'Berichte',grpTools:'Werkzeuge',grpConfig:'Einstellungen',aiAssistant:'KI-Assistent',loanCalc:'Kreditrechner',savingsSim:'Sparrechner',
    noEntity:'Kein Institut',pocket:'Sparkässchen',editAccount:'✏️ Bearbeiten',showMovements:'📋 Transaktionen',spent:'Ausgegeben',remaining:'Verbleibend',limit:'Limit',monthly:'Monatlich',noSubcategory:'Keine Unterkategorie',today:'HEUTE',overdue:'überfällig',
  },
  it:{dashboard:'Dashboard',movements:'Transazioni',accounts:'Conti',budgets:'Budget',goals:'Obiettivi',payments:'Pagamenti',debts:'Debiti',analysis:'Analisi',categories:'Categorie',settings:'Impostazioni',income:'Entrate',expenses:'Uscite',savings:'Risparmi',savingsRate:'Tasso di risparmio',balance:'Saldo totale',activeAccounts:'Conti attivi',totalDebts:'Totale debiti',totalSaved:'Totale risparmiato',recentMovements:'Transazioni recenti',seeAll:'Vedi tutto',save:'Salva',cancel:'Annulla',delete:'Elimina',edit:'Modifica',create:'Crea',income_type:'Entrata',expense_type:'Uscita',transfer_type:'Trasferimento',name:'Nome',amount:'Importo',date:'Data',description:'Descrizione',category:'Categoria',subcategory:'Sottocategoria',paymentMethod:'Metodo di pagamento',currency:'Valuta',account:'Conto',noMovements:'Nessuna transazione',noAccounts:'Nessun conto',noGoals:'Nessun obiettivo',preferences:'Preferenze',appearance:'Aspetto',system:'Sistema',language:'Lingua',weekStart:'Inizio settimana',activeCurrencies:'Valute attive',theme:'Tema',dark:'Scuro',light:'Chiaro',changeTo:'Passa a',notifications:'Notifiche',export:'Esporta',import:'Importa',reset:'Ripristina',resetDesc:'Elimina TUTTI i dati',monday:'Lunedì',sunday:'Domenica',search:'Cerca...',selected:'selezionate',spent:'Speso',remaining:'Rimanente',addSavings:'Aggiungi risparmio',registerPayment:'Registra pagamento',tapOptions:'👆 opzioni',version:'FinanzIA v3.3 · Fatto con ❤️',
    grpMain:'Principale',grpPlan:'Pianificazione',grpAnalysis:'Analisi',grpManage:'Gestione',
    grpMoney:'I Miei Soldi',grpReports:'Rapporti',grpTools:'Strumenti',grpConfig:'Impostazioni',aiAssistant:'Assistente IA',loanCalc:'Calcolatore prestito',savingsSim:'Simulatore risparmio',
    noEntity:'Nessun istituto',pocket:'Salvadanaio',editAccount:'✏️ Modifica',showMovements:'📋 Transazioni',spent:'Speso',remaining:'Rimanente',limit:'Limite',monthly:'Mensile',noSubcategory:'Nessuna sottocategoria',today:'OGGI',overdue:'scaduto',
  },
};
function t(key){const lang=S.language||'es';return(TRANSLATIONS[lang]||TRANSLATIONS.es)[key]||TRANSLATIONS.es[key]||key;}

// ════════════════════════════════════════════════════════════
// HERRAMIENTAS
// ════════════════════════════════════════════════════════════
function renderHerramientas(){
  setTimeout(function(){
    var msgs=document.getElementById('ai-messages');
    if(msgs&&aiHistory.length>0)msgs.scrollTop=msgs.scrollHeight;
  },50);
  var now=new Date();
  var hh=now.getHours().toString().padStart(2,'0');
  var mm=now.getMinutes().toString().padStart(2,'0');
  var timeStr=hh+':'+mm;
  var quickBtns=['📊 Salud financiera','💸 ¿En qué gasto más?','🎯 Mis metas','⚠️ Mis deudas'].map(function(q){
    return '<button class="ai-quick-btn" onclick="aiQuickQuestion(\'' + q + '\')">'+q+'</button>';
  }).join('');
  return '<div class="ai-chat-wrap">'
    +'<div class="ai-chat-header">'
      +'<div class="ai-chat-avatar">🤖</div>'
      +'<div class="ai-chat-info">'
        +'<div class="ai-chat-name">Emiliano</div>'
        +'<div class="ai-chat-status">💼 Wealth Manager · FinanzIA</div>'
      +'</div>'
    +'</div>'
    +'<div class="ai-messages" id="ai-messages">'
      +'<div class="ai-date-sep"><span>Hoy</span></div>'
      +'<div class="ai-msg ai-msg-bot">'
        +'<div>👋 ¡Hola! Soy <strong>Emiliano</strong>, tu Wealth Manager personal. Tengo acceso a tus datos financieros en tiempo real y puedo ayudarte con análisis, estrategias y consejos personalizados.<br><br>¿En qué te puedo ayudar hoy?<br><br><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:4px">'+quickBtns+'</div></div>'
        +'<div class="ai-msg-time">'+timeStr+'</div>'
      +'</div>'
    +'</div>'
    +'<div class="ai-input-bar">'
      +'<button class="ai-attach-btn" onclick="aiAttach()" title="Adjuntar">'
        +'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>'
      +'</button>'
      +'<div id="ai-input-div" class="ai-input-area" contenteditable="true" data-placeholder="Mensaje a Emiliano..." onkeydown="if(event.key===\'Enter\'&&(event.ctrlKey||event.metaKey)){event.preventDefault();sendAiMessage();}"></div>'
      +'<button class="ai-send-btn" id="ai-send-btn" onclick="aiSendOrRecord()">'
        +'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v4M8 23h8"/></svg>'
      +'</button>'
    +'</div>'
    +'<input type="file" id="ai-file-input" accept="image/*,application/pdf" style="display:none" onchange="aiHandleAttachment(event)">'
  +'</div>';
}

// ════════════════════════════════════════════════════════════
// SIMULADORES HUB
// ════════════════════════════════════════════════════════════
function renderSimuladores(){
  var sims=[
    {icon:'💰',label:'Ahorro',sub:'Proyecta tu dinero en el tiempo',page:'simulador',color:'#00D4AA'},
    {icon:'📐',label:'Créditos',sub:'Calcula cuotas y amortización',page:'calculadora',color:'#EF4444'},
    {icon:'👴',label:'Jubilación',sub:'Planifica tu retiro',page:'jubilacion',color:'#7461EF'},
    {icon:'🛡️',label:'Emergencia',sub:'Construye tu colchón financiero',page:'emergencia',color:'#10B981'},
    {icon:'💸',label:'Inflación',sub:'Protege tu poder adquisitivo',page:'inflacion',color:'#F59E0B'},
    {icon:'📊',label:'Rentabilidad',sub:'Mide el retorno de tus inversiones',page:'rentabilidad',color:'#3B82F6'},
  ];
  var html='<div style="font-size:12px;color:var(--text2);margin-bottom:16px;line-height:1.5">Elige el simulador que necesitas. Cada uno te ayuda a tomar mejores decisiones financieras.</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">';
  sims.forEach(function(s){
    html+='<button onclick="navigate(\''+s.page+'\')" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 6px 12px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--card-shadow);border-top:3px solid '+s.color+';border-radius:16px;cursor:pointer;gap:6px;font-family:var(--font);min-height:90px;width:100%">';
    html+='<span style="font-size:26px;line-height:1">'+s.icon+'</span>';
    html+='<span style="font-size:11px;font-weight:700;color:var(--text);text-align:center">'+s.label+'</span>';
    // subtitulo quitado para 3 cols
    html+='</button>';
  });
  html+='</div>';
  return html;
}

// ════════════════════════════════════════════════════════════
// TEST DE SALUD FINANCIERA
// ════════════════════════════════════════════════════════════
var TEST_QUESTIONS=[
  {id:1,cat:'Ahorro y Finanzas',q:'¿Tienes un presupuesto mensual?',
   opts:['Sí, y lo sigo todos los meses','Sí, pero no siempre lo cumplo','No tengo un presupuesto'],pts:[6,3,0]},
  {id:2,cat:'Ahorro y Finanzas',q:'¿Has tenido problemas para pagar recibos y gastos fijos en el último año?',
   opts:['Nunca','Algunas veces','Con frecuencia','Casi siempre'],pts:[6,4,1,0]},
  {id:3,cat:'Ahorro y Finanzas',q:'¿Cómo terminas el mes financieramente?',
   opts:['Siempre me sobra y lo ahorro','Me sobra algo de dinero','Gasto todo lo que ingreso','Gasto más de lo que ingreso'],pts:[6,4,1,0]},
  {id:4,cat:'Ahorro y Finanzas',q:'¿Qué porcentaje de tus ingresos ahorras mensualmente?',
   opts:['Más de 20% (ideal automático)','Entre 10% y 20%','Menos de 10%','Solo si sobra algo','No ahorro / No lo sé'],pts:[6,4,2,1,0]},
  {id:5,cat:'Inversión y Gestión de Gastos',q:'Si hoy tuvieras un gasto imprevisto de 1.000, ¿cómo lo afrontarías?',
   opts:['Lo pago sin problema con mis ahorros','Podría preocuparme un poco','Tendría que pedir prestado parcialmente','Casi seguro tendría que endeudarme'],pts:[6,4,1,0]},
  {id:6,cat:'Inversión y Gestión de Gastos',q:'¿Llevas un registro detallado de tus gastos?',
   opts:['Sí, registro cada pago','Anoto lo más importante','Tengo idea general','No controlo mis gastos'],pts:[6,4,2,0]},
  {id:7,cat:'Protección',q:'¿Qué porcentaje de tus ingresos va destinado a deudas (sin hipoteca)?',
   opts:['No tengo deudas','Menos del 5%','Entre el 5% y 10%','Más del 10%','No lo sé'],pts:[6,5,3,0,1]},
  {id:8,cat:'Protección',q:'¿Cómo gestionas tu tarjeta de crédito?',
   opts:['Pago todo a fin de mes','Pago una cuota mensual','Pago el mínimo','No tengo tarjeta / No lo sé'],pts:[6,3,0,4]},
  {id:9,cat:'Futuro e Inversión',q:'¿Inviertes actualmente parte de tus ahorros?',
   opts:['Sí, en bolsa/fondos/planes','En depósitos o cuentas remuneradas','Aún no invierto'],pts:[6,4,0]},
  {id:10,cat:'Futuro e Inversión',q:'¿Tienes un fondo de emergencia o seguro para imprevistos?',
   opts:['Sí, completo y actualizado','Algo ahorrado o seguro básico','Poco o insuficiente','Nada previsto'],pts:[6,4,1,0]},
  {id:11,cat:'Futuro e Inversión',q:'¿Podrías afrontar varios meses sin ingresos?',
   opts:['Sí, al menos 3 meses cubiertos','Solo 1 mes','Ninguno'],pts:[6,3,0]},
  {id:12,cat:'Planificación y Jubilación',q:'¿Tu familia podría mantener su nivel de vida sin tus ingresos?',
   opts:['Sí, con ahorro o seguro','No'],pts:[5,0]},
  {id:13,cat:'Planificación y Jubilación',q:'¿Podrías seguir pagando la hipoteca/arriendo sin tus ingresos?',
   opts:['Sí, con colchón o seguro','No'],pts:[5,0]},
  {id:14,cat:'Planificación y Jubilación',q:'¿Te ves cumpliendo tus objetivos financieros actuales?',
   opts:['Totalmente de acuerdo','Bastante de acuerdo','Neutral','Poco de acuerdo','No lo sé'],pts:[6,4,2,1,0]},
  {id:15,cat:'Planificación y Jubilación',q:'¿Confías en mantener tu nivel de vida al jubilarte?',
   opts:['Sí','Parcialmente','No'],pts:[6,3,0]},
  {id:16,cat:'Planificación y Jubilación',q:'¿Qué parte de tus gastos cubriría un 3% anual de tus inversiones?',
   opts:['Todos mis gastos','Gastos fijos + alimentación','Gastos básicos','Pequeños gastos','Nada'],pts:[6,4,2,1,0]},
  {id:17,cat:'Planificación y Jubilación',q:'¿Planificas tus gastos y objetivos con antelación?',
   opts:['Totalmente de acuerdo','Bastante de acuerdo','Neutral','Poco de acuerdo','No lo hago'],pts:[6,4,2,1,0]},
  {id:18,cat:'Planificación y Jubilación',q:'¿Tus finanzas están controladas a largo plazo?',
   opts:['Totalmente de acuerdo','Bastante de acuerdo','Neutral','Poco de acuerdo','No lo sé'],pts:[6,4,2,1,0]}
];
var TEST_LEVELS=[
  {min:0,max:24,emoji:'🔴',label:'Salud Financiera Precaria',color:'#EF4444',
   desc:'Tu situación financiera requiere atención inmediata. Es fundamental establecer un presupuesto, crear un fondo de emergencia y buscar asesoramiento profesional.',
   actions:['Crea un presupuesto básico: anota todos tus ingresos y gastos durante 1 mes','Elimina gastos innecesarios (suscripciones, comidas fuera, compras impulsivas)','Evita nuevas deudas y paga preferiblemente en efectivo o débito','Negocia con acreedores si tienes deudas impagadas','Busca aumentar ingresos: trabajo adicional o venta de artículos','Consulta con un asesor financiero o servicio de ayuda de deudas']},
  {min:25,max:40,emoji:'🟠',label:'Salud Financiera Preocupante',color:'#F97316',
   desc:'Estás en una situación frágil. Necesitas construir bases financieras sólidas y desarrollar mejores hábitos de ahorro.',
   actions:['Establece un presupuesto mensual realista y síguelo','Crea un fondo de emergencia inicial (mínimo 1 mes de gastos)','Prioriza el pago de deudas con intereses altos','Automatiza un ahorro mínimo mensual aunque sea pequeño','Aprende educación financiera básica: libros, podcasts, cursos gratuitos']},
  {min:41,max:59,emoji:'🟡',label:'Salud Financiera Buena',color:'#EAB308',
   desc:'Tienes bases sólidas pero hay margen importante de mejora. Es momento de optimizar y establecer objetivos más ambiciosos.',
   actions:['Aumenta tu fondo de emergencia (objetivo: 3-6 meses de gastos)','Establece objetivos financieros a corto, medio y largo plazo','Comienza a invertir si aún no lo haces (fondos indexados, planes de pensiones)','Revisa y optimiza tus seguros de vida, hogar y salud','Aumenta el porcentaje de ahorro mensual (objetivo: 15-20% de ingresos)']},
  {min:60,max:79,emoji:'🟢',label:'Salud Financiera Muy Saludable',color:'#22C55E',
   desc:'Excelente trabajo. Tienes hábitos financieros sólidos. Enfócate en maximizar tu patrimonio y planificación a largo plazo.',
   actions:['Maximiza tus inversiones: diversifica entre renta variable, fija y alternativos','Optimiza fiscalmente tus inversiones (planes de pensiones, seguros fiscales)','Revisa tu cartera de inversión al menos 2 veces al año','Planifica tu jubilación activamente con cálculos reales','Protege tu patrimonio con seguros de vida y responsabilidad civil']},
  {min:80,max:100,emoji:'🌟',label:'Salud Financiera Excelente',color:'#10B981',
   desc:'Estás en la élite financiera. Tu desafío es mantener, proteger y hacer crecer tu patrimonio de forma eficiente.',
   actions:['Trabaja con un asesor financiero para optimización fiscal y patrimonial','Diversifica internacionalmente tus inversiones','Optimiza tu estructura patrimonial si aplica','Rebalancea tu cartera regularmente según tu estrategia','Prepara plan de sucesión y disfruta de tu éxito financiero']}
];
var _testAnswers={};
function _calcTestData(){
  // Calculate financial data from real app state
  var now=new Date();
  var curMonth=now.getMonth(), curYear=now.getFullYear();
  var cur=S.currency||'';

  // Last 3 months transactions for averages
  var recentTxs=S.transactions.filter(function(t){
    if(t.currency!==cur)return false;
    var d=new Date(t.date);
    var monthsAgo=(curYear-d.getFullYear())*12+(curMonth-d.getMonth());
    return monthsAgo>=0&&monthsAgo<=2;
  });

  // This month
  var thisMonthTxs=S.transactions.filter(function(t){
    var d=new Date(t.date);
    return t.currency===cur&&d.getMonth()===curMonth&&d.getFullYear()===curYear;
  });
  var monthInc=thisMonthTxs.filter(function(t){return t.type==='ingreso';}).reduce(function(s,t){return s+(parseFloat(t.amount)||0);},0);
  var monthExp=thisMonthTxs.filter(function(t){return t.type==='gasto';}).reduce(function(s,t){return s+(parseFloat(t.amount)||0);},0);

  // 3-month averages
  var avgInc=recentTxs.filter(function(t){return t.type==='ingreso';}).reduce(function(s,t){return s+(parseFloat(t.amount)||0);},0)/3;
  var avgExp=recentTxs.filter(function(t){return t.type==='gasto';}).reduce(function(s,t){return s+(parseFloat(t.amount)||0);},0)/3;

  // Savings rate this month
  var savingsRate=monthInc>0?((monthInc-monthExp)/monthInc*100):null;

  // Total liquid assets (activos)
  var totalAssets=S.accounts.filter(function(a){return a.type==='activo'&&(a.currency||cur)===cur;}).reduce(function(s,a){return s+getBalance(a.id);},0);

  // Monthly debt payments from debts
  var debtPayments=S.debts?S.debts.filter(function(d){return(d.currency||cur)===cur;}).reduce(function(s,d){return s+(parseFloat(d.monthlyPayment)||0);},0):0;
  var debtRatio=avgInc>0?(debtPayments/avgInc*100):null;

  // Emergency fund coverage (months)
  var emergencyMonths=avgExp>0?(totalAssets/avgExp):null;

  // Has budget
  var hasBudget=S.budgets&&S.budgets.length>0;

  // Savings transactions (categoria ahorro)
  var savingsCats=S.categories?S.categories.filter(function(c){return c.nature==='ahorros';}).map(function(c){return c.id;}):[];
  var savingsTxs=thisMonthTxs.filter(function(t){return savingsCats.indexOf(t.categoryId)!==-1;});
  var monthlySavings=savingsTxs.reduce(function(s,t){return s+(parseFloat(t.amount)||0);},0);
  var actualSavingsRate=monthInc>0?(monthlySavings/monthInc*100):null;

  return{
    monthInc:monthInc, monthExp:monthExp, avgInc:avgInc, avgExp:avgExp,
    savingsRate:savingsRate, actualSavingsRate:actualSavingsRate,
    totalAssets:totalAssets, debtPayments:debtPayments, debtRatio:debtRatio,
    emergencyMonths:emergencyMonths, hasBudget:hasBudget,
    hasTransactions:recentTxs.length>0
  };
}
function _autoSelectTest(d){
  var auto={};
  var MIN_TX=5; // minimum transactions to trust averages

  // Q1: Has budget — always calculable (we know if budgets exist)
  // hasBudget=true → "Sí, y lo sigo" | false → "No tengo presupuesto"
  if(d.hasBudget){
    auto[1]={idx:0,note:'Detectamos '+S.budgets.length+' presupuesto(s) activo(s) en la app'};
  } else {
    auto[1]={idx:2,note:'No hay presupuestos registrados en la app'};
  }

  // Q3: How month ends — only if enough transactions this month (both income AND expenses)
  var hasMonthData=d.monthInc>0&&d.monthExp>0&&d.hasTransactions;
  if(hasMonthData){
    var diff=d.monthInc-d.monthExp;
    var pct=diff/d.monthInc*100;
    var note3='Este mes: ingresos '+fmt(d.monthInc)+', gastos '+fmt(d.monthExp);
    if(pct>15)auto[3]={idx:0,note:note3};
    else if(pct>0)auto[3]={idx:1,note:note3};
    else if(pct>=-5)auto[3]={idx:2,note:note3};
    else auto[3]={idx:3,note:'Este mes gastos ('+fmt(d.monthExp)+') superan ingresos ('+fmt(d.monthInc)+')'};
  }

  // Q4: Savings rate — only if enough tx AND income this month
  // Using income vs expenses ratio (not just savings category, which may be incomplete)
  if(d.monthInc>0&&d.hasTransactions&&d.savingsRate!==null){
    var sr=d.savingsRate;
    var note4='Basado en ingresos vs gastos este mes: '+(sr>0?Math.round(sr)+'% disponible':'gastos >= ingresos');
    if(sr>20)auto[4]={idx:0,note:note4};
    else if(sr>=10)auto[4]={idx:1,note:note4};
    else if(sr>0)auto[4]={idx:2,note:note4};
    else if(sr===0)auto[4]={idx:3,note:note4};
    else auto[4]={idx:4,note:note4};
  }

  // Q5: Can cover emergency — only if user has registered accounts
  var hasAccounts=S.accounts&&S.accounts.filter(function(a){
    return a.type==='activo'&&(a.currency||S.currency)===S.currency;
  }).length>0;
  if(hasAccounts){
    var ref=1000;
    var note5='Saldo total en cuentas registradas: '+fmt(d.totalAssets);
    if(d.totalAssets>ref*3)auto[5]={idx:0,note:note5};
    else if(d.totalAssets>ref)auto[5]={idx:1,note:note5};
    else if(d.totalAssets>0)auto[5]={idx:2,note:note5};
    else auto[5]={idx:3,note:note5+' (puede tener ahorros externos no registrados)'};
  }

  // Q7: Debt ratio — only if debts are registered AND income average is reliable
  var hasDebts=S.debts&&S.debts.filter(function(dbt){
    return(dbt.currency||S.currency)===S.currency;
  }).length>0;
  if(hasDebts&&d.avgInc>0&&d.hasTransactions){
    var note7='Pagos deuda registrados: '+fmt(d.debtPayments)+'/mes · Ingresos prom: '+fmt(d.avgInc);
    if(d.debtPayments===0)auto[7]={idx:0,note:'Deudas registradas sin cuota mensual asignada'};
    else if(d.debtRatio<5)auto[7]={idx:1,note:note7+' ('+Math.round(d.debtRatio)+'%)'};
    else if(d.debtRatio<=10)auto[7]={idx:2,note:note7+' ('+Math.round(d.debtRatio)+'%)'};
    else auto[7]={idx:3,note:note7+' ('+Math.round(d.debtRatio)+'%)'};
  }

  // Q10 & Q11: Emergency fund / months without income
  // Only if: accounts registered + enough expense transactions to trust avgExp
  var recentExpTxs=S.transactions.filter(function(t){
    var now=new Date();
    var d2=new Date(t.date);
    var mo=(now.getFullYear()-d2.getFullYear())*12+(now.getMonth()-d2.getMonth());
    return t.type==='gasto'&&t.currency===S.currency&&mo>=0&&mo<=2;
  }).length;
  if(hasAccounts&&recentExpTxs>=MIN_TX&&d.avgExp>0){
    var em=d.emergencyMonths;
    var note10='Cobertura estimada: '+em.toFixed(1)+' meses (saldo '+fmt(d.totalAssets)+' / gasto prom. '+fmt(d.avgExp)+')';
    if(em>=3)auto[10]={idx:0,note:note10};
    else if(em>=1)auto[10]={idx:1,note:note10};
    else if(em>0)auto[10]={idx:2,note:note10};
    else auto[10]={idx:3,note:note10};

    var note11='Reservas estimadas para ~'+em.toFixed(1)+' mes'+(em!==1?'es':'');
    if(em>=3)auto[11]={idx:0,note:note11};
    else if(em>=1)auto[11]={idx:1,note:note11};
    else auto[11]={idx:2,note:note11};
  }

  return auto;
}
function renderTest(){
  _testAnswers={};
  var data=_calcTestData();
  var autoSel=_autoSelectTest(data);
  // Pre-populate answers with auto-calculated ones
  Object.keys(autoSel).forEach(function(qId){
    _testAnswers[parseInt(qId)]=autoSel[qId].idx;
  });
  var history=S.testHistory||[];
  var h='';
  // Info card
  h+='<div class="card" style="margin-bottom:14px;padding:14px;border-left:3px solid #7461EF">';
  h+='<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">🏥 ¿Para qué sirve?</div>';
  h+='<div style="font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:10px">Evalúa tu situación financiera en 5 áreas clave. Donde tenemos tus datos reales, pre-calculamos la respuesta. Siempre puedes ajustarla.</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h+='<div style="background:rgba(116,97,239,.08);border-radius:var(--radius-sm);padding:8px"><div style="font-size:9px;font-weight:700;color:#7461EF;margin-bottom:4px;text-transform:uppercase">18 preguntas</div><div style="font-size:11px;color:var(--text2);line-height:1.5">5 categorías · ~5 min · Sé honesto/a</div></div>';
  h+='<div style="background:rgba(0,212,170,.08);border-radius:var(--radius-sm);padding:8px"><div style="font-size:9px;font-weight:700;color:var(--primary);margin-bottom:4px;text-transform:uppercase">Inteligente</div><div style="font-size:11px;color:var(--text2);line-height:1.5">Usa tus datos reales para pre-calcular respuestas</div></div>';
  h+='</div></div>';
  // Auto-calculated summary
  var autoCount=Object.keys(autoSel).length;
  if(autoCount>0){
    h+='<div style="background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.25);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:14px;font-size:11px;color:var(--text2);line-height:1.6">';
    h+='✨ <strong>'+autoCount+' respuestas pre-calculadas</strong> con tus datos reales. Revísalas y ajusta si es necesario.';
    h+='</div>';
  } else if(!data.hasTransactions){
    h+='<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.3);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:14px;font-size:11px;color:var(--text2);line-height:1.6">';
    h+='💡 Aún no tienes movimientos registrados. Responde todas las preguntas manualmente. Cuando registres datos, el test se personalizará aún más.';
    h+='</div>';
  }
  // Last result
  if(history.length){
    var last=history[history.length-1];
    var lv=TEST_LEVELS.find(function(l){return last.score>=l.min&&last.score<=l.max;})||TEST_LEVELS[0];
    h+='<div class="card" style="margin-bottom:14px;padding:12px">';
    h+='<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Último resultado</div>';
    h+='<div style="display:flex;align-items:center;gap:12px">';
    h+='<div style="width:56px;height:56px;border-radius:50%;border:4px solid '+lv.color+';display:flex;align-items:center;justify-content:center;flex-shrink:0">';
    h+='<div style="text-align:center"><div style="font-size:15px;font-weight:900;color:'+lv.color+'">'+last.score+'</div><div style="font-size:8px;color:var(--text3)">/ 100</div></div></div>';
    h+='<div><div style="font-size:13px;font-weight:700;color:var(--text)">'+lv.emoji+' '+lv.label+'</div>';
    h+='<div style="font-size:10px;color:var(--text3);margin-top:2px">'+last.date+'</div></div></div></div>';
  }
  // Questions
  var currentCat='';
  var catEmojis={'Ahorro y Finanzas':'📊','Inversión y Gestión de Gastos':'💰','Protección':'🛡️','Futuro e Inversión':'🚀','Planificación y Jubilación':'📅'};
  TEST_QUESTIONS.forEach(function(q){
    if(q.cat!==currentCat){
      currentCat=q.cat;
      h+='<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin:16px 0 8px;padding-left:2px">';
      h+=(catEmojis[q.cat]||'')+' '+q.cat+'</div>';
    }
    var auto=autoSel[q.id];
    h+='<div class="card" style="margin-bottom:10px;padding:14px'+(auto?';border-color:rgba(0,212,170,.3)':'')+'" id="tq-'+q.id+'">';
    h+='<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px">';
    h+='<div style="font-size:12px;font-weight:700;color:var(--text);line-height:1.4"><span style="color:var(--primary);font-size:11px;margin-right:6px">'+q.id+'.</span>'+q.q+'</div>';
    if(auto){
      h+='<div style="flex-shrink:0;background:rgba(0,212,170,.15);border-radius:20px;padding:3px 8px;font-size:9px;font-weight:700;color:var(--primary);white-space:nowrap">✦ Auto</div>';
    }
    h+='</div>';
    if(auto){
      h+='<div style="font-size:10px;color:var(--primary);margin-bottom:8px;padding:6px 10px;background:rgba(0,212,170,.08);border-radius:var(--radius-sm);line-height:1.4">📊 '+auto.note+'</div>';
    }
    h+='<div style="display:flex;flex-direction:column;gap:6px">';
    q.opts.forEach(function(opt,i){
      var isSel=_testAnswers[q.id]===i;
      h+='<button onclick="testSelectOpt('+q.id+','+i+')" id="topt-'+q.id+'-'+i+'"';
      h+=' style="text-align:left;padding:10px 12px;background:'+(isSel?'var(--primary)':'var(--surface2)')+';border:1.5px solid '+(isSel?'var(--primary)':'var(--border)')+';border-radius:var(--radius-sm);font-size:12px;color:'+(isSel?'white':'var(--text)')+';cursor:pointer;font-family:var(--font);transition:.15s;line-height:1.4">';
      h+=opt+'</button>';
    });
    h+='</div></div>';
  });
  h+='<button onclick="testSubmit()" style="width:100%;padding:16px;background:linear-gradient(135deg,#7461EF,#00D4AA);border:none;border-radius:var(--radius);font-size:15px;font-weight:800;color:white;cursor:pointer;font-family:var(--font);margin-top:4px;margin-bottom:20px">Ver mi resultado →</button>';
  return h;
}

function testSelectOpt(qId,optIdx){
  _testAnswers[qId]=optIdx;
  var q=TEST_QUESTIONS.find(function(x){return x.id===qId;});
  if(!q)return;
  q.opts.forEach(function(_,i){
    var btn=document.getElementById('topt-'+qId+'-'+i);
    if(!btn)return;
    var sel=i===optIdx;
    btn.style.background=sel?'var(--primary)':'var(--surface2)';
    btn.style.color=sel?'white':'var(--text)';
    btn.style.borderColor=sel?'var(--primary)':'var(--border)';
  });
  // Highlight card
  var card=document.getElementById('tq-'+qId);
  if(card)card.style.borderColor='rgba(0,212,170,.4)';
}
function testSubmit(){
  var answered=Object.keys(_testAnswers).length;
  if(answered<18){
    toast('Responde todas las preguntas ('+(18-answered)+' pendientes)');
    // Scroll to first unanswered
    for(var i=1;i<=18;i++){
      if(_testAnswers[i]===undefined){
        var card=document.getElementById('tq-'+i);
        if(card)card.scrollIntoView({behavior:'smooth',block:'center'});
        card.style.borderColor='var(--danger)';
        break;
      }
    }
    return;
  }
  var score=0;
  var catScores={};
  TEST_QUESTIONS.forEach(function(q){
    var optIdx=_testAnswers[q.id];
    var pts=q.pts[optIdx]||0;
    score+=pts;
    if(!catScores[q.cat])catScores[q.cat]={pts:0,max:0};
    catScores[q.cat].pts+=pts;
    catScores[q.cat].max+=Math.max.apply(null,q.pts);
  });
  // Normalize to 100
  var maxTotal=TEST_QUESTIONS.reduce(function(s,q){return s+Math.max.apply(null,q.pts);},0);
  var normalized=Math.round(score/maxTotal*100);
  // Save to history
  if(!S.testHistory)S.testHistory=[];
  var now=new Date();
  var dateStr=now.getDate().toString().padStart(2,'0')+'/'+(now.getMonth()+1).toString().padStart(2,'0')+'/'+now.getFullYear();
  S.testHistory.push({score:normalized,raw:score,date:dateStr,cats:catScores});
  if(S.testHistory.length>10)S.testHistory.shift();
  saveState();
  showTestResult(normalized,catScores);
}
function showTestResult(score,catScores){
  var lv=TEST_LEVELS.find(function(l){return score>=l.min&&score<=l.max;})||TEST_LEVELS[0];
  var existing=document.getElementById('test-result-screen');
  if(existing)existing.remove();
  var screen=document.createElement('div');
  screen.id='test-result-screen';
  screen.style.cssText='position:fixed;inset:0;z-index:210;background:var(--surface);display:flex;flex-direction:column;overflow:hidden;animation:fadeInPage .2s ease';
  var inner='';
  inner+='<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:52px 16px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">';
  inner+='<button onclick="closeTestResult()" style="background:none;border:none;color:var(--text2);cursor:pointer;padding:6px 8px;line-height:1;border-radius:8px;display:flex;align-items:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>';
  inner+='<div style="font-size:16px;font-weight:800;color:var(--text)">Tu resultado</div>';
  inner+='<button onclick="navigate(\'test\')" style="font-size:12px;color:var(--primary);background:none;border:none;cursor:pointer;font-family:var(--font);font-weight:700">Repetir</button>';
  inner+='</div>';
  inner+='<div style="flex:1;overflow-y:auto;padding:16px">';
  // Score hero
  inner+='<div style="text-align:center;padding:24px 16px;margin-bottom:16px">';
  inner+='<div style="width:100px;height:100px;border-radius:50%;border:6px solid '+lv.color+';display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">';
  inner+='<div><div style="font-size:32px;font-weight:900;color:'+lv.color+'">'+score+'</div><div style="font-size:11px;color:var(--text3);font-weight:600">/ 100</div></div></div>';
  inner+='<div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:6px">'+lv.emoji+' '+lv.label+'</div>';
  inner+='<div style="font-size:12px;color:var(--text2);line-height:1.6;max-width:320px;margin:0 auto">'+lv.desc+'</div>';
  inner+='</div>';
  // Category breakdown
  inner+='<div class="card" style="margin-bottom:14px;padding:14px">';
  inner+='<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">Desglose por categoría</div>';
  var catEmojis={'Ahorro y Finanzas':'📊','Inversión y Gestión de Gastos':'💰','Protección':'🛡️','Futuro e Inversión':'🚀','Planificación y Jubilación':'📅'};
  Object.keys(catScores).forEach(function(cat){
    var cs=catScores[cat];
    var cpct=cs.max>0?Math.round(cs.pts/cs.max*100):0;
    var ccolor=cpct>=80?'var(--success)':cpct>=60?'var(--primary)':cpct>=40?'var(--warning)':'var(--danger)';
    inner+='<div style="margin-bottom:10px">';
    inner+='<div style="display:flex;justify-content:space-between;margin-bottom:4px">';
    inner+='<div style="font-size:12px;color:var(--text)">'+(catEmojis[cat]||'')+'  '+cat+'</div>';
    inner+='<div style="font-size:12px;font-weight:700;color:'+ccolor+'">'+cpct+'%</div></div>';
    inner+='<div style="height:6px;background:var(--surface2);border-radius:3px;overflow:hidden">';
    inner+='<div style="height:100%;width:'+cpct+'%;background:'+ccolor+';border-radius:3px;transition:.5s"></div></div></div>';
  });
  inner+='</div>';
  // Recommendations
  inner+='<div class="card" style="margin-bottom:14px;padding:14px;border-left:3px solid '+lv.color+'">';
  inner+='<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Acciones recomendadas</div>';
  lv.actions.forEach(function(a){
    inner+='<div style="display:flex;gap:8px;margin-bottom:8px;font-size:12px;color:var(--text2);line-height:1.5">';
    inner+='<span style="color:'+lv.color+';flex-shrink:0;margin-top:1px">✓</span><span>'+a+'</span></div>';
  });
  inner+='</div>';
  // History
  var hist=S.testHistory||[];
  if(hist.length>1){
    inner+='<div class="card" style="margin-bottom:14px;padding:14px">';
    inner+='<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Historial</div>';
    hist.slice().reverse().forEach(function(h,i){
      var hlv=TEST_LEVELS.find(function(l){return h.score>=l.min&&h.score<=l.max;})||TEST_LEVELS[0];
      inner+='<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border'+( i===hist.length-1?'':'')+')">';
      inner+='<div style="font-size:12px;color:var(--text2)">'+h.date+'</div>';
      inner+='<div style="font-size:13px;font-weight:800;color:'+hlv.color+'">'+h.score+' pts</div>';
      inner+='<div style="font-size:10px;color:var(--text3)">'+hlv.emoji+' '+hlv.label+'</div></div>';
    });
    inner+='</div>';
  }
  inner+='<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:var(--radius-sm);padding:10px 12px;font-size:10px;color:var(--text2);line-height:1.5;margin-bottom:20px">';
  inner+='⚠️ Este test es orientativo. Para una evaluación profesional consulta un asesor financiero certificado.';
  inner+='</div></div>';
  screen.innerHTML=inner;
  document.body.appendChild(screen);
}
function closeTestResult(){
  var s=document.getElementById('test-result-screen');
  if(s)s.remove();
}
function renderCalculadora(){
  var q="'";
  var html='';
  html+='<div class="card" style="margin-bottom:14px;padding:14px;border-left:3px solid #EF4444">';
  html+='<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">📐 ¿Para qué sirve?</div>';
  html+='<div style="font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:10px">Simula cualquier tipo de crédito: calcula tu cuota mensual, el total de intereses y el plan de amortización completo. Ideal para evaluar antes de endeudarte.</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html+='<div style="background:rgba(16,185,129,.08);border-radius:var(--radius-sm);padding:8px">';
  html+='<div style="font-size:9px;font-weight:700;color:var(--success);margin-bottom:4px;text-transform:uppercase">✅ Úsalo para</div>';
  html+='<div style="font-size:11px;color:var(--text2);line-height:1.5">· Comparar tasas entre bancos<br>· Saber si puedes pagar la cuota<br>· Entender cuánto pagas de más</div>';
  html+='</div>';
  html+='<div style="background:rgba(239,68,68,.08);border-radius:var(--radius-sm);padding:8px">';
  html+='<div style="font-size:9px;font-weight:700;color:var(--danger);margin-bottom:4px;text-transform:uppercase">⚠️ Recuerda</div>';
  html+='<div style="font-size:11px;color:var(--text2);line-height:1.5">· Tasas máx. son referenciales<br>· No incluye seguros ni comisiones<br>· Confirma con tu entidad</div>';
  html+='</div>';
  html+='</div></div>';
  html+='<div style="margin-bottom:14px">';
  html+='<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">Selecciona el tipo de crédito</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">';
  var types=window._LOAN_TYPES||[];
  types.forEach(function(t){
    html+='<button onclick="openLoanForm('+q+t.key+q+')" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 8px 14px;background:var(--surface);border:1px solid var(--border);border-radius:18px;cursor:pointer;gap:8px;font-family:var(--font);min-height:90px;border-top:3px solid '+t.color+';box-shadow:var(--card-shadow)">';
    html+='<span style="font-size:28px;line-height:1">'+t.icon+'</span>';
    html+='<span style="font-size:11px;font-weight:700;color:var(--text);text-align:center;line-height:1.3">'+t.label+'</span>';
    html+='<span style="font-size:9px;color:var(--text3)">máx. '+t.maxRate.toFixed(1)+'% EA</span>';
    html+='</button>';
  });
  html+='</div></div>';
  return html;
}
var _LOAN_TYPES=[
  {key:'libre',label:'Libre inversión',icon:'💵',maxRate:28.5,color:'#EF4444',
   desc:'Crédito sin destinación específica. Úsalo como quieras.',
   pros:['Destino libre','Aprobación rápida','Montos flexibles'],
   cons:['Tasa más alta','Sin beneficio tributario','Plazo corto']},
  {key:'personal',label:'Personal',icon:'👤',maxRate:24.0,color:'#F59E0B',
   desc:'Para gastos personales como viajes, remodelaciones o emergencias.',
   pros:['Sin garantía','Trámite ágil','Plazos medianos'],
   cons:['Tasa alta','Cupo limitado por ingresos']},
  {key:'consumo',label:'Consumo',icon:'🛒',maxRate:28.8,color:'#F97316',
   desc:'Financia bienes y servicios de consumo como electrodomésticos o tecnología.',
   pros:['Montos altos','Plazos amplios','Cuotas fijas'],
   cons:['Intereses elevados','Requiere historial crediticio']},
  {key:'hipotecario',label:'Hipotecario',icon:'🏠',maxRate:8.5,color:'#3B82F6',
   desc:'Para compra, construcción o mejora de vivienda. Garantía: el inmueble.',
   pros:['Tasa más baja','Plazos hasta 30 años','Beneficio tributario'],
   cons:['Requiere inmueble como garantía','Trámite largo','Seguro obligatorio']},
  {key:'vehicular',label:'Vehicular',icon:'🚗',maxRate:15.5,color:'#10B981',
   desc:'Financia la compra de vehículo nuevo o usado. Garantía: el vehículo.',
   pros:['Tasa moderada','Plazos hasta 7 años','Fácil aprobación'],
   cons:['Vehículo queda como garantía','Seguro obligatorio']},
  {key:'educativo',label:'Educativo',icon:'📚',maxRate:12.0,color:'#8B5CF6',
   desc:'Para financiar estudios técnicos, universitarios o posgrados.',
   pros:['Tasa preferencial','Período de gracia','Beneficio tributario'],
   cons:['Solo para educación','Requiere documentación académica']},
  {key:'rotativo',label:'Rotativo',icon:'🔄',maxRate:36.5,color:'#EC4899',
   desc:'Cupo disponible que se renueva al pagar. Típico en tarjetas de crédito.',
   pros:['Disponibilidad inmediata','Se renueva al pagar','Flexibilidad de uso'],
   cons:['Tasa muy alta','Riesgo de sobreendeudamiento','Cargos adicionales']},
  {key:'microcredito',label:'Microcrédito',icon:'🌱',maxRate:50.0,color:'#06B6D4',
   desc:'Para microempresarios y emprendedores de bajos ingresos. Montos pequeños.',
   pros:['Accesible sin historial','Fomenta el emprendimiento','Sin garantías reales'],
   cons:['Tasa muy alta','Montos bajos','Plazos cortos']},
  {key:'nanocredito',label:'Nanocrédito',icon:'🪙',maxRate:60.0,color:'#64748B',
   desc:'Crédito de muy bajo monto para necesidades urgentes e inmediatas.',
   pros:['Desembolso inmediato','Sin papeleo','Montos desde muy bajos'],
   cons:['Tasa extremadamente alta','Plazos muy cortos','Solo para emergencias']}
];
window._LOAN_TYPES=_LOAN_TYPES;
function openLoanForm(typeKey){
  var t=_LOAN_TYPES.find(function(x){return x.key===typeKey;});
  if(!t)return;
  var existing=document.getElementById('loan-form-screen');
  if(existing)existing.remove();
  var screen=document.createElement('div');
  screen.id='loan-form-screen';
  screen.style.cssText='position:fixed;inset:0;z-index:210;background:var(--surface);display:flex;flex-direction:column;overflow:hidden;animation:fadeInPage .2s ease';
  var inner='';
  inner+='<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:52px 16px 14px;display:flex;align-items:center;gap:12px;flex-shrink:0">';
  inner+='<button onclick="closeLoanForm()" style="background:none;border:none;color:var(--text2);cursor:pointer;padding:6px 8px;line-height:1;border-radius:8px;display:flex;align-items:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>';
  inner+='<div style="width:36px;height:36px;border-radius:10px;background:'+t.color+'22;display:flex;align-items:center;justify-content:center;font-size:20px">'+t.icon+'</div>';
  inner+='<div><div style="font-size:17px;font-weight:800;color:var(--text)">'+t.label+'</div>';
  inner+='<div style="font-size:11px;color:var(--text3)">Tasa máx. referencial: '+t.maxRate.toFixed(1)+'% EA</div></div>';
  inner+='</div>';
  inner+='<div style="flex:1;overflow-y:auto;padding:16px">';
  // Info card
  inner+='<div class="card" style="margin-bottom:14px;padding:14px;border-left:3px solid '+t.color+'">';
  inner+='<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">'+t.icon+' ¿Qué es el crédito '+t.label.toLowerCase()+'?</div>';
  inner+='<div style="font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:10px">'+t.desc+'</div>';
  inner+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  inner+='<div style="background:rgba(16,185,129,.08);border-radius:var(--radius-sm);padding:8px">';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--success);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">✅ Ventajas</div>';
  t.pros.forEach(function(p){inner+='<div style="font-size:11px;color:var(--text2);line-height:1.6">· '+p+'</div>';});
  inner+='</div>';
  inner+='<div style="background:rgba(239,68,68,.08);border-radius:var(--radius-sm);padding:8px">';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--danger);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">⚠️ Desventajas</div>';
  t.cons.forEach(function(c){inner+='<div style="font-size:11px;color:var(--text2);line-height:1.6">· '+c+'</div>';});
  inner+='</div></div></div>';
  // Rate warning banner
  inner+='<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:14px;font-size:11px;color:var(--text2);line-height:1.5">';
  inner+='⚠️ Referencia orientativa. Tasas varían según entidad y perfil. Verifica con tu banco.';
  inner+='</div>';
  // Form card
  inner+='<div class="card" style="margin-bottom:14px">';
  inner+='<div class="form-group"><label class="form-label">💰 ¿Cuánto necesitas?</label>';
  inner+='<input class="form-input" type="text" inputmode="numeric" id="loan-amount" data-numfmt="num" placeholder="Ej: 10.000.000" oninput="numInput(this);calcLoan()"></div>';
  inner+='<div class="form-row">';
  inner+='<div class="form-group"><label class="form-label">📅 Tiempo (años)</label>';
  inner+='<input class="form-input" type="number" id="loan-years" placeholder="Ej: 2" min="0" step="0.5" oninput="calcLoanTerms();calcLoan()">';
  inner+='<div id="loan-terms-lbl" style="font-size:10px;color:var(--primary);margin-top:4px;font-weight:600"></div></div>';
  inner+='<div class="form-group"><label class="form-label">📊 TAE (%)</label>';
  inner+='<input class="form-input" type="text" inputmode="numeric" id="loan-rate" data-numfmt="pct" placeholder="Ej: 18%" oninput="pctInput(this);calcLoan()">';
  inner+='<div id="loan-rate-warn" style="font-size:10px;color:var(--danger);margin-top:4px;display:none">⚠️ Supera el máx. referencial de '+t.maxRate.toFixed(1)+'% EA</div></div>';
  inner+='</div></div>';
  // Results
  inner+='<div id="loan-result" style="display:none">';
  // 4 metric cards
  inner+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;align-items:stretch">';
  [{id:'loan-cuota',label:'Cuota mensual',color:'var(--primary)'},
   {id:'loan-total',label:'Total a pagar',color:'var(--text)'},
   {id:'loan-interest',label:'Total intereses',color:'var(--danger)'},
   {id:'loan-tem',label:'TEM mensual',color:'var(--warning)'}
  ].forEach(function(m){
    inner+='<div class="card" style="padding:12px;text-align:center;display:flex;flex-direction:column;justify-content:center;margin-top:0">';
    inner+='<div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">'+m.label+'</div>';
    inner+='<div style="font-size:14px;font-weight:800;color:'+m.color+';line-height:1.2" id="'+m.id+'">—</div>';
    inner+='</div>';
  });
  inner+='</div>';
  // First installment card - full width
  inner+='<div class="card" style="padding:12px;margin-bottom:10px">';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Primera cuota</div>';
  inner+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  inner+='<div style="text-align:center"><div style="font-size:9px;color:var(--text2);margin-bottom:4px">Interés</div>';
  inner+='<div style="font-size:13px;font-weight:800;color:var(--danger)" id="loan-int1">—</div></div>';
  inner+='<div style="text-align:center"><div style="font-size:9px;color:var(--text2);margin-bottom:4px">Abono capital</div>';
  inner+='<div style="font-size:13px;font-weight:800;color:var(--success)" id="loan-cap1">—</div></div>';
  inner+='</div></div>';
  // Plan button
  inner+='<button onclick="openLoanAmortization()" style="width:100%;padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);font-size:14px;font-weight:700;color:var(--text);cursor:pointer;font-family:var(--font);display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  inner+='<span>📋 Ver plan de amortización</span><span style="color:var(--primary);font-size:20px;font-weight:300">›</span></button>';
  // Disclaimer
  inner+='<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:var(--radius-sm);padding:10px 12px;font-size:10px;color:var(--text2);line-height:1.5">';
  inner+='⚠️ <strong>Valores aproximados.</strong> No incluye seguros, comisiones ni otros cargos. Consulta con tu entidad financiera.';
  inner+='</div>';
  inner+='</div>'; // loan-result
  inner+='</div>'; // scroll
  screen.innerHTML=inner;
  document.body.appendChild(screen);
  window._loanType=t;
}
function closeLoanForm(){
  var s=document.getElementById('loan-form-screen');
  if(s)s.remove();
  window._loanRows=null;
}
function calcLoanTerms(){
  var yrs=parseFloat(document.getElementById('loan-years')?.value)||0;
  var lbl=document.getElementById('loan-terms-lbl');
  if(!lbl)return;
  if(!yrs){lbl.textContent='';return;}
  var months=Math.round(yrs*12);
  lbl.textContent=months+' meses · '+months+' cuotas';
}
function calcLoan(){
  var P=parseNum(document.getElementById('loan-amount')?.value)||0;
  var rPct=parsePct(document.getElementById('loan-rate')?.value)||0;
  var yrs=parseFloat(document.getElementById('loan-years')?.value)||0;
  var n=Math.round(yrs*12);
  var res=document.getElementById('loan-result');
  var warn=document.getElementById('loan-rate-warn');
  if(warn&&window._loanType){warn.style.display=(rPct>0&&rPct>window._loanType.maxRate)?'block':'none';}
  if(!P||!rPct||!n){if(res)res.style.display='none';return;}
  var rm=Math.pow(1+rPct/100,1/12)-1;
  var cuota=rm===0?P/n:P*rm*Math.pow(1+rm,n)/(Math.pow(1+rm,n)-1);
  var total=cuota*n;
  var interest=total-P;
  var tem=((Math.pow(1+rPct/100,1/12)-1)*100);
  if(res)res.style.display='block';
  var set=function(id,v){var el=document.getElementById(id);if(el){el.textContent=v;var len=v.length;el.style.fontSize=len>14?'11px':len>10?'12px':'14px';}};
  set('loan-cuota',fmt(cuota));
  set('loan-total',fmt(total));
  set('loan-interest',fmt(interest));
  set('loan-tem',tem.toFixed(2)+'% m.v.');
  var int1=P*rm;
  var cap1=cuota-int1;
  set('loan-int1',fmt(int1));
  set('loan-cap1',fmt(cap1));
  // Build rows
  var rows=[];
  var bal=P;
  var startDate=new Date();
  for(var i=1;i<=n;i++){
    var d=new Date(startDate.getFullYear(),startDate.getMonth()+i,startDate.getDate());
    var dateStr=(d.getDate()).toString().padStart(2,'0')+'/'+(d.getMonth()+1).toString().padStart(2,'0')+'/'+d.getFullYear();
    var intAmt=bal*rm;
    var capAmt=cuota-intAmt;
    bal=Math.max(0,bal-capAmt);
    rows.push({i:i,date:dateStr,cuota:cuota,int:intAmt,cap:capAmt,bal:bal,year:d.getFullYear()});
  }
  window._loanRows=rows;
  window._loanData={P:P,rPct:rPct,n:n,cuota:cuota,total:total,interest:interest,tem:tem};
}
function openLoanAmortization(){
  if(!window._loanRows||!window._loanData){toast('Primero completa los datos del préstamo');return;}
  var existing=document.getElementById('loan-amort-screen');
  if(existing)existing.remove();
  var d=window._loanData;
  var screen=document.createElement('div');
  screen.id='loan-amort-screen';
  screen.style.cssText='position:fixed;inset:0;z-index:220;background:var(--surface);display:flex;flex-direction:column;overflow:hidden;animation:fadeInPage .2s ease';
  var years=[...new Set(window._loanRows.map(function(r){return r.year;}))];
  var yearOpts='<option value="">Todos los años</option>'+years.map(function(y){return'<option value="'+y+'">'+y+'</option>';}).join('');
  var cuotaOpts='<option value="">Todas las cuotas</option>'+window._loanRows.map(function(r){return'<option value="'+r.i+'">Cuota '+r.i+' — '+r.date+'</option>';}).join('');
  var inner='';
  inner+='<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:52px 16px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">';
  inner+='<div style="display:flex;align-items:center;gap:12px">';
  inner+='<button onclick="closeLoanAmortization()" style="background:none;border:none;color:var(--text2);cursor:pointer;padding:6px 8px;line-height:1;border-radius:8px;display:flex;align-items:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>';
  inner+='<div><div style="font-size:17px;font-weight:800;color:var(--text)">Plan de amortización</div>';
  inner+='<div style="font-size:11px;color:var(--text3)">'+(window._loanType?window._loanType.label:'Préstamo')+'</div></div>';
  inner+='</div>';
  inner+='<button onclick="downloadLoanTable()" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:7px 14px;font-size:12px;color:var(--text);cursor:pointer;font-family:var(--font)">⬇ CSV</button>';
  inner+='</div>';
  // Single scroll container — everything inside
  inner+='<div style="display:flex;flex-direction:column;flex:1;overflow:hidden">';
  inner+='<div style="padding:16px 16px 0;flex-shrink:0">';
  // Summary card
  inner+='<div class="card" style="margin-bottom:14px;padding:12px">';
  inner+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  [{label:'Monto préstamo',val:fmt(d.P)},{label:'Valor cuota',val:fmt(d.cuota)},
   {label:'Total intereses',val:fmt(d.interest)},{label:'Total a pagar',val:fmt(d.total)}
  ].forEach(function(s){
    var hi=s.label==='Total a pagar'||s.label==='Valor cuota';
    inner+='<div style="text-align:center;padding:8px;background:var(--surface2);border-radius:var(--radius-sm)">';
    inner+='<div style="font-size:9px;color:var(--text2);margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px">'+s.label+'</div>';
    inner+='<div style="font-size:12px;font-weight:800;color:'+(hi?'var(--primary)':'var(--text)')+';line-height:1.2;word-break:break-all">'+s.val+'</div>';
    inner+='</div>';
  });
  inner+='</div>';
  // Total cuotas + TAE/TEM row
  inner+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">';
  inner+='<div style="text-align:center;padding:8px;background:var(--surface2);border-radius:var(--radius-sm)">';
  inner+='<div style="font-size:9px;color:var(--text2);margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px">Total cuotas</div>';
  inner+='<div style="font-size:12px;font-weight:800;color:var(--warning)">'+d.n+' cuotas</div></div>';
  inner+='<div style="padding:8px;background:var(--surface2);border-radius:var(--radius-sm);display:flex;align-items:center">';
  inner+='<div style="flex:1;text-align:center">';
  inner+='<div style="font-size:9px;color:var(--text2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.4px">TAE</div>';
  inner+='<div style="font-size:11px;font-weight:800;color:var(--warning)">'+d.rPct.toFixed(2)+'%</div></div>';
  inner+='<div style="width:1px;height:32px;background:var(--border)"></div>';
  inner+='<div style="flex:1;text-align:center">';
  inner+='<div style="font-size:9px;color:var(--text2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.4px">TEM</div>';
  inner+='<div style="font-size:11px;font-weight:800;color:var(--primary)">'+d.tem.toFixed(2)+'%</div></div>';
  inner+='</div></div></div>';
  inner+='</div>'; // end summary padding
  // Filters + table — same flex column, no gap
  inner+='<div style="display:flex;gap:8px;margin:10px 16px 8px;flex-shrink:0">';
  inner+='<button id="loan-yr-btn" class="bs-trigger" onclick="showLoanFilterBS(\'year\')" style="flex:1;font-size:12px;justify-content:space-between">';
  inner+='<span id="loan-yr-lbl" style="color:var(--text2)">Todos los años</span><span style="color:var(--text3)">›</span></button>';
  inner+='<button id="loan-qt-btn" class="bs-trigger" onclick="showLoanFilterBS(\'cuota\')" style="flex:1;font-size:12px;justify-content:space-between">';
  inner+='<span id="loan-qt-lbl" style="color:var(--text2)">Todas las cuotas</span><span style="color:var(--text3)">›</span></button>';
  inner+='</div>';
  inner+='<input type="hidden" id="loan-filter-year" value="">';
  inner+='<input type="hidden" id="loan-filter-cuota" value="">';
  inner+='<div class="card" style="padding:0;overflow:hidden;flex:1;display:flex;flex-direction:column;margin:0 16px 16px">';
  inner+='<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;flex-shrink:0">';
  inner+='<div style="min-width:320px;display:grid;grid-template-columns:36px 1fr 1fr 1fr 1fr;padding:8px 6px;background:var(--surface2);border-bottom:2px solid var(--border)">';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--text3);text-align:center">#</div>';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--text3);text-align:right;padding-right:4px">FECHA</div>';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--danger);text-align:right;padding-right:4px">INTERÉS</div>';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--success);text-align:right;padding-right:4px">CAPITAL</div>';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--text2);text-align:right;padding-right:4px">SALDO</div>';
  inner+='</div></div>';
  inner+='<div id="loan-amort-body" style="overflow-y:auto;flex:1"></div>';
  inner+='</div></div>';
  screen.innerHTML=inner;
  document.body.appendChild(screen);
  renderLoanTable();
}
function showLoanFilterBS(type){
  var rows=window._loanRows||[];
  if(type==='year'){
    var years=[...new Set(rows.map(function(r){return r.year;}))];
    var items=[{val:'',label:'Todos los años'}].concat(years.map(function(y){return{val:String(y),label:String(y)};}));
    var cur=document.getElementById('loan-filter-year')?.value||'';
    showBottomSheet({title:'Filtrar por año',items:items,selected:cur,searchable:items.length>5,onSelect:function(val){
      var finalVal=val===cur?'':val;
      var lbl=document.getElementById('loan-yr-lbl');
      if(lbl)lbl.textContent=finalVal?finalVal:'Todos los años';
      lbl&&(lbl.style.color=finalVal?'var(--text)':'var(--text2)');
      var inp=document.getElementById('loan-filter-year');
      if(inp)inp.value=finalVal;
      filterLoanYear();
    }});
  } else {
    var yearFilter=document.getElementById('loan-filter-year')?.value||'';
    var filtered=yearFilter?rows.filter(function(r){return r.year===parseInt(yearFilter);}):rows;
    var items2=[{val:'',label:'Todas las cuotas'}].concat(filtered.map(function(r){return{val:String(r.i),label:'Cuota '+r.i+' — '+r.date};}));
    var cur2=document.getElementById('loan-filter-cuota')?.value||'';
    showBottomSheet({title:'Filtrar por cuota',items:items2,selected:cur2,searchable:items2.length>10,onSelect:function(val){
      var finalVal2=val===cur2?'':val;
      var lbl=document.getElementById('loan-qt-lbl');
      if(lbl)lbl.textContent=finalVal2?('Cuota '+finalVal2):'Todas las cuotas';
      lbl&&(lbl.style.color=finalVal2?'var(--text)':'var(--text2)');
      var inp=document.getElementById('loan-filter-cuota');
      if(inp)inp.value=finalVal2;
      renderLoanTable();
    }});
  }
}
function showSimFilterBS(){
  var rows=window._simRows||[];
  var years=[...new Set(rows.map(function(r){var y=r.label.split('-')[1];return y?'20'+y:'';}))].filter(Boolean);
  var items=[{val:'',label:'Todos los años'}].concat(years.map(function(y){return{val:y,label:y};}));
  var cur=document.getElementById('sim-filter-year')?.value||'';
  showBottomSheet({title:'Filtrar por año',items:items,selected:cur,searchable:items.length>5,onSelect:function(val){
    var finalVal=val===cur?'':val;
    var lbl=document.getElementById('sim-yr-lbl');
    if(lbl)lbl.textContent=finalVal?finalVal:'Todos los años';
    lbl&&(lbl.style.color=finalVal?'var(--text)':'var(--text2)');
    var inp=document.getElementById('sim-filter-year');
    if(inp)inp.value=finalVal;
    renderSimDetailTable();
  }});
}
function filterLoanYear(){
  var yearFilter=document.getElementById('loan-filter-year')?.value||'';
  var rows=window._loanRows||[];
  // Reset cuota filter when year changes
  var qtInp=document.getElementById('loan-filter-cuota');
  var qtLbl=document.getElementById('loan-qt-lbl');
  if(qtInp)qtInp.value='';
  if(qtLbl){qtLbl.textContent='Todas las cuotas';qtLbl.style.color='var(--text2)';}
  renderLoanTable();
}
function renderLoanTable(){
  var rows=window._loanRows||[];
  var yearFilter=document.getElementById('loan-filter-year')?.value||'';
  var cuotaFilter=parseInt(document.getElementById('loan-filter-cuota')?.value)||0;
  var filtered=rows.filter(function(r){
    if(yearFilter&&r.year!==parseInt(yearFilter))return false;
    if(cuotaFilter&&r.i!==cuotaFilter)return false;
    return true;
  });
  var body=document.getElementById('loan-amort-body');
  if(!body)return;
  if(!filtered.length){body.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px">Sin resultados</div>';return;}
  body.innerHTML=filtered.map(function(r){
    var isLast=r.bal<0.01;
    var bg=isLast?'rgba(0,212,170,.07)':r.i%2===0?'transparent':'rgba(255,255,255,.02)';
    return'<div style="display:grid;grid-template-columns:36px 1fr 1fr 1fr 1fr;padding:7px 6px;background:'+bg+';border-bottom:1px solid var(--border)'+(isLast?';border-bottom-color:rgba(0,212,170,.25)':'')+'">'
      +'<div style="font-size:9px;font-weight:600;color:var(--text3);text-align:center;align-self:center">'+r.i+'</div>'
      +'<div style="font-size:9px;color:var(--text2);text-align:right;padding-right:4px;align-self:center">'+r.date+'</div>'
      +'<div style="font-size:9px;color:var(--danger);text-align:right;padding-right:4px;align-self:center">'+fmtSim(r.int)+'</div>'
      +'<div style="font-size:9px;color:var(--success);text-align:right;padding-right:4px;align-self:center">'+fmtSim(r.cap)+'</div>'
      +'<div style="font-size:9px;font-weight:'+(isLast?'800':'600')+';color:'+(isLast?'var(--primary)':'var(--text)')+';text-align:right;padding-right:4px;align-self:center">'+fmtSim(r.bal)+'</div>'
      +'</div>';
  }).join('');
}
function closeLoanAmortization(){
  var s=document.getElementById('loan-amort-screen');
  if(s)s.remove();
}
function downloadLoanTable(){
  var rows=window._loanRows;
  if(!rows||!rows.length){toast('Primero calcula el préstamo');return;}
  var d=window._loanData;
  var csv='Cuota,Fecha,Cuota mensual,Interés,Abono capital,Saldo restante\n';
  rows.forEach(function(r){
    csv+=r.i+','+r.date+','+r.cuota.toFixed(2)+','+r.int.toFixed(2)+','+r.cap.toFixed(2)+','+r.bal.toFixed(2)+'\n';
  });
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='plan-amortizacion.csv';a.click();
  toast('Plan descargado ✓');
}
function openSimDetail(){
  var rows=window._simRows;
  if(!rows||!rows.length){toast('Primero calcula la proyección');return;}
  var d=window._simData||{};
  var existing=document.getElementById('sim-detail-screen');
  if(existing)existing.remove();
  var screen=document.createElement('div');
  screen.id='sim-detail-screen';
  screen.style.cssText='position:fixed;inset:0;z-index:210;background:var(--surface);display:flex;flex-direction:column;overflow:hidden;animation:fadeInPage .2s ease';
  // Build year options
  var years=[...new Set(rows.map(function(r){var y=r.label.split('-')[1];return y?'20'+y:'';}))].filter(Boolean);
  var yearOpts='<option value="">Todos los años</option>'+years.map(function(y){return'<option value="'+y+'">'+y+'</option>';}).join('');
  var inner='';
  inner+='<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:52px 16px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">';
  inner+='<div style="display:flex;align-items:center;gap:12px">';
  inner+='<button onclick="closeSimDetail()" style="background:none;border:none;color:var(--text2);cursor:pointer;padding:6px 8px;line-height:1;border-radius:8px;display:flex;align-items:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>';
  inner+='<div style="font-size:17px;font-weight:800;color:var(--text)">Plan detallado</div>';
  inner+='</div>';
  inner+='<button onclick="simDownloadCSV()" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:7px 14px;font-size:12px;color:var(--text);cursor:pointer;font-family:var(--font)">⬇ CSV</button>';
  inner+='</div>';
  // Single scroll container
  inner+='<div style="display:flex;flex-direction:column;flex:1;overflow:hidden">';
  inner+='<div style="padding:16px 16px 0;flex-shrink:0">';
  // Summary card
  if(d.initial!==undefined){
    var tem=d.annualRate?((Math.pow(1+d.annualRate/100,1/12)-1)*100).toFixed(2)+'%':'—';
    inner+='<div class="card" style="margin-bottom:14px;padding:12px">';
    inner+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    [{label:'Capital inicial',val:fmtSim(d.initial||0)},
     {label:'Aporte mensual',val:fmtSim(d.monthly||0)},
     {label:'Total acumulado',val:fmtSim(d.total||0)},
     {label:'Total aportado',val:fmtSim(d.invested||0)}
    ].forEach(function(s){
      var hi=s.label==='Total acumulado';
      inner+='<div style="text-align:center;padding:8px;background:var(--surface2);border-radius:var(--radius-sm)">';
      inner+='<div style="font-size:9px;color:var(--text2);margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px">'+s.label+'</div>';
      inner+='<div style="font-size:11px;font-weight:800;color:'+(hi?'var(--success)':'var(--text)')+';line-height:1.2;word-break:break-all">'+s.val+'</div>';
      inner+='</div>';
    });
    inner+='</div>';
    inner+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">';
    inner+='<div style="text-align:center;padding:8px;background:var(--surface2);border-radius:var(--radius-sm)">';
    inner+='<div style="font-size:9px;color:var(--text2);margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px">Rendimientos</div>';
    inner+='<div style="font-size:11px;font-weight:800;color:var(--primary)">'+fmtSim(d.gains||0)+'</div></div>';
    inner+='<div style="padding:8px;background:var(--surface2);border-radius:var(--radius-sm);display:flex;align-items:center">';
    inner+='<div style="flex:1;text-align:center">';
    inner+='<div style="font-size:9px;color:var(--text2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.4px">TAE</div>';
    inner+='<div style="font-size:11px;font-weight:800;color:var(--warning)">'+(d.annualRate?d.annualRate.toFixed(2)+'%':'—')+'</div></div>';
    inner+='<div style="width:1px;height:32px;background:var(--border)"></div>';
    inner+='<div style="flex:1;text-align:center">';
    inner+='<div style="font-size:9px;color:var(--text2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.4px">TEM</div>';
    inner+='<div style="font-size:11px;font-weight:800;color:var(--primary)">'+tem+'</div></div>';
    inner+='</div></div></div>';
  }
  inner+='</div>'; // end summary padding
  inner+='<div style="margin:10px 16px 8px;flex-shrink:0">';
  inner+='<button id="sim-yr-btn" class="bs-trigger" onclick="showSimFilterBS()" style="width:100%;font-size:13px;justify-content:space-between">';
  inner+='<span id="sim-yr-lbl" style="color:var(--text2)">Todos los años</span><span style="color:var(--text3)">›</span></button>';
  inner+='<input type="hidden" id="sim-filter-year" value="">';
  inner+='</div>';
  inner+='<div class="card" style="padding:0;overflow:hidden;flex:1;display:flex;flex-direction:column;margin:0 16px 16px">';
  inner+='<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;flex-shrink:0">';
  inner+='<div style="min-width:300px;display:grid;grid-template-columns:38px 1fr 1fr 1fr 1fr;padding:8px 6px;background:var(--surface2);border-bottom:2px solid var(--border)">';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--text3);text-align:center">MES</div>';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--text3);text-align:right;padding-right:4px">INI.</div>';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--primary);text-align:right;padding-right:4px">ABONO</div>';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--success);text-align:right;padding-right:4px">REND.</div>';
  inner+='<div style="font-size:9px;font-weight:700;color:var(--text2);text-align:right;padding-right:4px">FINAL</div>';
  inner+='</div></div>';
  inner+='<div id="sim-detail-body" style="overflow-y:auto;flex:1"></div>';
  inner+='</div></div>';
  screen.innerHTML=inner;
  document.body.appendChild(screen);
  renderSimDetailTable();
}
function renderSimDetailTable(){
  var rows=window._simRows||[];
  var yearFilter=document.getElementById('sim-filter-year')?.value||'';
  var filtered=yearFilter?rows.filter(function(r){var y=r.label.split('-')[1];return y&&'20'+y===yearFilter;}):rows;
  var body=document.getElementById('sim-detail-body');
  if(!body)return;
  if(!filtered.length){body.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px">Sin resultados</div>';return;}
  body.innerHTML=filtered.map(function(r,i){
    var isYear=(filtered.indexOf(r)+1)%12===0||filtered.indexOf(r)===filtered.length-1&&filtered.length%12!==0;
    var origIdx=rows.indexOf(r);
    isYear=(origIdx+1)%12===0;
    var bg=isYear?'rgba(0,212,170,.07)':i%2===0?'transparent':'rgba(255,255,255,.02)';
    return'<div style="display:grid;grid-template-columns:38px 1fr 1fr 1fr 1fr;padding:7px 6px;background:'+bg+';border-bottom:1px solid '+(isYear?'rgba(0,212,170,.25)':'var(--border)22')+'">'
      +'<div style="font-size:9px;font-weight:'+(isYear?'800':'600')+';color:'+(isYear?'var(--primary)':'var(--text3)')+';text-align:center;align-self:center">'+r.label+'</div>'
      +'<div style="font-size:9px;color:var(--text2);text-align:right;padding-right:4px;align-self:center">'+fmtSim(r.saldoIni)+'</div>'
      +'<div style="font-size:9px;color:var(--primary);text-align:right;padding-right:4px;font-weight:700;align-self:center">+'+fmtSim(r.abono)+'</div>'
      +'<div style="font-size:9px;color:var(--success);text-align:right;padding-right:4px;align-self:center">+'+fmtSim(r.rend)+'</div>'
      +'<div style="font-size:9px;font-weight:'+(isYear?'800':'600')+';color:'+(isYear?'var(--primary)':'var(--text)')+';text-align:right;padding-right:4px;align-self:center">'+fmtSim(r.saldoFinal)+'</div>'
      +'</div>';
  }).join('');
}
function closeSimDetail(){
  var s=document.getElementById('sim-detail-screen');
  if(s)s.remove();
}
function renderSimulador(){
  const today=new Date();
  const yy=today.getFullYear();
  const mm=String(today.getMonth()+1).padStart(2,'0');
  const dd=String(today.getDate()).padStart(2,'0');
  const todayStr=`${yy}-${mm}-${dd}`;
  const endDefault=`${yy+2}-${mm}-${dd}`;
  return`
    <!-- Info card -->
    <div class="card" style="margin-bottom:14px;padding:14px;border-left:3px solid #00D4AA">
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">💰 ¿Para qué sirve?</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:10px">Proyecta cuánto crecerá tu dinero con aportes periódicos y una tasa de rendimiento. Perfecto para planificar metas de ahorro e inversión.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:rgba(0,212,170,.08);border-radius:var(--radius-sm);padding:8px">
          <div style="font-size:9px;font-weight:700;color:var(--primary);margin-bottom:4px;text-transform:uppercase">📈 Proyectar ahorro</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.5">Ingresa tu aporte mensual y TAE — ve cuánto acumulas al final del periodo</div>
        </div>
        <div style="background:rgba(116,97,239,.08);border-radius:var(--radius-sm);padding:8px">
          <div style="font-size:9px;font-weight:700;color:var(--secondary);margin-bottom:4px;text-transform:uppercase">🎯 Calcular aporte</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.5">Tienes una meta en mente — calcula cuánto debes aportar cada mes para alcanzarla</div>
        </div>
      </div>
    </div>
    <!-- Modo tabs -->
    <div style="background:var(--surface2);border-radius:50px;padding:3px;display:flex;gap:2px;margin-bottom:14px">
      <button id="sim-tab-proyectar" onclick="simSetMode('proyectar')" style="flex:1;padding:9px 10px;border-radius:50px;border:none;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);background:var(--primary);color:white;transition:.15s">📈 Proyectar ahorro</button>
      <button id="sim-tab-meta" onclick="simSetMode('meta')" style="flex:1;padding:9px 10px;border-radius:50px;border:none;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);background:transparent;color:var(--text2);transition:.15s">🎯 Calcular aporte</button>
    </div>

    <!-- Inputs -->
    <div class="card" style="margin-bottom:12px">
      <!-- META (solo modo calcular) -->
      <div id="sim-meta-row" class="form-group" style="display:none">
        <label class="form-label">🎯 Meta de ahorro</label>
        <input class="form-input" type="text" inputmode="numeric" id="sim-goal" placeholder="Ej: 20.000.000" data-numfmt="num" oninput="numInput(this);calcSim()">
      </div>
      <!-- Capital inicial -->
      <div class="form-group">
        <label class="form-label">💰 Capital inicial (opcional)</label>
        <input class="form-input" type="text" inputmode="numeric" id="sim-initial" placeholder="Ej: 5.500" data-numfmt="num" oninput="numInput(this);calcSim()">
      </div>
      <!-- Aporte mensual (solo modo proyectar) -->
      <div id="sim-monthly-row" class="form-group">
        <label class="form-label">📅 Aporte mensual</label>
        <input class="form-input" type="text" inputmode="numeric" id="sim-monthly" placeholder="Ej: 1.800" data-numfmt="num" oninput="numInput(this);calcSim()">
      </div>
      <!-- TAE + TEM auto -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">📊 TAE (%)</label>
          <input class="form-input" type="text" inputmode="numeric" id="sim-rate" placeholder="Ej: 10%" data-numfmt="pct" oninput="pctInput(this);calcSim()">
        </div>
        <div class="form-group">
          <label class="form-label">📈 TEM (%)</label>
          <input class="form-input" type="text" id="sim-tem-lbl" placeholder="Auto" readonly style="background:var(--surface2);color:var(--primary);font-weight:700;cursor:default">
        </div>
      </div>
      <!-- Fechas -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">📅 Inicio del ahorro</label>
          <input class="form-input" type="date" id="sim-start" value="${todayStr}" oninput="simUpdateDuration();calcSim()">
        </div>
        <div class="form-group">
          <label class="form-label">🏁 Fin del ahorro</label>
          <input class="form-input" type="date" id="sim-end" value="${endDefault}" oninput="simUpdateDuration();calcSim()">
        </div>
      </div>
      <!-- Duración calculada -->
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:12px;color:var(--text2)">⏱️ Duración</span>
        <span style="font-size:13px;font-weight:700;color:var(--primary)" id="sim-duration-lbl">—</span>
      </div>
    </div>

    <!-- Resultado aporte sugerido (solo modo meta) -->
    <div id="sim-suggested-row" style="display:none;margin-bottom:12px">
      <div style="background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:var(--radius);padding:16px;text-align:center">
        <div style="font-size:11px;color:rgba(255,255,255,.8);margin-bottom:4px">APORTE MENSUAL SUGERIDO</div>
        <div style="font-size:28px;font-weight:900;color:white" id="sim-suggested-amt">—</div>
      </div>
    </div>

    <!-- Métricas resumen -->
    <div id="sim-metrics" style="display:none;margin-bottom:16px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:stretch">
        <div class="card" style="padding:12px;text-align:center;display:flex;flex-direction:column;justify-content:center;margin-top:0">
          <div style="font-size:10px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Total acumulado</div>
          <div style="font-size:14px;font-weight:800;color:var(--success);line-height:1.2" id="sim-total">—</div>
        </div>
        <div class="card" style="padding:12px;text-align:center;display:flex;flex-direction:column;justify-content:center;margin-top:0">
          <div style="font-size:10px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Total aportado</div>
          <div style="font-size:14px;font-weight:800;line-height:1.2" id="sim-invested">—</div>
        </div>
        <div class="card" style="padding:12px;text-align:center;display:flex;flex-direction:column;justify-content:center;margin-top:0">
          <div style="font-size:10px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Rendimientos</div>
          <div style="font-size:14px;font-weight:800;color:var(--primary);line-height:1.2" id="sim-gains">—</div>
        </div>
        <div class="card" style="padding:12px;text-align:center;display:flex;flex-direction:column;justify-content:center;margin-top:0">
          <div style="font-size:10px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Multiplicador</div>
          <div style="font-size:14px;font-weight:800;color:var(--warning);line-height:1.2" id="sim-mult">—</div>
        </div>
      </div>
    </div>

    <!-- Gráfico barras anual -->
    <div id="sim-chart-wrap" style="display:none" class="card" style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:10px">📊 Proyección año a año</div>
      <div id="sim-bars" style="display:flex;align-items:flex-end;gap:3px;height:100px"></div>
    </div>

    <!-- Botón ver plan detallado -->
    <div id="sim-detail-btn-wrap" style="display:none;margin-top:4px;margin-bottom:12px">
      <button onclick="openSimDetail()" style="width:100%;padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);font-size:14px;font-weight:700;color:var(--text);cursor:pointer;font-family:var(--font);display:flex;align-items:center;justify-content:space-between">
        <span>📋 Ver plan detallado</span>
        <span style="color:var(--primary);font-size:20px;font-weight:300">›</span>
      </button>
    </div>
  `;
}
function simSetMode(mode){
  window._simMode=mode;
  const isProyectar=mode==='proyectar';
  document.getElementById('sim-tab-proyectar').style.background=isProyectar?'var(--primary)':'transparent';
  document.getElementById('sim-tab-proyectar').style.color=isProyectar?'white':'var(--text2)';
  document.getElementById('sim-tab-meta').style.background=!isProyectar?'var(--primary)':'transparent';
  document.getElementById('sim-tab-meta').style.color=!isProyectar?'white':'var(--text2)';
  document.getElementById('sim-meta-row').style.display=isProyectar?'none':'block';
  document.getElementById('sim-monthly-row').style.display=isProyectar?'block':'none';
  document.getElementById('sim-suggested-row').style.display='none';
  calcSim();
}
function simUpdateDuration(){
  var s=document.getElementById('sim-start')?.value;
  var e=document.getElementById('sim-end')?.value;
  var lbl=document.getElementById('sim-duration-lbl');
  if(!s||!e||!lbl){return;}
  var sd=new Date(s),ed=new Date(e);
  if(ed<=sd){lbl.textContent='Fecha inválida';return;}
  var months=(ed.getFullYear()-sd.getFullYear())*12+(ed.getMonth()-sd.getMonth());
  var days=Math.round((ed-sd)/(1000*60*60*24));
  lbl.textContent=months+' meses ('+days+' días)';
}
function calcSim(){
  simUpdateDuration();
  const mode=window._simMode||'proyectar';
  const initial=parseNum(document.getElementById('sim-initial')?.value)||0;
  const annualRate=parsePct(document.getElementById('sim-rate')?.value)||0;
  // Update TEM display
  const temEl=document.getElementById('sim-tem-lbl');
  if(temEl){temEl.value=annualRate?((Math.pow(1+annualRate/100,1/12)-1)*100).toFixed(2)+'%':'';}  
  const startVal=document.getElementById('sim-start')?.value;
  const endVal=document.getElementById('sim-end')?.value;
  if(!startVal||!endVal)return;
  const sd=new Date(startVal),ed=new Date(endVal);
  if(ed<=sd)return;
  const months=(ed.getFullYear()-sd.getFullYear())*12+(ed.getMonth()-sd.getMonth());
  if(months<1)return;
  const rm=Math.pow(1+annualRate/100,1/12)-1;
  let monthly=0;
  if(mode==='proyectar'){
    monthly=parseNum(document.getElementById('sim-monthly')?.value)||0;
    if(!monthly&&!initial)return;
  } else {
    const goal=parseNum(document.getElementById('sim-goal')?.value)||0;
    if(!goal)return;
    const factor=Math.pow(1+rm,months);
    if(rm===0) monthly=(goal-initial)/months;
    else monthly=(goal-initial*factor)/((factor-1)/rm);
    if(monthly<0)monthly=0;
    const sugEl=document.getElementById('sim-suggested-amt');
    if(sugEl)sugEl.textContent=fmt(monthly);
    const sugRow=document.getElementById('sim-suggested-row');
    if(sugRow)sugRow.style.display='block';
  }
  // Build monthly schedule
  const rows=[];
  let bal=initial;
  const startD=new Date(startVal);
  for(let i=0;i<months;i++){
    const d=new Date(startD.getFullYear(),startD.getMonth()+i,1);
    const label=(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getFullYear().toString().slice(2);
    const saldoIni=bal;
    const abono=monthly;
    bal+=abono;
    const rend=bal*rm;
    bal+=rend;
    rows.push({label,saldoIni,abono,rend,saldoFinal:bal});
  }
  const total=bal;
  const invested=initial+monthly*months;
  const gains=total-invested;
  // Show metrics
  const metr=document.getElementById('sim-metrics');
  if(metr)metr.style.display='block';
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('sim-total',fmt(total));
  set('sim-invested',fmt(invested));
  set('sim-gains',fmt(gains));
  set('sim-mult',invested>0?(total/invested).toFixed(2)+'x':'—');
  // Adaptive font for metric cards
  ['sim-total','sim-invested','sim-gains'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el)return;
    var len=(el.textContent||'').length;
    el.style.fontSize=len>14?'11px':len>10?'12px':'14px';
  });
  // Bar chart (yearly)
  const chartWrap=document.getElementById('sim-chart-wrap');
  const barsEl=document.getElementById('sim-bars');
  if(chartWrap&&barsEl){
    chartWrap.style.display='block';
    const maxYr=Math.min(Math.floor(months/12),12);
    const yr=[];
    for(let y=1;y<=maxYr;y++){
      const idx=Math.min(y*12,rows.length)-1;
      if(idx>=0)yr.push(rows[idx].saldoFinal);
    }
    if(yr.length){
      const maxV=Math.max(...yr);
      const formatK=(v)=>{if(v>=1000000)return(v/1000000).toFixed(1)+'M';if(v>=1000)return(v/1000).toFixed(0)+'K';return Math.round(v).toString();};
      barsEl.innerHTML=yr.map((v,i)=>{const h=Math.max(18,Math.round(v/maxV*80));return`<div style="flex:1;display:flex;flex-direction:column;align-items:center"><div style="font-size:7px;font-weight:700;color:var(--text2);margin-bottom:2px;text-align:center;white-space:nowrap;overflow:hidden;width:100%;text-overflow:ellipsis">${formatK(v)}</div><div style="width:100%;background:linear-gradient(to top,var(--primary),var(--secondary));border-radius:3px 3px 0 0;height:${h}px;opacity:${0.45+0.55*(i+1)/yr.length}"></div><div style="font-size:8px;color:var(--text3);margin-top:2px">${i+1}a</div></div>`;}).join('');
    }
  }
  // Monthly table
  const detailBtn=document.getElementById('sim-detail-btn-wrap');
  if(detailBtn)detailBtn.style.display='block';
  window._simRows=rows;
  window._simMonthly=monthly;
  window._simData={initial:initial,monthly:monthly,total:total,invested:invested,gains:gains,annualRate:annualRate};
}function fmtSim(v){
  const info=_getLocaleInfo();
  const meta=getCurrencyMeta(S.currency||'');
  const sym=meta?meta.sym:'';
  const pos=meta?meta.pos:'after';
  // Show 2 decimals when value has significant decimal part, 0 otherwise
  const hasDecimals=Math.abs(v-Math.round(v))>0.005;
  const dec=hasDecimals?2:0;
  let num;
  try{num=new Intl.NumberFormat(info.locale,{useGrouping:true,minimumFractionDigits:dec,maximumFractionDigits:dec}).format(v);}
  catch(e){num=v.toFixed(dec);}
  return pos==='before'?sym+num:num+(sym?' '+sym:'');
}
// ── Live number / percent formatting ─────────────────────────
function _getLocaleInfo(){
  var meta=getCurrencyMeta(S.currency||'');
  var locale=meta&&meta.locale?meta.locale:'es-CO';
  // Force Latin numerals for Arabic/Persian locales (otherwise gets ١٢٣ which can't be typed/parsed)
  var needsLatn=/^(ar|fa|ur|ps)/.test(locale);
  var effectiveLocale=needsLatn?locale+'-u-nu-latn':locale;
  var nf;
  try{nf=new Intl.NumberFormat(effectiveLocale);}
  catch(e){nf=new Intl.NumberFormat('en-US');}
  var parts=nf.formatToParts(1234567.89);
  var decSep='.',thouSep=',';
  parts.forEach(function(p){
    if(p.type==='decimal')decSep=p.value;
    if(p.type==='group')thouSep=p.value;
  });
  return{locale:effectiveLocale,decSep:decSep,thouSep:thouSep};
}
// ── RTL number input (right-to-left fill) ──────────────────
function _numDecimals(){
  if(S.numFormat==='0')return 0;
  if(S.numFormat==='2')return 2;
  var noDec=['JPY','KRW','CLP','PYG','VND','IDR','KMF','BIF','GNF','RWF','UGX','DJF','XAF','XOF','XPF'];
  return noDec.indexOf(S.currency||'')!==-1?0:2;
}
function numInput(el){
  var dec=_numDecimals();
  var info=_getLocaleInfo();
  // Extract only digits from current display
  var raw=el.value.replace(/[^0-9]/g,'');
  if(!raw){el.value='';return;}
  if(raw.length>15)raw=raw.slice(-15);
  if(dec===0){
    // LTR for zero-decimal currencies — just format integer with thousands
    var intNum=parseInt(raw)||0;
    var formatted;
    try{formatted=new Intl.NumberFormat(info.locale,{useGrouping:true,minimumFractionDigits:0,maximumFractionDigits:0}).format(intNum);}
    catch(e){formatted=intNum.toString();}
    el.value=formatted;
  } else {
    // RTL: last `dec` digits = decimals, rest = integer
    while(raw.length<=dec)raw='0'+raw;
    var intDigits=raw.slice(0,-dec);
    var decDigits=raw.slice(-dec);
    var intNum2=parseInt(intDigits)||0;
    var formatted2;
    try{formatted2=new Intl.NumberFormat(info.locale,{useGrouping:true,minimumFractionDigits:0,maximumFractionDigits:0}).format(intNum2);}
    catch(e){formatted2=intNum2.toString();}
    el.value=formatted2+info.decSep+decDigits;
  }
  try{var l=el.value.length;el.setSelectionRange(l,l);}catch(e){}
}
function parseNum(str){
  if(!str&&str!==0)return 0;
  var s=String(str).trim();
  var info=_getLocaleInfo();
  var dec=_numDecimals();
  // Strip everything except digits and decimal separator
  var clean=s.replace(/[^\d,\.]/g,'');
  if(info.decSep===','){
    clean=clean.replace(/\./g,'').replace(',','.');
  } else {
    clean=clean.replace(/,/g,'');
  }
  return parseFloat(clean)||0;
}
function pctInput(el){
  // RTL fill: digits push right-to-left, always 2 decimal places
  var raw=el.value.replace(/%/g,'').replace(/[.,]/g,'').replace(/[^0-9]/g,'');
  if(!raw){el.value='';return;}
  if(raw.length>5)raw=raw.slice(-5); // max 999.99%
  while(raw.length<3)raw='0'+raw;
  var intPart=parseInt(raw.slice(0,-2),10).toString();
  var decPart=raw.slice(-2);
  el.value=intPart+'.'+decPart+'%';
  try{var p=el.value.length-1;el.setSelectionRange(p,p);}catch(e){}
}
function parsePct(str){
  if(!str)return 0;
  return parseFloat(String(str).replace(/%/g,'').trim())||0;
}
// numInput para suscripciones: usa la moneda seleccionada en el form
function numInputFC(el){
  var cur=document.getElementById('fc-currency')?document.getElementById('fc-currency').value:S.currency;
  var meta=getCurrencyMeta(cur);
  var locale=meta&&meta.locale?meta.locale:'es-CO';
  var needsLatn=/^(ar|fa|ur|ps)/.test(locale);
  var effectiveLocale=needsLatn?locale+'-u-nu-latn':locale;
  var nf;try{nf=new Intl.NumberFormat(effectiveLocale);}catch(e){nf=new Intl.NumberFormat('en-US');}
  var parts=nf.formatToParts(1234567.89);
  var decSep='.',thouSep=',';
  parts.forEach(function(p){if(p.type==='decimal')decSep=p.value;if(p.type==='group')thouSep=p.value;});
  var noDec=['JPY','KRW','CLP','PYG','VND','IDR','KMF','BIF','GNF','RWF','UGX','DJF','XAF','XOF','XPF'];
  var dec=noDec.indexOf(cur)!==-1?0:2;
  var raw=el.value.replace(/[^0-9]/g,'');
  if(!raw){el.value='';return;}
  if(raw.length>15)raw=raw.slice(-15);
  if(dec===0){
    var intNum=parseInt(raw)||0;var formatted;
    try{formatted=new Intl.NumberFormat(effectiveLocale,{useGrouping:true,minimumFractionDigits:0,maximumFractionDigits:0}).format(intNum);}catch(e){formatted=intNum.toString();}
    el.value=formatted;
  } else {
    while(raw.length<=dec)raw='0'+raw;
    var intDigits=raw.slice(0,-dec);var decDigits=raw.slice(-dec);
    var intNum2=parseInt(intDigits)||0;var formatted2;
    try{formatted2=new Intl.NumberFormat(effectiveLocale,{useGrouping:true,minimumFractionDigits:0,maximumFractionDigits:0}).format(intNum2);}catch(e){formatted2=intNum2.toString();}
    el.value=formatted2+decSep+decDigits;
  }
  try{var l=el.value.length;el.setSelectionRange(l,l);}catch(e){}
}
function numInputSubs(el){
  var cur=document.getElementById('subs-moneda')?document.getElementById('subs-moneda').value:S.currency;
  var meta=getCurrencyMeta(cur);
  var locale=meta&&meta.locale?meta.locale:'es-CO';
  var needsLatn=/^(ar|fa|ur|ps)/.test(locale);
  var effectiveLocale=needsLatn?locale+'-u-nu-latn':locale;
  var nf;
  try{nf=new Intl.NumberFormat(effectiveLocale);}catch(e){nf=new Intl.NumberFormat('en-US');}
  var parts=nf.formatToParts(1234567.89);
  var decSep='.',thouSep=',';
  parts.forEach(function(p){
    if(p.type==='decimal')decSep=p.value;
    if(p.type==='group')thouSep=p.value;
  });
  var noDec=['JPY','KRW','CLP','PYG','VND','IDR','KMF','BIF','GNF','RWF','UGX','DJF','XAF','XOF','XPF'];
  var dec=noDec.indexOf(cur)!==-1?0:2;
  var raw=el.value.replace(/[^0-9]/g,'');
  if(!raw){el.value='';return;}
  if(raw.length>15)raw=raw.slice(-15);
  if(dec===0){
    var intNum=parseInt(raw)||0;
    var formatted;
    try{formatted=new Intl.NumberFormat(effectiveLocale,{useGrouping:true,minimumFractionDigits:0,maximumFractionDigits:0}).format(intNum);}
    catch(e){formatted=intNum.toString();}
    el.value=formatted;
  } else {
    while(raw.length<=dec)raw='0'+raw;
    var intDigits=raw.slice(0,-dec);
    var decDigits=raw.slice(-dec);
    var intNum2=parseInt(intDigits)||0;
    var formatted2;
    try{formatted2=new Intl.NumberFormat(effectiveLocale,{useGrouping:true,minimumFractionDigits:0,maximumFractionDigits:0}).format(intNum2);}
    catch(e){formatted2=intNum2.toString();}
    el.value=formatted2+decSep+decDigits;
  }
  try{var l=el.value.length;el.setSelectionRange(l,l);}catch(e){}
}
function parseNumSubs(str,cur){
  if(!str&&str!==0)return 0;
  var s=String(str).trim();
  var meta=getCurrencyMeta(cur||S.currency);
  var locale=meta&&meta.locale?meta.locale:'es-CO';
  var nf;
  try{nf=new Intl.NumberFormat(locale);}catch(e){nf=new Intl.NumberFormat('en-US');}
  var parts=nf.formatToParts(1.1);
  var decSep='.';
  parts.forEach(function(p){if(p.type==='decimal')decSep=p.value;});
  var clean=s.replace(/[^\d,\.]/g,'');
  if(decSep===','){clean=clean.replace(/\./g,'').replace(',','.');}
  else{clean=clean.replace(/,/g,'');}
  return parseFloat(clean)||0;
}

// Convierte un número al formato RTL que usa el campo fc-balance
function fmtRTLValue(num,cur){
  var n=parseFloat(num)||0;
  var meta=getCurrencyMeta(cur||S.currency);
  var locale=meta&&meta.locale?meta.locale:'es-CO';
  var needsLatn=/^(ar|fa|ur|ps)/.test(locale);
  var effectiveLocale=needsLatn?locale+'-u-nu-latn':locale;
  var noDec=['JPY','KRW','CLP','PYG','VND','IDR','KMF','BIF','GNF','RWF','UGX','DJF','XAF','XOF','XPF'];
  var dec=noDec.indexOf(cur||S.currency)!==-1?0:2;
  var nf;
  try{nf=new Intl.NumberFormat(effectiveLocale,{minimumFractionDigits:dec,maximumFractionDigits:dec,useGrouping:true});}
  catch(e){nf=new Intl.NumberFormat('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec});}
  var parts=nf.formatToParts(1.1);
  var decSep='.';
  parts.forEach(function(p){if(p.type==='decimal')decSep=p.value;});
  // Produce raw digits like numInputFC expects: integer part * 10^dec + decimal digits
  var raw=String(Math.round(Math.abs(n)*Math.pow(10,dec)));
  while(raw.length<=dec)raw='0'+raw;
  if(dec===0){
    var intNum=parseInt(raw)||0;
    try{return new Intl.NumberFormat(effectiveLocale,{useGrouping:true,minimumFractionDigits:0,maximumFractionDigits:0}).format(intNum);}
    catch(e){return intNum.toString();}
  } else {
    var intDigits=raw.slice(0,-dec);
    var decDigits=raw.slice(-dec);
    var intNum2=parseInt(intDigits)||0;
    var formatted;
    try{formatted=new Intl.NumberFormat(effectiveLocale,{useGrouping:true,minimumFractionDigits:0,maximumFractionDigits:0}).format(intNum2);}
    catch(e){formatted=intNum2.toString();}
    return formatted+decSep+decDigits;
  }
}

// Re-format all active numInput/pctInput fields when currency changes
function reformatNumFields(){
  var fields=document.querySelectorAll('input[data-numfmt]');
  fields.forEach(function(el){
    if(el.value){
      var type=el.getAttribute('data-numfmt');
      if(type==='num'&&el.value){numInput(el);}
      else if(type==='pct'&&el.value){pctInput(el);}
    }
  });
}
// Thousands+decimal format without currency symbol (for tipo de cambio amount field)
function cambioAmountFmt(v){
  var info=_getLocaleInfo();
  var hasDecimals=Math.abs(v-Math.round(v))>0.005;
  var dec=hasDecimals?2:0;
  try{return new Intl.NumberFormat(info.locale,{useGrouping:true,minimumFractionDigits:dec,maximumFractionDigits:dec}).format(v);}
  catch(e){return v.toFixed(dec);}
}
// LTR formatter for cambio-amount: miles automáticos, decimales opcionales, sin símbolo
function cambioInput(el){
  var raw=el.value;
  if(!raw){return;}
  var info=_getLocaleInfo();
  var decSep=info.decSep;
  var otherSep=decSep===','?'.':',';
  var hasDecPart=false,decDigits='',intStr='';
  var locDecIdx=raw.lastIndexOf(decSep);
  if(locDecIdx>-1){
    hasDecPart=true;
    decDigits=raw.slice(locDecIdx+1).replace(/\D/g,'').slice(0,2);
    intStr=raw.slice(0,locDecIdx).replace(/\D/g,'');
  } else {
    var otherIdx=raw.lastIndexOf(otherSep);
    if(otherIdx>-1){
      var afterOther=raw.slice(otherIdx+1).replace(/\D/g,'');
      var countOther=(raw.match(new RegExp('\\'+otherSep,'g'))||[]).length;
      if(countOther===1&&afterOther.length<3){
        hasDecPart=true;
        decDigits=afterOther;
        intStr=raw.slice(0,otherIdx).replace(/\D/g,'');
      } else {
        intStr=raw.replace(/\D/g,'');
      }
    } else {
      intStr=raw.replace(/\D/g,'');
    }
  }
  if(!intStr&&!hasDecPart){el.value='';return;}
  var intNum=parseInt(intStr||'0')||0;
  var formatted;
  try{formatted=new Intl.NumberFormat(info.locale,{useGrouping:true,minimumFractionDigits:0,maximumFractionDigits:0}).format(intNum);}
  catch(e){formatted=intNum.toString();}
  if(hasDecPart)formatted+=decSep+decDigits;
  el.value=formatted;
  try{var l=formatted.length;el.setSelectionRange(l,l);}catch(e){}
}
function simDownloadCSV(){
  const rows=window._simRows;
  if(!rows||!rows.length){toast('Primero calcula la proyección');return;}
  let csv='Mes,Saldo inicial,Abono,Rendimiento,Saldo final\n';
  rows.forEach(r=>{
    csv+=`${r.label},${r.saldoIni.toFixed(2)},${r.abono.toFixed(2)},${r.rend.toFixed(2)},${r.saldoFinal.toFixed(2)}\n`;
  });
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='simulacion-ahorro.csv';a.click();
  toast('Tabla descargada ✓');
}


// ── AI Chat ──
let aiHistory=[];
async function sendAiMessage(){
  var inp=document.getElementById('ai-input-div');
  if(!inp)return;
  var msg=(inp.innerText||inp.textContent||'').trim();
  if(!msg)return;
  inp.textContent='';
  toggleAiSendBtn();
  appendAiMsg(msg,'user');
  await callAI(msg);
}
function toggleAiSendBtn(){
  var inp=document.getElementById('ai-input-div');
  var btn=document.getElementById('ai-send-btn');
  if(!btn)return;
  var hasText=inp&&(inp.innerText||inp.textContent||'').trim().length>0;
  btn.innerHTML=hasText
    ?'<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>'
    :'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v4M8 23h8"/></svg>';
}
var aiRecording=false;
function aiSendOrRecord(){
  var inp=document.getElementById('ai-input-div');
  var hasText=inp&&(inp.innerText||inp.textContent||'').trim().length>0;
  if(hasText){sendAiMessage();return;}
  aiRecording=!aiRecording;
  var btn=document.getElementById('ai-send-btn');
  if(btn){
    btn.style.background=aiRecording?'var(--danger)':'linear-gradient(135deg,#075E54,#128C7E)';
    btn.innerHTML=aiRecording
      ?'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v4M8 23h8"/></svg>'
      :'<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>';
  }
  if(aiRecording){
    toast('🎙️ Grabando... Ctrl+toca para cancelar');
    setTimeout(function(){
      if(!aiRecording)return;
      aiRecording=false;
      if(btn){btn.style.background='linear-gradient(135deg,#075E54,#128C7E)';btn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>';}
      appendAiMsg('🎙️ [Audio]','user');
      callAI('El usuario envió un mensaje de voz. Responde amablemente que la funcionalidad de audio estará disponible en la versión nativa de FinanzIA.');
    },8000);
  } else {
    toast('Audio cancelado');
  }
}
function aiAttach(){document.getElementById('ai-file-input')?.click();}
function aiHandleAttachment(e){
  var file=e.target.files[0];if(!file)return;
  appendAiMsg((file.type.startsWith('image/')?'🖼️ ':'📎 ')+'['+file.name+']','user');
  callAI('El usuario adjuntó un archivo llamado "'+file.name+'". Indica que el análisis de archivos estará disponible en la versión nativa de FinanzIA.');
  e.target.value='';
}

function aiQuickQuestion(q){var inp=document.getElementById('ai-input-div');if(inp){inp.textContent=q;sendAiMessage();}}

function appendAiMsg(text,role){
  const container=document.getElementById('ai-messages');
  if(!container)return;
  const now=new Date();
  const t=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  const div=document.createElement('div');
  div.className='ai-msg ai-msg-'+(role==='user'?'user':'bot');
  // Format bot messages: bold and line breaks
  let formatted=text;
  if(role!=='user'){
    formatted=text.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    formatted=formatted.replace(/\n/g,'<br>');
  }
  div.innerHTML='<div>'+formatted+'</div><div class="ai-msg-time">'+t+'</div>';
  container.appendChild(div);
  container.scrollTop=container.scrollHeight;
}
async function callAI(userMsg){
  const loadId='ai-load-'+Date.now();
  appendAiMsg('⏳ Analizando tus datos...','bot');
  // Build financial context from user's data
  const cur=S.currency;
  const{inc,exp}=getMonthTotals();
  const bal=getTotalBalance();
  const debts=S.accounts.filter(a=>a.type==='pasivo'&&(a.currency||cur)===cur).reduce((s,a)=>s+Math.abs(getBalance(a.id)),0);
  const goals=S.goals.filter(g=>(g.currency||cur)===cur);
  const topCats=Object.entries(S.transactions.filter(t=>t.type==='gasto'&&t.currency===cur).reduce((acc,t)=>{const cat=getCat(t.categoryId);const n=cat?cat.name:'Otros';acc[n]=(acc[n]||0)+(parseFloat(t.amount)||0);return acc;},{})).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,v])=>n+': '+fmt(v)).join(', ');
  const context='Eres un Wealth Manager experto con 20 años de experiencia. Analiza estos datos financieros reales del usuario y responde de forma clara, concisa y personalizada en español.\n\nDATOS FINANCIEROS ACTUALES ('+cur+'):\n- Balance total: '+fmt(bal)+'\n- Ingresos este mes: '+fmt(inc)+'\n- Gastos este mes: '+fmt(exp)+'\n- Total deudas: '+fmt(debts)+'\n- Cuentas activas: '+S.accounts.filter(function(a){return a.type==="activo";}).length+'\n- Metas de ahorro: '+goals.length+' metas, total ahorrado: '+fmt(goals.reduce((s,g)=>s+(parseFloat(g.current)||0),0))+'\n- Top gastos por categoría este mes: '+(topCats||'Sin datos')+'\n- Tasa de ahorro: '+(inc>0?Math.round((inc-exp)/inc*100):0)+'%\n\nResponde de forma directa y útil. Máximo 3-4 párrafos. Usa datos concretos del usuario.'

  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        system:context,
        messages:[...aiHistory,{role:'user',content:userMsg}]
      })
    });
    const data=await res.json();
    const reply=data.content?data.content.map(b=>b.text||'').join(''):'No pude obtener respuesta.';
    // Remove loading message
    const msgs=document.getElementById('ai-messages');
    if(msgs){const last=msgs.lastElementChild;if(last&&last.textContent.includes('Analizando'))last.remove();}
    appendAiMsg(reply,'bot');
    aiHistory=[...aiHistory,{role:'user',content:userMsg},{role:'assistant',content:reply}];
    if(aiHistory.length>20)aiHistory=aiHistory.slice(-20);
  }catch(e){
    const msgs=document.getElementById('ai-messages');
    if(msgs){const last=msgs.lastElementChild;if(last&&last.textContent.includes('Analizando'))last.remove();}
    appendAiMsg('⚠️ Error al conectar con el asistente. Verifica tu conexión.','bot');
  }
}

// ════════════════════════════════════════════════════════════
// TIPO DE CAMBIO
// ════════════════════════════════════════════════════════════

function calcCambioRow(idx){
  if(!window._cambioRows)return;
  var row=window._cambioRows[idx];
  if(!row)return;
  var from=row.from;
  var to=row.to;
  var amount=parseFloat(document.getElementById('cambio-amount')?.value)||0;
  window._cambioAmount=amount;
  // Hide result if incomplete
  var resHidden=document.getElementById('cambio-result-hidden-'+idx);
  if(!amount||!from||!to){
    row.result=null;
    if(resHidden)resHidden.innerHTML='';
    // hide visible result if exists
    var vis=document.getElementById('cambio-formula-'+idx);
    if(vis&&vis.parentElement)vis.parentElement.style.display='none';
    return;
  }
  var rates=S.exchangeRate&&S.exchangeRate.rates?S.exchangeRate.rates:{};
  var rate=1;
  if(from===to){rate=1;}
  else if(rates[to]&&rates[from]){rate=rates[to]/rates[from];}
  else if(rates[to]&&!rates[from]){rate=rates[to];}
  else if(!rates[to]&&rates[from]){rate=1/rates[from];}
  var result=amount*rate;
  var fmeta=getCurrencyMeta(from);var tmeta=getCurrencyMeta(to);
  function fmtL(v,meta){return meta.pos==='before'?meta.sym+v.toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2}):v.toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2})+' '+meta.sym;}
  function showResult(res,rateStr,live){
    var suffix=live?' · open.er-api.com ✓':' · Estimado';
    // Try to update existing DOM elements first
    var fEl=document.getElementById('cambio-formula-'+idx);
    var oEl=document.getElementById('cambio-output-'+idx);
    var rEl=document.getElementById('cambio-rate-'+idx);
    if(fEl&&oEl&&rEl){
      fEl.parentElement.style.display='';
      fEl.textContent=fmtL(amount,fmeta)+' =';
      oEl.textContent=fmtL(res,tmeta);
      rEl.textContent='1 '+from+' = '+rateStr.toFixed(4)+' '+to+suffix;
    } else {
      // Build inline into hidden placeholder
      var ph=document.getElementById('cambio-result-hidden-'+idx);
      if(ph){
        ph.innerHTML='<div style="background:var(--surface2);border-radius:var(--radius);padding:12px 14px;margin-top:10px;text-align:center">'
          +'<div style="font-size:12px;color:var(--text2)" id="cambio-formula-'+idx+'">'+fmtL(amount,fmeta)+' =</div>'
          +'<div style="font-size:26px;font-weight:800;color:var(--primary);margin:6px 0" id="cambio-output-'+idx+'">'+fmtL(res,tmeta)+'</div>'
          +'<div style="font-size:11px;color:var(--text3)" id="cambio-rate-'+idx+'">1 '+from+' = '+rateStr.toFixed(4)+' '+to+suffix+'</div>'
          +'</div>';
      }
    }
    row.result={formula:fmtL(amount,fmeta)+' =',output:fmtL(res,tmeta),rate:'1 '+from+' = '+rateStr.toFixed(4)+' '+to+suffix};
  }
  showResult(result,rate,false);
  // Always fetch live rate directly with 'from' as base
  if(from!==to){
    fetch('https://open.er-api.com/v6/latest/'+from)
      .then(function(r){return r.json();})
      .then(function(data){
        if(data.rates&&data.rates[to]){
          var lr=data.rates[to];
          showResult(amount*lr,lr,true);
        }
      }).catch(function(){});
  }
}
function calcAllCambio(){
  window._cambioAmount=parseNum(document.getElementById('cambio-amount')?.value)||0;
  if(!window._cambioRows)return;
  window._cambioRows.forEach(function(_,idx){calcCambioRow(idx);});
}
function swapCambioRow(idx){
  if(!window._cambioRows||!window._cambioRows[idx])return;
  var row=window._cambioRows[idx];
  var tmp=row.from; row.from=row.to; row.to=tmp;
  // Update labels
  var fLbl=document.getElementById('cambio-from-lbl-'+idx);
  var tLbl=document.getElementById('cambio-to-lbl-'+idx);
  if(fLbl){fLbl.innerHTML=row.from?buildCambioLblHtml(row.from):'<span style="font-size:14px;font-weight:600;color:var(--text3)">💱 Seleccionar</span>';}
  if(tLbl){tLbl.innerHTML=row.to?buildCambioLblHtml(row.to):'<span style="font-size:14px;font-weight:600;color:var(--text3)">💱 Seleccionar</span>';}
  calcCambioRow(idx);
}
function buildCambioLblHtml(code){
  var meta=getCurrencyMeta(code);
  return '<span style="font-size:14px;font-weight:600">💱 '+code+' <span style="color:var(--primary)">'+meta.sym+'</span></span>';
}
function addCambioRow(){
  if(!window._cambioRows)window._cambioRows=[];
  window._cambioRows.push({from:'',to:'',result:null});
  renderPage('cambio');
}
function removeCambioRow(idx){
  if(!window._cambioRows||window._cambioRows.length<=1)return;
  window._cambioRows.splice(idx,1);
  renderPage('cambio');
}
function renderCambio(){
  var q="'";
  if(!window._cambioRows||!window._cambioRows.length){
    window._cambioRows=[{from:'',to:'',result:null}];
  }
  window._cambioAmount=window._cambioAmount||1;
  var rowsHtml='';
  window._cambioRows.forEach(function(row,idx){
    rowsHtml+=buildCambioRow(idx,row);
  });
  var html=''
    +'<div class="card" style="margin-bottom:12px">'
      +'<div class="card-title">💱 Tipo de cambio</div>'
      +'<div class="form-group" style="margin-bottom:0">'
        +'<label class="form-label">Monto</label>'
        +'<input class="form-input" type="text" inputmode="decimal" id="cambio-amount" placeholder="Ej: 1.000" oninput="cambioInput(this);calcAllCambio()" value="'+(window._cambioAmount?cambioAmountFmt(window._cambioAmount):'')+'">'
      +'</div>'
    +'</div>'
    +rowsHtml
    +'<button onclick="addCambioRow()" style="width:100%;padding:13px;border-radius:50px;border:1.5px dashed var(--border);background:transparent;color:var(--text2);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font);display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px">'
      +'<span style="font-size:20px;font-weight:300;line-height:1;color:var(--primary)">+</span> Agregar par de monedas'
    +'</button>'
    +'<div style="background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);border-radius:var(--radius);padding:12px;font-size:12px;color:var(--text2)">'
      +'ℹ️ Tipos de cambio en tiempo real. Para transacciones importantes consulta tu entidad bancaria.'
    +'</div>';
  return html;
}
function buildCambioRow(idx,row){
  var q="'";
  var fromLabel=row.from?buildCambioLblHtml(row.from):'<span style="font-size:14px;font-weight:600;color:var(--text3)">💱 Seleccionar</span>';
  var toLabel=row.to?buildCambioLblHtml(row.to):'<span style="font-size:14px;font-weight:600;color:var(--text3)">💱 Seleccionar</span>';
  
  
  var resultHtml='';
  if(row.result){
    resultHtml=''
      +'<div style="background:var(--surface2);border-radius:var(--radius);padding:12px 14px;margin-top:10px;text-align:center">'
        +'<div style="font-size:12px;color:var(--text2)" id="cambio-formula-'+idx+'">'+row.result.formula+'</div>'
        +'<div style="font-size:26px;font-weight:800;color:var(--primary);margin:6px 0" id="cambio-output-'+idx+'">'+row.result.output+'</div>'
        +'<div style="font-size:11px;color:var(--text3)" id="cambio-rate-'+idx+'">'+row.result.rate+'</div>'
      +'</div>';
  } else {
    resultHtml='<div id="cambio-result-hidden-'+idx+'"></div>';
  }
  var deleteBtn=window._cambioRows.length>1
    ?'<button onclick="removeCambioRow('+idx+')" style="width:26px;height:26px;border-radius:50%;background:var(--surface2);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--danger);flex-shrink:0"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
    :'';
  return ''
    +'<div class="card" style="margin-bottom:10px;padding:14px">'
      +(deleteBtn?'<div style="display:flex;justify-content:flex-end;margin-bottom:6px">'+deleteBtn+'</div>':'')
      +'<div style="display:flex;gap:8px;align-items:flex-end">'
        +'<div style="flex:1">'
          +'<label class="form-label" style="font-size:11px">De</label>'
          +'<div class="bs-trigger" onclick="showBS_currency('+idx+',\'from\')">'
            +'<span id="cambio-from-lbl-'+idx+'" style="font-size:13px">'+fromLabel+'</span>'
            +'<span style="color:var(--text3);font-size:16px">›</span>'
          +'</div>'
        +'</div>'
        +'<div style="flex-shrink:0;padding-bottom:2px">'
          +'<button onclick="swapCambioRow('+idx+')" style="width:34px;height:34px;border-radius:50%;border:1px solid var(--border);background:var(--surface2);color:var(--primary);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">⇄</button>'
        +'</div>'
        +'<div style="flex:1">'
          +'<label class="form-label" style="font-size:11px">A</label>'
          +'<div class="bs-trigger" onclick="showBS_currency('+idx+',\'to\')">'
            +'<span id="cambio-to-lbl-'+idx+'" style="font-size:13px">'+toLabel+'</span>'
            +'<span style="color:var(--text3);font-size:16px">›</span>'
          +'</div>'
        +'</div>'
      +'</div>'
      +resultHtml
    +'</div>';
}function filterCambioPick(pickId,val){
  var listId=pickId+'-list';
  var list=document.getElementById(listId);
  if(!list)return;
  var v=val.toLowerCase();
  list.querySelectorAll('.ppick-item').forEach(function(item){
    if(!item.dataset.val){item.style.display='';return;}
    item.style.display=(item.textContent.toLowerCase().includes(v)||!v)?'':'none';
  });
}
function selectCambioCur(idx,side,code){
  idx=parseInt(idx);
  if(!window._cambioRows[idx])return;
  // Toggle: pressing already-selected deselects it
  if(window._cambioRows[idx][side]===code) code='';
  window._cambioRows[idx][side]=code;
  var pickId='cambio-pick-'+side+'-'+idx;
  var lblId='cambio-'+side+'-lbl-'+idx;
  var el=document.getElementById(pickId);
  var lbl=document.getElementById(lblId);
  if(el)el.style.display='none';
  if(lbl){
    if(code){lbl.innerHTML=buildCambioLblHtml(code);}
    else{lbl.innerHTML='<span style="font-size:14px;font-weight:600;color:var(--text3)">💱 Seleccionar</span>';}
  }
  calcCambioRow(idx);
}



// ════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════
const ALL_CURRENCIES=[
  {code:'AED',name:'Dírham EAU'},
  {code:'AFN',name:'Afgani afgano'},
  {code:'ALL',name:'Lek albanés'},
  {code:'AMD',name:'Dram armenio'},
  {code:'AOA',name:'Kwanza angoleño'},
  {code:'ARS',name:'Peso argentino'},
  {code:'AUD',name:'Dólar australiano'},
  {code:'AZN',name:'Manat azerbaiyano'},
  {code:'BAM',name:'Marco bosnio'},
  {code:'BBD',name:'Dólar de Barbados'},
  {code:'BDT',name:'Taka bangladesí'},
  {code:'BGN',name:'Lev búlgaro'},
  {code:'BHD',name:'Dinar bareiní'},
  {code:'BIF',name:'Franco burundés'},
  {code:'BND',name:'Dólar de Brunéi'},
  {code:'BOB',name:'Boliviano'},
  {code:'BRL',name:'Real brasileño'},
  {code:'BSD',name:'Dólar bahameño'},
  {code:'BTN',name:'Ngultrum butanés'},
  {code:'BWP',name:'Pula botsuanesa'},
  {code:'BYN',name:'Rublo bielorruso'},
  {code:'BZD',name:'Dólar de Belice'},
  {code:'CAD',name:'Dólar canadiense'},
  {code:'CDF',name:'Franco congoleño'},
  {code:'CHF',name:'Franco suizo'},
  {code:'CLP',name:'Peso chileno'},
  {code:'CNY',name:'Yuan chino'},
  {code:'COP',name:'Peso colombiano'},
  {code:'CRC',name:'Colón costarricense'},
  {code:'CUP',name:'Peso cubano'},
  {code:'CVE',name:'Escudo caboverdiano'},
  {code:'CZK',name:'Corona checa'},
  {code:'DJF',name:'Franco yibutiano'},
  {code:'DKK',name:'Corona danesa'},
  {code:'DOP',name:'Peso dominicano'},
  {code:'DZD',name:'Dinar argelino'},
  {code:'EGP',name:'Libra egipcia'},
  {code:'ERN',name:'Nakfa eritreo'},
  {code:'ETB',name:'Birr etíope'},
  {code:'EUR',name:'Euro'},
  {code:'FJD',name:'Dólar fiyiano'},
  {code:'GBP',name:'Libra esterlina'},
  {code:'GEL',name:'Lari georgiano'},
  {code:'GHS',name:'Cedi ghanés'},
  {code:'GMD',name:'Dalasi gambiano'},
  {code:'GNF',name:'Franco guineano'},
  {code:'GTQ',name:'Quetzal guatemalteco'},
  {code:'GYD',name:'Dólar guyanés'},
  {code:'HNL',name:'Lempira hondureño'},
  {code:'HTG',name:'Gourde haitiano'},
  {code:'HUF',name:'Forinto húngaro'},
  {code:'IDR',name:'Rupia indonesia'},
  {code:'ILS',name:'Séquel israelí'},
  {code:'INR',name:'Rupia india'},
  {code:'IQD',name:'Dinar iraquí'},
  {code:'IRR',name:'Rial iraní'},
  {code:'ISK',name:'Corona islandesa'},
  {code:'JMD',name:'Dólar jamaicano'},
  {code:'JOD',name:'Dinar jordano'},
  {code:'JPY',name:'Yen japonés'},
  {code:'KES',name:'Chelín keniano'},
  {code:'KGS',name:'Som kirguís'},
  {code:'KHR',name:'Riel camboyano'},
  {code:'KMF',name:'Franco comorense'},
  {code:'KRW',name:'Won surcoreano'},
  {code:'KWD',name:'Dinar kuwaití'},
  {code:'KZT',name:'Tenge kazajo'},
  {code:'LAK',name:'Kip laosiano'},
  {code:'LBP',name:'Libra libanesa'},
  {code:'LKR',name:'Rupia de Sri Lanka'},
  {code:'LRD',name:'Dólar liberiano'},
  {code:'LSL',name:'Loti lesotense'},
  {code:'LYD',name:'Dinar libio'},
  {code:'MAD',name:'Dírham marroquí'},
  {code:'MDL',name:'Leu moldavo'},
  {code:'MGA',name:'Ariary malgache'},
  {code:'MKD',name:'Denar macedonio'},
  {code:'MMK',name:'Kyat birmano'},
  {code:'MNT',name:'Tugrik mongol'},
  {code:'MRU',name:'Uguiya mauritana'},
  {code:'MUR',name:'Rupia mauriciana'},
  {code:'MVR',name:'Rufiyaa maldivo'},
  {code:'MWK',name:'Kwacha malauí'},
  {code:'MXN',name:'Peso mexicano'},
  {code:'MYR',name:'Ringgit malayo'},
  {code:'MZN',name:'Metical mozambiqueño'},
  {code:'NAD',name:'Dólar namibio'},
  {code:'NGN',name:'Naira nigeriana'},
  {code:'NIO',name:'Córdoba nicaragüense'},
  {code:'NOK',name:'Corona noruega'},
  {code:'NPR',name:'Rupia nepalesa'},
  {code:'NZD',name:'Dólar neozelandés'},
  {code:'OMR',name:'Rial omaní'},
  {code:'PAB',name:'Balboa panameño'},
  {code:'PEN',name:'Sol peruano'},
  {code:'PGK',name:'Kina de Papúa'},
  {code:'PHP',name:'Peso filipino'},
  {code:'PKR',name:'Rupia pakistaní'},
  {code:'PLN',name:'Esloti polaco'},
  {code:'PYG',name:'Guaraní paraguayo'},
  {code:'QAR',name:'Rial catarí'},
  {code:'RON',name:'Leu rumano'},
  {code:'RSD',name:'Dinar serbio'},
  {code:'RUB',name:'Rublo ruso'},
  {code:'RWF',name:'Franco ruandés'},
  {code:'SAR',name:'Riyal saudí'},
  {code:'SBD',name:'Dólar salomónico'},
  {code:'SCR',name:'Rupia de Seychelles'},
  {code:'SDG',name:'Libra sudanesa'},
  {code:'SEK',name:'Corona sueca'},
  {code:'SGD',name:'Dólar de Singapur'},
  {code:'SLE',name:'Leone de Sierra Leona'},
  {code:'SOS',name:'Chelín somalí'},
  {code:'SRD',name:'Dólar surinamés'},
  {code:'SSP',name:'Libra de Sudán del Sur'},
  {code:'STN',name:'Dobra de Santo Tomé'},
  {code:'SYP',name:'Libra siria'},
  {code:'THB',name:'Baht tailandés'},
  {code:'TJS',name:'Somoni tayiko'},
  {code:'TMT',name:'Manat turcomano'},
  {code:'TND',name:'Dinar tunecino'},
  {code:'TOP',name:'Paʻanga tongano'},
  {code:'TTD',name:'Dólar de Trinidad'},
  {code:'TZS',name:'Chelín tanzano'},
  {code:'UAH',name:'Grivna ucraniana'},
  {code:'UGX',name:'Chelín ugandés'},
  {code:'USD',name:'Dólar estadounidense'},
  {code:'UYU',name:'Peso uruguayo'},
  {code:'UZS',name:'Som uzbeko'},
  {code:'VES',name:'Bolívar venezolano'},
  {code:'VND',name:'Dong vietnamita'},
  {code:'VUV',name:'Vatu vanuatense'},
  {code:'WST',name:'Tālā samoano'},
  {code:'XAF',name:'Franco CFA de África Central'},
  {code:'XCD',name:'Dólar del Caribe Oriental'},
  {code:'XOF',name:'Franco CFA de África Occidental'},
  {code:'XPF',name:'Franco CFP'},
  {code:'YER',name:'Rial yemení'},
  {code:'ZAR',name:'Rand sudafricano'},
  {code:'ZMW',name:'Kwacha zambiano'},
  {code:'ZWL',name:'Dólar zimbabuense'}
];
const ALL_LANGUAGES=[
  {id:'ar',label:'العربية (Árabe)',flag:'🇸🇦'},
  {id:'bn',label:'বাংলা (Bengalí)',flag:'🇧🇩'},
  {id:'de',label:'Deutsch (Alemán)',flag:'🇩🇪'},
  {id:'en',label:'English (Inglés)',flag:'🇬🇧'},
  {id:'es',label:'Español',flag:'🇪🇸'},
  {id:'fa',label:'فارسی (Persa)',flag:'🇮🇷'},
  {id:'fr',label:'Français (Francés)',flag:'🇫🇷'},
  {id:'hi',label:'हिन्दी (Hindi)',flag:'🇮🇳'},
  {id:'id',label:'Bahasa Indonesia',flag:'🇮🇩'},
  {id:'it',label:'Italiano',flag:'🇮🇹'},
  {id:'ja',label:'日本語 (Japonés)',flag:'🇯🇵'},
  {id:'ko',label:'한국어 (Coreano)',flag:'🇰🇷'},
  {id:'pl',label:'Polski (Polaco)',flag:'🇵🇱'},
  {id:'pt',label:'Português',flag:'🇧🇷'},
  {id:'ru',label:'Русский (Ruso)',flag:'🇷🇺'},
  {id:'sw',label:'Kiswahili (Suajili)',flag:'🇹🇿'},
  {id:'tr',label:'Türkçe (Turco)',flag:'🇹🇷'},
  {id:'ur',label:'اردو (Urdu)',flag:'🇵🇰'},
  {id:'vi',label:'Tiếng Việt (Vietnamita)',flag:'🇻🇳'},
  {id:'zh',label:'中文 (Chino)',flag:'🇨🇳'}
];
function renderConfiguracion(){
  const notifStatus=!('Notification'in window)?t('notifNA'):
    Notification.permission==='granted'?t('notifGranted'):
    Notification.permission==='denied'?t('notifDenied'):t('notifDefault');
  const activeCurs=S.currencies||[];
    const resCur=(()=>{const m={"Afghanistan":"AFN","Albania":"ALL","Alemania":"EUR","Andorra":"EUR","Angola":"AOA","Argentina":"ARS","Armenia":"AMD","Australia":"AUD","Austria":"EUR","Azerbaiyán":"AZN","Bahamas":"BSD","Bangladés":"BDT","Bélgica":"EUR","Belice":"BZD","Bolivia":"BOB","Bosnia y Herzegovina":"BAM","Brasil":"BRL","Bulgaria":"BGN","Camerún":"XAF","Canadá":"CAD","Chile":"CLP","China":"CNY","Chipre":"EUR","Colombia":"COP","Costa Rica":"CRC","Croacia":"EUR","Cuba":"CUP","Dinamarca":"DKK","Ecuador":"USD","Egipto":"EGP","El Salvador":"USD","Emiratos Árabes Unidos":"AED","Eslovaquia":"EUR","Eslovenia":"EUR","España":"EUR","Estados Unidos":"USD","Estonia":"EUR","Etiopía":"ETB","Filipinas":"PHP","Finlandia":"EUR","Francia":"EUR","Ghana":"GHS","Grecia":"EUR","Guatemala":"GTQ","Honduras":"HNL","Hungría":"HUF","India":"INR","Indonesia":"IDR","Irán":"IRR","Irlanda":"EUR","Israel":"ILS","Italia":"EUR","Jamaica":"JMD","Japón":"JPY","Jordania":"JOD","Kazajistán":"KZT","Kenia":"KES","México":"MXN","Marruecos":"MAD","Nepal":"NPR","Nicaragua":"NIO","Nigeria":"NGN","Noruega":"NOK","Nueva Zelanda":"NZD","Países Bajos":"EUR","Pakistán":"PKR","Panamá":"USD","Paraguay":"PYG","Perú":"PEN","Polonia":"PLN","Portugal":"EUR","Qatar":"QAR","Reino Unido":"GBP","República Checa":"CZK","República Dominicana":"DOP","Rumanía":"RON","Rusia":"RUB","Arabia Saudita":"SAR","Senegal":"XOF","Serbia":"RSD","Singapur":"SGD","Sudáfrica":"ZAR","Suecia":"SEK","Suiza":"CHF","Tailandia":"THB","Tanzania":"TZS","Turquía":"TRY","Ucrania":"UAH","Uruguay":"UYU","Venezuela":"VES","Vietnam":"VND","Zimbabue":"ZWL"};return m[S.profile&&S.profile.residence]||'';})();
  const curList=ALL_CURRENCIES.map(c=>{const meta=getCurrencyMeta(c.code);const isLocked=c.code===resCur&&resCur!=='';return`<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:${isLocked?'default':'pointer'};background:${activeCurs.includes(c.code)?'rgba(0,212,170,.12)':'var(--surface2)'}"><input type="checkbox" ${activeCurs.includes(c.code)?'checked':''} ${isLocked?'disabled':''} onchange="toggleCurrency('${c.code}',this.checked)" style="width:16px;height:16px;accent-color:var(--primary);flex-shrink:0"><div style="flex:1"><div style="font-size:14px;font-weight:700">${c.code} <span style="color:var(--primary)">${meta.sym}</span>${isLocked?' 🔒':''}</div><div style="font-size:11px;color:var(--text3)">${c.name}${isLocked?'<span style="color:var(--primary);font-size:10px;margin-left:4px">Moneda principal</span>':''}</div></div>${activeCurs.includes(c.code)?'<span style="color:var(--primary);font-size:16px">✓</span>':''}</label>`;}).join('');
  const curSelected=`${activeCurs.length} ${t('selected')}`;
  const langCurrent=S.language?ALL_LANGUAGES.find(l=>l.id===S.language)||ALL_LANGUAGES[0]:null;
  const langClear=`<div onclick="saveLanguage('')" style="display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;border-radius:8px;color:var(--text3);margin-bottom:2px"><span>✕</span><span style="font-size:14px">— Seleccionar —</span></div>`;
  const langList=langClear+ALL_LANGUAGES.map(l=>`<div onclick="saveLanguage('${l.id}')" style="display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;border-radius:8px;background:${l.id===S.language?'rgba(0,212,170,.12)':'transparent'};margin-bottom:2px">
    <span style="font-size:18px">${l.flag}</span>
    <span style="font-size:14px;font-weight:${l.id===S.language?'700':'400'};color:${l.id===S.language?'var(--primary)':'var(--text)'}">${l.label}</span>
    ${l.id===S.language?'<span style="margin-left:auto;color:var(--primary)">✓</span>':''}
  </div>`).join('');
  return`
    <!-- PROFILE SECTION -->
    <div class="config-item" onclick="navigate('mi-perfil')" style="margin-bottom:16px">
      <div class="config-item-left" style="gap:12px">
        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid var(--primary);overflow:hidden;flex-shrink:0">
          ${(S.profile&&S.profile.photo)?`<img src="${S.profile.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:(S.profile&&S.profile.name?`<span style="font-size:18px;font-weight:700;color:white">${S.profile.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</span>`:'<span>👤</span>')}
        </div>
        <div>
          <div style="font-size:15px;font-weight:700">${(S.profile&&S.profile.name)||'Mi Perfil'}</div>
          <div style="font-size:12px;color:var(--text2)">${(S.profile&&S.profile.email)||'Toca para completar tu perfil'}</div>
        </div>
      </div>
      <span style="color:var(--text3)">›</span>
    </div>
<!-- CATEGORÍAS -->
    <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">Categorías</div>
    <div class="config-item" onclick="openCatPanel()" style="margin-bottom:16px">
      <div class="config-item-left">
        <div class="config-icon" style="background:rgba(0,212,170,.15)">🏷️</div>
        <div>
          <div style="font-size:14px;font-weight:600">Categorías</div>
          <div style="font-size:12px;color:var(--text2)">${S.categories.length} categorías · ${S.subcategories.length} subcategorías</div>
        </div>
      </div>
      <span style="color:var(--text3)">›</span>
    </div>
    <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">${t('preferences')}</div>

    <!-- Language -->
    <div class="config-item" style="flex-direction:column;align-items:stretch;gap:8px;cursor:default">
      <label style="font-size:14px;font-weight:600;margin:0">${t('language')}</label>
      <div class="bs-trigger" onclick="showLangPickerScreen()">
        <span style="font-size:14px">${langCurrent?langCurrent.flag+' '+langCurrent.label:'Seleccionar idioma'}</span>
        <span style="color:var(--text3);font-size:18px">›</span>
      </div>
    </div>

    <!-- Week start -->
    <div class="config-item" style="flex-direction:column;align-items:stretch;gap:8px;cursor:default">
      <label style="font-size:14px;font-weight:600;margin:0">${t('weekStart')}</label>
      <div class="bs-trigger" onclick="showBS_week()">
        <span style="font-size:14px">📅 ${({lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado',domingo:'Domingo'})[S.weekStart]||'Seleccionar'}</span>
        <span style="color:var(--text3);font-size:18px">›</span>
      </div>
    </div>

    <!-- Currency Format -->
    

    <!-- Currencies -->
    <div class="config-item" style="flex-direction:column;align-items:stretch;gap:8px;cursor:default">
      <label style="font-size:14px;font-weight:600;margin:0">${t('activeCurrencies')}</label>
      <div class="bs-trigger" onclick="showCurrenciesPickerScreen()">
        <span style="font-size:14px" id="cfg-cur-lbl">💱 ${(S.currencies&&S.currencies.length)?(S.currencies.join(' · ')):'Seleccionar'}</span>
        <span style="color:var(--text3);font-size:18px">›</span>
      </div>
      <div style="font-size:11px;color:var(--text2)">Selecciona 1 o 2 monedas.</div>
    </div>

    <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin:16px 0 10px">${t('appearance')}</div>
    <div class="config-item" style="flex-direction:column;align-items:stretch;gap:8px;cursor:default">
      <label style="font-size:14px;font-weight:600;margin:0">${t('theme')}</label>
      <div style="background:var(--surface2);border-radius:50px;padding:3px;display:flex;gap:2px">
        ${buildThemeCaps()}
      </div>
    </div>

    <!-- Formato de moneda -->
    <div class="config-item" style="flex-direction:column;align-items:stretch;gap:8px;cursor:default">
      <label style="font-size:14px;font-weight:600;margin:0">💱 Formato de moneda</label>
      <div style="background:var(--surface2);border-radius:50px;padding:3px;display:flex;gap:2px">
        ${buildNumFormatCaps()}
      </div>
      <div style="font-size:11px;color:var(--text2);margin-top:4px">
        Ejemplo: <strong>${buildNumFormatExample()}</strong>
      </div>
    </div>

    <divv style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin:16px 0 10px">${t('system')}</div>
    <div class="config-item" onclick="openNotifPage()">
      <div class="config-item-left"><div class="config-icon" style="background:rgba(245,158,11,.15)">🔔</div><div><div style="font-size:14px;font-weight:600">${t('notifications')}</div><div style="font-size:12px;color:var(--text2)">${notifStatus}</div></div></div>
      <span style="color:var(--text3)">›</span>
    </div>
    <div class="config-item" onclick="exportData()">
      <div class="config-item-left"><div class="config-icon" style="background:rgba(59,130,246,.15)">📤</div><div><div style="font-size:14px;font-weight:600">${t('export')}</div><div style="font-size:12px;color:var(--text2)">${t('exportDesc')}</div></div></div>
      <span style="color:var(--text3)">›</span>
    </div>
    <div class="config-item" onclick="importData()">
      <div class="config-item-left"><div class="config-icon" style="background:rgba(16,185,129,.15)">📥</div><div><div style="font-size:14px;font-weight:600">${t('import')}</div><div style="font-size:12px;color:var(--text2)">${t('importDesc')}</div></div></div>
      <span style="color:var(--text3)">›</span>
    </div>
    <div class="config-item" onclick="resetApp()" style="margin-top:8px">
      <div class="config-item-left"><div class="config-icon" style="background:rgba(239,68,68,.15)">🗑️</div><div><div style="font-size:14px;font-weight:600;color:var(--danger)">${t('reset')}</div><div style="font-size:12px;color:var(--text2)">${t('resetDesc')}</div></div></div>
      <span style="color:var(--text3)">›</span>
    </div>
    <input type="file" id="import-file" accept=".json" style="display:none" onchange="handleImportFile(event)">
    <div style="margin-top:32px;text-align:center;color:var(--text3);font-size:11px">${t('version')}</div>
  `;
}function togglePPick(id){
  var el=document.getElementById(id);var arr=document.getElementById(id+'-arrow');
  if(!el)return;
  var isOpen=el.style.display!=='none';
  el.style.display=isOpen?'none':'block';
  if(arr)arr.textContent=isOpen?'▼':'▲';
}function selectPPick(inputId,pickId,val){
  var inp=document.getElementById(inputId);
  var lbl=document.getElementById(inputId+'-lbl');
  var pick=document.getElementById(pickId);
  var arr=document.getElementById(pickId+'-arrow');
  if(inp)inp.value=val;
  if(lbl){
    var ph={'cfg-country':'Seleccionar país de origen','cfg-residence':'Seleccionar país de residencia','cfg-occupation':'Seleccionar ocupación','cfg-marital':'Seleccionar estado civil','cfg-goal':'Seleccionar objetivo'};
    lbl.textContent=val||(ph[inputId]||'Seleccionar');
    lbl.style.color=val?'var(--text)':'var(--text3)';
  }
  if(pick)pick.style.display='none';
  if(arr)arr.textContent='▼';
  // Highlight selected
  if(pick)pick.querySelectorAll('.ppick-item').forEach(function(item){
    item.style.background=item.dataset.val===val?'rgba(0,212,170,.12)':'';
    item.style.fontWeight=item.dataset.val===val?'700':'';
  });
}

function selectPPickWithFlag(inputId,pickId,val,flag){var inp=document.getElementById(inputId);var lbl=document.getElementById(inputId+'-lbl');var pick=document.getElementById(pickId);var arr=document.getElementById(pickId+'-arrow');if(inp)inp.value=val;if(lbl){var ph={'cfg-country':'Seleccionar país de origen','cfg-residence':'Seleccionar país de residencia'};lbl.textContent=val&&flag?(flag+' '+val):(ph[inputId]||'Seleccionar');lbl.style.color=val?'var(--text)':'var(--text3)';}if(pick){pick.style.display='none';}if(arr)arr.textContent='▼';if(pick)pick.querySelectorAll('.ppick-item').forEach(function(item){item.style.background=item.dataset.val===val?'rgba(0,212,170,.12)':'';item.style.fontWeight=item.dataset.val===val?'700':'';});}


// ── Global flag helpers ────────────────────────────────
function _iso2flag(iso){return iso?String.fromCodePoint(iso.charCodeAt(0)+127397)+String.fromCodePoint(iso.charCodeAt(1)+127397):'🌐';}
var _PHONE_ISO={'+54':'AR','+591':'BO','+55':'BR','+56':'CL','+57':'CO','+506':'CR','+53':'CU','+1809':'DO','+593':'EC','+503':'SV','+502':'GT','+509':'HT','+504':'HN','+52':'MX','+505':'NI','+507':'PA','+595':'PY','+51':'PE','+598':'UY','+58':'VE','+34':'ES','+33':'FR','+49':'DE','+39':'IT','+351':'PT','+44':'GB','+1':'US','+81':'JP','+82':'KR','+86':'CN','+91':'IN','+7':'RU','+380':'UA','+48':'PL','+31':'NL','+32':'BE','+41':'CH','+43':'AT','+46':'SE','+47':'NO','+45':'DK','+358':'FI','+30':'GR','+36':'HU','+420':'CZ','+40':'RO','+359':'BG','+372':'EE','+371':'LV','+370':'LT','+27':'ZA','+234':'NG','+20':'EG','+254':'KE','+255':'TZ','+256':'UG','+251':'ET','+60':'MY','+65':'SG','+66':'TH','+62':'ID','+63':'PH','+84':'VN','+92':'PK','+880':'BD','+94':'LK','+98':'IR','+90':'TR','+972':'IL','+966':'SA','+971':'AE','+212':'MA','+213':'DZ','+216':'TN','+218':'LY','+61':'AU','+64':'NZ','+93':'AF','+355':'AL','+244':'AO','+374':'AM','+994':'AZ','+973':'BH','+375':'BY','+501':'BZ','+855':'KH','+237':'CM','+241':'GA','+220':'GM','+995':'GE','+233':'GH','+592':'GY','+354':'IS','+964':'IQ','+353':'IE','+225':'CI','+962':'JO','+686':'KI','+965':'KW','+856':'LA','+961':'LB','+266':'LS','+231':'LR','+352':'LU','+261':'MG','+265':'MW','+960':'MV','+223':'ML','+356':'MT','+222':'MR','+230':'MU','+258':'MZ','+264':'NA','+977':'NP','+227':'NE','+968':'OM','+675':'PG','+974':'QA','+250':'RW','+221':'SN','+232':'SL','+252':'SO','+211':'SS','+249':'SD','+597':'SR','+992':'TJ','+228':'TG','+676':'TO','+1868':'TT','+993':'TM','+998':'UZ','+678':'VU','+967':'YE','+260':'ZM','+263':'ZW','+376':'AD','+374':'AM','+1242':'BS','+1246':'BB','+229':'BJ','+975':'BT','+267':'BW','+387':'BA','+226':'BF','+257':'BI','+238':'CV','+236':'CF','+235':'TD','+269':'KM','+243':'CD','+242':'CG','+240':'GQ','+291':'ER','+268':'SZ','+679':'FJ','+245':'GW','+423':'LI','+692':'MH','+377':'MC','+976':'MN','+382':'ME','+674':'NR','+680':'PW','+970':'PS','+1869':'KN','+1758':'LC','+1784':'VC','+685':'WS','+378':'SM','+239':'ST','+381':'RS','+421':'SK','+386':'SI','+677':'SB','+886':'TW','+1876':'JM','+389':'MK','+673':'BN','+855':'KH','+996':'KG'};
function countryFlagGlobal(name){var d=COUNTRY_DATA&&COUNTRY_DATA[name];if(!d)return'🌐';var iso=_PHONE_ISO[d.phone]||null;return iso?_iso2flag(iso):'🌐';}

// ── Bottom Sheet System ────────────────────────────────
var _bsCfg=null;
var _bsAllItems=[];

function showBottomSheet(cfg){
  closeBottomSheet();
  _bsCfg=cfg;
  _bsAllItems=cfg.items||[];
  var overlay=document.createElement('div');
  overlay.id='bs-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;animation:bsFadeIn .18s ease';
  overlay.onclick=function(e){if(e.target===overlay)closeBottomSheet();};
  var searchHtml=cfg.searchable
    ?'<div style="padding:8px 16px 10px"><input id="bs-search" class="form-input" placeholder="Buscar..." oninput="_filterBS(this.value)" style="font-size:14px;padding:10px 14px"></div>'
    :'';
  var sheet=document.createElement('div');
  sheet.id='bs-sheet';
  sheet.style.cssText='width:100%;background:var(--surface);border-radius:20px 20px 0 0;max-height:80vh;display:flex;flex-direction:column;animation:bsSlideUp .22s ease';
  sheet.innerHTML=
    '<div style="display:flex;justify-content:center;padding:10px 0 2px"><div style="width:36px;height:4px;background:var(--border);border-radius:2px"></div></div>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 16px 12px;border-bottom:1px solid var(--border)">'+
      '<span style="font-size:15px;font-weight:700;color:var(--text)">'+cfg.title+'</span>'+
      '<button onclick="closeBottomSheet()" style="width:28px;height:28px;border-radius:50%;border:none;background:var(--surface2);color:var(--text2);cursor:pointer;font-size:13px;line-height:1">✕</button>'+
    '</div>'+
    searchHtml+
    '<div id="bs-list" style="overflow-y:auto;flex:1;padding:8px 8px 24px">'+_buildBSItems(_bsAllItems,cfg.selected)+'</div>';
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  if(cfg.searchable){setTimeout(function(){var s=document.getElementById('bs-search');if(s)s.focus();},250);}
}

function _buildBSItems(items,selected){
  return items.map(function(item){
    var sel=item.val===selected;
    var inner=item.html
      ? item.html  // HTML personalizado (ej: monedas con 2 líneas)
      : '<span style="font-size:14px;color:var(--text);font-weight:'+(sel?'700':'400')+'">'+item.label+'</span>';
    return '<div class="bs-item" onclick="_selectBS(\''+item.val.replace(/'/g,"\\'")+'\')" style="background:'+(sel?'rgba(0,212,170,.1)':'transparent')+'">'+
      inner+
      (sel?'<span style="color:var(--primary);font-size:16px">✓</span>':'')+
    '</div>';
  }).join('');
}

function _filterBS(q){
  if(!_bsCfg)return;
  q=q.toLowerCase().trim();
  var filtered=q?_bsAllItems.filter(function(i){return i.label.toLowerCase().indexOf(q)!==-1;}):_bsAllItems;
  var list=document.getElementById('bs-list');
  if(list)list.innerHTML=_buildBSItems(filtered,_bsCfg.selected);
}

function _selectBS(val){
  if(_bsCfg){
    var isSelected=_bsCfg.selected===val;
    var newVal=val;
    if(isSelected&&_bsCfg.allowDeselect){
      // Solo desmarcar si el campo lo permite explícitamente
      newVal='';
    }
    _bsCfg.selected=newVal;
    if(_bsCfg.onSelect)_bsCfg.onSelect(newVal);
  }
  closeBottomSheet();
}

function closeBottomSheet(){
  var o=document.getElementById('bs-overlay');
  if(o)o.remove();
  _bsCfg=null;
  _bsAllItems=[];
}

// ── Helper label de moneda en trigger BS ─────────────────
function buildCurTriggerLabel(code){
  if(!code)return '';
  var meta=getCurrencyMeta(code);
  var sym=meta?meta.sym:code;
  return '<span style="font-size:14px;font-weight:700;color:var(--text)">'+code+'</span>'
    +'<span style="font-size:14px;color:var(--text3);margin:0 4px">•</span>'
    +'<span style="font-size:16px;font-weight:800;color:var(--primary)">'+sym+'</span>';
}

// ── Helper item de moneda para BS ────────────────────────
// ── Currency items con diseño 2 líneas ───────────────────
function buildCurrencyItems(selectedVal){
  return ALL_CURRENCIES.map(function(c){
    var meta=getCurrencyMeta(c.code);
    var sym=meta?meta.sym:c.code;
    var h='<div style="display:flex;flex-direction:column;flex:1;min-width:0">'
      +'<span style="font-size:13px;color:var(--text2)">'+c.name+'</span>'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px">'
        +'<span style="font-size:14px;font-weight:700;color:var(--text)">'+c.code+'</span>'
        +'<span style="font-size:18px;font-weight:800;color:var(--primary)">'+sym+'</span>'
      +'</div>'
      +'</div>';
    return {val:c.code,label:c.name+' '+c.code,html:h};
  });
}

// ── BS Launchers ───────────────────────────────────────
function showBS_country(inputId){
  var current=document.getElementById(inputId)?document.getElementById(inputId).value:'';
  var items=Object.keys(COUNTRY_DATA).map(function(name){
    return {val:name,label:countryFlagGlobal(name)+' '+name};
  });
  var ph=inputId==='cfg-country'?'País de origen':'País de residencia';
  showBottomSheet({
    title:ph,items:items,selected:current,searchable:true,
    onSelect:function(val){
      var flag=val?countryFlagGlobal(val):'';
      var inp=document.getElementById(inputId);
      var lbl=document.getElementById(inputId+'-lbl');
      if(inp)inp.value=val;
      if(lbl){lbl.textContent=val?(flag+' '+val):(ph==='País de origen'?'Seleccionar país de origen':'Seleccionar país de residencia');lbl.style.color=val?'var(--text)':'var(--text3)';}
    }
  });
}

function showBS_simple(inputId,lblSuffix,title,items,placeholder,allowDesel){
  var current=document.getElementById(inputId)?document.getElementById(inputId).value:'';
  var bsItems=items.map(function(o){return {val:o,label:o};});
  showBottomSheet({
    title:title,items:bsItems,selected:current,searchable:false,allowDeselect:!!allowDesel,
    onSelect:function(val){
      var inp=document.getElementById(inputId);
      var lbl=document.getElementById(inputId+lblSuffix);
      if(inp)inp.value=val;
      if(lbl){lbl.textContent=val||placeholder;lbl.style.color=val?'var(--text)':'var(--text3)';}
    }
  });
}

function showBS_catType(){
  var current=document.getElementById('cat-type')?document.getElementById('cat-type').value:'gasto';
  var items=[{val:'gasto',label:'💸 Gasto'},{val:'ingreso',label:'💰 Ingreso'},{val:'transferencia',label:'↔️ Transferencia'}];
  showBottomSheet({
    title:'Tipo de categoría',items:items,selected:current,searchable:false,
    onSelect:function(val){
      var inp=document.getElementById('cat-type');
      var lbl=document.getElementById('cat-type-lbl');
      var labels={gasto:'💸 Gasto',ingreso:'💰 Ingreso',transferencia:'↔️ Transferencia'};
      if(inp)inp.value=val;
      if(lbl){lbl.textContent=labels[val]||val;lbl.style.color='var(--text)';}
      updateCatModalFields(val);
    }
  });
}

function showBS_catNature(){
  var current=document.getElementById('cat-nature')?document.getElementById('cat-nature').value:'necesidades';
  var items=[{val:'necesidades',label:'🏠 Necesidades'},{val:'deseos',label:'🎯 Deseos'},{val:'ahorros',label:'💰 Ahorros'}];
  showBottomSheet({
    title:'Naturaleza',items:items,selected:current,searchable:false,
    onSelect:function(val){
      var inp=document.getElementById('cat-nature');
      var lbl=document.getElementById('cat-nature-lbl');
      var labels={necesidades:'🏠 Necesidades',deseos:'🎯 Deseos',ahorros:'💰 Ahorros'};
      if(inp)inp.value=val;
      if(lbl){lbl.textContent=labels[val]||val;lbl.style.color='var(--text)';}
    }
  });
}

function showBS_catIncome(){
  var current=document.getElementById('cat-income-type')?document.getElementById('cat-income-type').value:'principal';
  var items=[{val:'principal',label:'⭐ Principal'},{val:'secundario',label:'➕ Secundario'}];
  showBottomSheet({
    title:'Tipo de ingreso',items:items,selected:current,searchable:false,
    onSelect:function(val){
      var inp=document.getElementById('cat-income-type');
      var lbl=document.getElementById('cat-income-lbl');
      var labels={principal:'⭐ Principal',secundario:'➕ Secundario'};
      if(inp)inp.value=val;
      if(lbl){lbl.textContent=labels[val]||val;lbl.style.color='var(--text)';}
    }
  });
}

function showBS_currency(idx,side){
  var rows=window._cambioRows||[];
  var row=rows[idx]||{};
  var current=side==='from'?(row.from||''):(row.to||'');
  var items=ALL_CURRENCIES.map(function(cur){
    var meta=getCurrencyMeta(cur.code);
    return {val:cur.code,label:cur.code+(meta&&meta.sym&&meta.sym!==cur.code?' '+meta.sym:'')+'  —  '+cur.name};
  });
  showBottomSheet({
    title:side==='from'?'💱 Moneda de origen':'💱 Moneda destino',
    items:items,selected:current,searchable:true,
    onSelect:function(val){selectCambioCur(idx,side,val);}
  });
}


function showBS_lang(){
  var items=ALL_LANGUAGES.map(function(l){return {val:l.id,label:l.flag+' '+l.label};});
  showBottomSheet({
    title:'🌐 Idioma',items:items,selected:S.language||'',searchable:true,
    onSelect:function(val){
      S.language=val;saveState();renderPage('configuracion');
    }
  });
}
function showBS_week(){
  var items=[
    {val:'lunes',label:'📅 Lunes'},{val:'martes',label:'📅 Martes'},
    {val:'miercoles',label:'📅 Miércoles'},{val:'jueves',label:'📅 Jueves'},
    {val:'viernes',label:'📅 Viernes'},{val:'sabado',label:'📅 Sábado'},
    {val:'domingo',label:'📅 Domingo'}
  ];
  showBottomSheet({
    title:'📅 Inicio de semana',items:items,selected:S.weekStart||'',searchable:false,allowDeselect:true,
    onSelect:function(val){saveWeekStart(val);}
  });
}
function showBS_theme(){
  var items=[
    {val:'light',label:'☀️ Claro'},
    {val:'dark',label:'🌙 Oscuro'},
    {val:'auto',label:'⚙️ Automático del sistema'}
  ];
  showBottomSheet({
    title:'🎨 Tema',items:items,selected:S.theme||'auto',searchable:false,
    onSelect:function(val){setTheme(val);}
  });
}
function showBS_currencies(){
  var sel=(S.currencies||[]).slice();
  var items=ALL_CURRENCIES.map(function(c){return {val:c.code,label:c.code+' — '+c.name,checked:sel.indexOf(c.code)!==-1};});
  // Multi-select BS
  closeBottomSheet();
  var overlay=document.createElement('div');
  overlay.id='bs-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;animation:bsFadeIn .18s ease';
  overlay.onclick=function(e){if(e.target===overlay){_saveCurrencyBS(sel);closeBottomSheet();}};
  var sheet=document.createElement('div');
  sheet.id='bs-sheet';
  sheet.style.cssText='width:100%;background:var(--surface);border-radius:20px 20px 0 0;max-height:80vh;display:flex;flex-direction:column;animation:bsSlideUp .22s ease';
  function renderCurHeader(){
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 16px 12px;border-bottom:1px solid var(--border)">'+
      '<span style="font-size:15px;font-weight:700;color:var(--text)">💱 Monedas activas</span>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<span id="bs-cur-count" style="font-size:12px;color:var(--primary);font-weight:700;background:rgba(0,212,170,.12);padding:3px 10px;border-radius:50px">'+sel.length+'/2</span>'+
        '<button onclick="_saveCurrencyBS(window._bsCurSel);closeBottomSheet()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:13px;width:28px;height:28px;border-radius:50%;background:var(--surface2)">✕</button>'+
      '</div>'+
    '</div>';
  }
  function renderCurList(q){
    var filtered=q?items.filter(function(i){return i.label.toLowerCase().indexOf(q.toLowerCase())!==-1;}):items;
    return filtered.map(function(item){
      var checked=sel.indexOf(item.val)!==-1;
      var meta=getCurrencyMeta(item.val);
      var sym=meta?meta.sym:item.val;
      var cur=ALL_CURRENCIES.find(function(c){return c.code===item.val;});
      var name=cur?cur.name:item.val;
      return '<div class="bs-item" onclick="_toggleCurBS(\''+item.val+'\')" style="background:'+(checked?'rgba(0,212,170,.08)':'transparent')+'">'+
        '<div style="display:flex;align-items:center;gap:12px;flex:1">'+
          '<div style="width:20px;height:20px;border-radius:5px;border:2px solid '+(checked?'var(--primary)':'var(--border)')+';background:'+(checked?'var(--primary)':'transparent')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.1s">'+
            (checked?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>':'')+
          '</div>'+
          '<div style="display:flex;flex-direction:column;flex:1;min-width:0">'+
            '<span style="font-size:13px;color:var(--text2)">'+name+'</span>'+
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px">'+
              '<span style="font-size:14px;font-weight:700;color:var(--text)">'+item.val+'</span>'+
              '<span style="font-size:18px;font-weight:800;color:var(--primary)">'+sym+'</span>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('');
  }
  window._bsCurSel=sel;
  sheet.innerHTML=
    '<div style="display:flex;justify-content:center;padding:10px 0 2px"><div style="width:36px;height:4px;background:var(--border);border-radius:2px"></div></div>'+
    renderCurHeader()+
    '<div style="padding:8px 16px 10px;border-bottom:1px solid var(--border)"><input id="bs-cur-search" class="form-input" placeholder="Buscar moneda..." oninput="_filterCurBS(this.value)" style="font-size:14px;padding:10px 14px"></div>'+
    '<div id="bs-cur-list" style="overflow-y:auto;flex:1;padding:8px 8px 24px">'+renderCurList('')+'</div>';
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  setTimeout(function(){var s=document.getElementById('bs-cur-search');if(s)s.focus();},250);
}
function _toggleCurBS(code){
  var sel=window._bsCurSel||(window._bsCurSel=[]);
  var idx=sel.indexOf(code);
  if(idx!==-1){
    sel.splice(idx,1);
  } else {
    if(sel.length>=2){toast('Máximo 2 monedas');return;}
    sel.push(code);
    if(sel.length===2){_saveCurrencyBS(sel);closeBottomSheet();return;}
  }
  // Re-render list and counter
  var q=document.getElementById('bs-cur-search')?document.getElementById('bs-cur-search').value:'';
  _filterCurBS(q);
  var cnt=document.getElementById('bs-cur-count');
  if(cnt)cnt.textContent=sel.length+'/2';
}
function _filterCurBS(q){
  var sel=window._bsCurSel||[];
  var list=document.getElementById('bs-cur-list');
  if(!list)return;
  var filtered=q?ALL_CURRENCIES.filter(function(c){
    return (c.name+' '+c.code).toLowerCase().indexOf(q.toLowerCase())!==-1;
  }):ALL_CURRENCIES;
  list.innerHTML=filtered.map(function(c){
    var checked=sel.indexOf(c.code)!==-1;
    var meta=getCurrencyMeta(c.code);
    var sym=meta?meta.sym:c.code;
    return '<div class="bs-item" onclick="_toggleCurBS(\''+c.code+'\')" style="background:'+(checked?'rgba(0,212,170,.08)':'transparent')+'">'+
      '<div style="display:flex;align-items:center;gap:12px;flex:1">'+
        '<div style="width:20px;height:20px;border-radius:5px;border:2px solid '+(checked?'var(--primary)':'var(--border)')+';background:'+(checked?'var(--primary)':'transparent')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.1s">'+
          (checked?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>':'')+
        '</div>'+
        '<div style="display:flex;flex-direction:column;flex:1;min-width:0">'+
          '<span style="font-size:13px;color:var(--text2)">'+c.name+'</span>'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px">'+
            '<span style="font-size:14px;font-weight:700;color:var(--text)">'+c.code+'</span>'+
            '<span style="font-size:18px;font-weight:800;color:var(--primary)">'+sym+'</span>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');
}
function _saveCurrencyBS(sel){
  S.currencies=(sel||[]).slice();
  saveState();
  var el=document.getElementById('cfg-cur-lbl');
  if(el){el.textContent=S.currencies.length?S.currencies.join(' · '):'Sin moneda seleccionada';el.style.color=S.currencies.length?'var(--text)':'var(--text3)';}
  var iconEl=document.getElementById('cfg-cur-icon');
  if(iconEl)iconEl.style.display=S.currencies.length?'inline':'none';
  renderPage('configuracion');
}

function getDefaultPhoneCode(){
  try{
    var tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
    var lang=(navigator.language||'').toLowerCase();
    var m={'Europe/Warsaw':'+48','America/Bogota':'+57','America/New_York':'+1',
      'America/Chicago':'+1','America/Los_Angeles':'+1','America/Sao_Paulo':'+55',
      'Europe/London':'+44','Europe/Madrid':'+34','America/Mexico_City':'+52',
      'America/Argentina/Buenos_Aires':'+54','America/Santiago':'+56',
      'America/Lima':'+51','America/Caracas':'+58','America/Guayaquil':'+593',
      'America/Guatemala':'+502','Europe/Berlin':'+49','Europe/Paris':'+33',
      'Europe/Rome':'+39','Europe/Moscow':'+7','Asia/Shanghai':'+86',
      'Asia/Kolkata':'+91','Asia/Tokyo':'+81','Asia/Seoul':'+82',
      'Europe/Lisbon':'+351','America/Montevideo':'+598','America/Asuncion':'+595',
      'America/La_Paz':'+591','America/Costa_Rica':'+506','America/El_Salvador':'+503',
      'America/Tegucigalpa':'+504','America/Managua':'+505','America/Panama':'+507',
      'America/Santo_Domingo':'+1809','Europe/Bucharest':'+40','Europe/Sofia':'+359',
      'Europe/Prague':'+420','Europe/Budapest':'+36','Europe/Vienna':'+43',
      'Europe/Amsterdam':'+31','Europe/Brussels':'+32','Europe/Stockholm':'+46',
      'Europe/Oslo':'+47','Europe/Copenhagen':'+45','Europe/Helsinki':'+358',
      'Europe/Athens':'+30','Europe/Kyiv':'+380','Europe/Minsk':'+375',
      'Europe/Riga':'+371','Europe/Tallinn':'+372','Europe/Vilnius':'+370',
      'Europe/Bratislava':'+421','Europe/Ljubljana':'+386','Europe/Zagreb':'+385',
      'Europe/Belgrade':'+381','Europe/Sarajevo':'+387','Europe/Skopje':'+389',
      'Europe/Podgorica':'+382','Europe/Tirane':'+355','Asia/Tashkent':'+998',
      'Asia/Almaty':'+7','Asia/Baku':'+994','Asia/Yerevan':'+374',
      'Asia/Tbilisi':'+995','Asia/Karachi':'+92','Asia/Dhaka':'+880',
      'Asia/Kabul':'+93','Asia/Tehran':'+98','Asia/Baghdad':'+964',
      'Asia/Riyadh':'+966','Asia/Dubai':'+971','Asia/Kuwait':'+965',
      'Asia/Qatar':'+974','Asia/Bahrain':'+973','Asia/Beirut':'+961',
      'Asia/Amman':'+962','Asia/Jerusalem':'+972','Asia/Nicosia':'+357',
      'Africa/Cairo':'+20','Africa/Casablanca':'+212','Africa/Lagos':'+234',
      'Africa/Johannesburg':'+27','Africa/Nairobi':'+254','Africa/Addis_Ababa':'+251',
      'Africa/Accra':'+233','Africa/Dar_es_Salaam':'+255',
      'Pacific/Auckland':'+64','Australia/Sydney':'+61','Asia/Jakarta':'+62',
      'Asia/Bangkok':'+66','Asia/Ho_Chi_Minh':'+84','Asia/Kuala_Lumpur':'+60',
      'Asia/Manila':'+63','Asia/Rangoon':'+95','Asia/Dhaka':'+880',
    };
    for(var zone in m){if(tz===zone||tz.indexOf(zone)>=0)return m[zone];}
    var lm={'pl':'+48','es-co':'+57','es-ar':'+54','es-mx':'+52','es-cl':'+56',
      'es-pe':'+51','es-ve':'+58','pt-br':'+55','pt-pt':'+351','en-us':'+1',
      'en-gb':'+44','de':'+49','fr':'+33','it':'+39','ru':'+7','zh':'+86',
      'hi':'+91','ja':'+81','ko':'+82','nl':'+31','sv':'+46','no':'+47',
      'da':'+45','fi':'+358','uk':'+380','ar':'+966','he':'+972','id':'+62',
      'th':'+66','vi':'+84','ms':'+60'};
    for(var lk in lm){if(lang.startsWith(lk))return lm[lk];}
  }catch(e){}
  return '';
}
function updatePhoneLen(code){var m={'+57':10,'+48':9,'+1':10,'+34':9,'+52':10,'+54':10,'+55':11,'+56':9,'+51':9,'+58':11,'+593':9,'+502':8,'+44':10,'+49':11,'+33':9,'+39':10,'+7':10,'+86':11,'+91':10,'+81':11,'+82':11};var i=document.getElementById('cfg-phone');if(i)i.maxLength=m[code]||15;}






// ── Mi Perfil page ────────────────────────────────────────
function renderMiPerfil(){
  var p=S.profile||{};
  var emailVal=p.email||(window._currentUser&&window._currentUser.email?window._currentUser.email:'');
  var initials=p.name?p.name.split(' ').filter(function(w){return w.length>0;}).map(function(w){return w[0];}).join('').toUpperCase().slice(0,2):'?';
  var avatarContent=p.photo
    ?'<img src="'+p.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'
    :'<span style="font-size:28px;font-weight:700;color:white">'+initials+'</span>';
  var phone=(p.phoneCode?p.phoneCode+' ':'')+( p.phone||'');
  var camSvg='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>';
  var editSvg='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  var gearSvg='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>';
  function infoRow(label,value,ph){
    return '<div style="padding:13px 0;border-bottom:1px solid var(--border)">'
      +'<div style="font-size:11px;color:var(--text3);margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px">'+label+'</div>'
      +'<div style="font-size:15px;'+(value?'font-weight:600;color:var(--text)':'color:var(--text3);font-style:italic')+'\">'+(value||(ph||'Sin completar'))+'</div>'
      +'</div>';
  }
  return '<div>'
    +'<div style="display:flex;flex-direction:column;align-items:center;padding:28px 20px 24px">'
      +'<div style="width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;overflow:hidden;border:3px solid var(--primary);box-shadow:0 4px 20px rgba(0,212,170,.25)">'
        +avatarContent
      +'</div>'
      +(p.name?'<div style="font-size:20px;font-weight:800;margin-top:14px;color:var(--text)">'+p.name+'</div>':'')
      +(emailVal?'<div style="font-size:13px;color:var(--text3);margin-top:4px">'+emailVal+'</div>':'')
    +'</div>'
    +'<div style="display:flex;gap:10px;padding:0 16px 20px">'
      +'<button onclick="showPhotoOptions()" class="mp-action-btn">'+camSvg+'<span>Establecer foto</span></button>'
      +'<button onclick="openProfilePage()" class="mp-action-btn">'+editSvg+'<span>Editar info.</span></button>'
      +'<button onclick="navigate(\'configuracion\')" class="mp-action-btn">'+gearSvg+'<span>Ajustes</span></button>'
    +'</div>'
    +'<div style="margin:0 16px;background:var(--surface);border-radius:16px;padding:0 16px">'
      +infoRow('Nombre y apellido',p.name||'','Tu nombre')
      +infoRow('País de residencia',p.residence?(countryFlagGlobal(p.residence)+' '+p.residence):'','Tu país')
      +infoRow('Teléfono',phone.trim()||'','Tu teléfono')
      +infoRow('Profesión',p.profession||'','Tu profesión')
    +'</div>'
    +'<input type="file" id="profile-cam-input" accept="image/*" capture="user" style="display:none" onchange="handleProfilePhoto(event)">'
    +'<input type="file" id="profile-gal-input" accept="image/*" style="display:none" onchange="handleProfilePhoto(event)">'
  +'</div>';
}

// ── Picker screens ────────────────────────────────────────
var _pickerCtx={};
function _openPickerScreen(title,searchPlaceholder){
  closePickerScreen();
  var backSvg='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  var ov=document.createElement('div');
  ov.id='picker-screen-overlay';
  ov.style.cssText='position:fixed;inset:0;z-index:310;background:var(--bg);display:flex;flex-direction:column;overflow:hidden';
  ov.innerHTML='<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:14px 16px;display:flex;align-items:center;gap:4px;flex-shrink:0">'
    +'<button onclick="closePickerScreen()" style="width:36px;height:36px;border-radius:50%;border:none;background:transparent;color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">'+backSvg+'</button>'
    +'<span style="font-size:17px;font-weight:800;flex:1">'+title+'</span>'
    +'</div>'
    +'<div style="padding:10px 12px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0">'
      +'<input id="picker-search" class="form-input" placeholder="'+searchPlaceholder+'" oninput="_filterPickerList(this.value)" style="font-size:14px;padding:10px 14px">'
    +'</div>'
    +'<div id="picker-list" style="flex:1;overflow-y:auto;padding:8px"></div>';
  document.body.appendChild(ov);
  setTimeout(function(){var s=document.getElementById('picker-search');if(s)s.focus();},200);
}
function closePickerScreen(){
  var el=document.getElementById('picker-screen-overlay');
  if(el)el.remove();
}
function _filterPickerList(q){
  if(typeof _pickerCtx.render==='function')_pickerCtx.render(q);
}
function showCountryPickerScreen(field,title,labelId){
  _pickerCtx={
    render:function(q){
      var list=document.getElementById('picker-list');
      if(!list)return;
      var countries=Object.keys(COUNTRY_DATA).sort();
      if(q)countries=countries.filter(function(n){return n.toLowerCase().indexOf(q.toLowerCase())!==-1;});
      list.innerHTML=countries.map(function(name){
        var flag=countryFlagGlobal(name);
        return '<div class="picker-item" onclick="_selectCountry(\''+field+'\',\''+labelId+'\',\''+name+'\')">'+flag+' '+name+'</div>';
      }).join('');
    }
  };
  _openPickerScreen(title,'Buscar país...');
  _pickerCtx.render('');
}
function _selectCountry(field,labelId,name){
  var flag=countryFlagGlobal(name);
  var inp=document.getElementById(field);
  var lbl=document.getElementById(labelId);
  if(inp)inp.value=name;
  if(lbl){lbl.textContent=flag+' '+name;lbl.style.color='var(--text)';}
  if(field==='cfg-country'&&!S._langUserSet){
    var _cLang=COUNTRY_DATA[name]&&COUNTRY_DATA[name].lang||'';
    var _sup=['es','en','zh','hi','ar','pt','fr','ru','bn','id','de','ja','tr','ko','vi','it','pl','fa','sw','ur'];
    if(_cLang&&_sup.indexOf(_cLang)!==-1){S.language=_cLang;saveState();}
  }
  closePickerScreen();
}
function showPhoneCodePickerScreen(){
  var defPhone=(S.profile&&S.profile.phoneCode)||getDefaultPhoneCode()||'';
  _pickerCtx={
    render:function(q){
      var list=document.getElementById('picker-list');
      if(!list)return;
      var phoneMap={};
      Object.keys(COUNTRY_DATA).forEach(function(name){
        var phone=COUNTRY_DATA[name].phone;
        var iso=_PHONE_ISO[phone]||null;
        var flag=iso?_iso2flag(iso):'🌍';
        if(!phoneMap[phone])phoneMap[phone]={phone:phone,flag:flag,country:name};
      });
      var codes=Object.keys(phoneMap).sort(function(a,b){
        var na=parseInt(a.replace('+',''));
        var nb=parseInt(b.replace('+',''));
        return na-nb;
      });
      if(q)codes=codes.filter(function(c){
        return c.indexOf(q)!==-1||phoneMap[c].country.toLowerCase().indexOf(q.toLowerCase())!==-1;
      });
      list.innerHTML=codes.map(function(code){
        var item=phoneMap[code];
        var sel=code===defPhone;
        return '<div class="picker-item" onclick="_selectPhoneCode(\''+code+'\')" style="'+(sel?'background:rgba(0,212,170,.08)':'')+'">'
          +'<span>'+item.flag+' '+code+'</span>'
          +(sel?'<svg style="margin-left:auto;flex-shrink:0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>':'')
          +'</div>';
      }).join('');
    }
  };
  _openPickerScreen('Indicativo telefónico','Buscar código o país...');
  _pickerCtx.render('');
}
function _selectPhoneCode(code){
  var iso=_PHONE_ISO[code]||null;
  var flag=iso?_iso2flag(iso):'🌍';
  var inp=document.getElementById('cfg-phone-code');
  var lbl=document.getElementById('cfg-phone-code-lbl');
  if(inp)inp.value=code;
  if(lbl)lbl.textContent=flag+' '+code;
  updatePhoneLen(code);
  closePickerScreen();
}
function showProfessionPickerScreen(){
  var PROFESSIONS=[
    'Abogado/a','Administrador/a de empresas','Agricultor/a','Analista de datos',
    'Analista financiero/a','Antropólogo/a','Arquitecto/a','Asistente administrativo/a',
    'Asistente social','Astrólogo/a','Auditor/a','Auxiliar de enfermería',
    'Biólogo/a','Bombero/a','Carpintero/a','Chef / Cocinero/a',
    'Científico/a de datos','Cirujano/a','Cocinero/a','Comerciante',
    'Comunicador/a social','Conductor/a','Consultor/a','Contador/a / CPA',
    'Decorador/a de interiores','Dentista','Director/a de arte','Diseñador/a gráfico/a',
    'Diseñador/a industrial','Diseñador/a web','Docente / Profesor/a','Economista',
    'Editor/a','Electricista','Emprendedor/a','Enfermero/a',
    'Escritor/a','Especialista en marketing','Estadístico/a','Esteticista',
    'Farmacéutico/a','Filósofo/a','Físico/a','Fisioterapeuta',
    'Fotógrafo/a','Funcionario/a público/a','Geógrafo/a','Geólogo/a',
    'Gerente de proyectos','Historiador/a','Ilustrador/a','Ingeniero/a civil',
    'Ingeniero/a de software','Ingeniero/a eléctrico/a','Ingeniero/a industrial','Ingeniero/a mecánico/a',
    'Investigador/a','Jardinero/a','Locutor/a','Logístico/a',
    'Matemático/a','Mecánico/a automotriz','Médico/a general','Médico/a especialista',
    'Músico/a','Nutricionista','Odontólogo/a','Operario/a de fábrica',
    'Optometrista','Pedagogo/a','Periodista','Piloto',
    'Plomero/a / Fontanero/a','Policía','Productor/a audiovisual','Programador/a',
    'Psicólogo/a','Publicista','Químico/a','Radiólogo/a',
    'Recepcionista','Recursos humanos','Repartidor/a','Seguridad / Vigilante',
    'Sociólogo/a','Técnico/a en sistemas','Técnico/a en telecomunicaciones','Terapeuta',
    'Trabajador/a de construcción','Traductor/a / Intérprete','Transportista','Veterinario/a',
    'Videoconferencista','Ama/Amo de casa','Estudiante','Jubilado/a','Desempleado/a','Otro'
  ];
  _pickerCtx={
    render:function(q){
      var list=document.getElementById('picker-list');
      if(!list)return;
      var profs=PROFESSIONS;
      if(q)profs=profs.filter(function(p){return p.toLowerCase().indexOf(q.toLowerCase())!==-1;});
      var cur=(document.getElementById('cfg-profession')||{}).value||'';
      list.innerHTML=profs.map(function(p){
        var sel=p===cur;
        return '<div class="picker-item" onclick="_selectProfession(\''+p+'\')" style="'+(sel?'background:rgba(0,212,170,.08)':'')+'">'
          +'<span>'+p+'</span>'
          +(sel?'<svg style="margin-left:auto;flex-shrink:0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>':'')
          +'</div>';
      }).join('');
    }
  };
  _openPickerScreen('Profesión u oficio','Buscar profesión...');
  _pickerCtx.render('');
}
function _selectProfession(name){
  var inp=document.getElementById('cfg-profession');
  var lbl=document.getElementById('cfg-profession-lbl');
  if(inp)inp.value=name;
  if(lbl){lbl.textContent=name;lbl.style.color='var(--text)';}
  closePickerScreen();
}
function showLangPickerScreen(){
  _pickerCtx={
    render:function(q){
      var list=document.getElementById('picker-list');
      if(!list)return;
      var langs=ALL_LANGUAGES;
      if(q)langs=langs.filter(function(l){return l.label.toLowerCase().indexOf(q.toLowerCase())!==-1;});
      list.innerHTML=langs.map(function(l){
        var sel=l.id===S.language;
        return '<div class="picker-item" onclick="_selectLang(\''+l.id+'\')" style="'+(sel?'background:rgba(0,212,170,.08)':'')+'">'
          +'<span>'+l.flag+' '+l.label+'</span>'
          +(sel?'<svg style="margin-left:auto;flex-shrink:0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>':'')
          +'</div>';
      }).join('');
    }
  };
  _openPickerScreen('Idioma','Buscar idioma...');
  _pickerCtx.render('');
}
function _selectLang(id){
  S.language=id;
  S._langUserSet=true;
  saveState();
  applyLanguage();
  closePickerScreen();
  renderPage('configuracion');
  toast('✓');
}
function showCurrenciesPickerScreen(){
  var sel=(S.currencies||[]).slice();
  window._pickerCurSel=sel;
  _pickerCtx={
    render:function(q){
      var list=document.getElementById('picker-list');
      if(!list)return;
      var items=ALL_CURRENCIES;
      if(q)items=items.filter(function(c){return(c.code+' '+c.name).toLowerCase().indexOf(q.toLowerCase())!==-1;});
      list.innerHTML=items.map(function(c){
        var checked=window._pickerCurSel.indexOf(c.code)!==-1;
        var meta=getCurrencyMeta(c.code);
        var sym=meta?meta.sym:c.code;
        return '<div class="picker-item" onclick="_togglePickerCur(\''+c.code+'\')" style="'+(checked?'background:rgba(0,212,170,.08)':'')+'">'
          +'<div style="width:20px;height:20px;border-radius:5px;border:2px solid '+(checked?'var(--primary)':'var(--border)')+';background:'+(checked?'var(--primary)':'transparent')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.1s">'
            +(checked?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>':'')
          +'</div>'
          +'<div style="flex:1;min-width:0">'
            +'<div style="font-size:14px;font-weight:700">'+c.code+' <span style="color:var(--primary)">'+sym+'</span></div>'
            +'<div style="font-size:12px;color:var(--text3)">'+c.name+'</div>'
          +'</div>'
          +'</div>';
      }).join('');
    }
  };
  closePickerScreen();
  var backSvg='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  var ov=document.createElement('div');
  ov.id='picker-screen-overlay';
  ov.style.cssText='position:fixed;inset:0;z-index:310;background:var(--bg);display:flex;flex-direction:column;overflow:hidden';
  ov.innerHTML='<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:14px 16px;display:flex;align-items:center;gap:4px;flex-shrink:0">'
    +'<button onclick="closePickerScreen()" style="width:36px;height:36px;border-radius:50%;border:none;background:transparent;color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">'+backSvg+'</button>'
    +'<span style="font-size:17px;font-weight:800;flex:1">Monedas activas</span>'
    +'<span id="picker-cur-count" style="font-size:12px;color:var(--primary);font-weight:700;background:rgba(0,212,170,.12);padding:3px 10px;border-radius:50px">'+sel.length+'/2</span>'
    +'</div>'
    +'<div style="padding:10px 12px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0">'
      +'<input id="picker-search" class="form-input" placeholder="Buscar moneda..." oninput="_filterPickerList(this.value)" style="font-size:14px;padding:10px 14px">'
    +'</div>'
    +'<div id="picker-list" style="flex:1;overflow-y:auto;padding:8px"></div>'
    +'<div style="flex-shrink:0;padding:12px 16px;background:var(--surface);border-top:1px solid var(--border)">'
      +'<button onclick="_savePickerCurrencies()" style="width:100%;padding:14px;border-radius:50px;background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:white;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--font)">Guardar</button>'
    +'</div>';
  document.body.appendChild(ov);
  _pickerCtx.render('');
  setTimeout(function(){var s=document.getElementById('picker-search');if(s)s.focus();},200);
}
function _togglePickerCur(code){
  var sel=window._pickerCurSel||(window._pickerCurSel=[]);
  var idx=sel.indexOf(code);
  if(idx!==-1){
    sel.splice(idx,1);
  }else{
    if(sel.length>=2){toast('Máximo 2 monedas');return;}
    sel.push(code);
  }
  var cnt=document.getElementById('picker-cur-count');
  if(cnt)cnt.textContent=sel.length+'/2';
  var q=document.getElementById('picker-search')?document.getElementById('picker-search').value:'';
  _pickerCtx.render(q);
}
function _savePickerCurrencies(){
  S.currencies=(window._pickerCurSel||[]).slice();
  if(S.currencies.length>0)S.currency=S.currencies[0];
  saveState();
  refreshCurrencyToggle();
  closePickerScreen();
  renderPage('configuracion');
  toast('Monedas guardadas ✓');
}

function openProfilePage(){
  var overlay=document.createElement('div');
  overlay.id='profile-page-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;flex-direction:column;overflow:hidden';
  var header='<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'
    +'<button onclick="closeProfilePage()" style="width:36px;height:36px;border-radius:50%;border:none;background:transparent;color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>'
    +'<span style="font-size:17px;font-weight:800">Mi Perfil</span>'
    +'<div style="width:40px"></div>'
    +'</div>';
  var body='<div style="flex:1;overflow-y:auto;padding:16px">'+buildProfileFormHTML()+'</div>';
  var footer='<div style="flex-shrink:0;padding:12px 16px;background:var(--surface);border-top:1px solid var(--border)">'
    +'<button onclick="saveProfile()" style="width:100%;padding:14px;border-radius:50px;background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:white;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--font);letter-spacing:.3px">Guardar</button>'
    +'</div>';
  overlay.innerHTML=header+body+footer;
  document.body.appendChild(overlay);
  var initCode=(S.profile&&S.profile.phoneCode)||getDefaultPhoneCode()||'';
  if(initCode)setTimeout(function(){updatePhoneLen(initCode);},0);
}
function closeProfilePage(){
  try{var el=document.getElementById('profile-page-overlay');if(el)el.remove();}catch(e){console.error('closeProfilePage:',e);}
  renderPage(S.currentPage||'configuracion');
}
function buildProfileFormHTML(){
  var p=S.profile||{};
  var q="'";
  // Avatar
  var avatarInner=p.photo?('<img src="'+p.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">')
    :(p.name?('<span style="font-size:26px;font-weight:700;color:white">'+p.name.split(' ').map(function(w){return w[0]||'';}).join('').toUpperCase().slice(0,2)+'</span>')
    :'<span>👤</span>');
  var removeBtn=p.photo?('<button onclick="removeProfilePhoto()" style="background:none;border:none;color:var(--danger);font-size:11px;cursor:pointer;margin-top:6px;font-family:var(--font)">🗑️ Quitar foto</button>'):'';
  // Phone selector
  var phoneHtml='<div id="cfg-avatar" '+( p.photo ? 'onclick="viewProfilePhoto()"'+' style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:32px;border:3px solid var(--primary);overflow:hidden;cursor:zoom-in"' : 'style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:32px;border:3px solid var(--primary);overflow:hidden"' )+'>'+avatarInner+'</div>';
  // Phone codes from COUNTRY_DATA
  var phoneMap={};
  var flags={'Afganistán':'🇦🇫','Albania':'🇦🇱','Alemania':'🇩🇪','Andorra':'🇦🇩','Angola':'🇦🇴','Antigua y Barbuda':'🇦🇬','Arabia Saudita':'🇸🇦','Argelia':'🇩🇿','Argentina':'🇦🇷','Armenia':'🇦🇲','Australia':'🇦🇺','Austria':'🇦🇹','Azerbaiyán':'🇦🇿','Bahamas':'🇧🇸','Bangladés':'🇧🇩','Barbados':'🇧🇧','Baréin':'🇧🇭','Bélgica':'🇧🇪','Belice':'🇧🇿','Benín':'🇧🇯','Bielorrusia':'🇧🇾','Birmania':'🇲🇲','Bolivia':'🇧🇴','Bosnia y Herzegovina':'🇧🇦','Botsuana':'🇧🇼','Brasil':'🇧🇷','Brunéi':'🇧🇳','Bulgaria':'🇧🇬','Burkina Faso':'🇧🇫','Burundi':'🇧🇮','Bután':'🇧🇹','Cabo Verde':'🇨🇻','Camboya':'🇰🇭','Camerún':'🇨🇲','Canadá':'🇨🇦','Catar':'🇶🇦','Chad':'🇹🇩','Chile':'🇨🇱','Chipre':'🇨🇾','Ciudad del Vaticano':'🇻🇦','Colombia':'🇨🇴','Comoras':'🇰🇲','Corea del Sur':'🇰🇷','Costa de Marfil':'🇨🇮','Costa Rica':'🇨🇷','Croacia':'🇭🇷','Cuba':'🇨🇺','Dinamarca':'🇩🇰','Dominica':'🇩🇲','Ecuador':'🇪🇨','Egipto':'🇪🇬','El Salvador':'🇸🇻','Emiratos Árabes Unidos':'🇦🇪','Eritrea':'🇪🇷','Eslovaquia':'🇸🇰','Eslovenia':'🇸🇮','España':'🇪🇸','Estados Federados de Micronesia':'🇫🇲','Estados Unidos':'🇺🇸','Estonia':'🇪🇪','Etiopía':'🇪🇹','Filipinas':'🇵🇭','Finlandia':'🇫🇮','Fiyi':'🇫🇯','Francia':'🇫🇷','Gabón':'🇬🇦','Gambia':'🇬🇲','Georgia':'🇬🇪','Ghana':'🇬🇭','Granada':'🇬🇩','Grecia':'🇬🇷','Guatemala':'🇬🇹','Guinea':'🇬🇳','Guinea Ecuatorial':'🇬🇶','Guinea-Bisáu':'🇬🇼','Guyana':'🇬🇾','Haití':'🇭🇹','Honduras':'🇭🇳','Hungría':'🇭🇺','India':'🇮🇳','Indonesia':'🇮🇩','Irán':'🇮🇷','Irak':'🇮🇶','Irlanda':'🇮🇪','Islandia':'🇮🇸','Islas Marshall':'🇲🇭','Islas Salomón':'🇸🇧','Israel':'🇮🇱','Italia':'🇮🇹','Jamaica':'🇯🇲','Japón':'🇯🇵','Jordania':'🇯🇴','Kazajistán':'🇰🇿','Kenia':'🇰🇪','Kirguistán':'🇰🇬','Kiribati':'🇰🇮','Kosovo':'🇽🇰','Kuwait':'🇰🇼','Laos':'🇱🇦','Lesoto':'🇱🇸','Letonia':'🇱🇻','Líbano':'🇱🇧','Liberia':'🇱🇷','Libia':'🇱🇾','Liechtenstein':'🇱🇮','Lituania':'🇱🇹','Luxemburgo':'🇱🇺','Macedonia del Norte':'🇲🇰','Madagascar':'🇲🇬','Malasia':'🇲🇾','Malaui':'🇲🇼','Maldivas':'🇲🇻','Mali':'🇲🇱','Malta':'🇲🇹','Marruecos':'🇲🇦','Mauricio':'🇲🇺','Mauritania':'🇲🇷','México':'🇲🇽','Moldavia':'🇲🇩','Mónaco':'🇲🇨','Mongolia':'🇲🇳','Montenegro':'🇲🇪','Mozambique':'🇲🇿','Namibia':'🇳🇦','Nauru':'🇳🇷','Nepal':'🇳🇵','Nicaragua':'🇳🇮','Níger':'🇳🇪','Nigeria':'🇳🇬','Noruega':'🇳🇴','Nueva Zelanda':'🇳🇿','Omán':'🇴🇲','Países Bajos':'🇳🇱','Pakistán':'🇵🇰','Palaos':'🇵🇼','Autoridad Nacional Palestina':'🇵🇸','Panamá':'🇵🇦','Papúa Nueva Guinea':'🇵🇬','Paraguay':'🇵🇾','Perú':'🇵🇪','Polonia':'🇵🇱','Portugal':'🇵🇹','Reino Unido':'🇬🇧','República Centroafricana':'🇨🇫','República Checa':'🇨🇿','República Democrática del Congo':'🇨🇩','República Dominicana':'🇩🇴','República Popular China':'🇨🇳','Ruanda':'🇷🇼','Rumania':'🇷🇴','Rusia':'🇷🇺','Samoa':'🇼🇸','San Cristóbal y Nieves':'🇰🇳','San Marino':'🇸🇲','San Vicente y las Granadinas':'🇻🇨','Santa Lucía':'🇱🇨','Santo Tomé y Príncipe':'🇸🇹','Senegal':'🇸🇳','Serbia':'🇷🇸','Seychelles':'🇸🇨','Sierra Leona':'🇸🇱','Singapur':'🇸🇬','Siria':'🇸🇾','Somalia':'🇸🇴','Sri Lanka':'🇱🇰','Sudáfrica':'🇿🇦','Sudán':'🇸🇩','Sudán del Sur':'🇸🇸','Suecia':'🇸🇪','Suiza':'🇨🇭','Surinam':'🇸🇷','Tailandia':'🇹🇭','Tanzania':'🇹🇿','Tayikistán':'🇹🇯','Timor Oriental':'🇹🇱','Togo':'🇹🇬','Tonga':'🇹🇴','Trinidad y Tobago':'🇹🇹','Túnez':'🇹🇳','Turkmenistán':'🇹🇲','Tuvalu':'🇹🇻','Ucrania':'🇺🇦','Uganda':'🇺🇬','Uruguay':'🇺🇾','Uzbekistán':'🇺🇿','Vanuatu':'🇻🇺','Venezuela':'🇻🇪','Vietnam':'🇻🇳','Wallis y Futuna':'🇼🇫','Yemen':'🇾🇪','Yibuti':'🇩🇯','Zambia':'🇿🇲','Zimbabue':'🇿🇼'};
  Object.keys(COUNTRY_DATA).forEach(function(name){
    var phone=COUNTRY_DATA[name].phone;
    if(!phoneMap[phone])phoneMap[phone]=(flags[name]||'🌍')+' '+phone;
  });
  var defPhone=p.phoneCode||getDefaultPhoneCode()||'';
  var defPhoneIso=defPhone?(_PHONE_ISO[defPhone]||null):null;
  var defPhoneFlag=defPhoneIso?_iso2flag(defPhoneIso):'🌍';
  var defPhoneDisplay=defPhone?(defPhoneFlag+' '+defPhone):'Indicativo';
  var emailVal=p.email||(window._currentUser&&window._currentUser.email?window._currentUser.email:'');
  var phoneOpts='<option value="">Indicativo</option>';
  Object.keys(phoneMap).sort().forEach(function(code){
    phoneOpts+='<option value="'+code+'" '+(defPhone===code?'selected':'')+'>'+phoneMap[code]+'</option>';
  });
  // Flag helpers
  function iso2flag(iso){return iso?String.fromCodePoint(iso.charCodeAt(0)+127397)+String.fromCodePoint(iso.charCodeAt(1)+127397):'🌐';}
  var phoneToISO={'+54':'AR','+591':'BO','+55':'BR','+56':'CL','+57':'CO','+506':'CR','+53':'CU','+1809':'DO','+593':'EC','+503':'SV','+502':'GT','+509':'HT','+504':'HN','+52':'MX','+505':'NI','+507':'PA','+595':'PY','+51':'PE','+598':'UY','+58':'VE','+34':'ES','+33':'FR','+49':'DE','+39':'IT','+351':'PT','+44':'GB','+1':'US','+81':'JP','+82':'KR','+86':'CN','+91':'IN','+7':'RU','+380':'UA','+48':'PL','+31':'NL','+32':'BE','+41':'CH','+43':'AT','+46':'SE','+47':'NO','+45':'DK','+358':'FI','+30':'GR','+36':'HU','+420':'CZ','+40':'RO','+359':'BG','+372':'EE','+371':'LV','+370':'LT','+27':'ZA','+234':'NG','+20':'EG','+254':'KE','+255':'TZ','+256':'UG','+251':'ET','+1242':'BS','+1268':'AG','+1246':'BB','+60':'MY','+65':'SG','+66':'TH','+62':'ID','+63':'PH','+84':'VN','+95':'MM','+92':'PK','+880':'BD','+94':'LK','+98':'IR','+90':'TR','+972':'IL','+966':'SA','+971':'AE','+212':'MA','+213':'DZ','+216':'TN','+218':'LY','+61':'AU','+64':'NZ','+93':'AF','+355':'AL','+376':'AD','+244':'AO','+374':'AM','+994':'AZ','+973':'BH','+375':'BY','+501':'BZ','+229':'BJ','+975':'BT','+267':'BW','+387':'BA','+226':'BF','+257':'BI','+238':'CV','+855':'KH','+237':'CM','+236':'CF','+235':'TD','+269':'KM','+243':'CD','+242':'CG','+240':'GQ','+291':'ER','+268':'SZ','+679':'FJ','+241':'GA','+220':'GM','+995':'GE','+233':'GH','+224':'GN','+245':'GW','+592':'GY','+354':'IS','+964':'IQ','+353':'IE','+225':'CI','+1876':'JM','+962':'JO','+7':'KZ','+686':'KI','+965':'KW','+996':'KG','+856':'LA','+961':'LB','+266':'LS','+231':'LR','+423':'LI','+352':'LU','+261':'MG','+265':'MW','+960':'MV','+223':'ML','+356':'MT','+692':'MH','+222':'MR','+230':'MU','+691':'FM','+373':'MD','+377':'MC','+976':'MN','+382':'ME','+258':'MZ','+264':'NA','+674':'NR','+977':'NP','+227':'NE','+389':'MK','+968':'OM','+680':'PW','+970':'PS','+675':'PG','+974':'QA','+250':'RW','+1869':'KN','+1758':'LC','+1784':'VC','+685':'WS','+378':'SM','+239':'ST','+221':'SN','+381':'RS','+232':'SL','+421':'SK','+386':'SI','+677':'SB','+252':'SO','+211':'SS','+249':'SD','+597':'SR','+886':'TW','+992':'TJ','+228':'TG','+676':'TO','+1868':'TT','+993':'TM','+998':'UZ','+678':'VU','+967':'YE','+260':'ZM','+263':'ZW'};
  function countryFlag(name){var d=COUNTRY_DATA[name];if(!d)return'🌐';var iso=phoneToISO[d.phone]||null;return iso?iso2flag(iso):'🌐';}
  // Country options with flags
  var countryOpts='';
  Object.keys(COUNTRY_DATA).forEach(function(name){
    var flag=countryFlag(name);
    countryOpts+='<div class="ppick-item" onclick="selectPPickWithFlag(\'cfg-country\',\'cpick\',\''+name+'\',' +'\'' +flag+'\'' + ')" data-val="'+name+'">'+flag+' '+name+'</div>';
  });
  var residOpts='';
  Object.keys(COUNTRY_DATA).forEach(function(name){
    var flag=countryFlag(name);
    residOpts+='<div class="ppick-item" onclick="selectPPickWithFlag(\'cfg-residence\',\'rpick\',\''+name+'\',' +'\'' +flag+'\'' + ')" data-val="'+name+'">'+flag+' '+name+'</div>';
  });
  // Custom picker items for occupation/marital/goal
  var occupations=['Empleado','Independiente / Freelancer','Empresario','Estudiante','Ama/Amo de casa','Jubilado','Desempleado','Otro'];
  var occupOpts=occupations.map(function(o){return '<div class="ppick-item" onclick="selectPPick(\'cfg-occupation\',\'opick\',\''+o+'\' )" data-val="'+o+'" style="'+(p.occupation===o?'background:rgba(0,212,170,.1)':'')+'">'+o+'</div>';}).join('');
  var maritalList=['Soltero/a','Casado/a','Unión libre','Divorciado/a','Viudo/a'];
  var maritalOpts=maritalList.map(function(m){return '<div class="ppick-item" onclick="selectPPick(\'cfg-marital\',\'mpick\',\''+m+'\' )" data-val="'+m+'" style="'+(p.marital===m?'background:rgba(0,212,170,.1)':'')+'">'+m+'</div>';}).join('');
  var goalList=['Ahorrar para emergencias','Control de gastos','Pagar deudas','Comprar vivienda','Viajar','Independencia financiera','Emprender','Jubilación','Educación','Otro'];
  var goalOpts=goalList.map(function(g){return '<div class="ppick-item" onclick="selectPPick(\'cfg-goal\',\'gpick\',\''+g+'\' )" data-val="'+g+'" style="'+(p.financialGoal===g?'background:rgba(0,212,170,.1)':'')+'">'+g+'</div>';}).join('');

  var html=''
    +'<div class="form-group"><label class="form-label">Nombre y apellido <span style="color:var(--danger)">*</span></label>'
      +'<input class="form-input" type="text" id="cfg-name" value="'+(p.name||'')+'" placeholder="Ej: Jorge Quintero"></div>'
    +'<div class="form-group"><label class="form-label">Fecha de nacimiento</label>'
      +'<input class="form-input" type="date" id="cfg-birthdate" value="'+(p.birthdate||'')+'" max="'+new Date().toISOString().slice(0,10)+'"></div>'
    +'<div class="form-group"><label class="form-label">Email</label>'
      +'<input class="form-input" type="email" id="cfg-email" value="'+emailVal+'" readonly style="opacity:.65;cursor:not-allowed"></div>'
    +'<div class="form-group"><label class="form-label">Teléfono</label>'
      +'<div style="display:flex;gap:6px">'
        +'<div class="bs-trigger" onclick="showPhoneCodePickerScreen()" style="width:130px;flex-shrink:0;padding:10px 12px">'
          +'<span id="cfg-phone-code-lbl" style="font-size:13px;color:'+(defPhone?'var(--text)':'var(--text3)')+'">'+defPhoneDisplay+'</span>'
          +'<span style="color:var(--text3);font-size:18px">›</span>'
        +'</div>'
        +'<input type="hidden" id="cfg-phone-code" value="'+(defPhone||'')+'">'+'<input class="form-input" type="tel" id="cfg-phone" value="'+(p.phone||'')+'" placeholder="Número" style="flex:1;font-size:15px" maxlength="15">'
      +'</div></div>'
    +'<div class="form-group"><label class="form-label">País de origen</label>'
      +'<div class="bs-trigger" onclick="showCountryPickerScreen(\'cfg-country\',\'País de origen\',\'cfg-country-lbl\')" id="cpick-trigger">'
        +'<span style="font-size:14px;color:'+(p.country?'var(--text)':'var(--text3)')+'" id="cfg-country-lbl">'+(p.country?(countryFlagGlobal(p.country)+' '+p.country):'Seleccionar país de origen')+'</span>'
        +'<span style="color:var(--text3);font-size:18px">›</span>'
      +'</div>'
      +'<input type="hidden" id="cfg-country" value="'+(p.country||'')+'"></div>'
    +'<div class="form-group"><label class="form-label">País de residencia <span style="font-size:10px;color:var(--primary);font-weight:400">🏠 moneda principal</span></label>'
      +'<div class="bs-trigger" onclick="showCountryPickerScreen(\'cfg-residence\',\'País de residencia\',\'cfg-residence-lbl\')" id="rpick-trigger">'
        +'<span style="font-size:14px;color:'+(p.residence?'var(--text)':'var(--text3)')+'" id="cfg-residence-lbl">'+(p.residence?(countryFlagGlobal(p.residence)+' '+p.residence):'Seleccionar país de residencia')+'</span>'
        +'<span style="color:var(--text3);font-size:18px">›</span>'
      +'</div>'
      +'<input type="hidden" id="cfg-residence" value="'+(p.residence||'')+'"></div>'
    +'<div class="form-group"><label class="form-label">Ocupación</label>'
      +'<div class="bs-trigger" onclick="showBS_simple(\'cfg-occupation\',\'-lbl\',\'Ocupación\',[\'Empleado\',\'Independiente / Freelancer\',\'Empresario\',\'Estudiante\',\'Ama/Amo de casa\',\'Jubilado\',\'Desempleado\',\'Otro\'],\'Seleccionar ocupación\',true)">'
        +'<span style="font-size:14px;color:'+(p.occupation?'var(--text)':'var(--text3)')+'" id="cfg-occupation-lbl">'+(p.occupation||'Seleccionar ocupación')+'</span>'
        +'<span style="color:var(--text3);font-size:18px">›</span>'
      +'</div>'
      +'<input type="hidden" id="cfg-occupation" value="'+(p.occupation||'')+'"></div>'
    +'<div class="form-group"><label class="form-label">Profesión</label>'
      +'<div class="bs-trigger" onclick="showProfessionPickerScreen()">'
        +'<span id="cfg-profession-lbl" style="font-size:14px;color:'+(p.profession?'var(--text)':'var(--text3)')+'">'+(p.profession||'Seleccionar profesión u oficio')+'</span>'
        +'<span style="color:var(--text3);font-size:18px">›</span>'
      +'</div>'
      +'<input type="hidden" id="cfg-profession" value="'+(p.profession||'')+'"></div>'
    +'<div class="form-group"><label class="form-label">Estado civil</label>'
      +'<div class="bs-trigger" onclick="showBS_simple(\'cfg-marital\',\'-lbl\',\'Estado civil\',[\'Soltero/a\',\'Casado/a\',\'Unión libre\',\'Divorciado/a\',\'Viudo/a\'],\'Seleccionar estado civil\',true)">'
        +'<span style="font-size:14px;color:'+(p.marital?'var(--text)':'var(--text3)')+'" id="cfg-marital-lbl">'+(p.marital||'Seleccionar estado civil')+'</span>'
        +'<span style="color:var(--text3);font-size:18px">›</span>'
      +'</div>'
      +'<input type="hidden" id="cfg-marital" value="'+(p.marital||'')+'"></div>'
    +'<div class="form-group"><label class="form-label">Objetivo financiero principal <span style="color:var(--danger)">*</span></label>'
      +'<div class="bs-trigger" onclick="showBS_simple(\'cfg-goal\',\'-lbl\',\'Objetivo financiero\',[\'Ahorrar para emergencias\',\'Control de gastos\',\'Pagar deudas\',\'Comprar vivienda\',\'Viajar\',\'Independencia financiera\',\'Emprender\',\'Jubilación\',\'Educación\',\'Otro\'],\'Seleccionar objetivo\')">'
        +'<span style="font-size:14px;color:'+(p.financialGoal?'var(--text)':'var(--text3)')+'" id="cfg-goal-lbl">'+(p.financialGoal||'Seleccionar objetivo')+'</span>'
        +'<span style="color:var(--text3);font-size:18px">›</span>'
      +'</div>'
      +'<input type="hidden" id="cfg-goal" value="'+(p.financialGoal||'')+'"></div>';
  return html;
}

const COUNTRY_DATA={
  'Afganistán':{cur:'AFN',phone:'+93',lang:'fa'},
  'Albania':{cur:'ALL',phone:'+355',lang:'sq'},
  'Alemania':{cur:'EUR',phone:'+49',lang:'de'},
  'Andorra':{cur:'EUR',phone:'+376',lang:'ca'},
  'Angola':{cur:'AOA',phone:'+244',lang:'pt'},
  'Antigua y Barbuda':{cur:'XCD',phone:'+1268',lang:'en'},
  'Arabia Saudita':{cur:'SAR',phone:'+966',lang:'ar'},
  'Argelia':{cur:'DZD',phone:'+213',lang:'ar'},
  'Argentina':{cur:'ARS',phone:'+54',lang:'es'},
  'Armenia':{cur:'AMD',phone:'+374',lang:'hy'},
  'Australia':{cur:'AUD',phone:'+61',lang:'en'},
  'Austria':{cur:'EUR',phone:'+43',lang:'de'},
  'Azerbaiyán':{cur:'AZN',phone:'+994',lang:'az'},
  'Bahamas':{cur:'BSD',phone:'+1242',lang:'en'},
  'Bangladés':{cur:'BDT',phone:'+880',lang:'bn'},
  'Barbados':{cur:'BBD',phone:'+1246',lang:'en'},
  'Baréin':{cur:'BHD',phone:'+973',lang:'ar'},
  'Bélgica':{cur:'EUR',phone:'+32',lang:'fr'},
  'Belice':{cur:'BZD',phone:'+501',lang:'en'},
  'Benín':{cur:'XOF',phone:'+229',lang:'fr'},
  'Bielorrusia':{cur:'BYN',phone:'+375',lang:'be'},
  'Birmania':{cur:'MMK',phone:'+95',lang:'my'},
  'Bolivia':{cur:'BOB',phone:'+591',lang:'es'},
  'Bosnia y Herzegovina':{cur:'BAM',phone:'+387',lang:'bs'},
  'Botsuana':{cur:'BWP',phone:'+267',lang:'en'},
  'Brasil':{cur:'BRL',phone:'+55',lang:'pt'},
  'Brunéi':{cur:'BND',phone:'+673',lang:'ms'},
  'Bulgaria':{cur:'BGN',phone:'+359',lang:'bg'},
  'Burkina Faso':{cur:'XOF',phone:'+226',lang:'fr'},
  'Burundi':{cur:'BIF',phone:'+257',lang:'fr'},
  'Bután':{cur:'BTN',phone:'+975',lang:'dz'},
  'Cabo Verde':{cur:'CVE',phone:'+238',lang:'pt'},
  'Camboya':{cur:'KHR',phone:'+855',lang:'km'},
  'Camerún':{cur:'XAF',phone:'+237',lang:'fr'},
  'Canadá':{cur:'CAD',phone:'+1',lang:'en'},
  'Catar':{cur:'QAR',phone:'+974',lang:'ar'},
  'Chad':{cur:'XAF',phone:'+235',lang:'fr'},
  'Chile':{cur:'CLP',phone:'+56',lang:'es'},
  'Chipre':{cur:'EUR',phone:'+357',lang:'el'},
  'Ciudad del Vaticano':{cur:'EUR',phone:'+379',lang:'it'},
  'Colombia':{cur:'COP',phone:'+57',lang:'es'},
  'Comoras':{cur:'KMF',phone:'+269',lang:'ar'},
  'Corea del Sur':{cur:'KRW',phone:'+82',lang:'ko'},
  'Costa de Marfil':{cur:'XOF',phone:'+225',lang:'fr'},
  'Costa Rica':{cur:'CRC',phone:'+506',lang:'es'},
  'Croacia':{cur:'EUR',phone:'+385',lang:'hr'},
  'Cuba':{cur:'CUP',phone:'+53',lang:'es'},
  'Dinamarca':{cur:'DKK',phone:'+45',lang:'da'},
  'Dominica':{cur:'XCD',phone:'+1767',lang:'en'},
  'Ecuador':{cur:'USD',phone:'+593',lang:'es'},
  'Egipto':{cur:'EGP',phone:'+20',lang:'ar'},
  'El Salvador':{cur:'USD',phone:'+503',lang:'es'},
  'Emiratos Árabes Unidos':{cur:'AED',phone:'+971',lang:'ar'},
  'Eritrea':{cur:'ERN',phone:'+291',lang:'ti'},
  'Eslovaquia':{cur:'EUR',phone:'+421',lang:'sk'},
  'Eslovenia':{cur:'EUR',phone:'+386',lang:'sl'},
  'España':{cur:'EUR',phone:'+34',lang:'es'},
  'Estados Federados de Micronesia':{cur:'USD',phone:'+691',lang:'en'},
  'Estados Unidos':{cur:'USD',phone:'+1',lang:'en'},
  'Estonia':{cur:'EUR',phone:'+372',lang:'et'},
  'Etiopía':{cur:'ETB',phone:'+251',lang:'am'},
  'Filipinas':{cur:'PHP',phone:'+63',lang:'tl'},
  'Finlandia':{cur:'EUR',phone:'+358',lang:'fi'},
  'Fiyi':{cur:'FJD',phone:'+679',lang:'en'},
  'Francia':{cur:'EUR',phone:'+33',lang:'fr'},
  'Gabón':{cur:'XAF',phone:'+241',lang:'fr'},
  'Gambia':{cur:'GMD',phone:'+220',lang:'en'},
  'Georgia':{cur:'GEL',phone:'+995',lang:'ka'},
  'Ghana':{cur:'GHS',phone:'+233',lang:'en'},
  'Granada':{cur:'XCD',phone:'+1473',lang:'en'},
  'Grecia':{cur:'EUR',phone:'+30',lang:'el'},
  'Guatemala':{cur:'GTQ',phone:'+502',lang:'es'},
  'Guinea':{cur:'GNF',phone:'+224',lang:'fr'},
  'Guinea Ecuatorial':{cur:'XAF',phone:'+240',lang:'es'},
  'Guinea-Bisáu':{cur:'XOF',phone:'+245',lang:'pt'},
  'Guyana':{cur:'GYD',phone:'+592',lang:'en'},
  'Haití':{cur:'HTG',phone:'+509',lang:'fr'},
  'Honduras':{cur:'HNL',phone:'+504',lang:'es'},
  'Hungría':{cur:'HUF',phone:'+36',lang:'hu'},
  'India':{cur:'INR',phone:'+91',lang:'hi'},
  'Indonesia':{cur:'IDR',phone:'+62',lang:'id'},
  'Irán':{cur:'IRR',phone:'+98',lang:'fa'},
  'Irak':{cur:'IQD',phone:'+964',lang:'ar'},
  'Irlanda':{cur:'EUR',phone:'+353',lang:'en'},
  'Islandia':{cur:'ISK',phone:'+354',lang:'is'},
  'Islas Marshall':{cur:'USD',phone:'+692',lang:'en'},
  'Islas Salomón':{cur:'SBD',phone:'+677',lang:'en'},
  'Israel':{cur:'ILS',phone:'+972',lang:'he'},
  'Italia':{cur:'EUR',phone:'+39',lang:'it'},
  'Jamaica':{cur:'JMD',phone:'+1876',lang:'en'},
  'Japón':{cur:'JPY',phone:'+81',lang:'ja'},
  'Jordania':{cur:'JOD',phone:'+962',lang:'ar'},
  'Kazajistán':{cur:'KZT',phone:'+7',lang:'kk'},
  'Kenia':{cur:'KES',phone:'+254',lang:'sw'},
  'Kirguistán':{cur:'KGS',phone:'+996',lang:'ky'},
  'Kiribati':{cur:'AUD',phone:'+686',lang:'en'},
  'Kosovo':{cur:'EUR',phone:'+383',lang:'sq'},
  'Kuwait':{cur:'KWD',phone:'+965',lang:'ar'},
  'Laos':{cur:'LAK',phone:'+856',lang:'lo'},
  'Lesoto':{cur:'LSL',phone:'+266',lang:'st'},
  'Letonia':{cur:'EUR',phone:'+371',lang:'lv'},
  'Líbano':{cur:'LBP',phone:'+961',lang:'ar'},
  'Liberia':{cur:'LRD',phone:'+231',lang:'en'},
  'Libia':{cur:'LYD',phone:'+218',lang:'ar'},
  'Liechtenstein':{cur:'CHF',phone:'+423',lang:'de'},
  'Lituania':{cur:'EUR',phone:'+370',lang:'lt'},
  'Luxemburgo':{cur:'EUR',phone:'+352',lang:'fr'},
  'Macedonia del Norte':{cur:'MKD',phone:'+389',lang:'mk'},
  'Madagascar':{cur:'MGA',phone:'+261',lang:'mg'},
  'Malasia':{cur:'MYR',phone:'+60',lang:'ms'},
  'Malaui':{cur:'MWK',phone:'+265',lang:'en'},
  'Maldivas':{cur:'MVR',phone:'+960',lang:'dv'},
  'Mali':{cur:'XOF',phone:'+223',lang:'fr'},
  'Malta':{cur:'EUR',phone:'+356',lang:'mt'},
  'Marruecos':{cur:'MAD',phone:'+212',lang:'ar'},
  'Mauricio':{cur:'MUR',phone:'+230',lang:'en'},
  'Mauritania':{cur:'MRU',phone:'+222',lang:'ar'},
  'México':{cur:'MXN',phone:'+52',lang:'es'},
  'Moldavia':{cur:'MDL',phone:'+373',lang:'ro'},
  'Mónaco':{cur:'EUR',phone:'+377',lang:'fr'},
  'Mongolia':{cur:'MNT',phone:'+976',lang:'mn'},
  'Montenegro':{cur:'EUR',phone:'+382',lang:'sr'},
  'Mozambique':{cur:'MZN',phone:'+258',lang:'pt'},
  'Namibia':{cur:'NAD',phone:'+264',lang:'en'},
  'Nauru':{cur:'AUD',phone:'+674',lang:'en'},
  'Nepal':{cur:'NPR',phone:'+977',lang:'ne'},
  'Nicaragua':{cur:'NIO',phone:'+505',lang:'es'},
  'Níger':{cur:'XOF',phone:'+227',lang:'fr'},
  'Nigeria':{cur:'NGN',phone:'+234',lang:'en'},
  'Noruega':{cur:'NOK',phone:'+47',lang:'no'},
  'Nueva Zelanda':{cur:'NZD',phone:'+64',lang:'en'},
  'Omán':{cur:'OMR',phone:'+968',lang:'ar'},
  'Países Bajos':{cur:'EUR',phone:'+31',lang:'nl'},
  'Pakistán':{cur:'PKR',phone:'+92',lang:'ur'},
  'Palaos':{cur:'USD',phone:'+680',lang:'en'},
  'Autoridad Nacional Palestina':{cur:'ILS',phone:'+970',lang:'ar'},
  'Panamá':{cur:'PAB',phone:'+507',lang:'es'},
  'Papúa Nueva Guinea':{cur:'PGK',phone:'+675',lang:'en'},
  'Paraguay':{cur:'PYG',phone:'+595',lang:'es'},
  'Perú':{cur:'PEN',phone:'+51',lang:'es'},
  'Polonia':{cur:'PLN',phone:'+48',lang:'pl'},
  'Portugal':{cur:'EUR',phone:'+351',lang:'pt'},
  'Reino Unido':{cur:'GBP',phone:'+44',lang:'en'},
  'República Centroafricana':{cur:'XAF',phone:'+236',lang:'fr'},
  'República Checa':{cur:'CZK',phone:'+420',lang:'cs'},
  'República Democrática del Congo':{cur:'CDF',phone:'+243',lang:'fr'},
  'República Dominicana':{cur:'DOP',phone:'+1809',lang:'es'},
  'República Popular China':{cur:'CNY',phone:'+86',lang:'zh'},
  'Ruanda':{cur:'RWF',phone:'+250',lang:'rw'},
  'Rumania':{cur:'RON',phone:'+40',lang:'ro'},
  'Rusia':{cur:'RUB',phone:'+7',lang:'ru'},
  'Samoa':{cur:'WST',phone:'+685',lang:'sm'},
  'San Cristóbal y Nieves':{cur:'XCD',phone:'+1869',lang:'en'},
  'San Marino':{cur:'EUR',phone:'+378',lang:'it'},
  'San Vicente y las Granadinas':{cur:'XCD',phone:'+1784',lang:'en'},
  'Santa Lucía':{cur:'XCD',phone:'+1758',lang:'en'},
  'Santo Tomé y Príncipe':{cur:'STN',phone:'+239',lang:'pt'},
  'Senegal':{cur:'XOF',phone:'+221',lang:'fr'},
  'Serbia':{cur:'RSD',phone:'+381',lang:'sr'},
  'Seychelles':{cur:'SCR',phone:'+248',lang:'en'},
  'Sierra Leona':{cur:'SLE',phone:'+232',lang:'en'},
  'Singapur':{cur:'SGD',phone:'+65',lang:'en'},
  'Siria':{cur:'SYP',phone:'+963',lang:'ar'},
  'Somalia':{cur:'SOS',phone:'+252',lang:'so'},
  'Sri Lanka':{cur:'LKR',phone:'+94',lang:'si'},
  'Sudáfrica':{cur:'ZAR',phone:'+27',lang:'en'},
  'Sudán':{cur:'SDG',phone:'+249',lang:'ar'},
  'Sudán del Sur':{cur:'SSP',phone:'+211',lang:'en'},
  'Suecia':{cur:'SEK',phone:'+46',lang:'sv'},
  'Suiza':{cur:'CHF',phone:'+41',lang:'de'},
  'Surinam':{cur:'SRD',phone:'+597',lang:'nl'},
  'Tailandia':{cur:'THB',phone:'+66',lang:'th'},
  'Tanzania':{cur:'TZS',phone:'+255',lang:'sw'},
  'Tayikistán':{cur:'TJS',phone:'+992',lang:'tg'},
  'Timor Oriental':{cur:'USD',phone:'+670',lang:'pt'},
  'Togo':{cur:'XOF',phone:'+228',lang:'fr'},
  'Tonga':{cur:'TOP',phone:'+676',lang:'to'},
  'Trinidad y Tobago':{cur:'TTD',phone:'+1868',lang:'en'},
  'Túnez':{cur:'TND',phone:'+216',lang:'ar'},
  'Turkmenistán':{cur:'TMT',phone:'+993',lang:'tk'},
  'Tuvalu':{cur:'AUD',phone:'+688',lang:'en'},
  'Ucrania':{cur:'UAH',phone:'+380',lang:'uk'},
  'Uganda':{cur:'UGX',phone:'+256',lang:'en'},
  'Uruguay':{cur:'UYU',phone:'+598',lang:'es'},
  'Uzbekistán':{cur:'UZS',phone:'+998',lang:'uz'},
  'Vanuatu':{cur:'VUV',phone:'+678',lang:'bi'},
  'Venezuela':{cur:'VES',phone:'+58',lang:'es'},
  'Vietnam':{cur:'VND',phone:'+84',lang:'vi'},
  'Wallis y Futuna':{cur:'XPF',phone:'+681',lang:'fr'},
  'Yemen':{cur:'YER',phone:'+967',lang:'ar'},
  'Yibuti':{cur:'DJF',phone:'+253',lang:'fr'},
  'Zambia':{cur:'ZMW',phone:'+260',lang:'en'},
  'Zimbabue':{cur:'ZWL',phone:'+263',lang:'en'}
};



function saveProfile(){
  if(!S.profile)S.profile={};
  const g=(id)=>document.getElementById(id)?.value||'';
  // Validación de campos obligatorios
  const reqName=g('cfg-name').trim();
  const reqPhone=g('cfg-phone').trim();
  const reqPhoneCode=g('cfg-phone-code').trim();
  const reqCountry=g('cfg-country').trim();
  const reqResidence=g('cfg-residence').trim();
  const reqGoal=g('cfg-goal').trim();
  const errors=[];
  if(!reqName)errors.push('Nombre y apellido');
  if(!reqPhoneCode||!reqPhone)errors.push('Teléfono');
  if(!reqCountry)errors.push('País de origen');
  if(!reqResidence)errors.push('País de residencia');
  if(!reqGoal)errors.push('Objetivo financiero');
  if(errors.length>0){
    toast('⚠️ Completa: '+errors.join(', '));
    return;
  }
  S.profile.name=reqName;S.profile.email=g('cfg-email').trim();
  console.log('Perfil guardado:', S.profile.name);
  S.profile.birthdate=g('cfg-birthdate');
  S.profile.phone=g('cfg-phone');S.profile.phoneCode=g('cfg-phone-code');
  S.profile.country=g('cfg-country');
  S.profile.residence=g('cfg-residence');
  S.profile.occupation=g('cfg-occupation');S.profile.marital=g('cfg-marital');
  S.profile.marital=g('cfg-marital');S.profile.financialGoal=g('cfg-goal');
  S.profile.profession=g('cfg-profession');
  // Auto-set currencies based on countries
  try{
    var countryCurrency = COUNTRY_DATA ? Object.fromEntries(Object.entries(COUNTRY_DATA).map(function(e){return[e[0],e[1].cur];})) : {};
    var originCur = countryCurrency[S.profile.country] || '';
    var residenceCur = countryCurrency[S.profile.residence] || '';
    var newCurs = [];
    if(residenceCur && Object.keys(CURRENCY_META).includes(residenceCur)) newCurs.push(residenceCur);
    if(originCur && originCur !== residenceCur && Object.keys(CURRENCY_META).includes(originCur)) newCurs.push(originCur);
    if(newCurs.length > 0){
      S.currencies = newCurs.slice(0,2);
      S.currency = newCurs[0];
      refreshCurrencyToggle();
    }
  }catch(e){console.error('saveProfile currencies:',e);}
  saveState();
  try{updateDrawerProfile();}catch(e){console.error('saveProfile drawer:',e);}
  toast('Perfil guardado ✓');
  closeProfilePage();
}

function showPhotoOptions(){
  var q="'";
  var sheet=document.createElement('div');
  sheet.id='photo-options-sheet';
  sheet.style.cssText='position:fixed;inset:0;z-index:300;display:flex;flex-direction:column;justify-content:flex-end';
  var xBtn='<button onclick="closePhotoSheet()" style="width:32px;height:32px;border-radius:50%;background:var(--surface2);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);flex-shrink:0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
  var camSvg='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>';
  var galSvg='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
  sheet.innerHTML='<div onclick="closePhotoSheet()" style="flex:1;background:rgba(0,0,0,.5)"></div>'
    +'<div style="background:var(--surface);border-radius:20px 20px 0 0;padding:0 0 32px">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px 12px">'
        +'<div><div style="font-size:15px;font-weight:700">Foto de perfil</div>'
        +'<div style="font-size:12px;color:var(--text2);margin-top:2px">Elige cómo agregar tu foto</div></div>'
        +xBtn
      +'</div>'
      +'<div style="height:1px;background:var(--border);margin:0 20px 20px"></div>'
      +'<div style="display:flex;gap:12px;padding:0 20px">'
        +'<button onclick="closePhotoSheet();document.getElementById('+q+'profile-cam-input'+q+').click()" style="flex:1;padding:14px 8px;border-radius:50px;border:1.5px solid var(--primary);background:rgba(0,212,170,.08);color:var(--primary);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font);display:flex;align-items:center;justify-content:center;gap:8px">'+camSvg+' Cámara</button>'
        +'<button onclick="closePhotoSheet();document.getElementById('+q+'profile-gal-input'+q+').click()" style="flex:1;padding:14px 8px;border-radius:50px;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font);display:flex;align-items:center;justify-content:center;gap:8px">'+galSvg+' Galería</button>'
      +'</div>'
    +'</div>';
  document.body.appendChild(sheet);
}
function closePhotoSheet(){
  var el=document.getElementById('photo-options-sheet');
  if(el)el.remove();
}

function viewProfilePhoto(){
  if(!S.profile||!S.profile.photo)return;
  var overlay=document.createElement('div');
  overlay.id='photo-viewer-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center';
  overlay.onclick=function(e){if(e.target===overlay)closePhotoViewer();};
  overlay.innerHTML='<button onclick="closePhotoViewer()" style="position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.15);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
    +'<img src="'+S.profile.photo+'" style="max-width:90vw;max-height:90vh;border-radius:12px;object-fit:contain;box-shadow:0 8px 40px rgba(0,0,0,.6)">';
  document.body.appendChild(overlay);
}
function closePhotoViewer(){
  var el=document.getElementById('photo-viewer-overlay');
  if(el)el.remove();
}
function removeProfilePhoto(){
  confirmDialog('🗑️','¿Eliminar foto de perfil?','Esta acción no se puede deshacer.',function(){
    if(!S.profile)S.profile={};
    S.profile.photo='';
    saveState();
    updateDrawerProfile();
    closeProfilePage();
    openProfilePage();
  });
}function handleProfilePhoto(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    if(!S.profile)S.profile={};
    S.profile.photo=ev.target.result;
    saveState();updateDrawerProfile();renderPage(S.currentPage||'configuracion');
  };
  reader.readAsDataURL(file);
}function saveLanguage(v){
  S.language=v;
  if(v)S._langUserSet=true;
  saveState();
  applyLanguage();
  renderPage(S.currentPage);
  renderPage('configuracion');
  toast('✓');
}
function applyLanguage(){
  // Update drawer group labels
  const grps={
    'dgl-principal':'grpMain','dgl-midinero':'grpMoney',
    'dgl-planificacion':'grpPlan','dgl-reportes':'grpReports',
    'dgl-herramientas':'grpTools','dgl-configuracion':'grpConfig'
  };
  Object.entries(grps).forEach(([id,key])=>{
    const el=document.getElementById(id);
    if(el)el.textContent=t(key)||el.textContent;
  });
  // Update drawer menu items
  const pages={
    'dmi-dashboard':'dashboard','dmi-movimientos':'movements','dmi-cuentas':'accounts',
    'dmi-presupuestos':'budgets','dmi-metas':'goals','dmi-pagos':'payments',
    'dmi-deudas':'debts','dmi-analisis':'analysis',
    'dmi-configuracion':'settings','dmi-herramientas':'aiAssistant',
    'dmi-calculadora':'loanCalc','dmi-simulador':'savingsSim'
  };
  const icons={
    'dmi-dashboard':'🏠','dmi-movimientos':'📋','dmi-cuentas':'💳','dmi-presupuestos':'📊',
    'dmi-metas':'🎯','dmi-pagos':'🔔','dmi-deudas':'💸','dmi-analisis':'📈',
    'dmi-configuracion':'⚙️','dmi-herramientas':'🤖',
    'dmi-calculadora':'📐','dmi-simulador':'💹'
  };
  Object.entries(pages).forEach(([id,key])=>{
    const el=document.getElementById(id);
    if(el){const span=el.querySelector('span');if(span)span.textContent=t(key)||span.textContent;}
  });
  // Re-render all pages that are currently visible
  ['dashboard','movimientos','cuentas','presupuestos','metas','pagos','deudas','analisis','categorias'].forEach(pg=>{
    const el=document.getElementById('page-'+pg);
    if(el&&el.classList.contains('active'))renderPage(pg);
  });
}
function saveWeekStart(v){S.weekStart=v;saveState();renderPage('configuracion');}
function toggleCurrency(c,checked){
  if(!S.currencies)S.currencies=[];
  // Get residence currency — cannot be unchecked
  const COUNTRY_CUR={"Afghanistan":"AFN","Albania":"ALL","Alemania":"EUR","Andorra":"EUR","Angola":"AOA","Argentina":"ARS","Armenia":"AMD","Australia":"AUD","Austria":"EUR","Azerbaiyán":"AZN","Bahamas":"BSD","Bangladés":"BDT","Bélgica":"EUR","Belice":"BZD","Bolivia":"BOB","Bosnia y Herzegovina":"BAM","Brasil":"BRL","Bulgaria":"BGN","Camerún":"XAF","Canadá":"CAD","Chile":"CLP","China":"CNY","Chipre":"EUR","Colombia":"COP","Costa Rica":"CRC","Croacia":"EUR","Cuba":"CUP","Dinamarca":"DKK","Ecuador":"USD","Egipto":"EGP","El Salvador":"USD","Emiratos Árabes Unidos":"AED","Eslovaquia":"EUR","Eslovenia":"EUR","España":"EUR","Estados Unidos":"USD","Estonia":"EUR","Etiopía":"ETB","Filipinas":"PHP","Finlandia":"EUR","Francia":"EUR","Ghana":"GHS","Grecia":"EUR","Guatemala":"GTQ","Honduras":"HNL","Hungría":"HUF","India":"INR","Indonesia":"IDR","Irán":"IRR","Irlanda":"EUR","Israel":"ILS","Italia":"EUR","Jamaica":"JMD","Japón":"JPY","Jordania":"JOD","Kazajistán":"KZT","Kenia":"KES","México":"MXN","Marruecos":"MAD","Nepal":"NPR","Nicaragua":"NIO","Nigeria":"NGN","Noruega":"NOK","Nueva Zelanda":"NZD","Países Bajos":"EUR","Pakistán":"PKR","Panamá":"USD","Paraguay":"PYG","Perú":"PEN","Polonia":"PLN","Portugal":"EUR","Qatar":"QAR","Reino Unido":"GBP","República Checa":"CZK","República Dominicana":"DOP","Rumanía":"RON","Rusia":"RUB","Arabia Saudita":"SAR","Senegal":"XOF","Serbia":"RSD","Singapur":"SGD","Sudáfrica":"ZAR","Suecia":"SEK","Suiza":"CHF","Tailandia":"THB","Tanzania":"TZS","Turquía":"TRY","Ucrania":"UAH","Uruguay":"UYU","Venezuela":"VES","Vietnam":"VND","Zimbabue":"ZWL"};
  const residenceCur=COUNTRY_CUR[S.profile&&S.profile.residence]||'';
  if(!checked && c===residenceCur && residenceCur){
    toast('🔒 La moneda de tu país de residencia no puede desactivarse');
    renderPage('configuracion');return;
  }
  if(checked){
    if(S.currencies.length>=2){toast('Solo puedes tener máximo 2 monedas activas. Desactiva una primero.');renderPage('configuracion');return;}
    if(!S.currencies.includes(c))S.currencies.push(c);
  } else {
    S.currencies=S.currencies.filter(x=>x!==c);
    if(S.currencies.length>0&&!S.currencies.includes(S.currency))S.currency=S.currencies[0];
  }
  saveState();refreshCurrencyToggle();renderPage('configuracion');
}
function exportData(){const d=JSON.stringify(S,null,2);const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(d);a.download='finanzía-backup-'+todayStr()+'.json';a.click();toast('Exportado ✓');}
function importData(){document.getElementById('import-file')?.click();}
function handleImportFile(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{try{const d=JSON.parse(ev.target.result);confirmDialog('📥','¿Importar datos?','Reemplazará todos tus datos actuales.',()=>{Object.assign(S,d);saveState();renderPage(S.currentPage);toast('Importado ✓');},'Importar','btn-primary');}catch(e){toast('Error al leer archivo');}};
  reader.readAsText(file);
}
function resetApp(){
  confirmDialog('⚠️','¿Restaurar la app?','Se eliminarán TODOS tus datos. Esta acción es irreversible.',()=>{
    localStorage.removeItem('finanziaState3');_testAnswers={};
    S={currency:'',currentPage:'dashboard',theme:S.theme,language:'',weekStart:'',currencies:[],accounts:[],transactions:[],categories:JSON.parse(JSON.stringify(DEFAULT_CATS)),subcategories:JSON.parse(JSON.stringify(DEFAULT_SUBS)),budgets:[],goals:[],scheduledPayments:[],movFilter:{tab:'todos',search:'',dateFrom:'',dateTo:'',catId:'',accountId:'',payMethod:''},analysisPeriod:'Mensual',analysisYear:new Date().getFullYear(),exchangeRate:{PLN_COP:1200,COP_PLN:0.000833,lastUpdated:''}};
    saveState();refreshCurrencyToggle();navigate('dashboard');toast('App restaurada ✓');
  });
}

// ════════════════════════════════════════════════════════════
// COLOR & ICON PICKERS (shared)
// ════════════════════════════════════════════════════════════
function colorPickerHtml(selectedColor,hiddenId){
  var html='<div class="color-grid">';
  var q="'";
  COLORS_PALETTE.forEach(function(col){
    var sel=col===selectedColor?' selected':'';
    html+='<div class="color-opt'+sel+'" style="background:'+col+'" onclick="selectColor(this,'+q+col+q+','+q+hiddenId+q+')"></div>';
  });
  html+='</div><input type="hidden" id="'+hiddenId+'" value="'+(selectedColor||COLORS_PALETTE[0])+'">';
  return html;
}
function selectColor(el,color,hiddenId){
  el.closest('.color-grid')?.querySelectorAll('.color-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  const h=document.getElementById(hiddenId);if(h)h.value=color;
}
function iconPickerHtml(selectedIcon,hiddenId){
  var html='<div class="icon-grid">';
  var q="'";
  ICONS.forEach(function(ic){
    var sel=ic===selectedIcon?' selected':'';
    html+='<div class="icon-opt'+sel+'" onclick="selectIcon(this,'+q+ic+q+','+q+hiddenId+q+')">'+ic+'</div>';
  });
  html+='</div><input type="hidden" id="'+hiddenId+'" value="'+(selectedIcon||ICONS[0])+'">';
  return html;
}
function selectIcon(el,icon,hiddenId){
  el.closest('.icon-grid')?.querySelectorAll('.icon-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  const h=document.getElementById(hiddenId);if(h)h.value=icon;
}

// ════════════════════════════════════════════════════════════
// MODAL BUILDER
// ════════════════════════════════════════════════════════════
function buildModal(type,data){
  const drag=`<div class="modal-drag"></div>`;
  switch(type){
    case'transaction':return drag+buildTransactionModal(data);
    case'viewTx':return drag+buildViewTxModal(data);
    case'account':return drag+buildAccountModal(data);
    case'budget':return drag+buildBudgetModal(data);
    case'goal':return drag+buildGoalModal(data);
    case'addToGoal':return drag+buildAddToGoalModal(data);
    case'payment':return drag+buildPaymentModal(data);
    case'category':return drag+buildCategoryModal(data);
    case'subcategory':return drag+buildSubcategoryModal(data);
    case'editSubcategory':return drag+buildEditSubcategoryModal(data);
    case'newList':return drag+buildNewListModal(data);
    case'newInvestment':return drag+buildNewInvestmentModal(data);
    case'editInvestment':return drag+buildNewInvestmentModal(data);
    case'filterMovimientos':return drag+buildFilterModal();
    case'balanceDistribution':return drag+buildBalanceDistModal();
    case'debtPayment':return drag+buildDebtPaymentModal(data);
    case'subAccount':{const parentAcc=S.accounts.find(a=>a.id===data.parentId);if(parentAcc&&(parentAcc.protected||parentAcc.subtype==='efectivo')){toast('Esta cuenta no puede tener bolsillos');return'';}return drag+buildSubAccountModal(data);}
    case'custom':return drag+(data.html||'');
    default:return drag+'<div class="modal-body">Sin contenido</div>';
  }
}

// ─── TRANSACTION MODAL ───
function openTransactionModal(data){
  if(!S.currencies||!S.currencies.length){
    toast('Primero configura una moneda en Ajustes → Perfil');
    return;
  }
  openModal('transaction',data||{});
}
function buildTransactionModal(data){
  const tx=data.id?S.transactions.find(t=>t.id===data.id):null;
  const isEdit=!!tx;const type=tx?tx.type:(data.type||'gasto');
  const catId=tx?tx.categoryId:'';
  return`<div class="modal-header"><div class="modal-title">${isEdit?'Editar':'Nuevo'} movimiento</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <div class="type-selector">
      <button class="type-btn exp ${type==='gasto'?'active':''}" onclick="setTxType('gasto')">↓ Gasto</button>
      <button class="type-btn inc ${type==='ingreso'?'active':''}" onclick="setTxType('ingreso')">↑ Ingreso</button>
      <button class="type-btn tra ${type==='transferencia'?'active':''}" onclick="setTxType('transferencia')">↔ Transf.</button>
    </div>
    <input type="hidden" id="tx-type" value="${type}">
    <input type="hidden" id="tx-id" value="${tx?tx.id:''}">
    <div id="tx-fields-normal" ${type==='transferencia'?'class="hidden"':''}>
      <div class="form-group"><label class="form-label">Cuenta</label><select class="form-select" id="tx-account" onchange="checkTcAccount(this.value,'${type}')">${accountOptionsByCur(tx?tx.currency:S.currency,tx?tx.accountId:(data.accountId||''))}</select></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Categoría</label><select class="form-select" id="tx-cat" onchange="updateSubs(this.value,'tx-sub')">${catOptions(type,catId)}</select></div>
        <div class="form-group"><label class="form-label">Subcategoría</label><select class="form-select" id="tx-sub">${catId?subOptions(catId,tx?tx.subcategoryId:''):'<option value="">Sin subcategoría</option>'}</select></div>
      </div>
      <div class="form-group"><label class="form-label">Medio de pago</label><select class="form-select" id="tx-payment"><option value="">Sin especificar</option>${PAYMENT_METHODS.map(m=>`<option value="${m}" ${tx&&tx.paymentMethod===m?'selected':''}>${m}</option>`).join('')}</select></div>
      <div id="tx-installments-group" class="form-group hidden">
        <label class="form-label">¿A cuántas cuotas? <span style="color:var(--text3);font-weight:400">(TC detectada)</span></label>
        <select class="form-select" id="tx-installments">
          <option value="1">1 cuota (contado)</option>
          ${[2,3,4,5,6,9,12,18,24,36,48,60].map(n=>`<option value="${n}">${n} cuotas</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="tx-fields-transfer" ${type!=='transferencia'?'class="hidden"':''}>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Cuenta origen</label><select class="form-select" id="tx-from-acc">${accountOptionsByCur(tx?tx.currency:S.currency,tx?tx.accountId:'')}</select></div>
        <div class="form-group"><label class="form-label">Cuenta destino</label><select class="form-select" id="tx-to-acc">${accountOptionsByCur(tx?tx.currency:S.currency,tx?tx.toAccountId:'')}</select></div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Moneda</label><select class="form-select" id="tx-currency" onchange="updateTxAccountsByCur(this.value)">${buildCurrencyOptions(tx?tx.currency:S.currency)}</select></div>
      <div class="form-group"><label class="form-label">Monto</label><input class="form-input" type="number" id="tx-amount" placeholder="0.00" step="0.01" value="${tx?tx.amount:''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Fecha</label><input class="form-input" type="date" id="tx-date" value="${tx?tx.date:todayStr()}"></div>
    <div class="form-group"><label class="form-label">Descripción</label><input class="form-input" type="text" id="tx-desc" placeholder="Nota opcional" value="${tx?tx.description||'':''}"></div>
    <div class="btn-row">${isEdit?`<button class="btn btn-danger" onclick="deleteTx('${tx.id}')">Eliminar</button>`:''}<button class="btn btn-primary" onclick="saveTx()">${isEdit?'Guardar cambios':'Registrar'}</button></div>
  </div>`;
}
function checkTcAccount(accId,txType){
  const acc=getAcc(accId);
  const grp=document.getElementById('tx-installments-group');
  if(grp)grp.classList.toggle('hidden',!(acc&&acc.subtype==='tc'&&txType==='gasto'));
}
function setTxType(t){
  document.getElementById('tx-type').value=t;
  document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));
  const map={gasto:'exp',ingreso:'inc',transferencia:'tra'};
  document.querySelector('.type-btn.'+map[t])?.classList.add('active');
  document.getElementById('tx-fields-normal').classList.toggle('hidden',t==='transferencia');
  document.getElementById('tx-fields-transfer').classList.toggle('hidden',t!=='transferencia');
  const catSel=document.getElementById('tx-cat');
  if(catSel)catSel.innerHTML=catOptions(t==='transferencia'?'':t);
  // Re-check TC when type changes
  const accId=document.getElementById('tx-account')?.value;
  if(accId)checkTcAccount(accId,t);
  else{const grp=document.getElementById('tx-installments-group');if(grp)grp.classList.add('hidden');}
}
function updateTxAccountsByCur(cur){
  const acc=document.getElementById('tx-account');
  const from=document.getElementById('tx-from-acc');
  const to=document.getElementById('tx-to-acc');
  const opts=accountOptionsByCur(cur,'');
  if(acc)acc.innerHTML=opts;
  if(from)from.innerHTML=opts;
  if(to)to.innerHTML=opts;
  const grp=document.getElementById('tx-installments-group');
  if(grp)grp.classList.add('hidden');
}
let _savingTx=false;
function saveTx(){
  if(_savingTx)return;_savingTx=true;setTimeout(()=>_savingTx=false,2000);
  const type=document.getElementById('tx-type')?.value;
  const amount=parseFloat(document.getElementById('tx-amount')?.value);
  const date=document.getElementById('tx-date')?.value;
  if(!amount||amount<=0){_savingTx=false;toast('Ingresa un monto válido');return;}
  if(!date){_savingTx=false;toast('Selecciona una fecha');return;}
  const id=document.getElementById('tx-id')?.value;
  const existing=id?S.transactions.find(t=>t.id===id):null;
  const tx={id:existing?existing.id:uid(),type,amount,currency:document.getElementById('tx-currency')?.value||S.currency,date,description:document.getElementById('tx-desc')?.value||''};
  if(type==='transferencia'){
    tx.accountId=resolveAccId(document.getElementById('tx-from-acc')?.value||'');
    tx.toAccountId=resolveAccId(document.getElementById('tx-to-acc')?.value||'');
    if(!tx.accountId||!tx.toAccountId){toast('Selecciona ambas cuentas');return;}
    if(tx.accountId===tx.toAccountId){toast('Las cuentas deben ser diferentes');return;}
  }else{
    tx.accountId=resolveAccId(document.getElementById('tx-account')?.value||'');
    tx.categoryId=document.getElementById('tx-cat')?.value||'';
    tx.subcategoryId=document.getElementById('tx-sub')?.value||'';
    tx.paymentMethod=document.getElementById('tx-payment')?.value||'';
    const acc=getAcc(tx.accountId);
    if(acc&&acc.subtype==='tc'&&type==='gasto'){
      const inst=parseInt(document.getElementById('tx-installments')?.value)||1;
      if(inst>1)tx.installments=inst;
    }
  }
  var _txMsg=existing?'Actualizado ✓':'Registrado ✓';
  completeAction(function(){if(existing){var idx=S.transactions.findIndex(function(t){return t.id===id;});S.transactions[idx]=stampItem(tx);}else{S.transactions.push(stampItem(tx));}},S.currentPage||'movimientos',_txMsg);
}
function editTx(id){
  openModal('transaction',{id:id});
}
function deleteTx(id){
  confirmDialog('🗑️','¿Eliminar movimiento?','Esta acción no se puede deshacer.',()=>{
    completeAction(function(){
      const tx=S.transactions.find(t=>t.id===id);
      if(tx){
        if(tx.type==='ingreso'&&tx.description&&tx.description.startsWith('Ahorro:')){
          const gName=tx.description.replace('Ahorro:','').trim();
          const g=S.goals.find(g=>g.name===gName||(tx.description&&tx.description.includes(g.name)));
          if(g)g.current=Math.max(0,(parseFloat(g.current)||0)-(parseFloat(tx.amount)||0));
        }
        if(tx.type==='gasto'&&tx.description&&tx.description.startsWith('Ahorro →')){
          const gName=tx.description.replace('Ahorro →','').trim();
          const g=S.goals.find(g=>g.name===gName);
          if(g)g.current=Math.max(0,(parseFloat(g.current)||0)-(parseFloat(tx.amount)||0));
        }
      }
      S.transactions=softDelete(S.transactions,id);
    },S.currentPage,'Eliminado');
  });
}

// ─── VIEW TX MODAL ───
function buildViewTxModal(data){
  const tx=S.transactions.find(t=>t.id===data.id);
  if(!tx)return'<div class="modal-body">No encontrado</div>';
  const cat=getCat(tx.categoryId);const sub=getSub(tx.subcategoryId);const acc=getAcc(tx.accountId);const toAcc=getAcc(tx.toAccountId);
  const sign=tx.type==='ingreso'?'+':tx.type==='gasto'?'−':'↔';
  const color=tx.type==='ingreso'?'var(--success)':tx.type==='gasto'?'var(--danger)':'var(--secondary)';
  return`<div class="modal-header"><div class="modal-title">Detalle</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <div style="text-align:center;padding:16px 0 20px">
      <div style="font-size:44px;margin-bottom:8px">${tx.type==='transferencia'?'↔️':(cat?cat.icon:'📦')}</div>
      <div style="font-size:30px;font-weight:800;color:${color}">${sign}${fmt(tx.amount,tx.currency)}</div>
      <div style="font-size:13px;color:var(--text2);margin-top:4px">${tx.type==='transferencia'?'Transferencia':(cat?cat.icon+' '+cat.name:'Sin categoría')}</div>
    </div>
    <div class="card">
      ${tx.type==='transferencia'
        ?`<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Origen</span><span>${acc?acc.name:'–'}</span></div>
           <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Destino</span><span>${toAcc?toAcc.name:'–'}</span></div>`
        :`<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Cuenta</span><span>${acc?acc.name:'–'}</span></div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Categoría</span><span style="display:flex;align-items:center;gap:4px">${cat?`<span style="width:8px;height:8px;border-radius:50%;background:${cat.color};display:inline-block"></span>${cat.icon} ${cat.name}`:'–'}</span></div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Subcategoría</span><span>${sub?sub.icon+' '+sub.name:'–'}</span></div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Medio de pago</span><span>${tx.paymentMethod||'–'}</span></div>
          ${tx.installments?`<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Cuotas</span><span>${tx.installments} cuota(s) · ${fmt(tx.amount/tx.installments,tx.currency)}c/u</span></div>`:''}`}
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text2)">Fecha</span><span>${tx.date}</span></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0"><span style="color:var(--text2)">Descripción</span><span style="max-width:60%;text-align:right">${tx.description||'–'}</span></div>
    </div>
    <div class="btn-row" style="margin-top:16px"><button class="btn btn-secondary" onclick="editTx('${tx.id}')">✏️ Editar</button><button class="btn btn-danger" onclick="deleteTx('${tx.id}')">Eliminar</button></div>
  </div>`;
}

// ─── BALANCE DISTRIBUTION MODAL ───
function buildBalanceDistModal(){
  const cur=S.currency;
  const accs=S.accounts.filter(a=>a.type==='activo'&&(a.currency||cur)===cur);
  // Total disponible = balance total - lo ahorrado en metas
  const totalGoalSaved=S.goals.filter(g=>(g.currency||cur)===cur).reduce((s,g)=>s+(parseFloat(g.current)||0),0);
  const totalBal=accs.reduce((s,a)=>s+Math.max(0,getBalance(a.id)),0);
  const totalDisp=Math.max(0,totalBal-totalGoalSaved);

  // For each account, calculate its "available" portion
  // Strategy: subtract goal savings proportionally from accounts,
  // but simpler: show each account balance minus its share of goal savings
  // Actually simplest & most correct: show each account's real balance,
  // but label the total as "Disponible" and note that savings are excluded.
  // The disponible value is totalBal - totalGoalSaved.
  // We show accounts at their real balances but the total shown = disponible.

  const sorted=[...accs].map(a=>({...a,bal:Math.max(0,getBalance(a.id))}))
    .sort((a,b)=>b.bal-a.bal)
    .filter(a=>a.bal>0);

  // Build goal savings note
  const goalsNote=totalGoalSaved>0?
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);opacity:.7">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--primary);flex-shrink:0"></div>
        <div style="font-size:13px;font-weight:600;color:var(--text2)">🎯 Ahorrado en metas</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px;font-weight:700;color:var(--primary)">−${fmt(totalGoalSaved,cur)}</div>
        <div style="font-size:11px;color:var(--text3)">no disponible</div>
      </div>
    </div>`:'';

  let donutPaths='',listItems='';let offset=0;
  const r=54,cx=64,cy=64,circ=2*Math.PI*r;

  // If there are goal savings, add them as a "locked" segment in the donut
  if(totalGoalSaved>0&&totalBal>0){
    const goalPct=Math.min(1,totalGoalSaved/totalBal);
    const goalDash=goalPct*circ;
    donutPaths+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--primary)" stroke-width="20" stroke-dasharray="${goalDash} ${circ-goalDash}" stroke-dashoffset="0" stroke-opacity="0.3" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset+=goalDash;
  }

  sorted.forEach((a,i)=>{
    const pct=totalBal>0?a.bal/totalBal:0;const dash=pct*circ;
    const b=getBank(a.bankEntity,a.currency||cur);
    const color=b?b.color:COLORS_PALETTE[i%COLORS_PALETTE.length];
    donutPaths+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="20" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset+=dash;
    // Show % of disponible, not of total
    const pctDisp=totalDisp>0?Math.round(a.bal/totalBal*(totalDisp>0?totalBal/totalDisp:1)*100):0;
    listItems+=`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
      ${bankBadge(a.bankEntity,a.currency||cur,36)}
      <div style="flex:1"><div style="font-size:13px;font-weight:600">${a.name}</div></div>
      <div style="text-align:right"><div style="font-size:14px;font-weight:700">${fmt(a.bal,a.currency||cur)}</div><div style="font-size:11px;color:var(--text2)">${totalBal>0?Math.round(a.bal/totalBal*100):0}%</div></div>
    </div>`;
  });

  return`<div class="modal-header"><div class="modal-title">💎 Total disponible</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <div style="text-align:center;margin-bottom:12px">
      <svg width="128" height="128" viewBox="0 0 128 128" style="display:block;margin:0 auto">
        <circle cx="64" cy="64" r="54" fill="none" stroke="var(--surface3)" stroke-width="20"/>
        ${donutPaths}
        <text x="64" y="58" text-anchor="middle" fill="var(--text2)" font-size="9">Disponible</text>
        <text x="64" y="74" text-anchor="middle" fill="var(--text)" font-size="11" font-weight="bold">${fmt(totalDisp,cur)}</text>
      </svg>
      <div style="font-size:11px;color:var(--text2);margin-top:4px">Balance: ${fmt(totalBal,cur)} · Ahorrado: ${fmt(totalGoalSaved,cur)}</div>
    </div>
    ${goalsNote}
    ${listItems||'<div style="color:var(--text2);font-size:13px;text-align:center;padding:16px">Sin cuentas activas con saldo</div>'}
  </div>`;
}

// ─── DEBT PAYMENT MODAL ───
function buildDebtPaymentModal(data){
  const a=S.accounts.find(x=>x.id===data.id);if(!a)return'';
  const bal=Math.abs(getBalance(a.id));
  const cur=a.currency||S.currency;
  const accOpts=accountOptionsByCur(cur,'');
  return`<div class="modal-header"><div class="modal-title">Registrar pago de deuda</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px;margin-bottom:14px">
      <div style="font-size:13px;font-weight:700">${a.icon||'💳'} ${a.name}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:2px">Saldo actual: <strong style="color:var(--danger)">${fmt(bal,cur)}</strong></div>
      ${a.monthlyPayment?`<div style="font-size:12px;color:var(--text2)">Cuota sugerida: ${fmt(a.monthlyPayment,cur)}</div>`:''}
    </div>
    <input type="hidden" id="dp-debt-id" value="${a.id}">
    <div class="form-group">
      <label class="form-label">Monto del pago</label>
      <input class="form-input" type="number" id="dp-amount" placeholder="0.00" step="0.01" value="${a.monthlyPayment||''}">
    </div>
    <div class="form-group">
      <label class="form-label">Cuenta origen (de donde sale el dinero)</label>
      <select class="form-select" id="dp-from-acc">${accOpts}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Fecha</label>
      <input class="form-input" type="date" id="dp-date" value="${todayStr()}">
    </div>
    <div style="background:rgba(0,212,170,.07);border:1px solid rgba(0,212,170,.2);border-radius:var(--radius-sm);padding:10px;margin-bottom:14px;font-size:12px;color:var(--text2)">
      ℹ️ Se creará: <strong>1 gasto</strong> en la cuenta origen y <strong>1 ingreso</strong> en la cuenta de deuda para reflejar la reducción del saldo.
    </div>
    <button class="btn btn-primary" onclick="saveDebtPayment()">Registrar pago</button>
  </div>`;
}
// Helper: find category by name or fallback
function getAutoCategory(prefName,prefType){
  return S.categories.find(c=>c.name===prefName)
    ||S.categories.find(c=>c.type===prefType)
    ||S.categories[0]||null;
}
function getAutoSubcategory(catId,prefName){
  return S.subcategories.find(s=>s.categoryId===catId&&s.name===prefName)||null;
}

function saveDebtPayment(){
  const debtId=document.getElementById('dp-debt-id')?.value;
  const amount=parseFloat(document.getElementById('dp-amount')?.value);
  const fromAccId=resolveAccId(document.getElementById('dp-from-acc')?.value);
  const date=document.getElementById('dp-date')?.value;
  if(!amount||amount<=0){toast('Ingresa un monto válido');return;}
  if(!fromAccId){toast('Selecciona la cuenta origen');return;}
  const debtAcc=S.accounts.find(a=>a.id===debtId);if(!debtAcc)return;
  const cur=debtAcc.currency||S.currency;
  // Auto-assign category: look for "Hogar" or any gasto cat with "deuda"/"pago" in name, fallback to first gasto
  const payCat=S.categories.find(c=>c.name==='Pagos')||S.categories.find(c=>c.name==='Hogar')||getAutoCategory('','gasto');
  const paySub=payCat?getAutoSubcategory(payCat.id,'Deudas')||getAutoSubcategory(payCat.id,'Pagos')||null:null;
  // Gasto en cuenta origen (sale dinero del activo)
  S.transactions.push(stampItem({id:uid(),type:'gasto',accountId:fromAccId,categoryId:payCat?payCat.id:'',subcategoryId:paySub?paySub.id:'',amount,currency:cur,date,description:'Pago deuda: '+debtAcc.name,paymentMethod:''}));
  // Ingreso en cuenta pasiva (reduce la deuda)
  S.transactions.push(stampItem({id:uid(),type:'ingreso',accountId:debtId,categoryId:payCat?payCat.id:'',subcategoryId:paySub?paySub.id:'',amount,currency:cur,date,description:'Abono: '+debtAcc.name,paymentMethod:''}));
  completeAction(null,'deudas',`Pago de ${fmt(amount,cur)} registrado ✓`);
}

// ─── SUB-ACCOUNT MODAL ───
function buildSubAccountModal(data){
  const parent=S.accounts.find(a=>a.id===data.parentId);
  const sub=data.subId?((parent?.subAccounts||[]).find(s=>s.id===data.subId)):null;
  const isEdit=!!sub;
  if(!parent)return'<div class="modal-body">Cuenta no encontrada</div>';
  return`<div class="modal-header"><div class="modal-title">${isEdit?'Editar':'Nueva'} bolsillo / cajita</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:14px">
      ${bankBadge(parent.bankEntity,parent.currency||S.currency,36)}
      <div><div style="font-size:13px;font-weight:700">${parent.name}</div><div style="font-size:11px;color:var(--text2)">Cuenta principal</div></div>
    </div>
    <input type="hidden" id="sub-parent-id" value="${parent.id}">
    <input type="hidden" id="sub-id-val" value="${sub?sub.id:''}">
    <div class="form-group"><label class="form-label">Nombre del bolsillo</label><input class="form-input" type="text" id="subacc-name" placeholder="Ej: Vacaciones, CDT, Ahorro emergencia" value="${sub?sub.name:''}"></div>
    <div class="form-group"><label class="form-label">Saldo inicial</label><input class="form-input" type="number" id="subacc-balance" placeholder="0.00" step="0.01" value="${sub?sub.balance||0:0}"></div>
    <div class="form-group"><label class="form-label">Ícono</label>${iconPickerHtml(sub?sub.icon||'🐷':'🐷','subacc-icon-val')}</div>
    <div class="form-group"><label class="form-label">Color</label>${colorPickerHtml(sub?sub.color||COLORS_PALETTE[16]:COLORS_PALETTE[16],'subacc-color-val')}</div>
    <div class="btn-row">${isEdit?`<button class="btn btn-danger" onclick="deleteSubAccount('${parent.id}','${sub.id}')">Eliminar</button>`:''}<button class="btn btn-primary" onclick="saveSubAccount()">Guardar</button></div>
  </div>`;
}
function saveSubAccount(){
  const parentId=document.getElementById('sub-parent-id')?.value;
  const subId=document.getElementById('sub-id-val')?.value;
  const name=document.getElementById('subacc-name')?.value?.trim();
  if(!name){toast('Ingresa un nombre');return;}
  const parent=S.accounts.find(a=>a.id===parentId);if(!parent)return;
  if(!parent.subAccounts)parent.subAccounts=[];
  const existing=subId?parent.subAccounts.find(s=>s.id===subId):null;
  const sub={id:existing?existing.id:uid(),name,balance:parseFloat(document.getElementById('subacc-balance')?.value)||0,icon:document.getElementById('subacc-icon-val')?.value||'🐷',color:document.getElementById('subacc-color-val')?.value||COLORS_PALETTE[16]};
  var _subMsg=existing?'Bolsillo actualizado ✓':'Bolsillo creado ✓';
  completeAction(function(){if(existing){var idx=parent.subAccounts.findIndex(function(s){return s.id===subId;});parent.subAccounts[idx]=sub;}else{parent.subAccounts.push(sub);};},'cuenta-detalle',_subMsg);
}
function deleteSubAccount(parentId,subId){
  confirmDialog('🗑️','¿Eliminar bolsillo?','El saldo de este bolsillo dejará de contarse en la cuenta.',()=>{
    const parent=S.accounts.find(a=>a.id===parentId);
    completeAction(function(){var parent=S.accounts.find(function(a){return a.id===parentId;});if(parent&&parent.subAccounts)parent.subAccounts=parent.subAccounts.filter(function(s){return s.id!==subId;});},'cuentas','Bolsillo eliminado');
  });
}

// ─── ACCOUNT MODAL ───
function buildAccExtraFields(type,subtype,acc){
  const dayOpts=DAYS_1_31.map(d=>`<option value="${d}" ${acc&&acc.cutDate==d?'selected':''}>${d}</option>`).join('');
  const payOpts=DAYS_1_31.map(d=>`<option value="${d}" ${acc&&acc.paymentDate==d?'selected':''}>${d}</option>`).join('');
  if(type==='pasivo'&&subtype==='tc'){
    return`<div class="form-row"><div class="form-group"><label class="form-label">Límite de cupo</label><input class="form-input" type="number" id="acc-tc-limit" value="${acc&&acc.tcLimit?acc.tcLimit:''}" placeholder="Ej: 5000"></div><div class="form-group"><label class="form-label">TAE (%)</label><input class="form-input" type="number" id="acc-tae" value="${acc&&acc.tae?acc.tae:''}" placeholder="Ej: 24.5" step="0.01"></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Día de corte</label><select class="form-select" id="acc-cut"><option value="">Seleccionar</option>${dayOpts}</select></div><div class="form-group"><label class="form-label">Día de pago</label><select class="form-select" id="acc-paydate"><option value="">Seleccionar</option>${payOpts}</select></div></div>`;
  }else if(type==='pasivo'){
    return`<div class="form-row"><div class="form-group"><label class="form-label">Monto total</label><input class="form-input" type="number" id="acc-credit-total" value="${acc&&acc.creditTotal?acc.creditTotal:''}" placeholder="Total crédito"></div><div class="form-group"><label class="form-label">Cuota mensual</label><input class="form-input" type="number" id="acc-monthly-payment" value="${acc&&acc.monthlyPayment?acc.monthlyPayment:''}" placeholder="Cuota"></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Día de pago</label><select class="form-select" id="acc-paydate"><option value="">Seleccionar</option>${payOpts}</select></div><div class="form-group"><label class="form-label">Tasa (%)</label><input class="form-input" type="number" id="acc-tae" value="${acc&&acc.tae?acc.tae:''}" placeholder="Ej: 12" step="0.01"></div></div>`;
  }
  return'';
}
function buildAccountModal(data){
  const acc=data.id?S.accounts.find(a=>a.id===data.id):null;
  const isEdit=!!acc;
  const defType=data.defaultType||(acc?acc.type:'activo');
  const defSubtype=acc?(acc.subtype||'tc'):(data.defaultType==='pasivo'?'tc':'banco');
  const defCur=acc?acc.currency:S.currency;
  const banksList=defCur==='COP'?BANKS_COP:BANKS_PLN;
  const bankOpts=banksList.map(b=>`<option value="${b.id}" ${acc&&acc.bankEntity===b.id?'selected':''}>${b.abbr} · ${b.name}</option>`).join('');
  const subtypeOptsActivo=`<option value="banco" ${defSubtype==='banco'?'selected':''}>🏦 Banco</option><option value="efectivo" ${defSubtype==='efectivo'?'selected':''}>💵 Efectivo</option><option value="digital" ${defSubtype==='digital'?'selected':''}>📱 Digital</option><option value="inversion" ${defSubtype==='inversion'?'selected':''}>📈 Inversión</option>`;
  const subtypeOptsPasivo=`<option value="tc" ${defSubtype==='tc'?'selected':''}>💳 Tarjeta de Crédito</option><option value="credito" ${defSubtype==='credito'?'selected':''}>💰 Crédito</option><option value="prestamo" ${defSubtype==='prestamo'?'selected':''}>🏦 Préstamo</option>`;
  const extraHtml=buildAccExtraFields(defType,defSubtype,acc);
  const availCurs=(S.currencies&&S.currencies.length?S.currencies:[]);
  return`<div class="modal-header"><div class="modal-title">${isEdit?'Editar':'Nueva'} cuenta</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <input type="hidden" id="acc-id" value="${acc?acc.id:''}">
    <div class="form-group"><label class="form-label">Nombre de la cuenta</label><input class="form-input" type="text" id="acc-name" placeholder="Ej: PKO Cuenta corriente" value="${acc?acc.name:''}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Moneda</label><select class="form-select" id="acc-currency" onchange="updateAccBanks(this.value)">${availCurs.map(c=>`<option value="${c}" ${defCur===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Tipo</label><select class="form-select" id="acc-type" onchange="updateAccTypeUI(this.value)"><option value="activo" ${defType==='activo'?'selected':''}>✅ Activo</option><option value="pasivo" ${defType==='pasivo'?'selected':''}>🔴 Pasivo</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Entidad Financiera</label><select class="form-select" id="acc-bank"><option value="">Sin entidad</option>${bankOpts}</select></div>
    <div class="form-group"><label class="form-label">Subtipo</label><select class="form-select" id="acc-subtype" onchange="updateAccExtraUI(document.getElementById('acc-type').value,this.value)">${defType==='pasivo'?subtypeOptsPasivo:subtypeOptsActivo}</select></div>
    <div class="form-group"><label class="form-label">Balance inicial / Deuda actual</label><input class="form-input" type="number" id="acc-balance" placeholder="0.00" step="0.01" value="${acc?acc.initialBalance||0:0}"></div>
    <div id="acc-extra-fields">${extraHtml}</div>
    <div class="form-group"><label class="form-label">Color identificador</label>${colorPickerHtml(acc?acc.color:COLORS_PALETTE[0],'acc-color-val')}</div>
    <div class="btn-row">${isEdit?`<button class="btn btn-danger" onclick="deleteAccount('${acc.id}')">Eliminar</button>`:''}<button class="btn btn-primary" onclick="saveAccount()">Guardar</button></div>
  </div>`;
}
function updateAccTypeUI(type){
  const opts=type==='pasivo'?
    `<option value="tc" selected>💳 Tarjeta de Crédito</option><option value="credito">💰 Crédito</option><option value="prestamo">🏦 Préstamo</option>`:
    `<option value="banco" selected>🏦 Banco</option><option value="efectivo">💵 Efectivo</option><option value="digital">📱 Digital</option><option value="inversion">📈 Inversión</option>`;
  const el=document.getElementById('acc-subtype');
  if(el){el.innerHTML=opts;el.onchange=()=>updateAccExtraUI(type,el.value);}
  const defaultSub=type==='pasivo'?'tc':'banco';
  document.getElementById('acc-extra-fields').innerHTML=buildAccExtraFields(type,defaultSub,null);
}

function updateAccExtraUI(type,subtype){
  document.getElementById('acc-extra-fields').innerHTML=buildAccExtraFields(type,subtype,null);
}
function saveAccount(){
  const name=document.getElementById('acc-name')?.value?.trim();
  if(!name){toast('Ingresa un nombre');return;}
  const id=document.getElementById('acc-id')?.value;
  const existing=id?S.accounts.find(a=>a.id===id):null;
  const type=document.getElementById('acc-type')?.value||'activo';
  const subtype=document.getElementById('acc-subtype')?.value||'';
  const acc={id:existing?existing.id:uid(),name,type,subtype,currency:document.getElementById('acc-currency')?.value||S.currency,bankEntity:document.getElementById('acc-bank')?.value||'',initialBalance:parseFloat(document.getElementById('acc-balance')?.value)||0,icon:'💳',color:document.getElementById('acc-color-val')?.value||COLORS_PALETTE[0]};
  if(type==='pasivo'&&subtype==='tc'){acc.tcLimit=parseFloat(document.getElementById('acc-tc-limit')?.value)||0;acc.tae=parseFloat(document.getElementById('acc-tae')?.value)||0;acc.cutDate=parseInt(document.getElementById('acc-cut')?.value)||0;acc.paymentDate=parseInt(document.getElementById('acc-paydate')?.value)||0;}
  else if(type==='pasivo'){acc.creditTotal=parseFloat(document.getElementById('acc-credit-total')?.value)||0;acc.monthlyPayment=parseFloat(document.getElementById('acc-monthly-payment')?.value)||0;acc.paymentDate=parseInt(document.getElementById('acc-paydate')?.value)||0;acc.tae=parseFloat(document.getElementById('acc-tae')?.value)||0;}
  var _accMsg=existing?'Cuenta actualizada ✓':'Cuenta creada ✓';
  completeAction(function(){if(existing){var idx=S.accounts.findIndex(function(a){return a.id===id;});S.accounts[idx]=stampItem(acc);}else{S.accounts.push(stampItem(acc));};},'mis-cuentas',_accMsg);
}
function deleteAccount(id){const acc=S.accounts.find(a=>a.id===id);if(acc&&(acc.protected||acc.subtype==='efectivo')){toast('Esta cuenta no puede eliminarse');return;}confirmDialog('🗑️','¿Eliminar cuenta?','Los movimientos asociados quedarán sin cuenta.',()=>{completeAction(function(){S.accounts=softDelete(S.accounts,id);},'cuentas','Cuenta eliminada');});}

// ─── BUDGET MODAL ───
function buildBudgetModal(data){
  const b=data.id?S.budgets.find(x=>x.id===data.id):null;const isEdit=!!b;
  return`<div class="modal-header"><div class="modal-title">${isEdit?'Editar':'Nuevo'} presupuesto</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <input type="hidden" id="bud-id" value="${b?b.id:''}">
    <div class="form-row"><div class="form-group"><label class="form-label">Categoría</label><select class="form-select" id="bud-cat" onchange="updateSubs(this.value,'bud-sub')">${catOptions('gasto',b?b.categoryId:'')}</select></div><div class="form-group"><label class="form-label">Subcategoría</label><select class="form-select" id="bud-sub">${b?subOptions(b.categoryId,b.subcategoryId):'<option value="">Sin subcategoría</option>'}</select></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Moneda</label><select class="form-select" id="bud-currency">${buildCurrencyOptions(b?b.currency:S.currency)}</select></div><div class="form-group"><label class="form-label">Límite mensual</label><input class="form-input" type="number" id="bud-amount" placeholder="0.00" value="${b?b.amount:''}" step="0.01"></div></div>
    <div class="form-group"><label class="form-label">Color</label>${colorPickerHtml(b?b.color:COLORS_PALETTE[0],'bud-color-val')}</div>
    ${b?`<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px;margin-bottom:14px;font-size:13px">Gastado este mes: <strong>${fmt(getBudgetSpent(b))}</strong> de <strong>${fmt(b.amount)}</strong></div>`:''}
    <div class="btn-row">${isEdit?`<button class="btn btn-danger" onclick="deleteBudget('${b.id}')">Eliminar</button>`:''}<button class="btn btn-primary" onclick="saveBudget()">Guardar</button></div>
  </div>`;
}
function saveBudget(){
  const catId=document.getElementById('bud-cat')?.value;const amount=parseFloat(document.getElementById('bud-amount')?.value);
  if(!catId){toast('Selecciona una categoría');return;}if(!amount||amount<=0){toast('Ingresa un monto válido');return;}
  const id=document.getElementById('bud-id')?.value;const existing=id?S.budgets.find(b=>b.id===id):null;
  const bud={id:existing?existing.id:uid(),categoryId:catId,subcategoryId:document.getElementById('bud-sub')?.value||'',amount,currency:document.getElementById('bud-currency')?.value||S.currency,color:document.getElementById('bud-color-val')?.value||COLORS_PALETTE[0]};
  var _budMsg=existing?'Actualizado ✓':'Creado ✓';
  completeAction(function(){if(existing){var idx=S.budgets.findIndex(function(b){return b.id===id;});S.budgets[idx]=stampItem(bud);}else{S.budgets.push(stampItem(bud));};},'presupuestos',_budMsg);
}
function deleteBudget(id){confirmDialog('🗑️','¿Eliminar presupuesto?','',()=>{completeAction(function(){S.budgets=softDelete(S.budgets,id);},'presupuestos','Eliminado');});}

// ─── GOAL MODAL ───
function goalAccountOptions(cur,selectedId){
  const accs=S.accounts.filter(a=>(a.currency||S.currency)===cur);
  let opts='<option value="">Sin cuenta</option>';
  accs.forEach(a=>{
    opts+=`<option value="${a.id}" ${a.id===selectedId?'selected':''}>${a.icon||'💳'} ${a.name} (principal)</option>`;
    if(a.subAccounts&&a.subAccounts.length){
      a.subAccounts.forEach(sb=>{
        const subKey=a.id+'|'+sb.id;
        opts+=`<option value="${subKey}" ${subKey===selectedId?'selected':''}>&nbsp;&nbsp;↳ ${sb.icon||'🐷'} ${sb.name} (bolsillo de ${a.name})</option>`;
      });
    }
  });
  return opts;
}
function buildGoalModal(data){
  const g=data.id?S.goals.find(x=>x.id===data.id):null;const isEdit=!!g;
  const gCur=g?g.currency:S.currency;
  return`<div class="modal-header"><div class="modal-title">${isEdit?'Editar':'Nueva'} meta</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <input type="hidden" id="goal-id" value="${g?g.id:''}">
    <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" type="text" id="goal-name" placeholder="Ej: Vacaciones en Europa" value="${g?g.name:''}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Moneda</label><select class="form-select" id="goal-currency" onchange="document.getElementById('goal-account').innerHTML=goalAccountOptions(this.value,'')">${buildCurrencyOptions(gCur)}</select></div>
      <div class="form-group"></div>
    </div>
    <div class="form-row"><div class="form-group"><label class="form-label">Meta</label><input class="form-input" type="number" id="goal-target" placeholder="0.00" value="${g?g.target:''}" step="0.01"></div><div class="form-group"><label class="form-label">Ahorrado</label><input class="form-input" type="number" id="goal-current" placeholder="0.00" value="${g?g.current:0}" step="0.01"></div></div>
    <div class="form-row">
      <div class="form-group" style="display:none"></div>
      <div class="form-group"><label class="form-label">Fecha límite</label><input class="form-input" type="date" id="goal-deadline" value="${g?g.deadline||'':''}"></div>
    </div>
    <div class="form-group">
      <label class="form-label">Cuenta / Bolsillo vinculado</label>
      <select class="form-select" id="goal-account">${goalAccountOptions(gCur,g?g.accountId||'':'')}</select>
      <div style="font-size:11px;color:var(--text2);margin-top:4px">Si la cuenta tiene bolsillos, puedes elegir guardar en uno específico</div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Categoría del ahorro</label><select class="form-select" id="goal-cat" onchange="updateSubs(this.value,'goal-sub')">${catOptions('gasto',g?g.categoryId:'')}</select></div>
      <div class="form-group"><label class="form-label">Subcategoría</label><select class="form-select" id="goal-sub">${g&&g.categoryId?subOptions(g.categoryId,g.subcategoryId):'<option value="">Sin subcategoría</option>'}</select></div>
    </div>
    <div class="form-group"><label class="form-label">Ícono</label>${iconPickerHtml(g?g.icon||'🎯':'🎯','goal-icon-val')}</div>
    <div class="form-group"><label class="form-label">Color</label>${colorPickerHtml(g?g.color:COLORS_PALETTE[16],'goal-color-val')}</div>
    <div class="btn-row">${isEdit?`<button class="btn btn-danger" onclick="deleteGoal('${g.id}')">Eliminar</button>`:''}<button class="btn btn-primary" onclick="saveGoal()">Guardar</button></div>
  </div>`;
}
function saveGoal(){
  const name=document.getElementById('goal-name')?.value?.trim();const target=parseFloat(document.getElementById('goal-target')?.value);
  if(!name){toast('Ingresa un nombre');return;}if(!target||target<=0){toast('Ingresa una meta válida');return;}
  const id=document.getElementById('goal-id')?.value;const existing=id?S.goals.find(g=>g.id===id):null;
  const goal={id:existing?existing.id:uid(),name,target,current:parseFloat(document.getElementById('goal-current')?.value)||0,currency:document.getElementById('goal-currency')?.value||S.currency,deadline:document.getElementById('goal-deadline')?.value||'',icon:document.getElementById('goal-icon-val')?.value||'🎯',color:document.getElementById('goal-color-val')?.value||COLORS_PALETTE[16],accountId:document.getElementById('goal-account')?.value||'',categoryId:document.getElementById('goal-cat')?.value||'',subcategoryId:document.getElementById('goal-sub')?.value||''};
  var _goalMsg=existing?'Meta actualizada ✓':'Meta creada ✓';
  completeAction(function(){if(existing){var idx=S.goals.findIndex(function(g){return g.id===id;});S.goals[idx]=stampItem(goal);}else{S.goals.push(stampItem(goal));};},'metas',_goalMsg);
}
function deleteGoal(id){confirmDialog('🗑️','¿Eliminar meta?','',()=>{completeAction(function(){S.goals=softDelete(S.goals,id);},'metas','Meta eliminada');});}

// ─── ADD TO GOAL MODAL ───
function buildAddToGoalModal(data){
  const g=S.goals.find(x=>x.id===data.id);if(!g)return'';
  const linkedAcc=getAcc(g.accountId);
  const cur=g.currency||S.currency;
  const allAccOpts=accountOptionsByCur(cur,'');
  const destOpts=accountOptionsByCur(cur,g.accountId||'');
  // Pre-load category/subcategory from goal
  const presetCat=g.categoryId?getCat(g.categoryId):null;
  const presetSub=g.subcategoryId?getSub(g.subcategoryId):null;
  const catDisplay=presetCat?`${presetCat.icon} ${presetCat.name}`:'Sin categoría';
  const subDisplay=presetSub?`${presetSub.icon} ${presetSub.name}`:'';
  const payOpts=PAYMENT_METHODS.map(m=>`<option value="${m}">${m}</option>`).join('');
  return`<div class="modal-header"><div class="modal-title">Agregar ahorro</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px;margin-bottom:14px">
      <div style="font-size:13px;font-weight:700">${g.icon||'🎯'} ${g.name}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px">Ahorrado: <strong>${fmt(g.current,cur)}</strong> de <strong>${fmt(g.target,cur)}</strong></div>
      ${presetCat?`<div style="font-size:11px;color:var(--primary);margin-top:4px">📂 ${catDisplay}${subDisplay?' · '+subDisplay:''}</div>`:''}
    </div>
    <input type="hidden" id="atg-goal-id" value="${g.id}">
    <div class="form-group"><label class="form-label">Monto a agregar</label><input class="form-input" type="number" id="atg-amount" placeholder="0.00" step="0.01"></div>
    <div class="form-group"><label class="form-label">Fecha</label><input class="form-input" type="date" id="atg-date" value="${todayStr()}"></div>
    <div class="form-group">
      <label class="form-label">Cuenta origen (de donde sale)</label>
      <select class="form-select" id="atg-from-account">${allAccOpts}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Cuenta destino (donde se guarda)</label>
      <select class="form-select" id="atg-to-account">${destOpts}</select>
      ${linkedAcc?`<div style="font-size:11px;color:var(--primary);margin-top:4px">⭐ Vinculada: ${linkedAcc.name}</div>`:''}
    </div>
    <div class="form-group"><label class="form-label">Medio de pago</label><select class="form-select" id="atg-payment"><option value="">Sin especificar</option>${payOpts}</select></div>
    ${(()=>{if(!presetCat)return'<div class="form-row"><div class="form-group"><label class="form-label">Categoría</label><select class="form-select" id="atg-cat" onchange="updateSubs(this.value,\'atg-sub\')">'+catOptions('gasto')+'</select></div><div class="form-group"><label class="form-label">Subcategoría</label><select class="form-select" id="atg-sub"><option value="">Sin subcategoría</option></select></div></div>';return '<input type="hidden" id="atg-cat" value="'+(g.categoryId||'')+'"><input type="hidden" id="atg-sub" value="'+(g.subcategoryId||'')+'">';})()}
    <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="saveAddToGoal()">💰 Agregar ahorro</button>
  </div>`;
}
function saveAddToGoal(){
  const goalId=document.getElementById('atg-goal-id')?.value;
  const amount=parseFloat(document.getElementById('atg-amount')?.value);
  const date=document.getElementById('atg-date')?.value;
  const fromAccId=resolveAccId(document.getElementById('atg-from-account')?.value);
  const toAccId=resolveAccId(document.getElementById('atg-to-account')?.value);
  if(!amount||amount<=0){toast('Ingresa un monto válido');return;}
  if(!date){toast('Selecciona una fecha');return;}
  if(!fromAccId){toast('Selecciona cuenta origen');return;}
  if(!toAccId){toast('Selecciona cuenta destino');return;}
  if(fromAccId===toAccId){toast('Las cuentas deben ser diferentes');return;}
  const g=S.goals.find(x=>x.id===goalId);if(!g)return;
  const cur=g.currency||S.currency;
  // Use goal's preset category, or fall back to atg-cat selector
  const catId=(g.categoryId)||document.getElementById('atg-cat')?.value||getAutoCategory('Ahorros','gasto')?.id||'';
  const subId=(g.subcategoryId)||document.getElementById('atg-sub')?.value||'';
  const payMethod=document.getElementById('atg-payment')?.value||'';
  S.transactions.push(stampItem({id:uid(),type:'gasto',accountId:fromAccId,categoryId:catId,subcategoryId:subId,amount,currency:cur,date,description:'Ahorro → '+g.name,paymentMethod:payMethod}));
  S.transactions.push(stampItem({id:uid(),type:'ingreso',accountId:toAccId,categoryId:catId,subcategoryId:subId,amount,currency:cur,date,description:'Ahorro: '+g.name,paymentMethod:payMethod}));
  completeAction(function(){g.current=(parseFloat(g.current)||0)+amount;},'metas',`+${fmt(amount,cur)} agregado a "${g.name}" ✓`);
}

// ─── PAYMENT MODAL ───
function buildPaymentModal(data){
  const p=data.id?S.scheduledPayments.find(x=>x.id===data.id):null;const isEdit=!!p;
  const catId=p?p.categoryId:'';
  const pCur=p?p.currency:S.currency;
  const catOptsPrefilled=S.categories.filter(c=>c.type!=='ingreso').map(c=>`<option value="${c.id}" ${p&&p.categoryId===c.id?'selected':''}>${c.icon} ${c.name}</option>`).join('');
  const accOptsFilled=accountOptionsByCur(pCur,p?p.accountId:'');
  return`<div class="modal-header"><div class="modal-title">${isEdit?'Editar':'Nuevo'} pago programado</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <input type="hidden" id="pay-id" value="${p?p.id:''}">
    <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" type="text" id="pay-name" placeholder="Ej: Netflix, Arriendo..." value="${p?p.name:''}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Moneda</label><select class="form-select" id="pay-currency" onchange="updatePayAccounts(this.value)">${buildCurrencyOptions(pCur)}</select></div>
      <div class="form-group"><label class="form-label">Monto</label><input class="form-input" type="number" id="pay-amount" placeholder="0.00" value="${p?p.amount:''}" step="0.01"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Categoría</label><select class="form-select" id="pay-cat" onchange="updateSubs(this.value,'pay-sub')"><option value="">Categoría</option>${catOptsPrefilled}</select></div>
      <div class="form-group"><label class="form-label">Subcategoría</label><select class="form-select" id="pay-sub">${catId?subOptions(catId,p?p.subcategoryId:''):'<option value="">Sin subcategoría</option>'}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Frecuencia</label><select class="form-select" id="pay-freq">${FREQUENCIES.map(f=>`<option value="${f}" ${p&&p.frequency===f?'selected':''}>${f}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Próximo pago</label><input class="form-input" type="date" id="pay-next" value="${p?p.nextDate:todayStr()}"></div>
    </div>
    <div class="form-group"><label class="form-label">Cuenta para débito</label><select class="form-select" id="pay-account">${accOptsFilled}</select></div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:14px">
      <div><div style="font-size:14px;font-weight:600">Pago automático</div><div style="font-size:12px;color:var(--text2)">Se debitará automáticamente en la fecha</div></div>
      <div id="auto-toggle" onclick="toggleAutoPayment()" style="width:50px;height:28px;background:${p&&p.isAuto?'var(--primary)':'var(--surface3)'};border-radius:99px;position:relative;cursor:pointer;transition:.2s;flex-shrink:0">
        <div id="auto-knob" style="position:absolute;top:3px;left:${p&&p.isAuto?'23':'3'}px;width:22px;height:22px;background:white;border-radius:50%;transition:.2s;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>
      </div>
      <input type="hidden" id="pay-is-auto" value="${p&&p.isAuto?'1':'0'}">
    </div>
    <div class="form-group"><label class="form-label">Color identificador</label>${colorPickerHtml(p?p.color||COLORS_PALETTE[0]:COLORS_PALETTE[0],'pay-color-val')}</div>
    <div class="btn-row">${isEdit?`<button class="btn btn-danger" onclick="deletePayment('${p.id}')">Eliminar</button>`:''}<button class="btn btn-primary" onclick="savePayment()">Guardar</button></div>
  </div>`;
}
function updatePayAccounts(cur){
  const el=document.getElementById('pay-account');
  if(el)el.innerHTML=accountOptionsByCur(cur,'');
}
function openCuentaDetalle(accId,event){
  if(event&&(event.target.tagName==='BUTTON'||event.target.closest('.acc-action-zone')))return;
  S._viewAccId=accId;
  navigate('cuenta-detalle');
}

function renderCuentaDetalle(){
  var acc=S.accounts.find(function(a){return a.id===S._viewAccId;});
  if(!acc)return '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Cuenta no encontrada</div></div>';
  var cur=acc.currency||S.currency;
  var bal=getBalance(acc.id);
  var info=getSubInfo(acc._subId||acc.subtype);
  var bank=acc.bankEntity?getBank(acc.bankEntity,cur):null;
  var subtypeColor2={efectivo:'#10B981',tc:'#7461EF',digital:'#3B82F6',inversion:'#F59E0B',bien:'#8B5CF6',prestamo:'#EF4444',informal:'#EC4899',banco:'#0EA5E9'};
  var grpFromId=ACC_GROUPS.find(function(g){return g.id===(acc._grpId||acc.subtype);});
  var baseColor=bank?bank.color:((info&&info.grp&&info.grp.color)?info.grp.color:(grpFromId&&grpFromId.color)?grpFromId.color:(subtypeColor2[acc.subtype]||'#00D4AA'));
  if(!baseColor||baseColor==='undefined')baseColor='#00D4AA';
  var subtypeToGrp={efectivo:'efectivo',digital:'virtual',tc:'tc',prestamo:'prestamo',informal:'informal',inversion:'inversion',bien:'bien',banco:'banco'};
  var editGrp=acc._grpId||(acc.subtype?subtypeToGrp[acc.subtype]:null)||'banco';
  var editSub=acc._subId||(acc.type==='pasivo'?'visa':'ahorro');
  var isTc=(acc._grpId==='tc'||acc.subtype==='tc')&&acc.tcLimit;
  var used=isTc?Math.abs(bal):0;
  var avail=isTc?Math.max(0,acc.tcLimit-used):0;

  // Movimientos de esta cuenta
  var movs=S.transactions.filter(function(t){
    return t.accountId===acc.id||t.toAccountId===acc.id;
  }).sort(function(a,b){return new Date(b.date)-new Date(a.date);});

  // Tarjeta igual que en Mis Cuentas (accCardNew)
  var grad='linear-gradient(135deg,'+baseColor+' 0%,'+baseColor+'AA 50%,'+baseColor+'66 100%)';
  var typeIcon=acc.subtype==='efectivo'?'💵':acc.subtype==='tc'?'💳':acc.subtype==='digital'?'📱':acc.subtype==='inversion'?'📈':acc.subtype==='bien'?'🏠':acc.subtype==='prestamo'?'💰':'🏦';
  var cardNum=acc.lastDigits?('•••• •••• •••• '+acc.lastDigits):'•••• •••• •••• ••••';
  var bankLabel=bank?bank.abbr:(info&&info.sub?info.sub.label.slice(0,6).toUpperCase():acc.subtype.toUpperCase());
  // Para TC: obtener franquicia del subId
  var tcFranchiseMap={visa:'Visa',mastercard:'Mastercard',amex:'American Express',diners:'Diners Club',discover:'Discover',unionpay:'UnionPay',tc_otra:'Tarjeta de Crédito'};
  var franchise=isTc?(tcFranchiseMap[acc._subId||editSub]||'Tarjeta de Crédito'):'';
  var chipSVG='<svg width="34" height="26" viewBox="0 0 34 26" fill="none"><rect x="1" y="1" width="32" height="24" rx="4" fill="#C8960C" stroke="#A07800" stroke-width=".8"/><rect x="1" y="8.5" width="32" height="9" fill="#A07800" opacity=".4"/><rect x="11" y="1" width="12" height="24" fill="#A07800" opacity=".4"/><rect x="12" y="8.5" width="10" height="9" rx="1" fill="#C8960C" stroke="#A07800" stroke-width=".6"/><line x1="1" y1="8.5" x2="33" y2="8.5" stroke="#A07800" stroke-width=".6"/><line x1="1" y1="17.5" x2="33" y2="17.5" stroke="#A07800" stroke-width=".6"/><line x1="11" y1="1" x2="11" y2="25" stroke="#A07800" stroke-width=".6"/><line x1="23" y1="1" x2="23" y2="25" stroke="#A07800" stroke-width=".6"/></svg>';
  var nfcSVG='<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.5 5.5 8.5 18.5 12 22" stroke="rgba(255,255,255,.7)" stroke-width="2" stroke-linecap="round"/><path d="M16 5C10 9 10 15 16 19" stroke="rgba(255,255,255,.7)" stroke-width="2" stroke-linecap="round"/><path d="M20 8C13 10.5 13 13.5 20 16" stroke="rgba(255,255,255,.7)" stroke-width="2" stroke-linecap="round"/></svg>';
  var usedPct=isTc?(acc.tcLimit>0?Math.min(100,Math.round(used/acc.tcLimit*100)):0):0;
  var barColor=usedPct>80?'#FF8080':'rgba(255,255,255,.85)';

  // Fila superior: para TC → "Tarjeta de Crédito" + entidad; para otros → iniciales banco + nombre
  var topLeftHTML=isTc
    ?('<div style="font-size:11px;font-weight:800;color:rgba(255,255,255,.9);letter-spacing:.5px;text-transform:uppercase">Tarjeta de Crédito</div>'
      +(bank?'<div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:1px">'+bank.name+'</div>':''))
    :('<div style="font-size:13px;font-weight:800;color:rgba(255,255,255,.9);letter-spacing:1px;text-transform:uppercase">'+bankLabel+'</div>'
      +(bank?'<div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:1px">'+bank.name+'</div>':''));

  // Fila superior derecha: para TC → franquicia; para otros → icono tipo
  var topRightHTML=isTc
    ?('<div style="font-size:13px;font-weight:800;color:rgba(255,255,255,.9);letter-spacing:.5px">'+franchise+'</div>'
      +'<button onclick="openFormCuenta(\''+editGrp+'\',\''+editSub+'\',\''+acc.id+'\')" style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.2);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-top:4px;margin-left:auto">'
        +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
      +'</button>')
    :('<div style="display:flex;align-items:center;gap:8px">'
      +'<span style="font-size:22px">'+typeIcon+'</span>'
      +'<button onclick="openFormCuenta(\''+editGrp+'\',\''+editSub+'\',\''+acc.id+'\')" style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.2);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center">'
        +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
      +'</button>'
      +'</div>');

  // Fila inferior izquierda: para TC → nombre de cuenta (el usuario la llamó)
  var botLeftLabel=isTc?franchise:(acc.type==='pasivo'?'Deuda':'Cuenta');
  var botLeftValue=acc.name;

  // Fila inferior derecha: para TC → Disponible; para otros → Saldo
  var botRightLabel=isTc?'Disponible':'Saldo';
  var botRightValue=isTc?fmt(avail,cur):fmt(Math.abs(bal),cur);

  var html='<div style="background:'+grad+';border-radius:20px;padding:20px 22px 18px;margin-bottom:16px;position:relative;overflow:hidden;min-height:160px;display:flex;flex-direction:column;justify-content:space-between">'
    +'<div style="position:absolute;right:-30px;top:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.08)"></div>'
    +'<div style="position:absolute;right:30px;bottom:-50px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.05)"></div>'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative">'
      +'<div>'+topLeftHTML+'</div>'
      +'<div style="display:flex;flex-direction:column;align-items:flex-end">'+topRightHTML+'</div>'
    +'</div>'
    +'<div style="display:flex;align-items:center;gap:10px;position:relative">'+chipSVG+nfcSVG+'</div>'
    +'<div style="font-size:13px;color:rgba(255,255,255,.75);letter-spacing:3px;font-family:monospace;position:relative">'+cardNum+'</div>'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-end;position:relative">'
      +'<div>'
        +'<div style="font-size:10px;color:rgba(255,255,255,.55);font-weight:600;text-transform:uppercase;letter-spacing:.5px">'+botLeftLabel+'</div>'
        +'<div style="font-size:13px;font-weight:700;color:white;margin-top:1px">'+botLeftValue+'</div>'
      +'</div>'
      +'<div style="text-align:right">'
        +'<div style="font-size:11px;color:rgba(255,255,255,.55)">'+botRightLabel+'</div>'
        +'<div style="font-size:20px;font-weight:800;color:white;letter-spacing:-.5px">'+botRightValue+'</div>'
      +'</div>'
    +'</div>'
    +(isTc
      ?'<div style="margin-top:10px;position:relative">'
        +'<div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,.7);margin-bottom:4px">'
          +'<span>Usado: '+usedPct+'%</span>'
          +'<span>Límite: '+fmt(acc.tcLimit,cur)+'</span>'
        +'</div>'
        +'<div style="height:4px;background:rgba(255,255,255,.2);border-radius:99px">'
          +'<div style="height:100%;border-radius:99px;background:'+barColor+';width:'+usedPct+'%;transition:width .3s"></div>'
        +'</div>'
        +'<div style="text-align:center;font-size:10px;color:rgba(255,255,255,.6);margin-top:3px">Deuda: '+fmt(used,cur)+'</div>'
      +'</div>'
      :'')
    +'</div>';

  // 3 botones acción cápsula en fila
  html+='<div class="acc-action-zone" style="display:flex;gap:8px;margin-bottom:20px">'
    +'<button onclick="quickTx(\'ingreso\',\''+acc.id+'\')" style="flex:1;padding:11px 6px;border-radius:50px;border:none;background:rgba(16,185,129,.15);color:#10B981;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer">↑ Ingreso</button>'
    +'<button onclick="quickTx(\'gasto\',\''+acc.id+'\')" style="flex:1;padding:11px 6px;border-radius:50px;border:none;background:rgba(239,68,68,.15);color:#EF4444;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer">↓ Gasto</button>'
    +'<button onclick="quickTx(\'transferencia\',\''+acc.id+'\')" style="flex:1;padding:11px 6px;border-radius:50px;border:none;background:rgba(116,97,239,.15);color:#7461EF;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer">↔ Transf.</button>'
    +'</div>';

  html+='<div style="height:1px;background:var(--border);margin-bottom:16px"></div>';
  html+='<div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">Movimientos</div>';

  if(!movs.length){
    html+='<div style="text-align:center;padding:40px 20px">'
      +'<div style="font-size:48px;margin-bottom:12px">🌱</div>'
      +'<div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px">Todo empieza con un movimiento</div>'
      +'<div style="font-size:13px;color:var(--text3);line-height:1.5">Registra tu primer ingreso,<br>gasto o transferencia.</div>'
      +'</div>';
  } else {
    movs.forEach(function(t){
      var isIn=t.type==='ingreso'||(t.type==='transferencia'&&t.toAccountId===acc.id);
      var color=isIn?'var(--success)':'var(--danger)';
      var sign=isIn?'+':'-';
      var cat=S.categories.find(function(c){return c.id===t.categoryId;})||{};
      var label=t.description||cat.name||t.type;
      var dateStr=t.date?t.date.slice(0,10):'';
      html+='<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">'
        +'<div style="width:40px;height:40px;border-radius:12px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">'+(cat.icon||'💸')+'</div>'
        +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:14px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+label+'</div>'
          +'<div style="font-size:12px;color:var(--text3)">'+dateStr+'</div>'
        +'</div>'
        +'<div style="font-size:15px;font-weight:700;color:'+color+'">'+sign+fmt(Math.abs(parseFloat(t.amount)||0),cur)+'</div>'
        +'</div>';
    });
  }
  html+='<div style="height:32px"></div>';
  return html;
}


function openAmortizacionFull(){
  // Capturar datos del form en el momento del click — antes de que navigate limpie _fcData
  var f=fcGetField;
  var cur=f('fc-currency',S.currency);
  S._amortData={
    name:   f('fc-name','Crédito'),
    total:  parseNumSubs(f('fc-credit-total','0'),cur),
    monthly:parseNumSubs(f('fc-monthly','0'),cur),
    tae:    parseFloat(String(f('fc-tae','')).replace('%','').replace(',','.'))||0,
    capFreq:f('fc-cap-freq','mensual'),
    payFreq:f('fc-pay-freq','mensual'),
    months: parseInt(f('fc-term-months',''))||0,
    cur:    cur
  };
  navigate('amortizacion');
}

function renderAmortizacion(){
  var d=S._amortData||{};
  var cur=d.cur||S.currency;
  if(!d.total||!d.tae||!d.months){
    return '<div class="empty-state"><div class="empty-icon">📊</div>'
      +'<div class="empty-title">Datos insuficientes</div>'
      +'<div class="empty-desc">Completa monto, tasa y plazo para ver la tabla</div></div>';
  }
  var capN={mensual:12,trimestral:4,semestral:2,anual:1};
  var payPeriods={mensual:12,quincenal:26,semanal:52};
  var n=capN[d.capFreq||'mensual']||12;
  var periods=payPeriods[d.payFreq||'mensual']||12;
  var rPeriod=Math.pow(1+d.tae/100,1/periods)-1;
  var nPeriods=d.payFreq==='mensual'?d.months:d.payFreq==='quincenal'?Math.round(d.months/12*26):Math.round(d.months/12*52);
  var cuota=d.monthly||(rPeriod*(Math.pow(1+rPeriod,nPeriods))/(Math.pow(1+rPeriod,nPeriods)-1)*d.total);
  var tem=((Math.pow(1+d.tae/100,1/n)-1)*100).toFixed(2);
  function amCell(lbl,val,color){
    return '<div style="background:var(--surface2);border-radius:10px;padding:10px">'
      +'<div style="font-size:10px;color:var(--text3);text-transform:uppercase;font-weight:700;margin-bottom:2px">'+lbl+'</div>'
      +'<div style="font-size:13px;font-weight:700;color:'+(color||'var(--text)')+'">'+val+'</div>'
      +'</div>';
  }
  // Tarjeta: Monto, Cuota, TAE, TEM, Frecuencia, Plazo
  var html='<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:16px">'
    +'<div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:10px">'+d.name+'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +amCell('Monto',fmt(d.total,cur))
    +amCell('Cuota',fmt(cuota,cur))
    +amCell('TAE',d.tae+'%')
    +amCell('TEM',tem+'%','var(--primary)')
    +amCell('Frecuencia',(d.payFreq||'mensual'))
    +amCell('Plazo',d.months+' meses')
    +'</div></div>';
  // Calcular totales
  var saldo=d.total;
  var totalIntereses=0;
  var totalCapital=0;
  var rows=[];
  for(var i=1;i<=nPeriods;i++){
    var interest=saldo*rPeriod;
    var capital=cuota-interest;
    if(capital<0)capital=0;
    if(capital>saldo)capital=saldo;
    saldo=Math.max(0,saldo-capital);
    totalIntereses+=interest;
    totalCapital+=capital;
    rows.push({i:i,cuota:cuota,capital:capital,interest:interest,saldo:saldo});
  }
  var totalPagado=totalCapital+totalIntereses;
  // Función formato compacto para montos grandes en tabla
  function fmtAmort(val,c){
    var absV=Math.abs(val);
    if(absV>=1000000){return (val<0?'-':'')+(absV/1000000).toFixed(1).replace(/\.0$/,'')+'M';}
    if(absV>=10000){return (val<0?'-':'')+(absV/1000).toFixed(1).replace(/\.0$/,'')+'K';}
    return fmt(val,c);
  }
  // Totales ANTES de la tabla
  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:16px">'
    +'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">'
      +'<span style="font-size:13px;color:var(--text2)">Total a pagar</span>'
      +'<span style="font-size:14px;font-weight:700;color:var(--text)">'+fmt(totalPagado,cur)+'</span>'
    +'</div>'
    +'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">'
      +'<span style="font-size:13px;color:var(--text2)">Total intereses</span>'
      +'<span style="font-size:14px;font-weight:700;color:var(--danger)">'+fmt(totalIntereses,cur)+'</span>'
    +'</div>'
    +'<div style="display:flex;justify-content:space-between;padding:8px 0">'
      +'<span style="font-size:13px;color:var(--text2)">Capital prestado</span>'
      +'<span style="font-size:14px;font-weight:700;color:var(--primary)">'+fmt(d.total,cur)+'</span>'
    +'</div></div>';
  // Tabla (C2: fmtAmort para evitar desbordamiento)
  html+='<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden">'
    +'<table style="width:100%;border-collapse:collapse;font-size:10px;table-layout:fixed">'
    +'<thead><tr style="background:var(--surface2)">'
      +'<th style="padding:8px 4px;text-align:center;color:var(--text3);font-weight:700;width:28px">#</th>'
      +'<th style="padding:8px 4px;text-align:right;color:var(--text3);font-weight:700">Cuota</th>'
      +'<th style="padding:8px 4px;text-align:right;color:var(--primary);font-weight:700">Capital</th>'
      +'<th style="padding:8px 4px;text-align:right;color:var(--danger);font-weight:700">Interés</th>'
      +'<th style="padding:8px 4px;text-align:right;color:var(--text3);font-weight:700">Saldo</th>'
    +'</tr></thead><tbody>';
  rows.forEach(function(r){
    var odd=r.i%2===0?'background:var(--surface2)':'';
    html+='<tr style="'+odd+'">'
      +'<td style="padding:6px 4px;text-align:center;color:var(--text3)">'+r.i+'</td>'
      +'<td style="padding:6px 4px;text-align:right;font-weight:600;color:var(--text)">'+fmtAmort(r.cuota,cur)+'</td>'
      +'<td style="padding:6px 4px;text-align:right;color:var(--primary)">'+fmtAmort(r.capital,cur)+'</td>'
      +'<td style="padding:6px 4px;text-align:right;color:var(--danger)">'+fmtAmort(r.interest,cur)+'</td>'
      +'<td style="padding:6px 4px;text-align:right;color:var(--text2)">'+fmtAmort(r.saldo,cur)+'</td>'
      +'</tr>';
  });
  html+='</tbody></table></div>';
  html+='<div style="height:32px"></div>';
  return html;
}

function quickTx(type,accId){
  openTransactionModal({type:type,accountId:accId});
}function getAccIcon(a){
  if(!a)return '💳';
  if(a.id&&a.id.startsWith('efectivo-')||a.subtype==='efectivo')return '💵';
  if(a.subtype==='digital')return '📱';
  if(a.subtype==='inversion')return '📈';
  if(a.subtype==='tc')return '💳';
  if(a.subtype==='credito')return '💰';
  if(a.subtype==='prestamo')return '🏦';
  if(a.type==='activo')return '🏦';
  return '💸';
}
function accountOptionsByCur(cur,selectedId){
  const accs=S.accounts.filter(a=>(a.currency||S.currency)===cur);
  let opts='<option value="">Seleccionar cuenta</option>';
  accs.forEach(a=>{
    const icon=getAccIcon(a);
    opts+=`<option value="${a.id}" ${a.id===selectedId?'selected':''}>${icon} ${a.name}</option>`;
    if(a.type==='activo'&&a.subAccounts&&a.subAccounts.length){
      a.subAccounts.forEach(sb=>{
        const key=a.id+'|'+sb.id;
        opts+=`<option value="${key}" ${key===selectedId?'selected':''}>&nbsp;&nbsp;↳ ${sb.icon||'🐷'} ${sb.name} (${a.name})</option>`;
      });
    }
  });
  return opts;
}
function toggleAutoPayment(){
  const el=document.getElementById('auto-toggle');const h=document.getElementById('pay-is-auto');
  if(!el||!h)return;
  const isOn=h.value==='1';h.value=isOn?'0':'1';
  el.style.background=isOn?'var(--surface3)':'var(--primary)';
  el.querySelector('div').style.left=isOn?'3px':'23px';
}
function savePayment(){
  const name=document.getElementById('pay-name')?.value?.trim();const amount=parseFloat(document.getElementById('pay-amount')?.value);const nextDate=document.getElementById('pay-next')?.value;
  if(!name){toast('Ingresa un nombre');return;}if(!amount||amount<=0){toast('Ingresa un monto válido');return;}if(!nextDate){toast('Selecciona fecha');return;}
  const id=document.getElementById('pay-id')?.value;const existing=id?S.scheduledPayments.find(p=>p.id===id):null;
  const pay={id:existing?existing.id:uid(),name,amount,currency:document.getElementById('pay-currency')?.value||S.currency,categoryId:document.getElementById('pay-cat')?.value||'',subcategoryId:document.getElementById('pay-sub')?.value||'',frequency:document.getElementById('pay-freq')?.value||'Mensual',nextDate,accountId:document.getElementById('pay-account')?.value||'',isAuto:document.getElementById('pay-is-auto')?.value==='1',color:document.getElementById('pay-color-val')?.value||COLORS_PALETTE[0]};
  var _payMsg=existing?'Actualizado ✓':'Pago programado ✓';
  completeAction(function(){if(existing){var idx=S.scheduledPayments.findIndex(function(p){return p.id===id;});S.scheduledPayments[idx]=stampItem(pay);}else{S.scheduledPayments.push(stampItem(pay));};},'pagos',_payMsg);
}
function deletePayment(id){confirmDialog('🗑️','¿Eliminar pago?','',()=>{completeAction(function(){S.scheduledPayments=softDelete(S.scheduledPayments,id);},'pagos','Eliminado');});}

// ─── CATEGORY MODAL ───
function buildCategoryModal(data){
  const defType=data.defaultType||S._catTab||'gasto';
  const isIngreso=defType==='ingreso';
  const isTransf=defType==='transferencia';
  const locked=!!data.lockedType;
  const lockedNature=data.lockedNature||'';
  const lockedGroup=!!lockedNature; // full lock: type + nature from sheet
  // Nature/income defaults
  const natureMap={necesidades:'\uD83C\uDFE0 Necesidades',deseos:'\uD83C\uDFAF Deseos',ahorros:'\uD83D\uDCB0 Ahorros'};
  const incomeMap={principal:'\u2B50 Principal',secundario:'\u2795 Secundario'};
  const isLockedIncome=lockedNature==='principal'||lockedNature==='secundario';
  const defNature=isLockedIncome?'necesidades':(lockedNature||'necesidades');
  const defIncome=isLockedIncome?lockedNature:'principal';
  const natureLbl=natureMap[defNature]||'\uD83C\uDFE0 Necesidades';
  const incomeLbl=incomeMap[defIncome]||'\u2B50 Principal';
  const typeOpts=[['gasto','Gasto'],['ingreso','Ingreso'],['transferencia','Transferencia']];
  const typeLabel=typeOpts.find(o=>o[0]===defType)?.[1]||'Seleccionar';
  const typeEmoji=isTransf?'\u21D4\uFE0F':isIngreso?'\uD83D\uDCCA':'\uD83D\uDCB8';
  // Banner label for locked group (from sheet)
  var groupLabel='';
  if(lockedGroup){
    if(isTransf)groupLabel='\u21D4\uFE0F Transferencia';
    else if(isLockedIncome)groupLabel=incomeLbl;
    else groupLabel=natureLbl;
  }
  // Type-locked banner (from header Nueva button — locked type, free nature)
  var typeBannerHtml='';
  if(locked&&!lockedGroup){
    typeBannerHtml=
      '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.25);border-radius:var(--radius-sm);margin-bottom:14px">'+
      '<span style="font-size:16px">📌</span>'+
      '<div style="font-size:13px;color:var(--primary);font-weight:600">Tipo: '+typeEmoji+' '+typeLabel+'</div>'+
      '<input type="hidden" id="cat-type" value="'+defType+'">'+
      '</div>';
  }
  // Full group-locked section (type + nature hidden)
  var fullLockHtml='';
  if(lockedGroup){
    fullLockHtml=
      '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.25);border-radius:var(--radius-sm);margin-bottom:14px">'+
      '<span style="font-size:16px">📌</span>'+
      '<div style="font-size:13px;color:var(--primary);font-weight:600">Grupo: '+groupLabel+'</div>'+
      '<input type="hidden" id="cat-type" value="'+defType+'">'+
      '<input type="hidden" id="cat-nature" value="'+defNature+'">'+
      '<input type="hidden" id="cat-income-type" value="'+defIncome+'">'+
      '</div>';
  }
  // Free type selector (no lock)
  var typeSelectorHtml='';
  if(!locked){
    typeSelectorHtml=
      '<div class="form-group"><label class="form-label">Tipo</label>'+
      '<div class="bs-trigger" onclick="showBS_catType()">'+
      '<span style="font-size:14px;color:var(--text)" id="cat-type-lbl">'+typeLabel+'</span>'+
      '<span style="color:var(--text3);font-size:18px">›</span>'+
      '</div>'+
      '<input type="hidden" id="cat-type" value="'+defType+'">'+
      '</div>';
  }
  // Nature/incomeType selectors (shown when type is not fully locked)
  var natureSelectorHtml='';
  if(!lockedGroup){
    natureSelectorHtml=
      '<div id="cat-nature-group" class="form-group" style="display:'+(isIngreso||isTransf?'none':'block')+'">'+
      '<label class="form-label">Naturaleza</label>'+
      '<div class="bs-trigger" onclick="showBS_catNature()">'+
      '<span style="font-size:14px;color:var(--text)" id="cat-nature-lbl">'+natureLbl+'</span>'+
      '<span style="color:var(--text3);font-size:18px">›</span>'+
      '</div>'+
      '<input type="hidden" id="cat-nature" value="'+defNature+'">'+
      '</div>'+
      '<div id="cat-income-type-group" class="form-group" style="display:'+(isIngreso?'block':'none')+'">'+
      '<label class="form-label">Tipo de ingreso</label>'+
      '<div class="bs-trigger" onclick="showBS_catIncome()">'+
      '<span style="font-size:14px;color:var(--text)" id="cat-income-lbl">'+incomeLbl+'</span>'+
      '<span style="color:var(--text3);font-size:18px">›</span>'+
      '</div>'+
      '<input type="hidden" id="cat-income-type" value="'+defIncome+'">'+
      '</div>';
  }
  return'<div class="modal-header"><div class="modal-title">Nueva categoría</div><button class="modal-close" onclick="closeModal()">×</button></div>'+
  '<div class="modal-body">'+
  fullLockHtml+
  typeBannerHtml+
  typeSelectorHtml+
  natureSelectorHtml+
  '<div class="form-group"><label class="form-label">Nombre</label><input class="form-input" type="text" id="cat-name" placeholder="Ej: Mascotas"></div>'+
  '<div class="form-group"><label class="form-label">Ícono</label>'+iconPickerHtml(ICONS[0],'cat-icon-val')+'</div>'+
  '<div class="form-group"><label class="form-label">Color</label>'+colorPickerHtml(COLORS_PALETTE[0],'cat-color-val')+'</div>'+
  '<button class="btn btn-primary" onclick="saveCategory()">Crear categoría</button>'+
  '</div>';
}function updateCatModalFields(type){
  const ng=document.getElementById('cat-nature-group');
  const ig=document.getElementById('cat-income-type-group');
  if(ng)ng.style.display=type==='ingreso'?'none':'block';
  if(ig)ig.style.display=type==='ingreso'?'block':'none';
}
function saveCategory(){
  const name=document.getElementById('cat-name')?.value?.trim();if(!name){toast('Ingresa un nombre');return;}
  const catType=document.getElementById('cat-type')?.value||'gasto';
  const cat={id:uid(),name,type:catType,nature:catType==='ingreso'?'ahorros':(document.getElementById('cat-nature')?.value||'necesidades'),incomeType:catType==='ingreso'?(document.getElementById('cat-income-type')?.value||'principal'):undefined,color:document.getElementById('cat-color-val')?.value||COLORS_PALETTE[0],icon:document.getElementById('cat-icon-val')?.value||ICONS[0]};
  S.categories.push(stampItem(cat));saveState();closeModal();refreshNatureSheet();var cpnl=document.getElementById('cat-panel-list');if(cpnl)cpnl.innerHTML=renderCatList(S._catTab||'gasto');if(S.currentPage==='configuracion')renderPage('configuracion');else renderPage('categorias');toast('Categoría creada ✓');
  setTimeout(function(){confirmDialog('🏷️','¿Agregar subcategoría?','¿Deseas crear una subcategoría para "'+cat.name+'" ahora?',function(){openModal('subcategory',{categoryId:cat.id});},'Sí, agregar','btn-primary');},300);
}

// ─── SUBCATEGORY MODAL ───
function buildSubcategoryModal(data){
  const cat=getCat(data.categoryId);
  return`<div class="modal-header"><div class="modal-title">Nueva subcategoría</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <input type="hidden" id="sub-catid" value="${data.categoryId||''}">
    <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px;margin-bottom:14px;font-size:13px">${cat?`Categoría padre: <strong>${cat.icon} ${cat.name}</strong>`:'Selecciona categoría'}</div>
    ${!cat?`<div class="form-group"><label class="form-label">Categoría</label><select class="form-select" id="sub-parent-cat" onchange="document.getElementById('sub-catid').value=this.value"><option value="">Seleccionar</option>${S.categories.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}</select></div>`:''}
    <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" type="text" id="sub-name" placeholder="Ej: Supermercado"></div>
    <div class="form-group"><label class="form-label">Ícono</label>${iconPickerHtml(ICONS[1],'sub-icon-val')}</div>
    <button class="btn btn-primary" onclick="saveSubcategory()">Crear subcategoría</button>
  </div>`;
}
function saveSubcategory(){
  const catId=document.getElementById('sub-catid')?.value||document.getElementById('sub-parent-cat')?.value;
  const name=document.getElementById('sub-name')?.value?.trim();
  if(!catId){toast('Selecciona una categoría');return;}if(!name){toast('Ingresa un nombre');return;}
  S.subcategories.push(stampItem({id:uid(),categoryId:catId,name,icon:document.getElementById('sub-icon-val')?.value||ICONS[1]}));
  saveState();closeModal();refreshNatureSheet();var cpnl=document.getElementById('cat-panel-list');if(cpnl)cpnl.innerHTML=renderCatList(S._catTab||'gasto');if(S.currentPage==='configuracion')renderPage('configuracion');else renderPage('categorias');toast('Subcategoría creada ✓');
}

// ─── EDIT SUBCATEGORY MODAL ───
function buildEditSubcategoryModal(data){
  const sub=S.subcategories.find(s=>s.id===data.id);
  if(!sub)return'';
  const cat=getCat(sub.categoryId);
  return`<div class="modal-header"><div class="modal-title">Editar subcategoría</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px;margin-bottom:14px;font-size:13px">${cat?`Categoría: <strong>${cat.icon} ${cat.name}</strong>`:'Sin categoría'}</div>
    <input type="hidden" id="esub-id" value="${sub.id}">
    <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" type="text" id="esub-name" value="${sub.name}" placeholder="Nombre"></div>
    <div class="form-group"><label class="form-label">Ícono</label>${iconPickerHtml(sub.icon||ICONS[1],'esub-icon-val')}</div>
    <button class="btn btn-primary" onclick="saveEditSubcategory()">Guardar</button>
  </div>`;
}
function saveEditSubcategory(){
  const id=document.getElementById('esub-id')?.value;
  const name=document.getElementById('esub-name')?.value?.trim();
  if(!name){toast('Ingresa un nombre');return;}
  const sub=S.subcategories.find(s=>s.id===id);
  if(!sub)return;
  sub.name=name;
  sub.icon=document.getElementById('esub-icon-val')?.value||sub.icon;
  saveState();closeModal();
  refreshNatureSheet();
  const cpnl=document.getElementById('cat-panel-list');
  if(cpnl)cpnl.innerHTML=renderCatList(S._catTab||'gasto');
  toast('Subcategoría actualizada ✓');
}
// ─── FILTER MODAL ───
function buildFilterModal(){
  const f=S.movFilter;
  return`<div class="modal-header"><div class="modal-title">Filtrar movimientos</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <div class="form-row"><div class="form-group"><label class="form-label">Desde</label><input class="form-input" type="date" id="fil-from" value="${f.dateFrom}"></div><div class="form-group"><label class="form-label">Hasta</label><input class="form-input" type="date" id="fil-to" value="${f.dateTo}"></div></div>
    <div class="form-group"><label class="form-label">Categoría</label><select class="form-select" id="fil-cat"><option value="">Todas</option>${S.categories.map(c=>`<option value="${c.id}" ${f.catId===c.id?'selected':''}>${c.icon} ${c.name}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Cuenta</label><select class="form-select" id="fil-acc"><option value="">Todas</option>${S.accounts.map(a=>`<option value="${a.id}" ${f.accountId===a.id?'selected':''}>${a.icon||'💳'} ${a.name}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Medio de pago</label><select class="form-select" id="fil-pay"><option value="">Todos</option>${PAYMENT_METHODS.map(m=>`<option value="${m}" ${f.payMethod===m?'selected':''}>${m}</option>`).join('')}</select></div>
    <div class="btn-row"><button class="btn btn-secondary" onclick="clearFilters()">Limpiar</button><button class="btn btn-primary" onclick="applyFilters()">Aplicar</button></div>
  </div>`;
}
function applyFilters(){S.movFilter.dateFrom=document.getElementById('fil-from')?.value||'';S.movFilter.dateTo=document.getElementById('fil-to')?.value||'';S.movFilter.catId=document.getElementById('fil-cat')?.value||'';S.movFilter.accountId=document.getElementById('fil-acc')?.value||'';S.movFilter.payMethod=document.getElementById('fil-pay')?.value||'';closeModal();renderPage('movimientos');}
function clearFilters(){S.movFilter={tab:S.movFilter.tab,search:S.movFilter.search,dateFrom:'',dateTo:'',catId:'',accountId:'',payMethod:''};closeModal();renderPage('movimientos');}


// ════════════════════════════════════════════════════════════
// LISTAS DE COMPRA
// ════════════════════════════════════════════════════════════
const LISTA_TIPOS = [
  {id:'supermercado',icon:'🛒',name:'Supermercado'},
  {id:'farmacia',icon:'💊',name:'Farmacia'},
  {id:'hogar',icon:'🏠',name:'Hogar y limpieza'},
  {id:'ropa',icon:'👗',name:'Ropa y personal'},
  {id:'regalos',icon:'🎁',name:'Regalos'},
  {id:'custom',icon:'📋',name:'Personalizada'},
];


function renderListas(){
  const lists = S.shoppingLists||[];
  return `
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-primary btn-sm" onclick="openModal('newList',{})">+ Nueva lista</button>
    </div>
    ${!lists.length?`<div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-title">Sin listas</div><div class="empty-desc">Crea tu primera lista de compras</div></div>`:
    lists.map(l=>{
      const done = (l.items||[]).filter(i=>i.done).length;
      const total = (l.items||[]).length;
      const totalPrice = (l.items||[]).reduce((s,i)=>(s+(parseFloat(i.price)||0)*(parseFloat(i.qty)||1)),0);
      const pct = total>0?Math.round(done/total*100):0;
      const tipo = LISTA_TIPOS.find(t=>t.id===l.type)||LISTA_TIPOS[5];
      return `<div class="card" style="margin-bottom:12px;cursor:pointer" onclick="openListDetail('${l.id}')">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <div style="width:44px;height:44px;border-radius:12px;background:${l.color||'#00D4AA'}22;display:flex;align-items:center;justify-content:center;font-size:22px">${tipo.icon}</div>
          <div style="flex:1">
            <div style="font-size:15px;font-weight:700">${l.name}</div>
            <div style="font-size:12px;color:var(--text2)">${done}/${total} ítems · ${totalPrice>0?fmt(totalPrice):''}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:800;color:${pct===100?'var(--success)':'var(--primary)'}">${pct}%</div>
            <button onclick="event.stopPropagation();deleteList('${l.id}')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px">🗑</button>
          </div>
        </div>
        <div style="height:6px;background:var(--surface3);border-radius:99px;overflow:hidden">
          <div style="height:100%;border-radius:99px;background:${pct===100?'var(--success)':'var(--primary)'};width:${pct}%;transition:width .3s"></div>
        </div>
      </div>`;
    }).join('')}
  `;
}

// ══ SECTIONS PER LIST TYPE ══
const LIST_SECTIONS = {
  supermercado: ['🥛 Lácteos','🥩 Carnes y proteínas','🥦 Frutas','🫑 Verduras','🍞 Panadería','🥫 Abarrotes','🧴 Aseo personal','🧹 Limpieza hogar','🍷 Bebidas','❄️ Congelados','🐾 Mascotas','📦 Otros'],
  farmacia:     ['💊 Medicamentos','🌿 Vitaminas y suplementos','🩹 Primeros auxilios','🧴 Cuidado personal','💄 Belleza','👶 Bebé','🦷 Salud bucal','👁️ Óptica'],
  hogar:        ['🧹 Limpieza general','🪣 Cocina','🚿 Baño','🛏️ Dormitorio','🔧 Mantenimiento','💡 Electricidad','🌱 Jardín','🛋️ Decoración'],
  ropa:         ['👕 Ropa casual','👔 Ropa formal','🏃 Ropa deportiva','👟 Calzado','👜 Accesorios','🧴 Cuidado personal','👙 Ropa interior','🧥 Abrigos'],
  regalos:      ['👨‍👩‍👧 Familia','👫 Amigos','💼 Trabajo','🎉 Ocasiones especiales','💝 Parejas','🎓 Graduaciones'],
  custom:       [],
};
const DEFAULT_LIST_ITEMS = {
  supermercado:[
    {name:'Leche entera',section:'🥛 Lácteos'},{name:'Leche descremada',section:'🥛 Lácteos'},{name:'Queso blanco',section:'🥛 Lácteos'},{name:'Queso mozzarella',section:'🥛 Lácteos'},{name:'Yogur natural',section:'🥛 Lácteos'},{name:'Crema de leche',section:'🥛 Lácteos'},{name:'Mantequilla',section:'🥛 Lácteos'},
    {name:'Pechuga de pollo',section:'🥩 Carnes y proteínas'},{name:'Muslos de pollo',section:'🥩 Carnes y proteínas'},{name:'Carne molida',section:'🥩 Carnes y proteínas'},{name:'Bistec',section:'🥩 Carnes y proteínas'},{name:'Cerdo',section:'🥩 Carnes y proteínas'},{name:'Atún en lata',section:'🥩 Carnes y proteínas'},{name:'Sardinas',section:'🥩 Carnes y proteínas'},{name:'Huevos',section:'🥩 Carnes y proteínas'},{name:'Jamón',section:'🥩 Carnes y proteínas'},{name:'Salchichas',section:'🥩 Carnes y proteínas'},
    {name:'Manzana',section:'🥦 Frutas'},{name:'Banano',section:'🥦 Frutas'},{name:'Naranja',section:'🥦 Frutas'},{name:'Mango',section:'🥦 Frutas'},{name:'Fresa',section:'🥦 Frutas'},{name:'Uvas',section:'🥦 Frutas'},{name:'Melón',section:'🥦 Frutas'},{name:'Piña',section:'🥦 Frutas'},
    {name:'Tomate',section:'🫑 Verduras'},{name:'Cebolla',section:'🫑 Verduras'},{name:'Ajo',section:'🫑 Verduras'},{name:'Lechuga',section:'🫑 Verduras'},{name:'Zanahoria',section:'🫑 Verduras'},{name:'Papa',section:'🫑 Verduras'},{name:'Pimiento',section:'🫑 Verduras'},{name:'Brócoli',section:'🫑 Verduras'},{name:'Espinaca',section:'🫑 Verduras'},{name:'Pepino',section:'🫑 Verduras'},
    {name:'Pan tajado',section:'🍞 Panadería'},{name:'Pan integral',section:'🍞 Panadería'},{name:'Arepa',section:'🍞 Panadería'},{name:'Croissant',section:'🍞 Panadería'},{name:'Tostadas',section:'🍞 Panadería'},
    {name:'Arroz',section:'🥫 Abarrotes'},{name:'Pasta',section:'🥫 Abarrotes'},{name:'Aceite vegetal',section:'🥫 Abarrotes'},{name:'Aceite de oliva',section:'🥫 Abarrotes'},{name:'Sal',section:'🥫 Abarrotes'},{name:'Azúcar',section:'🥫 Abarrotes'},{name:'Café',section:'🥫 Abarrotes'},{name:'Frijoles',section:'🥫 Abarrotes'},{name:'Lentejas',section:'🥫 Abarrotes'},{name:'Harina',section:'🥫 Abarrotes'},{name:'Avena',section:'🥫 Abarrotes'},{name:'Salsa de tomate',section:'🥫 Abarrotes'},{name:'Mayonesa',section:'🥫 Abarrotes'},{name:'Vinagre',section:'🥫 Abarrotes'},{name:'Maíz en lata',section:'🥫 Abarrotes'},
    {name:'Jabón de baño',section:'🧴 Aseo personal'},{name:'Shampoo',section:'🧴 Aseo personal'},{name:'Acondicionador',section:'🧴 Aseo personal'},{name:'Papel higiénico',section:'🧴 Aseo personal'},{name:'Pasta dental',section:'🧴 Aseo personal'},{name:'Cepillo de dientes',section:'🧴 Aseo personal'},{name:'Desodorante',section:'🧴 Aseo personal'},{name:'Toallas húmedas',section:'🧴 Aseo personal'},
    {name:'Detergente ropa',section:'🧹 Limpieza hogar'},{name:'Suavizante ropa',section:'🧹 Limpieza hogar'},{name:'Limpiapisos',section:'🧹 Limpieza hogar'},{name:'Desinfectante',section:'🧹 Limpieza hogar'},{name:'Esponja',section:'🧹 Limpieza hogar'},{name:'Bolsas de basura',section:'🧹 Limpieza hogar'},{name:'Servilletas',section:'🧹 Limpieza hogar'},{name:'Papel de cocina',section:'🧹 Limpieza hogar'},
    {name:'Agua',section:'🍷 Bebidas'},{name:'Jugo natural',section:'🍷 Bebidas'},{name:'Gaseosa',section:'🍷 Bebidas'},{name:'Té',section:'🍷 Bebidas'},{name:'Cerveza',section:'🍷 Bebidas'},{name:'Vino',section:'🍷 Bebidas'},
    {name:'Nuggets',section:'❄️ Congelados'},{name:'Pizza congelada',section:'❄️ Congelados'},{name:'Verduras congeladas',section:'❄️ Congelados'},{name:'Helado',section:'❄️ Congelados'},
    {name:'Comida de perro',section:'🐾 Mascotas'},{name:'Comida de gato',section:'🐾 Mascotas'},{name:'Arena para gato',section:'🐾 Mascotas'},
  ],
  farmacia:[
    {name:'Ibuprofeno',section:'💊 Medicamentos'},{name:'Acetaminofén',section:'💊 Medicamentos'},{name:'Aspirina',section:'💊 Medicamentos'},{name:'Antiácido',section:'💊 Medicamentos'},{name:'Antihistamínico',section:'💊 Medicamentos'},{name:'Antigripal',section:'💊 Medicamentos'},{name:'Antidiarreico',section:'💊 Medicamentos'},
    {name:'Vitamina C',section:'🌿 Vitaminas y suplementos'},{name:'Vitamina D',section:'🌿 Vitaminas y suplementos'},{name:'Complejo B',section:'🌿 Vitaminas y suplementos'},{name:'Hierro',section:'🌿 Vitaminas y suplementos'},{name:'Calcio',section:'🌿 Vitaminas y suplementos'},{name:'Omega 3',section:'🌿 Vitaminas y suplementos'},{name:'Magnesio',section:'🌿 Vitaminas y suplementos'},
    {name:'Curitas / Banditas',section:'🩹 Primeros auxilios'},{name:'Alcohol antiséptico',section:'🩹 Primeros auxilios'},{name:'Agua oxigenada',section:'🩹 Primeros auxilios'},{name:'Gasa',section:'🩹 Primeros auxilios'},{name:'Termómetro',section:'🩹 Primeros auxilios'},{name:'Vendaje elástico',section:'🩹 Primeros auxilios'},
    {name:'Crema hidratante',section:'🧴 Cuidado personal'},{name:'Protector solar',section:'🧴 Cuidado personal'},{name:'Gel de ducha',section:'🧴 Cuidado personal'},{name:'Toallas sanitarias',section:'🧴 Cuidado personal'},{name:'Tampones',section:'🧴 Cuidado personal'},
    {name:'Maquillaje',section:'💄 Belleza'},{name:'Desmaquillante',section:'💄 Belleza'},{name:'Esmalte de uñas',section:'💄 Belleza'},{name:'Tinte de cabello',section:'💄 Belleza'},
    {name:'Pañales',section:'👶 Bebé'},{name:'Toallitas bebé',section:'👶 Bebé'},{name:'Crema antipañalitis',section:'👶 Bebé'},{name:'Shampoo bebé',section:'👶 Bebé'},
    {name:'Pasta dental',section:'🦷 Salud bucal'},{name:'Hilo dental',section:'🦷 Salud bucal'},{name:'Enjuague bucal',section:'🦷 Salud bucal'},{name:'Cepillo de dientes',section:'🦷 Salud bucal'},
    {name:'Gotas oculares',section:'👁️ Óptica'},{name:'Solución lentes de contacto',section:'👁️ Óptica'},
  ],
  hogar:[
    {name:'Detergente multiusos',section:'🧹 Limpieza general'},{name:'Desinfectante',section:'🧹 Limpieza general'},{name:'Bolsas de basura',section:'🧹 Limpieza general'},{name:'Guantes de caucho',section:'🧹 Limpieza general'},{name:'Trapeador',section:'🧹 Limpieza general'},{name:'Escoba',section:'🧹 Limpieza general'},{name:'Recogedor',section:'🧹 Limpieza general'},
    {name:'Esponja de cocina',section:'🪣 Cocina'},{name:'Lavavajillas',section:'🪣 Cocina'},{name:'Papel aluminio',section:'🪣 Cocina'},{name:'Papel film',section:'🪣 Cocina'},{name:'Toallas de cocina',section:'🪣 Cocina'},{name:'Filtros de café',section:'🪣 Cocina'},
    {name:'Desengrasante baño',section:'🚿 Baño'},{name:'Limpiador de inodoro',section:'🚿 Baño'},{name:'Papel higiénico',section:'🚿 Baño'},{name:'Cortina de ducha',section:'🚿 Baño'},
    {name:'Sábanas',section:'🛏️ Dormitorio'},{name:'Almohada',section:'🛏️ Dormitorio'},{name:'Cobija',section:'🛏️ Dormitorio'},
    {name:'Bombillo LED',section:'💡 Electricidad'},{name:'Pila AA',section:'💡 Electricidad'},{name:'Pila AAA',section:'💡 Electricidad'},{name:'Extensión eléctrica',section:'💡 Electricidad'},
    {name:'Cinta de enmascarar',section:'🔧 Mantenimiento'},{name:'Tornillos',section:'🔧 Mantenimiento'},{name:'Silicona',section:'🔧 Mantenimiento'},{name:'Pintura',section:'🔧 Mantenimiento'},
    {name:'Tierra para plantas',section:'🌱 Jardín'},{name:'Abono',section:'🌱 Jardín'},{name:'Macetas',section:'🌱 Jardín'},{name:'Semillas',section:'🌱 Jardín'},
    {name:'Velas decorativas',section:'🛋️ Decoración'},{name:'Cuadro',section:'🛋️ Decoración'},{name:'Cojines',section:'🛋️ Decoración'},
  ],
  ropa:[
    {name:'Camiseta',section:'👕 Ropa casual'},{name:'Camiseta polo',section:'👕 Ropa casual'},{name:'Pantalón jean',section:'👕 Ropa casual'},{name:'Sudadera',section:'👕 Ropa casual'},{name:'Medias',section:'👕 Ropa casual'},{name:'Pijama',section:'👕 Ropa casual'},
    {name:'Camisa formal',section:'👔 Ropa formal'},{name:'Pantalón formal',section:'👔 Ropa formal'},{name:'Blazer',section:'👔 Ropa formal'},{name:'Corbata',section:'👔 Ropa formal'},{name:'Vestido',section:'👔 Ropa formal'},
    {name:'Camiseta deportiva',section:'🏃 Ropa deportiva'},{name:'Pantaloneta',section:'🏃 Ropa deportiva'},{name:'Licra',section:'🏃 Ropa deportiva'},{name:'Calcetines deportivos',section:'🏃 Ropa deportiva'},
    {name:'Zapatos vestir',section:'👟 Calzado'},{name:'Tenis',section:'👟 Calzado'},{name:'Sandalias',section:'👟 Calzado'},{name:'Botas',section:'👟 Calzado'},
    {name:'Cinturón',section:'👜 Accesorios'},{name:'Bolso',section:'👜 Accesorios'},{name:'Gorra',section:'👜 Accesorios'},{name:'Gafas de sol',section:'👜 Accesorios'},{name:'Bufanda',section:'👜 Accesorios'},
    {name:'Crema corporal',section:'🧴 Cuidado personal'},{name:'Perfume',section:'🧴 Cuidado personal'},
    {name:'Ropa interior',section:'👙 Ropa interior'},{name:'Bra',section:'👙 Ropa interior'},{name:'Boxer',section:'👙 Ropa interior'},
    {name:'Chaqueta',section:'🧥 Abrigos'},{name:'Impermeable',section:'🧥 Abrigos'},
  ],
  regalos:[
    {name:'Regalo de cumpleaños',section:'👨‍👩‍👧 Familia'},{name:'Papel de regalo',section:'👨‍👩‍👧 Familia'},{name:'Moño',section:'👨‍👩‍👧 Familia'},{name:'Tarjeta de felicitación',section:'👨‍👩‍👧 Familia'},
    {name:'Tarjeta de regalo',section:'👫 Amigos'},{name:'Vino',section:'👫 Amigos'},{name:'Flores',section:'👫 Amigos'},
    {name:'Detalle corporativo',section:'💼 Trabajo'},{name:'Agenda',section:'💼 Trabajo'},{name:'Set de escritorio',section:'💼 Trabajo'},
    {name:'Globos',section:'🎉 Ocasiones especiales'},{name:'Decoración fiesta',section:'🎉 Ocasiones especiales'},{name:'Torta',section:'🎉 Ocasiones especiales'},
    {name:'Chocolates',section:'💝 Parejas'},{name:'Flores',section:'💝 Parejas'},{name:'Peluche',section:'💝 Parejas'},{name:'Velas aromáticas',section:'💝 Parejas'},
    {name:'Marco de fotos',section:'🎓 Graduaciones'},{name:'Maletín',section:'🎓 Graduaciones'},{name:'Reloj',section:'🎓 Graduaciones'},
  ],
  custom:[],
};

// ══ HELPER: get sections for a list (includes user-created ones) ══
function getListSections(l){
  var base = LIST_SECTIONS[l.type]||[];
  // Add any custom sections that exist in items but not in base
  var extra = [];
  (l.items||[]).forEach(function(i){
    if(i.section && base.indexOf(i.section)<0 && extra.indexOf(i.section)<0) extra.push(i.section);
  });
  // Also include manually added sections stored on list
  (l.customSections||[]).forEach(function(s){
    if(base.indexOf(s)<0 && extra.indexOf(s)<0) extra.push(s);
  });
  return base.concat(extra);
}

// ══ RENDER LIST ITEMS — ticked items sink to bottom, section select-all ══
function renderListItems(l){
  var items = l.items||[];
  var container = document.getElementById('list-items-container');
  if(!container) return;
  var done = items.filter(function(i){return i.done;}).length;
  var cntEl = document.getElementById('list-summary-cnt');
  if(cntEl) cntEl.textContent = done+'/'+items.length;
  if(!items.length){
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Lista vacía</div><div class="empty-desc">Agrega ítems abajo</div></div>';
    return;
  }
  var html = '';
  var sections = getListSections(l);

  if(sections.length){
    var pendingBySection = {}, doneBySection = {};
    sections.forEach(function(s){ pendingBySection[s]=[]; doneBySection[s]=[]; });
    var pendingNoSection = [], doneNoSection = [];

    items.forEach(function(i){
      var sec = i.section||'';
      var inSections = sec && sections.indexOf(sec)>=0;
      if(i.done){
        if(inSections) doneBySection[sec].push(i);
        else doneNoSection.push(i);
      } else {
        if(inSections) pendingBySection[sec].push(i);
        else pendingNoSection.push(i);
      }
    });

    // Render sections that have at least 1 pending item
    sections.forEach(function(sec){
      var pending = pendingBySection[sec]||[];
      var done_s  = doneBySection[sec]||[];
      if(!pending.length && !done_s.length) return;
      if(!pending.length) return; // all done → goes to floatingDone below
      var q="'";
      var total = pending.length + done_s.length;
      var doneCount = done_s.length;
      html += '<div style="margin-top:8px">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0 4px;border-bottom:1px solid var(--border)">'
        +'<span style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.6px">'+sec+'</span>'
        +'<div style="display:flex;align-items:center;gap:6px">'
        +'<span style="font-size:11px;color:var(--text3)">'+doneCount+'/'+total+'</span>'
        +'<button onclick="toggleSection('+q+l.id+q+','+q+sec+q+')" style="background:none;border:1px solid var(--border);border-radius:6px;color:var(--text2);font-size:11px;padding:2px 8px;cursor:pointer;font-family:var(--font)">☑ Todo</button>'
        +'</div></div>';
      pending.forEach(function(i){ html += buildListItemHTML(l.id, i); });
      html += '</div>';
    });

    // Pending items without a section
    if(pendingNoSection.length){
      html += '<div style="margin-top:8px"><div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.6px;padding:8px 0 4px;border-bottom:1px solid var(--border)">📦 Otros</div>';
      pendingNoSection.forEach(function(i){ html += buildListItemHTML(l.id, i); });
      html += '</div>';
    }

    // ALL done items go to floating zone (individual ticked OR full section ticked)
    var floatingDone = [];
    sections.forEach(function(sec){
      floatingDone = floatingDone.concat(doneBySection[sec]||[]);
    });
    floatingDone = floatingDone.concat(doneNoSection);
    if(floatingDone.length){
      html += '<div style="margin-top:12px;opacity:.65"><div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;padding:6px 0;border-top:1px dashed var(--border)">✓ Tachados</div>';
      floatingDone.forEach(function(i){ html += buildListItemHTML(l.id, i); });
      html += '</div>';
    }

  } else {
    // No sections — pending first, done at bottom
    var pending = items.filter(function(i){return !i.done;});
    var doneAll = items.filter(function(i){return i.done;});
    pending.forEach(function(i){ html += buildListItemHTML(l.id, i); });
    if(doneAll.length){
      html += '<div style="margin-top:12px;opacity:.65"><div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;padding:6px 0;border-top:1px dashed var(--border)">✓ Tachados</div>';
      doneAll.forEach(function(i){ html += buildListItemHTML(l.id, i); });
      html += '</div>';
    }
  }
  container.innerHTML = html;
}

// ══ TOGGLE ALL ITEMS IN A SECTION ══
function toggleSection(listId, section){
  var l = (S.shoppingLists||[]).find(function(x){return x.id===listId;});
  if(!l) return;
  var secItems = (l.items||[]).filter(function(i){return i.section===section;});
  var allDone = secItems.every(function(i){return i.done;});
  secItems.forEach(function(i){i.done = !allDone;});
  saveState();
  renderListItems(l);
}

// ══ LIMPIAR = RESTORE (uncheck ticked items) ══
function clearDoneItems(listId){
  var l = (S.shoppingLists||[]).find(function(x){return x.id===listId;});
  if(!l) return;
  (l.items||[]).forEach(function(i){ i.done = false; });
  saveState();
  renderListItems(l);
}

// ══ BUILD LIST DETAIL HTML ══
function buildListDetailHTML(l){
  var tipo = LISTA_TIPOS.find(function(t){return t.id===l.type;})||LISTA_TIPOS[5];
  var items = l.items||[];
  var sections = getListSections(l);
  var q="'";
  // Section selector for add-item bar
  var secSelect = '';
  if(sections.length){
    secSelect = '<select class="form-select" id="list-new-section" style="flex:1;font-size:13px"><option value="">Sección</option>'
      +sections.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('')
      +'</select>';
  }
  // Add section button for custom lists
  var addSecBtn = '<button onclick="addCustomSection('+q+l.id+q+')" style="flex:1;background:none;border:1px solid var(--border);border-radius:8px;color:var(--primary);font-size:13px;padding:8px 4px;cursor:pointer;font-family:var(--font)">+ Sección</button>';
  return '<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0">'
    +'<button onclick="closeListDetail()" style="width:36px;height:36px;border-radius:50%;border:none;background:transparent;color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>'
    +'<div style="font-size:20px">'+tipo.icon+'</div>'
    +'<div style="flex:1"><div style="font-size:17px;font-weight:800">'+l.name+'</div></div>'
    +'<button onclick="shareList('+q+l.id+q+')" style="background:none;border:none;color:var(--primary);font-size:20px;cursor:pointer">📤</button>'
    +'</div>'
    +'<div style="padding:10px 16px;background:var(--surface2);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'
    +'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.6px">Ítems</span><span id="list-summary-cnt" style="font-size:16px;font-weight:800;color:var(--primary)">'+items.filter(function(i){return i.done;}).length+'/'+items.length+'</span></div>'
    +'<button onclick="clearDoneItems('+q+l.id+q+')" style="background:none;border:1px solid var(--border);border-radius:50px;color:var(--primary);font-size:12px;padding:5px 12px;cursor:pointer;font-family:var(--font)">↺ Restaurar</button>'
    +'</div>'
    +'<div style="flex:1;overflow-y:auto;padding:12px 16px" id="list-items-container"></div>'
    +'<div id="list-add-bar" style="padding:10px 16px;border-top:1px solid var(--border);background:var(--surface);flex-shrink:0">'
    +'<div style="display:flex;gap:8px;margin-bottom:'+(sections.length?'8':'0')+'px">'
    +'<input class="form-input" type="text" id="list-new-item" placeholder="Agregar ítem..." style="flex:1" onkeydown="if(event.key===\'Enter\')addListItem('+q+l.id+q+')">'
    +'<button class="btn btn-primary btn-sm" onclick="addListItem('+q+l.id+q+')" style="padding:0 20px;font-size:22px;font-weight:300;line-height:1">+</button>'
    +'</div>'
    +(sections.length ? ('<div style="display:flex;gap:8px">'+(secSelect||'')+(addSecBtn||'')+'</div>') : '')
    +'</div>';
}

// ══ ADD CUSTOM SECTION ══
function addCustomSection(listId){
  var l = (S.shoppingLists||[]).find(function(x){return x.id===listId;});
  if(!l) return;
  // Show inline input row
  var bar = document.getElementById('list-add-bar');
  if(!bar) return;
  var q="'";
  bar.innerHTML = '<div style="display:flex;gap:8px;width:100%">'
    +'<input class="form-input" type="text" id="new-section-input" placeholder="Nombre de la sección..." style="flex:1">'
    +'<button class="btn btn-primary btn-sm" onclick="saveCustomSection('+q+listId+q+')">Crear</button>'
    +'<button onclick="cancelCustomSection('+q+listId+q+')" style="background:none;border:1px solid var(--border);border-radius:8px;color:var(--text2);padding:6px 12px;cursor:pointer;font-family:var(--font)">✕</button>'
    +'</div>';
  setTimeout(function(){var el=document.getElementById('new-section-input');if(el)el.focus();},100);
}
function saveCustomSection(listId){
  var inp = document.getElementById('new-section-input');
  if(!inp||!inp.value.trim()){toast('Ingresa un nombre');return;}
  var l = (S.shoppingLists||[]).find(function(x){return x.id===listId;});
  if(!l) return;
  var name = inp.value.trim();
  if(!l.customSections) l.customSections=[];
  if(l.customSections.indexOf(name)<0) l.customSections.push(name);
  saveState();
  // Rebuild overlay
  var overlay = document.getElementById('list-detail-overlay');
  if(overlay){ overlay.innerHTML = buildListDetailHTML(l); renderListItems(l); }
}
function cancelCustomSection(listId){
  var l = (S.shoppingLists||[]).find(function(x){return x.id===listId;});
  if(!l) return;
  var overlay = document.getElementById('list-detail-overlay');
  if(overlay){ overlay.innerHTML = buildListDetailHTML(l); renderListItems(l); }
}

function openListDetail(id){
  const l = (S.shoppingLists||[]).find(x=>x.id===id);
  if(!l) return;
  const overlay = document.createElement('div');
  overlay.id = 'list-detail-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;background:var(--surface);display:flex;flex-direction:column;overflow:hidden';
  overlay.innerHTML = buildListDetailHTML(l);
  document.body.appendChild(overlay);
  renderListItems(l);
}



function buildListItemHTML(listId, item){
  var done=item.done;
  var q="'";
  var chk='onclick="toggleListItem('+q+listId+q+','+q+item.id+q+')"';
  var del='onclick="removeListItem('+q+listId+q+','+q+item.id+q+')"';
  var edit='onclick="editListItem('+q+listId+q+','+q+item.id+q+')"';
  var chkStyle='width:28px;height:28px;border-radius:8px;border:2px solid '+(done?'var(--success)':'var(--border)')+';background:'+(done?'var(--success)':'transparent')+';cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.2s';
  var textStyle='flex:1;font-size:14px;font-weight:500;'+(done?'text-decoration:line-through;color:var(--text3)':'color:var(--text)');
  var chkInner=done?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':'';
  return '<div id="li-'+item.id+'" style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.06)">'
    +'<div '+chk+' style="'+chkStyle+'">'+chkInner+'</div>'
    +'<div style="'+textStyle+'">'+item.name+'</div>'
    +'<button '+edit+' style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:15px;padding:0 3px;opacity:.6">✏️</button>'
    +'<button '+del+' style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:16px;padding:0 3px">✕</button>'
  +'</div>';
}
function editListItem(listId, itemId){
  var el=document.getElementById('li-'+itemId);
  if(!el)return;
  var nameDiv=el.querySelector('div[style*="flex:1"]');
  if(!nameDiv)return;
  var current=nameDiv.textContent;
  var inp=document.createElement('input');
  inp.type='text';
  inp.value=current;
  inp.style.cssText='flex:1;padding:3px 8px;border-radius:6px;border:1.5px solid var(--primary);background:var(--surface);font-size:14px;font-weight:500;color:var(--text);font-family:var(--font);outline:none;min-width:0';
  var done=false;
  function commit(){
    if(done)return;
    done=true;
    var val=inp.value.trim();
    var l=(S.shoppingLists||[]).find(function(x){return x.id===listId;});
    if(!l)return;
    if(val){
      var item=(l.items||[]).find(function(i){return i.id===itemId;});
      if(item){item.name=val;saveState();}
    }
    renderListItems(l);
  }
  inp.addEventListener('keydown',function(e){
    if(e.key==='Enter'){e.preventDefault();commit();}
    if(e.key==='Escape'){done=true;renderListItems((S.shoppingLists||[]).find(function(x){return x.id===listId;}));}
  });
  inp.addEventListener('blur',commit);
  nameDiv.parentNode.replaceChild(inp,nameDiv);
  inp.focus();inp.select();
}

function toggleListItem(listId,itemId){var l=(S.shoppingLists||[]).find(function(x){return x.id===listId;});if(!l)return;var item=(l.items||[]).find(function(i){return i.id===itemId;});if(!item)return;item.done=!item.done;saveState();renderListItems(l);}
function removeListItem(listId,itemId){var l=(S.shoppingLists||[]).find(function(x){return x.id===listId;});if(!l)return;l.items=(l.items||[]).filter(function(i){return i.id!==itemId;});saveState();renderListItems(l);}

function addListItem(listId){var inp=document.getElementById('list-new-item');var secEl=document.getElementById('list-new-section');if(!inp||!inp.value.trim())return;var l=(S.shoppingLists||[]).find(function(x){return x.id===listId;});if(!l)return;if(!l.items)l.items=[];l.items.push({id:uid(),name:inp.value.trim(),done:false,section:secEl?secEl.value:''});inp.value='';if(secEl)secEl.value='';saveState();renderListItems(l);inp.focus();}



function updateInvFields(type){
  const inv = null;
  document.getElementById('inv-extra-fields').innerHTML = buildInvExtraFields(type, inv);
}

function saveInvestment(){
  const name = document.getElementById('inv-name')?.value?.trim();
  const capital = parseFloat(document.getElementById('inv-capital')?.value);
  if(!name){ toast('Ingresa un nombre'); return; }
  if(!capital||capital<=0){ toast('Ingresa el capital invertido'); return; }
  const type = document.getElementById('inv-type')?.value||'acciones';
  const id = document.getElementById('inv-id')?.value;
  const existing = id?(S.investments||[]).find(x=>x.id===id):null;
  const inv = {
    id: existing?existing.id:uid(),
    name, type, capital,
    currentValue: parseFloat(document.getElementById('inv-current')?.value)||capital,
    currency: document.getElementById('inv-currency')?.value||S.currency,
    startDate: document.getElementById('inv-start')?.value||todayStr(),
    notes: document.getElementById('inv-notes')?.value||'',
    // Extra fields
    ticker: document.getElementById('inv-ticker')?.value||'',
    qty: document.getElementById('inv-qty')?.value||'',
    rate: document.getElementById('inv-rate')?.value||'',
    endDate: document.getElementById('inv-end')?.value||'',
    rent: document.getElementById('inv-rent')?.value||'',
    address: document.getElementById('inv-address')?.value||'',
    monthlyReturn: document.getElementById('inv-monthly')?.value||'',
    share: document.getElementById('inv-share')?.value||'',
  };
  if(!S.investments) S.investments=[];
  var _invMsg=existing?'Inversión actualizada ✓':'Inversión registrada ✓';
  completeAction(function(){if(existing){var idx=S.investments.findIndex(function(x){return x.id===id;});S.investments[idx]=stampItem(inv);}else{S.investments.push(stampItem(inv));};},'inversiones',_invMsg);
}

function deleteInvestment(id){
  confirmDialog('🗑️','¿Eliminar inversión?','',()=>{
    completeAction(function(){S.investments=softDelete(S.investments||[],id);},'inversiones','Eliminada');
  });
}



const INV_TYPES=[
  {id:'acciones',icon:'📊',name:'Acciones / ETF',color:'#3B82F6'},
  {id:'cdt',icon:'🏦',name:'CDT / Plazo fijo',color:'#10B981'},
  {id:'inmueble',icon:'🏠',name:'Inmueble',color:'#F59E0B'},
  {id:'cripto',icon:'₿',name:'Criptomonedas',color:'#F97316'},
  {id:'negocio',icon:'🤝',name:'Negocio propio',color:'#8B5CF6'},
  {id:'otro',icon:'💼',name:'Otro',color:'#64748B'},
];

function renderInversiones(){
  var invs=filterDeleted(S.investments||[]);
  var totalInv=invs.reduce(function(s,i){return s+(parseFloat(i.capital)||0);},0);
  var totalVal=invs.reduce(function(s,i){return s+(parseFloat(i.currentValue)||parseFloat(i.capital)||0);},0);
  var totalGain=totalVal-totalInv;
  var gainPct=totalInv>0?((totalGain/totalInv)*100).toFixed(1):0;
  var html='';
  if(invs.length){
    html+='<div class="balance-card" style="margin-bottom:16px;cursor:default">'
      +'<div class="balance-label">Portafolio total ('+S.currency+')</div>'
      +'<div class="balance-amount" style="color:'+(totalGain>=0?'#6FFFDF':'#FF8080')+'">'+fmt(totalVal)+'</div>'
      +'<div class="balance-row">'
      +'<div class="balance-stat"><div class="balance-stat-label">💰 Invertido</div><div class="balance-stat-val">'+fmt(totalInv)+'</div></div>'
      +'<div class="balance-stat"><div class="balance-stat-label">'+(totalGain>=0?'📈 Ganancia':'📉 Pérdida')+'</div><div class="balance-stat-val '+(totalGain>=0?'inc':'exp')+'">'+(totalGain>=0?'+':'')+fmt(totalGain)+' ('+gainPct+'%)</div></div>'
      +'</div></div>';
  }
  html+='<div style="display:flex;justify-content:flex-end;margin-bottom:12px">'
    +'<button class="btn btn-primary btn-sm" onclick="openModal(\'newInvestment\',{})">+ Nueva inversión</button>'
    +'</div>';
  if(!invs.length){
    html+='<div class="empty-state"><div class="empty-icon">📈</div><div class="empty-title">Sin inversiones</div><div class="empty-desc">Registra tu primer activo</div></div>';
    return html;
  }
  invs.forEach(function(inv){
    var tipo=INV_TYPES.find(function(t){return t.id===inv.type;})||INV_TYPES[5];
    var cap=parseFloat(inv.capital)||0;
    var cur=parseFloat(inv.currentValue)||cap;
    var gain=cur-cap;
    var gainP=cap>0?((gain/cap)*100).toFixed(1):0;
    var isPos=gain>=0;
    var cdtInfo='';
    if(inv.type==='cdt'&&inv.rate&&inv.endDate){
      var days=Math.max(0,Math.round((new Date(inv.endDate)-new Date())/86400000));
      var projected=cap*(1+(parseFloat(inv.rate)/100)*(days/365));
      cdtInfo='<div style="font-size:11px;color:var(--text2);margin-top:4px">📅 Vence en '+days+'d · Proyectado: '+fmt(projected)+'</div>';
    }
    html+='<div class="card" style="margin-bottom:12px;border-left:4px solid '+tipo.color+'" onclick="openModal(&apos;editInvestment&apos;,{id:&apos;'+inv.id+'&apos;})">'
      +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">'
      +'<div style="width:44px;height:44px;border-radius:12px;background:'+tipo.color+'22;display:flex;align-items:center;justify-content:center;font-size:22px">'+tipo.icon+'</div>'
      +'<div style="flex:1"><div style="font-size:15px;font-weight:700">'+inv.name+'</div>'
      +'<div style="font-size:12px;color:var(--text2)">'+tipo.name+(inv.ticker?' · '+inv.ticker:'')+'</div>'+cdtInfo+'</div>'
      +'<div style="text-align:right"><div style="font-size:16px;font-weight:800">'+fmt(cur)+'</div>'
      +'<div style="font-size:12px;font-weight:700;color:'+(isPos?'var(--success)':'var(--danger)')+')">'+(isPos?'+':'')+fmt(gain)+' ('+gainP+'%)</div></div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;color:var(--text2)">'
      +'<div>💰 Capital: <strong>'+fmt(cap)+'</strong></div>'
      +'<div>📅 Desde: <strong>'+(inv.startDate||'—')+'</strong></div>'
      +'</div></div>';
  });
  return html;
}
function buildInvExtraFields(type,inv){
  if(type==='acciones'||type==='cripto'){
    return '<div class="form-row"><div class="form-group"><label class="form-label">Ticker / Símbolo</label><input class="form-input" type="text" id="inv-ticker" placeholder="Ej: AAPL, BTC" value="'+(inv?inv.ticker||'':'')+'"></div><div class="form-group"><label class="form-label">Cantidad</label><input class="form-input" type="number" id="inv-qty" placeholder="Ej: 10" value="'+(inv?inv.qty||'':'')+'"></div></div>';
  }
  if(type==='cdt'){
    return '<div class="form-row"><div class="form-group"><label class="form-label">Tasa anual (%)</label><input class="form-input" type="number" id="inv-rate" placeholder="Ej: 12.5" step="0.01" value="'+(inv?inv.rate||'':'')+'"></div><div class="form-group"><label class="form-label">Fecha vencimiento</label><input class="form-input" type="date" id="inv-end" value="'+(inv?inv.endDate||'':'')+'"></div></div>';
  }
  if(type==='inmueble'){
    return '<div class="form-row"><div class="form-group"><label class="form-label">Renta mensual</label><input class="form-input" type="number" id="inv-rent" placeholder="0 si no renta" value="'+(inv?inv.rent||'':'')+'"></div><div class="form-group"><label class="form-label">Dirección</label><input class="form-input" type="text" id="inv-address" placeholder="Opcional" value="'+(inv?inv.address||'':'')+'"></div></div>';
  }
  if(type==='negocio'){
    return '<div class="form-row"><div class="form-group"><label class="form-label">Retorno mensual</label><input class="form-input" type="number" id="inv-monthly" placeholder="0.00" value="'+(inv?inv.monthlyReturn||'':'')+'"></div><div class="form-group"><label class="form-label">Participación (%)</label><input class="form-input" type="number" id="inv-share" placeholder="Ej: 50" value="'+(inv?inv.share||'':'')+'"></div></div>';
  }
  return '';
}
function buildNewInvestmentModal(data){
  var inv=data.id?(S.investments||[]).find(function(x){return x.id===data.id;}):null;
  var isEdit=!!inv;
  var defType=inv?inv.type:'acciones';
  var q="'";
  var deleteBtn=isEdit?('<button class="btn btn-danger" onclick="deleteInvestment('+q+inv.id+q+')">Eliminar</button>'):'';
  return '<div class="modal-header"><div class="modal-title">'+(isEdit?'Editar':'Nueva')+' inversión</div><button class="modal-close" onclick="closeModal()">×</button></div>'
    +'<div class="modal-body">'
    +'<input type="hidden" id="inv-id" value="'+(inv?inv.id:'')+'">'
    +'<div class="form-group"><label class="form-label">Nombre</label><input class="form-input" type="text" id="inv-name" placeholder="Ej: Apple, FONDO ABC..." value="'+(inv?inv.name:'')+'"></div>'
    +'<div class="form-group"><label class="form-label">Tipo</label><select class="form-select" id="inv-type" onchange="updateInvFields(this.value)">'
    +INV_TYPES.map(function(t){return '<option value="'+t.id+'" '+(defType===t.id?'selected':'')+'>'+t.icon+' '+t.name+'</option>';}).join('')
    +'</select></div>'
    +'<div id="inv-extra-fields">'+buildInvExtraFields(defType,inv)+'</div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Capital invertido</label><input class="form-input" type="number" id="inv-capital" placeholder="0.00" value="'+(inv?inv.capital:'')+'" step="0.01"></div>'
    +'<div class="form-group"><label class="form-label">Valor actual</label><input class="form-input" type="number" id="inv-current" placeholder="= capital si no cambió" value="'+(inv?inv.currentValue:'')+'" step="0.01"></div></div>'
    +'<div class="form-row"><div class="form-group"><label class="form-label">Fecha inicio</label><input class="form-input" type="date" id="inv-start" value="'+(inv?inv.startDate:todayStr())+'"></div>'
    +'<div class="form-group"><label class="form-label">Moneda</label><select class="form-select" id="inv-currency">'+buildCurrencyOptions(inv?inv.currency:S.currency)+'</select></div></div>'
    +'<div class="form-group"><label class="form-label">Notas</label><input class="form-input" type="text" id="inv-notes" placeholder="Observaciones..." value="'+(inv?inv.notes||'':'')+'"></div>'
    +'<div class="btn-row">'+deleteBtn+'<button class="btn btn-primary" onclick="saveInvestment()">'+(isEdit?'Guardar':'Registrar')+'</button></div>'
    +'</div>';
}




function buildNewListModal(data){
  return '<div class="modal-header"><div class="modal-title">Nueva lista</div><button class="modal-close" onclick="closeModal()">×</button></div>'
    +'<div class="modal-body">'
    +'<div class="form-group"><label class="form-label" style="margin-bottom:8px">¿Qué tipo de lista deseas crear?</label>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +LISTA_TIPOS.map(function(t){var q="'";return '<button onclick="selectListType('+q+t.id+q+')" id="lt-'+t.id+'" style="padding:12px 8px;border-radius:10px;border:2px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;font-family:var(--font);font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;transition:.15s">'+t.icon+' '+t.name+'</button>';}).join('')
    +'</div><input type="hidden" id="nl-type" value=""></div>'
    +'<button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="saveNewList()">Crear lista</button>'
    +'</div>';
}
function selectListType(typeId){
  document.getElementById('nl-type').value=typeId;
  LISTA_TIPOS.forEach(function(t){
    var btn=document.getElementById('lt-'+t.id);
    if(btn){btn.style.borderColor=t.id===typeId?'var(--primary)':'var(--border)';btn.style.background=t.id===typeId?'rgba(0,212,170,.12)':'var(--surface2)';btn.style.color=t.id===typeId?'var(--primary)':'var(--text)';}
  });
}
function saveNewList(){
  var type=document.getElementById('nl-type')&&document.getElementById('nl-type').value||'';
  if(!type){toast('Selecciona un tipo de lista');return;}
  var tipo=LISTA_TIPOS.find(function(t){return t.id===type;})||LISTA_TIPOS[5];
  if(!S.shoppingLists)S.shoppingLists=[];
  var exists=S.shoppingLists.find(function(l){return l.type===type;});
  if(exists&&type!=='custom'){toast('Ya tienes una lista de '+tipo.name);closeModal();openListDetail(exists.id);return;}
  var items=(DEFAULT_LIST_ITEMS[type]||[]).map(function(i){return {id:uid(),name:i.name,done:false,section:i.section||''};});
  var name=type==='custom'?('Lista '+(S.shoppingLists.filter(function(l){return l.type==='custom';}).length+1)):tipo.name;
  completeAction(function(){S.shoppingLists.push(stampItem({id:uid(),name:name,type:type,color:tipo.color,items:items,createdAt:todayStr()}));},'listas','Lista creada ✓');
}
function deleteList(id){
  confirmDialog('🗑️','¿Eliminar lista?','',function(){
    S.shoppingLists=softDelete(S.shoppingLists||[],id);
    saveState();closeListDetail();toast('Lista eliminada');
  });
}
function shareList(listId){
  var l=(S.shoppingLists||[]).find(function(x){return x.id===listId;});
  if(!l)return;
  var text='📋 *'+l.name+'*\n\n';
  (l.items||[]).forEach(function(i){text+=(i.done?'✅':'⬜')+' '+i.name+'\n';});
  if(navigator.share){navigator.share({title:l.name,text:text});}
  else if(navigator.clipboard){navigator.clipboard.writeText(text).then(function(){toast('Lista copiada ✓');});}
}
function closeListDetail(){
  var el=document.getElementById('list-detail-overlay');
  if(el)el.remove();
  renderPage('listas');
}





// ════════════════════════════════════════════════════════════
// DRAWER — Funciones secundarias
// ════════════════════════════════════════════════════════════
function invitarAmigos(){
  var url='https://finanzia.xenda.co';
  var msg='Te recomiendo FinanzIA, la app para controlar tus finanzas personales de forma inteligente: '+url;
  if(navigator.share){
    navigator.share({title:'FinanzIA',text:msg,url:url}).catch(function(){});
  }else{
    try{navigator.clipboard.writeText(url);}catch(e){}
    toast('¡Link copiado al portapapeles!');
  }
}

function openSiguenos(){
  var items=[
    {name:'Instagram',handle:'@xenda.co',url:'https://instagram.com/xenda.co',bg:'radial-gradient(circle at 30% 107%,#fdf497 0%,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285AEB 90%)',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/></svg>'},
    {name:'TikTok',handle:'@xenda.co',url:'https://tiktok.com/@xenda.co',bg:'#010101',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/></svg>'},
    {name:'X (Twitter)',handle:'@xendaco',url:'https://x.com/xendaco',bg:'#000000',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.738-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'},
    {name:'Facebook',handle:'Xenda.co',url:'https://facebook.com/xendaco',bg:'#1877F2',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>'},
    {name:'LinkedIn',handle:'Xenda.co',url:'https://linkedin.com/company/xenda',bg:'#0A66C2',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>'},
    {name:'YouTube',handle:'Xenda.co',url:'https://youtube.com/@xendaco',bg:'#FF0000',svg:'<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#FF0000"/></svg>'}
  ];
  var ov=document.createElement('div');
  ov.id='siguenos-sheet';
  ov.style.cssText='position:fixed;inset:0;z-index:500;display:flex;flex-direction:column;justify-content:flex-end';
  var rows=items.map(function(it){
    return '<a href="'+it.url+'" target="_blank" rel="noopener" onclick="document.getElementById(\'siguenos-sheet\').remove()" style="display:flex;align-items:center;gap:14px;padding:12px;border-radius:12px;text-decoration:none;color:var(--text)">'
      +'<div style="width:42px;height:42px;border-radius:12px;background:'+it.bg+';display:flex;align-items:center;justify-content:center;flex-shrink:0">'+it.svg+'</div>'
      +'<div><div style="font-size:14px;font-weight:700">'+it.name+'</div><div style="font-size:12px;color:var(--text3)">'+it.handle+'</div></div>'
      +'</a>';
  }).join('');
  ov.innerHTML='<div onclick="document.getElementById(\'siguenos-sheet\').remove()" style="flex:1;background:rgba(0,0,0,.5)"></div>'
    +'<div style="background:var(--surface);border-radius:20px 20px 0 0;padding:0 0 32px">'
      +'<div style="display:flex;justify-content:center;padding:12px 0 4px"><div style="width:36px;height:4px;background:var(--border);border-radius:2px"></div></div>'
      +'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 20px 12px">'
        +'<div style="font-size:17px;font-weight:800">Síguenos</div>'
        +'<button onclick="document.getElementById(\'siguenos-sheet\').remove()" style="width:32px;height:32px;border-radius:50%;border:none;background:var(--surface2);color:var(--text2);cursor:pointer;font-size:16px">✕</button>'
      +'</div>'
      +'<div style="padding:0 8px">'+rows+'</div>'
    +'</div>';
  document.body.appendChild(ov);
}

var _SOPORTE_ASUNTOS=['No puedo iniciar sesión','Problema con mis datos','La app no funciona correctamente','Consulta sobre la app','Sugerencia o mejora','Eliminar mi cuenta','Otro'];
function _showSoporteAsuntoBS(){
  var cur=document.getElementById('sop-asunto')?document.getElementById('sop-asunto').value:'';
  showBottomSheet({
    title:'Asunto',
    items:_SOPORTE_ASUNTOS.map(function(a){return{val:a,label:a};}),
    selected:cur,
    searchable:false,
    onSelect:function(val){
      var inp=document.getElementById('sop-asunto');
      var lbl=document.getElementById('sop-asunto-lbl');
      if(inp)inp.value=val;
      if(lbl){lbl.textContent=val;lbl.style.color='var(--text)';}
    }
  });
}
function openSoporteModal(){
  var name=(S.profile&&S.profile.name)||'';
  var email=(S.profile&&S.profile.email)||(window._currentUser&&window._currentUser.email?window._currentUser.email:'')||'';
  var ov=document.createElement('div');
  ov.id='soporte-modal';
  ov.style.cssText='position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;overflow-y:auto';
  ov.innerHTML='<div style="width:100%;background:var(--surface);border-radius:20px 20px 0 0;max-height:92vh;display:flex;flex-direction:column;overflow:hidden">'
    +'<div style="display:flex;justify-content:center;padding:12px 0 4px;flex-shrink:0"><div style="width:36px;height:4px;background:var(--border);border-radius:2px"></div></div>'
    +'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 20px 14px;flex-shrink:0">'
      +'<div><div style="font-size:17px;font-weight:800">Soporte</div><div style="font-size:12px;color:var(--text3);margin-top:2px">Te respondemos a la brevedad</div></div>'
      +'<button onclick="document.getElementById(\'soporte-modal\').remove()" style="width:32px;height:32px;border-radius:50%;border:none;background:var(--surface2);color:var(--text2);cursor:pointer;font-size:16px">✕</button>'
    +'</div>'
    +'<div id="soporte-form-wrap" style="flex:1;overflow-y:auto;padding:0 16px 24px">'
      +'<div class="form-group"><label class="form-label">Nombre</label>'
        +'<input class="form-input" type="text" id="sop-nombre" value="'+name+'" placeholder="Tu nombre" readonly style="opacity:.65;cursor:not-allowed"></div>'
      +'<div class="form-group"><label class="form-label">Email</label>'
        +'<input class="form-input" type="email" id="sop-email" value="'+email+'" placeholder="tu@email.com" readonly style="opacity:.65;cursor:not-allowed"></div>'
      +'<div class="form-group"><label class="form-label">Asunto</label>'
        +'<div class="bs-trigger" id="sop-asunto-trigger" onclick="_showSoporteAsuntoBS()">'
          +'<span id="sop-asunto-lbl" style="font-size:14px;color:var(--text3)">Selecciona un asunto...</span>'
          +'<span style="color:var(--text3);font-size:18px">›</span>'
        +'</div>'
        +'<input type="hidden" id="sop-asunto" value=""></div>'
      +'<div class="form-group"><label class="form-label">Mensaje</label>'
        +'<textarea class="form-input" id="sop-mensaje" rows="7" placeholder="Describe tu consulta o problema..." style="resize:none;min-height:160px"></textarea></div>'
      +'<button onclick="_enviarSoporte()" style="width:100%;padding:14px;border-radius:50px;background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:white;font-size:15px;font-weight:700;cursor:pointer;font-family:var(--font)">Enviar mensaje</button>'
    +'</div>'
  +'</div>';
  document.body.appendChild(ov);
}
async function _enviarSoporte(){
  var nombre=(document.getElementById('sop-nombre')||{}).value||'';
  var email=(document.getElementById('sop-email')||{}).value||'';
  var asunto=(document.getElementById('sop-asunto')||{}).value||'';
  var mensaje=(document.getElementById('sop-mensaje')||{}).value||'';
  if(!nombre.trim()||!email.trim()||!asunto||!mensaje.trim()){toast('Por favor completa todos los campos');return;}
  var btn=document.querySelector('#soporte-modal button:last-of-type');
  if(btn){btn.disabled=true;btn.textContent='Enviando...';}
  try{
    var res=await fetch('https://api.web3forms.com/submit',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({
        access_key:'b0601c0f-6e9c-4221-a38a-bbc7cf552417',
        from_name:'FinanzIA - Soporte',
        nombre:nombre,
        email:email,
        subject:'[FinanzIA Soporte] '+asunto,
        message:mensaje
      })
    });
    var data=await res.json();
    if(data.success){
      var wrap=document.getElementById('soporte-form-wrap');
      if(wrap)wrap.innerHTML='<div style="padding:40px 20px;text-align:center">'
        +'<div style="font-size:48px;margin-bottom:16px">✅</div>'
        +'<div style="font-size:18px;font-weight:800;margin-bottom:8px">¡Mensaje enviado!</div>'
        +'<div style="font-size:14px;color:var(--text2);margin-bottom:24px">Te responderemos pronto a <strong>'+email+'</strong></div>'
        +'<button onclick="document.getElementById(\'soporte-modal\').remove()" style="padding:12px 32px;border-radius:50px;background:var(--primary);border:none;color:white;font-weight:700;cursor:pointer;font-family:var(--font)">Cerrar</button>'
        +'</div>';
    }else{
      toast('Error al enviar. Intenta de nuevo.');
      if(btn){btn.disabled=false;btn.textContent='Enviar mensaje';}
    }
  }catch(e){
    toast('Error de conexión. Intenta de nuevo.');
    if(btn){btn.disabled=false;btn.textContent='Enviar mensaje';}
  }
}

function openAcercaDeModal(){
  var ov=document.createElement('div');
  ov.id='acercade-modal';
  ov.style.cssText='position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.6);display:flex;align-items:flex-end';
  ov.innerHTML='<div style="width:100%;background:var(--surface);border-radius:20px 20px 0 0;padding:0 0 40px">'
    +'<div style="display:flex;justify-content:center;padding:12px 0 4px"><div style="width:36px;height:4px;background:var(--border);border-radius:2px"></div></div>'
    +'<div style="display:flex;justify-content:flex-end;padding:4px 16px 0">'
      +'<button onclick="document.getElementById(\'acercade-modal\').remove()" style="width:32px;height:32px;border-radius:50%;border:none;background:var(--surface2);color:var(--text2);cursor:pointer;font-size:16px">✕</button>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;align-items:center;padding:12px 24px 24px;text-align:center">'
      +'<div style="width:80px;height:80px;border-radius:20px;overflow:hidden;margin-bottom:16px;box-shadow:0 8px 24px rgba(0,212,170,.25)">'
        +'<img src="/icon-192.png" style="width:100%;height:100%;object-fit:cover">'
      +'</div>'
      +'<div style="font-size:26px;font-weight:900;letter-spacing:-.5px;margin-bottom:4px">'
        +'<span style="color:var(--text)">Finanz</span><span style="color:var(--primary)">IA</span>'
      +'</div>'
      +'<div style="font-size:12px;color:var(--text3);margin-bottom:24px">versión 3.3</div>'
      +'<div style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:24px;max-width:300px">'
        +'Tu asistente de finanzas personales. Gestiona cuentas, presupuestos, metas y más, en cualquier divisa y desde cualquier lugar.'
      +'</div>'
      +'<div style="width:100%;height:1px;background:var(--border);margin-bottom:20px"></div>'
      +'<div style="font-size:12px;color:var(--text3);margin-bottom:6px">Desarrollado con ❤️ por</div>'
      +'<div style="font-size:20px;font-weight:800;color:var(--text);margin-bottom:16px">Xenda.co</div>'
      +'<a href="https://xenda.co" target="_blank" rel="noopener" onclick="document.getElementById(\'acercade-modal\').remove()" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;border-radius:50px;background:linear-gradient(135deg,var(--primary),var(--secondary));color:white;font-size:14px;font-weight:700;text-decoration:none">'
        +'Visitar xenda.co'
      +'</a>'
    +'</div>'
  +'</div>';
  document.body.appendChild(ov);
}

// ════════════════════════════════════════════════════════════
// TÉRMINOS Y PRIVACIDAD
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// TÉRMINOS Y CONDICIONES / POLÍTICA DE PRIVACIDAD
// ════════════════════════════════════════════════════════════
function openTerminosModal(){
  var ov=document.createElement('div');
  ov.id='terminos-modal';
  ov.style.cssText='position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.6);display:flex;align-items:flex-end';

  var s='font-size:14px;color:var(--text2);line-height:1.7';
  var h3='font-size:14px;font-weight:800;color:var(--text);margin:18px 0 6px';
  var p='margin:0 0 10px';
  var ul='margin:0 0 10px;padding-left:20px';
  var warn='margin:10px 0;padding:10px 14px;background:rgba(239,68,68,.07);border-radius:8px;font-size:13px';
  var ok='margin:10px 0;padding:10px 14px;background:rgba(0,212,170,.08);border-radius:8px;font-size:13px';
  var email='<button onclick="document.getElementById(\'terminos-modal\').remove();openSoporteModal()" style="background:none;border:none;color:var(--primary);cursor:pointer;font-family:var(--font);font-size:14px;font-weight:600;text-decoration:underline;padding:0">soporte@xenda.co</button>';

  var tcContent='<div style="'+s+'">'
    +'<p style="'+p+'">Última actualización: abril 2026 · Operado por <strong>Xenda.co</strong></p>'

    +'<h3 style="'+h3+'">1. Aceptación de los términos</h3>'
    +'<p style="'+p+'">Al descargar, instalar o usar FinanzIA ("la Aplicación"), aceptas quedar vinculado por estos Términos y Condiciones ("Términos"). Si no estás de acuerdo, no uses la Aplicación. El uso continuado después de modificaciones implica aceptación de los nuevos términos.</p>'

    +'<h3 style="'+h3+'">2. Descripción del servicio</h3>'
    +'<p style="'+p+'">FinanzIA es una aplicación de gestión de finanzas personales que permite registrar cuentas, ingresos, gastos, presupuestos, metas y deudas, con sincronización en tiempo real entre dispositivos. El servicio se provee como está, sin garantías implícitas de disponibilidad continua.</p>'

    +'<h3 style="'+h3+'">3. Elegibilidad</h3>'
    +'<ul style="'+ul+'">'
    +'<li>Tener al menos <strong>18 años</strong> de edad</li>'
    +'<li>Tener capacidad legal para celebrar contratos en tu jurisdicción</li>'
    +'<li>Proporcionar información veraz y completa durante el registro</li>'
    +'<li>Mantener la seguridad de tus credenciales de acceso</li>'
    +'</ul>'

    +'<h3 style="'+h3+'">4. Uso aceptable</h3>'
    +'<p style="'+p+'">Queda prohibido usar FinanzIA para:</p>'
    +'<ul style="'+ul+'">'
    +'<li>Actividades ilegales, fraudulentas o que vulneren derechos de terceros</li>'
    +'<li>Intentar acceder a cuentas ajenas o vulnerar la seguridad del sistema</li>'
    +'<li>Introducir malware, virus o código malicioso</li>'
    +'<li>Realizar ingeniería inversa o descompilar la Aplicación</li>'
    +'<li>Revender o sublicenciar el acceso al servicio</li>'
    +'</ul>'

    +'<h3 style="'+h3+'">5. Descargo financiero — IMPORTANTE</h3>'
    +'<div style="'+warn+'"><strong>⚠️ FinanzIA es una herramienta de organización y análisis financiero personal. NO constituye asesoramiento financiero, de inversión, fiscal o legal certificado.</strong> Los análisis, sugerencias y proyecciones que muestra la Aplicación son de carácter exclusivamente informativo y educativo. Las decisiones financieras que tomes son de tu exclusiva responsabilidad.</div>'

    +'<h3 style="'+h3+'">6. Propiedad intelectual</h3>'
    +'<p style="'+p+'">Todos los derechos de propiedad intelectual sobre FinanzIA — incluyendo código, diseño, marca, logotipos y contenido — pertenecen a <strong>Xenda.co</strong>. Se te otorga una licencia limitada, no exclusiva e intransferible para usar la Aplicación según estos Términos.</p>'

    +'<h3 style="'+h3+'">7. Cuentas y seguridad</h3>'
    +'<p style="'+p+'">Eres responsable de mantener la confidencialidad de tu contraseña y PIN. Notifícanos inmediatamente ante cualquier acceso no autorizado. Xenda.co no será responsable por pérdidas derivadas del uso no autorizado de tu cuenta.</p>'

    +'<h3 style="'+h3+'">8. Suspensión y eliminación</h3>'
    +'<p style="'+p+'">Xenda.co puede suspender o terminar tu acceso si violas estos Términos. Puedes eliminar tu cuenta en cualquier momento desde Configuración. Tras la eliminación, tus datos se conservan 30 días para posible reactivación y luego se eliminan permanentemente.</p>'

    +'<h3 style="'+h3+'">9. Limitación de responsabilidad</h3>'
    +'<p style="'+p+'">En la máxima medida permitida por la ley aplicable, Xenda.co no será responsable por daños indirectos, incidentales, especiales o consecuentes, incluyendo pérdida de datos o beneficios, derivados de:</p>'
    +'<ul style="'+ul+'">'
    +'<li>Tu uso o incapacidad de usar la Aplicación</li>'
    +'<li>Acceso no autorizado a tus datos por causas fuera de nuestro control</li>'
    +'<li>Decisiones financieras basadas en información de la Aplicación</li>'
    +'<li>Interrupciones del servicio por mantenimiento o causas de fuerza mayor</li>'
    +'</ul>'

    +'<h3 style="'+h3+'">10. Modificaciones del servicio</h3>'
    +'<p style="'+p+'">Xenda.co se reserva el derecho de modificar, suspender o discontinuar la Aplicación en cualquier momento. Te notificaremos con antelación razonable ante cambios significativos.</p>'

    +'<h3 style="'+h3+'">11. Jurisdicción y ley aplicable</h3>'
    +'<p style="'+p+'">Estos Términos se rigen por las leyes de la <strong>República de Colombia</strong>. Cualquier disputa se resolverá ante los tribunales competentes de Colombia, sin perjuicio de las normas de protección al consumidor aplicables en tu país de residencia.</p>'

    +'<h3 style="'+h3+'">12. Contacto</h3>'
    +'<p style="'+p+'">Para consultas sobre estos Términos: '+email+'<br>Sitio web: <a href="https://xenda.co" target="_blank" style="color:var(--primary)">xenda.co</a></p>'
    +'</div>';

  var ppContent='<div style="'+s+'">'
    +'<p style="'+p+'">Última actualización: abril 2026 · <strong>Xenda.co</strong> — Responsable del tratamiento de datos</p>'

    +'<h3 style="'+h3+'">1. Información que recopilamos</h3>'
    +'<p style="'+p+'"><strong>Datos de cuenta:</strong> Nombre y apellido, correo electrónico, país de origen y residencia, número de teléfono, profesión y foto de perfil (opcional).</p>'
    +'<p style="'+p+'"><strong>Datos financieros:</strong> Cuentas bancarias (solo nombre y saldo, no credenciales), transacciones, presupuestos, metas, deudas y suscripciones que ingresas voluntariamente. <strong>No accedemos a tu banca en línea ni almacenamos credenciales bancarias.</strong></p>'
    +'<p style="'+p+'"><strong>Datos técnicos:</strong> Idioma y moneda de preferencia, configuración de la app, timestamps de uso para sincronización.</p>'

    +'<h3 style="'+h3+'">2. Finalidad y base legal del tratamiento</h3>'
    +'<ul style="'+ul+'">'
    +'<li><strong>Prestación del servicio:</strong> Sincronizar y mostrar tus datos financieros en todos tus dispositivos</li>'
    +'<li><strong>Mejora del servicio:</strong> Análisis agregados y anónimos de uso para mejorar funcionalidades</li>'
    +'<li><strong>Comunicación:</strong> Notificaciones sobre actualizaciones importantes del servicio</li>'
    +'<li><strong>Cumplimiento legal:</strong> Obligaciones establecidas por la legislación aplicable</li>'
    +'</ul>'
    +'<p style="'+p+'">La base legal es la ejecución del contrato de servicio y tu consentimiento explícito al aceptar estos términos.</p>'

    +'<h3 style="'+h3+'">3. Cómo protegemos tus datos</h3>'
    +'<ul style="'+ul+'">'
    +'<li>Transmisión cifrada mediante <strong>TLS/SSL</strong></li>'
    +'<li>Almacenamiento seguro en <strong>Supabase</strong> con Row Level Security (RLS) — solo tú accedes a tus datos</li>'
    +'<li>Autenticación segura con contraseña, PIN y/o biometría</li>'
    +'<li>Tokens de acceso con expiración automática</li>'
    +'<li>Sin acceso de empleados a datos financieros individuales</li>'
    +'</ul>'

    +'<h3 style="'+h3+'">4. No vendemos tus datos</h3>'
    +'<div style="'+ok+'"><strong>✅ Xenda.co no vende, alquila, intercambia ni comparte tu información personal con terceros con fines publicitarios o comerciales, bajo ninguna circunstancia.</strong></div>'
    +'<p style="'+p+'">Únicamente compartimos datos con:</p>'
    +'<ul style="'+ul+'">'
    +'<li><strong>Supabase Inc.</strong> (infraestructura de base de datos, EE.UU.) — bajo acuerdo de procesamiento de datos</li>'
    +'<li><strong>Autoridades competentes</strong> cuando lo exija una orden judicial o ley aplicable</li>'
    +'</ul>'

    +'<h3 style="'+h3+'">5. Transferencias internacionales de datos</h3>'
    +'<p style="'+p+'">Tus datos se almacenan en servidores de Supabase ubicados en <strong>Estados Unidos</strong>. Esta transferencia se realiza bajo las garantías contractuales adecuadas conforme al RGPD (cláusulas contractuales tipo) y la Ley 1581 de 2012 de Colombia. Al usar FinanzIA consientes expresamente esta transferencia.</p>'

    +'<h3 style="'+h3+'">6. Tus derechos</h3>'
    +'<p style="'+p+'">Tienes derecho a:</p>'
    +'<ul style="'+ul+'">'
    +'<li><strong>Acceder</strong> a tus datos personales</li>'
    +'<li><strong>Rectificar</strong> información incorrecta o incompleta</li>'
    +'<li><strong>Suprimir</strong> tu cuenta y todos los datos asociados</li>'
    +'<li><strong>Exportar</strong> tus datos en formato legible (JSON)</li>'
    +'<li><strong>Oponerte</strong> al tratamiento para fines distintos al servicio</li>'
    +'<li><strong>Revocar</strong> el consentimiento en cualquier momento</li>'
    +'</ul>'
    +'<p style="'+p+'">Para ejercer estos derechos contacta: '+email+'</p>'
    +'<p style="'+p+'">Los usuarios de la Unión Europea también tienen derecho a presentar una reclamación ante la autoridad de protección de datos de su país.</p>'

    +'<h3 style="'+h3+'">7. Retención de datos</h3>'
    +'<ul style="'+ul+'">'
    +'<li>Datos activos: conservados mientras mantengas cuenta activa</li>'
    +'<li>Tras eliminar cuenta: disponibles 30 días para reactivación</li>'
    +'<li>Después de 30 días: eliminación permanente e irreversible</li>'
    +'<li>Datos de facturación: conservados 7 años por obligación legal</li>'
    +'</ul>'

    +'<h3 style="'+h3+'">8. Menores de edad</h3>'
    +'<p style="'+p+'">FinanzIA no está dirigida a personas menores de 18 años. No recopilamos intencionalmente datos de menores. Si detectamos datos de un menor, los eliminaremos de inmediato y cancelaremos la cuenta.</p>'

    +'<h3 style="'+h3+'">9. Cookies y almacenamiento local</h3>'
    +'<p style="'+p+'">FinanzIA usa <strong>localStorage</strong> del navegador/dispositivo exclusivamente para almacenar tus datos financieros localmente y mantener tu sesión activa. No usamos cookies de terceros ni rastreadores publicitarios.</p>'

    +'<h3 style="'+h3+'">10. Notificación de brechas de seguridad</h3>'
    +'<p style="'+p+'">En caso de una brecha de seguridad que afecte tus datos personales, te notificaremos por email en un plazo máximo de 72 horas desde que tengamos conocimiento del incidente, conforme al RGPD y normativa aplicable.</p>'

    +'<h3 style="'+h3+'">11. Marco legal aplicable</h3>'
    +'<p style="'+p+'">Esta Política de Privacidad cumple con:</p>'
    +'<ul style="'+ul+'">'
    +'<li><strong>Ley 1581 de 2012</strong> (Colombia) — Protección de datos personales</li>'
    +'<li><strong>Decreto 1377 de 2013</strong> (Colombia) — Reglamentación Ley 1581</li>'
    +'<li><strong>RGPD / GDPR</strong> (Unión Europea) — Para usuarios europeos</li>'
    +'<li><strong>CCPA</strong> (California, EE.UU.) — Para usuarios californianos</li>'
    +'</ul>'

    +'<h3 style="'+h3+'">12. Contacto y DPO</h3>'
    +'<p style="'+p+'">Para consultas sobre privacidad y protección de datos:<br>'
    +email+'<br>'
    +'<a href="https://xenda.co" target="_blank" style="color:var(--primary)">xenda.co</a><br>'
    +'<span style="font-size:12px;color:var(--text3)">Xenda.co · Colombia</span></p>'
    +'</div>';

  ov.innerHTML='<div style="width:100%;background:var(--surface);border-radius:20px 20px 0 0;max-height:90vh;display:flex;flex-direction:column;overflow:hidden">'
    +'<div style="display:flex;justify-content:center;padding:12px 0 4px;flex-shrink:0"><div style="width:36px;height:4px;background:var(--border);border-radius:2px"></div></div>'
    +'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 20px 12px;flex-shrink:0">'
      +'<div style="font-size:17px;font-weight:800">Legal</div>'
      +'<button onclick="document.getElementById(\'terminos-modal\').remove()" style="width:32px;height:32px;border-radius:50%;border:none;background:var(--surface2);color:var(--text2);cursor:pointer;font-size:16px">✕</button>'
    +'</div>'
    +'<div style="display:flex;gap:6px;padding:0 16px 12px;flex-shrink:0">'
      +'<button id="tab-tc" onclick="_switchTerminosTab(\'tc\')" style="flex:1;padding:9px 6px;border-radius:50px;border:none;background:var(--primary);color:white;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font)">Términos y Condiciones</button>'
      +'<button id="tab-pp" onclick="_switchTerminosTab(\'pp\')" style="flex:1;padding:9px 6px;border-radius:50px;border:none;background:var(--surface2);color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font)">Política de Privacidad</button>'
    +'</div>'
    +'<div id="terminos-content" style="flex:1;overflow-y:auto;padding:0 20px 32px">'
      +tcContent
    +'</div>'
  +'</div>';
  ov._tcContent=tcContent;
  ov._ppContent=ppContent;
  document.body.appendChild(ov);
}
function _switchTerminosTab(tab){
  var ov=document.getElementById('terminos-modal');
  var con=document.getElementById('terminos-content');
  var btnTc=document.getElementById('tab-tc');
  var btnPp=document.getElementById('tab-pp');
  if(!ov||!con)return;
  var isTc=tab==='tc';
  con.innerHTML=isTc?ov._tcContent:ov._ppContent;
  con.scrollTop=0;
  if(btnTc){btnTc.style.background=isTc?'var(--primary)':'var(--surface2)';btnTc.style.color=isTc?'white':'var(--text2)';btnTc.style.fontWeight=isTc?'700':'600';}
  if(btnPp){btnPp.style.background=isTc?'var(--surface2)':'var(--primary)';btnPp.style.color=isTc?'var(--text2)':'white';btnPp.style.fontWeight=isTc?'600':'700';}
}
