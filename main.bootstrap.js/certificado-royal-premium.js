// ============================================================
// CERTIFICADO ROYAL PREMIUM - ULTRA ALTA CALIDAD
// Diseño minimalista elegante - Throne Protocol V3.0
// ============================================================

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const certDir = path.join(__dirname, '..', 'certificados');
if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
}

async function generarCertificadoRoyalPremium(desarrollador, experiencia, clavePrivadaRSA = null) {
    console.log('👑 GENERANDO CERTIFICADO ROYAL PREMIUM - ULTRA ALTA CALIDAD...');
    
    const certificadoId = `ROYAL-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const timestamp = new Date();
    
    // Generar Hash y Firma Digital RSA-4096
    const datosHash = {
        tipo: "CERTIFICADO_ROYAL_PREMIUM",
        id: certificadoId,
        desarrollador: desarrollador,
        experiencia: experiencia,
        timestamp: timestamp.toISOString(),
        emisor: "Street Emporio Royal",
        arquitecto: "Roberto Rivera Gamas - Royal"
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
            console.log('✅ Firma RSA-4096 generada');
        } catch (error) {
            console.warn('⚠️ Error generando firma RSA:', error.message);
        }
    }
    
    // QR Code dorado elegante
    const qrData = JSON.stringify({
        tipo: "ROYAL_PREMIUM",
        id: certificadoId,
        dev: desarrollador,
        hash: hash.substring(0, 16)
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 180,
        margin: 1,
        color: { dark: '#d4af37', light: '#000000' }
    });
    
    // Crear PDF
    const pdfPath = path.join(certDir, `Certificado-Royal-Premium-${certificadoId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // ============================================
    // DISEÑO ULTRA PREMIUM MINIMALISTA
    // ============================================
    
    // Fondo negro profundo
    doc.rect(0, 0, 612, 792).fill('#000000');
    
    // Marco dorado elegante triple
    const margen = 45;
    const margen2 = 52;
    const margen3 = 58;
    
    // Marco exterior dorado claro
    doc.rect(margen, margen, 612 - (margen * 2), 792 - (margen * 2))
       .lineWidth(3)
       .strokeColor('#d4af37')
       .stroke();
    
    // Marco medio dorado brillante
    doc.rect(margen2, margen2, 612 - (margen2 * 2), 792 - (margen2 * 2))
       .lineWidth(1.5)
       .strokeColor('#ffd700')
       .stroke();
    
    // Marco interior dorado suave
    doc.rect(margen3, margen3, 612 - (margen3 * 2), 792 - (margen3 * 2))
       .lineWidth(0.8)
       .strokeColor('#d4af37')
       .stroke();
    
    // Esquinas decorativas minimalistas
    const cornerLen = 35;
    const cornerMargin = margen3;
    
    // Esquina superior izquierda
    doc.moveTo(cornerMargin, cornerMargin + cornerLen)
       .lineTo(cornerMargin, cornerMargin)
       .lineTo(cornerMargin + cornerLen, cornerMargin)
       .strokeColor('#ffd700')
       .lineWidth(2)
       .stroke();
    
    // Esquina superior derecha
    doc.moveTo(612 - cornerMargin - cornerLen, cornerMargin)
       .lineTo(612 - cornerMargin, cornerMargin)
       .lineTo(612 - cornerMargin, cornerMargin + cornerLen)
       .stroke();
    
    // Esquina inferior izquierda
    doc.moveTo(cornerMargin + cornerLen, 792 - cornerMargin)
       .lineTo(cornerMargin, 792 - cornerMargin)
       .lineTo(cornerMargin, 792 - cornerMargin - cornerLen)
       .stroke();
    
    // Esquina inferior derecha
    doc.moveTo(612 - cornerMargin, 792 - cornerMargin - cornerLen)
       .lineTo(612 - cornerMargin, 792 - cornerMargin)
       .lineTo(612 - cornerMargin - cornerLen, 792 - cornerMargin)
       .stroke();
    
    // ============================================
    // CONTENIDO ELEGANTE
    // ============================================
    
    // Logo/Marca superior
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#d4af37')
       .text('THRONE PROTOCOL V3.0', 0, 95, { align: 'center' });
    
    doc.fontSize(9)
       .fillColor('#8b7355')
       .text('Street Emporio Royal', 0, 112, { align: 'center' });
    
    // Separador dorado delicado
    const sepY = 140;
    doc.moveTo(220, sepY)
       .lineTo(392, sepY)
       .strokeColor('#d4af37')
       .lineWidth(0.5)
       .stroke();
    
    // Nombre del desarrollador - ESTILO MANUSCRITO
    const y1 = 200;
    doc.fontSize(42)
       .font('Helvetica-Oblique')
       .fillColor('#d4af37')
       .text(desarrollador, 80, y1, { 
           width: 452, 
           align: 'center'
       });
    
    // Subtítulo elegante
    doc.fontSize(13)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('DISEÑADOR DE ARQUITECTURA', 0, y1 + 70, { align: 'center' });
    
    doc.text('EMPRESARIAL FUTURISTA', 0, y1 + 90, { align: 'center' });
    
    // Separador central
    const sep2Y = y1 + 125;
    doc.moveTo(200, sep2Y)
       .lineTo(412, sep2Y)
       .strokeColor('#d4af37')
       .lineWidth(0.5)
       .stroke();
    
    // Certificación principal
    doc.fontSize(15)
       .font('Helvetica-Bold')
       .fillColor('#d4af37')
       .text('DESARROLLO PROFESIONAL', 0, sep2Y + 30, { align: 'center' });
    
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text(`${experiencia.meses} Meses de Experiencia Certificada`, 0, sep2Y + 55, { align: 'center' });
    
    // Competencias técnicas en columnas
    const col1X = 110;
    const col2X = 330;
    let compY = sep2Y + 100;
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#d4af37')
       .text('COMPETENCIAS TÉCNICAS', 0, compY, { align: 'center' });
    
    compY += 30;
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#cccccc');
    
    const mitad = Math.ceil(experiencia.tecnologias.length / 2);
    
    // Columna 1
    for (let i = 0; i < mitad; i++) {
        doc.text(`• ${experiencia.tecnologias[i]}`, col1X, compY + (i * 18), { width: 200 });
    }
    
    // Columna 2
    for (let i = mitad; i < experiencia.tecnologias.length; i++) {
        doc.text(`• ${experiencia.tecnologias[i]}`, col2X, compY + ((i - mitad) * 18), { width: 200 });
    }
    
    // Firma manuscrita simulada (estilo caligráfico)
    const firmaY = 620;
    doc.fontSize(32)
       .font('Helvetica-BoldOblique')
       .fillColor('#d4af37')
       .text('Royal', 0, firmaY, { align: 'center' });
    
    // Línea de firma dorada
    doc.moveTo(220, firmaY - 5)
       .lineTo(392, firmaY - 5)
       .strokeColor('#d4af37')
       .lineWidth(0.8)
       .stroke();
    
    // Nombre y título del firmante
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#999999')
       .text('Roberto Rivera Gamas - Royal', 0, firmaY + 45, { align: 'center' });
    
    doc.fontSize(8)
       .fillColor('#666666')
       .text('Arquitecto Principal • Street Emporio Royal', 0, firmaY + 60, { align: 'center' });
    
    // QR Code elegante en esquina
    const qrImage = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
    doc.image(qrImage, 70, 605, { width: 100, height: 100 });
    
    doc.fontSize(7)
       .fillColor('#666666')
       .text('Verificación', 70, 710, { width: 100, align: 'center' });
    
    // Información técnica minimalista en pie
    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#555555')
       .text(`ID: ${certificadoId}`, 0, 725, { align: 'center' });
    
    doc.fillColor('#444444')
       .text(`Hash: ${hash.substring(0, 32)}...`, 0, 738, { align: 'center' });
    
    if (firmaDigital) {
        doc.text(`RSA-4096: ${firmaDigital.substring(0, 24)}...`, 0, 751, { align: 'center' });
    }
    
    // Fecha elegante
    doc.fontSize(8)
       .fillColor('#666666')
       .text(timestamp.toLocaleDateString('es-MX', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
       }), 0, 765, { align: 'center' });
    
    doc.end();
    
    await new Promise(resolve => stream.on('finish', resolve));
    
    console.log(`✅ Certificado Royal Premium generado: ${pdfPath}`);
    
    return {
        certificado_id: certificadoId,
        tipo: 'ROYAL_PREMIUM',
        desarrollador: desarrollador,
        experiencia_meses: experiencia.meses,
        hash_sha256: hash,
        firma_rsa4096: firmaDigital ? firmaDigital.substring(0, 64) + '...' : null,
        pdf_path: pdfPath,
        timestamp: timestamp.toISOString()
    };
}

module.exports = {
    generarCertificadoRoyalPremium
};
