// 🔱 SERVICIO DE ENVÍO DE CERTIFICADOS POR EMAIL
// Envía certificados PDF automáticamente a tu correo

const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailCertificadoService {
    constructor() {
        this.remitente = 'ALGORYTHM ANCESTRAL ENGINE <onboarding@resend.dev>';
    }

    /**
     * Enviar certificado PDF por email
     * @param {string} destinatario - Email del destinatario
     * @param {string} rutaPDF - Ruta al archivo PDF
     * @param {object} datos - Datos del certificado
     */
    async enviarCertificado(destinatario, rutaPDF, datos) {
        try {
            // Leer el archivo PDF
            const pdfBuffer = fs.readFileSync(rutaPDF);
            const pdfBase64 = pdfBuffer.toString('base64');
            const nombreArchivo = path.basename(rutaPDF);

            // Preparar email
            const asunto = `🔱 Certificado: ${datos.titulo || 'ALGORYTHM ANCESTRAL ENGINE'}`;
            const htmlBody = this.generarHTMLEmail(datos);

            // Enviar con Resend
            const resultado = await resend.emails.send({
                from: this.remitente,
                to: destinatario,
                subject: asunto,
                html: htmlBody,
                attachments: [
                    {
                        filename: nombreArchivo,
                        content: pdfBase64,
                    }
                ]
            });

            console.log(`✅ Certificado enviado a ${destinatario}:`, resultado.id);
            return {
                success: true,
                emailId: resultado.id,
                destinatario,
                archivo: nombreArchivo
            };

        } catch (error) {
            console.error(`❌ Error enviando certificado:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generar HTML del email
     */
    generarHTMLEmail(datos) {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #00ff88;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(0,0,0,0.9);
            border: 2px solid #00ff88;
            border-radius: 10px;
            padding: 30px;
        }
        h1 {
            color: #ffd700;
            text-align: center;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .info {
            background: rgba(0,255,136,0.1);
            border-left: 4px solid #00ff88;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #00ff88;
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔱 ALGORYTHM ANCESTRAL ENGINE</h1>
        <h2 style="color: #00ff88; text-align: center;">Certificado Generado</h2>
        
        <div class="info">
            <p><strong>Proyecto:</strong> ${datos.proyecto || 'ALGORYTHM ANCESTRAL ENGINE'}</p>
            <p><strong>Desarrollador:</strong> ${datos.desarrollador || 'Roberto Rivera Gamas'}</p>
            <p><strong>RFC:</strong> ${datos.rfc || 'RIGR840827PJ0'}</p>
            ${datos.valoracion ? `<p><strong>Valoración:</strong> $${datos.valoracion.toLocaleString()} USD</p>` : ''}
            ${datos.tier ? `<p><strong>Tier:</strong> ${datos.tier}</p>` : ''}
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
        </div>

        <p style="text-align: center; margin: 30px 0;">
            Tu certificado está adjunto en formato PDF.
        </p>

        <div class="footer">
            <p>🔱 THRONE PROTOCOL V3.0</p>
            <p>Certificación RSA-4096 Enterprise</p>
            <p>Motor del Algoritmo Prohibido Re-Manifestado</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    /**
     * Enviar múltiples certificados
     */
    async enviarMultiplesCertificados(destinatario, certificados) {
        const resultados = [];
        
        for (const cert of certificados) {
            const resultado = await this.enviarCertificado(
                destinatario,
                cert.ruta,
                cert.datos
            );
            resultados.push(resultado);
            
            // Esperar 1 segundo entre envíos para evitar rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return resultados;
    }
}

module.exports = EmailCertificadoService;
