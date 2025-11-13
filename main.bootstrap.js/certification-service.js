const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class CertificationService {
  constructor(cryptoService, databaseService) {
    this.cryptoService = cryptoService;
    this.pool = databaseService.pool;
    this.certificatesDir = path.join(__dirname, '..', 'certificates');
    
    if (!fs.existsSync(this.certificatesDir)) {
      fs.mkdirSync(this.certificatesDir, { recursive: true });
    }
  }

  async generarCertificadoProyecto(datosProyecto) {
    try {
      const certificateId = crypto.randomUUID();
      const fechaEmision = new Date();
      
      const dataCertificado = {
        certificateId,
        tipo: 'PROYECTO_DESARROLLO',
        titular: datosProyecto.titular,
        rfc: datosProyecto.rfc,
        proyecto: datosProyecto.proyecto,
        componentes: datosProyecto.componentes,
        valorComercial: datosProyecto.valorComercial,
        estado: datosProyecto.estado,
        tecnologias: datosProyecto.tecnologias,
        fechaEmision: fechaEmision.toISOString(),
        emisor: 'Throne Protocol V3.0 - Certification Authority',
        fingerprint: this.cryptoService.obtenerFingerprint()
      };

      const firmaResult = this.cryptoService.firmarRSA(dataCertificado);
      const hashSha256 = this.cryptoService.generarHash(JSON.stringify(dataCertificado));

      await this.pool.query(`
        INSERT INTO fusion_audit 
        (license_id, token_code, evento, resultado, detalles)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        null,
        'CERTIFICATION',
        'certificate_issued',
        true,
        JSON.stringify({
          certificateId,
          titular: datosProyecto.titular,
          proyecto: datosProyecto.proyecto,
          hash: hashSha256
        })
      ]);

      const pdfPath = await this.generarPDFCertificado(dataCertificado, firmaResult.firma, hashSha256);

      return {
        success: true,
        certificateId,
        dataCertificado,
        firma: firmaResult.firma,
        hash: hashSha256,
        pdfPath,
        mensaje: '✅ Certificado generado y firmado con RSA-4096'
      };

    } catch (error) {
      console.error('Error generando certificado:', error);
      return { success: false, error: error.message };
    }
  }

  async generarPDFCertificado(data, firma, hash) {
    return new Promise((resolve, reject) => {
      try {
        const pdfPath = path.join(this.certificatesDir, `CERT_${data.certificateId}.pdf`);
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(pdfPath);

        doc.pipe(stream);

        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f9fa');

        doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
           .lineWidth(3)
           .strokeColor('#1a1a2e')
           .stroke();

        doc.rect(45, 45, doc.page.width - 90, doc.page.height - 90)
           .lineWidth(1)
           .strokeColor('#16213e')
           .stroke();

        doc.fillColor('#1a1a2e')
           .fontSize(32)
           .font('Helvetica-Bold')
           .text('CERTIFICADO PROFESIONAL', 0, 100, { align: 'center' });

        doc.fontSize(14)
           .fillColor('#0f3460')
           .text('Sistema de Desarrollo Verificado', 0, 145, { align: 'center' });

        doc.moveTo(100, 170).lineTo(doc.page.width - 100, 170).stroke();

        doc.fontSize(12)
           .fillColor('#1a1a2e')
           .font('Helvetica')
           .text('Se certifica que:', 60, 200);

        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor('#0f3460')
           .text(data.titular, 60, 230);

        if (data.rfc) {
          doc.fontSize(12)
             .font('Helvetica')
             .fillColor('#555')
             .text(`RFC: ${data.rfc}`, 60, 255);
        }

        doc.fontSize(12)
           .fillColor('#1a1a2e')
           .text('Ha desarrollado exitosamente el sistema:', 60, 290);

        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor('#e94560')
           .text(`"${data.proyecto}"`, 60, 315);

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#1a1a2e')
           .text('COMPONENTES VERIFICADOS:', 60, 360);

        let yPos = 385;
        data.componentes.forEach((comp, index) => {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#333')
             .text(`✓ ${comp}`, 70, yPos);
          yPos += 18;
        });

        yPos += 10;
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#1a1a2e')
           .text(`TECNOLOGÍAS: ${data.tecnologias.join(', ')}`, 60, yPos);

        yPos += 25;
        doc.fontSize(11)
           .fillColor('#0f3460')
           .text(`VALOR COMERCIAL ESTIMADO: ${data.valorComercial}`, 60, yPos);

        yPos += 25;
        doc.fontSize(11)
           .fillColor('#16a085')
           .text(`ESTADO: ${data.estado}`, 60, yPos);

        doc.fontSize(9)
           .fillColor('#555')
           .text(`Fecha de emisión: ${new Date(data.fechaEmision).toLocaleDateString('es-MX', {
             year: 'numeric',
             month: 'long',
             day: 'numeric'
           })}`, 60, doc.page.height - 220);

        doc.text(`Certificate ID: ${data.certificateId}`, 60, doc.page.height - 200);
        doc.text(`SHA-256: ${hash.substring(0, 32)}...`, 60, doc.page.height - 180);

        doc.fontSize(8)
           .fillColor('#888')
           .text('FIRMA DIGITAL RSA-4096', 60, doc.page.height - 150);
        
        doc.fontSize(7)
           .text(firma.substring(0, 80), 60, doc.page.height - 135);
        doc.text(firma.substring(80, 160), 60, doc.page.height - 125);
        doc.text('...', 60, doc.page.height - 115);

        doc.fontSize(9)
           .fillColor('#1a1a2e')
           .font('Helvetica-Bold')
           .text(data.emisor, 0, doc.page.height - 90, { align: 'center' });

        doc.fontSize(7)
           .fillColor('#888')
           .font('Helvetica')
           .text(`RSA-4096 Fingerprint: ${data.fingerprint.substring(0, 40)}...`, 0, doc.page.height - 70, { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          console.log(`✅ PDF generado: ${pdfPath}`);
          resolve(pdfPath);
        });

        stream.on('error', (error) => {
          console.error('Error generando PDF:', error);
          reject(error);
        });

      } catch (error) {
        console.error('Error en generarPDFCertificado:', error);
        reject(error);
      }
    });
  }

  async verificarCertificado(certificateId, firma) {
    try {
      const result = await this.pool.query(`
        SELECT * FROM fusion_audit 
        WHERE detalles->>'certificateId' = $1 
        AND evento = 'certificate_issued'
        ORDER BY created_at DESC 
        LIMIT 1
      `, [certificateId]);

      if (result.rows.length === 0) {
        return { 
          success: false, 
          valido: false,
          error: 'Certificado no encontrado en registros' 
        };
      }

      const registro = result.rows[0];
      const detalles = registro.detalles;

      return {
        success: true,
        valido: true,
        certificateId,
        titular: detalles.titular,
        proyecto: detalles.proyecto,
        fechaEmision: registro.created_at,
        hash: detalles.hash,
        mensaje: '✅ Certificado VÁLIDO y verificado en blockchain de auditoría'
      };

    } catch (error) {
      console.error('Error verificando certificado:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = CertificationService;
