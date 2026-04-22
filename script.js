// ============================================================
//  ESTADO GLOBAL
// ============================================================
const CUENTA = {
  pin: '1234',      // PIN correcto (para demo)
  saldo: 500000,
  tipo: null,       // Ahorro | Corriente (input del usuario)
  cedula: null,
  tarjeta: null,
  intentos: 0,
  donacion: false,
  acceso: 'cedula'  // cedula | tarjeta
};

// ============================================================
//  UTILIDADES
// ============================================================

/**
 * Navega a una vista (oculta todas las demás y muestra la indicada).
 * @param {string} id - ID del elemento de vista destino.
 */
function goTo(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/**
 * Formatea un número como moneda colombiana.
 * @param {number} n - Número a formatear.
 * @returns {string} Cadena formateada, ej: "$500.000"
 */
function fmt(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}

/**
 * Muestra u oculta un mensaje de error bajo un campo.
 * @param {string} id  - ID del elemento .field-error.
 * @param {boolean} show - true para mostrar, false para ocultar.
 */
function showErr(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('show', show);
}

/**
 * Restablece el estado global y regresa a la pantalla de inicio.
 */
function resetAll() {
  CUENTA.intentos = 0;
  CUENTA.cedula   = null;
  CUENTA.tarjeta  = null;
  CUENTA.donacion = false;
  CUENTA.tipo     = null;

  document.querySelectorAll('.attempt-dot').forEach(d => d.classList.remove('used'));
  document.getElementById('toggle-sw').classList.remove('on');

  const campos = [
    'cedula-input', 'tarjeta-input', 'pin-input', 'monto-input',
    'deposito-input', 'servicio-monto', 'pin-actual', 'pin-nuevo', 'pin-confirm'
  ];
  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  goTo('view-inicio');
}

/**
 * Cancela el ingreso de PIN y vuelve al inicio.
 */
function cancelar() {
  CUENTA.intentos = 0;
  document.querySelectorAll('.attempt-dot').forEach(d => d.classList.remove('used'));
  goTo('view-inicio');
}

/**
 * Alias de resetAll para el botón "Salir".
 */
function salir() {
  resetAll();
}

// ============================================================
//  FORMATO TARJETA
// ============================================================

/**
 * Aplica el formato XXXX-XXXX-XXXX-XXXX al input de tarjeta.
 * @param {HTMLInputElement} inp - El campo de entrada.
 */
function formatCard(inp) {
  let v = inp.value.replace(/\D/g, '').substring(0, 16);
  inp.value = v.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

// ============================================================
//  FLUJO: ACCESO SIN TARJETA
// ============================================================

/**
 * Valida la cédula ingresada y avanza al paso de PIN.
 */
function validarCedula() {
  const v = document.getElementById('cedula-input').value.trim();
  if (!/^\d{6,15}$/.test(v)) {
    showErr('cedula-error', true);
    return;
  }
  showErr('cedula-error', false);
  CUENTA.cedula = v;
  CUENTA.acceso = 'cedula';
  goTo('view-pin');
}

// ============================================================
//  FLUJO: ACCESO CON TARJETA
// ============================================================

/**
 * Valida el número de tarjeta (16 dígitos) y avanza al paso de PIN.
 */
function validarTarjeta() {
  const v = document.getElementById('tarjeta-input').value.replace(/\D/g, '');
  if (v.length !== 16) {
    showErr('tarjeta-error', true);
    return;
  }
  showErr('tarjeta-error', false);
  CUENTA.tarjeta = v;
  CUENTA.acceso  = 'tarjeta';
  goTo('view-pin');
}

// ============================================================
//  FLUJO: VALIDAR PIN
// ============================================================

/**
 * Valida el PIN ingresado. Bloquea la cuenta tras 3 intentos fallidos.
 */
function validarPIN() {
  const v      = document.getElementById('pin-input').value.trim();
  const wrongEl = document.getElementById('pin-wrong-alert');

  // Validar formato: exactamente 4 dígitos
  if (!/^\d{4}$/.test(v)) {
    showErr('pin-error', true);
    return;
  }
  showErr('pin-error', false);

  if (v === CUENTA.pin) {
    // PIN correcto
    document.getElementById('pin-input').value = '';
    wrongEl.style.display = 'none';
    CUENTA.intentos = 0;
    document.querySelectorAll('.attempt-dot').forEach(d => d.classList.remove('used'));
    mostrarMenu();
  } else {
    // PIN incorrecto
    CUENTA.intentos++;
    const dot = document.getElementById('dot' + CUENTA.intentos);
    if (dot) dot.classList.add('used');
    document.getElementById('pin-input').value = '';

    if (CUENTA.intentos >= 3) {
      goTo('view-bloqueado');
    } else {
      const restantes = 3 - CUENTA.intentos;
      wrongEl.style.display  = 'block';
      wrongEl.textContent = `⚠ PIN incorrecto. Te quedan ${restantes} intento(s).`;
    }
  }
}

/**
 * Muestra el menú principal con el identificador del usuario.
 */
function mostrarMenu() {
  const acc = CUENTA.acceso === 'cedula'
    ? `Cédula: ${CUENTA.cedula}`
    : `Tarjeta: ****${CUENTA.tarjeta.slice(-4)}`;
  document.getElementById('menu-welcome').textContent = acc;
  goTo('view-menu');
}

// ============================================================
//  SALDO
// ============================================================

/**
 * Muestra el saldo actualizado en la vista de consulta.
 */
function mostrarSaldo() {
  document.getElementById('saldo-display').textContent = fmt(CUENTA.saldo);
  document.getElementById('saldo-tipo-display').textContent =
    CUENTA.tipo ? `Cuenta ${CUENTA.tipo}` : 'Cuenta General';
  goTo('view-saldo');
}

// ============================================================
//  DONACIÓN TOGGLE
// ============================================================

/**
 * Alterna el estado de la donación a Unicef.
 */
function toggleDonacion() {
  CUENTA.donacion = !CUENTA.donacion;
  document.getElementById('toggle-sw').classList.toggle('on', CUENTA.donacion);
}

// ============================================================
//  RETIRO + DESGLOSE BILLETES
// ============================================================

/**
 * Procesa el retiro: valida el monto, actualiza el saldo
 * y genera el comprobante con desglose de billetes.
 */
function procesarRetiro() {
  const raw   = document.getElementById('monto-input').value;
  const monto = parseInt(raw, 10);
  const errEl = document.getElementById('monto-error');

  // Validación: valor positivo
  if (!raw || isNaN(monto) || monto <= 0) {
    errEl.textContent = '⚠ El monto debe ser un número positivo mayor a $0';
    showErr('monto-error', true);
    return;
  }

  // Validación: múltiplo de $10.000 (mínimo billete)
  if (monto % 10000 !== 0) {
    errEl.textContent = '⚠ El monto debe ser múltiplo de $10.000';
    showErr('monto-error', true);
    return;
  }

  // Validación: fondos suficientes
  const totalConDon = monto + (CUENTA.donacion ? 1000 : 0);
  if (totalConDon > CUENTA.saldo) {
    errEl.textContent = `⚠ Fondos insuficientes. Saldo disponible: ${fmt(CUENTA.saldo)}`;
    showErr('monto-error', true);
    return;
  }

  showErr('monto-error', false);

  // Desglose en billetes y actualización de saldo
  const billetes      = desglosarBilletes(monto);
  const saldoAnterior = CUENTA.saldo;
  CUENTA.saldo       -= totalConDon;

  // Fecha y hora de la transacción
  const fecha = new Date().toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Generar HTML del comprobante
  const comp = document.getElementById('comprobante-content');
  comp.innerHTML = `
    <div class="r-title">★ COMPROBANTE DE RETIRO ★</div>
    <div class="r-line"><span>FECHA</span><span>${fecha}</span></div>
    <div class="r-line"><span>TIPO ACCESO</span><span>${CUENTA.acceso.toUpperCase()}</span></div>
    ${CUENTA.acceso === 'cedula'
      ? `<div class="r-line"><span>CÉDULA</span><span>${CUENTA.cedula}</span></div>`
      : `<div class="r-line"><span>TARJETA</span><span>****${CUENTA.tarjeta.slice(-4)}</span></div>`
    }
    <div class="r-divider"></div>
    <div class="r-line"><span>SALDO ANTERIOR</span><span>${fmt(saldoAnterior)}</span></div>
    <div class="r-line highlight"><span>MONTO RETIRADO</span><span>-${fmt(monto)}</span></div>
    ${CUENTA.donacion
      ? `<div class="r-line" style="color:var(--gold)"><span>DONACIÓN UNICEF</span><span>-${fmt(1000)}</span></div>`
      : ''
    }
    <div class="r-divider"></div>
    <div class="r-line highlight"><span>SALDO FINAL</span><span>${fmt(CUENTA.saldo)}</span></div>
    ${CUENTA.donacion
      ? `<div class="r-divider"></div>
         <div class="r-line" style="color:var(--gold)">❤️ Donación a Unicef confirmada. ¡Gracias!</div>`
      : ''
    }
  `;

  // Generar sección de desglose de billetes
  const sec = document.getElementById('billetes-section');
  sec.innerHTML = `
    <div class="r-title" style="margin-top:16px;font-size:0.7rem;letter-spacing:2px;
      color:rgba(0,255,136,0.5);text-align:center">— DESGLOSE DE BILLETES —</div>
  `;

  [50000, 20000, 10000].forEach(denom => {
    if (billetes[denom] > 0) {
      const sub = denom * billetes[denom];
      sec.innerHTML += `
        <div class="billete-row">
          <span class="billete-denom">${fmt(denom)}</span>
          <span class="billete-qty">× ${billetes[denom]}</span>
          <span class="billete-sub">${fmt(sub)}</span>
        </div>
      `;
    }
  });

  // Limpiar campos y toggle
  document.getElementById('monto-input').value = '';
  CUENTA.donacion = false;
  document.getElementById('toggle-sw').classList.remove('on');

  goTo('view-comprobante');
}

/**
 * Calcula el desglose de billetes para un monto dado.
 * Usa denominaciones de $50.000, $20.000 y $10.000.
 * @param {number} monto - Monto a desglosar (múltiplo de 10.000).
 * @returns {{ 50000: number, 20000: number, 10000: number }}
 */
function desglosarBilletes(monto) {
  const result   = { 50000: 0, 20000: 0, 10000: 0 };
  let restante   = monto;
  [50000, 20000, 10000].forEach(d => {
    result[d] = Math.floor(restante / d);
    restante %= d;
  });
  return result;
}

// ============================================================
//  DEPÓSITO
// ============================================================

/**
 * Procesa un depósito: valida el monto y actualiza el saldo.
 */
function procesarDeposito() {
  const raw   = document.getElementById('deposito-input').value;
  const monto = parseInt(raw, 10);

  if (!raw || isNaN(monto) || monto <= 0) {
    showErr('deposito-error', true);
    return;
  }
  showErr('deposito-error', false);

  CUENTA.saldo += monto;
  document.getElementById('deposito-input').value = '';

  document.getElementById('ok-icon').textContent  = '✅';
  document.getElementById('ok-title').textContent = 'Depósito Exitoso';
  document.getElementById('ok-msg').textContent   =
    `Se depositaron ${fmt(monto)} correctamente. Saldo actual: ${fmt(CUENTA.saldo)}`;

  goTo('view-ok');
}

// ============================================================
//  PAGO DE SERVICIOS
// ============================================================

/**
 * Procesa el pago de un servicio: valida campos y descuenta del saldo.
 */
function procesarServicio() {
  const tipo  = document.getElementById('servicio-tipo').value;
  const raw   = document.getElementById('servicio-monto').value;
  const monto = parseInt(raw, 10);
  let ok      = true;

  if (!tipo) {
    showErr('servicio-tipo-error', true);
    ok = false;
  } else {
    showErr('servicio-tipo-error', false);
  }

  if (!raw || isNaN(monto) || monto <= 0) {
    showErr('servicio-monto-error', true);
    ok = false;
  } else {
    showErr('servicio-monto-error', false);
  }

  if (!ok) return;

  if (monto > CUENTA.saldo) {
    document.getElementById('servicio-monto-error').textContent =
      `⚠ Fondos insuficientes. Saldo: ${fmt(CUENTA.saldo)}`;
    showErr('servicio-monto-error', true);
    return;
  }

  CUENTA.saldo -= monto;
  document.getElementById('servicio-tipo').value  = '';
  document.getElementById('servicio-monto').value = '';

  document.getElementById('ok-icon').textContent  = '🧾';
  document.getElementById('ok-title').textContent = 'Pago Exitoso';
  document.getElementById('ok-msg').textContent   =
    `Servicio de ${tipo} pagado: ${fmt(monto)}. Saldo actual: ${fmt(CUENTA.saldo)}`;

  goTo('view-ok');
}

// ============================================================
//  CAMBIO DE CLAVE
// ============================================================

/**
 * Valida y actualiza el PIN de la cuenta.
 */
function procesarCambioClave() {
  const actual  = document.getElementById('pin-actual').value;
  const nuevo   = document.getElementById('pin-nuevo').value;
  const confirm = document.getElementById('pin-confirm').value;
  let ok        = true;

  if (actual !== CUENTA.pin) {
    showErr('pin-actual-error', true);
    ok = false;
  } else {
    showErr('pin-actual-error', false);
  }

  if (!/^\d{4}$/.test(nuevo)) {
    showErr('pin-nuevo-error', true);
    ok = false;
  } else {
    showErr('pin-nuevo-error', false);
  }

  if (nuevo !== confirm) {
    showErr('pin-confirm-error', true);
    ok = false;
  } else {
    showErr('pin-confirm-error', false);
  }

  if (!ok) return;

  CUENTA.pin = nuevo;
  document.getElementById('pin-actual').value  = '';
  document.getElementById('pin-nuevo').value   = '';
  document.getElementById('pin-confirm').value = '';

  document.getElementById('ok-icon').textContent  = '🔑';
  document.getElementById('ok-title').textContent = 'Clave Actualizada';
  document.getElementById('ok-msg').textContent   =
    'Tu PIN ha sido cambiado exitosamente. Recuérdalo bien.';

  goTo('view-ok');
}

// ============================================================
//  INICIALIZACIÓN — corrige el botón "Consultar Saldo" del menú
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // El primer .menu-btn corresponde a "Consultar Saldo"
  const saldoBtn = document.querySelectorAll('.menu-btn')[0];
  if (saldoBtn) {
    saldoBtn.onclick = mostrarSaldo;
  }
});
