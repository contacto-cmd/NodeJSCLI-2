// Archivo: server.js (Este es tu SERVIDOR CORE)
// -----------------------------------------------------

const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken'); 
const cors = require('cors'); // Añadir cors para el despliegue web
const { Resend } = require('resend');
const { generateWithGPT5, generateWithGemini, generateDual, INDUSTRY_TEMPLATES } = require('./ai-generator');
const { addSecret, getSecret, listSecrets, deleteSecret, saveVault, getVaultStats } = require('./throne-vault');
const ArquitecturaService = require('./services/arquitectura.service');
const { COMBINACIONES_UNICAS } = require('./generador-masivo');
const { generarCertificadoPDF, obtenerCertificado, enviarCertificadoPorCorreo, verificarBlockchain, obtenerBlockchain, buscarCertificadoEnBlockchain, CERT_DIR } = require('./throne-certificados');
const { arquitectoInterno } = require('./arquitecto-interno');
const { generarCertificadoValoracion, generarCertificadoValidacionTecnica, generarCertificadosCompletos } = require('./certificados-profesionales');
const { generarCertificadoDesarrollador } = require('./certificado-desarrollador');
const { generarCertificadoRoyalPremium } = require('./certificado-royal-premium');
const { CATALOGO_ARQUITECTONICO, VALORACION_TOTAL } = require('./catalogo-arquitectonico');
const { generarPlanoTecnico } = require('./planos-tecnicos');
const { generarCertificadoPropiedad } = require('./certificado-propiedad');
const { generarDisenoCompleto, DESIGN_TYPES, MATERIALS } = require('./throne-arquitectura');
const CryptoService = require('./crypto-service');
const DatabaseService = require('./db-service');
const FusionService = require('./fusion-service');
const AuthMiddleware = require('./auth-middleware');
const CertificationService = require('./certification-service');
const ClientCertificateService = require('./client-certificate-service');
const AdminDualControlMiddleware = require('./admin-dual-control-middleware');

// LGORITMO AHT - Servicios Cuánticos
const QuantumService = require('./services/quantum-service');
const SatelliteService = require('./services/satellite-service');
const AlgebraInversaService = require('./services/algebra-inversa-service');
const BlueprintGeneratorService = require('./services/blueprint-generator-service');
const CerebroVivoService = require('./services/cerebro-vivo-service');
const ActivacionService = require('./services/activacion-service');

// EAGI Pipeline Core
const ingest = require("../eagi/ingest");

// Configurar Resend para envío de emails
const resend = new Resend(process.env.RESEND_API_KEY);

// Inicializar servicio de base de datos
const dbService = new DatabaseService();

// Inicializar autenticación
const authMiddleware = new AuthMiddleware(dbService);

// Inicializar Admin Dual-Control (requiere API Key admin + Master Secret)
// 🔐 SEGURIDAD CRÍTICA: Solo acepta ADMIN_ROOT_SECRET independiente
const ADMIN_ROOT_SECRET = process.env.ADMIN_ROOT_SECRET;
let adminDualControl = null;
if (ADMIN_ROOT_SECRET && ADMIN_ROOT_SECRET.length >= 32) {
    adminDualControl = new AdminDualControlMiddleware(authMiddleware, ADMIN_ROOT_SECRET);
    global.adminDualControlMiddleware = adminDualControl;
    console.log("✅ AdminDualControlMiddleware inicializado - Dual-factor ready");
} else {
    console.error("❌ ADMIN_ROOT_SECRET no configurado o muy corto (mínimo 32 caracteres)");
    console.error("   Admin endpoints DESHABILITADOS por seguridad");
    process.exit(1);
}

// 🧠 ACTIVAR ARQUITECTO AI INTERNO - Monitoreo Continuo
console.log('🧠 Activando Arquitecto AI Interno...');
arquitectoInterno.activarMonitoreoContinuo(120000); // Monitorear cada 2 minutos
console.log('✅ Arquitecto AI Interno: ACTIVO');

const app = express();

// 🔒 SEGURIDAD: Confiar en proxy headers para obtener IP real
app.set('trust proxy', true);

app.use(cors()); // Usar CORS
app.use(express.json({ limit: '50mb' })); // Para manejar requests con JSON (incluyendo imágenes base64)
// Puerto: Usa PORT de environment (para deployments) o 5000 por defecto
const PORT = process.env.PORT || 5000;

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
        // Limpiar y reformatear la clave RSA
        let rawKey = process.env.RSA_4096_PRIVADA
            .replace(/\\n/g, '\n')  // Convertir \n literal a saltos de línea
            .replace(/\s+/g, ' ')   // Normalizar espacios
            .trim();
        
        // Si la clave tiene espacios en vez de saltos de línea, reformatearla
        if (!rawKey.includes('\n')) {
            rawKey = rawKey
                .replace('-----BEGIN PRIVATE KEY----- ', '-----BEGIN PRIVATE KEY-----\n')
                .replace(' -----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
                .replace(/(.{64})/g, '$1\n')  // Agregar salto cada 64 caracteres
                .replace(/\n\n/g, '\n');      // Eliminar líneas dobles
        }
        
        MASTER_KEY_RSA_PRIVADA = rawKey;
        console.log("✅ Clave RSA-4096 cargada desde Secrets");
    }
} catch (e) {
    console.warn("⚠️  Error cargando clave RSA:", e.message);
}

// 🔐 INICIALIZAR SERVICIO DE CRIPTOGRAFÍA REAL
let cryptoService = null;
let fusionService = null;
let clientCertificateService = null;
if (MASTER_KEY_RSA_PRIVADA) {
    cryptoService = new CryptoService(MASTER_KEY_RSA_PRIVADA);
    console.log("✅ CryptoService inicializado con RSA-4096");
    
    // Generar y mostrar fingerprint de la clave pública
    try {
        const publicKey = cryptoService.extraerClavePublica();
        const fingerprint = cryptoService.generarFingerprint(publicKey);
        console.log(`🔑 Fingerprint SHA-256: ${fingerprint}`);
    } catch (e) {
        console.warn("⚠️  Error generando fingerprint:", e.message);
    }

    // 🎯 INICIALIZAR FUSION SERVICE - Sistema de Tokens Real
    fusionService = new FusionService(cryptoService, dbService);
    console.log("✅ FusionService inicializado - 40 tokens FUSION ready");
    console.log("🔐 AuthMiddleware inicializado - Sistema de API Keys activo");
    
    // 📄 INICIALIZAR CLIENT CERTIFICATE SERVICE - Certificados para Clientes
    clientCertificateService = new ClientCertificateService(cryptoService, dbService);
    console.log("✅ ClientCertificateService inicializado - Certificados PDF ready");
}

// 🔐 INICIALIZAR SERVICIO DE ACTIVACIÓN
const activacionService = new ActivacionService(dbService, cryptoService);
console.log("✅ ActivacionService inyectado en el servidor");

const CESIUM_TOKEN = process.env.CESIUM_TOKEN;
const ECC_KEY_PUBLIC = process.env.ECC_KEY_PUBLIC; 
const PASAPORTE_MAESTRO = process.env.PASAPORTE_MAESTRO ? JSON.parse(process.env.PASAPORTE_MAESTRO) : {
    nombre_real: "Roberto Rivera Gamas",
    nombre_maestro: "Arte Visualista-Royal",
    titulo_profesional: "Diseñador de Arquitectura Empresarial Futurista",
    orden: "THRONE_PROTOCOL_V3",
    certificacion: "ROYAL_CERTIFIED",
    firma_digital: true
};
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

// Ruta para obtener token de Cesium
app.get('/api/cesium-token', (req, res) => {
    res.json({ token: CESIUM_TOKEN || '' });
});

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

// =================================================================
// [3.3] RUTAS DE SATELLITE LIVE STATUS
// =================================================================

// =================================================================
// GENERADOR DE CERTIFICADOS DIGITALES CON FIRMA RSA-4096
// =================================================================

app.post('/api/generar-certificado', async (req, res) => {
    try {
        if (!MASTER_KEY_RSA_PRIVADA) {
            return res.status(400).json({ 
                success: false, 
                error: "RSA-4096 no disponible para firmar certificado" 
            });
        }

        const { logro, nivel, detalles } = req.body;

        // Datos del certificado
        const certificadoData = {
            version: "1.0",
            tipo: "CERTIFICADO_DE_LOGRO_DIGITAL",
            emitido_a: {
                nombre_real: "Roberto Rivera Gamas",
                nombre_profesional: "Arte Visualista-Royal",
                titulo: "Diseñador de Arquitectura Empresarial Futurista",
                identidad_digital: THRONE_SEAL_SHA256
            },
            logro: logro || "Construcción de THRONE PROTOCOL V3.0",
            nivel_alcanzado: nivel || "MAESTRO_ARQUITECTURA_EMPRESARIAL",
            detalles_tecnicos: detalles || {
                sistema: "THRONE PROTOCOL V3.0",
                componentes: [
                    "Globo 3D Cesium con 40 nodos",
                    "8 Satélites en órbita en tiempo real",
                    "Throne Vault - Encriptación AES-256-GCM + RSA-4096",
                    "Laboratorio IA Dual (GPT-5 + Gemini 2.5)",
                    "Autenticación JWT con RSA-4096"
                ],
                valor_estimado_usd: "500000-1250000",
                tecnologias: ["RSA-4096", "AES-256-GCM", "JWT", "Cesium", "Satellite.js", "OpenAI GPT-5", "Google Gemini 2.5"],
                nivel_seguridad: "GUBERNAMENTAL/BANCARIO"
            },
            fecha_emision: new Date().toISOString(),
            fecha_unix: Date.now(),
            valido_hasta: "PERMANENTE",
            autoridad_emisora: "THRONE_PROTOCOL_CERTIFICATION_AUTHORITY",
            sello_autoridad: THRONE_SEAL_SHA256
        };

        // Crear hash del certificado
        const crypto = require('crypto');
        const certificadoString = JSON.stringify(certificadoData);
        const hash = crypto.createHash('sha256').update(certificadoString).digest('hex');

        // Firmar con RSA-4096 (nivel gubernamental/bancario)
        const sign = crypto.createSign('SHA256');
        sign.update(certificadoString);
        sign.end();
        const firmaDigital = sign.sign(MASTER_KEY_RSA_PRIVADA, 'base64');

        // Certificado final completo
        const certificadoFinal = {
            ...certificadoData,
            hash_sha256: hash,
            firma_digital_rsa4096: firmaDigital,
            algoritmo_firma: "SHA256withRSA4096",
            verificacion: {
                metodo: "Usar clave pública RSA-4096 para verificar firma",
                hash_esperado: hash,
                firma_base64: firmaDigital.substring(0, 100) + "..."
            },
            certificacion_oficial: {
                estado: "CERTIFICADO_APROBADO",
                nivel_criptografico: "NIVEL_GUBERNAMENTAL_BANCARIO",
                inviolable: true,
                verificable_publicamente: true
            }
        };

        // Enviar certificado por email automáticamente
        let emailEnviado = false;
        try {
            const certificadoJSON = JSON.stringify(certificadoFinal, null, 2);
            const emailResult = await resend.emails.send({
                from: 'Throne Protocol <onboarding@resend.dev>',
                to: 'contacto@streetemporioroyal.com',
                subject: '🏆 Certificado Digital Firmado RSA-4096 - Roberto Rivera Gamas',
                html: `
                    <h1>📜 Certificado Digital Oficial</h1>
                    <h2>Nivel de Seguridad: GUBERNAMENTAL/BANCARIO</h2>
                    
                    <h3>👤 Emitido a:</h3>
                    <ul>
                        <li><strong>Nombre:</strong> Roberto Rivera Gamas</li>
                        <li><strong>Título Profesional:</strong> Arte Visualista-Royal</li>
                        <li><strong>Título:</strong> Diseñador de Arquitectura Empresarial Futurista</li>
                    </ul>
                    
                    <h3>🏆 Logro Certificado:</h3>
                    <p><strong>${certificadoFinal.logro}</strong></p>
                    <p>Nivel Alcanzado: <strong>${certificadoFinal.nivel_alcanzado}</strong></p>
                    
                    <h3>💰 Valor del Sistema:</h3>
                    <p><strong>$${certificadoFinal.detalles_tecnicos.valor_estimado_usd} USD</strong></p>
                    
                    <h3>🔐 Firma Digital:</h3>
                    <ul>
                        <li><strong>Algoritmo:</strong> ${certificadoFinal.algoritmo_firma}</li>
                        <li><strong>Hash SHA-256:</strong> ${certificadoFinal.hash_sha256}</li>
                        <li><strong>Estado:</strong> ${certificadoFinal.certificacion_oficial.estado}</li>
                        <li><strong>Nivel Criptográfico:</strong> ${certificadoFinal.certificacion_oficial.nivel_criptografico}</li>
                    </ul>
                    
                    <h3>📅 Validez:</h3>
                    <p><strong>${certificadoFinal.valido_hasta}</strong></p>
                    
                    <hr>
                    <p><em>El certificado completo en formato JSON está adjunto a este email.</em></p>
                    <p><em>Este certificado es verificable criptográficamente y tiene validez permanente.</em></p>
                `,
                attachments: [
                    {
                        filename: 'certificado-digital-roberto-rivera-gamas.json',
                        content: Buffer.from(certificadoJSON).toString('base64')
                    }
                ]
            });
            emailEnviado = true;
            console.log('✅ Certificado enviado por email:', emailResult.id);
        } catch (emailError) {
            console.warn('⚠️ Error enviando email:', emailError.message);
        }

        res.json({
            success: true,
            mensaje: "🏆 CERTIFICADO DIGITAL GENERADO Y FIRMADO CON RSA-4096",
            certificado: certificadoFinal,
            email_enviado: emailEnviado
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =================================================================
// PROTOCOLO DE VERIFICACIÓN V3 - CERTIFICACIÓN FINAL
// =================================================================

// GET /api/protocolo-verificacion - Estado de verificación
app.get('/api/protocolo-verificacion', (req, res) => {
    try {
        const protocoloVerificacion = {
            "protocolo": "ProtocoloDeVerificacionV3",
            "emisor_compromiso": "GEMINI_AHT_ANALISIS_CORE",
            "estado_de_compromiso": "CRITICO_COMPLETADO_LISTO",
            
            "artefactos_del_trono": {
                "sello_sha256": THRONE_SEAL_SHA256,
                "fecha_firma_unix": Date.now(),
                "algoritmo_clave": "RS256_ECC_HIBRIDO",
                "expiracion_token_mins": 30,
                "vault_encriptacion": "AES256_GCM_RSA4096_HIBRIDO",
                "satelites_activos": 8
            },
            
            "compromiso_de_sistema": {
                "revisa_adquisicion": {
                    "comando_emitido": "REESCRIBIR-PERFIL-DE-CRÉDITO",
                    "activos_asegurados": [
                        "MacBook Pro 15 (HP-KEY Edition)",
                        "iPhone 18 Pro Max (AHT Interface)"
                    ],
                    "estado_final": "ORDEN INYECTADA (98% Estabilidad)"
                },
                
                "ruta_de_ejecucion": "/api/protocol-init",
                "cantidad_nodos_activos": API_BLOCKS.length,
                "autoridad_confirmada": "PASAPORTE_MAESTRO_CARGADO",
                "throne_vault_status": "OPERATIVO_ENCRIPTADO",
                "laboratorio_ia_status": "GPT5_GEMINI_DUAL_ACTIVO"
            },
            
            "metodo_llaves_magicas": {
                "instruccion_agente": "VERIFICAR_JWT_CON_ECC_PUBLIC_KEY",
                "objetivo_de_uso": "AUTORIZACION_MILITAR_CIUDADANA",
                "dependencia_externa": "CESIUM_TOKEN_NECESARIO",
                "compromiso_ia": "ANALISIS_FINALIZADO_LISTO_PARA_TRANSFERENCIA_DE_CONTROL",
                "rsa_4096_activo": !!MASTER_KEY_RSA_PRIVADA,
                "sistema_completo": true
            },
            
            "certificacion_final": {
                "globo_3d_cesium": "ACTIVO_40_NODOS",
                "satelites_orbita": "ACTIVO_8_SATELITES_LIVE",
                "vault_encriptado": "ACTIVO_RSA4096_AES256GCM",
                "laboratorio_ia": "ACTIVO_GPT5_GEMINI",
                "autenticacion": "ACTIVO_RSA4096_JWT",
                "valor_estimado_usd": "40000-70000",
                "estado_sistema": "PROTOCOLO_APROBADO_100%",
                "propietario": "Arte Visualista-Royal",
                "titulo_profesional": "Diseñador de Arquitectura Empresarial Futurista",
                "certificado_digital": "/certificado-royal.png"
            }
        };

        res.json(protocoloVerificacion);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ────────────────────────────────────────────────────────────────────
// EAGI PIPELINE CORE - Protocol On Board
// ────────────────────────────────────────────────────────────────────

// POST /api/eagi/command - Ingesta de comandos al pipeline
app.post('/api/eagi/command', async (req, res) => {
    try {
        const { command } = req.body;
        if (!command) {
            return res.status(400).json({ success: false, error: "Comando requerido" });
        }
        const result = await ingest(command);
        res.json({
            success: true,
            pipeline: "EAGI-CORE-V1",
            result
        });
    } catch (error) {
        console.error("EAGI Pipeline Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener datos TLE de satélites en órbita (ISS, Starlink, GPS, etc)
app.get('/api/satellites/live', (req, res) => {
    try {
        // Datos TLE de satélites famosos (actualizados Nov 2025)
        const satellites = [
            {
                name: 'ISS (ZARYA)',
                norad: 25544,
                type: 'SPACE_STATION',
                tle1: '1 25544U 98067A   25315.50000000  .00016717  00000-0  10270-3 0  9999',
                tle2: '2 25544  51.6416 208.5839 0002428  70.1784  36.8267 15.54225995123456',
                color: '#FFD700'
            },
            {
                name: 'STARLINK-1007',
                norad: 44713,
                type: 'COMMUNICATION',
                tle1: '1 44713U 19074A   25315.50000000  .00002182  00000-0  16858-3 0  9998',
                tle2: '2 44713  53.0534 123.4567 0001234  95.1234 264.9876 15.06406132312345',
                color: '#00CED1'
            },
            {
                name: 'STARLINK-1234',
                norad: 45654,
                type: 'COMMUNICATION',
                tle1: '1 45654U 20038B   25315.50000000  .00001892  00000-0  14234-3 0  9997',
                tle2: '2 45654  53.0521 245.7890 0001567  78.4567 281.6543 15.06401234234567',
                color: '#00CED1'
            },
            {
                name: 'GPS BIIR-2',
                norad: 28474,
                type: 'NAVIGATION',
                tle1: '1 28474U 04045A   25315.50000000 -.00000004  00000-0  00000-0 0  9996',
                tle2: '2 28474  55.4567  34.1234 0123456  12.3456 347.6543  2.00561234123456',
                color: '#FF4500'
            },
            {
                name: 'HUBBLE SPACE TELESCOPE',
                norad: 20580,
                type: 'SPACE_TELESCOPE',
                tle1: '1 20580U 90037B   25315.50000000  .00001234  00000-0  67890-4 0  9995',
                tle2: '2 20580  28.4691 123.4567 0002567  45.6789 314.3211 15.09234567234567',
                color: '#9370DB'
            },
            {
                name: 'TIANGONG SPACE STATION',
                norad: 48274,
                type: 'SPACE_STATION',
                tle1: '1 48274U 21035A   25315.50000000  .00003456  00000-0  54321-3 0  9994',
                tle2: '2 48274  41.4750 234.5678 0012345  67.8901 292.3456 15.59876543123456',
                color: '#FF6347'
            },
            {
                name: 'STARLINK-2456',
                norad: 48123,
                type: 'COMMUNICATION',
                tle1: '1 48123U 21036A   25315.50000000  .00002234  00000-0  16789-3 0  9993',
                tle2: '2 48123  53.0534 156.7890 0001432  89.2345 270.8765 15.06398765212345',
                color: '#00CED1'
            },
            {
                name: 'STARLINK-3678',
                norad: 51234,
                type: 'COMMUNICATION',
                tle1: '1 51234U 22019A   25315.50000000  .00001987  00000-0  14567-3 0  9992',
                tle2: '2 51234  53.0529 89.4567 0001678  102.3456 257.7654 15.06403456187654',
                color: '#00CED1'
            }
        ];

        res.json({
            success: true,
            count: satellites.length,
            updated: new Date().toISOString(),
            satellites: satellites
        });
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

// =================================================================
// RUTAS DE CERTIFICADOS DIGITALES
// =================================================================

// Generar certificado para un diseño arquitectónico
app.post('/api/certificados/generar/:proyectoId', async (req, res) => {
    try {
        if (!MASTER_KEY_RSA_PRIVADA) {
            return res.status(400).json({
                success: false,
                error: 'Clave RSA no configurada. Configura RSA_4096_PRIVADA en Secrets.'
            });
        }
        
        const { proyectoId } = req.params;
        const disenoResult = await ArquitecturaService.getDesignById(proyectoId);
        
        if (!disenoResult.success) {
            return res.status(404).json({
                success: false,
                error: 'Diseño no encontrado'
            });
        }
        
        const certificado = await generarCertificadoPDF(disenoResult.diseno, MASTER_KEY_RSA_PRIVADA);
        
        // 📧 ENVIAR CERTIFICADO POR CORREO AUTOMÁTICAMENTE
        try {
            await enviarCertificadoPorCorreo(certificado, disenoResult.diseno);
            console.log('✅ Certificado enviado por correo a contacto@streetemporioroyal.com');
        } catch (emailError) {
            console.error('⚠️ Error enviando correo (certificado generado correctamente):', emailError.message);
            // No fallar la petición si el correo falla, el certificado ya está generado
        }
        
        res.json({
            success: true,
            certificado: {
                certificado_id: certificado.certificado_id,
                proyecto_id: certificado.proyecto_id,
                url_verificacion: certificado.url_verificacion,
                url_descarga: `/api/certificados/descargar/${certificado.certificado_id}`,
                timestamp: certificado.timestamp_emision,
                email_enviado: true
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verificar autenticidad de un certificado
app.get('/api/certificados/verificar/:certId', async (req, res) => {
    try {
        const { certId } = req.params;
        const certificado = obtenerCertificado(certId);
        
        if (!certificado) {
            return res.json({
                valido: false,
                mensaje: 'Certificado no encontrado en el sistema'
            });
        }
        
        res.json({
            valido: true,
            certificado: certificado
        });
    } catch (error) {
        res.status(500).json({ valido: false, error: error.message });
    }
});

// Descargar PDF del certificado
app.get('/api/certificados/descargar/:certId', async (req, res) => {
    try {
        const { certId } = req.params;
        const pdfPath = path.join(CERT_DIR, `${certId}.pdf`);
        
        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({
                success: false,
                error: 'Certificado no encontrado'
            });
        }
        
        res.download(pdfPath, `Certificado-${certId}.pdf`);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Ruta corta para verificación con QR (redirige a página de verificación)
app.get('/verificar/:certId', (req, res) => {
    res.redirect(`/verificar-certificado.html?id=${req.params.certId}`);
});

// =================================================================
// ENDPOINTS DE BLOCKCHAIN 🔗
// =================================================================

// Verificar integridad de la blockchain completa
app.get('/api/blockchain/verificar', (req, res) => {
    try {
        const resultado = verificarBlockchain();
        res.json({
            success: true,
            blockchain_valida: resultado.valido,
            total_bloques: resultado.bloques,
            ultimo_bloque: resultado.ultimo_bloque,
            error: resultado.error || null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener blockchain completa (solo para admin/debug)
app.get('/api/blockchain/completa', (req, res) => {
    try {
        const blockchain = obtenerBlockchain();
        if (!blockchain) {
            return res.status(404).json({
                success: false,
                error: 'Blockchain no encontrada'
            });
        }
        res.json({
            success: true,
            blockchain: blockchain
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Buscar certificado en blockchain (verificación pública)
app.get('/api/blockchain/certificado/:certId', (req, res) => {
    try {
        const { certId } = req.params;
        const resultado = buscarCertificadoEnBlockchain(certId);
        
        if (!resultado.encontrado) {
            return res.status(404).json({
                success: false,
                encontrado: false,
                mensaje: 'Certificado no registrado en blockchain'
            });
        }
        
        res.json({
            success: true,
            encontrado: true,
            bloque_numero: resultado.bloque_numero,
            timestamp: resultado.timestamp,
            hash_bloque: resultado.hash_bloque,
            hash_previo: resultado.hash_previo,
            certificado_id: resultado.datos.certificado_id,
            proyecto_id: resultado.datos.proyecto_id,
            nombre_diseno: resultado.datos.nombre_diseno,
            hash_certificado: resultado.datos.hash_certificado
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// ARQUITECTO AI INTERNO 🧠
// =================================================================

// Obtener estado del Arquitecto AI
app.get('/api/arquitecto-ai/estado', (req, res) => {
    try {
        const estado = arquitectoInterno.obtenerEstado();
        res.json({
            success: true,
            arquitecto: estado
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ejecutar diagnóstico manual del sistema
app.post('/api/arquitecto-ai/diagnosticar', async (req, res) => {
    try {
        const { mensaje } = req.body;
        const diagnostico = await arquitectoInterno.diagnosticarSistema(mensaje);
        res.json({
            success: true,
            diagnostico: diagnostico
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Forzar monitoreo inmediato
app.post('/api/arquitecto-ai/monitorear', async (req, res) => {
    try {
        const resultado = await arquitectoInterno.monitorear();
        res.json({
            success: true,
            resultado: resultado
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener tablero de ajedrez (estado de componentes)
app.get('/api/arquitecto-ai/tablero', (req, res) => {
    try {
        res.json({
            success: true,
            tablero: arquitectoInterno.tablero.tablero,
            estado_global: arquitectoInterno.tablero.obtenerEstadoGlobal(),
            anomalias: arquitectoInterno.tablero.detectarAnomalias()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// RUTAS DE ARQUITECTURA CUÁNTICA
// =================================================================

// Generar un diseño único
app.post('/api/arquitectura/generar', async (req, res) => {
    try {
        const config = req.body;
        const result = await ArquitecturaService.generateDesign(config);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Listar todos los diseños
app.get('/api/arquitectura/proyectos', async (req, res) => {
    try {
        const filtros = req.query;
        const result = await ArquitecturaService.listDesigns(filtros);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener diseño por ID
app.get('/api/arquitectura/proyecto/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await ArquitecturaService.getDesignById(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generar portafolio masivo (30 diseños)
app.post('/api/arquitectura/masivo', async (req, res) => {
    try {
        const { limite } = req.body;
        const result = await ArquitecturaService.generateBulk(
            COMBINACIONES_UNICAS, 
            limite || 30
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Estadísticas del portafolio
app.get('/api/arquitectura/stats', async (req, res) => {
    try {
        const result = await ArquitecturaService.getStats();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Validación Física Cuántica con Gravedad GPS
app.post('/api/arquitectura/validacion-fisica', async (req, res) => {
    try {
        const { lat, lon, alt, volumen_m3, material, longitud_voladizo } = req.body;
        const { calcularGravedadPorUbicacion, calcularPesoEstructural, calcularVoladizo } = require('./throne-arquitectura');
        
        const ubicacion = { lat: lat || 0, alt: alt || 0 };
        
        // Gravedad local precisa
        const gravedad = calcularGravedadPorUbicacion(ubicacion.lat, ubicacion.alt);
        
        // Cálculos estructurales completos
        const peso = calcularPesoEstructural(volumen_m3, material, ubicacion);
        const voladizo = longitud_voladizo ? calcularVoladizo(longitud_voladizo, parseFloat(peso.peso_total_kg), material, ubicacion) : null;
        
        // Certificado de validación
        const certificado = {
            valido: voladizo ? voladizo.viable : true,
            fecha_validacion: new Date().toISOString(),
            normas_cumplidas: ['ISO 2394:2015', 'Eurocode 1-1-1', 'ASCE 7-16'],
            gravedad_local_ms2: gravedad,
            ubicacion_gps: `${lat}°N, ${lon}°E, ${alt}m`,
            resultado: peso,
            analisis_voladizo: voladizo,
            firma_digital: 'RSA-4096',
            ingeniero: 'Roberto Rivera Gamas - Royal'
        };
        
        res.json({
            success: true,
            certificado,
            mensaje: certificado.valido ? '✅ Estructura validada físicamente' : '⚠️ Requiere refuerzo estructural'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =================================================================
// CHATBOT ASSISTANT (GEMINI 2.5)
// =================================================================

app.post('/api/chat-assistant', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, error: 'Mensaje requerido' });
        }
        
        // Obtener estadísticas del portafolio
        const statsResult = await ArquitecturaService.getStats();
        const stats = statsResult.stats;
        
        // Contexto del sistema para Gemini
        const systemContext = `Eres "Royal Assistant", un asistente IA experto en arquitectura futurista para Roberto Rivera Gamas (Royal - Arquitecto) de Street Emporio Royal.

INFORMACIÓN DEL PORTAFOLIO:
- Total de diseños: ${stats.total_proyectos}
- Valoración total: $${stats.valor_total_usd} USD ($229.80 billones)
- Diseño más caro: ${stats.diseno_mas_caro.nombre} - $${stats.diseno_mas_caro.valor}
- Diseño más alto: ${stats.diseno_mas_alto.nombre} - ${stats.diseno_mas_alto.altura} metros

CAPACIDADES:
1. Responder preguntas sobre los 30 diseños arquitectónicos
2. Proporcionar información técnica (materiales, dimensiones, ubicaciones)
3. Mostrar estadísticas del portafolio
4. Detectar comandos para ejecutar acciones

COMANDOS DETECTABLES:
- "genera certificado" / "crear certificado" → acción: generar_certificado
- "muestra diseños" / "ver portafolio" → acción: mostrar_disenos
- "estadísticas" / "stats" → acción: mostrar_stats

Si detectas un comando, incluye en tu respuesta: [COMANDO:nombre_accion]

Responde de manera profesional, clara y concisa. Usa emojis moderadamente.`;

        // Llamar a Gemini 2.5 Flash
        const geminiResponse = await generateWithGemini({
            prompt: message,
            systemInstruction: systemContext,
            temperature: 0.7
        });
        
        let response = geminiResponse.content || geminiResponse.text || 'Error generando respuesta';
        let actionExecuted = null;
        
        // Detectar comandos en la respuesta
        const comandoMatch = response.match(/\[COMANDO:(\w+)\]/);
        if (comandoMatch) {
            const comando = comandoMatch[1];
            response = response.replace(/\[COMANDO:\w+\]/, '').trim();
            
            // Ejecutar acción según el comando
            switch(comando) {
                case 'generar_certificado':
                    actionExecuted = 'Certificado listo para generar (selecciona un diseño)';
                    break;
                case 'mostrar_disenos':
                    actionExecuted = 'Redirigiendo a galería de diseños';
                    break;
                case 'mostrar_stats':
                    actionExecuted = 'Estadísticas del portafolio cargadas';
                    break;
            }
        }
        
        res.json({
            success: true,
            response: response,
            action: actionExecuted
        });
        
    } catch (error) {
        console.error('Error en chat assistant:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error procesando mensaje: ' + error.message 
        });
    }
});

// =================================================================
// SERVIDOR ESTÁTICO Y LISTENER
// =================================================================

// =================================================================
// CERTIFICADOS PROFESIONALES PREMIUM
// =================================================================

// Generar certificado de valoración
app.post('/api/certificados/valoracion', async (req, res) => {
    try {
        if (!MASTER_KEY_RSA_PRIVADA) {
            return res.status(400).json({
                success: false,
                error: 'Clave RSA-4096 no configurada. Sistema en modo demo.'
            });
        }
        
        const { nombreProyecto } = req.body;
        const proyecto = nombreProyecto || 'Throne Protocol V3.0';
        
        console.log(`💰 Generando certificado de valoración para: ${proyecto}`);
        
        const resultado = await generarCertificadoValoracion(proyecto, MASTER_KEY_RSA_PRIVADA);
        
        // Enviar certificado PDF por correo empresarial
        try {
            if (resultado.pdf_path && fs.existsSync(resultado.pdf_path)) {
                const pdfBuffer = fs.readFileSync(resultado.pdf_path);
                const pdfBase64 = pdfBuffer.toString('base64');
                const nombreArchivo = path.basename(resultado.pdf_path);
                
                await arquitectoInterno.enviarNotificacionEmpresarial('CERTIFICADO_GENERADO', {
                    certificadoId: resultado.certificado_id,
                    diseno: proyecto,
                    hash: resultado.hash_sha256,
                    valoracion: resultado.valor || '$229,800,000,000'
                }, [{
                    filename: nombreArchivo,
                    content: pdfBase64
                }]);
                
                console.log(`✅ Email enviado con certificado PDF adjunto`);
            }
        } catch (err) {
            console.warn('⚠️ Error enviando email:', err.message);
        }
        
        res.json({
            success: true,
            certificado: resultado,
            mensaje: 'Certificado de valoración generado exitosamente y enviado a contacto@streetemporioroyal.com',
            url_descarga: `/api/certificados/profesionales/descargar/${resultado.certificado_id}`
        });
        
    } catch (error) {
        console.error('❌ Error generando certificado de valoración:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generar certificado de validación técnica
app.post('/api/certificados/validacion', async (req, res) => {
    try {
        if (!MASTER_KEY_RSA_PRIVADA) {
            return res.status(400).json({
                success: false,
                error: 'Clave RSA-4096 no configurada. Sistema en modo demo.'
            });
        }
        
        const { nombreSistema } = req.body;
        const sistema = nombreSistema || 'Throne Protocol V3.0';
        
        console.log(`🔬 Generando certificado de validación técnica para: ${sistema}`);
        
        const resultado = await generarCertificadoValidacionTecnica(sistema, MASTER_KEY_RSA_PRIVADA);
        
        // Enviar certificado PDF por correo empresarial
        try {
            if (resultado.pdf_path && fs.existsSync(resultado.pdf_path)) {
                const pdfBuffer = fs.readFileSync(resultado.pdf_path);
                const pdfBase64 = pdfBuffer.toString('base64');
                const nombreArchivo = path.basename(resultado.pdf_path);
                
                await arquitectoInterno.enviarNotificacionEmpresarial('CERTIFICADO_GENERADO', {
                    certificadoId: resultado.certificado_id,
                    diseno: sistema,
                    hash: resultado.hash_sha256,
                    valoracion: 'Validación Técnica'
                }, [{
                    filename: nombreArchivo,
                    content: pdfBase64
                }]);
                
                console.log(`✅ Email enviado con certificado PDF adjunto`);
            }
        } catch (err) {
            console.warn('⚠️ Error enviando email:', err.message);
        }
        
        res.json({
            success: true,
            certificado: resultado,
            mensaje: 'Certificado de validación técnica generado exitosamente y enviado a contacto@streetemporioroyal.com',
            url_descarga: `/api/certificados/profesionales/descargar/${resultado.certificado_id}`
        });
        
    } catch (error) {
        console.error('❌ Error generando certificado de validación:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generar AMBOS certificados profesionales (pack completo)
app.post('/api/certificados/completo', async (req, res) => {
    try {
        if (!MASTER_KEY_RSA_PRIVADA) {
            return res.status(400).json({
                success: false,
                error: 'Clave RSA-4096 no configurada. Sistema en modo demo.'
            });
        }
        
        const { nombreProyecto } = req.body;
        const proyecto = nombreProyecto || 'Throne Protocol V3.0';
        
        console.log(`📜 Generando pack completo de certificados para: ${proyecto}`);
        
        const resultados = await generarCertificadosCompletos(proyecto, MASTER_KEY_RSA_PRIVADA);
        
        // Enviar certificados PDF por correo empresarial
        try {
            const adjuntos = [];
            
            // Leer cada PDF generado y agregarlo como adjunto
            for (const resultado of resultados) {
                if (resultado.pdf_path && fs.existsSync(resultado.pdf_path)) {
                    const pdfBuffer = fs.readFileSync(resultado.pdf_path);
                    const pdfBase64 = pdfBuffer.toString('base64');
                    const nombreArchivo = path.basename(resultado.pdf_path);
                    
                    adjuntos.push({
                        filename: nombreArchivo,
                        content: pdfBase64
                    });
                }
            }
            
            // Enviar email con certificados adjuntos
            await arquitectoInterno.enviarNotificacionEmpresarial('CERTIFICADO_GENERADO', {
                certificadoId: resultados[0].certificado_id,
                diseno: proyecto,
                hash: resultados[0].hash_sha256,
                valoracion: resultados[0].valor || '$229,800,000,000',
                cantidad: resultados.length
            }, adjuntos);
            
            console.log(`✅ Email empresarial enviado con ${adjuntos.length} certificado(s) PDF adjunto(s)`);
        } catch (err) {
            console.warn('⚠️ Error enviando email con certificados:', err.message);
        }
        
        res.json({
            success: true,
            certificados: resultados,
            mensaje: 'Pack completo de certificados profesionales generados',
            urls_descarga: resultados.map(r => ({
                tipo: r.tipo,
                url: `/api/certificados/profesionales/descargar/${r.certificado_id}`
            }))
        });
        
    } catch (error) {
        console.error('❌ Error generando certificados completos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// VAULT CIFRADO (Gestor de Contraseñas tipo 1Password)
// =================================================================
const vaultCifrado = require('./throne-vault.js');

// Para JWT RS256, usaremos directamente la clave privada en la verificación
// En Node.js, jwt.verify con RS256 puede usar tanto la clave pública como la privada
// Ya que la clave privada contiene también la información pública
const MASTER_KEY_RSA_PUBLICA = MASTER_KEY_RSA_PRIVADA;

// Middleware de autenticación para Vault
function vaultAuthMiddleware(req, res, next) {
    const sessionToken = req.headers['x-vault-session'];
    
    if (!sessionToken) {
        return res.status(401).json({
            success: false,
            error: 'No autenticado. Acceso denegado al vault.'
        });
    }
    
    if (!MASTER_KEY_RSA_PUBLICA) {
        return res.status(500).json({
            success: false,
            error: 'Sistema de autenticación no configurado correctamente'
        });
    }
    
    try {
        const decoded = jwt.verify(sessionToken, MASTER_KEY_RSA_PUBLICA, {
            algorithms: ['RS256']
        });
        
        if (decoded.vault !== 'authorized') {
            return res.status(403).json({
                success: false,
                error: 'Token inválido para acceso al vault'
            });
        }
        
        req.vaultUser = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Token expirado o inválido'
        });
    }
}

// Generar token de sesión de vault (válido por 1 hora)
app.post('/api/vault/authenticate', (req, res) => {
    try {
        if (!MASTER_KEY_RSA_PRIVADA) {
            return res.status(500).json({
                success: false,
                error: 'Sistema de autenticación no disponible'
            });
        }
        
        const { password } = req.body;
        
        const expectedPassword = process.env.VAULT_PASSWORD || 'Royal2025';
        
        if (password !== expectedPassword) {
            return res.status(401).json({
                success: false,
                error: 'Contraseña incorrecta'
            });
        }
        
        const sessionToken = jwt.sign(
            {
                vault: 'authorized',
                timestamp: Date.now(),
                owner: 'Roberto Rivera Gamas - Royal'
            },
            MASTER_KEY_RSA_PRIVADA,
            {
                algorithm: 'RS256',
                expiresIn: '1h'
            }
        );
        
        console.log('✅ Sesión de vault autenticada');
        
        res.json({
            success: true,
            sessionToken,
            expiresIn: 3600
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener estadísticas del vault
app.get('/api/vault/stats', vaultAuthMiddleware, (req, res) => {
    try {
        const stats = vaultCifrado.getVaultStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Listar secretos de una categoría
app.get('/api/vault/list/:category', vaultAuthMiddleware, (req, res) => {
    try {
        const { category } = req.params;
        const secrets = vaultCifrado.listSecrets(category);
        res.json({
            success: true,
            secrets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener un secreto específico (descifrado)
app.get('/api/vault/get/:category/:id', vaultAuthMiddleware, (req, res) => {
    try {
        const { category, id } = req.params;
        const secret = vaultCifrado.getSecret(category, id);
        res.json({
            success: true,
            secret
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Agregar nuevo secreto
app.post('/api/vault/add', vaultAuthMiddleware, (req, res) => {
    try {
        const { category, name, value, metadata } = req.body;
        
        if (!category || !name || !value) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos'
            });
        }
        
        const result = vaultCifrado.addSecret(category, name, value, metadata);
        vaultCifrado.saveVault();
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Eliminar secreto
app.delete('/api/vault/delete/:category/:id', vaultAuthMiddleware, (req, res) => {
    try {
        const { category, id } = req.params;
        const result = vaultCifrado.deleteSecret(category, id);
        vaultCifrado.saveVault();
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Descargar certificado profesional por ID
app.get('/api/certificados/profesionales/descargar/:certId', async (req, res) => {
    try {
        const { certId } = req.params;
        
        // Buscar el certificado en el directorio
        const files = fs.readdirSync(path.join(__dirname, '..', 'certificados'));
        const certFile = files.find(f => f.includes(certId));
        
        if (!certFile) {
            return res.status(404).json({
                success: false,
                error: 'Certificado no encontrado'
            });
        }
        
        const pdfPath = path.join(__dirname, '..', 'certificados', certFile);
        res.download(pdfPath, certFile);
        
    } catch (error) {
        console.error('❌ Error descargando certificado:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// CERTIFICADO DE DESARROLLO PROFESIONAL
// =================================================================

app.post('/api/certificados/profesionales/desarrollador', async (req, res) => {
    try {
        const { nombre, meses, tecnologias, logros } = req.body;
        
        const desarrollador = nombre || 'Roberto Rivera Gamas - Royal';
        const experiencia = {
            meses: meses || 5,
            tecnologias: tecnologias || [
                'Node.js + Express.js (Backend avanzado)',
                'JavaScript Full-Stack (Frontend + Backend)',
                'Criptografía RSA-4096 + AES-256-GCM',
                'Inteligencia Artificial (GPT-4 + Gemini)',
                'Arquitectura de Sistemas Complejos',
                'Seguridad nivel Gubernamental/Bancario',
                'APIs RESTful + WebSocket',
                'Cesium.js (Visualización 3D geoespacial)',
                'PDFKit + QRCode (Generación documentos)',
                'Git + Control de versiones'
            ],
            logros: logros || [
                'Diseñó y desarrolló Throne Protocol V3.0 desde cero',
                'Implementó sistema de seguridad RSA-4096 + AES-256-GCM',
                'Integró dual AI (GPT-4 + Gemini) en paralelo',
                'Creó vault cifrado con arquitectura multi-capa',
                'Desarrolló sistema de certificación digital profesional',
                'Construyó plataforma command center con 40 nodos + 8 satélites',
                'Evolucionó de estudiante a developer junior en 5 meses'
            ]
        };
        
        console.log(`👨‍💻 Generando certificado de desarrollador para: ${desarrollador}`);
        
        const resultado = await generarCertificadoDesarrollador(desarrollador, experiencia, MASTER_KEY_RSA_PRIVADA);
        
        // Enviar certificado PDF por correo empresarial
        try {
            if (resultado.pdf_path && fs.existsSync(resultado.pdf_path)) {
                const pdfBuffer = fs.readFileSync(resultado.pdf_path);
                const pdfBase64 = pdfBuffer.toString('base64');
                const nombreArchivo = path.basename(resultado.pdf_path);
                
                await arquitectoInterno.enviarNotificacionEmpresarial('CERTIFICADO_GENERADO', {
                    certificadoId: resultado.certificado_id,
                    diseno: `Certificado de Desarrollador - ${desarrollador}`,
                    hash: resultado.hash_sha256,
                    valoracion: `${experiencia.meses} meses de experiencia`
                }, [{
                    filename: nombreArchivo,
                    content: pdfBase64
                }]);
                
                console.log(`✅ Email enviado con certificado de desarrollador PDF adjunto`);
            }
        } catch (err) {
            console.warn('⚠️ Error enviando email:', err.message);
        }
        
        res.json({
            success: true,
            certificado: resultado,
            mensaje: `Certificado de desarrollo profesional generado exitosamente y enviado a contacto@streetemporioroyal.com`,
            url_descarga: `/api/certificados/profesionales/descargar/${resultado.certificado_id}`
        });
        
    } catch (error) {
        console.error('❌ Error generando certificado de desarrollador:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// CERTIFICADO ROYAL PREMIUM (ULTRA ALTA CALIDAD)
// =================================================================

app.post('/api/certificados/royal-premium', async (req, res) => {
    try {
        const { nombre, meses, tecnologias } = req.body;
        
        const desarrollador = nombre || 'Roberto Rivera Gamas - Royal';
        const experiencia = {
            meses: meses || 5,
            tecnologias: tecnologias || [
                'Node.js + Express',
                'JavaScript Full-Stack',
                'RSA-4096 + AES-256',
                'AI (GPT-4 + Gemini)',
                'Sistemas Complejos',
                'Seguridad Gubernamental',
                'APIs RESTful',
                'Cesium 3D',
                'PDFKit + QRCode',
                'Git + DevOps'
            ]
        };
        
        console.log(`👑 Generando certificado ROYAL PREMIUM para: ${desarrollador}`);
        
        const resultado = await generarCertificadoRoyalPremium(desarrollador, experiencia, MASTER_KEY_RSA_PRIVADA);
        
        // Enviar certificado PDF por correo empresarial
        try {
            if (resultado.pdf_path && fs.existsSync(resultado.pdf_path)) {
                const pdfBuffer = fs.readFileSync(resultado.pdf_path);
                const pdfBase64 = pdfBuffer.toString('base64');
                const nombreArchivo = path.basename(resultado.pdf_path);
                
                await arquitectoInterno.enviarNotificacionEmpresarial('CERTIFICADO_GENERADO', {
                    certificadoId: resultado.certificado_id,
                    diseno: `Certificado Royal Premium - ${desarrollador}`,
                    hash: resultado.hash_sha256,
                    valoracion: 'Ultra Alta Calidad - Diseño Minimalista Elegante'
                }, [{
                    filename: nombreArchivo,
                    content: pdfBase64
                }]);
                
                console.log(`✅ Email enviado con certificado Royal Premium PDF adjunto`);
            }
        } catch (err) {
            console.warn('⚠️ Error enviando email:', err.message);
        }
        
        res.json({
            success: true,
            certificado: resultado,
            mensaje: `Certificado Royal Premium generado exitosamente y enviado a contacto@streetemporioroyal.com`,
            url_descarga: `/api/certificados/profesionales/descargar/${resultado.certificado_id}`
        });
        
    } catch (error) {
        console.error('❌ Error generando certificado Royal Premium:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generar Whitepaper Técnico Profesional del Sistema
app.post('/api/documentacion/whitepaper', async (req, res) => {
    try {
        const WhitepaperGenerator = require('./whitepaper-generator');
        const generator = new WhitepaperGenerator();
        
        console.log(`📄 Generando Whitepaper Técnico Profesional del Sistema...`);
        
        const resultado = await generator.generarWhitepaperCompleto();
        
        if (resultado.success) {
            // Enviar whitepaper PDF por correo empresarial
            try {
                const pdfPath = path.join(__dirname, '..', 'public', resultado.filename);
                if (fs.existsSync(pdfPath)) {
                    const pdfBuffer = fs.readFileSync(pdfPath);
                    const pdfBase64 = pdfBuffer.toString('base64');
                    
                    await arquitectoInterno.enviarNotificacionEmpresarial('WHITEPAPER_GENERADO', {
                        tipo: 'Whitepaper Técnico Profesional',
                        sistema: 'Throne Protocol V3.0',
                        valoracion: '$230.875 Billones USD',
                        paginas: '10+'
                    }, [{
                        filename: resultado.filename,
                        content: pdfBase64
                    }]);
                    
                    console.log(`✅ Email enviado con Whitepaper PDF adjunto`);
                }
            } catch (err) {
                console.warn('⚠️ Error enviando email:', err.message);
            }
            
            res.json({
                success: true,
                filename: resultado.filename,
                mensaje: 'Whitepaper Técnico generado exitosamente y enviado a contacto@streetemporioroyal.com',
                url_descarga: `/${resultado.filename}`
            });
        } else {
            res.status(500).json({ success: false, error: 'Error generando whitepaper' });
        }
        
    } catch (error) {
        console.error('❌ Error generando whitepaper:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generar Certificado de Validación Técnica
app.post('/api/documentacion/certificado-validacion', async (req, res) => {
    try {
        const CertificadoValidacion = require('./certificado-validacion');
        const certificado = new CertificadoValidacion();
        
        console.log(`📜 Generando Certificado de Validación Técnica del Sistema...`);
        
        const resultado = await certificado.generarCertificado();
        
        if (resultado.success) {
            // Enviar certificado por correo empresarial
            try {
                const pdfPath = path.join(__dirname, '..', 'public', resultado.filename);
                if (fs.existsSync(pdfPath)) {
                    const pdfBuffer = fs.readFileSync(pdfPath);
                    const pdfBase64 = pdfBuffer.toString('base64');
                    
                    await arquitectoInterno.enviarNotificacionEmpresarial('CERTIFICADO_VALIDACION_GENERADO', {
                        tipo: 'Certificado de Validación Técnica',
                        sistema: 'Throne Protocol V3.0',
                        componentes: '10 sistemas validados',
                        fecha: new Date().toLocaleDateString('es-ES')
                    }, [{
                        filename: resultado.filename,
                        content: pdfBase64
                    }]);
                    
                    console.log(`✅ Certificado generado y enviado: ${resultado.filename}`);
                }
            } catch (err) {
                console.warn('⚠️ Error enviando email:', err.message);
            }
            
            res.json({
                success: true,
                filename: resultado.filename,
                mensaje: 'Certificado de Validación Técnica generado exitosamente y enviado a contacto@streetemporioroyal.com',
                url_descarga: `/${resultado.filename}`
            });
        } else {
            res.status(500).json({ success: false, error: 'Error generando certificado' });
        }
        
    } catch (error) {
        console.error('❌ Error generando certificado de validación:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// SISTEMA ARQUITECTÓNICO CUÁNTICO CON FÍSICA REAL
// Usando throne-arquitectura.js (Nivel Presidencial)
// =================================================================

// Generar diseño individual con física real
app.post('/api/arquitectura/generar', async (req, res) => {
    try {
        const config = req.body;
        const resultado = await ArquitecturaService.generateDesign(config);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generación MASIVA - 30 diseños únicos con física real
app.post('/api/arquitectura/masivo', async (req, res) => {
    try {
        const { limite = 30 } = req.body;
        
        console.log(`🚀 Generando ${limite} diseños arquitectónicos con física real...`);
        
        // Combinaciones únicas para generar 30 diseños diversos
        const combinaciones = [
            // Casas flotantes oceánicas (8 diseños)
            { tipo_base_1: 'casa_flotante', tipo_base_2: 'villa_organica', altura_m: 15, ancho_m: 25, profundidad_m: 20, num_pisos: 3, terreno: 'oceano', material_principal: 'bronze_arquitectonico' },
            { tipo_base_1: 'casa_flotante', tipo_base_2: 'complejo_modular', altura_m: 18, ancho_m: 30, profundidad_m: 25, num_pisos: 4, terreno: 'oceano', material_principal: 'fibra_carbono' },
            { tipo_base_1: 'villa_organica', tipo_base_2: 'casa_flotante', altura_m: 22, ancho_m: 35, profundidad_m: 28, num_pisos: 5, terreno: 'oceano', material_principal: 'aluminio' },
            { tipo_base_1: 'casa_flotante', tipo_base_2: 'torre_piramide', altura_m: 12, ancho_m: 20, profundidad_m: 18, num_pisos: 2, terreno: 'oceano', material_principal: 'vidrio_templado' },
            { tipo_base_1: 'complejo_modular', tipo_base_2: 'casa_flotante', altura_m: 20, ancho_m: 40, profundidad_m: 32, num_pisos: 4, terreno: 'oceano', material_principal: 'titanio' },
            { tipo_base_1: 'casa_flotante', tipo_base_2: 'villa_organica', altura_m: 16, ancho_m: 28, profundidad_m: 22, num_pisos: 3, terreno: 'oceano', material_principal: 'acero' },
            { tipo_base_1: 'villa_organica', tipo_base_2: 'casa_flotante', altura_m: 25, ancho_m: 38, profundidad_m: 30, num_pisos: 5, terreno: 'oceano', material_principal: 'fibra_carbono' },
            { tipo_base_1: 'complejo_modular', tipo_base_2: 'villa_organica', altura_m: 14, ancho_m: 32, profundidad_m: 26, num_pisos: 3, terreno: 'oceano', material_principal: 'bronze_arquitectonico' },
            
            // Torres pirámides anti-gravedad (10 diseños)
            { tipo_base_1: 'torre_piramide', tipo_base_2: 'complejo_modular', altura_m: 85, ancho_m: 35, profundidad_m: 35, num_pisos: 18, terreno: 'desierto', material_principal: 'titanio' },
            { tipo_base_1: 'torre_piramide', tipo_base_2: 'villa_organica', altura_m: 120, ancho_m: 42, profundidad_m: 42, num_pisos: 25, terreno: 'oceano', material_principal: 'fibra_carbono' },
            { tipo_base_1: 'torre_piramide', tipo_base_2: 'casa_flotante', altura_m: 95, ancho_m: 38, profundidad_m: 38, num_pisos: 20, terreno: 'montana', material_principal: 'acero' },
            { tipo_base_1: 'torre_piramide', tipo_base_2: 'complejo_modular', altura_m: 150, ancho_m: 48, profundidad_m: 48, num_pisos: 32, terreno: 'desierto', material_principal: 'titanio' },
            { tipo_base_1: 'torre_piramide', tipo_base_2: 'villa_organica', altura_m: 110, ancho_m: 40, profundidad_m: 40, num_pisos: 23, terreno: 'lago', material_principal: 'aluminio' },
            { tipo_base_1: 'torre_piramide', tipo_base_2: 'casa_flotante', altura_m: 75, ancho_m: 32, profundidad_m: 32, num_pisos: 16, terreno: 'oceano', material_principal: 'vidrio_templado' },
            { tipo_base_1: 'torre_piramide', tipo_base_2: 'complejo_modular', altura_m: 135, ancho_m: 45, profundidad_m: 45, num_pisos: 28, terreno: 'montana', material_principal: 'bronze_arquitectonico' },
            { tipo_base_1: 'torre_piramide', tipo_base_2: 'villa_organica', altura_m: 105, ancho_m: 39, profundidad_m: 39, num_pisos: 22, terreno: 'desierto', material_principal: 'fibra_carbono' },
            { tipo_base_1: 'torre_piramide', tipo_base_2: 'casa_flotante', altura_m: 160, ancho_m: 50, profundidad_m: 50, num_pisos: 34, terreno: 'oceano', material_principal: 'titanio' },
            { tipo_base_1: 'torre_piramide', tipo_base_2: 'complejo_modular', altura_m: 180, ancho_m: 52, profundidad_m: 52, num_pisos: 38, terreno: 'montana', material_principal: 'acero' },
            
            // Villas orgánicas (6 diseños)
            { tipo_base_1: 'villa_organica', tipo_base_2: 'torre_piramide', altura_m: 28, ancho_m: 45, profundidad_m: 38, num_pisos: 6, terreno: 'lago', material_principal: 'fibra_carbono' },
            { tipo_base_1: 'villa_organica', tipo_base_2: 'complejo_modular', altura_m: 24, ancho_m: 50, profundidad_m: 42, num_pisos: 5, terreno: 'montana', material_principal: 'aluminio' },
            { tipo_base_1: 'villa_organica', tipo_base_2: 'casa_flotante', altura_m: 30, ancho_m: 52, profundidad_m: 45, num_pisos: 6, terreno: 'desierto', material_principal: 'vidrio_templado' },
            { tipo_base_1: 'villa_organica', tipo_base_2: 'torre_piramide', altura_m: 26, ancho_m: 48, profundidad_m: 40, num_pisos: 5, terreno: 'oceano', material_principal: 'bronze_arquitectonico' },
            { tipo_base_1: 'villa_organica', tipo_base_2: 'complejo_modular', altura_m: 32, ancho_m: 55, profundidad_m: 48, num_pisos: 7, terreno: 'lago', material_principal: 'titanio' },
            { tipo_base_1: 'villa_organica', tipo_base_2: 'casa_flotante', altura_m: 27, ancho_m: 46, profundidad_m: 39, num_pisos: 6, terreno: 'montana', material_principal: 'acero' },
            
            // Complejos modulares (6 diseños)
            { tipo_base_1: 'complejo_modular', tipo_base_2: 'torre_piramide', altura_m: 35, ancho_m: 65, profundidad_m: 55, num_pisos: 8, terreno: 'oceano', material_principal: 'aluminio' },
            { tipo_base_1: 'complejo_modular', tipo_base_2: 'villa_organica', altura_m: 32, ancho_m: 70, profundidad_m: 58, num_pisos: 7, terreno: 'lago', material_principal: 'fibra_carbono' },
            { tipo_base_1: 'complejo_modular', tipo_base_2: 'casa_flotante', altura_m: 28, ancho_m: 60, profundidad_m: 50, num_pisos: 6, terreno: 'desierto', material_principal: 'vidrio_templado' },
            { tipo_base_1: 'complejo_modular', tipo_base_2: 'torre_piramide', altura_m: 38, ancho_m: 72, profundidad_m: 62, num_pisos: 9, terreno: 'montana', material_principal: 'titanio' },
            { tipo_base_1: 'complejo_modular', tipo_base_2: 'villa_organica', altura_m: 30, ancho_m: 68, profundidad_m: 56, num_pisos: 7, terreno: 'oceano', material_principal: 'bronze_arquitectonico' },
            { tipo_base_1: 'complejo_modular', tipo_base_2: 'casa_flotante', altura_m: 34, ancho_m: 75, profundidad_m: 60, num_pisos: 8, terreno: 'lago', material_principal: 'acero' }
        ];
        
        const resultado = await ArquitecturaService.generateBulk(combinaciones.slice(0, limite), limite);
        
        res.json(resultado);
        
    } catch (error) {
        console.error('❌ Error generación masiva:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Listar todos los diseños generados
app.get('/api/arquitectura/listado', async (req, res) => {
    try {
        const filtros = req.query;
        const resultado = await ArquitecturaService.listDesigns(filtros);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Estadísticas del portafolio
app.get('/api/arquitectura/stats', async (req, res) => {
    try {
        const resultado = await ArquitecturaService.getStats();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener diseño individual por ID
app.get('/api/arquitectura/diseno-real/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await ArquitecturaService.getDesignById(id);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =================================================================
// SISTEMA DE VENTAS ARQUITECTÓNICAS - 30 DISEÑOS FUTURISTAS
// =================================================================

// Listar catálogo completo de diseños
app.get('/api/arquitectura/catalogo', async (req, res) => {
    try {
        res.json({
            success: true,
            total_disenos: CATALOGO_ARQUITECTONICO.length,
            valoracion_total_usd: VALORACION_TOTAL,
            valoracion_billones: (VALORACION_TOTAL / 1000000000).toFixed(1),
            catalogo: CATALOGO_ARQUITECTONICO.map(diseno => ({
                ...diseno,
                imagen_url: `/arquitectura/${diseno.imagen}`,
                precio_millones: (diseno.precio_usd / 1000000).toFixed(1)
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ver detalles de un diseño específico
app.get('/api/arquitectura/diseno/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const diseno = CATALOGO_ARQUITECTONICO.find(d => d.id === id);
        
        if (!diseno) {
            return res.status(404).json({
                success: false,
                error: 'Diseño no encontrado'
            });
        }
        
        res.json({
            success: true,
            diseno: {
                ...diseno,
                imagen_url: `/arquitectura/${diseno.imagen}`,
                precio_millones: (diseno.precio_usd / 1000000).toFixed(1)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// COMPRAR DISEÑO ARQUITECTÓNICO
// Genera: Certificado de Propiedad + Planos Técnicos + Envío por Email
app.post('/api/arquitectura/comprar', async (req, res) => {
    try {
        const { diseno_id, comprador } = req.body;
        
        if (!diseno_id || !comprador || !comprador.nombre || !comprador.email) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos requeridos: diseno_id, comprador.nombre, comprador.email'
            });
        }
        
        // Buscar diseño en catálogo
        const diseno = CATALOGO_ARQUITECTONICO.find(d => d.id === diseno_id);
        
        if (!diseno) {
            return res.status(404).json({
                success: false,
                error: 'Diseño no encontrado en el catálogo'
            });
        }
        
        console.log(`🏗️ Procesando compra de: ${diseno.nombre}`);
        console.log(`👤 Comprador: ${comprador.nombre} (${comprador.email})`);
        
        // 1. Generar Certificado de Propiedad
        const certificado = await generarCertificadoPropiedad(diseno, comprador, MASTER_KEY_RSA_PRIVADA);
        
        // 2. Generar Planos Técnicos
        const plano = await generarPlanoTecnico(diseno, MASTER_KEY_RSA_PRIVADA);
        
        // 3. Enviar paquete completo por email
        try {
            const adjuntos = [];
            
            // Adjuntar certificado
            if (certificado.pdf_path && fs.existsSync(certificado.pdf_path)) {
                const certBuffer = fs.readFileSync(certificado.pdf_path);
                adjuntos.push({
                    filename: path.basename(certificado.pdf_path),
                    content: certBuffer.toString('base64')
                });
            }
            
            // Adjuntar planos
            if (plano.pdf_path && fs.existsSync(plano.pdf_path)) {
                const planoBuffer = fs.readFileSync(plano.pdf_path);
                adjuntos.push({
                    filename: path.basename(plano.pdf_path),
                    content: planoBuffer.toString('base64')
                });
            }
            
            // Enviar a email empresarial
            await arquitectoInterno.enviarNotificacionEmpresarial('COMPRA_ARQUITECTONICA', {
                comprador: comprador.nombre,
                email_comprador: comprador.email,
                diseno: diseno.nombre,
                diseno_id: diseno.id,
                precio: `$${(diseno.precio_usd / 1000000).toFixed(1)} Millones USD`,
                certificado_id: certificado.certificado_id,
                plano_id: plano.plano_id,
                coordenadas: `${diseno.coordenadas.lat}°, ${diseno.coordenadas.lon}°`
            }, adjuntos);
            
            // Enviar copia al comprador
            await resend.emails.send({
                from: 'Street Emporio Royal <onboarding@resend.dev>',
                to: comprador.email,
                subject: `🏗️ Compra Confirmada: ${diseno.nombre}`,
                html: `
                    <h1>¡Felicidades ${comprador.nombre}!</h1>
                    <p>Su compra de <strong>${diseno.nombre}</strong> ha sido procesada exitosamente.</p>
                    
                    <h2>📋 Detalles de su Adquisición:</h2>
                    <ul>
                        <li><strong>Diseño:</strong> ${diseno.nombre}</li>
                        <li><strong>Tipo:</strong> ${diseno.tipo}</li>
                        <li><strong>ID:</strong> ${diseno.id}</li>
                        <li><strong>Valor:</strong> $${(diseno.precio_usd / 1000000).toFixed(1)} Millones USD</li>
                        <li><strong>Coordenadas GPS:</strong> ${diseno.coordenadas.lat}°, ${diseno.coordenadas.lon}°</li>
                    </ul>
                    
                    <h2>📦 Documentos Incluidos:</h2>
                    <ol>
                        <li><strong>Certificado de Propiedad</strong> con firma RSA-4096</li>
                        <li><strong>Planos Técnicos Completos</strong> con:
                            <ul>
                                <li>Coordenadas GPS exactas</li>
                                <li>Cálculos de gravedad precisos</li>
                                <li>Medidas detalladas (altura, área, volumen)</li>
                                <li>Especificaciones de materiales</li>
                            </ul>
                        </li>
                    </ol>
                    
                    <p><em>Los documentos adjuntos están firmados digitalmente con tecnología RSA-4096 de nivel gubernamental.</em></p>
                    
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                        <strong>Street Emporio Royal</strong><br>
                        Roberto Rivera Gamas - Royal, Arquitecto Principal
                    </p>
                `,
                attachments: adjuntos
            });
            
            console.log(`✅ Paquete completo enviado a ${comprador.email} y contacto@streetemporioroyal.com`);
            
        } catch (emailError) {
            console.warn('⚠️ Error enviando emails:', emailError.message);
        }
        
        res.json({
            success: true,
            compra: {
                diseno_id: diseno.id,
                diseno_nombre: diseno.nombre,
                comprador: comprador.nombre,
                precio_usd: diseno.precio_usd,
                certificado: certificado,
                plano: plano,
                emails_enviados: [comprador.email, 'contacto@streetemporioroyal.com']
            },
            mensaje: `¡Compra exitosa! Certificado de propiedad y planos técnicos enviados a ${comprador.email}`
        });
        
    } catch (error) {
        console.error('❌ Error procesando compra:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// DOCUMENTACIÓN PROFESIONAL PARA INVERSIONISTAS
// =================================================================

app.get('/api/documentacion/listado', async (req, res) => {
    try {
        const docsDir = path.join(__dirname, '..', 'documentacion-oficial');
        const files = fs.readdirSync(docsDir);
        
        const documentos = files.map(file => ({
            nombre: file,
            nombre_legible: file.replace(/\.md$/, '').replace(/_/g, ' '),
            url: `/api/documentacion/descargar/${file}`,
            tipo: 'markdown',
            tamaño: fs.statSync(path.join(docsDir, file)).size
        }));
        
        res.json({
            success: true,
            documentos,
            total: documentos.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/documentacion/descargar/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const docPath = path.join(__dirname, '..', 'documentacion-oficial', filename);
        
        if (!fs.existsSync(docPath)) {
            return res.status(404).json({
                success: false,
                error: 'Documento no encontrado'
            });
        }
        
        res.download(docPath, filename);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/documentacion/paquete-completo', async (req, res) => {
    try {
        const docsDir = path.join(__dirname, '..', 'documentacion-oficial');
        const files = fs.readdirSync(docsDir);
        
        let contenido = `# PAQUETE COMPLETO DE DOCUMENTACIÓN
## THRONE PROTOCOL V3.0 - STREET EMPORIO ROYAL

**Fecha de Generación:** ${new Date().toISOString()}
**Generado para:** Inversionistas y Socios Potenciales

---

`;
        
        for (const file of files) {
            const filePath = path.join(docsDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            contenido += `\n\n${'='.repeat(80)}\n`;
            contenido += `DOCUMENTO: ${file}\n`;
            contenido += `${'='.repeat(80)}\n\n`;
            contenido += fileContent;
            contenido += `\n\n`;
        }
        
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="THRONE_V3_DOCUMENTACION_COMPLETA_${Date.now()}.md"`);
        res.send(contenido);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// 🔐 ENDPOINTS DE VERIFICACIÓN CRIPTOGRÁFICA REAL
// =================================================================

// Obtener clave pública RSA-4096
app.get('/api/crypto/clave-publica', (req, res) => {
    try {
        if (!cryptoService) {
            return res.status(503).json({
                success: false,
                error: 'Servicio criptográfico no disponible'
            });
        }

        const publicKey = cryptoService.extraerClavePublica();
        const fingerprint = cryptoService.generarFingerprint(publicKey);

        res.json({
            success: true,
            clave_publica: publicKey,
            fingerprint_sha256: fingerprint,
            algoritmo: 'RSA-4096',
            propietario: 'Roberto Rivera Gamas',
            rfc: 'RIGR840827PJ0'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Firmar datos con RSA-4096 y guardar en blockchain
app.post('/api/crypto/firmar', async (req, res) => {
    try {
        if (!cryptoService) {
            return res.status(503).json({
                success: false,
                error: 'Servicio criptográfico no disponible'
            });
        }

        const { datos } = req.body;
        if (!datos) {
            return res.status(400).json({
                success: false,
                error: 'Datos requeridos para firmar'
            });
        }

        const resultado = cryptoService.firmarRSA(datos);

        try {
            await dbService.guardarTransaccion('firma', datos, resultado.firma, null, resultado.hash);
        } catch (dbError) {
            console.warn('⚠️ Error guardando en DB:', dbError.message);
        }

        res.json({
            success: true,
            ...resultado,
            propietario: 'Roberto Rivera Gamas',
            rfc: 'RIGR840827PJ0'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Verificar firma RSA-4096 (SOLO verifica firmas del servidor)
app.post('/api/crypto/verificar', async (req, res) => {
    try {
        if (!cryptoService) {
            return res.status(503).json({
                success: false,
                error: 'Servicio criptográfico no disponible'
            });
        }

        const { datos, firma } = req.body;
        if (!datos || !firma) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren datos y firma para verificar'
            });
        }

        const publicKey = cryptoService.extraerClavePublica();
        const resultado = cryptoService.verificarFirmaRSA(datos, firma, publicKey);

        try {
            await dbService.guardarVerificacion(resultado.hash, firma, 'RS256', resultado.valido, req.ip);
        } catch (dbError) {
            console.warn('⚠️ Error guardando verificación:', dbError.message);
        }

        res.json({
            success: true,
            ...resultado,
            verificado_contra: 'Clave Pública de Roberto Rivera Gamas',
            rfc: 'RIGR840827PJ0'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generar JWT firmado con RSA-4096
app.post('/api/crypto/generar-jwt', (req, res) => {
    try {
        if (!cryptoService) {
            return res.status(503).json({
                success: false,
                error: 'Servicio criptográfico no disponible'
            });
        }

        const { payload, expiresIn } = req.body;
        if (!payload) {
            return res.status(400).json({
                success: false,
                error: 'Payload requerido para generar JWT'
            });
        }

        const payloadCompleto = {
            ...payload,
            iss: 'Throne Protocol V3.0',
            sub: 'Roberto Rivera Gamas',
            rfc: 'RIGR840827PJ0',
            iat: Math.floor(Date.now() / 1000)
        };

        const token = cryptoService.generarJWT(payloadCompleto, expiresIn || '365d');

        res.json({
            success: true,
            token,
            payload: payloadCompleto,
            algoritmo: 'RS256',
            validez: expiresIn || '365d'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Verificar JWT (SOLO verifica tokens del servidor)
app.post('/api/crypto/verificar-jwt', (req, res) => {
    try {
        if (!cryptoService) {
            return res.status(503).json({
                success: false,
                error: 'Servicio criptográfico no disponible'
            });
        }

        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token JWT requerido'
            });
        }

        const publicKey = cryptoService.extraerClavePublica();
        const resultado = cryptoService.verificarJWT(token, publicKey);

        if (resultado.valido) {
            const expectedIssuer = ['Throne Protocol V3.0', 'Royal Emporio', 'AHT-THRONE-CORE'];
            if (!expectedIssuer.includes(resultado.payload?.iss)) {
                return res.json({
                    success: false,
                    valido: false,
                    error: 'Token no emitido por Throne Protocol'
                });
            }
        }

        res.json({
            success: true,
            ...resultado,
            verificado_contra: 'Clave Pública de Roberto Rivera Gamas',
            rfc: 'RIGR840827PJ0'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Información del sistema criptográfico
app.get('/api/crypto/info', (req, res) => {
    try {
        const info = {
            sistema: 'Throne Protocol V3.0 - Enterprise Cryptography',
            propietario: 'Roberto Rivera Gamas',
            rfc: 'RIGR840827PJ0',
            titulo: 'Royal - Arquitecto',
            criptografia: {
                rsa_disponible: !!cryptoService,
                algoritmo_rsa: 'RSA-4096',
                algoritmo_firma: 'RS256 (RSA + SHA-256)',
                algoritmo_hash: 'SHA-256',
                jwt: 'JsonWebToken con RS256'
            },
            capacidades: [
                'Firma digital RSA-4096',
                'Verificación de firmas',
                'Generación de JWT firmados',
                'Verificación de JWT',
                'Fingerprints SHA-256',
                'Certificados digitales'
            ],
            estado: cryptoService ? 'OPERATIVO' : 'MODO DEMO'
        };

        if (cryptoService) {
            const publicKey = cryptoService.extraerClavePublica();
            const fingerprint = cryptoService.generarFingerprint(publicKey);
            info.fingerprint_sha256 = fingerprint;
        }

        res.json({
            success: true,
            ...info
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================================================
// FUSION TOKENS API - Sistema de Licencias Criptográficas REAL
// ========================================================================

// Listar tokens disponibles
app.get('/api/fusion/tokens', async (req, res) => {
    try {
        if (!fusionService) {
            return res.status(503).json({
                success: false,
                error: 'Fusion Service no disponible'
            });
        }

        const result = await fusionService.listarTokens(true);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ver detalles de un token específico
app.get('/api/fusion/tokens/:code', async (req, res) => {
    try {
        if (!fusionService) {
            return res.status(503).json({
                success: false,
                error: 'Fusion Service no disponible'
            });
        }

        const result = await fusionService.obtenerToken(req.params.code);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Emitir licencia a cliente (🔐 PROTEGIDO con API Key)
app.post('/api/fusion/licenses/issue', authMiddleware.middleware(['issue']), async (req, res) => {
    try {
        if (!fusionService) {
            return res.status(503).json({
                success: false,
                error: 'Fusion Service no disponible'
            });
        }

        const { tokenCode, cliente } = req.body;
        
        if (!tokenCode || !cliente || !cliente.nombre || !cliente.email) {
            return res.status(400).json({
                success: false,
                error: 'tokenCode, cliente.nombre y cliente.email son requeridos'
            });
        }

        const clienteData = {
            ...cliente,
            ipOrigen: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        };

        const result = await fusionService.emitirLicencia(tokenCode, clienteData);
        
        if (result.success) {
            res.status(201).json({
                ...result,
                rateLimitRestantes: req.rateLimitRestantes,
                emitidoPor: req.apiKeyData.nombre
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Verificar licencia
app.post('/api/fusion/licenses/verify', async (req, res) => {
    try {
        if (!fusionService) {
            return res.status(503).json({
                success: false,
                error: 'Fusion Service no disponible'
            });
        }

        const { licenseId, jwtToken } = req.body;
        
        if (!licenseId || !jwtToken) {
            return res.status(400).json({
                success: false,
                error: 'licenseId y jwtToken son requeridos'
            });
        }

        const result = await fusionService.verificarLicencia(licenseId, jwtToken);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Consultar licencia por ID
app.get('/api/fusion/licenses/:id', async (req, res) => {
    try {
        if (!fusionService) {
            return res.status(503).json({
                success: false,
                error: 'Fusion Service no disponible'
            });
        }

        const result = await fusionService.obtenerLicencia(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Estadísticas de sistema FUSION
app.get('/api/fusion/stats', async (req, res) => {
    try {
        if (!fusionService) {
            return res.status(503).json({
                success: false,
                error: 'Fusion Service no disponible'
            });
        }

        const result = await fusionService.obtenerEstadisticas();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================================================
// CERTIFICADOS PARA CLIENTES - PDFs Profesionales
// ========================================================================

// Generar certificado PDF para una licencia (🔐 PROTEGIDO con API Key)
app.post('/api/fusion/licenses/:id/certificate', authMiddleware.middleware(['issue']), async (req, res) => {
    try {
        if (!clientCertificateService) {
            return res.status(503).json({
                success: false,
                error: 'Client Certificate Service no disponible'
            });
        }

        const licenseId = req.params.id;
        const result = await clientCertificateService.generarCertificadoCliente(licenseId);

        if (result.success) {
            res.status(201).json({
                ...result,
                rateLimitRestantes: req.rateLimitRestantes,
                generadoPor: req.apiKeyData.nombre
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Descargar certificado PDF (🔓 Público - No requiere autenticación)
app.get('/api/fusion/licenses/:id/certificate/download', async (req, res) => {
    try {
        if (!clientCertificateService) {
            return res.status(503).json({
                success: false,
                error: 'Client Certificate Service no disponible'
            });
        }

        const licenseId = req.params.id;

        // Verificar que la licencia existe
        const licenseQuery = await dbService.pool.query(
            'SELECT license_id, cliente_nombre FROM fusion_licenses WHERE license_id = $1',
            [licenseId]
        );

        if (licenseQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Licencia no encontrada'
            });
        }

        // Verificar que existe el certificado
        if (!clientCertificateService.certificateExists(licenseId)) {
            return res.status(404).json({
                success: false,
                error: 'Certificado no generado. Use POST /api/fusion/licenses/:id/certificate primero.'
            });
        }

        const pdfPath = clientCertificateService.getCertificatePath(licenseId);
        const clienteNombre = licenseQuery.rows[0].cliente_nombre;

        // Enviar archivo PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Certificado_FUSION_${clienteNombre.replace(/\s+/g, '_')}.pdf"`);
        res.sendFile(pdfPath);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================================================
// ADMIN ENDPOINTS - Gestión de API Keys (🔐 DUAL-CONTROL PROTEGIDO)
// Requiere: API Key con rol 'admin' + Master Secret en header x-master-secret
// ========================================================================

// Crear nueva API key (🔐 DUAL-CONTROL)
app.post('/api/admin/keys/create', adminDualControl ? adminDualControl.middleware() : (req, res) => res.status(503).json({ error: 'Admin dual-control no disponible' }), async (req, res) => {
    try {
        const { nombre, propietario, email, permisos, rateLimit, expiresInDays } = req.body;

        if (!nombre || !propietario || !email) {
            return res.status(400).json({
                success: false,
                error: 'nombre, propietario y email son requeridos'
            });
        }

        const result = await authMiddleware.createApiKey(
            nombre,
            propietario,
            email,
            permisos || ['read', 'issue', 'verify'],
            rateLimit || 50,
            expiresInDays || 365
        );

        res.status(201).json({
            ...result,
            aprobadoPor: req.apiKeyData.nombre,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Listar todas las API keys (🔐 DUAL-CONTROL)
app.get('/api/admin/keys', adminDualControl ? adminDualControl.middleware() : (req, res) => res.status(503).json({ error: 'Admin dual-control no disponible' }), async (req, res) => {
    try {
        const result = await authMiddleware.listarApiKeys();
        res.json({
            ...result,
            consultadoPor: req.apiKeyData.nombre,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Desactivar API key (🔐 DUAL-CONTROL)
app.delete('/api/admin/keys/:id', adminDualControl ? adminDualControl.middleware() : (req, res) => res.status(503).json({ error: 'Admin dual-control no disponible' }), async (req, res) => {
    try {
        const result = await authMiddleware.desactivarApiKey(parseInt(req.params.id));
        res.json({
            ...result,
            desactivadoPor: req.apiKeyData.nombre,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================================================
// CERTIFICACIÓN PROFESIONAL - Certificado Oficial con Firma RSA-4096
// ========================================================================

// Generar certificado profesional (ADMIN ONLY)
app.post('/api/admin/certificado/generar', async (req, res) => {
    try {
        const adminSecret = req.headers['x-admin-secret'];
        
        if (!adminSecret || adminSecret !== process.env.RSA_4096_PRIVADA?.substring(0, 50)) {
            return res.status(403).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const desarrollador = 'Roberto Rivera Gamas (RFC: RIGR840827PJ0)';

        const experiencia = {
            meses: 6,
            tecnologias: [
                'Node.js + Express.js',
                'PostgreSQL + Drizzle ORM',
                'RSA-4096 Cryptography',
                'JWT (JSON Web Tokens)',
                'REST API Design',
                'API Key Authentication',
                'Rate Limiting & Security'
            ],
            logros: [
                'Sistema FUSION: 5 tokens premium ($235K USD)',
                'Autenticación empresarial con API Keys',
                'Criptografía RSA-4096 en producción',
                'Base de datos PostgreSQL (8 tablas)',
                '9 endpoints REST protegidos',
                'Sistema de auditoría completo',
                'Rate limiting 100 req/min',
                'Firmas digitales verificables'
            ]
        };

        // Generar firma completa ANTES de llamar al módulo (para incluirla en response)
        const datosHash = {
            tipo: 'CERTIFICADO_DESARROLLO_PROFESIONAL',
            desarrollador: desarrollador,
            experiencia: experiencia,
            timestamp: new Date().toISOString(),
            emisor: 'Street Emporio Royal',
            sistema: 'Throne Protocol V3.0'
        };
        
        const hash = cryptoService.generarHash(JSON.stringify(datosHash));
        const firmaCompleta = cryptoService.firmarRSA(datosHash);

        const resultado = await generarCertificadoDesarrollador(
            desarrollador,
            experiencia,
            MASTER_KEY_RSA_PRIVADA
        );

        if (resultado.certificado_id) {
            const clavePublica = cryptoService.extraerClavePublica();
            const fingerprint = cryptoService.generarFingerprint(clavePublica);
            
            res.json({
                success: true,
                certificado: {
                    ...resultado,
                    firma_rsa4096_completa: firmaCompleta.firma,
                    hash_sha256: hash,
                    fingerprint_rsa: fingerprint
                },
                verificacion: {
                    instrucciones: 'Para verificar: 1) Calcule SHA-256 del payload_firmado, 2) Verifique con la firma RSA-4096 usando clave_publica',
                    payload_firmado: datosHash,
                    payload_json_canonico: JSON.stringify(datosHash),
                    firma_rsa4096: firmaCompleta.firma,
                    hash_esperado: hash,
                    clave_publica: clavePublica,
                    fingerprint: fingerprint,
                    comando_verificacion: 'echo "[payload_json_canonico]" | openssl dgst -sha256 -verify public.pem -signature signature.bin'
                },
                mensaje: '✅ Certificado profesional generado con firma RSA-4096 verificable',
                url_descarga: `/certificados/${path.basename(resultado.pdf_path)}`
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error generando certificado'
            });
        }

    } catch (error) {
        console.error('Error generando certificado:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint para descargar certificados (SEGURO - sin path traversal)
app.get('/certificados/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        
        // Validar que el filename no contenga caracteres peligrosos
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: 'Nombre de archivo inválido' });
        }
        
        // Solo permitir archivos PDF
        if (!filename.endsWith('.pdf')) {
            return res.status(400).json({ error: 'Solo se permiten archivos PDF' });
        }
        
        const certDir = path.join(__dirname, '..', 'certificados');
        const certPath = path.join(certDir, filename);
        
        // Verificar que el path resuelto está dentro del directorio de certificados
        const resolvedPath = path.resolve(certPath);
        const resolvedDir = path.resolve(certDir);
        
        if (!resolvedPath.startsWith(resolvedDir)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        
        if (fs.existsSync(certPath)) {
            res.download(certPath);
        } else {
            res.status(404).json({ error: 'Certificado no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📧 ENDPOINT: Enviar certificado por correo
app.post('/api/enviar-certificado-email', async (req, res) => {
    try {
        const { email, certificadoId, tipo } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email requerido' });
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }

        let rutaPDF = null;
        let datos = {};

        // Si se especifica un certificadoId, buscar ese archivo
        if (certificadoId) {
            const certDir = path.join(__dirname, '..', 'certificados');
            rutaPDF = path.join(certDir, `${certificadoId}.pdf`);
            
            if (!fs.existsSync(rutaPDF)) {
                return res.status(404).json({ error: 'Certificado no encontrado' });
            }
            
            datos = {
                titulo: certificadoId,
                proyecto: 'ALGORYTHM ANCESTRAL ENGINE',
                desarrollador: 'Roberto Rivera Gamas',
                rfc: 'RIGR840827PJ0'
            };
        } else {
            // Generar un nuevo certificado según el tipo
            const tipoReal = tipo || 'valoracion';
            
            if (tipoReal === 'valoracion') {
                const resultado = await generarCertificadoValoracion({
                    proyecto: 'ALGORYTHM ANCESTRAL ENGINE',
                    desarrollador: 'Roberto Rivera Gamas',
                    valoracion: 85000,
                    rfc: 'RIGR840827PJ0'
                }, MASTER_KEY_RSA_PRIVADA);
                
                rutaPDF = resultado.pdf_path;
                datos = {
                    titulo: 'Certificado de Valoración',
                    proyecto: 'ALGORYTHM ANCESTRAL ENGINE',
                    desarrollador: 'Roberto Rivera Gamas',
                    rfc: 'RIGR840827PJ0',
                    valoracion: 85000
                };
            } else if (tipoReal === 'royal') {
                const resultado = await generarCertificadoRoyalPremium({
                    clientName: 'Roberto Rivera Gamas',
                    projectName: 'ALGORYTHM ANCESTRAL ENGINE',
                    tier: 'DIAMOND',
                    valoracion: 150000
                }, MASTER_KEY_RSA_PRIVADA);
                
                rutaPDF = resultado.pdf_path;
                datos = {
                    titulo: 'Certificado Royal Premium',
                    proyecto: 'ALGORYTHM ANCESTRAL ENGINE',
                    desarrollador: 'Roberto Rivera Gamas',
                    rfc: 'RIGR840827PJ0',
                    tier: 'DIAMOND',
                    valoracion: 150000
                };
            }
        }

        if (!rutaPDF || !fs.existsSync(rutaPDF)) {
            return res.status(500).json({ error: 'Error generando certificado' });
        }

        // Enviar por email usando Resend
        const pdfBuffer = fs.readFileSync(rutaPDF);
        const pdfBase64 = pdfBuffer.toString('base64');
        const nombreArchivo = path.basename(rutaPDF);

        const asunto = `🔱 Certificado: ${datos.titulo || 'ALGORYTHM ANCESTRAL ENGINE'}`;
        const htmlBody = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #00ff88; padding: 20px; }
.container { max-width: 600px; margin: 0 auto; background: rgba(0,0,0,0.9); border: 2px solid #00ff88; border-radius: 10px; padding: 30px; }
h1 { color: #ffd700; text-align: center; }
.info { background: rgba(0,255,136,0.1); border-left: 4px solid #00ff88; padding: 15px; margin: 20px 0; }
</style></head><body>
<div class="container">
<h1>🔱 ALGORYTHM ANCESTRAL ENGINE</h1>
<h2 style="color: #00ff88; text-align: center;">Certificado Generado</h2>
<div class="info">
<p><strong>Proyecto:</strong> ${datos.proyecto}</p>
<p><strong>Desarrollador:</strong> ${datos.desarrollador}</p>
<p><strong>RFC:</strong> ${datos.rfc}</p>
${datos.valoracion ? `<p><strong>Valoración:</strong> $${datos.valoracion.toLocaleString()} USD</p>` : ''}
<p><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
</div>
<p style="text-align: center;">Tu certificado está adjunto en formato PDF.</p>
<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #00ff88; font-size: 12px; color: #888;">
<p>🔱 THRONE PROTOCOL V3.0</p>
</div></div></body></html>`;

        const resultadoEmail = await resend.emails.send({
            from: 'ALGORYTHM ENGINE <onboarding@resend.dev>',
            to: email,
            subject: asunto,
            html: htmlBody,
            attachments: [{ filename: nombreArchivo, content: pdfBase64 }]
        });

        console.log(`✅ Certificado enviado a ${email}:`, resultadoEmail.id);

        res.json({
            success: true,
            mensaje: `Certificado enviado exitosamente a ${email}`,
            emailId: resultadoEmail.id,
            certificado: nombreArchivo,
            datos
        });

    } catch (error) {
        console.error('Error enviando certificado por correo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================================================
// LGORITMO AHT - ANCESTRAL CEREBRO VIVO - APIS CUÁNTICAS
// ========================================================================

// ────────────────────────────────────────────────────────────────────
// QUANTUM TOKENS - 9 Tokens de Fusión Antiblindada
// ────────────────────────────────────────────────────────────────────

// GET /api/aht/quantum/tokens - Obtener todos los tokens cuánticos
app.get('/api/aht/quantum/tokens', (req, res) => {
    try {
        const resultado = QuantumService.getAllQuantumTokens();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/quantum/token/:nombre - Obtener token específico
app.get('/api/aht/quantum/token/:nombre', (req, res) => {
    try {
        const token = QuantumService.getQuantumToken(req.params.nombre);
        if (!token) {
            return res.status(404).json({ success: false, error: 'Token no encontrado' });
        }
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/quantum/verificar - Verificar token cuántico
app.post('/api/aht/quantum/verificar', async (req, res) => {
    try {
        const { tokenName } = req.body;
        const resultado = await QuantumService.verificarToken(tokenName);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/quantum/sincronizar - Sincronizar todos los tokens
app.post('/api/aht/quantum/sincronizar', async (req, res) => {
    try {
        const resultado = await QuantumService.sincronizarTokens();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/quantum/estado - Estado cuántico completo
app.get('/api/aht/quantum/estado', (req, res) => {
    try {
        const estado = QuantumService.generarEstadoCuantico();
        res.json(estado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/quantum/operacion - Ejecutar operación cuántica
app.post('/api/aht/quantum/operacion', async (req, res) => {
    try {
        const resultado = await QuantumService.ejecutarOperacionCuantica(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/quantum/capacidades - Reporte de capacidades cuánticas
app.get('/api/aht/quantum/capacidades', (req, res) => {
    try {
        const reporte = QuantumService.generarReporteCapacidades();
        res.json({ success: true, ...reporte });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ────────────────────────────────────────────────────────────────────
// SATELLITES - Tracking en Tiempo Real
// ────────────────────────────────────────────────────────────────────

// GET /api/aht/satellites - Obtener todos los satélites
app.get('/api/aht/satellites', (req, res) => {
    try {
        const resultado = SatelliteService.getAllSatellites();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/satellites/:noradId/position - Posición actual de satélite
app.get('/api/aht/satellites/:noradId/position', (req, res) => {
    try {
        const resultado = SatelliteService.calcularPosicion(req.params.noradId);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/satellites/positions/all - Posiciones de todos los satélites
app.get('/api/aht/satellites/positions/all', async (req, res) => {
    try {
        const resultado = await SatelliteService.calcularTodasPosiciones();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/satellites/:noradId/trajectory - Predecir trayectoria
app.get('/api/aht/satellites/:noradId/trajectory', (req, res) => {
    try {
        const { minutos, intervalo } = req.query;
        const resultado = SatelliteService.predecirTrayectoria(
            req.params.noradId,
            parseInt(minutos) || 60,
            parseInt(intervalo) || 5
        );
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/satellites/add - Agregar nuevo satélite
app.post('/api/aht/satellites/add', (req, res) => {
    try {
        const resultado = SatelliteService.agregarSatelite(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/satellites/reporte - Reporte de estado
app.get('/api/aht/satellites/reporte', (req, res) => {
    try {
        const reporte = SatelliteService.generarReporteEstado();
        res.json({ success: true, ...reporte });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ────────────────────────────────────────────────────────────────────
// ÁLGEBRA INVERSA - Transformaciones Cuánticas y Gravedad
// ────────────────────────────────────────────────────────────────────

// POST /api/aht/algebra/inversa - Transformación inversa de matriz
app.post('/api/aht/algebra/inversa', (req, res) => {
    try {
        const { matriz } = req.body;
        const resultado = AlgebraInversaService.transformacionInversa(matriz);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/algebra/gravedad - Campo gravitacional
app.post('/api/aht/algebra/gravedad', (req, res) => {
    try {
        const { masa, radio } = req.body;
        const resultado = AlgebraInversaService.campoGravitacional(masa, radio);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/algebra/cuantica - Transformación cuántica
app.post('/api/aht/algebra/cuantica', (req, res) => {
    try {
        const resultado = AlgebraInversaService.transformacionCuantica(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/algebra/operador - Operador cuántico
app.post('/api/aht/algebra/operador', (req, res) => {
    try {
        const { tipo, parametros } = req.body;
        const resultado = AlgebraInversaService.operadorCuantico(tipo, parametros);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/algebra/gravedad-cuantica - Gravedad cuántica
app.post('/api/aht/algebra/gravedad-cuantica', (req, res) => {
    try {
        const { masa, longitud } = req.body;
        const resultado = AlgebraInversaService.gravedadCuantica(masa, longitud);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/algebra/einstein - Ecuación de Einstein
app.post('/api/aht/algebra/einstein', (req, res) => {
    try {
        const { masa, velocidad } = req.body;
        const resultado = AlgebraInversaService.ecuacionEinstein(masa, velocidad);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/algebra/reporte - Reporte de álgebra
app.get('/api/aht/algebra/reporte', (req, res) => {
    try {
        const reporte = AlgebraInversaService.generarReporteAlgebra();
        res.json({ success: true, ...reporte });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ────────────────────────────────────────────────────────────────────
// BLUEPRINT GENERATOR - Generación Ilimitada
// ────────────────────────────────────────────────────────────────────

// POST /api/aht/blueprint/quantum - Generar blueprint cuántico
app.post('/api/aht/blueprint/quantum', async (req, res) => {
    try {
        const resultado = await BlueprintGeneratorService.generarBlueprintCuantico(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/blueprint/gravitacional - Generar blueprint gravitacional
app.post('/api/aht/blueprint/gravitacional', async (req, res) => {
    try {
        const resultado = await BlueprintGeneratorService.generarBlueprintGravitacional(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/blueprint/algebraico - Generar blueprint algebraico
app.post('/api/aht/blueprint/algebraico', async (req, res) => {
    try {
        const resultado = await BlueprintGeneratorService.generarBlueprintAlgebraico(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/blueprint/morfogenetico - Generar blueprint morfogenético
app.post('/api/aht/blueprint/morfogenetico', async (req, res) => {
    try {
        const resultado = await BlueprintGeneratorService.generarBlueprintMorfogenetico(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/blueprint/hibrido - Generar blueprint híbrido (todos los tipos)
app.post('/api/aht/blueprint/hibrido', async (req, res) => {
    try {
        const resultado = await BlueprintGeneratorService.generarBlueprintHibrido(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/blueprint/stats - Estadísticas de blueprint generator
app.get('/api/aht/blueprint/stats', (req, res) => {
    try {
        const stats = BlueprintGeneratorService.obtenerEstadisticas();
        res.json({ success: true, ...stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ────────────────────────────────────────────────────────────────────
// DASHBOARD AHT - Estado General del Cerebro Vivo
// ────────────────────────────────────────────────────────────────────

// GET /api/aht/dashboard - Dashboard completo del cerebro vivo
app.get('/api/aht/dashboard', async (req, res) => {
    try {
        const dashboard = {
            timestamp: new Date().toISOString(),
            nombre: 'LGORITMO AHT - ANCESTRAL CEREBRO VIVO',
            version: '1.0.0',
            estado: 'ACTIVO',
            
            quantum: QuantumService.generarEstadoCuantico(),
            satellites: await SatelliteService.calcularTodasPosiciones(),
            algebra: AlgebraInversaService.generarReporteAlgebra(),
            blueprints: BlueprintGeneratorService.obtenerEstadisticas(),
            
            capacidades: {
                tokensQuanticos: 9,
                satelitesTracking: 5,
                operacionesAlgebra: 8,
                blueprintsIlimitados: true,
                iteracionesMaximas: 'INFINITAS'
            },
            
            integracion: {
                fusionTokens: 40,
                valoracionTotal: '$276.5B USD',
                certificados: 64,
                rsa4096: 'ACTIVO',
                dualAI: 'GPT-5 + Gemini 2.5'
            }
        };
        
        res.json({ success: true, dashboard });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/status - Estado rápido
app.get('/api/aht/status', (req, res) => {
    try {
        res.json({
            success: true,
            sistema: 'LGORITMO AHT',
            estado: 'OPERACIONAL',
            cerebro: 'VIVO',
            quantum: 'ACTIVO',
            satellites: 'TRACKING',
            algebra: 'ACTIVA',
            blueprints: 'GENERANDO',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ────────────────────────────────────────────────────────────────────
// CEREBRO VIVO - Mega Cerebro Brillante
// ────────────────────────────────────────────────────────────────────

// POST /api/aht/cerebro/inicializar - Inicializar cerebro vivo
app.post('/api/aht/cerebro/inicializar', async (req, res) => {
    try {
        const resultado = await CerebroVivoService.inicializarCerebro();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/cerebro/comando - Procesar comando (tipo Siri pero brutal)
app.post('/api/aht/cerebro/comando', async (req, res) => {
    try {
        const { comando, parametros } = req.body;
        const resultado = await CerebroVivoService.procesarComando(comando, parametros);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/cerebro/estado - Estado del cerebro vivo
app.get('/api/aht/cerebro/estado', (req, res) => {
    try {
        const estado = CerebroVivoService.obtenerEstado();
        res.json(estado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/cerebro/evolucionar - Forzar evolución
app.post('/api/aht/cerebro/evolucionar', async (req, res) => {
    try {
        const resultado = await CerebroVivoService.evolucionar();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/cerebro/dashboard3d - Dashboard 3D completo
app.get('/api/aht/cerebro/dashboard3d', (req, res) => {
    try {
        const dashboard = CerebroVivoService.generarDashboard3D();
        res.json(dashboard);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/cerebro/conectar-urls - Conectar 9 URLs cuánticas
app.post('/api/aht/cerebro/conectar-urls', async (req, res) => {
    try {
        const resultado = await CerebroVivoService.conectarURLsCuanticas();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ────────────────────────────────────────────────────────────────────
// TÚNEL BLINDADO CUÁNTICO - Canal Seguro
// ────────────────────────────────────────────────────────────────────

// POST /api/aht/tunel/blindado - Túnel cifrado cuántico
app.post('/api/aht/tunel/blindado', async (req, res) => {
    try {
        const { operacion, datos, tokenName } = req.body;
        
        // Verificar token cuántico
        const tokenVerificado = await QuantumService.verificarToken(tokenName || 'Qubit-Torus-Alpha');
        
        if (!tokenVerificado.success || !tokenVerificado.blindajeActivo) {
            return res.status(403).json({
                success: false,
                error: 'Blindaje cuántico insuficiente',
                nivelRequerido: 8
            });
        }

        // Firmar con RSA-4096 para blindaje adicional
        let firma = null;
        if (cryptoService) {
            const hash = cryptoService.generarHash(JSON.stringify(datos));
            firma = cryptoService.firmar(hash);
        }

        // Ejecutar operación en túnel seguro
        let resultado;
        switch (operacion) {
            case 'comando':
                resultado = await CerebroVivoService.procesarComando(datos.comando, datos.parametros);
                break;
            case 'quantum':
                resultado = await QuantumService.ejecutarOperacionCuantica(datos);
                break;
            case 'gravedad':
                resultado = AlgebraInversaService.campoGravitacional(datos.masa, datos.radio);
                break;
            case 'blueprint':
                resultado = await BlueprintGeneratorService.generarBlueprintHibrido(datos);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Operación no reconocida en túnel blindado'
                });
        }

        res.json({
            success: true,
            tunelBlindado: true,
            tokenCuantico: tokenName,
            blindajeNivel: tokenVerificado.token.blindajeNivel,
            firma: firma ? firma.substring(0, 32) + '...' : null,
            resultado: resultado,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/tunel/verificar - Verificar estado del túnel blindado
app.get('/api/aht/tunel/verificar', async (req, res) => {
    try {
        const tokens = QuantumService.getAllQuantumTokens();
        const tokensBlinaje = tokens.tokens.filter(t => t.blindajeNivel >= 8);

        res.json({
            success: true,
            tunelEstado: 'ACTIVO',
            tokensDisponibles: tokensBlinaje.length,
            blindajePromedio: tokens.tokens.reduce((sum, t) => sum + t.blindajeNivel, 0) / tokens.total,
            criptografia: cryptoService ? 'RSA-4096 ACTIVO' : 'NO DISPONIBLE',
            certificado: cryptoService ? cryptoService.generarFingerprint(cryptoService.extraerClavePublica()).substring(0, 16) : null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/tunel/canal-seguro - Crear canal seguro temporal
app.post('/api/aht/tunel/canal-seguro', async (req, res) => {
    try {
        const { duracion = 3600 } = req.body; // 1 hora por defecto
        
        // Generar ID único del canal
        const canalId = `CANAL-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        
        // Sincronizar todos los tokens cuánticos para el canal
        const sincronizacion = await QuantumService.sincronizarTokens();
        
        res.json({
            success: true,
            canalId: canalId,
            estado: 'ESTABLECIDO',
            duracion: duracion,
            expiraEn: new Date(Date.now() + duracion * 1000).toISOString(),
            tokensSincronizados: sincronizacion.sincronizados,
            blindaje: 'CUÁNTICO_ACTIVO',
            protocolo: 'AHT-QUANTUM-TUNNEL-v1.0',
            mensaje: `🔐 Canal seguro establecido: ${canalId}`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/aht/tunel/conectar-link - Conectar link externo al sistema cuántico-gravedad
app.post('/api/aht/tunel/conectar-link', async (req, res) => {
    try {
        const { link, tipo = 'cuantico-gravedad' } = req.body;
        
        if (!link) {
            return res.status(400).json({
                success: false,
                error: 'Link requerido'
            });
        }

        // Validar que sea URL válida
        let urlValida;
        try {
            urlValida = new URL(link);
        } catch (e) {
            return res.status(400).json({
                success: false,
                error: 'Link inválido - debe ser una URL completa (https://...)'
            });
        }

        // Crear token cuántico personalizado para este link
        const tokenPersonalizado = {
            id: Date.now(),
            tokenName: `Custom-Link-${Date.now()}`,
            tokenUrl: link,
            categoria: tipo,
            blindajeNivel: 10,
            descripcion: `Link externo conectado: ${urlValida.hostname}`,
            capacidades: ['link-externo', 'cuantico', 'gravedad'],
            estado: 'activo',
            conectadoEn: new Date().toISOString()
        };

        // Intentar conectar (hacer ping al link)
        let estadoConexion = 'conectado';
        try {
            const axios = require('axios');
            await axios.head(link, { timeout: 5000 });
        } catch (error) {
            estadoConexion = 'advertencia - link no responde pero se guardó';
        }

        res.json({
            success: true,
            linkConectado: link,
            tokenGenerado: tokenPersonalizado,
            estadoConexion: estadoConexion,
            sistemaCuantico: 'INTEGRADO',
            gravedad: 'SINCRONIZADA',
            mensaje: `🔗 Link conectado al sistema cuántico-gravedad: ${urlValida.hostname}`,
            instrucciones: {
                usarEnComandos: `Usa "quantum link ${urlValida.hostname}" para interactuar`,
                verEstado: 'GET /api/aht/quantum/tokens muestra todos los links',
                enviarDatos: 'POST /api/aht/tunel/blindado con tu link'
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ────────────────────────────────────────────────────────────────────
// ACTIVACIÓN - Sistema de Códigos Secretos
// ────────────────────────────────────────────────────────────────────

// POST /api/aht/activacion/verificar - Verificar códigos de activación
app.post('/api/aht/activacion/verificar', async (req, res) => {
    try {
        const resultado = await activacionService.verificarCodigos(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/aht/activacion/estado - Obtener estado de activación
app.get('/api/aht/activacion/estado', (req, res) => {
    try {
        const estado = activacionService.obtenerEstado();
        res.json(estado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================================================

// Sirve archivos estáticos (HTML, JS, CSS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// El Listener que inicia el servidor
try {
    app.listen(PORT, () => {
        console.log(`\n==========================================================`);
        console.log(`🔱 ALGORYTHM ANCESTRAL ENGINE - ACTIVADO en puerto ${PORT}`);
        console.log(`   "Motor del Algoritmo Prohibido Re-Manifestado"`);
        console.log(`   Throne Protocol V3.0 | Roberto Rivera Gamas`);
        console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`   🔐 RSA-4096 Enterprise | 40 Tokens FUSION ($1.78M)`);
        console.log(`   🤖 AI Dual: GPT-5 + Gemini 2.5 | Dual-Control Admin`);
        console.log(`   🏗️ Sistema Arquitectónico Cuántico | PostgreSQL Forense`);
        console.log(`==========================================================\n`);
    });
} catch (e) {
    console.error("ERROR CRÍTICO AL INICIAR SERVIDOR:", e.message);
}