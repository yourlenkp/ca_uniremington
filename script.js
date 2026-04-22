let PIN_CORRECTO = "1234";
let intentos = 0;
let saldo = 0;

function validar(){

    let pin = document.getElementById("pin").value;
    saldo = parseInt(document.getElementById("saldo").value);
    let tipo = document.getElementById("tipoCuenta").value;
    let monto = parseInt(document.getElementById("monto").value);
    let donacion = document.getElementById("donacion").value;
    let error = document.getElementById("error");

    // VALIDACIONES
    if(pin.length !== 4){
        error.innerText = "PIN inválido";
        return;
    }

    if(isNaN(saldo) || saldo < 0){
        error.innerText = "Saldo inválido";
        return;
    }

    if(tipo === ""){
        error.innerText = "Seleccione tipo de cuenta";
        return;
    }

    if(isNaN(monto) || monto <= 0){
        error.innerText = "Monto inválido";
        return;
    }

    if(donacion === ""){
        error.innerText = "Seleccione donación";
        return;
    }

    // VALIDAR PIN
    if(pin !== PIN_CORRECTO){
        intentos++;
        error.innerText = "PIN incorrecto (" + intentos + "/3)";

        if(intentos >= 3){
            error.innerText = "Cuenta bloqueada";
        }
        return;
    }

    document.getElementById("login").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
}

// CONSULTAR
function consultar(){
    document.getElementById("resultado").innerText =
    "Saldo actual: $" + saldo;
}

// RETIRAR
function retirar(){
    let monto = parseInt(document.getElementById("monto").value);
    let donacion = document.getElementById("donacion").value;

    if(monto > saldo){
        document.getElementById("resultado").innerText = "Fondos insuficientes";
        return;
    }

    saldo -= monto;

    if(donacion === "si"){
        saldo -= 1000;
    }

    let b50 = Math.floor(monto / 50000);
    monto %= 50000;

    let b20 = Math.floor(monto / 20000);
    monto %= 20000;

    let b10 = Math.floor(monto / 10000);

    document.getElementById("resultado").innerText =
    "Billetes:\n50k: " + b50 +
    "\n20k: " + b20 +
    "\n10k: " + b10 +
    "\n\nSaldo final: $" + saldo;
}

function salir(){
    location.reload();
}
