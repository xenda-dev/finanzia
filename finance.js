// ════════════════════════════════════════════════════════════
// EXCHANGE RATE — CACHE + FETCH
// ════════════════════════════════════════════════════════════
function _fxKey(base){ return 'fx_rates_' + base; }

function _getFxCache(base){
  try{ return JSON.parse(localStorage.getItem(_fxKey(base))) || null; }catch(e){ return null; }
}
function _setFxCache(base, data){
  try{ localStorage.setItem(_fxKey(base), JSON.stringify({base, data, timestamp:Date.now()})); }catch(e){}
}
function _isFxCacheValid(cache){
  if(!cache) return false;
  var ONE_HOUR = 60 * 60 * 1000;
  return (Date.now() - cache.timestamp) < ONE_HOUR;
}

async function getExchangeRates(base){
  var cache = _getFxCache(base);
  // 1. cache válido (< 1 hora)
  if(cache && cache.base === base && _isFxCacheValid(cache)){
    return {rates: cache.data, fromCache: false};
  }
  // 2. intentar API
  try{
    var res = await fetch('https://open.er-api.com/v6/latest/' + base);
    if(!res.ok) throw new Error('HTTP ' + res.status);
    var json = await res.json();
    if(json && json.rates){
      _setFxCache(base, json.rates);
      return {rates: json.rates, fromCache: false};
    }
  }catch(e){ console.warn('FX fetch failed', e); }
  // 3. fallback a cache viejo
  if(cache && cache.base === base){
    return {rates: cache.data, fromCache: true};
  }
  // 4. último recurso
  return {rates: {}, fromCache: false};
}

async function fetchExchangeRate(){
  try{
    const curs=S.currencies||[];
    if(curs.length<1){
      const el=document.getElementById('exchange-widget');
      if(el)renderExchangeWidget(el);
      return;
    }
    const base=S.baseCurrency||curs[0];
    const result = await getExchangeRates(base);
    if(result.rates && Object.keys(result.rates).length){
      if(!S.exchangeRate)S.exchangeRate={};
      S.exchangeRate.base=base;
      S.exchangeRate.rates=result.rates;
      S.exchangeRate.lastUpdated=new Date().toLocaleString('es');
      S.exchangeRate._fromStaleCache=result.fromCache;
      saveState();
      const el=document.getElementById('exchange-widget');
      if(el)renderExchangeWidget(el);
    }
  }catch(e){
    const el=document.getElementById('exchange-widget');
    if(el)renderExchangeWidget(el);
  }
}

function renderExchangeWidget(el){
  if(!el) return;
  // Siempre referencia desde la moneda activa seleccionada
  var selected = S.currency || S.baseCurrency || (S.currencies&&S.currencies[0]);
  var curs = (S.currencies||[]).filter(function(c){ return c !== selected; });
  if(!curs.length) {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }
  var r = S.exchangeRate || {};
  if(!r.rates || !r.base) {
    el.style.display = '';
    el.innerHTML = '<div style="font-size:11px;color:var(--text3);padding:2px 0">⏳ Consultando tipo de cambio...</div>';
    return;
  }
  var rates = r.rates;
  var rateBase = r.base;
  var pairs = curs.map(function(cur) {
    var rate;
    if(rateBase === selected) {
      rate = rates[cur] || null;
    } else if(rateBase === cur) {
      rate = rates[selected] ? 1/rates[selected] : null;
    } else {
      rate = (rates[selected]&&rates[cur]) ? rates[cur]/rates[selected] : null;
    }
    if(!rate) return null;
    var rStr = rate>=1000
      ? rate.toLocaleString('es',{maximumFractionDigits:0})
      : rate>=10
        ? rate.toLocaleString('es',{maximumFractionDigits:1})
        : rate>=1
          ? rate.toLocaleString('es',{maximumFractionDigits:2})
          : rate>=0.01
            ? rate.toFixed(4)
            : rate.toFixed(6);
    return {cur:cur, rStr:rStr};
  }).filter(Boolean);
  if(!pairs.length){el.innerHTML='';el.style.display='none';return;}
  var cols = Math.min(3, pairs.length);
  el.style.display = '';
  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:8px;margin-bottom:5px">'
    + pairs.map(function(p){
        return '<div>'
          +'<div style="font-size:9px;color:var(--text3);font-weight:500;margin-bottom:2px;white-space:nowrap">1 '+selected+' =</div>'
          +'<div style="font-size:13px;font-weight:700;color:var(--primary);white-space:nowrap">'+p.rStr+' '+p.cur+'</div>'
          +'</div>';
      }).join('')
    + '</div>'
    + '<div style="font-size:10px;color:var(--text3);display:flex;align-items:center;gap:4px">'
    + '<span style="width:5px;height:5px;border-radius:50%;background:#10B981;display:inline-block"></span>'
    + (r.lastUpdated ? 'Actualizado ' + r.lastUpdated : '⏳ Actualizando...')
    + (r._fromStaleCache ? ' · <span style="color:var(--warning)">Última tasa disponible</span>' : '')
    + '</div>';
}

// ════════════════════════════════════════════════════════════
// CURRENCY
// ════════════════════════════════════════════════════════════
// Currency metadata: symbol, locale, position
const CURRENCY_META={
  PLN:{sym:'zł',locale:'pl-PL',pos:'after'},
  COP:{sym:'$',locale:'es-CO',pos:'before'},
  USD:{sym:'$',locale:'en-US',pos:'before'},
  EUR:{sym:'€',locale:'de-DE',pos:'after'},
  GBP:{sym:'£',locale:'en-GB',pos:'before'},
  MXN:{sym:'$',locale:'es-MX',pos:'before'},
  ARS:{sym:'$',locale:'es-AR',pos:'before'},
  BRL:{sym:'R$',locale:'pt-BR',pos:'before'},
  CLP:{sym:'$',locale:'es-CL',pos:'before'},
  PEN:{sym:'S/',locale:'es-PE',pos:'before'},
  BOB:{sym:'Bs',locale:'es-BO',pos:'before'},
  PYG:{sym:'₲',locale:'es-PY',pos:'before'},
  CAD:{sym:'$',locale:'en-CA',pos:'before'},
  AUD:{sym:'$',locale:'en-AU',pos:'before'},
  CHF:{sym:'Fr',locale:'de-CH',pos:'before'},
  JPY:{sym:'¥',locale:'ja-JP',pos:'before'},
  CNY:{sym:'¥',locale:'zh-CN',pos:'before'},
  KRW:{sym:'₩',locale:'ko-KR',pos:'before'},
  INR:{sym:'₹',locale:'hi-IN',pos:'before'},
  RUB:{sym:'₽',locale:'ru-RU',pos:'after'},
  TRY:{sym:'₺',locale:'tr-TR',pos:'after'},
  NOK:{sym:'kr',locale:'nb-NO',pos:'after'},
  SEK:{sym:'kr',locale:'sv-SE',pos:'after'},
  DKK:{sym:'kr',locale:'da-DK',pos:'after'},
  CZK:{sym:'Kč',locale:'cs-CZ',pos:'after'},
  HUF:{sym:'Ft',locale:'hu-HU',pos:'after'},
  RON:{sym:'lei',locale:'ro-RO',pos:'after'},
  HKD:{sym:'$',locale:'zh-HK',pos:'before'},
  SGD:{sym:'$',locale:'en-SG',pos:'before'},
  TWD:{sym:'$',locale:'zh-TW',pos:'before'},
  NZD:{sym:'$',locale:'en-NZ',pos:'before'},
  ZAR:{sym:'R',locale:'en-ZA',pos:'before'},
  SAR:{sym:'﷼',locale:'ar-SA',pos:'after'},
  AED:{sym:'د.إ',locale:'ar-AE',pos:'after'},
  EGP:{sym:'£',locale:'ar-EG',pos:'before'},
  NGN:{sym:'₦',locale:'en-NG',pos:'before'},
  UAH:{sym:'₴',locale:'uk-UA',pos:'after'},
  IDR:{sym:'Rp',locale:'id-ID',pos:'before'},
  MYR:{sym:'RM',locale:'ms-MY',pos:'before'},
  THB:{sym:'฿',locale:'th-TH',pos:'before'},
  PHP:{sym:'₱',locale:'fil-PH',pos:'before'},
  PKR:{sym:'₨',locale:'ur-PK',pos:'before'},
  VND:{sym:'₫',locale:'vi-VN',pos:'after'},
  CRC:{sym:'₡',locale:'es-CR',pos:'before'},
  GTQ:{sym:'Q',locale:'es-GT',pos:'before'},
  HNL:{sym:'L',locale:'es-HN',pos:'before'},
  DOP:{sym:'$',locale:'es-DO',pos:'before'},
  UYU:{sym:'$',locale:'es-UY',pos:'before'},
  VES:{sym:'Bs',locale:'es-VE',pos:'before'},
  ILS:{sym:'₪',locale:'he-IL',pos:'before'},
  CLP:{sym:'$',locale:'es-CL',pos:'before'},

  AFN:{sym:'؋',locale:'fa-AF',pos:'after'},
  ALL:{sym:'L',locale:'sq-AL',pos:'after'},
  AOA:{sym:'Kz',locale:'pt-AO',pos:'after'},
  XCD:{sym:'$',locale:'en-AG',pos:'before'},
  DZD:{sym:'دج',locale:'ar-DZ',pos:'after'},
  AMD:{sym:'֏',locale:'hy-AM',pos:'after'},
  AZN:{sym:'₼',locale:'az-AZ',pos:'after'},
  BSD:{sym:'$',locale:'en-BS',pos:'before'},
  BDT:{sym:'৳',locale:'bn-BD',pos:'before'},
  BBD:{sym:'$',locale:'en-BB',pos:'before'},
  BHD:{sym:'BD',locale:'ar-BH',pos:'before'},
  BZD:{sym:'$',locale:'en-BZ',pos:'before'},
  XOF:{sym:'Fr',locale:'fr-BJ',pos:'after'},
  BYN:{sym:'Br',locale:'be-BY',pos:'after'},
  MMK:{sym:'K',locale:'my-MM',pos:'before'},
  BAM:{sym:'KM',locale:'bs-BA',pos:'after'},
  BWP:{sym:'P',locale:'en-BW',pos:'before'},
  BND:{sym:'$',locale:'ms-BN',pos:'before'},
  BGN:{sym:'лв',locale:'bg-BG',pos:'after'},
  BIF:{sym:'Fr',locale:'fr-BI',pos:'before'},
  BTN:{sym:'Nu',locale:'dz-BT',pos:'before'},
  CVE:{sym:'$',locale:'pt-CV',pos:'before'},
  KHR:{sym:'៛',locale:'km-KH',pos:'after'},
  XAF:{sym:'Fr',locale:'fr-CM',pos:'before'},
  QAR:{sym:'﷼',locale:'ar-QA',pos:'after'},
  KMF:{sym:'Fr',locale:'ar-KM',pos:'after'},
  CUP:{sym:'$',locale:'es-CU',pos:'before'},
  ERN:{sym:'Nfk',locale:'ti-ER',pos:'before'},
  ETB:{sym:'Br',locale:'am-ET',pos:'before'},
  FJD:{sym:'$',locale:'en-FJ',pos:'before'},
  GMD:{sym:'D',locale:'en-GM',pos:'before'},
  GEL:{sym:'₾',locale:'ka-GE',pos:'after'},
  GHS:{sym:'₵',locale:'en-GH',pos:'before'},
  GNF:{sym:'Fr',locale:'fr-GN',pos:'before'},
  GYD:{sym:'$',locale:'en-GY',pos:'before'},
  HTG:{sym:'G',locale:'fr-HT',pos:'before'},
  IRR:{sym:'﷼',locale:'fa-IR',pos:'after'},
  IQD:{sym:'ع.د',locale:'ar-IQ',pos:'after'},
  ISK:{sym:'kr',locale:'is-IS',pos:'after'},
  SBD:{sym:'$',locale:'en-SB',pos:'before'},
  JMD:{sym:'$',locale:'en-JM',pos:'before'},
  JOD:{sym:'JD',locale:'ar-JO',pos:'before'},
  KZT:{sym:'₸',locale:'kk-KZ',pos:'after'},
  KES:{sym:'KSh',locale:'sw-KE',pos:'before'},
  KGS:{sym:'с',locale:'ky-KG',pos:'after'},
  KWD:{sym:'KD',locale:'ar-KW',pos:'before'},
  LAK:{sym:'₭',locale:'lo-LA',pos:'after'},
  LSL:{sym:'L',locale:'st-LS',pos:'before'},
  LBP:{sym:'ل.ل',locale:'ar-LB',pos:'after'},
  LRD:{sym:'$',locale:'en-LR',pos:'before'},
  LYD:{sym:'LD',locale:'ar-LY',pos:'before'},
  MKD:{sym:'ден',locale:'mk-MK',pos:'after'},
  MGA:{sym:'Ar',locale:'mg-MG',pos:'after'},
  MWK:{sym:'MK',locale:'en-MW',pos:'before'},
  MVR:{sym:'Rf',locale:'dv-MV',pos:'after'},
  MAD:{sym:'MAD',locale:'ar-MA',pos:'after'},
  MUR:{sym:'₨',locale:'en-MU',pos:'before'},
  MRU:{sym:'UM',locale:'ar-MR',pos:'after'},
  MDL:{sym:'L',locale:'ro-MD',pos:'after'},
  MNT:{sym:'₮',locale:'mn-MN',pos:'after'},
  MZN:{sym:'MT',locale:'pt-MZ',pos:'after'},
  NAD:{sym:'$',locale:'en-NA',pos:'before'},
  NPR:{sym:'₨',locale:'ne-NP',pos:'before'},
  NIO:{sym:'C$',locale:'es-NI',pos:'before'},
  OMR:{sym:'﷼',locale:'ar-OM',pos:'after'},
  PAB:{sym:'B/.',locale:'es-PA',pos:'before'},
  PGK:{sym:'K',locale:'en-PG',pos:'before'},
  CDF:{sym:'Fr',locale:'fr-CD',pos:'before'},
  RWF:{sym:'Fr',locale:'rw-RW',pos:'before'},
  WST:{sym:'T',locale:'sm-WS',pos:'before'},
  STN:{sym:'Db',locale:'pt-ST',pos:'after'},
  RSD:{sym:'din',locale:'sr-RS',pos:'after'},
  SCR:{sym:'₨',locale:'en-SC',pos:'before'},
  SLE:{sym:'Le',locale:'en-SL',pos:'before'},
  SYP:{sym:'£',locale:'ar-SY',pos:'before'},
  SOS:{sym:'Sh',locale:'so-SO',pos:'before'},
  LKR:{sym:'₨',locale:'si-LK',pos:'before'},
  SDG:{sym:'£',locale:'ar-SD',pos:'before'},
  SSP:{sym:'£',locale:'en-SS',pos:'before'},
  SRD:{sym:'$',locale:'nl-SR',pos:'before'},
  TZS:{sym:'Sh',locale:'sw-TZ',pos:'before'},
  TJS:{sym:'SM',locale:'tg-TJ',pos:'after'},
  TOP:{sym:'T$',locale:'to-TO',pos:'before'},
  TTD:{sym:'$',locale:'en-TT',pos:'before'},
  TND:{sym:'DT',locale:'ar-TN',pos:'after'},
  TMT:{sym:'T',locale:'tk-TM',pos:'after'},
  UGX:{sym:'Sh',locale:'en-UG',pos:'before'},
  UZS:{sym:'so\'m',locale:'uz-UZ',pos:'after'},
  VUV:{sym:'Vt',locale:'bi-VU',pos:'after'},
  XPF:{sym:'Fr',locale:'fr-WF',pos:'before'},
  YER:{sym:'﷼',locale:'ar-YE',pos:'after'},
  DJF:{sym:'Fr',locale:'fr-DJ',pos:'before'},
  ZMW:{sym:'ZK',locale:'en-ZM',pos:'before'},
  ZWL:{sym:'$',locale:'en-ZW',pos:'before'}
};
function buildCurrencyOptions(selected){
  const curs=S.currencies&&S.currencies.length?S.currencies:[];
  if(!curs.length)return '<option value="">Sin moneda</option>';
  if(curs.length===1)return `<option value="${curs[0]}">${curs[0]}</option>`;
  return curs.map(c=>`<option value="${c}" ${c===selected?'selected':''}>${c}</option>`).join('');
}
function getCurrencyMeta(code){return CURRENCY_META[code]||{sym:code,locale:'en-US',pos:'before'};}
// Convierte YYYY-MM-DD al formato configurado en S.dateFormat
function fmtDate(d){
  if(!d)return '—';
  var p=String(d).split('-');
  if(p.length!==3)return d;
  var fmt=(typeof S!=='undefined'&&S.dateFormat)||'DD/MM/YYYY';
  if(fmt==='MM/DD/YYYY')return p[1]+'/'+p[2]+'/'+p[0];
  if(fmt==='YYYY-MM-DD')return p[0]+'-'+p[1]+'-'+p[2];
  return p[2]+'/'+p[1]+'/'+p[0];
}
function fmtTime(t){
  if(!t)return '—';
  var fmt=(typeof S!=='undefined'&&S.timeFormat)||'24h';
  if(fmt==='24h')return t;
  var parts=String(t).split(':');
  if(parts.length<2)return t;
  var h=parseInt(parts[0],10);
  var m=parts[1];
  var ampm=h>=12?'PM':'AM';
  h=h%12||12;
  return h+':'+m+' '+ampm;
}
function fmt(amount,cur){
  const code=cur||S.currency||'';
  const n=parseFloat(amount)||0;
  // Determine decimals: user preference overrides currency default
  const noDec=(['JPY','KRW','CLP','PYG'].includes(code));
  let decimals;
  if(S.numFormat==='0')decimals=0;
  else if(S.numFormat==='2')decimals=2;
  else decimals=noDec?0:2; // auto (default)
  if(!code)return n.toLocaleString('es-CO',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const meta=getCurrencyMeta(code);
  let numStr;
  try{numStr=n.toLocaleString(meta.locale,{minimumFractionDigits:decimals,maximumFractionDigits:decimals});}
  catch(e){numStr=n.toFixed(decimals);}
  return meta.pos==='before'?meta.sym+numStr:numStr+' '+meta.sym;
}
function fmtC(val,cur){
  var absV=Math.abs(val);
  if(absV>=1000000){return (val<0?'-':'')+(absV/1000000).toFixed(1).replace(/\.0$/,'')+'M';}
  if(absV>=10000){return (val<0?'-':'')+(absV/1000).toFixed(1).replace(/\.0$/,'')+'K';}
  return fmt(val,cur);
}
function setCurrency(c){
  S.currency=c;
  S.baseCurrency=c;
  document.querySelectorAll('.cur-btn').forEach(b=>b.classList.toggle('active',b.dataset.cur===c));
  saveState();renderPage(S.currentPage);
  reformatNumFields();
  fetchExchangeRate();
}
function refreshCurrencyToggle(){
  const toggle=document.getElementById('currency-toggle');
  if(!toggle)return;
  const curs=S.currencies&&S.currencies.length?S.currencies:[];
  if(!curs.length){toggle.innerHTML='<span style="color:var(--text3);font-size:12px;padding:4px 8px">—</span>';return;}
  toggle.innerHTML=curs.map(c=>`<button class="cur-btn ${c===S.currency?'active':''}" data-cur="${c}" onclick="setCurrency('${c}')">${c}</button>`).join('');
  // Make sure current currency is valid
  if(!curs.includes(S.currency)){S.currency=curs[0];saveState();}
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════
const getAcc=id=>{
  if(!id)return null;
  if(id.includes('|')){const[pid]=id.split('|');return S.accounts.find(a=>a.id===pid)||null;}
  return S.accounts.find(a=>a.id===id)||null;
};
// Get actual account ID from potentially pipe-formatted id (for transactions)
function resolveAccId(id){
  if(!id)return id;
  if(id.includes('|'))return id.split('|')[0];
  return id;
}
const getCat=id=>S.categories.find(c=>c.id===id);
const getSub=id=>S.subcategories.find(s=>s.id===id);
// Variantes filtradas: solo devuelven ítems no eliminados (para pickers y selects)
const getAccActive=id=>{
  if(!id)return null;
  if(id.includes('|')){const[pid]=id.split('|');return filterDeleted(S.accounts).find(a=>a.id===pid)||null;}
  return filterDeleted(S.accounts).find(a=>a.id===id)||null;
};
const getCatActive=id=>filterDeleted(S.categories).find(c=>c.id===id)||null;
const getSubActive=id=>filterDeleted(S.subcategories).find(s=>s.id===id)||null;
function getTEM(annualRate){return Math.pow(1+(annualRate||0)/100,1/12)-1;}
function isInternalTransaction(t){
  if(!t||!t.description)return false;
  var d=t.description;
  if(t.type==='ingreso')return d.startsWith('Ahorro:')||d.startsWith('AUTO:')||d.startsWith('Abono:');
  if(t.type==='gasto')return d.startsWith('Pago deuda:')||d.startsWith('AUTO:');
  return false;
}
const getBank=(bankId,cur)=>{const l=cur==='PLN'?BANKS_PLN:BANKS_COP;return l.find(b=>b.id===bankId)||null;}

function bankBadge(bankId,cur,size=44,acc){
  const b=getBank(bankId,cur);
  if(!b){
    // Use account's icon/subtype to pick the right emoji
    const emoji=acc?(acc.subtype==='efectivo'?'💵':acc.subtype==='digital'?'📱':acc.subtype==='inversion'?'📈':acc.icon||'🏦'):'🏦';
    return `<div style="width:${size}px;height:${size}px;border-radius:${size*.27}px;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:${size*.44}px">${emoji}</div>`;
  }
  const fs=b.abbr.length>3?size*.22:size*.25;
  return `<div class="bank-badge" style="width:${size}px;height:${size}px;background:${b.color};border-radius:${size*.27}px;font-size:${fs}px">${b.abbr}</div>`;
}

function getBalance(accountId){
  const acc=getAcc(accountId);if(!acc)return 0;
  let bal=parseFloat(acc.initialBalance)||0;
  // Sub-account balances only for activos
  if(acc.type==='activo'&&acc.subAccounts&&acc.subAccounts.length){
    acc.subAccounts.forEach(s=>bal+=(parseFloat(s.balance)||0));
  }
  const isPasivo=acc.type==='pasivo';
  filterDeleted(S.transactions).filter(t=>t.currency===(acc.currency||S.currency)).forEach(t=>{
    const amt=parseFloat(t.amount)||0;
    if(t.type==='transferencia'){
      // Transfers: each side handled exactly once
      if(t.accountId===accountId)bal-=amt;
      else if(t.toAccountId===accountId){
        if(isPasivo)bal-=amt; // payment reduces debt
        else bal+=amt;
      }
    } else if(t.accountId===accountId){
      if(!isPasivo){
        if(t.type==='ingreso')bal+=amt;
        else if(t.type==='gasto')bal-=amt;
      } else {
        // Pasivo: gasto (purchase) ADDS to debt, ingreso (payment) REDUCES it
        if(t.type==='gasto')bal+=amt;
        else if(t.type==='ingreso')bal-=amt;
      }
    }
  });
  return bal;
}
function getTotalBalance(){
  return filterDeleted(S.accounts).filter(a=>a.type==='activo'&&(a.currency||S.currency)===S.currency&&!a.excludeFromTotal).reduce((s,a)=>s+getBalance(a.id),0);
}
function getConsolidatedBalance(targetCur){
  var base=targetCur||S.baseCurrency||(S.currencies&&S.currencies[0])||S.currency;
  if(!base)return 0;
  var rates=(S.exchangeRate&&S.exchangeRate.rates)||{};
  var rateBase=S.exchangeRate&&S.exchangeRate.base;
  var total=0;
  filterDeleted(S.accounts).forEach(function(acc){
    if(acc.type!=='activo')return;
    var bal=getBalance(acc.id);
    var cur=acc.currency||base;
    if(cur===base){
      total+=bal;
    }else if(Object.keys(rates).length&&rateBase){
      var toBase;
      if(rateBase===base){
        toBase=rates[cur]?bal/rates[cur]:bal;
      }else if(rateBase===cur){
        toBase=rates[base]?bal*rates[base]:bal;
      }else{
        var r1=rates[base]||1;
        var r2=rates[cur]||1;
        toBase=bal*(r1/r2);
      }
      total+=toBase;
    }else{
      total+=bal;
    }
  });
  return total;
}
function getBalanceForCurrency(cur){
  return filterDeleted(S.accounts)
    .filter(function(a){return a.type==='activo'&&(a.currency||S.currencies[0])===cur;})
    .reduce(function(s,a){return s+getBalance(a.id);},0);
}
function convertToBase(amount,fromCur){
  var base=S.baseCurrency||(S.currencies&&S.currencies[0])||S.currency;
  if(!base||fromCur===base)return amount;
  var rates=(S.exchangeRate&&S.exchangeRate.rates)||{};
  var rateBase=S.exchangeRate&&S.exchangeRate.base;
  if(!rateBase||!Object.keys(rates).length)return amount;
  if(rateBase===base)return rates[fromCur]?amount/rates[fromCur]:amount;
  if(rateBase===fromCur)return rates[base]?amount*rates[base]:amount;
  var r1=rates[base]||1;
  var r2=rates[fromCur]||1;
  return amount*(r1/r2);
}
function getNetWorth(){
  const _fa=filterDeleted(S.accounts);
  const assets=_fa.filter(a=>a.type==='activo'&&(a.currency||S.currency)===S.currency&&!a.excludeFromTotal).reduce((s,a)=>s+getBalance(a.id),0);
  const liabilities=_fa.filter(a=>a.type==='pasivo'&&(a.currency||S.currency)===S.currency&&!a.excludeFromTotal).reduce((s,a)=>s+Math.abs(getBalance(a.id)),0);
  return{assets,liabilities,net:assets-liabilities};
}

function getAnalysisPeriodRange(){
  const yr=S.analysisYear||new Date().getFullYear();
  const sub=S.analysisPeriodSub||'anual';
  const from=new Date(yr,0,1,0,0,0,0);
  const to=new Date(yr,11,31,23,59,59,999);
  if(sub==='anual'){return{from,to};}
  if(sub==='q1'){return{from:new Date(yr,0,1),to:new Date(yr,2,31,23,59,59)};}
  if(sub==='q2'){return{from:new Date(yr,3,1),to:new Date(yr,5,30,23,59,59)};}
  if(sub==='q3'){return{from:new Date(yr,6,1),to:new Date(yr,8,30,23,59,59)};}
  if(sub==='q4'){return{from:new Date(yr,9,1),to:new Date(yr,11,31,23,59,59)};}
  if(sub==='sem1'){return{from:new Date(yr,0,1),to:new Date(yr,5,30,23,59,59)};}
  if(sub==='sem2'){return{from:new Date(yr,6,1),to:new Date(yr,11,31,23,59,59)};}
  if(sub==='7d'){const f=new Date();f.setDate(f.getDate()-7);return{from:f,to:new Date()};}
  if(sub==='30d'){const f=new Date();f.setDate(f.getDate()-30);return{from:f,to:new Date()};}
  if(sub==='90d'){const f=new Date();f.setDate(f.getDate()-90);return{from:f,to:new Date()};}
  // Month: '01'-'12'
  const m=parseInt(sub)-1;
  if(!isNaN(m)&&m>=0&&m<=11){
    const daysInMonth=new Date(yr,m+1,0).getDate();
    return{from:new Date(yr,m,1,0,0,0),to:new Date(yr,m,daysInMonth,23,59,59)};
  }
  return{from,to};
}
function getPeriodRange(period){
  const now=new Date();const from=new Date();const to=new Date();
  to.setHours(23,59,59,999);
  switch(period){
    case'Diario':from.setHours(0,0,0,0);break;
    case'Semanal':from.setDate(now.getDate()-7);break;
    case'Quincenal':from.setDate(now.getDate()-15);break;
    case'Mensual':from.setDate(1);from.setHours(0,0,0,0);break;
    case'Bimestral':from.setMonth(now.getMonth()-2,1);break;
    case'Trimestral':from.setMonth(now.getMonth()-3,1);break;
    case'Semestral':from.setMonth(now.getMonth()-6,1);break;
    case'Anual':from.setMonth(0,1);from.setHours(0,0,0,0);break;
    default:from.setDate(1);from.setHours(0,0,0,0);
  }
  return{from,to};
}

function getMonthTotals(period){
  period=period||'Mensual';
  const{from,to}=getPeriodRange(period);
  const txs=filterDeleted(S.transactions).filter(t=>{
    const d=new Date(t.date);
    return t.currency===S.currency&&d>=from&&d<=to;
  });
  const inc=txs.filter(t=>t.type==='ingreso'&&!isInternalTransaction(t)).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const exp=txs.filter(t=>t.type==='gasto'&&!isInternalTransaction(t)).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  return{inc,exp};
}

function getBudgetSpent(b,refDate){
  const now=refDate||new Date();
  return filterDeleted(S.transactions).filter(t=>t.type==='gasto'&&t.categoryId===b.categoryId&&
    (!b.subcategoryId||t.subcategoryId===b.subcategoryId)&&
    t.currency===(b.currency||S.currency)&&
    (()=>{const d=new Date(t.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();})()
  ).reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
}

function daysUntil(dateStr){
  if(!dateStr)return 999;
  const d=new Date(dateStr);const now=new Date();
  d.setHours(0,0,0,0);now.setHours(0,0,0,0);
  return Math.round((d-now)/86400000);
}
function todayStr(){return new Date().toISOString().split('T')[0];}

function subOptions(catId,selSubId){
  const subs=filterDeleted(S.subcategories).filter(s=>s.categoryId===catId);
  return '<option value="">Sin subcategoría</option>'+subs.map(s=>`<option value="${s.id}" ${s.id===selSubId?'selected':''}>${s.icon} ${s.name}</option>`).join('');
}
function updateSubs(catId,targetId,selectedSubId){
  const el=document.getElementById(targetId);if(el)el.innerHTML=subOptions(catId,selectedSubId||'');
}function catOptions(type,selectedId){
  let cats=filterDeleted(S.categories);
  if(type==='gasto')cats=cats.filter(c=>c.type!=='ingreso');
  if(type==='ingreso')cats=cats.filter(c=>c.type!=='gasto');
  return '<option value="">Categoría</option>'+cats.map(c=>`<option value="${c.id}" ${c.id===selectedId?'selected':''}>${c.icon} ${c.name}</option>`).join('');
}

// ════════════════════════════════════════════════════════════
// REGLA 50/30/20
// ════════════════════════════════════════════════════════════
function renderRule502030(refDate){
  var _ref=refDate||new Date();
  var _rFrom=new Date(_ref.getFullYear(),_ref.getMonth(),1,0,0,0);
  var _rTo=new Date(_ref.getFullYear(),_ref.getMonth()+1,0,23,59,59);
  var _rAllTxs=filterDeleted(S.transactions).filter(function(t){
    var d=new Date(t.date);return t.currency===S.currency&&d>=_rFrom&&d<=_rTo;
  });
  const inc=_rAllTxs.filter(function(t){return t.type==='ingreso'&&!isInternalTransaction(t);}).reduce(function(s,t){return s+(parseFloat(t.amount)||0);},0);
  if(inc<=0)return`<div class="card" style="margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <div class="card-title" style="margin:0">📊 Regla 50/30/20</div>
    </div>
    <div style="font-size:12px;color:var(--text2);padding:8px 0">Registra ingresos este mes para ver tu distribución ideal vs. real.</div>
  </div>`;

  // Classify transactions by nature
  const txs=_rAllTxs.filter(t=>t.type==='gasto');
  let nec=0,des=0,aho=0;
  txs.forEach(t=>{
    const cat=getCat(t.categoryId);
    const nature=cat?cat.nature:'deseos';
    const amt=parseFloat(t.amount)||0;
    if(nature==='necesidades')nec+=amt;
    else if(nature==='deseos')des+=amt;
    else if(nature==='ahorros')aho+=amt;
  });

  const idealNec=inc*0.5, idealDes=inc*0.3, idealAho=inc*0.2;
  const rows=[
    {label:'🔴 NECESIDADES',ideal:idealNec,real:nec,idealPct:50,color:'#EF4444'},
    {label:'🟡 DESEOS',ideal:idealDes,real:des,idealPct:30,color:'#F59E0B'},
    {label:'🟢 AHORROS',ideal:idealAho,real:aho,idealPct:20,color:'#10B981'},
  ];

  const rowsHtml=rows.map(r=>{
    const realPct=inc>0?Math.round(r.real/inc*100):0;
    const diff=r.ideal-r.real;
    const over=diff<0;
    const obsLabel=over?`⚠ +${fmt(Math.abs(diff))}`:diff===0?'✓ Exacto':`✓ −${fmt(diff)}`;
    const obsColor=over?'var(--danger)':'var(--success)';
    const barPct=Math.min(100,r.ideal>0?Math.round(r.real/r.ideal*100):0);
    const barColor=over?'var(--danger)':realPct>=r.idealPct*0.9?'var(--success)':'var(--warning)';
    return`<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-size:12px;font-weight:700">${r.label}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:8px;text-align:center">
        <div>
          <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">IDEAL</div>
          <div style="font-size:12px;font-weight:700;color:var(--text)">${r.idealPct}%</div>
          <div style="font-size:10px;color:var(--text2)">${fmt(r.ideal)}</div>
        </div>
        <div>
          <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">REAL</div>
          <div style="font-size:12px;font-weight:700;color:${r.color}">${realPct}%</div>
          <div style="font-size:10px;color:var(--text2)">${fmt(r.real)}</div>
        </div>
        <div>
          <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">OBSERVACIÓN</div>
          <div style="font-size:11px;font-weight:700;color:${obsColor}">${obsLabel}</div>
          <div style="font-size:10px;color:var(--text2)">${over?'Excedido':'Disponible'}</div>
        </div>
      </div>
      <div style="height:8px;background:var(--surface3);border-radius:99px;overflow:hidden">
        <div style="height:100%;border-radius:99px;background:${barColor};width:${barPct}%;transition:width .4s"></div>
      </div>
    </div>`;
  }).join('');

  const necPct=inc>0?Math.round(nec/inc*100):0;
  const desPct=inc>0?Math.round(des/inc*100):0;
  const ahoPct=inc>0?Math.round(aho/inc*100):0;
  const necOK=necPct<=50,desOK=desPct<=30,ahoOK=ahoPct>=20;

  const collapsedHtml=`<div style="display:flex;gap:12px;align-items:center;margin-top:4px">
    <div style="display:flex;align-items:center;gap:4px"><span style="color:${necOK?'var(--success)':'var(--danger)'}">🔴</span><span style="font-size:11px;font-weight:700;color:${necOK?'var(--success)':'var(--danger)'}">${necPct}%</span></div>
    <div style="display:flex;align-items:center;gap:4px"><span style="color:${desOK?'var(--success)':'var(--warning)'}">🟡</span><span style="font-size:11px;font-weight:700;color:${desOK?'var(--success)':'var(--warning)'}">${desPct}%</span></div>
    <div style="display:flex;align-items:center;gap:4px"><span style="color:${ahoOK?'var(--success)':'var(--danger)'}">🟢</span><span style="font-size:11px;font-weight:700;color:${ahoOK?'var(--success)':'var(--danger)'}">${ahoPct}%</span></div>
    <span style="font-size:10px;color:var(--text3);margin-left:4px">${necOK&&desOK&&ahoOK?'✓ Todo OK':'⚠ Revisar'}</span>
  </div>`;

  return`<div class="card" style="margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="toggleRule502030()">
      <div class="card-title" style="margin:0">📊 Regla 50/30/20</div>
      <span id="rule-arrow" style="color:var(--text3);font-size:12px;transition:transform .2s">▼</span>
    </div>
    <div id="rule-collapsed" style="display:none">${collapsedHtml}</div>
    <div id="rule-expanded">
      <div style="font-size:10px;color:var(--text3);margin:4px 0 12px">Ingresos del mes: <strong style="color:var(--text)">${fmt(inc)}</strong></div>
      ${rowsHtml}
    </div>
  </div>`;
}
function toggleRule502030(){
  const exp=document.getElementById('rule-expanded');
  const col=document.getElementById('rule-collapsed');
  const arrow=document.getElementById('rule-arrow');
  if(!exp||!col)return;
  const isOpen=exp.style.display!=='none';
  exp.style.display=isOpen?'none':'block';
  col.style.display=isOpen?'flex':'none';
  if(arrow)arrow.style.transform=isOpen?'rotate(-90deg)':'';
}

// ════════════════════════════════════════════════════════════
// SIMULADOR JUBILACIÓN
// ════════════════════════════════════════════════════════════
function renderJubilacion(){
  return'<div style="padding:0">'+
    '<div class="card" style="margin-bottom:14px;padding:14px;border-left:3px solid #7461EF">'+
      '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">👴 ¿Cuánto necesitas para jubilarte tranquilo?</div>'+
      '<div style="font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:10px">Aquí lo calculamos sin rodeos. Estima cuánto capital acumularás al retirarte y si es suficiente para vivir tranquilo los años que vienen.</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
        '<div style="background:rgba(116,97,239,.08);border-radius:var(--radius-sm);padding:8px">'+
          '<div style="font-size:9px;font-weight:700;color:#7461EF;margin-bottom:4px;text-transform:uppercase">¿Quién lo usa?</div>'+
          '<div style="font-size:11px;color:var(--text2);line-height:1.5">· Profesionales 30-50 años<br>· Emprendedores sin pensión<br>· Cualquier persona</div>'+
        '</div>'+
        '<div style="background:rgba(16,185,129,.08);border-radius:var(--radius-sm);padding:8px">'+
          '<div style="font-size:9px;font-weight:700;color:var(--success);margin-bottom:4px;text-transform:uppercase">Regla del 4%</div>'+
          '<div style="font-size:11px;color:var(--text2);line-height:1.5">Si retiras máx. 4% anual de tu capital, estadísticamente dura 30+ años</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="card" style="margin-bottom:14px">'+
      '<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">Datos personales</div>'+
      '<div class="form-row">'+
        '<div class="form-group"><label class="form-label">Edad actual</label>'+
        '<input class="form-input" type="number" id="jub-age-now" placeholder="Ej: 35" min="18" max="80" oninput="calcJubilacion()"></div>'+
        '<div class="form-group"><label class="form-label">Edad de retiro</label>'+
        '<input class="form-input" type="number" id="jub-age-ret" placeholder="Ej: 65" min="40" max="80" oninput="calcJubilacion()"></div>'+
      '</div>'+
      '<div class="form-group"><label class="form-label">💰 Ahorro actual destinado al retiro</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="jub-current" data-numfmt="num" placeholder="Ej: 0" oninput="numInput(this);calcJubilacion()"></div>'+
      '<div class="form-group"><label class="form-label">📅 Aporte mensual al retiro</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="jub-monthly" data-numfmt="num" placeholder="Ej: 500.000" oninput="numInput(this);calcJubilacion()"></div>'+
      '<div class="form-row">'+
        '<div class="form-group"><label class="form-label">📈 TAE esperada (%)</label>'+
        '<input class="form-input" type="text" inputmode="numeric" id="jub-rate" data-numfmt="pct" placeholder="0.00%" oninput="pctInput(this);calcJubilacion()"></div>'+
        '<div class="form-group"><label class="form-label">💸 Inflación anual (%)</label>'+
        '<input class="form-input" type="text" inputmode="numeric" id="jub-inflation" data-numfmt="pct" placeholder="0.00%" oninput="pctInput(this);calcJubilacion()"></div>'+
      '</div>'+
      '<div class="form-group"><label class="form-label">🏖️ Renta mensual deseada al retiro</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="jub-pension" data-numfmt="num" placeholder="Ej: 3.000.000" oninput="numInput(this);calcJubilacion()"></div>'+
      '<div class="form-group"><label class="form-label">Tasa de retiro sostenible (%)</label>'+
      '<div class="bs-trigger" onclick="showJubRetiroBS()" style="justify-content:space-between">'+
        '<span id="jub-retiro-lbl" style="color:var(--text)">4.0% (conservador)</span>'+
        '<span style="color:var(--text3);font-size:18px">›</span>'+
      '</div>'+
      '<input type="hidden" id="jub-retiro" value="4">'+
      '</div>'+
    '</div>'+
    '<div id="jub-result" style="display:none">'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;align-items:stretch">'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Capital al retiro</div><div style="font-size:14px;font-weight:800;color:var(--success);line-height:1.2" id="jub-capital">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Renta mensual posible</div><div style="font-size:14px;font-weight:800;color:var(--primary);line-height:1.2" id="jub-renta">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Años ahorrando</div><div style="font-size:14px;font-weight:800;color:var(--text);line-height:1.2" id="jub-years">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Capital dura</div><div style="font-size:14px;font-weight:800;color:var(--warning);line-height:1.2" id="jub-duracion">—</div></div>'+
      '</div>'+
      '<div id="jub-alert" style="display:none;margin-bottom:10px"></div>'+
    '</div>'+
    '<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:var(--radius-sm);padding:10px 12px;font-size:10px;color:var(--text2);line-height:1.5">'+
      '⚠️ Proyección referencial. No incluye pensión pública, impuestos ni variaciones del mercado. Consulta un asesor financiero.'+
    '</div>'+
  '</div>';
}
function showJubRetiroBS(){
  var items=[
    {val:'3',label:'3.0% — Muy conservador (40+ años de retiro)'},
    {val:'4',label:'4.0% — Conservador — Regla del 4%'},
    {val:'5',label:'5.0% — Moderado (LATAM recomendado)'},
    {val:'6',label:'6.0% — Agresivo (retiro más corto)'},
  ];
  var cur=document.getElementById('jub-retiro')?.value||'4';
  showBottomSheet({title:'Tasa de retiro',items:items,selected:cur,onSelect:function(val){
    var labels={'3':'3.0% (conservador)','4':'4.0% (conservador)','5':'5.0% (moderado)','6':'6.0% (agresivo)'};
    var lbl=document.getElementById('jub-retiro-lbl');
    if(lbl)lbl.textContent=labels[val]||val+'%';
    var inp=document.getElementById('jub-retiro');
    if(inp)inp.value=val;
    calcJubilacion();
  }});
}
function calcJubilacion(){
  var ageNow=parseInt(document.getElementById('jub-age-now')?.value)||0;
  var ageRet=parseInt(document.getElementById('jub-age-ret')?.value)||0;
  var current=parseNum(document.getElementById('jub-current')?.value)||0;
  var monthly=parseNum(document.getElementById('jub-monthly')?.value)||0;
  var tae=parsePct(document.getElementById('jub-rate')?.value)||0;
  var inflation=parsePct(document.getElementById('jub-inflation')?.value)||0;
  var pension=parseNum(document.getElementById('jub-pension')?.value)||0;
  var retiro=parseFloat(document.getElementById('jub-retiro')?.value)||4;
  var res=document.getElementById('jub-result');
  if(!ageNow||!ageRet||ageRet<=ageNow){if(res)res.style.display='none';return;}
  var years=ageRet-ageNow;
  var n=years*12; // total months saving

  // TEM correcta desde TAE efectiva anual
  var tem=getTEM(tae);

  // FV capital inicial + FV aportes mensuales (compuesto mensual)
  var fvLump=current*Math.pow(1+tem,n);
  var fvAnnuity=tem>0?monthly*(Math.pow(1+tem,n)-1)/tem:monthly*n;
  var capital=fvLump+fvAnnuity;

  // Renta mensual sostenible según tasa de retiro elegida
  var rentaMensual=capital*(retiro/100)/12;

  // Capital real: valor del capital en pesos de hoy (ajustado por inflación)
  var capitalReal=capital/Math.pow(1+inflation/100,years);

  // Cuántos meses dura el capital retirando 'pension' mensual
  // Capital sigue rindiendo durante el retiro — fórmula de anualidad inversa
  // n = -ln(1 - C*r/P) / ln(1+r)  donde r = TEM durante retiro
  var duracion='Indefinido ∞';
  if(pension>0){
    if(rentaMensual<pension){
      duracion='No alcanza';
    } else {
      // Capital retira 'pension' y el resto sigue rindiendo a la misma TAE
      var product=tem*capital/pension;
      if(tem<=0){
        duracion=Math.floor(capital/pension/12)+' años';
      } else if(product>=1){
        // Rendimiento >= retiro → capital nunca se agota
        duracion='Indefinido ∞';
      } else {
        var durMeses=-Math.log(1-product)/Math.log(1+tem);
        var durAnios=Math.floor(durMeses/12);
        var durMesesResto=Math.round(durMeses%12);
        duracion=durAnios+'a '+(durMesesResto>0?durMesesResto+'m':'');
      }
    }
  }

  if(res)res.style.display='block';
  var set=function(id,v){var el=document.getElementById(id);if(el){el.textContent=v;var l=v.length;el.style.fontSize=l>14?'11px':l>10?'12px':'14px';}};
  set('jub-capital',fmtSim(capital));
  set('jub-renta',fmtSim(rentaMensual)+'/mes');
  set('jub-years',years+' años');
  set('jub-duracion',duracion);

  var alertEl=document.getElementById('jub-alert');
  if(alertEl){
    if(pension>0&&rentaMensual<pension){
      alertEl.style.display='block';
      alertEl.innerHTML='<div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:var(--radius-sm);padding:10px 12px;font-size:11px;color:var(--danger);line-height:1.5">⚠️ Tu renta posible ('+fmtSim(rentaMensual)+'/mes) no alcanza tu meta de '+fmtSim(pension)+'/mes. Considera aumentar el aporte mensual o la TAE esperada.</div>';
    } else if(pension>0){
      alertEl.style.display='block';
      alertEl.innerHTML='<div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:var(--radius-sm);padding:10px 12px;font-size:11px;color:var(--success);line-height:1.5">✅ ¡Meta alcanzada! Renta posible: '+fmtSim(rentaMensual)+'/mes. Capital en pesos de hoy (ajustado por inflación '+inflation.toFixed(1)+'%): '+fmtSim(capitalReal)+'</div>';
    } else {alertEl.style.display='none';}
  }
}

// ════════════════════════════════════════════════════════════
// SIMULADOR FONDO DE EMERGENCIA
// ════════════════════════════════════════════════════════════
function renderEmergencia(){
  return'<div style="padding:0">'+
    '<div class="card" style="margin-bottom:14px;padding:14px;border-left:3px solid #10B981">'+
      '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">🛡️ Tu colchón financiero</div>'+
      '<div style="font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:10px">Ese dinero que te salva cuando todo sale mal. Pérdida de empleo, enfermedad, reparaciones urgentes. ¿Tienes el tuyo listo?</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
        '<div style="background:rgba(16,185,129,.08);border-radius:var(--radius-sm);padding:8px">'+
          '<div style="font-size:9px;font-weight:700;color:var(--success);margin-bottom:4px;text-transform:uppercase">¿Cuántos meses?</div>'+
          '<div style="font-size:11px;color:var(--text2);line-height:1.5">· Empleado: 3-4 meses<br>· Independiente: 6 meses<br>· Empresario: 9-12 meses</div>'+
        '</div>'+
        '<div style="background:rgba(59,130,246,.08);border-radius:var(--radius-sm);padding:8px">'+
          '<div style="font-size:9px;font-weight:700;color:var(--primary);margin-bottom:4px;text-transform:uppercase">¿Dónde guardarlo?</div>'+
          '<div style="font-size:11px;color:var(--text2);line-height:1.5">Cuenta de ahorro, CDT a corto plazo o fondo monetario. Prioriza liquidez sobre rentabilidad</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="card" style="margin-bottom:14px">'+
      '<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">Gastos mensuales fijos</div>'+
      '<div class="form-group"><label class="form-label">🏠 Vivienda (arriendo/hipoteca)</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="eme-vivienda" data-numfmt="num" placeholder="0" oninput="numInput(this);calcEmergencia()"></div>'+
      '<div class="form-group"><label class="form-label">🛒 Alimentación</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="eme-alim" data-numfmt="num" placeholder="0" oninput="numInput(this);calcEmergencia()"></div>'+
      '<div class="form-group"><label class="form-label">⚡ Servicios (luz, agua, gas, internet)</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="eme-servicios" data-numfmt="num" placeholder="0" oninput="numInput(this);calcEmergencia()"></div>'+
      '<div class="form-group"><label class="form-label">🚗 Transporte</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="eme-transporte" data-numfmt="num" placeholder="0" oninput="numInput(this);calcEmergencia()"></div>'+
      '<div class="form-group"><label class="form-label">💳 Deudas (cuotas mínimas)</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="eme-deudas" data-numfmt="num" placeholder="0" oninput="numInput(this);calcEmergencia()"></div>'+
      '<div class="form-group"><label class="form-label">🏥 Salud y seguros</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="eme-salud" data-numfmt="num" placeholder="0" oninput="numInput(this);calcEmergencia()"></div>'+
      '<div class="form-group"><label class="form-label">Tipo de empleo</label>'+
      '<div class="bs-trigger" onclick="showEmeEmpleoBS()" style="justify-content:space-between">'+
        '<span id="eme-empleo-lbl" style="color:var(--text)">Empleado (3 meses)</span>'+
        '<span style="color:var(--text3);font-size:18px">›</span>'+
      '</div>'+
      '<input type="hidden" id="eme-meses" value="3"></div>'+
      '<div class="form-group"><label class="form-label">💰 Ahorro actual para emergencias</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="eme-actual" data-numfmt="num" placeholder="0" oninput="numInput(this);calcEmergencia()"></div>'+
      '<div class="form-group"><label class="form-label">📅 Aporte mensual al fondo</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="eme-aporte" data-numfmt="num" placeholder="0" oninput="numInput(this);calcEmergencia()"></div>'+
    '</div>'+
    '<div id="eme-result" style="display:none">'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;align-items:stretch">'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Gasto mensual total</div><div style="font-size:14px;font-weight:800;color:var(--text);line-height:1.2" id="eme-total-gasto">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Meta del fondo</div><div style="font-size:14px;font-weight:800;color:var(--primary);line-height:1.2" id="eme-meta">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Falta por ahorrar</div><div style="font-size:14px;font-weight:800;color:var(--danger);line-height:1.2" id="eme-falta">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Tiempo estimado</div><div style="font-size:14px;font-weight:800;color:var(--warning);line-height:1.2" id="eme-tiempo">—</div></div>'+
      '</div>'+
      '<div id="eme-status" style="margin-bottom:10px"></div>'+
    '</div>'+
    '<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:var(--radius-sm);padding:10px 12px;font-size:10px;color:var(--text2);line-height:1.5">'+
      '⚠️ Valores orientativos. El fondo de emergencia no es una inversión — prioriza disponibilidad inmediata.'+
    '</div>'+
  '</div>';
}
function showEmeEmpleoBS(){
  var items=[
    {val:'3',label:'Empleado dependiente (3 meses)'},
    {val:'6',label:'Independiente / Freelance (6 meses)'},
    {val:'9',label:'Empresario / Varios ingresos (9 meses)'},
    {val:'12',label:'Alto riesgo / Ingresos variables (12 meses)'},
  ];
  var cur=document.getElementById('eme-meses')?.value||'3';
  showBottomSheet({title:'Tipo de empleo',items:items,selected:cur,onSelect:function(val){
    var labels={'3':'Empleado (3 meses)','6':'Independiente (6 meses)','9':'Empresario (9 meses)','12':'Alto riesgo (12 meses)'};
    var lbl=document.getElementById('eme-empleo-lbl');
    if(lbl)lbl.textContent=labels[val]||val+' meses';
    var inp=document.getElementById('eme-meses');
    if(inp)inp.value=val;
    calcEmergencia();
  }});
}
function calcEmergencia(){
  var vivienda=parseNum(document.getElementById('eme-vivienda')?.value)||0;
  var alim=parseNum(document.getElementById('eme-alim')?.value)||0;
  var servicios=parseNum(document.getElementById('eme-servicios')?.value)||0;
  var transporte=parseNum(document.getElementById('eme-transporte')?.value)||0;
  var deudas=parseNum(document.getElementById('eme-deudas')?.value)||0;
  var salud=parseNum(document.getElementById('eme-salud')?.value)||0;
  var meses=parseInt(document.getElementById('eme-meses')?.value)||3;
  var actual=parseNum(document.getElementById('eme-actual')?.value)||0;
  var aporte=parseNum(document.getElementById('eme-aporte')?.value)||0;
  var gastoTotal=vivienda+alim+servicios+transporte+deudas+salud;
  var res=document.getElementById('eme-result');
  if(!gastoTotal){if(res)res.style.display='none';return;}
  var meta=gastoTotal*meses;
  var falta=Math.max(0,meta-actual);
  var tiempo=falta>0&&aporte>0?Math.ceil(falta/aporte)+' meses':'—';
  if(res)res.style.display='block';
  var set=function(id,v){var el=document.getElementById(id);if(el){el.textContent=v;var l=v.length;el.style.fontSize=l>14?'11px':l>10?'12px':'14px';}};
  set('eme-total-gasto',fmtSim(gastoTotal)+'/mes');
  set('eme-meta',fmtSim(meta));
  set('eme-falta',falta>0?fmtSim(falta):'✅ Completado');
  set('eme-tiempo',tiempo);
  var status=document.getElementById('eme-status');
  if(status){
    var pct=Math.min(100,Math.round(actual/meta*100));
    status.innerHTML='<div class="card" style="padding:12px;margin-top:0">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px">'+
        '<div style="font-size:11px;font-weight:700;color:var(--text)">Progreso del fondo</div>'+
        '<div style="font-size:11px;font-weight:800;color:var(--primary)">'+pct+'%</div>'+
      '</div>'+
      '<div style="height:8px;background:var(--surface2);border-radius:4px;overflow:hidden">'+
        '<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,var(--primary),var(--secondary));border-radius:4px;transition:.3s"></div>'+
      '</div>'+
      '<div style="font-size:10px;color:var(--text3);margin-top:6px">'+fmtSim(actual)+' de '+fmtSim(meta)+' ('+meses+' meses de cobertura)</div>'+
    '</div>';
  }
}

// ════════════════════════════════════════════════════════════
// SIMULADOR INFLACIÓN
// ════════════════════════════════════════════════════════════
function renderInflacion(){
  return'<div style="padding:0">'+
    '<div class="card" style="margin-bottom:14px;padding:14px;border-left:3px solid #F59E0B">'+
      '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">💸 La inflación te come el dinero. Aquí lo vemos juntos.</div>'+
      '<div style="font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:10px">Descubre cuánto pierde tu dinero en el tiempo y cuánto necesitas invertir para no perder poder adquisitivo.</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
        '<div style="background:rgba(245,158,11,.1);border-radius:var(--radius-sm);padding:8px">'+
          '<div style="font-size:9px;font-weight:700;color:var(--warning);margin-bottom:4px;text-transform:uppercase">Ejemplo real</div>'+
          '<div style="font-size:11px;color:var(--text2);line-height:1.5">$1.000.000 hoy con 8% de inflación, en 10 años tiene el poder de compra de $463.000 actuales</div>'+
        '</div>'+
        '<div style="background:rgba(239,68,68,.08);border-radius:var(--radius-sm);padding:8px">'+
          '<div style="font-size:9px;font-weight:700;color:var(--danger);margin-bottom:4px;text-transform:uppercase">Por qué importa</div>'+
          '<div style="font-size:11px;color:var(--text2);line-height:1.5">El dinero debajo del colchón pierde valor. Debes invertir al menos a la tasa de inflación para no perder</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="card" style="margin-bottom:14px">'+
      '<div style="background:var(--surface2);border-radius:50px;padding:3px;display:flex;gap:2px;margin-bottom:14px">'+
        '<button id="inf-tab-fut" onclick="setInflacionTab(\'futuro\')" style="flex:1;padding:8px;border-radius:50px;border:none;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);background:var(--primary);color:white;transition:.15s">📉 Pérdida de valor</button>'+
        '<button id="inf-tab-inv" onclick="setInflacionTab(\'inversion\')" style="flex:1;padding:8px;border-radius:50px;border:none;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);background:transparent;color:var(--text2);transition:.15s">📈 ¿Cuánto invertir?</button>'+
      '</div>'+
      '<div class="form-group"><label class="form-label">💰 Monto actual</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="inf-monto" data-numfmt="num" placeholder="Ej: 1.000.000" oninput="numInput(this);calcInflacion()"></div>'+
      '<div class="form-row">'+
        '<div class="form-group"><label class="form-label">💸 Inflación anual (%)</label>'+
        '<input class="form-input" type="text" inputmode="numeric" id="inf-inflation" data-numfmt="pct" placeholder="0.00%" oninput="pctInput(this);calcInflacion()"></div>'+
        '<div class="form-group"><label class="form-label">📅 Años</label>'+
        '<input class="form-input" type="number" id="inf-years" placeholder="Ej: 10" min="1" max="50" oninput="calcInflacion()"></div>'+
      '</div>'+
      '<div id="inf-inversion-row" style="display:none" class="form-group"><label class="form-label">📈 TAE de tu inversión (%)</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="inf-tae" data-numfmt="pct" placeholder="0.00%" oninput="pctInput(this);calcInflacion()"></div>'+
    '</div>'+
    '<div id="inf-result" style="display:none">'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;align-items:stretch">'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Valor futuro nominal</div><div style="font-size:14px;font-weight:800;color:var(--text);line-height:1.2" id="inf-nominal">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Poder adquisitivo real</div><div style="font-size:14px;font-weight:800;color:var(--danger);line-height:1.2" id="inf-real">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Pérdida de valor</div><div style="font-size:14px;font-weight:800;color:var(--danger);line-height:1.2" id="inf-perdida">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px" id="inf-inv-label">—</div><div style="font-size:14px;font-weight:800;color:var(--success);line-height:1.2" id="inf-inv-val">—</div></div>'+
      '</div>'+
    '</div>'+
    '<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:var(--radius-sm);padding:10px 12px;font-size:10px;color:var(--text2);line-height:1.5">'+
      '⚠️ Proyección basada en inflación constante. La inflación real varía año a año.'+
    '</div>'+
  '</div>';
}
var _inflacionTab='futuro';
function setInflacionTab(tab){
  _inflacionTab=tab;
  var f=document.getElementById('inf-tab-fut'),i=document.getElementById('inf-tab-inv');
  if(f){f.style.background=tab==='futuro'?'var(--primary)':'transparent';f.style.color=tab==='futuro'?'white':'var(--text2)';}
  if(i){i.style.background=tab==='inversion'?'var(--primary)':'transparent';i.style.color=tab==='inversion'?'white':'var(--text2)';}
  var row=document.getElementById('inf-inversion-row');
  if(row)row.style.display=tab==='inversion'?'block':'none';
  calcInflacion();
}
function calcInflacion(){
  var monto=parseNum(document.getElementById('inf-monto')?.value)||0;
  var inflation=parsePct(document.getElementById('inf-inflation')?.value)||0;
  var years=parseInt(document.getElementById('inf-years')?.value)||0;
  var tae=parsePct(document.getElementById('inf-tae')?.value)||0;
  var res=document.getElementById('inf-result');
  if(!monto||!years){if(res)res.style.display='none';return;}
  var factorInf=Math.pow(1+inflation/100,years);
  var valorReal=monto/factorInf;
  var perdida=monto-valorReal;
  var perdidaPct=((1-1/factorInf)*100).toFixed(1);
  if(res)res.style.display='block';
  var set=function(id,v){var el=document.getElementById(id);if(el){el.textContent=v;var l=v.length;el.style.fontSize=l>14?'11px':l>10?'12px':'14px';}};
  set('inf-nominal',fmtSim(monto));
  set('inf-real',fmtSim(valorReal));
  set('inf-perdida','-'+perdidaPct+'% ('+fmtSim(perdida)+')');
  var lbl=document.getElementById('inf-inv-label');
  var val=document.getElementById('inf-inv-val');
  if(_inflacionTab==='inversion'&&tae>0){
    var valorInvertido=monto*Math.pow(1+tae/100,years);
    var gananciaReal=valorInvertido/factorInf;
    if(lbl)lbl.textContent='Valor real de tu inversión';
    if(val){val.textContent=fmtSim(gananciaReal);val.style.color=gananciaReal>monto?'var(--success)':'var(--danger)';}
  } else if(_inflacionTab==='futuro'){
    if(lbl)lbl.textContent='TAE mínima para no perder';
    var taeMinima=((factorInf-1)*100/years).toFixed(2);
    if(val){val.textContent=inflation.toFixed(2)+'% anual';val.style.color='var(--warning)';}
  } else {
    if(lbl)lbl.textContent='Ingresa TAE para calcular';
    if(val){val.textContent='—';val.style.color='var(--text)';}
  }
}

// ════════════════════════════════════════════════════════════
// SIMULADOR RENTABILIDAD
// ════════════════════════════════════════════════════════════
function renderRentabilidad(){
  return'<div style="padding:0">'+
    '<div class="card" style="margin-bottom:14px;padding:14px;border-left:3px solid #3B82F6">'+
      '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">📊 ¿Tu inversión realmente rindió?</div>'+
      '<div style="font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:10px">Calcula el retorno real ajustado por inflación y tiempo. Porque un número bonito no siempre significa una buena inversión.</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
        '<div style="background:rgba(59,130,246,.08);border-radius:var(--radius-sm);padding:8px">'+
          '<div style="font-size:9px;font-weight:700;color:#3B82F6;margin-bottom:4px;text-transform:uppercase">ROI vs CAGR</div>'+
          '<div style="font-size:11px;color:var(--text2);line-height:1.5">ROI mide el retorno total. CAGR (tasa anualizada) permite comparar inversiones de diferente duración</div>'+
        '</div>'+
        '<div style="background:rgba(16,185,129,.08);border-radius:var(--radius-sm);padding:8px">'+
          '<div style="font-size:9px;font-weight:700;color:var(--success);margin-bottom:4px;text-transform:uppercase">Rentabilidad real</div>'+
          '<div style="font-size:11px;color:var(--text2);line-height:1.5">Descontando inflación. Una inversión al 8% con 7% de inflación solo rinde 1% real</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="card" style="margin-bottom:14px">'+
      '<div class="form-group"><label class="form-label">💰 Capital invertido</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="rent-inicial" data-numfmt="num" placeholder="Ej: 10.000.000" oninput="numInput(this);calcRentabilidad()"></div>'+
      '<div class="form-group"><label class="form-label">💵 Valor actual / precio de venta</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="rent-final" data-numfmt="num" placeholder="Ej: 12.500.000" oninput="numInput(this);calcRentabilidad()"></div>'+
      '<div class="form-group"><label class="form-label">🎁 Dividendos / rendimientos recibidos (opcional)</label>'+
      '<input class="form-input" type="text" inputmode="numeric" id="rent-dividendos" data-numfmt="num" placeholder="0" oninput="numInput(this);calcRentabilidad()"></div>'+
      '<div class="form-row">'+
        '<div class="form-group"><label class="form-label">📅 Tiempo (años)</label>'+
        '<input class="form-input" type="number" id="rent-years" placeholder="Ej: 3" min="0" step="0.5" oninput="calcRentabilidad()"></div>'+
        '<div class="form-group"><label class="form-label">💸 Inflación anual (%)</label>'+
        '<input class="form-input" type="text" inputmode="numeric" id="rent-inflation" data-numfmt="pct" placeholder="0.00%" oninput="pctInput(this);calcRentabilidad()"></div>'+
      '</div>'+
      '<div class="form-group"><label class="form-label">Benchmark de comparación</label>'+
      '<div class="bs-trigger" onclick="showRentBenchmarkBS()" style="justify-content:space-between">'+
        '<span id="rent-bench-lbl" style="color:var(--text)">CDT referencial (8% EA)</span>'+
        '<span style="color:var(--text3);font-size:18px">›</span>'+
      '</div>'+
      '<input type="hidden" id="rent-benchmark" value="8"></div>'+
    '</div>'+
    '<div id="rent-result" style="display:none">'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;align-items:stretch">'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Ganancia / Pérdida</div><div style="font-size:14px;font-weight:800;line-height:1.2" id="rent-ganancia">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">ROI total</div><div style="font-size:14px;font-weight:800;color:var(--primary);line-height:1.2" id="rent-roi">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">CAGR anualizado</div><div style="font-size:14px;font-weight:800;color:var(--success);line-height:1.2" id="rent-cagr">—</div></div>'+
        '<div class="card" style="padding:12px;text-align:center;margin-top:0"><div style="font-size:9px;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">Rentabilidad real</div><div style="font-size:14px;font-weight:800;line-height:1.2" id="rent-real">—</div></div>'+
      '</div>'+
      '<div id="rent-benchmark-card" style="margin-bottom:10px"></div>'+
    '</div>'+
    '<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:var(--radius-sm);padding:10px 12px;font-size:10px;color:var(--text2);line-height:1.5">'+
      '⚠️ No incluye impuestos sobre ganancias de capital ni comisiones. Consulta tu situación fiscal.'+
    '</div>'+
  '</div>';
}
function showRentBenchmarkBS(){
  var items=[
    {val:'0',label:'Sin benchmark'},
    {val:'5',label:'CDT corto plazo (5% EA)'},
    {val:'8',label:'CDT referencial (8% EA)'},
    {val:'10',label:'Fondo de acciones (10% EA)'},
    {val:'12',label:'S&P 500 histórico (12% EA)'},
  ];
  var cur=document.getElementById('rent-benchmark')?.value||'8';
  showBottomSheet({title:'Benchmark',items:items,selected:cur,onSelect:function(val){
    var labels={'0':'Sin benchmark','5':'CDT corto plazo (5% EA)','8':'CDT referencial (8% EA)','10':'Fondo acciones (10% EA)','12':'S&P 500 histórico (12% EA)'};
    var lbl=document.getElementById('rent-bench-lbl');
    if(lbl)lbl.textContent=labels[val]||val+'% EA';
    var inp=document.getElementById('rent-benchmark');
    if(inp)inp.value=val;
    calcRentabilidad();
  }});
}
function calcRentabilidad(){
  var inicial=parseNum(document.getElementById('rent-inicial')?.value)||0;
  var final_v=parseNum(document.getElementById('rent-final')?.value)||0;
  var divs=parseNum(document.getElementById('rent-dividendos')?.value)||0;
  var years=parseFloat(document.getElementById('rent-years')?.value)||0;
  var inflation=parsePct(document.getElementById('rent-inflation')?.value)||0;
  var benchmark=parseFloat(document.getElementById('rent-benchmark')?.value)||0;
  var res=document.getElementById('rent-result');
  if(!inicial||!final_v){if(res)res.style.display='none';return;}
  var ganancia=final_v+divs-inicial;
  var roi=((ganancia/inicial)*100);
  var cagr=years>0?(Math.pow((final_v+divs)/inicial,1/years)-1)*100:roi;
  var cagrReal=inflation>0?((1+cagr/100)/(1+inflation/100)-1)*100:cagr;
  if(res)res.style.display='block';
  var ganEl=document.getElementById('rent-ganancia');
  if(ganEl){ganEl.textContent=(ganancia>=0?'+':'')+fmtSim(ganancia);ganEl.style.color=ganancia>=0?'var(--success)':'var(--danger)';var l=ganEl.textContent.length;ganEl.style.fontSize=l>14?'11px':l>10?'12px':'14px';}
  var set=function(id,v,color){var el=document.getElementById(id);if(el){el.textContent=v;if(color)el.style.color=color;var l=v.length;el.style.fontSize=l>14?'11px':l>10?'12px':'14px';}};
  set('rent-roi',(roi>=0?'+':'')+roi.toFixed(2)+'%');
  set('rent-cagr',(years>0?cagr.toFixed(2):'N/A')+'%',cagr>=0?'var(--success)':'var(--danger)');
  var realEl=document.getElementById('rent-real');
  if(realEl){realEl.textContent=(cagrReal>=0?'+':'')+cagrReal.toFixed(2)+'% real';realEl.style.color=cagrReal>0?'var(--success)':cagrReal>-2?'var(--warning)':'var(--danger)';var l2=realEl.textContent.length;realEl.style.fontSize=l2>14?'11px':l2>10?'12px':'14px';}
  if(benchmark>0&&years>0){
    var benchTotal=inicial*Math.pow(1+benchmark/100,years)-inicial;
    var benchCard=document.getElementById('rent-benchmark-card');
    if(benchCard){
      var mejor=ganancia>benchTotal;
      benchCard.innerHTML='<div class="card" style="padding:12px;margin-top:0;border-left:3px solid '+(mejor?'var(--success)':'var(--warning)')+'">'+'<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;margin-bottom:6px">vs Benchmark</div>'+'<div style="display:flex;justify-content:space-between;align-items:center">'+'<div><div style="font-size:11px;color:var(--text2)">Tu inversión</div><div style="font-size:14px;font-weight:800;color:'+(mejor?'var(--success)':'var(--danger)')+'">'+fmtSim(ganancia)+'</div></div>'+'<div style="font-size:20px">'+(mejor?'🏆':'📉')+'</div>'+'<div style="text-align:right"><div style="font-size:11px;color:var(--text2)">Benchmark ('+benchmark+'% EA)</div><div style="font-size:14px;font-weight:800;color:var(--text)">'+fmtSim(benchTotal)+'</div></div>'+'</div>'+'<div style="font-size:10px;color:'+(mejor?'var(--success)':'var(--warning)')+';margin-top:6px">'+(mejor?'✅ Superaste el benchmark por '+fmtSim(ganancia-benchTotal):'⚠️ El benchmark te superó por '+fmtSim(benchTotal-ganancia))+'</div>'+'</div>';
    }
  } else {
    var bc=document.getElementById('rent-benchmark-card');
    if(bc)bc.innerHTML='';
  }
}

// ════════════════════════════════════════════════════════════
// ESTRATEGIA DE DEUDAS
// ════════════════════════════════════════════════════════════
function calcEstrategia(){
  window._estrategiaExtra=document.getElementById('estrategia-extra')?.value||window._estrategiaExtra||'';
  window._estrategiaStart=document.getElementById('estrategia-start')?.value||window._estrategiaStart||'';
  var pg=document.getElementById('page-estrategia');
  if(pg)pg.innerHTML=renderEstrategia();
}
function setEstrategiaMetodo(m){
  window._estrategiaMetodo=m;
  // Persist inputs before re-render
  var ex=document.getElementById('estrategia-extra');
  var st=document.getElementById('estrategia-start');
  if(ex)window._estrategiaExtra=ex.value;
  if(st)window._estrategiaStart=st.value;
  var pg=document.getElementById('page-estrategia');
  if(pg)pg.innerHTML=renderEstrategia();
}
function renderEstrategia(){
  const debts=filterDeleted(S.accounts).filter(a=>a.type==='pasivo'&&(a.currency||S.currency)===S.currency);
  if(!debts.length)return '<div class="empty-state"><div class="empty-icon">🎉</div><div class="empty-title">¡Sin deudas registradas!</div><div class="empty-desc">Eso es una buena noticia 🙌 Agrega tus deudas en la sección Deudas para usar este simulador.</div></div>';

  const metodo=window._estrategiaMetodo||'';
  const extra=parseFloat((window._estrategiaExtra||'').toString().replace(/[^0-9.]/g,''))||0;
  const MESES_SHORT=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

  var startStr=window._estrategiaStart||'';
  if(!startStr){var _n=new Date();startStr=_n.getFullYear()+'-'+String(_n.getMonth()+1).padStart(2,'0');}
  var _sp=startStr.split('-').map(Number);
  var startY=_sp[0]||new Date().getFullYear();
  var startM=_sp[1]||new Date().getMonth()+1;

  function monthLabel(y,m,offset){var d=new Date(y,m-1+offset,1);return MESES_SHORT[d.getMonth()]+'-'+String(d.getFullYear()).slice(2);}

  const debtData=debts.map(function(a){
    var bal=Math.abs(getBalance(a.id));
    var rate=parseFloat(a.tae)||0;
    var monthly=parseFloat(a.monthlyPayment)||(bal*0.03);
    var r=getTEM(rate);
    var cuotas=0;
    if(r>0&&monthly>r*bal&&bal>0){cuotas=Math.ceil(-Math.log(1-r*bal/monthly)/Math.log(1+r));}
    else if(monthly>0&&bal>0){cuotas=Math.ceil(bal/monthly);}
    var subtypeLabel=a.subtype==='tc'?'Tarjeta Crédito':a.subtype==='credito'?'Crédito libre':'Préstamo';
    var bk=getBank(a.bankEntity,a.currency||S.currency);
    var color=(bk?bk.color:null)||a.color||'#64748B';
    return{id:a.id,name:a.name,balance:bal,rate:rate,monthly:monthly,cuotas:cuotas,subtypeLabel:subtypeLabel,color:color};
  }).filter(function(d){return d.balance>0;});

  if(!debtData.length)return '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">Todas las deudas están saldadas</div></div>';

  var avalanche=[].concat(debtData).sort(function(a,b){return b.rate-a.rate;});
  var snowball=[].concat(debtData).sort(function(a,b){return a.balance-b.balance;});
  var ordered=metodo==='nieve'?snowball:avalanche; // default avalanche for calc even if not shown
  var mColor=metodo==='nieve'?'#7461EF':'var(--primary)';

  function simulate(ord, extraAmt){
    var xAmt=extraAmt||0;
    var ds=ord.map(function(d){return{id:d.id,bal:d.balance,monthly:d.monthly,rate:d.rate};});
    var months=0;var totalInt=0;var payoffMonth={};
    while(ds.some(function(d){return d.bal>0;})&&months<600){
      months++;
      var freed=xAmt;
      ds.forEach(function(d){
        if(d.bal<=0)return;
        var intAmt=d.bal*getTEM(d.rate);
        var minPay=Math.min(d.bal+intAmt,d.monthly);
        var capital=Math.max(0,minPay-intAmt);
        totalInt+=intAmt;
        d.bal=Math.max(0,d.bal-capital);
        if(d.bal<=0){payoffMonth[d.id]=months;freed+=d.monthly;}
      });
      for(var i=0;i<ds.length;i++){
        var d=ds[i];
        if(d.bal>0&&freed>0){
          var apply=Math.min(freed,d.bal);
          freed-=apply;d.bal-=apply;
          if(d.bal<=0){payoffMonth[d.id]=months;freed+=d.monthly;}
        }
      }
    }
    return{months:months,totalInt:totalInt,payoffMonth:payoffMonth};
  }

  // Simulate: main method with extra, alt method with extra, main method WITHOUT extra (for extraTip)
  var rMain=simulate(ordered, extra);
  var rAlt=simulate(metodo==='avalancha'?snowball:avalanche, extra);
  var rBase=extra>0?simulate(ordered, 0):null; // baseline without extra payment
  var interestSavings=Math.abs(rMain.totalInt-rAlt.totalInt);
  var vsMonths=Math.abs(rMain.months-rAlt.months);         // diff between methods
  var extraMonthSaved=rBase?Math.max(0,rBase.months-rMain.months):0; // months saved by extra
  var extraIntSaved=rBase?Math.max(0,rBase.totalInt-rMain.totalInt):0;
  var isBetter=rMain.totalInt<=rAlt.totalInt;

  // ── Amortization table (Excel-style) ──
  var tableHtml='';
  if(rMain.months>0&&rMain.months<=120){
    // Re-simulate collecting monthly snapshots
    var tDs=ordered.map(function(d){return{id:d.id,name:d.name,bal:d.balance,monthly:d.monthly,rate:d.rate,color:d.color};});
    var tMonths=0;var tRows=[];
    while(tDs.some(function(d){return d.bal>0;})&&tMonths<120){
      tMonths++;
      var freed=extra;var rowTotalPay=0;var rowTotalInt=0;var cells=[];
      tDs.forEach(function(d){
        if(d.bal<=0){cells.push({pay:0,int:0,bal:0,done:true});return;}
        var intAmt=d.bal*getTEM(d.rate);
        var minPay=Math.min(d.bal+intAmt,d.monthly);
        var capital=Math.max(0,minPay-intAmt);
        var actualPay=Math.min(minPay,d.bal+intAmt);
        rowTotalInt+=intAmt;rowTotalPay+=actualPay;
        d.bal=Math.max(0,d.bal-capital);
        if(d.bal<=0)freed+=d.monthly;
        cells.push({pay:actualPay,int:intAmt,bal:d.bal,done:d.bal<=0});
      });
      // Apply freed to first active
      for(var ti=0;ti<tDs.length;ti++){
        var td=tDs[ti];
        if(td.bal>0&&freed>0){
          var tapply=Math.min(freed,td.bal);
          freed-=tapply;td.bal-=tapply;rowTotalPay+=tapply;
          if(td.bal<=0){cells[ti].done=true;freed+=td.monthly;}
          cells[ti].bal=td.bal;
        }
      }
      tRows.push({month:tMonths,cells:cells,totalPay:rowTotalPay,totalInt:rowTotalInt});
    }

    // Build table HTML
    var tHead='<tr style="background:var(--surface3)">'
      +'<th style="padding:7px 10px;font-size:10px;font-weight:700;color:var(--text3);text-align:left;white-space:nowrap;position:sticky;left:0;background:var(--surface3);z-index:2;min-width:52px">MES</th>';
    ordered.forEach(function(d){
      tHead+='<th style="padding:7px 8px;font-size:10px;font-weight:700;color:'+d.color+';text-align:right;white-space:nowrap;min-width:90px;border-left:1px solid var(--border)">'+d.name+'</th>';
    });
    tHead+='<th style="padding:7px 8px;font-size:10px;font-weight:700;color:var(--text3);text-align:right;white-space:nowrap;min-width:80px;border-left:2px solid var(--border)">TOTAL</th></tr>';

    var tBody='';
    tRows.forEach(function(r){
      var isLast=r.month===rMain.months;
      var rowBg=isLast?'background:rgba(0,212,170,.08)':'';
      tBody+='<tr style="border-bottom:1px solid var(--border);'+rowBg+'">'
        +'<td style="padding:6px 10px;font-size:11px;font-weight:600;color:var(--text2);white-space:nowrap;position:sticky;left:0;background:'+(isLast?'rgba(0,212,170,.1)':'var(--surface)')+';z-index:1">'+monthLabel(startY,startM,r.month-1)+'</td>';
      r.cells.forEach(function(c){
        if(c.done&&c.pay===0){
          tBody+='<td style="padding:6px 8px;text-align:center;border-left:1px solid var(--border)"><span style="font-size:14px">✅</span></td>';
        } else {
          tBody+='<td style="padding:6px 8px;text-align:right;border-left:1px solid var(--border)">'
            +'<div style="font-size:11px;font-weight:700;color:var(--text)">'+fmt(c.pay)+'</div>'
            +'<div style="font-size:9px;color:var(--text3)">int: '+fmt(c.int)+'</div>'
            +'<div style="font-size:9px;color:var(--danger)">saldo: '+fmt(c.bal)+'</div>'
          +'</td>';
        }
      });
      tBody+='<td style="padding:6px 8px;text-align:right;font-size:11px;font-weight:700;border-left:2px solid var(--border);color:'+(isLast?'var(--success)':'var(--text)')+'">'+fmt(r.totalPay)+'</td>'
      +'</tr>';
    });

    tableHtml='<div class="card" style="margin-bottom:14px">'
      +'<div style="font-size:13px;font-weight:700;margin-bottom:4px">📊 Tabla de amortización</div>'
      +'<div style="font-size:11px;color:var(--text2);margin-bottom:12px">Pago · Interés · Saldo por mes</div>'
      +'<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:8px;border:1px solid var(--border)">'
        +'<table style="width:100%;border-collapse:collapse;font-family:var(--font)">'
          +'<thead>'+tHead+'</thead>'
          +'<tbody>'+tBody+'</tbody>'
        +'</table>'
      +'</div>'
    +'</div>';
  }

  var endDate=new Date(startY,startM-1+rMain.months,1);
  var endMonthStr=endDate.toLocaleString('es',{month:'short',year:'numeric'});
  var totalDebt=debtData.reduce(function(s,d){return s+d.balance;},0);
  var totalMonthly=debtData.reduce(function(s,d){return s+d.monthly;},0);
  var allRatesZero=debtData.every(function(d){return d.rate===0;});

  // ── Debt rows ──
  var debtRows='';
  debtData.forEach(function(d){
    debtRows+='<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">'
      +'<div style="width:10px;height:44px;border-radius:4px;background:'+d.color+';flex-shrink:0"></div>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+d.name+'</div>'
        +'<div style="font-size:10px;color:var(--text3)">'+d.subtypeLabel+'</div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;text-align:right;flex-shrink:0">'
        +'<div><div style="font-size:9px;color:var(--text3)">SALDO</div><div style="font-size:12px;font-weight:700;color:var(--danger)">'+fmt(d.balance)+'</div></div>'
        +'<div><div style="font-size:9px;color:var(--text3)">CUOTAS</div><div style="font-size:12px;font-weight:700">'+(d.cuotas>0?d.cuotas:'—')+'</div></div>'
        +'<div><div style="font-size:9px;color:var(--text3)">TASA</div><div style="font-size:12px;font-weight:700;color:var(--warning)">'+(d.rate>0?d.rate+'%':'—')+'</div></div>'
        +'<div><div style="font-size:9px;color:var(--text3)">CUOTA MÍN.</div><div style="font-size:12px;font-weight:700;color:var(--text2)">'+fmt(d.monthly)+'</div></div>'
      +'</div>'
    +'</div>';
  });

  // ── Order rows ──
  var orderRows='';
  ordered.forEach(function(d,i){
    orderRows+='<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">'
      +'<div style="width:28px;height:28px;border-radius:50%;background:'+mColor+';color:white;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+(i+1)+'</div>'
      +'<div style="flex:1">'
        +'<div style="font-size:13px;font-weight:700">'+d.name+'</div>'
        +'<div style="font-size:11px;color:var(--text3)">'+d.subtypeLabel+'</div>'
      +'</div>'
      +'<div style="text-align:right">'
        +'<div style="font-size:12px;font-weight:700;color:var(--warning)">'+(d.rate>0?d.rate+'% anual':'Sin tasa')+'</div>'
        +'<div style="font-size:12px;color:var(--danger);font-weight:600">'+fmt(d.balance)+'</div>'
      +'</div>'
    +'</div>';
  });

  // ── Gantt ──
  var ganttHtml='';
  var totalMonths=rMain.months;
  if(totalMonths>0&&totalMonths<=120){
    // Simple start/end header instead of overcrowded axis
    var axis='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
      +'<div style="width:90px;flex-shrink:0"></div>'
      +'<div style="flex:1;display:flex;justify-content:space-between">'
        +'<span style="font-size:10px;color:var(--text3);font-weight:600">▶ '+monthLabel(startY,startM,0)+'</span>'
        +'<span style="font-size:10px;color:var(--success);font-weight:600">'+monthLabel(startY,startM,totalMonths-1)+' 🏁</span>'
      +'</div>'
      +'<div style="width:40px;flex-shrink:0"></div>'
    +'</div>';
    var bars='';
    ordered.forEach(function(d){
      var payoff=rMain.payoffMonth[d.id]||totalMonths;
      var pctWidth=(payoff/totalMonths*100).toFixed(1);
      bars+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">'
        +'<div style="width:90px;font-size:10px;color:var(--text2);flex-shrink:0;text-align:right;line-height:1.2;padding-right:4px">'+d.name+'</div>'
        +'<div style="flex:1;height:22px;background:var(--surface3);border-radius:5px;position:relative;overflow:hidden">'
          +'<div style="position:absolute;left:0;width:'+pctWidth+'%;height:100%;background:'+d.color+';border-radius:5px;opacity:.85;display:flex;align-items:center;justify-content:center">'
            +(payoff>=3?'<span style="font-size:9px;color:white;font-weight:700;padding:0 4px">'+payoff+'m</span>':'')
          +'</div>'
        +'</div>'
        +'<div style="width:40px;font-size:10px;color:var(--text3);flex-shrink:0">'+monthLabel(startY,startM,payoff-1)+'</div>'
      +'</div>';
    });
    var legend='<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:8px">';
    ordered.forEach(function(d){
      legend+='<div style="display:flex;align-items:center;gap:5px"><div style="width:12px;height:12px;border-radius:3px;background:'+d.color+'"></div><span style="font-size:10px;color:var(--text2)">'+d.name+'</span></div>';
    });
    legend+='</div>';
    ganttHtml='<div class="card" style="margin-bottom:14px">'
      +'<div style="font-size:13px;font-weight:700;margin-bottom:14px">📊 Plan de pago visual</div>'
      +axis+bars+legend
    +'</div>';
  }

  var ratesWarning=allRatesZero
    ?'<div style="background:rgba(245,158,11,.1);border-left:3px solid var(--warning);border-radius:4px;padding:9px 12px;font-size:12px;color:var(--text2);margin-bottom:14px">⚠️ <strong>Sin tasas de interés:</strong> edita cada deuda y agrega el % TAE para resultados precisos.</div>'
    :'';
  var extraTip=extra>0
    ?'<div style="background:rgba(0,212,170,.08);border-left:3px solid var(--primary);border-radius:4px;padding:9px 12px;font-size:12px;color:var(--text2);margin-bottom:12px">💡 Con el abono extra de <strong style="color:var(--primary)">'+fmt(extra)+'/mes</strong> terminas <strong style="color:var(--primary)">'+extraMonthSaved+'</strong> mes'+(extraMonthSaved===1?'':'es')+' antes y ahorras <strong style="color:var(--success)">'+fmt(extraIntSaved)+'</strong> en intereses.</div>'
    :'';

  return ratesWarning
    // 1 METHOD SELECTOR
    +'<div class="card" style="margin-bottom:14px">'
      +'<div style="font-size:13px;font-weight:700;margin-bottom:4px">¿Bajo qué método quieres atacar tus deudas?</div>'
      +'<div style="font-size:11px;color:var(--text2);margin-bottom:12px">Elige una estrategia para ver tu plan personalizado</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
        +'<button onclick="setEstrategiaMetodo(\'avalancha\')" style="padding:14px 8px;border-radius:12px;border:2px solid '+(metodo==='avalancha'?'var(--primary)':'var(--border)')+';background:'+(metodo==='avalancha'?'rgba(0,212,170,.12)':'var(--surface2)')+';color:'+(metodo==='avalancha'?'var(--primary)':'var(--text)')+';cursor:pointer;font-family:var(--font);font-size:13px;font-weight:700;text-align:center;line-height:1.5">'
          +'🌊 Avalancha<br><span style="font-size:10px;font-weight:400;opacity:.7">Mayor tasa primero</span>'
        +'</button>'
        +'<button onclick="setEstrategiaMetodo(\'nieve\')" style="padding:14px 8px;border-radius:12px;border:2px solid '+(metodo==='nieve'?'#7461EF':'var(--border)')+';background:'+(metodo==='nieve'?'rgba(116,97,239,.12)':'var(--surface2)')+';color:'+(metodo==='nieve'?'#7461EF':'var(--text)')+';cursor:pointer;font-family:var(--font);font-size:13px;font-weight:700;text-align:center;line-height:1.5">'
          +'❄️ Bola de nieve<br><span style="font-size:10px;font-weight:400;opacity:.7">Menor saldo primero</span>'
        +'</button>'
      +'</div>'
    +'</div>'
    // 1b EXPLANATION — solo cuando hay método seleccionado
    +(metodo
      ?'<div style="background:'+(metodo==='avalancha'?'rgba(0,212,170,.07)':'rgba(116,97,239,.07)')+';border-radius:12px;padding:14px;margin-bottom:14px;border:1px solid '+(metodo==='avalancha'?'var(--primary)':'#7461EF')+'33">'
          +'<div style="font-size:22px;margin-bottom:6px">'+(metodo==='avalancha'?'🌊':'❄️')+'</div>'
          +'<div style="font-size:13px;font-weight:700;margin-bottom:6px;color:'+(metodo==='avalancha'?'var(--primary)':'#7461EF')+'">'+(metodo==='avalancha'?'Método Avalancha':'Método Bola de nieve')+'</div>'
          +(metodo==='avalancha'
            ?'<div style="font-size:12px;color:var(--text2);line-height:1.6">Pagas primero la deuda con la <strong>tasa de interés más alta</strong>. Una vez la liquidas, ese dinero lo atacas a la siguiente. Matemáticamente es la estrategia más eficiente: pagarás <strong>menos intereses en total</strong> y terminarás antes. Ideal si eres disciplinado y buscas el menor costo financiero posible.</div>'
            :'<div style="font-size:12px;color:var(--text2);line-height:1.6">Pagas primero la deuda con el <strong>saldo más pequeño</strong>. Al verla desaparecer rápido, obtienes una victoria psicológica que te mantiene motivado. La cuota liberada se suma al ataque de la siguiente deuda — como una bola de nieve que crece. Ideal si necesitas motivación y ver resultados rápido.</div>'
          )
        +'</div>'
      :'')
    // 2 DEBT LIST (siempre visible)
    +'<div class="card" style="margin-bottom:14px">'
      +'<div style="font-size:13px;font-weight:700;margin-bottom:4px">📋 Listado de deudas</div>'
      +'<div style="font-size:11px;color:var(--text2);margin-bottom:12px">'+S.currency+'</div>'
      +debtRows
      +'<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;margin-top:2px">'
        +'<span style="font-size:12px;font-weight:700">TOTAL</span>'
        +'<div style="text-align:right">'
          +'<span style="font-size:14px;font-weight:800;color:var(--danger)">'+fmt(totalDebt)+'</span>'
          +'<span style="font-size:11px;color:var(--text3);margin-left:8px">Min: '+fmt(totalMonthly)+'/mes</span>'
        +'</div>'
      +'</div>'
    +'</div>'
    // Resto solo visible cuando hay método seleccionado
    +(metodo?(
      // 3 ORDER OF PAYMENTS
      '<div class="card" style="margin-bottom:14px;border-left:4px solid '+mColor+'">'
        +'<div style="font-size:13px;font-weight:700;margin-bottom:4px">'+(metodo==='avalancha'?'🌊 Orden Avalancha':'❄️ Orden Bola de nieve')+'</div>'
        +'<div style="font-size:11px;color:var(--text2);margin-bottom:12px">'+(metodo==='avalancha'?'Pagas primero la de mayor tasa de interés':'Pagas primero la de menor saldo')+'</div>'
        +orderRows
      +'</div>'
      // 4 CRONOGRAMA
      +'<div class="card" style="margin-bottom:14px">'
        +'<div style="font-size:13px;font-weight:700;margin-bottom:12px">📅 Cronograma de pagos</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">'
          +'<div>'
            +'<div style="font-size:11px;color:var(--text3);font-weight:700;margin-bottom:5px">INICIO DEL PAGO</div>'
            +'<input class="form-input" type="month" id="estrategia-start" value="'+startStr+'" onchange="calcEstrategia()" style="font-size:13px;width:100%">'
          +'</div>'
          +'<div>'
            +'<div style="font-size:11px;color:var(--text3);font-weight:700;margin-bottom:5px">ABONO EXTRA MENSUAL</div>'
            +'<input class="form-input" type="text" inputmode="numeric" id="estrategia-extra" value="'+(window._estrategiaExtra||'')+'" placeholder="0" onblur="calcEstrategia()" oninput="window._estrategiaExtra=this.value.replace(/[^0-9.]/g,\'\')" onkeyup="if(event.key===\'Enter\')this.blur()" style="font-size:13px;width:100%">'
          +'</div>'
        +'</div>'
        +extraTip
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
          +'<div style="background:var(--surface2);border-radius:10px;padding:12px;text-align:center">'
            +'<div style="font-size:9px;color:var(--text3);font-weight:700;letter-spacing:.5px">TERMINARÍAS EN</div>'
            +'<div style="font-size:26px;font-weight:800;color:'+mColor+'">'+rMain.months+'</div>'
            +'<div style="font-size:11px;color:var(--text2)">meses · '+Math.floor(rMain.months/12)+'a '+rMain.months%12+'m</div>'
          +'</div>'
          +'<div style="background:var(--surface2);border-radius:10px;padding:12px;text-align:center">'
            +'<div style="font-size:9px;color:var(--text3);font-weight:700;letter-spacing:.5px">MES FINAL</div>'
            +'<div style="font-size:20px;font-weight:800;color:var(--text)">'+endMonthStr+'</div>'
            +'<div style="font-size:10px;color:var(--success);font-weight:600">libre de deudas 🎉</div>'
          +'</div>'
          +'<div style="background:rgba(239,68,68,.08);border-radius:10px;padding:12px;text-align:center">'
            +'<div style="font-size:9px;color:var(--text3);font-weight:700;letter-spacing:.5px">PAGARÁS EN INTERESES</div>'
            +'<div style="font-size:14px;font-weight:800;color:var(--danger)">'+fmt(rMain.totalInt)+'</div>'
            +'<div style="font-size:9px;color:var(--text3);margin-top:2px">costo total del crédito</div>'
          +'</div>'
          +'<div style="background:'+(isBetter?'rgba(0,212,170,.1)':'rgba(239,68,68,.08)')+';border-radius:10px;padding:12px;text-align:center;border:1px solid '+(isBetter?'var(--primary)':'var(--danger)')+'33">'
            +'<div style="font-size:9px;color:var(--text3);font-weight:700;letter-spacing:.5px">'+(isBetter?'✅ AHORRAS VS ':'⚠️ PAGARÍAS MÁS VS ')+(metodo==='avalancha'?'BOLA NIEVE':'AVALANCHA')+'</div>'
            +'<div style="font-size:14px;font-weight:800;color:'+(isBetter?'var(--success)':'var(--danger)')+'">'+fmt(interestSavings)+'</div>'
            +'<div style="font-size:9px;color:'+(isBetter?'var(--success)':'var(--danger)')+';margin-top:2px">'+vsMonths+'m '+(isBetter?'más rápido con este método':'más lento con este método')+'</div>'
          +'</div>'
        +'</div>'
      +'</div>'
      // 5 GANTT
      +ganttHtml
      // 6 AMORTIZATION TABLE
      +tableHtml
    ):'');
}

