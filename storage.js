// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const ICONS = ['🍔','🛒','☕','🍕','🍺','🥩','🍣','🍜','🌮','🥗','🥤','🧃','🍎','🥐','🧁','🎂','🍰','🍦','🛺','🚗','⛽','🚌','🚕','✈️','🚢','🚂','🛵','🚲','🛴','🏍️','🏠','⚡','💧','🔧','🔑','🏡','🛋️','🪴','🏗️','🔨','📱','💻','🖥️','⌨️','🎮','📷','📺','🎧','🖨️','💾','🏥','💊','🩺','💪','🧬','🩻','🩹','😷','🏋️','🧘','🛍️','👗','👠','💄','💍','🕶️','👒','🎒','👜','🎁','🐾','🐶','🐱','🐠','🌿','🌸','🌺','💼','🏢','💡','🔍','💰','📈','📉','🏦','💳','🐷','🎯','🎉','❤️','👨‍👩‍👧','👶','🎓','⚽','🏊','🎸','🏆','🎨','🎭','🎪','🎠','🌍','🌙','⭐','🔑','🗺️','🧳','🎿','⛷️','🏄','🚴','🥊','🎻','🎹','📚','📖','✏️','🖊️','📝','📌','📎','🗂️','💸','🤑','💵','🏧','🧾','📊','📋','🔔','⚙️','🛠️','🔩','🧲','⚗️','🔭','🌡️','🎁','🛒','🧺','🧴','🪥','🧼','🏪','🏬','🏫','🏨','🌃','🌆','🌇','☀️','🌤️','⛅','🌧️','❄️','🌈','🌊','🏔️','🌋','🏖️','🏕️'];
const COLORS_PALETTE = ['#EF4444','#F97316','#F59E0B','#EAB308','#84CC16','#22C55E','#10B981','#14B8A6','#06B6D4','#3B82F6','#6366F1','#8B5CF6','#A855F7','#D946EF','#EC4899','#F43F5E','#00D4AA','#FF6B6B','#FFB347','#4ECDC4','#45B7D1','#96CEB4','#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9','#82E0AA','#FAD7A0','#AED6F1','#F9E79F','#A9DFBF','#64748B','#475569','#334155'];
const PAYMENT_METHODS = [
  'Efectivo','Transferencia bancaria','Transferencia interbancaria','Transferencia internacional',
  'ACH / SEPA / SPEI','Giro bancario','Nequi','Daviplata','PayPal','Payoneer','MercadoPago',
  'Skrill','Revolut','Wise','N26','Apple Pay','Google Pay','Samsung Pay',
  'Tarjeta débito','Tarjeta crédito','Tarjeta crédito diferido','Tarjeta crédito sin contacto',
  'Tarjeta crédito virtual','Tarjeta prepago física','Tarjeta prepago digital',
  'Transferencia por app bancaria','Transferencia por billetera digital','Código QR',
  'Link de pago','Pago con celular (NFC)','Pago con smartwatch','Tap to pay',
  'Stripe','PayU','Wompi','Square','Checkout.com',
  'Cheque','Cheque de gerencia','Vale / voucher','Bonos electrónicos',
  'Pago contraentrega (COD)','PSE','BLIK','Bizum','Zelle','Interac'
];
const FREQUENCIES = ['Diario','Semanal','Quincenal','Mensual','Bimestral','Trimestral','Semestral','Anual'];
const PERIODS = ['Diario','Semanal','Quincenal','Mensual','Bimestral','Trimestral','Semestral','Anual','Q1','Q2','Q3','Q4'];
const DAYS_1_31 = Array.from({length:31},(_,i)=>i+1);
const BANKS_PLN = [
  {id:'pko',name:'PKO Bank Polski',abbr:'PKO',color:'#003087'},
  {id:'santander',name:'Santander Polska',abbr:'SAN',color:'#EC0000'},
  {id:'ing',name:'ING Bank Śląski',abbr:'ING',color:'#FF6200'},
  {id:'mbank',name:'mBank',abbr:'mBK',color:'#C0392B'},
  {id:'pekao',name:'Bank Pekao SA',abbr:'PEK',color:'#8B0000'},
  {id:'bnp',name:'BNP Paribas PL',abbr:'BNP',color:'#00A650'},
  {id:'alior',name:'Alior Bank',abbr:'ALR',color:'#E31E24'},
  {id:'millennium',name:'Bank Millennium',abbr:'MIL',color:'#CC0033'},
  {id:'nest',name:'Nest Bank',abbr:'NST',color:'#E67E22'},
  {id:'credit_agricole',name:'Crédit Agricole PL',abbr:'CA',color:'#00843D'},
  {id:'citibank',name:'Citi Handlowy',abbr:'CTI',color:'#003B8E'},
  {id:'bos',name:'Bank Ochrony Środowiska',abbr:'BOS',color:'#006633'},
  {id:'sgb',name:'SGB Bank',abbr:'SGB',color:'#E2001A'},
  {id:'bs_lodz',name:'Bank Spółdzielczy',abbr:'BSP',color:'#1A5276'},
  {id:'toyota',name:'Toyota Bank',abbr:'TOY',color:'#EB0A1E'},
  {id:'getin',name:'Getin Noble Bank',abbr:'GNB',color:'#E31E24'},
  {id:'pocztowy',name:'Bank Pocztowy',abbr:'POC',color:'#C0392B'},
  {id:'plus',name:'Plus Bank',abbr:'PLB',color:'#E67E22'},
  {id:'revolut',name:'Revolut',abbr:'REV',color:'#0666EB'},
  {id:'wise',name:'Wise',abbr:'WSE',color:'#00B9A5'},
  {id:'blik',name:'BLIK',abbr:'BLK',color:'#E2001A'},
  {id:'n26',name:'N26',abbr:'N26',color:'#26AEE6'},
  {id:'vivus',name:'Vivus',abbr:'VVS',color:'#FF6600'},
  {id:'kobo',name:'Kobo Pay',abbr:'KBP',color:'#4B0082'},
  {id:'other_pln',name:'Otro banco',abbr:'???',color:'#64748B'},
];
const BANKS_COP = [
  {id:'bancolombia',name:'Bancolombia',abbr:'BCO',color:'#C8960C'},
  {id:'bogota',name:'Banco de Bogotá',abbr:'BOG',color:'#002D72'},
  {id:'davivienda',name:'Davivienda',abbr:'DAV',color:'#C0392B'},
  {id:'bbva',name:'BBVA Colombia',abbr:'BBV',color:'#004481'},
  {id:'occidente',name:'Banco de Occidente',abbr:'OCC',color:'#003DA5'},
  {id:'popular',name:'Banco Popular',abbr:'POP',color:'#1A5276'},
  {id:'caja_social',name:'Banco Caja Social',abbr:'BCS',color:'#17618F'},
  {id:'colpatria',name:'Scotiabank Colpatria',abbr:'COL',color:'#B03A2E'},
  {id:'itau',name:'Itaú Colombia',abbr:'ITA',color:'#EC7000'},
  {id:'hsbc',name:'HSBC Colombia',abbr:'HSB',color:'#DB0011'},
  {id:'citibank_co',name:'Citibank Colombia',abbr:'CTI',color:'#003B8E'},
  {id:'av_villas',name:'Banco AV Villas',abbr:'AVV',color:'#E31E24'},
  {id:'coopcentral',name:'Coopcentral',abbr:'CPC',color:'#006633'},
  {id:'gnb_sudameris',name:'GNB Sudameris',abbr:'GNB',color:'#1A2E6B'},
  {id:'agrario',name:'Banco Agrario',abbr:'AGR',color:'#2E8B57'},
  {id:'w',name:'Banco W',abbr:'BKW',color:'#FF6200'},
  {id:'mundo_mujer',name:'Banco Mundo Mujer',abbr:'MMJ',color:'#9B59B6'},
  {id:'ban100',name:'Ban100',abbr:'B100',color:'#E74C3C'},
  {id:'bancamia',name:'Bancamía',abbr:'BMA',color:'#1A5276'},
  {id:'confiar',name:'Confiar Cooperativa',abbr:'CNF',color:'#27AE60'},
  {id:'coofinep',name:'Coofinep',abbr:'CFP',color:'#2980B9'},
  {id:'nequi',name:'Nequi',abbr:'NEQ',color:'#6C3483'},
  {id:'daviplata',name:'Daviplata',abbr:'DVP',color:'#B7950B'},
  {id:'nubank',name:'Nubank',abbr:'NUB',color:'#6A0DAD'},
  {id:'lulo',name:'Lulo Bank',abbr:'LUL',color:'#00D4AA'},
  {id:'rappipay',name:'RappiPay',abbr:'RPP',color:'#E74C3C'},
  {id:'falabella',name:'Banco Falabella',abbr:'FAL',color:'#1E8449'},
  {id:'pichincha',name:'Banco Pichincha',abbr:'PIC',color:'#1A3A6B'},
  {id:'cooperativa_financiera',name:'Coofinanciera',abbr:'COF',color:'#196F3D'},
  {id:'other_cop',name:'Otro banco',abbr:'???',color:'#64748B'},
];

// ════════════════════════════════════════════════════════════
// STATE
const DEFAULT_CATS = [
  {id:'dc01',name:'Salario',icon:'💰',color:'#00D4AA',type:'ingreso',nature:'ahorros',incomeType:'principal'},
  {id:'dc02',name:'Ingresos independientes',icon:'💼',color:'#10B981',type:'ingreso',nature:'ahorros',incomeType:'principal'},
  {id:'dc03',name:'Rentas e inversiones',icon:'📈',color:'#3B82F6',type:'ingreso',nature:'ahorros',incomeType:'secundario'},
  {id:'dc04',name:'Apoyos y reembolsos',icon:'🤝',color:'#8B5CF6',type:'ingreso',nature:'ahorros',incomeType:'secundario'},
  {id:'dc05',name:'Ingresos extraordinarios',icon:'⭐',color:'#F59E0B',type:'ingreso',nature:'ahorros',incomeType:'secundario'},
  {id:'dc06',name:'Vivienda',icon:'🏠',color:'#EF4444',type:'gasto',nature:'necesidades'},
  {id:'dc07',name:'Servicios del hogar',icon:'⚡',color:'#F97316',type:'gasto',nature:'necesidades'},
  {id:'dc08',name:'Alimentación',icon:'🛒',color:'#F59E0B',type:'gasto',nature:'necesidades'},
  {id:'dc09',name:'Transporte',icon:'🚗',color:'#84CC16',type:'gasto',nature:'necesidades'},
  {id:'dc10',name:'Educación',icon:'📚',color:'#10B981',type:'gasto',nature:'necesidades'},
  {id:'dc11',name:'Salud',icon:'🏥',color:'#06B6D4',type:'gasto',nature:'necesidades'},
  {id:'dc12',name:'Comunicación',icon:'📱',color:'#3B82F6',type:'gasto',nature:'necesidades'},
  {id:'dc13',name:'Seguros',icon:'🛡️',color:'#8B5CF6',type:'gasto',nature:'necesidades'},
  {id:'dc14',name:'Deudas',icon:'💳',color:'#EC4899',type:'gasto',nature:'necesidades'},
  {id:'dc15',name:'Cuidado personal',icon:'🧴',color:'#14B8A6',type:'gasto',nature:'necesidades'},
  {id:'dc16',name:'Mascotas',icon:'🐾',color:'#A855F7',type:'gasto',nature:'necesidades'},
  {id:'dc17',name:'Impuestos',icon:'🧾',color:'#6366F1',type:'gasto',nature:'necesidades'},
  {id:'dc18',name:'Salidas y ocio',icon:'🍽️',color:'#FF6B6B',type:'gasto',nature:'deseos'},
  {id:'dc19',name:'Viajes',icon:'✈️',color:'#4ECDC4',type:'gasto',nature:'deseos'},
  {id:'dc20',name:'Ropa y compras',icon:'👗',color:'#DDA0DD',type:'gasto',nature:'deseos'},
  {id:'dc21',name:'Suscripciones',icon:'📺',color:'#E74C3C',type:'gasto',nature:'deseos'},
  {id:'dc22',name:'Hobby y deportes',icon:'⚽',color:'#27AE60',type:'gasto',nature:'deseos'},
  {id:'dc23',name:'Tecnología',icon:'💻',color:'#3498DB',type:'gasto',nature:'deseos'},
  {id:'dc24',name:'Eventos y regalos',icon:'🎉',color:'#E91E8C',type:'gasto',nature:'deseos'},
  {id:'dc25',name:'Ahorro y emergencia',icon:'🐷',color:'#00D4AA',type:'gasto',nature:'ahorros'},
  {id:'dc26',name:'Inversiones',icon:'📊',color:'#3B82F6',type:'gasto',nature:'ahorros'},
  {id:'dc27',name:'Metas de ahorro',icon:'🎯',color:'#EC4899',type:'gasto',nature:'ahorros'},
  {id:'dc28',name:'Entre mis cuentas',icon:'↔️',color:'#6366F1',type:'transferencia',nature:'ahorros'},
  {id:'dc29',name:'Pagos a terceros',icon:'📤',color:'#A855F7',type:'transferencia',nature:'ahorros'},
  {id:'dc30',name:'Depósitos y retiros',icon:'🏧',color:'#F59E0B',type:'transferencia',nature:'ahorros'},
];
const DEFAULT_SUBS = [
  {id:'ds0101',categoryId:'dc01',name:'Salario base',icon:'💵'},{id:'ds0102',categoryId:'dc01',name:'Horas extras',icon:'⏰'},{id:'ds0103',categoryId:'dc01',name:'Bonificaciones',icon:'🎁'},{id:'ds0104',categoryId:'dc01',name:'Comisiones',icon:'📈'},
  {id:'ds0201',categoryId:'dc02',name:'Venta de productos',icon:'📦'},{id:'ds0202',categoryId:'dc02',name:'Venta de servicios',icon:'🛠️'},{id:'ds0203',categoryId:'dc02',name:'Freelance',icon:'💡'},
  {id:'ds0301',categoryId:'dc03',name:'Alquileres',icon:'🏠'},{id:'ds0302',categoryId:'dc03',name:'Intereses',icon:'🏦'},{id:'ds0303',categoryId:'dc03',name:'Dividendos',icon:'📊'},
  {id:'ds0401',categoryId:'dc04',name:'Apoyo familiar',icon:'👨‍👩‍👧'},{id:'ds0402',categoryId:'dc04',name:'Mesada familiar',icon:'💰'},{id:'ds0403',categoryId:'dc04',name:'Reembolso laboral',icon:'💼'},{id:'ds0404',categoryId:'dc04',name:'Reembolso médico',icon:'🏥'},
  {id:'ds0501',categoryId:'dc05',name:'Venta de activos',icon:'🏷️'},{id:'ds0502',categoryId:'dc05',name:'Herencias',icon:'📜'},{id:'ds0503',categoryId:'dc05',name:'Loterías y sorteos',icon:'🎲'},{id:'ds0504',categoryId:'dc05',name:'Regalos recibidos',icon:'🎁'},
  {id:'ds0601',categoryId:'dc06',name:'Arriendo',icon:'🏠'},{id:'ds0602',categoryId:'dc06',name:'Hipoteca',icon:'🏦'},{id:'ds0603',categoryId:'dc06',name:'Administración',icon:'🏢'},{id:'ds0604',categoryId:'dc06',name:'Mantenimiento y reparaciones',icon:'🔧'},
  {id:'ds0701',categoryId:'dc07',name:'Luz',icon:'💡'},{id:'ds0702',categoryId:'dc07',name:'Agua',icon:'💧'},{id:'ds0703',categoryId:'dc07',name:'Gas',icon:'🔥'},{id:'ds0704',categoryId:'dc07',name:'Basuras',icon:'🗑️'},{id:'ds0705',categoryId:'dc07',name:'TV/Internet/Teléfono fijo',icon:'📡'},{id:'ds0706',categoryId:'dc07',name:'Televisión',icon:'📺'},{id:'ds0707',categoryId:'dc07',name:'Internet',icon:'🌐'},{id:'ds0708',categoryId:'dc07',name:'Teléfono fijo',icon:'📞'},
  {id:'ds0801',categoryId:'dc08',name:'Mercado',icon:'🛒'},{id:'ds0802',categoryId:'dc08',name:'Frutas y verduras',icon:'🥦'},{id:'ds0803',categoryId:'dc08',name:'Carnes',icon:'🥩'},{id:'ds0804',categoryId:'dc08',name:'Panadería',icon:'🥐'},{id:'ds0805',categoryId:'dc08',name:'Abarrotes',icon:'📦'},
  {id:'ds0901',categoryId:'dc09',name:'Gasolina / Gas',icon:'⛽'},{id:'ds0902',categoryId:'dc09',name:'Transporte público',icon:'🚌'},{id:'ds0903',categoryId:'dc09',name:'Taxi / Uber',icon:'🚕'},{id:'ds0904',categoryId:'dc09',name:'Delivery',icon:'🛵'},{id:'ds0905',categoryId:'dc09',name:'Tren',icon:'🚂'},{id:'ds0906',categoryId:'dc09',name:'Mantenimiento vehículo',icon:'🔧'},{id:'ds0907',categoryId:'dc09',name:'Peajes',icon:'🛣️'},{id:'ds0908',categoryId:'dc09',name:'Parqueaderos',icon:'🅿️'},
  {id:'ds1001',categoryId:'dc10',name:'Matrículas',icon:'🎓'},{id:'ds1002',categoryId:'dc10',name:'Útiles escolares',icon:'✏️'},{id:'ds1003',categoryId:'dc10',name:'Libros',icon:'📚'},{id:'ds1004',categoryId:'dc10',name:'Cursos',icon:'💻'},{id:'ds1005',categoryId:'dc10',name:'Plataformas educativas',icon:'🖥️'},{id:'ds1006',categoryId:'dc10',name:'Transporte escolar',icon:'🚌'},
  {id:'ds1101',categoryId:'dc11',name:'Medicinas',icon:'💊'},{id:'ds1102',categoryId:'dc11',name:'Consultas médicas',icon:'🩺'},{id:'ds1103',categoryId:'dc11',name:'Exámenes médicos',icon:'🔬'},{id:'ds1104',categoryId:'dc11',name:'Emergencias',icon:'🚨'},{id:'ds1105',categoryId:'dc11',name:'Odontología',icon:'🦷'},{id:'ds1106',categoryId:'dc11',name:'Terapias',icon:'🧠'},
  {id:'ds1201',categoryId:'dc12',name:'Plan móvil',icon:'📱'},{id:'ds1202',categoryId:'dc12',name:'Recargas',icon:'🔋'},
  {id:'ds1301',categoryId:'dc13',name:'Seguro de salud',icon:'🏥'},{id:'ds1302',categoryId:'dc13',name:'Seguro de vida',icon:'❤️'},{id:'ds1303',categoryId:'dc13',name:'Seguro de auto',icon:'🚗'},{id:'ds1304',categoryId:'dc13',name:'Seguro de hogar',icon:'🏠'},
  {id:'ds1401',categoryId:'dc14',name:'Tarjeta de crédito',icon:'💳'},{id:'ds1402',categoryId:'dc14',name:'Crédito hipotecario',icon:'🏦'},{id:'ds1403',categoryId:'dc14',name:'Crédito de vehículo',icon:'🚗'},{id:'ds1404',categoryId:'dc14',name:'Crédito de consumo',icon:'🛒'},{id:'ds1405',categoryId:'dc14',name:'Préstamo personal',icon:'🤝'},{id:'ds1406',categoryId:'dc14',name:'Microcrédito',icon:'💵'},{id:'ds1407',categoryId:'dc14',name:'Crédito educativo',icon:'🎓'},{id:'ds1408',categoryId:'dc14',name:'Crédito empresarial',icon:'💼'},
  {id:'ds1501',categoryId:'dc15',name:'Aseo básico',icon:'🧴'},{id:'ds1502',categoryId:'dc15',name:'Barbería / peluquería',icon:'✂️'},{id:'ds1503',categoryId:'dc15',name:'Productos esenciales',icon:'🛒'},{id:'ds1504',categoryId:'dc15',name:'Spa',icon:'💆'},{id:'ds1505',categoryId:'dc15',name:'Maquillaje',icon:'💄'},
  {id:'ds1601',categoryId:'dc16',name:'Comida mascotas',icon:'🦴'},{id:'ds1602',categoryId:'dc16',name:'Veterinaria',icon:'🐾'},{id:'ds1603',categoryId:'dc16',name:'Medicamentos mascotas',icon:'💊'},{id:'ds1604',categoryId:'dc16',name:'Juguetes y accesorios',icon:'🎾'},
  {id:'ds1701',categoryId:'dc17',name:'Impuesto renta',icon:'🧾'},{id:'ds1702',categoryId:'dc17',name:'Predial',icon:'🏠'},{id:'ds1703',categoryId:'dc17',name:'Vehicular',icon:'🚗'},{id:'ds1704',categoryId:'dc17',name:'Retefuente',icon:'📋'},
  {id:'ds1801',categoryId:'dc18',name:'Restaurante',icon:'🍽️'},{id:'ds1802',categoryId:'dc18',name:'Café y snacks',icon:'☕'},{id:'ds1803',categoryId:'dc18',name:'Cine y teatro',icon:'🎬'},{id:'ds1804',categoryId:'dc18',name:'Conciertos',icon:'🎵'},{id:'ds1805',categoryId:'dc18',name:'Salidas sociales',icon:'🍺'},{id:'ds1806',categoryId:'dc18',name:'Comida rápida',icon:'🍔'},
  {id:'ds1901',categoryId:'dc19',name:'Vuelos',icon:'✈️'},{id:'ds1902',categoryId:'dc19',name:'Hoteles',icon:'🏨'},{id:'ds1903',categoryId:'dc19',name:'Tours',icon:'🗺️'},{id:'ds1904',categoryId:'dc19',name:'Transporte en destino',icon:'🚌'},
  {id:'ds2001',categoryId:'dc20',name:'Ropa',icon:'👗'},{id:'ds2002',categoryId:'dc20',name:'Zapatos',icon:'👟'},{id:'ds2003',categoryId:'dc20',name:'Accesorios',icon:'👜'},{id:'ds2004',categoryId:'dc20',name:'Artículos personales',icon:'🛍️'},
  {id:'ds2101',categoryId:'dc21',name:'Streaming',icon:'📺'},{id:'ds2102',categoryId:'dc21',name:'Música',icon:'🎵'},{id:'ds2103',categoryId:'dc21',name:'E-commerce',icon:'📦'},{id:'ds2104',categoryId:'dc21',name:'Apps premium',icon:'📱'},
  {id:'ds2201',categoryId:'dc22',name:'Gimnasio',icon:'🏋️'},{id:'ds2202',categoryId:'dc22',name:'Entrenador personal',icon:'💪'},{id:'ds2203',categoryId:'dc22',name:'Deportes',icon:'⚽'},{id:'ds2204',categoryId:'dc22',name:'Materiales de hobby',icon:'🎨'},{id:'ds2205',categoryId:'dc22',name:'Videojuegos',icon:'🎮'},
  {id:'ds2301',categoryId:'dc23',name:'Teléfonos',icon:'📱'},{id:'ds2302',categoryId:'dc23',name:'Computadores',icon:'💻'},{id:'ds2303',categoryId:'dc23',name:'Accesorios tech',icon:'⌨️'},
  {id:'ds2401',categoryId:'dc24',name:'Cumpleaños',icon:'🎂'},{id:'ds2402',categoryId:'dc24',name:'Bodas y celebraciones',icon:'💍'},{id:'ds2403',categoryId:'dc24',name:'Reuniones',icon:'🤝'},{id:'ds2404',categoryId:'dc24',name:'Decoraciones',icon:'🎊'},{id:'ds2405',categoryId:'dc24',name:'Regalos',icon:'🎁'},
  {id:'ds2501',categoryId:'dc25',name:'Ahorro mensual',icon:'🗓️'},{id:'ds2502',categoryId:'dc25',name:'Ahorro semanal',icon:'📅'},{id:'ds2503',categoryId:'dc25',name:'Fondo de emergencia',icon:'🆘'},{id:'ds2504',categoryId:'dc25',name:'Aporte extraordinario',icon:'⭐'},
  {id:'ds2601',categoryId:'dc26',name:'Fondos de inversión',icon:'🏦'},{id:'ds2602',categoryId:'dc26',name:'ETF',icon:'📊'},{id:'ds2603',categoryId:'dc26',name:'Acciones',icon:'📈'},{id:'ds2604',categoryId:'dc26',name:'Pensión voluntaria',icon:'👴'},{id:'ds2605',categoryId:'dc26',name:'Capital para proyectos',icon:'💡'},
  {id:'ds2701',categoryId:'dc27',name:'Viaje',icon:'✈️'},{id:'ds2702',categoryId:'dc27',name:'Educación',icon:'🎓'},{id:'ds2703',categoryId:'dc27',name:'Vehículo',icon:'🚗'},{id:'ds2704',categoryId:'dc27',name:'Vivienda',icon:'🏠'},{id:'ds2705',categoryId:'dc27',name:'Emprendimiento',icon:'💡'},
  {id:'ds2801',categoryId:'dc28',name:'Banco → Banco',icon:'↔️'},{id:'ds2802',categoryId:'dc28',name:'Banco → Efectivo',icon:'💵'},{id:'ds2803',categoryId:'dc28',name:'Efectivo → Banco',icon:'🏦'},
  {id:'ds2901',categoryId:'dc29',name:'Pago a persona',icon:'👤'},{id:'ds2902',categoryId:'dc29',name:'Pago a negocio',icon:'🏢'},
  {id:'ds3001',categoryId:'dc30',name:'Depósito en ventanilla',icon:'🏦'},{id:'ds3002',categoryId:'dc30',name:'Depósito en cajero',icon:'🏧'},{id:'ds3003',categoryId:'dc30',name:'Retiro en cajero',icon:'🏧'},{id:'ds3004',categoryId:'dc30',name:'Retiro en ventanilla',icon:'🏦'},{id:'ds3005',categoryId:'dc30',name:'Recarga billetera digital',icon:'💳'},{id:'ds3006',categoryId:'dc30',name:'Recarga móvil',icon:'📱'},
];
// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════
let S = {
  currency:'', currentPage:'dashboard', theme:'light',
  language:'', weekStart:'', _catTab:'gasto', notifPrefs:{}, numFormat:'auto', currencies:[], profile:{name:'',email:'',photo:'',profession:''},
  shoppingLists:[], investments:[], subscriptions:[], accounts:[], transactions:[], categories:[], subcategories:[],
  budgets:[], goals:[], scheduledPayments:[],
  movFilter:{tab:'todos',search:'',dateFrom:'',dateTo:'',catId:'',accountId:'',payMethod:''},
  analysisPeriod:'Mensual', analysisPeriodSub:'anual',
  analysisYear:new Date().getFullYear(),
  exchangeRate:{PLN_COP:1200,COP_PLN:0.000833,lastUpdated:''},
};

function loadState(){
  try{
    const saved=localStorage.getItem('finanziaState3');
    if(saved){const p=JSON.parse(saved);Object.assign(S,p);}
    else{S.categories=JSON.parse(JSON.stringify(DEFAULT_CATS));S.subcategories=JSON.parse(JSON.stringify(DEFAULT_SUBS));}
  }catch(e){S.categories=JSON.parse(JSON.stringify(DEFAULT_CATS));S.subcategories=JSON.parse(JSON.stringify(DEFAULT_SUBS));}
  // Migrate: if categories use old IDs (c1,c2...) replace with new DEFAULT_CATS
  const needsCatReset=!S.categories||!S.categories.length||S.categories.length>30||(S.categories[0]&&S.categories[0].id&&S.categories[0].id.match(/^c\d+$/))||!!(S.categories.find(function(cat){return cat.name==='Bonificaciones'||cat.name==='Paquete TV/Internet/Teléfono';}));
  if(needsCatReset){S.categories=JSON.parse(JSON.stringify(DEFAULT_CATS));S.subcategories=JSON.parse(JSON.stringify(DEFAULT_SUBS));}
  // Ensure protected Efectivo account exists
  // FIRST: migrate legacy efectivo-default
  const legacyEf=S.accounts.find(a=>a.id==='efectivo-default');
  if(legacyEf){
    if(!S.accounts.find(a=>a.id==='efectivo-PLN')){
      legacyEf.id='efectivo-PLN';legacyEf.currency='PLN';
      legacyEf.protected=true;legacyEf.subtype='efectivo';legacyEf.subAccounts=[];
    } else {
      S.accounts=S.accounts.filter(a=>a.id!=='efectivo-default');
    }
  }
  // THEN: ensure one Efectivo per configured currency — SOLO si no existe ninguna cuenta efectivo para esa moneda
  const curs=S.currencies&&S.currencies.length?S.currencies:[];
  if(!curs.length){return;} // no currencies yet
  curs.forEach(cur=>{
    const efId='efectivo-'+cur;
    const efAcc=S.accounts.find(a=>a.id===efId);
    // Solo marcar como protected si ya existe la cuenta con ese ID exacto
    if(efAcc){
      efAcc.protected=true;efAcc.subtype='efectivo';efAcc.subAccounts=[];
    }
    // NO crear automáticamente — el usuario la crea desde el flujo de Cuentas
  });
  // Remove any duplicate efectivos (same currency, keep first)
  const seenEf=new Set();
  S.accounts=S.accounts.filter(a=>{
    if(a.subtype!=='efectivo')return true;
    const key='ef-'+a.currency;
    if(seenEf.has(key))return false;
    seenEf.add(key);return true;
  });
  if(!S.movFilter)S.movFilter={tab:'todos',search:'',dateFrom:'',dateTo:'',catId:'',accountId:'',payMethod:''};
  if(!S.analysisPeriod)S.analysisPeriod='Mensual';
  if(!S.analysisYear)S.analysisYear=new Date().getFullYear();
  if(!S.analysisPeriodSub)S.analysisPeriodSub='anual';if(!S.analysisYear)S.analysisYear=new Date().getFullYear();
  if(!S.exchangeRate)S.exchangeRate={PLN_COP:1200,COP_PLN:0.000833,lastUpdated:''};
  // Tema: siempre light por defecto. Solo persiste si el usuario lo cambió en este dispositivo.
  var _uid2=typeof _currentUser!=='undefined'&&_currentUser&&_currentUser.id?_currentUser.id:(localStorage.getItem('_lastAuthUserId')||'');
  var _themeKey='_themeSet_'+(_uid2||'default');
  if(!localStorage.getItem(_themeKey))S.theme='light';
  else if(!S.theme)S.theme='light';
  if(!S.language&&!S._langUserSet){
    var _nl=((navigator.language||'').split('-')[0]||'').toLowerCase();
    var _sl=['es','en','zh','hi','ar','pt','fr','ru','bn','id','de','ja','tr','ko','vi','it','pl','fa','sw','ur'];
    S.language=_sl.indexOf(_nl)!==-1?_nl:'en';
  }
  // language and weekStart stay empty until user chooses
  // currencies stay empty until user sets up profile
  if(typeof applyThemeMode==='function')applyThemeMode();
  // Update drawer profile
  updateDrawerProfile();
}function _getProfilePhoto(){
  var _uid=typeof _currentUser!=='undefined'&&_currentUser&&_currentUser.id
    ?_currentUser.id
    :(localStorage.getItem('_lastAuthUserId')||'');
  if(!_uid) return (S.profile&&S.profile.photo)||'';
  return localStorage.getItem('_profilePhoto_'+_uid)||'';
}
function updateDrawerProfile(){
  var name=S.profile&&S.profile.name?S.profile.name:'Mi Perfil';
  var email=S.profile&&S.profile.email?S.profile.email:'Toca para configurar';
  var photo=_getProfilePhoto();
  var nameEl=document.getElementById('drawer-profile-name');
  var emailEl=document.getElementById('drawer-profile-email');
  var avatarEl=document.getElementById('drawer-avatar');
  var pctEl=document.getElementById('drawer-progress-pct');
  var fillEl=document.getElementById('drawer-progress-fill');
  if(nameEl)nameEl.textContent=name;
  if(emailEl)emailEl.textContent=email;
  if(avatarEl){
    if(photo){
      avatarEl.innerHTML='<img src="'+photo+'" alt="foto">';
    }else{
      var initials=name.split(' ').map(function(w){return w[0];}).join('').toUpperCase().slice(0,2);
      avatarEl.innerHTML='<span style="font-size:18px;font-weight:900;color:white;letter-spacing:-.5px">'+(initials&&initials!=='MI'?initials:'JQ')+'</span>';
    }
  }
  // Progress bar
  try{
    var p=S.profile||{};
    var uid=window._currentUser&&window._currentUser.id;
    var checks=[
      !!(name&&name!=='Mi Perfil'),
      !!(p.gender&&p.gender!==''),
      !!(p.residence),
      !!(p.phone&&p.phoneCode),
      !!(p.profession),
      !!(p.financialGoal),
      !!(photo)
    ];
    var pct=Math.round(checks.filter(Boolean).length/checks.length*100);
    var pctText = pct>=100 ? '¡Perfil completo! ✓' : 'Perfil al '+pct+'% — complétalo para más 💚';
    if(pctEl)pctEl.textContent=pctText;
    if(fillEl)fillEl.style.width=pct+'%';
  }catch(e){}
}

function saveState(){
  // localStorage — siempre, síncrono, nunca falla
  // La foto de perfil se guarda en clave dedicada (_profilePhoto_{uid}), no en finanziaState3
  try{
    var _toSaveLocal=Object.assign({},S);
    if(_toSaveLocal.profile&&_toSaveLocal.profile.photo){
      _toSaveLocal.profile=Object.assign({},_toSaveLocal.profile);
      delete _toSaveLocal.profile.photo;
    }
    localStorage.setItem('finanziaState3',JSON.stringify(_toSaveLocal));
  }catch(e){}
  // Supabase — SOLO después de que syncFromSupabase haya completado al menos una vez
  // Esto evita la race condition donde initApp() guarda datos vacíos antes de recibir
  // los datos remotos, pisando S._lastSync y bloqueando el sync para siempre.
  try{
    if(!window._supabaseSynced) return; // ← gate: esperar primer sync
    if(typeof _supabase==='undefined'||!_supabase) return;
    if(typeof _currentUser==='undefined'||!_currentUser) return;
    var now=Date.now();
    if(window._lastSupabaseSave&&(now-window._lastSupabaseSave)<2000) return;
    window._lastSupabaseSave=now;
    saveUserData(_currentUser.id,S).catch(function(e){
      console.warn('saveState → Supabase error:',e);
    });
  }catch(e){}
}

// ════════════════════════════════════════════════════════════
// SUPABASE DATA SYNC
// ════════════════════════════════════════════════════════════

async function saveUserData(userId,data){
  if(typeof _supabase==='undefined'||!_supabase) return;
  var toSave=Object.assign({},data);
  // Campos de UI/navegación — no persistir en servidor
  delete toSave.currentPage;
  delete toSave._catTab;
  delete toSave.movFilter;
  // _lastSync es solo del cliente
  delete toSave._lastSync;
  delete toSave.theme;
  // Campos de estado UI — no tienen sentido en otro dispositivo
  delete toSave._fcData;       // formulario de cuenta a medio llenar
  delete toSave._viewAccId;    // cuenta siendo visualizada
  delete toSave._cuentasGrupo; // grupo activo en pantalla cuentas
  delete toSave._navHistory;   // historial de navegación
  delete toSave._testAnswers;  // respuestas test salud financiera
  // Blindaje final: garantizar updated_at en todos los items antes de persistir
  var _STAMP_KEYS2=['transactions','accounts','subscriptions','budgets','goals',
    'categories','subcategories','scheduledPayments','shoppingLists','investments'];
  _STAMP_KEYS2.forEach(function(k){
    if(Array.isArray(toSave[k])){
      toSave[k]=toSave[k].map(function(item){return ensureStamped(item);});
    }
  });
  try{
    var _now=new Date().toISOString();
    var res=await _supabase
      .from('user_data')
      .upsert({user_id:userId,data:toSave,updated_at:_now},{onConflict:'user_id'})
      .select();
    if(res.error){console.warn('☁️ save error:',res.error.message);}
    else{S._lastSync=Date.now();console.log('☁️ saved ✓');}
  }catch(e){console.warn('☁️ save exception:',e);}
}

async function loadUserData(userId){
  if(typeof _supabase==='undefined'||!_supabase) return null;
  try{
    // loading from supabase
    var res=await _supabase
      .from('user_data')
      .select('data, updated_at')
      .eq('user_id',userId)
      .maybeSingle();
    if(res.error){console.warn('loadUserData error:',res.error.message); return null;}
    if(!res.data) return null;
    // Adjuntar updated_at al objeto data para usarlo en syncFromSupabase
    var result=res.data.data||{};
    result._remoteUpdatedAt=res.data.updated_at?new Date(res.data.updated_at).getTime():0;
    return result;
  }catch(e){console.warn('loadUserData exception:',e); return null;}
}

// ════════════════════════════════════════════════════════════
// MERGE POR ID — para arrays con elementos identificables
// ════════════════════════════════════════════════════════════
function mergeById(localArr, remoteArr){
  // Garantías de tipo
  if(!Array.isArray(localArr)) localArr=[];
  if(!Array.isArray(remoteArr)) remoteArr=[];

  // Índice: id → elemento, para acceso O(1)
  var localMap={};
  localArr.forEach(function(item){
    if(item&&item.id!=null) localMap[item.id]=item;
  });
  var remoteMap={};
  remoteArr.forEach(function(item){
    if(item&&item.id!=null) remoteMap[item.id]=item;
  });

  // Unión de todos los IDs encontrados
  var allIds=Object.keys(Object.assign({},localMap,remoteMap));

  var merged=allIds.map(function(id){
    var local=localMap[id];
    var remote=remoteMap[id];

    // Solo existe en uno de los dos → tomar el que existe
    if(!local) return ensureStamped(remote);
    if(!remote) return ensureStamped(local);

    // Blindaje: garantizar updated_at antes de comparar
    local=ensureStamped(local);
    remote=ensureStamped(remote);

    // Existe en ambos → resolver con updated_at
    var localTs=local.updated_at?new Date(local.updated_at).getTime():0;
    var remoteTs=remote.updated_at?new Date(remote.updated_at).getTime():0;

    if(localTs>0||remoteTs>0){
      // Al menos uno tiene timestamp → gana el más reciente
      return localTs>=remoteTs?local:remote;
    }
    // Sin timestamps → priorizar remoto (fuente de verdad del servidor)
    return remote;
  });

  // Eliminar posibles nulos (defensivo)
  // Nota: items con deleted:true se mantienen para propagación de soft-delete entre dispositivos.
  // La UI los filtrará cuando se implemente la vista correspondiente.
  return merged.filter(Boolean);
}

// Arrays que deben mergearse por id en lugar de sobrescribirse
var MERGE_BY_ID_KEYS=[
  'transactions','accounts','subscriptions',
  'budgets','goals','categories','subcategories','scheduledPayments','shoppingLists','investments'
];

async function syncFromSupabase(userId){
  window._supabaseSynced=false; // bloquear saves durante el proceso de sync
  var remote=await loadUserData(userId);
  // Sin datos remotos → usuario nuevo, habilitar saves y salir
  if(!remote||typeof remote!=='object'||Object.keys(remote).length===0){
    console.warn('syncFromSupabase: sin datos remotos, usuario nuevo');
    window._supabaseSynced=true;
    return;
  }
  var remoteTs=remote._remoteUpdatedAt||remote._lastSync||0;
  var localTs=S._lastSync||0;
  var isFreshSession=(localTs===0);
  if(!isFreshSession&&localTs>remoteTs){
    console.log('⏭️ sync omitido: local más reciente');
    window._supabaseSynced=true;
    return;
  }
  // Sin cambios reales desde el último sync — evitar merge/render innecesario
  if(!isFreshSession&&remoteTs===localTs){
    console.log('⏭️ sync omitido: sin cambios');
    window._supabaseSynced=true;
    return;
  }
  if(isFreshSession){console.log('🌱 sesión fresca → sync forzado');}
  // Detectar reset intencional: _resetAt remoto más reciente que el local
  var remoteResetAt=remote._resetAt||0;
  var localResetAt=S._resetAt||0;
  var isReset=(remoteResetAt>localResetAt);
  if(isReset){console.log('🗑️ reset remoto detectado');}
  try{
    var keepPage=S.currentPage||'dashboard';
    var keepMovFilter=S.movFilter||{tab:'todos',search:'',dateFrom:'',dateTo:'',catId:'',accountId:'',payMethod:''};
    var keepCatTab=S._catTab||'gasto';

    Object.keys(remote).forEach(function(key){
      if(key==='_remoteUpdatedAt') return;
      if(key==='theme') return;
      var val=remote[key];
      if(val===null||val===undefined) return;

      // ── Arrays con IDs → merge inteligente ──────────────────
      if(MERGE_BY_ID_KEYS.indexOf(key)!==-1&&Array.isArray(val)){
        // Array vacío remoto: ignorar SALVO que sea un reset intencional
        if(val.length===0&&Array.isArray(S[key])&&S[key].length>0){
          if(!isReset) return; // protección normal anti-pérdida
          S[key]=[]; // reset intencional → forzar vacío
          return;
        }
        var _prev=(S[key]||[]).length;
        S[key]=mergeById(S[key]||[],val);
        if(_prev!==S[key].length) console.log('🔀',key+':',_prev,'→',S[key].length);
        return;
      }

      // ── Arrays genéricos (sin id) → regla original ──────────
      if(Array.isArray(val)&&val.length===0&&Array.isArray(S[key])&&S[key].length>0){
        if(!isReset) return;
        S[key]=[];
        return;
      }

      // ── Objetos vacíos → no sobrescribir (salvo reset) ───────
      if(val&&typeof val==='object'&&!Array.isArray(val)&&Object.keys(val).length===0
         &&S[key]&&typeof S[key]==='object'&&Object.keys(S[key]).length>0){
        if(!isReset) return;
      }

      S[key]=val;
    });

    S.currentPage=keepPage;
    S.movFilter=keepMovFilter;
    S._catTab=keepCatTab;
    S._lastSync=remoteTs||Date.now();
    try{
      var _toSaveSync=Object.assign({},S);
      if(_toSaveSync.profile&&_toSaveSync.profile.photo){
        _toSaveSync.profile=Object.assign({},_toSaveSync.profile);
        delete _toSaveSync.profile.photo;
      }
      localStorage.setItem('finanziaState3',JSON.stringify(_toSaveSync));
    }catch(e){}
    // Bloquear save a Supabase 3s — datos vienen DE allí, guardar de vuelta genera loop Realtime
    window._lastSupabaseSave=Date.now()+3000;
    console.log('✅ sync aplicado',new Date(remoteTs).toLocaleTimeString());
    if(typeof renderPage==='function') renderPage(S.currentPage);
    if(typeof updateDrawerProfile==='function') updateDrawerProfile();
    if(typeof refreshCurrencyToggle==='function') refreshCurrencyToggle();
  }catch(e){console.warn('syncFromSupabase merge error:',e);}
  // Habilitar saves SIEMPRE al final, éxito o no
  window._supabaseSynced=true;
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).substr(2,5);}

// ════════════════════════════════════════════════════════════
// HELPERS SaaS — updated_at y soft delete
// ════════════════════════════════════════════════════════════

// Sella un item con updated_at actual (usar al crear o modificar)
function stampItem(item){
  if(!item) return item;
  return Object.assign({},item,{updated_at:new Date().toISOString()});
}

// Garantiza updated_at en cualquier item — blindaje ante olvidos futuros
function ensureStamped(item){
  if(!item) return item;
  if(!item.updated_at){
    console.warn('⚠️ item sin updated_at → auto-fix',item.id||item);
    return stampItem(item);
  }
  return item;
}

// Soft delete: marca item como eliminado en lugar de borrarlo físicamente
// Uso: S.transactions = softDelete(S.transactions, id);  saveState();
function softDelete(arr, id){
  if(!Array.isArray(arr)) return arr;
  return arr.map(function(item){
    if(item&&item.id===id){
      return Object.assign({},item,{deleted:true,updated_at:new Date().toISOString()});
    }
    return item;
  });
}

// Filtra items eliminados para render (usar en UI cuando se implemente)
function filterDeleted(arr){
  if(!Array.isArray(arr)) return arr||[];
  return arr.filter(function(item){return !item||!item.deleted;});
}
// Number inputs: format with thousand separator on display, parse on use
