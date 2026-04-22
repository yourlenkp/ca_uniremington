/* ═══════════════════════════════════════════
   BancoCajero — Grupo 4
   script.js
═══════════════════════════════════════════ */

"use strict";

// ═══════════════════════════════════════
// BASE DE DATOS LOCAL (demo)
// ═══════════════════════════════════════
const usuarios = {
  "12345678": {
    nombre: "Juan Pérez",
    pin: "1234",
    saldo: 1500000,
    tipo: "Ahorro",
    tarjetas: ["4111111111111111"],
    recibos: [
      { servicio: "Agua",  referencia: "001122", monto: 45000 },
      { servicio: "Luz",   referencia: "334455", monto: 120000 }
    ]
  },
  "87654321": {
    nombre: "María López",
    pin: "5678",
    saldo: 3200000,
    tipo: "Corriente",
    tarjetas: ["5500005555555559"],
    recibos: []
  },
  "11223344": {
    nombre: "Carlos Gómez",
    pin: "9999",
    saldo: 750000,
    tipo: "Ahorro",
    tarjetas: [],
    recibos: [
      { servicio: "Internet", referencia: "667788", monto: 65000 }
    ]
  }
};

// ═══════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════
let tipoCajero    = null;   // 'sinTarjeta' | 'conTarjeta'
let modoIngreso   = 'cedula'; // 'cedula' | 'pin'
let inputBuffer   = '';
let pinBuffer     = '';
let cedulaBuffer  = '';
let usuarioActual = null;
let montoRetiro   = 0;
let donacion      = false;
let servicioSel   = 'Agua';
let tipoPago      = 'completo';
let tarjetaValida = null;

// Para cambiar clave
let claveActualBuf = '';
let claveNuevaBuf  = '';

// Pasos de progreso
const stepNames = [
  'Tipo de acceso',
  'Identificación',
  'Validar datos',
  'Menú principal',
  'Operación',
  'Finalizar'
];

// ═══════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════
function fmt(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}

function showStep(id) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function setScreen(label, text) {
  document.getElementById('screenLabel').textContent = label;
  document.getElementById('screenText').textContent  = text;
}

function setProgress(stepIndex, label) {
  const dots = document.querySelectorAll('.step-dot');
  dots.forEach((d, i) => {
    d.classList.remove('current', 'done');
    if (i < stepIndex)       d.classList.add('done');
    else if (i === stepIndex) d.classList.add('current');
  });
  document.getElementById('stepLabel').textContent = label || stepNames[stepIndex] || '';
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function now() {
  return new Date().toLocaleString('es-CO', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  });
}

// ═══════════════════════════════════════
// PASO 0 — TIPO DE CAJERO
// ═══════════════════════════════════════
function seleccionarTipoCajero(tipo) {
  tipoCajero = tipo;
  if (tipo === 'conTarjeta') {
    setScreen('Insertar tarjeta', 'Introduzca su tarjeta en el lector.');
    setProgress(1, 'Insertar tarjeta');
    showStep('stepTarjeta');
  } else {
    setScreen('Identificación', 'Ingrese su cédula de 8 dígitos.');
    setProgress(1, 'Identificación');
    modoIngreso = 'cedula';
    resetIngreso();
    showStep('step1');
  }
}

function volverTipoCajero() {
  tarjetaValida = null;
  setScreen('Bienvenido', 'Seleccione cómo desea acceder al cajero.');
  setProgress(0, 'Tipo de acceso');
  showStep('step0');
}

// ═══════════════════════════════════════
// PASO TARJETA
// ═══════════════════════════════════════
function formatTarjeta(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function confirmarTarjeta() {
  clearError('tarjetaError');
  const raw = document.getElementById('tarjetaNumero').value.replace(/\s/g, '');
  if (raw.length !== 16) {
    showError('tarjetaError', 'El número de tarjeta debe tener 16 dígitos.');
    return;
  }
  // Buscar usuario que tenga esa tarjeta
  let encontrado = null;
  for (const [ced, u] of Object.entries(usuarios)) {
    if (u.tarjetas && u.tarjetas.includes(raw)) {
      encontrado = { cedula: ced, ...u };
      break;
    }
  }
  if (!encontrado) {
    showError('tarjetaError', 'Tarjeta no reconocida en el sistema.');
    return;
  }
  tarjetaValida = encontrado;
  // Pasar directo a ingresar PIN (modo pin ya que tenemos la tarjeta)
  modoIngreso = 'pin';
  resetIngreso();
  setModoIngreso('pin');
  document.getElementById('modoCedula').style.display = 'none';
  document.getElementById('modoPin').style.display = 'none';
  document.querySelector('.radio-group').style.display = 'none';
  setScreen('PIN', 'Ingrese su PIN de 4 dígitos.');
  setProgress(1, 'Ingresar PIN');
  showStep('step1');
}

// ═══════════════════════════════════════
// PASO 1 — CÉDULA / PIN
// ═══════════════════════════════════════
function resetIngreso() {
  inputBuffer = '';
  updateDots();
  clearError('pinError');
  // Restaurar vista radio
  document.getElementById('modoCedula').style.display = '';
  document.getElementById('modoPin').style.display = '';
  const rg = document.querySelector('.radio-group');
  if (rg) rg.style.display = '';
}

function setModoIngreso(modo) {
  modoIngreso = modo;
  inputBuffer = '';
  updateDots();
  clearError('pinError');

  document.getElementById('modoCedula').classList.toggle('selected', modo === 'cedula');
  document.getElementById('modoPin').classList.toggle('selected', modo === 'pin');

  const maxLen = modo === 'cedula' ? 8 : 4;
  const help = document.getElementById('loginHelp');
  help.textContent = modo === 'cedula'
    ? 'Ingrese su cedula de 8 digitos.'
    : 'Ingrese su PIN de 4 digitos.';

  // Mostrar/ocultar dots según longitud
  for (let i = 0; i < 8; i++) {
    const dot = document.getElementById('dot' + i);
    dot.style.display = i < maxLen ? '' : 'none';
    dot.classList.remove('filled');
  }
}

function updateDots() {
  const maxLen = modoIngreso === 'cedula' ? 8 : 4;
  for (let i = 0; i < maxLen; i++) {
    const dot = document.getElementById('dot' + i);
    if (!dot) continue;
    dot.classList.toggle('filled', i < inputBuffer.length);
  }
}

function np(d) {
  const maxLen = modoIngreso === 'cedula' ? 8 : 4;
  if (inputBuffer.length >= maxLen) return;
  inputBuffer += d;
  updateDots();
}

function nd() {
  inputBuffer = inputBuffer.slice(0, -1);
  updateDots();
}

function confirmAcceso() {
  clearError('pinError');
  if (modoIngreso === 'cedula') {
    if (inputBuffer.length !== 8) {
      showError('pinError', 'La cédula debe tener exactamente 8 dígitos.');
      return;
    }
    cedulaBuffer = inputBuffer;
    inputBuffer = '';
    modoIngreso = 'pin';
    setModoIngreso('pin');
    document.getElementById('loginHelp').textContent = 'Ahora ingrese su PIN de 4 dígitos.';
    return;
  }

  // Modo PIN
  if (inputBuffer.length !== 4) {
    showError('pinError', 'El PIN debe tener exactamente 4 dígitos.');
    return;
  }
  pinBuffer = inputBuffer;

  // Validar
  let cedula, usuario;
  if (tarjetaValida) {
    cedula  = tarjetaValida.cedula;
    usuario = usuarios[cedula];
  } else {
    cedula  = cedulaBuffer;
    usuario = usuarios[cedula];
  }

  if (!usuario) {
    showError('pinError', 'Usuario no encontrado.');
    inputBuffer = '';
    updateDots();
    return;
  }
  if (usuario.pin !== pinBuffer) {
    showError('pinError', 'PIN incorrecto. Intente de nuevo.');
    inputBuffer = '';
    updateDots();
    return;
  }

  // Éxito
  usuarioActual = { cedula, ...usuario };
  cargarPaso2();
}

// ═══════════════════════════════════════
// PASO 2 — DATOS USUARIO
// ═══════════════════════════════════════
function cargarPaso2() {
  setProgress(2, 'Validar datos');
  document.getElementById('usuarioNombreDisplay').textContent  = usuarioActual.nombre;
  document.getElementById('usuarioCedulaDisplay').textContent  = usuarioActual.cedula;
  document.getElementById('usuarioIngresoDisplay').textContent =
    tarjetaValida ? 'Tarjeta + PIN' : 'Cédula + PIN';

  const recibos = usuarioActual.recibos || [];
  const lista   = document.getElementById('usuarioRecibosLista');
  const resumen = document.getElementById('usuarioRecibosResumen');

  if (recibos.length === 0) {
    resumen.textContent = 'No tiene recibos pendientes. ✓';
    resumen.style.display = '';
    lista.style.display   = 'none';
  } else {
    resumen.textContent = `Tiene ${recibos.length} recibo(s) pendiente(s):`;
    lista.innerHTML = recibos.map(r =>
      `<div class="pending-item"><span>${r.servicio} — Ref: ${r.referencia}</span><span>${fmt(r.monto)}</span></div>`
    ).join('');
    lista.style.display = '';
  }

  setScreen('Bienvenido', `Hola, ${usuarioActual.nombre}`);
  showStep('step2');
}

function confirmSaldo() {
  cargarMenu();
}

// ═══════════════════════════════════════
// MENÚ PRINCIPAL
// ═══════════════════════════════════════
function cargarMenu() {
  setProgress(3, 'Menú principal');
  setScreen('Menú', `${usuarioActual.nombre} | Saldo: ${fmt(usuarioActual.saldo)}`);

  const recibos = usuarioActual.recibos || [];
  const alertEl = document.getElementById('menuRecibosAlert');
  if (recibos.length > 0) {
    alertEl.textContent = `⚠ Tiene ${recibos.length} recibo(s) pendiente(s) de pago.`;
    alertEl.style.display = '';
  } else {
    alertEl.style.display = 'none';
  }
  showStep('stepMenu');
}

function volverMenu() {
  cargarMenu();
}

function irOpcion(op) {
  setProgress(4, 'Operación');
  switch (op) {
    case 'consultar':
      document.getElementById('tipoDisplay').textContent          = usuarioActual.tipo;
      document.getElementById('saldoConsultaDisplay').textContent = fmt(usuarioActual.saldo);
      setScreen('Consultar saldo', 'Saldo actual de su cuenta.');
      showStep('stepConsultar');
      break;
    case 'retirar':
      document.getElementById('saldoDisplay').textContent = fmt(usuarioActual.saldo);
      document.getElementById('montoInput').value = '';
      document.getElementById('billetesPreview').style.display = 'none';
      clearError('montoError');
      setScreen('Retiro', 'Ingrese el monto a retirar.');
      showStep('step3');
      break;
    case 'pagar':
      clearError('pagarError');
      document.getElementById('pagarRef').value   = '';
      document.getElementById('pagarMonto').value = '';
      setScreen('Pagar servicio', 'Complete los datos del pago.');
      showStep('stepPagar');
      break;
    case 'depositar':
      clearError('depositoError');
      document.getElementById('depositoMonto').value = '';
      document.getElementById('depositoPreview').style.display = 'none';
      setScreen('Depositar', 'Ingrese el monto a depositar.');
      showStep('stepDepositar');
      break;
    case 'salir':
      setProgress(5, 'Finalizar');
      setScreen('Hasta pronto', 'Sesión finalizada. Gracias.');
      showStep('stepDespedida');
      break;
  }
}

// ═══════════════════════════════════════
// OPCIÓN 1 — CONSULTAR
// ═══════════════════════════════════════
// (manejado en irOpcion)

// ═══════════════════════════════════════
// OPCIÓN 2 — RETIRO
// ═══════════════════════════════════════
function valMonto() {
  clearError('montoError');
  const v = parseInt(document.getElementById('montoInput').value) || 0;
  const preview = document.getElementById('billetesPreview');

  if (v <= 0) { preview.style.display = 'none'; return; }
  if (v % 10000 !== 0) {
    showError('montoError', 'El monto debe ser múltiplo de $10.000.');
    preview.style.display = 'none'; return;
  }
  if (v > usuarioActual.saldo) {
    showError('montoError', 'Saldo insuficiente.');
    preview.style.display = 'none'; return;
  }
  if (v > 2000000) {
    showError('montoError', 'Máximo permitido: $2.000.000 por retiro.');
    preview.style.display = 'none'; return;
  }

  const billetes = calcBilletes(v);
  preview.innerHTML = '<strong>Billetes a dispensar:</strong><br>' + billetes;
  preview.style.display = '';
}

function calcBilletes(monto) {
  const denoms = [100000, 50000, 20000, 10000];
  let r = monto;
  const lines = [];
  for (const d of denoms) {
    const q = Math.floor(r / d);
    if (q > 0) { lines.push(`${q} × ${fmt(d)}`); r -= q * d; }
  }
  return lines.join(' | ');
}

function confirmMonto() {
  clearError('montoError');
  const v = parseInt(document.getElementById('montoInput').value) || 0;
  if (v <= 0)               { showError('montoError', 'Ingrese un monto válido.'); return; }
  if (v % 10000 !== 0)      { showError('montoError', 'Debe ser múltiplo de $10.000.'); return; }
  if (v > usuarioActual.saldo) { showError('montoError', 'Saldo insuficiente.'); return; }
  if (v > 2000000)          { showError('montoError', 'Máximo $2.000.000 por retiro.'); return; }

  montoRetiro = v;
  document.getElementById('donacionInfo').textContent =
    `Monto a retirar: ${fmt(v)}. Saldo restante: ${fmt(usuarioActual.saldo - v)}.`;
  document.getElementById('optSi').classList.remove('selected');
  document.getElementById('optNo').classList.add('selected');
  donacion = false;
  clearError('donWarn');
  setScreen('Donación', '¿Desea donar $1.000 a Unicef?');
  setProgress(4, 'Donación');
  showStep('step4');
}

function setDon(v) {
  donacion = (v === 'S');
  document.getElementById('optSi').classList.toggle('selected', donacion);
  document.getElementById('optNo').classList.toggle('selected', !donacion);
  clearError('donWarn');
}

function confirmarDonacion() {
  if (donacion && montoRetiro + 1000 > usuarioActual.saldo) {
    showError('donWarn', 'No tiene saldo suficiente para la donación.');
    donacion = false;
    document.getElementById('optSi').classList.remove('selected');
    document.getElementById('optNo').classList.add('selected');
    return;
  }

  const total = montoRetiro + (donacion ? 1000 : 0);
  usuarios[usuarioActual.cedula].saldo -= total;
  usuarioActual.saldo -= total;

  const billetes = calcBilletes(montoRetiro);
  mostrarTicket(
    `RETIRO EXITOSO\n` +
    `─────────────────────\n` +
    `Titular : ${usuarioActual.nombre}\n` +
    `Cuenta  : ${usuarioActual.tipo}\n` +
    `Monto   : ${fmt(montoRetiro)}\n` +
    `Billetes: ${billetes}\n` +
    (donacion ? `Donación: ${fmt(1000)} (Unicef)\n` : '') +
    `Total   : ${fmt(total)}\n` +
    `Saldo   : ${fmt(usuarioActual.saldo)}\n` +
    `─────────────────────\n` +
    `Fecha   : ${now()}\n` +
    `Cajero  : Grupo 4`
  );
}

// ═══════════════════════════════════════
// OPCIÓN 3 — PAGAR SERVICIO
// ═══════════════════════════════════════
function setSrv(srv, el) {
  servicioSel = srv;
  document.querySelectorAll('#stepPagar .radio-opt').forEach(e => e.classList.remove('selected'));
  if (el) el.classList.add('selected');
}

function setTipoPago(t) {
  tipoPago = t;
  document.getElementById('pagoCompleto').classList.toggle('selected', t === 'completo');
  document.getElementById('pagoAbono').classList.toggle('selected', t === 'abono');
}

function valPago() {
  clearError('pagarError');
}

function confirmarPago() {
  clearError('pagarError');
  const ref   = document.getElementById('pagarRef').value.trim();
  const monto = parseFloat(document.getElementById('pagarMonto').value) || 0;

  if (!ref || ref.length < 4) { showError('pagarError', 'Ingrese una referencia válida (mín. 4 dígitos).'); return; }
  if (monto < 1000)            { showError('pagarError', 'El valor mínimo a pagar es $1.000.'); return; }
  if (monto > usuarioActual.saldo) { showError('pagarError', 'Saldo insuficiente para realizar el pago.'); return; }

  // Descontar de recibo pendiente si existe
  const idx = (usuarioActual.recibos || []).findIndex(
    r => r.servicio === servicioSel && r.referencia === ref
  );

  if (idx !== -1) {
    const recibo = usuarioActual.recibos[idx];
    if (tipoPago === 'completo') {
      usuarioActual.recibos.splice(idx, 1);
      usuarios[usuarioActual.cedula].recibos.splice(idx, 1);
    } else {
      usuarioActual.recibos[idx].monto   -= monto;
      usuarios[usuarioActual.cedula].recibos[idx].monto -= monto;
      if (usuarioActual.recibos[idx].monto <= 0) {
        usuarioActual.recibos.splice(idx, 1);
        usuarios[usuarioActual.cedula].recibos.splice(idx, 1);
      }
    }
  }

  usuarios[usuarioActual.cedula].saldo -= monto;
  usuarioActual.saldo -= monto;

  mostrarTicket(
    `PAGO DE SERVICIO\n` +
    `─────────────────────\n` +
    `Titular  : ${usuarioActual.nombre}\n` +
    `Servicio : ${servicioSel}\n` +
    `Referencia: ${ref}\n` +
    `Tipo pago : ${tipoPago === 'completo' ? 'Pago completo' : 'Abono'}\n` +
    `Valor    : ${fmt(monto)}\n` +
    `Saldo    : ${fmt(usuarioActual.saldo)}\n` +
    `─────────────────────\n` +
    `Fecha    : ${now()}\n` +
    `Cajero   : Grupo 4`
  );
}

// ═══════════════════════════════════════
// OPCIÓN 4 — DEPOSITAR
// ═══════════════════════════════════════
function valDeposito() {
  clearError('depositoError');
  const v = parseFloat(document.getElementById('depositoMonto').value) || 0;
  const preview = document.getElementById('depositoPreview');
  if (v < 10000) { preview.style.display = 'none'; return; }
  preview.innerHTML = `Nuevo saldo tras depósito: <strong>${fmt(usuarioActual.saldo + v)}</strong>`;
  preview.style.display = '';
}

function confirmarDeposito() {
  clearError('depositoError');
  const v = parseFloat(document.getElementById('depositoMonto').value) || 0;
  if (v < 10000) { showError('depositoError', 'El monto mínimo para depositar es $10.000.'); return; }

  usuarios[usuarioActual.cedula].saldo += v;
  usuarioActual.saldo += v;

  mostrarTicket(
    `DEPÓSITO EXITOSO\n` +
    `─────────────────────\n` +
    `Titular  : ${usuarioActual.nombre}\n` +
    `Cuenta   : ${usuarioActual.tipo}\n` +
    `Depósito : ${fmt(v)}\n` +
    `Saldo    : ${fmt(usuarioActual.saldo)}\n` +
    `─────────────────────\n` +
    `Fecha    : ${now()}\n` +
    `Cajero   : Grupo 4`
  );
}

// ═══════════════════════════════════════
// TICKET FINAL
// ═══════════════════════════════════════
function mostrarTicket(texto) {
  setProgress(5, 'Comprobante');
  setScreen('Comprobante', 'Operación completada con éxito.');
  document.getElementById('ticketFinal').textContent = texto;
  showStep('step5');
}

function finalizarOpcion(msg) {
  mostrarTicket(
    `CONSULTA DE SALDO\n` +
    `─────────────────────\n` +
    `Titular  : ${usuarioActual.nombre}\n` +
    `Cuenta   : ${usuarioActual.tipo}\n` +
    `Saldo    : ${fmt(usuarioActual.saldo)}\n` +
    `─────────────────────\n` +
    `Fecha    : ${now()}\n` +
    `Cajero   : Grupo 4`
  );
}

// ═══════════════════════════════════════
// REINICIAR / SALIR
// ═══════════════════════════════════════
function reiniciar() {
  tipoCajero    = null;
  modoIngreso   = 'cedula';
  inputBuffer   = '';
  pinBuffer     = '';
  cedulaBuffer  = '';
  usuarioActual = null;
  montoRetiro   = 0;
  donacion      = false;
  tarjetaValida = null;

  // Restaurar radio group de step1
  document.getElementById('modoCedula').style.display = '';
  document.getElementById('modoPin').style.display    = '';
  const rg = document.querySelector('#step1 .radio-group');
  if (rg) rg.style.display = '';

  setProgress(0, 'Tipo de acceso');
  setScreen('Bienvenido', 'Seleccione cómo desea acceder al cajero.');
  showStep('step0');
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  setModoIngreso('cedula');
  setScreen('Bienvenido', 'Seleccione cómo desea acceder al cajero.');
  setProgress(0, 'Tipo de acceso');
  showStep('step0');
});
