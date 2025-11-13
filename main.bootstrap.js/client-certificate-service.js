/**
 * SERVICIO DE CERTIFICADOS PARA CLIENTES
 * Genera PDFs profesionales cuando un cliente compra un token FUSION
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ClientCertificateService {
  constructor(cryptoService, databaseService) {
    this.cryptoService = cryptoService;
    this.pool = databaseService.pool;
    this.certificatesDir = path.join(__dirname, '..', 'certificates', 'clients');
    
    // Crear directorio si no existe
    if (!fs.existsSync(this.certificatesDir)) {
      fs.mkdirSync(this.certificatesDir, { recursive: true });
    }
  }

  /**
   * Genera certificado PDF para una licencia de cliente
   */
  async generarCertificadoCliente(licenseId) {
    try {
      // Obtener datos de la licencia
      const licenseQuery = await this.pool.query(`
        SELECT 
          fl.id,
          fl.license_id,
          fl.cliente_nombre,
          fl.cliente_email,
          fl.cliente_rfc,
          fl.jwt_firmado,
          fl.firma_rsa,
          fl.hash_sha256,
          fl.fecha_emision,
          fl.fecha_expiracion,
          ft.token_code,
          ft.nombre as token_nombre,
          ft.tier,
          ft.precio_usd,
          ft.servicios
        FROM fusion_licenses fl
        JOIN fusion_tokens ft ON fl.token_id = ft.id
        WHERE fl.license_id = $1
      `, [licenseId]);

      if (licenseQuery.rows.length === 0) {
        return { success: false, error: 'Licencia no encontrada' };
      }

      const license = licenseQuery.rows[0];

      // Generar PDF
      const pdfPath = path.join(this.certificatesDir, `${licenseId}.pdf`);
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // === ENCABEZADO ===
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('CERTIFICADO DE LICENCIA FUSION', { align: 'center' });

      doc
        .moveDown(0.5)
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Throne Protocol V3.0 - Enterprise Sovereign Command Cloud', { align: 'center' });

      doc.moveDown(2);

      // === LÍNEA DECORATIVA ===
      doc
        .strokeColor('#2563eb')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .stroke();

      doc.moveDown(1.5);

      // === INFORMACIÓN DEL TOKEN ===
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('TOKEN ADQUIRIDO', { underline: true });

      doc.moveDown(0.5);

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Código del Token:', { continued: true })
        .font('Helvetica')
        .text(` ${license.token_code}`);

      doc
        .font('Helvetica-Bold')
        .text('Nombre:', { continued: true })
        .font('Helvetica')
        .text(` ${license.token_nombre}`);

      doc
        .font('Helvetica-Bold')
        .text('Tier:', { continued: true })
        .font('Helvetica')
        .text(` ${license.tier}`);

      doc
        .font('Helvetica-Bold')
        .text('Precio:', { continued: true })
        .font('Helvetica')
        .fillColor('#16a34a')
        .text(` $${license.precio_usd.toLocaleString()} USD`);

      doc.fillColor('#1a1a1a');
      doc.moveDown(1);

      // === SERVICIOS INCLUIDOS ===
      if (license.servicios && license.servicios.length > 0) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Servicios Incluidos:');

        doc.fontSize(11).font('Helvetica');
        license.servicios.forEach((servicio, index) => {
          doc.text(`  ${index + 1}. ${servicio}`);
        });

        doc.moveDown(1);
      }

      // === INFORMACIÓN DEL CLIENTE ===
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('LICENCIATARIO', { underline: true });

      doc.moveDown(0.5);

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Nombre:', { continued: true })
        .font('Helvetica')
        .text(` ${license.cliente_nombre}`);

      doc
        .font('Helvetica-Bold')
        .text('Email:', { continued: true })
        .font('Helvetica')
        .text(` ${license.cliente_email}`);

      if (license.cliente_rfc) {
        doc
          .font('Helvetica-Bold')
          .text('RFC:', { continued: true })
          .font('Helvetica')
          .text(` ${license.cliente_rfc}`);
      }

      doc.moveDown(1.5);

      // === VIGENCIA ===
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('VIGENCIA Y TÉRMINOS', { underline: true });

      doc.moveDown(0.5);

      const fechaEmision = new Date(license.fecha_emision);
      const fechaExpiracion = new Date(license.fecha_expiracion);

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Fecha de Emisión:', { continued: true })
        .font('Helvetica')
        .text(` ${fechaEmision.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`);

      doc
        .font('Helvetica-Bold')
        .text('Válido Hasta:', { continued: true })
        .font('Helvetica')
        .fillColor('#16a34a')
        .text(` ${fechaExpiracion.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`);

      doc.fillColor('#1a1a1a');
      doc
        .font('Helvetica-Bold')
        .text('ID de Licencia:', { continued: true })
        .font('Helvetica')
        .fontSize(10)
        .text(` ${license.license_id}`);

      doc.fontSize(12);
      doc.moveDown(1.5);

      // === FIRMA DIGITAL ===
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('FIRMA DIGITAL RSA-4096', { underline: true });

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Este certificado está firmado digitalmente con RSA-4096 y puede ser verificado de forma independiente.');

      doc.moveDown(0.5);

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('Hash SHA-256:');

      doc
        .font('Courier')
        .fontSize(8)
        .fillColor('#dc2626')
        .text(license.hash_sha256);

      doc.moveDown(0.5);

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#1a1a1a')
        .text('Firma RSA (extracto):');

      doc
        .font('Courier')
        .fontSize(7)
        .fillColor('#666666')
        .text(license.firma_rsa.substring(0, 200) + '...');

      doc.moveDown(2);

      // === PIE DE PÁGINA ===
      const bottomY = 720;
      doc
        .strokeColor('#2563eb')
        .lineWidth(1)
        .moveTo(50, bottomY)
        .lineTo(562, bottomY)
        .stroke();

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('Emitido por:', 50, bottomY + 10);

      doc
        .font('Helvetica')
        .text('Roberto Rivera Gamas', 50, bottomY + 25);

      doc
        .fontSize(9)
        .fillColor('#666666')
        .text('RFC: RIGR840827PJ0', 50, bottomY + 40);

      doc
        .text('Throne Protocol V3.0', 50, bottomY + 55);

      doc
        .fontSize(8)
        .text(`Certificado generado el ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' }, bottomY + 70);

      // Finalizar PDF
      doc.end();

      // Esperar a que termine de escribirse
      await new Promise((resolve) => stream.on('finish', resolve));

      // Guardar referencia en base de datos
      await this.pool.query(`
        UPDATE fusion_licenses 
        SET metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{certificado_pdf}',
          $1::jsonb
        )
        WHERE license_id = $2
      `, [
        JSON.stringify({
          generado: true,
          fecha: new Date().toISOString(),
          archivo: `${licenseId}.pdf`
        }),
        licenseId
      ]);

      console.log(`✅ Certificado PDF generado: ${licenseId}.pdf`);

      return {
        success: true,
        certificado: {
          licenseId,
          pdfPath,
          archivo: `${licenseId}.pdf`,
          clienteNombre: license.cliente_nombre,
          tokenNombre: license.token_nombre
        }
      };

    } catch (error) {
      console.error('Error generando certificado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene el path del certificado PDF
   */
  getCertificatePath(licenseId) {
    return path.join(this.certificatesDir, `${licenseId}.pdf`);
  }

  /**
   * Verifica si existe el certificado
   */
  certificateExists(licenseId) {
    const pdfPath = this.getCertificatePath(licenseId);
    return fs.existsSync(pdfPath);
  }
}

module.exports = ClientCertificateService;
