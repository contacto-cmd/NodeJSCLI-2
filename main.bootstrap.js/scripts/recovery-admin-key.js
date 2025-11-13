#!/usr/bin/env node
/**
 * RECOVERY ADMIN KEY - Script de Recuperación de Emergencia
 * 
 * Regenera acceso admin cuando todas las API keys se perdieron.
 * Requiere el ADMIN_ROOT_SECRET para autorizarse.
 * 
 * USO:
 *   ADMIN_ROOT_SECRET=tu_secret node scripts/recovery-admin-key.js
 * 
 * CASOS DE USO:
 *   - Todas las API keys fueron eliminadas por error
 *   - Se perdió la única API key admin
 *   - Necesitas regenerar acceso de emergencia
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const readline = require('readline');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function recoveryAdminKey() {
    try {
        console.log('🚨 RECOVERY MODE: Regeneración de API Key Admin\n');

        // Verificar master secret
        const masterSecret = process.env.ADMIN_ROOT_SECRET || process.env.RSA_4096_PRIVADA?.substring(0, 64);
        if (!masterSecret) {
            console.error('❌ ERROR: ADMIN_ROOT_SECRET o RSA_4096_PRIVADA no configurados');
            console.error('   Este script requiere el master secret para autorizarse\n');
            rl.close();
            await pool.end();
            process.exit(1);
        }

        // Verificar estado actual
        const activeAdminKeys = await pool.query(`
            SELECT COUNT(*) as total 
            FROM fusion_api_keys 
            WHERE activo = true 
            AND permisos @> '"admin"'
        `);

        const totalAdminKeys = parseInt(activeAdminKeys.rows[0].total);

        console.log('📊 ESTADO ACTUAL DEL SISTEMA:');
        console.log(`   API Keys admin activas: ${totalAdminKeys}\n`);

        if (totalAdminKeys > 0) {
            console.log('⚠️  ADVERTENCIA: Ya existen API keys admin activas');
            const confirm = await question('¿Deseas crear una API key admin adicional? (si/no): ');
            
            if (confirm.toLowerCase() !== 'si' && confirm.toLowerCase() !== 'sí') {
                console.log('\n✅ Operación cancelada');
                rl.close();
                await pool.end();
                process.exit(0);
            }
        }

        console.log('\n🔐 VERIFICACIÓN DE SEGURIDAD:');
        const secretInput = await question('Ingresa los primeros 20 caracteres del ADMIN_ROOT_SECRET: ');
        
        if (secretInput !== masterSecret.substring(0, 20)) {
            console.error('\n❌ ERROR: Master secret incorrecto');
            console.error('   Acceso denegado por razones de seguridad\n');
            rl.close();
            await pool.end();
            process.exit(1);
        }

        console.log('✅ Master secret verificado\n');

        // Generar nueva API key
        const randomBytes = crypto.randomBytes(32).toString('hex');
        const apiKey = `fus_recovery_${randomBytes}`;
        const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

        const nombre = `Recovery Admin Key ${new Date().toISOString().split('T')[0]}`;
        const propietario = 'Roberto Rivera Gamas';
        const email = 'roberto@throneprotocol.com';
        const permisos = ['admin', 'issue', 'verify', 'read'];
        const rateLimit = 100;
        const fechaExpiracion = new Date();
        fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 1); // 1 año

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
        console.log('✅ API KEY ADMIN DE RECUPERACIÓN CREADA\n');
        console.log('📋 DETALLES:');
        console.log(`   ID:          ${result.rows[0].id}`);
        console.log(`   Nombre:      ${result.rows[0].nombre}`);
        console.log(`   Propietario: ${result.rows[0].propietario}`);
        console.log(`   Permisos:    ${result.rows[0].permisos.join(', ')}`);
        console.log(`   Rate Limit:  ${rateLimit} requests/hora`);
        console.log(`   Expira:      ${fechaExpiracion.toISOString().split('T')[0]} (1 año)\n`);
        console.log('🔑 TU NUEVA API KEY (GUÁRDALA AHORA):');
        console.log(`   ${apiKey}\n`);
        console.log('⚠️  ACCIONES RECOMENDADAS:');
        console.log('   1. Guarda esta API key en un lugar seguro');
        console.log('   2. Considera crear keys adicionales para backup');
        console.log('   3. Revoca las API keys comprometidas si las encuentras');
        console.log('   4. Esta key expira en 1 año - renuévala antes');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Guardar en archivo
        const fs = require('fs');
        const outputPath = `/tmp/recovery-admin-key-${Date.now()}.txt`;
        fs.writeFileSync(outputPath, `Recovery API Key: ${apiKey}\nCreated: ${new Date().toISOString()}\nExpires: ${fechaExpiracion.toISOString()}\n`);
        console.log(`📄 API key guardada en: ${outputPath}\n`);

        rl.close();
        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error(error.stack);
        rl.close();
        await pool.end();
        process.exit(1);
    }
}

recoveryAdminKey();
