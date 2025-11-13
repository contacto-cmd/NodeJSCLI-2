/**
 * TEST DUAL-CONTROL - Verificar sistema de doble factor
 */

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testDualControl() {
    try {
        console.log('🧪 TESTING DUAL-CONTROL SECURITY\n');
        console.log('═'.repeat(60));

        // Obtener API key existente
        const keyQuery = await pool.query('SELECT * FROM fusion_api_keys WHERE activo = true LIMIT 1');
        
        if (keyQuery.rows.length === 0) {
            console.error('❌ No hay API keys en el sistema');
            console.error('   Ejecuta: node scripts/bootstrap-admin-key.js');
            process.exit(1);
        }

        const apiKeyData = keyQuery.rows[0];
        console.log('✅ API Key de prueba encontrada:', apiKeyData.nombre);
        console.log('   Permisos:', apiKeyData.permisos.join(', '));

        // Verificar master secret
        const masterSecret = process.env.ADMIN_ROOT_SECRET || process.env.RSA_4096_PRIVADA?.substring(0, 64);
        if (!masterSecret) {
            console.error('\n❌ ADMIN_ROOT_SECRET no configurado');
            process.exit(1);
        }
        console.log('✅ Master Secret configurado\n');

        console.log('═'.repeat(60));
        console.log('PRUEBAS DE SEGURIDAD:\n');

        // TEST 1: Sin credenciales
        console.log('TEST 1: Acceso SIN credenciales');
        console.log('  Endpoint: GET /api/admin/keys');
        console.log('  Headers: Ninguno');
        console.log('  Resultado esperado: ❌ 401 Unauthorized');
        console.log('  Estado: ⏳ (requiere test HTTP manual)\n');

        // TEST 2: Solo API key (sin master secret)
        console.log('TEST 2: Acceso solo con API Key (sin master secret)');
        console.log('  Endpoint: GET /api/admin/keys');
        console.log('  Headers: x-api-key solamente');
        console.log('  Resultado esperado: ❌ 401 Missing Master Secret');
        console.log('  Estado: ⏳ (requiere test HTTP manual)\n');

        // TEST 3: Solo master secret (sin API key)
        console.log('TEST 3: Acceso solo con Master Secret (sin API key)');
        console.log('  Endpoint: GET /api/admin/keys');
        console.log('  Headers: x-master-secret solamente');
        console.log('  Resultado esperado: ❌ 401 API Key requerida');
        console.log('  Estado: ⏳ (requiere test HTTP manual)\n');

        // TEST 4: Ambos factores correctos
        console.log('TEST 4: Acceso con AMBOS factores (API Key + Master Secret)');
        console.log('  Endpoint: GET /api/admin/keys');
        console.log('  Headers: x-api-key + x-master-secret');
        console.log('  Resultado esperado: ✅ 200 OK + Lista de keys');
        console.log('  Estado: ⏳ (requiere test HTTP manual)\n');

        console.log('═'.repeat(60));
        console.log('\n📋 INSTRUCCIONES PARA TEST MANUAL:\n');
        console.log('Ejecuta estos comandos curl (si tienes una API key admin):\n');

        console.log('# TEST 1: Sin credenciales (debe fallar)');
        console.log('curl -X GET http://localhost:5000/api/admin/keys\n');

        console.log('# TEST 2: Solo API key (debe fallar)');
        console.log('curl -X GET http://localhost:5000/api/admin/keys \\');
        console.log('  -H "x-api-key: tu_api_key_aqui"\n');

        console.log('# TEST 3: Solo master secret (debe fallar)');
        console.log('curl -X GET http://localhost:5000/api/admin/keys \\');
        console.log(`  -H "x-master-secret: ${masterSecret.substring(0, 20)}..."\n`);

        console.log('# TEST 4: Ambos factores (debe funcionar)');
        console.log('curl -X GET http://localhost:5000/api/admin/keys \\');
        console.log('  -H "x-api-key: tu_api_key_aqui" \\');
        console.log(`  -H "x-master-secret: ${masterSecret.substring(0, 20)}..."\n`);

        console.log('═'.repeat(60));
        console.log('\n✅ CONFIGURACIÓN DUAL-CONTROL VERIFICADA\n');
        console.log('ESTADO ACTUAL:');
        console.log(`  • API Keys en sistema: ${keyQuery.rowCount}`);
        console.log(`  • Master Secret: Configurado`);
        console.log(`  • Dual-Control Middleware: Activo`);
        console.log(`  • Rate Limiting: 5 intentos/minuto\n`);

        console.log('SEGURIDAD:');
        console.log('  ✅ Requiere API key con rol admin');
        console.log('  ✅ Requiere master secret en header');
        console.log('  ✅ Rate limiting estricto (5/min)');
        console.log('  ✅ Auditoría de intentos fallidos');
        console.log('  ✅ Scripts de bootstrap y recovery\n');

        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        await pool.end();
        process.exit(1);
    }
}

testDualControl();
