const { Pool } = require('pg');

class DatabaseService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }

    async guardarTransaccion(tipo, datos, firmaRSA, firmaEC, hash) {
        const query = `
            INSERT INTO transacciones (tipo, datos, firma_rsa, firma_ec, hash_sha256, verificado, propietario, rfc)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const values = [
            tipo,
            JSON.stringify(datos),
            firmaRSA,
            firmaEC || null,
            hash,
            true,
            'Roberto Rivera Gamas',
            'RIGR840827PJ0'
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async guardarCertificado(numeroCertificado, tipo, propietario, email, firmaDigital, hashDocumento, metadata) {
        const query = `
            INSERT INTO certificados (numero_certificado, tipo, propietario, email, firma_digital, hash_documento, valido_hasta, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const validoHasta = new Date();
        validoHasta.setFullYear(validoHasta.getFullYear() + 1);

        const values = [
            numeroCertificado,
            tipo,
            propietario,
            email,
            firmaDigital,
            hashDocumento,
            validoHasta,
            JSON.stringify(metadata)
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async guardarVerificacion(documentoHash, firma, algoritmo, resultado, ipOrigen) {
        const query = `
            INSERT INTO verificaciones (documento_hash, firma, algoritmo, resultado, ip_origen)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const values = [documentoHash, firma, algoritmo, resultado, ipOrigen || null];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async obtenerCertificado(numeroCertificado) {
        const query = 'SELECT * FROM certificados WHERE numero_certificado = $1 AND revocado = false';
        const result = await this.pool.query(query, [numeroCertificado]);
        return result.rows[0];
    }

    async listarCertificados(limite = 100) {
        const query = 'SELECT * FROM certificados WHERE revocado = false ORDER BY fecha_emision DESC LIMIT $1';
        const result = await this.pool.query(query, [limite]);
        return result.rows;
    }

    async cerrar() {
        await this.pool.end();
    }
}

module.exports = DatabaseService;
