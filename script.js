let saldo = 0;
let PIN = "1234";
let intentos = 0;

// SIMULACIÓN CLIENTES
let clientes = ["123", "456", "789"];

// VALIDAR PIN
function validarPIN(pin){
    if(pin !== PIN){
        intentos++;
        alert("PIN incorrecto ("+intentos+"/3)");

        if(intentos >= 3){
            alert("Cuenta bloqueada");
            location.reload();
        }
        return false;
    }
    intentos = 0;
    return true;
}

// SIN TARJETA
function loginSinTarjeta(){

    let cedula = document.getElementById("cedula").value;
    let pin = document.getElementById("pin1").value;
    let saldoInput = parseInt(document.getElementById("saldoInput").value);
    let tipo = document.getElementById("tipoCuenta").value;
    let monto = parseInt(document.getElementById("montoInput").value);
    let donacion = document.getElementById("donacion").value;

    // VALIDACIONES
    if(!cedula || !pin || !tipo || !donacion){
        alert("Complete todos los campos");
        return;
    }

    if(!clientes.includes(cedula)){
        alert("No es cliente. Diríjase a la oficina del banco.");
        return;
    }

    if(pin.length !== 4){
        alert("PIN inválido");
        return;
    }

    if(isNaN(saldoInput) || saldoInput < 0){
        alert("Saldo inválido");
        return;
    }

    saldo = saldoInput;

    if(!validarPIN(pin)) return;

    document.getElementById("login").style.display="none";
    document.getElementById("menu").style.display="block";
}

// CON TARJETA
function loginConTarjeta(){
    let pin = document.getElementById("pin2").value;

    if(!validarPIN(pin)) return;

    saldo = 50000;
    document.getElementById("login").style.display="none";
    document.getElementById("menu").style.display="block";
}

// CONSULTAR
function consultarSaldo(){
    document.getElementById("resultado").innerHTML =
    "Saldo: $" + saldo;
}

// RETIRAR
function retirar(){

    let monto = parseInt(document.getElementById("montoInput").value);
    let donacion = document.getElementById("donacion").value;

    if(isNaN(monto) || monto <= 0){
        alert("Monto inválido");
        return;
    }

    if(monto > saldo){
        alert("Fondos insuficientes");
        return;
    }

    saldo -= monto;

    if(donacion === "si"){
        saldo -= 1000;
    }

    let r = monto;
    let b50 = Math.floor(r/50000); r%=50000;
    let b20 = Math.floor(r/20000); r%=20000;
    let b10 = Math.floor(r/10000);

    document.getElementById("resultado").innerHTML = `
    Billetes:<br>
    50k: ${b50}<br>
    20k: ${b20}<br>
    10k: ${b10}<br><br>
    Saldo final: $${saldo}<br>
    ${donacion==="si"?"Donación realizada ✔":""}
    `;
}

// SALIR
function salir(){
    location.reload();
}
