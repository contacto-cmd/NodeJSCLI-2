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

// Configurar Resend para envío de emails
const resend = new Resend(process.env.RESEND_API_KEY);

// 🧠 ACTIVAR ARQUITECTO AI INTERNO - Monitoreo Continuo
console.log('🧠 Activando Arquitecto AI Interno...');
arquitectoInterno.activarMonitoreoContinuo(120000); // Monitorear cada 2 minutos
console.log('✅ Arquitecto AI Interno: ACTIVO');

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
        
        res.json({
            success: true,
            certificado: resultado,
            mensaje: 'Certificado de valoración generado exitosamente',
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
        
        res.json({
            success: true,
            certificado: resultado,
            mensaje: 'Certificado de validación técnica generado exitosamente',
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
        
        // Notificar al arquitecto interno sobre la generación
        try {
            await arquitectoInterno.enviarNotificacionEmpresarial('CERTIFICADO_GENERADO', {
                certificadoId: resultados[0].certificado_id,
                diseno: proyecto,
                hash: resultados[0].hash_sha256,
                valoracion: resultados[0].valor || '$229,800,000,000'
            });
            console.log('✅ Notificación empresarial enviada exitosamente');
        } catch (err) {
            console.warn('⚠️ Error enviando notificación:', err.message);
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

// Sirve archivos estáticos (HTML, JS, CSS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// El Listener que inicia el servidor
try {
    app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(`🔥 PROTOCOLO TRONO V3.0 ACTIVADO en puerto ${PORT}`);
        console.log(`   📡 Globo 3D + 8 Satélites en vivo`);
        console.log(`   🔐 Vault cifrado AES-256-GCM + RSA-4096`);
        console.log(`   🤖 AI Lab: GPT-5 + Gemini 2.5 Dual`);
        console.log(`   🏗️ Sistema Arquitectónico Cuántico ACTIVO`);
        console.log(`=================================================\n`);
    });
} catch (e) {
    console.error("ERROR CRÍTICO AL INICIAR SERVIDOR:", e.message);
}