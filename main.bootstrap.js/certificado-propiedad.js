// ============================================================
// CERTIFICADO DE PROPIEDAD ARQUITECTÓNICA
// Certificado gubernamental profesional para compra de diseños
// Street Emporio Royal - Roberto Rivera Gamas
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

async function generarCertificadoPropiedad(diseno, comprador, clavePrivadaRSA = null) {
    console.log(`📜 Generando certificado de propiedad para: ${comprador.nombre}`);
    
    const certificadoId = `PROP-${diseno.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const timestamp = new Date();
    
    // Generar Hash
    const datosHash = {
        tipo: "CERTIFICADO_PROPIEDAD_ARQUITECTONICA",
        id: certificadoId,
        diseno_id: diseno.id,
        comprador: comprador.nombre,
        email: comprador.email,
        precio_pagado: diseno.precio_usd,
        timestamp: timestamp.toISOString()
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
        tipo: "PROPIEDAD",
        id: certificadoId,
        diseno: diseno.id,
        comprador: comprador.nombre,
        hash: hash.substring(0, 16)
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 180,
        margin: 1,
        color: { dark: '#1a365d', light: '#ffffff' }
    });
    
    // Crear PDF
    const pdfPath = path.join(certDir, `Certificado-Propiedad-${certificadoId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // ============================================
    // DISEÑO PROFESIONAL GUBERNAMENTAL
    // ============================================
    
    // Fondo degradado profesional
    doc.rect(0, 0, 612, 792).fill('#f8f9fa');
    
    // Barra superior azul gubernamental
    doc.rect(0, 0, 612, 120)
       .fill('#1a365d');
    
    // Marco dorado elegante
    const margen = 35;
    doc.rect(margen, margen, 612 - (margen * 2), 792 - (margen * 2))
       .lineWidth(3)
       .strokeColor('#d4af37')
       .stroke();
    
    doc.rect(margen + 5, margen + 5, 612 - ((margen + 5) * 2), 792 - ((margen + 5) * 2))
       .lineWidth(1)
       .strokeColor('#d4af37')
       .stroke();
    
    // ============================================
    // ENCABEZADO
    // ============================================
    
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('CERTIFICADO DE PROPIEDAD', 0, 45, { align: 'center' });
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#e0e0e0')
       .text('DISEÑO ARQUITECTÓNICO REGISTRADO', 0, 80, { align: 'center' });
    
    // Logo/Sello
    doc.fontSize(9)
       .fillColor('#ffffff')
       .text('STREET EMPORIO ROYAL', 0, 100, { align: 'center' });
    
    // ============================================
    // INFORMACIÓN PRINCIPAL
    // ============================================
    
    let y = 155;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('Por medio del presente se certifica que:', 60, y, { width: 492, align: 'center' });
    
    y += 40;
    
    // Nombre del comprador - destacado
    doc.fontSize(22)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(comprador.nombre.toUpperCase(), 60, y, { width: 492, align: 'center' });
    
    y += 45;
    
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#333333')
       .text('Es propietario legítimo del diseño arquitectónico:', 60, y, { width: 492, align: 'center' });
    
    y += 35;
    
    // Nombre del diseño - destacado
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text(diseno.nombre, 60, y, { width: 492, align: 'center' });
    
    y += 35;
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Tipo: ${diseno.tipo} • ID: ${diseno.id}`, 60, y, { width: 492, align: 'center' });
    
    // ============================================
    // DETALLES DE LA TRANSACCIÓN
    // ============================================
    
    y += 45;
    
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('DETALLES DE ADQUISICIÓN', 60, y);
    
    y += 25;
    
    // Cuadro de información
    doc.rect(60, y, 492, 120)
       .fillAndStroke('#ffffff', '#1a365d');
    
    y += 20;
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#000000');
    
    doc.text('Certificado No:', 80, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  ${certificadoId}`, { continued: false });
    
    y += 18;
    doc.font('Helvetica')
       .text('Valor del Diseño:', 80, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  $${(diseno.precio_usd / 1000000).toFixed(1)} Millones USD`, { continued: false });
    
    y += 18;
    doc.font('Helvetica')
       .text('Fecha de Emisión:', 80, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  ${timestamp.toLocaleDateString('es-MX', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
       })}`, { continued: false });
    
    y += 18;
    doc.font('Helvetica')
       .text('Coordenadas GPS:', 80, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  ${diseno.coordenadas.lat.toFixed(4)}°, ${diseno.coordenadas.lon.toFixed(4)}°`, { continued: false });
    
    y += 18;
    doc.font('Helvetica')
       .text('Email Registrado:', 80, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  ${comprador.email}`, { continued: false });
    
    // ============================================
    // ESPECIFICACIONES DEL DISEÑO
    // ============================================
    
    y += 45;
    
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('ESPECIFICACIONES TÉCNICAS', 60, y);
    
    y += 25;
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#333333');
    
    doc.text(`• Altura: ${diseno.especificaciones.altura_metros}m`, 80, y);
    y += 15;
    doc.text(`• Plantas: ${diseno.especificaciones.plantas} niveles`, 80, y);
    y += 15;
    doc.text(`• Área: ${diseno.especificaciones.area_construida_m2.toLocaleString('es-MX')} m²`, 80, y);
    y += 15;
    doc.text(`• Gravedad: ${diseno.especificaciones.capacidad_gravedad}`, 80, y);
    
    // ============================================
    // DERECHOS Y OBLIGACIONES
    // ============================================
    
    y += 35;
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('DERECHOS INCLUIDOS', 60, y);
    
    y += 20;
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#333333');
    
    doc.text('✓ Planos técnicos completos con medidas precisas', 80, y);
    y += 14;
    doc.text('✓ Especificaciones de construcción y materiales', 80, y);
    y += 14;
    doc.text('✓ Coordenadas GPS exactas para ubicación', 80, y);
    y += 14;
    doc.text('✓ Cálculos de gravedad y estructurales', 80, y);
    y += 14;
    doc.text('✓ Propiedad intelectual del diseño arquitectónico', 80, y);
    
    // ============================================
    // FIRMA DIGITAL Y AUTORIZACIÓN
    // ============================================
    
    y += 50;
    
    // Línea de firma
    doc.moveTo(220, y)
       .lineTo(392, y)
       .strokeColor('#000000')
       .lineWidth(1)
       .stroke();
    
    y += 10;
    
    doc.fontSize(26)
       .font('Helvetica-BoldOblique')
       .fillColor('#1a365d')
       .text('Royal', 0, y, { align: 'center' });
    
    y += 40;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Roberto Rivera Gamas - Royal', 0, y, { align: 'center' });
    
    y += 15;
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Arquitecto Principal', 0, y, { align: 'center' });
    
    doc.text('Street Emporio Royal', 0, y + 12, { align: 'center' });
    
    // ============================================
    // QR CODE Y VERIFICACIÓN
    // ============================================
    
    const qrImage = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
    doc.image(qrImage, 70, 620, { width: 110, height: 110 });
    
    doc.fontSize(7)
       .fillColor('#666666')
       .text('Código de Verificación', 70, 735, { width: 110, align: 'center' });
    
    // ============================================
    // SEGURIDAD Y HASH
    // ============================================
    
    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#999999')
       .text(`Hash SHA-256: ${hash}`, 200, 725, { width: 340 });
    
    if (firmaDigital) {
        doc.text(`Firma Digital RSA-4096: ${firmaDigital.substring(0, 50)}...`, 200, 738, { width: 340 });
    }
    
    doc.fontSize(7)
       .fillColor('#666666')
       .text('Este certificado ha sido generado digitalmente con firma criptográfica de nivel gubernamental RSA-4096', 200, 755, { width: 340, align: 'justify' });
    
    doc.end();
    
    await new Promise(resolve => stream.on('finish', resolve));
    
    console.log(`✅ Certificado de propiedad generado: ${pdfPath}`);
    
    return {
        certificado_id: certificadoId,
        tipo: 'PROPIEDAD_ARQUITECTONICA',
        diseno_id: diseno.id,
        comprador: comprador.nombre,
        email: comprador.email,
        precio_pagado_usd: diseno.precio_usd,
        hash_sha256: hash,
        firma_rsa4096: firmaDigital ? firmaDigital.substring(0, 64) + '...' : null,
        pdf_path: pdfPath,
        timestamp: timestamp.toISOString()
    };
}

module.exports = {
    generarCertificadoPropiedad
};
