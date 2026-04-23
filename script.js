/* ══════════════════════════════════════════
   BancoCajero — Grupo 4 | script.js
   ══════════════════════════════════════════ */

/* ═══════════════ BASE DE USUARIOS ═══════════════
   Usuarios de prueba con sus datos, PIN y cuentas de servicio
   ══════════════════════════════════════════════ */
const BASE_USUARIOS = {
  "47382910": {
    cedula: "47382910",
    nombre: "JUAN PÉREZ",
    pin: "7731",
    saldo: 2200000,
    tipo: "Ahorro",
    numeroCuenta: "2001001001",
    serviciosPendientes: {
      Agua:       { codigo: "AG-47382910", monto: 75000  },
      Luz:        { codigo: "LZ-47382910", monto: 120000 },
      Internet:   { codigo: "IN-47382910", monto: 89000  },
      Gas:        { codigo: "GS-47382910", monto: 55000  }
    }
  },
  "12345678": {
    cedula: "12345678",
    nombre: "MARIA JOSE",
    pin: "1234",
    saldo: 1500000,
    tipo: "Ahorro",
    numeroCuenta: "2001002002",
    serviciosPendientes: {
      Agua:       { codigo: "AG-12345678", monto: 68000  },
      Gas:        { codigo: "GS-12345678", monto: 47000  },
      Television: { codigo: "TV-12345678", monto: 95000  },
      Educacion:  { codigo: "ED-12345678", monto: 350000 }
    }
  },
  "91011121": {
    cedula: "91011121",
    nombre: "JOSE ANDRES",
    pin: "5678",
    saldo: 500000,
    tipo: "Ahorro",
    numeroCuenta: "2001003003",
    serviciosPendientes: {
      Luz:        { codigo: "LZ-91011121", monto: 98000  },
      Internet:   { codigo: "IN-91011121", monto: 89000  },
      Telefono:   { codigo: "TL-91011121", monto: 62000  },
      Seguros:    { codigo: "SG-91011121", monto: 180000 }
    }
  },
  "31415161": {
    cedula: "31415161",
    nombre: "LUISA FERNANDA",
    pin: "9101",
    saldo: 3000000,
    tipo: "Ahorro",
    numeroCuenta: "2001004004",
    serviciosPendientes: {
      Internet:   { codigo: "IN-31415161", monto: 89000  },
      Gas:        { codigo: "GS-31415161", monto: 55000  },
      Television: { codigo: "TV-31415161", monto: 95000  },
      Educacion:  { codigo: "ED-31415161", monto: 500000 }
    }
  }
};

const TARJETAS_VALIDAS = {
  "4738291000119922": "47382910",
  "1234567890123456": "12345678",
  "9876543210987654": "91011121",
  "1111222233334444": "31415161"
};

/* ═══════════════ CATÁLOGO DE SERVICIOS ═══════════════ */
const CATALOGO_SERVICIOS = [
  { id: "Agua",       emoji: "💧", label: "Agua",       color: "#EFF6FF", border: "#2196F3" },
  { id: "Luz",        emoji: "💡", label: "Luz",        color: "#FFFBEB", border: "#FFC107" },
  { id: "Internet",   emoji: "📶", label: "Internet",   color: "#F5F3FF", border: "#7C3AED" },
  { id: "Television", emoji: "📺", label: "Televisión", color: "#F0FDF4", border: "#16A34A" },
  { id: "Telefono",   emoji: "📞", label: "Teléfono",   color: "#FAF5FF", border: "#9333EA" },
  { id: "Gas",        emoji: "🔥", label: "Gas",        color: "#FFF7ED", border: "#EA580C" },
  { id: "Seguros",    emoji: "🛡️", label: "Seguros",    color: "#ECFDF5", border: "#059669" },
  { id: "Educacion",  emoji: "🎓", label: "Educación",  color: "#EFF6FF", border: "#2563EB" }
];

/* ═══════════════ ESTADO ═══════════════ */
let cedulaIng = "", pinIng = "";
let usuarioPorCedula = null, usuarioActual = null;
let saldo = 0, tipo = "Ahorro", monto = 0, don = "N";
let tipoCajero = "", tarjetaIng = "";
let intentosFallidos = 0;
let countdownTimer = null;
let retCuenta = "Ahorro";
let depCuenta = "Ahorro";

// Pago de servicios
let servicioSelPago = null;
let tipoPago = "completo";
let contextoPostRecibo = "menu";

/* ═══════════════ PASOS ═══════════════ */
const STEP_INFO = {
  step0:                { p:1, l:"Tipo de acceso" },
  stepTarjeta:          { p:1, l:"Insertar tarjeta" },
  step1cedula:          { p:2, l:"Cédula" },
  step1pin:             { p:2, l:"PIN de seguridad" },
  step2:                { p:3, l:"Usuario validado" },
  stepMenu:             { p:4, l:"Menú principal" },
  stepConsultar:        { p:4, l:"Consulta de saldo" },
  stepPagarSeleccionar: { p:4, l:"Pago de servicio" },
  stepDepositar:        { p:4, l:"Depósito" },
  step3:                { p:5, l:"Retiro de efectivo" },
  step4:                { p:6, l:"Retiro exitoso" },
  step5:                { p:6, l:"Comprobante" },
  stepDespedida:        { p:6, l:"Sesión finalizada" }
};
const PASOS = Object.keys(STEP_INFO);

/* ═══════════════ UTILIDADES ═══════════════ */
const fmtCOP = v => new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 0
}).format(v);

function refAleatoria() {
  return String(Math.floor(Math.random() * 900000 + 100000));
}

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

/* Fecha/hora en el header */
function actualizarDateTime() {
  const el = document.getElementById("bgDateTime");
  if (!el) return;
  const now = new Date();
  const fecha = now.toLocaleDateString("es-CO", { day:"2-digit", month:"2-digit", year:"numeric" });
  const hora  = now.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" });
  el.innerHTML = `🕐 ${hora} &nbsp;|&nbsp; 📅 ${fecha}`;
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
  scr("Tarjeta válida", "Tarjeta validada. Ingrese su PIN.", "success");
  setTimeout(() => {
    pinIng = ""; intentosFallidos = 0; updDotsPin(); updIntentosDots();
    document.getElementById("pinError").textContent = "";
    document.getElementById("loginHelpPin").textContent = "Ingrese su PIN de 4 dígitos";
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
  if (cedulaIng.length > 0) { cedulaIng = cedulaIng.slice(0, -1); document.getElementById("cedulaError").textContent = ""; updDotsCed(); }
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
  document.getElementById("loginHelpPin").textContent = "Ingrese su PIN de 4 dígitos";
  document.getElementById("btnVolverDesdePin").textContent = "← Volver a cédula";
  scr("PIN de seguridad", "Ingrese su PIN de 4 dígitos.");
  showStep("step1pin");
}

/* ═══════════════ PIN ═══════════════ */
function npP(d) {
  if (pinIng.length < 4) { pinIng += d; document.getElementById("pinError").textContent = ""; updDotsPin(); }
}
function ndP() {
  if (pinIng.length > 0) { pinIng = pinIng.slice(0, -1); document.getElementById("pinError").textContent = ""; updDotsPin(); }
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
      setTimeout(reiniciar, 3000); return;
    }
    document.getElementById("pinError").textContent = `PIN incorrecto. Intentos restantes: ${3 - intentosFallidos}.`;
    scr("PIN incorrecto", "El PIN ingresado no coincide.", "error");
    flashErrPin(); pinIng = ""; return;
  }
  cargarUsuario(usuarioPorCedula);
}
function volverDesdePIN() {
  pinIng = ""; updDotsPin(); document.getElementById("pinError").textContent = "";
  if (tipoCajero === "sinTarjeta") {
    scr("Cédula", "Ingrese su cédula de 8 dígitos.");
    showStep("step1cedula");
  } else { volverTipoCajero(); }
}

/* ═══════════════ CARGAR USUARIO ═══════════════ */
function esFemenino(nombre) {
  const n = nombre.toUpperCase().split(" ")[0];
  const fem = ["MARIA","LUISA","ANDREA","LAURA","CAROLINA","ANA","SOFIA","PAULA","DIANA","VALENTINA","ALEJANDRA","SARA","ISABEL","CLAUDIA","PATRICIA","ROSA","MONICA","NATALIA"];
  return fem.includes(n) || n.endsWith("A") || n.endsWith("NA");
}
function cargarUsuario(u) {
  // Clonar servicios pendientes
  usuarioActual = {
    ...u,
    serviciosPendientes: JSON.parse(JSON.stringify(u.serviciosPendientes || {}))
  };
  saldo = u.saldo; tipo = u.tipo;
  document.getElementById("usuarioNombreDisplay").textContent = u.nombre;
  document.getElementById("usuarioCedulaDisplay").textContent = u.cedula;
  const primer = u.nombre.split(" ")[0];
  const saludo = esFemenino(u.nombre) ? `¡Bienvenida, ${primer}!` : `¡Bienvenido, ${primer}!`;
  document.getElementById("btnBienvenida").textContent = saludo;
  scr("Ingreso exitoso", "Bienvenido/a, " + u.nombre + ".", "success");
  setTimeout(() => { scr("Usuario validado", "Identidad verificada correctamente."); showStep("step2"); }, 700);
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
    renderServiciosGrid();
    scr("Pago de servicio", "Seleccione el servicio que desea pagar.");
    showStep("stepPagarSeleccionar");
  } else if (op === "depositar") {
    resetDeposito();
    document.getElementById("saldoDepDisplay").textContent = fmtCOP(saldo);
    scr("Depósito", "Ingrese la cuenta destino y el monto.");
    showStep("stepDepositar");
  } else if (op === "salir") {
    scr("Sesión finalizada", "Gracias por usar el Cajero Uniremington.", "success");
    showStep("stepDespedida");
    iniciarConteo();
  }
}

/* ═══════════════ GRILLA DE SERVICIOS ═══════════════ */
function renderServiciosGrid() {
  servicioSelPago = null;
  document.getElementById("seleccionError").textContent = "";
  document.getElementById("pagoFormArea").style.display = "none";
  document.getElementById("btnPagarServicio").style.display = "none";
  document.getElementById("pagarError").textContent = "";

  const pendientes = usuarioActual?.serviciosPendientes || {};
  const grid = document.getElementById("serviciosGrid");

  grid.innerHTML = CATALOGO_SERVICIOS.map(s => {
    const tienePendiente = !!pendientes[s.id];
    const badge = tienePendiente
      ? `<div style="position:absolute;top:3px;right:3px;width:8px;height:8px;border-radius:50%;background:#ef4444;border:1px solid white;"></div>`
      : "";
    // Guardar el color de borde en data-attr para usarlo al seleccionar, NO en style inline
    const estiloBase = tienePendiente ? "position:relative;" : "position:relative;opacity:0.55;";
    return `
      <div class="servicio-card" id="sc_${s.id}" onclick="seleccionarServicio('${s.id}')"
           data-border="${s.border}" data-pendiente="${tienePendiente}"
           style="${estiloBase}">
        ${badge}
        <div class="servicio-icon" style="background:${s.color};">${s.emoji}</div>
        <div class="servicio-nombre">${s.label}</div>
        ${tienePendiente ? `<div style="font-size:9px;color:#059669;font-weight:700;">Pendiente</div>` : `<div style="font-size:9px;color:#9ca3af;">Al día</div>`}
      </div>`;
  }).join("");
}

function seleccionarServicio(id) {
  const pendientes = usuarioActual?.serviciosPendientes || {};

  // Quitar selección y borde de color de TODOS los servicios
  CATALOGO_SERVICIOS.forEach(s => {
    const el = document.getElementById("sc_" + s.id);
    if (el) {
      el.classList.remove("seleccionado");
      // Restaurar estilo base según si tiene pendiente o no
      const tienePendiente = el.dataset.pendiente === "true";
      el.style.borderColor = "";  // Limpiar borde coloreado
      el.style.opacity = tienePendiente ? "" : "0.55";
    }
  });

  // Remarcar SOLO el servicio seleccionado
  const elSel = document.getElementById("sc_" + id);
  if (elSel) {
    elSel.classList.add("seleccionado");
    elSel.style.borderColor = elSel.dataset.border || "";
    elSel.style.opacity = "";
  }

  servicioSelPago = id;
  document.getElementById("seleccionError").textContent = "";

  const info = pendientes[id];
  const montoServicio = info ? info.monto : 50000; // Valor por defecto
  const codigoServicio = info ? info.codigo : refAleatoria();

  // Mostrar formulario
  const formArea = document.getElementById("pagoFormArea");
  formArea.style.display = "block";

  // Mostrar el código del servicio como referencia sugerida (editable)
  document.getElementById("pagarRef").value = codigoServicio;
  document.getElementById("valorServicioDisplay").textContent = fmtCOP(montoServicio);
  document.getElementById("pagarError").textContent = "";
  document.getElementById("pagarMonto").value = "";
  document.getElementById("pagarMonto").style.display = "none";
  document.getElementById("labelMonto").style.display = "none";
  setTipoPago("completo");
  document.getElementById("btnPagarServicio").style.display = "flex";

  const serv = CATALOGO_SERVICIOS.find(s => s.id === id);
  scr("Pago de " + (serv ? serv.label : id), "Confirme la referencia y pague.");
}

function autoGenRef() {
  // Permite editar la referencia manualmente
}

function setTipoPago(t) {
  tipoPago = t;
  document.getElementById("pagoCompleto").className = "radio-opt" + (t === "completo" ? " selected" : "");
  document.getElementById("pagoAbono").className    = "radio-opt" + (t === "abono"    ? " selected" : "");
  const montoInput = document.getElementById("pagarMonto");
  const labelMonto = document.getElementById("labelMonto");
  if (t === "abono") {
    montoInput.style.display = "block";
    labelMonto.style.display = "block";
  } else {
    montoInput.style.display = "none";
    labelMonto.style.display = "none";
    montoInput.value = "";
  }
}

function valPago() {
  const v = parseFloat(document.getElementById("pagarMonto").value);
  const e = document.getElementById("pagarError");
  if (isNaN(v) || v <= 0) { e.textContent = ""; return; }
  e.textContent = v > saldo ? "Fondos insuficientes. Saldo: " + fmtCOP(saldo) : "";
}

function confirmarPago() {
  if (!servicioSelPago) { document.getElementById("seleccionError").textContent = "Seleccione un servicio primero."; return; }
  const ref = document.getElementById("pagarRef").value.trim();
  const err = document.getElementById("pagarError");

  if (!ref || ref.length < 1) { err.textContent = "Ingrese un número de referencia o factura."; return; }

  const pendientes = usuarioActual?.serviciosPendientes || {};
  const info = pendientes[servicioSelPago];
  const montoServicio = info ? info.monto : 50000;

  let valorPago;
  if (tipoPago === "completo") {
    valorPago = montoServicio;
  } else {
    valorPago = parseFloat(document.getElementById("pagarMonto").value);
    if (isNaN(valorPago) || valorPago <= 0) { err.textContent = "Ingrese un valor válido para abonar."; return; }
  }

  if (valorPago > saldo) { err.textContent = "Fondos insuficientes. Saldo: " + fmtCOP(saldo); return; }

  const sa = saldo;
  saldo -= valorPago;

  // Marcar como pagado solo si es pago completo
  if (tipoPago === "completo" && usuarioActual.serviciosPendientes[servicioSelPago]) {
    delete usuarioActual.serviciosPendientes[servicioSelPago];
    if (BASE_USUARIOS[usuarioActual.cedula])
      delete BASE_USUARIOS[usuarioActual.cedula].serviciosPendientes[servicioSelPago];
  }

  const serv = CATALOGO_SERVICIOS.find(s => s.id === servicioSelPago);
  const fecha = new Date().toLocaleString("es-CO", { hour:"2-digit", minute:"2-digit", day:"2-digit", month:"short", year:"numeric" });
  const refOp = Math.floor(Math.random() * 900000 + 100000);

  document.getElementById("ticketFinal").innerHTML = `
    <div class="ticket-header">
      <div class="t-logo">Cajero Uniremington • Comprobante</div>
      <div class="t-title">${tipoPago === "abono" ? "Abono de servicio" : "Pago de servicio"}</div>
      <div class="t-ref">Ref. #${refOp} &nbsp;|&nbsp; ${fecha}</div>
    </div>
    <div class="ticket-body">
      <div class="t-section-label">Detalle del pago</div>
      <div class="t-row"><span class="lbl">Servicio</span><span class="val">${serv ? serv.emoji + " " + serv.label : servicioSelPago}</span></div>
      <div class="t-row"><span class="lbl">Cód. factura</span><span class="val">${info ? info.codigo : "N/A"}</span></div>
      <div class="t-row"><span class="lbl">Referencia</span><span class="val">${ref}</span></div>
      <div class="t-row"><span class="lbl">Tipo de pago</span><span class="val">${tipoPago === "abono" ? "Abono parcial" : "Pago completo"}</span></div>
      <div class="t-row"><span class="lbl">Valor pagado</span><span class="val red">- ${fmtCOP(valorPago)}</span></div>
      <div class="t-row"><span class="lbl">Estado</span><span class="val ${tipoPago === "completo" ? "green" : ""}">${tipoPago === "completo" ? "✔ Pagado" : "⏳ Abono pendiente"}</span></div>
      <div class="t-section-label">Cuenta del cliente</div>
      <div class="t-row"><span class="lbl">Titular</span><span class="val">${usuarioActual?.nombre || "-"}</span></div>
      <div class="t-row"><span class="lbl">Nro. cuenta</span><span class="val">${usuarioActual?.numeroCuenta || "-"}</span></div>
      <div class="t-row"><span class="lbl">Saldo anterior</span><span class="val">${fmtCOP(sa)}</span></div>
      <div class="t-row total-row"><span class="lbl">Saldo disponible</span><span class="val">${fmtCOP(saldo)}</span></div>
    </div>
    <div class="ticket-footer"><span>BancoCajero S.A.</span><span>Conserve este comprobante</span></div>`;

  scr("Pago exitoso", `${tipoPago === "abono" ? "Abono" : "Pago"} de ${serv ? serv.label : servicioSelPago} registrado.`, "success");
  contextoPostRecibo = "recibos";
  mostrarImprimir(); showStep("step5");
}

function volverSeleccionRecibos() {
  renderServiciosGrid();
  scr("Pago de servicio", "Seleccione el servicio que desea pagar.");
  showStep("stepPagarSeleccionar");
}

/* ═══════════════ DEPÓSITO — NUEVA VERSIÓN ═══════════════ */
function setDepCuenta(c) {
  depCuenta = c;
  document.getElementById("depCuentaAhorro").className    = "radio-opt" + (c === "Ahorro"    ? " selected" : "");
  document.getElementById("depCuentaCorriente").className = "radio-opt" + (c === "Corriente" ? " selected" : "");
}

function valDeposito() {
  const v      = parseFloat(document.getElementById("depositoMonto").value);
  const nroCta = document.getElementById("numeroCuentaDest").value.trim();
  const e      = document.getElementById("depositoError");
  const p      = document.getElementById("depositoPreview");

  if (isNaN(v) || v <= 0) { p.innerHTML = ""; if (!nroCta) e.textContent = ""; return; }
  if (v < 10000) { e.textContent = "El mínimo de depósito es $10.000."; p.innerHTML = ""; return; }
  if (v > saldo) { e.textContent = "Fondos insuficientes. Saldo: " + fmtCOP(saldo); p.innerHTML = ""; return; }
  if (nroCta.length < 10) { e.textContent = ""; p.innerHTML = ""; return; }

  e.textContent = "";
  p.innerHTML = `<div class="alert-box info" style="margin-top:10px;font-size:12px;">
    Nuevo saldo tras depósito: <strong>${fmtCOP(saldo - v)}</strong>
  </div>`;
}

function confirmarDeposito() {
  const v      = parseFloat(document.getElementById("depositoMonto").value);
  const nroCta = document.getElementById("numeroCuentaDest").value.trim();
  const e      = document.getElementById("depositoError");

  if (!nroCta || nroCta.length < 8) { e.textContent = "Ingrese un número de cuenta destino válido (mínimo 8 dígitos)."; return; }
  if (isNaN(v) || v <= 0)           { e.textContent = "Ingrese un monto válido."; return; }
  if (v < 10000)                     { e.textContent = "El mínimo de depósito es $10.000."; return; }
  if (v > saldo)                     { e.textContent = "Fondos insuficientes. Saldo: " + fmtCOP(saldo); return; }

  const sa = saldo;
  saldo -= v;

  const fecha = new Date().toLocaleString("es-CO", { hour:"2-digit", minute:"2-digit", day:"2-digit", month:"short", year:"numeric" });
  const refOp = Math.floor(Math.random() * 900000 + 100000);

  document.getElementById("ticketFinal").innerHTML = `
    <div class="ticket-header">
      <div class="t-logo">Cajero Uniremington • Comprobante</div>
      <div class="t-title">Depósito realizado</div>
      <div class="t-ref">Ref. #${refOp} &nbsp;|&nbsp; ${fecha}</div>
    </div>
    <div class="ticket-body">
      <div class="t-section-label">Detalle del depósito</div>
      <div class="t-row"><span class="lbl">Cuenta origen</span><span class="val">${usuarioActual?.numeroCuenta || "-"} (${depCuenta})</span></div>
      <div class="t-row"><span class="lbl">Titular origen</span><span class="val">${usuarioActual?.nombre || "-"}</span></div>
      <div class="t-row"><span class="lbl">Cuenta destino</span><span class="val">${nroCta}</span></div>
      <div class="t-row"><span class="lbl">Monto depositado</span><span class="val green">+ ${fmtCOP(v)}</span></div>
      <div class="t-section-label">Saldo de cuenta origen</div>
      <div class="t-row"><span class="lbl">Saldo anterior</span><span class="val">${fmtCOP(sa)}</span></div>
      <div class="t-row total-row"><span class="lbl">Saldo disponible</span><span class="val">${fmtCOP(saldo)}</span></div>
    </div>
    <div class="ticket-footer"><span>BancoCajero S.A.</span><span>Conserve este comprobante</span></div>`;

  scr("Depósito exitoso", "Revise su comprobante de depósito.", "success");
  contextoPostRecibo = "menu";
  mostrarImprimir(); showStep("step5");
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
  if (v === 0) { document.getElementById("qbOtro").classList.add("active"); inp.value = ""; inp.focus(); }
  else {
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
      <div class="billetes-inline">${billChips.join("") || '<span style="color:#9ca3af;font-size:12px;">Sin billetes</span>'}</div>
      <div class="ret-section">Saldo</div>
      <div class="ret-row"><span class="rl">Saldo anterior</span><span class="rv">${fmtCOP(sa)}</span></div>
      <div class="ret-row"><span class="rl">Saldo restante</span><span class="rv blue">${fmtCOP(sf)}</span></div>
      <div class="ret-row"><span class="rl">Donación Unicef</span><span class="rv ${don === "S" ? "green" : ""}">${don === "S" ? "Sí — $1.000" : "No"}</span></div>
    </div>`;
  scr("Retiro exitoso", "Retire el efectivo del cajero.", "success");
  showStep("step4");
}

/* ═══════════════ IMPRIMIR ═══════════════ */
function mostrarImprimir() {
  document.getElementById("imprimirBox").style.display = "block";
  document.getElementById("botonesPostRecibo").style.display = "none";
}
function responderImprimir(imprimir) {
  document.getElementById("imprimirBox").style.display = "none";
  document.getElementById("botonesPostRecibo").style.display = "block";
  if (imprimir) {
    scr("Imprimiendo...", "Su comprobante está siendo impreso. Retire el papel.", "success");
    setTimeout(() => scr("Comprobante listo", "Retire su comprobante."), 1500);
  } else {
    scr("Sin comprobante", "Operación registrada.");
  }
  const quedan = Object.keys(usuarioActual?.serviciosPendientes || {}).length;
  document.getElementById("reciboVolverBtn").style.display = "block";
  document.getElementById("reciboVolverRecibosBtn").style.display = (contextoPostRecibo === "recibos" && quedan > 0) ? "block" : "none";
  document.getElementById("reciboSalirBtn").style.display = "block";
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

/* ═══════════════ RESETS ═══════════════ */
function resetRetiro() {
  monto = 0; don = "N"; retCuenta = "Ahorro";
  const mi = document.getElementById("montoInput");  if (mi) mi.value = "";
  const me = document.getElementById("montoError");  if (me) me.textContent = "";
  const dw = document.getElementById("donWarn");     if (dw) dw.textContent = "";
  const ri = document.getElementById("retiroResultado"); if (ri) ri.innerHTML = "";
  ["qb50","qb100","qb200","qbOtro"].forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove("active"); });
  const oSi = document.getElementById("optSi"); if (oSi) { oSi.style.cssText = ""; oSi.className = "radio-opt"; }
  const oNo = document.getElementById("optNo"); if (oNo) oNo.className = "radio-opt selected";
  setRetCuenta("Ahorro");
}
function resetDeposito() {
  depCuenta = "Ahorro";
  const dm  = document.getElementById("depositoMonto");   if (dm)  dm.value = "";
  const de  = document.getElementById("depositoError");   if (de)  de.textContent = "";
  const dp  = document.getElementById("depositoPreview"); if (dp)  dp.innerHTML = "";
  const nc  = document.getElementById("numeroCuentaDest"); if (nc) nc.value = "";
  setDepCuenta("Ahorro");
}

function volverMenu() {
  resetRetiro(); resetDeposito(); servicioSelPago = null;
  scr("Menú principal", "Seleccione una operación.");
  showStep("stepMenu");
}

function reiniciar() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  cedulaIng = ""; pinIng = ""; usuarioPorCedula = null; usuarioActual = null;
  saldo = 0; tipo = "Ahorro"; tipoCajero = ""; tarjetaIng = ""; servicioSelPago = null; intentosFallidos = 0;
  updDotsCed(); updDotsPin(); updIntentosDots();
  ["cedulaError","pinError","saldoError"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ""; });
  document.getElementById("usuarioNombreDisplay").textContent = "-";
  document.getElementById("usuarioCedulaDisplay").textContent = "-";
  document.getElementById("ticketFinal").innerHTML = "";
  document.getElementById("imprimirBox").style.display = "block";
  document.getElementById("botonesPostRecibo").style.display = "none";
  resetRetiro(); resetDeposito();
  scr("Bienvenido", "Seleccione cómo desea acceder al cajero.");
  showStep("step0");
}

/* ═══════════════ INICIO ═══════════════ */
showStep("step0");
