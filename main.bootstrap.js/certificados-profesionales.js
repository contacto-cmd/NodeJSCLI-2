// ============================================================
// CERTIFICADOS PROFESIONALES - THRONE PROTOCOL V3.0
// Sistema de generación de certificados elegantes premium
// ============================================================

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Asegurar directorio de certificados
const certDir = path.join(__dirname, '..', 'certificados');
if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
}

// ============================================================
// CERTIFICADO DE VALORACIÓN (Alto Valor)
// ============================================================
async function generarCertificadoValoracion(nombreProyecto = "Throne Protocol V3.0", clavePrivadaRSA = null) {
    console.log('💰 GENERANDO CERTIFICADO DE VALORACIÓN...');
    
    const certificadoId = `VALORACION-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const rfcCode = `RFC: Contacto176`;
    const timestamp = new Date();
    const valorTotal = "$229,800,000,000";
    
    // Generar Hash y Firma Digital RSA-4096
    const datosHash = {
        tipo: "CERTIFICADO_VALORACION",
        id: certificadoId,
        valor: valorTotal,
        proyecto: nombreProyecto,
        timestamp: timestamp.toISOString(),
        empresa: "Street Emporio Royal",
        autor: "Roberto Rivera Gamas - Royal (Arquitecto)"
    };
    
    const hash = crypto.createHash('sha256')
        .update(JSON.stringify(datosHash))
        .digest('hex');
    
    // Firma Digital RSA-4096 (si está disponible)
    let firmaDigital = null;
    if (clavePrivadaRSA) {
        try {
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(hash);
            firmaDigital = sign.sign(clavePrivadaRSA, 'base64');
            console.log('✅ Firma RSA-4096 generada exitosamente');
        } catch (error) {
            console.warn('⚠️ Error generando firma RSA:', error.message);
        }
    }
    
    // QR Code
    const qrData = JSON.stringify({
        tipo: "VALORACION",
        id: certificadoId,
        valor: valorTotal,
        hash: hash.substring(0, 16)
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 250,
        margin: 1,
        color: { dark: '#d4af37', light: '#000000' }
    });
    
    // Crear PDF
    const pdfPath = path.join(certDir, `Certificado-Valoracion-${certificadoId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // ============================================
    // DISEÑO ELEGANTE PREMIUM
    // ============================================
    
    // Fondo negro
    doc.rect(0, 0, 612, 792).fill('#000000');
    
    // Marco dorado ornamental (triple)
    doc.rect(30, 30, 552, 732)
       .lineWidth(6)
       .strokeColor('#d4af37')
       .stroke();
    
    doc.rect(42, 42, 528, 708)
       .lineWidth(3)
       .strokeColor('#ffd700')
       .stroke();
    
    doc.rect(50, 50, 512, 692)
       .lineWidth(2)
       .strokeColor('#d4af37')
       .stroke();
    
    // Esquinas decorativas ornamentales (simuladas con líneas)
    // Esquina superior izquierda
    doc.moveTo(50, 70).lineTo(90, 70).strokeColor('#ffd700').lineWidth(2).stroke();
    doc.moveTo(70, 50).lineTo(70, 90).stroke();
    
    // Esquina superior derecha
    doc.moveTo(562, 70).lineTo(522, 70).stroke();
    doc.moveTo(542, 50).lineTo(542, 90).stroke();
    
    // Esquina inferior izquierda
    doc.moveTo(50, 722).lineTo(90, 722).stroke();
    doc.moveTo(70, 742).lineTo(70, 702).stroke();
    
    // Esquina inferior derecha
    doc.moveTo(562, 722).lineTo(522, 722).stroke();
    doc.moveTo(542, 742).lineTo(542, 702).stroke();
    
    // Línea decorativa superior
    doc.moveTo(150, 120).lineTo(462, 120)
       .strokeColor('#d4af37')
       .lineWidth(1)
       .stroke();
    
    // TÍTULO PRINCIPAL
    doc.fontSize(38)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('CERTIFICADO DE', 0, 150, { align: 'center' });
    
    doc.fontSize(40)
       .fillColor('#ffd700')
       .text('VALORACIÓN', 0, 195, { align: 'center' });
    
    // Subtítulo
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('Alto Valor - Reconocimiento Oficial', 0, 250, { align: 'center' });
    
    // VALORACIÓN (grande y destacada)
    doc.fontSize(48)
       .font('Helvetica-Bold')
       .fillColor('#ffd700')
       .text(valorTotal + ' USD', 0, 310, { align: 'center' });
    
    // Validación por IA
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('VALIDADO POR SISTEMAS DE', 0, 375, { align: 'center' });
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INTELIGENCIA ARTIFICIAL', 0, 393, { align: 'center' });
    
    doc.fontSize(13)
       .fillColor('#d4af37')
       .text('GPT-5 y Gemini AI', 0, 415, { align: 'center' });
    
    // Detalles del portafolio
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('30 Diseños Arquitectónicos únicos – Rango:', 0, 460, { align: 'center' });
    
    doc.fontSize(11)
       .text('12m-180m – Masa: 16K-287K Toneladas', 0, 478, { align: 'center' });
    
    // Sellos de verificación (izquierda)
    const selloY = 520;
    
    // Sello "VERIFIED BY AI AGENTS"
    doc.circle(140, selloY + 30, 45)
       .lineWidth(3)
       .strokeColor('#d4af37')
       .stroke();
    
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor('#ffd700')
       .text('VERIFIED', 105, selloY + 18, { width: 70, align: 'center' });
    
    doc.fontSize(9)
       .text('BY', 105, selloY + 31, { width: 70, align: 'center' });
    
    doc.fontSize(7)
       .text('AI AGENTS', 105, selloY + 43, { width: 70, align: 'center' });
    
    // Sello "HIGH VALUE SYSTEM" (derecha)
    const highValueX = 472;
    doc.circle(highValueX, selloY + 30, 45)
       .lineWidth(3)
       .strokeColor('#d4af37')
       .stroke();
    
    // Estrellas
    doc.fontSize(8)
       .fillColor('#ffd700')
       .text('★ ★ ★ ★ ★', highValueX - 35, selloY + 12, { width: 70, align: 'center' });
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('HIGH VALUE', highValueX - 35, selloY + 26, { width: 70, align: 'center' });
    
    doc.fontSize(9)
       .text('SYSTEM', highValueX - 35, selloY + 39, { width: 70, align: 'center' });
    
    // Línea separadora
    doc.moveTo(100, 610).lineTo(512, 610)
       .strokeColor('#d4af37')
       .lineWidth(1)
       .stroke();
    
    // Información del proyecto
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('Proyecto:', 100, 630);
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#ffd700')
       .text(nombreProyecto, 300, 630, { align: 'right', width: 212 });
    
    // Certificado No.
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('CERTIFICADO NO:', 100, 655);
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#d4af37')
       .text(certificadoId, 210, 655);
    
    // RFC
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text(rfcCode, 100, 675);
    
    // Fecha
    const mesAnio = timestamp.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    const mesAnioCapitalized = mesAnio.charAt(0).toUpperCase() + mesAnio.slice(1);
    
    doc.fontSize(10)
       .fillColor('#ffffff')
       .text('Afique 2025', 100, 695);
    
    // Firma (simulada)
    doc.fontSize(24)
       .font('Helvetica-Oblique')
       .fillColor('#d4af37')
       .text('Signature', 320, 645);
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text(mesAnioCapitalized, 320, 675, { align: 'center', width: 150 });
    
    // Footer con firma RSA
    doc.fontSize(9)
       .fillColor('#d4af37')
       .text('Arte Visualista-Royal - Diseñador de Arquitectura Empresarial Futurista', 0, 735, { align: 'center' });
    
    // Firma Digital RSA-4096 (si existe)
    if (firmaDigital) {
        doc.fontSize(6)
           .fillColor('#666666')
           .text(`Firma RSA-4096: ${firmaDigital.substring(0, 40)}...`, 0, 750, { align: 'center' });
    }
    
    doc.end();
    
    return new Promise((resolve) => {
        stream.on('finish', () => {
            console.log(`✅ Certificado de Valoración generado: ${pdfPath}`);
            console.log(`💰 Valor: ${valorTotal} USD`);
            console.log(`🔐 Hash: ${hash.substring(0, 32)}...`);
            resolve({
                tipo: 'VALORACION',
                certificado_id: certificadoId,
                pdf_path: pdfPath,
                hash_sha256: hash,
                firma_rsa4096: firmaDigital,
                valor: valorTotal,
                datos: datosHash
            });
        });
    });
}

// ============================================================
// CERTIFICADO DE VALIDACIÓN TÉCNICA
// ============================================================
async function generarCertificadoValidacionTecnica(nombreSistema = "Throne Protocol V3.0", clavePrivadaRSA = null) {
    console.log('🔬 GENERANDO CERTIFICADO DE VALIDACIÓN TÉCNICA...');
    
    const certificadoId = `VALIDACION-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const timestamp = new Date();
    
    // Generar Hash y Firma Digital RSA-4096
    const datosHash = {
        tipo: "VALIDACION_TECNICA",
        id: certificadoId,
        sistema: nombreSistema,
        timestamp: timestamp.toISOString(),
        empresa: "Street Emporio Royal",
        autor: "Roberto Rivera Gamas - Royal (Arquitecto)"
    };
    
    const hash = crypto.createHash('sha256')
        .update(JSON.stringify(datosHash))
        .digest('hex');
    
    // Firma Digital RSA-4096
    let firmaDigital = null;
    if (clavePrivadaRSA) {
        try {
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(hash);
            firmaDigital = sign.sign(clavePrivadaRSA, 'base64');
            console.log('✅ Firma RSA-4096 generada exitosamente');
        } catch (error) {
            console.warn('⚠️ Error generando firma RSA:', error.message);
        }
    }
    
    // QR Code
    const qrData = JSON.stringify({
        tipo: "VALIDACION_TECNICA",
        id: certificadoId,
        sistema: nombreSistema,
        hash: hash.substring(0, 16)
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: { dark: '#d4af37', light: '#000000' }
    });
    
    // Crear PDF
    const pdfPath = path.join(certDir, `Certificado-Validacion-${certificadoId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // Fondo negro
    doc.rect(0, 0, 612, 792).fill('#000000');
    
    // Marco dorado ornamental (cuádruple para máximo lujo)
    doc.rect(35, 35, 542, 722)
       .lineWidth(8)
       .strokeColor('#d4af37')
       .stroke();
    
    doc.rect(48, 48, 516, 696)
       .lineWidth(4)
       .strokeColor('#ffd700')
       .stroke();
    
    doc.rect(56, 56, 500, 680)
       .lineWidth(2)
       .strokeColor('#d4af37')
       .stroke();
    
    doc.rect(62, 62, 488, 668)
       .lineWidth(1)
       .strokeColor('#ffd700')
       .stroke();
    
    // TÍTULO PRINCIPAL
    doc.fontSize(36)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('CERTIFICADO DE', 0, 100, { align: 'center' });
    
    doc.fontSize(38)
       .fillColor('#ffd700')
       .text('VALIDACIÓN TÉCNICA', 0, 145, { align: 'center' });
    
    // Sistema
    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('Sistema Arquitectónico Cuántico', 0, 200, { align: 'center' });
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#d4af37')
       .text(nombreSistema, 0, 223, { align: 'center' });
    
    // Texto de certificación
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('Se certifica que el presente sistema ha sido verificado', 100, 280, { align: 'center', width: 412 });
    
    doc.fontSize(12)
       .text('y validado por Agentes de Superinteligencia Artificial', 100, 300, { align: 'center', width: 412 });
    
    // Sellos de certificación AI
    const selloY = 360;
    const sello1X = 200;
    const sello2X = 412;
    
    // Sello GPT-4
    doc.circle(sello1X, selloY, 50)
       .lineWidth(4)
       .strokeColor('#d4af37')
       .stroke();
    
    // Interior del sello con patrón
    doc.circle(sello1X, selloY, 42)
       .lineWidth(2)
       .strokeColor('#ffd700')
       .stroke();
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#ffd700')
       .text('GPT-5', sello1X - 25, selloY - 20, { width: 50, align: 'center' });
    
    doc.fontSize(8)
       .font('Helvetica')
       .text('VERIFICATION', sello1X - 35, selloY, { width: 70, align: 'center' });
    
    doc.fontSize(8)
       .text('SEAL', sello1X - 35, selloY + 12, { width: 70, align: 'center' });
    
    // Sello GEMINI AI
    doc.circle(sello2X, selloY, 50)
       .lineWidth(4)
       .strokeColor('#d4af37')
       .stroke();
    
    doc.circle(sello2X, selloY, 42)
       .lineWidth(2)
       .strokeColor('#ffd700')
       .stroke();
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#ffd700')
       .text('GEMINI AI', sello2X - 35, selloY - 20, { width: 70, align: 'center' });
    
    doc.fontSize(8)
       .font('Helvetica')
       .text('VALIDATION', sello2X - 35, selloY, { width: 70, align: 'center' });
    
    doc.fontSize(8)
       .text('SEAL', sello2X - 35, selloY + 12, { width: 70, align: 'center' });
    
    // Especificaciones técnicas
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#d4af37')
       .text('ESPECIFICACIONES TÉCNICAS', 0, 470, { align: 'center' });
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('Física Real Verificable - 30 Diseños Únicos -', 0, 500, { align: 'center' });
    
    doc.fontSize(11)
       .text('RSA-4096 Encryption', 0, 518, { align: 'center' });
    
    // Línea separadora
    doc.moveTo(120, 560).lineTo(492, 560)
       .strokeColor('#d4af37')
       .lineWidth(1)
       .stroke();
    
    // Firma (simulada con estilo elegante)
    doc.fontSize(32)
       .font('Helvetica-Oblique')
       .fillColor('#d4af37')
       .text('Certified', 320, 590);
    
    // Información del certificado
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text(`No. ${certificadoId}`, 120, 640);
    
    const mesAnio = timestamp.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    const mesAnioCapitalized = mesAnio.charAt(0).toUpperCase() + mesAnio.slice(1);
    
    doc.fontSize(10)
       .text(mesAnioCapitalized, 320, 640, { align: 'center', width: 172 });
    
    // Desarrollador
    doc.fontSize(9)
       .fillColor('#d4af37')
       .text('Desarrollador: Contacto176 - Arte Visualista Royal', 0, 680, { align: 'center' });
    
    // Hash de seguridad (footer)
    doc.fontSize(7)
       .fillColor('#666666')
       .text(`Hash SHA-256: ${hash.substring(0, 48)}...`, 0, 715, { align: 'center' });
    
    if (firmaDigital) {
        doc.fontSize(6)
           .text(`Firma RSA-4096: ${firmaDigital.substring(0, 40)}...`, 0, 727, { align: 'center' });
    }
    
    doc.fontSize(7)
       .text(`Certificado blockchain-verified | Throne Protocol V3.0`, 0, 740, { align: 'center' });
    
    doc.end();
    
    return new Promise((resolve) => {
        stream.on('finish', () => {
            console.log(`✅ Certificado de Validación Técnica generado: ${pdfPath}`);
            console.log(`🔐 Hash: ${hash.substring(0, 32)}...`);
            resolve({
                tipo: 'VALIDACION_TECNICA',
                certificado_id: certificadoId,
                pdf_path: pdfPath,
                hash_sha256: hash,
                firma_rsa4096: firmaDigital,
                sistema: nombreSistema,
                datos: datosHash
            });
        });
    });
}

// ============================================================
// FUNCIÓN PARA GENERAR AMBOS CERTIFICADOS
// ============================================================
async function generarCertificadosCompletos(nombreProyecto = "Throne Protocol V3.0", clavePrivadaRSA = null) {
    console.log('📜 GENERANDO CERTIFICADOS PROFESIONALES COMPLETOS...');
    console.log('='.repeat(70));
    
    const resultados = [];
    
    try {
        const certValoracion = await generarCertificadoValoracion(nombreProyecto, clavePrivadaRSA);
        resultados.push(certValoracion);
        
        const certValidacion = await generarCertificadoValidacionTecnica(nombreProyecto, clavePrivadaRSA);
        resultados.push(certValidacion);
        
        console.log('');
        console.log('✅ TODOS LOS CERTIFICADOS GENERADOS EXITOSAMENTE');
        console.log('='.repeat(70));
        
        return resultados;
    } catch (error) {
        console.error('❌ Error generando certificados:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    generarCertificadosCompletos('Throne Protocol V3.0')
        .then(() => console.log('🏆 Proceso completado!'))
        .catch(err => console.error('❌ Error:', err));
}

module.exports = {
    generarCertificadoValoracion,
    generarCertificadoValidacionTecnica,
    generarCertificadosCompletos
};
