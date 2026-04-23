/* ══════════════════════════════════════════
   BancoCajero — Grupo 4 | script.js
   ══════════════════════════════════════════ */

/* ═══════════════ BASE DE USUARIOS ═══════════════ */
const BASE_USUARIOS = {
  "47382910": { cedula:"47382910", nombre:"JUAN PÉREZ",    pin:"7731", saldo:2200000, tipo:"Ahorro",    recibosPendientes:["Agua","Luz","Gas","Internet"] },
  "12345678": { cedula:"12345678", nombre:"MARIA JOSE",    pin:"1234", saldo:1500000, tipo:"Ahorro",    recibosPendientes:["Agua","Gas"] },
  "91011121": { cedula:"91011121", nombre:"JOSE ANDRES",   pin:"5678", saldo:500000,  tipo:"Ahorro",    recibosPendientes:["Luz","Internet"] },
  "31415161": { cedula:"31415161", nombre:"LUISA FERNANDA",pin:"9101", saldo:3000000, tipo:"Ahorro",    recibosPendientes:["Internet","Gas"] }
};

const TARJETAS_VALIDAS = {
  "4738291000119922":"47382910",
  "1234567890123456":"12345678",
  "9876543210987654":"91011121",
  "1111222233334444":"31415161"
};

const ICONOS = {
  Agua:    `<svg viewBox="0 0 24 24"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/></svg>`,
  Luz:     `<svg viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/></svg>`,
  Gas:     `<svg viewBox="0 0 24 24"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`,
  Internet:`<svg viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>`
};

/* ═══════════════ ESTADO ═══════════════ */
let cedulaIng = "", pinIng = "";
let usuarioPorCedula = null, usuarioActual = null;
let saldo = 0, tipo = "Ahorro", monto = 0, don = "N";
let claveActual = "", claveNueva = "";
let servicioSel = "", tipoPago = "completo";
let tipoCajero = "", tarjetaIng = "";
let contextoPostRecibo = "menu";
let countdownTimer = null;
let retCuenta = "Ahorro";
let intentosFallidos = 0;

/* ═══════════════ PASOS ═══════════════ */
const STEP_INFO = {
  step0:               { p:1, l:"Tipo de acceso" },
  stepTarjeta:         { p:1, l:"Insertar tarjeta" },
  step1cedula:         { p:2, l:"Cédula" },
  step1pin:            { p:2, l:"PIN de seguridad" },
  step2:               { p:3, l:"Usuario validado" },
  stepMenu:            { p:4, l:"Menú principal" },
  stepConsultar:       { p:4, l:"Consulta de saldo" },
  stepPagarSeleccionar:{ p:4, l:"Seleccionar recibo" },
  stepPagarForm:       { p:4, l:"Pago de servicio" },
  stepDepositar:       { p:4, l:"Depósito" },
  stepClave:           { p:4, l:"Cambio de clave" },
  step3:               { p:5, l:"Retiro de efectivo" },
  step4:               { p:6, l:"Retiro exitoso" },
  step5:               { p:6, l:"Comprobante" },
  stepDespedida:       { p:6, l:"Sesión finalizada" }
};
const PASOS = Object.keys(STEP_INFO);

/* ═══════════════ UTILIDADES ═══════════════ */
const fmtCOP = v => new Intl.NumberFormat("es-CO", {
  style:"currency", currency:"COP", maximumFractionDigits:0
}).format(v);

function scr(lbl, txt, cls = "") {
  document.getElementById("screenLabel").textContent = lbl;
  const e = document.getElementById("screenText");
  e.textContent = txt;
  e.className = "screen-text" + (cls ? " " + cls : "");
}

function showStep(id) {
  PASOS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.remove("active");
  });
  const t = document.getElementById(id);
  if (t) t.classList.add("active");
  const i = STEP_INFO[id] || { p:1, l:"" };
  document.getElementById("stepLabel").textContent = i.l;
  for (let n = 1; n <= 6; n++) {
    const d = document.getElementById("pd" + n);
    if (d) d.className = "step-dot" + (n < i.p ? " done" : n === i.p ? " current" : "");
  }
}

/* ─── Fecha/hora en el header ─── */
function actualizarDateTime() {
  const el = document.getElementById("bgDateTime");
  if (!el) return;
  const now = new Date();
  const fecha = now.toLocaleDateString("es-CO", { day:"2-digit", month:"2-digit", year:"numeric" });
  const hora  = now.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" });
  el.innerHTML = `📅 ${fecha} &nbsp;|&nbsp; 🕐 ${hora}`;
}
actualizarDateTime();
setInterval(actualizarDateTime, 30000);

/* ═══════════════ TIPO CAJERO ═══════════════ */
function seleccionarTipoCajero(t) {
  tipoCajero = t;
  if (t === "sinTarjeta") {
    cedulaIng = ""; updDotsCed();
    document.getElementById("cedulaError").textContent = "";
    scr("Cédula", "Ingrese su cédula de 8 dígitos.");
    showStep("step1cedula");
  } else {
    document.getElementById("tarjetaNumero").value = "";
    document.getElementById("tarjetaError").textContent = "";
    tarjetaIng = "";
    scr("Con Tarjeta", "Inserte su tarjeta y luego ingrese su PIN.");
    showStep("stepTarjeta");
  }
}

function formatTarjeta(inp) {
  let v = inp.value.replace(/\D/g, "").slice(0, 16);
  inp.value = v.replace(/(.{4})/g, "$1 ").trim();
  tarjetaIng = v;
  document.getElementById("tarjetaError").textContent = "";
}

function confirmarTarjeta() {
  const err = document.getElementById("tarjetaError");
  if (tarjetaIng.length !== 16) { err.textContent = "Ingrese los 16 dígitos de su tarjeta."; return; }
  const ced = TARJETAS_VALIDAS[tarjetaIng];
  if (!ced || !BASE_USUARIOS[ced]) { err.textContent = "Tarjeta no reconocida."; return; }
  err.textContent = "";
  usuarioPorCedula = BASE_USUARIOS[ced];
  scr("Tarjeta válida", "Tarjeta validada. Ingrese su PIN de seguridad.", "success");
  setTimeout(() => {
    pinIng = ""; intentosFallidos = 0; updDotsPin(); updIntentosDots();
    document.getElementById("pinError").textContent = "";
    document.getElementById("loginHelpPin").textContent = "Ingrese su PIN de 4 dígitos para acceder a nuestros servicios";
    document.getElementById("btnVolverDesdePin").textContent = "← Cambiar tipo de acceso";
    scr("PIN de seguridad", "Ingrese su PIN de 4 dígitos.");
    showStep("step1pin");
  }, 700);
}

function volverTipoCajero() {
  tipoCajero = ""; tarjetaIng = ""; usuarioPorCedula = null; cedulaIng = ""; pinIng = ""; intentosFallidos = 0;
  scr("Bienvenido", "Seleccione cómo desea acceder al cajero.");
  showStep("step0");
}

/* ═══════════════ CÉDULA ═══════════════ */
function npC(d) {
  if (cedulaIng.length < 8) {
    cedulaIng += d;
    document.getElementById("cedulaError").textContent = "";
    updDotsCed();
  }
}
function ndC() {
  if (cedulaIng.length > 0) {
    cedulaIng = cedulaIng.slice(0, -1);
    document.getElementById("cedulaError").textContent = "";
    updDotsCed();
  }
}
function updDotsCed() {
  for (let i = 0; i < 8; i++)
    document.getElementById("dc" + i).className = "dot" + (i < cedulaIng.length ? " filled" : "");
}
function flashErrCed() {
  for (let i = 0; i < 8; i++) document.getElementById("dc" + i).className = "dot error-flash";
  setTimeout(updDotsCed, 600);
}
function confirmarCedula() {
  if (cedulaIng.length < 8) { document.getElementById("cedulaError").textContent = "Ingrese los 8 dígitos completos."; return; }
  const u = BASE_USUARIOS[cedulaIng];
  if (!u) {
    document.getElementById("cedulaError").textContent = "Cédula no registrada en el sistema.";
    scr("No encontrado", "La cédula ingresada no existe.", "error");
    flashErrCed(); cedulaIng = ""; return;
  }
  usuarioPorCedula = u; pinIng = ""; intentosFallidos = 0; updDotsPin(); updIntentosDots();
  document.getElementById("pinError").textContent = "";
  document.getElementById("loginHelpPin").textContent = "Ingrese su PIN de 4 dígitos para acceder a nuestros servicios";
  document.getElementById("btnVolverDesdePin").textContent = "← Volver a cédula";
  scr("PIN de seguridad", "Ingrese su PIN de 4 dígitos.");
  showStep("step1pin");
}

/* ═══════════════ PIN ═══════════════ */
function npP(d) {
  if (pinIng.length < 4) {
    pinIng += d;
    document.getElementById("pinError").textContent = "";
    updDotsPin();
  }
}
function ndP() {
  if (pinIng.length > 0) {
    pinIng = pinIng.slice(0, -1);
    document.getElementById("pinError").textContent = "";
    updDotsPin();
  }
}
function updDotsPin() {
  for (let i = 0; i < 4; i++)
    document.getElementById("dp" + i).className = "dot" + (i < pinIng.length ? " filled" : "");
}
function flashErrPin() {
  for (let i = 0; i < 4; i++) document.getElementById("dp" + i).className = "dot error-flash";
  setTimeout(updDotsPin, 600);
}
function updIntentosDots() {
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById("id" + i);
    if (el) el.className = "i-dot" + (i < intentosFallidos ? " used" : "");
  }
}
function confirmarPin() {
  if (pinIng.length < 4) { document.getElementById("pinError").textContent = "Ingrese los 4 dígitos del PIN."; return; }
  if (!usuarioPorCedula || usuarioPorCedula.pin !== pinIng) {
    intentosFallidos++;
    updIntentosDots();
    if (intentosFallidos >= 3) {
      document.getElementById("pinError").textContent = "Tarjeta bloqueada por 3 intentos fallidos.";
      scr("Tarjeta bloqueada", "Se han agotado los intentos. Contacte al banco.", "error");
      flashErrPin(); pinIng = "";
      setTimeout(reiniciar, 3000);
      return;
    }
    document.getElementById("pinError").textContent = `PIN incorrecto. Intentos restantes: ${3 - intentosFallidos}.`;
    scr("PIN incorrecto", "El PIN ingresado no coincide.", "error");
    flashErrPin(); pinIng = ""; return;
  }
  const metodo = tipoCajero === "conTarjeta" ? "Tarjeta + PIN" : "Cédula + PIN";
  cargarUsuario(usuarioPorCedula, metodo);
}
function volverDesdePIN() {
  pinIng = ""; updDotsPin(); document.getElementById("pinError").textContent = "";
  if (tipoCajero === "sinTarjeta") {
    scr("Cédula", "Ingrese su cédula de 8 dígitos.");
    showStep("step1cedula");
  } else {
    volverTipoCajero();
  }
}

/* ═══════════════ CARGAR USUARIO ═══════════════ */
function esFemenino(nombre) {
  const n = nombre.toUpperCase().split(" ")[0];
  const fem = ["MARIA","LUISA","ANDREA","LAURA","CAROLINA","ANA","SOFIA","PAULA","DIANA","VALENTINA","ALEJANDRA","SARA","ISABEL","CLAUDIA","PATRICIA","ROSA","MONICA","NATALIA"];
  return fem.includes(n) || n.endsWith("A") || n.endsWith("NA") || n.endsWith("LA");
}
function cargarUsuario(u, metodo) {
  usuarioActual = { ...u, recibosPendientes: [...(u.recibosPendientes || [])] };
  saldo = u.saldo; tipo = u.tipo;
  document.getElementById("usuarioNombreDisplay").textContent = u.nombre;
  document.getElementById("usuarioCedulaDisplay").textContent = u.cedula;
  const primerNombre = u.nombre.split(" ")[0];
  const saludo = esFemenino(u.nombre) ? `¡Bienvenida, ${primerNombre}!` : `¡Bienvenido, ${primerNombre}!`;
  document.getElementById("btnBienvenida").textContent = saludo;
  scr("Ingreso exitoso", "Bienvenido/a, " + u.nombre + ".", "success");
  setTimeout(() => { scr("Usuario validado", "Identidad verificada correctamente."); showStep("step2"); }, 700);
}

/* ═══════════════ RECIBOS ═══════════════ */
function marcarPagado(srv) {
  if (!usuarioActual) return;
  usuarioActual.recibosPendientes = (usuarioActual.recibosPendientes || []).filter(r => r !== srv);
  if (BASE_USUARIOS[usuarioActual.cedula])
    BASE_USUARIOS[usuarioActual.cedula].recibosPendientes = [...usuarioActual.recibosPendientes];
}

function confirmSaldo() {
  if (!usuarioActual) { document.getElementById("saldoError").textContent = "Primero debe iniciar sesión."; return; }
  scr("Menú principal", "Seleccione una operación.");
  showStep("stepMenu");
}

/* ═══════════════ MENÚ ═══════════════ */
function irOpcion(op) {
  if (op === "retirar") {
    resetRetiro();
    document.getElementById("saldoDisplay").textContent = fmtCOP(saldo);
    scr("Retiro de efectivo", "Seleccione tipo de cuenta y monto.");
    showStep("step3");
  } else if (op === "consultar") {
    document.getElementById("saldoConsultaDisplay").textContent = fmtCOP(saldo);
    document.getElementById("tipoDisplay").textContent = tipo;
    scr("Consulta de saldo", "Saldo disponible en su cuenta.");
    showStep("stepConsultar");
  } else if (op === "pagar") {
    renderRecibos();
    scr("Pago de servicios", "Seleccione el recibo que desea pagar.");
    showStep("stepPagarSeleccionar");
  } else if (op === "depositar") {
    resetDeposito();
    scr("Depósito", "Ingrese el monto a depositar.");
    showStep("stepDepositar");
  } else if (op === "salir") {
    scr("Sesión finalizada", "Gracias por usar BancoCajero. ¡Hasta pronto!", "success");
    showStep("stepDespedida");
    iniciarConteo();
  }
}

/* ═══════════════ COUNTDOWN ═══════════════ */
function iniciarConteo() {
  if (countdownTimer) clearInterval(countdownTimer);
  let s = 4;
  const el = document.getElementById("cuentaRegresiva");
  if (el) el.textContent = s;
  countdownTimer = setInterval(() => {
    s--;
    if (el) el.textContent = s;
    if (s <= 0) { clearInterval(countdownTimer); countdownTimer = null; reiniciar(); }
  }, 1000);
}

/* ═══════════════ IMPRIMIR ═══════════════ */
function mostrarImprimir(conBotonRecibos) {
  contextoPostRecibo = conBotonRecibos ? "recibos" : "menu";
  document.getElementById("imprimirBox").style.display = "block";
  document.getElementById("botonesPostRecibo").style.display = "none";
}
function responderImprimir(imprimir) {
  document.getElementById("imprimirBox").style.display = "none";
  document.getElementById("botonesPostRecibo").style.display = "block";
  if (imprimir) {
    scr("Imprimiendo...", "Su comprobante está siendo impreso. Retire el papel.", "success");
    setTimeout(() => scr("Comprobante listo", "Retire su comprobante. ¿Qué desea hacer?"), 1500);
  } else {
    scr("Sin comprobante", "Operación registrada. ¿Qué desea hacer?");
  }
  const quedan = usuarioActual?.recibosPendientes?.length || 0;
  document.getElementById("reciboVolverBtn").style.display = "block";
  document.getElementById("reciboVolverRecibosBtn").style.display = (contextoPostRecibo === "recibos" && quedan > 0) ? "block" : "none";
  document.getElementById("reciboSalirBtn").style.display = "block";
}

/* ═══════════════ PAGO RECIBOS ═══════════════ */
function renderRecibos() {
  servicioSel = ""; document.getElementById("seleccionError").textContent = "";
  const r = usuarioActual?.recibosPendientes || [];
  const li = document.getElementById("recibosLista");
  if (!r.length) {
    li.innerHTML = `<div class="alert-box info">No tiene recibos pendientes. Todos sus servicios están al día.</div>`;
    document.getElementById("pagarRecibosInfo").textContent = "Todos sus servicios están al día."; return;
  }
  document.getElementById("pagarRecibosInfo").textContent = `Tiene ${r.length} recibo${r.length > 1 ? "s" : ""} por pagar. Seleccione uno.`;
  li.innerHTML = r.map(s => `
    <div class="recibo-item" id="ri_${s}" onclick="selRecibo('${s}')">
      <div class="recibo-icono">${ICONOS[s] || ICONOS.Agua}</div>
      <div class="recibo-info">
        <div class="recibo-nombre">Servicio de ${s}</div>
        <div class="recibo-estado">Pendiente de pago</div>
      </div>
      <div class="recibo-check"></div>
    </div>`).join("");
}
function selRecibo(s) {
  servicioSel = s; document.getElementById("seleccionError").textContent = "";
  document.querySelectorAll(".recibo-item").forEach(el => el.classList.remove("seleccionado"));
  const it = document.getElementById("ri_" + s);
  if (it) it.classList.add("seleccionado");
}
function irAPagarRecibo() {
  if (!servicioSel) { document.getElementById("seleccionError").textContent = "Seleccione un recibo para continuar."; return; }
  document.getElementById("pagarRef").value = "";
  document.getElementById("pagarMonto").value = "";
  document.getElementById("pagarError").textContent = "";
  setTipoPago("completo");
  document.getElementById("rphNombre").textContent = "Servicio de " + servicioSel;
  document.getElementById("rphSub").textContent = "Complete los datos para realizar el pago";
  document.getElementById("rphIcon").innerHTML = ICONOS[servicioSel] || ICONOS.Agua;
  scr("Pago de " + servicioSel, "Ingrese la referencia y el valor.");
  showStep("stepPagarForm");
}
function volverSeleccionRecibos() { renderRecibos(); scr("Pago de servicios", "Seleccione el recibo que desea pagar."); showStep("stepPagarSeleccionar"); }
function setTipoPago(t) {
  tipoPago = t;
  document.getElementById("pagoCompleto").className = "radio-opt" + (t === "completo" ? " selected" : "");
  document.getElementById("pagoAbono").className    = "radio-opt" + (t === "abono"    ? " selected" : "");
}
function valPago() {
  const v = parseFloat(document.getElementById("pagarMonto").value);
  const e = document.getElementById("pagarError");
  if (isNaN(v) || v <= 0) { e.textContent = ""; return; }
  e.textContent = v > saldo ? "Fondos insuficientes. Saldo: " + fmtCOP(saldo) : "";
}
function confirmarPago() {
  const ref = document.getElementById("pagarRef").value.trim();
  const v   = parseFloat(document.getElementById("pagarMonto").value);
  const err = document.getElementById("pagarError");
  if (!/^\d{6}$/.test(ref)) { err.textContent = "La referencia debe tener exactamente 6 dígitos."; return; }
  if (isNaN(v) || v <= 0)   { err.textContent = "Ingrese un valor válido."; return; }
  if (v > saldo)            { err.textContent = "Fondos insuficientes."; return; }
  const sa = saldo; saldo -= v;
  if (tipoPago === "completo") marcarPagado(servicioSel);
  const fecha  = new Date().toLocaleString("es-CO", { hour:"2-digit", minute:"2-digit", day:"2-digit", month:"short", year:"numeric" });
  const refOp  = Math.floor(Math.random() * 900000 + 100000);
  document.getElementById("ticketFinal").innerHTML = `
    <div class="ticket-header">
      <div class="t-logo">BancoCajero • Comprobante oficial</div>
      <div class="t-title">${tipoPago === "abono" ? "Abono realizado" : "Pago de servicio"}</div>
      <div class="t-ref">Ref. #${refOp} &nbsp;|&nbsp; ${fecha}</div>
    </div>
    <div class="ticket-body">
      <div class="t-section-label">Detalle del pago</div>
      <div class="t-row"><span class="lbl">Servicio</span><span class="val">Servicio de ${servicioSel}</span></div>
      <div class="t-row"><span class="lbl">Referencia</span><span class="val">${ref}</span></div>
      <div class="t-row"><span class="lbl">Tipo de pago</span><span class="val">${tipoPago === "abono" ? "Abono parcial" : "Pago completo"}</span></div>
      <div class="t-row"><span class="lbl">Valor pagado</span><span class="val red">- ${fmtCOP(v)}</span></div>
      <div class="t-row"><span class="lbl">Estado del recibo</span><span class="val ${tipoPago === "completo" ? "green" : ""}">${tipoPago === "completo" ? "✔ Pagado" : "⏳ Pendiente (abono)"}</span></div>
      <div class="t-section-label">Saldo de cuenta</div>
      <div class="t-row"><span class="lbl">Titular</span><span class="val">${usuarioActual?.nombre || "-"}</span></div>
      <div class="t-row"><span class="lbl">Saldo anterior</span><span class="val">${fmtCOP(sa)}</span></div>
      <div class="t-row total-row"><span class="lbl">Saldo disponible</span><span class="val">${fmtCOP(saldo)}</span></div>
    </div>
    <div class="ticket-footer"><span>BancoCajero S.A.</span><span>Conserve este comprobante</span></div>`;
  scr("Pago exitoso", `${tipoPago === "abono" ? "Abono" : "Pago"} de ${servicioSel} registrado.`, "success");
  mostrarImprimir(true); showStep("step5");
}

/* ═══════════════ RETIRO ═══════════════ */
function setRetCuenta(c) {
  retCuenta = c;
  document.getElementById("retCuentaAhorro").className    = "radio-opt" + (c === "Ahorro"    ? " selected" : "");
  document.getElementById("retCuentaCorriente").className = "radio-opt" + (c === "Corriente" ? " selected" : "");
}
function setQuick(v) {
  ["qb50","qb100","qb200","qbOtro"].forEach(id => document.getElementById(id).classList.remove("active"));
  const inp = document.getElementById("montoInput");
  const err = document.getElementById("montoError");
  err.textContent = "";
  if (v === 0) {
    document.getElementById("qbOtro").classList.add("active");
    inp.value = ""; inp.focus();
  } else {
    const idMap = { 50000:"qb50", 100000:"qb100", 200000:"qb200" };
    if (idMap[v]) document.getElementById(idMap[v]).classList.add("active");
    inp.value = v; valMonto();
  }
}
function bills(m) {
  let r = m;
  const b50 = Math.floor(r / 50000); r -= b50 * 50000;
  const b20 = Math.floor(r / 20000); r -= b20 * 20000;
  const b10 = Math.floor(r / 10000);
  return { b50, b20, b10 };
}
function valMonto() {
  const v = parseFloat(document.getElementById("montoInput").value);
  const e = document.getElementById("montoError");
  if (isNaN(v) || v <= 0) { e.textContent = ""; return; }
  if (v % 10000 !== 0)    { e.textContent = "Debe ser múltiplo de $10.000."; return; }
  if (v > saldo)          { e.textContent = "Fondos insuficientes. Saldo: " + fmtCOP(saldo); return; }
  e.textContent = "";
  ["qb50","qb100","qb200","qbOtro"].forEach(id => document.getElementById(id).classList.remove("active"));
  const idMap = { 50000:"qb50", 100000:"qb100", 200000:"qb200" };
  if (idMap[v]) document.getElementById(idMap[v]).classList.add("active");
  else document.getElementById("qbOtro").classList.add("active");
  const rest = saldo - v;
  if (rest < 1000) {
    document.getElementById("optSi").style.cssText = "opacity:0.4;pointer-events:none;";
    document.getElementById("donWarn").textContent = "Saldo insuficiente para la donación.";
    don = "N"; setDon("N");
  } else {
    document.getElementById("optSi").style.cssText = "";
    document.getElementById("donWarn").textContent = "";
  }
}
function setDon(op) {
  don = op;
  document.getElementById("optSi").className = "radio-opt" + (op === "S" ? " selected" : "");
  document.getElementById("optNo").className  = "radio-opt" + (op === "N" ? " selected" : "");
}
function confirmarRetiro() {
  const v   = parseFloat(document.getElementById("montoInput").value);
  const err = document.getElementById("montoError");
  if (isNaN(v) || v <= 0) { err.textContent = "Ingrese un monto válido."; return; }
  if (v % 10000 !== 0)    { err.textContent = "Debe ser múltiplo de $10.000."; return; }
  if (v > saldo)          { err.textContent = "Fondos insuficientes. Saldo: " + fmtCOP(saldo); return; }
  monto = v;
  const dv = don === "S" ? 1000 : 0;
  const sa = saldo; const sf = sa - monto - dv;
  const b = bills(monto);
  saldo = sf;
  const billChips = [];
  if (b.b50 > 0) billChips.push(`<span class="bill-chip">× ${b.b50} billete${b.b50 > 1 ? "s" : ""} de $50.000</span>`);
  if (b.b20 > 0) billChips.push(`<span class="bill-chip">× ${b.b20} billete${b.b20 > 1 ? "s" : ""} de $20.000</span>`);
  if (b.b10 > 0) billChips.push(`<span class="bill-chip">× ${b.b10} billete${b.b10 > 1 ? "s" : ""} de $10.000</span>`);
  document.getElementById("retiroResultado").innerHTML = `
    <div class="ret-card">
      <div class="ret-section">Detalle del retiro</div>
      <div class="ret-row"><span class="rl">Titular</span><span class="rv">${usuarioActual?.nombre || "-"}</span></div>
      <div class="ret-row"><span class="rl">Tipo de cuenta</span><span class="rv">${retCuenta}</span></div>
      <div class="ret-row"><span class="rl">Monto retirado</span><span class="rv red">- ${fmtCOP(monto)}</span></div>
      ${don === "S" ? `<div class="ret-row"><span class="rl">Donación Unicef</span><span class="rv green">- $1.000 ♥</span></div>` : ""}
      <div class="ret-section">Desglose de billetes</div>
      <div class="billetes-inline">${billChips.join("")}</div>
      <div class="ret-section">Saldo</div>
      <div class="ret-row"><span class="rl">Saldo anterior</span><span class="rv">${fmtCOP(sa)}</span></div>
      <div class="ret-row"><span class="rl">Saldo restante</span><span class="rv blue">${fmtCOP(sf)}</span></div>
      <div class="ret-row"><span class="rl">Donación realizada</span><span class="rv ${don === "S" ? "green" : ""}">${don === "S" ? "Sí — Unicef $1.000" : "No"}</span></div>
    </div>`;
  scr("Retiro exitoso", "Retire el efectivo del cajero.", "success");
  showStep("step4");
}

/* ═══════════════ DEPÓSITO ═══════════════ */
function valDeposito() {
  const v = parseFloat(document.getElementById("depositoMonto").value);
  const e = document.getElementById("depositoError");
  const p = document.getElementById("depositoPreview");
  if (isNaN(v) || v <= 0) { e.textContent = ""; p.innerHTML = ""; return; }
  if (v < 10000) { e.textContent = "El mínimo de depósito es $10.000."; p.innerHTML = ""; return; }
  e.textContent = "";
  p.innerHTML = `<div class="alert-box info" style="margin-top:10px;">Nuevo saldo: <strong>${fmtCOP(saldo + v)}</strong></div>`;
}
function confirmarDeposito() {
  const v   = parseFloat(document.getElementById("depositoMonto").value);
  const e   = document.getElementById("depositoError");
  if (isNaN(v) || v <= 0) { e.textContent = "Ingrese un monto válido."; return; }
  if (v < 10000)           { e.textContent = "El mínimo de depósito es $10.000."; return; }
  const sa = saldo; saldo += v;
  const fecha = new Date().toLocaleString("es-CO", { hour:"2-digit", minute:"2-digit", day:"2-digit", month:"short", year:"numeric" });
  const refOp = Math.floor(Math.random() * 900000 + 100000);
  document.getElementById("ticketFinal").innerHTML = `
    <div class="ticket-header">
      <div class="t-logo">BancoCajero • Comprobante oficial</div>
      <div class="t-title">Depósito realizado</div>
      <div class="t-ref">Ref. #${refOp} &nbsp;|&nbsp; ${fecha}</div>
    </div>
    <div class="ticket-body">
      <div class="t-section-label">Detalle</div>
      <div class="t-row"><span class="lbl">Titular</span><span class="val">${usuarioActual?.nombre || "-"}</span></div>
      <div class="t-row"><span class="lbl">Monto depositado</span><span class="val green">+ ${fmtCOP(v)}</span></div>
      <div class="t-section-label">Saldo</div>
      <div class="t-row"><span class="lbl">Saldo anterior</span><span class="val">${fmtCOP(sa)}</span></div>
      <div class="t-row total-row"><span class="lbl">Saldo disponible</span><span class="val">${fmtCOP(saldo)}</span></div>
    </div>
    <div class="ticket-footer"><span>BancoCajero S.A.</span><span>Conserve este comprobante</span></div>`;
  scr("Depósito exitoso", "Revise su comprobante de depósito.", "success");
  mostrarImprimir(false); showStep("step5");
}

/* ═══════════════ CAMBIO CLAVE ═══════════════ */
function npClave(c, d) {
  if (c === "actual" && claveActual.length < 4) { claveActual += d; document.getElementById("claveError").textContent = ""; updCA(); }
  else if (c === "nueva" && claveNueva.length < 4) { claveNueva += d; document.getElementById("claveError").textContent = ""; updCN(); }
}
function ndClave(c) {
  if (c === "actual" && claveActual.length > 0) { claveActual = claveActual.slice(0, -1); updCA(); }
  else if (c === "nueva" && claveNueva.length > 0) { claveNueva = claveNueva.slice(0, -1); updCN(); }
}
function updCA() { for (let i = 0; i < 4; i++) document.getElementById("ca" + i).className = "dot" + (i < claveActual.length ? " filled" : ""); }
function updCN() { for (let i = 0; i < 4; i++) document.getElementById("cn" + i).className = "dot" + (i < claveNueva.length ? " filled" : ""); }
function pinActual() { return BASE_USUARIOS[usuarioActual?.cedula]?.pin || ""; }
function siguienteClave() {
  if (!usuarioActual) { document.getElementById("claveError").textContent = "Inicie sesión primero."; return; }
  if (claveActual.length < 4) { document.getElementById("claveError").textContent = "Ingrese 4 dígitos."; return; }
  if (claveActual !== pinActual()) { document.getElementById("claveError").textContent = "Clave actual incorrecta."; claveActual = ""; updCA(); return; }
  document.getElementById("claveError").textContent = "";
  document.getElementById("lblNuevaClave").style.display = "block";
  document.getElementById("claveNuevaDots").style.display = "flex";
  document.getElementById("numpadClave2").style.display = "grid";
  document.getElementById("numpadClave1").style.display = "none";
}
function confirmarClave() {
  if (claveNueva.length < 4) { document.getElementById("claveError").textContent = "Ingrese 4 dígitos de la nueva clave."; return; }
  if (claveNueva === pinActual()) { document.getElementById("claveError").textContent = "La nueva clave debe ser diferente."; return; }
  BASE_USUARIOS[usuarioActual.cedula].pin = claveNueva; usuarioActual.pin = claveNueva;
  scr("Clave actualizada", "La clave se actualizó correctamente.", "success");
  setTimeout(() => { scr("Sesión finalizada", "Gracias por usar BancoCajero.", "success"); showStep("stepDespedida"); iniciarConteo(); }, 1000);
}

/* ═══════════════ RESETS ═══════════════ */
function resetRetiro() {
  monto = 0; don = "N"; retCuenta = "Ahorro";
  const mi = document.getElementById("montoInput"); if (mi) mi.value = "";
  const me = document.getElementById("montoError"); if (me) me.textContent = "";
  const dw = document.getElementById("donWarn");    if (dw) dw.textContent = "";
  const ri = document.getElementById("retiroResultado"); if (ri) ri.innerHTML = "";
  ["qb50","qb100","qb200","qbOtro"].forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove("active"); });
  const oSi = document.getElementById("optSi"); if (oSi) { oSi.style.cssText = ""; oSi.className = "radio-opt"; }
  const oNo = document.getElementById("optNo"); if (oNo) oNo.className = "radio-opt selected";
  setRetCuenta("Ahorro");
}
function resetDeposito() {
  const dm = document.getElementById("depositoMonto"); if (dm) dm.value = "";
  const de = document.getElementById("depositoError"); if (de) de.textContent = "";
  const dp = document.getElementById("depositoPreview"); if (dp) dp.innerHTML = "";
}
function resetClave() {
  claveActual = ""; claveNueva = "";
  const ce = document.getElementById("claveError"); if (ce) ce.textContent = "";
  const lnc = document.getElementById("lblNuevaClave"); if (lnc) lnc.style.display = "none";
  const cnd = document.getElementById("claveNuevaDots"); if (cnd) cnd.style.display = "none";
  const nc2 = document.getElementById("numpadClave2"); if (nc2) nc2.style.display = "none";
  const nc1 = document.getElementById("numpadClave1"); if (nc1) nc1.style.display = "grid";
  ["ca0","ca1","ca2","ca3","cn0","cn1","cn2","cn3"].forEach(id => { const el = document.getElementById(id); if (el) el.className = "dot"; });
}

function volverMenu() {
  resetRetiro(); resetDeposito(); resetClave(); servicioSel = "";
  scr("Menú principal", "Seleccione una operación.");
  showStep("stepMenu");
}

function reiniciar() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  cedulaIng = ""; pinIng = ""; usuarioPorCedula = null; usuarioActual = null;
  saldo = 0; tipo = "Ahorro"; tipoCajero = ""; tarjetaIng = ""; servicioSel = ""; intentosFallidos = 0;
  updDotsCed(); updDotsPin(); updIntentosDots();
  ["cedulaError","pinError","saldoError"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ""; });
  document.getElementById("usuarioNombreDisplay").textContent = "-";
  document.getElementById("usuarioCedulaDisplay").textContent = "-";
  document.getElementById("ticketFinal").innerHTML = "";
  document.getElementById("imprimirBox").style.display = "block";
  document.getElementById("botonesPostRecibo").style.display = "none";
  resetRetiro(); resetDeposito(); resetClave();
  scr("Bienvenido", "Seleccione cómo desea acceder al cajero.");
  showStep("step0");
}

/* ═══════════════ INICIO ═══════════════ */
showStep("step0");
