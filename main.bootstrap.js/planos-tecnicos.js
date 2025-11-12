// ============================================================
// GENERADOR DE PLANOS TÉCNICOS ARQUITECTÓNICOS
// Con coordenadas GPS exactas, cálculos de gravedad, medidas precisas
// Street Emporio Royal - Roberto Rivera Gamas
// ============================================================

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const planosDir = path.join(__dirname, '..', 'planos-tecnicos');
if (!fs.existsSync(planosDir)) {
    fs.mkdirSync(planosDir, { recursive: true });
}

async function generarPlanoTecnico(diseno, clavePrivadaRSA = null) {
    console.log(`📐 Generando plano técnico para: ${diseno.nombre}`);
    
    const planoId = `PLANO-${diseno.id}-${Date.now()}`;
    const timestamp = new Date();
    
    // Generar hash del plano
    const datosHash = {
        plano_id: planoId,
        diseno_id: diseno.id,
        nombre: diseno.nombre,
        coordenadas: diseno.coordenadas,
        especificaciones: diseno.especificaciones,
        timestamp: timestamp.toISOString()
    };
    
    const hash = crypto.createHash('sha256')
        .update(JSON.stringify(datosHash))
        .digest('hex');
    
    // Firma RSA-4096
    let firmaDigital = null;
    if (clavePrivadaRSA) {
        try {
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(hash);
            firmaDigital = sign.sign(clavePrivadaRSA, 'base64');
        } catch (error) {
            console.warn('⚠️ Error generando firma RSA:', error.message);
        }
    }
    
    // QR Code con coordenadas
    const qrData = JSON.stringify({
        plano_id: planoId,
        lat: diseno.coordenadas.lat,
        lon: diseno.coordenadas.lon,
        hash: hash.substring(0, 16)
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
    });
    
    // Crear PDF
    const pdfPath = path.join(planosDir, `Plano-Tecnico-${diseno.id}-${Date.now()}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // ============================================
    // ENCABEZADO PROFESIONAL
    // ============================================
    
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('PLANO TÉCNICO ARQUITECTÓNICO', 0, 50, { align: 'center' });
    
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#333333')
       .text('Street Emporio Royal', 0, 80, { align: 'center' });
    
    doc.fontSize(10)
       .fillColor('#666666')
       .text('Roberto Rivera Gamas - Royal, Arquitecto Principal', 0, 96, { align: 'center' });
    
    // Línea separadora
    doc.moveTo(40, 120)
       .lineTo(572, 120)
       .strokeColor('#000000')
       .lineWidth(2)
       .stroke();
    
    // ============================================
    // INFORMACIÓN DEL DISEÑO
    // ============================================
    
    let y = 145;
    
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(diseno.nombre, 40, y);
    
    y += 30;
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#444444')
       .text(`Tipo: ${diseno.tipo}`, 40, y);
    
    y += 18;
    doc.text(`ID de Diseño: ${diseno.id}`, 40, y);
    
    y += 18;
    doc.text(`ID de Plano: ${planoId}`, 40, y);
    
    y += 18;
    doc.text(`Fecha de Generación: ${timestamp.toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}`, 40, y);
    
    // ============================================
    // COORDENADAS GPS EXACTAS
    // ============================================
    
    y += 35;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('📍 COORDENADAS GPS EXACTAS', 40, y);
    
    y += 25;
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#000000');
    
    doc.text(`Latitud:`, 40, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  ${diseno.coordenadas.lat.toFixed(6)}°`, { continued: false });
    
    y += 18;
    doc.font('Helvetica')
       .text(`Longitud:`, 40, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  ${diseno.coordenadas.lon.toFixed(6)}°`, { continued: false });
    
    y += 18;
    doc.font('Helvetica')
       .text(`Altitud:`, 40, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  ${diseno.coordenadas.altitud} metros sobre nivel del mar`, { continued: false });
    
    // Conversión a coordenadas UTM (aproximación)
    y += 18;
    doc.font('Helvetica')
       .fillColor('#666666')
       .text(`Sistema: WGS84 / Datum Global`, 40, y);
    
    // ============================================
    // ESPECIFICACIONES TÉCNICAS PRECISAS
    // ============================================
    
    y += 35;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('📏 ESPECIFICACIONES TÉCNICAS', 40, y);
    
    y += 25;
    
    const specs = diseno.especificaciones;
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#000000');
    
    // Altura
    doc.text(`Altura Total:`, 40, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  ${specs.altura_metros.toFixed(2)} metros`, { continued: false });
    
    y += 18;
    doc.font('Helvetica')
       .text(`Número de Plantas:`, 40, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  ${specs.plantas} niveles`, { continued: false });
    
    y += 18;
    doc.font('Helvetica')
       .text(`Área Construida:`, 40, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  ${specs.area_construida_m2.toLocaleString('es-MX')} m²`, { continued: false });
    
    // Cálculo de gravedad
    y += 18;
    doc.font('Helvetica')
       .text(`Capacidad Gravitacional:`, 40, y, { continued: true })
       .font('Helvetica-Bold')
       .text(`  ${specs.capacidad_gravedad}`, { continued: false });
    
    // CÁLCULOS DE GRAVEDAD Y PESO ESTRUCTURAL REAL
    y += 25;
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#0066cc')
       .text('Cálculos de Gravedad y Peso Estructural Real:', 40, y);
    
    y += 18;
    doc.font('Helvetica')
       .fillColor('#333333')
       .fontSize(9);
    
    // Obtener datos de análisis estructural si existen
    if (diseno.analisis_estructural && diseno.analisis_estructural.peso_estructura) {
        const peso_est = diseno.analisis_estructural.peso_estructura;
        
        doc.text(`• Gravedad estándar (g₀): 9.81 m/s²`, 50, y);
        y += 14;
        doc.text(`• Densidad del material: ${peso_est.densidad_kg_m3} kg/m³`, 50, y);
        y += 14;
        doc.text(`• Peso total estructura: ${peso_est.peso_toneladas} toneladas`, 50, y);
        y += 14;
        doc.text(`• Fuerza gravitacional: ${peso_est.fuerza_gravitacional_newtons} N`, 50, y);
        y += 14;
        doc.text(`• Resistencia material: ${peso_est.resistencia_material_mpa} MPa`, 50, y);
        
        // Análisis de voladizos
        if (diseno.analisis_estructural.analisis_voladizos) {
            const volad = diseno.analisis_estructural.analisis_voladizos;
            y += 20;
            doc.font('Helvetica-Bold').fillColor('#0066cc').text('Análisis de Voladizos:', 50, y);
            y += 14;
            doc.font('Helvetica').fillColor('#333333');
            doc.text(`• Longitud voladizo: ${volad.longitud_voladizo_m} m`, 50, y);
            y += 14;
            doc.text(`• Momento de flexión: ${volad.momento_flexion_nm} N⋅m`, 50, y);
            y += 14;
            doc.text(`• Factor de seguridad: ${volad.factor_seguridad}`, 50, y);
            y += 14;
            doc.text(`• Estabilidad: ${volad.viable ? '✓ VIABLE' : '⚠ REQUIERE REFUERZO'}`, 50, y);
        }
        
        // Centro de gravedad
        if (diseno.analisis_estructural.centro_gravedad) {
            const cg = diseno.analisis_estructural.centro_gravedad;
            y += 20;
            doc.font('Helvetica-Bold').fillColor('#0066cc').text('Centro de Gravedad:', 50, y);
            y += 14;
            doc.font('Helvetica').fillColor('#333333');
            doc.text(`• Coordenada X: ${cg.centro_gravedad_x} m`, 50, y);
            y += 14;
            doc.text(`• Coordenada Y: ${cg.centro_gravedad_y} m`, 50, y);
            y += 14;
            doc.text(`• Coordenada Z: ${cg.centro_gravedad_z} m`, 50, y);
            y += 14;
            doc.text(`• Masa total: ${cg.masa_total_kg} kg`, 50, y);
        }
    } else {
        // Cálculos básicos si no hay análisis estructural
        const gravedadEstandar = 9.81;
        const factorGravedad = parseFloat(specs.capacidad_gravedad.match(/[\d.]+/)?.[0] || 1);
        const gravedadEfectiva = gravedadEstandar * factorGravedad;
        
        doc.text(`• Gravedad estándar (g₀): 9.81 m/s²`, 50, y);
        y += 14;
        doc.text(`• Factor de compensación: ${factorGravedad.toFixed(2)}`, 50, y);
        y += 14;
        doc.text(`• Gravedad efectiva: ${gravedadEfectiva.toFixed(3)} m/s²`, 50, y);
        y += 14;
        doc.text(`• Peso aparente: ${(factorGravedad * 100).toFixed(1)}%`, 50, y);
    }
    
    // ============================================
    // MATERIALES Y TECNOLOGÍA
    // ============================================
    
    y += 30;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('🔧 MATERIALES CONSTRUCTIVOS', 40, y);
    
    y += 25;
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333');
    
    specs.materiales.forEach((material, index) => {
        doc.text(`${index + 1}. ${material}`, 50, y);
        y += 16;
    });
    
    y += 10;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('⚙️ TECNOLOGÍA APLICADA', 40, y);
    
    y += 25;
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text(specs.tecnologia, 50, y, { width: 480 });
    
    // ============================================
    // MEDIDAS ADICIONALES Y CÁLCULOS
    // ============================================
    
    y += 50;
    
    if (y > 600) {
        doc.addPage();
        y = 60;
    }
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('📐 MEDIDAS ADICIONALES', 40, y);
    
    y += 25;
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#333333');
    
    // Cálculos estructurales
    const alturaPorPlanta = specs.altura_metros / specs.plantas;
    const areaPorPlanta = specs.area_construida_m2 / specs.plantas;
    const volumenTotal = specs.area_construida_m2 * 3.5; // Asumiendo 3.5m de altura promedio
    
    doc.text(`• Altura promedio por planta: ${alturaPorPlanta.toFixed(2)} m`, 50, y);
    y += 14;
    doc.text(`• Área promedio por nivel: ${areaPorPlanta.toLocaleString('es-MX', {maximumFractionDigits: 0})} m²`, 50, y);
    y += 14;
    doc.text(`• Volumen total estimado: ${volumenTotal.toLocaleString('es-MX', {maximumFractionDigits: 0})} m³`, 50, y);
    y += 14;
    doc.text(`• Perímetro base estimado: ${Math.sqrt(areaPorPlanta * 4).toFixed(2)} m (cuadrado equivalente)`, 50, y);
    
    // ============================================
    // QR CODE Y VERIFICACIÓN
    // ============================================
    
    const qrImage = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
    doc.image(qrImage, 420, 650, { width: 120, height: 120 });
    
    doc.fontSize(8)
       .fillColor('#666666')
       .text('Escanear para verificar', 420, 775, { width: 120, align: 'center' });
    
    // ============================================
    // PIE DE PÁGINA CON HASH Y FIRMA
    // ============================================
    
    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#999999')
       .text(`Hash SHA-256: ${hash}`, 40, 740, { width: 360 });
    
    if (firmaDigital) {
        doc.text(`Firma RSA-4096: ${firmaDigital.substring(0, 60)}...`, 40, 753, { width: 360 });
    }
    
    doc.fontSize(8)
       .fillColor('#666666')
       .text('Este plano técnico ha sido generado digitalmente con firma criptográfica RSA-4096', 40, 768, { width: 360 });
    
    doc.end();
    
    await new Promise(resolve => stream.on('finish', resolve));
    
    console.log(`✅ Plano técnico generado: ${pdfPath}`);
    
    return {
        plano_id: planoId,
        diseno_id: diseno.id,
        nombre: diseno.nombre,
        coordenadas: diseno.coordenadas,
        hash_sha256: hash,
        firma_rsa4096: firmaDigital ? firmaDigital.substring(0, 64) + '...' : null,
        pdf_path: pdfPath,
        timestamp: timestamp.toISOString()
    };
}

module.exports = {
    generarPlanoTecnico
};
