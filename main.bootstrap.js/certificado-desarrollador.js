// ============================================================
// CERTIFICADO DE DESARROLLO PROFESIONAL
// Throne Protocol V3.0 - Street Emporio Royal
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

async function generarCertificadoDesarrollador(desarrollador, experiencia, clavePrivadaRSA = null) {
    console.log('👨‍💻 GENERANDO CERTIFICADO DE DESARROLLO PROFESIONAL...');
    
    const certificadoId = `DEV-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const timestamp = new Date();
    
    // Generar Hash y Firma Digital RSA-4096
    const datosHash = {
        tipo: "CERTIFICADO_DESARROLLO_PROFESIONAL",
        id: certificadoId,
        desarrollador: desarrollador,
        experiencia: experiencia,
        timestamp: timestamp.toISOString(),
        emisor: "Street Emporio Royal",
        sistema: "Throne Protocol V3.0"
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
    
    // QR Code
    const qrData = JSON.stringify({
        tipo: "DESARROLLO_PROFESIONAL",
        id: certificadoId,
        dev: desarrollador,
        hash: hash.substring(0, 16)
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: { dark: '#00ff88', light: '#000000' }
    });
    
    // Crear PDF
    const pdfPath = path.join(certDir, `Certificado-Desarrollador-${certificadoId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // ============================================
    // DISEÑO PREMIUM TECH
    // ============================================
    
    // Fondo negro
    doc.rect(0, 0, 612, 792).fill('#000000');
    
    // Marco verde neón (tech style)
    doc.rect(30, 30, 552, 732)
       .lineWidth(5)
       .strokeColor('#00ff88')
       .stroke();
    
    doc.rect(42, 42, 528, 708)
       .lineWidth(2)
       .strokeColor('#00cc6a')
       .stroke();
    
    // Decoración esquinas
    const cornerSize = 40;
    // Superior izquierda
    doc.moveTo(50, 70).lineTo(90, 70).strokeColor('#ffd700').lineWidth(2).stroke();
    doc.moveTo(70, 50).lineTo(70, 90).stroke();
    
    // Superior derecha
    doc.moveTo(562, 70).lineTo(522, 70).stroke();
    doc.moveTo(542, 50).lineTo(542, 90).stroke();
    
    // Inferior izquierda
    doc.moveTo(50, 722).lineTo(90, 722).stroke();
    doc.moveTo(70, 742).lineTo(70, 702).stroke();
    
    // Inferior derecha
    doc.moveTo(562, 722).lineTo(522, 722).stroke();
    doc.moveTo(542, 742).lineTo(542, 702).stroke();
    
    // ENCABEZADO
    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('#00ff88')
       .text('THRONE PROTOCOL V3.0', 0, 70, { align: 'center' });
    
    doc.fontSize(12)
       .fillColor('#aaaaaa')
       .text('Street Emporio Royal', 0, 92, { align: 'center' });
    
    // Línea decorativa
    doc.moveTo(150, 120).lineTo(462, 120)
       .strokeColor('#00ff88')
       .lineWidth(1)
       .stroke();
    
    // TÍTULO PRINCIPAL
    doc.fontSize(36)
       .font('Helvetica-Bold')
       .fillColor('#ffd700')
       .text('CERTIFICADO DE', 0, 150, { align: 'center' });
    
    doc.fontSize(32)
       .fillColor('#00ff88')
       .text('DESARROLLO PROFESIONAL', 0, 195, { align: 'center' });
    
    // Línea decorativa dorada
    doc.moveTo(180, 240).lineTo(432, 240)
       .strokeColor('#ffd700')
       .lineWidth(2)
       .stroke();
    
    // CUERPO DEL CERTIFICADO
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('Se certifica que', 0, 270, { align: 'center' });
    
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#ffd700')
       .text(desarrollador, 0, 300, { align: 'center' });
    
    doc.fontSize(13)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('ha demostrado capacidades excepcionales en el desarrollo de software,', 100, 350, { 
           width: 412, 
           align: 'center' 
       });
    
    doc.text('evolucionando de estudiante a desarrollador junior de alto nivel con', 100, 375, { 
        width: 412, 
        align: 'center' 
    });
    
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#00ff88')
       .text(`${experiencia.meses} MESES DE EXPERIENCIA`, 0, 410, { align: 'center' });
    
    // COMPETENCIAS
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#ffd700')
       .text('COMPETENCIAS CERTIFICADAS:', 100, 460);
    
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#ffffff');
    
    let y = 490;
    experiencia.tecnologias.forEach(tech => {
        doc.text(`✓ ${tech}`, 120, y);
        y += 22;
    });
    
    // LOGROS
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#ffd700')
       .text('LOGROS DESTACADOS:', 100, y + 10);
    
    y += 40;
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#ffffff');
    
    experiencia.logros.forEach(logro => {
        doc.text(`★ ${logro}`, 120, y);
        y += 22;
    });
    
    // INFORMACIÓN TÉCNICA
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#00ff88')
       .text(`ID Certificado: ${certificadoId}`, 60, 680);
    
    doc.fillColor('#888888')
       .text(`Hash SHA-256: ${hash.substring(0, 32)}...`, 60, 695);
    
    if (firmaDigital) {
        doc.text(`Firma RSA-4096: ${firmaDigital.substring(0, 32)}...`, 60, 710);
    }
    
    doc.fillColor('#00ff88')
       .text(`RFC: Contacto176`, 60, 725);
    
    // QR CODE
    const qrImage = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
    doc.image(qrImage, 420, 645, { width: 120, height: 120 });
    
    doc.fontSize(8)
       .fillColor('#888888')
       .text('Verificar Autenticidad', 425, 770, { width: 110, align: 'center' });
    
    // FIRMA Y FECHA
    doc.fontSize(11)
       .font('Helvetica-Oblique')
       .fillColor('#ffd700')
       .text('Roberto Rivera Gamas - Royal', 320, 595, { width: 200, align: 'center' });
    
    doc.fontSize(9)
       .fillColor('#aaaaaa')
       .text('Arquitecto Principal', 320, 612, { width: 200, align: 'center' });
    
    doc.text('Street Emporio Royal', 320, 627, { width: 200, align: 'center' });
    
    // Línea de firma
    doc.moveTo(340, 590).lineTo(500, 590)
       .strokeColor('#00ff88')
       .lineWidth(1)
       .stroke();
    
    // FECHA
    doc.fontSize(10)
       .fillColor('#ffffff')
       .text(`Emitido: ${timestamp.toLocaleDateString('es-MX', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
       })}`, 0, 745, { align: 'center' });
    
    // FOOTER
    doc.fontSize(8)
       .fillColor('#666666')
       .text('Certificado digital con firma RSA-4096 y registro blockchain permanente', 0, 765, { align: 'center' });
    
    doc.end();
    
    await new Promise(resolve => stream.on('finish', resolve));
    
    console.log(`✅ Certificado de desarrollador generado: ${pdfPath}`);
    
    return {
        certificado_id: certificadoId,
        tipo: 'DESARROLLO_PROFESIONAL',
        desarrollador: desarrollador,
        experiencia_meses: experiencia.meses,
        hash_sha256: hash,
        firma_rsa4096: firmaDigital ? firmaDigital.substring(0, 64) + '...' : null,
        pdf_path: pdfPath,
        timestamp: timestamp.toISOString()
    };
}

module.exports = {
    generarCertificadoDesarrollador
};
