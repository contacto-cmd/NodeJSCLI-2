const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * 🔐 SERVICIO DE CRIPTOGRAFÍA REAL
 * Maneja firmas digitales RSA-4096 y EC P-256
 */

class CryptoService {
    constructor(rsaPrivateKey, ecPrivateKey = null) {
        this.rsaPrivateKey = rsaPrivateKey;
        this.ecPrivateKey = ecPrivateKey;
    }

    /**
     * Genera hash SHA-256 de datos
     */
    generarHash(datos) {
        const contenido = typeof datos === 'string' ? datos : JSON.stringify(datos);
        return crypto.createHash('sha256').update(contenido).digest('hex');
    }

    /**
     * Firma datos con RSA-4096
     */
    firmarRSA(datos) {
        if (!this.rsaPrivateKey) {
            throw new Error('Clave RSA privada no disponible');
        }

        const hash = this.generarHash(datos);
        const sign = crypto.createSign('SHA256');
        sign.update(hash);
        sign.end();
        
        const firma = sign.sign(this.rsaPrivateKey, 'base64');
        return {
            hash,
            firma,
            algoritmo: 'RS256',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Verifica firma RSA-4096
     */
    verificarFirmaRSA(datos, firma, clavePublica) {
        try {
            const hash = this.generarHash(datos);
            const verify = crypto.createVerify('SHA256');
            verify.update(hash);
            verify.end();
            
            const resultado = verify.verify(clavePublica, firma, 'base64');
            return {
                valido: resultado,
                hash,
                algoritmo: 'RS256',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                valido: false,
                error: error.message
            };
        }
    }

    /**
     * Genera JWT firmado con RSA-4096
     */
    generarJWT(payload, expiresIn = '365d') {
        if (!this.rsaPrivateKey) {
            throw new Error('Clave RSA privada no disponible');
        }

        const token = jwt.sign(payload, this.rsaPrivateKey, {
            algorithm: 'RS256',
            expiresIn
        });

        return token;
    }

    /**
     * Verifica JWT con clave pública
     */
    verificarJWT(token, clavePublica) {
        try {
            const decoded = jwt.verify(token, clavePublica, {
                algorithms: ['RS256']
            });
            return {
                valido: true,
                payload: decoded
            };
        } catch (error) {
            return {
                valido: false,
                error: error.message
            };
        }
    }

    /**
     * Genera certificado firmado digitalmente
     */
    generarCertificadoFirmado(datos) {
        const certificado = {
            id: `CERT-${Date.now()}`,
            propietario: 'Roberto Rivera Gamas',
            rfc: 'RIGR840827PJ0',
            datos,
            fecha_emision: new Date().toISOString(),
            valido_hasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };

        const { hash, firma, algoritmo, timestamp } = this.firmarRSA(certificado);

        return {
            certificado,
            firma_digital: {
                hash,
                firma,
                algoritmo,
                timestamp
            }
        };
    }

    /**
     * Extrae clave pública de clave privada RSA
     */
    extraerClavePublica() {
        if (!this.rsaPrivateKey) {
            throw new Error('Clave RSA privada no disponible');
        }

        const publicKey = crypto.createPublicKey({
            key: this.rsaPrivateKey,
            format: 'pem'
        });

        return publicKey.export({
            type: 'spki',
            format: 'pem'
        });
    }

    /**
     * Genera fingerprint SHA-256 de clave pública
     */
    generarFingerprint(clavePublica) {
        const derKey = crypto.createPublicKey({
            key: clavePublica,
            format: 'pem'
        }).export({
            type: 'spki',
            format: 'der'
        });

        return crypto.createHash('sha256').update(derKey).digest('hex');
    }
}

module.exports = CryptoService;
