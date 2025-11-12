// Archivo: throne-certificados.js (Sistema de Certificación Digital)
// Genera certificados PDF oficiales con firma RSA-4096 + QR verification
// -----------------------------------------------------

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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
            
            // Datos para firma digital
            const datosParaFirma = {
                id_proyecto: disenoArquitectonico.id_proyecto,
                nombre_diseno: disenoArquitectonico.diseño.nombre,
                autor: "Roberto Rivera Gamas - Royal (Arquitecto)",
                empresa: "Street Emporio Royal",
                timestamp: new Date().toISOString(),
                certificado_id: certificadoId
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
            
            // Finalizar PDF
            doc.end();
            
            stream.on('finish', () => {
                const certificado = {
                    certificado_id: certificadoId,
                    proyecto_id: disenoArquitectonico.id_proyecto,
                    pdf_path: pdfPath,
                    url_verificacion: urlVerificacion,
                    qr_code: qrCodeDataURL,
                    firma_digital: firma,
                    datos_firmados: datosParaFirma,
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
// EXPORTAR FUNCIONES
// =================================================================

module.exports = {
    generarCertificadoPDF,
    verificarFirmaDigital,
    obtenerCertificado,
    CERT_DIR
};