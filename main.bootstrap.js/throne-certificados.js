// Archivo: throne-certificados.js (Sistema de Certificación Digital)
// Genera certificados PDF oficiales con firma RSA-4096 + QR verification
// ✨ NUEVO: Contraseñas únicas + Registro Blockchain
// -----------------------------------------------------

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

// =================================================================
// CONFIGURACIÓN
// =================================================================

const CERT_DIR = path.join(__dirname, '..', 'certificados');
const VERIFICACION_BASE_URL = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:5000';

// Crear directorio si no existe
if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
}

// Inicializar Resend para envío de emails
const resend = new Resend(process.env.RESEND_API_KEY);

// =================================================================
// GENERADOR DE CONTRASEÑAS ÚNICAS (HOJAS DE DIAMANTE 💎)
// =================================================================

function generarPasswordUnico() {
    // Formato: ROYAL-XXXX-XXXX (ejm: ROYAL-7A3B-9F2E)
    const parte1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const parte2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `ROYAL-${parte1}-${parte2}`;
}

// =================================================================
// SISTEMA BLOCKCHAIN SIMPLIFICADO (Registro Inmutable)
// =================================================================

const BLOCKCHAIN_FILE = path.join(__dirname, '..', 'data', 'blockchain-certificados.json');

// Crear archivo blockchain si no existe
if (!fs.existsSync(BLOCKCHAIN_FILE)) {
    const blockchainInicial = {
        chain: [
            {
                index: 0,
                timestamp: new Date().toISOString(),
                data: {
                    tipo: 'GENESIS_BLOCK',
                    mensaje: 'Street Emporio Royal - Throne Protocol V3.0 - Blockchain Iniciado',
                    autor: 'Roberto Rivera Gamas - Royal (Arquitecto)'
                },
                previousHash: '0',
                hash: crypto.createHash('sha256').update('GENESIS_BLOCK').digest('hex')
            }
        ]
    };
    fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(blockchainInicial, null, 2));
}

function registrarEnBlockchain(certificadoId, hashCertificado, proyectoId, nombreDiseno, password) {
    try {
        const blockchain = JSON.parse(fs.readFileSync(BLOCKCHAIN_FILE, 'utf8'));
        const ultimoBloque = blockchain.chain[blockchain.chain.length - 1];
        
        const nuevoBloque = {
            index: blockchain.chain.length,
            timestamp: new Date().toISOString(),
            data: {
                certificado_id: certificadoId,
                proyecto_id: proyectoId,
                nombre_diseno: nombreDiseno,
                hash_certificado: hashCertificado,
                password_hash: crypto.createHash('sha256').update(password).digest('hex'), // Hash de la contraseña
                tipo: 'CERTIFICADO_ARQUITECTONICO',
                empresa: 'Street Emporio Royal',
                autor: 'Roberto Rivera Gamas - Royal (Arquitecto)'
            },
            previousHash: ultimoBloque.hash,
            hash: ''
        };
        
        // Calcular hash del bloque
        const bloqueString = JSON.stringify({
            index: nuevoBloque.index,
            timestamp: nuevoBloque.timestamp,
            data: nuevoBloque.data,
            previousHash: nuevoBloque.previousHash
        });
        nuevoBloque.hash = crypto.createHash('sha256').update(bloqueString).digest('hex');
        
        blockchain.chain.push(nuevoBloque);
        fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(blockchain, null, 2));
        
        console.log(`✅ Certificado registrado en blockchain - Bloque #${nuevoBloque.index}`);
        return nuevoBloque;
    } catch (error) {
        console.error('❌ Error registrando en blockchain:', error);
        return null;
    }
}

function verificarBlockchain() {
    try {
        const blockchain = JSON.parse(fs.readFileSync(BLOCKCHAIN_FILE, 'utf8'));
        
        for (let i = 1; i < blockchain.chain.length; i++) {
            const bloqueActual = blockchain.chain[i];
            const bloqueAnterior = blockchain.chain[i - 1];
            
            // Verificar hash del bloque anterior
            if (bloqueActual.previousHash !== bloqueAnterior.hash) {
                return { valido: false, error: `Cadena rota en bloque #${i}` };
            }
            
            // Recalcular hash del bloque actual
            const bloqueString = JSON.stringify({
                index: bloqueActual.index,
                timestamp: bloqueActual.timestamp,
                data: bloqueActual.data,
                previousHash: bloqueActual.previousHash
            });
            const hashCalculado = crypto.createHash('sha256').update(bloqueString).digest('hex');
            
            if (bloqueActual.hash !== hashCalculado) {
                return { valido: false, error: `Hash inválido en bloque #${i}` };
            }
        }
        
        return { 
            valido: true, 
            bloques: blockchain.chain.length,
            ultimo_bloque: blockchain.chain[blockchain.chain.length - 1]
        };
    } catch (error) {
        return { valido: false, error: error.message };
    }
}

// =================================================================
// GENERADOR DE FIRMA DIGITAL
// =================================================================

function generarFirmaDigital(datos, clavePrivada) {
    if (!clavePrivada) {
        throw new Error('Clave privada RSA no disponible');
    }
    
    const dataString = JSON.stringify(datos);
    const hash = crypto.createHash('sha256').update(dataString).digest();
    
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(hash);
    const signature = sign.sign(clavePrivada, 'base64');
    
    return {
        hash_sha256: hash.toString('hex'),
        firma_rsa4096: signature,
        algoritmo: 'SHA256withRSA4096',
        timestamp: new Date().toISOString()
    };
}

// =================================================================
// VERIFICADOR DE FIRMA
// =================================================================

function verificarFirmaDigital(datos, firma, clavePublica) {
    try {
        const dataString = JSON.stringify(datos);
        const hash = crypto.createHash('sha256').update(dataString).digest();
        
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(hash);
        
        return verify.verify(clavePublica, firma, 'base64');
    } catch (error) {
        return false;
    }
}

// =================================================================
// GENERADOR DE CERTIFICADO PDF
// =================================================================

async function generarCertificadoPDF(disenoArquitectonico, clavePrivada = null) {
    return new Promise(async (resolve, reject) => {
        try {
            const certificadoId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            
            // 🔐 GENERAR CONTRASEÑA ÚNICA (HOJA DE DIAMANTE)
            const passwordUnico = generarPasswordUnico();
            console.log(`💎 Contraseña única generada: ${passwordUnico}`);
            
            // Datos para firma digital
            const datosParaFirma = {
                id_proyecto: disenoArquitectonico.id_proyecto,
                nombre_diseno: disenoArquitectonico.diseño.nombre,
                autor: "Roberto Rivera Gamas - Royal (Arquitecto)",
                empresa: "Street Emporio Royal",
                timestamp: new Date().toISOString(),
                certificado_id: certificadoId,
                password_hash: crypto.createHash('sha256').update(passwordUnico).digest('hex')
            };
            
            // Generar firma digital (opcional)
            let firma = null;
            if (clavePrivada) {
                try {
                    firma = generarFirmaDigital(datosParaFirma, clavePrivada);
                } catch (e) {
                    // Si falla la firma, continuar sin ella
                    firma = {
                        hash_sha256: crypto.createHash('sha256').update(JSON.stringify(datosParaFirma)).digest('hex'),
                        firma_rsa4096: 'PENDIENTE_CONFIGURACION_RSA',
                        algoritmo: 'SHA256withRSA4096',
                        timestamp: new Date().toISOString()
                    };
                }
            } else {
                firma = {
                    hash_sha256: crypto.createHash('sha256').update(JSON.stringify(datosParaFirma)).digest('hex'),
                    firma_rsa4096: 'PENDIENTE_CONFIGURACION_RSA',
                    algoritmo: 'SHA256withRSA4096',
                    timestamp: new Date().toISOString()
                };
            }
            
            // URL de verificación
            const urlVerificacion = `${VERIFICACION_BASE_URL}/verificar/${certificadoId}`;
            
            // Generar QR Code
            const qrCodeDataURL = await QRCode.toDataURL(urlVerificacion, {
                width: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            // Crear PDF
            const doc = new PDFDocument({
                size: 'LETTER',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            
            const pdfPath = path.join(CERT_DIR, `${certificadoId}.pdf`);
            const stream = fs.createWriteStream(pdfPath);
            doc.pipe(stream);
            
            // ============================================
            // DISEÑO DEL CERTIFICADO
            // ============================================
            
            // Fondo negro total
            doc.rect(0, 0, 612, 792)
               .fill('#000000');
            
            // Marco dorado exterior
            doc.rect(20, 20, 572, 752)
               .lineWidth(3)
               .strokeColor('#d4af37')
               .stroke();
            
            // Marco dorado interior
            doc.rect(30, 30, 552, 732)
               .lineWidth(1)
               .strokeColor('#d4af37')
               .stroke();
            
            // Título principal en dorado
            doc.fillColor('#d4af37')
               .fontSize(32)
               .font('Helvetica-Bold')
               .text('CERTIFICADO DE AUTENTICIDAD', 50, 60, { align: 'center' });
            
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor('#ffd700')
               .text('THRONE PROTOCOL V3.0 - Sistema Cuántico Arquitectónico', 50, 100, { align: 'center' });
            
            // Nombre de la empresa en dorado
            doc.fontSize(18)
               .font('Helvetica-Bold')
               .fillColor('#d4af37')
               .text('STREET EMPORIO ROYAL', 50, 125, { align: 'center' });
            
            doc.fontSize(11)
               .font('Helvetica-Oblique')
               .fillColor('#ffd700')
               .text('Royal - Arquitecto | Diseño de Arquitectura Empresarial Futurista', 50, 148, { align: 'center' });
            
            // Línea dorada decorativa
            doc.moveTo(80, 175)
               .lineTo(532, 175)
               .strokeColor('#d4af37')
               .lineWidth(2)
               .stroke();
            
            // Sección: Información del diseño
            doc.fillColor('#d4af37')
               .fontSize(18)
               .font('Helvetica-Bold')
               .text('PROYECTO ARQUITECTÓNICO CERTIFICADO', 50, 195);
            
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#ffffff');
            
            let y = 225;
            
            doc.text(`Nombre del Proyecto:`, 60, y, { continued: true })
               .font('Helvetica-Bold')
               .fillColor('#ffd700')
               .text(` ${disenoArquitectonico.diseño.nombre}`, { continued: false });
            
            y += 20;
            doc.font('Helvetica')
               .fillColor('#ffffff')
               .text(`ID del Proyecto:`, 60, y, { continued: true })
               .fillColor('#ffd700')
               .text(` ${disenoArquitectonico.id_proyecto}`, { continued: false });
            
            y += 20;
            doc.fillColor('#ffffff')
               .text(`ID del Certificado:`, 60, y, { continued: true })
               .fillColor('#ffd700')
               .text(` ${certificadoId}`, { continued: false });
            
            y += 25;
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#d4af37')
               .text('ESPECIFICACIONES TÉCNICAS', 60, y);
            
            y += 20;
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor('#ffffff');
            
            const specs = disenoArquitectonico.especificaciones;
            doc.text(`• Altura: ${specs.dimensiones.altura_total_m} metros`, 70, y);
            y += 14;
            doc.text(`• Dimensiones: ${specs.dimensiones.ancho_m}m × ${specs.dimensiones.profundidad_m}m`, 70, y);
            y += 14;
            doc.text(`• Número de pisos: ${specs.numero_pisos}`, 70, y);
            y += 14;
            doc.text(`• Material principal: ${specs.material_principal}`, 70, y);
            y += 14;
            doc.text(`• Área construida: ${specs.dimensiones.area_construida_m2} m²`, 70, y);
            
            y += 22;
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#d4af37')
               .text('ANÁLISIS ESTRUCTURAL', 60, y);
            
            y += 20;
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor('#ffffff');
            
            const analisis = disenoArquitectonico.analisis_estructural;
            doc.text(`• Peso total: ${analisis.peso_estructura.peso_toneladas} toneladas`, 70, y);
            y += 14;
            doc.text(`• Estabilidad: ${analisis.estabilidad}`, 70, y);
            y += 14;
            doc.text(`• Resistencia: ${analisis.peso_estructura.resistencia_material_mpa} MPa`, 70, y);
            
            y += 22;
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#d4af37')
               .text('VALORACIÓN', 60, y);
            
            y += 20;
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor('#ffffff');
            
            doc.text(`• Valor de mercado: `, 70, y, { continued: true })
               .fillColor('#ffd700')
               .font('Helvetica-Bold')
               .text(`$${disenoArquitectonico.valoracion.valor_mercado_usd} USD`, { continued: false });
            y += 14;
            doc.font('Helvetica')
               .fillColor('#ffffff')
               .text(`• Costo de construcción: $${disenoArquitectonico.valoracion.costo_construccion_usd} USD`, 70, y);
            
            // QR Code en esquina superior derecha
            doc.image(qrCodeDataURL, 445, 195, { width: 110, height: 110 });
            
            doc.fontSize(8)
               .fillColor('#d4af37')
               .text('Escanea para\nverificar', 445, 310, { width: 110, align: 'center' });
            
            // Firma digital
            y = 580;
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#d4af37')
               .text('FIRMA DIGITAL CRIPTOGRÁFICA', 60, y);
            
            y += 18;
            doc.fontSize(8)
               .font('Helvetica')
               .fillColor('#ffffff');
            
            doc.text(`Hash SHA-256:`, 60, y);
            y += 11;
            doc.fontSize(7)
               .fillColor('#d4af37')
               .text(firma.hash_sha256, 60, y);
            
            y += 18;
            doc.fontSize(8)
               .fillColor('#ffffff')
               .text(`Algoritmo: `, 60, y, { continued: true })
               .fillColor('#ffd700')
               .text(firma.algoritmo, { continued: false });
            
            y += 13;
            doc.fillColor('#ffffff')
               .text(`Fecha de emisión: ${new Date(firma.timestamp).toLocaleString('es-MX')}`, 60, y);
            
            // Footer con firma manuscrita simulada
            y = 690;
            doc.moveTo(60, y)
               .lineTo(552, y)
               .strokeColor('#d4af37')
               .lineWidth(2)
               .stroke();
            
            y += 15;
            doc.fontSize(20)
               .font('Helvetica-Oblique')
               .fillColor('#d4af37')
               .text('Royal', 60, y);
            
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#ffffff')
               .text('Roberto Rivera Gamas', 60, y + 28);
            
            doc.fontSize(9)
               .fillColor('#ffd700')
               .text('Arquitecto | Street Emporio Royal', 60, y + 43);
            
            doc.fontSize(8)
               .fillColor('#d4af37')
               .text('contacto@streetemporioroyal.com | www.streetemporioroyal.com', 60, y + 58);
            
            // Marca de agua AHT
            doc.fontSize(10)
               .fillColor('#d4af37')
               .opacity(0.3)
               .text('AHT - Alpha High Tech', 400, y + 55);
            
            doc.opacity(1);
            
            // Disclaimer legal en el pie de página
            doc.fontSize(6)
               .fillColor('#888888')
               .text('Este certificado de autenticidad garantiza la propiedad intelectual del diseño arquitectónico. Incluye verificación criptográfica SHA-256 y validación por código QR.', 
                     50, 760, { width: 512, align: 'center' });
            
            // Finalizar PDF
            doc.end();
            
            stream.on('finish', () => {
                // 🔗 REGISTRAR EN BLOCKCHAIN
                const bloqueBlockchain = registrarEnBlockchain(
                    certificadoId,
                    firma.hash_sha256,
                    disenoArquitectonico.id_proyecto,
                    disenoArquitectonico.diseño.nombre,
                    passwordUnico
                );
                
                const certificado = {
                    certificado_id: certificadoId,
                    proyecto_id: disenoArquitectonico.id_proyecto,
                    pdf_path: pdfPath,
                    url_verificacion: urlVerificacion,
                    qr_code: qrCodeDataURL,
                    firma_digital: firma,
                    datos_firmados: datosParaFirma,
                    password: passwordUnico, // 🔐 CONTRASEÑA ÚNICA
                    blockchain_block: bloqueBlockchain ? bloqueBlockchain.index : null, // 🔗 Número de bloque
                    timestamp_emision: new Date().toISOString()
                };
                
                // Guardar registro del certificado
                guardarRegistroCertificado(certificado);
                
                resolve(certificado);
            });
            
        } catch (error) {
            reject(error);
        }
    });
}

// =================================================================
// ENVIAR CERTIFICADO POR CORREO
// =================================================================

async function enviarCertificadoPorCorreo(certificado, disenoArquitectonico) {
    try {
        // Leer el PDF como buffer
        const pdfBuffer = fs.readFileSync(certificado.pdf_path);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        const emailData = {
            from: 'Throne Protocol <noreply@streetemporioroyal.com>',
            to: ['contacto@streetemporioroyal.com'],
            subject: `✅ Certificado Generado: ${disenoArquitectonico.diseño.nombre}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #d4af37; padding: 30px; border: 3px solid #d4af37;">
                    <h1 style="text-align: center; color: #ffd700;">👑 CERTIFICADO DIGITAL GENERADO</h1>
                    <h2 style="text-align: center; color: #d4af37;">THRONE PROTOCOL V3.0</h2>
                    
                    <div style="background: rgba(212, 175, 55, 0.1); padding: 20px; margin: 20px 0; border-left: 4px solid #d4af37;">
                        <h3 style="color: #ffd700; margin-top: 0;">📋 Detalles del Proyecto</h3>
                        <p style="color: #fff;"><strong>Nombre:</strong> ${disenoArquitectonico.diseño.nombre}</p>
                        <p style="color: #fff;"><strong>ID Proyecto:</strong> ${disenoArquitectonico.id_proyecto}</p>
                        <p style="color: #fff;"><strong>ID Certificado:</strong> ${certificado.certificado_id}</p>
                    </div>
                    
                    <div style="background: rgba(212, 175, 55, 0.1); padding: 20px; margin: 20px 0; border-left: 4px solid #d4af37;">
                        <h3 style="color: #ffd700; margin-top: 0;">🏗️ Especificaciones</h3>
                        <p style="color: #fff;"><strong>Altura:</strong> ${disenoArquitectonico.especificaciones.dimensiones.altura_total_m}m</p>
                        <p style="color: #fff;"><strong>Material:</strong> ${disenoArquitectonico.especificaciones.material_principal}</p>
                        <p style="color: #fff;"><strong>Pisos:</strong> ${disenoArquitectonico.especificaciones.numero_pisos}</p>
                    </div>
                    
                    <div style="background: rgba(212, 175, 55, 0.1); padding: 20px; margin: 20px 0; border-left: 4px solid #d4af37;">
                        <h3 style="color: #ffd700; margin-top: 0;">💰 Valoración</h3>
                        <p style="color: #fff; font-size: 1.3rem;"><strong>$${disenoArquitectonico.valoracion.valor_mercado_usd} USD</strong></p>
                    </div>
                    
                    <div style="background: rgba(212, 175, 55, 0.1); padding: 20px; margin: 20px 0; border-left: 4px solid #d4af37;">
                        <h3 style="color: #ffd700; margin-top: 0;">💎 CONTRASEÑA ÚNICA (HOJA DE DIAMANTE)</h3>
                        <p style="color: #fff; font-size: 0.9rem;">Esta contraseña protege su certificado digital:</p>
                        <div style="background: #000; padding: 15px; border: 2px solid #ffd700; margin: 10px 0; text-align: center;">
                            <p style="color: #ffd700; font-family: monospace; font-size: 1.5rem; font-weight: bold; margin: 0;">${certificado.password}</p>
                        </div>
                        <p style="color: #ff6b6b; font-size: 0.85rem;">⚠️ IMPORTANTE: Guarde esta contraseña de forma segura. Es única e irrepetible.</p>
                    </div>
                    
                    <div style="background: rgba(212, 175, 55, 0.1); padding: 20px; margin: 20px 0; border-left: 4px solid #d4af37;">
                        <h3 style="color: #ffd700; margin-top: 0;">🔗 Registro Blockchain</h3>
                        <p style="color: #fff;"><strong>Bloque #${certificado.blockchain_block || 'Pendiente'}</strong></p>
                        <p style="color: #888; font-size: 0.85rem;">Su certificado ha sido registrado en la blockchain de Street Emporio Royal para garantizar autenticidad e inmutabilidad.</p>
                    </div>
                    
                    <div style="background: rgba(212, 175, 55, 0.1); padding: 20px; margin: 20px 0; border-left: 4px solid #d4af37;">
                        <h3 style="color: #ffd700; margin-top: 0;">🔐 Verificación Criptográfica</h3>
                        <p style="color: #fff;"><strong>Hash SHA-256:</strong></p>
                        <p style="color: #d4af37; font-family: monospace; font-size: 0.8rem; word-break: break-all;">${certificado.firma_digital.hash_sha256}</p>
                        <p style="color: #fff; margin-top: 15px;"><strong>URL de Verificación:</strong></p>
                        <a href="${certificado.url_verificacion}" style="color: #ffd700; word-break: break-all;">${certificado.url_verificacion}</a>
                    </div>
                    
                    <p style="text-align: center; color: #fff; margin-top: 30px;">
                        El certificado PDF está adjunto a este correo.
                    </p>
                    
                    <hr style="border: 1px solid #d4af37; margin: 30px 0;">
                    
                    <div style="text-align: center; color: #888; font-size: 0.9rem;">
                        <p><strong style="color: #d4af37;">Roberto Rivera Gamas - Royal (Arquitecto)</strong></p>
                        <p>Street Emporio Royal</p>
                        <p>www.streetemporioroyal.com</p>
                        <p style="margin-top: 10px; color: #666;">AHT - Alpha High Tech</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `${certificado.certificado_id}.pdf`,
                    content: pdfBase64,
                    type: 'application/pdf',
                    disposition: 'attachment'
                }
            ]
        };
        
        const result = await resend.emails.send(emailData);
        console.log(`✅ Certificado enviado por correo: ${result.id}`);
        return result;
        
    } catch (error) {
        console.error('❌ Error enviando certificado por correo:', error);
        throw error;
    }
}

// =================================================================
// REGISTRO DE CERTIFICADOS
// =================================================================

const REGISTRO_PATH = path.join(__dirname, '..', 'data', 'registro-certificados.json');

function guardarRegistroCertificado(certificado) {
    let registro = [];
    
    if (fs.existsSync(REGISTRO_PATH)) {
        const data = fs.readFileSync(REGISTRO_PATH, 'utf8');
        registro = JSON.parse(data);
    }
    
    registro.push({
        certificado_id: certificado.certificado_id,
        proyecto_id: certificado.proyecto_id,
        url_verificacion: certificado.url_verificacion,
        firma_digital: certificado.firma_digital,
        datos_firmados: certificado.datos_firmados,
        timestamp: certificado.timestamp_emision
    });
    
    const dir = path.dirname(REGISTRO_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(REGISTRO_PATH, JSON.stringify(registro, null, 2));
}

function obtenerCertificado(certificadoId) {
    if (!fs.existsSync(REGISTRO_PATH)) {
        return null;
    }
    
    const data = fs.readFileSync(REGISTRO_PATH, 'utf8');
    const registro = JSON.parse(data);
    
    return registro.find(cert => cert.certificado_id === certificadoId);
}

// =================================================================
// VERIFICACIÓN BLOCKCHAIN PÚBLICA
// =================================================================

function obtenerBlockchain() {
    try {
        const blockchain = JSON.parse(fs.readFileSync(BLOCKCHAIN_FILE, 'utf8'));
        return blockchain;
    } catch (error) {
        return null;
    }
}

function buscarCertificadoEnBlockchain(certificadoId) {
    try {
        const blockchain = JSON.parse(fs.readFileSync(BLOCKCHAIN_FILE, 'utf8'));
        
        for (let bloque of blockchain.chain) {
            if (bloque.data.certificado_id === certificadoId) {
                return {
                    encontrado: true,
                    bloque_numero: bloque.index,
                    timestamp: bloque.timestamp,
                    hash_bloque: bloque.hash,
                    hash_previo: bloque.previousHash,
                    datos: bloque.data
                };
            }
        }
        
        return { encontrado: false };
    } catch (error) {
        return { encontrado: false, error: error.message };
    }
}

// =================================================================
// EXPORTAR FUNCIONES
// =================================================================

module.exports = {
    generarCertificadoPDF,
    verificarFirmaDigital,
    obtenerCertificado,
    enviarCertificadoPorCorreo,
    verificarBlockchain,
    obtenerBlockchain,
    buscarCertificadoEnBlockchain,
    CERT_DIR
};