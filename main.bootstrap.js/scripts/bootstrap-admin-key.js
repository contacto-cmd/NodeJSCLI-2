#!/usr/bin/env node
/**
 * BOOTSTRAP ADMIN KEY - Script de Inicialización
 * 
 * Crea la primera API key con rol 'admin' cuando la tabla está vacía.
 * Se auto-deshabilita después de crear la primera key.
 * 
 * USO:
 *   node scripts/bootstrap-admin-key.js
 * 
 * REQUIERE:
 *   - Variable de entorno ADMIN_ROOT_SECRET o RSA_4096_PRIVADA
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function bootstrapAdminKey() {
    try {
        console.log('🔧 BOOTSTRAP: Inicializando primera API Key admin\n');

        // Verificar que existe el master secret
        const masterSecret = process.env.ADMIN_ROOT_SECRET || process.env.RSA_4096_PRIVADA?.substring(0, 64);
        if (!masterSecret) {
            console.error('❌ ERROR: ADMIN_ROOT_SECRET o RSA_4096_PRIVADA no configurados');
            console.error('   Configura uno de estos secrets en Replit antes de ejecutar bootstrap');
            process.exit(1);
        }

        // Verificar si ya existen API keys
        const existingKeys = await pool.query('SELECT COUNT(*) as total FROM fusion_api_keys');
        const totalKeys = parseInt(existingKeys.rows[0].total);

        if (totalKeys > 0) {
            console.log(`⚠️  Ya existen ${totalKeys} API key(s) en el sistema`);
            console.log('   Bootstrap solo funciona cuando la tabla está vacía');
            console.log('   Si necesitas regenerar, usa el script de recovery\n');
            await pool.end();
            process.exit(0);
        }

        console.log('✅ Tabla vacía - Procediendo a crear primera API key admin\n');

        // Generar API key con formato fus_admin_xxx
        const randomBytes = crypto.randomBytes(32).toString('hex');
        const apiKey = `fus_admin_${randomBytes}`;
        const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

        // Datos del admin
        const nombre = 'Roberto Admin Master Key';
        const propietario = 'Roberto Rivera Gamas';
        const email = 'roberto@throneprotocol.com';
        const permisos = ['admin', 'issue', 'verify', 'read'];
        const rateLimit = 100;
        const fechaExpiracion = new Date();
        fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 10);

        // Insertar en base de datos
        const result = await pool.query(`
            INSERT INTO fusion_api_keys 
            (nombre, key_hash, propietario, email, permisos, rate_limit, activo, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, nombre, propietario, permisos
        `, [
            nombre,
            hashedKey,
            propietario,
            email,
            JSON.stringify(permisos),
            rateLimit,
            true,
            fechaExpiracion
        ]);

        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ API KEY ADMIN CREADA EXITOSAMENTE\n');
        console.log('📋 DETALLES:');
        console.log(`   ID:          ${result.rows[0].id}`);
        console.log(`   Nombre:      ${result.rows[0].nombre}`);
        console.log(`   Propietario: ${result.rows[0].propietario}`);
        console.log(`   Permisos:    ${result.rows[0].permisos.join(', ')}`);
        console.log(`   Rate Limit:  ${rateLimit} requests/hora`);
        console.log(`   Expira:      ${fechaExpiracion.toISOString().split('T')[0]} (10 años)\n`);
        console.log('🔑 TU API KEY (GUÁRDALA EN LUGAR SEGURO):');
        console.log(`   ${apiKey}\n`);
        console.log('⚠️  IMPORTANTE:');
        console.log('   - Esta es la ÚNICA vez que verás esta API key');
        console.log('   - Guárdala en un gestor de contraseñas');
        console.log('   - Necesitas esta key + master secret para operaciones admin');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Guardar en archivo temporal (solo para desarrollo)
        const fs = require('fs');
        const outputPath = '/tmp/admin-api-key.txt';
        fs.writeFileSync(outputPath, `API Key: ${apiKey}\nCreated: ${new Date().toISOString()}\n`);
        console.log(`📄 API key también guardada en: ${outputPath}\n`);

        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error(error.stack);
        await pool.end();
        process.exit(1);
    }
}

bootstrapAdminKey();
