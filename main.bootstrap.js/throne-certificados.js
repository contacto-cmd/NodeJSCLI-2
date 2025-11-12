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

async function generarCertificadoPDF(disenoArquitectonico, clavePrivada) {
    return new Promise(async (resolve, reject) => {
        try {
            const certificadoId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            
            // Datos para firma digital
            const datosParaFirma = {
                id_proyecto: disenoArquitectonico.id_proyecto,
                nombre_diseno: disenoArquitectonico.diseño.nombre,
                autor: "Roberto Rivera Gamas - Arte Visualista-Royal",
                timestamp: new Date().toISOString(),
                certificado_id: certificadoId
            };
            
            // Generar firma digital
            const firma = generarFirmaDigital(datosParaFirma, clavePrivada);
            
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
            
            // Header dorado
            doc.rect(0, 0, 612, 100)
               .fill('#d4af37');
            
            // Título principal
            doc.fillColor('#000000')
               .fontSize(28)
               .font('Helvetica-Bold')
               .text('CERTIFICADO DE AUTENTICIDAD', 50, 30, { align: 'center' });
            
            doc.fontSize(12)
               .font('Helvetica')
               .text('THRONE PROTOCOL V3.0 - Sistema Cuántico', 50, 65, { align: 'center' });
            
            // Línea dorada
            doc.moveTo(50, 120)
               .lineTo(562, 120)
               .strokeColor('#d4af37')
               .lineWidth(2)
               .stroke();
            
            // Información del diseño
            doc.fillColor('#000000')
               .fontSize(16)
               .font('Helvetica-Bold')
               .text('PROYECTO ARQUITECTÓNICO CERTIFICADO', 50, 140);
            
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor('#333333');
            
            let y = 170;
            
            doc.text(`Nombre del Proyecto:`, 50, y, { continued: true })
               .font('Helvetica-Bold')
               .text(` ${disenoArquitectonico.diseño.nombre}`, { continued: false });
            
            y += 25;
            doc.font('Helvetica')
               .text(`ID del Proyecto:`, 50, y, { continued: true })
               .font('Helvetica-Bold')
               .text(` ${disenoArquitectonico.id_proyecto}`, { continued: false });
            
            y += 25;
            doc.font('Helvetica')
               .text(`ID del Certificado:`, 50, y, { continued: true })
               .font('Helvetica-Bold')
               .text(` ${certificadoId}`, { continued: false });
            
            y += 30;
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#d4af37')
               .text('ESPECIFICACIONES TÉCNICAS', 50, y);
            
            y += 25;
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#333333');
            
            const specs = disenoArquitectonico.especificaciones;
            doc.text(`• Altura: ${specs.dimensiones.altura_total_m} metros`, 50, y);
            y += 15;
            doc.text(`• Dimensiones: ${specs.dimensiones.ancho_m}m × ${specs.dimensiones.profundidad_m}m`, 50, y);
            y += 15;
            doc.text(`• Número de pisos: ${specs.numero_pisos}`, 50, y);
            y += 15;
            doc.text(`• Material principal: ${specs.material_principal}`, 50, y);
            y += 15;
            doc.text(`• Área construida: ${specs.dimensiones.area_construida_m2} m²`, 50, y);
            
            y += 30;
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#d4af37')
               .text('ANÁLISIS ESTRUCTURAL', 50, y);
            
            y += 25;
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#333333');
            
            const analisis = disenoArquitectonico.analisis_estructural;
            doc.text(`• Peso total: ${analisis.peso_estructura.peso_toneladas} toneladas`, 50, y);
            y += 15;
            doc.text(`• Estabilidad: ${analisis.estabilidad}`, 50, y);
            y += 15;
            doc.text(`• Resistencia: ${analisis.peso_estructura.resistencia_material_mpa} MPa`, 50, y);
            
            y += 30;
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#d4af37')
               .text('VALORACIÓN', 50, y);
            
            y += 25;
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#333333');
            
            doc.text(`• Valor de mercado: $${disenoArquitectonico.valoracion.valor_mercado_usd} USD`, 50, y);
            y += 15;
            doc.text(`• Costo de construcción: $${disenoArquitectonico.valoracion.costo_construccion_usd} USD`, 50, y);
            
            // QR Code
            doc.image(qrCodeDataURL, 420, 180, { width: 120, height: 120 });
            
            doc.fontSize(8)
               .fillColor('#666666')
               .text('Escanea para verificar', 420, 310, { width: 120, align: 'center' });
            
            // Firma digital
            y = 520;
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#d4af37')
               .text('FIRMA DIGITAL', 50, y);
            
            y += 20;
            doc.fontSize(8)
               .font('Helvetica')
               .fillColor('#333333');
            
            doc.text(`Hash SHA-256:`, 50, y);
            y += 12;
            doc.fontSize(7)
               .fillColor('#666666')
               .text(firma.hash_sha256, 50, y);
            
            y += 20;
            doc.fontSize(8)
               .fillColor('#333333')
               .text(`Algoritmo: ${firma.algoritmo}`, 50, y);
            
            y += 15;
            doc.text(`Fecha de emisión: ${new Date(firma.timestamp).toLocaleString('es-MX')}`, 50, y);
            
            // Footer
            y = 680;
            doc.moveTo(50, y)
               .lineTo(562, y)
               .strokeColor('#d4af37')
               .lineWidth(1)
               .stroke();
            
            y += 15;
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor('#000000')
               .text('Roberto Rivera Gamas', 50, y);
            
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor('#666666')
               .text('Arte Visualista-Royal | Diseñador de Arquitectura Empresarial Futurista', 50, y + 15);
            
            doc.fontSize(8)
               .text('contacto@streetemporioroyal.com', 50, y + 30);
            
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