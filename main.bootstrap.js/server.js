// Archivo: server.js (Este es tu SERVIDOR CORE)
// -----------------------------------------------------

const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken'); 
const cors = require('cors'); // Añadir cors para el despliegue web
const { generateWithGPT5, generateWithGemini, generateDual, INDUSTRY_TEMPLATES } = require('./ai-generator');
const { addSecret, getSecret, listSecrets, deleteSecret, saveVault, getVaultStats } = require('./throne-vault');

const app = express();
app.use(cors()); // Usar CORS
app.use(express.json({ limit: '50mb' })); // Para manejar requests con JSON (incluyendo imágenes base64)
const PORT = 5000; // El puerto estándar de Replit

// =================================================================
// [0] ARTEFACTOS CRÍTICOS (Obtenidos de Replit Secrets)
// =================================================================
let MASTER_KEY_RSA_PRIVADA = null;
try {
    const keyPath = path.join(__dirname, '..', 'keys', 'throne_key.pem');
    if (fs.existsSync(keyPath)) {
        MASTER_KEY_RSA_PRIVADA = fs.readFileSync(keyPath, 'utf8');
        console.log("✅ Clave RSA-4096 cargada desde keys/throne_key.pem");
    } else if (process.env.RSA_4096_PRIVADA) {
        MASTER_KEY_RSA_PRIVADA = process.env.RSA_4096_PRIVADA.replace(/\\n/g, '\n');
        console.log("✅ Clave RSA-4096 cargada desde Secrets");
    }
} catch (e) {
    console.warn("⚠️  Error cargando clave RSA:", e.message);
}
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

// =================================================================
// [3.1] RUTAS DE GENERACIÓN CON IA
// =================================================================

// Obtener templates disponibles por industria
app.get('/api/templates', (req, res) => {
    res.json({
        success: true,
        templates: INDUSTRY_TEMPLATES
    });
});

// Generar app con IA (modo dual: GPT-5 + Gemini)
app.post('/api/generate-app', async (req, res) => {
    try {
        const { prompt, industry, mode } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: "Se requiere un 'prompt' para generar la app"
            });
        }

        console.log(`🚀 Generando app - Modo: ${mode || 'dual'}, Industria: ${industry || 'general'}`);

        let result;
        if (mode === 'gpt5') {
            result = await generateWithGPT5(prompt, industry);
        } else if (mode === 'gemini') {
            result = await generateWithGemini(prompt, industry);
        } else {
            // Modo dual por defecto (más potente)
            result = await generateDual(prompt, industry);
        }

        res.json(result);
    } catch (error) {
        console.error("Error generando app:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generar código rápido con GPT-5
app.post('/api/quick-code', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ success: false, error: "Prompt requerido" });
        }

        const result = await generateWithGPT5(prompt);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =================================================================
// [3.2] RUTAS DE THRONE VAULT (Bóveda Personal)
// =================================================================

// Obtener estadísticas del vault
app.get('/api/vault/stats', (req, res) => {
    try {
        const stats = getVaultStats();
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Listar secretos de una categoría
app.get('/api/vault/:category', (req, res) => {
    try {
        const { category } = req.params;
        const secrets = listSecrets(category);
        res.json({ success: true, category, secrets });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Agregar secreto
app.post('/api/vault/:category', (req, res) => {
    try {
        const { category } = req.params;
        const { name, value, metadata } = req.body;

        if (!name || !value) {
            return res.status(400).json({ success: false, error: "Nombre y valor requeridos" });
        }

        const result = addSecret(category, name, value, metadata);
        saveVault(); // Guardar automáticamente
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener secreto (desencriptado)
app.get('/api/vault/:category/:id', (req, res) => {
    try {
        const { category, id } = req.params;
        const secret = getSecret(category, id);
        res.json({ success: true, secret });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Eliminar secreto
app.delete('/api/vault/:category/:id', (req, res) => {
    try {
        const { category, id } = req.params;
        const result = deleteSecret(category, id);
        saveVault(); // Guardar automáticamente
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Guardar vault manualmente
app.post('/api/vault/save', (req, res) => {
    try {
        const result = saveVault();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

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
                arsenal_nodos: API_BLOCKS,
                pasaporte_maestro: PASAPORTE_MAESTRO,
                instrucciones: "Agrega los secretos RSA_4096_PRIVADA y SISTEMA_TOKEN_LISTA en el panel de Secrets"
            });
        }
        
        const tokenSoberano = generarTokenSoberano();
        const resultadoAdquisicion = revisarAdquisicion(tokenSoberano); 

        res.json({
            status: "PROTOCOLO_APROBADO", master_seal: THRONE_SEAL_SHA256, diplomat_seal: DIPLOMAT_SEAL_SHA256,
            token_soberano: tokenSoberano, cesium_token: CESIUM_TOKEN, ecc_public_key: ECC_KEY_PUBLIC,
            nodos_cargados: API_BLOCKS.length, arsenal_nodos: API_BLOCKS, adquisicion_status: resultadoAdquisicion,
            pasaporte_maestro: PASAPORTE_MAESTRO 
        });
    } catch (e) {
        console.error("ERROR de firma RSA (Verifique Secret):", e.message);
        console.warn("Cambiando a MODO DEMO debido a error de clave RSA");
        res.json({
            status: "MODO_DEMO",
            message: "La clave RSA tiene un formato inválido. Funcionando en modo DEMO.",
            master_seal: THRONE_SEAL_SHA256, 
            diplomat_seal: DIPLOMAT_SEAL_SHA256,
            token_soberano: "DEMO_MODE",
            cesium_token: CESIUM_TOKEN,
            nodos_cargados: API_BLOCKS.length,
            arsenal_nodos: API_BLOCKS,
            pasaporte_maestro: PASAPORTE_MAESTRO,
            instrucciones: "Verifica que RSA_4096_PRIVADA sea una clave PEM válida con saltos de línea correctos"
        });
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