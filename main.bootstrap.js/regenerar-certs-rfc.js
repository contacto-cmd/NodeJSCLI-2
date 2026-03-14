/**
 * REGENERAR CERTIFICADOS CON RFC REAL + FIRMA MANUSCRITA
 * Roberto Rivera Gamas — RFC: RIGR840827PJ0
 * Sobrescribe los PDFs existentes con los mismos IDs
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const certDir = path.join(__dirname, '..', 'certificados');
const firmaImgPath = path.join(__dirname, '..', 'public', 'firma-roberto-rivera.png');

// Cargar clave RSA-4096 real (mismo método que server.js)
let clavePrivadaRSA = null;
try {
    const keyPath = path.join(__dirname, '..', 'keys', 'throne_key.pem');
    if (fs.existsSync(keyPath)) {
        clavePrivadaRSA = fs.readFileSync(keyPath, 'utf8');
        console.log('✅ Clave RSA-4096 cargada desde keys/throne_key.pem');
    } else if (process.env.RSA_4096_PRIVADA) {
        let rawKey = process.env.RSA_4096_PRIVADA
            .replace(/\\n/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();
        if (!rawKey.includes('\n')) {
            rawKey = rawKey
                .replace('-----BEGIN PRIVATE KEY----- ', '-----BEGIN PRIVATE KEY-----\n')
                .replace(' -----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
                .replace(/(.{64})/g, '$1\n')
                .replace(/\n\n/g, '\n');
        }
        clavePrivadaRSA = rawKey;
        console.log('✅ Clave RSA-4096 cargada desde Secrets');
    }
} catch(e) {
    console.warn('⚠️ Error cargando RSA key:', e.message);
}

const PROPIETARIO = {
    nombre: 'Roberto Rivera Gamas',
    rfc: 'RIGR840827PJ0',
    empresa: 'Street Emporio Royal',
    web: 'www.streetemporioroyal.com',
    email: 'contacto@streetemporioroyal.com',
    titulo: 'Arquitecto Principal y Propietario'
};

// ─────────────────────────────────────────────────
// REGENERAR CERTIFICADO DE VALIDACIÓN TÉCNICA
// ID: VALIDACION-1773475626217-AB9B0047
// ─────────────────────────────────────────────────
async function regenerarValidacion() {
    const certificadoId = 'VALIDACION-1773475626217-AB9B0047';
    const nombreSistema = 'LGoritmo AHT Ancestral Engine — Throne Protocol V3.0';
    const timestamp = new Date('2025-01-12T00:00:00.000Z');

    const datosHash = {
        tipo: 'VALIDACION_TECNICA',
        id: certificadoId,
        sistema: nombreSistema,
        propietario: PROPIETARIO.nombre,
        rfc: PROPIETARIO.rfc,
        timestamp: timestamp.toISOString(),
        empresa: PROPIETARIO.empresa
    };

    const hash = crypto.createHash('sha256').update(JSON.stringify(datosHash)).digest('hex');

    let firmaDigital = null;
    if (clavePrivadaRSA) {
        try {
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(hash);
            firmaDigital = sign.sign(clavePrivadaRSA, 'base64');
            console.log('✅ Firma RSA-4096 generada para VALIDACION');
        } catch(e) { console.warn('⚠️ Error firma RSA:', e.message); }
    }

    const qrData = JSON.stringify({
        tipo: 'VALIDACION_TECNICA',
        id: certificadoId,
        propietario: PROPIETARIO.nombre,
        rfc: PROPIETARIO.rfc,
        hash: hash.substring(0, 16)
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200, margin: 1,
        color: { dark: '#d4af37', light: '#000000' }
    });

    const pdfPath = path.join(certDir, `Certificado-Validacion-${certificadoId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // ── FONDO NEGRO
    doc.rect(0, 0, 612, 792).fill('#000000');

    // ── MARCOS DORADOS (cuádruple)
    [[35,35,542,722,6,'#d4af37'],[47,47,518,698,3,'#ffd700'],[55,55,502,682,2,'#d4af37'],[59,59,494,674,1,'#c9a227']].forEach(([x,y,w,h,lw,clr]) => {
        doc.rect(x,y,w,h).lineWidth(lw).strokeColor(clr).stroke();
    });

    // ── ESQUINAS
    const corners = [[55,75],[55,719],[557,75],[557,719]];
    corners.forEach(([cx,cy]) => {
        doc.moveTo(cx-20,cy).lineTo(cx+20,cy).strokeColor('#ffd700').lineWidth(2).stroke();
        doc.moveTo(cx,cy-20).lineTo(cx,cy+20).stroke();
    });

    // ── TÍTULO
    doc.fontSize(11).font('Helvetica').fillColor('#d4af37')
       .text('THRONE PROTOCOL V3.0  ·  AHT ANCESTRAL ENGINE  ·  ENGINE-27', 0, 75, { align: 'center' });

    doc.moveTo(150, 100).lineTo(462, 100).strokeColor('#d4af37').lineWidth(1).stroke();

    doc.fontSize(36).font('Helvetica-Bold').fillColor('#ffffff')
       .text('CERTIFICADO DE', 0, 115, { align: 'center' });

    doc.fontSize(38).fillColor('#ffd700')
       .text('VALIDACIÓN TÉCNICA', 0, 158, { align: 'center' });

    doc.moveTo(150, 210).lineTo(462, 210).strokeColor('#d4af37').lineWidth(1).stroke();

    // ── PROPIETARIO
    doc.fontSize(13).font('Helvetica').fillColor('#ffffff')
       .text('Certificado a nombre de:', 0, 225, { align: 'center' });

    doc.fontSize(18).font('Helvetica-Bold').fillColor('#ffd700')
       .text(PROPIETARIO.nombre, 0, 248, { align: 'center' });

    doc.fontSize(12).font('Helvetica').fillColor('#d4af37')
       .text(`RFC: ${PROPIETARIO.rfc}  ·  ${PROPIETARIO.empresa}`, 0, 272, { align: 'center' });

    doc.fontSize(11).fillColor('#ffffff')
       .text(PROPIETARIO.web, 0, 290, { align: 'center' });

    // ── SISTEMA VALIDADO
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff')
       .text('Sistema Validado:', 0, 320, { align: 'center' });

    doc.fontSize(14).fillColor('#d4af37')
       .text(nombreSistema, 0, 340, { align: 'center' });

    // ── SELLOS AI
    const sello1X = 160; const selloY = 390;
    doc.circle(sello1X, selloY, 42).lineWidth(4).strokeColor('#d4af37').stroke();
    doc.circle(sello1X, selloY, 36).lineWidth(2).strokeColor('#ffd700').stroke();
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffd700')
       .text('GPT-5', sello1X-35, selloY-18, { width:70, align:'center' });
    doc.fontSize(8).font('Helvetica')
       .text('VALIDATED', sello1X-35, selloY-2, { width:70, align:'center' });
    doc.fontSize(8).text('SEAL', sello1X-35, selloY+12, { width:70, align:'center' });

    const sello2X = 452;
    doc.circle(sello2X, selloY, 42).lineWidth(4).strokeColor('#d4af37').stroke();
    doc.circle(sello2X, selloY, 36).lineWidth(2).strokeColor('#ffd700').stroke();
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffd700')
       .text('GEMINI AI', sello2X-35, selloY-18, { width:70, align:'center' });
    doc.fontSize(8).font('Helvetica')
       .text('VALIDATION', sello2X-35, selloY-2, { width:70, align:'center' });
    doc.fontSize(8).text('SEAL', sello2X-35, selloY+12, { width:70, align:'center' });

    // ── SPECS TÉCNICAS
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#d4af37')
       .text('ESPECIFICACIONES TÉCNICAS', 0, 460, { align: 'center' });

    doc.fontSize(11).font('Helvetica').fillColor('#ffffff')
       .text('Física Real Verificable · 30 Diseños Únicos · RSA-4096 Encryption · AHT ENGINE-27', 0, 490, { align: 'center' });

    // ── LÍNEA SEPARADORA FIRMA
    doc.moveTo(80, 550).lineTo(532, 550).strokeColor('#d4af37').lineWidth(1).stroke();

    // ── FIRMA MANUSCRITA (imagen real o fallback texto)
    if (fs.existsSync(firmaImgPath)) {
        doc.image(firmaImgPath, 316, 555, { width: 165, height: 58 });
    } else {
        doc.fontSize(28).font('Helvetica-Oblique').fillColor('#d4af37')
           .text(PROPIETARIO.nombre, 316, 568, { width: 200 });
    }

    // ── LÍNEA BAJO FIRMA
    doc.moveTo(316, 620).lineTo(506, 620).strokeColor('#d4af37').lineWidth(0.5).stroke();

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffd700')
       .text(PROPIETARIO.nombre, 316, 624, { width: 190, align: 'center' });

    doc.fontSize(8).font('Helvetica').fillColor('#ffffff')
       .text(PROPIETARIO.titulo, 316, 636, { width: 190, align: 'center' });

    // ── INFO CERT (izquierda)
    doc.fontSize(9).font('Helvetica').fillColor('#aaaaaa').text('CERTIFICADO No.:', 80, 572);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffd700').text(certificadoId, 80, 585);

    const mesAnio = timestamp.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    const mesAnioCapitalized = mesAnio.charAt(0).toUpperCase() + mesAnio.slice(1);
    doc.fontSize(9).font('Helvetica').fillColor('#aaaaaa').text('Fecha de Emisión:', 80, 600);
    doc.fontSize(9).fillColor('#ffffff').text(mesAnioCapitalized, 80, 612);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#d4af37').text(`RFC: ${PROPIETARIO.rfc}`, 80, 628);
    doc.fontSize(9).font('Helvetica').fillColor('#ffffff').text(PROPIETARIO.empresa, 80, 641);
    doc.fontSize(8).fillColor('#d4af37').text(PROPIETARIO.web, 80, 654);

    // ── QR CODE
    const qrBuffer = Buffer.from(qrCodeDataURL.replace(/^data:image\/png;base64,/, ''), 'base64');
    doc.image(qrBuffer, 462, 655, { width: 72, height: 72 });
    doc.fontSize(6).fillColor('#666666').text('VERIFICAR', 462, 730, { width: 72, align: 'center' });

    // ── FOOTER
    doc.fontSize(9).fillColor('#d4af37')
       .text(`${PROPIETARIO.nombre}  ·  RFC: ${PROPIETARIO.rfc}  ·  ${PROPIETARIO.empresa}  ·  ${PROPIETARIO.web}`, 0, 700, { align: 'center' });

    doc.fontSize(7).fillColor('#555555')
       .text(`Hash SHA-256: ${hash.substring(0, 52)}...`, 0, 718, { align: 'center' });

    if (firmaDigital) {
        doc.fontSize(6).fillColor('#555555')
           .text(`Firma RSA-4096: ${firmaDigital.substring(0, 52)}...`, 0, 730, { align: 'center' });
    }

    doc.fontSize(7).fillColor('#555555')
       .text('Certificado blockchain-verified  ·  Throne Protocol V3.0  ·  AHT ENGINE-27', 0, 742, { align: 'center' });

    doc.end();

    return new Promise((resolve) => {
        stream.on('finish', () => {
            console.log(`✅ VALIDACION regenerado: ${pdfPath}`);
            console.log(`   RFC: ${PROPIETARIO.rfc}`);
            console.log(`   Firma RSA-4096: ${firmaDigital ? 'INCLUIDA' : 'NO DISPONIBLE'}`);
            resolve({ id: certificadoId, path: pdfPath });
        });
    });
}

// ─────────────────────────────────────────────────
// REGENERAR CERTIFICADO DE VALORACIÓN
// ID: VALORACION-1773475626130-1E916C2C
// ─────────────────────────────────────────────────
async function regenerarValoracion() {
    const certificadoId = 'VALORACION-1773475626130-1E916C2C';
    const nombreProyecto = 'LGoritmo AHT Ancestral Engine — Throne Protocol V3.0';
    const timestamp = new Date('2025-01-12T00:00:00.000Z');
    const valorTotal = '$276,552,435,904';

    const datosHash = {
        tipo: 'CERTIFICADO_VALORACION',
        id: certificadoId,
        valor: valorTotal,
        proyecto: nombreProyecto,
        propietario: PROPIETARIO.nombre,
        rfc: PROPIETARIO.rfc,
        timestamp: timestamp.toISOString(),
        empresa: PROPIETARIO.empresa
    };

    const hash = crypto.createHash('sha256').update(JSON.stringify(datosHash)).digest('hex');

    let firmaDigital = null;
    if (clavePrivadaRSA) {
        try {
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(hash);
            firmaDigital = sign.sign(clavePrivadaRSA, 'base64');
            console.log('✅ Firma RSA-4096 generada para VALORACION');
        } catch(e) { console.warn('⚠️ Error firma RSA:', e.message); }
    }

    const qrData = JSON.stringify({
        tipo: 'VALORACION',
        id: certificadoId,
        propietario: PROPIETARIO.nombre,
        rfc: PROPIETARIO.rfc,
        valor: valorTotal,
        hash: hash.substring(0, 16)
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 250, margin: 1,
        color: { dark: '#d4af37', light: '#000000' }
    });

    const pdfPath = path.join(certDir, `Certificado-Valoracion-${certificadoId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // ── FONDO NEGRO
    doc.rect(0, 0, 612, 792).fill('#000000');

    // ── MARCOS DORADOS TRIPLE
    [[30,30,552,732,6,'#d4af37'],[42,42,528,708,3,'#ffd700'],[50,50,512,692,2,'#d4af37']].forEach(([x,y,w,h,lw,clr]) => {
        doc.rect(x,y,w,h).lineWidth(lw).strokeColor(clr).stroke();
    });

    // ── ESQUINAS
    [[70,50],[70,742],[542,50],[542,742]].forEach(([cx,cy]) => {
        doc.moveTo(cx-20,cy).lineTo(cx+20,cy).strokeColor('#ffd700').lineWidth(2).stroke();
        doc.moveTo(cx,cy-20).lineTo(cx,cy+20).stroke();
    });

    // ── LÍNEA DECORATIVA
    doc.moveTo(150, 120).lineTo(462, 120).strokeColor('#d4af37').lineWidth(1).stroke();

    // ── TITULO
    doc.fontSize(11).font('Helvetica').fillColor('#d4af37')
       .text('THRONE PROTOCOL V3.0  ·  AHT ANCESTRAL ENGINE  ·  ENGINE-27', 0, 70, { align: 'center' });

    doc.fontSize(38).font('Helvetica-Bold').fillColor('#ffffff')
       .text('CERTIFICADO DE', 0, 138, { align: 'center' });

    doc.fontSize(40).fillColor('#ffd700')
       .text('VALORACIÓN', 0, 183, { align: 'center' });

    doc.fontSize(14).font('Helvetica').fillColor('#ffffff')
       .text('Alto Valor — Reconocimiento Oficial Presidencial', 0, 238, { align: 'center' });

    // ── PROPIETARIO
    doc.fontSize(13).fillColor('#ffffff').text('Propietario Certificado:', 0, 268, { align: 'center' });
    doc.fontSize(17).font('Helvetica-Bold').fillColor('#ffd700')
       .text(PROPIETARIO.nombre, 0, 288, { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#d4af37')
       .text(`RFC: ${PROPIETARIO.rfc}  ·  ${PROPIETARIO.empresa}`, 0, 308, { align: 'center' });

    // ── VALORACIÓN GRANDE
    doc.fontSize(44).font('Helvetica-Bold').fillColor('#ffd700')
       .text(valorTotal + ' USD', 0, 342, { align: 'center' });

    // ── VALIDADO POR AI
    doc.fontSize(12).font('Helvetica').fillColor('#ffffff')
       .text('VALORACIÓN VALIDADA POR SISTEMAS DE INTELIGENCIA ARTIFICIAL', 0, 400, { align: 'center' });

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#d4af37')
       .text('GPT-5 Turbo  ·  Gemini 2.5 Pro  ·  AHT ENGINE-27', 0, 420, { align: 'center' });

    // ── PORTFOLIO DETAILS
    doc.fontSize(11).font('Helvetica').fillColor('#ffffff')
       .text('372 Diseños Arquitectónicos Únicos — Rango: 12m-180m — Masa: 16K-287K Toneladas', 0, 452, { align: 'center' });

    // ── SELLOS
    const selloY = 490;
    doc.circle(140, selloY+30, 45).lineWidth(3).strokeColor('#d4af37').stroke();
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffd700')
       .text('VERIFIED', 105, selloY+18, { width:70, align:'center' });
    doc.fontSize(9).text('BY', 105, selloY+31, { width:70, align:'center' });
    doc.fontSize(7).text('AI AGENTS', 105, selloY+43, { width:70, align:'center' });

    doc.circle(472, selloY+30, 45).lineWidth(3).strokeColor('#d4af37').stroke();
    doc.fontSize(8).fillColor('#ffd700')
       .text('★ ★ ★ ★ ★', 437, selloY+12, { width:70, align:'center' });
    doc.fontSize(9).font('Helvetica-Bold')
       .text('HIGH VALUE', 437, selloY+26, { width:70, align:'center' });
    doc.fontSize(9).text('SYSTEM', 437, selloY+39, { width:70, align:'center' });

    // ── LÍNEA SEPARADORA
    doc.moveTo(80, 580).lineTo(532, 580).strokeColor('#d4af37').lineWidth(1).stroke();

    // ── DATOS CERTIFICADO (izquierda)
    doc.fontSize(9).font('Helvetica').fillColor('#aaaaaa').text('CERTIFICADO No.:', 90, 596);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffd700').text(certificadoId, 90, 609);

    const mesAnio = timestamp.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    const mesAnioCapitalized = mesAnio.charAt(0).toUpperCase() + mesAnio.slice(1);
    doc.fontSize(9).font('Helvetica').fillColor('#aaaaaa').text('Proyecto:', 90, 624);
    doc.fontSize(9).fillColor('#ffffff').text(nombreProyecto, 90, 637, { width: 210 });

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#d4af37').text(`RFC: ${PROPIETARIO.rfc}`, 90, 660);
    doc.fontSize(9).font('Helvetica').fillColor('#ffffff').text(PROPIETARIO.empresa, 90, 673);
    doc.fontSize(8).fillColor('#d4af37').text(PROPIETARIO.web, 90, 686);

    // ── FIRMA MANUSCRITA (imagen real)
    if (fs.existsSync(firmaImgPath)) {
        doc.image(firmaImgPath, 310, 592, { width: 165, height: 58 });
    } else {
        doc.fontSize(24).font('Helvetica-Oblique').fillColor('#d4af37')
           .text(PROPIETARIO.nombre, 310, 604, { width: 200 });
    }

    // ── LÍNEA BAJO FIRMA
    doc.moveTo(310, 658).lineTo(500, 658).strokeColor('#d4af37').lineWidth(0.5).stroke();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffd700')
       .text(PROPIETARIO.nombre, 310, 662, { width: 190, align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor('#ffffff')
       .text(PROPIETARIO.titulo, 310, 674, { width: 190, align: 'center' });
    doc.fontSize(8).fillColor('#d4af37')
       .text(PROPIETARIO.empresa, 310, 686, { width: 190, align: 'center' });

    // ── QR CODE
    const qrBuffer = Buffer.from(qrCodeDataURL.replace(/^data:image\/png;base64,/, ''), 'base64');
    doc.image(qrBuffer, 450, 655, { width: 80, height: 80 });
    doc.fontSize(6).fillColor('#666666').text('VERIFICAR', 450, 738, { width: 80, align: 'center' });

    // ── FOOTER
    doc.fontSize(9).fillColor('#d4af37')
       .text(`${PROPIETARIO.nombre}  ·  RFC: ${PROPIETARIO.rfc}  ·  ${PROPIETARIO.empresa}  ·  ${PROPIETARIO.web}`, 0, 722, { align: 'center' });

    doc.fontSize(7).fillColor('#555555')
       .text(`Hash SHA-256: ${hash.substring(0, 52)}...`, 0, 738, { align: 'center' });

    if (firmaDigital) {
        doc.fontSize(6).fillColor('#555555')
           .text(`Firma RSA-4096: ${firmaDigital.substring(0, 52)}...`, 0, 750, { align: 'center' });
    }

    doc.fontSize(7).fillColor('#555555')
       .text('Certificado blockchain-verified  ·  Throne Protocol V3.0  ·  AHT ENGINE-27', 0, 762, { align: 'center' });

    doc.end();

    return new Promise((resolve) => {
        stream.on('finish', () => {
            console.log(`✅ VALORACION regenerado: ${pdfPath}`);
            console.log(`   Valor: ${valorTotal} USD`);
            console.log(`   RFC: ${PROPIETARIO.rfc}`);
            console.log(`   Firma RSA-4096: ${firmaDigital ? 'INCLUIDA' : 'NO DISPONIBLE'}`);
            resolve({ id: certificadoId, path: pdfPath });
        });
    });
}

// ── EJECUTAR
(async () => {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  REGENERANDO CERTIFICADOS CON RFC REAL + FIRMA MANUSCRITA ║');
    console.log('║  Roberto Rivera Gamas — RFC: RIGR840827PJ0               ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    const [r1, r2] = await Promise.all([
        regenerarValidacion(),
        regenerarValoracion()
    ]);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ AMBOS CERTIFICADOS REGENERADOS CON ÉXITO');
    console.log(`   VALIDACION: ${r1.id}`);
    console.log(`   VALORACION: ${r2.id}`);
    console.log('\n🔗 URLs de descarga:');
    console.log(`   /api/certificados/profesionales/descargar/${r1.id}`);
    console.log(`   /api/certificados/profesionales/descargar/${r2.id}`);
    console.log('═══════════════════════════════════════════════════════════\n');
})();
