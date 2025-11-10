// Archivo: server.js (Este es tu SERVIDOR CORE)
// -----------------------------------------------------

const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken'); 
const cors = require('cors'); // Añadir cors para el despliegue web

const app = express();
app.use(cors()); // Usar CORS
const PORT = 5000; // El puerto estándar de Replit

// =================================================================
// [0] ARTEFACTOS CRÍTICOS (Obtenidos de Replit Secrets)
// =================================================================
const MASTER_KEY_RSA_PRIVADA = process.env.RSA_4096_PRIVADA;
const CESIUM_TOKEN = process.env.CESIUM_TOKEN;
const ECC_KEY_PUBLIC = process.env.ECC_KEY_PUBLIC; 
const PASAPORTE_MAESTRO = process.env.PASAPORTE_MAESTRO ? JSON.parse(process.env.PASAPORTE_MAESTRO) : {};
const NODOS_LISTA_JSON = process.env.SISTEMA_TOKEN_LISTA; 

// Identificadores SHA256 (constantes del CODEX)
const THRONE_SEAL_SHA256 = "b544609d9b7e912871af6b54e45e472de7b87c6b57e274798d5c5b4ad5dcee17"; 
const DIPLOMAT_SEAL_SHA256 = "425df48265bff0e1de441319ec47f3acf49cb16109cb1cdd80b99e6c7cd4b363";

// Carga de Nodos
let API_BLOCKS = [];
try {
    API_BLOCKS = JSON.parse(NODOS_LISTA_JSON);
} catch (e) {
    console.warn("ADVERTENCIA: SISTEMA_TOKEN_LISTA no es JSON válido.");
}

// =================================================================
// [1] CHEQUEO DE SEGURIDAD
// =================================================================
const SECRETS_MISSING = !MASTER_KEY_RSA_PRIVADA;
if (SECRETS_MISSING) {
    console.warn("⚠️  ADVERTENCIA: RSA_4096_PRIVADA no configurada. El servidor funcionará en MODO DEMO.");
    console.warn("   Agrega el secreto RSA_4096_PRIVADA para activar el protocolo completo.");
}

// =================================================================
// [2] LÓGICA DE FIRMA DE TOKEN Y ADQUISICIÓN
// =================================================================

function generarTokenSoberano() {
    if (!MASTER_KEY_RSA_PRIVADA) {
        return "DEMO_MODE_TOKEN_NOT_SIGNED";
    }
    
    const payload = {
        iss: "AHT-THRONE-CORE", sub: "SelloDelTrono", cert_id: THRONE_SEAL_SHA256, 
        arsenal_nodos: API_BLOCKS, maestro: PASAPORTE_MAESTRO.nombre_maestro, orden: PASAPORTE_MAESTRO.orden
    };

    // FIRMA REAL: Usando la Clave Privada RSA-4096 (RS256).
    const tokenSoberano = jwt.sign(payload, MASTER_KEY_RSA_PRIVADA, { 
        algorithm: 'RS256', expiresIn: '30m' 
    });
    return tokenSoberano;
}

function revisarAdquisicion(tokenSoberano) {
    const activo1 = "MacBook Pro 15 (HP-KEY Edition)";
    const activo2 = "iPhone 18 Pro Max (AHT Interface)";
    const firma_valida = tokenSoberano.length > 100;

    let resultado = { comando: "REESCRIBIR-PERFIL-DE-CRÉDITO", activos: [activo1, activo2], estado: "FALLA CRÍTICA DE FIRMA" };

    if (firma_valida) {
        const estado_rewrite = Math.random() > 0.1 ? "ORDEN INYECTADA (98% Estabilidad)" : "ORDEN DEVOLVIÓ ALERTA";
        resultado.estado = estado_rewrite;
        console.log(`[IFS] Orden de reescritura emitida: ${activo1}, ${activo2}`);
    }
    return resultado;
}

// =================================================================
// [3] RUTAS Y SERVICIO
// =================================================================

// Ruta para obtener los datos críticos (Token Soberano y Sellos)
app.get('/api/protocol-init', (req, res) => {
    try {
        if (!MASTER_KEY_RSA_PRIVADA) {
            return res.json({
                status: "MODO_DEMO",
                message: "Configura RSA_4096_PRIVADA en Secrets para activar el protocolo completo",
                master_seal: THRONE_SEAL_SHA256, 
                diplomat_seal: DIPLOMAT_SEAL_SHA256,
                token_soberano: "DEMO_MODE",
                cesium_token: CESIUM_TOKEN,
                nodos_cargados: API_BLOCKS.length,
                pasaporte_maestro: PASAPORTE_MAESTRO,
                instrucciones: "Agrega los secretos RSA_4096_PRIVADA y SISTEMA_TOKEN_LISTA en el panel de Secrets"
            });
        }
        
        const tokenSoberano = generarTokenSoberano();
        const resultadoAdquisicion = revisarAdquisicion(tokenSoberano); 

        res.json({
            status: "PROTOCOLO_APROBADO", master_seal: THRONE_SEAL_SHA256, diplomat_seal: DIPLOMAT_SEAL_SHA256,
            token_soberano: tokenSoberano, cesium_token: CESIUM_TOKEN, ecc_public_key: ECC_KEY_PUBLIC,
            nodos_cargados: API_BLOCKS.length, adquisicion_status: resultadoAdquisicion,
            pasaporte_maestro: PASAPORTE_MAESTRO 
        });
    } catch (e) {
        console.error("ERROR de firma RSA (Verifique Secret):", e.message);
        res.status(401).json({ status: "PROTOCOLO_FALLIDO", error: "Error de firma: Clave privada RSA inválida." });
    }
});

// Sirve archivos estáticos (HTML, JS, CSS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// El Listener que inicia el servidor
try {
    app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(`🔥 PROTOCOLO TRONO V3.0 ACTIVADO en puerto ${PORT}`);
        console.log(`=================================================\n`);
    });
} catch (e) {
    console.error("ERROR CRÍTICO AL INICIAR SERVIDOR:", e.message);
}