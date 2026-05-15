# FinanzIA — Documento Maestro del Equipo

> **INSTRUCCIÓN OBLIGATORIA PARA TODO MIEMBRO DEL EQUIPO**
> Al iniciar CUALQUIER sesión, lo primero es leer este documento completo — especialmente la sección **Bitácora de sesiones** — para sincronizarse con el estado actual del proyecto. Sin excepción.

---

## 👥 El Equipo

| Miembro | Rol | Responsabilidad |
|---|---|---|
| **Jorge** | Product Owner | Toma todas las decisiones. Aprueba todo antes de implementar. Nada se hace sin su autorización. |
| **Claude (claude.ai)** | Asesor técnico y estratégico | Asesora a Jorge sobre cómo comunicarse con Claude Code y Claude Design. Explica qué está pasando, por qué, y qué riesgos hay. Prepara los prompts para los otros miembros. Revisa código si Jorge lo necesita. |
| **Claude Code** | Desarrollador | Implementa código directamente en el repo. Lee este CLAUDE.md al iniciar cada sesión. Actualiza la bitácora al finalizar. Nunca toca módulos congelados sin autorización de Jorge. |
| **Claude Design** | Diseñador | Genera pantallas y componentes visuales. Trabaja con prompts precisos preparados por Claude (asesor). No itera — cada encargo debe salir bien al primer intento. |
| **Cowork** | Automatización | Automatiza tareas repetitivas de archivos y gestión en el PC de Jorge. |

### Reglas de comunicación del equipo
- **Jorge → Claude Code**: prompts precisos preparados por Claude (asesor). Siempre incluir qué módulo, qué cambio, y qué NO tocar.
- **Jorge → Claude Design**: un encargo cerrado y completo por sesión. Claude (asesor) prepara el prompt con el sistema de diseño completo.
- **Jorge → Claude (asesor)**: conversación libre. Es el punto de entrada para entender, planear y preparar todo.
- **Claude Code al finalizar sesión**: SIEMPRE actualizar la sección Bitácora de sesiones en este archivo.

---

## 📋 Bitácora de sesiones

> Claude Code actualiza esta sección **solo cuando Jorge lo pide explícitamente**,
> usando exactamente esta frase: *"todo por hoy, actualiza el CLAUDE.md,
> dame el listado de archivos que trabajaste y actualizaste y actualízalos
> en todas las ubicaciones por favor"*
> Una entrada por sesión, numerada. Formato:
> ```
> ### Sesión N — YYYY-MM-DD
> **Archivos modificados:** lista
> **Qué se hizo:** puntos
> **Decisiones de Jorge:** puntos
> **Pendiente:** puntos
> ```

### Sesión 10 — 2026-05-15 (cierre del día)
**Archivos modificados:** `ui.js`, `finance.js`, `storage.js`, `styles.css`, `index.html`

**Qué se hizo:**
- **Drawer**: quitado grupo "Mi día" del drawer (solo accesible desde dashboard). Espaciado `margin-top:16px` antes de "Cerrar sesión".
- **Configuración**: quitadas leyendas "Se aplica en..." de Formato de fecha/hora. Selector formato moneda: eliminado "Automático", opciones muestran números reales según locale activo. Inputs numéricos usan `numInput/fmtRTLValue/parseNumSubs` (mismo estándar que Herramientas).
- **Dashboard — KPIs patrimonio**: "Cuentas" reemplazado por "Invertido" (inversiones en moneda activa). Orden: Disponible, Ahorrado, Invertido, Deudas. `kpiDisponible = max(0, cuentas - metas)`. % vs mes anterior usa `_savingsBase` (todas las divisas → base) — ya no depende de la moneda activa.
- **Pills "Mis Divisas"**: rediseñadas como selector puro (bandera + punto + código, sin balance). Gratis: ocultas con 1 divisa. Pro/Premium: grid `1fr 1fr` siempre. Premium 3-4: grid 2×2.
- **Movimientos**: quita filtro `t.currency === S.currency` — muestra todas las divisas. `txRow` añade línea `≈ X COP` usando `convertToBase()` cuando tx es en moneda diferente a base. Modal de detalle también muestra equivalente. `buildViewTxModal` y balance de lista en moneda base.
- **Regla 50/30/20 dashboard**: rediseño completo — 3 tarjetas (Necesidades/Deseos/Ahorros) con barra, badge %, tip contextual, pill de estado en header. `S.incomeBudget` como base de cálculo si existe. `_getMonthlyIncomeBudget()` calcula en tiempo real desde `S.budgets`. `getRuleStatusPill()` separado para el header. Pill en fila del título.
- **Pantalla Presupuestos — rediseño completo**:
  - Selector de mes ‹/›/⋯ en el nav (header row2), fondo blanco.
  - Cards resumen Ingresos/Gastos con barra de progreso, estado y lápiz.
  - Grupos 💰 Ingresos (por mes) y 💸 Gastos con badge naturaleza, semáforo, porcentaje 2 decimales.
  - Sheets: ingreso general (preview 50/30/20), gasto general (preview % del ingreso), agregar (chooser → accordion categorías por tipo → monto), editar (diseño con info card + label uppercase + input grande + botones cápsula).
  - Todos los inputs numéricos con `numInput/fmtRTLValue/parseNumSubs`.
  - Opciones ⋯: copiar al mes siguiente, reiniciar, exportar.
- **Bug sync Supabase presupuestos (raíz)**: `syncFromSupabase` llama `renderPage()` y podía pisar `S.incomeBudgets` con datos remotos viejos. Solución definitiva: **todos los presupuestos de ingreso migrados a `S.budgets`** con campo `type:'ingreso'/'ingreso_general'/'gasto_general'`. `S.budgets` está en `MERGE_BY_ID_KEYS` desde el día 1 → sync correcto garantizado. Reconciliación localStorage→memoria al inicio de `renderPresupuestos()`.
- **Delete presupuestos**: `filter(b => b.id !== id)` en lugar de `softDelete` (evita que Supabase sync restaure items). `closeBottomSheet()` antes del confirm + setTimeout 150ms (evita que confirm quede detrás del BS). Guard `_absConfirmSaving` contra doble tap.
- **`#confirm-root` z-index**: `400 → 10004` (encima del BS en 9999).
- **`incomeBudgets` en `MERGE_BY_ID_KEYS`**: protección contra sync que vaciaba el arreglo.

**Decisiones de Jorge:**
- Pills Mis Divisas: solo selector visual, sin balance numérico.
- Disponible KPI = cuentas − metas (mínimo 0). Metas deben estar respaldadas por cuentas.
- Presupuestos individuales de ingreso: en `S.budgets` con campo `type` (no en campo nuevo `incomeBudgets`).
- Delete presupuestos: eliminación directa con `filter()`, no soft-delete.
- Filtro gastos por mes: mes actual muestra todos; meses pasados solo si hubo gasto real.

**Pendiente:**
- Sprint D: Movimientos — diseño Claude Design pendiente. Feature "foreign currency transaction".
- Bug sync sesión 8: `saveState()` gate `_supabaseSynced` sigue activo (pendiente sesión dedicada).
- Landing page: actualizar tabla de planes (divisas Gratis=1, Pro=2, Premium=4).
- i18n completo, Emiliano IA real, Monetización SaaS.

---

### Sesión 9 — 2026-05-14 (cierre del día)
**Archivos modificados:** `ui.js`, `finance.js`, `storage.js`

**Qué se hizo:**
- **Sprint C — Dashboard completo**: `renderDashboard()` reescrita desde cero con: card patrimonio split (balance izq + KPIs der), sección "Mis Divisas" (pills con bandera+punto+código+balance), FX strip en grilla dinámica, grilla Ingresos/Gastos/Ahorro (3 cols), Regla 50/30/20, Presupuesto, Mi Día widget, Últimos movimientos.
- **Selector de mes** `‹ mes ›` en header dashboard misma fila que el nombre. Filtra TODA la data del dashboard (Ingresos, Gastos, Ahorro, Regla, Presupuesto, Movimientos). Sin scroll al cambiar mes.
- **Pills de divisas**: estilo pill `border-radius:100px` con bandera emoji, punto verde (base) / gris (otras), código divisa, separador y balance. Layout: 1→full, 2→flex fila, 3-4→grid 2x2.
- **Límites de plan actualizados**: Gratis=1 divisa, Pro=2, Premium=4. Aplicado en todos los selectores, contadores y restricciones.
- **`setCurrency(c)`**: ahora también actualiza `S.baseCurrency` — tocar una pill cambia base Y activa, todo el dashboard (incluyendo patrimonio) refleja la moneda seleccionada.
- **`setBaseCurrency(cur)`**: función nueva. **`setPlan(plan)`**: función nueva con switcher ✦★∞ inyectado en drawer (row 3 del grid, sin tocar index.html).
- **Badge de plan en drawer**: inyectado dinámicamente con switcher de plan para testing.
- **Fórmulas financieras corregidas**:
  - Patrimonio = activos_cuentas − deudas(todas divisas→base) + inversiones
  - Disponible KPI = `getTotalBalance()` solo en `S.currency` activa
  - Ahorrado/Deudas/Cuentas KPI = solo en `S.currency` activa
  - Metas NO se suman al patrimonio (dinero ya en cuentas activo — no doble conteo)
  - `_patPrev` corregido: orden de definición de variables corregido (NaN bug)
  - `debtTotal`: incluye TODOS los pasivos de cualquier moneda convertidos a base
  - `investmentsTotal`: suma `currentValue||capital` de S.investments → base
- **`renderExchangeWidget`**: grilla dinámica `repeat(N,1fr)` según pares. Separador de miles con regex (garantizado en Android, ej. 1.050 COP).
- **`renderRule502030(refDate)` y `getBudgetSpent(b, refDate)`**: parámetro opcional de fecha para filtrar por mes del selector.
- **`_renderMiDiaWidget` rediseñado**: pills siempre `flex:1` iguales, panel de detalle full-width debajo. Sin scroll al tap (actualiza solo `#midiawgt`). Diseño uniforme con demás cards.
- **`logHabit()` 3 bugs corregidos**: desmarcar→streak-1 (no destruir a 0), lastLog='' al desmarcar, navega a dashboard no objetivos.
- **`openNewTaskForm()`**: nueva función → llama `_showCustomTaskBS()` con fecha hoy.
- **`_savePickerCurrencies`**: usa `navigate(S.currentPage)` → vuelve a página anterior con header correcto (bug: iba siempre a configuración con header incorrecto).
- **Restricciones de plan reales**: `toggleCurrency`, `_toggleCurBS`, `_togglePickerCur` con límites dinámicos por plan.
- **`loadState()` safety net**: recorta divisas respetando `baseCurrency` al bajar de plan.
- **Títulos de sección uniformes**: `font-size:13px;font-weight:800;color:var(--text)` igual que "Mi día" en Regla, Presupuesto, Últimos movimientos.
- **Regla 50/30/20**: "este mes" removido del estado sin-ingresos.

**Decisiones de Jorge:**
- Gratis=1, Pro=2, Premium=4 divisas.
- Tap en currency card = establece AMBAS (activa Y base) — todo cambia a esa moneda.
- KPIs (Disponible/Ahorrado/Deudas/Cuentas) muestran SOLO la moneda activa (visión operativa por divisa, no conversiones).
- Patrimonio sigue siendo global (convierte todo a base para visión de riqueza total).
- Metas no se suman al patrimonio — el dinero ya está en cuentas activo (sin doble conteo).
- % patrimonio = variación real vs mes anterior (`savings / abs(patrimony - savings)`).
- Movimientos recientes en dashboard: todos del mes seleccionado, sin filtro de moneda.
- `fmtC` revertido — números completos siempre (sin formato compacto 89.5M).
- Landing page: pendiente actualizar tabla de planes con diferencias de divisas.

**Pendiente:**
- **Landing page**: actualizar sección de planes (finanzia.xenda.co/landing) con los nuevos límites: Gratis=1 divisa, Pro=2, Premium=4 — y las diferencias entre planes.
- Sprint D: Movimientos — diseño Claude Design pendiente. Feature "foreign currency transaction" (cobro en EUR, pago con cuenta COP).
- Bug sync sesión 8 pendiente: `saveState()` gate `_supabaseSynced` bloquea sync de preferencias críticas.
- i18n completo, Emiliano IA real, Monetización SaaS.

---

### Sesión 8 — 2026-05-01 (cierre del día)
**Archivos modificados:** `ui.js`, `storage.js`, `auth.js`, `app.js`, `index.html`, `sw.js`, `finance.js`

**Qué se hizo:**
- **Drawer reorganizado**: Categorías portal después de Herramientas, Mi día portal con separador propio, "Comunidad" → "Comunidad y ayuda", Soporte movido junto a Síguenos, eliminados sección Ayuda + Acerca de/Legal del drawer (movidos a Configuración → Sistema).
- **Página Mi día**: `renderMiDia()` con cards Tareas y Objetivos, entrada `'mi-dia'` en `_PAGE_LABELS` y switch de `renderPage`.
- **Configuración expandida**: Formato de fecha (`showBS_dateFmt`) y Formato de hora (`showBS_timeFmt`) en Preferencias; Acerca de y Legal en Sistema antes de Notificaciones.
- **`fmtDate()` y `fmtTime()`** en `finance.js`: respetan `S.dateFormat` y `S.timeFormat`. Aplicados en lista movimientos, pagos programados, tareas, botones hora notificaciones.
- **Sistema de notificaciones persistente** (`S.notifications[]`): `_addNotif`, `_updateNotifBadge`, `_markNotifRead`, `_markAllNotifsRead`, `_deleteNotif`, `_notifTap`. BS campanilla rediseñado con leído/no leído, badge, navegación a pantalla correcta.
- **Notificaciones CRON**: `checkAutoPayments/checkBudgetNotifs/checkWeeklyNotif/checkTipsNotif` ya no envían locales — CRON Supabase es el responsable. `checkGoalNotifs` vaciada.
- **Web Push completo**: `_subscribePush`, `_urlBase64ToUint8Array`, `_sendPushNotif(title,body,page)` en `ui.js`. VAPID_PUBLIC_KEY hardcodeado. Auto-suscripción en `initApp`. `sw.js` handler push completo con `data:{page}` y `tag` para evitar agrupación Android.
- **Navegación desde push**: `sw.js` `notificationclick` → `postMessage({type:'notif_page'})` o `openWindow('/?notif_page=X')`. `app.js` detecta `_notifPage` en `localStorage` y navega con timeout 500ms.
- **Auto-detección timezone**: `app.js` detecta `Intl.DateTimeFormat().resolvedOptions().timeZone` y guarda en `S.profile.timezone` al iniciar.
- **Días de anticipación configurables**: `S.notifDaysDefault`, chips 1/2/3/5/7/15 días en `_openNotifTimePick` para pagos. `_setNotifDays` actualiza in-place sin cerrar BS.
- **Horario de notificaciones** (Desde/Hasta) en panel Notificaciones. Hora específica por tipo con `_openNotifTimePick`. Inputs Desde/Hasta centrados.
- **Toggle `notifReminders`** añadido a `_notifActivateAll` (no visible en UI — comportamiento interno). Recordatorio de registro a las 20:00 si no hay movimientos en el día.
- **Flash onboarding eliminado**: `initApp()` antes de `hideAuthScreen()`, `S.currentPage='configuracion'` antes de `initApp`.
- **`openDrawer()` refresca datos**: llama `updateDrawerProfile()` al abrir.
- **Bug sync detectado**: cambios en la app (tiempos de notificación, scheduleTo) no llegan a Supabase por gate `_supabaseSynced`. **Pendiente arreglar en próxima sesión.**
- **Edge Functions Supabase** (actualizadas manualmente, no en repo): `send-push` con `tag` para evitar agrupación Android y campo `page`; `check-notifications` con 6 bloques (pagos, tips, resumen semanal, presupuesto, metas, recordatorio). CRON cada 15 min.
- **Web Push verificado end-to-end**: notificación de pago llegó al OPPO con pantalla bloqueada ✅.

**Decisiones de Jorge:**
- Formato fecha/hora solo aplica a listas y reportes (no a inputs nativos del navegador).
- Toggle `notifReminders` no visible al usuario — es comportamiento interno.
- Timezone auto-detectado del dispositivo, no configurable manualmente.
- **Bug pendiente**: `saveState()` debe sincronizar a Supabase aunque `_supabaseSynced` sea false para cambios de preferencias críticas.

**Pendiente:**
- **Fix urgente**: `saveState()` gate `_supabaseSynced` bloquea sync de preferencias de notificaciones → CRON lee datos viejos.
- Sprint C: Dashboard, Movimientos, Deudas, Herramientas — esperando diseño Claude Design.
- Web Push + notificaciones con app cerrada: ✅ funcional. Afinar agrupación Android.
- i18n completo, Emiliano IA real, Monetización SaaS.

---

### Sesión 7 — 2026-04-30 (cierre del día)
**Archivos modificados:** `ui.js`, `storage.js`, `auth.js`, `app.js`, `index.html`

**Qué se hizo:**
- **Sistema de avatares unificado**: nueva función `_avatarInner(fontSize)` en `ui.js:360` — devuelve solo el innerHTML (foto → iniciales → ícono SVG persona) con fallback en cascada `S.profile.name → user_metadata.full_name → ''`. Usada en los 4 avatares de la app: drawer (18px), header dashboard (12px), Mi Perfil (18px), Configuración (18px).
- **Header avatar (#header-avatar)**: gradiente fijo `linear-gradient(135deg,#00D4AA,#7461EF) !important` en `index.html:495`. En `_updateHeader` se reescribe `ava.style.cssText` completo cada render para garantizar que el gradiente nunca se pierda. Sin border, 34×34px.
- **Drawer avatar**: `updateDrawerProfile` (storage.js) usa `_avatarInner(18)` con fallback inline. Aplica gradiente, display flex, overflow hidden directamente al elemento. % calculado vía `_calcProfileProgress()` (mismos 7 campos que Mi Perfil) cuando está disponible.
- **`openDrawer()` refresca datos**: ahora llama `updateDrawerProfile()` antes de abrir el drawer, eliminando el bug del primer render donde drawer aparecía vacío.
- **Avatares Mi Perfil y Configuración uniformes**: ambos con `border:2px solid rgba(255,255,255,.6)` (mismo estilo que drawer) + `box-sizing:border-box` + `_avatarInner(18)`. Eliminados los artefactos visuales ("esquinitas") del border verde anterior.
- **Tarjeta Configuración con fallback**: nuevas variables `_cfgMeta/_cfgName/_cfgEmail` en `renderConfiguracion` que leen `S.profile` con fallback a `user_metadata.full_name`/`name` y `_currentUser.email`. Antes mostraba "Mi Perfil"/"Toca para completar" durante onboarding cuando S.profile estaba vacío.
- **Flash dashboard durante onboarding eliminado**: en `_completeOnboarding` (auth.js) se setea `S.currentPage='configuracion'` ANTES de `initApp()`, y `initApp()` se ejecuta ANTES de `hideAuthScreen()`. La auth screen (z-index:9999) cubre #app mientras initApp pinta configuración. Cuando se oculta, configuración ya está 100% lista. `app.js:28` cambiado a `navigate(S.currentPage||'dashboard')` (eliminada exclusión histórica de configuración).
- **Header configuración en onboarding**: `_completeOnboarding` llama `_updateHeader('configuracion')` después de `renderPage` para asegurar header correcto al primer render.

**Decisiones de Jorge:**
- Los 4 avatares deben verse idénticos: mismo gradiente `#00D4AA→#7461EF`, misma cascada foto/iniciales/SVG persona.
- Border blanco semitransparente (estilo drawer) para Mi Perfil y Configuración, no verde.
- **Nueva regla de flujo de trabajo**: después de cada fix verificado, Claude Code debe **preguntar a Jorge si hacer commit y push a GitHub** antes de continuar. Sin push los cambios no llegan a Vercel/finanzia.xenda.co y Jorge no puede probar en su OPPO. Guardado en memoria como feedback permanente.

**Pendiente:**
- Sprint C: Dashboard, Movimientos, Deudas, Herramientas — esperando diseño Claude Design.
- Web Push + Service Worker completo — etapa monetización SaaS.
- i18n completo, Emiliano IA real, Monetización SaaS.

---

### Sesión 6 — 2026-04-30 (cierre del día)
**Archivos modificados:** `ui.js`, `storage.js`, `index.html`

**Qué se hizo:**
- **Dashboard rediseñado**: FX card (`fx-dash-*`) con selector de moneda integrado, balance card con 3 stats (ingresos/gastos/ahorro), KPIs grid `repeat(4,1fr)`, currency-toggle oculto del header (solo en FX card).
- **Widget "Mi día" con acordeón**: Pills Tareas/Hábitos/Propósitos — toque expande el pill activo con `flex:2`, contenido dentro del pill. `_toggleMiDiaPill()` global.
- **Campanilla y avatar en dashboard**: `header-bell` (badge rojo si alertas) + `header-avatar` (foto o iniciales con fallback SVG persona), solo visibles en dashboard.
- **Avatar unificado**: `_renderAvatarHtml(size)` helper centralizado. Fallback: foto → iniciales → ícono SVG de persona. `font-weight:800` en los tres contextos. Drawer y header usan `user_metadata.full_name` cuando `S.profile.name` está vacío.
- **Módulo Tareas**: `renderTareas()` 3 tabs (Hoy/Próximas/Completadas), progress box, grupos Eisenhower, FAB → `navigate('plantillas')`. CRUD: `saveTask()`, `deleteTask()`, `toggleTask()`.
- **Módulo Objetivos**: `renderObjetivos()` 3 tabs (Todos/Propósitos/Hábitos), cards con barra de progreso coloreada. `saveObjective()`, `deleteObjective()`, `logProgress()`, `logHabit()`. BS detalle via `_showHtmlBS()`.
- **Módulo Plantillas**: `renderPlantillas()` 78 plantillas en 9 grupos, buscador, forms BS para tarea/hábito via `_showHtmlBS()`. `_showCustomTaskBS()`.
- **`_showHtmlBS(title, html, zIdx)`**: helper BS con `#bs-overlay` — cierra con `closeBottomSheet()`. Reemplaza overlays propios.
- **Centro de Ayuda**: `renderAyuda()` 48 FAQ en 7 grupos, acordeón, buscador. `openAyudaOverlay()` como overlay z-index:10002 (funciona desde auth screen). Título centrado en header vía `_updateHeader('ayuda')`.
- **`openContactSheet()`**: sin subtítulos, logo Telegram oficial, `rowLast()` + Centro de Ayuda. `z-index:10002`. No cierra BS si está en pantalla de auth.
- **Síguenos**: logos SVG oficiales de todas las redes. `justify-content:center` corregido.
- **Notificaciones fix**: `masterOn` usa `===true` (no `!==false`). Toggles individuales guardan `true`/`false` explícito. `_toggleNotifMaster` consistente.
- **`resetApp()` mejorado**: preserva `name`/`email`/`photo`. `_keepName` lee en cascada: `S.profile.name` → `user_metadata.full_name` → `localStorage`. Incluye `tasks:[]` y `objectives:[]`.
- **`_getProfilePhoto()`** (storage.js): chequea `photo`, `photoURL`, `avatar`, `profilePic`.

**Decisiones de Jorge:**
- Fallback de avatar: ícono SVG de persona (no `?`).
- Dashboard es el único lugar donde aparecen campanilla y avatar.
- Centro de Ayuda siempre se abre como overlay (no como página normal) para funcionar desde auth.

**Pendiente:**
- Sprint C: Dashboard, Movimientos, Deudas, Herramientas — esperando diseño Claude Design.
- Web Push + Service Worker completo — etapa monetización SaaS.
- i18n completo, Emiliano IA real, Monetización SaaS.

---

### Sesión 5 — 2026-04-28 (cierre del día)
**Archivos modificados:** `ui.js`, `app.js`, `sw.js` (nuevo)

**Qué se hizo:**
- **4 funciones de notificaciones reales en `ui.js`**: `checkBudgetNotifs()` (anti-spam mensual por presupuesto, alerta 80% y 100%), `checkGoalNotifs()` (hitos 25/50/75/100%, anti-spam permanente por hito), `checkWeeklyNotif()` (solo lunes, anti-spam ISO week, ingresos/gastos últimos 7 días en moneda activa), `checkTipsNotif()` (20 tips + 20 frases motivacionales, alternancia par=frases/impar=tips, shuffle aleatorio, intervalo diario).
- **`sendNotif()` actualizado**: usa `registration.showNotification()` con fallback `new Notification()`; icono real `/icon-192.png` en lugar de SVG inline.
- **`sw.js` (nuevo)**: Service Worker mínimo — `install`/`activate` inmediato + `notificationclick` enfoca ventana existente o abre `/`. Habilita notificaciones reales en Android Chrome y PWA instalada.
- **`app.js`**: registro de `/sw.js` como primera instrucción de `initApp()` + 4 llamadas a las nuevas funciones después de `checkAutoPayments()`.
- **`_toggleNotifMaster()` fix**: bloque `else` (activar) ahora llama `requestNotifPerm()` — muestra popup del sistema Android en lugar de activar silenciosamente.
- Botones de prueba temporales (`_testNotifs`, `_clearNotifSpam`) creados y eliminados en la misma sesión.

**Decisiones de Jorge:**
- Sistema de notificaciones completo aprobado y verificado en OPPO Find X9.
- Tips/frases con alternancia diaria aprobada.
- Intervalo tips: 3 días → 1 día (más engagement).

**Pendiente:**
- Web Push + Service Worker completo (notificaciones con app cerrada) — etapa de monetización SaaS.
- Sprint C: Dashboard, Movimientos, Deudas, Herramientas — esperando diseño Claude Design.

---

### Sesión 4 — 2026-04-28 (cierre del día)
**Archivos modificados:** `ui.js`, `styles.css`, `index.html`

**Qué se hizo:**
- **Configuración — redistribución**: eliminado `secLbl('Perfil')` → reintroducido con parámetro `first` (`margin:2px 0 10px` vs `22px 0 8px` en secciones siguientes); padding wrapper `0→16px` top para alinear con Mi Perfil.
- **Tarjeta de perfil en Configuración rediseñada**: avatar 46→52px, borde `rgba(0,212,170,.2)`, nombre 15px, email 11px text3, badge pill verde "Revisar mi perfil" con ícono ojo, `margin-bottom 18→4px`.
- **Datos Generales (`openProfilePage`)**: header reemplazado por estilo `_pickerHdr` — back ← | "Datos generales" centrado | spacer 34px; curva ajustada a `height:26px; border-radius:24px 24px 0 0; margin-top:-13px; padding-bottom:24px`; `sLbl` margin `18px→14px 0 10px` para primera sección.
- **Hub de Contacto (`openContactSheet`)**: nuevo BS overlay `z-index:9998` con 3 opciones (Correo → mailto, Telegram → t.me/xenda_soporte_bot, Formulario → openSoporteModal). Flecha back corregida a `points="15 18 9 12 15 6"`.
- **Drawer Soporte**: `openSoporteModal()→openContactSheet()` en `index.html:461`. Las llamadas en `auth-welcome` y `openTerminosModal` se mantienen.
- **CSS formulario soporte**: `#soporte-modal .form-input/.bs-trigger/textarea` usan `background:var(--surface)` (override del `.modal-body` que usaba `surface2`).
- **Tracks de capsule selector** (Tema + Formato moneda): `background:var(--surface2)→var(--surface); border:1px→1.5px`.
- **Nav flotante**: `.bottom-nav background:transparent→var(--surface)` (coincide con páginas, hace invisible el contenedor); `.nav-card box-shadow:0 6px 24px .12 → 0 8px 20px .10` (elimina halo superior); reglas permanentes añadidas como comentarios en `styles.css` encima de `.header` y `.bottom-nav`.

**Decisiones de Jorge:**
- Hub de Contacto aprobado. `openSoporteModal()` en flujos legales/auth no cambia.
- Label "PERFIL" encima de la tarjeta: reintroducido con espaciado compacto.
- Nav: `var(--surface)` es el valor final — coincide con fondo de la mayoría de páginas (efecto floating card = Revolut).
- Reglas permanentes de no-tocar documentadas en `styles.css`.

**Pendiente:**
- Sprint C: Dashboard, Movimientos, Deudas, Herramientas — esperando diseño Claude Design.
---

### Sesión 3 — 2026-04-27 (cierre del día)
**Archivos modificados:** `ui.js`

**Qué se hizo:**
- **Audit completo módulo Notificaciones**: identificado que `sendNotif()` ignoraba completamente `S.notifPrefs._master` y los toggles individuales — la UI era decorativa, no afectaba el envío real.
- **Fix `sendNotif(title, body, prefKey)`**: 4 guards en cascada — Notification disponible → permission granted → `_master !== false` → `prefKey` individual habilitado. Backward-compatible: si `prefKey` es undefined, solo aplica master guard.
- **`checkAutoPayments()`**: ambas llamadas a `sendNotif` ahora pasan `'notifPayments'` como tercer argumento.
- **Fix `notifStatus` en Configuración**: el subtítulo del botón Notificaciones reflejaba solo `Notification.permission`, ignorando `_master`. Nueva lógica: si `permission==='granted' && _master===false` → muestra `t('notifDenied')` ("Desactivadas"). Consistente con el banner del overlay.
- **Configuración header compacto**: nuevo branch `else if(page==='configuracion')` en `_updateHeader()` — título en `hTitle` (header-row1) como Mi Perfil; subtítulo "Todo lo que necesitas..." eliminado (era la única página con subtítulo, inconsistente).
- **Fix centrado del título Configuración**: `hSpacer` (34px, ya existente en index.html) ahora visible en este branch para balancear el botón back de la izquierda y centrar visualmente el texto.
- **Banner Notificaciones — vuelto a informativo**: removido `onclick="_toggleNotifBanner()"` y `cursor:pointer`. La función `_toggleNotifBanner()` eliminada como dead code. El banner solo refleja estado (`active = granted && masterOn`); la acción de activar/desactivar queda exclusivamente en el master toggle.
- **Actualización en tiempo real Configuración ↔ Notificaciones**: `_toggleNotifMaster()` y `_toggleNotifItem()` reemplazaron su inline re-render por llamadas a `_refreshNotifOverlay()`, que ahora detecta `#page-configuracion.classList.contains('active')` y dispara `renderPage('configuracion')` — el subtítulo del botón se actualiza inmediatamente, sin necesidad de scroll/sync.
- **`confirmDialog` al desactivar master**: `_toggleNotifMaster()` muestra "¿Desactivar notificaciones? No recibirás alertas de FinanzIA." con botón danger antes de aplicar el cambio. Activar es directo (sin confirmación).
- **Primera activación enciende todos los individuales**: nuevo helper `_notifActivateAll()` con flag `_everActivated` en `S.notifPrefs`. La primera vez que el master se enciende, los 5 individuales (`notifPayments/Budget/Goal/Weekly/Tips`) se activan automáticamente. Las siguientes activaciones respetan el estado previo. Aplicado en `_toggleNotifMaster()` + ambas ramas de `requestNotifPerm()`.

**Decisiones de Jorge:**
- Banner solo informativo, no actuable. Master toggle es el único control de activación/desactivación.
- Comportamiento "Pattern B" (master como compuerta) elegido sobre "Pattern A" (master resetea todos): preserva preferencias del usuario al apagar/encender, con onboarding limpio en la primera activación.
- Subtítulo de Configuración eliminado por inconsistencia con resto de la app.
- **Re-cierre de módulos**: todos los módulos que se habilitaron para cambios en Sesiones 2 y 3 (Drawer, Configuración, Mi Perfil, Notificaciones, flujo Auth tema) vuelven a estado **CONGELADO — no tocar sin orden explícita de Jorge**. La lista completa en sección "⛔ MÓDULOS CONGELADOS" mantiene su vigencia.

**Pendiente:**
- Implementación real de envío para `notifBudget/notifGoal/notifWeekly/notifTips` — actualmente tienen toggle persistido pero no lógica de envío automatizada (solo `notifPayments` está conectado vía `checkAutoPayments`).
- Sprint C: Dashboard, Movimientos, Deudas, Herramientas — esperando diseño Claude Design.
- Tema oscuro completo en pantallas congeladas — esperando diseño Claude Design.
- i18n completo, Emiliano IA real, Monetización SaaS.

---

### Sesión 2 — 2026-04-26/27
**Archivos modificados:** `finance.js`, `ui.js`, `index.html`, `styles.css`

**Qué se hizo:**
- **Sprint A — Higiene de datos SaaS**: aplicado `filterDeleted()` en 22 lecturas directas de arrays en `ui.js` + 1 en `finance.js`; fix guard `_themeSet_{uid}` en `setThemeInline()` + inline script de `index.html` para tema claro por defecto; fix XSS en `handleFotoAcreedor` usando DOM API (`createElement/element.src`) en lugar de `innerHTML`.
- **Sprint B — Refactors `finance.js`**: helper `getTEM(annualRate)` eliminando 4 duplicados del cálculo TAE→TEM; helper `isInternalTransaction(t)` reemplazando lambdas locales en `getMonthTotals()`; variantes `getAccActive/getCatActive/getSubActive` con `filterDeleted` interno para nuevos pickers (originales intactos para historial).
- **Tema oscuro — variables CSS**: `[data-theme="dark"]` actualizado con diseño aprobado (`--bg:#0B0F1A`, `--surface:#131826`, `--surface2/#3`, bordes translúcidos, `--card-shadow` glassmorphism, `--danger:#FF5C5C`); nuevas variables `--grad-header` y `--border-strong` en ambos temas; clase `.header` usa `var(--grad-header)`.
- **Contraste dark mode (CSS-only, sin tocar módulos congelados)**: drawer nombre/email via override de clases; radio buttons género via `[id^="gcap-"]!important`; toggles inactivos Notificaciones via `[style*="#CBD5E1"]!important` + `outline`.
- **Fix drawer sin scroll**: `.drawer-nav overflow:hidden`; paddings reducidos (header 32→22→16px, labels 12→8px, items 10→8→7px, icons 36→28px, grid layout header con avatar al lado).
- **Fix drawer header layout**: CSS Grid en `.drawer-header` (sin tocar HTML congelado) — avatar 52→40px a la izquierda del nombre+email; `.drawer-progress-wrap` ocupa ancho completo abajo.
- **Fix Mi Perfil sin scroll**: `overflow:hidden` + `min-height:0` en `#page-mi-perfil`; `padding-bottom:0!important` y spacer safe-area `display:none` via attribute selectors.
- **Fix banner Notificaciones**: agregado `onclick="requestNotifPerm()"` + `cursor:pointer` al banner (faltaba). Luego convertido a toggle bidireccional: nueva `_toggleNotifBanner()` con 3 estados (sin permiso → pide; permiso+master off → activa; permiso+master on → confirmDialog desactivar); nueva `_refreshNotifOverlay()` para re-render inmediato; `_buildNotifContent()` usa `active = granted && masterOn` para reflejar estado real.

**Decisiones de Jorge:**
- Sprints A, B, C (parcial) aprobados y pusheados a `main`.
- Helpers originales `getCat/getSub/getAcc` se mantienen raw; variantes `*Active` son el estándar para código nuevo.
- CSS `!important` + attribute selectors aceptados como workaround para frozen modules en dark mode.
- Los 14 inline styles de header en ui.js (módulos congelados) se actualizan solo cuando llegue diseño aprobado de Claude Design.
- **Nueva regla bitácora**: una entrada por sesión numerada, solo cuando Jorge pide "actualiza la bitácora". No actualizar automáticamente.

**Pendiente:**
- Sprint C: Dashboard, Movimientos, Deudas, Herramientas — esperando diseño Claude Design.
- Tema oscuro completo en pantallas congeladas — esperando diseño Claude Design.
- i18n completo (`t(key)`, 15 idiomas).
- Emiliano IA — conectar con Anthropic API real.
- Monetización SaaS.

---

### Sesión 1 — 2026-04-25
**Archivos modificados:** `ui.js`, `auth.js`, `index.html`

**Qué se hizo:** OTP recuperación PIN como pantalla completa con keypad. Flujo categorías completo como pantallas (`openCategoryScreen/openSubcategoryScreen/openEditSubcategoryScreen`). Buscador íconos con `_ICON_MAP`. Validación duplicados con grupos sinónimos. `renderCatList` grupos en tarjeta única. Fix `rc-back-btn` disabled hasta `PASSWORD_RECOVERY`. Fix `_remPass` actualiza contraseña nueva. Correos transaccionales actualizados (3 templates).

**Decisiones de Jorge:** Módulos congelados definidos (8 módulos). Plan Claude Design aprobado. Tema oscuro → esperar diseño de Claude Design antes de implementar.

**Pendiente:** Fix default tema claro (guard `_themeSet_{uid}`). Tema oscuro. Movimientos, Deudas, Dashboard, Herramientas.

---

## El Proyecto
PWA de finanzas personales sin frameworks — SaaS real y funcionando.
- URL: https://finanzia.xenda.co
- Deploy: GitHub → Vercel (~60s autodeploy)
- localStorage key: `finanziaState3`
- Dispositivo de prueba: OPPO Find X9 (Android/Chrome) — monedas activas: COP y PLN

---

## Arquitectura actual (FLAT — archivos en la raíz del repo)

```
/
├── index.html            ← app shell + pantallas auth + drawer + nav inferior
├── styles.css
├── storage.js
├── finance.js
├── ui.js
├── app.js                ← initApp() + privacidad + auto-lock + DOMContentLoaded → initAuth()
├── auth.js               ← Supabase auth + WebAuthn + PIN + Onboarding 3 láminas
├── sw.js                 ← Service Worker: install/activate/notificationclick
├── manifest.json         ← scope:/ sin capture_links
├── emiliano-chat.png
├── emiliano-avatar.png
└── icon-192.png / icon-512.png / apple-touch-icon.png
```

### Edge Functions Supabase (desplegadas)
```
supabase/functions/delete-account/index.ts
supabase/functions/delete-account/deno.json  ← vacío {}
```
- JWT verification: **DESACTIVADO** en dashboard
- CORS: `corsHeaders` — `Content-Type` NO va en el fetch desde la app

### Orden de carga (CRÍTICO — no cambiar)
```html
<script src="storage.js"></script>
<script src="finance.js"></script>
<script src="ui.js"></script>
<script src="auth.js"></script>
<script src="app.js"></script>
```

---

## Supabase
```
URL:  https://dshwbvqvfbjtlbcqqviz.supabase.co
KEY:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaHdidnF2ZmJqdGxiY3Fxdml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTM1OTYsImV4cCI6MjA5MDg4OTU5Nn0.kjie4SHtxJZYkX1rspJK2JNpOWfbd-Xdx3UZfgqydXU
```
Hardcodeadas en `auth.js`. Siempre incluirlas en cada entrega de auth.js.

---

## ⛔ MÓDULOS CONGELADOS — NO TOCAR SIN ORDEN EXPLÍCITA DE JORGE

Los siguientes módulos están **completos, aprobados y verificados en dispositivo**. Ningún miembro del equipo los modifica bajo ninguna circunstancia sin autorización expresa de Jorge:

1. **Onboarding** — 3 láminas, flag `_finanzia_onboarded` en localStorage
2. **Bienvenida** — pantalla `auth-welcome`, flujo post-login
3. **Drawer completo** — íconos SVG, sin scroll, secciones, logout, modals (Síguenos, Soporte, Acerca de, Legal)
4. **Flujo completo de autenticación** — Login, Registro, Verificación correo, Recuperación contraseña, PIN, Huella, Recuperación PIN (OTP pantalla completa con keypad), pantalla reset-password
5. **Configuración** — página completa con todas sus secciones
6. **Mi Perfil + Formulario Datos Generales** — `openProfilePage()`, `buildProfileFormHTML()`, `saveProfile()`, foto de perfil con BS
7. **Idioma · Monedas activas · Flujo Categorías** — pickers, BS naturaleza, pantallas nueva/editar cat/subcat, validación duplicados, buscador íconos
8. **Tema · Formato Moneda · Notificaciones · Reiniciar app · Eliminar cuenta**

---

## Sistema SaaS — COMPLETO y ESTABLE ✅

### Gates y flags (NUNCA eliminar)
| Flag | Propósito |
|---|---|
| `window._supabaseSynced` | Bloquea saveState→Supabase hasta primer sync |
| `window._lastSupabaseSave` | Debounce 2s entre saves |
| `window._realtimeChannel` | Canal Realtime — guard duplicación |
| `S._resetAt` | Propaga "borrado total" entre dispositivos |
| `S._lastSync` | Fuente de verdad comparación local vs remoto |
| `_emailConfirmPending` | Bloquea redirección durante confirmación — sessionStorage |
| `_finanzia_onboarded` | localStorage global. Si no existe → onboarding 3 láminas |
| `S._langUserSet` | true cuando usuario elige idioma manualmente |
| `_themeSet_{uid}` | localStorage. Marca que usuario cambió tema manualmente |

### Helpers SaaS (REGLAS OBLIGATORIAS)
| Operación | Helper |
|---|---|
| Crear item nuevo | `stampItem({...})` |
| Editar item existente | `stampItem({...existing, ...changes})` |
| Eliminar item | `softDelete(arr, id)` — NUNCA `.filter()` |
| Leer para render/cálculo | `filterDeleted(arr)` — NUNCA `S.array` directo |

### Campos excluidos de Supabase sync
`currentPage`, `_catTab`, `movFilter`, `_lastSync`, `_fcData`, `_viewAccId`, `_cuentasGrupo`, `_navHistory`, `_testAnswers`, `theme`

---

## DISEÑO VISUAL — SISTEMA GLOBAL ✅ (2026-04-25)

### Header del app — REGLA MAESTRA
```css
background: linear-gradient(160deg, rgba(0,212,170,.10), rgba(116,97,239,.06))
```
- **En overlays/BS**: `background-color:var(--surface);background-image:linear-gradient(...)` — base sólida obligatoria
- **Curva blanca**: `background:var(--surface);height:20px;border-radius:20px 20px 0 0;margin-top:-14px;position:relative;z-index:1`
- **Espaciado header**: `padding:10px 12px 22px` + curva `margin-top:-14px`
- **Back button**: `width:34px;height:34px;border-radius:10px;border:0.5px solid rgba(0,212,170,.3);background:rgba(255,255,255,.7)`
- **Título**: centrado, `font-size:17px;font-weight:800;color:var(--text)`

### Drawer lateral ✅
- Header: `background-color:var(--surface);background-image:linear-gradient(160deg,rgba(0,212,170,.13),rgba(116,97,239,.08),#fff 80%)`
- `border-radius: 0 24px 24px 0` — Sin `border-top` sobre "Cerrar sesión" — Sin scroll — Íconos SVG

### Auth screens ✅
- Gradiente: `linear-gradient(160deg,rgba(0,212,170,.12) 0%,rgba(116,97,239,.06) 50%,#fff 70%)`
- OTP pantalla completa: fondo sólido `#F8FAFC` + overlay gradiente absoluto `z-index:0`, resto `z-index:1`
- Reset password: chips `pwc-rp1..4` igual que registro

### Flujo Categorías ✅ (2026-04-25)
- **Pantallas**: `openCategoryScreen(data)` / `openSubcategoryScreen(data)` / `openEditSubcategoryScreen(data)`
- `_catScreenClose()` — cierra overlay + refreshNatureSheet + renderCatList
- `_catIconPickerOpen(targetId)` — z-index:270, buscador con `_ICON_MAP {emoji:'keywords'}`
- `_checkCatDuplicate(name)` — GROUPS array sinónimos + Levenshtein dinámico por longitud
- `_catGetAutoColor(type)` — primer color no usado del tipo
- `_nsOpenCatScreen(fn)` — muestra pantalla z-index:260 encima del BS, cierra BS 200ms después
- `_nsNewCatDialog` / `_nsOpenNewSubDialog` — confirmDialog con `cancelLabel:'Revisar'`
- `renderCatList` + `_getNsCats` → usan `filterDeleted(S.categories)` — NUNCA `S.categories` directo
- `confirmDialog` acepta 7mo param `cancelLabel` — id `confirm-cancel` en index.html

### Monedas activas ✅ (2026-04-25)
4 capas fuera del scroll:
1. Header + buscador (fijo)
2. `id="picker-cur-selected"` — SELECCIONADAS (fijo)
3. `id="picker-all-lbl"` — label "TODAS LAS MONEDAS" (fijo)
4. `id="picker-list"` — lista scrolleable

### Bottom Sheets con gradiente ✅
Helper `_showGradBS(title, items, sel, onSelect, allowDesel, zIdx)`:
- **CRÍTICO**: backdrop `rgba(0,0,0,.5)` en el **overlay raíz** (`style.cssText`), NO en div hijo
- Wrapper contenido: `border-radius:20px 20px 0 0;overflow:hidden`
- BS sobre modal → pasar `zIdx` mayor al padre

---

## z-index hierarchy (CRÍTICO)
```
bottom-nav:              50
ai-input-bar:            51
drawer:                  200
overlays (cat, notif):   200
cat-screen-overlay:      250 (260 cuando abre desde BS via _nsOpenCatScreen)
cat-icon-picker:         270
picker-screen:           310
#auth-screen:            9999
BS estándar:             9999
pin-modal-overlay:       10000
pin-recovery-overlay:    10001
modales sobre auth:      10002
BS sobre modal:          10003
```

---

## Flujo Auth — Estado final ✅ (2026-04-25)

### Recuperación contraseña
- Banner `auth-rc-ok`: solo mensaje de éxito — sin botón interno
- `#rc-back-btn` (footer) empieza `disabled` + gris — igual que `verify-continue-btn`
- Se activa cuando `onAuthStateChange` dispara `PASSWORD_RECOVERY`
- `handleResetPassword()` guarda nueva contraseña en `_remPass` antes del signOut

### OTP Recuperación PIN
- Pantalla completa, fondo sólido `#F8FAFC`
- `_prKey(k)` — maneja keypad, navega boxes, auto-verifica al completar
- `_highlightPrInput(idx)` — resalta box activo
- `window._prInputIdx` — índice activo actual

### onAuthStateChange — REGLA CRÍTICA
SIEMPRE dentro de `initSupabase()`, inmediatamente después de `createClient()`.

---

## Correos transaccionales Supabase ✅ (2026-04-25)

| Template | Asunto | Variable CTA |
|---|---|---|
| Confirmación cuenta | `¡Ya casi! Confirma tu cuenta en FinanzIA 🎯` | `{{ .ConfirmationURL }}` |
| OTP recuperación PIN | `🔐 Tranqui, aquí está tu código de FinanzIA` | `{{ .Token }}` |
| Reset contraseña | `😅 Tranqui, aquí está el enlace para tu nueva contraseña` | `{{ .ConfirmationURL }}` |

---

## ✅ TEMA — IMPLEMENTADO (Sesión 2, 2026-04-26/27)

### Tema claro por defecto ✅
- La app **SIEMPRE** arranca en tema claro sin importar `prefers-color-scheme` del OS.
- Guard `_themeSet_{uid}` en localStorage marca cuando el usuario cambió tema manualmente.
- Implementado en `setThemeInline()` (ui.js) + inline script de `index.html` (verifica el guard antes de aplicar tema, fallback `light`).

### Tema oscuro — variables aprobadas ✅
- Paleta del diseño aprobado por Jorge aplicada en `[data-theme="dark"]`:
  `--bg:#0B0F1A`, `--surface:#131826`, `--surface2:#1B2233`, `--surface3:#232C42`, bordes translúcidos `rgba(255,255,255,0.06/0.10)`, textos `#F1F5F9/#B8C2D3/#7A879B`, `--danger:#FF5C5C`, `--card-shadow` glassmorphism, `--grad-header` opacidades `.22/.18`.
- Variables `--grad-header` y `--border-strong` también añadidas a `[data-theme="light"]` para paridad.
- `.header` usa `var(--grad-header)` — cambia automáticamente con el tema.

### Detalles pendientes en pantallas congeladas
- Los **14 inline styles** de headers en `ui.js` (módulos congelados) aún tienen el gradiente light hardcoded. Se actualizan **screen by screen cuando llegue diseño aprobado de Claude Design** para cada pantalla, no en bulk.
- Workarounds CSS aplicados para 3 contrastes específicos (drawer nombre/email, radio género, toggles inactivos Notificaciones) — el resto de elementos hardcoded en módulos congelados se atienden con cada encargo de Claude Design.

---

## 🎨 PLAN CLAUDE DESIGN — ROL DISEÑADOR DEL EQUIPO

### Flujo de trabajo con Claude Design (optimizado — sin iteraciones)
Claude Design consume muchos tokens. Cada encargo debe ser cerrado y preciso — salir bien al primer intento.

1. **Claude (asesor) prepara el prompt** — sistema de diseño completo + pantallas exactas a diseñar
2. **Jorge envía a Claude Design** una sola vez, adjuntando `styles.css` + capturas de referencia
3. **Jorge aprueba o rechaza** el resultado completo
4. Si ≥90% bueno → Jorge trae el diseño a Claude Code para implementar
5. Si no sirve → revisar prompt con Claude (asesor) antes de reintentar

### Encargos pendientes para Claude Design (en orden)
1. **Dashboard** — diseño completo (claro + oscuro)
2. **Movimientos** — diseño completo (claro + oscuro)
3. **Deudas** — diseño completo (claro + oscuro)
4. **Herramientas** — mejoras visuales (claro + oscuro)
5. **Detalles oscuros pantalla por pantalla** — según necesidad: cada pantalla congelada (Configuración, Mi Perfil, Categorías, Notificaciones, Cuentas, Inversiones, Simuladores, Test Salud, Suscripciones, Presupuestos, Metas, Pagos) puede tener detalles hardcoded que requieren ajuste cuando se detecten en testing.

> **Nota**: el sistema base de tema oscuro (variables CSS) ya fue implementado en Sesión 2. Los nuevos encargos de Claude Design deben entregar diseños claro **y** oscuro en simultáneo.

---

## Módulos pendientes (código)
- ✅ ~~Fix tema claro por defecto — guard `_themeSet_{uid}`~~ (resuelto Sesión 2)
- ✅ ~~Tema oscuro — variables CSS base~~ (resuelto Sesión 2)
- 🔄 Movimientos — esperar diseño Claude Design
- 🔄 Deudas — esperar diseño Claude Design
- 🔄 Dashboard — esperar diseño Claude Design
- 🔄 Herramientas — esperar diseño Claude Design
- 🔄 Detalles oscuros en pantallas congeladas — fixes puntuales según testing
- ✅ ~~Notificaciones locales: checkBudgetNotifs, checkGoalNotifs, checkWeeklyNotif, checkTipsNotif~~ (resuelto Sesión 5)
- ✅ ~~Módulo Tareas: renderTareas, saveTask, deleteTask, toggleTask~~ (resuelto Sesión 6)
- ✅ ~~Módulo Objetivos: renderObjetivos, saveObjective, deleteObjective, logProgress, logHabit~~ (resuelto Sesión 6)
- ✅ ~~Módulo Plantillas: renderPlantillas, 78 plantillas, 9 grupos, buscador~~ (resuelto Sesión 6)
- ✅ ~~Centro de Ayuda: renderAyuda, openAyudaOverlay, 48 FAQ~~ (resuelto Sesión 6)
- 🔄 Web Push + Service Worker completo (notificaciones con app cerrada) — etapa monetización SaaS
- 🔄 i18n completo — `t(key)`, 15 idiomas, sesión dedicada post-módulos
- 🔄 Emiliano IA — conectar con Anthropic API real
- 🔄 Monetización SaaS

---

## Diseño — Sistema de variables
| Variable | Oscuro | Claro |
|---|---|---|
| `--bg` | `#0A0F1E` | `#F8FAFC` |
| `--surface` | `#111827` | `#FFFFFF` |
| `--surface2` | `#1A2235` | `#F1F5F9` |
| `--primary` | `#00D4AA` | igual |
| `--secondary` | `#7461EF` | igual |
| `--danger` | `#EF4444` | igual |
| `--nav-h` | `82px` | igual |
| `--header-h` | `60px` | igual |

---

## Bugs críticos resueltos — NO repetir

1–43. (ver historial previo)
44. Gradiente transparente en BS → `background-color:var(--surface);background-image:linear-gradient(...)`
45. Línea recta en BS → gradiente directo con `border-radius:20px 20px 0 0` sin wrapper padre
46. BS detrás de modal → pasar `zIdx` como 6to param
47. Onboarding transparente → fondo sólido `var(--bg,#F8FAFC)` + gradiente overlay encima
48. Esquinas BS → backdrop en overlay raíz, NO en div hijo
49. Naturaleza oscura en cat → `_catSelectNat` `var(--surface2)` → `var(--surface)`
50. Cat sin subs no mostraba flecha → siempre renderizar arrow
51. Eliminar cat no funcionaba → `renderCatList`/`_getNsCats` sin `filterDeleted`
52. Buscador íconos → `ic.includes(q)` no funciona en emoji → `_ICON_MAP[ic].includes(q)`
53. Banner validación → Levenshtein umbral fijo → GROUPS + umbral dinámico por longitud
54. Contador categorías en Configuración → `filterDeleted(S.categories).length`
55. OTP transparente → fondo sólido `#F8FAFC` + gradiente `position:absolute;z-index:0`
56. `_remPass` contraseña antigua en login → `handleResetPassword` actualiza antes del signOut
57. Botón "Volver al inicio" bypass reset → `rc-back-btn` disabled hasta `PASSWORD_RECOVERY`

---

## Reglas de Código — CRÍTICAS

1. NUNCA nested backticks en HTML dinámico
2. `node --check` siempre antes de entregar JS
3. Buscar duplicados antes de entregar
4. Todo JS en scope global — no ES modules
5. NUNCA función en la misma línea que `//`
6. Al crear/editar: `stampItem(item)` — NUNCA push directo
7. Al eliminar: `softDelete(arr, id)` — NUNCA `.filter()`
8. Al renderizar: `filterDeleted(arr)` — NUNCA `S.array` directo
9. `onAuthStateChange` SIEMPRE dentro de `initSupabase()`
10. No usar `exchangeCodeForSession()`
11. `S._langUserSet = true` al cambiar idioma manualmente
12. Verificar en qué función exactamente está el string a reemplazar
13. Modal sobre auth-screen → z-index ≥ 10002
14. NO usar `javascript:fn()` en href en PWA
15. `capture="user"` en input cámara — NO quitar
16. Foto siempre via `_getProfilePhoto()` / `_profilePhoto_{uid}`
17. `theme` NUNCA se sincroniza a Supabase
18. Overlay dinámico: `position:fixed;inset:0;z-index:NNN` + `document.body.appendChild(ov)`
19. Auto-focus en inputs de overlays móviles → NO usar
20. Gradientes BS/modals → `background-color` + `background-image` por separado
21. Backdrop BS → en overlay raíz (`style.cssText`), nunca en div hijo
22. Pantallas cat desde BS → `_nsOpenCatScreen(fn)` — z-index:260, cierra BS 200ms después
23. `confirmDialog` 7mo param `cancelLabel` → actualiza `#confirm-cancel`

---

## Flujo de trabajo por sesión (Claude Code)

1. **Leer este CLAUDE.md completo** — especialmente la Bitácora de sesiones
2. Leer los archivos del proyecto relevantes antes de cualquier cambio
3. Cambios mínimos y quirúrgicos — solo archivos necesarios
4. Nunca tocar módulos congelados sin autorización de Jorge
5. `node --check` + verificar duplicados antes de entregar
6. **Al finalizar (solo cuando Jorge lo pide con la frase de trigger):**
   - Actualizar la Bitácora de sesiones en CLAUDE.md
   - Subir todos los archivos modificados a sus ubicaciones en el repo
   - Reportar a Jorge con este formato exacto:

   📁 Archivos modificados:
   - archivo.js — descripción de qué cambió
   - styles.css — descripción de qué cambió

   📝 CLAUDE.md actualizado — lo más relevante:
   ✅ [sección] — qué se actualizó
   ✅ [sección] — qué se actualizó
   (máximo 5 puntos, solo cambios que afectan estado del proyecto)
